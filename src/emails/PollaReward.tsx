import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

const SITE = "https://derivastudio.cl";

const c = {
  field: "#efe7d8",
  paper: "#f6f1e6",
  ticket: "#ece4d0",
  hairline: "#c9b896",
  hairlineLight: "#e0d6c0",
  copper: "#c9a57a",
  cornerCopper: "#b87333",
  ink: "#2a2622",
  muted: "#6b5f52",
  green: "#2e4034",
  roast: "#7a3a1f",
} as const;

const fontSerif =
  "'Cormorant Garamond', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";
const fontBody =
  "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const fontMono =
  "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

export type PollaRewardProps = {
  /** Recipient first name, e.g. "Juan". */
  firstName: string;
  /** Exact reward wording owned by the backend — render verbatim, do NOT hardcode. */
  rewardLabel: string;
  /** Short redemption code, always visible (image-blocked fallback), e.g. "PM-4QX7". */
  shortCode: string;
  /** Hosted https URL for the QR image. */
  qrImageUrl: string;
  /** Validity wording, e.g. "hoy hasta las 21:00". */
  validityLabel: string;
  /** Edition mark for the masthead, e.g. "№ 24". */
  edition?: string;
};

export const PollaRewardSubject = "Le achuntaste — tienes premio en Deriva";

export const PollaRewardPreview = "Le achuntaste — tienes premio en Deriva.";

