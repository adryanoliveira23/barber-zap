import { NextRequest, NextResponse } from 'next/server';
import { getSchedule } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { barbershopId } = await req.json();
    if (!barbershopId) {
      return NextResponse.json({ error: 'Missing barbershopId' }, { status: 400 });
    }

    const schedule = await getSchedule(barbershopId);
    const { apiUrl, apiKey, instanceName } = schedule.whatsapp_config;

    if (!apiUrl || !apiKey || !instanceName) {
      return NextResponse.json({ error: 'Evolution API not configured. Please set API URL, Key, and Instance Name in WhatsApp settings.' }, { status: 400 });
    }

    // Verificar se a instância já existe
    const checkRes = await fetch(`${apiUrl.replace(/\/$/, '')}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: { 'apikey': apiKey }
    });

    let qrBase64 = null;

    if (checkRes.status === 404) {
      // Instância não existe, criar
      const createRes = await fetch(`${apiUrl.replace(/\/$/, '')}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey
        },
        body: JSON.stringify({
          instanceName: instanceName,
          qrcode: true,
          number: '5541999999999',
          integration: 'WHATSAPP-BAILEYS'
        })
      });

      if (!createRes.ok) {
        const errData = await createRes.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create instance');
      }

      const createData = await createRes.json();
      qrBase64 = createData.qrcode?.base64 || null;
    } else if (checkRes.ok) {
      // Instância existe, obter QR code
      const qrRes = await fetch(`${apiUrl.replace(/\/$/, '')}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: { 'apikey': apiKey }
      });
      if (qrRes.ok) {
        const qrData = await qrRes.json();
        qrBase64 = qrData.qrcode?.base64 || null;
      }
    } else {
      throw new Error('Failed to check instance status');
    }

    return NextResponse.json({ instanceName, qr: qrBase64 });
  } catch (err: any) {
    console.error('Instance creation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
