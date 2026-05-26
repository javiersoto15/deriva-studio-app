/**
 * Apertura reminder send script.
 *
 * Reactivation email for the apertura-2026-05 campaign: reminds subscribers
 * that the free first café offer closes Saturday 30 May 2026.
 *
 * Reuses the SAME campaign codes recipients received on 2026-05-18. The
 * backend `/admin/campaign-codes` endpoint is idempotent on (campaign_id,
 * email), so re-issuing returns each recipient's existing code. No fresh
 * codes are minted; subscribers see the same artifact they already have.
 *
 * Auth: requires a fresh Firebase ID token for an owner/manager user in
 * BACKEND_ADMIN_TOKEN. Tokens expire in ~1h, so obtain right before running.
 *
 * Audit CSV is written to tmp/apertura-reminder-<timestamp>.csv with per-
 * recipient status (sent | dry_run | failed) and Resend message IDs.
 *
 * Usage:
 *   npm run send:apertura-reminder
 *   npm run send:apertura-reminder:dry
 *   npm run send:apertura-reminder -- --only=you@x.cl,me@y.cl
 *   npm run send:apertura-reminder -- --limit=5
 */
import { render } from "@react-email/render";
import { Resend } from "resend";
import createClient from "openapi-fetch";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import AperturaReminder, {
  AperturaReminderSubject,
} from "../src/emails/AperturaReminder";
import type { paths, components } from "../src/api/schema";

type CampaignCode = components["schemas"]["CampaignCode"];

loadEnv({ path: resolve(".env.local") });

type Args = {
  campaignId: string;
  dryRun: boolean;
  only: string[] | null;
  limit: number | null;
  expiresInDays: number;
};

type Contact = { id: string; email: string; unsubscribed: boolean };

type BatchItem = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
};

type SendResult = {
  email: string;
  code: string;
  display_code: string;
  status: "sent" | "dry_run" | "failed" | "skipped";
  message_id?: string;
  error?: string;
};

const BATCH_SIZE = 100;
const DEFAULT_CAMPAIGN_ID = "apertura-2026-05";

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined =>
    args.find((a) => a.startsWith(`${flag}=`))?.split("=")[1];

  return {
    campaignId: get("--campaign-id") ?? DEFAULT_CAMPAIGN_ID,
    dryRun: args.includes("--dry-run"),
    only: get("--only")?.split(",").map((s) => s.trim().toLowerCase()) ?? null,
    limit: get("--limit") ? Number(get("--limit")) : null,
    expiresInDays: get("--expires-in-days") ? Number(get("--expires-in-days")) : 30,
  };
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`error: ${name} missing from .env.local`);
    process.exit(1);
  }
  return v;
}

