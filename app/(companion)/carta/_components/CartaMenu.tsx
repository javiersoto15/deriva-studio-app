import Link from "next/link";

import type { MenuView } from "../../../../src/api/hooks";
import { getMenuView } from "../../../../src/api/server";
import { colors } from "../../../../src/design/tokens";
import { MenuSections } from "./MenuSections";

// Tier 3 — Streamed menu boundary. The parent page renders its shell
// synchronously and wraps this component in <Suspense> so the await happens
// off the critical paint path. Tab transitions paint the shell instantly;
// the menu rows stream in when the cached `getMenuView()` resolves.
const EMPTY_MENU: MenuView = {
  categories: [],
  today_origin: { id: "", label: "" }
};

export async function CartaMenu() {
  const fetched = await getMenuView();
  const menu: MenuView = fetched ?? EMPTY_MENU;

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
