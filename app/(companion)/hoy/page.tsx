import { connection } from "next/server";
import { colors } from "../../../src/design/tokens";
import { getEditionParts } from "../../../src/lib/edition";
import { Greeting } from "./_components/Greeting";
import { HoyEdition } from "./_components/HoyEdition";
import { SlimMast } from "./_components/SlimMast";

export default async function HoyPage() {
  // Cache Components requires reading dynamic data before touching `new Date()`.
  await connection();
  const now = new Date();
  const edition = getEditionParts(now);

  return (
    <main
      id="panel-hoy"
      role="tabpanel"
      aria-labelledby="tab-hoy"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 76px)",
        backgroundColor: colors.beige100
      }}
    >
      <SlimMast
        volumeAndWeek={edition.volumeAndWeek}
        seasonAndCampaign={edition.seasonAndCampaign}
      />
      <Greeting shortDate={edition.shortDate} />
      <HoyEdition edition={edition} />
    </main>
  );
}
