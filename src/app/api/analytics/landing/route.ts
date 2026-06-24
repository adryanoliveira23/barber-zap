import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const events = Array.isArray(body?.events) ? body.events : [];

        if (events.length === 0) {
            return NextResponse.json({ ok: true, ignored: true });
        }

        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);
        const rows = events.map((event: any) => ({
            session_id: typeof event.session_id === "string" ? event.session_id : null,
            event_name: typeof event.event_name === "string" ? event.event_name : "unknown",
            path: typeof event.path === "string" ? event.path : null,
            referrer: typeof event.referrer === "string" ? event.referrer : null,
            utm_source: typeof event.utm_source === "string" ? event.utm_source : null,
            utm_medium: typeof event.utm_medium === "string" ? event.utm_medium : null,
            utm_campaign: typeof event.utm_campaign === "string" ? event.utm_campaign : null,
            utm_content: typeof event.utm_content === "string" ? event.utm_content : null,
            utm_term: typeof event.utm_term === "string" ? event.utm_term : null,
            metadata: event.metadata && typeof event.metadata === "object" ? event.metadata : {},
            created_at: typeof event.created_at === "string" ? event.created_at : new Date().toISOString(),
        }));

        const { error } = await supabase.from("landing_events").insert(rows);
        if (error) {
            console.error("Erro ao salvar eventos da landing:", error.message);
            return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true, saved: rows.length });
    } catch (err) {
        console.error("Erro ao processar eventos da landing:", err);
        return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }
}

export const dynamic = "force-dynamic";