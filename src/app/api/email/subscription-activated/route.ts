import { NextRequest, NextResponse } from "next/server";
import { sendEmail, subscriptionActivatedHtml } from "@/lib/email";

export async function POST(req: NextRequest) {
    try {
        const { email, userName, barbershopName } = await req.json();

        if (!email || !userName) {
            return NextResponse.json({ error: "E-mail e nome do usuário são obrigatórios" }, { status: 400 });
        }

        const result = await sendEmail({
            to: email,
            subject: "🌟 Assinatura Pro Ativada! Seu painel está completo 🚀",
            html: subscriptionActivatedHtml(userName, barbershopName || "Sua Barbearia"),
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true, messageId: result.messageId });
    } catch (err: any) {
        console.error("[API] Erro ao enviar e-mail de ativação:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}