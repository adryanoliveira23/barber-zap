import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const masterPassword = process.env.ADMIN_MASTER_PASSWORD;

  if (!masterPassword) {
    console.error("ADMIN_MASTER_PASSWORD não definida no .env.local");
    return NextResponse.json({ error: "Configuração interna ausente" }, { status: 500 });
  }

  if (password === masterPassword) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
}
