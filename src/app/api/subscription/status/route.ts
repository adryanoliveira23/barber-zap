import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getAdminClient = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(url, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
};

/**
 * GET /api/subscription/status?email=usuario@email.com
 *
 * Consulta o status real da assinatura do usuário no banco (via service_role).
 * Útil para verificar se o webhook já processou o pagamento e atualizou os metadados.
 */
export async function GET(req: NextRequest) {
    try {
        const email = req.nextUrl.searchParams.get("email");

        if (!email) {
            return NextResponse.json({ error: "Email parameter is required" }, { status: 400 });
        }

        const adminSupabase = getAdminClient();

        // Buscar usuário pelo email
        const { data: { users }, error: searchError } = await adminSupabase.auth.admin.listUsers();
        if (searchError) {
            console.error("[Subscription Status] Error listing users:", searchError);
            return NextResponse.json({ error: "Failed to query users" }, { status: 500 });
        }

        const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (!user) {
            return NextResponse.json({ is_subscribed: false, user_found: false }, { status: 200 });
        }

        const isSubscribed = !!user.user_metadata?.is_subscribed;

        return NextResponse.json({
            is_subscribed: isSubscribed,
            user_found: true,
            user_id: user.id,
            subscription_activated_at: user.user_metadata?.subscription_activated_at || null,
            subscription_cancelled_at: user.user_metadata?.subscription_cancelled_at || null,
        });
    } catch (err: any) {
        console.error("[Subscription Status] Unexpected error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}