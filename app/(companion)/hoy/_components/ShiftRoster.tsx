"use client";

import type { components } from "../../../../src/api/schema";
import { colors } from "../../../../src/design/tokens";

type TodayStaffShift = components["schemas"]["TodayStaffShift"];

export type ShiftRosterData = components["schemas"]["TodayShiftMap"];

const ROLE_GROUPS: Array<{
  key: "baristas" | "cocina" | "garzones";
  label: string;
}> = [
  { key: "baristas", label: "Baristas" },
  { key: "cocina", label: "Cocina" },
  { key: "garzones", label: "Garzones" }
];

export function ShiftRoster({ shifts }: { shifts: ShiftRosterData }) {
  return (
    <section
      aria-label="Turnos de hoy"
      style={{
        margin: "10px 14px 0",
        padding: "12px 12px 10px",
        backgroundColor: colors.beige50,
        borderTop: `1px solid ${colors.hairline}`,
        borderBottom: `1px solid ${colors.hairline}`
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 10
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0",
            textTransform: "uppercase",
            color: colors.ink900
          }}
        >
          Turnos de hoy
        </h2>
        <span
          style={{
            flexShrink: 0,
            fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
            fontSize: 10,
            fontWeight: 400,
            letterSpacing: "0",
            color: colors.inkMuted
          }}
        >
          {formatDate(shifts.date)}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {ROLE_GROUPS.map((group) => (
          <RoleShiftList
            key={group.key}
            label={group.label}
            shifts={shifts[group.key] ?? []}
          />
        ))}
      </div>
    </section>
  );
}

function RoleShiftList({
  label,
  shifts
}: {
  label: string;
  shifts: TodayStaffShift[];
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "76px minmax(0, 1fr)",
        gap: 10,
        alignItems: "start"
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0",
          textTransform: "uppercase",
          color: colors.brown700,
          paddingTop: 1
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {shifts.length > 0 ? (
          shifts.map((shift) => <ShiftLine key={shiftKey(shift)} shift={shift} />)
        ) : (
          <span
            style={{
              fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
              fontSize: 10,
              lineHeight: "14px",
              letterSpacing: "0",
              color: colors.inkMuted
            }}
          >
            Sin turno cargado
          </span>
        )}
      </div>
    </div>
  );
}

function ShiftLine({ shift }: { shift: TodayStaffShift }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        columnGap: 10,
        rowGap: 2,
        alignItems: "baseline"
      }}
    >
      <span
        style={{
          minWidth: 0,
          fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
          fontSize: 17,
          lineHeight: "19px",
          fontWeight: 500,
          letterSpacing: "0",
          color: colors.ink900,
          overflowWrap: "anywhere"
        }}
      >
        {shift.staff_name}
      </span>
      <span
        style={{
          flexShrink: 0,
          fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
          fontSize: 11,
          lineHeight: "14px",
          letterSpacing: "0",
          color: colors.ink900
        }}
      >
        {shift.starts_local}-{shift.ends_local}
      </span>
      {shift.break_start_local && shift.break_end_local ? (
        <span
          style={{
            gridColumn: "1 / -1",
            fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
            fontSize: 10,
            lineHeight: "13px",
            letterSpacing: "0",
            color: colors.inkMuted
          }}
        >
          Pausa {shift.break_start_local}-{shift.break_end_local}
        </span>
      ) : null}
    </div>
  );
}

function shiftKey(shift: TodayStaffShift): string {
  return `${shift.type}:${shift.staff_id}:${shift.starts_local}:${shift.ends_local}`;
}

function formatDate(value: string): string {
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    weekday: "short",
    day: "2-digit",
    month: "short"
  })
    .format(new Date(Date.UTC(year, month - 1, day, 12)))
    .replace(/\./g, "");
}
