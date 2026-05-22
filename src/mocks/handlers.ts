import { HttpResponse, http } from "msw";
import {
  fixtureActivityLedger,
  fixtureActivityPreview,
  fixtureBalance,
  fixtureClaims,
  fixtureFavorites,
  fixtureIdentity,
  fixtureItemDetailView,
  fixtureLedgerEntries,
  fixtureMember,
  fixtureMemberProfileView,
  fixtureMenuItems,
  fixtureOriginCanonical,
  fixtureOriginCardView,
  fixtureOriginsCanonical,
  fixtureOriginViews,
  fixtureReconciledMember,
  fixtureRewardsDetailed
} from "./data";

const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const url = (path: string) => `${base}${path}`;
const pattern = (path: string) => url(path).replace(/\/:[^/]+/g, "/*");

function inFive() {
  return new Date(Date.now() + 5 * 60 * 1000).toISOString();
}
function inSixty() {
  return new Date(Date.now() + 60 * 1000).toISOString();
}

// =============================================================================
// Canonical routes — shapes match openapi.yaml exactly.
// =============================================================================
const canonicalHandlers = [
  http.get(url("/healthz"), () => HttpResponse.json({ status: "ok" })),

  // /menu returns MenuItem[] per contract.
  http.get(url("/menu"), ({ request }) => {
    const u = new URL(request.url);
    const category = u.searchParams.get("category");
    const section = u.searchParams.get("section");
    const items = fixtureMenuItems.filter((item) => {
      if (category && item.category_id !== category) return false;
      if (section && item.section_id !== section) return false;
      return true;
    });
    return HttpResponse.json(items);
  }),

  // /menu/items/{id} — canonical MenuItem.
  http.get(pattern("/menu/items/:id"), ({ params }) => {
    const id = String(params.id ?? "");
    const item = fixtureMenuItems.find((i) => i.id === id);
    if (!item) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(item);
  }),

  // /menu/origins/{id} — canonical OriginCard. Looks up by id; falls back to the
  // House Blend default so legacy callers (or stale ids in caches) keep working.
  http.get(pattern("/menu/origins/:id"), ({ params }) => {
    const id = String(params.id ?? "");
    return HttpResponse.json(fixtureOriginsCanonical[id] ?? fixtureOriginCanonical);
  }),

  // /me — canonical MemberSelfProfile (Member + user_id + linked_providers).
  http.get(url("/me"), () =>
    HttpResponse.json({
      ...fixtureMember,
      user_id: fixtureIdentity.user_id,
      linked_providers: fixtureIdentity.linked_providers
    })
  ),
  http.patch(url("/me"), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ...fixtureMember,
      ...body,
      user_id: fixtureIdentity.user_id,
      linked_providers: fixtureIdentity.linked_providers
    });
  }),

  // /me/identity — IdentitySummary (user_id, verified flags, linked_providers).
  http.get(url("/me/identity"), () => HttpResponse.json(fixtureIdentity)),

  // Identity mutations. Dev defaults to happy-path; flip the `?conflict=`
  // query param on the dev page (or temporarily edit here) to exercise the
  // 409 IdentityConflict surfaces.
  http.post(url("/me/email"), async ({ request }) => {
    const body = (await request.json()) as { email?: string };
    // Cheap conflict-fuzz: emails starting with "taken+" return 409.
    if (typeof body.email === "string" && body.email.toLowerCase().startsWith("taken+")) {
      return HttpResponse.json(
        {
          code: "email_taken",
          message: "Este email ya tiene cuenta.",
          suggestion: "use-other-method",
          conflict_field: "email"
        },
        { status: 409 }
      );
    }
    return HttpResponse.json({ queued: true, email: body.email ?? "" }, { status: 202 });
  }),
  http.delete(url("/me/email"), () => new HttpResponse(null, { status: 204 })),

  // Phone preflight — backend no longer creates an OTP session. Firebase
  // owns OTP. Backend returns 202 { ready: true } or 409 IdentityConflict.
  http.post(url("/me/phone"), async ({ request }) => {
    const body = (await request.json()) as { phone?: string };
    if (typeof body.phone === "string" && body.phone.includes("0000")) {
      return HttpResponse.json(
        {
          code: "phone_taken",
          message: "Este número ya tiene cuenta.",
          suggestion: "use-other-method",
          conflict_field: "phone"
        },
        { status: 409 }
      );
    }
    return HttpResponse.json({ ready: true }, { status: 202 });
  }),

  // Phone confirm — after Firebase OTP and forced ID-token refresh, the
  // backend reads phone_number off the bearer and binds it. Returns the
  // new LinkedProvider row. In dev we return a synthetic linked entry that
  // mirrors the seeded identity shape. /me/phone/confirm is POST-only.
  http.post(url("/me/phone/confirm"), () =>
    HttpResponse.json({
      provider: "phone",
      subject: "+56912344421",
      verified_at: new Date().toISOString(),
      linked_at: new Date().toISOString()
    })
  ),

  // Phone delete — mounted on the bare /me/phone, symmetric with /me/email.
  http.delete(url("/me/phone"), () => new HttpResponse(null, { status: 204 })),

  http.post(url("/me/link-provider"), async ({ request }) => {
    const body = (await request.json()) as { provider?: string };
    if (body.provider === "google.com") {
      // Already linked in fixtureIdentity — simulate a provider_taken conflict.
      return HttpResponse.json(
        {
          code: "provider_taken",
          message: "Este método ya está conectado a otra cuenta.",
          suggestion: "use-other-method",
          conflict_field: "provider"
        },
        { status: 409 }
      );
    }
    return new HttpResponse(null, { status: 201 });
  }),
  http.delete(pattern("/me/link-provider/:provider"), ({ params }) => {
    // Block disconnecting the only remaining provider.
    if (fixtureIdentity.linked_providers.length <= 1) {
      return HttpResponse.json(
        {
          code: "last_method_cant_remove",
          message: "Este es tu único método de ingreso.",
          suggestion: "contact-support",
          conflict_field: "provider"
        },
        { status: 409 }
      );
    }
    void params;
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(url("/me/balance"), () => HttpResponse.json(fixtureBalance)),

  http.post(url("/me/member-qr-token"), () =>
    HttpResponse.json({
      token: `fake-hmac-${Math.random().toString(36).slice(2, 10)}`,
      expires_at: inFive(),
      backup_code: fixtureMember.member_qr_backup_code ?? fixtureMember.member_code
    })
  ),

  // Canonical RewardRedemptionTokenResponse — { token, expires_at, short_code }
  // per the updated openapi.yaml (migration 007). short_code uses the Crockford
  // alphabet (2-9, A-H, J-N, P-Z) — 4 characters.
  http.post(pattern("/me/rewards/:id/redemption-token"), ({ params }) => {
    const slug = String(params.id ?? "x").toLowerCase();
    const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let shortCode = "";
    for (let i = 0; i < 4; i++) {
      shortCode += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return HttpResponse.json({
      token: `rwd-${slug}-${Math.random().toString(36).slice(2, 8)}`,
      expires_at: inSixty(),
      short_code: shortCode
    });
  }),

  http.delete(pattern("/me/favorites/:id"), () => new HttpResponse(null, { status: 204 })),

  // POST /me/orders/{id}/feedback — stubbed in backend; mock returns 200.
  http.post(pattern("/me/orders/:id/feedback"), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ok: true, ...body });
  }),

  // /staff/lookup — canonical StaffLookupResponse { matches: Member[] }.
  http.post(url("/staff/lookup"), () => HttpResponse.json({ matches: [fixtureMember] })),

  // StaffRedemptionRequest now anyOf token | short_code (migration 007 + openapi).
  http.post(url("/staff/redemptions"), async ({ request }) => {
    const body = (await request.json()) as {
      member_id: string;
      reward_id: string;
      token?: string;
      short_code?: string;
      reason?: string;
    };
    return HttpResponse.json(
      {
        id: "rdm_1",
        member_id: body.member_id,
        reward_id: body.reward_id,
        actor_id: "staff_ana",
        points_cost_at_redemption: 700,
        reason: body.reason,
        created_at: new Date().toISOString()
      },
      { status: 201 }
    );
  }),

  http.post(url("/staff/points-adjustments"), () =>
    HttpResponse.json({ error: "not implemented" }, { status: 501 })
  ),
  http.post(url("/staff/orders/attach"), () =>
    HttpResponse.json({ error: "not implemented" }, { status: 501 })
  ),

  // /members — canonical Member.
  http.post(url("/members"), () => HttpResponse.json(fixtureMember, { status: 201 })),
  http.get(pattern("/members/:id"), () => HttpResponse.json(fixtureMember)),
  http.post(pattern("/members/:id/favorites"), async ({ request, params }) => {
    const body = (await request.json()) as { item_id: string };
    return HttpResponse.json(
      { member_id: String(params.id ?? ""), item_id: body.item_id },
      { status: 201 }
    );
  }),
  http.get(pattern("/members/:id/points-ledger"), () => HttpResponse.json(fixtureLedgerEntries)),

  // Manual purchases / admin reward redeem — canonical LedgerEntry / Redemption.
  // Note: backend (migration 004) now enforces receipt idempotency for
  // reason='manual_purchase'. A duplicate receipt will return 409 from real API;
  // the mock keeps the optimistic 201 since this surface is admin-only and not
  // exercised by the customer client.
  http.post(url("/admin/manual-purchases"), async ({ request }) => {
    const body = (await request.json()) as { member_id: string; receipt?: string };
    return HttpResponse.json(
      {
        id: "led_new",
        member_id: body.member_id,
        points: 50,
        reason: "manual_purchase",
        receipt: body.receipt,
        created_at: new Date().toISOString()
      },
      { status: 201 }
    );
  }),
  http.post(url("/admin/rewards/redeem"), async ({ request }) => {
    const body = (await request.json()) as { member_id: string; reward_id: string; reason?: string };
    return HttpResponse.json(
      {
        id: "rdm_new",
        member_id: body.member_id,
        reward_id: body.reward_id,
        actor_id: "staff_ana",
        points_cost_at_redemption: 700,
        reason: body.reason,
        created_at: new Date().toISOString()
      },
      { status: 201 }
    );
  }),

  // /missing-points-claims — canonical MissingPointsClaim.
  http.post(url("/missing-points-claims"), async ({ request }) => {
    const body = (await request.json()) as {
      member_id: string;
      receipt: string;
      purchase_at: string;
      amount_clp: number;
    };
    return HttpResponse.json(
      {
        id: `clm_${Math.random().toString(36).slice(2, 8)}`,
        state: "pending",
        created_at: new Date().toISOString(),
        ...body
      },
      { status: 201 }
    );
  }),

  // Admin audit logs — canonical AuditEntry[].
  http.get(url("/admin/audit-log"), () => HttpResponse.json([])),
  http.get(url("/admin/audit-logs"), () => HttpResponse.json([])),

  // Admin 501 stubs.
  ...["/admin/menu", "/admin/rewards", "/admin/analytics", "/admin/receipt-claims"].map((p) =>
    http.get(url(p), () => HttpResponse.json({ error: "not implemented" }, { status: 501 }))
  ),
  http.post(url("/admin/menu/items"), () =>
    HttpResponse.json({ error: "not implemented" }, { status: 501 })
  ),
  http.patch(pattern("/admin/menu/items/:id"), () =>
    HttpResponse.json({ error: "not implemented" }, { status: 501 })
  ),
  http.delete(pattern("/admin/menu/items/:id"), () =>
    HttpResponse.json({ error: "not implemented" }, { status: 501 })
  ),
  http.post(url("/admin/rewards"), () =>
    HttpResponse.json({ error: "not implemented" }, { status: 501 })
  ),
  http.patch(pattern("/admin/rewards/:id"), () =>
    HttpResponse.json({ error: "not implemented" }, { status: 501 })
  ),
  http.delete(pattern("/admin/rewards/:id"), () =>
    HttpResponse.json({ error: "not implemented" }, { status: 501 })
  ),
  http.post(pattern("/admin/missing-points-claims/:id/approve"), async ({ params, request }) => {
    const body = (await request.json()) as { reason: string };
    return HttpResponse.json({
      id: String(params.id ?? ""),
      member_id: fixtureMember.id,
      receipt: "",
      purchase_at: new Date().toISOString(),
      amount_clp: 0,
      state: "approved",
      reason: body.reason,
      reviewed_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    });
  }),
  http.post(pattern("/admin/missing-points-claims/:id/reject"), async ({ params, request }) => {
    const body = (await request.json()) as { reason: string };
    return HttpResponse.json({
      id: String(params.id ?? ""),
      member_id: fixtureMember.id,
      receipt: "",
      purchase_at: new Date().toISOString(),
      amount_clp: 0,
      state: "rejected",
      reason: body.reason,
      reviewed_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    });
  })
];

