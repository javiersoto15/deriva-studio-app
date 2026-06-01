import {
  getWaitlistCopy,
  getCampaignCopy,
  waitlistConfig,
  type RewardMode,
  type Campaign,
} from "../config/waitlist";

const SITE_URL = "https://derivastudio.cl";
const LOGO_URL = `${SITE_URL}/brand/logo-con-isotipo@2x.png`;
const PRIVACY_URL = `${SITE_URL}/privacidad`;

const COLORS = {
  ground: "#F4EDE6",
  paper: "#F8F4ED",
  cream: "#F4EDE6",
  hairline: "#DCCDB2",
  copper: "#B87333",
  ink: "#201812",
  muted: "#67594D",
  green: "#00311F",
  roast: "#5E230F",
} as const;

const FONT_DISPLAY = `'Cormorant Garamond', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif`;
const FONT_MONO = `'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;

export function buildWelcomeEmail(mode: RewardMode = waitlistConfig.rewardMode, firstName?: string) {
  const copy = getWaitlistCopy(mode);
  const greeting = firstName ? `Hola ${escapeHtml(firstName)},` : "Hola,";
  const bodyHtml = copy.emailBody
    .split("\n\n")
    .map(
      (paragraph, i) => `
        <p style="margin:${i === 0 ? "10px 0 0" : "10px 0 0"}; font-family:${FONT_MONO}; font-size:13px; font-weight:400; line-height:1.6; color:${i === copy.emailBody.split("\n\n").length - 1 ? COLORS.muted : COLORS.ink}; text-align:center;">
          ${escapeHtml(paragraph)}
        </p>`,
    )
    .join("");

  const rewardBlock =
    mode === "both"
      ? `
    <tr>
      <td align="center" style="padding:20px 28px 0;">
        <table role="presentation" width="380" cellpadding="0" cellspacing="0" border="0" style="max-width:380px; background:${COLORS.cream};">
          <tr>
            <td align="center" style="padding:18px 18px 20px;">
              <p style="margin:0; font-family:${FONT_MONO}; font-size:9.5px; font-weight:500; letter-spacing:0.42em; text-transform:uppercase; color:${COLORS.roast};">
                Lo que te tenemos guardado
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:10px auto 0;">
                <tr><td width="32" height="1" style="background:${COLORS.copper}; line-height:1px; font-size:0;">&nbsp;</td></tr>
              </table>
              <p style="margin:14px 0 0; font-family:${FONT_DISPLAY}; font-size:22px; font-style:italic; line-height:1.1; color:${COLORS.green};">
                La primera taza
              </p>
              <p style="margin:2px 0 0; font-family:${FONT_MONO}; font-size:11px; line-height:1.5; color:${COLORS.muted};">
                Café o mate, va por nuestra cuenta.
              </p>
              <p style="margin:10px 0 0; font-family:Arial, sans-serif; font-size:10px; color:${COLORS.copper}; line-height:1;">&#9670;</p>
              <p style="margin:10px 0 0; font-family:${FONT_DISPLAY}; font-size:22px; font-style:italic; line-height:1.1; color:${COLORS.green};">
                Invitación a la apertura
              </p>
              <p style="margin:2px 0 0; font-family:${FONT_MONO}; font-size:11px; line-height:1.5; color:${COLORS.muted};">
                Te confirmamos hora y lugar.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
      : "";

  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(copy.emailSubject)}</title>
  </head>
  <body style="margin:0; padding:0; background:${COLORS.ground}; font-family:${FONT_MONO}; color:${COLORS.ink};">
    <!-- Preheader (hidden, shown in inbox preview) -->
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      ${escapeHtml(copy.successBody)}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.ground};">
      <tr>
        <td align="center" style="padding:24px 12px;">

          <!-- Top caption -->
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
            <tr>
              <td style="padding:0 8px 12px; font-family:${FONT_MONO}; font-size:10px; font-weight:400; letter-spacing:0.22em; text-transform:uppercase; color:${COLORS.muted};">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="left">Deriva Coffee Studio</td>
                    <td align="center">
                      <span style="font-family:Arial, sans-serif; font-size:9px; color:${COLORS.copper};">&#9670;</span>
                      &nbsp;Bienvenido
                    </td>
                    <td align="right">Providencia · Santiago</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Email card -->
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:${COLORS.paper}; border:1px solid ${COLORS.hairline};">
            <tr>
              <td align="center" style="padding:32px 28px 28px;">

                <!-- Logo -->
                <img src="${LOGO_URL}" alt="Deriva Coffee Studio" width="112" height="112" style="display:block; border:0; outline:none; text-decoration:none; width:112px; height:112px;" />

                <!-- Index meta -->
                <p style="margin:12px 0 0; font-family:${FONT_MONO}; font-size:10px; font-weight:400; letter-spacing:0.32em; text-transform:uppercase; color:${COLORS.muted};">
                  Carta de bienvenida
                  &nbsp;<span style="font-family:Arial, sans-serif; color:${COLORS.copper};">&#9670;</span>&nbsp;
                  <span style="color:${COLORS.ink};">Apertura 18.05</span>
                </p>

                <!-- Copper rule -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:14px auto 0;">
                  <tr><td width="44" height="1" style="background:${COLORS.copper}; line-height:1px; font-size:0;">&nbsp;</td></tr>
                </table>

                <!-- Headline -->
                <p style="margin:14px 0 0; font-family:${FONT_DISPLAY}; font-size:42px; font-weight:400; line-height:0.98; letter-spacing:-0.01em; color:${COLORS.ink};">
                  Estás
                </p>
                <p style="margin:2px 0 0; font-family:${FONT_DISPLAY}; font-size:50px; font-weight:400; font-style:italic; line-height:0.98; letter-spacing:-0.01em; color:${COLORS.green};">
                  dentro.
                </p>

                <!-- Body -->
                <table role="presentation" width="380" cellpadding="0" cellspacing="0" border="0" style="max-width:380px;">
                  <tr>
                    <td align="center" style="padding-top:18px;">
                      <p style="margin:0; font-family:${FONT_MONO}; font-size:13px; font-weight:400; line-height:1.6; color:${COLORS.ink}; text-align:center;">
                        ${greeting}
                      </p>
                      ${bodyHtml}
                    </td>
                  </tr>
                </table>

              </td>
            </tr>
            ${rewardBlock}
            <tr>
              <td align="center" style="padding:20px 28px 0;">
                <p style="margin:0; font-family:${FONT_DISPLAY}; font-size:18px; font-style:italic; color:${COLORS.roast};">
                  — Equipo Deriva
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 28px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr><td width="56" height="1" style="background:${COLORS.hairline}; line-height:1px; font-size:0;">&nbsp;</td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:12px 28px 28px; font-family:${FONT_MONO}; font-size:10px; font-weight:400; letter-spacing:0.18em; line-height:1.5; text-transform:uppercase; color:${COLORS.muted};">
                Magnere 1570 Local 105<br />
                Providencia, Santiago
              </td>
            </tr>
          </table>

          <!-- Email footnote -->
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
            <tr>
              <td align="center" style="padding:14px 24px 0; font-family:${FONT_MONO}; font-size:9.5px; font-weight:400; line-height:1.55; color:${COLORS.muted};">
                Recibes este correo porque te sumaste a la lista de apertura de Deriva en derivastudio.cl.
                <br />
                <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:${COLORS.green}; text-decoration:underline;">Darse de baja</a>
                &nbsp;·&nbsp;
                <a href="${PRIVACY_URL}" style="color:${COLORS.green}; text-decoration:underline;">Política de privacidad</a>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = buildText(copy, mode, greeting);

  return { subject: copy.emailSubject, html, text };
}

