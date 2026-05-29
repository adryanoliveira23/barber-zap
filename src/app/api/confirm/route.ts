import { NextRequest, NextResponse } from 'next/server';
import { updateAppointmentStatus, getAppointment, getBarbershop } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing appointment id' }, { status: 400 });
  }

  try {
    const appointment = await getAppointment(id);
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (appointment.status === 'pending') {
      await updateAppointmentStatus(id, 'confirmed');
    }

    const barbershop = await getBarbershop(appointment.barbershop_id);
    const slug = barbershop?.slug || 'barberzap';

    return NextResponse.redirect(new URL(`/${slug}?confirmed=true`, req.url));
  } catch (err) {
    console.error('Confirmation error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
