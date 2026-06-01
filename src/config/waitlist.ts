export type RewardMode = "first_cup" | "soft_launch_invite" | "both";

export const waitlistConfig = {
  rewardMode: "both" as RewardMode,
  brandName: "Deriva Coffee Studio",
  privacyPath: "/privacidad",
} as const;

export type Campaign = "apertura" | "companion";

// Each campaign routes to its own Resend audience via this env var name.
export const campaignConfig: Record<Campaign, { audienceEnvVar: string }> = {
  apertura: { audienceEnvVar: "RESEND_AUDIENCE_ID" },
  companion: { audienceEnvVar: "RESEND_COMPANION_AUDIENCE_ID" },
};

type CopyVariant = {
  formIntro: string;
  formLabelEmail: string;
  formLabelName: string;
  placeholderEmail: string;
  placeholderName: string;
  consentLine: string;
  privacyLinkLabel: string;
  submit: string;
  submitting: string;
  successTitle: string;
  successBody: string;
  errorGeneric: string;
  errorInvalid: string;
  errorRateLimit: string;
  emailSubject: string;
  emailHeading: string;
  emailBody: string;
  emailSignoff: string;
};

const rewardCopy: Record<RewardMode, CopyVariant> = {
  first_cup: {
    formIntro: "Para los primeros en cruzar la puerta, dejamos algo guardado. Suma tu correo.",
    formLabelEmail: "Correo",
    formLabelName: "Nombre (opcional)",
    placeholderEmail: "tu@correo.cl",
    placeholderName: "Cómo te llamas",
    consentLine: "Acepto recibir correos de Deriva sobre la apertura.",
    privacyLinkLabel: "Política de privacidad",
    submit: "Avísame",
    submitting: "Enviando…",
    successTitle: "Anotado. Te tenemos guardado.",
    successBody: "Te dejamos un saludo en tu correo. Lo demás, cuando crucemos la puerta.",
    errorGeneric: "Algo falló. Inténtalo de nuevo en un momento.",
    errorInvalid: "Revisa el correo ingresado.",
    errorRateLimit: "Recibimos varios intentos. Espera un momento e intenta otra vez.",
    emailSubject: "Estás dentro — Deriva Coffee Studio",
    emailHeading: "Estás dentro.",
    emailBody:
      "Gracias por sumar tu correo. Cuando los molinos terminen de calibrarse en Magnere 1570 te avisamos primero — y la primera taza, café o mate, queda invitada por nosotros.\n\nNo te llenamos el correo. Te escribimos cuando crucemos la puerta.",
    emailSignoff: "— Equipo Deriva",
  },
  soft_launch_invite: {
    formIntro: "Para los primeros en cruzar la puerta, dejamos algo guardado. Suma tu correo.",
    formLabelEmail: "Correo",
    formLabelName: "Nombre (opcional)",
    placeholderEmail: "tu@correo.cl",
    placeholderName: "Cómo te llamas",
    consentLine: "Acepto recibir correos de Deriva sobre la apertura.",
    privacyLinkLabel: "Política de privacidad",
    submit: "Quiero la invitación",
    submitting: "Enviando…",
    successTitle: "Anotado. Te tenemos guardado.",
    successBody: "Te dejamos un saludo en tu correo. Lo demás, cuando crucemos la puerta.",
    errorGeneric: "Algo falló. Inténtalo de nuevo en un momento.",
    errorInvalid: "Revisa el correo ingresado.",
    errorRateLimit: "Recibimos varios intentos. Espera un momento e intenta otra vez.",
    emailSubject: "Estás dentro — Deriva Coffee Studio",
    emailHeading: "Estás dentro.",
    emailBody:
      "Gracias por sumar tu correo. Cuando estemos listos en Magnere 1570 te llega la invitación — con fecha, hora, y un lugar guardado a tu nombre.\n\nNo te llenamos el correo. Te escribimos cuando crucemos la puerta.",
    emailSignoff: "— Equipo Deriva",
  },
  both: {
    formIntro:
      "Suscríbete y tu primera taza, café o mate, va por nuestra cuenta cuando vengas a vernos.",
    formLabelEmail: "Correo",
    formLabelName: "Nombre (opcional)",
    placeholderEmail: "tu@correo.cl",
    placeholderName: "Cómo te llamas",
    consentLine: "Acepto recibir correos de Deriva sobre la apertura.",
    privacyLinkLabel: "Política de privacidad",
    submit: "Avísame",
    submitting: "Enviando…",
    successTitle: "Anotado. Te tenemos guardado.",
    successBody: "Te dejamos un saludo en tu correo. Lo demás, cuando crucemos la puerta.",
    errorGeneric: "Algo falló. Inténtalo de nuevo en un momento.",
    errorInvalid: "Revisa el correo ingresado.",
    errorRateLimit: "Recibimos varios intentos. Espera un momento e intenta otra vez.",
    emailSubject: "Estás dentro — Deriva Coffee Studio",
    emailHeading: "Estás dentro.",
    emailBody:
      "Gracias por sumar tu correo. Abrimos en piloto el lunes 18 de mayo en Magnere 1570. Cuando vengas a vernos, tu primera taza, café o mate, va por nuestra cuenta.\n\nNo te llenamos el correo. Te escribimos para confirmar tu visita.",
    emailSignoff: "— Equipo Deriva",
  },
};

export function getWaitlistCopy(mode: RewardMode = waitlistConfig.rewardMode): CopyVariant {
  return rewardCopy[mode];
}

const companionCopy: CopyVariant = {
  formIntro: "Suma tu correo y te avisamos apenas esté lista.",
  formLabelEmail: "Correo",
  formLabelName: "Nombre (opcional)",
  placeholderEmail: "tu@correo.cl",
  placeholderName: "Cómo te llamas",
  consentLine: "Acepto recibir correos de Deriva sobre la app.",
  privacyLinkLabel: "Política de privacidad",
  submit: "Avísame",
  submitting: "Enviando…",
  successTitle: "Listo. Llegas tú primero.",
  successBody: "Cuando la app esté lista, te escribimos a tu correo antes que a nadie.",
  errorGeneric: "Algo falló. Inténtalo de nuevo en un momento.",
  errorInvalid: "Revisa el correo ingresado.",
  errorRateLimit: "Recibimos varios intentos. Espera un momento e intenta otra vez.",
  emailSubject: "Se viene tu propia Deriva",
  emailHeading: "Crea tu propia Deriva.",
  emailBody:
    "Estás en la lista. Muy pronto vas a tener tu propia Deriva: tu carta, tu código de miembro y tus recompensas, todo en un lugar.\n\nNo te llenamos el correo. Te escribimos cuando esté lista.",
  emailSignoff: "— Equipo Deriva",
};

export function getCampaignCopy(campaign: Campaign): CopyVariant {
  return campaign === "companion" ? companionCopy : getWaitlistCopy();
}
