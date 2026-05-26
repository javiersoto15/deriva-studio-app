"use client";

import Link from "next/link";
import { useActivityPreview, useMyRewards, usePointsBalance } from "../../../src/api/hooks";
import { colors } from "../../../src/design/tokens";
import { Eyebrow } from "../../../src/ui/Eyebrow";
import { Shimmer } from "../../../src/ui/Shimmer";
import { TopHeader } from "../../../src/ui/TopHeader";

// Cartera — matches Paper artboard X3-0.
export default function CarteraPage() {
  const { data: balance } = usePointsBalance();
  const { data: rewards } = useMyRewards();
  const { data: activity } = useActivityPreview();

  const balancePoints = balance?.balance ?? 0;
  const availableRewards = rewards?.rewards.filter((reward) => reward.available) ?? [];

  return (
    <>
      <main
        style={{
          flex: 1,
          minHeight: 0,
          padding: "calc(env(safe-area-inset-top) + 24px) 24px 0",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          // Page chrome (header, eyebrow, title, saldo card) is pinned; the
          // rewards + activity sections share an internal scroll column below
          // so the user never has to scroll the page to reach activity.
          overflow: "hidden"
        }}
      >
        <TopHeader />
        <Eyebrow>Cartera</Eyebrow>

        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 32,
            lineHeight: "38px",
            letterSpacing: "-0.01em",
            color: colors.brown700
          }}
        >
          Tu Deriva, en tu bolsillo.
        </h1>

        {/* Espresso card — compact: horizontal balance, inline "pts", smaller
            CTAs. Compressed from ~316px to ~210px to free room for rewards. */}
        <section
          style={{
            backgroundColor: colors.brown900,
            color: colors.beige100,
            borderRadius: 14,
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            flexShrink: 0
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 12
            }}
          >
            <div
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
            </div>
            <div
              style={{
                fontFamily: "var(--font-display), serif",
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: 40,
                lineHeight: "44px",
                letterSpacing: "-0.01em",
                color: colors.beige100,
                display: "flex",
                alignItems: "baseline",
                gap: 8
              }}
            >
              {balance ? balance.balance : <Shimmer surface="espresso" width={80} height={36} />}
              <span
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontStyle: "normal",
                  fontSize: 12,
                  color: colors.beige300,
                  letterSpacing: "0.05em"
                }}
              >
                pts
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Link
              href="/sumar-visita"
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                minHeight: 42,
                padding: "10px 16px",
                borderRadius: 999,
                backgroundColor: colors.beige100,
                color: colors.brown900,
                fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: 11,
                lineHeight: 1.2,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                textDecoration: "none"
              }}
            >
              Sumar visita
            </Link>
            <Link
              href="/actividad"
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                minHeight: 42,
                padding: "10px 16px",
                borderRadius: 999,
                border: `1px solid ${colors.beige100}`,
                color: colors.beige100,
                fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: 11,
                lineHeight: 1.2,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                textDecoration: "none"
              }}
            >
              Movimientos
            </Link>
          </div>
        </section>

        {/* Single internal-scroll column for rewards + activity. The page
            (<main>) does NOT scroll — this is the only scroll surface below
            the espresso card. Mirrors the menu's per-column scroll pattern.
            Rewards no longer needs its own maxHeight cap because this
            container absorbs all overflow. */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorY: "contain",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            paddingBottom: "calc(env(safe-area-inset-bottom) + 96px)"
          }}
        >

        {/* Rewards rows */}
        <section style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: 8,
              fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
              fontWeight: 600,
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: colors.inkMuted
            }}
          >
            <span>Recompensas</span>
            <span style={{ fontFamily: "var(--font-mono), monospace", letterSpacing: 0, textTransform: "none" }}>
              {availableRewards.length} disponibles
            </span>
          </div>
          {rewards && rewards.rewards.length === 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: "20px 0",
                borderTop: `1px solid ${colors.hairlineLight}`
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontStyle: "italic",
                  fontWeight: 300,
                  fontSize: 19,
                  lineHeight: "26px",
                  color: colors.inkMuted
                }}
              >
                Tu primer canje aparece aquí.
              </span>
              <Link
                href="/carta"
                style={{
                  alignSelf: "flex-start",
                  fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: colors.brown700,
                  textDecoration: "none"
                }}
              >
                Ver carta →
              </Link>
            </div>
          )}
          {(rewards?.rewards ?? []).map((r) => {
            const missingPoints = Math.max(0, r.points_cost - balancePoints);
            const rewardMeta = r.available
              ? r.eligibility_label
              : `${r.points_cost} pts · faltan ${missingPoints}`;

            return (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 0",
                  borderTop: `1px solid ${colors.hairline}`,
                  opacity: r.available ? 1 : 0.58
                }}
              >
                <span aria-hidden style={{ width: 24, color: colors.brown700, fontSize: 18 }}>
                  {r.icon === "milk" ? "🥛" : "☕"}
                </span>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-display), serif",
                      fontStyle: "italic",
                      fontWeight: 300,
                      fontSize: 18,
                      color: colors.ink900
                    }}
                  >
                    {r.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 11,
                      color: colors.inkMuted,
                      letterSpacing: "0.05em"
                    }}
                  >
                    {rewardMeta}
                  </span>
                </div>
                {r.available ? (
                  <Link
                    href={`/canjear/${r.id}`}
                    style={{
                      fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
                      fontWeight: 600,
                      fontSize: 11,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: colors.brown700,
                      textDecoration: "none",
                      whiteSpace: "nowrap"
                    }}
                  >
                    Canjear →
                  </Link>
                ) : (
                  <span
                    aria-label={`Faltan ${missingPoints} puntos para canjear ${r.name}`}
                    style={{
                      fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
                      fontWeight: 600,
                      fontSize: 11,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: colors.inkMuted,
                      whiteSpace: "nowrap"
                    }}
                  >
                    Bloqueada
                  </span>
                )}
              </div>
            );
          })}
        </section>

        {/* Activity preview */}
        <section style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: 8,
              fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
              fontWeight: 600,
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: colors.inkMuted
            }}
          >
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <span>Actividad</span>
              <Link
                href="/actividad"
                style={{
                  color: colors.brown700,
                  textDecoration: "none",
                  letterSpacing: "0.22em"
                }}
              >
                Ver todo →
              </Link>
            </div>
            <span style={{ fontFamily: "var(--font-mono), monospace", letterSpacing: 0, textTransform: "none", color: colors.inkMuted }}>
              {activity?.month_summary}
            </span>
          </div>
          {(activity?.entries ?? []).map((e) => (
            <div
              key={e.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "16px 0",
                borderTop: `1px solid ${colors.hairlineLight}`
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span
                  style={{
                    fontFamily: "var(--font-display), serif",
                    fontStyle: "italic",
                    fontWeight: 300,
                    fontSize: 18,
                    color: colors.ink900
                  }}
                >
                  {e.label}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 11,
                    color: colors.inkMuted,
                    letterSpacing: "0.05em"
                  }}
                >
                  {e.when}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 13,
                  color: colors.brown700
                }}
              >
                +{e.points} pts
              </span>
            </div>
          ))}
        </section>
        </div>
      </main>
    </>
  );
}
