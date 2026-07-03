import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase admin credentials not configured");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

function getTrialStatus(createdAt: string, isSubscribed: boolean) {
  if (isSubscribed) return { status: "subscribed", daysRemaining: null };
  return { status: "expired", daysRemaining: null };
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
      .select("*");

    const { data: profiles, error: profilesError } = await adminSupabase
      .from("profiles")
      .select("id, full_name");

    if (shopsError) {
      console.error("Erro ao buscar barbearias:", shopsError);
    }

    const enriched = users.map(user => {
      const barbershop = barbershops?.find(b => b.user_id === user.id);
      const isSubscribed = user.user_metadata?.is_subscribed === true;
      const profile = profiles?.find(p => p.id === user.id);

      return {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name ?? user.user_metadata?.full_name ?? null,
        created_at: user.created_at,
        barbershop_name: barbershop?.name ?? null,
        barbershop_slug: barbershop?.slug ?? null,
        barbershop_address: barbershop?.address ?? null,
        barbershop_whatsapp: barbershop?.whatsapp ?? null,
        barbershop_instagram: barbershop?.instagram ?? null,
        barbershop_description: barbershop?.description ?? null,
        is_subscribed: isSubscribed,
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
    const { email, password, full_name, shop_name } = await request.json();

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
        full_name: full_name || email.split("@")[0],
        whatsapp: "",
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const userId = data.user.id;

    // Upsert profile
    try {
      await adminSupabase.from("profiles").upsert({
        id: userId,
        full_name: full_name || email.split("@")[0],
      });
    } catch (e) {
      console.warn("Erro ao criar perfil:", e);
    }

    // Criar barbearia se nome fornecido
    if (shop_name) {
      const firstName = (full_name || email.split("@")[0]).split(" ")[0] || "Barbeiro";
      const randomSuffix = Math.random().toString(36).slice(2, 6);
      const slug = `${firstName.toLowerCase().replace(/[^a-z0-9]/g, "")}-${randomSuffix}`;
      const shopPayload = {
        id: crypto.randomUUID(),
        user_id: userId,
        name: shop_name,
        slug,
        description: "Sua barbearia moderna com agendamento rápido.",
        address: "",
        whatsapp: "",
        instagram: "",
      };
      const { data: createdShop, error: shopErr } = await adminSupabase
        .from("barbershops")
        .insert(shopPayload)
        .select()
        .single();

      if (shopErr) {
        console.warn("Erro ao criar barbearia:", shopErr.message);
      } else {
        const defaultServices = [
          { name: "Corte Social", price: 40, duration: 30, description: "Corte clássico na tesoura e máquina." },
          { name: "Corte Degradê", price: 50, duration: 40, description: "Degradê moderno com transições suaves." },
          { name: "Barba Completa", price: 35, duration: 30, description: "Toalha quente, navalha e hidratante." },
          { name: "Combo Cabelo + Barba", price: 75, duration: 60, description: "Combo completo com toalha quente." },
        ].map((s) => ({
          id: crypto.randomUUID(),
          barbershop_id: createdShop.id,
          ...s,
          active: true,
        }));

        try {
          await adminSupabase.from("services").insert(defaultServices);
        } catch (e) {
          console.warn("Erro ao criar serviços padrão:", e);
        }
      }
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
