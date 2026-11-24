import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { ObjectId } from "mongodb";
import { connectDatabase } from "../src/db.js";
import { createApp } from "../src/app.js";
import { digest, hashPassword } from "../src/auth.js";

let client, db, app, alice, bob, aliceTab, bobTab, eventId, taskId;
const password = "Only-for-isolated-tests-42";
before(async () => {
  ({ client, db } = await connectDatabase(
    process.env.MONGO_TEST_URI || "mongodb://127.0.0.1:27018",
    `cstda_test_${randomUUID().replaceAll("-", "")}`,
  ));
  const password_hash = await hashPassword(password);
  const aliceId = new ObjectId(),
    bobId = new ObjectId();
  aliceTab = new ObjectId();
  bobTab = new ObjectId();
  await db.collection("users").insertMany([
    { _id: aliceId, username: "alice", password_hash },
    { _id: bobId, username: "bob", password_hash },
  ]);
  await db.collection("tabs").insertMany([
    {
      _id: aliceTab,
      user_id: aliceId,
      name: "General",
      name_key: "general",
      default_color: "#245a48",
    },
    {
      _id: bobTab,
      user_id: bobId,
      name: "General",
      name_key: "general",
      default_color: "#3966b5",
    },
  ]);
  app = await createApp(db);
  alice = request.agent(app);
  bob = request.agent(app);
  await alice
    .post("/api/auth/login")
    .send({ username: "alice", password })
    .expect(200);
  await bob
    .post("/api/auth/login")
    .send({ username: "bob", password })
    .expect(200);
});
after(async () => {
  if (db) await db.dropDatabase();
  if (client) await client.close();
});

test("NFR-06: protected data requires login; rejected credentials and malformed inputs grant no access", async () => {
  for (const path of ["/tabs", "/events", "/tasks"])
    await request(app).get(`/api${path}`).expect(401);
  await request(app)
    .post("/api/auth/login")
    .send({ username: "alice", password: "wrong" })
    .expect(401);
  await request(app)
    .post("/api/auth/login")
    .send({ username: { $ne: null }, password })
    .expect(400);
  await request(app).post("/api/auth/login").expect(400);
  const response = await alice.get("/api/auth/me").expect(200);
  assert.deepEqual(response.body, { user: { username: "alice" } });
});

test("US-04: create unique tabs; All is not a stored tab; accounts are isolated", async () => {
  const res = await alice
    .post("/api/tabs")
    .send({ name: "Academic", default_color: "#3966b5" })
    .expect(201);
  assert.equal(res.body.tab.name, "Academic");
  await alice.post("/api/tabs").send({ name: " academic " }).expect(409);
  await alice.post("/api/tabs").send({ name: "  " }).expect(400);
  const { body } = await bob.get("/api/tabs").expect(200);
  assert.equal(body.tabs.length, 1);
  assert.equal(body.tabs[0]._id, String(bobTab));
});

test("US-01/05: create, query by date/tab, edit and move an event without changing its ID", async () => {
  const input = {
    title: "Study session",
    date: "2026-12-01",
    start_time: "13:00",
    tab_id: String(aliceTab),
  };
  const created = await alice.post("/api/events").send(input).expect(201);
  eventId = created.body.event._id;
  const empty = await alice
    .get("/api/events?from=2026-12-02&to=2026-12-02")
    .expect(200);
  assert.equal(empty.body.events.length, 0);
  const { body } = await alice
    .get("/api/events?from=2026-12-01&to=2026-12-01")
    .expect(200);
  assert.equal(body.events[0].title, input.title);
  const academic = (await alice.get("/api/tabs")).body.tabs.find(
    (tab) => tab.name === "Academic",
  );
  const moved = await alice
    .put(`/api/events/${eventId}`)
    .send({
      ...input,
      title: "Updated study session",
      tab_id: academic._id,
      end_time: "14:00",
    })
    .expect(200);
  assert.equal(moved.body.event._id, eventId);
  assert.equal(
    (await alice.get(`/api/events?tab_id=${aliceTab}`)).body.events.length,
    0,
  );
  assert.equal(
    (await alice.get(`/api/events?tab_id=${academic._id}`)).body.events[0]._id,
    eventId,
  );
  assert.equal((await alice.get("/api/events")).body.events.length, 1);
});

