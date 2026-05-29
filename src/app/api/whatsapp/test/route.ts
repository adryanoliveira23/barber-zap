import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { apiUrl, apiKey, instanceName } = await req.json();

    if (!apiUrl || !apiKey || !instanceName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const statusUrl = `${apiUrl.replace(/\/$/, '')}/instance/connectionState/${instanceName}`;
    
    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: { 'apikey': apiKey }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Connection failed');
    }

    const isConnected = data.state === 'open' || data.connected === true;
    
    return NextResponse.json({ 
      success: isConnected, 
      status: isConnected ? 'CONNECTED' : 'DISCONNECTED',
      details: data 
    });
  } catch (err: any) {
    console.error('WhatsApp test error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