export default function PollaReward({
  firstName = "Juan",
  rewardLabel = "Un Campesino gratis",
  shortCode = "PM-4QX7",
  qrImageUrl = "https://media.derivastudio.cl/polla/qr-placeholder.png",
  validityLabel = "hoy hasta las 21:00",
  edition = "№ 24",
}: PollaRewardProps) {
  return (
    <Html lang="es">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <meta name="x-apple-disable-message-reformatting" />
      </Head>
      <Preview>{PollaRewardPreview}</Preview>
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
          {/* Email card with copper corner brackets */}
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
              {/* Top corner-bracket row */}
              <tr>
                <td style={{ padding: "16px 16px 0", backgroundColor: c.paper }}>
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
                        <td align="left" style={cornerStyle}>
                          ⌜
                        </td>
                        <td align="right" style={cornerStyle}>
                          ⌝
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

              <tr>
                <td
                  align="center"
                  style={{
                    padding: "8px 32px 0",
                    backgroundColor: c.paper,
                  }}
                >
                  {/* Logo lockup — full brand mark */}
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
                            src={`${SITE}/brand/logo-con-isotipo@3x.png`}
                            alt="Deriva Coffee Studio"
                            width={104}
                            height={104}
                            style={{
                              display: "block",
                              width: "104px",
                              height: "104px",
                              border: 0,
                              outline: "none",
                              textDecoration: "none",
                            }}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Masthead rule — copper hairlines flank the mono mast */}
                  <table
                    role="presentation"
                    align="center"
                    cellPadding={0}
                    cellSpacing={0}
                    border={0}
                    width="100%"
                    style={{
                      borderCollapse: "collapse",
                      margin: "22px auto 0",
                      maxWidth: "440px",
                    }}
                  >
                    <tbody>
                      <tr>
                        <td
                          style={{
                            borderTop: `1px solid ${c.copper}`,
                            lineHeight: 0,
                            fontSize: 0,
                          }}
                        >
                          {" "}
                        </td>
                        <td
                          align="center"
                          style={{
                            padding: "0 12px",
                            whiteSpace: "nowrap",
                            fontFamily: fontMono,
                            fontSize: "10px",
                            fontWeight: 500,
                            letterSpacing: "0.26em",
                            textTransform: "uppercase",
                            color: c.muted,
                          }}
                        >
                          La Polla del Mundial · {edition}
                        </td>
                        <td
                          style={{
                            borderTop: `1px solid ${c.copper}`,
                            lineHeight: 0,
                            fontSize: 0,
                          }}
                        >
                          {" "}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Hero — the SINGLE green moment */}
                  <Heading
                    as="h1"
                    style={{
                      margin: "20px 0 0",
                      fontFamily: fontSerif,
                      fontSize: "52px",
                      fontWeight: 400,
                      fontStyle: "italic",
                      lineHeight: "98%",
                      letterSpacing: "-0.01em",
                      color: c.green,
                      textAlign: "center",
                    }}
                  >
                    Le achuntaste.
                  </Heading>

                  {/* Subhead */}
                  <Text
                    style={{
                      margin: "14px 0 0",
                      fontFamily: fontMono,
                      fontSize: "13px",
                      fontWeight: 400,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: c.muted,
                      textAlign: "center",
                      lineHeight: "18px",
                    }}
                  >
                    Tu predicción de ayer dio en el blanco
                  </Text>

                  {/* Body copy — tier-generic */}
                  <Text
                    style={{
                      margin: "26px auto 0",
                      maxWidth: "420px",
                      fontFamily: fontMono,
                      fontSize: "14px",
                      fontWeight: 400,
                      lineHeight: "22px",
                      color: c.ink,
                      textAlign: "center",
                    }}
                  >
                    Hola {firstName}, tu polla de ayer salió premiada. Te
                    ganaste:
                  </Text>

                  {/* Prize block — copper rules top + bottom */}
                  <table
                    role="presentation"
                    align="center"
                    cellPadding={0}
                    cellSpacing={0}
                    border={0}
                    width="100%"
                    style={{
                      borderCollapse: "collapse",
                      margin: "22px auto 0",
                      maxWidth: "440px",
                    }}
                  >
                    <tbody>
                      <tr>
                        <td
                          align="center"
                          style={{
                            padding: "22px 12px",
                            borderTop: `1px solid ${c.copper}`,
                            borderBottom: `1px solid ${c.copper}`,
                          }}
                        >
                          <Text
                            style={{
                              margin: 0,
                              fontFamily: fontSerif,
                              fontStyle: "italic",
                              fontSize: "34px",
                              fontWeight: 400,
                              lineHeight: "38px",
                              color: c.ink,
                              textAlign: "center",
                            }}
                          >
                            {rewardLabel}
                          </Text>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Reward card — 1px ink border, QR + short code */}
                  <table
                    role="presentation"
                    align="center"
                    cellPadding={0}
                    cellSpacing={0}
                    border={0}
                    width="100%"
                    style={{
                      borderCollapse: "collapse",
                      margin: "28px auto 0",
                      maxWidth: "340px",
                      backgroundColor: c.paper,
                      border: `1px solid ${c.ink}`,
                    }}
                  >
                    <tbody>
                      <tr>
                        <td
                          align="center"
                          style={{ padding: "28px 24px 24px", textAlign: "center" }}
                        >
                          <Img
                            src={qrImageUrl}
                            alt={`Código QR — ${shortCode}`}
                            width={170}
                            height={170}
                            style={{
                              display: "block",
                              margin: "0 auto",
                              width: "170px",
                              height: "170px",
                              border: 0,
                              outline: "none",
                            }}
                          />

                          <Text
                            style={{
                              margin: "20px 0 0",
                              fontFamily: fontMono,
                              fontSize: "26px",
                              fontWeight: 600,
                              letterSpacing: "0.22em",
                              color: c.ink,
                              textAlign: "center",
                              lineHeight: "30px",
                            }}
                          >
                            {shortCode}
                          </Text>

                          <Text
                            style={{
                              margin: "14px auto 0",
                              maxWidth: "240px",
                              fontFamily: fontMono,
                              fontSize: "11px",
                              fontWeight: 400,
                              lineHeight: "16px",
                              color: c.muted,
                              textAlign: "center",
                            }}
                          >
                            Muéstrale este código al barista. Sube el brillo de
                            tu pantalla.
                          </Text>

                          <Hr
                            style={{
                              width: "44px",
                              height: "1px",
                              margin: "18px auto 0",
                              backgroundColor: c.copper,
                              border: 0,
                              borderTop: `1px solid ${c.copper}`,
                            }}
                          />

                          <Text
                            style={{
                              margin: "14px 0 0",
                              fontFamily: fontMono,
                              fontSize: "10px",
                              fontWeight: 500,
                              letterSpacing: "0.22em",
                              textTransform: "uppercase",
                              color: c.muted,
                              textAlign: "center",
                              lineHeight: "14px",
                            }}
                          >
                            Válido {validityLabel}
                          </Text>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Footer — visit + hours */}
                  <Text
                    style={{
                      margin: "36px auto 0",
                      maxWidth: "440px",
                      fontFamily: fontMono,
                      fontSize: "11px",
                      fontWeight: 400,
                      lineHeight: "18px",
                      color: c.muted,
                      textAlign: "center",
                    }}
                  >
                    Pásate por la barra · Magnere 1570, Local 105 · Providencia
                  </Text>
                  <Text
                    style={{
                      margin: "6px auto 0",
                      maxWidth: "440px",
                      fontFamily: fontMono,
                      fontSize: "11px",
                      fontWeight: 400,
                      lineHeight: "18px",
                      color: c.muted,
                      textAlign: "center",
                    }}
                  >
                    Lun–Vie 08:00–21:00 · Sáb 10:00–21:00
                  </Text>
                </td>
              </tr>

              {/* Colophon rule */}
              <tr>
                <td
                  align="center"
                  style={{ padding: "28px 32px 0", backgroundColor: c.paper }}
                >
                  <table
                    role="presentation"
                    align="center"
                    cellPadding={0}
                    cellSpacing={0}
                    border={0}
                    width="100%"
                    style={{
                      borderCollapse: "collapse",
                      maxWidth: "440px",
                    }}
                  >
                    <tbody>
                      <tr>
                        <td
                          style={{
                            borderTop: `1px solid ${c.hairlineLight}`,
                            lineHeight: 0,
                            fontSize: 0,
                          }}
                        >
                          {" "}
                        </td>
                        <td
                          align="center"
                          style={{
                            padding: "0 12px",
                            whiteSpace: "nowrap",
                            fontFamily: fontMono,
                            fontSize: "9px",
                            fontWeight: 500,
                            letterSpacing: "0.3em",
                            textTransform: "uppercase",
                            color: c.muted,
                          }}
                        >
                          ĐERIVA COFFEE STUDIO
                        </td>
                        <td
                          style={{
                            borderTop: `1px solid ${c.hairlineLight}`,
                            lineHeight: 0,
                            fontSize: 0,
                          }}
                        >
                          {" "}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

              {/* Bottom corner-bracket row */}
              <tr>
                <td style={{ padding: "8px 16px 16px", backgroundColor: c.paper }}>
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
                        <td align="left" style={cornerStyle}>
                          ⌞
                        </td>
                        <td align="right" style={cornerStyle}>
                          ⌟
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </Container>
      </Body>
    </Html>
  );
}

const cornerStyle: React.CSSProperties = {
  fontFamily: "Arial, sans-serif",
  fontSize: "20px",
  lineHeight: "20px",
  color: c.copper,
};

PollaReward.PreviewProps = {
  firstName: "Juan",
  rewardLabel: "Un Campesino gratis",
  shortCode: "PM-4QX7",
  qrImageUrl: "https://media.derivastudio.cl/polla/qr-placeholder.png",
  validityLabel: "hoy hasta las 21:00",
  edition: "№ 24",
} satisfies PollaRewardProps;
