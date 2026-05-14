import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

const SITE = "https://derivastudio.cl";
const APP = "https://app.derivastudio.cl";

const c = {
  field: "#e8e2d6",
  paper: "#f6f1e6",
  ticket: "#ece4d0",
  hairline: "#c9b896",
  hairlineLight: "#e0d6c0",
  copper: "#c9a57a",
  ink: "#2a2622",
  muted: "#6b5f52",
  green: "#2e4034",
  roast: "#7a3a1f",
  espresso: "#281A12",
  cream: "#f5ede0",
  mutedDark: "#a89784",
  link: "#2e4034",
} as const;

const fontSerif =
  "'Cormorant Garamond', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";
const fontBody =
  "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const fontMono =
  "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

export type AperturaActivationProps = {
  /** Bearer welcome code (e.g. `DRV-WLC-7K42`) per §3.6 — redeemed at the bar. */
  welcomeCode: string;
  /** Reconciliation token per §3.5, embedded in the deep-link URL. */
  reconciliationToken: string;
};

export const AperturaActivationSubject =
  "Tu código de bienvenida — Lunes 18 de mayo";

export const AperturaActivationPreview =
  "Trae este código a la barra el día de la apertura y tu primer café va por la casa.";

export default function AperturaActivation({
  welcomeCode = "DRV-WLC-7K42",
  reconciliationToken = "fake-reconciliation-token-for-preview",
}: AperturaActivationProps) {
  const activateUrl = `${APP}/ingresar?ct=${encodeURIComponent(reconciliationToken)}`;

  return (
    <Html lang="es">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <meta name="x-apple-disable-message-reformatting" />
      </Head>
      <Preview>{AperturaActivationPreview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: c.field,
          fontFamily: fontBody,
          color: c.ink,
        }}
      >
        <Container
          style={{
            maxWidth: "600px",
            width: "100%",
            margin: "0 auto",
            padding: "24px 12px",
          }}
        >
          {/* Top caption row */}
          <Section style={{ width: "100%" }}>
            <table
              role="presentation"
              cellPadding={0}
              cellSpacing={0}
              border={0}
              width="100%"
              style={{ borderCollapse: "collapse" }}
            >
              <tbody>
                <tr>
                  <td
                    align="left"
                    style={{
                      padding: "0 8px 12px",
                      fontFamily: fontMono,
                      fontSize: "10px",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: c.muted,
                      width: "33%",
                    }}
                  >
                    Deriva Coffee Studio
                  </td>
                  <td
                    align="center"
                    style={{
                      padding: "0 8px 12px",
                      fontFamily: fontMono,
                      fontSize: "10px",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: c.muted,
                      width: "34%",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "Arial, sans-serif",
                        fontSize: "9px",
                        color: c.copper,
                      }}
                    >
                      ◆
                    </span>
                    {" "}Tu invitación
                  </td>
                  <td
                    align="right"
                    style={{
                      padding: "0 8px 12px",
                      fontFamily: fontMono,
                      fontSize: "10px",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: c.muted,
                      width: "33%",
                    }}
                  >
                    Magnere · 1570
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Email card */}
          <table
            role="presentation"
            cellPadding={0}
            cellSpacing={0}
            border={0}
            width="100%"
            style={{
              borderCollapse: "collapse",
              maxWidth: "600px",
              backgroundColor: c.paper,
              border: `1px solid ${c.hairline}`,
            }}
          >
            <tbody>
              <tr>
                <td
                  align="center"
                  style={{
                    padding: "44px 32px 32px",
                    backgroundColor: c.paper,
                  }}
                >
                  {/* Header lockup */}
                  <table
                    role="presentation"
                    align="center"
                    cellPadding={0}
                    cellSpacing={0}
                    border={0}
                    style={{ borderCollapse: "collapse", margin: "0 auto" }}
                  >
                    <tbody>
                      <tr>
                        <td align="center" style={{ textAlign: "center" }}>
                          <img
                            src={`${SITE}/brand/isotipo-verde@2x.png`}
                            alt=""
                            width={48}
                            height={48}
                            style={{
                              display: "block",
                              width: "48px",
                              height: "48px",
                              border: 0,
                              outline: "none",
                              textDecoration: "none",
                            }}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <Heading
                    as="h1"
                    style={{
                      margin: "12px 0 0",
                      fontFamily: fontSerif,
                      fontSize: "26px",
                      fontWeight: 400,
                      letterSpacing: "0.06em",
                      lineHeight: "28px",
                      color: c.ink,
                      textAlign: "center",
                    }}
                  >
                    ÐERIVA
                  </Heading>
                  <Text
                    style={{
                      margin: "4px 0 0",
                      fontFamily: fontMono,
                      fontSize: "8px",
                      fontWeight: 500,
                      letterSpacing: "0.4em",
                      textTransform: "uppercase",
                      color: c.muted,
                      textAlign: "center",
                      lineHeight: "10px",
                    }}
                  >
                    Coffee Studio
                  </Text>

                  {/* Eyebrow */}
                  <Text
                    style={{
                      margin: "28px 0 0",
                      fontFamily: fontMono,
                      fontSize: "10px",
                      fontWeight: 500,
                      letterSpacing: "0.42em",
                      textTransform: "uppercase",
                      color: c.muted,
                      textAlign: "center",
                      lineHeight: "14px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "Arial, sans-serif",
                        color: c.copper,
                      }}
                    >
                      ◆
                    </span>
                    {"  "}Apertura · Magnere 1570
                  </Text>

                  {/* Hero italic */}
                  <Heading
                    as="h2"
                    style={{
                      margin: "18px 0 0",
                      fontFamily: fontSerif,
                      fontSize: "44px",
                      fontStyle: "italic",
                      fontWeight: 400,
                      lineHeight: "48px",
                      letterSpacing: "-0.005em",
                      color: c.ink,
                      textAlign: "center",
                    }}
                  >
                    Tu Deriva,
                    <br />
                    ya casi lista.
                  </Heading>

                  {/* Copper rule */}
                  <Hr
                    style={{
                      width: "44px",
                      height: "1px",
                      margin: "24px auto 0",
                      backgroundColor: c.copper,
                      border: 0,
                      borderTop: `1px solid ${c.copper}`,
                    }}
                  />

                  {/* Body copy block */}
                  <Text
                    style={{
                      margin: "24px auto 0",
                      maxWidth: "440px",
                      fontFamily: fontBody,
                      fontSize: "15px",
                      fontWeight: 400,
                      lineHeight: "22px",
                      color: c.ink,
                      textAlign: "left",
                    }}
                  >
                    Hola,
                  </Text>
                  <Text
                    style={{
                      margin: "14px auto 0",
                      maxWidth: "440px",
                      fontFamily: fontBody,
                      fontSize: "15px",
                      fontWeight: 400,
                      lineHeight: "22px",
                      color: c.ink,
                      textAlign: "left",
                    }}
                  >
                    El lunes 18 de mayo abrimos en Providencia. Te sumaste antes
                    de que existiéramos — esto es para ti.
                  </Text>
                  <Text
                    style={{
                      margin: "14px auto 0",
                      maxWidth: "440px",
                      fontFamily: fontBody,
                      fontSize: "15px",
                      fontWeight: 400,
                      lineHeight: "22px",
                      color: c.muted,
                      textAlign: "left",
                    }}
                  >
                    Trae este código a la barra el día de la apertura y tu primer
                    café va por la casa.
                  </Text>

                  {/* Welcome code ticket — the hero artifact */}
                  <table
                    role="presentation"
                    cellPadding={0}
                    cellSpacing={0}
                    border={0}
                    width="100%"
                    style={{
                      borderCollapse: "collapse",
                      margin: "32px auto 0",
                      maxWidth: "480px",
                      backgroundColor: c.ticket,
                      border: `1px solid ${c.hairline}`,
                    }}
                  >
                    <tbody>
                      <tr>
                        <td
                          align="left"
                          valign="top"
                          style={{
                            padding: "24px 24px 22px",
                            textAlign: "left",
                          }}
                        >
                          <Text
                            style={{
                              margin: 0,
                              fontFamily: fontMono,
                              fontSize: "10px",
                              fontWeight: 500,
                              letterSpacing: "0.22em",
                              textTransform: "uppercase",
                              color: c.muted,
                              lineHeight: "14px",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "Arial, sans-serif",
                                color: c.copper,
                                fontSize: "9px",
                              }}
                            >
                              ◆
                            </span>
                            {"  "}Tu código de bienvenida
                          </Text>
                          <Text
                            style={{
                              margin: "12px 0 0",
                              fontFamily: fontMono,
                              fontSize: "28px",
                              fontWeight: 600,
                              letterSpacing: "0.16em",
                              color: c.roast,
                              lineHeight: "34px",
                            }}
                          >
                            {welcomeCode}
                          </Text>
                          <Text
                            style={{
                              margin: "12px 0 0",
                              fontFamily: fontMono,
                              fontSize: "11px",
                              lineHeight: "16px",
                              color: c.muted,
                            }}
                          >
                            Muestra este código en la barra el día de la
                            apertura. No es necesario imprimirlo.
                          </Text>
                        </td>
                        {/* Perforation stub */}
                        <td
                          width={1}
                          style={{
                            backgroundColor: c.hairline,
                            lineHeight: 0,
                            fontSize: 0,
                            borderLeft: `1px dashed ${c.hairline}`,
                          }}
                        >
                          {" "}
                        </td>
                        <td
                          align="center"
                          valign="middle"
                          width={56}
                          style={{ padding: "0 12px", textAlign: "center" }}
                        >
                          <Text
                            style={{
                              margin: 0,
                              fontFamily: fontMono,
                              fontSize: "9px",
                              fontWeight: 500,
                              letterSpacing: "0.4em",
                              textTransform: "uppercase",
                              color: c.muted,
                              lineHeight: "12px",
                            }}
                          >
                            18.05
                          </Text>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* CTA */}
                  <Section style={{ margin: "36px 0 0", textAlign: "center" }}>
                    <Button
                      href={activateUrl}
                      style={{
                        display: "inline-block",
                        backgroundColor: c.roast,
                        color: c.cream,
                        fontFamily: fontBody,
                        fontWeight: 600,
                        fontSize: "12px",
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        textDecoration: "none",
                        padding: "14px 28px",
                        border: 0,
                      }}
                    >
                      Activa tu cuenta{"  "}
                      <span style={{ color: c.copper, fontFamily: "Arial, sans-serif" }}>→</span>
                    </Button>
                  </Section>
                  <Text
                    style={{
                      margin: "14px auto 0",
                      maxWidth: "380px",
                      fontFamily: fontMono,
                      fontSize: "11px",
                      lineHeight: "16px",
                      color: c.muted,
                      textAlign: "center",
                    }}
                  >
                    Para llevar tu Deriva contigo. Tu código sigue valiendo aunque
                    no descargues la app.
                  </Text>

                  {/* Day-of details */}
                  <table
                    role="presentation"
                    cellPadding={0}
                    cellSpacing={0}
                    border={0}
                    width="100%"
                    style={{
                      borderCollapse: "collapse",
                      margin: "40px 0 0",
                      borderTop: `1px solid ${c.hairline}`,
                    }}
                  >
                    <tbody>
                      <DetailRow label="Dirección" value="Magnere 1570, Local 105 — Providencia" />
                      <DetailRow label="Apertura" value="Lunes 18 de mayo, 08:00" />
                      <DetailRow
                        label="Programa"
                        value="Café filtrado de bienvenida desde las 08:00; ronda de mate a las 10:00."
                        last
                      />
                    </tbody>
                  </table>

                  {/* Signoff */}
                  <Text
                    style={{
                      margin: "36px 0 0",
                      fontFamily: fontSerif,
                      fontSize: "18px",
                      fontStyle: "italic",
                      color: c.roast,
                      textAlign: "center",
                      lineHeight: "22px",
                    }}
                  >
                    — Equipo Deriva
                  </Text>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Footer dark band */}
          <table
            role="presentation"
            cellPadding={0}
            cellSpacing={0}
            border={0}
            width="100%"
            style={{
              borderCollapse: "collapse",
              maxWidth: "600px",
              backgroundColor: c.espresso,
            }}
          >
            <tbody>
              <tr>
                <td style={{ padding: "32px 28px 28px", backgroundColor: c.espresso }}>
                  <table
                    role="presentation"
                    cellPadding={0}
                    cellSpacing={0}
                    border={0}
                    width="100%"
                    style={{ borderCollapse: "collapse" }}
                  >
                    <tbody>
                      <tr>
                        <FooterCol label="Visita">
                          <Text style={footerBody}>
                            Magnere 1570 · Local 105
                            <br />
                            Providencia, Santiago
                          </Text>
                          <Link
                            href="https://maps.app.goo.gl/?q=Magnere+1570+Providencia"
                            style={footerLink}
                          >
                            Abrir en mapa →
                          </Link>
                        </FooterCol>
                        <FooterCol label="Horario">
                          <Text style={footerBody}>
                            Lun–Vie 08:00 — 20:00
                            <br />
                            Sábado 09:00 — 17:00
                          </Text>
                        </FooterCol>
                        <FooterCol label="Social" last>
                          <Link
                            href="https://instagram.com/deriva.coffee.studio"
                            style={{ ...footerBody, ...footerLink }}
                          >
                            @deriva.coffee.studio
                          </Link>
                        </FooterCol>
                      </tr>
                    </tbody>
                  </table>

                  <Hr
                    style={{
                      width: "100%",
                      height: "1px",
                      margin: "24px 0",
                      backgroundColor: "#3a322a",
                      border: 0,
                      borderTop: "1px solid #3a322a",
                    }}
                  />

                  <Text
                    style={{
                      margin: 0,
                      fontFamily: fontSerif,
                      fontStyle: "italic",
                      fontSize: "16px",
                      lineHeight: "20px",
                      color: c.cream,
                      textAlign: "center",
                    }}
                  >
                    Café de especialidad, servido con intención.
                  </Text>

                  <Text
                    style={{
                      margin: "20px 0 0",
                      fontFamily: fontMono,
                      fontSize: "9.5px",
                      lineHeight: "15px",
                      color: c.mutedDark,
                      textAlign: "center",
                    }}
                  >
                    Deriva Coffee Studio — Nucleo Studio Group SpA
                  </Text>
                  <Text
                    style={{
                      margin: "6px 0 0",
                      fontFamily: fontMono,
                      fontSize: "9px",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: c.mutedDark,
                      textAlign: "center",
                      lineHeight: "14px",
                    }}
                  >
                    Recibes este correo porque te sumaste a la lista de apertura de Deriva.
                  </Text>
                  <Text
                    style={{
                      margin: "10px 0 0",
                      fontFamily: fontMono,
                      fontSize: "9px",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: c.mutedDark,
                      textAlign: "center",
                      lineHeight: "14px",
                    }}
                  >
                    <Link
                      href={`${SITE}/privacidad`}
                      style={{ color: c.copper, textDecoration: "underline" }}
                    >
                      Privacidad
                    </Link>
                    {"  ·  "}
                    <Link
                      href="{{{RESEND_UNSUBSCRIBE_URL}}}"
                      style={{ color: c.copper, textDecoration: "underline" }}
                    >
                      Cancelar suscripción
                    </Link>
                  </Text>
                </td>
              </tr>
            </tbody>
          </table>
        </Container>
      </Body>
    </Html>
  );
}

