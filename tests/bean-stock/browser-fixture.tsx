import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { TopBar } from "../../app/(admin)/stock/_components/StockApp";
import { BeanWorkspace } from "../../app/(admin)/stock/_components/BeanWorkspace";
import { createBeanClient } from "../../src/bean-stock/client";
import type { Snapshot } from "../../src/bean-stock/types";
import "../../src/design/tokens.css";
import "../../app/(admin)/stock/stock.css";
import "../../app/(admin)/stock/bean-stock.css";
const now = "2026-11-16T12:00:00Z";
const names = [
  "House Blend",
  "Etiopía",
  "Decaf by DACH",
  "Evolve",
  "Decaf by Black Drop",
  "Brazil",
  "Colombia by Colibrí",
  "Cenicafé by Colibrí",
  "504 Tasty Roast",
];
const initial: Snapshot = {
  items: names.map((name, i) => ({
    id: "bean_" + (i + 1).toString(16).padStart(32, "0"),
    name,
    origin_id: "orig_" + i,
    tier: i > 6 ? "premium" : "regular",
    unit: "kg",
    quantity_kg: null,
    revision: 0,
    updated_at: now,
  })),
  now,
  can_manage_beans: true,
  menu_items: [
    {
      id: "pourover",
      name: "Pour Over",
      available: true,
      origin_ids: ["orig_0", "orig_1", "orig_2", "orig_7", "orig_8"],
    },
    {
      id: "espresso",
      name: "Espresso",
      available: false,
      origin_ids: ["orig_0"],
    },
  ],
  links: names.map((_, i) => ({
    bean_id: "bean_" + (i + 1).toString(16).padStart(32, "0"),
    menu_item_id: "pourover",
  })),
};
const stored = sessionStorage.getItem("fixture-server");
const data = stored
  ? JSON.parse(stored)
  : { snapshot: initial, receipts: {}, history: [] };
const control = {
  data,
  failNext: "",
  requests: [] as any[],
  authUid: "fixture-staff",
  persist: () => sessionStorage.setItem("fixture-server", JSON.stringify(data)),
};
(window as any).__fixture = control;
const api = createBeanClient({
  getAuth: () => ({
    currentUser: control.authUid
      ? { uid: control.authUid, getIdToken: async () => "fixture-token" }
      : null,
  }),
  fetch: async (url, init) => {
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    control.requests.push({ url, body });
    if (control.failNext === "unavailable") {
      control.failNext = "";
      return Response.json({ code: "not_found" }, { status: 404 });
    }
    if (init?.method === "POST") {
      if (control.failNext === "403") {
        control.failNext = "";
        data.snapshot.can_manage_beans = false;
        control.persist();
        return Response.json({ code: "forbidden" }, { status: 403 });
      }
      if (control.failNext === "switch") {
        control.failNext = "";
        control.authUid = "another-account";
        return Response.json({ code: "unauthorized" }, { status: 401 });
      }
      if (control.failNext === "401") {
        control.failNext = "";
        return Response.json({ code: "unauthorized" }, { status: 401 });
      }
      const bean = data.snapshot.items.find((b: any) => url.includes(b.id));
      if (control.failNext === "conflict") {
        control.failNext = "";
        bean.quantity_kg = "0.5";
        bean.revision++;
        control.persist();
        return Response.json(
          { code: "bean_revision_conflict" },
          { status: 409 },
        );
      }
      let result = data.receipts[body.request_id];
      if (!result) {
        if (bean.revision !== body.expected_revision)
          return Response.json(
            { code: "bean_revision_conflict" },
            { status: 409 },
          );
        const before = bean.quantity_kg;
        bean.quantity_kg =
          body.mode === "set"
            ? body.quantity_kg
            : String(Number(before) + Number(body.quantity_kg));
        bean.revision++;
        const adjustment = {
          id: "adj_" + body.request_id,
          bean_id: bean.id,
          mode: body.mode,
          quantity_kg: body.quantity_kg,
          before_kg: before,
          after_kg: bean.quantity_kg,
          revision: bean.revision,
          request_id: body.request_id,
          actor_id: "Fixture staff",
          reason: body.reason ?? "",
          created_at: now,
        };
        result = { item: { ...bean }, adjustment };
        data.receipts[body.request_id] = result;
        data.history.unshift(adjustment);
        control.persist();
      }
      if (control.failNext === "lost") {
        control.failNext = "";
        throw Error("response lost after commit");
      }
      return Response.json(result);
    }
    if (init?.method === "PUT") {
      const beanId = url.split("/").at(-2)!;
      data.snapshot.links = data.snapshot.links
        .filter((l: any) => l.bean_id !== beanId)
        .concat(
          body.menu_item_ids.map((id: string) => ({
            bean_id: beanId,
            menu_item_id: id,
          })),
        );
      control.persist();
      return Response.json({
        bean_id: beanId,
        menu_item_ids: body.menu_item_ids,
      });
    }
    if (url.includes("/history"))
      return Response.json({
        entries: data.history.filter((h: any) => url.includes(h.bean_id)),
        has_more: false,
        next_before_revision: null,
      });
    return Response.json(data.snapshot);
  },
});
function Fixture() {
  const [signed, setSigned] = useState(true);
  return (
    <div className="stock-shell">
      <TopBar onSignOut={() => {}} />
      {signed ? (
        <BeanWorkspace
          uid="fixture-staff"
          api={api}
          onProducts={() => {}}
          onSessionExpired={() => setSigned(false)}
        />
      ) : (
        <button onClick={() => setSigned(true)}>
          Entrar con la misma cuenta
        </button>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
