"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { getAppointments, getCustomers, getServices, Appointment, Customer, Service } from "@/lib/db";
import {
  MessageSquare,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  Bell,
  Info,
  Zap,
  Calendar,
  Users,
  Clock,
  Search,
  MessageCircle,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WhatsappPage() {
  const { barbershop } = useDashboard();
  const { success, error, info } = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros e Abas
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"hoje" | "proximos" | "clientes">("hoje");
  const [sentCount, setSentCount] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const todayString = useMemo(() => new Date().toLocaleDateString("sv-SE"), []);
  const tomorrowString = useMemo(() => {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    return tom.toLocaleDateString("sv-SE");
  }, []);

  // Inicialização do Contador Diário de Mensagens Enviadas
  useEffect(() => {
    const todayStr = new Date().toLocaleDateString("sv-SE");
    const stored = localStorage.getItem(`barberzap_wa_sent_${todayStr}`);
    if (stored) {
      setSentCount(parseInt(stored, 10));
    }
  }, []);

  const incrementSentCount = () => {
    const todayStr = new Date().toLocaleDateString("sv-SE");
    const newCount = sentCount + 1;
    setSentCount(newCount);
    localStorage.setItem(`barberzap_wa_sent_${todayStr}`, newCount.toString());
  };

  // Carregar dados do Banco de Dados / LocalStorage
  const loadData = useCallback(async () => {
    if (!barbershop) return;
    try {
      setLoading(true);
      const [appts, custs, svcs] = await Promise.all([
        getAppointments(barbershop.id),
        getCustomers(barbershop.id),
        getServices(barbershop.id),
      ]);
      setAppointments(appts);
      setCustomers(custs);
      setServices(svcs);
    } catch (e) {
      console.error("Erro ao carregar dados de comunicação:", e);
      error("Erro", "Não foi possível carregar as informações para comunicação.");
    } finally {
      setLoading(false);
    }
  }, [barbershop, error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Mapa de ID de serviço para nome do serviço
  const serviceNamesMap = useMemo(() => {
    const map = new Map<string, string>();
    services.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [services]);

  const getServiceNames = useCallback((serviceIds: string[]) => {
    return serviceIds
      .map((id) => {
        if (id === "social") return "Corte Social";
        if (id === "combo") return "Corte + Barba";
        return serviceNamesMap.get(id) || "Serviço";
      })
      .join(", ");
  }, [serviceNamesMap]);

  // Métricas do Painel de Comunicação
  const metrics = useMemo(() => {
    const hojeAppts = appointments.filter(
      (a) => a.date === todayString && a.status !== "cancelled"
    );
    const pendentes = appointments.filter((a) => a.status === "pending");
    const lembretes = appointments.filter(
      (a) => a.status === "confirmed" && (a.date === todayString || a.date === tomorrowString)
    );

    return {
      hojeCount: hojeAppts.length,
      pendentesCount: pendentes.length,
      lembretesCount: lembretes.length,
      mensagensEnviadas: sentCount,
    };
  }, [appointments, todayString, tomorrowString, sentCount]);

  // Limpa e formata o telefone para o padrão DDI do wa.me
  const formatPhoneForWhatsApp = (phone: string) => {
    let digits = phone.replace(/\D/g, "");
    if (!digits) return "";
    // Se o telefone tem 10 ou 11 dígitos, insere o DDI do Brasil (55)
    if (digits.length === 10 || digits.length === 11) {
      digits = "55" + digits;
    }
    return digits;
  };

  // Modelador de Mensagens
  const generateMessageText = (
    type: "confirmacao" | "lembrete" | "agradecimento" | "promocao",
    data: {
      customerName: string;
      serviceName: string;
      date: string;
      time?: string;
    }
  ) => {
    const shopName = barbershop?.name || "BarberZap";
    const shopLink = barbershop
      ? `${window.location.origin}/${barbershop.slug}`
      : "";

    // Formata a data para padrão brasileiro
    let formattedDate = data.date;
    try {
      if (data.date === todayString) {
        formattedDate = "Hoje";
      } else if (data.date === tomorrowString) {
        formattedDate = "Amanhã";
      } else {
        formattedDate = new Date(data.date + "T00:00:00").toLocaleDateString("pt-BR");
      }
    } catch (_) {}

    const templates = {
      confirmacao: `Olá ${data.customerName}!

Seu agendamento para ${data.serviceName} foi confirmado.

📅 ${formattedDate}${data.time ? `\n🕒 ${data.time}` : ""}

Aguardamos você na ${shopName}! 💈`,

      lembrete: `Olá ${data.customerName}!

Passando para lembrar do seu agendamento de ${data.serviceName}.

📅 ${formattedDate}${data.time ? `\n🕒 ${data.time}` : ""}

Aguardamos você na ${shopName}! 💈`,

      agradecimento: `Olá ${data.customerName}!

Muito obrigado pela sua visita hoje na ${shopName}!

Espero que tenha gostado do resultado do seu ${data.serviceName}.

Até a próxima! ✂️`,

      promocao: `Olá ${data.customerName}!

Temos uma oferta especial para você na ${shopName}!

Garanta seu próximo horário com 10% de desconto.

Aproveite e agende pelo link:
${shopLink} 🚀`,
    };

    return templates[type];
  };

  // Abrir WhatsApp diretamente
  const handleOpenWhatsApp = (
    phone: string,
    messageText: string
  ) => {
    const cleanPhone = formatPhoneForWhatsApp(phone);
    if (!cleanPhone) {
      error("Erro no número", "O telefone deste cliente é inválido.");
      return;
    }
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(url, "_blank");
    incrementSentCount();
    success("Enviando WhatsApp", "O WhatsApp Web ou App foi aberto.");
  };

  // Copiar mensagem para área de transferência
  const handleCopyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      success("Copiado!", "Texto da mensagem copiado para a área de transferência.");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (_) {
      error("Erro ao copiar", "Não foi possível copiar o texto.");
    }
  };

  // Ativar OneSignal no navegador
  const requestPushPermission = () => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      await OneSignal.Notifications.requestPermission();
      success("Notificações ativas!", "Você receberá alertas de novos agendamentos.");
    });
  };

  // Filtragem dos dados de acordo com a aba e barra de pesquisa
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (activeTab === "hoje") {
      const list = appointments.filter(
        (a) => a.date === todayString && a.status !== "cancelled"
      );
      if (!query) return list;
      return list.filter(
        (a) =>
          a.customer_name.toLowerCase().includes(query) ||
          a.customer_phone.includes(query) ||
          getServiceNames(a.service_ids).toLowerCase().includes(query)
      );
    }

    if (activeTab === "proximos") {
      const list = appointments.filter(
        (a) => a.date > todayString && a.status !== "cancelled" && a.status !== "completed"
      );
      if (!query) return list;
      return list.filter(
        (a) =>
          a.customer_name.toLowerCase().includes(query) ||
          a.customer_phone.includes(query) ||
          getServiceNames(a.service_ids).toLowerCase().includes(query)
      );
    }

    // Clientes
    if (!query) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.phone.includes(query)
    );
  }, [activeTab, appointments, customers, searchQuery, todayString, getServiceNames]);

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gold-500" />
          Mensagens WhatsApp
        </h3>
        <p className="text-xs text-zinc-500 mt-1 font-medium">
          Gerencie e envie mensagens rápidas no WhatsApp de seus clientes de acordo com o status dos agendamentos, sem precisar de APIs complexas.
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-obsidian-900 border-zinc-800/60">
          <CardContent className="flex items-center gap-4 py-4 px-5">
            <div className="h-10 w-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-500 shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Agendamentos Hoje</p>
              <h3 className="text-lg font-extrabold text-zinc-100 mt-0.5">{metrics.hojeCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-obsidian-900 border-zinc-800/60">
          <CardContent className="flex items-center gap-4 py-4 px-5">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Pendentes de Confirmação</p>
              <h3 className="text-lg font-extrabold text-zinc-100 mt-0.5">{metrics.pendentesCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-obsidian-900 border-zinc-800/60">
          <CardContent className="flex items-center gap-4 py-4 px-5">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Lembretes para Enviar</p>
              <h3 className="text-lg font-extrabold text-zinc-100 mt-0.5">{metrics.lembretesCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-obsidian-900 border-zinc-800/60">
          <CardContent className="flex items-center gap-4 py-4 px-5">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Mensagens Enviadas Hoje</p>
              <h3 className="text-lg font-extrabold text-zinc-100 mt-0.5">{metrics.mensagensEnviadas}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Lado Esquerdo: Lista de Clientes/Agendamentos com Busca */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Abas */}
            <div className="flex bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/40 w-fit select-none">
              <button
                onClick={() => {
                  setActiveTab("hoje");
                  setSearchQuery("");
                }}
                className={`text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === "hoje"
                    ? "bg-gold-500 text-obsidian-950 shadow-md shadow-gold-500/5 font-extrabold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Agendamentos de Hoje
              </button>
              <button
                onClick={() => {
                  setActiveTab("proximos");
                  setSearchQuery("");
                }}
                className={`text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === "proximos"
                    ? "bg-gold-500 text-obsidian-950 shadow-md shadow-gold-500/5 font-extrabold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Próximos Agendamentos
              </button>
              <button
                onClick={() => {
                  setActiveTab("clientes");
                  setSearchQuery("");
                }}
                className={`text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === "clientes"
                    ? "bg-gold-500 text-obsidian-950 shadow-md shadow-gold-500/5 font-extrabold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Clientes CRM
              </button>
            </div>

            {/* Busca */}
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder={
                  activeTab === "clientes"
                    ? "Buscar por cliente ou telefone..."
                    : "Buscar por cliente, serviço..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-200 text-xs placeholder-zinc-650 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/25 outline-none transition-all"
              />
            </div>
          </div>

          {/* Cards Lista */}
          <Card className="min-h-[400px]">
            <CardContent className="p-5 flex flex-col gap-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-28 w-full rounded-xl bg-zinc-900/50 border border-zinc-800/30 animate-pulse"
                  />
                ))
              ) : filteredData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800/60 flex items-center justify-center text-zinc-650 mb-3">
                    {activeTab === "clientes" ? (
                      <Users className="h-6 w-6" />
                    ) : (
                      <Calendar className="h-6 w-6" />
                    )}
                  </div>
                  <p className="text-sm font-bold text-zinc-400">Nenhum registro localizado</p>
                  <p className="text-xs text-zinc-600 mt-1 max-w-[280px]">
                    Não encontramos resultados com os filtros ou buscas informados.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <AnimatePresence mode="popLayout">
                    {activeTab === "clientes"
                      ? (filteredData as Customer[]).map((customer) => {
                          const promoMsg = generateMessageText("promocao", {
                            customerName: customer.name,
                            serviceName: "",
                            date: "",
                          });

                          return (
                            <motion.div
                              key={customer.id}
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="p-4 rounded-xl border border-zinc-850 bg-obsidian-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-zinc-800 transition-colors"
                            >
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2">
                                  <h5 className="text-sm font-bold text-zinc-200 truncate">
                                    {customer.name}
                                  </h5>
                                  <span className="text-[9px] px-2 py-0.5 rounded-full border font-bold bg-zinc-950 border-zinc-850 text-zinc-400">
                                    {customer.visits_count} visitas
                                  </span>
                                </div>
                                <span className="text-xs text-zinc-400 font-medium font-mono mt-0.5">
                                  {customer.phone}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-medium mt-1">
                                  Última visita:{" "}
                                  {new Date(customer.last_visit).toLocaleDateString("pt-BR")}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenWhatsApp(customer.phone, promoMsg)}
                                  className="h-8 text-[11px] font-bold bg-gold-500 text-obsidian-950 hover:bg-gold-400 shrink-0"
                                >
                                  <Zap className="h-3 w-3 mr-1 fill-current" />
                                  Promoção
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleCopyText(customer.id, promoMsg)}
                                  className="h-8 text-[11px] font-semibold border-zinc-800 hover:border-gold-500/30"
                                  title="Copiar texto da promoção"
                                >
                                  {copiedId === customer.id ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </motion.div>
                          );
                        })
                      : (filteredData as Appointment[]).map((appt) => {
                          const serviceText = getServiceNames(appt.service_ids);
                          const isToday = appt.date === todayString;

                          // Mensagens Prontas
                          const confirmMsg = generateMessageText("confirmacao", {
                            customerName: appt.customer_name,
                            serviceName: serviceText,
                            date: appt.date,
                            time: appt.time,
                          });

                          const reminderMsg = generateMessageText("lembrete", {
                            customerName: appt.customer_name,
                            serviceName: serviceText,
                            date: appt.date,
                            time: appt.time,
                          });

                          const thanksMsg = generateMessageText("agradecimento", {
                            customerName: appt.customer_name,
                            serviceName: serviceText,
                            date: appt.date,
                          });

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
                              className="p-4 rounded-xl border border-zinc-850 bg-obsidian-900 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-zinc-800 transition-colors"
                            >
                              <div className="flex items-start gap-4">
                                <div className="h-10 w-10 shrink-0 rounded-lg bg-zinc-950 flex flex-col items-center justify-center border border-zinc-800 text-zinc-300">
                                  <Clock className="h-3.5 w-3.5 text-gold-500 mb-0.5" />
                                  <span className="text-[9px] font-extrabold">{appt.time}</span>
                                </div>

                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h5 className="text-sm font-bold text-zinc-200 truncate">
                                      {appt.customer_name}
                                    </h5>
                                    <span
                                      className={`text-[9px] px-2 py-0.5 rounded-full border font-semibold ${
                                        statusColors[appt.status]
                                      }`}
                                    >
                                      {statusLabels[appt.status]}
                                    </span>
                                  </div>
                                  <p className="text-xs text-zinc-400 font-medium truncate mt-0.5">
                                    {serviceText}
                                  </p>
                                  <span className="text-[10px] text-zinc-500 font-semibold font-mono mt-0.5">
                                    {appt.customer_phone}
                                  </span>
                                  {!isToday && (
                                    <span className="text-[9px] text-zinc-500 font-semibold mt-1">
                                      📅{" "}
                                      {new Date(appt.date + "T00:00:00").toLocaleDateString(
                                        "pt-BR"
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Ações baseadas no status */}
                              <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 border-zinc-800/40 pt-3 md:pt-0 justify-end shrink-0">
                                {appt.status === "pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleOpenWhatsApp(appt.customer_phone, confirmMsg)}
                                      className="h-8 text-[11px] font-bold bg-blue-500 text-zinc-950 hover:bg-blue-400 shrink-0"
                                    >
                                      📱 Confirmar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => handleOpenWhatsApp(appt.customer_phone, reminderMsg)}
                                      className="h-8 text-[11px] font-semibold border-zinc-800 hover:border-gold-500/30 shrink-0"
                                    >
                                      Lembrete
                                    </Button>
                                  </>
                                )}

                                {appt.status === "confirmed" && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleOpenWhatsApp(appt.customer_phone, reminderMsg)}
                                      className="h-8 text-[11px] font-bold bg-gold-500 text-obsidian-950 hover:bg-gold-400 shrink-0"
                                    >
                                      📱 Lembrete
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => handleOpenWhatsApp(appt.customer_phone, confirmMsg)}
                                      className="h-8 text-[11px] font-semibold border-zinc-800 hover:border-gold-500/30 shrink-0"
                                    >
                                      Confirmar
                                    </Button>
                                  </>
                                )}

                                {appt.status === "completed" && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleOpenWhatsApp(appt.customer_phone, thanksMsg)}
                                    className="h-8 text-[11px] font-bold bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shrink-0"
                                  >
                                    📱 Agradecer visita
                                  </Button>
                                )}

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleCopyText(
                                      appt.id,
                                      appt.status === "completed"
                                        ? thanksMsg
                                        : appt.status === "pending"
                                        ? confirmMsg
                                        : reminderMsg
                                    )
                                  }
                                  className="h-8 w-8 p-0 rounded-lg border border-zinc-850 hover:border-gold-500/30"
                                  title="Copiar mensagem"
                                >
                                  {copiedId === appt.id ? (
                                    <Check className="h-3.5 w-3.5 text-gold-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5 text-zinc-500" />
                                  )}
                                </Button>
                              </div>
                            </motion.div>
                          );
                        })}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lado Direito: Informações e Configuração de Push */}
        <div className="flex flex-col gap-4">
          <Card className="bg-obsidian-900 border-zinc-800/60">
            <div className="px-6 py-4 border-b border-zinc-800/40 bg-zinc-950/20">
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Bell className="h-4 w-4 text-gold-500" />
                Notificações Push
              </h4>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Receba alertas sonoros e no navegador a cada novo agendamento.
              </p>
            </div>
            <CardContent className="p-5 flex flex-col gap-4">
              <Button
                onClick={requestPushPermission}
                variant="secondary"
                className="w-full gap-2 border-zinc-800 hover:border-gold-500/30 text-xs font-bold"
              >
                <Bell className="h-4 w-4 text-gold-500" />
                Ativar alertas no navegador
              </Button>
              <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/40 text-[11px] text-zinc-400 leading-relaxed">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Zap className="h-3.5 w-3.5 text-gold-500 shrink-0" />
                  <span className="text-zinc-300 font-bold">Por que usar?</span>
                </div>
                Notificações no navegador ajudam você a acompanhar novos agendamentos criados por clientes no seu link de autoagendamento em tempo real, sem precisar ficar atualizando a tela.
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3.5 p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/10 text-xs text-zinc-400 leading-relaxed">
            <AlertCircle className="h-4 w-4 text-gold-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-zinc-300 font-bold mb-1">Como funciona a comunicação?</p>
              Ao clicar nos botões de ação, o sistema monta a mensagem ideal e abre o link oficial <code className="text-gold-400 font-mono">wa.me</code> do WhatsApp Web ou WhatsApp App. Isso permite enviar as mensagens de forma manual, sem custo com APIs e direto do seu celular ou PC.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
