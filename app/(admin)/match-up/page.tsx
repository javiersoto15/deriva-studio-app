import type { Metadata } from "next";
import { Suspense } from "react";
import {
  isStaffUnlocked,
  signOutStaffMatchUp
} from "../../../src/server/staff-match-up";
import { StaffUnlock } from "./_components/StaffUnlock";
import { StaffMatchUpForm } from "./_components/StaffMatchUpForm";

// Staff-only tool — never index it.
export const metadata: Metadata = {
  title: "Match Up · Barra",
  robots: { index: false, follow: false }
};

export default function StaffMatchUpPage() {
  return (
    <div className="matchup-staff">
      {/* The cookie read (isStaffUnlocked) is uncached dynamic data; under
          Cache Components it must live inside a Suspense boundary so the rest
          of the route can prerender. */}
      <Suspense fallback={<GateFallback />}>
        <StaffGate />
      </Suspense>
    </div>
  );
}

async function StaffGate() {
  const unlocked = await isStaffUnlocked();
  return (
    <>
      <header className="matchup-staff__bar">
        <span className="matchup-staff__brand">
          <span className="landing-diamond" aria-hidden="true" />
          Barra · Match Up
        </span>
        {unlocked && (
          // Server-action form: submitting deletes the cookie and Next
          // re-renders the route back to the unlock screen. No client JS.
          <form action={signOutStaffMatchUp}>
            <button type="submit" className="matchup-staff__signout">
              Cerrar sesión
            </button>
          </form>
        )}
      </header>
      <main className="matchup-staff__body">
        {unlocked ? <StaffMatchUpForm /> : <StaffUnlock />}
      </main>
    </>
  );
}

function GateFallback() {
  return (
    <header className="matchup-staff__bar">
      <span className="matchup-staff__brand">
        <span className="landing-diamond" aria-hidden="true" />
        Barra · Match Up
      </span>
    </header>
  );
}
