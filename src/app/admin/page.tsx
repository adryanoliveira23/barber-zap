"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertCircle,
  Calendar,
  DollarSign,
  Flame,
  LineChart,
  MousePointerClick,
  PieChart,
  RadioTower,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";

interface RecentAppointment {
  id: string;
  customer_name: string;
  date: string;
  time: string;
  total_price: number;
  status: "completed" | "pending" | "confirmed" | "cancelled" | "no_show" | string;
  barbershops?: {
    name?: string;
  };
}

interface FunnelStep {
  label: string;
  value: number;
}

interface TrafficBreakdown {
  label: string;
  visitors: number;
  pricingViews: number;
  checkoutClicks: number;
  events: number;
  checkoutRate: number;
}

interface DailyTraffic {
  date: string;
  visitors: number;
  checkoutClicks: number;
}

interface AdminAnalytics {
  shopsWithServices: number;
  shopsWithSchedule: number;
  shopsWithAppointments: number;
  activeShops7d: number;
  activeShops30d: number;
  retention7d: number;
  retention30d: number;
  appointmentsLast7: number;
  appointmentsLast30: number;
  revenueLast30: number;
  statusCounts: Record<string, number>;
  landingAnalyticsAvailable: boolean;
  landingVisitors30d: number;
  landingEventCounts: Record<string, number>;
  trafficSources: TrafficBreakdown[];
  trafficMediums: TrafficBreakdown[];
  trafficCampaigns: TrafficBreakdown[];
  dailyTraffic: DailyTraffic[];
  landingFunnel: FunnelStep[];
  onboardingFunnel: FunnelStep[];
}

