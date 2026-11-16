# Spike 01: AgentPrism as the worker runtime

**Goal:** check whether [AgentPrism Workflows](https://github.com/agentprism/agentprism-workflows) can serve as the
MCP-to-ACP worker layer from [RFC #1](https://github.com/yesvus/agent-workers/issues/1) without writing new framework code.

**Scope:** one Coder workspace, a throwaway test repository, a single harness first (Codex or Claude Code).
Do not open upstream issues/PRs until this spike has results.

## Key observation: persistent worktrees may need no upstream change

AgentPrism's `isolation: "worktree"` discards edits. But `agent()` also accepts a `cwd` option.
If the steward (or a tiny shell step) creates the worktree first, the agent can work inside it and the
branch stays:

```bash
git -C /abs/repo worktree add -b agent/t001 /abs/worktrees/t001
```

```js
export const meta = { name: "t001", description: "small task", model: "codex" };
return await agent("Fix the typo in README.md, then run the tests.", { cwd: "/abs/worktrees/t001" });
```

Afterwards: `git -C /abs/worktrees/t001 diff`, review, then keep or remove (`git worktree remove`).
If this works, an upstream `keep: true` mode becomes a convenience, not a blocker.

## Step 1: install and first run (gate 1)

- [ ] Node.js >= 22 is available in the workspace.
- [ ] The harness is authenticated in the workspace (`codex login` or `claude /login`).
- [ ] The MCP entry is registered in the steward (Claude Code / Codex / OpenCode):
      `{"command": "npx", "args": ["-y", "@automatalabs/workflows", "mcp"]}`
- [ ] Explore with `{"action": "config"}`: what models/modes are reported?
- [ ] Run a read-only one-line workflow (`agent('Summarize the repo')`); record time to first result.

## Step 2: persistent worktree via `cwd` (core assumption)

- [ ] Create a worktree as above, run a small edit task with `cwd`, and inspect the diff.
- [ ] Check whether the agent writes **only** inside that worktree (`git status` in the main checkout stays clean).
- [ ] Check whether permission requests come back as live waits (`permissions-response`), not auto-approved.

## Step 3: disconnect and cancel (gate 4)

- [ ] Start a longer task, close the steward session, reopen it, and query the `runId` with `status`.
- [ ] Cancel a run with `stop`; confirm no leftover harness/ACP processes (`ps`).

## Step 4: 20 serial tasks (gate 3)

- [ ] Run 20 small tasks, each with its own worktree.
- [ ] Record per task: duration, RSS of the pooled harness process, process count, and leakage from the previous task.
- [ ] Compare harness startup time with dependency-install time per worktree. Which one dominates?

## Step 5: other harnesses (gate 2)

- [ ] Run the same task with the second and third harness (Claude Code, Codex, OpenCode). Record caveats.

## Decision

| Result | Next step |
|---|---|
| Steps 1–3 work | ADOPT AgentPrism; persistent worktrees through `cwd` + a small wrapper script. |
| Works, but `cwd` / cleanup is clunky | UPSTREAM: propose the `keep: true` worktree mode. |
| Core issues (leakage, cancel, stability) | Reassess the RFC with the numbers. |

## Notes

<!-- Write measurements and observations here. -->
