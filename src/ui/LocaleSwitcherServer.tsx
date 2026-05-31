import { getActiveLocale } from "../i18n/server";
import { LocaleSwitcher } from "./LocaleSwitcher";

// Server wrapper that resolves the active UI locale (cookie) and hands it to
// the client LocaleSwitcher as a prop. Reading the cookie makes this dynamic,
// so render it inside a <Suspense> boundary on surfaces with PPR (e.g. the
// landing /menu page) to keep the static shell prerenderable.
export async function LocaleSwitcherServer() {
  const current = await getActiveLocale();
  return <LocaleSwitcher current={current} />;
}
