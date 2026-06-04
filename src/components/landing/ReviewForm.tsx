"use client";

import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState
} from "react";
import { useFormStatus } from "react-dom";
import { submitReview, type ReviewFormState } from "../../server/reviews";

const initialState: ReviewFormState = { status: "idle" };

// Deriva's own rating vocabulary — the scale is anchored in brand voice, not
// generic stars. 1 = "Floja", 5 = "Un ritual" (a round worth repeating).
const RATING_WORDS = ["", "Floja", "Mejorable", "Bien", "Muy bien", "Un ritual"];
const MAX_BODY = 1200;

// Flat-top hexagon — the architectural mark that replaces the round dots.
function Hexagon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="resenas-hex__svg"
      width="44"
      height="40"
      viewBox="0 0 50 44"
      aria-hidden="true"
      focusable="false"
    >
      <polygon
        points="12.5,2 37.5,2 49,22 37.5,42 12.5,42 1,22"
        fill={filled ? "var(--green)" : "none"}
        stroke={filled ? "var(--green)" : "rgba(46,64,52,0.4)"}
        strokeWidth="2"
      />
    </svg>
  );
}

export function ReviewForm() {
  const [state, formAction] = useActionState(submitReview, initialState);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [placeOnly, setPlaceOnly] = useState(false);
  const [body, setBody] = useState("");
  const [maxDate, setMaxDate] = useState<string | undefined>();

  // Anti-spam: stamp mount time; the action rejects sub-3s submissions.
  const renderStarted = useRef<number>(0);
  useEffect(() => {
    renderStarted.current = Date.now();
    setMaxDate(new Date().toISOString().slice(0, 10));
  }, []);

  const ratingId = useId();
  const itemId = useId();
  const dateId = useId();
  const bodyId = useId();
  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();

  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const shown = hover || rating;

  if (state.status === "success") {
    return <ReviewSuccess />;
  }

  return (
    <form className="resenas-form" action={formAction} noValidate>
      <input type="hidden" name="rating_overall" value={rating || ""} />
      <input type="hidden" name="place_only" value={placeOnly ? "on" : ""} />
      <input
        type="hidden"
        name="render_started"
        value={renderStarted.current || ""}
      />

      {/* — 01 · Overall rating (the hero question) ————————————————— */}
      <fieldset className="resenas-row" aria-describedby={`${ratingId}-live`}>
        <span className="resenas-row__num" aria-hidden="true">
          01
        </span>
        <div className="resenas-row__body">
          <legend className="resenas-label">Tu nota</legend>
          <div className="resenas-hexrow">
            <div
              className="resenas-hex"
              role="radiogroup"
              aria-label="Valoración de 1 a 5"
              aria-required="true"
              onMouseLeave={() => setHover(0)}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} de 5 — ${RATING_WORDS[n]}`}
                  tabIndex={rating === n || (rating === 0 && n === 1) ? 0 : -1}
                  className="resenas-hex__btn"
                  onMouseEnter={() => setHover(n)}
                  onFocus={() => setHover(n)}
                  onBlur={() => setHover(0)}
                  onClick={() => setRating(n)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                      e.preventDefault();
                      setRating(Math.min(5, (rating || 0) + 1));
                    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                      e.preventDefault();
                      setRating(Math.max(1, (rating || 1) - 1));
                    }
                  }}
                >
                  <Hexagon filled={shown >= n} />
                </button>
              ))}
            </div>
            <span
              id={`${ratingId}-live`}
              className="resenas-hexrow__live"
              aria-live="polite"
            >
              {shown ? RATING_WORDS[shown] : "Sin nota"}
            </span>
          </div>
          {errors?.rating_overall && (
            <p className="resenas-error" role="alert">
              {errors.rating_overall}
            </p>
          )}
        </div>
      </fieldset>

      {/* — 02 · What they had ——————————————————————————————————— */}
      <div className="resenas-row">
        <span className="resenas-row__num" aria-hidden="true">
          02
        </span>
        <div className="resenas-row__body">
          <label className="resenas-label" htmlFor={itemId}>
            ¿Qué probaste?
          </label>
          <input
            id={itemId}
            name="item_name"
            type="text"
            maxLength={120}
            disabled={placeOnly}
            autoComplete="off"
            placeholder="Un flat white, el queque del día…"
            className="resenas-input"
            aria-invalid={Boolean(errors?.item)}
          />
          <label className="resenas-check resenas-check--inline">
            <input
              type="checkbox"
              checked={placeOnly}
              onChange={(e) => setPlaceOnly(e.target.checked)}
            />
            <span>Vine por el lugar, no por algo en particular</span>
          </label>
          {errors?.item && (
            <p className="resenas-error" role="alert">
              {errors.item}
            </p>
          )}
        </div>
      </div>

      {/* — 03 · Visit date ——————————————————————————————————————— */}
      <div className="resenas-row">
        <span className="resenas-row__num" aria-hidden="true">
          03
        </span>
        <div className="resenas-row__body">
          <label className="resenas-label" htmlFor={dateId}>
            ¿Cuándo nos visitaste?
          </label>
          <input
            id={dateId}
            name="visit_date"
            type="date"
            max={maxDate}
            required
            className="resenas-input resenas-input--date"
            aria-invalid={Boolean(errors?.visit_date)}
          />
          {errors?.visit_date && (
            <p className="resenas-error" role="alert">
              {errors.visit_date}
            </p>
          )}
        </div>
      </div>

      {/* — 04 · Body ————————————————————————————————————————————— */}
      <div className="resenas-row">
        <span className="resenas-row__num" aria-hidden="true">
          04
        </span>
        <div className="resenas-row__body">
          <label className="resenas-label" htmlFor={bodyId}>
            Tu reseña
          </label>
          <textarea
            id={bodyId}
            name="review_body"
            rows={3}
            maxLength={MAX_BODY}
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Cuéntanos cómo estuvo tu visita: el café, la atención, el ambiente…"
            className="resenas-textarea"
            aria-invalid={Boolean(errors?.review_body)}
            aria-describedby={`${bodyId}-count`}
          />
          <div className="resenas-textarea__foot">
            {errors?.review_body ? (
              <p className="resenas-error" role="alert">
                {errors.review_body}
              </p>
            ) : (
              <span aria-hidden="true" />
            )}
            <span
              id={`${bodyId}-count`}
              className={`resenas-count ${body.length > 0 && body.length < 20 ? "is-low" : ""}`}
            >
              {body.length}/{MAX_BODY}
            </span>
          </div>
        </div>
      </div>

      {/* — Optional contact ———————————————————————————————————————— */}
      <details className="resenas-optional">
        <summary>
          <span className="resenas-label">Si quieres, déjanos cómo ubicarte</span>
          <span className="resenas-optional__hint">Opcional</span>
        </summary>
        <div className="resenas-optional__body">
          <div className="resenas-field">
            <label className="resenas-label" htmlFor={nameId}>
              Tu nombre
            </label>
            <input
              id={nameId}
              name="display_name"
              type="text"
              maxLength={80}
              autoComplete="name"
              placeholder="Cómo quieres que te llamemos"
              className="resenas-input"
            />
          </div>
          <div className="resenas-field">
            <label className="resenas-label" htmlFor={emailId}>
              Correo
            </label>
            <input
              id={emailId}
              name="contact_email"
              type="email"
              maxLength={254}
              autoComplete="email"
              placeholder="hola@correo.cl"
              className="resenas-input"
              aria-invalid={Boolean(errors?.contact_email)}
            />
            {errors?.contact_email && (
              <p className="resenas-error" role="alert">
                {errors.contact_email}
              </p>
            )}
          </div>
          <div className="resenas-field">
            <label className="resenas-label" htmlFor={phoneId}>
              Teléfono
            </label>
            <input
              id={phoneId}
              name="contact_phone"
              type="tel"
              maxLength={20}
              autoComplete="tel"
              placeholder="+56 9 …"
              className="resenas-input"
              aria-invalid={Boolean(errors?.contact_phone)}
            />
            {errors?.contact_phone && (
              <p className="resenas-error" role="alert">
                {errors.contact_phone}
              </p>
            )}
          </div>
          <label className="resenas-check">
            <input type="checkbox" name="consent_to_contact" value="on" />
            <span>Deriva puede escribirme sobre esta reseña.</span>
          </label>
        </div>
      </details>

      {/* Honeypot — off-screen, harvested by bots, ignored by people. */}
      <div className="resenas-honeypot" aria-hidden="true">
        <label>
          Empresa
          <input name="company" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.status === "error" && !errors && (
        <p className="resenas-formerror" role="alert">
          {state.message}
        </p>
      )}

      <div className="resenas-submitblock">
        <SubmitButton />
        <p className="resenas-moderation">
          Leemos cada reseña antes de publicarla.
        </p>
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="resenas-submit" disabled={pending}>
      {pending ? "Enviando…" : "Enviar reseña"}
    </button>
  );
}

function ReviewSuccess() {
  return (
    <div className="resenas-success" role="status" aria-live="polite">
      <span className="resenas-success__mark" aria-hidden="true" />
      <p className="resenas-success__title">Gracias por contarnos.</p>
      <p className="resenas-success__body">
        Recibimos tu reseña. La leemos con calma antes de publicarla — así cada
        palabra que aparece en Deriva es de verdad.
      </p>
    </div>
  );
}
