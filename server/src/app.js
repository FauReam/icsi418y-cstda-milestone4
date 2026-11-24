import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import {
  digest,
  hashPassword,
  newToken,
  readSession,
  verifyPassword,
} from "./auth.js";
import {
  HttpError,
  PALETTE,
  color,
  eventInput,
  id,
  taskInput,
  title,
  validDate,
} from "./validation.js";

export async function createApp(db, { secure = false } = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "16kb" }));
  app.use((req, res, next) => {
    req.body ??= {};
    next();
  });
  const users = db.collection("users"),
    tabs = db.collection("tabs"),
    events = db.collection("events"),
    tasks = db.collection("tasks"),
    sessions = db.collection("sessions");
  const cookie = {
    httpOnly: true,
    sameSite: "strict",
    secure,
    path: "/",
    maxAge: 8 * 60 * 60 * 1000,
  };
  const dummyHash = await hashPassword(newToken());
  app.get("/api/health", async (req, res) => {
    await db.command({ ping: 1 });
    res.json({ status: "ok" });
  });
  app.post(
    "/api/auth/login",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 30,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { message: "Too many login attempts. Try again in 15 minutes." },
    }),
    async (req, res) => {
      const username = title(req.body.username, "Username").toLowerCase();
      const password = req.body.password;
      if (typeof password !== "string" || !password || password.length > 256)
        throw new HttpError(400, "Enter a password of at most 256 characters.");
      const user = await users.findOne({ username });
      const correct = await verifyPassword(
        password,
        user?.password_hash || dummyHash,
      );
      if (!user || !correct)
        throw new HttpError(401, "Incorrect username or password.");
      const token = newToken();
      await sessions.insertOne({
        _id: digest(token),
        user_id: user._id,
        expires_at: new Date(Date.now() + cookie.maxAge),
      });
      const previous = readSession(req);
      if (previous) await sessions.deleteOne({ _id: digest(previous) });
      res
        .cookie("cstda_session", token, cookie)
        .json({ user: { username: user.username } });
    },
  );
  app.use("/api", async (req, res, next) => {
    const token = readSession(req);
    const session =
      token &&
      (await sessions.findOne({
        _id: digest(token),
        expires_at: { $gt: new Date() },
      }));
    if (!session || !(await users.findOne({ _id: session.user_id })))
      throw new HttpError(401, "Please log in to continue.");
    req.userId = session.user_id;
    req.sessionId = session._id;
    next();
  });
  app.get("/api/auth/me", async (req, res) => {
    const user = await users.findOne({ _id: req.userId });
    res.json({ user: { username: user.username } });
  });
  app.post("/api/auth/logout", async (req, res) => {
    await sessions.deleteOne({ _id: req.sessionId });
    res
      .clearCookie("cstda_session", { ...cookie, maxAge: undefined })
      .json({ message: "Logged out." });
  });
  app.get("/api/palette", (req, res) => res.json({ colors: PALETTE }));
  app.get("/api/tabs", async (req, res) =>
    res.json({
      tabs: await tabs
        .find({ user_id: req.userId })
        .sort({ created_at: 1, _id: 1 })
        .toArray(),
    }),
  );
  app.post("/api/tabs", async (req, res) => {
    const name = title(req.body.name, "Tab name");
    const data = {
      user_id: req.userId,
      name,
      name_key: name.toLowerCase(),
      default_color: color(req.body.default_color ?? PALETTE[0]),
      created_at: new Date(),
    };
    const result = await tabs.insertOne(data);
    res.status(201).json({ tab: { ...data, _id: result.insertedId } });
  });
  app.put("/api/tabs/:id/color", async (req, res) => {
    const tab = await tabs.findOneAndUpdate(
      { _id: id(req.params.id), user_id: req.userId },
      { $set: { default_color: color(req.body.default_color) } },
      { returnDocument: "after" },
    );
    if (!tab) throw new HttpError(404, "Tab not found.");
    res.json({ tab });
  });
  async function ownedTab(tabId, userId) {
    const tab = await tabs.findOne({ _id: tabId, user_id: userId });
    if (!tab) throw new HttpError(404, "Tab not found.");
    return tab;
  }
  async function ownedEvent(eventId, userId) {
    const event = await events.findOne({ _id: eventId });
    if (!event) throw new HttpError(404, "Event not found.");
    await ownedTab(event.tab_id, userId);
    return event;
  }
  app.get("/api/events", async (req, res) => {
    const ownTabs = await tabs.find({ user_id: req.userId }).toArray();
    const query = { tab_id: { $in: ownTabs.map((t) => t._id) } };
    if (req.query.tab_id) {
      const tabId = id(req.query.tab_id);
      await ownedTab(tabId, req.userId);
      query.tab_id = tabId;
    }
    if (req.query.from || req.query.to) {
      if (
        !validDate(req.query.from) ||
        !validDate(req.query.to) ||
        req.query.from > req.query.to
      )
        throw new HttpError(400, "Enter a valid date range.");
      query.date = { $gte: req.query.from, $lte: req.query.to };
    }
    const rows = await events
      .find(query)
      .sort({ date: 1, start_time: 1, _id: 1 })
      .toArray();
    res.json({
      events: rows.map((event) => ({
        ...event,
        effective_color:
          event.color_override ||
          ownTabs.find((t) => t._id.equals(event.tab_id)).default_color,
      })),
    });
  });
  app.post("/api/events", async (req, res) => {
    const data = eventInput(req.body);
    await ownedTab(data.tab_id, req.userId);
    const result = await events.insertOne(data);
    res.status(201).json({ event: { ...data, _id: result.insertedId } });
  });
  app.put("/api/events/:id", async (req, res) => {
    const eventId = id(req.params.id),
      data = eventInput(req.body);
    await ownedEvent(eventId, req.userId);
    await ownedTab(data.tab_id, req.userId);
    const event = await events.findOneAndUpdate(
      { _id: eventId },
      { $set: data },
      { returnDocument: "after" },
    );
    if (!event) throw new HttpError(404, "Event not found.");
    res.json({ event });
  });
  app.delete("/api/events/:id", async (req, res) => {
    const eventId = id(req.params.id);
    await ownedEvent(eventId, req.userId);
    await events.deleteOne({ _id: eventId });
    res.status(204).end();
  });
  app.get("/api/tasks", async (req, res) =>
    res.json({
      tasks: await tasks
        .find({ user_id: req.userId })
        .sort({ _id: 1 })
        .toArray(),
    }),
  );
  app.post("/api/tasks", async (req, res) => {
    const data = { ...taskInput(req.body), user_id: req.userId };
    const result = await tasks.insertOne(data);
    res.status(201).json({ task: { ...data, _id: result.insertedId } });
  });
  app.put("/api/tasks/:id", async (req, res) => {
    const task = await tasks.findOneAndUpdate(
      { _id: id(req.params.id), user_id: req.userId },
      { $set: taskInput(req.body) },
      { returnDocument: "after" },
    );
    if (!task) throw new HttpError(404, "Task not found.");
    res.json({ task });
  });
  app.delete("/api/tasks/:id", async (req, res) => {
    const result = await tasks.deleteOne({
      _id: id(req.params.id),
      user_id: req.userId,
    });
    if (!result.deletedCount) throw new HttpError(404, "Task not found.");
    res.status(204).end();
  });
  app.use("/api", (req, res) =>
    res.status(404).json({ message: "Endpoint not found." }),
  );
  const dist = fileURLToPath(new URL("../../client/dist", import.meta.url));
  if (existsSync(dist)) {
    app.use(express.static(dist));
    app.get("/", (req, res) => res.sendFile(`${dist}/index.html`));
  }
  app.use((error, req, res, next) => {
    if (error.code === 11000)
      return res
        .status(409)
        .json({ message: "A tab with this name already exists." });
    if (error.status && error.status < 500)
      return res.status(error.status).json({ message: error.message });
    console.error("Request failed:", error.name);
    res
      .status(500)
      .json({
        message:
          "Unable to save or load data. Refresh to check saved records, then retry.",
      });
  });
  return app;
}
