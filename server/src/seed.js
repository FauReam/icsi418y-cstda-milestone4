import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { config } from "./config.js";
import { connectDatabase } from "./db.js";
import { hashPassword } from "./auth.js";
import { PALETTE, title } from "./validation.js";
const username = title(
  process.env.SEED_USERNAME || "student",
  "Username",
).toLowerCase();
const password =
  process.env.SEED_PASSWORD || randomBytes(15).toString("base64url");
if (password.length < 12 || password.length > 256)
  throw new Error("SEED_PASSWORD must contain 12–256 characters.");
const { client, db } = await connectDatabase(config.mongoUri, config.database);
try {
  const existing = await db.collection("users").findOne({ username });
  const userId = existing?._id || new ObjectId();
  // Provision General before making a new account available for login. Re-running repairs setup.
  const general = await db
    .collection("tabs")
    .findOneAndUpdate(
      { user_id: userId, name_key: "general" },
      {
        $setOnInsert: {
          name: "General",
          default_color: PALETTE[0],
          created_at: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" },
    );
  if (!existing) {
    await db
      .collection("users")
      .insertOne({
        _id: userId,
        username,
        password_hash: await hashPassword(password),
      });
    console.log(
      `Created account: ${username}\nPassword (save locally): ${password}`,
    );
  } else
    console.log(
      `Account ${username} already exists; password and saved records preserved.`,
    );
  if (process.argv.includes("--demo")) {
    const study = await db
      .collection("tabs")
      .findOneAndUpdate(
        { user_id: userId, name_key: "academic" },
        {
          $setOnInsert: {
            name: "Academic",
            default_color: PALETTE[1],
            created_at: new Date(),
          },
        },
        { upsert: true, returnDocument: "after" },
      );
    const today = new Date();
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    await db
      .collection("events")
      .updateOne(
        {
          tab_id: study._id,
          title: "Software engineering study session",
          date,
        },
        {
          $setOnInsert: {
            start_time: "14:00",
            end_time: "15:00",
            color_override: null,
          },
        },
        { upsert: true },
      );
    await db
      .collection("events")
      .updateOne(
        { tab_id: general._id, title: "A little time for yourself", date },
        {
          $setOnInsert: {
            start_time: "17:00",
            end_time: "17:30",
            color_override: null,
          },
        },
        { upsert: true },
      );
    await db
      .collection("tasks")
      .updateOne(
        { user_id: userId, title: "Review the prototype acceptance checklist" },
        { $setOnInsert: { priority: "High", is_completed: false } },
        { upsert: true },
      );
    console.log("Synthetic demo records added.");
  }
} finally {
  await client.close();
}
