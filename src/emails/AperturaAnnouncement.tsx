import * as React from "react";
import {
  Body,
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

const c = {
  field: "#e8e2d6",
  paper: "#f6f1e6",
  hairline: "#c9b896",
  copper: "#c9a57a",
  ink: "#2a2622",
  muted: "#6b5f52",
  green: "#2e4034",
  roast: "#7a3a1f",
  link: "#2e4034",
} as const;

const fontSerif =
  "'Cormorant Garamond', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";
const fontMono =
  "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

const darkCss = `
  /* Dark-mode designed palette — Apple Mail / iOS Mail / Outlook 2021+ honor @media */
  @media (prefers-color-scheme: dark) {
    body, .deriva-outer, .deriva-card, .deriva-card-cell { background-color: #1c1814 !important; }
    .deriva-card { border-color: #3a322a !important; }
    .deriva-event-card { border-color: #3a322a !important; }
    .deriva-rule { background-color: #3a322a !important; }
    .deriva-muted { color: #b0a08a !important; }
    .deriva-ink { color: #f5ede0 !important; }
    .deriva-green { color: #b8d2af !important; }
    .deriva-roast { color: #e0a37c !important; }
    .deriva-link { color: #b8d2af !important; }
    .deriva-logo-light { display: none !important; }
    .deriva-logo-dark { display: block !important; }
  }
  /* Gmail's forced dark mode */
  [data-ogsc] body, [data-ogsc] .deriva-outer, [data-ogsc] .deriva-card, [data-ogsc] .deriva-card-cell { background-color: #1c1814 !important; }
  [data-ogsc] .deriva-card { border-color: #3a322a !important; }
  [data-ogsc] .deriva-event-card { border-color: #3a322a !important; }
  [data-ogsc] .deriva-rule { background-color: #3a322a !important; }
  [data-ogsc] .deriva-muted { color: #b0a08a !important; }
  [data-ogsc] .deriva-ink { color: #f5ede0 !important; }
  [data-ogsc] .deriva-green { color: #b8d2af !important; }
  [data-ogsc] .deriva-roast { color: #e0a37c !important; }
  [data-ogsc] .deriva-link { color: #b8d2af !important; }
  [data-ogsc] .deriva-logo-light { display: none !important; }
  [data-ogsc] .deriva-logo-dark { display: block !important; }
`;

export const AperturaAnnouncementSubject = "Lunes 18 de mayo — Deriva";

export const AperturaAnnouncementPreview =
  "Lunes 18 de mayo · 8:00 AM en Magnere 1570. Tu primera taza, por la casa.";

export default function AperturaAnnouncement() {
  return (
    <Html lang="es">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        {/* Stops iOS Mail's auto-scaling that contributes to "shifted" layouts */}
        <meta name="x-apple-disable-message-reformatting" />
        <style>{darkCss}</style>
      </Head>
      <Preview>{AperturaAnnouncementPreview}</Preview>
      <Body
        className="deriva-outer"
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: c.field,
          fontFamily: fontMono,
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
          {/* Top caption — three-column row */}
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
                    className="deriva-muted"
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
                    className="deriva-muted"
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
                    {" "}Apertura
                  </td>
                  <td
                    align="right"
                    className="deriva-muted"
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
                    Providencia · Santiago
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Email card */}
          <table
            role="presentation"
            className="deriva-card"
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
                  className="deriva-card-cell"
                  style={{
                    padding: "48px 28px 28px",
                    backgroundColor: c.paper,
                    textAlign: "center",
                  }}
                >
                  {/* Isotipo: wrapped in a centered table — the only centering pattern that's bulletproof across email clients and modern browsers' XHTML rendering. */}
                  <table
                    role="presentation"
                    align="center"
                    cellPadding={0}
                    cellSpacing={0}
                    border={0}
                    style={{
                      borderCollapse: "collapse",
                      margin: "0 auto",
                    }}
                  >
                    <tbody>
                      <tr>
                        <td align="center" style={{ textAlign: "center" }}>
                          <img
                            src={`${SITE}/brand/isotipo-verde@2x.png`}
                            alt=""
                            width={56}
                            height={56}
                            className="deriva-logo-light"
                            style={{
                              display: "block",
                              width: "56px",
                              height: "56px",
                              border: 0,
                              outline: "none",
                              textDecoration: "none",
                            }}
                          />
                          <img
                            src={`${SITE}/brand/isotipo-sage@2x.png`}
                            alt=""
                            width={56}
                            height={56}
                            className="deriva-logo-dark"
                            style={{
                              display: "none",
                              width: "56px",
                              height: "56px",
                              border: 0,
                              outline: "none",
                              textDecoration: "none",
                            }}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Wordmark */}
                  <Heading
                    as="h1"
                    className="deriva-ink"
                    style={{
                      margin: "14px 0 0",
                      fontFamily: fontSerif,
                      fontSize: "28px",
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
                    className="deriva-muted"
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
                    className="deriva-muted"
                    style={{
                      margin: "24px 0 0",
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
                    Aviso de apertura{" "}
                    <span
                      style={{
                        fontFamily: "Arial, sans-serif",
                        color: c.copper,
                      }}
                    >
                      ◆
                    </span>
                    {" "}
                    <span className="deriva-ink" style={{ color: c.ink }}>
                      N° 002 / 2026
                    </span>
                  </Text>

                  {/* Date stamp: LUNES caps */}
                  <Text
                    className="deriva-muted"
                    style={{
                      margin: "32px 0 0",
                      fontFamily: fontMono,
                      fontSize: "11px",
                      fontWeight: 500,
                      letterSpacing: "0.5em",
                      textTransform: "uppercase",
                      color: c.muted,
                      textAlign: "center",
                      lineHeight: "14px",
                    }}
                  >
                    Lunes
                  </Text>

                  {/* Date stamp: 18 hero */}
                  <Heading
                    as="h2"
                    className="deriva-green"
                    style={{
                      margin: "6px 0 0",
                      fontFamily: fontSerif,
                      fontSize: "140px",
                      fontWeight: 400,
                      lineHeight: "140px",
                      letterSpacing: "-0.02em",
                      color: c.green,
                      textAlign: "center",
                    }}
                  >
                    18
                  </Heading>

                  {/* Date stamp: de mayo */}
                  <Text
                    className="deriva-ink"
                    style={{
                      margin: "8px 0 0",
                      fontFamily: fontSerif,
                      fontSize: "32px",
                      fontStyle: "italic",
                      fontWeight: 400,
                      lineHeight: "32px",
                      color: c.ink,
                      textAlign: "center",
                    }}
                  >
                    de mayo
                  </Text>

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

                  {/* Body copy */}
                  <Text
                    className="deriva-ink"
                    style={{
                      margin: "22px auto 0",
                      maxWidth: "380px",
                      fontFamily: fontMono,
                      fontSize: "13px",
                      fontWeight: 400,
                      lineHeight: "21px",
                      color: c.ink,
                      textAlign: "left",
                    }}
                  >
                    Hola,
                  </Text>
                  <Text
                    className="deriva-ink"
                    style={{
                      margin: "14px auto 0",
                      maxWidth: "380px",
                      fontFamily: fontMono,
                      fontSize: "13px",
                      fontWeight: 400,
                      lineHeight: "21px",
                      color: c.ink,
                      textAlign: "left",
                    }}
                  >
                    Te escribimos como prometimos. Abrimos en piloto el lunes 18 de mayo en Magnere 1570, Providencia.
                  </Text>
                  <Text
                    className="deriva-muted"
                    style={{
                      margin: "14px auto 0",
                      maxWidth: "380px",
                      fontFamily: fontMono,
                      fontSize: "13px",
                      fontWeight: 400,
                      lineHeight: "21px",
                      color: c.muted,
                      textAlign: "left",
                    }}
                  >
                    Cuando vengas a vernos, tu primera taza, café o mate, va por nuestra cuenta.
                  </Text>

                  {/* Event card: Cuándo / Dónde */}
                  <table
                    role="presentation"
                    className="deriva-event-card"
                    cellPadding={0}
                    cellSpacing={0}
                    border={0}
                    style={{
                      borderCollapse: "collapse",
                      margin: "28px auto 0",
                      maxWidth: "380px",
                      width: "100%",
                      border: `1px solid ${c.hairline}`,
                    }}
                  >
                    <tbody>
                      <tr>
                        <td
                          align="left"
                          valign="top"
                          style={{ padding: "20px 24px", width: "50%" }}
                        >
                          <Text
                            className="deriva-muted"
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
                            Cuándo
                          </Text>
                          <Text
                            className="deriva-green"
                            style={{
                              margin: "8px 0 0",
                              fontFamily: fontSerif,
                              fontSize: "22px",
                              fontStyle: "italic",
                              lineHeight: "24px",
                              color: c.green,
                            }}
                          >
                            Lunes 18.05
                          </Text>
                          <Text
                            className="deriva-ink"
                            style={{
                              margin: "6px 0 0",
                              fontFamily: fontMono,
                              fontSize: "11px",
                              lineHeight: "15px",
                              color: c.ink,
                            }}
                          >
                            desde las 8:00 AM
                          </Text>
                        </td>
                        <td
                          className="deriva-rule"
                          width={1}
                          style={{
                            backgroundColor: c.hairline,
                            lineHeight: 0,
                            fontSize: 0,
                          }}
                        >
                          {" "}
                        </td>
                        <td
                          align="left"
                          valign="top"
                          style={{ padding: "20px 24px", width: "50%" }}
                        >
                          <Text
                            className="deriva-muted"
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
                            Dónde
                          </Text>
                          <Text
                            className="deriva-green"
                            style={{
                              margin: "8px 0 0",
                              fontFamily: fontSerif,
                              fontSize: "22px",
                              fontStyle: "italic",
                              lineHeight: "24px",
                              color: c.green,
                            }}
                          >
                            Magnere 1570
                          </Text>
                          <Text
                            className="deriva-ink"
                            style={{
                              margin: "6px 0 0",
                              fontFamily: fontMono,
                              fontSize: "11px",
                              lineHeight: "15px",
                              color: c.ink,
                            }}
                          >
                            Local 105 · Providencia
                          </Text>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Signoff */}
                  <Text
                    className="deriva-roast"
                    style={{
                      margin: "32px 0 8px",
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

          {/* Footnote */}
          <Section
            style={{
              padding: "14px 24px 0",
              textAlign: "center",
            }}
          >
            <Text
              className="deriva-muted"
              style={{
                margin: 0,
                fontFamily: fontMono,
                fontSize: "9.5px",
                lineHeight: "15px",
                color: c.muted,
                textAlign: "center",
              }}
            >
              Recibes este correo porque te sumaste a la lista de apertura de Deriva en derivastudio.cl.
              <br />
              <Link
                href="{{{RESEND_UNSUBSCRIBE_URL}}}"
                className="deriva-link"
                style={{ color: c.link, textDecoration: "underline" }}
              >
                Darse de baja
              </Link>
              {" · "}
              <Link
                href={`${SITE}/privacidad`}
                className="deriva-link"
                style={{ color: c.link, textDecoration: "underline" }}
              >
                Política de privacidad
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
