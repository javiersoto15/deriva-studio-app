import { render } from "@react-email/render";
import { Resend } from "resend";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import AperturaAnnouncement, {
  AperturaAnnouncementSubject,
  AperturaAnnouncementPreview,
} from "../src/emails/AperturaAnnouncement";

loadEnv({ path: resolve(".env.local") });

function stripImagePreloads(html: string): string {
  return html.replace(
    /\s*<link[^>]*rel=("|')preload\1[^>]*as=("|')image\2[^>]*\/?>\s*/gi,
    "",
  );
}

async function send() {
  const to = process.argv[2];
  if (!to) {
    console.error("Usage: npm run email:test-send -- you@example.com");
    process.exit(1);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const fromName = process.env.RESEND_FROM_NAME ?? "Deriva Coffee Studio";

  if (!apiKey) {
    console.error("Missing RESEND_API_KEY in .env.local");
    process.exit(1);
  }

  const resend = new Resend(apiKey);

  const html = stripImagePreloads(
    await render(AperturaAnnouncement(), { pretty: false }),
  );
  const text = await render(AperturaAnnouncement(), { plainText: true });

  console.log(`Sending apertura test to ${to}...`);
  console.log(`From: ${fromName} <${fromEmail}>`);
  console.log(`Subject: ${AperturaAnnouncementSubject}`);

  const result = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to,
    subject: AperturaAnnouncementSubject,
    html,
    text,
    headers: {
      "List-Unsubscribe": `<mailto:${fromEmail}?subject=unsubscribe>`,
    },
  });

  if (result.error) {
    console.error("Send failed:", result.error);
    process.exit(1);
  }
  console.log(`✓ Sent (id: ${result.data?.id})`);
  console.log(`  Preheader: ${AperturaAnnouncementPreview}`);
  console.log(`  Check ${to} inbox — view in real client (Gmail/Apple Mail), not Resend dashboard preview.`);
}

send().catch((err) => {
  console.error(err);
  process.exit(1);
});
