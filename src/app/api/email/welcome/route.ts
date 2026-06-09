import { NextRequest, NextResponse } from "next/server";
import { sendEmail, welcomeEmailHtml } from "@/lib/email";

export async function POST(req: NextRequest) {
    try {
        const { email, userName, barbershopName, bookingUrl } = await req.json();

        if (!email || !userName) {
            return NextResponse.json({ error: "E-mail e nome do usuário são obrigatórios" }, { status: 400 });
        }

        const dashboardUrl = bookingUrl || `${process.env.NEXT_PUBLIC_APP_URL || "https://barber-zap-three.vercel.app"}/dashboard`;

        const result = await sendEmail({
            to: email,
            subject: "Bem-vindo ao BarberZap 🎉 Sua barbearia está no ar!",
            html: welcomeEmailHtml(userName, barbershopName || "Sua Barbearia", dashboardUrl),
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true, messageId: result.messageId });
    } catch (err: any) {
        console.error("[API] Erro ao enviar e-mail de boas-vindas:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}