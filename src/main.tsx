import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Detect preview/iframe contexts where a service worker would interfere
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const host = window.location.hostname;
const isPreviewHost =
  host.includes("id-preview--") ||
  host.includes("lovableproject.com") ||
  host.includes("lovable.app") ||
  host === "localhost" ||
  host === "127.0.0.1";

const shouldDisableSW = isPreviewHost || isInIframe;

if ("serviceWorker" in navigator) {
  if (shouldDisableSW) {
    // Aggressively kill any previously-installed SW + caches that may be
    // intercepting auth/network calls in the preview environment.
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
    if (typeof caches !== "undefined") {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    }
  } else {
    // Production: register the PWA service worker only on real domains.
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* ignore */
      });
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
