import { QRCodeSVG } from "qrcode.react";
import { colors } from "../design/tokens";

export type RewardQrCardProps = {
  value: string;
};

// Scannable QR for wallet reward redemption. The customer-facing screen shows
// the short code separately, so the QR only needs the staff redemption URL.
export function RewardQrCard({ value }: RewardQrCardProps) {
  return (
    <div
      style={{
        width: 280,
        height: 280,
        borderRadius: 18,
        backgroundColor: colors.beige100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }}
    >
      <QRCodeSVG
        value={value}
        size={232}
        level="M"
        bgColor={colors.beige100}
        fgColor={colors.ink900}
        aria-label="Código QR de recompensa"
        style={{ display: "block", width: 232, height: 232 }}
      />
    </div>
  );
}
