import { NextRequest, NextResponse } from "next/server";
import { getAppointment, getBarbershop, getSchedule } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { appointmentId } = await req.json();

    if (!appointmentId) {
      return NextResponse.json({ error: "Missing appointmentId" }, { status: 400 });
    }

    const appt = await getAppointment(appointmentId);
    if (!appt) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const shop = await getBarbershop(appt.barbershop_id);
    if (!shop) {
      return NextResponse.json({ error: "Barbershop not found" }, { status: 404 });
    }

    const schedule = await getSchedule(appt.barbershop_id);
    if (!schedule || !schedule.whatsapp_config) {
      return NextResponse.json({ error: "WhatsApp not configured for this barbershop" }, { status: 400 });
    }

    const { apiUrl, apiKey, instanceName } = schedule.whatsapp_config;
    if (!apiUrl || !apiKey || !instanceName) {
      return NextResponse.json({ error: "WhatsApp configuration is incomplete" }, { status: 400 });
    }

    const evolutionUrl = `${apiUrl.replace(/\/$/, "")}/message/sendText/${instanceName}`;

    // Montar link e mensagem de avaliação
    let reviewText = "";
    if (shop.instagram) {
      const cleanInsta = shop.instagram.replace(/^@/, "");
      reviewText = `no nosso Instagram clicando no link abaixo:\nhttps://instagram.com/${cleanInsta}`;
    } else if (shop.whatsapp) {
      reviewText = `enviando um feedback para o nosso WhatsApp!`;
    } else {
      reviewText = `respondendo esta mensagem com a sua opinião!`;
    }

    const message = `Olá, ${appt.customer_name}! 🎉\n\nAgradecemos de coração pela sua visita na ${shop.name}!\n\nComo foi o seu atendimento? Sua opinião é extremamente valiosa para nós.\n\n✨ Por favor, se puder, deixe a sua avaliação ${reviewText}\n\nObrigado e até a próxima! ✂️🔥`;

    const res = await fetch(evolutionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        number: appt.customer_phone,
        text: message,
        options: { delay: 1200, presence: "composing" },
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to send review message via Evolution API");
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Send review error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
