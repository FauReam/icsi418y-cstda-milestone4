import { spawnSync } from "node:child_process";
const name = "cstda-m4-mongo";
function docker(args, capture = false) {
  const result = spawnSync("docker", args, {
    encoding: "utf8",
    stdio: capture ? "pipe" : "inherit",
  });
  if (result.error) throw result.error;
  return result;
}
const check = docker(["inspect", name], true);
let container;
if (check.status === 0) {
  container = JSON.parse(check.stdout)[0];
  if (container.Config.Labels?.["com.cstda.project"] !== "milestone4")
    throw new Error(
      `Container ${name} already exists and is not managed by this project. Choose a different container name in scripts/database.js.`,
    );
}
const action = process.argv[2];
let result;
if (action === "up") {
  result = container
    ? docker(["start", name])
    : docker([
        "run",
        "-d",
        "--name",
        name,
        "--label",
        "com.cstda.project=milestone4",
        "-p",
        "127.0.0.1:27018:27017",
        "-v",
        "cstda-m4-data:/data/db",
        "mongo:8.0",
      ]);
  if (result.status === 0)
    console.log(
      "MongoDB at 127.0.0.1:27018. Data is retained in volume cstda-m4-data.",
    );
} else if (action === "down") {
  if (!container) {
    console.log("No project database container exists.");
    process.exit(0);
  }
  result = docker(["stop", name]);
} else throw new Error("Use up or down.");
process.exitCode = result.status ?? 1;
