# SumUp MCP server + skill

Payment integration tooling available to Claude Code in this project.

## Setup

Two components are configured:

1. **SumUp MCP server** — project-scoped at `.mcp.json`, runs `@sumup/mcp` via stdio
2. **SumUp skill plugin** — installed via Claude Code marketplace (`sumup@sumup`); provides guidance for terminal and online checkout flows

## `.mcp.json` (project root)

```json
{
  "mcpServers": {
    "sumup": {
      "command": "npx",
      "args": ["-y", "@sumup/mcp"],
      "env": { "SUMUP_API_KEY": "${SUMUP_API_KEY}" }
    }
  }
}
```

The `${SUMUP_API_KEY}` syntax interpolates from the shell env at MCP-subprocess-spawn time — the actual key never lives in the repo.

## API key

Stored in `~/.zshrc`:

```bash
export SUMUP_API_KEY="sup_sk_..."
```

Loaded into every new zsh session. Already-running Claude Code sessions need to be restarted (or rerun from a fresh terminal) before they can see the env var.

## Activation

After setting the env var:

```
/reload-plugins
```

Or fully restart the Claude Code CLI from a fresh terminal.

Once active, SumUp tools become available — checkouts, readers, transactions, OAuth flows.

## Capability scope

The SumUp ecosystem covers two distinct payment surfaces:

- **Terminal / card-present**: physical SumUp reader pairing, transaction processing, receipt printing
- **Online / card-not-present**: SumUp Card Widget, Cloud API checkouts, Affiliate Keys

The MCP server + skill have tools and guidance for both. Use this combo for any payment work in the Deriva webapp — POS for in-store, web checkout for online ordering.

## When NOT to use

- Don't use SumUp tools for unrelated payment providers (Stripe, etc.)
- Don't share API keys in the repo, in commits, or in chat with non-owners
- Don't execute production transactions from this Claude Code session — use Vercel deploys and the running production app for real payments
