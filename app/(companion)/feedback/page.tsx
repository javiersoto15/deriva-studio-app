"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { useSubmitReview } from "../../../src/api/hooks";
import { useActiveBackendLocale } from "../../../src/i18n/use-active-locale";
import { santiagoDateKey } from "../../../src/companion/menu-discovery";
import { isPersistedPendingReview } from "../../../src/companion/review-submission";
import { ReviewSubmissionForm, type ReviewSubmissionLabels } from "./_components/ReviewSubmissionForm";

const MIN_REVIEW_LENGTH = 20;
const MAX_REVIEW_LENGTH = 1200;

export default function FeedbackPage() {
  const t = useTranslations("feedback");
  const locale = useActiveBackendLocale();
  const submit = useSubmitReview();
  const [rating, setRating] = useState(0);
  const [reviewBody, setReviewBody] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [todayDate, setTodayDate] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Resolve the date after hydration so server and browser clocks cannot
  // disagree around Santiago midnight.
  useEffect(() => {
    const date = santiagoDateKey(new Date());
    setTodayDate(date);
    setVisitDate(date);
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorText(null);
    const trimmed = reviewBody.trim();
    if (rating < 1 || rating > 5) {
      setErrorText(t("rating_required"));
      return;
    }
    if (!visitDate || (todayDate && visitDate > todayDate)) {
      setErrorText(t("date_invalid"));
      return;
    }
    if (trimmed.length < MIN_REVIEW_LENGTH) {
      setErrorText(t("body_too_short", { count: MIN_REVIEW_LENGTH }));
      return;
    }
    if (trimmed.length > MAX_REVIEW_LENGTH) {
      setErrorText(t("body_too_long", { count: MAX_REVIEW_LENGTH }));
      return;
    }

    try {
      const review = await submit.mutateAsync({
        rating_overall: rating,
        review_body: trimmed,
        visit_date: visitDate,
        review_context: "place_only",
        language: locale
      });
      if (!isPersistedPendingReview(review)) throw new Error("Review response did not include a pending review ID");
      setSubmitted(true);
    } catch {
      // Keep the date, rating, and note in place so the member can retry.
      setErrorText(t("submit_error"));
    }
  }

  return (
    <ReviewSubmissionForm
      rating={rating}
      reviewBody={reviewBody}
      visitDate={visitDate}
      todayDate={todayDate}
      errorText={errorText}
      pending={submit.isPending}
      submitted={submitted}
      onRatingChange={setRating}
      onReviewBodyChange={(body) => { setErrorText(null); setReviewBody(body.slice(0, MAX_REVIEW_LENGTH)); }}
      onVisitDateChange={(date) => { setErrorText(null); setVisitDate(date); }}
      onSubmit={onSubmit}
      labels={{
        backActivity: t("back_activity"),
        skip: t("skip"),
        eyebrow: t("eyebrow"),
        title: t("title"),
        intro: t("intro"),
        visitDate: t("visit_date"),
        rating: t("rating"),
        ratingAria: t("rating_aria"),
        ratingOptionLabels: [1, 2, 3, 4, 5].map((option) => t("rating_option", { rating: option })) as ReviewSubmissionLabels["ratingOptionLabels"],
        ratingLow: t("rating_low"),
        ratingHigh: t("rating_high"),
        bodyLabel: t("body_label"),
        bodyPlaceholder: t("body_placeholder"),
        bodyHint: t("body_hint", { count: MIN_REVIEW_LENGTH }),
        sending: t("sending"),
        submit: t("submit"),
        submittedEyebrow: t("submitted_eyebrow"),
        submittedTitle: t("submitted_title"),
        pendingModeration: t("pending_moderation"),
        backWallet: t("back_wallet")
      }}
    />
  );
}
