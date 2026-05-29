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

export async function GET() {
  try {
    const adminSupabase = getAdminClient();

    // Buscar usuários autenticados
    const { data: { users }, error: usersError } = await adminSupabase.auth.admin.listUsers();
    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    // Buscar barbearias — usando service role, ignora RLS
    const { data: barbershops, error: shopsError } = await adminSupabase
      .from("barbershops")
      .select("user_id, name, slug");

    if (shopsError) {
      console.error("Erro ao buscar barbearias:", shopsError);
      // Não falha — retorna usuários sem info de barbearia
    }

    const enriched = users.map(user => {
      const barbershop = barbershops?.find(b => b.user_id === user.id);
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        barbershop_name: barbershop?.name ?? null,
        barbershop_slug: barbershop?.slug ?? null,
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
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ user: { id: data.user.id, email: data.user.email } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
