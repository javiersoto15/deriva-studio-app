"use server";

// Deriva On Wheels — quote request from /eventos. Sends one plain-text email
// to the café inbox with the client's address as reply-to, so answering the
// quote is just "Reply". No audience/contact is created: this is a
// transactional inquiry, not a newsletter signup.

import { Resend } from "resend";
import { z } from "zod";

const EVENT_KINDS = ["Oficina", "Celebración", "Encuentro de equipo", "Otro"] as const;

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  kind: z.enum(EVENT_KINDS),
  date: z.string().trim().max(20).optional().or(z.literal("")),
  place: z.string().trim().max(120).optional().or(z.literal("")),
  people: z.coerce.number().int().min(1).max(2000),
  drinks: z.string().trim().max(20).optional().or(z.literal("")),
  message: z.string().trim().max(1500).optional().or(z.literal("")),
  // Honeypot — bots fill this; real users won't.
  company: z.string().max(0).optional().or(z.literal(""))
});

export type QuoteState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

const ERROR_INVALID = "Revisa tu nombre, correo, tipo de evento y número de personas.";
const ERROR_GENERIC = `No pudimos enviar tu solicitud. Escríbenos a hola@derivastudio.cl.`;
const ERROR_RATE = "Ya recibimos varias solicitudes desde este correo. Te respondemos pronto.";

const recent = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 3;

function allow(key: string): boolean {
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    recent.set(key, hits);
    return false;
  }
  hits.push(now);
  recent.set(key, hits);
  return true;
}

function formatDate(iso: string): string {
  // <input type="date"> sends YYYY-MM-DD; show it the Chilean way.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : iso;
}

export async function requestEventQuote(
  _previous: QuoteState,
  formData: FormData
): Promise<QuoteState> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    kind: formData.get("kind"),
    date: formData.get("date") ?? "",
    place: formData.get("place") ?? "",
    people: formData.get("people"),
    drinks: formData.get("drinks") ?? "",
    message: formData.get("message") ?? "",
    company: formData.get("company") ?? ""
  });
  if (!parsed.success) {
    return { status: "error", message: ERROR_INVALID };
  }
  const q = parsed.data;

  if (!allow(q.email)) {
    return { status: "error", message: ERROR_RATE };
  }

  const apiKey = process.env.RESEND_API_KEY;
  // hola@ and contacto@ are Google Groups (distribution lists), not mailboxes.
  // Groups hold or spam-flag mail that claims to come FROM the group's own
  // address, so the notification is sent from a separate no-mailbox sender on
  // the Resend-verified domain; replyTo still points at the client.
  const fromEmail = process.env.EVENTOS_QUOTE_FROM ?? "cotizaciones@derivastudio.cl";
  const fromName = "Deriva On Wheels";
  // Group that receives quote requests.
  const to = process.env.EVENTOS_QUOTE_TO ?? "hola@derivastudio.cl";
  if (!apiKey) {
    console.error("[eventos-quote] Missing RESEND_API_KEY");
    return { status: "error", message: ERROR_GENERIC };
  }

  const date = q.date ? formatDate(q.date) : "por definir";
  const subject = `Cotización On Wheels · ${q.kind} · ${q.people} personas · ${date}`;
  const text = [
    "Nueva solicitud de cotización — Deriva On Wheels (derivastudio.cl/eventos)",
    "",
    `Nombre: ${q.name}`,
    `Correo: ${q.email}`,
    `Teléfono: ${q.phone || "—"}`,
    "",
    `Tipo de evento: ${q.kind}`,
    `Fecha: ${date}`,
    `Lugar / comuna: ${q.place || "—"}`,
    `Personas: ${q.people}`,
    `Cafés aprox.: ${q.drinks || "—"}`,
    "",
    "Mensaje:",
    q.message || "—",
    "",
    "Responde este correo para contestarle directamente al cliente."
  ].join("\n");

  try {
    const result = await new Resend(apiKey).emails.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      replyTo: q.email,
      subject,
      text
    });
    if (result.error) {
      console.error("[eventos-quote] Resend error:", result.error);
      return { status: "error", message: ERROR_GENERIC };
    }
    return { status: "success" };
  } catch (error) {
    console.error("[eventos-quote] Unexpected error:", error);
    return { status: "error", message: ERROR_GENERIC };
  }
}
