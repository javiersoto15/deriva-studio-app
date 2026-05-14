"use client";

import Link from "next/link";
import { useActivity, type ActivityLedgerEntry } from "../../../src/api/hooks";
import { colors } from "../../../src/design/tokens";
import { Eyebrow } from "../../../src/ui/Eyebrow";
import { Shimmer } from "../../../src/ui/Shimmer";

// Actividad — matches Paper artboard 17G-0.
const ES_DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const ES_MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${ES_DAYS[d.getDay()]}|${String(d.getDate()).padStart(2, "0")} ${ES_MONTHS[d.getMonth()]}`;
}

function timeOf(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function ActividadPage() {
  const { data } = useActivity();
  const entries: ActivityLedgerEntry[] = data?.entries ?? [];

  // Group by day key
  const groups = new Map<string, ActivityLedgerEntry[]>();
  for (const e of entries) {
    const k = dayKey(e.at);
    const list = groups.get(k) ?? [];
    list.push(e);
    groups.set(k, list);
  }

  return (
    <>
      <main
        style={{
          flex: 1,
          padding:
            "calc(env(safe-area-inset-top) + 24px) 24px calc(env(safe-area-inset-bottom) + 96px)",
          display: "flex",
          flexDirection: "column",
          gap: 24
        }}
      >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/cartera" className="tap-target" style={{ textDecoration: "none", margin: "-10px -8px" }}>
          <Eyebrow>← Cartera</Eyebrow>
        </Link>
        <Link
          href="/sumar-visita"
          className="tap-target"
          style={{
            margin: "-10px -8px",
            fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: colors.brown700,
            textDecoration: "none"
          }}
        >
          + Sumar visita
        </Link>
      </div>

      <h1
        style={{
          margin: 0,
          fontFamily: "var(--font-display), serif",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: 36,
          lineHeight: "42px",
          letterSpacing: "-0.01em",
          color: colors.ink900
        }}
      >
        Actividad
      </h1>

      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-mono), monospace",
          fontSize: 11,
          color: colors.inkMuted,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          minHeight: 14,
          display: "flex",
          alignItems: "center"
        }}
      >
        {data ? data.summary : <Shimmer width={200} height={11} />}
      </p>

      {!data &&
        [0, 1].map((i) => (
          <section key={`skeleton-${i}`} style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
            <Shimmer width={120} height={16} />
            <Shimmer width="100%" height={48} />
            <Shimmer width="100%" height={48} />
          </section>
        ))}

      {data && entries.length === 0 && (
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            paddingTop: 8,
            borderTop: `1px solid ${colors.hairlineLight}`
          }}
        >
          <span
            style={{
              paddingTop: 20,
              fontFamily: "var(--font-display), serif",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: 19,
              lineHeight: "26px",
              color: colors.inkMuted
            }}
          >
            Aún no hay visitas. Tu próxima visita se registra aquí.
          </span>
        </section>
      )}

      {Array.from(groups.entries()).map(([dayK, rows]) => {
        const [weekday, datePart] = dayK.split("|");
        return (
          <section key={dayK} style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 12,
                paddingBottom: 8,
                borderBottom: `1px solid ${colors.hairlineLight}`
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontStyle: "italic",
                  fontWeight: 300,
                  fontSize: 17,
                  color: colors.ink900
                }}
              >
                {weekday}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 11,
                  color: colors.inkMuted,
                  letterSpacing: "0.08em"
                }}
              >
                {datePart}
              </span>
            </div>

            {rows.map((row) => {
              const isStaff = row.state === "staff";
              const isPending = row.state === "pending";
              return (
                <div
                  key={row.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    padding: "14px 0 14px 14px",
                    borderTop: `1px solid ${colors.hairlineLight}`,
                    borderLeft: isStaff || isPending ? `2px solid ${colors.brown700}` : "none",
                    marginLeft: isStaff || isPending ? 0 : 2
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-display), serif",
                        fontStyle: "italic",
                        fontWeight: 300,
                        fontSize: 18,
                        color: isStaff ? colors.inkMuted : colors.ink900
                      }}
                    >
                      {row.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: 11,
                        color: colors.inkMuted,
                        letterSpacing: "0.08em"
                      }}
                    >
                      {timeOf(row.at)} · {row.sub}
                    </span>
                    {row.amount_clp !== null && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: 8,
                          borderTop: `1px dashed ${colors.hairlineLight}`,
                          paddingTop: 8
                        }}
                      >
                        <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 13, color: colors.ink900 }}>
                          $ {row.amount_clp.toLocaleString("es-CL")}
                        </span>
                        <Link
                          href="/actividad"
                          className="tap-target"
                          style={{
                            margin: "-10px -8px",
                            fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
                            fontWeight: 600,
                            fontSize: 10,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            color: colors.brown700,
                            textDecoration: "none"
                          }}
                        >
                          Detalle →
                        </Link>
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 13,
                      color: isPending ? colors.inkMuted : colors.brown700,
                      marginLeft: 16,
                      whiteSpace: "nowrap"
                    }}
                  >
                    +{row.points}
                    {isPending ? " pend." : ""}
                  </span>
                </div>
              );
            })}
          </section>
        );
      })}
      </main>
    </>
  );
}