const footerBody: React.CSSProperties = {
  margin: 0,
  fontFamily: fontMono,
  fontSize: "12px",
  lineHeight: "18px",
  color: c.cream,
};

const footerLink: React.CSSProperties = {
  fontFamily: fontMono,
  fontSize: "11px",
  letterSpacing: "0.08em",
  color: c.copper,
  textDecoration: "underline",
};

function FooterCol({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <td
      valign="top"
      align="left"
      style={{
        padding: last ? "0 0 0 12px" : "0 12px 0 0",
        width: "33.33%",
        verticalAlign: "top",
      }}
    >
      <Text
        style={{
          margin: 0,
          fontFamily: fontMono,
          fontSize: "9px",
          fontWeight: 500,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: c.mutedDark,
          lineHeight: "12px",
        }}
      >
        {label}
      </Text>
      <div style={{ marginTop: "10px", display: "block" }}>{children}</div>
    </td>
  );
}

function DetailRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <tr>
      <td
        align="left"
        valign="top"
        style={{
          padding: "18px 16px 18px 0",
          width: "120px",
          borderBottom: last ? "0" : `1px solid ${c.hairlineLight}`,
        }}
      >
        <Text
          style={{
            margin: 0,
            fontFamily: fontMono,
            fontSize: "9px",
            fontWeight: 500,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: c.muted,
            lineHeight: "14px",
          }}
        >
          {label}
        </Text>
      </td>
      <td
        align="left"
        valign="top"
        style={{
          padding: "18px 0",
          borderBottom: last ? "0" : `1px solid ${c.hairlineLight}`,
        }}
      >
        <Text
          style={{
            margin: 0,
            fontFamily: fontSerif,
            fontStyle: "italic",
            fontSize: "18px",
            lineHeight: "22px",
            color: c.ink,
          }}
        >
          {value}
        </Text>
      </td>
    </tr>
  );
}

AperturaActivation.PreviewProps = {
  welcomeCode: "DRV-WLC-7K42",
  reconciliationToken: "fake-reconciliation-token-for-preview",
} satisfies AperturaActivationProps;
