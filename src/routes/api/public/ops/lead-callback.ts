import { createFileRoute } from "@tanstack/react-router";
import type { Json } from "@/integrations/supabase/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ALLOWED_OPS_KEYS = new Set([
  "processing_started_at",
  "processed_at",
  "label",
  "reason",
  "method",
  "rules_version",
  "emailed",
  "skipped_reason",
  "notified",
  "error",
]);

type Action = "claim" | "complete" | "error";

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function pickAllowedOps(ops: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(ops)) {
    if (ALLOWED_OPS_KEYS.has(k)) out[k] = v;
  }
  return out;
}

export const Route = createFileRoute("/api/public/ops/lead-callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.CKA_OPS_CALLBACK_SECRET;
        const provided = request.headers.get("x-cka-ops-secret");
        if (!secret || !provided || provided !== secret) {
          return json(401, { error: "Unauthorized" });
        }

        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return json(400, { error: "Invalid JSON" });
        }
        if (!isPlainObject(payload)) {
          return json(400, { error: "Invalid payload" });
        }

        const { lead_id, action, ops } = payload as {
          lead_id?: unknown;
          action?: unknown;
          ops?: unknown;
        };

        if (typeof lead_id !== "string" || !UUID_RE.test(lead_id)) {
          return json(400, { error: "Invalid lead_id" });
        }
        if (
          action !== "claim" &&
          action !== "complete" &&
          action !== "error"
        ) {
          return json(400, { error: "Invalid action" });
        }
        const opsObj: Record<string, unknown> =
          ops === undefined ? {} : isPlainObject(ops) ? ops : (null as never);
        if (ops !== undefined && !isPlainObject(ops)) {
          return json(400, { error: "Invalid ops" });
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        // Load current lead row
        const { data: lead, error: readErr } = await supabaseAdmin
          .from("leads")
          .select("id, metadata")
          .eq("id", lead_id)
          .maybeSingle();

        if (readErr) {
          console.error("[lead-callback] read error", readErr.message);
          return json(500, { error: "Internal error" });
        }
        if (!lead) return json(404, { error: "Lead not found" });

        const metadata: Record<string, unknown> = isPlainObject(lead.metadata)
          ? (lead.metadata as Record<string, unknown>)
          : {};
        const currentOps: Record<string, unknown> = isPlainObject(
          metadata.ops,
        )
          ? (metadata.ops as Record<string, unknown>)
          : {};

        const handleAction = action as Action;

        if (handleAction === "claim") {
          if (metadata.ops !== undefined) {
            return json(200, { claimed: false });
          }
          const nextMeta = {
            ...metadata,
            ops: { processing_started_at: new Date().toISOString() },
          };
          // Atomic guard: only update if metadata->ops is still null
          const { data: updated, error: updErr } = await supabaseAdmin
            .from("leads")
            .update({ metadata: nextMeta as unknown as Json })
            .eq("id", lead_id)
            .is("metadata->ops", null)
            .select("id")
            .maybeSingle();
          if (updErr) {
            console.error("[lead-callback] claim error", updErr.message);
            return json(500, { error: "Internal error" });
          }
          if (!updated) return json(200, { claimed: false });
          return json(200, { claimed: true });
        }

        if (handleAction === "complete") {
          const allowed = pickAllowedOps(opsObj);
          const nextOps = { ...currentOps, ...allowed };
          const nextMeta = { ...metadata, ops: nextOps };
          const { error: updErr } = await supabaseAdmin
            .from("leads")
            .update({ metadata: nextMeta as unknown as Json })
            .eq("id", lead_id);
          if (updErr) {
            console.error("[lead-callback] complete error", updErr.message);
            return json(500, { error: "Internal error" });
          }
          return json(200, { ok: true });
        }

        // error action
        const errorPayload = isPlainObject(opsObj.error)
          ? opsObj.error
          : opsObj;
        const nextOps = { ...currentOps, error: errorPayload };
        // Never set processed_at automatically
        delete (nextOps as Record<string, unknown>).processed_at;
        if (isPlainObject(currentOps) && currentOps.processed_at !== undefined) {
          (nextOps as Record<string, unknown>).processed_at =
            currentOps.processed_at;
        }
        const nextMeta = { ...metadata, ops: nextOps };
        const { error: updErr } = await supabaseAdmin
          .from("leads")
          .update({ metadata: nextMeta as unknown as Json })
          .eq("id", lead_id);
        if (updErr) {
          console.error("[lead-callback] error action failed", updErr.message);
          return json(500, { error: "Internal error" });
        }
        return json(200, { ok: true });
      },
    },
  },
});