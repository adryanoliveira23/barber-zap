import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    const adminPassword = process.env.ADMIN_MASTER_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json({ error: "Configuração de senha mestra não encontrada" }, { status: 500 });
    }

    if (password === adminPassword) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Senha incorreta" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Erro de conexão. Tente novamente." }, { status: 500 });
  }
}