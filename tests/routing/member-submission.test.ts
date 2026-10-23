import assert from "node:assert/strict";
import test from "node:test";

import { submitMemberAccount } from "../../src/lib/member-submission";

test("a rejected member submission preserves the draft and does not navigate", async () => {
  const failure = new Error("POST /members failed: 503");
  const events: string[] = [];

  const outcome = await submitMemberAccount(
    async () => {
      throw failure;
    },
    () => {
      events.push("clear draft");
    },
    () => {
      events.push("navigate");
    }
  );

  assert.deepEqual(outcome, { ok: false, error: failure });
  assert.deepEqual(events, []);
});

test("a successful member submission clears the draft before navigating", async () => {
  const events: string[] = [];

  const outcome = await submitMemberAccount(
    async () => {},
    () => {
      events.push("clear draft");
    },
    () => {
      events.push("navigate");
    }
  );

  assert.deepEqual(outcome, { ok: true });
  assert.deepEqual(events, ["clear draft", "navigate"]);
});
