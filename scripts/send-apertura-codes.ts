/**
 * Apertura activation send script.
 *
 * Pulls contacts from the Resend audience, issues one campaign code per
 * recipient via the backend, renders the AperturaActivation email with each
 * recipient's display_code, and sends through Resend's batch API.
 *
 * Auth: requires a fresh Firebase ID token for an owner/manager user in
 * BACKEND_ADMIN_TOKEN. Tokens expire in ~1h, so obtain right before running.
 *
 * Idempotent: re-running with the same --campaign-id returns the same codes
 * from the backend, so failed sends can be retried safely with --only=.
 *
 * Audit CSV is written to tmp/apertura-send-<timestamp>.csv with per-recipient
 * status (sent | dry_run | failed) and Resend message IDs.
 *
 * Usage:
 *   npm run send:apertura -- --campaign-id=apertura-2026-05
 *   npm run send:apertura -- --campaign-id=apertura-2026-05 --dry-run
 *   npm run send:apertura -- --campaign-id=apertura-2026-05 --only=you@x.cl,me@y.cl
 *   npm run send:apertura -- --campaign-id=apertura-2026-05 --limit=5
 */
import { render } from "@react-email/render";
import { Resend } from "resend";
import createClient from "openapi-fetch";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import AperturaActivation, {
  AperturaActivationSubject,
} from "../src/emails/AperturaActivation";
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

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined =>
    args.find((a) => a.startsWith(`${flag}=`))?.split("=")[1];

  const campaignId = get("--campaign-id");
  if (!campaignId) {
    console.error("error: --campaign-id is required (e.g. --campaign-id=apertura-2026-05)");
    process.exit(1);
  }
  return {
    campaignId,
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
  // Defensive fallback: schema marks display_code optional. Format raw code as XXXX-XXXX-XXXX.
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
  const path = resolve(dir, `apertura-send-${campaignId}-${ts}.csv`);
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
  // BACKEND_API_BASE_URL is script-only: must be the full Cloud Run host.
  // NEXT_PUBLIC_API_BASE_URL is for the browser (Next.js rewrite path like "/api"),
  // which a Node script can't use directly. Fall back to it only if it's a full URL.
  const rawBackend =
    process.env.BACKEND_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!rawBackend || !/^https?:\/\//.test(rawBackend)) {
    console.error(
      "error: BACKEND_API_BASE_URL must be set in .env.local to the direct Cloud Run host\n" +
        "       (e.g. https://deriva-companion-api-xxxxx-tl.a.run.app).\n" +
        "       NEXT_PUBLIC_API_BASE_URL is for the browser and is set to a relative path like '/api',\n" +
        "       which a Node script can't use.",
    );
    process.exit(1);
  }
  const backendUrl = rawBackend.replace(/\/$/, "");
  const adminToken = requireEnv("BACKEND_ADMIN_TOKEN");

  const resend = new Resend(resendApiKey);

  console.log("─".repeat(64));
  console.log(`Apertura activation send · ${args.campaignId}`);
  console.log(`Mode: ${args.dryRun ? "DRY RUN (nothing sent)" : "LIVE SEND"}`);
  console.log(`Backend: ${backendUrl}`);
  console.log(`From: ${fromName} <${fromEmail}>`);
  console.log("─".repeat(64));

  // 1. Pull audience
  console.log("→ Fetching Resend audience contacts...");
  const allContacts = await fetchAudienceContacts(resend, audienceId);
  console.log(`  ${allContacts.length} total contacts`);

  // 2. Filter
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
  console.log(`  ${contacts.length} contacts will receive the email`);

  // 3. Issue codes
  console.log(`→ Issuing campaign codes (expires in ${args.expiresInDays} days)...`);
  const emails = contacts.map((c) => c.email);
  const codes = await issueCampaignCodes({
    backendUrl,
    adminToken,
    campaignId: args.campaignId,
    emails,
    expiresInDays: args.expiresInDays,
  });
  console.log(`  ${codes.length} codes issued (idempotent — same codes on re-run)`);

  const codeByEmail = new Map(codes.map((c) => [c.email.toLowerCase(), c]));

  // 4. Render + assemble batch items
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
      await render(AperturaActivation({ displayCode: display }), {
        pretty: false,
      }),
    );
    const text = await render(
      AperturaActivation({ displayCode: display }),
      { plainText: true },
    );
    batchItems.push({
      from: `${fromName} <${fromEmail}>`,
      to: [contact.email],
      subject: AperturaActivationSubject,
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

  // 5. Send (or skip in dry-run)
  if (args.dryRun) {
    console.log(`→ DRY RUN — would send ${batchItems.length} emails (skipping)`);
    // Write one sample HTML for manual inspection
    if (batchItems.length > 0) {
      mkdirSync(resolve("tmp"), { recursive: true });
      const sample = resolve("tmp", `apertura-sample-${batchItems[0].to[0]}.html`);
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

  // 6. Audit
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
