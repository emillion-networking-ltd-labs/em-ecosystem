"use client";

import FingerprintJS from "@fingerprintjs/fingerprintjs";

let cachedFingerprint: string | null = null;
let loadPromise: Promise<string> | null = null;

export function getFingerprint(): Promise<string> {
  if (cachedFingerprint) return Promise.resolve(cachedFingerprint);
  if (loadPromise) return loadPromise;

  loadPromise = FingerprintJS.load()
    .then((fp) => fp.get())
    .then((result) => {
      cachedFingerprint = result.visitorId;
      return result.visitorId;
    })
    .catch(() => {
      // Fail-open: login still works, just can't skip MFA
      return "";
    })
    .finally(() => {
      loadPromise = null;
    });

  return loadPromise;
}
