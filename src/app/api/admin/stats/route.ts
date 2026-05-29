import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Total de barbearias
  const { count: barbershopsCount } = await supabase
    .from("barbershops")
    .select("*", { count: "exact", head: true });

  // Total de usuários (via service role)
  let usersCount = 0;
  try {
    const { data: { users } } = await supabase.auth.admin.listUsers();
    usersCount = users?.length || 0;
  } catch (err) {
    console.error("Erro ao buscar usuários:", err);
  }

  // Total de agendamentos e receita
  const { data: appointments } = await supabase
    .from("appointments")
    .select("total_price, status, created_at")
    .eq("status", "completed");

  const totalRevenue = appointments?.reduce((acc, curr) => acc + curr.total_price, 0) || 0;

  // Agendamentos recentes (últimos 30 dias)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: recent } = await supabase
    .from("appointments")
    .select("*, barbershops!inner(name)")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    totalBarbershops: barbershopsCount || 0,
    totalUsers: usersCount,
    totalAppointments: appointments?.length || 0,
    totalRevenue,
    recentAppointments: recent || [],
  });
}
