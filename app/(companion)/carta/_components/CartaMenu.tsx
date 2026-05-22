import { connection } from "next/server";
import Link from "next/link";

import type { MenuView } from "../../../../src/api/hooks";
import { getMenuView } from "../../../../src/api/server";
import { getTemporarilyUnavailableItemIds } from "../../../../src/data/apertura-windows";
import { colors } from "../../../../src/design/tokens";
import { MenuSections } from "./MenuSections";

// Tier 3 — Streamed menu boundary. The parent page renders its shell
// synchronously and wraps this component in <Suspense> so the await happens
// off the critical paint path. Tab transitions paint the shell instantly;
// the menu rows stream in when the cached `getMenuView()` resolves.
const EMPTY_MENU: MenuView = {
  categories: [],
  today_origin: { id: "orig_house_blend_dach", label: "House Blend · DACH" }
};

export async function CartaMenu() {
  // Opt into dynamic rendering so the apertura time-gate
  // (getTemporarilyUnavailableItemIds) is evaluated per-request and flips at
  // the cutoff without requiring a redeploy. getMenuView() itself remains
  // cached; only the gate runs fresh.
  await connection();
  const fetched = await getMenuView();
  const baseMenu: MenuView = fetched ?? EMPTY_MENU;
  // Post-process the cached menu against the time-bounded availability
  // windows. Kept outside getMenuView (which uses `"use cache"`) so the gate
  // is re-evaluated at request time and flips on its own at the cutoff
  // without a cache bust.
  const gatedIds = getTemporarilyUnavailableItemIds(new Date());
  const menu: MenuView =
    gatedIds.size === 0
      ? baseMenu
      : {
          ...baseMenu,
          categories: baseMenu.categories.map((cat) => ({
            ...cat,
            sections: cat.sections.map((sec) => ({
              ...sec,
              items: sec.items.map((it) =>
                gatedIds.has(it.id) ? { ...it, available: false } : it
              )
            }))
          }))
        };

  return (
    <>
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-mono), monospace",
          fontSize: 12,
          color: colors.inkMuted
        }}
      >
        Hoy en barra ·{" "}
        {menu.today_origin && menu.today_origin.id ? (
          <Link
            href={`/carta/origen/${menu.today_origin.id}`}
            style={{ color: colors.brown700, textDecoration: "none" }}
          >
            {menu.today_origin.label}
          </Link>
        ) : (
          "—"
        )}
      </p>

      <MenuSections menu={menu} />
    </>
  );
}
