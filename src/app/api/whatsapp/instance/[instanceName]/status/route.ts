import { NextRequest, NextResponse } from 'next/server';
import { getSchedule } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { instanceName: string } }
) {
  try {
    const instanceName = params.instanceName;
    const url = new URL(req.url);
    const barbershopId = url.searchParams.get('barbershopId');

    if (!barbershopId) {
      return NextResponse.json({ error: 'Missing barbershopId' }, { status: 400 });
    }

    const schedule = await getSchedule(barbershopId);
    const { apiUrl, apiKey } = schedule.whatsapp_config;

    if (!apiUrl || !apiKey) {
      return NextResponse.json({ error: 'Evolution API not configured', connected: false }, { status: 400 });
    }

    const stateRes = await fetch(`${apiUrl.replace(/\/$/, '')}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: { 'apikey': apiKey }
    });

    let connected = false;
    if (stateRes.ok) {
      const data = await stateRes.json();
      connected = data.state === 'open';
    }

    return NextResponse.json({ connected });
  } catch (err: any) {
    console.error('Status check error:', err);
    return NextResponse.json({ connected: false, error: err.message }, { status: 500 });
  }
}
