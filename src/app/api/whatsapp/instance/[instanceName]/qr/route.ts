import { NextRequest, NextResponse } from 'next/server';
import { getSchedule } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ instanceName: string }> }
) {
  try {
    const { instanceName } = await params;
    const url = new URL(req.url);
    const barbershopId = url.searchParams.get('barbershopId');

    if (!barbershopId) {
      return NextResponse.json({ error: 'Missing barbershopId' }, { status: 400 });
    }

    const schedule = await getSchedule(barbershopId);
    const { apiUrl, apiKey } = schedule.whatsapp_config;

    if (!apiUrl || !apiKey) {
      return NextResponse.json({ error: 'Evolution API not configured' }, { status: 400 });
    }

    const qrRes = await fetch(`${apiUrl.replace(/\/$/, '')}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: { 'apikey': apiKey }
    });

    if (!qrRes.ok) {
      const errData = await qrRes.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to get QR code');
    }

    const data = await qrRes.json();
    const qrBase64 = data.qrcode?.base64 || null;

    return NextResponse.json({ qr: qrBase64 });
  } catch (err: any) {
    console.error('QR fetch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
