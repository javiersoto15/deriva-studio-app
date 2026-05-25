import { connection } from "next/server";
import { getCafeDelDia } from "../../../src/data/today/cafe-del-dia";
import { getRotacion } from "../../../src/data/today/rotacion";
import { getBarista } from "../../../src/data/today/barra";
import { getNota } from "../../../src/data/today/nota";
import { colors } from "../../../src/design/tokens";
import { getEditionParts } from "../../../src/lib/edition";
import { isOpenNow } from "../../../src/lib/open-now";
import { BarraTile } from "./_components/BarraTile";
import { Greeting } from "./_components/Greeting";
import { HeroCafeDelDia } from "./_components/HeroCafeDelDia";
import { MetricStrip } from "./_components/MetricStrip";
import { NotaTile } from "./_components/NotaTile";
import { RotacionTile } from "./_components/RotacionTile";
import { SlimMast } from "./_components/SlimMast";

export default async function HoyPage() {
  // Cache Components requires reading dynamic data before touching `new Date()`.
  await connection();
  const now = new Date();
  const edition = getEditionParts(now);
  const cafeDelDia = getCafeDelDia(edition.weekday);
  const rotacion = getRotacion(edition.weekday);
  const barista = getBarista(edition.weekday);
  const nota = getNota(edition.isoWeek);
  const isOpen = isOpenNow(now);
  // Saturday closes at 21:00, weekdays at 21:00, Sundays closed → next 08:00.
  const closesAt = isOpen ? "21:00" : "08:00";
  const openLabel = isOpen ? "Abierto" : "Cerrado";

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
        paddingBottom: "calc(env(safe-area-inset-bottom) + 96px)",
        backgroundColor: colors.beige100
      }}
    >
      <SlimMast
        volumeAndWeek={edition.volumeAndWeek}
        seasonAndCampaign={edition.seasonAndCampaign}
      />
      <Greeting shortDate={edition.shortDate} />
      <HeroCafeDelDia origin={cafeDelDia} />

      <div style={{ display: "flex", gap: 10, padding: "16px 16px 0" }}>
        <RotacionTile origins={rotacion} />
        <BarraTile barista={barista} />
      </div>

      <NotaTile nota={nota} />

      <MetricStrip
        openLabel={openLabel}
        closesAt={closesAt}
        isOpen={isOpen}
        lastOrder={{ name: "Flat white.", when: "sáb · 10:14" }}
      />
    </main>
  );
}
