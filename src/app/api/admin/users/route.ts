import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase admin credentials not configured");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

function getTrialStatus(createdAt: string, isSubscribed: boolean) {
  if (isSubscribed) return { status: "subscribed", daysRemaining: null };
  const created = new Date(createdAt);
  const trialEnd = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diff = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return { status: "expired", daysRemaining: 0 };
  return { status: "trial", daysRemaining: diff };
}

export async function GET() {
  try {
    const adminSupabase = getAdminClient();

    const { data: { users }, error: usersError } = await adminSupabase.auth.admin.listUsers();
    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    const { data: barbershops, error: shopsError } = await adminSupabase
      .from("barbershops")
      .select("user_id, name, slug");

    if (shopsError) {
      console.error("Erro ao buscar barbearias:", shopsError);
    }

    const enriched = users.map(user => {
      const barbershop = barbershops?.find(b => b.user_id === user.id);
      const isSubscribed = user.user_metadata?.is_subscribed === true;
      const trialStatus = getTrialStatus(user.created_at, isSubscribed);

      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        barbershop_name: barbershop?.name ?? null,
        barbershop_slug: barbershop?.slug ?? null,
        is_subscribed: isSubscribed,
        subscription_status: trialStatus.status, // "subscribed" | "trial" | "expired"
        trial_days_remaining: trialStatus.daysRemaining,
        subscription_activated_at: user.user_metadata?.subscription_activated_at ?? null,
        whatsapp: user.user_metadata?.whatsapp ?? null,
      };
    });

    return NextResponse.json({ users: enriched });
  } catch (err: any) {
    console.error("Erro interno:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 });
    }

    const adminSupabase = getAdminClient();
    const { data, error } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        is_subscribed: true,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ user: { id: data.user.id, email: data.user.email } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Toggle subscription status for a specific user (admin action)
export async function PATCH(request: NextRequest) {
  try {
    const { userId, is_subscribed } = await request.json();

    if (!userId || is_subscribed === undefined) {
      return NextResponse.json({ error: "userId e is_subscribed são obrigatórios" }, { status: 400 });
    }

    const adminSupabase = getAdminClient();

    // Buscar dados atuais do usuário para preservar outros metadados
    const { data: { user }, error: fetchError } = await adminSupabase.auth.admin.getUserById(userId);
    if (fetchError || !user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...user.user_metadata,
        is_subscribed,
        subscription_activated_at: is_subscribed ? new Date().toISOString() : user.user_metadata?.subscription_activated_at,
        subscription_cancelled_at: !is_subscribed ? new Date().toISOString() : null,
      },
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, userId, is_subscribed });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
