"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import { useSubmitReceiptClaim, type ReceiptClaimResponse } from "../../../src/api/hooks";
import { receiptClaimErrorKey } from "../../../src/companion/receipt-claim-errors";
import { colors } from "../../../src/design/tokens";
import { Button } from "../../../src/ui/Button";
import { Eyebrow } from "../../../src/ui/Eyebrow";
import { ReceiptClaimForm } from "./_components/ReceiptClaimForm";

export default function SumarVisitaPage() {
  const t = useTranslations("receiptClaim");
  const submit = useSubmitReceiptClaim();
  const [code, setCode] = useState("");
  const [errorKey, setErrorKey] = useState<ReturnType<typeof receiptClaimErrorKey> | "error_empty" | null>(null);
  const [result, setResult] = useState<ReceiptClaimResponse | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorKey(null);
    setResult(null);
    const transactionCode = code.trim();
    if (!transactionCode) {
      setErrorKey("error_empty");
      return;
    }
    try {
      const verified = await submit.mutateAsync({ transaction_code: transactionCode });
      setResult(verified);
    } catch (error) {
      const status = error && typeof error === "object" && typeof (error as { status?: unknown }).status === "number"
        ? (error as { status: number }).status
        : null;
      const body = error && typeof error === "object" ? (error as { body?: unknown }).body : null;
      setErrorKey(receiptClaimErrorKey(status, body));
    }
  }

  return (
    <main style={{ flex: 1, padding: "calc(env(safe-area-inset-top) + 24px) 24px calc(env(safe-area-inset-bottom) + 96px)", display: "flex", flexDirection: "column", gap: 24 }}>
      <Link href="/cartera" className="tap-target" style={{ textDecoration: "none", margin: "-10px -8px", alignSelf: "flex-start" }}>
        <Eyebrow>← {t("wallet")}</Eyebrow>
      </Link>

      {result ? (
        <section aria-live="polite" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Eyebrow>{t("verified_eyebrow")}</Eyebrow>
          <h1 style={titleStyle}>{t("verified_title")}</h1>
          <p style={bodyStyle}>{t("verified_body")}</p>
          <p style={{ ...bodyStyle, color: colors.green, fontFamily: "var(--font-mono), monospace", fontSize: 20 }}>
            +{result.ledger_entry.points} pts
          </p>
          <Link href="/actividad" style={linkStyle}>{t("view_activity")}</Link>
          <Button type="button" variant="secondary" style={{ width: "100%" }} onClick={() => { setResult(null); setCode(""); }}>
            {t("another_code")}
          </Button>
        </section>
      ) : (
        <>
          <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h1 style={titleStyle}>{t("title")}</h1>
            <p style={bodyStyle}>{t("intro")}</p>
          </section>

          <ReceiptClaimForm
            code={code}
            errorKey={errorKey}
            pending={submit.isPending}
            onCodeChange={(value) => { setErrorKey(null); setCode(value); }}
            onSubmit={onSubmit}
            labels={{
              codeLabel: t("code_label"),
              verificationNote: t("verification_note"),
              submit: t("submit"),
              verifying: t("verifying"),
              errors: {
                error_empty: t("error_empty"),
                error_refund: t("error_refund"),
                error_duplicate: t("error_duplicate"),
                error_too_old: t("error_too_old"),
                error_future: t("error_future"),
                error_not_successful: t("error_not_successful"),
                error_currency: t("error_currency"),
                error_policy: t("error_policy"),
                error_invalid: t("error_invalid"),
                error_session: t("error_session"),
                error_not_found: t("error_not_found"),
                error_verifier: t("error_verifier"),
                error_unavailable: t("error_unavailable"),
                error_generic: t("error_generic")
              }
            }}
          />
        </>
      )}
    </main>
  );
}

const titleStyle: React.CSSProperties = { margin: 0, fontFamily: "var(--font-display), serif", fontStyle: "italic", fontWeight: 300, fontSize: 36, lineHeight: "42px", letterSpacing: "-0.01em", color: colors.ink900 };
const bodyStyle: React.CSSProperties = { margin: 0, fontFamily: "var(--font-tracked), sans-serif", fontSize: 14, lineHeight: "21px", color: colors.ink900 };
const linkStyle: React.CSSProperties = { alignSelf: "flex-start", color: colors.brown700, textDecoration: "none", fontFamily: "var(--font-tracked), sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" };
