# Agent Workers

**Status: design exploration — not an implementation commitment.**

Research into a small, open-source, reusable execution layer for coding agents:

- An arbitrary **steward/operator** (ChatGPT, Claude Code, Codex, or another MCP client) can delegate a task and inspect its progress through **MCP**.
- The execution layer speaks **ACP** to replaceable coding harnesses such as OpenCode, Claude Code and Codex.
- Every task works in its own **Git worktree**. Warm harness processes and separate agent sessions should be reused where supported and verified.
- Running in an existing **Coder workspace** is the first environment. Kubernetes/ARC ephemeral jobs are **optional adapters**, not required infrastructure.
- The execution layer does **not** choose which tasks to delegate, plan an entire project, or autonomously merge/deploy PRs.

The hypothesis is that existing projects may already fulfill this: **prefer integrating or contributing upstream rather than inventing a new agent framework**.

Start with [RFC #1](https://github.com/yesvus/agent-workers/issues/1). No worker code should be written until the alternatives and experiments in the RFC have been reviewed.

## Existing projects to assess

- [Coder ACP subagents](https://coder.com/docs/v2.39/ai-coder/agents/acp-subagents/)
- [AgentPrism Workflows](https://github.com/agentprism/agentprism-workflows)
- [Agent Herder](https://github.com/megamen32/agent-herder)
- [agent-orchestrator-mcp](https://github.com/Bariscanates404/agent-orchestrator-mcp)
- [AG2 ACP client](https://docs.ag2.ai/docs/user-guide/acp/client/)

