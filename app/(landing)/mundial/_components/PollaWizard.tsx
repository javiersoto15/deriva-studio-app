"use client";

import { useActionState, useMemo, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { submitPollaAction, type PollaFormState } from "../../../../src/server/world-cup";
import type { WorldCupDay } from "../../../../src/api/world-cup";
import { LogoLockup } from "../../../../src/ui/LogoLockup";
import { nationFlagIso } from "../../../../src/data/world-cup-nations";

const initialState: PollaFormState = { status: "idle" };
const MAX_SCORE = 19;

type Scores = Record<string, { home: number; away: number }>;

function timeLabel(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-CL", {
      timeZone: "America/Santiago",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function PollaWizard({ day, edition }: { day: WorldCupDay; edition: string }) {
  const [state, formAction] = useActionState(submitPollaAction, initialState);
  const renderStarted = useRef(Date.now());

  const matches = day.matches;
  const [scores, setScores] = useState<Scores>(() =>
    Object.fromEntries(matches.map((m) => [m.match_id, { home: 0, away: 0 }]))
  );
  // step: -1 = cover, 0..M-1 = match steps, M = review
  const [step, setStep] = useState(-1);

  const predictionsJson = useMemo(
    () =>
      JSON.stringify(
        matches.map((m) => ({
          match_id: m.match_id,
          home_score: scores[m.match_id].home,
          away_score: scores[m.match_id].away
        }))
      ),
    [matches, scores]
  );

  if (state.status === "success") {
    return <Submitted email={state.email} edition={edition} />;
  }
  if (state.status === "duplicate") {
    return (
      <Terminal
        edition={edition}
        title={<>Este cupón ya <em>se echó</em> hoy.</>}
        body="Solo un cupón por correo al día. Si quieres correr de nuevo, vuelve mañana con la próxima jornada."
      />
    );
  }
  if (state.status === "closed") {
    return (
      <Terminal
        edition={edition}
        title={<>El cupón ya <em>cerró</em>.</>}
        body="Las predicciones se cierran con el primer pitazo. Nos vemos en la próxima jornada."
      />
    );
  }

  const setScore = (id: string, side: "home" | "away", delta: number) =>
    setScores((s) => {
      const next = Math.min(MAX_SCORE, Math.max(0, s[id][side] + delta));
      return { ...s, [id]: { ...s[id], [side]: next } };
    });

  const closes = timeLabel(day.closes_at);

  // ----- Cover -----
  if (step === -1) {
    return (
      <div className="polla__rail polla__step">
        <Masthead edition={edition} />
        <h1 id="polla-title" className="polla__title">
          Adivina el marcador<br />
          <em>exacto.</em>
        </h1>

        <div className="polla__perf">
          <span className="polla__perf-line" />
          <span className="polla__perf-cut" aria-hidden="true">&#9986;</span>
          <span>Cupón del día · {matches.length} {matches.length === 1 ? "partido" : "partidos"}</span>
          <span className="polla__perf-line" />
        </div>

        <ul className="polla__rules">
          <li>Predice <b>todos los partidos</b> de hoy.</li>
          <li>Tiene que ser el <b>marcador exacto</b>.</li>
          <li>Le achuntas a todos &rarr; <b>café gratis</b> mañana.</li>
          {closes && <li>Cierra a las <b>{closes}</b>.</li>}
        </ul>

        <button
          type="button"
          className="polla__btn polla__btn--primary polla__cta"
          onClick={() => setStep(0)}
        >
          Llenar el cupón &rarr;
        </button>
      </div>
    );
  }

  // ----- Review + email -----
  if (step >= matches.length) {
    const error = state.status === "error" ? state.message : undefined;
    return (
      <div className="polla__rail polla__step">
        <Masthead edition={edition} />
        <div className="polla__slug">
          <span className="polla__slug-rule" />
          <span>§ Tu cupón</span>
        </div>

        <div className="polla__stub">
          {matches.map((m, i) => (
            <div className="polla__review-row" key={m.match_id}>
              <span className="polla__review-teams">
                <span className="polla__review-flags" aria-hidden="true">
                  <Flag team={m.home_team} size="sm" />
                  <Flag team={m.away_team} size="sm" />
                </span>
                {m.home_team} vs {m.away_team}
              </span>
              <span className="polla__review-score">
                {scores[m.match_id].home} <span className="polla__review-em">&mdash;</span> {scores[m.match_id].away}
              </span>
              <button type="button" className="polla__edit" onClick={() => setStep(i)}>
                &#9998; editar
              </button>
            </div>
          ))}
        </div>

        <form action={formAction} noValidate>
          <input type="hidden" name="predictions" value={predictionsJson} />
          <input type="hidden" name="render_started" value={renderStarted.current} />
          <div className="polla__hp" aria-hidden="true">
            <label htmlFor="polla-company">No llenar</label>
            <input id="polla-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="polla__field">
            <label className="polla__label" htmlFor="polla-email">Tu correo</label>
            <input
              id="polla-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              placeholder="hincha@correo.cl"
              className="polla__input"
              aria-invalid={Boolean(error)}
            />
            <p className="polla__consent">
              Lo usamos solo para avisarte si ganas. Lee cómo cuidamos tus datos en{" "}
              <a href="/privacidad">privacidad</a>.
            </p>
            {error && <p className="polla__error" role="alert">{error}</p>}
          </div>

          <div className="polla__nav">
            <button
              type="button"
              className="polla__btn polla__btn--ghost"
              onClick={() => setStep(matches.length - 1)}
            >
              &larr; Atrás
            </button>
            <SubmitButton />
          </div>
        </form>
      </div>
    );
  }

  // ----- Match step -----
  const m = matches[step];
  const s = scores[m.match_id];
  const kickoff = timeLabel(m.kickoff_at);
  const isLast = step + 1 === matches.length;
  return (
    <div className="polla__rail polla__step" key={m.match_id}>
      <Masthead edition={edition} />
      <p className="polla__progress">
        Partido {pad2(step + 1)} / {pad2(matches.length)}
      </p>
      <div className="polla__ruler" aria-hidden="true">
        {matches.map((mm, i) => (
          <span
            key={mm.match_id}
            className={`polla__tick${i <= step ? " polla__tick--filled" : ""}`}
          />
        ))}
      </div>
      {kickoff && <p className="polla__kickoff">Pitazo {kickoff}</p>}

      <div className="polla__cell">
        <div className="polla__fixture">
          <Stepper
            team={m.home_team}
            flagPosition="above"
            value={s.home}
            onDec={() => setScore(m.match_id, "home", -1)}
            onInc={() => setScore(m.match_id, "home", +1)}
          />
          <span className="polla__vs">vs</span>
          <Stepper
            team={m.away_team}
            flagPosition="below"
            value={s.away}
            onDec={() => setScore(m.match_id, "away", -1)}
            onInc={() => setScore(m.match_id, "away", +1)}
          />
        </div>
      </div>

      <div className="polla__nav">
        <button
          type="button"
          className="polla__btn polla__btn--ghost"
          onClick={() => setStep(step - 1)}
        >
          &larr; Atrás
        </button>
        <button
          type="button"
          className="polla__btn polla__btn--primary"
          onClick={() => setStep(step + 1)}
        >
          {isLast ? "Revisar →" : "Siguiente →"}
        </button>
      </div>
    </div>
  );
}

function Stepper({
  team,
  value,
  flagPosition,
  onDec,
  onInc
}: {
  team: string;
  value: number;
  flagPosition: "above" | "below";
  onDec: () => void;
  onInc: () => void;
}) {
  const teamBlock = (
    <p className="polla__team">
      {flagPosition === "above" && <Flag team={team} size="lg" />}
      <span className="polla__team-name">{team}</span>
      {flagPosition === "below" && <Flag team={team} size="lg" />}
    </p>
  );
  return (
    <div>
      {teamBlock}
      <div className="polla__stepper">
        <div className="polla__stepper-row">
          <button
            type="button"
            className="polla__step-btn"
            onClick={onDec}
            disabled={value <= 0}
            aria-label={`Menos un gol para ${team}`}
          >
            &minus;
          </button>
          <span className="polla__score" aria-live="polite">{value}</span>
          <button
            type="button"
            className="polla__step-btn"
            onClick={onInc}
            disabled={value >= MAX_SCORE}
            aria-label={`Un gol más para ${team}`}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="polla__btn polla__btn--primary" disabled={pending}>
      {pending ? "Echando…" : "Echar el cupón"}
    </button>
  );
}

function Masthead({ edition }: { edition: string }) {
  return (
    <>
      <div className="polla__logo">
        <LogoLockup isotipo={38} wordmarkSize={24} wordmarkLine={24} subSize={7.5} gap={10} />
      </div>
      <div className="polla__mast">
        <span>La Polla del Mundial &middot; {edition}</span>
        <span className="polla__mast-tick" />
      </div>
    </>
  );
}

function Flag({ team, size = "lg" }: { team: string; size?: "lg" | "sm" }) {
  const iso = nationFlagIso(team);
  const cls = `polla-flag polla-flag--${size}`;
  if (!iso) {
    const letter = team.trim().charAt(0).toUpperCase() || "?";
    return (
      <span className={`${cls} polla-flag--mono`} aria-hidden="true">
        {letter}
      </span>
    );
  }
  return (
    <span className={cls} aria-hidden="true">
      <span className={`fi fi-${iso}`} />
    </span>
  );
}

function Submitted({ email, edition }: { email: string; edition: string }) {
  const hora = timeLabel(new Date().toISOString());
  return (
    <div className="polla__rail">
      <Masthead edition={edition} />
      <div className="polla__terminal">
        <div className="polla__seal" aria-hidden="true">
          {hora ? <>Recibido<br />{hora}</> : "Recibido"}
        </div>
        <p className="polla__terminal-eyebrow">La Polla del Mundial</p>
        <h1 className="polla__terminal-title">Tu cupón quedó echado.</h1>
        <p className="polla__terminal-body">
          Si le achuntas a todos los marcadores de hoy, te llega un café gratis a{" "}
          <strong>{email}</strong> para mañana. Revisa tu correo después de los partidos.
        </p>
        <p className="polla__colophon">Magnere 1570 &middot; Providencia</p>
      </div>
    </div>
  );
}

function Terminal({
  edition,
  title,
  body
}: {
  edition: string;
  title: ReactNode;
  body: string;
}) {
  return (
    <div className="polla__rail">
      <Masthead edition={edition} />
      <div className="polla__terminal">
        <p className="polla__terminal-eyebrow">La Polla del Mundial</p>
        <h1 className="polla__terminal-title">{title}</h1>
        <p className="polla__terminal-body">{body}</p>
        <p className="polla__colophon">Magnere 1570 &middot; Providencia</p>
      </div>
    </div>
  );
}
