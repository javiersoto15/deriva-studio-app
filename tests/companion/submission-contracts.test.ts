import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { FormEvent } from "react";

import { ReceiptClaimForm } from "../../app/(companion)/sumar-visita/_components/ReceiptClaimForm";
import { ReviewSubmissionForm, type ReviewSubmissionLabels } from "../../app/(companion)/feedback/_components/ReviewSubmissionForm";
import { receiptClaimErrorKey } from "../../src/companion/receipt-claim-errors";
import { isPersistedPendingReview } from "../../src/companion/review-submission";
import { getNextRatingFromKey } from "../../src/ui/RatingScale";

test("receipt errors explain duplicate, refunded, policy, and retryable verification failures", () => {
  assert.equal(receiptClaimErrorKey(400, { error: "receipt has already been claimed" }), "error_duplicate");
  assert.equal(receiptClaimErrorKey(400, { error: "transaction contains a refunded amount" }), "error_refund");
  assert.equal(receiptClaimErrorKey(502, { error: "sumup transaction refund details are unavailable" }), "error_verifier");
  assert.equal(receiptClaimErrorKey(503, { error: "sumup transaction refund details are unavailable" }), "error_unavailable");
  assert.equal(receiptClaimErrorKey(403, { error: "member submissions are disabled" }), "error_policy");
  assert.equal(receiptClaimErrorKey(503, { error: "SumUp unavailable" }), "error_unavailable");
  assert.equal(receiptClaimErrorKey(401, null), "error_session");
});

test("review success envelope requires a nonempty persisted pending review ID", () => {
  assert.equal(isPersistedPendingReview({ id: "review-123", status: "pending" }), true);
  assert.equal(isPersistedPendingReview({ id: "  ", status: "pending" }), false);
  assert.equal(isPersistedPendingReview({ id: "review-123", status: "approved" }), false);
  assert.equal(isPersistedPendingReview(undefined), false);
});

const reviewLabels: ReviewSubmissionLabels = {
  backActivity: "← Actividad", skip: "Ahora no", eyebrow: "Tu visita", title: "Cuéntanos cómo estuvo.",
  intro: "Tu opinión nos ayuda a cuidar cada detalle.", visitDate: "Fecha de visita", rating: "¿Cómo estuvo tu experiencia?",
  ratingAria: "Calificación general de 1 a 5", ratingOptionLabels: [1, 2, 3, 4, 5].map((rating) => `Valoración ${rating} de 5`) as ReviewSubmissionLabels["ratingOptionLabels"], ratingLow: "No fue lo esperado", ratingHigh: "Me encantó",
  bodyLabel: "Tu comentario", bodyPlaceholder: "Comparte tu visita…", bodyHint: "Al menos 20 caracteres",
  sending: "Enviando…", submit: "Enviar opinión", submittedEyebrow: "Gracias por compartir",
  submittedTitle: "Recibimos tu opinión.", pendingModeration: "La revisaremos antes de publicarla.", backWallet: "Volver a tu cartera"
};

test("review form SSR keeps validation errors and renders confirmation only for a valid success envelope", () => {
  const props = {
    labels: reviewLabels,
    rating: 0,
    reviewBody: "",
    visitDate: "2026-10-14",
    todayDate: "2026-10-14",
    errorText: "Elige una calificación del 1 al 5.",
    pending: false,
    submitted: false,
    onRatingChange: () => {},
    onReviewBodyChange: () => {},
    onVisitDateChange: () => {},
    onSubmit: (event: FormEvent<HTMLFormElement>) => event.preventDefault()
  };
  const invalidHtml = renderToStaticMarkup(createElement(ReviewSubmissionForm, props));
  assert.match(invalidHtml, /role="alert"/);
  assert.match(invalidHtml, /Elige una calificación del 1 al 5/);
  assert.match(invalidHtml, /Enviar opinión/);

  const accepted = { id: "review-123", status: "pending" };
  assert.equal(isPersistedPendingReview(accepted), true);
  const successHtml = renderToStaticMarkup(createElement(ReviewSubmissionForm, { ...props, errorText: null, submitted: true }));
  assert.match(successHtml, /Recibimos tu opinión/);
  assert.match(successHtml, /La revisaremos antes de publicarla/);
  assert.doesNotMatch(successHtml, /<form/);
  assert.equal(isPersistedPendingReview({ status: "pending" }), false);
});

