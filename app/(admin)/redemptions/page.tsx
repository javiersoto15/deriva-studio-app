import type { Metadata } from "next";
import { Suspense } from "react";
import {
  isStaffUnlocked,
  signOutStaffMatchUp
} from "../../../src/server/staff-match-up";
import { StaffUnlock } from "../match-up/_components/StaffUnlock";
import { RewardValidator } from "./_components/RewardValidator";
import "./redemptions.css";

// Staff-only tool — never index it.
export const metadata: Metadata = {
  title: "Canje de recompensas · Barra",
  robots: { index: false, follow: false }
};

export default function RedemptionsPage() {
  return (
    <div className="redeem-shell">
      {/* The cookie read (isStaffUnlocked) is uncached dynamic data; under
          Cache Components it must live inside a Suspense boundary so the rest
          of the route can prerender. */}
      <Suspense fallback={<Bar />}>
        <Gate />
      </Suspense>
    </div>
  );
}

async function Gate() {
  const unlocked = await isStaffUnlocked();
  return (
    <>
      <Bar unlocked={unlocked} />
      <main className="redeem-body">
        {unlocked ? (
          <RewardValidator initialState={{ status: "idle" }} />
        ) : (
          <StaffUnlock />
        )}
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
        // Server-action form: submitting deletes the cookie and Next
        // re-renders the route back to the unlock screen. No client JS.
        <form action={signOutStaffMatchUp}>
          <button type="submit" className="redeem-bar__signout">
            Cerrar sesión
          </button>
        </form>
      )}
    </header>
  );
}
