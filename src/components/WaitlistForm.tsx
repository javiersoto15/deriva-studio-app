"use client";

import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";
import { subscribeToWaitlist, type WaitlistState } from "../server/waitlist";
import { getWaitlistCopy, waitlistConfig } from "../config/waitlist";

const initialState: WaitlistState = { status: "idle" };

export function WaitlistForm() {
  const copy = getWaitlistCopy();
  const emailId = useId();
  const consentId = useId();
  const statusId = useId();
  const [state, formAction] = useActionState(subscribeToWaitlist, initialState);

  if (state.status === "success") {
    return (
      <div className="waitlist waitlist--success" role="status" aria-live="polite">
        <p className="waitlist__success-title">{state.title}</p>
        <p className="waitlist__success-body">{state.body}</p>
      </div>
    );
  }

  return (
    <form className="waitlist" action={formAction} noValidate>
      <p className="waitlist__intro">{copy.formIntro}</p>

      <div className="waitlist__field">
        <label htmlFor={emailId} className="waitlist__sr-only">
          {copy.formLabelEmail}
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          required
          autoComplete="email"
          maxLength={254}
          placeholder={copy.placeholderEmail}
          className="waitlist__input"
          aria-describedby={statusId}
        />
        <SubmitButton />
      </div>

      <div className="waitlist__consent">
        <input id={consentId} name="consent" type="checkbox" value="on" required />
        <label htmlFor={consentId}>
          {copy.consentLine}{" "}
          <a href={waitlistConfig.privacyPath} className="waitlist__link">
            {copy.privacyLinkLabel}
          </a>
          .
        </label>
      </div>

      {/* Honeypot — hidden from real users, harvested by bots */}
      <div className="waitlist__honeypot" aria-hidden="true">
        <label>
          Empresa
          <input name="company" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <p id={statusId} className="waitlist__status" aria-live="polite">
        {state.status === "error" ? state.message : ""}
      </p>
    </form>
  );
}

function SubmitButton() {
  const copy = getWaitlistCopy();
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="waitlist__submit" disabled={pending}>
      {pending ? copy.submitting : copy.submit}
    </button>
  );
}
