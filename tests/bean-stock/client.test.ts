import test from "node:test";
import assert from "node:assert/strict";
import {
  createBeanClient,
  BeanRequestError,
} from "../../src/bean-stock/client";
const beanId = "bean_" + "a".repeat(32),
  now = "2026-11-16T12:00:00Z";
const snapshot = {
  items: [],
  now,
  can_manage_beans: false,
  menu_items: [],
  links: [],
};
const user = (uid: string, getIdToken = async () => "token") => ({
  uid,
  getIdToken,
});
const payload = {
  mode: "set" as const,
  quantity_kg: "0.125",
  expected_revision: 0,
  request_id: "same-id",
};
test("read uses scoped proxy, no-store and captured bearer", async () => {
  let seen: any;
  const client = createBeanClient({
    getAuth: () => ({ currentUser: user("a") }),
    fetch: async (url, init) => {
      seen = { url, init };
      return Response.json(snapshot);
    },
  });
  assert.deepEqual(await client.getBeans("a"), snapshot);
  assert.equal(seen.url, "/api/barra-stock/beans");
  assert.equal(seen.init.cache, "no-store");
  assert.equal(seen.init.headers.Authorization, "Bearer token");
});
test("account switching while token resolves prevents sending", async () => {
  let current: any = user("a", async () => {
      current = user("b");
      return "token";
    }),
    sent = false;
  const client = createBeanClient({
    getAuth: () => ({ currentUser: current }),
    fetch: async () => {
      sent = true;
      return Response.json(snapshot);
    },
  });
  await assert.rejects(
    client.getBeans("a"),
    (e: any) => e instanceof BeanRequestError && e.status === 401,
  );
  assert.equal(sent, false);
});
test("account switching after mutation response is ambiguous and never returns another account result", async () => {
  let current: any = user("a");
  const client = createBeanClient({
    getAuth: () => ({ currentUser: current }),
    fetch: async () => {
      current = user("b");
      return Response.json({});
    },
  });
  await assert.rejects(
    client.adjustBean("a", beanId, payload),
    (e: any) =>
      e instanceof BeanRequestError &&
      e.code === "session_changed" &&
      e.ambiguous,
  );
});
test("malformed successful mutation cannot clear pending request", async () => {
  const client = createBeanClient({
    getAuth: () => ({ currentUser: user("a") }),
    fetch: async () => Response.json({ item: { quantity_kg: "0.125" } }),
  });
  await assert.rejects(
    client.adjustBean("a", beanId, payload),
    (e: any) =>
      e instanceof BeanRequestError &&
      e.code === "invalid_response" &&
      e.ambiguous,
  );
});
test("HTTP status and sanitized machine code distinguish unavailable, conflict and auth", async () => {
  for (const [status, code] of [
    [404, "bean_not_found"],
    [409, "bean_revision_conflict"],
    [401, "unauthorized"],
  ] as const) {
    const client = createBeanClient({
      getAuth: () => ({ currentUser: user("a") }),
      fetch: async () => Response.json({ code }, { status }),
    });
    await assert.rejects(
      client.getBeans("a"),
      (e: any) =>
        e instanceof BeanRequestError &&
        e.status === status &&
        e.code === code &&
        !e.ambiguous,
    );
  }
});
test("network loss after sending retains exact payload and classifies outcome unknown", async () => {
  let body = "";
  const client = createBeanClient({
    getAuth: () => ({ currentUser: user("a") }),
    fetch: async (_u, init) => {
      body = String(init?.body);
      throw Error("offline");
    },
  });
  await assert.rejects(
    client.adjustBean("a", beanId, payload),
    (e: any) => e instanceof BeanRequestError && e.ambiguous,
  );
  assert.deepEqual(JSON.parse(body), payload);
});
test("history cursor and links requests preserve exact backend contracts", async () => {
  const calls: any[] = [];
  const client = createBeanClient({
    getAuth: () => ({ currentUser: user("a") }),
    fetch: async (url, init) => {
      calls.push({ url, init });
      return Response.json(
        String(url).includes("/history")
          ? { entries: [], has_more: false, next_before_revision: null }
          : { bean_id: beanId, menu_item_ids: ["m"] },
      );
    },
  });
  await client.getBeanHistory("a", beanId, 7);
  await client.putBeanLinks("a", beanId, {
    menu_item_ids: ["m"],
    expected_menu_item_ids: [],
    request_id: "links",
  });
  assert.match(calls[0].url, /history\?limit=30&before_revision=7$/);
  assert.equal(calls[1].init.method, "PUT");
  assert.equal(JSON.parse(calls[1].init.body).request_id, "links");
});
test("valid adjustment succeeds while response for another request remains unconfirmed", async () => {
  const item = {
    id: beanId,
    name: "House",
    origin_id: "orig_house",
    tier: "regular",
    unit: "kg",
    quantity_kg: "0.125",
    revision: 1,
    updated_at: now,
  };
  const adjustment = {
    id: "adj",
    bean_id: beanId,
    mode: "set",
    quantity_kg: "0.125",
    before_kg: null,
    after_kg: "0.125",
    revision: 1,
    request_id: "same-id",
    actor_id: "staff",
    reason: "",
    created_at: now,
  };
  let wrong = false;
  const client = createBeanClient({
    getAuth: () => ({ currentUser: user("a") }),
    fetch: async () =>
      Response.json({
        item,
        adjustment: {
          ...adjustment,
          request_id: wrong ? "different" : "same-id",
        },
      }),
  });
  assert.equal(
    (await client.adjustBean("a", beanId, payload)).item.quantity_kg,
    "0.125",
  );
  wrong = true;
  await assert.rejects(
    client.adjustBean("a", beanId, payload),
    (e: any) => e.ambiguous && e.code === "invalid_response",
  );
});
test("account change during JSON decoding also rejects the response", async () => {
  let current: any = user("a");
  const response = Response.json(snapshot);
  response.json = async () => {
    current = user("b");
    return snapshot;
  };
  const client = createBeanClient({
    getAuth: () => ({ currentUser: current }),
    fetch: async () => response,
  });
  await assert.rejects(
    client.getBeans("a"),
    (e: any) => e.code === "session_changed",
  );
});
