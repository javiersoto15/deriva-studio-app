"use client";

import type { FormEvent } from "react";
import { colors } from "../../../../src/design/tokens";
import { Button } from "../../../../src/ui/Button";
import { Input } from "../../../../src/ui/Input";
import type { ReceiptErrorKey } from "../../../../src/companion/receipt-claim-errors";

export type ReceiptClaimFormLabels = {
  codeLabel: string;
  verificationNote: string;
  submit: string;
  verifying: string;
  errors: Record<ReceiptErrorKey | "error_empty", string>;
};

export function ReceiptClaimForm({
  code,
  errorKey,
  pending,
  labels,
  onCodeChange,
  onSubmit
}: {
  code: string;
  errorKey: ReceiptErrorKey | "error_empty" | null;
  pending: boolean;
  labels: ReceiptClaimFormLabels;
  onCodeChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Input
        type="text"
        name="transaction_code"
        label={labels.codeLabel}
        value={code}
        onChange={(event) => onCodeChange(event.target.value)}
        placeholder="TEYW7E8GR4"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
      />
      {errorKey ? (
        <p role="alert" style={{ margin: 0, fontFamily: "var(--font-tracked), sans-serif", fontSize: 13, lineHeight: "20px", color: colors.brown700 }}>
          {labels.errors[errorKey]}
        </p>
      ) : null}
      <p style={{ margin: 0, padding: "14px 16px", borderRadius: 4, background: "rgba(94,35,15,0.06)", fontFamily: "var(--font-mono), monospace", fontSize: 11, lineHeight: "18px", color: colors.brown700 }}>
        {labels.verificationNote}
      </p>
      <Button type="submit" variant="primary" style={{ width: "100%" }} disabled={pending ? "state" : false}>
        {pending ? labels.verifying : labels.submit}
      </Button>
    </form>
  );
}
