import assert from "node:assert/strict";
import test from "node:test";
import {
  beanIdSegment,
  beanHistoryQuery,
} from "../../src/server/bean-stock-proxy";
test("bean routes reject traversal and unrelated stock IDs", () => {
  assert.equal(
    beanIdSegment("bean_" + "a".repeat(32)),
    "bean_" + "a".repeat(32),
  );
  for (const id of [
    "menu:espresso",
    "bean_../menu",
    "bean_a?x=1",
    "bean_" + "A".repeat(32),
  ])
    assert.equal(beanIdSegment(id), null);
});
test("history forwards only bounded exclusive revision pagination", () => {
  assert.equal(
    beanHistoryQuery(new URLSearchParams("limit=20&before_revision=5")),
    "?limit=20&before_revision=5",
  );
  assert.equal(beanHistoryQuery(new URLSearchParams()), "");
  for (const query of [
    "limit=101",
    "limit=0",
    "before_revision=-1",
    "before_revision=1.2",
    "limit=2&limit=3",
    "target=/admin/menu",
  ])
    assert.equal(beanHistoryQuery(new URLSearchParams(query)), null);
});
