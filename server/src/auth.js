import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCallback);
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${key.toString("hex")}`;
}
export async function verifyPassword(password, encoded) {
  const [, salt, hash] = encoded.split(":");
  if (!salt || !hash) return false;
  const saved = Buffer.from(hash, "hex");
  const key = await scrypt(password, salt, 64);
  return saved.length === key.length && timingSafeEqual(saved, key);
}
export const newToken = () => randomBytes(32).toString("hex");
export const digest = (value) =>
  createHash("sha256").update(value).digest("hex");
export function readSession(req) {
  return req.headers.cookie
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("cstda_session="))
    ?.slice(14);
}
