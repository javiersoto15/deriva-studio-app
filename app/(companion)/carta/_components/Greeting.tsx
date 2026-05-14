"use client";

import { useCurrentMember } from "../../../../src/api/hooks";
import { colors } from "../../../../src/design/tokens";
import { displayFirstName, type MemberWithFirstName } from "../../../../src/lib/member";

// Phase 2B.4 — Auth-gated greeting island.
// Reads useCurrentMember() (TanStack Query) and renders the Cormorant headline.
// Renders an em-dash placeholder during loading so the page layout doesn't shift.
export function Greeting() {
  const { data: member } = useCurrentMember();
  const firstName = displayFirstName(member as MemberWithFirstName | undefined);
  const greetingName = firstName.length > 0 ? firstName : "—";

  return (
    <h1
      style={{
        margin: 0,
        fontFamily: "var(--font-display), serif",
        fontStyle: "italic",
        fontWeight: 300,
        fontSize: 44,
        lineHeight: "50px",
        letterSpacing: "-0.01em",
        color: colors.brown700
      }}
    >
      Buenos días, {greetingName}.
    </h1>
  );
}
