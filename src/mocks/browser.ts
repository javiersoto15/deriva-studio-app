"use client";

import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

let started = false;

export async function startMockServiceWorker() {
  if (started || typeof window === "undefined") return;
  started = true;
  await worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: { url: "/mockServiceWorker.js" }
  });
}