function stripImagePreloads(html: string): string {
  return html.replace(
    /\s*<link[^>]*rel=("|')preload\1[^>]*as=("|')image\2[^>]*\/?>\s*/gi,
    "",
  );
}

async function fetchAudienceContacts(
  resend: Resend,
  audienceId: string,
): Promise<Contact[]> {
  const res = await resend.contacts.list({ audienceId });
  if (res.error) {
    throw new Error(`Resend audience fetch failed: ${res.error.message}`);
  }
  const contacts = res.data?.data ?? [];
  return contacts.map((c) => ({
    id: c.id,
    email: c.email.toLowerCase(),
    unsubscribed: c.unsubscribed,
  }));
}

async function issueCampaignCodes(opts: {
  backendUrl: string;
  adminToken: string;
  campaignId: string;
  emails: string[];
  expiresInDays: number;
}): Promise<CampaignCode[]> {
  const api = createClient<paths>({
    baseUrl: opts.backendUrl,
    headers: { Authorization: `Bearer ${opts.adminToken}` },
  });
  const { data, error, response } = await api.POST("/admin/campaign-codes", {
    body: {
      campaign_id: opts.campaignId,
      emails: opts.emails,
      expires_in_days: opts.expiresInDays,
    },
  });
  if (error || !data) {
    throw new Error(
      `Backend /admin/campaign-codes failed: ${response.status} ${response.statusText}\n${JSON.stringify(error)}`,
    );
  }
  return data.codes;
}

function displayCodeFor(c: CampaignCode): string {
  if (c.display_code) return c.display_code;
  return c.code.match(/.{1,4}/g)?.join("-") ?? c.code;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function writeAuditCsv(results: SendResult[], campaignId: string): string {
  const dir = resolve("tmp");
  mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const path = resolve(dir, `apertura-reminder-${campaignId}-${ts}.csv`);
  const header = "email,display_code,code,status,message_id,error\n";
  const rows = results
    .map((r) => {
      const safe = (s: string | undefined) =>
        s ? `"${s.replace(/"/g, '""')}"` : "";
      return [r.email, r.display_code, r.code, r.status, r.message_id ?? "", r.error ?? ""]
        .map(safe)
        .join(",");
    })
    .join("\n");
  writeFileSync(path, header + rows + "\n");
  return path;
}

async function main() {
  const args = parseArgs();
  const resendApiKey = requireEnv("RESEND_API_KEY");
  const audienceId = requireEnv("RESEND_AUDIENCE_ID");
  const fromEmail = requireEnv("RESEND_FROM_EMAIL");
  const fromName = process.env.RESEND_FROM_NAME ?? "Deriva Coffee Studio";
  const rawBackend =
    process.env.BACKEND_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!rawBackend || !/^https?:\/\//.test(rawBackend)) {
    console.error(
      "error: BACKEND_API_BASE_URL must be set in .env.local to the direct Cloud Run host\n" +
        "       (e.g. https://deriva-companion-api-xxxxx-tl.a.run.app).",
    );
    process.exit(1);
  }
  const backendUrl = rawBackend.replace(/\/$/, "");
  const adminToken = requireEnv("BACKEND_ADMIN_TOKEN");

  const resend = new Resend(resendApiKey);

  console.log("─".repeat(64));
  console.log(`Apertura reminder send · ${args.campaignId}`);
  console.log(`Mode: ${args.dryRun ? "DRY RUN (nothing sent)" : "LIVE SEND"}`);
  console.log(`Backend: ${backendUrl}`);
  console.log(`From: ${fromName} <${fromEmail}>`);
  console.log("─".repeat(64));

  console.log("→ Fetching Resend audience contacts...");
  const allContacts = await fetchAudienceContacts(resend, audienceId);
  console.log(`  ${allContacts.length} total contacts`);

  let contacts = allContacts.filter((c) => !c.unsubscribed);
  if (args.only) {
    const onlySet = new Set(args.only);
    contacts = contacts.filter((c) => onlySet.has(c.email));
    console.log(`  --only filter → ${contacts.length} contacts`);
  }
  if (args.limit) {
    contacts = contacts.slice(0, args.limit);
    console.log(`  --limit ${args.limit} → ${contacts.length} contacts`);
  }
  if (contacts.length === 0) {
    console.log("Nothing to send. Exiting.");
    return;
  }
  console.log(`  ${contacts.length} contacts will receive the reminder`);

  console.log(`→ Re-issuing campaign codes (idempotent on campaign_id + email)...`);
  const emails = contacts.map((c) => c.email);
  const codes = await issueCampaignCodes({
    backendUrl,
    adminToken,
    campaignId: args.campaignId,
    emails,
    expiresInDays: args.expiresInDays,
  });
  console.log(`  ${codes.length} codes returned (same codes as 2026-05-18 for existing recipients)`);

  const codeByEmail = new Map(codes.map((c) => [c.email.toLowerCase(), c]));

  console.log("→ Rendering per-recipient HTML...");
  const batchItems: BatchItem[] = [];
  const results: SendResult[] = [];
  for (const contact of contacts) {
    const code = codeByEmail.get(contact.email);
    if (!code) {
      results.push({
        email: contact.email,
        code: "",
        display_code: "",
        status: "failed",
        error: "no code issued for this email",
      });
      continue;
    }
    const display = displayCodeFor(code);
    const html = stripImagePreloads(
      await render(AperturaReminder({ displayCode: display }), {
        pretty: false,
      }),
    );
    const text = await render(
      AperturaReminder({ displayCode: display }),
      { plainText: true },
    );
    batchItems.push({
      from: `${fromName} <${fromEmail}>`,
      to: [contact.email],
      subject: AperturaReminderSubject,
      html,
      text,
      headers: {
        "List-Unsubscribe": `<mailto:${fromEmail}?subject=unsubscribe>`,
      },
    });
    results.push({
      email: contact.email,
      code: code.code,
      display_code: display,
      status: args.dryRun ? "dry_run" : "sent",
    });
  }

  if (args.dryRun) {
    console.log(`→ DRY RUN — would send ${batchItems.length} emails (skipping)`);
    if (batchItems.length > 0) {
      mkdirSync(resolve("tmp"), { recursive: true });
      const sample = resolve("tmp", `apertura-reminder-sample-${batchItems[0].to[0]}.html`);
      writeFileSync(sample, batchItems[0].html);
      console.log(`  Sample HTML: ${sample}`);
    }
  } else {
    console.log(`→ Sending in batches of ${BATCH_SIZE}...`);
    const batches = chunk(batchItems, BATCH_SIZE);
    let sent = 0;
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const res = await resend.batch.send(batch);
      if (res.error) {
        console.error(`  Batch ${i + 1}/${batches.length} failed: ${res.error.message}`);
        for (const item of batch) {
          const r = results.find((x) => x.email === item.to[0]);
          if (r) {
            r.status = "failed";
            r.error = res.error.message;
          }
        }
        continue;
      }
      const sendResults = res.data?.data ?? [];
      for (let j = 0; j < batch.length; j++) {
        const item = batch[j];
        const sendResult = sendResults[j];
        const r = results.find((x) => x.email === item.to[0]);
        if (r && sendResult) r.message_id = sendResult.id;
      }
      sent += batch.length;
      console.log(`  Batch ${i + 1}/${batches.length} → ${batch.length} queued (${sent}/${batchItems.length})`);
    }
  }

  const csvPath = writeAuditCsv(results, args.campaignId);
  const summary = results.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  console.log("─".repeat(64));
  console.log("Summary:");
  for (const [status, count] of Object.entries(summary)) {
    console.log(`  ${status.padEnd(10)} ${count}`);
  }
  console.log(`Audit CSV: ${csvPath}`);
  console.log("─".repeat(64));

  const failedCount = summary["failed"] ?? 0;
  if (failedCount > 0) {
    console.log(
      `\n⚠ ${failedCount} failed. Re-run with --only=${results
        .filter((r) => r.status === "failed")
        .map((r) => r.email)
        .join(",")} to retry.`,
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\nFatal:", err);
  process.exit(1);
});
