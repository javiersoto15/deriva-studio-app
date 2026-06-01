import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { buildCompanionWelcomeEmail } from "../src/server/welcome-email";

const { subject, html, text } = buildCompanionWelcomeEmail("Javier");
mkdirSync(resolve("docs/email"), { recursive: true });
writeFileSync(resolve("docs/email/companion-welcome.html"), html, "utf8");
writeFileSync(resolve("docs/email/companion-welcome.txt"), text, "utf8");
console.log(`✓ Companion welcome\n  Subject: ${subject}\n  HTML: docs/email/companion-welcome.html`);
