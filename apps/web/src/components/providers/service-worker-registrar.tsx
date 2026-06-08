"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker. Only active in production builds — in
 * development the service worker would interfere with Turbopack HMR and serve
 * stale assets, so registration is skipped (and any stale SW is removed).
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      // Clean up any service worker left over from a previous prod build.
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => void registration.unregister());
      });
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          /* Registration failures are non-fatal; the app still works online. */
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
