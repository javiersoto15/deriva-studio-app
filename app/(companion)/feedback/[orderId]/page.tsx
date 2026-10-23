import { redirect } from "next/navigation";

// Backward-compatible link from the former order-specific feedback screen.
// Reviews now describe the visit and are submitted without a fabricated order.
export default function LegacyOrderFeedbackPage(): never {
  redirect("/feedback");
}
