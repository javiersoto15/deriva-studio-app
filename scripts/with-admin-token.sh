#!/usr/bin/env bash
#
# with-admin-token.sh — mint a short-lived Deriva operations-agent token
# and exec a child command with BACKEND_ADMIN_TOKEN set in its environment.
#
# Usage:  bash scripts/with-admin-token.sh <command> [args...]
#
# The token is never printed, logged, or written to disk. It lives in this
# shell's environment only for the duration of the exec'd child command.
#
# Run order:
#   1. Locate the backend repo (../13_companion_backend).
#   2. Call `make --silent menu-agent-env` there, which wraps
#      scripts/menu_agent_token.sh --export. Stdout is two `export …` lines.
#   3. Eval those lines into this shell (no echo).
#   4. exec "$@" so the env is scoped to the child process only.
#
# Failure paths exit non-zero with a stderr message; the token is never
# part of any error output.
set -euo pipefail

# Silence xtrace defensively in case the wrapper is sourced from a debug
# shell — the eval below would otherwise echo the export lines.
{ set +x; } 2>/dev/null

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEBAPP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$(cd "$WEBAPP_DIR/../13_companion_backend" 2>/dev/null && pwd || true)"

if [[ -z "${BACKEND_DIR:-}" || ! -d "$BACKEND_DIR" ]]; then
  echo "with-admin-token: companion backend not found next to webapp (expected ../13_companion_backend)." >&2
  echo "Clone the backend repo as a sibling of 10_webapp/ before running agent-backed sends." >&2
  exit 1
fi

if [[ ! -x "$BACKEND_DIR/scripts/menu_agent_token.sh" ]]; then
  echo "with-admin-token: backend helper missing or not executable at $BACKEND_DIR/scripts/menu_agent_token.sh" >&2
  exit 1
fi

if [[ $# -eq 0 ]]; then
  echo "with-admin-token: no child command provided" >&2
  echo "usage: bash scripts/with-admin-token.sh <command> [args...]" >&2
  exit 2
fi

# Mint. Capture stdout (the two `export` lines) into a local var. Let stderr
# from the helper pass through so the user sees mint errors.
exports="$(cd "$BACKEND_DIR" && make --silent menu-agent-env)" || {
  echo "with-admin-token: failed to mint operations-agent token via 'make menu-agent-env'." >&2
  echo "Check that the menu-agent password is in macOS Keychain and that the backend env file is configured." >&2
  exit 1
}

if [[ -z "$exports" ]]; then
  echo "with-admin-token: backend helper returned an empty response" >&2
  exit 1
fi

# Eval into this shell. We never echo $exports, and we unset the local var
# immediately after to keep the only live copy in BACKEND_ADMIN_TOKEN.
eval "$exports"
unset exports

if [[ -z "${BACKEND_ADMIN_TOKEN:-}" ]]; then
  echo "with-admin-token: BACKEND_ADMIN_TOKEN was not set after mint" >&2
  exit 1
fi

# exec replaces this shell — token lives only as long as the child runs,
# and disappears when the child exits.
exec "$@"
