"use client";

import { QRCodeSVG } from "qrcode.react";
import { colors } from "../design/tokens";

export type QrMockCardProps = {
  // Payload encoded into the scannable QR. Use the rotating member token when
  // available; falls back to the backup code so the card always renders.
  value: string;
  // Human-readable code shown below the perforation for manual entry.
  backupCode: string;
};

export function QrMockCard({ value, backupCode }: QrMockCardProps) {
  return (
    <div
      style={{
        backgroundColor: colors.beige100,
        borderRadius: 16,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        width: "100%",
        maxWidth: 280,
        margin: "0 auto"
      }}
    >
      <QRCodeSVG
        value={value}
        size={220}
        level="M"
        bgColor={colors.beige100}
        fgColor={colors.ink900}
        style={{ width: "100%", height: "auto", display: "block" }}
      />

      <div
        style={{
          width: "100%",
          borderTop: `1px dashed ${colors.hairlineMark}`,
          marginTop: 4
        }}
      />

      <div
        style={{
          fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
          fontWeight: 600,
          fontSize: 10,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: colors.inkMuted
        }}
      >
        O entrega este código
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 20,
          letterSpacing: "0.16em",
          color: colors.brown700,
          whiteSpace: "nowrap"
        }}
      >
        {backupCode.split("").join(" ")}
      </div>
    </div>
  );
}
