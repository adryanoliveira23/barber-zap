"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  getBarbershopBySlug,
  getServices,
  getSchedule,
  getAppointments,
  getAppointment,
  createAppointment,
  getLoyaltyStatus,
  Barbershop,
  Service,
  Schedule,
  Appointment,
  Loyalty,
} from "@/lib/db";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  Scissors,
  Calendar,
  Clock,
  Phone,
  User,
  Instagram,
  MessageCircle,
  MapPin,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Sparkles,
  Gift,
  Award,
  Star,
} from "lucide-react";

export default function PublicBookingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params?.barbershopSlug as string;
  const rescheduleId = searchParams ? searchParams.get("reschedule") : null;

  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do Fluxo de Agendamento
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [confirmedAppt, setConfirmedAppt] = useState<Appointment | null>(null);

  // Estados de Fidelidade do Cliente
  const [viewLoyalty, setViewLoyalty] = useState(false);
  const [loyaltyPhone, setLoyaltyPhone] = useState("");
  const [loyaltyResult, setLoyaltyResult] = useState<Loyalty | null>(null);
  const [loyaltySearchLoading, setLoyaltySearchLoading] = useState(false);
  const [loyaltyChecked, setLoyaltyChecked] = useState(false);

  const { success, error, info } = useToast();

  useEffect(() => {
    const loadBarbershopData = async () => {
      try {
        setLoading(true);
        const shop = await getBarbershopBySlug(slug);
        if (!shop) {
          setBarbershop(null);
          setLoading(false);
          return;
        }

        setBarbershop(shop);

        // Carregar serviços, agendas e agendamentos ocupados
        const [svcs, sched, appts] = await Promise.all([
          getServices(shop.id),
          getSchedule(shop.id),
          getAppointments(shop.id),
        ]);

        setServices(svcs.filter((s) => s.active));
        setSchedule(sched);
        setAppointments(appts);

        // Pré-preencher dados se for um fluxo de reagendamento
        if (rescheduleId) {
          const oldAppt = await getAppointment(rescheduleId);
          if (oldAppt && oldAppt.barbershop_id === shop.id) {
            setCustomerName(oldAppt.customer_name);
            setCustomerPhone(oldAppt.customer_phone);
            const preselected = svcs.filter((s) => oldAppt.service_ids.includes(s.id));
            setSelectedServices(preselected);
            setStep(2); // Direciona para o passo de escolher a data
            info("Reagendamento", "Selecione o novo dia e horário para o seu agendamento.");
          }
        }
      } catch (e) {
        console.error("Erro ao carregar barbearia:", e);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadBarbershopData();
    }
  }, [slug, rescheduleId]);

  // Consulta rápida ao Cartão Fidelidade
  const handleCheckLoyalty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loyaltyPhone || !barbershop) return;
    setLoyaltySearchLoading(true);
    setLoyaltyChecked(true);
    try {
      const data = await getLoyaltyStatus(barbershop.id, loyaltyPhone);
      setLoyaltyResult(data);
    } catch (err) {
      error("Erro", "Não foi possível carregar seu progresso.");
    } finally {
      setLoyaltySearchLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-obsidian-950 gap-4">
        <div className="h-14 w-14 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-500 animate-pulse">
          <Scissors className="h-7 w-7 rotate-90" />
        </div>
        <p className="text-xs text-zinc-500 font-semibold tracking-widest uppercase">Carregando Agenda...</p>
      </div>
    );
  }

  if (!barbershop) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-obsidian-950 px-4 text-center">
        <div className="h-14 w-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mb-4">
          <Scissors className="h-7 w-7 rotate-90" />
        </div>
        <h2 className="text-lg font-bold text-zinc-200">Barbearia Não Encontrada</h2>
        <p className="text-xs text-zinc-500 max-w-xs mt-1 leading-normal">
          O endereço digitado não corresponde a nenhuma barbearia ativa cadastrada no BarberZap.
        </p>
        <Button onClick={() => router.push("/login")} className="mt-5 text-xs">
          Acessar Painel BarberZap
        </Button>
      </div>
    );
  }

  // 1. GERAÇÃO INTELIGENTE DE HORÁRIOS LIVRES
  const getAvailableSlots = () => {
    if (!schedule || !selectedDate) return [];

    const dateObj = new Date(selectedDate + "T00:00:00");
    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = weekdays[dateObj.getDay()];

    // 1.1 Checar se a data escolhida está bloqueada nas folgas/férias
    if (schedule.blocked_dates?.includes(selectedDate)) {
      return [];
    }

    // 1.2 Checar se o dia da semana está ativo
    const dayConfig = schedule.weekly_hours[dayName];
    if (!dayConfig || !dayConfig.active) {
      return [];
    }

    const { open, close } = dayConfig;
    const interval = schedule.interval_minutes || 30;
    const breakTimes = schedule.break_times || [];

    const slots: string[] = [];
    let current = timeStringToMinutes(open);
    const endLimit = timeStringToMinutes(close);

    // Gerar slots de hora em hora/fração
    while (current + getSelectedDuration() <= endLimit) {
      const slotTimeStr = minutesToTimeString(current);

      // 1.3 Verificar se o slot conflita com horário de almoço/pausas
      const conflictsWithBreak = breakTimes.some((brk) => {
        const brkStart = timeStringToMinutes(brk.start);
        const brkEnd = timeStringToMinutes(brk.end);
        // O slot começa dentro do intervalo de pausa OU
        // O slot termina dentro da pausa
        const slotEnd = current + getSelectedDuration();
        return (
          (current >= brkStart && current < brkEnd) ||
          (slotEnd > brkStart && slotEnd <= brkEnd)
        );
      });

      // 1.4 Verificar se o slot já está ocupado por outro agendamento
      const conflictsWithAppointment = appointments.some((appt) => {
        if (appt.date !== selectedDate || appt.status === "cancelled" || appt.status === "no_show") return false;
        const apptStart = timeStringToMinutes(appt.time);
        const apptEnd = apptStart + appt.total_duration;

        const slotEnd = current + getSelectedDuration();
        return (
          (current >= apptStart && current < apptEnd) ||
          (slotEnd > apptStart && slotEnd <= apptEnd)
        );
      });

      if (!conflictsWithBreak && !conflictsWithAppointment) {
        slots.push(slotTimeStr);
      }

      current += interval;
    }

    return slots;
  };

  const timeStringToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const minutesToTimeString = (mins: number) => {
    const h = Math.floor(mins / 60).toString().padStart(2, "0");
    const m = (mins % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  const getSelectedPrice = () => {
    return selectedServices.reduce((sum, s) => sum + Number(s.price), 0);
  };

  const getSelectedDuration = () => {
    return selectedServices.reduce((sum, s) => sum + s.duration, 0) || 30; // Minimo 30min por segurança
  };

  // 2. CONFIRMAÇÃO DO AGENDAMENTO (SALVAR NO Firestore/Supabase)
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      error("Atenção", "Preencha seus dados de contato.");
      return;
    }

    if (customerPhone.replace(/\D/g, "").length < 10) {
      error("Telefone Inválido", "Informe um telefone celular válido com DDD.");
      return;
    }

    setBookingLoading(true);
    try {
      if (rescheduleId) {
        // Fluxo de Reagendamento via endpoint /api/reschedule
        const response = await fetch("/api/reschedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointmentId: rescheduleId,
            newDate: selectedDate,
            newTime: selectedTime,
          }),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Erro ao reagendar");
        }

        setConfirmedAppt(result.appointment);
        success("Reagendado com sucesso!", `Seu novo horário foi reservado e o anterior foi liberado.`);
        setStep(5);
      } else {
        // Fluxo Normal de Agendamento
        const apptData = {
          barbershop_id: barbershop.id,
          customer_name: customerName,
          customer_phone: customerPhone.replace(/\D/g, ""),
          date: selectedDate,
          time: selectedTime,
          service_ids: selectedServices.map((s) => s.id),
          total_price: getSelectedPrice(),
          total_duration: getSelectedDuration(),
        };

        const created = await createAppointment(apptData);
        setConfirmedAppt(created);

        success("Agendado com sucesso!", `Seu horário foi reservado na agenda.`);
        setStep(5);
      }
    } catch (err: any) {
      error("Erro", err.message || "Ocorreu um problema ao reservar seu horário. Tente novamente.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleToggleService = (service: Service) => {
    if (selectedServices.find((s) => s.id === service.id)) {
      setSelectedServices(selectedServices.filter((s) => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const sanitizeForUrl = (str: string): string => {
    return str.replace(/[\r\n]/g, " ").replace(/\s+/g, " ").trim();
  };

  const handleSendWhatsAppReceipt = () => {
    if (!confirmedAppt) return;
    const servicesText = sanitizeForUrl(getServicesSummaryText());
    const customerName = sanitizeForUrl(confirmedAppt.customer_name);
    const shopName = sanitizeForUrl(barbershop.name);
    const dateStr = new Date(confirmedAppt.date + "T00:00:00").toLocaleDateString("pt-BR");
    const message = `Olá, agendei um horário na ${shopName}!\n\n📅 Data: ${dateStr}\n⏰ Horário: ${confirmedAppt.time}\n💈 Serviços: ${servicesText}\n💵 Valor total: R$ ${Number(confirmedAppt.total_price).toFixed(2)}\n👤 Nome: ${customerName}`;

    const shopWhatsapp = barbershop.whatsapp || "556699762785";
    const cleanPhone = shopWhatsapp.replace(/[^0-9]/g, "");
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const getServicesSummaryText = () => {
    return selectedServices.map((s) => s.name).join(", ");
  };

  // Gerar dias disponíveis para escolha do cliente (Próximos 14 dias)
  const getBookingDays = () => {
    const days = [];
    const today = new Date();

    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);

      const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const dayName = weekdays[d.getDay()];

      // Checar se o barbeiro atende nesse dia da semana
      const dayConfig = schedule?.weekly_hours[dayName];
      const isBlocked = schedule?.blocked_dates?.includes(d.toLocaleDateString("sv-SE"));

      if (dayConfig?.active && !isBlocked) {
        days.push({
          dateString: d.toLocaleDateString("sv-SE"),
          dayNum: d.getDate(),
          month: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
          weekday: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
        });
      }
    }
    return days;
  };

  return (
    <div className="min-h-screen w-full bg-obsidian-950 text-zinc-300 flex flex-col items-center justify-start pb-10">

      {/* 1. BRAND COVER BANNER */}
      <div className="w-full h-52 bg-gradient-to-b from-zinc-900/60 to-obsidian-950 relative border-b border-zinc-800/80 shrink-0 flex items-center justify-center">
        {/* Subtle decorative glow overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-gold-500/5 via-transparent to-transparent pointer-events-none"></div>

        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <Button
            variant="secondary"
            onClick={() => setViewLoyalty(!viewLoyalty)}
            className="text-xs h-9 gap-1 bg-obsidian-900/85 hover:bg-obsidian-800/90 border-zinc-800 hover:border-gold-500/30 text-gold-500 backdrop-blur"
          >
            <Award className="h-4 w-4" />
            {viewLoyalty ? "Agendar Horário" : "Meu Cartão Fidelidade"}
          </Button>

          <div className="flex gap-2">
            {barbershop.instagram && (
              <a
                href={`https://instagram.com/${barbershop.instagram}`}
                target="_blank"
                className="p-2 rounded-xl bg-obsidian-900/85 hover:bg-obsidian-800/90 border border-zinc-800 text-zinc-400 hover:text-gold-500 transition-colors backdrop-blur"
              >
                <Instagram className="h-4.5 w-4.5" />
              </a>
            )}
            {barbershop.whatsapp && (
              <a
                href={`https://wa.me/${barbershop.whatsapp}`}
                target="_blank"
                className="p-2 rounded-xl bg-obsidian-900/85 hover:bg-obsidian-800/90 border border-zinc-800 text-zinc-400 hover:text-emerald-500 transition-colors backdrop-blur"
              >
                <MessageCircle className="h-4.5 w-4.5" />
              </a>
            )}
          </div>
        </div>

        {/* Informações da Barbearia */}
        <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-1 items-center text-center">
          <div className="h-14 w-14 rounded-2xl bg-gold-500/10 border border-gold-500/30 shadow-xl shadow-gold-500/5 mb-1 font-black text-xl flex items-center justify-center text-gold-500">
            {barbershop.name.charAt(0)}
          </div>
          <h2 className="text-lg font-black tracking-tight text-zinc-100">{barbershop.name}</h2>
          <p className="text-xs text-zinc-400 max-w-sm px-4">{barbershop.description}</p>
          <span className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1 font-medium">
            <MapPin className="h-3 w-3 text-gold-500" />
            {barbershop.address}
          </span>
        </div>
      </div>

      {/* 2. AREA DE SEÇÕES (FIDELIDADE OU FLUXO DE AGENDAMENTO) */}
      <div className="w-full max-w-md px-4 mt-8 z-10">

        <AnimatePresence mode="wait">
          {viewLoyalty ? (
            /* SEÇÃO DO CARTÃO FIDELIDADE PÚBLICO */
            <motion.div
              key="loyalty"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <Card className="glass-panel">
                <CardContent className="pt-6">
                  <h3 className="text-md font-bold text-zinc-100 flex items-center gap-2 mb-2">
                    <Gift className="h-5 w-5 text-gold-500 animate-pulse" />
                    Consultar Fidelidade
                  </h3>
                  <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                    Insira o número do celular cadastrado ao fazer o agendamento para ver seus selos acumulados e progresso para o corte grátis.
                  </p>

                  <form onSubmit={handleCheckLoyalty} className="flex gap-2 items-end mb-6">
                    <div className="flex-1">
                      <Input
                        type="tel"
                        label="Telefone Celular (com DDD)"
                        placeholder="Ex: 11999999999"
                        value={loyaltyPhone}
                        onChange={(e) => setLoyaltyPhone(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" isLoading={loyaltySearchLoading} className="h-11 px-4">
                      Buscar
                    </Button>
                  </form>

                  {loyaltyChecked && (
                    <div className="border-t border-zinc-800/40 pt-5">
                      {loyaltyResult ? (
                        <div className="flex flex-col items-center">
                          {/* Card Fidelidade do Cliente */}
                          <div className="w-full p-5 rounded-xl bg-obsidian-950 border border-gold-500/20 relative overflow-hidden mb-4">
                            <div className="flex justify-between items-start mb-5">
                              <div>
                                <h4 className="text-[10px] font-bold text-gold-500 tracking-wider">CARTÃO CLIENTE VIP</h4>
                                <span className="text-[9px] text-zinc-500">10 Cortes Finalizados = 1 Corte Grátis</span>
                              </div>
                              <Star className="h-5 w-5 text-gold-500 fill-current" />
                            </div>

                            {/* Grid de Selos */}
                            <div className="grid grid-cols-5 gap-2.5 mb-5">
                              {Array.from({ length: 10 }).map((_, i) => {
                                const stampNumber = i + 1;
                                const isStamped = loyaltyResult.progress >= stampNumber;
                                return (
                                  <div
                                    key={i}
                                    className={`h-9 rounded-lg flex items-center justify-center border text-xs font-semibold ${isStamped
                                      ? "bg-gold-500 border-gold-500 text-obsidian-950"
                                      : stampNumber === 10
                                        ? "bg-gold-500/5 border-dashed border-gold-500/20 text-gold-500"
                                        : "bg-obsidian-900 border-zinc-850 text-zinc-650"
                                      }`}
                                  >
                                    {isStamped ? (
                                      <Star className="h-3.5 w-3.5 fill-current" />
                                    ) : stampNumber === 10 ? (
                                      <Gift className="h-3.5 w-3.5" />
                                    ) : (
                                      <span>{stampNumber}</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-zinc-400">Progresso Atual:</span>
                              <span className="font-extrabold text-gold-500">{loyaltyResult.progress} / 10 Cortes</span>
                            </div>
                          </div>

                          {loyaltyResult.progress >= 10 && (
                            <p className="text-xs text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg text-center leading-normal">
                              🎉 Parabéns! Você completou os 10 cortes. Avise o barbeiro no seu próximo atendimento para resgatar seu prêmio gratuito!
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4 bg-zinc-900/20 rounded-xl border border-zinc-850">
                          <p className="text-xs font-bold text-zinc-400">Nenhum progresso encontrado</p>
                          <p className="text-[10px] text-zinc-500 max-w-[280px] mx-auto mt-1 leading-normal">
                            Complete cortes e agende horários para registrar visitas automaticamente com este telefone.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                </CardContent>
              </Card>
            </motion.div>
          ) : (
            /* FLUXO DE AGENDAMENTO ATIVO */
            <motion.div
              key="booking"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <Card className="glass-panel border-zinc-800/80 rounded-2xl overflow-visible shadow-2xl relative">
                {/* Indicador de progresso de Etapas */}
                {step < 5 && (
                  <div className="w-full h-1 bg-zinc-800/40 flex rounded-t-2xl overflow-hidden">
                    <motion.div
                      className="h-full bg-gold-500"
                      animate={{ width: `${(step / 4) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}

                <CardContent className="pt-6">

                  {/* ETAPA 1: ESCOLHER SERVIÇOS */}
                  {step === 1 && (
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Escolha o Serviço</h3>
                        <span className="text-[10px] text-zinc-500 font-bold">Múltipla escolha</span>
                      </div>

                      {services.length === 0 ? (
                        <p className="text-xs text-zinc-500 py-10 text-center">Nenhum serviço disponível no momento.</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {services.map((s) => {
                            const isSelected = selectedServices.some((x) => x.id === s.id);
                            return (
                              <button
                                key={s.id}
                                onClick={() => handleToggleService(s)}
                                className={`p-4 rounded-xl border flex justify-between items-start text-left transition-all cursor-pointer ${isSelected
                                  ? "bg-gold-500/10 border-gold-500 ring-1 ring-gold-500/20"
                                  : "bg-obsidian-900/50 border-zinc-800/80 hover:border-gold-500/30 hover:bg-gold-500/5"
                                  }`}
                              >
                                <div className="flex flex-col gap-1 min-w-0 pr-4">
                                  <span className={`text-sm font-bold truncate ${isSelected ? "text-gold-500" : "text-zinc-200"}`}>
                                    {s.name}
                                  </span>
                                  {s.description && (
                                    <p className="text-xs text-zinc-400 leading-normal line-clamp-2">{s.description}</p>
                                  )}
                                </div>
                                <div className="flex flex-col items-end shrink-0">
                                  <span className="text-sm font-extrabold text-gold-500">R$ {s.price.toFixed(2)}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Footer Etapa 1 */}
                      {selectedServices.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between border-t border-zinc-850 pt-4 mt-2"
                        >
                          <div className="flex flex-col">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold">Total</span>
                            <span className="text-sm font-extrabold text-gold-500">
                              R$ {getSelectedPrice().toFixed(2)}
                            </span>
                          </div>

                          <Button onClick={() => setStep(2)} className="text-xs px-5 h-10">
                            Avançar
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* ETAPA 2: ESCOLHER DATA */}
                  {step === 2 && (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setStep(1)}
                          className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
                        >
                          <ChevronLeft className="h-4 w-4" /> Voltar
                        </button>
                        <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Escolha o Dia</h3>
                      </div>

                      {/* Grid de Dias Disponíveis */}
                      <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                        {getBookingDays().map((day) => {
                          const isSelected = selectedDate === day.dateString;
                          return (
                            <button
                              key={day.dateString}
                              onClick={() => {
                                setSelectedDate(day.dateString);
                                setSelectedTime(""); // Limpar hora para novo dia
                                setStep(3); // Avançar direto
                              }}
                              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${isSelected
                                ? "bg-gold-500 text-obsidian-950 border-gold-500 font-bold shadow-lg shadow-gold-500/20"
                                : "bg-obsidian-900/50 border-zinc-800/80 hover:border-gold-500/30 text-zinc-400 hover:text-zinc-200"
                                }`}
                            >
                              <span className={`text-[9px] uppercase tracking-wider font-bold ${isSelected ? "text-obsidian-950 opacity-90" : "text-zinc-550 text-zinc-500"}`}>{day.weekday}</span>
                              <span className="text-base font-extrabold">{day.dayNum}</span>
                              <span className={`text-[9px] uppercase tracking-wider ${isSelected ? "text-obsidian-950 opacity-90" : "text-zinc-550 text-zinc-500"}`}>{day.month}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ETAPA 3: ESCOLHER HORÁRIO */}
                  {step === 3 && (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setStep(2)}
                          className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
                        >
                          <ChevronLeft className="h-4 w-4" /> Voltar
                        </button>
                        <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Horários Disponíveis</h3>
                      </div>

                      {/* Lista de Horários Gerados */}
                      {getAvailableSlots().length === 0 ? (
                        <div className="text-center py-10 bg-obsidian-900/50 rounded-xl border border-zinc-800/80">
                          <p className="text-xs font-bold text-zinc-300">Nenhum horário livre</p>
                          <p className="text-[10px] text-zinc-500 mt-1 max-w-[240px] mx-auto leading-normal">
                            Não há horários disponíveis para este dia. Tente outra data.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2.5 max-h-60 overflow-y-auto pr-1">
                          {getAvailableSlots().map((time) => {
                            const isSelected = selectedTime === time;
                            return (
                              <button
                                key={time}
                                onClick={() => {
                                  setSelectedTime(time);
                                  setStep(4);
                                }}
                                className={`py-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${isSelected
                                  ? "bg-gold-500 text-obsidian-950 border-gold-500 shadow-lg shadow-gold-500/20"
                                  : "bg-obsidian-900/50 border-zinc-800/80 hover:border-gold-500/30 hover:bg-gold-500/5 text-zinc-300 hover:text-zinc-100"
                                  }`}
                              >
                                {time}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ETAPA 4: DADOS DE CONTATO */}
                  {step === 4 && (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setStep(3)}
                          className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
                        >
                          <ChevronLeft className="h-4 w-4" /> Voltar
                        </button>
                        <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Seus Dados</h3>
                      </div>

                      <form onSubmit={handleConfirmBooking} className="flex flex-col gap-4">
                        <Input
                          label="Seu nome"
                          placeholder="Ex: Alessandro Silva"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          required
                        />

                        <Input
                          label="Número do WhatsApp (com DDD)"
                          placeholder="Ex: 11999999999"
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          required
                        />

                        <div className="p-3.5 rounded-xl border border-gold-500/25 bg-gold-500/5 flex flex-col gap-1 text-[11px] text-zinc-300 mt-2 border-dashed">
                          <span className="font-bold text-gold-500 uppercase tracking-wider text-[9px]">Resumo da Reserva</span>
                          <span>Serviços: {getServicesSummaryText()}</span>
                          <span>Data: {new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-BR")} às {selectedTime}</span>
                          <span className="font-bold text-zinc-100 mt-1">Total: R$ {getSelectedPrice().toFixed(2)}</span>
                        </div>

                        <Button type="submit" isLoading={bookingLoading} className="w-full mt-2">
                          Confirmar Agendamento
                        </Button>
                      </form>
                    </div>
                  )}

                  {/* ETAPA 5: TELA DE CONFIRMAÇÃO (SUCESSO) */}
                  {step === 5 && confirmedAppt && (
                    <div className="flex flex-col items-center py-6 text-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 animate-bounce">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>

                      <div>
                        <h3 className="text-md font-bold text-zinc-100">Horário Reservado! 🎉</h3>
                        <p className="text-xs text-zinc-400 leading-normal max-w-xs mt-1">
                          Seu agendamento foi registrado com sucesso.
                        </p>
                      </div>

                      <div className="w-full p-4 rounded-xl border border-zinc-800/80 bg-obsidian-950/40 flex flex-col gap-1.5 text-xs text-zinc-300 text-left my-2 border-dashed">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Barbearia:</span>
                          <span className="font-bold text-zinc-200">{barbershop.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Serviço:</span>
                          <span className="font-bold text-zinc-200">{getServicesSummaryText()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Horário:</span>
                          <span className="font-bold text-gold-500">
                            {new Date(confirmedAppt.date + "T00:00:00").toLocaleDateString("pt-BR")} às {confirmedAppt.time}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-zinc-800/50 pt-2 mt-1">
                          <span className="text-zinc-500">Total:</span>
                          <span className="font-bold text-zinc-100">R$ {Number(confirmedAppt.total_price).toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 w-full mt-2">
                        <Button onClick={handleSendWhatsAppReceipt} className="w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400 focus:ring-emerald-500">
                          <MessageCircle className="h-4.5 w-4.5 mr-1.5" />
                          Enviar Comprovante
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setSelectedServices([]);
                            setSelectedDate("");
                            setSelectedTime("");
                            setStep(1);
                          }}
                          className="w-full text-xs text-zinc-400 hover:text-zinc-200"
                        >
                          Fazer outro agendamento
                        </Button>
                      </div>
                    </div>
                  )}

                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}
