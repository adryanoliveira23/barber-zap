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
 * POST /api/webhooks/cakto
 *
 * Recebe o evento de pagamento da Cakto e ativa a assinatura do usuário.
 * Configure no painel da Cakto a URL: https://SEU_DOMINIO/api/webhooks/cakto
 *
 * O payload da Cakto geralmente contém:
 * {
 *   event: "payment.paid" | "payment.refunded" | "subscription.cancelled",
 *   data: {
 *     customer: { email: string },
 *     status: string,
 *     ...
 *   }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Log para debug
    console.log("[Cakto Webhook] Received event:", JSON.stringify(body, null, 2));

    // Extrair email do cliente do payload da Cakto
    // A Cakto pode enviar em diferentes formatos — cobrir os casos mais comuns
    const email =
      body?.data?.customer?.email ||
      body?.customer?.email ||
      body?.email ||
      body?.data?.email;

    const event = body?.event || body?.type || body?.status;

    if (!email) {
      console.error("[Cakto Webhook] No customer email found in payload:", body);
      // Retornar 200 para a Cakto não retentar (payload inválido para nós)
      return NextResponse.json({ received: true, warning: "no_email" }, { status: 200 });
    }

    const adminSupabase = getAdminClient();

    // Buscar usuário pelo email
    const { data: { users }, error: searchError } = await adminSupabase.auth.admin.listUsers();
    if (searchError) {
      console.error("[Cakto Webhook] Error listing users:", searchError);
      return NextResponse.json({ error: "Failed to query users" }, { status: 500 });
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      console.warn("[Cakto Webhook] No user found for email:", email);
      return NextResponse.json({ received: true, warning: "user_not_found" }, { status: 200 });
    }

    // Determinar novo status baseado no evento
    const isPaidEvent = [
      "payment.paid",
      "payment.approved",
      "payment.completed",
      "subscription.active",
      "charge.paid",
      "paid",
      "approved",
      "active",
    ].some(e => event?.toLowerCase()?.includes(e.toLowerCase()));

    const isRefundedOrCancelled = [
      "payment.refunded",
      "subscription.cancelled",
      "subscription.canceled",
      "charge.refunded",
      "refunded",
      "cancelled",
      "canceled",
    ].some(e => event?.toLowerCase()?.includes(e.toLowerCase()));

    let newSubscriptionStatus: boolean | undefined;

    if (isPaidEvent) {
      newSubscriptionStatus = true;
    } else if (isRefundedOrCancelled) {
      newSubscriptionStatus = false;
    }

    if (newSubscriptionStatus === undefined) {
      console.log("[Cakto Webhook] Unknown event type, ignoring:", event);
      return NextResponse.json({ received: true, warning: "unknown_event" }, { status: 200 });
    }

    // Atualizar metadados do usuário no Supabase Auth
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        is_subscribed: newSubscriptionStatus,
        subscription_activated_at: newSubscriptionStatus ? new Date().toISOString() : user.user_metadata?.subscription_activated_at,
        subscription_cancelled_at: !newSubscriptionStatus ? new Date().toISOString() : null,
      },
    });

    if (updateError) {
      console.error("[Cakto Webhook] Error updating user metadata:", updateError);
      return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
    }

    console.log(`[Cakto Webhook] User ${email} subscription set to: ${newSubscriptionStatus}`);

    // Disparar e-mail de boas-vindas da assinatura Pro (não bloqueante)
    if (newSubscriptionStatus) {
      const barbershopName = user.user_metadata?.full_name
        ? `Barbearia de ${user.user_metadata.full_name.split(" ")[0]}`
        : "Sua Barbearia";

      fetch(`${process.env.NEXT_PUBLIC_APP_URL || "https://barber-zap-three.vercel.app"}/api/email/subscription-activated`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          userName: user.user_metadata?.full_name || email.split("@")[0],
          barbershopName,
        }),
      }).catch((err) => console.warn("[Cakto Webhook] Erro ao enviar e-mail de ativação:", err));
    }

    return NextResponse.json({
      received: true,
      user_id: user.id,
      email: user.email,
      is_subscribed: newSubscriptionStatus,
    });
  } catch (err: any) {
    console.error("[Cakto Webhook] Unexpected error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Supabase e Cakto podem fazer GET para verificar se o endpoint existe
export async function GET() {
  return NextResponse.json({ status: "Cakto webhook endpoint active" });
}
