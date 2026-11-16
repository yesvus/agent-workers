#!/usr/bin/env node
// bin/task.mjs - run one agent task in a persistent git worktree via AgentPrism ACP.
//
// Usage:
//   node bin/task.mjs <repo> <task-id> "<task text>" [model]
//       Create worktree ~/worktrees/<task-id> on branch agent/<task-id>, run the task there,
//       then print the result, elapsed time, and the worktree's status and diff.
//   node bin/task.mjs --drop <repo> <task-id>
//       Remove the worktree and delete branch agent/<task-id>.
//
// Model defaults to env TASK_MODEL, then "codex".

import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { createAcpRunner } from "@automatalabs/workflows";

const USAGE = `usage:
  node bin/task.mjs <repo> <task-id> "<task text>" [model]
  node bin/task.mjs --drop <repo> <task-id>`;

const ID_RE = /^[A-Za-z0-9._-]+$/;

function fail(msg) {
  console.error(msg);
  console.error(USAGE);
  process.exit(2);
}

function git(args, opts = {}) {
  return execFileSync("git", args, { encoding: "utf8", ...opts });
}

const argv = process.argv.slice(2);

if (argv[0] === "--drop") {
  const [, repo, id] = argv;
  if (!repo || !id) fail("missing args for --drop");
  if (!ID_RE.test(id)) fail(`invalid task-id: ${id}`);
  const wtPath = join(homedir(), "worktrees", id);
  git(["-C", repo, "worktree", "remove", "--force", wtPath], { stdio: "inherit" });
  git(["-C", repo, "branch", "-D", `agent/${id}`], { stdio: "inherit" });
  console.log(`dropped ${wtPath} and branch agent/${id}`);
  process.exit(0);
}

const [repo, id, text, modelArg] = argv;
if (!repo || !id || text === undefined) fail("missing args");
if (!ID_RE.test(id)) fail(`invalid task-id: ${id}`);

const model = modelArg || process.env.TASK_MODEL || "codex";
const wtPath = join(homedir(), "worktrees", id);

git(["-C", repo, "worktree", "add", "-b", `agent/${id}`, wtPath], { stdio: "inherit" });

const started = Date.now();
const runner = createAcpRunner();
let out;
try {
  out = await runner.run(text, { model, cwd: wtPath });
} finally {
  await runner.dispose();
}
const elapsed = ((Date.now() - started) / 1000).toFixed(1);

console.log("--- result ---");
console.log(typeof out === "string" ? out : JSON.stringify(out, null, 2));
console.log(`--- elapsed: ${elapsed}s ---`);

console.log("--- git status ---");
console.log(git(["-C", wtPath, "status", "--short"]));
console.log("--- git diff ---");
console.log(git(["-C", wtPath, "diff"]));

console.log("--- next ---");
console.log(`merge: git -C ${repo} merge agent/${id}`);
console.log(`drop:  node bin/task.mjs --drop ${repo} ${id}`);