function buildText(
  copy: ReturnType<typeof getWaitlistCopy>,
  mode: RewardMode,
  greeting: string,
): string {
  const lines = [
    "DERIVA COFFEE STUDIO — PROVIDENCIA, SANTIAGO",
    "",
    "Estás dentro.",
    "",
    greeting,
    "",
    copy.emailBody,
    "",
  ];

  if (mode === "both") {
    lines.push(
      "— LO QUE TE TENEMOS GUARDADO —",
      "",
      "La primera taza — Café o mate, va por nuestra cuenta.",
      "Invitación a la apertura — Te confirmamos hora y lugar.",
      "",
    );
  }

  lines.push(
    copy.emailSignoff,
    "",
    "Magnere 1570 Local 105",
    "Providencia, Santiago",
    "",
    "Recibes este correo porque te sumaste a la lista de apertura de Deriva en derivastudio.cl.",
    `Política de privacidad: ${PRIVACY_URL}`,
  );

  return lines.join("\n");
}

export function buildCompanionWelcomeEmail(firstName?: string) {
  const copy = getCampaignCopy("companion");
  const greeting = firstName ? `Hola ${escapeHtml(firstName)},` : "Hola,";
  const paragraphs = copy.emailBody.split("\n\n");
  const bodyHtml = paragraphs
    .map(
      (paragraph, i) => `
        <p style="margin:10px 0 0; font-family:${FONT_MONO}; font-size:13px; font-weight:400; line-height:1.6; color:${i === paragraphs.length - 1 ? COLORS.muted : COLORS.ink}; text-align:center;">
          ${escapeHtml(paragraph)}
        </p>`,
    )
    .join("");

  // Toolkit row — the three pieces of "tu propia Deriva".
  const toolkit = ["Tu carta", "Tu código", "Tus recompensas"]
    .map(
      (label) => `
        <td align="center" style="padding:0 6px;">
          <p style="margin:0; font-family:${FONT_DISPLAY}; font-size:18px; font-style:italic; line-height:1.1; color:${COLORS.green};">${label}</p>
        </td>`,
    )
    .join(`<td width="1" style="background:${COLORS.hairline};">&nbsp;</td>`);

  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(copy.emailSubject)}</title>
  </head>
  <body style="margin:0; padding:0; background:${COLORS.ground}; font-family:${FONT_MONO}; color:${COLORS.ink};">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      ${escapeHtml(copy.successBody)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.ground};">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:${COLORS.paper}; border:1px solid ${COLORS.hairline};">
            <tr>
              <td align="center" style="padding:32px 28px 28px;">
                <img src="${LOGO_URL}" alt="Deriva Coffee Studio" width="112" height="112" style="display:block; border:0; outline:none; text-decoration:none; width:112px; height:112px;" />
                <p style="margin:12px 0 0; font-family:${FONT_MONO}; font-size:10px; font-weight:400; letter-spacing:0.32em; text-transform:uppercase; color:${COLORS.muted};">
                  La app de Deriva
                  &nbsp;<span style="font-family:Arial, sans-serif; color:${COLORS.copper};">&#9670;</span>&nbsp;
                  <span style="color:${COLORS.ink};">Muy pronto</span>
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:14px auto 0;">
                  <tr><td width="44" height="1" style="background:${COLORS.copper}; line-height:1px; font-size:0;">&nbsp;</td></tr>
                </table>
                <p style="margin:14px 0 0; font-family:${FONT_DISPLAY}; font-size:42px; font-weight:400; line-height:0.98; letter-spacing:-0.01em; color:${COLORS.ink};">
                  Crea tu propia
                </p>
                <p style="margin:2px 0 0; font-family:${FONT_DISPLAY}; font-size:50px; font-weight:400; font-style:italic; line-height:0.98; letter-spacing:-0.01em; color:${COLORS.green};">
                  Deriva.
                </p>
                <table role="presentation" width="380" cellpadding="0" cellspacing="0" border="0" style="max-width:380px;">
                  <tr>
                    <td align="center" style="padding-top:18px;">
                      <p style="margin:0; font-family:${FONT_MONO}; font-size:13px; font-weight:400; line-height:1.6; color:${COLORS.ink}; text-align:center;">${greeting}</p>
                      ${bodyHtml}
                    </td>
                  </tr>
                </table>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px auto 0;">
                  <tr>${toolkit}</tr>
                </table>
                <p style="margin:22px 0 0; font-family:${FONT_DISPLAY}; font-size:18px; font-style:italic; color:${COLORS.roast};">
                  ${escapeHtml(copy.emailSignoff)}
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:12px 28px 28px; font-family:${FONT_MONO}; font-size:10px; font-weight:400; letter-spacing:0.18em; line-height:1.5; text-transform:uppercase; color:${COLORS.muted};">
                Magnere 1570 Local 105<br />
                Providencia, Santiago
              </td>
            </tr>
          </table>
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
            <tr>
              <td align="center" style="padding:14px 24px 0; font-family:${FONT_MONO}; font-size:9.5px; font-weight:400; line-height:1.55; color:${COLORS.muted};">
                Recibes este correo porque te sumaste a la lista de la app de Deriva en derivastudio.cl.
                <br />
                <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:${COLORS.green}; text-decoration:underline;">Darse de baja</a>
                &nbsp;·&nbsp;
                <a href="${PRIVACY_URL}" style="color:${COLORS.green}; text-decoration:underline;">Política de privacidad</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    "DERIVA COFFEE STUDIO — LA APP",
    "",
    "Crea tu propia Deriva.",
    "",
    greeting,
    "",
    copy.emailBody,
    "",
    "Tu carta · Tu código · Tus recompensas",
    "",
    copy.emailSignoff,
    "",
    "Magnere 1570 Local 105",
    "Providencia, Santiago",
    "",
    "Recibes este correo porque te sumaste a la lista de la app de Deriva en derivastudio.cl.",
    `Política de privacidad: ${PRIVACY_URL}`,
  ].join("\n");

  return { subject: copy.emailSubject, html, text };
}

export function buildWelcomeEmailFor(
  campaign: Campaign,
  firstName?: string,
  mode: RewardMode = waitlistConfig.rewardMode,
) {
  return campaign === "companion"
    ? buildCompanionWelcomeEmail(firstName)
    : buildWelcomeEmail(mode, firstName);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
