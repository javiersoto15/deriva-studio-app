import Image from "next/image";
import Link from "next/link";

import { colors } from "../../../src/design/tokens";
import { Button } from "../../../src/ui/Button";
import { RedirectIfAuthed } from "./_components/RedirectIfAuthed";

// Splash — matches Paper artboard "INICIO Redesign · Variant C".
// Editorial-poster register; single green moment lives on "a la Deriva."
// per Recipe Rule 5. Sticker + headline + brand label + CTA in brand grammar.
export default function SplashPage() {
  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "56px 28px 40px",
        maxWidth: 480,
        width: "100%",
        marginInline: "auto",
        position: "relative"
      }}
    >
      <RedirectIfAuthed />

      <Image
        src="/brand/logo-con-isotipo.svg"
        alt="Deriva Coffee Studio"
        width={200}
        height={68}
        priority
      />

      <div
        style={{
          marginTop: 28,
          alignSelf: "flex-start",
          transform: "rotate(-3deg)",
          backgroundColor: colors.brown700,
          padding: "8px 14px 9px",
          boxShadow: "3px 4px 0 rgba(94, 35, 15, 0.18)",
          display: "inline-flex",
          alignItems: "center",
          gap: 8
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: colors.beige100
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: "0.18em",
            color: colors.beige100,
            textTransform: "uppercase"
          }}
        >
          Bienvenido · Tu primera ronda
        </span>
      </div>

      <h1
        style={{
          margin: "56px 0 0",
          fontFamily: "var(--font-display), serif",
          letterSpacing: "-0.025em"
        }}
      >
        <span
          style={{
            display: "block",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 76,
            lineHeight: "76px",
            color: colors.brown900
          }}
        >
          Un coffee,
        </span>
        <span
          style={{
            display: "block",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 76,
            lineHeight: "80px",
            color: colors.green
          }}
        >
          a la Deriva.
        </span>
      </h1>

      <div
        style={{
          marginTop: 48,
          display: "flex",
          flexDirection: "column",
          gap: 18
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 22,
            lineHeight: "30px",
            color: colors.brown900,
            maxWidth: 300
          }}
        >
          Pídelo antes de salir.{" "}
          <span style={{ color: colors.inkMuted }}>
            Tu mesa, lista al llegar.
          </span>
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: 32,
              height: 1,
              backgroundColor: colors.brown700
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
              fontWeight: 600,
              fontSize: 10,
              letterSpacing: "0.2em",
              color: colors.brown900,
              textTransform: "uppercase"
            }}
          >
            Filtrado · Espresso · Rondas
          </span>
        </div>
      </div>

      <div
        style={{
          marginTop: "auto",
          paddingTop: 48,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18
        }}
      >
        <Link
          href="/ingresar"
          style={{ width: "100%", textDecoration: "none" }}
        >
          <Button
            variant="primary"
            style={{
              width: "100%",
              paddingBlock: 18,
              boxShadow: "4px 5px 0 rgba(94, 35, 15, 0.2)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 18
            }}
          >
            Pasa, te esperamos
            <svg
              aria-hidden="true"
              width="22"
              height="14"
              viewBox="0 0 22 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 7 H 20 M 14 1 L 20 7 L 14 13"
                stroke={colors.beige100}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </Button>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
              fontWeight: 400,
              fontSize: 12,
              letterSpacing: "0.06em",
              color: colors.inkMuted
            }}
          >
            ¿Ya tienes cuenta?
          </span>
          <Link
            href="/ingresar"
            style={{
              fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
              fontWeight: 600,
              fontSize: 11,
              letterSpacing: "0.22em",
              color: colors.brown700,
              textTransform: "uppercase",
              textDecoration: "underline",
              textUnderlineOffset: 3
            }}
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </main>
  );
}
