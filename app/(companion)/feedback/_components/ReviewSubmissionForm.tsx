"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { colors } from "../../../../src/design/tokens";
import { Button } from "../../../../src/ui/Button";
import { RatingScale } from "../../../../src/ui/RatingScale";

export type ReviewSubmissionLabels = {
  backActivity: string;
  skip: string;
  eyebrow: string;
  title: string;
  intro: string;
  visitDate: string;
  rating: string;
  ratingAria: string;
  ratingOptionLabels: [string, string, string, string, string];
  ratingLow: string;
  ratingHigh: string;
  bodyLabel: string;
  bodyPlaceholder: string;
  bodyHint: string;
  sending: string;
  submit: string;
  submittedEyebrow: string;
  submittedTitle: string;
  pendingModeration: string;
  backWallet: string;
};

export function ReviewSubmissionForm({
  labels,
  rating,
  reviewBody,
  visitDate,
  todayDate,
  errorText,
  pending,
  submitted,
  onRatingChange,
  onReviewBodyChange,
  onVisitDateChange,
  onSubmit
}: {
  labels: ReviewSubmissionLabels;
  rating: number;
  reviewBody: string;
  visitDate: string;
  todayDate: string;
  errorText: string | null;
  pending: boolean;
  submitted: boolean;
  onRatingChange: (rating: number) => void;
  onReviewBodyChange: (body: string) => void;
  onVisitDateChange: (date: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <main style={{ flex: 1, padding: "calc(env(safe-area-inset-top) + 24px) 24px calc(env(safe-area-inset-bottom) + 96px)", display: "flex", flexDirection: "column", gap: 24 }}>
      {submitted ? (
        <section aria-live="polite" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <span style={eyebrowStyle}>{labels.submittedEyebrow}</span>
          <h1 style={titleStyle}>{labels.submittedTitle}</h1>
          <p style={bodyStyle}>{labels.pendingModeration}</p>
          <Link href="/cartera" style={primaryLinkStyle}>{labels.backWallet}</Link>
        </section>
      ) : (
        <>
          <header style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <Link href="/actividad" style={headerLinkStyle}>{labels.backActivity}</Link>
            <Link href="/cartera" style={headerLinkStyle}>{labels.skip}</Link>
          </header>

          <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={eyebrowStyle}>{labels.eyebrow}</span>
            <h1 style={titleStyle}>{labels.title}</h1>
            <p style={bodyStyle}>{labels.intro}</p>
          </section>

          <form onSubmit={onSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label htmlFor="feedback-visit-date" style={eyebrowStyle}>{labels.visitDate}</label>
              <input id="feedback-visit-date" type="date" required max={todayDate || undefined} value={visitDate} onChange={(event) => onVisitDateChange(event.target.value)} style={dateInputStyle} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={eyebrowStyle}>{labels.rating}</span>
              <RatingScale value={rating} onChange={onRatingChange} ariaLabel={labels.ratingAria} optionLabels={labels.ratingOptionLabels} labels={[labels.ratingLow, labels.ratingHigh]} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label htmlFor="feedback-body" style={eyebrowStyle}>{labels.bodyLabel}</label>
              <textarea
                id="feedback-body"
                value={reviewBody}
                onChange={(event) => onReviewBodyChange(event.target.value)}
                placeholder={labels.bodyPlaceholder}
                minLength={20}
                maxLength={1200}
                rows={5}
                aria-describedby="feedback-body-hint feedback-body-count"
                style={textareaStyle}
              />
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span id="feedback-body-hint" style={hintStyle}>{labels.bodyHint}</span>
                <span id="feedback-body-count" aria-live="polite" style={countStyle}>{reviewBody.trim().length}/1200</span>
              </div>
            </div>

            {errorText ? <p role="alert" style={errorStyle}>{errorText}</p> : null}

            <Button type="submit" variant="primary" style={{ width: "100%" }} disabled={pending ? "state" : false}>
              {pending ? labels.sending : labels.submit}
            </Button>
          </form>
        </>
      )}
    </main>
  );
}

const headerLinkStyle: React.CSSProperties = { minHeight: 44, display: "inline-flex", alignItems: "center", fontFamily: "var(--font-display), serif", fontStyle: "italic", fontSize: 15, color: colors.brown700, textDecoration: "none" };
const eyebrowStyle: React.CSSProperties = { fontFamily: "var(--font-tracked), sans-serif", fontWeight: 600, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: colors.inkMuted };
const titleStyle: React.CSSProperties = { margin: 0, fontFamily: "var(--font-display), serif", fontStyle: "italic", fontWeight: 300, fontSize: 36, lineHeight: "42px", letterSpacing: "-0.01em", color: colors.ink900, overflowWrap: "anywhere" };
const bodyStyle: React.CSSProperties = { margin: 0, fontFamily: "var(--font-tracked), sans-serif", fontSize: 14, lineHeight: "21px", color: colors.ink900 };
const dateInputStyle: React.CSSProperties = { maxWidth: "100%", minHeight: 44, border: "none", borderBottom: `1px solid ${colors.hairline}`, borderRadius: 0, background: "transparent", color: colors.ink900, fontFamily: "var(--font-mono), monospace", fontSize: 14 };
const textareaStyle: React.CSSProperties = { width: "100%", maxWidth: "100%", border: "none", borderBottom: `1px solid ${colors.hairline}`, borderRadius: 0, background: "transparent", color: colors.ink900, fontFamily: "var(--font-display), serif", fontSize: 17, lineHeight: "24px", padding: "8px 0", resize: "vertical", outlineOffset: 3 };
const hintStyle: React.CSSProperties = { fontFamily: "var(--font-mono), monospace", fontSize: 10, lineHeight: "15px", color: colors.inkMuted };
const countStyle: React.CSSProperties = { ...hintStyle, whiteSpace: "nowrap" };
const errorStyle: React.CSSProperties = { margin: 0, fontFamily: "var(--font-tracked), sans-serif", fontSize: 13, lineHeight: "20px", color: colors.brown700 };
const primaryLinkStyle: React.CSSProperties = { alignSelf: "flex-start", display: "inline-flex", alignItems: "center", minHeight: 44, color: colors.brown700, fontFamily: "var(--font-tracked), sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", textDecoration: "none" };
