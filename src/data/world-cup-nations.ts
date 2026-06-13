// World Cup 2026 nation → ISO 3166-1 alpha-2 map (lowercase), keyed by the
// SPANISH team name as the backend returns it. Used only to decorate the
// predictor coupon with flag-icons SVGs; flags are derived from the team NAME,
// never from a hardcoded match list. Data-only: nationFlagIso never throws and
// returns null for any unmapped name so the UI can fall back to a monogram.

export const NATION_ISO2: Record<string, string> = {
  Argentina: "ar",
  Chile: "cl",
  Brasil: "br",
  Uruguay: "uy",
  España: "es",
  Francia: "fr",
  Portugal: "pt",
  Ghana: "gh",
  Alemania: "de",
  Inglaterra: "gb-eng",
  "Estados Unidos": "us",
  México: "mx",
  "Países Bajos": "nl",
  Croacia: "hr",
  Japón: "jp",
  "Corea del Sur": "kr",
  Marruecos: "ma",
  Senegal: "sn",
  Suiza: "ch",
  Bélgica: "be",
  Polonia: "pl",
  Australia: "au",
  Ecuador: "ec",
  Canadá: "ca",
  Catar: "qa",
  "Arabia Saudita": "sa",
  Irán: "ir",
  Camerún: "cm",
  Serbia: "rs",
  Túnez: "tn",
  "Costa Rica": "cr",
  Dinamarca: "dk",
  Colombia: "co",
  Perú: "pe",
  Italia: "it",
  Nigeria: "ng",
  Egipto: "eg"
};

// Case/diacritic-insensitive lookup so minor backend casing variances still match.
const NORMALIZED: Record<string, string> = Object.fromEntries(
  Object.entries(NATION_ISO2).map(([name, iso]) => [normalize(name), iso])
);

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Returns the lowercase ISO2 (e.g. "ar", "gb-eng") for a team name, or null. */
export function nationFlagIso(team: string): string | null {
  if (!team) return null;
  return NATION_ISO2[team.trim()] ?? NORMALIZED[normalize(team)] ?? null;
}
