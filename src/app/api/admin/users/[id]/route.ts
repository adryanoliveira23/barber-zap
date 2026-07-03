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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { email, full_name, whatsapp, barbershop_name, barbershop_slug } = body;

    const adminSupabase = getAdminClient();

    // 1. Atualizar Auth (email, metadados)
    const { data: { user }, error: fetchError } = await adminSupabase.auth.admin.getUserById(id);
    if (fetchError || !user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const { error: authError } = await adminSupabase.auth.admin.updateUserById(id, {
      email,
      user_metadata: {
        ...user.user_metadata,
        full_name,
        whatsapp,
      }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    // 2. Atualizar Profile
    await adminSupabase.from("profiles").update({ full_name }).eq("id", id);

    // 3. Atualizar Barbearia
    if (barbershop_name || whatsapp) {
      const updateData: any = {};
      if (barbershop_name) updateData.name = barbershop_name;
      if (barbershop_slug) updateData.slug = barbershop_slug;
      if (whatsapp !== undefined) updateData.whatsapp = whatsapp;

      await adminSupabase.from("barbershops").update(updateData).eq("user_id", id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const adminSupabase = getAdminClient();

    // Normalmente a exclusão no Auth cascateia se o BD estiver configurado corretamente, 
    // mas vamos limpar manualmente algumas tabelas principais para garantir.
    await adminSupabase.from("services").delete().eq("barbershop_id", (await adminSupabase.from("barbershops").select("id").eq("user_id", id).single()).data?.id);
    await adminSupabase.from("barbershops").delete().eq("user_id", id);
    await adminSupabase.from("profiles").delete().eq("id", id);

    const { error } = await adminSupabase.auth.admin.deleteUser(id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
