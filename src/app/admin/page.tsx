"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Store, Users, Calendar, DollarSign, TrendingUp, AlertCircle } from "lucide-react";

interface Stats {
  totalBarbershops: number;
  totalUsers: number;
  totalAppointments: number;
  totalRevenue: number;
  recentAppointments: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) throw new Error("Falha ao carregar estatísticas");
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold-500"></div>
      </div>
    );
  }

  const metricCards = [
    { title: "Barbearias", value: stats?.totalBarbershops || 0, icon: Store, color: "text-gold-500" },
    { title: "Usuários", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-500" },
    { title: "Agendamentos", value: stats?.totalAppointments || 0, icon: Calendar, color: "text-emerald-500" },
    { title: "Receita Total", value: `R$ ${(stats?.totalRevenue || 0).toFixed(2)}`, icon: DollarSign, color: "text-gold-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard Admin</h1>
        <p className="text-sm text-zinc-500">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, i) => (
          <Card key={i} className="bg-obsidian-900/50 border-zinc-800">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">{card.title}</p>
                <p className="text-2xl font-bold text-zinc-100">{card.value}</p>
              </div>
              <card.icon className={`h-8 w-8 ${card.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-obsidian-900/50 border-zinc-800">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gold-500" />
            Últimos Agendamentos
          </h2>
          <div className="space-y-3">
            {stats?.recentAppointments.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 flex flex-col items-center gap-2">
                <AlertCircle className="h-8 w-8" />
                <p>Nenhum agendamento encontrado nos últimos 30 dias</p>
              </div>
            ) : (
              stats?.recentAppointments.map((appt) => (
                <div key={appt.id} className="p-3 bg-zinc-900/30 rounded-lg border border-zinc-800/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-zinc-200">{appt.customer_name}</p>
                      <p className="text-xs text-zinc-500">{appt.barbershops?.name} • {appt.date} às {appt.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gold-500">R$ {appt.total_price.toFixed(2)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        appt.status === "completed" ? "bg-emerald-500/20 text-emerald-400" :
                        appt.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-red-500/20 text-red-400"
                      }`}>
                        {appt.status === "completed" ? "Concluído" :
                         appt.status === "pending" ? "Pendente" : appt.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
