"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { readDraft, writeDraft } from "../../../../src/lib/onboardingDraft";
import { colors } from "../../../../src/design/tokens";
import { Button } from "../../../../src/ui/Button";
import { Chip } from "../../../../src/ui/Chip";
import { Eyebrow } from "../../../../src/ui/Eyebrow";
import { Input } from "../../../../src/ui/Input";
import { StepProgress } from "../../../../src/ui/StepProgress";

// Onboarding preferences (step 03/04) — matches Paper artboard ZP-0.
const DRINKS = ["Cortado", "Flat white", "Americano", "Filtrado V60", "Latte", "Mate"];
const MILKS = ["Entera", "Avena", "Almendra", "Sin leche"];

export default function PreferencesPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [drink, setDrink] = useState<string>("Cortado");
  const [milk, setMilk] = useState<string>("Avena");
  const [note, setNote] = useState("");

  // Hydrate from sessionStorage so a back-nav from consent keeps the form.
  useEffect(() => {
    const draft = readDraft();
    if (draft.name) setName(draft.name);
    if (draft.favorite_drink) setDrink(draft.favorite_drink);
    if (draft.milk) setMilk(draft.milk);
    if (draft.note) setNote(draft.note);
  }, []);

  function onContinue() {
    // No API call here — the member row doesn't exist yet. The full envelope
    // (name + preferences + consent) is POSTed to /members in the consent
    // step. We just persist the draft so consent has everything it needs.
    writeDraft({ name: name.trim(), favorite_drink: drink, milk, note });
    router.push("/ingresar/consentimiento");
  }

  return (
    <main
      style={{
        flex: 1,
        padding:
          "max(24px, calc(env(safe-area-inset-top) + 16px)) 24px max(32px, calc(env(safe-area-inset-bottom) + 24px))",
        display: "flex",
        flexDirection: "column",
        gap: 24
      }}
    >
      <StepProgress
        current={3}
        total={4}
        backHref="/ingresar/verificar"
      />

      <Eyebrow>Paso 03 · Preferencias</Eyebrow>

      <h1
        style={{
          margin: 0,
          fontFamily: "var(--font-display), serif",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: 36,
          lineHeight: "42px",
          letterSpacing: "-0.01em",
          color: colors.ink900
        }}
      >
        ¿Cómo tomas tu café?
      </h1>

      <p
        style={{
          margin: 0,
          fontFamily: "Poppins, sans-serif",
          fontSize: 14,
          lineHeight: "21px",
          color: colors.ink900
        }}
      >
        Solo si quieres. Nos ayuda a recordarte tu usual en la barra.
      </p>

      <Input
        label="Tu nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="¿Cómo te llamamos?"
        autoComplete="given-name"
      />

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <span
          id="label-drink"
          style={{
            fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: colors.inkMuted
          }}
        >
          Bebida favorita
        </span>
        <div
          role="radiogroup"
          aria-labelledby="label-drink"
          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
        >
          {DRINKS.map((d) => (
            <Chip
              key={d}
              role="radio"
              selected={d === drink}
              onClick={() => setDrink(d)}
              aria-label={d}
            >
              {d}
            </Chip>
          ))}
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <span
          id="label-milk"
          style={{
            fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: colors.inkMuted
          }}
        >
          Leche
        </span>
        <div
          role="radiogroup"
          aria-labelledby="label-milk"
          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
        >
          {MILKS.map((m) => (
            <Chip
              key={m}
              role="radio"
              selected={m === milk}
              onClick={() => setMilk(m)}
              aria-label={m}
            >
              {m}
            </Chip>
          ))}
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label
          htmlFor="pref-note"
          style={{
            fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: colors.inkMuted
          }}
        >
          Una nota tuya
        </label>
        <textarea
          id="pref-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder='ej. "Sin azúcar después de las 16"'
          rows={2}
          aria-describedby="pref-note-caption"
          style={{
            background: "transparent",
            border: "none",
            borderBottom: `1px solid ${colors.hairline}`,
            padding: "8px 0",
            outline: "none",
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 16,
            color: colors.ink900,
            resize: "none"
          }}
        />
        <span
          id="pref-note-caption"
          style={{
            fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: colors.inkMuted
          }}
        >
          Opcional · Lo vemos en barra
        </span>
      </section>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        <Button
          variant="primary"
          onClick={onContinue}
          style={{ width: "100%" }}
          disabled={name.trim().length === 0 ? "recoverable" : false}
        >
          Continuar
        </Button>
        <p
          style={{
            margin: 0,
            textAlign: "center",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            color: colors.inkMuted
          }}
        >
          Puedes cambiarlo cuando quieras desde tu perfil.
        </p>
      </div>
    </main>
  );
}
