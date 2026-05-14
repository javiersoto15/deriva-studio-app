"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMyRewards, useRedemptionToken } from "../../../../src/api/hooks";
import { formatShortCode } from "../../../../src/lib/shortCode";
import { colors } from "../../../../src/design/tokens";
import { Eyebrow } from "../../../../src/ui/Eyebrow";
import { RewardQrCard } from "../../../../src/ui/RewardQrCard";

// Canjear / Reward Redemption — matches Paper artboard 1CO-0. Fullscreen
// espresso ground, no TabBar. Staff scans QR or types short code; latch
// consumes the 60s redemption token. Single green moment is the timer arc.
export default function CanjearPage() {
  const router = useRouter();
  const params = useParams<{ rewardId: string }>();
  const rewardId = params?.rewardId ?? "";
  const { data: rewards } = useMyRewards();
  const reward = rewards?.rewards.find((r) => r.id === rewardId);

  const tokenQuery = useRedemptionToken(rewardId, Boolean(reward?.available));
  const expiresAt = tokenQuery.data?.expires_at;
  // short_code is canonical (migration 007 / openapi RewardRedemptionTokenResponse).
  // The backend mints an authoritative 4-char manual fallback code; we format it
  // for display only (spacing). Falls back to placeholder while the token loads.
  const shortCode = useMemo(
    () => formatShortCode(tokenQuery.data?.short_code),
    [tokenQuery.data?.short_code]
  );

  // Redirect to /cartera if the reward is unknown or not affordable. The
  // backend is authoritative, but the client should not mint a token for a
  // locked reward reached by a pasted URL.
  useEffect(() => {
    if (rewards && (!reward || !reward.available)) {
      router.replace("/cartera");
    }
  }, [rewards, reward, router]);

  // Derive caption from the cartera expiry label: reverse the two segments
  // and lowercase. "VENCE 25 JUN · DE BIENVENIDA" → "de bienvenida · vence 25 jun"
  const caption = useMemo(() => {
    if (!reward) return "";
    const parts = reward.expiry_label.split(" · ");
    return parts.reverse().join(" · ").toLowerCase();
  }, [reward]);

  // Split the name onto two lines roughly at the midpoint word boundary, to
  // match the editorial break on the artboard ("Cortado / de la casa").
  const [titleA, titleB] = useMemo(() => splitName(reward?.name ?? ""), [reward]);

  return (
    <main
      style={{
        flex: 1,
        backgroundColor: colors.brown900,
        color: colors.beige100,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Header eyebrow row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "40px 28px 24px"
        }}
      >
        <Eyebrow tone="dark">Recompensa · mostrar en barra</Eyebrow>
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            letterSpacing: "0.08em",
            color: colors.beige300
          }}
        >
          {shortCode}
        </span>
      </div>

      {/* Hero */}
      <div style={{ padding: "0 28px 28px", display: "flex", flexDirection: "column", gap: 12 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 40,
            lineHeight: "44px",
            letterSpacing: "-0.01em",
            color: colors.beige100
          }}
        >
          {titleA}
          {titleB ? (
            <>
              <br />
              {titleB}
            </>
          ) : null}
        </h1>
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 12,
            letterSpacing: "0.06em",
            color: colors.beige300
          }}
        >
          {caption}
        </span>
      </div>

      {/* QR card + countdown ring cluster */}
      <div
        style={{
          position: "relative",
          padding: "0 28px 32px",
          display: "flex"
        }}
      >
        <RewardQrCard seed={tokenQuery.data?.token ?? rewardId} />
        <CountdownPod expiresAt={expiresAt} />
      </div>

      {/* Eligibility */}
      <div
        style={{
          padding: "16px 28px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          borderTop: `1px solid ${colors.hairlineOnDark}`
        }}
      >
        <Eyebrow tone="dark">Incluye</Eyebrow>
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            lineHeight: "17px",
            letterSpacing: "0.06em",
            color: colors.beige300
          }}
        >
          espresso · cortado · flat white · americano
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            letterSpacing: "0.06em",
            color: colors.beige300
          }}
        >
          no aplica en premium
        </span>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "22px 28px 28px",
          borderTop: `1px solid ${colors.hairlineOnDark}`
        }}
      >
        <Link
          href="/cartera"
          style={{
            fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: colors.beige100,
            textDecoration: "none"
          }}
        >
          ← Volver
        </Link>
        <button
          type="button"
          onClick={() => tokenQuery.refetch()}
          disabled={tokenQuery.isFetching || !reward?.available}
          style={{
            background: "transparent",
            border: "none",
            cursor: tokenQuery.isFetching ? "wait" : reward?.available ? "pointer" : "not-allowed",
            padding: 0,
            fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: colors.beige300
          }}
        >
          Refrescar código
        </button>
      </div>
    </main>
  );
}

// Split a reward name at the midpoint word boundary so the hero breaks across
// two italic lines, matching the editorial layout on artboard 1CO-0.
function splitName(name: string): [string, string] {
  const words = name.split(/\s+/);
  if (words.length <= 1) return [name, ""];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

// CountdownPod — overlaps the QR card's right edge per Recipe Rule 4 (editorial
// asymmetry). The arc is the single allowed green moment on this screen (Rule 5).
// Counter ticks down from 60 to 0; arc stays static at 270° (fewer moving parts,
// gentler on prefers-reduced-motion).
function CountdownPod({ expiresAt }: { expiresAt?: string }) {
  const [secondsLeft, setSecondsLeft] = useState<number>(60);

  useEffect(() => {
    if (!expiresAt) return;
    const targetMs = new Date(expiresAt).getTime();
    const tick = () => {
      const remaining = Math.max(0, Math.round((targetMs - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  // 80×80 ring matching Paper artboard 1CO-0. Center (40, 40), r = 36, stroke 2,
  // round-capped. Cream-tinted track underneath, single green 270° arc on top.
  // Arc length: 0.75 * 2πr = 0.75 * 226.19 ≈ 169.65 (dashoffset 56.55 = 0.25 * c).
  const r = 36;
  const c = 2 * Math.PI * r; // 226.19
  const dashOffset = 0.25 * c;

  return (
    <div
      role="timer"
      aria-label="60 segundos para canjear"
      style={{
        position: "absolute",
        right: 16,
        top: 230,
        width: 80,
        height: 80,
        flexShrink: 0
      }}
    >
      <svg
        viewBox="0 0 80 80"
        width={80}
        height={80}
        aria-hidden
        style={{ display: "block", position: "absolute", inset: 0 }}
      >
        {/* Background track — cream at 12% on espresso ground */}
        <circle
          cx={40}
          cy={40}
          r={r}
          fill="none"
          stroke="rgba(244,237,230,0.12)"
          strokeWidth={2}
        />
        {/* Static 270° arc — single green moment */}
        <circle
          cx={40}
          cy={40}
          r={r}
          fill="none"
          stroke={colors.green}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 40 40)"
        />
      </svg>
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-mono), monospace",
          fontSize: 16,
          fontWeight: 500,
          letterSpacing: "0.04em",
          color: colors.beige100
        }}
      >
        {mm}:{ss}
      </span>
    </div>
  );
}
