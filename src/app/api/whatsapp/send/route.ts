import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { apiUrl, apiKey, instanceName, to, message } = await req.json();

    if (!apiUrl || !apiKey || !instanceName || !to || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const evolutionUrl = `${apiUrl.replace(/\/$/, '')}/message/sendText/${instanceName}`;
    const payload = {
      number: to,
      text: message,
      options: { delay: 1200, presence: 'composing' }
    };

    const response = await fetch(evolutionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send message');
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('WhatsApp send error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
