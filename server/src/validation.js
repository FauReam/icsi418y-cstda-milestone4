import { ObjectId } from "mongodb";
export const PALETTE = [
  "#245a48",
  "#3966b5",
  "#8b52a1",
  "#bf5c38",
  "#a67518",
  "#b94670",
];
export const PRIORITIES = ["High", "Medium", "Low"];
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function id(value) {
  if (typeof value !== "string" || !/^[0-9a-f]{24}$/i.test(value))
    throw new HttpError(400, "Invalid record ID.");
  return new ObjectId(value);
}
export function title(value, label = "Title") {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 120)
    throw new HttpError(400, `${label} must contain 1–120 characters.`);
  return value.trim();
}
export function color(value, optional = false) {
  if (optional && (value === null || value === "")) return null;
  if (!PALETTE.includes(value))
    throw new HttpError(400, "Choose a supported color.");
  return value;
}
export function validDate(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value < "1900-01-01" ||
    value > "2100-12-31"
  )
    return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return (
    !Number.isNaN(parsed.valueOf()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}
export function eventInput(body) {
  const data = {
    title: title(body.title),
    date: body.date,
    start_time: body.start_time,
    end_time: body.end_time || null,
    tab_id: id(body.tab_id),
    color_override: color(body.color_override ?? null, true),
  };
  const time = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!validDate(data.date))
    throw new HttpError(400, "Enter a valid date between 1900 and 2100.");
  if (!time.test(data.start_time || ""))
    throw new HttpError(400, "Enter a valid start time.");
  if (
    data.end_time &&
    (!time.test(data.end_time) || data.end_time <= data.start_time)
  )
    throw new HttpError(
      400,
      "End time must be later than start time on the same date.",
    );
  return data;
}
export function taskInput(body) {
  const data = {
    title: title(body.title),
    priority: body.priority ?? "Medium",
    is_completed: body.is_completed ?? false,
  };
  if (!PRIORITIES.includes(data.priority))
    throw new HttpError(400, "Priority must be High, Medium, or Low.");
  if (typeof data.is_completed !== "boolean")
    throw new HttpError(400, "Completion must be true or false.");
  return data;
}
