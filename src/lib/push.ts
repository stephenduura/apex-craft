// Web Push subscription helpers
import { supabase } from "@/integrations/supabase/client";

// Public VAPID key (safe to ship to the client). Server holds the private half.
export const VAPID_PUBLIC_KEY =
  "BJsY46m2YV0_DxNZhhtc9-ygofbdmE0EsZOdVfkgwRxz8PB356DPkGOA97eCFRgD18cX787LcZPOxU7rx3Chf4A";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function bufferToBase64(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

export const isPushSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

export async function subscribeToPush(userId: string): Promise<boolean> {
  if (!isPushSupported()) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  // Wait for the active SW (PWA SW). On preview hosts this never registers,
  // so push will silently no-op there — which is the desired behaviour.
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  if (!reg) return false;

  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));

  const json: any = sub.toJSON();
  const endpoint = sub.endpoint;
  const p256dh = json.keys?.p256dh ?? bufferToBase64(sub.getKey("p256dh"));
  const auth = json.keys?.auth ?? bufferToBase64(sub.getKey("auth"));

  const { error } = await supabase
    .from("push_subscriptions" as any)
    .upsert(
      { user_id: userId, endpoint, p256dh, auth, user_agent: navigator.userAgent },
      { onConflict: "endpoint" },
    );

  return !error;
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return true;
  await supabase.from("push_subscriptions" as any).delete().eq("endpoint", sub.endpoint);
  return await sub.unsubscribe();
}