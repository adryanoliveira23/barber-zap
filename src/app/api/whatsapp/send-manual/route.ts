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
    const dateStr = new Date(appt.date + "T00:00:00").toLocaleDateString("pt-BR");

    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const rescheduleUrl = `${origin}/${shop.slug}?reschedule=${appt.id}`;

    const message = `Olá, ${appt.customer_name}! Passando para lembrar do seu horário na ${shop.name} agendado para o dia ${dateStr} às ${appt.time}. 💈\n\nCaso precise reagendar, clique no link abaixo para alterar de forma automática:\n${rescheduleUrl}`;

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
      throw new Error(errData.message || "Failed to send message via Evolution API");
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Manual reminder error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
