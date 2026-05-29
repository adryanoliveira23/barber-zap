"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  MessageSquare,
  Smartphone,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  QrCode,
  Bell,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ConnectionState = "idle" | "creating" | "waiting_scan" | "connected" | "disconnected" | "error";

export default function WhatsappPage() {
  const { barbershop } = useDashboard();
  const { success, error, info } = useToast();

  const [state, setState] = useState<ConnectionState>("idle");
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [qrRefreshing, setQrRefreshing] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Notificações automáticas
  const [notifyNewBooking, setNotifyNewBooking] = useState(true);
  const [notifyReminders, setNotifyReminders] = useState(true);

  // Ao montar, verificar se já existe instância salva para esta barbearia
  useEffect(() => {
    if (!barbershop?.id) return;
    const saved = localStorage.getItem(`evo_instance_${barbershop.id}`);
    if (saved) {
      setInstanceName(saved);
      checkStatus(saved);
    }
  }, [barbershop?.id]);

  // Limpa o poll ao desmontar
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const checkStatus = useCallback(async (inst: string) => {
    try {
      const res = await fetch(`/api/whatsapp/instance/${inst}/status`);
      const data = await res.json();
      if (data.connected) {
        setState("connected");
        stopPolling();
      } else {
        setState("waiting_scan");
      }
    } catch {
      setState("error");
    }
  }, []);

  const startPolling = useCallback((inst: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    setPolling(true);
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/whatsapp/instance/${inst}/status`);
      const data = await res.json();
      if (data.connected) {
        setState("connected");
        stopPolling();
        success("WhatsApp Conectado! 🎉", "Seu número foi vinculado. Lembretes automáticos estão ativos.");
      }
    }, 3500);
  }, []);

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setPolling(false);
  };

  const handleConnect = async () => {
    if (!barbershop?.id) return;
    setState("creating");
    try {
      const res = await fetch("/api/whatsapp/instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barbershopId: barbershop.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const inst = data.instanceName;
      setInstanceName(inst);
      localStorage.setItem(`evo_instance_${barbershop.id}`, inst);

      if (data.qr) {
        setQrBase64(data.qr);
        setState("waiting_scan");
        startPolling(inst);
      } else {
        await refreshQr(inst);
      }
    } catch (err: any) {
      setState("error");
      error("Erro ao iniciar", err.message || "Verifique se a Evolution API está configurada.");
    }
  };

  const refreshQr = async (inst?: string) => {
    const target = inst || instanceName;
    if (!target) return;
    setQrRefreshing(true);
    try {
      const res = await fetch(`/api/whatsapp/instance/${target}/qr`);
      const data = await res.json();
      if (data.qr) {
        setQrBase64(data.qr);
        setState("waiting_scan");
        startPolling(target);
      } else {
        throw new Error("QR Code não disponível");
      }
    } catch (err: any) {
      error("Erro ao gerar QR", err.message);
    } finally {
      setQrRefreshing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!instanceName || !barbershop?.id) return;
    try {
      stopPolling();
      await fetch(`/api/whatsapp/instance/${instanceName}/status`, { method: "DELETE" });
      localStorage.removeItem(`evo_instance_${barbershop.id}`);
      setInstanceName(null);
      setQrBase64(null);
      setState("idle");
      info("Desconectado", "WhatsApp desvinculado com sucesso.");
    } catch {
      error("Erro", "Não foi possível desconectar.");
    }
  };

  const requestPushPermission = async () => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      await OneSignal.Notifications.requestPermission();
      success("Notificações ativas!", "Você receberá alertas de novos agendamentos.");
    });
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gold-500" />
          WhatsApp & Notificações
        </h3>
        <p className="text-xs text-zinc-500 mt-1 font-medium">
          Conecte seu WhatsApp para enviar lembretes automáticos e configure alertas push para novos agendamentos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ─── CARD: CONEXÃO WHATSAPP ─── */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800/40 bg-zinc-950/20 flex justify-between items-center">
            <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-gold-500" />
              Conexão via QR Code
            </h4>
            <div className="flex items-center gap-2">
              {state === "connected" && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Conectado
                </span>
              )}
              {state === "waiting_scan" && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Aguardando scan
                </span>
              )}
              {state === "idle" && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                  <WifiOff className="h-3 w-3" />
                  Desconectado
                </span>
              )}
            </div>
          </div>

          <CardContent className="p-6 flex flex-col items-center gap-6">
            <AnimatePresence mode="wait">

              {/* ESTADO: IDLE */}
              {(state === "idle" || state === "error") && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4 text-center py-4"
                >
                  <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
                    <QrCode className="h-8 w-8" />
                  </div>
                  <div>
                    <h5 className="font-bold text-zinc-200 text-sm">Nenhum WhatsApp vinculado</h5>
                    <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
                      Conecte seu número para que seus clientes recebam confirmações e lembretes automáticos pelo WhatsApp da sua barbearia.
                    </p>
                  </div>
                  {state === "error" && (
                    <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 w-full">
                      Erro na conexão. Verifique se a Evolution API está configurada no servidor.
                    </p>
                  )}
                  <Button onClick={handleConnect} className="gap-2">
                    <Smartphone className="h-4 w-4" />
                    Conectar WhatsApp
                  </Button>
                </motion.div>
              )}

              {/* ESTADO: CRIANDO INSTÂNCIA */}
              {state === "creating" && (
                <motion.div
                  key="creating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3 py-8"
                >
                  <RefreshCw className="h-8 w-8 text-gold-500 animate-spin" />
                  <p className="text-sm text-zinc-400 font-medium">Criando instância...</p>
                  <p className="text-xs text-zinc-600">Aguarde enquanto configuramos seu WhatsApp</p>
                </motion.div>
              )}

              {/* ESTADO: QR CODE */}
              {state === "waiting_scan" && (
                <motion.div
                  key="qr"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4 w-full"
                >
                  <div className="text-center">
                    <h5 className="font-bold text-zinc-200 text-sm">Escaneie com seu WhatsApp</h5>
                    <p className="text-xs text-zinc-500 mt-1">
                      Abra WhatsApp → Menu → Dispositivos vinculados → Vincular dispositivo
                    </p>
                  </div>

                  {/* QR Code Image */}
                  <div className="relative">
                    {qrRefreshing ? (
                      <div className="w-52 h-52 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 text-gold-500 animate-spin" />
                      </div>
                    ) : qrBase64 ? (
                      <div className="p-3 bg-white rounded-xl shadow-lg shadow-black/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`data:image/png;base64,${qrBase64.replace(/^data:image\/\w+;base64,/, "")}`}
                          alt="WhatsApp QR Code"
                          className="w-48 h-48 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-52 h-52 bg-zinc-900 rounded-xl border border-zinc-800 animate-pulse" />
                    )}

                    {polling && (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-obsidian-950 border border-zinc-800 px-3 py-1 rounded-full text-[10px] text-zinc-400 font-medium">
                        <RefreshCw className="h-3 w-3 animate-spin text-gold-500" />
                        Aguardando...
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 w-full">
                    <Button
                      variant="secondary"
                      className="flex-1 text-xs border-zinc-800 gap-1.5"
                      onClick={() => refreshQr()}
                      isLoading={qrRefreshing}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Novo QR
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1 text-xs text-red-400 border-zinc-800 hover:bg-red-500/10"
                      onClick={() => { stopPolling(); setState("idle"); setQrBase64(null); }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ESTADO: CONECTADO */}
              {state === "connected" && (
                <motion.div
                  key="connected"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4 py-4 text-center w-full"
                >
                  <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="h-9 w-9" />
                  </div>
                  <div>
                    <h5 className="font-bold text-zinc-100 text-base">WhatsApp conectado!</h5>
                    <p className="text-xs text-zinc-500 mt-1">
                      Suas mensagens automáticas estão ativas. Os clientes receberão notificações pelo seu número.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-zinc-800 bg-obsidian-900/30 w-full text-xs text-zinc-400 text-left flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-zinc-300 font-bold text-[10px] uppercase tracking-wider mb-1">
                      <Wifi className="h-3 w-3 text-emerald-500" /> Instância Ativa
                    </div>
                    <p>Nome: <span className="text-zinc-200 font-mono">{instanceName}</span></p>
                  </div>
                  <Button
                    variant="secondary"
                    className="w-full text-xs text-red-400 border-zinc-800 hover:bg-red-500/10 gap-2"
                    onClick={handleDisconnect}
                  >
                    <XCircle className="h-4 w-4" />
                    Desconectar WhatsApp
                  </Button>
                </motion.div>
              )}

            </AnimatePresence>
          </CardContent>
        </Card>

        {/* ─── CARD: NOTIFICAÇÕES PUSH ─── */}
        <div className="flex flex-col gap-4">
          <Card>
            <div className="px-6 py-4 border-b border-zinc-800/40 bg-zinc-950/20">
              <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <Bell className="h-4 w-4 text-gold-500" />
                Notificações Push (OneSignal)
              </h4>
              <p className="text-xs text-zinc-500 mt-0.5">Receba alertas no navegador para novos agendamentos</p>
            </div>
            <CardContent className="p-6 flex flex-col gap-4">
              {/* Toggle: Novo agendamento */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-obsidian-900">
                <div>
                  <p className="text-sm font-bold text-zinc-200">Novo Agendamento</p>
                  <p className="text-[10px] text-zinc-500 leading-normal max-w-xs mt-0.5">
                    Alerta instantâneo quando um cliente reservar um horário.
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={notifyNewBooking}
                  onClick={() => setNotifyNewBooking(!notifyNewBooking)}
                  className={`h-6 w-11 rounded-full p-0.5 transition-colors cursor-pointer flex-shrink-0 ${notifyNewBooking ? "bg-gold-500" : "bg-zinc-800"}`}
                >
                  <div className={`h-5 w-5 rounded-full bg-obsidian-950 transition-transform ${notifyNewBooking ? "translate-x-5" : ""}`} />
                </button>
              </div>

              {/* Toggle: Lembretes */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-obsidian-900">
                <div>
                  <p className="text-sm font-bold text-zinc-200">Lembretes do Dia</p>
                  <p className="text-[10px] text-zinc-500 leading-normal max-w-xs mt-0.5">
                    Resumo diário dos agendamentos de amanhã às 20h.
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={notifyReminders}
                  onClick={() => setNotifyReminders(!notifyReminders)}
                  className={`h-6 w-11 rounded-full p-0.5 transition-colors cursor-pointer flex-shrink-0 ${notifyReminders ? "bg-gold-500" : "bg-zinc-800"}`}
                >
                  <div className={`h-5 w-5 rounded-full bg-obsidian-950 transition-transform ${notifyReminders ? "translate-x-5" : ""}`} />
                </button>
              </div>

              <Button onClick={requestPushPermission} variant="secondary" className="w-full gap-2 border-zinc-800 hover:border-gold-500/30 text-xs">
                <Bell className="h-4 w-4 text-gold-500" />
                Ativar Notificações no Navegador
              </Button>
            </CardContent>
          </Card>

          {/* Aviso da Evolution API */}
          <div className="flex gap-3 p-4 rounded-xl border border-zinc-800/80 bg-obsidian-900/20 text-xs text-zinc-400 leading-relaxed">
            <Info className="h-4 w-4 text-gold-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-zinc-300 font-bold mb-1">Sobre a Conexão WhatsApp</p>
              O QR Code usa o protocolo <span className="text-gold-500 font-semibold">Evolution API (Baileys)</span> — funciona como WhatsApp Web. Mantenha a instância ativa para o envio de lembretes. Para maior estabilidade em produção, considere migrar para a API oficial do Meta.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
