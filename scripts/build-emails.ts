import { render } from "@react-email/render";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import AperturaAnnouncement, {
  AperturaAnnouncementSubject,
  AperturaAnnouncementPreview,
} from "../src/emails/AperturaAnnouncement";
import AperturaActivation, {
  AperturaActivationSubject,
  AperturaActivationPreview,
} from "../src/emails/AperturaActivation";
import AperturaReminder, {
  AperturaReminderSubject,
  AperturaReminderPreview,
} from "../src/emails/AperturaReminder";
import PollaReward, {
  PollaRewardSubject,
  PollaRewardPreview,
} from "../src/emails/PollaReward";

function stripImagePreloads(html: string): string {
  return html.replace(
    /\s*<link[^>]*rel=("|')preload\1[^>]*as=("|')image\2[^>]*\/?>\s*/gi,
    "",
  );
}

type Template = {
  name: string;
  subject: string;
  preview: string;
  htmlOut: string;
  txtOut: string;
  render: () => Promise<{ html: string; text: string }>;
};

const templates: Template[] = [
  {
    name: "Apertura Announcement",
    subject: AperturaAnnouncementSubject,
    preview: AperturaAnnouncementPreview,
    htmlOut: resolve("docs/email/apertura-announcement.html"),
    txtOut: resolve("docs/email/apertura-announcement.txt"),
    render: async () => ({
      html: stripImagePreloads(
        await render(AperturaAnnouncement(), { pretty: true }),
      ),
      text: await render(AperturaAnnouncement(), { plainText: true }),
    }),
  },
  {
    name: "Apertura Activation",
    subject: AperturaActivationSubject,
    preview: AperturaActivationPreview,
    htmlOut: resolve("docs/email/apertura-activation.html"),
    txtOut: resolve("docs/email/apertura-activation.txt"),
    render: async () => {
      // Build artifact uses the static preview props so the file is inspectable.
      // At send time, Resend personalization replaces {{welcome_code}} and
      // {{token}} per recipient — see §3.5 / §3.6 of the companion spec.
      const props = AperturaActivation.PreviewProps;
      return {
        html: stripImagePreloads(
          await render(AperturaActivation(props), { pretty: true }),
        ),
        text: await render(AperturaActivation(props), { plainText: true }),
      };
    },
  },
  {
    name: "Apertura Reminder",
    subject: AperturaReminderSubject,
    preview: AperturaReminderPreview,
    htmlOut: resolve("docs/email/apertura-reminder.html"),
    txtOut: resolve("docs/email/apertura-reminder.txt"),
    render: async () => {
      const props = AperturaReminder.PreviewProps;
      return {
        html: stripImagePreloads(
          await render(AperturaReminder(props), { pretty: true }),
        ),
        text: await render(AperturaReminder(props), { plainText: true }),
      };
    },
  },
  {
    name: "Polla Reward",
    subject: PollaRewardSubject,
    preview: PollaRewardPreview,
    htmlOut: resolve("docs/email/polla-reward.html"),
    txtOut: resolve("docs/email/polla-reward.txt"),
    render: async () => {
      // Build artifact uses static preview props so the file is inspectable.
      // At send time, the backend supplies firstName / rewardLabel / shortCode /
      // qrImageUrl / validityLabel per winner (rewardLabel rendered verbatim).
      const props = PollaReward.PreviewProps;
      return {
        html: stripImagePreloads(
          await render(PollaReward(props), { pretty: true }),
        ),
        text: await render(PollaReward(props), { plainText: true }),
      };
    },
  },
];

async function build() {
  for (const t of templates) {
    const { html, text } = await t.render();
    writeFileSync(t.htmlOut, html, "utf8");
    writeFileSync(t.txtOut, text, "utf8");
    console.log(`✓ ${t.name}`);
    console.log(`  Subject:   ${t.subject}`);
    console.log(`  Preheader: ${t.preview}`);
    console.log(`  HTML:      ${t.htmlOut}`);
    console.log(`  Text:      ${t.txtOut}`);
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