interface Stats {
  totalBarbershops: number;
  totalUsers: number;
  totalAppointments: number;
  totalRevenue: number;
  recentAppointments: RecentAppointment[];
  analytics: AdminAnalytics;
}

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "No-show",
  unknown: "Sem status",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) throw new Error("Falha ao carregar estatísticas");
        const data = (await res.json()) as Stats;
        setStats(data);
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-gold-500" />
      </div>
    );
  }

  const analytics = stats?.analytics;
  const metricCards = [
    { title: "Barbearias", value: stats?.totalBarbershops || 0, icon: Store, color: "text-gold-500" },
    { title: "Usuários", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-500" },
    { title: "Agendamentos", value: stats?.totalAppointments || 0, icon: Calendar, color: "text-emerald-500" },
    { title: "Receita Total", value: formatCurrency(stats?.totalRevenue || 0), icon: DollarSign, color: "text-gold-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Dashboard Admin</h1>
          <p className="text-sm text-zinc-500">Métricas reais do banco: onboarding, atividade e agendamentos</p>
        </div>
        <div className="rounded-full border border-gold-500/20 bg-gold-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-gold-400">
          Sem estimativas falsas
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card) => (
          <Card key={card.title} className="border-zinc-800 bg-obsidian-900/50">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-zinc-500">{card.title}</p>
                <p className="text-2xl font-bold text-zinc-100">{card.value}</p>
              </div>
              <card.icon className={`h-8 w-8 ${card.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {analytics && (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <InsightCard
              icon={MousePointerClick}
              title="Barbearias ativadas"
              value={analytics.shopsWithAppointments.toLocaleString("pt-BR")}
              desc="Barbearias que já receberam pelo menos um agendamento."
            />
            <InsightCard
              icon={Flame}
              title="Retenção 30 dias"
              value={`${analytics.retention30d}%`}
              desc={`${analytics.activeShops30d} barbearia(s) com agendamento nos últimos 30 dias.`}
            />
            <InsightCard
              icon={DollarSign}
              title="Receita 30 dias"
              value={formatCurrency(analytics.revenueLast30)}
              desc={`${analytics.appointmentsLast30} agendamento(s) criados nos últimos 30 dias.`}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
            <Card className="border-zinc-800 bg-obsidian-900/50">
              <CardContent className="p-6">
                <SectionTitle
                  icon={MousePointerClick}
                  title="Funil real da landing"
                  subtitle={analytics.landingAnalyticsAvailable ? "Eventos capturados nos últimos 30 dias" : "Rode a migração da tabela landing_events para ativar"}
                />
                {analytics.landingAnalyticsAvailable ? (
                  <FunnelBars steps={analytics.landingFunnel} />
                ) : (
                  <div className="mt-6 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                    A instrumentação já foi adicionada no código, mas a tabela <strong>landing_events</strong> precisa existir no Supabase para começar a gravar eventos.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-obsidian-900/50">
              <CardContent className="p-6">
                <SectionTitle icon={PieChart} title="Eventos da landing" subtitle="Contagem bruta dos eventos capturados" />
                <div className="mt-6 space-y-3">
                  {Object.entries(analytics.landingEventCounts).length === 0 ? (
                    <EmptyState text="Nenhum evento de landing registrado ainda." />
                  ) : (
                    Object.entries(analytics.landingEventCounts).map(([event, count]) => (
                      <div key={event} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/30 px-4 py-3">
                        <span className="text-xs font-bold text-zinc-300">{eventLabel(event)}</span>
                        <span className="text-sm font-black text-gold-500">{count}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-zinc-800 bg-obsidian-900/50">
              <CardContent className="p-6">
                <SectionTitle icon={TrendingUp} title="Evolução do tráfego" subtitle="Visitantes e cliques no checkout por dia" />
                <DailyTrafficChart data={analytics.dailyTraffic} />
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-obsidian-900/50">
              <CardContent className="p-6">
                <SectionTitle icon={RadioTower} title="Origem do tráfego" subtitle="Sessões por UTM source ou referrer" />
                <TrafficTable rows={analytics.trafficSources} emptyText="Nenhuma origem registrada ainda." />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border-zinc-800 bg-obsidian-900/50">
              <CardContent className="p-6">
                <SectionTitle icon={PieChart} title="Campanhas" subtitle="Performance por utm_campaign" />
                <TrafficTable rows={analytics.trafficCampaigns} emptyText="Nenhuma campanha UTM registrada ainda." />
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-obsidian-900/50">
              <CardContent className="p-6">
                <SectionTitle icon={MousePointerClick} title="Mídias" subtitle="Performance por utm_medium" />
                <TrafficTable rows={analytics.trafficMediums} emptyText="Nenhuma mídia UTM registrada ainda." />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-zinc-800 bg-obsidian-900/50">
              <CardContent className="p-6">
                <SectionTitle icon={LineChart} title="Funil real de onboarding" subtitle="Etapas calculadas a partir das tabelas existentes" />
                <FunnelBars steps={analytics.onboardingFunnel} />
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-obsidian-900/50">
              <CardContent className="p-6">
                <SectionTitle icon={PieChart} title="Status dos agendamentos" subtitle="Distribuição real por status" />
                <div className="mt-6 space-y-3">
                  {Object.entries(analytics.statusCounts).length === 0 ? (
                    <EmptyState text="Nenhum agendamento registrado ainda." />
                  ) : (
                    Object.entries(analytics.statusCounts).map(([status, count]) => {
                      const total = Math.max(1, stats?.totalAppointments || 0);
                      const width = Math.round((count / total) * 100);
                      return (
                        <div key={status} className="rounded-xl border border-zinc-800/70 bg-zinc-950/30 p-4">
                          <div className="mb-2 flex items-center justify-between gap-4">
                            <span className="text-xs font-bold text-zinc-200">{statusLabels[status] || status}</span>
                            <span className="text-sm font-black text-gold-500">{count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-zinc-900">
                            <div className="h-full rounded-full bg-gold-500" style={{ width: `${width}%` }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
            <Card className="border-zinc-800 bg-obsidian-900/50">
              <CardContent className="p-6">
                <SectionTitle icon={Flame} title="Atividade recente" subtitle="Retenção operacional por agendamentos" />
                <div className="mt-6 flex h-64 items-end gap-4">
                  {[
                    { label: "7 dias", value: analytics.retention7d, count: analytics.activeShops7d },
                    { label: "30 dias", value: analytics.retention30d, count: analytics.activeShops30d },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex h-48 w-full items-end rounded-xl bg-zinc-950/50 p-2">
                        <div className="w-full rounded-lg bg-gradient-to-t from-gold-600 to-gold-300" style={{ height: `${item.value}%` }} />
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-black text-zinc-100">{item.value}%</div>
                        <div className="text-[10px] font-semibold text-zinc-500">{item.count} ativa(s) em {item.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <RecentAppointments appointments={stats?.recentAppointments || []} />
          </div>
        </>
      )}
    </div>
  );
}

function RecentAppointments({ appointments }: { appointments: RecentAppointment[] }) {
  return (
    <Card className="border-zinc-800 bg-obsidian-900/50">
      <CardContent className="p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-100">
          <TrendingUp className="h-5 w-5 text-gold-500" />
          Últimos Agendamentos
        </h2>
        <div className="space-y-3">
          {appointments.length === 0 ? (
            <EmptyState text="Nenhum agendamento encontrado nos últimos 30 dias." />
          ) : (
            appointments.map((appt) => (
              <div key={appt.id} className="rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-zinc-200">{appt.customer_name}</p>
                    <p className="text-xs text-zinc-500">
                      {appt.barbershops?.name} · {appt.date} às {appt.time}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gold-500">{formatCurrency(appt.total_price)}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusClass(appt.status)}`}>
                      {statusLabels[appt.status] || appt.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: typeof LineChart; title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
        <Icon className="h-5 w-5 text-gold-500" />
        {title}
      </h2>
      <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
    </div>
  );
}

function FunnelBars({ steps }: { steps: FunnelStep[] }) {
  return (
    <div className="mt-6 space-y-4">
      {steps.map((step, index) => {
        const max = steps[0]?.value || 1;
        const width = Math.max(step.value > 0 ? 8 : 0, Math.round((step.value / max) * 100));
        const previous = steps[index - 1]?.value;
        const drop = previous ? Math.max(0, Math.round(((previous - step.value) / previous) * 100)) : 0;

        return (
          <div key={step.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-300">{step.label}</span>
              <span className="text-zinc-500">{step.value.toLocaleString("pt-BR")}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-zinc-900">
              <div className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-600" style={{ width: `${width}%` }} />
            </div>
            {index > 0 && <p className="mt-1 text-[10px] text-zinc-600">Queda desde a etapa anterior: {drop}%</p>}
          </div>
        );
      })}
    </div>
  );
}

function DailyTrafficChart({ data }: { data: DailyTraffic[] }) {
  const max = Math.max(1, ...data.map((item) => Math.max(item.visitors, item.checkoutClicks)));

  if (data.length === 0) {
    return <EmptyState text="Nenhum dado diário registrado ainda." />;
  }

  return (
    <div className="mt-6">
      <div className="flex h-56 items-end gap-2">
        {data.map((item) => (
          <div key={item.date} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-44 w-full items-end justify-center gap-1 rounded-lg bg-zinc-950/40 p-1.5">
              <div
                className="w-1/2 rounded-t bg-gold-500"
                style={{ height: `${Math.max(3, (item.visitors / max) * 100)}%` }}
                title={`${item.visitors} visitantes`}
              />
              <div
                className="w-1/2 rounded-t bg-emerald-500"
                style={{ height: `${item.checkoutClicks > 0 ? Math.max(3, (item.checkoutClicks / max) * 100) : 0}%` }}
                title={`${item.checkoutClicks} cliques checkout`}
              />
            </div>
            <span className="text-[9px] text-zinc-600">{formatShortDate(item.date)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-4 text-[10px] font-semibold text-zinc-500">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gold-500" /> Visitantes</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Checkout</span>
      </div>
    </div>
  );
}

function TrafficTable({ rows, emptyText }: { rows: TrafficBreakdown[]; emptyText: string }) {
  const maxVisitors = Math.max(1, ...rows.map((row) => row.visitors));

  if (rows.length === 0) {
    return <EmptyState text={emptyText} />;
  }

  return (
    <div className="mt-6 space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
          <div className="mb-2 flex items-center justify-between gap-4">
            <span className="truncate text-xs font-black text-zinc-200">{row.label}</span>
            <span className="text-xs font-black text-gold-500">{row.checkoutRate}% checkout</span>
          </div>
          <div className="mb-3 h-2 rounded-full bg-zinc-900">
            <div className="h-full rounded-full bg-gold-500" style={{ width: `${Math.max(4, (row.visitors / maxVisitors) * 100)}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px] text-zinc-500">
            <span><strong className="text-zinc-300">{row.visitors}</strong> visitas</span>
            <span><strong className="text-zinc-300">{row.pricingViews}</strong> viu planos</span>
            <span><strong className="text-zinc-300">{row.checkoutClicks}</strong> checkout</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function InsightCard({
  icon: Icon,
  title,
  value,
  desc,
}: {
  icon: typeof MousePointerClick;
  title: string;
  value: string;
  desc: string;
}) {
  return (
    <Card className="border-zinc-800 bg-obsidian-900/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-zinc-500">{title}</p>
            <p className="mt-1 text-3xl font-black text-zinc-100">{value}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold-500/20 bg-gold-500/10 text-gold-500">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 text-xs text-zinc-400">{desc}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center text-zinc-500">
      <AlertCircle className="h-8 w-8" />
      <p>{text}</p>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

function statusClass(status: string) {
  if (status === "completed") return "bg-emerald-500/20 text-emerald-400";
  if (status === "pending" || status === "confirmed") return "bg-yellow-500/20 text-yellow-400";
  return "bg-red-500/20 text-red-400";
}

function eventLabel(event: string) {
  const labels: Record<string, string> = {
    landing_view: "Visitou landing",
    section_view: "Viu seção",
    cta_click: "Clicou CTA interno",
    pricing_view: "Viu planos",
    checkout_click: "Clicou checkout",
  };

  return labels[event] || event;
}

function formatShortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}
