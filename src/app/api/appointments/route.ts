import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { barbershop_id, customer_name, customer_phone, date, time, service_ids, total_price, total_duration, loyalty_applied } = body;

  if (!barbershop_id || !customer_name || !customer_phone || !date || !time || !service_ids?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const newAppointment = {
    barbershop_id,
    customer_name,
    customer_phone,
    date,
    time,
    service_ids,
    total_price,
    total_duration,
    status: "pending",
    loyalty_applied: loyalty_applied || false,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("appointments")
    .insert(newAppointment)
    .select()
    .single();

  if (error) {
    console.error("Appointment creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { appointmentId, status } = body;

  if (!appointmentId || !status) {
    return NextResponse.json({ error: "Missing appointmentId or status" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId)
    .select()
    .single();

  if (error) {
    console.error("Appointment update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
