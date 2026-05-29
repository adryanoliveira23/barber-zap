import { NextRequest, NextResponse } from 'next/server';
import { getSchedule, updateSchedule } from '@/lib/db';

export async function GET(req: NextRequest) {
  const barbershopId = req.nextUrl.searchParams.get('barbershopId');
  if (!barbershopId) {
    return NextResponse.json({ error: 'Missing barbershopId' }, { status: 400 });
  }

  const schedule = await getSchedule(barbershopId);
  return NextResponse.json({ config: schedule.whatsapp_config });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { barbershopId, config } = body;

  if (!barbershopId || !config) {
    return NextResponse.json({ error: 'Missing barbershopId or config' }, { status: 400 });
  }

  const schedule = await getSchedule(barbershopId);
  schedule.whatsapp_config = {
    ...schedule.whatsapp_config,
    ...config,
    apiUrl: config.apiUrl || '',
    apiKey: config.apiKey || '',
    instanceName: config.instanceName || '',
    sendConfirmation: config.sendConfirmation !== undefined ? config.sendConfirmation : schedule.whatsapp_config.sendConfirmation,
    sendReminder24h: config.sendReminder24h !== undefined ? config.sendReminder24h : schedule.whatsapp_config.sendReminder24h,
    sendReminder2h: config.sendReminder2h !== undefined ? config.sendReminder2h : schedule.whatsapp_config.sendReminder2h
  };

  await updateSchedule(schedule);
  return NextResponse.json({ success: true, config: schedule.whatsapp_config });
}
