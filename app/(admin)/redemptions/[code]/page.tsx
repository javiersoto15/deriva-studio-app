import type { Metadata } from "next";
import { Suspense } from "react";
import {
  isStaffUnlocked,
  signOutStaffMatchUp
} from "../../../../src/server/staff-match-up";
import { prevalidate } from "../../../../src/server/campaign-rewards";
import { StaffUnlock } from "../../match-up/_components/StaffUnlock";
import { RewardValidator } from "../_components/RewardValidator";
import "../redemptions.css";

// Staff-only tool — never index it.
export const metadata: Metadata = {
  title: "Canje de recompensas · Barra",
  robots: { index: false, follow: false }
};

export default function RedemptionByCodePage({
  params
}: {
  params: Promise<{ code: string }>;
}) {
  return (
    <div className="redeem-shell">
      {/* Awaiting params + the cookie read are uncached dynamic data; both must
          resolve inside the Suspense boundary so the static shell prerenders. */}
      <Suspense fallback={<Bar />}>
        <Gate params={params} />
      </Suspense>
    </div>
  );
}

async function Gate({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = decodeURIComponent(raw);
  const unlocked = await isStaffUnlocked();
  if (!unlocked) {
    return (
      <>
        <Bar />
        <main className="redeem-body">
          <StaffUnlock />
        </main>
      </>
    );
  }
  // Pre-validate the URL token so the QR lands straight on the card.
  const initialState = await prevalidate(code);
  return (
    <>
      <Bar unlocked />
      <main className="redeem-body">
        <RewardValidator initialCode={code} initialState={initialState} />
      </main>
    </>
  );
}

function Bar({ unlocked }: { unlocked?: boolean }) {
  return (
    <header className="redeem-bar">
      <span className="redeem-bar__brand">
        <span className="redeem-bar__diamond" aria-hidden="true" />
        Barra · Canje
      </span>
      {unlocked && (
        <form action={signOutStaffMatchUp}>
          <button type="submit" className="redeem-bar__signout">
            Cerrar sesión
          </button>
        </form>
      )}
    </header>
  );
}
