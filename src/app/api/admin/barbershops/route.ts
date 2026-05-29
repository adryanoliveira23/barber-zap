import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: shops, error } = await supabase
    .from("barbershops")
    .select(`
      id,
      name,
      slug,
      user_id,
      created_at,
      appointments!left(
        total_price,
        status
      )
    `);

  if (error) {
    console.error("Erro ao carregar barbearias:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const enriched = shops?.map((shop: any) => {
    const completedAppts = shop.appointments?.filter((a: any) => a.status === "completed") || [];
    const totalRevenue = completedAppts.reduce((acc: number, curr: any) => acc + (curr.total_price || 0), 0);
    return {
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      user_id: shop.user_id,
      created_at: shop.created_at,
      total_appointments: shop.appointments?.length || 0,
      total_revenue: totalRevenue,
    };
  }) || [];

  return NextResponse.json({ barbershops: enriched });
}