test("review rating options render localized accessible labels", () => {
  const localeCases = [
    { aria: "Overall rating from 1 to 5", optionLabels: [1, 2, 3, 4, 5].map((rating) => `Rating ${rating} of 5`), expected: [1, 2, 3, 4, 5].map((rating) => `Rating ${rating} of 5`) },
    { aria: "Calificación general de 1 a 5", optionLabels: [1, 2, 3, 4, 5].map((rating) => `Valoración ${rating} de 5`), expected: [1, 2, 3, 4, 5].map((rating) => `Valoración ${rating} de 5`) },
    { aria: "Avaliação geral de 1 a 5", optionLabels: [1, 2, 3, 4, 5].map((rating) => `Nota ${rating} de 5`), expected: [1, 2, 3, 4, 5].map((rating) => `Nota ${rating} de 5`) }
  ];

  for (const locale of localeCases) {
    const html = renderToStaticMarkup(createElement(ReviewSubmissionForm, {
      labels: { ...reviewLabels, ratingAria: locale.aria, ratingOptionLabels: locale.optionLabels as ReviewSubmissionLabels["ratingOptionLabels"] },
      rating: 2,
      reviewBody: "",
      visitDate: "2026-10-14",
      todayDate: "2026-10-14",
      errorText: null,
      pending: false,
      submitted: false,
      onRatingChange: () => {},
      onReviewBodyChange: () => {},
      onVisitDateChange: () => {},
      onSubmit: (event: FormEvent<HTMLFormElement>) => event.preventDefault()
    }));

    const optionAriaLabels = [...html.matchAll(/role="radio"[^>]*aria-label="([^"]+)"/g)].map((match) => match[1]);
    assert.deepEqual(optionAriaLabels, locale.expected);
  }
});

test("rating keyboard commands map to standard next and wrapped options", () => {
  assert.equal(getNextRatingFromKey(3, "ArrowRight"), 4);
  assert.equal(getNextRatingFromKey(3, "ArrowDown"), 4);
  assert.equal(getNextRatingFromKey(3, "ArrowLeft"), 2);
  assert.equal(getNextRatingFromKey(3, "ArrowUp"), 2);
  assert.equal(getNextRatingFromKey(1, "ArrowLeft"), 5);
  assert.equal(getNextRatingFromKey(5, "ArrowRight"), 1);
  assert.equal(getNextRatingFromKey(3, "Home"), 1);
  assert.equal(getNextRatingFromKey(3, "End"), 5);
  assert.equal(getNextRatingFromKey(3, "Tab"), null);
});

test("receipt submission form accepts only the SumUp transaction code", () => {
  const labels = {
    codeLabel: "Código de transacción",
    verificationNote: "Verificamos con SumUp.",
    submit: "Verificar y sumar puntos",
    verifying: "Verificando…",
    errors: {
      error_empty: "Ingresa un código.", error_refund: "No suma por una devolución.",
      error_duplicate: "Ya se usó.", error_too_old: "Fuera de plazo.", error_future: "Fecha inválida.",
      error_not_successful: "No fue exitosa.", error_currency: "Moneda no válida.", error_policy: "No permitido.",
      error_invalid: "Código inválido.", error_session: "Inicia sesión.", error_not_found: "No encontrada.",
      error_verifier: "No se pudo verificar.", error_unavailable: "Pausa.", error_generic: "Intenta de nuevo."
    }
  };
  const html = renderToStaticMarkup(createElement(ReceiptClaimForm, {
    code: "SUMUP-123", errorKey: null, pending: false, labels,
    onCodeChange: () => {}, onSubmit: (event) => event.preventDefault()
  }));
  assert.match(html, /name="transaction_code"/);
  assert.match(html, /value="SUMUP-123"/);
  assert.match(html, /Verificar y sumar puntos/);
  assert.doesNotMatch(html, /amount_clp|purchase_at|type="number"|type="date"/);

  const errorHtml = renderToStaticMarkup(createElement(ReceiptClaimForm, {
    code: "SUMUP-123", errorKey: "error_refund", pending: false, labels,
    onCodeChange: () => {}, onSubmit: (event) => event.preventDefault()
  }));
  assert.match(errorHtml, /role="alert"/);
  assert.match(errorHtml, /No suma por una devolución/);
});
