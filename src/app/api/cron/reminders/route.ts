import { NextRequest, NextResponse } from "next/server";
import {
  getAllUpcomingAppointments,
  getSchedule,
  getBarbershop,
  updateAppointmentReminders,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && secret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appointments = await getAllUpcomingAppointments();
    const sent24h: string[] = [];
    const sent2h: string[] = [];

    // Datas em timezone do Brasil (UTC-3)
    const now = new Date();
    // Sweden locale (sv-SE) formata em YYYY-MM-DD
    const todayStr = now.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
    
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = tomorrow.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;

    for (const appt of appointments) {
      const schedule = await getSchedule(appt.barbershop_id);
      if (!schedule || !schedule.whatsapp_config) continue;

      const { apiUrl, apiKey, instanceName, sendReminder24h, sendReminder2h } =
        schedule.whatsapp_config;

      if (!apiUrl || !apiKey || !instanceName) continue;

      const shop = await getBarbershop(appt.barbershop_id);
      if (!shop) continue;

      const evolutionUrl = `${apiUrl.replace(/\/$/, "")}/message/sendText/${instanceName}`;

      // 1. Lembrete de 24h (para amanhã)
      if (
        appt.date === tomorrowStr &&
        sendReminder24h &&
        !appt.reminder_24h_sent
      ) {
        const dateStr = new Date(appt.date + "T00:00:00").toLocaleDateString("pt-BR");
        const message = `Olá, ${appt.customer_name}! Passando para lembrar que seu horário na ${shop.name} está confirmado para amanhã, dia ${dateStr} às ${appt.time}. 💈\n\nMal podemos esperar para te atender!`;

        try {
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

          if (res.ok) {
            await updateAppointmentReminders(appt.id, { reminder_24h_sent: true });
            sent24h.push(appt.id);
          } else {
            console.error(`Falha ao disparar lembrete 24h para agendamento ${appt.id}`);
          }
        } catch (err) {
          console.error(`Erro ao disparar lembrete 24h para ${appt.id}:`, err);
        }
      }

      // 2. Lembrete de 2h (para hoje, agendado para daqui a 1 a 3 horas)
      if (
        appt.date === todayStr &&
        sendReminder2h &&
        !appt.reminder_2h_sent
      ) {
        const [apptHour, apptMin] = appt.time.split(":").map(Number);
        const apptDateObj = new Date(appt.date + "T00:00:00");
        apptDateObj.setHours(apptHour, apptMin, 0, 0);

        const diffMs = apptDateObj.getTime() - now.getTime();
        const diffMin = diffMs / (1000 * 60);

        // Se falta entre 60 e 180 minutos
        if (diffMin > 60 && diffMin <= 180) {
          const rescheduleUrl = `${origin}/${shop.slug}?reschedule=${appt.id}`;
          const message = `Olá, ${appt.customer_name}! Seu horário na ${shop.name} é hoje às ${appt.time} (daqui a pouco!). ⏰\n\nCaso precise reagendar, clique no link abaixo para alterar o seu horário de forma automática:\n${rescheduleUrl}`;

          try {
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

            if (res.ok) {
              await updateAppointmentReminders(appt.id, { reminder_2h_sent: true });
              sent2h.push(appt.id);
            } else {
              console.error(`Falha ao disparar lembrete 2h para agendamento ${appt.id}`);
            }
          } catch (err) {
            console.error(`Erro ao disparar lembrete 2h para ${appt.id}:`, err);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: {
        sent24h,
        sent2h,
      },
    });
  } catch (err: any) {
    console.error("Erro no processamento do cron de lembretes:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