test("US-02: color inheritance, explicit override, clearing override, and unrelated tab isolation", async () => {
  let event = (await alice.get("/api/events")).body.events[0];
  const academicId = event.tab_id;
  await alice
    .put(`/api/tabs/${academicId}/color`)
    .send({ default_color: "#8b52a1" })
    .expect(200);
  event = (await alice.get("/api/events")).body.events[0];
  assert.equal(event.effective_color, "#8b52a1");
  await alice
    .put(`/api/events/${eventId}`)
    .send({ ...event, color_override: "#bf5c38" })
    .expect(200);
  await alice
    .put(`/api/tabs/${academicId}/color`)
    .send({ default_color: "#a67518" })
    .expect(200);
  event = (await alice.get("/api/events")).body.events[0];
  assert.equal(event.effective_color, "#bf5c38");
  await alice
    .put(`/api/events/${eventId}`)
    .send({ ...event, color_override: null })
    .expect(200);
  assert.equal(
    (await alice.get("/api/events")).body.events[0].effective_color,
    "#a67518",
  );
  assert.equal(
    (await alice.get("/api/tabs")).body.tabs.find(
      (tab) => tab._id === String(aliceTab),
    ).default_color,
    "#245a48",
  );
  assert.equal(
    (await bob.get("/api/tabs")).body.tabs[0].default_color,
    "#3966b5",
  );
});

test("invalid event edits and cross-account mutations leave saved records unchanged", async () => {
  const before = await db
    .collection("events")
    .findOne({ _id: new ObjectId(eventId) });
  const body = { ...before, tab_id: String(before.tab_id) };
  for (const invalid of [
    { title: " " },
    { date: "2026-02-30" },
    { start_time: "25:00" },
    { end_time: "12:00" },
    { color_override: "red" },
  ]) {
    await alice
      .put(`/api/events/${eventId}`)
      .send({ ...body, ...invalid })
      .expect(400);
  }
  await alice
    .put(`/api/events/${eventId}`)
    .send({ ...body, tab_id: String(bobTab) })
    .expect(404);
  await bob
    .put(`/api/events/${eventId}`)
    .send({ ...body, tab_id: String(bobTab) })
    .expect(404);
  await bob.delete(`/api/events/${eventId}`).expect(404);
  await bob.get(`/api/events?tab_id=${aliceTab}`).expect(404);
  await bob
    .put(`/api/tabs/${aliceTab}/color`)
    .send({ default_color: "#b94670" })
    .expect(404);
  assert.deepEqual(
    await db.collection("events").findOne({ _id: new ObjectId(eventId) }),
    before,
  );
  assert.equal((await bob.get("/api/events")).body.events.length, 0);
});

test("US-03/06: tasks support independent priorities, editing, completion, and user ownership", async () => {
  const a = await alice
    .post("/api/tasks")
    .send({ title: "Prepare demo" })
    .expect(201);
  taskId = a.body.task._id;
  assert.equal(a.body.task.priority, "Medium");
  assert.equal(a.body.task.is_completed, false);
  const b = await alice
    .post("/api/tasks")
    .send({ title: "Read notes", priority: "Low" })
    .expect(201);
  await alice
    .put(`/api/tasks/${taskId}`)
    .send({ title: "Record demo", priority: "High", is_completed: true })
    .expect(200);
  const list = (await alice.get("/api/tasks")).body.tasks;
  assert.equal(list.find((task) => task._id === taskId).is_completed, true);
  assert.equal(
    list.find((task) => task._id === b.body.task._id).priority,
    "Low",
  );
  assert.equal(
    list.find((task) => task._id === b.body.task._id).is_completed,
    false,
  );
  await bob
    .put(`/api/tasks/${taskId}`)
    .send({ title: "Stolen", priority: "High" })
    .expect(404);
  await bob.delete(`/api/tasks/${taskId}`).expect(404);
  await alice
    .put(`/api/tasks/${taskId}`)
    .send({ title: "Record demo", priority: "Urgent" })
    .expect(400);
  await alice
    .put(`/api/tasks/${taskId}`)
    .send({ title: "Record demo", is_completed: "false" })
    .expect(400);
  await alice.post("/api/tasks").send({ title: " " }).expect(400);
  assert.equal((await bob.get("/api/tasks")).body.tasks.length, 0);
});

