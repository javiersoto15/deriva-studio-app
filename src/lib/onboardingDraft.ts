// Onboarding draft — captures user input across the 4-step signup flow before
// the member row exists on the backend. The full envelope (name + preferences
// + consent) is POSTed to /members in the consent step, then this draft is
// cleared. SessionStorage (not localStorage) so it dies with the tab.

const KEY = "deriva:onboarding-draft";

export type OnboardingDraft = {
  name?: string;
  favorite_drink?: string;
  milk?: string;
  note?: string;
  // Optional email captured at the /ingresar/email step. Sent unverified
  // inside the POST /members body — backend persists it with
  // email_verified_at=null. The frontend then triggers POST /me/email after
  // member creation to queue the Firebase action-link verification.
  email?: string;
};

export function readDraft(): OnboardingDraft {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as OnboardingDraft;
  } catch {
    return {};
  }
}

export function writeDraft(patch: OnboardingDraft): void {
  if (typeof window === "undefined") return;
  const next = { ...readDraft(), ...patch };
  window.sessionStorage.setItem(KEY, JSON.stringify(next));
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(KEY);
}
