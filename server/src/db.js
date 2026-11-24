import { MongoClient } from "mongodb";
export async function connectDatabase(uri, name) {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const db = client.db(name);
  try {
    await Promise.all([
      db.collection("users").createIndex({ username: 1 }, { unique: true }),
      db
        .collection("tabs")
        .createIndex({ user_id: 1, name_key: 1 }, { unique: true }),
      db.collection("events").createIndex({ tab_id: 1, date: 1 }),
      db.collection("tasks").createIndex({ user_id: 1 }),
      db
        .collection("sessions")
        .createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 }),
    ]);
  } catch (error) {
    await client.close();
    throw error;
  }
  return { client, db };
}
