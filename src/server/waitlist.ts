"use server";

import { Resend } from "resend";
import { z } from "zod";
import { getCampaignCopy, campaignConfig, waitlistConfig, type Campaign } from "../config/waitlist";
import { buildWelcomeEmailFor } from "./welcome-email";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  name: z.string().trim().max(80).optional().or(z.literal("")),
  consent: z.literal("on"),
  // Honeypot — bots fill this; real users won't.
  company: z.string().max(0).optional().or(z.literal("")),
  campaign: z.enum(["apertura", "companion"]).default("apertura"),
});

export type WaitlistState =
  | { status: "idle" }
  | { status: "success"; title: string; body: string }
  | { status: "error"; message: string };

const recentSubmissions = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

function rateLimit(key: string): boolean {
  const now = Date.now();
  const recent = (recentSubmissions.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    recentSubmissions.set(key, recent);
    return false;
  }
  recent.push(now);
  recentSubmissions.set(key, recent);
  return true;
}

export async function subscribeToWaitlist(
  _previous: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    name: formData.get("name") ?? "",
    consent: formData.get("consent"),
    company: formData.get("company") ?? "",
    campaign: formData.get("campaign") ?? "apertura",
  });

  if (!parsed.success) {
    return { status: "error", message: getCampaignCopy("apertura").errorInvalid };
  }

  const { email, name, campaign } = parsed.data;
  const copy = getCampaignCopy(campaign);
  const firstName = name && name.length > 0 ? name : undefined;

  if (!rateLimit(`${campaign}:${email}`)) {
    return { status: "error", message: copy.errorRateLimit };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env[campaignConfig[campaign].audienceEnvVar];
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const fromName = process.env.RESEND_FROM_NAME ?? waitlistConfig.brandName;

  if (!apiKey || !audienceId) {
    console.error("[waitlist] Missing RESEND_API_KEY or RESEND_AUDIENCE_ID");
    return { status: "error", message: copy.errorGeneric };
  }

  const resend = new Resend(apiKey);

  try {
    const contactResult = await resend.contacts.create({
      email,
      firstName,
      audienceId,
      unsubscribed: false,
    });

    if (contactResult.error) {
      const msg = String(contactResult.error.message ?? "").toLowerCase();
      const alreadyExists = msg.includes("already") || msg.includes("exists");
      if (!alreadyExists) {
        console.error("[waitlist] Resend contacts.create error:", contactResult.error);
        return { status: "error", message: copy.errorGeneric };
      }
      return { status: "success", title: copy.successTitle, body: copy.successBody };
    }

    const welcome = buildWelcomeEmailFor(campaign, firstName);
    const sendResult = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: welcome.subject,
      html: welcome.html,
      text: welcome.text,
      headers: {
        "List-Unsubscribe": `<mailto:${fromEmail}?subject=unsubscribe>`,
      },
    });

    if (sendResult.error) {
      console.error("[waitlist] Resend emails.send error:", sendResult.error);
    }

    return { status: "success", title: copy.successTitle, body: copy.successBody };
  } catch (error) {
    console.error("[waitlist] Unexpected error:", error);
    return { status: "error", message: copy.errorGeneric };
  }
}
