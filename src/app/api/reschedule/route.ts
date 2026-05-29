import { NextRequest, NextResponse } from 'next/server';
import { updateAppointmentStatus, createAppointment, getAppointment } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { appointmentId, newDate, newTime } = await req.json();

    if (!appointmentId || !newDate || !newTime) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const oldAppt = await getAppointment(appointmentId);
    if (!oldAppt) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Cancel old appointment
    await updateAppointmentStatus(appointmentId, 'cancelled');

    // Create new appointment with same details but new date/time
    const newAppt = await createAppointment({
      barbershop_id: oldAppt.barbershop_id,
      customer_name: oldAppt.customer_name,
      customer_phone: oldAppt.customer_phone,
      date: newDate,
      time: newTime,
      service_ids: oldAppt.service_ids,
      total_price: oldAppt.total_price,
      total_duration: oldAppt.total_duration,
    });

    return NextResponse.json({ success: true, appointment: newAppt });
  } catch (err) {
    console.error('Reschedule error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
