"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  useCurrentMember,
  useMemberQrToken,
  useMyRewards,
  usePointsBalance
} from "../../../src/api/hooks";
import { useAuth } from "../../../src/auth/use-auth";
import { colors } from "../../../src/design/tokens";
import { QrMockCard } from "../../../src/ui/QrMockCard";
import { Shimmer } from "../../../src/ui/Shimmer";

// Codigo — matches Paper artboard SJ-0. Fullscreen espresso surface. No TabBar.
export default function CodigoPage() {
  const router = useRouter();
  const { status: authStatus } = useAuth();
  const { data: member } = useCurrentMember();
  const { data: balance } = usePointsBalance();
  // /me/balance.next_reward.name is NOT locale-aware (backend gap — see
  // followup). Derive next reward from /me/rewards instead, which IS
  // localized via ?locale. Pick the cheapest unredeemed reward — same
  // selection the backend uses for next_reward, but with localized copy.
  const { data: rewardsResponse } = useMyRewards();
  const derivedNext = rewardsResponse?.rewards
    .filter((r) => !r.available)
    .sort((a, b) => a.points_cost - b.points_cost)[0];
  const tokenMutation = useMemberQrToken();
  const [qr, setQr] = useState<{ token: string; backup: string } | null>(null);
  // Mint exactly one QR per page mount. Without this guard, a re-render from
  // useCurrentMember or usePointsBalance settling could re-fire the mutation.
  const mintedRef = useRef(false);

  // Wait until Firebase Auth has rehydrated before minting the QR. On a hard
  // refresh of /codigo, status starts as "loading"; if we fire the mutation
  // immediately the middleware sees currentUser === null and sends the
  // request unauthenticated → backend 401 → the just-built session-expiry
  // ramp bounces the user to /inicio. Gating on "authenticated" avoids the
  // race entirely.
  useEffect(() => {
    if (authStatus !== "authenticated") return;
    if (mintedRef.current) return;
    mintedRef.current = true;
    tokenMutation
      .mutateAsync()
      .then((res) => setQr({ token: res.token, backup: res.backup_code }))
      .catch(() => {
        // mutationCache.onError in QueryProvider has already surfaced a toast
        // (or fired the session-expiry ramp on 401). Allow a retry on the
        // next mount by releasing the latch.
        mintedRef.current = false;
      });
    // tokenMutation is referentially unstable; we intentionally key only on
    // authStatus and rely on mintedRef to dedupe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus]);

  // Espresso edge-to-edge: paint html bg to brown900 while this fullscreen
  // surface is mounted so safe-area zones (notch, home indicator) don't reveal
  // the companion-default beige base. Restored on unmount.
  useEffect(() => {
    const previous = document.documentElement.style.backgroundColor;
    document.documentElement.style.backgroundColor = colors.brown900;
    return () => {
      document.documentElement.style.backgroundColor = previous;
    };
  }, []);

  const displayName = member?.name;
  // Prefer the localized reward name from /me/rewards. Fall back to the
  // non-localized balance.next_reward only as a last-resort (e.g., empty
  // catalog or transient state where rewards haven't loaded yet).
  const next = derivedNext
    ? {
        name: derivedNext.name,
        threshold_points: derivedNext.points_cost,
        points_remaining: Math.max(0, derivedNext.points_cost - (balance?.balance ?? 0))
      }
    : balance?.next_reward ?? null;

  return (
    <main
      style={{
        flex: 1,
        backgroundColor: colors.brown900,
        color: colors.beige100,
        padding:
          "calc(env(safe-area-inset-top) + 20px) 24px calc(env(safe-area-inset-bottom) + 20px)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        height: "100dvh",
        overflow: "hidden"
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <span
          style={{
            fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: colors.beige300
          }}
        >
          Tu código de miembro
        </span>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 24,
            letterSpacing: "-0.01em",
            color: colors.beige100,
            minHeight: 28
          }}
        >
          {displayName ?? <Shimmer surface="espresso" width={180} height={22} />}
        </h1>
      </div>

      {qr ? (
        <QrMockCard value={qr.token} backupCode={qr.backup} />
      ) : (
        <div
          style={{
            backgroundColor: colors.beige100,
            borderRadius: 16,
            padding: 20,
            width: "100%",
            maxWidth: 280,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12
          }}
        >
          <Shimmer width={220} height={220} radius={6} />
          <Shimmer width={140} height={18} />
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          paddingTop: 16,
          borderTop: "1px solid rgba(215,199,171,0.18)"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span
            style={{
              fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
              fontWeight: 600,
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: colors.beige300
            }}
          >
            Saldo
          </span>
          <span
            style={{
              fontFamily: "var(--font-display), serif",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: 28,
              color: colors.beige100,
              display: "inline-flex",
              alignItems: "baseline",
              gap: 8,
              minHeight: 32
            }}
          >
            {balance ? (
              <>{balance.balance} pts</>
            ) : (
              <Shimmer surface="espresso" width={100} height={26} inline />
            )}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
          <span
            style={{
              fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
              fontWeight: 600,
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: colors.beige300
            }}
          >
            Próximo
          </span>
          <span
            style={{
              fontFamily: "var(--font-display), serif",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: 18,
              color: colors.beige100,
              minHeight: 22,
              display: "inline-flex",
              alignItems: "center"
            }}
          >
            {balance ? next?.name ?? "—" : <Shimmer surface="espresso" width={120} height={16} inline />}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              color: colors.beige300
            }}
          >
            {next ? `${next.threshold_points} pts · faltan ${next.points_remaining}` : ""}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "auto" }}>
        <button
          type="button"
          onClick={() => router.back()}
          className="tap-target"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: colors.beige300,
            fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase"
          }}
        >
          Cerrar
        </button>
      </div>
    </main>
  );
}
