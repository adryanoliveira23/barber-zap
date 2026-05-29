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
      return NextResponse.json({ error: 'Evolution API not configured' }, { status: 400 });
    }

    const statusRes = await fetch(`${apiUrl.replace(/\/$/, '')}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: { 'apikey': apiKey }
    });

    if (!statusRes.ok) {
      const errData = await statusRes.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to get connection state');
    }

    const data = await statusRes.json();
    const connected = data.state === 'open';

    return NextResponse.json({ connected });
  } catch (err: any) {
    console.error('Status check error:', err);
    return NextResponse.json({ error: err.message, connected: false }, { status: 500 });
  }
}

export async function DELETE(
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
      return NextResponse.json({ error: 'Evolution API not configured' }, { status: 400 });
    }

    const logoutRes = await fetch(`${apiUrl.replace(/\/$/, '')}/instance/logout/${instanceName}`, {
      method: 'DELETE',
      headers: { 'apikey': apiKey }
    });

    if (!logoutRes.ok) {
      const errData = await logoutRes.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to logout instance');
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Logout error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
