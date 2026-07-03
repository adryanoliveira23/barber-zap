import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show" | string;

interface AppointmentMetricRow {
  barbershop_id: string;
  total_price: number | string | null;
  status: AppointmentStatus | null;
  created_at: string | null;
}

interface BarbershopScopedRow {
  barbershop_id: string;
}

interface LandingEventRow {
  session_id: string;
  event_name: string;
  created_at: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  metadata: Record<string, any>;
}

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const uniqueCount = (rows: BarbershopScopedRow[] | null | undefined) =>
  new Set((rows || []).map((row) => row.barbershop_id).filter(Boolean)).size;

const fallbackLabel = (value: string | null | undefined, fallback: string) => {
  const normalized = value?.trim();
  return normalized || fallback;
};

const referrerSource = (referrer: string | null | undefined) => {
  if (!referrer) return "Direto / sem UTM";

  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return "Referência externa";
  }
};

const buildTrafficBreakdown = (
  rows: LandingEventRow[],
  getLabel: (row: LandingEventRow) => string,
  limit = 8
) => {
  const groups = new Map<
    string,
    {
      sessions: Set<string>;
      pricingSessions: Set<string>;
      checkoutSessions: Set<string>;
      events: number;
    }
  >();

  rows.forEach((row) => {
    const label = getLabel(row);
    const group = groups.get(label) || {
      sessions: new Set<string>(),
      pricingSessions: new Set<string>(),
      checkoutSessions: new Set<string>(),
      events: 0,
    };

    group.sessions.add(row.session_id);
    group.events += 1;
    if (row.event_name === "pricing_view") group.pricingSessions.add(row.session_id);
    if (row.event_name === "checkout_click") group.checkoutSessions.add(row.session_id);
    groups.set(label, group);
  });

  return Array.from(groups.entries())
    .map(([label, group]) => {
      const visitors = group.sessions.size;
      const checkoutClicks = group.checkoutSessions.size;
      return {
        label,
        visitors,
        pricingViews: group.pricingSessions.size,
        checkoutClicks,
        events: group.events,
        checkoutRate: visitors > 0 ? Math.round((checkoutClicks / visitors) * 100) : 0,
      };
    })
    .sort((a, b) => b.visitors - a.visitors || b.checkoutClicks - a.checkoutClicks)
    .slice(0, limit);
};

const buildDailyTraffic = (rows: LandingEventRow[]) => {
  const buckets = new Map<string, { sessions: Set<string>; checkoutSessions: Set<string> }>();

  for (let i = 13; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    buckets.set(key, { sessions: new Set<string>(), checkoutSessions: new Set<string>() });
  }

  rows.forEach((row) => {
    if (!row.created_at) return;
    const key = row.created_at.slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) return;

    bucket.sessions.add(row.session_id);
    if (row.event_name === "checkout_click") bucket.checkoutSessions.add(row.session_id);
  });

  return Array.from(buckets.entries()).map(([date, bucket]) => ({
    date,
    visitors: bucket.sessions.size,
    checkoutClicks: bucket.checkoutSessions.size,
  }));
};