test("NFR-03: ten events and ten tasks persist across new app instances and login sessions", async () => {
  for (let i = 0; i < 10; i++) {
    await alice
      .post("/api/events")
      .send({
        title: `Persistence event ${i}`,
        date: "2026-12-03",
        start_time: "10:00",
        tab_id: String(aliceTab),
      })
      .expect(201);
    await alice
      .post("/api/tasks")
      .send({ title: `Persistence task ${i}`, priority: "Low" })
      .expect(201);
  }
  const restarted = request.agent(await createApp(db));
  await restarted
    .post("/api/auth/login")
    .send({ username: "alice", password })
    .expect(200);
  const events = (await restarted.get("/api/events")).body.events;
  const tasks = (await restarted.get("/api/tasks")).body.tasks;
  assert.equal(
    events.filter((row) => row.title.startsWith("Persistence event")).length,
    10,
  );
  assert.equal(
    tasks.filter((row) => row.title.startsWith("Persistence task")).length,
    10,
  );
});

test("failed database writes do not overwrite a saved event and the API returns a retryable error", async () => {
  const saved = await db
    .collection("events")
    .findOne({ _id: new ObjectId(eventId) });
  const wrapper = {
    collection(name) {
      const collection = db.collection(name);
      if (name === "events")
        collection.findOneAndUpdate = async () => {
          throw new Error("Simulated storage write failure");
        };
      return collection;
    },
  };
  const broken = request.agent(await createApp(wrapper));
  await broken
    .post("/api/auth/login")
    .send({ username: "alice", password })
    .expect(200);
  await broken
    .put(`/api/events/${eventId}`)
    .send({ ...saved, tab_id: String(saved.tab_id), title: "Must not persist" })
    .expect(500);
  assert.deepEqual(
    await db.collection("events").findOne({ _id: new ObjectId(eventId) }),
    saved,
  );
});

test("US-05/06: delete only the selected records", async () => {
  const eventCount = await db.collection("events").countDocuments();
  const taskCount = await db.collection("tasks").countDocuments();
  await alice.delete(`/api/events/${eventId}`).expect(204);
  await alice.delete(`/api/tasks/${taskId}`).expect(204);
  assert.equal(await db.collection("events").countDocuments(), eventCount - 1);
  assert.equal(await db.collection("tasks").countDocuments(), taskCount - 1);
  await alice.delete("/api/events/not-an-id").expect(400);
});

test("NFR-06: sessions use HttpOnly cookies, expire, and are invalidated by logout", async () => {
  const agent = request.agent(app);
  const login = await agent
    .post("/api/auth/login")
    .send({ username: "alice", password })
    .expect(200);
  const cookie = login.headers["set-cookie"][0];
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  await agent.post("/api/auth/logout").expect(200);
  await agent.get("/api/tasks").expect(401);
  await request(app)
    .get("/api/tasks")
    .set("Cookie", cookie.split(";")[0])
    .expect(401);
  const expiring = await request(app)
    .post("/api/auth/login")
    .send({ username: "alice", password })
    .expect(200);
  const token = expiring.headers["set-cookie"][0].split(";")[0].slice(14);
  await db
    .collection("sessions")
    .updateOne({ _id: digest(token) }, { $set: { expires_at: new Date(0) } });
  await request(app)
    .get("/api/tasks")
    .set("Cookie", `cstda_session=${token}`)
    .expect(401);
});
