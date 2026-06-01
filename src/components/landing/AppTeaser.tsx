import { WaitlistForm } from "../WaitlistForm";

const TOOLKIT = [
  { label: "Tu carta", note: "la carta completa, siempre contigo." },
  { label: "Tu código", note: "suma cada visita con tu código de miembro." },
  { label: "Tus recompensas", note: "tu primera taza y todo lo que viene." }
];

/**
 * Companion app teaser — coming-soon block that captures interest into the
 * dedicated companion Resend audience (campaign="companion"). Rendered both as
 * a section on the homepage and as the standalone /companion signup page.
 */
export function AppTeaser({
  headingId,
  headingLevel: Heading = "h2"
}: {
  headingId: string;
  headingLevel?: "h1" | "h2";
}) {
  return (
    <div className="app-teaser__inner">
      <div className="landing-slug landing-slug--on-dark">
        <span className="landing-slug__rule" aria-hidden="true" />
        <span>§ La app de Deriva</span>
      </div>

      <Heading id={headingId} className="landing-display landing-display--on-dark app-teaser__headline">
        Crea tu propia
        <br />
        <em>Deriva.</em>
      </Heading>

      <p className="app-teaser__lede">
        Tu carta, tu código y tus recompensas. Todo en un lugar.
      </p>

      <ul className="app-teaser__toolkit">
        {TOOLKIT.map((item) => (
          <li key={item.label}>
            <span className="app-teaser__toolkit-label">{item.label}</span>
            {" — "}
            {item.note}
          </li>
        ))}
      </ul>

      <WaitlistForm campaign="companion" />

      <p className="app-teaser__note">Muy pronto · no te llenamos el correo</p>
    </div>
  );
}
