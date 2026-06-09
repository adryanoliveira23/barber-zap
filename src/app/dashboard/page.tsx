"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { useAuth } from "@/context/AuthContext";
import { getAppointments, updateAppointmentStatus, Appointment, getServices, Service } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  AlertTriangle,
  UserCheck,
  UserX,
  UserMinus,
  Check,
  Award,
  Copy,
  Globe,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QRCodeButton from "./QRCodeButton";

export default function DashboardPage() {
  const { barbershop } = useDashboard();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isSubscribed = user?.user_metadata?.is_subscribed === true;


  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString("sv-SE");
  });

  const { success, error, info } = useToast();

  const [copied, setCopied] = useState(false);
  const handleCopyLink = useCallback(async () => {
    if (!barbershop) return;
    const bookingUrl = `${window.location.origin}/${barbershop.slug}`;
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      success("Link copiado!", "O link de agendamento foi copiado com sucesso.");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      error("Erro ao copiar", "Não foi possível copiar o link.");
    }
  }, [barbershop, success, error]);

  const handleShareWhatsApp = useCallback(() => {
    if (!barbershop) return;
    const bookingUrl = `${window.location.origin}/${barbershop.slug}`;
    const text = `Olá! Agende seu horário na ${barbershop.name} diretamente pelo link: ${bookingUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }, [barbershop]);

  const loadData = useCallback(async () => {
    if (!barbershop) return;
    try {
      setLoading(true);
      const appts = await getAppointments(barbershop.id);
      const svcs = await getServices(barbershop.id);
      setAppointments(appts);
      setServices(svcs);
    } catch (e) {
      console.error("Erro ao carregar dados do dashboard:", e);
      error("Erro de sincronização", "Não foi possível sincronizar os agendamentos.");
    } finally {
      setLoading(false);
    }
  }, [barbershop, error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const handleStatusChange = async (apptId: string, newStatus: Appointment["status"]) => {
    try {
      const updated = await updateAppointmentStatus(apptId, newStatus);
      if (updated) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === apptId ? { ...a, status: newStatus } : a))
        );

        const messages = {
          confirmed: "Agendamento confirmado!",
          completed: "Corte finalizado! Visita registrada no CRM e cartão fidelidade atualizado.",
          cancelled: "Agendamento cancelado.",
          no_show: "Cliente marcado como No-Show.",
        };

        success("Sucesso", messages[newStatus as keyof typeof messages] || "Status atualizado.");

        if (newStatus === "completed") {
          // Dispara o pedido de avaliação via WhatsApp em background
          fetch("/api/send-review", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ appointmentId: apptId }),
          }).catch((err) => console.error("Falha ao disparar pedido de avaliação:", err));
        }
      }
    } catch (e) {
      error("Erro", "Não foi possível atualizar o status do agendamento.");
    }
  };

  const handleSendReminder = async (appt: Appointment) => {
    info("Disparando WhatsApp...", `Enviando lembrete de agendamento para ${appt.customer_name}...`);
    try {
      const res = await fetch("/api/whatsapp/send-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: appt.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro no envio");
      }

      success("Mensagem enviada!", `Lembrete entregue via Evolution API para ${appt.customer_name}.`);
    } catch (err: any) {
      console.error(err);
      error("Erro de envio", err.message || "Não foi possível disparar o lembrete. Verifique as configurações de WhatsApp.");
    }
  };

  const filteredAppts = useMemo(() => {
    return appointments.filter((a) => a.date === selectedDate);
  }, [appointments, selectedDate]);

  const totalRevenue = useMemo(() => {
    return appointments
      .filter((a) => a.status === "completed")
      .reduce((sum, a) => sum + Number(a.total_price), 0);
  }, [appointments]);

  const completedCount = useMemo(() => {
    return appointments.filter((a) => a.status === "completed").length;
  }, [appointments]);

  const noShowCount = useMemo(() => {
    return appointments.filter((a) => a.status === "no_show").length;
  }, [appointments]);

  const totalCount = appointments.length;

  const noShowRate = totalCount > 0 ? Math.round((noShowCount / totalCount) * 100) : 0;



  const quickDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return {
        dateString: d.toLocaleDateString("sv-SE"),
        dayName: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
        dayNum: d.getDate(),
        month: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      };
    });
  }, []);

  const serviceNamesMap = useMemo(() => {
    const map = new Map<string, string>();
    services.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [services]);

  const mostPopularService = useMemo(() => {
    const completed = appointments.filter((a) => a.status === "completed");
    const counts: Record<string, number> = {};
    completed.forEach((appt) => {
      appt.service_ids.forEach((id) => {
        counts[id] = (counts[id] || 0) + 1;
      });
    });
    let maxId = "";
    let maxCount = 0;
    Object.entries(counts).forEach(([id, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxId = id;
      }
    });
    if (!maxId) return "Nenhum";
    if (maxId === "social") return `Corte Social (${maxCount}x)`;
    if (maxId === "combo") return `Corte + Barba (${maxCount}x)`;
    return `${serviceNamesMap.get(maxId) || "Serviço"} (${maxCount}x)`;
  }, [appointments, serviceNamesMap]);

  const topCustomer = useMemo(() => {
    const completed = appointments.filter((a) => a.status === "completed");
    const counts: Record<string, number> = {};
    completed.forEach((appt) => {
      counts[appt.customer_name] = (counts[appt.customer_name] || 0) + 1;
    });
    let maxName = "";
    let maxCount = 0;
    Object.entries(counts).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxName = name;
      }
    });
    if (!maxName) return "Nenhum";
    return `${maxName} (${maxCount} cortes)`;
  }, [appointments]);

  const getServiceNames = (serviceIds: string[]) => {
    return serviceIds
      .map((id) => {
        if (id === "social") return "Corte Social";
        if (id === "combo") return "Corte + Barba";
        return serviceNamesMap.get(id) || "Serviço";
      })
      .join(", ");
  };

  const timeSlots = useMemo(() => ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"], []);

  const timeSlotCounts = useMemo(() => {
    const counts = timeSlots.map((slot) => {
      const hour = slot.split(":")[0];
      return appointments.filter((a) => a.time.startsWith(hour)).length;
    });
    return { counts, max: Math.max(...counts, 1) };
  }, [appointments, timeSlots]);

  return (
    <div className="flex flex-col gap-8 pb-10">


      {/* Banner de Compartilhamento / Link de Agendamento */}
      {barbershop && (
        <Card className="border-gold-500/20 bg-obsidian-900/90 relative overflow-hidden transition-all duration-300 hover:border-gold-500/40">
          {/* Subtle gold ambient glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col gap-2 min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-[10px] text-gold-500 font-extrabold uppercase w-fit">
                🚀 Sua Agenda Online está Ativa
              </div>
              <h2 className="text-base font-bold text-zinc-100 mt-1">
                Divulgue seu link para receber agendamentos
              </h2>
              <p className="text-xs text-zinc-400 leading-normal max-w-xl">
                Seus clientes podem agendar cortes sozinhos, consultar o progresso do Cartão Fidelidade e receber lembretes pelo WhatsApp automaticamente.
              </p>
              
              {/* @ Handle Highlight */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-zinc-500 font-semibold">Seu @ de usuário:</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-zinc-950/60 border border-zinc-850 text-xs font-bold text-gold-500">
                  @{barbershop.slug}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
              {/* Custom Input link style block */}
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-obsidian-950 border border-zinc-800/80 text-xs text-zinc-400 select-all font-mono font-medium max-w-xs truncate w-full md:w-fit">
                <Globe className="h-4 w-4 text-gold-500/80 shrink-0" />
                <span className="truncate">{typeof window !== "undefined" ? window.location.origin : ""}/{barbershop.slug}</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  onClick={handleCopyLink}
                  className="flex-1 sm:flex-initial h-10 px-4 font-bold text-xs bg-zinc-950/60 hover:bg-zinc-900 border-zinc-800 text-gold-500 hover:text-gold-400 cursor-pointer"
                  variant="gold-outline"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1.5 text-gold-500" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1.5" />
                      Copiar Link
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleShareWhatsApp}
                  className="flex-1 sm:flex-initial h-10 px-4 font-bold text-xs bg-emerald-500 text-obsidian-950 hover:bg-emerald-400 focus:ring-emerald-500 shadow-lg shadow-emerald-500/5 cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4 mr-1.5 fill-current" />
                  Divulgar
                </Button>

                {/* QR Code button wrapper */}
                <div className="shrink-0">
                  <QRCodeButton />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="h-12 w-12 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-500 shrink-0">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Faturamento</p>
              <h3 className="text-xl font-bold text-zinc-100">R$ {totalRevenue.toFixed(2)}</h3>
              <p className="text-[10px] text-zinc-500 font-medium">De cortes concluídos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Cortes Feitos</p>
              <h3 className="text-xl font-bold text-zinc-100">{completedCount}</h3>
              <p className="text-[10px] text-emerald-500/80 font-medium">Fidelidade ativa</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="h-12 w-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
              <UserX className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Taxa No-Show</p>
              <h3 className="text-xl font-bold text-zinc-100">{noShowRate}%</h3>
              <p className="text-[10px] text-red-500/70 font-medium">{noShowCount} clientes faltosos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <div className="h-12 w-12 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-500 shrink-0">
              <Award className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Destaques & Fidelidade</p>
              <div className="mt-1 flex flex-col gap-0.5">
                <p className="text-xs font-bold text-zinc-100 truncate">
                  ⭐ <span className="text-zinc-400 font-medium">VIP:</span> {topCustomer}
                </p>
                <p className="text-[10px] font-bold text-gold-500 truncate">
                  🔥 <span className="text-zinc-400 font-medium">Serviço:</span> {mostPopularService}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Calendar className="h-4.5 w-4.5 text-gold-500" />
            Agenda Diária
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-semibold">Ir para:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-zinc-800 text-xs text-zinc-200 bg-obsidian-900 focus:outline-none focus:border-gold-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 overflow-x-auto pb-1">
          {quickDays.map((day) => {
            const isSelected = selectedDate === day.dateString;
            return (
              <button
                key={day.dateString}
                onClick={() => setSelectedDate(day.dateString)}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? "bg-gold-500 text-obsidian-950 border-gold-500 font-bold shadow-md shadow-gold-500/10 scale-102"
                    : "bg-obsidian-900 hover:bg-obsidian-850 text-zinc-400 border-zinc-800/40"
                }`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{day.dayName}</span>
                <span className="text-base font-extrabold">{day.dayNum}</span>
                <span className="text-[9px] uppercase tracking-wider">{day.month}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <Card className="lg:col-span-2">
          <div className="px-6 py-4 border-b border-zinc-800/40 flex justify-between items-center bg-zinc-950/20">
            <h4 className="text-sm font-bold text-zinc-200">
              Fila de Atendimento para{" "}
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "long",
              })}
            </h4>
            <span className="px-2.5 py-1 rounded-full bg-zinc-900 text-zinc-400 text-xs font-semibold border border-zinc-800">
              {filteredAppts.length} agendamentos
            </span>
          </div>

          <CardContent className="flex flex-col gap-4 p-6 min-h-[300px]">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 w-full rounded-xl bg-zinc-900/50 border border-zinc-800/30 animate-pulse" />
              ))
            ) : filteredAppts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-3">
                  <Calendar className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-zinc-400">Nenhum agendamento para esta data</p>
                <p className="text-xs text-zinc-600 max-w-[240px] mt-1">
                  Clientes que acessarem seu link público e agendarem aparecerão instantaneamente aqui.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <AnimatePresence mode="popLayout">
                  {filteredAppts.map((appt) => {
                    const statusColors = {
                      pending: "text-amber-400 bg-amber-400/5 border-amber-400/20",
                      confirmed: "text-blue-400 bg-blue-400/5 border-blue-400/20",
                      completed: "text-emerald-400 bg-emerald-400/5 border-emerald-400/20",
                      cancelled: "text-zinc-500 bg-zinc-500/5 border-zinc-800",
                      no_show: "text-red-400 bg-red-400/5 border-red-500/10",
                    };

                    const statusLabels = {
                      pending: "Pendente",
                      confirmed: "Confirmado",
                      completed: "Finalizado",
                      cancelled: "Cancelado",
                      no_show: "No-Show",
                    };

                    return (
                      <motion.div
                        key={appt.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-4 rounded-xl border border-zinc-850 bg-obsidian-900 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 shrink-0 rounded-lg bg-zinc-950 flex flex-col items-center justify-center border border-zinc-800 text-zinc-300">
                            <Clock className="h-4 w-4 text-gold-500 mb-0.5" />
                            <span className="text-[10px] font-extrabold">{appt.time}</span>
                          </div>

                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-bold text-zinc-200 truncate">{appt.customer_name}</h5>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${statusColors[appt.status]}`}>
                                {statusLabels[appt.status]}
                              </span>
                            </div>

                            <p className="text-xs text-zinc-400 font-medium truncate mt-0.5">
                              {getServiceNames(appt.service_ids)}
                            </p>

                            <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-semibold mt-1">
                              <span>Duração: {appt.total_duration} min</span>
                              <span>•</span>
                              <span className="text-gold-500">Preço: R$ {Number(appt.total_price).toFixed(2)}</span>
                              {appt.loyalty_applied && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Fidelidade Usada</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 border-t md:border-t-0 border-zinc-800/40 pt-3 md:pt-0 justify-end">
                          <button
                            onClick={() => handleSendReminder(appt)}
                            className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                            title="Disparar Lembrete WhatsApp"
                          >
                            <MessageSquare className="h-4 w-4 text-emerald-500" />
                          </button>

                          {appt.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleStatusChange(appt.id, "confirmed")}
                                className="h-9 px-3 rounded-lg text-xs"
                              >
                                Confirmar
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleStatusChange(appt.id, "cancelled")}
                                className="h-9 px-3 rounded-lg text-xs"
                              >
                                Cancelar
                              </Button>
                            </>
                          )}

                          {appt.status === "confirmed" && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleStatusChange(appt.id, "completed")}
                                className="h-9 px-3 rounded-lg text-xs bg-emerald-500 text-zinc-950 hover:bg-emerald-400 focus:ring-emerald-500"
                              >
                                <UserCheck className="h-3.5 w-3.5 mr-1" />
                                Finalizar
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleStatusChange(appt.id, "no_show")}
                                className="h-9 px-3 rounded-lg text-xs text-red-400 border-red-500/10 hover:bg-red-500/5 hover:text-red-300"
                              >
                                <UserX className="h-3.5 w-3.5 mr-1" />
                                Faltou
                              </Button>
                            </>
                          )}

                          {(appt.status === "cancelled" || appt.status === "no_show") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStatusChange(appt.id, "pending")}
                              className="h-9 px-3 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
                            >
                              Reabrir
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="p-6">
              <h4 className="text-sm font-bold text-zinc-200 mb-1 flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-gold-500" />
                Picos de Horário
              </h4>
              <p className="text-xs text-zinc-500 mb-6 font-medium">Horários com maior número de agendamentos no total.</p>

              <div className="flex flex-col gap-3">
                {timeSlots.map((slot, idx) => {
                  const count = timeSlotCounts.counts[idx];
                  const percentage = (count / timeSlotCounts.max) * 100;
                  return (
                    <div key={slot} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-zinc-400 w-10">{slot}</span>
                      <div className="flex-1 h-3 bg-zinc-900 border border-zinc-800/40 rounded-full overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            count > 0 ? "bg-gold-500" : "bg-transparent"
                          }`}
                        />
                      </div>
                      <span className="text-xs font-bold text-zinc-400 w-4 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-gold-500 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h5 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Ações de Prevenção</h5>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    O BarberZap previne no-show disparando lembretes automáticos no WhatsApp do cliente 24 horas antes e 2 horas antes do agendamento.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