export async function GET() {
  const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const adminKey = process.env.SUPABASE_SECRET_KEY!;
  const { createClient: createAdminClient } = require("@supabase/supabase-js");
  const supabase = createAdminClient(adminUrl, adminKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const [
    { count: barbershopsCount },
    { count: appointmentsCount },
    { data: services },
    { data: schedules },
    { data: appointments },
    { data: recent },
    { data: landingEvents, error: landingEventsError },
  ] = await Promise.all([
    supabase.from("barbershops").select("*", { count: "exact", head: true }),
    supabase.from("appointments").select("*", { count: "exact", head: true }),
    supabase.from("services").select("barbershop_id").eq("active", true),
    supabase.from("schedules").select("barbershop_id"),
    supabase.from("appointments").select("barbershop_id,total_price,status,created_at"),
    supabase
      .from("appointments")
      .select("*, barbershops!inner(name)")
      .gte("created_at", daysAgo(30))
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("landing_events")
      .select("session_id,event_name,created_at,referrer,utm_source,utm_medium,utm_campaign,metadata")
      .gte("created_at", daysAgo(30)),
  ]);

  if (landingEventsError) {
    console.warn("Analytics da landing indisponível:", landingEventsError.message);
  }

  let usersCount = 0;
  let totalRevenue = 0;
  let usersData: any[] = [];
  try {
    const {
      data: { users },
      error: usersError
    } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error("Erro admin:", usersError);
    } else {
      usersData = users || [];
      usersCount = usersData.length;
      const subscribedUsersCount = usersData.filter((u: any) => u.user_metadata?.is_subscribed === true).length;
      totalRevenue = subscribedUsersCount * 19.99; // Calcula MRR baseado nas assinaturas (R$ 19,99 por assinante)
    }
  } catch (err) {
    console.error("Erro ao buscar usuários no stats:", err);
  }

  const appointmentRows = (appointments || []) as AppointmentMetricRow[];
  const completedAppointments = appointmentRows.filter((row) => row.status === "completed");

  const last7 = daysAgo(7);
  const last30 = daysAgo(30);
  const appointmentsLast7 = appointmentRows.filter((row) => row.created_at && row.created_at >= last7);
  const appointmentsLast30 = appointmentRows.filter((row) => row.created_at && row.created_at >= last30);
  const completedLast30 = appointmentsLast30.filter((row) => row.status === "completed");

  const statusCounts = appointmentRows.reduce<Record<string, number>>((acc, row) => {
    const status = row.status || "unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const shopsWithServices = uniqueCount((services || []) as BarbershopScopedRow[]);
  const shopsWithSchedule = uniqueCount((schedules || []) as BarbershopScopedRow[]);
  const shopsWithAppointments = uniqueCount(appointmentRows);
  const activeShops7d = uniqueCount(appointmentsLast7);
  const activeShops30d = uniqueCount(appointmentsLast30);
  const barbershopsTotal = barbershopsCount || 0;
  const landingRows = (landingEvents || []) as LandingEventRow[];
  const landingEventCounts = landingRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.event_name] = (acc[row.event_name] || 0) + 1;
    return acc;
  }, {});
  const uniqueLandingSessions = new Set(landingRows.map((row) => row.session_id).filter(Boolean)).size;
  const pricingSessions = new Set(
    landingRows.filter((row) => row.event_name === "pricing_view").map((row) => row.session_id).filter(Boolean)
  ).size;
  const checkoutSessions = new Set(
    landingRows.filter((row) => row.event_name === "checkout_click").map((row) => row.session_id).filter(Boolean)
  ).size;
  const trafficSources = buildTrafficBreakdown(landingRows, (row) =>
    fallbackLabel(row.utm_source, referrerSource(row.referrer))
  );
  const trafficMediums = buildTrafficBreakdown(landingRows, (row) => fallbackLabel(row.utm_medium, "Sem mídia"));
  const trafficCampaigns = buildTrafficBreakdown(landingRows, (row) => fallbackLabel(row.utm_campaign, "Sem campanha"));
  const dailyTraffic = buildDailyTraffic(landingRows);

  const sessionEndEvents = landingRows
    .filter((row) => row.event_name === "session_end")
    .map((row) => Number((row.metadata?.duration_seconds as number) || 0))
    .filter((seconds) => seconds > 0);
  const avgDuration = sessionEndEvents.length
    ? Math.round(sessionEndEvents.reduce((acc, s) => acc + s, 0) / sessionEndEvents.length)
    : 0;
  const durationBuckets = { under5: 0, fiveTo15: 0, fifteenTo30: 0, over30: 0 };
  sessionEndEvents.forEach((s) => {
    if (s < 5) durationBuckets.under5 += 1;
    else if (s < 15) durationBuckets.fiveTo15 += 1;
    else if (s < 30) durationBuckets.fifteenTo30 += 1;
    else durationBuckets.over30 += 1;
  });
  const scroll50 = new Set(
    landingRows
      .filter((row) => row.event_name === "scroll_depth" && Number((row.metadata?.percent as number) || 0) >= 50)
      .map((row) => row.session_id)
      .filter(Boolean)
  ).size;
  const scroll100 = new Set(
    landingRows
      .filter((row) => row.event_name === "scroll_depth" && Number((row.metadata?.percent as number) || 0) >= 100)
      .map((row) => row.session_id)
      .filter(Boolean)
  ).size;
  const deviceCounts = landingRows.reduce<Record<string, number>>((acc, row) => {
    const d = (row as any).device || "unknown";
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    totalBarbershops: barbershopsTotal,
    totalUsers: usersCount,
    totalAppointments: appointmentsCount || 0,
    totalRevenue,
    recentAppointments: recent || [],
    analytics: {
      shopsWithServices,
      shopsWithSchedule,
      shopsWithAppointments,
      activeShops7d,
      activeShops30d,
      retention7d: barbershopsTotal > 0 ? Math.round((activeShops7d / barbershopsTotal) * 100) : 0,
      retention30d: barbershopsTotal > 0 ? Math.round((activeShops30d / barbershopsTotal) * 100) : 0,
      appointmentsLast7: appointmentsLast7.length,
      appointmentsLast30: appointmentsLast30.length,
      revenueLast30: usersData.filter((u: any) => u.user_metadata?.is_subscribed && (!u.user_metadata?.subscription_activated_at || u.user_metadata.subscription_activated_at >= daysAgo(30))).length * 19.99,
      statusCounts,
      landingAnalyticsAvailable: !landingEventsError,
      landingVisitors30d: uniqueLandingSessions,
      landingEventCounts,
      trafficSources,
      trafficMediums,
      trafficCampaigns,
      dailyTraffic,
      landingFunnel: [
        { label: "Visitou landing", value: uniqueLandingSessions },
        { label: "Scroll 50%", value: scroll50 },
        { label: "Scroll 100%", value: scroll100 },
        { label: "Viu planos", value: pricingSessions },
        { label: "Clicou checkout", value: checkoutSessions },
      ],
      onboardingFunnel: [
        { label: "Usuários cadastrados", value: usersCount },
        { label: "Barbearias criadas", value: barbershopsTotal },
        { label: "Com serviços ativos", value: shopsWithServices },
        { label: "Com agenda configurada", value: shopsWithSchedule },
        { label: "Com agendamento recebido", value: shopsWithAppointments },
      ],
      behavioral: {
        avgDurationSeconds: avgDuration,
        durationBuckets,
        scroll50,
        scroll100,
        deviceCounts,
      },
    },
  });
}
