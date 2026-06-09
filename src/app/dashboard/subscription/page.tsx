"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Check,
  Shield,
  Sparkles,
  Zap,
  HelpCircle,
  Clock,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  SearchCheck,
  ArrowRight,
} from "lucide-react";

export default function SubscriptionPage() {
  const { user, refreshSession } = useAuth();
  const { success, error, info } = useToast();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user?.user_metadata) {
      setIsSubscribed(!!user.user_metadata.is_subscribed);
    }
  }, [user]);

  // Polling automático: se voltou da Cakto mas ainda não está subscribed
  useEffect(() => {
    // Verificar se veio de um retorno do checkout (presença de return_url params)
    const cameFromCheckout = document.referrer.includes("pay.cakto.com.br") ||
      window.location.search.includes("checkout=return");

    if (cameFromCheckout && !isSubscribed && user?.email) {
      info("Verificando Pagamento", "Identificamos que você voltou do checkout. Verificando se o pagamento foi confirmado...");

      // Polling a cada 5 segundos por até 2 minutos
      let attempts = 0;
      const maxAttempts = 24; // 2 minutos

      pollingRef.current = setInterval(async () => {
        attempts++;
        try {
          const res = await fetch(`/api/subscription/status?email=${encodeURIComponent(user.email!)}`);
          const data = await res.json();

          if (data.is_subscribed) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            pollingRef.current = null;
            setIsSubscribed(true);
            await refreshSession();
            success("Pagamento Confirmado!", "Sua assinatura Pro foi ativada com sucesso. Aproveite todos os recursos!");
          }
        } catch (e) {
          console.error("Polling error:", e);
        }

        if (attempts >= maxAttempts && pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          info("Ainda processando?", "O pagamento pode levar alguns minutos para ser confirmado. Clique em 'Já paguei' para verificar novamente.");
        }
      }, 5000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []); // Roda apenas na montagem do componente



  const handleCheckPayment = async () => {
    if (!user?.email) {
      error("Erro", "Email do usuário não encontrado.");
      return;
    }

    setCheckingPayment(true);
    try {
      const res = await fetch(`/api/subscription/status?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.is_subscribed) {
        setIsSubscribed(true);
        // Força refresh da sessão para atualizar os metadados no frontend
        await refreshSession();
        success("Assinatura Ativa!", "Seu plano Pro está ativo. Aproveite todos os recursos!");
      } else {
        info(
          "Pagamento não encontrado",
          "Ainda não identificamos sua assinatura. O pagamento pode levar alguns minutos para ser processado. Se já pagou, aguarde e tente novamente em instantes."
        );
      }
    } catch (err: any) {
      console.error(err);
      error("Erro ao verificar", err.message || "Não foi possível verificar o status do pagamento.");
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleToggleSimulation = async () => {
    setLoading(true);
    const newStatus = !isSubscribed;
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          is_subscribed: newStatus,
        },
      });

      if (updateError) throw updateError;

      setIsSubscribed(newStatus);
      success(
        newStatus ? "Simulação Ativada!" : "Simulação Desativada!",
        newStatus
          ? "Seu perfil foi marcado como assinante Pro com sucesso."
          : "Seu perfil retornou ao status de assinatura inativa."
      );
    } catch (err: any) {
      console.error(err);
      error("Erro na simulação", err.message || "Não foi possível alterar a simulação.");
    } finally {
      setLoading(false);
    }
  };

  const planBenefits = [
    "Agendamentos ilimitados na sua página de captura",
    "Notificações e lembretes automáticos via WhatsApp (Evolution API)",
    "Cartão Fidelidade digital interativo para reter clientes",
    "CRM de clientes completo com histórico de cortes",
    "Suporte prioritário e assessoria via WhatsApp",
    "Sem taxas por transações ou comissão de agendamentos",
  ];

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-10">

      {/* Page Title */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-500">
          <CreditCard className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Assinatura & Faturamento</h1>
          <p className="text-xs text-zinc-500">
            Gerencie seu plano de acesso ao painel do BarberZap.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-6">

        {/* Left Side: Plan Status details */}
        <div className="md:col-span-3 flex flex-col gap-6">
          <Card className="border-zinc-800/80 bg-obsidian-900/40 relative overflow-hidden">
            <CardContent className="p-6 flex flex-col gap-6">

              {/* Status Badge */}
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-zinc-400">Status do Plano</span>
                {isSubscribed ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-extrabold uppercase">
                    <Sparkles className="h-3.5 w-3.5 fill-current animate-pulse" />
                    Assinatura Ativa (Pro)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-extrabold uppercase">
                    <Clock className="h-3.5 w-3.5" />
                    Assinatura Inativa
                  </span>
                )}
              </div>

              {/* Status Information Details */}
              <div className="flex flex-col gap-2">
                <h3 className="text-base font-bold text-zinc-100">
                  {isSubscribed
                    ? "Sua barbearia está no modo Premium!"
                    : "Assinatura Requerida"}
                </h3>
                <p className="text-xs text-zinc-400 leading-normal">
                  {isSubscribed
                    ? "Parabéns! Sua conta possui acesso completo e irrestrito a todas as funcionalidades do BarberZap, incluindo lembretes via WhatsApp e painel de estatísticas."
                    : "Para ativar o seu link de autoagendamento online e garantir o envio de notificações automáticas via WhatsApp, assine o plano Pro."}
                </p>
              </div>

              {/* Price Callout */}
              <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Valor do Plano</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-gold-500">R$ 19,90</span>
                    <span className="text-zinc-500 text-xs">/mês</span>
                  </div>
                </div>

                <span className="text-[10px] text-zinc-500 font-medium">Faturamento recorrente via Cakto</span>
              </div>

              {/* Checkout CTA + Payment Verification */}
              {!isSubscribed && (
                <div className="flex flex-col gap-3">
                  {/* Botão de Assinar com return_url */}
                  <a
                    href={`https://pay.cakto.com.br/8odd28u_908528?return_url=${encodeURIComponent(`${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/subscription?checkout=return`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button className="w-full bg-gold-500 hover:bg-gold-600 text-obsidian-950 font-black h-11 shadow-lg shadow-gold-500/10 cursor-pointer">
                      Assinar Plano Pro (Cakto)
                      <ExternalLink className="h-4 w-4 ml-1.5" />
                    </Button>
                  </a>

                  {/* Botão para verificar pagamento já realizado */}
                  <Button
                    variant="secondary"
                    onClick={handleCheckPayment}
                    disabled={checkingPayment}
                    className="w-full h-10 text-xs border-gold-500/30 text-gold-500 hover:bg-gold-500/5 cursor-pointer"
                  >
                    {checkingPayment ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <SearchCheck className="h-4 w-4 mr-1.5" />
                        Já paguei! Verificar Assinatura
                      </>
                    )}
                  </Button>

                  <p className="text-[10px] text-zinc-500 text-center">
                    Ao assinar, você será redirecionado para a página segura de pagamentos da Cakto. Volte aqui e clique em "Já paguei" para ativar automaticamente.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Developer Testing / Simulation Box */}
          <Card className="border-gold-500/20 bg-obsidian-900/20 relative overflow-hidden border-dashed">
            <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase text-gold-500 tracking-wider">
                  ⚠️ Área do Desenvolvedor / Homologação
                </span>
                <h4 className="text-xs font-bold text-zinc-200">Simular Status da Assinatura</h4>
                <p className="text-[10px] text-zinc-500 leading-normal max-w-sm">
                  Ative ou desative o status de assinatura para testar como o painel e os recursos reagem visualmente ao plano ativo.
                </p>
              </div>

              <Button
                variant="gold-outline"
                className="w-full cursor-pointer"
                onClick={handleToggleSimulation}
                disabled={loading}
              >
                {isSubscribed ? "Simular Pendente" : "Simular Ativa (Pro)"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Benefits details */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <Card className="border-zinc-800/80 bg-obsidian-900/40">
            <CardContent className="p-6 flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-500">
                  <Zap className="h-4 w-4 fill-current" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500">Recursos Inclusos</h3>
              </div>

              <ul className="flex flex-col gap-3.5">
                {planBenefits.map((benefit, i) => (
                  <li key={i} className="flex gap-2.5 items-start text-xs text-zinc-300">
                    <Check className="h-4 w-4 text-gold-500 shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="h-px bg-zinc-850 my-2"></div>

              <div className="flex items-center gap-2 text-[10px] text-zinc-550 text-zinc-500 font-semibold leading-relaxed">
                <Shield className="h-4 w-4 text-gold-500 shrink-0" />
                <span>Processamento criptografado via Cakto. Cancele quando quiser com apenas 1 clique.</span>
              </div>
            </CardContent>
          </Card>

          {/* Simple FAQ details */}
          <div className="p-4 rounded-2xl bg-zinc-950/20 border border-zinc-850 flex flex-col gap-3.5">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <HelpCircle className="h-4 w-4 text-gold-500" />
              <span className="text-xs font-bold">Dúvidas frequentes</span>
            </div>

            <div className="flex flex-col gap-2.5">
              <div>
                <h4 className="text-[10px] font-bold text-zinc-200">Como a assinatura é confirmada?</h4>
                <p className="text-[9px] text-zinc-500 leading-normal mt-0.5">
                  Ao assinar na Cakto com o mesmo e-mail de login do BarberZap, nosso sistema recebe a confirmação e ativa sua licença na mesma hora. Volte ao painel e clique em "Já paguei" para liberar automaticamente.
                </p>
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-zinc-200">E se o pagamento não for reconhecido?</h4>
                <p className="text-[9px] text-zinc-500 leading-normal mt-0.5">
                  O webhook de confirmação pode levar até 2 minutos. Se passar desse tempo, entre em contato conosco pelo WhatsApp que ativamos manualmente.
                </p>
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-zinc-200">Consigo alterar meu link depois?</h4>
                <p className="text-[9px] text-zinc-500 leading-normal mt-0.5">
                  Sim! Você pode trocar seu nome de usuário (@) nas configurações a qualquer momento, sem alterar o valor da sua mensalidade.
                </p>
              </div>
            </div>
          </div>

          {/* Suporte WhatsApp */}
          <div className="p-4 rounded-2xl bg-emerald-950/10 border border-emerald-500/20 flex flex-col gap-3">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <MessageCircle className="h-4.5 w-4.5 fill-current" />
              <span className="text-xs font-extrabold uppercase tracking-wider">Suporte Oficial</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Teve alguma dúvida ou precisa de ajuda para ativar sua barbearia? Fale com a gente!
            </p>
            <a
              href="https://wa.me/556699762785"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-colors cursor-pointer"
            >
              <MessageCircle className="h-4 w-4" />
              Chamar suporte (+55 66 9976-2785)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}