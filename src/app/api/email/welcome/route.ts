import { NextRequest, NextResponse } from "next/server";
import { sendEmail, welcomeEmailHtml, welcomeWithPasswordHtml } from "@/lib/email";

export async function POST(req: NextRequest) {
    try {
        const { email, userName, barbershopName, bookingUrl, password } = await req.json();

        if (!email || !userName) {
            return NextResponse.json({ error: "E-mail e nome do usuário são obrigatórios" }, { status: 400 });
        }

        const dashboardUrl = bookingUrl || `${process.env.NEXT_PUBLIC_APP_URL || "https://barber-zap-three.vercel.app"}/dashboard`;

        const htmlContent = password 
            ? welcomeWithPasswordHtml(userName, barbershopName || "Sua Barbearia", dashboardUrl, password)
            : welcomeEmailHtml(userName, barbershopName || "Sua Barbearia", dashboardUrl);

        const result = await sendEmail({
            to: email,
            subject: password ? "Bem-vindo ao BarberZap 🎉 Seus dados de acesso" : "Bem-vindo ao BarberZap 🎉 Sua barbearia está no ar!",
            html: htmlContent,
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