import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, welcomeWithPasswordHtml } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { userId, email, userName, barbershopName } = await req.json();

    if (!userId || !email) {
      return NextResponse.json({ error: "userId and email are required" }, { status: 400 });
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Gerar nova senha
    const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase() + "!";

    // Atualizar senha do usuário
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(userId, {
      password: randomPassword,
    });

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Reenviar o email de boas-vindas com a senha
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://barber-zap-three.vercel.app";
    
    sendEmail({
      to: email,
      subject: "Bem-vindo ao BarberZap 🎉 Seus dados de acesso",
      html: welcomeWithPasswordHtml(userName || email.split("@")[0], barbershopName || "Sua Barbearia", `${appUrl}/dashboard`, randomPassword),
    }).catch(e => console.error("Erro ao reenviar email:", e));

    return NextResponse.json({ success: true, newPassword: randomPassword });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
