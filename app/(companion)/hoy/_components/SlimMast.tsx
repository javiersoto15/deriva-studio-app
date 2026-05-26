import { colors } from "../../../../src/design/tokens";

export function SlimMast({
  volumeAndWeek,
  seasonAndCampaign
}: {
  volumeAndWeek: string;
  seasonAndCampaign: string;
}) {
  const labelStyle = {
    fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
    fontWeight: 500,
    fontSize: 10,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: colors.inkMuted
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 22px 0",
        gap: 12
      }}
    >
      <span style={labelStyle}>{volumeAndWeek}</span>
      <span style={labelStyle}>{seasonAndCampaign}</span>
    </div>
  );
}
