// Shared notification helper: persists an in-app notification AND fans out a Web Push.
// Safe to call from any edge function — push errors are swallowed so business flow never breaks.

type AdminClient = { from: (t: string) => any };

export interface NotifyArgs {
  userId: string;
  title: string;
  body: string;
  type?: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

export async function notifyUser(admin: AdminClient, args: NotifyArgs) {
  const { userId, title, body, type = "general", url = "/", metadata = {} } = args;

  // 1. Always persist in-app notification (powers the bell + realtime toast)
  try {
    await admin.from("notifications").insert({
      user_id: userId,
      title,
      message: body,
      type,
      metadata,
    });
  } catch (_) { /* swallow */ }

  // 2. Best-effort Web Push fan-out
  try {
    const url_ = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push`;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    await fetch(url_, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
      body: JSON.stringify({ user_id: userId, title, body, url, data: metadata }),
    });
  } catch (_) { /* swallow — push is best-effort */ }
}