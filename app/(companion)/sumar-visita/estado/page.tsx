import { redirect } from "next/navigation";

// Preserve old route compatibility without showing fabricated receipt states.
export default function ClaimStatusPage(): never {
  redirect("/cartera");
}
