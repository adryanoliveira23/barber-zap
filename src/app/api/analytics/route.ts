import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const allowedEvents = new Set([
  "landing_view",
  "section_view",
  "cta_click",
  "checkout_click",
  "pricing_view",
]);

interface AnalyticsPayload {
  sessionId?: string;
  eventName?: string;
  path?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
}

export async function POST(request: Request) {
  let payload: AnalyticsPayload;

  try {
    payload = (await request.json()) as AnalyticsPayload;
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  if (!payload.sessionId || !payload.eventName || !allowedEvents.has(payload.eventName)) {
    return NextResponse.json({ error: "Evento inválido" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.from("landing_events").insert({
    session_id: payload.sessionId.slice(0, 128),
    event_name: payload.eventName,
    path: payload.path?.slice(0, 500) || null,
    referrer: payload.referrer?.slice(0, 500) || null,
    utm_source: payload.utm?.source?.slice(0, 120) || null,
    utm_medium: payload.utm?.medium?.slice(0, 120) || null,
    utm_campaign: payload.utm?.campaign?.slice(0, 120) || null,
    utm_content: payload.utm?.content?.slice(0, 120) || null,
    utm_term: payload.utm?.term?.slice(0, 120) || null,
    metadata: payload.metadata || {},
  });

  if (error) {
    console.error("Erro ao registrar evento da landing:", error);
    return NextResponse.json({ error: "Falha ao registrar evento" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