// =============================================================================
// UI-only routes — not in canonical contract; MSW dev-only convenience.
// =============================================================================
const uiOnlyHandlers = [
  // Rich item / origin detail views.
  http.get(pattern("/menu/items/:id/view"), ({ params }) => {
    const id = String(params.id ?? "");
    const detail = fixtureItemDetailView[id];
    if (detail) return HttpResponse.json(detail);
    return new HttpResponse(null, { status: 404 });
  }),
  http.get(pattern("/menu/origins/:id/view"), ({ params }) => {
    const id = String(params.id ?? "");
    return HttpResponse.json(fixtureOriginViews[id] ?? fixtureOriginCardView);
  }),

  // Member self-service surfaces beyond the canonical /me.
  http.get(url("/me/profile"), () => HttpResponse.json(fixtureMemberProfileView)),
  http.patch(url("/me/profile"), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...fixtureMemberProfileView, ...body });
  }),
  http.get(url("/me/rewards"), () =>
    HttpResponse.json({ rewards: fixtureRewardsDetailed, total: fixtureRewardsDetailed.length })
  ),
  http.get(url("/me/activity/preview"), () =>
    HttpResponse.json({ entries: fixtureActivityPreview, month_summary: "MAYO · +487 pts" })
  ),
  http.get(url("/me/activity/ledger"), () =>
    HttpResponse.json({
      entries: fixtureActivityLedger,
      summary: "12 VISITAS EN MAYO · 487 PUNTOS GANADOS"
    })
  ),
  http.get(url("/me/favorites"), () => HttpResponse.json(fixtureFavorites)),
  http.post(url("/me/preferences"), async ({ request }) => HttpResponse.json(await request.json())),
  http.get(url("/me/claims"), () => HttpResponse.json({ entries: fixtureClaims })),

  // §3.5 campaign-token reconciliation. Mock doesn't validate signatures —
  // accepts any token. Two reserved strings simulate error branches:
  //   "expired" → 410 Gone
  //   "invalid" → 404 Not Found
  http.post(url("/me/redeem-campaign-token"), async ({ request }) => {
    const body = (await request.json()) as { token?: string };
    const token = body.token ?? "";
    if (token === "expired") {
      return HttpResponse.json({ error: "token_expired" }, { status: 410 });
    }
    if (token === "invalid") {
      return HttpResponse.json({ error: "token_invalid" }, { status: 404 });
    }
    return HttpResponse.json({
      matched: true,
      email: fixtureReconciledMember.email,
      first_name: fixtureReconciledMember.first_name
    });
  })
];

export const handlers = [...canonicalHandlers, ...uiOnlyHandlers];
