import { Suspense } from "react";

import { TopHeader } from "../../../src/ui/TopHeader";
import { CartaMenu } from "./_components/CartaMenu";
import { CartaMenuFallback } from "./_components/CartaMenuFallback";
import { Greeting } from "./_components/Greeting";
import { TodayEyebrow } from "./_components/TodayEyebrow";

// Home / Carta — matches Paper artboard QJ-0.
//
// Tier 3 — The page shell (header + eyebrow + greeting) renders synchronously
// so a tab switch into /carta paints instantly. The menu fetch is isolated
// in <CartaMenu /> and wrapped in <Suspense> so it streams in alongside the
// shell. Prefetched in the layout (Tier 5), so the warm path is near-instant.
export default function CartaPage() {
  return (
    <main
      style={{
        height: "100dvh",
        paddingTop: "calc(env(safe-area-inset-top) + 24px)",
        paddingLeft: 24,
        paddingRight: 24,
        paddingBottom: 0,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        overflow: "hidden",
        overscrollBehavior: "none"
      }}
    >
      <TopHeader />
      <TodayEyebrow />
      <Greeting />
      <Suspense fallback={<CartaMenuFallback />}>
        <CartaMenu />
      </Suspense>
    </main>
  );
}
