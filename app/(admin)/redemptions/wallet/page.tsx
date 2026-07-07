import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  isStaffUnlocked,
  signOutStaffMatchUp
} from "../../../../src/server/staff-match-up";
import { StaffUnlock } from "../../match-up/_components/StaffUnlock";
import { WalletRewardRedeemer } from "./_components/WalletRewardRedeemer";
import "../redemptions.css";

export const metadata: Metadata = {
  title: "Canje de miembros · Barra",
  robots: { index: false, follow: false }
};

export default function WalletRedemptionsPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string; short_code?: string; code?: string }>;
}) {
  return (
    <div className="redeem-shell">
      <Suspense fallback={<Bar />}>
        <Gate searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Gate({
  searchParams
}: {
  searchParams: Promise<{ token?: string; short_code?: string; code?: string }>;
}) {
  const params = await searchParams;
  const unlocked = await isStaffUnlocked();
  return (
    <>
      <Bar unlocked={unlocked} />
      <main className="redeem-body">
        {unlocked ? (
          <>
            <p className="redeem__switch">
              <Link href="/redemptions">Canjes de campana</Link>
            </p>
            <WalletRewardRedeemer
              initialToken={params.token ?? ""}
              initialShortCode={params.short_code ?? params.code ?? ""}
            />
          </>
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
        Barra · Miembros
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
