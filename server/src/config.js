import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
dotenv.config({
  path: fileURLToPath(new URL("../../.env", import.meta.url)),
  quiet: true,
});
export const config = {
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27018",
  database: process.env.MONGO_DB || "cstda",
  port: Number(process.env.PORT || 9000),
  host: process.env.HOST || "127.0.0.1",
  secure: process.env.COOKIE_SECURE === "true",
};
