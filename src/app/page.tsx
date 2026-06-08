"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Scissors,
  Check,
  Calendar,
  ArrowRight,
  MessageSquare,
  Award,
  Star,
  Sparkles,
  Smartphone,
  Users,
  Clock,
  HelpCircle,
  TrendingUp,
  Zap,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import BookingSimulator from "@/components/BookingSimulator";
import WhatsAppChatDemo from "@/components/WhatsAppChatDemo";

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }

    const handleScroll = () => {
      requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 60);
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    if (window.scrollY > 60) {
      setIsScrolled(true);
    }
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const benefits = [
    { icon: Calendar, title: "Sem conflitos de horário", desc: "Seus clientes veem sua agenda em tempo real e marcam direto no celular, sem precisar trocar mensagens no WhatsApp." },
    { icon: MessageSquare, title: "Redução de faltas em até 80%", desc: "Disparo automático de lembretes no WhatsApp 24h e 2h antes. Redução drástica de no-show." },
    { icon: Award, title: "Cartão Fidelidade Digital", desc: "Configure metas (ex: 10 cortes = 1 grátis) e incentive seus clientes a voltarem com mais frequência de forma automática." },
  ];

  const steps = [
    { title: "Cadastre sua barbearia", desc: "Preencha seus dados básicos em 2 minutos. Teste grátis sem cartão de crédito." },
    { title: "Configure horários e serviços", desc: "Adicione os preços, a duração de cada serviço e os barbeiros da sua equipe." },
    { title: "Divulgue o seu link único", desc: "Adicione o link da sua agenda na bio do Instagram ou envie por mensagem automática." },
    { title: "Veja sua agenda rodar sozinha", desc: "Monitore os agendamentos, o faturamento e a fidelidade em um painel completo." },
  ];

  const differentiators = [
    "Interface mobile pensada para o cliente (agenda em 30 segundos)",
    "WhatsApp nativo: lembretes automáticos com botões de confirmação",
    "Gestão de comissão e controle de múltiplos barbeiros",
    "Relatório de faturamento e métricas de ocupação em tempo real",
    "Preço fixo acessível: sem cobrança de taxas extras por agendamento",
  ];

  return (
    <div className="min-h-screen w-full bg-obsidian-950 text-zinc-300 antialiased selection:bg-gold-500/25 selection:text-gold-300">
      {/* Header */}
      <header
        className={`w-full border-b border-gold-500/10 bg-obsidian-950/85 backdrop-blur-md sticky top-0 z-20 transition-transform duration-300 ease-in-out ${isScrolled ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}
      >
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center">
              <img src="/assets/logo.png" alt="BarberZap Logo" className="h-9 md:h-11 object-contain" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login?tab=signup">
              <Button variant="ghost" className="text-xs px-3 py-1.5 hover:bg-zinc-900">Criar Conta</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-8 md:py-12 relative overflow-hidden">
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-gold-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -z-10"></div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col text-left">
            <div className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-xs text-gold-500 font-semibold mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Evite furos na agenda e no-shows
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-zinc-100">
              Sua barbearia no <span className="text-gold-500">piloto automático</span>
            </h1>

            <p className="text-sm md:text-base text-zinc-100 mt-5 leading-relaxed max-w-lg">
              Automatize seus agendamentos, envie lembretes automáticos via WhatsApp e fidelize clientes com um sistema simples que roda direto no celular.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <a href="#planos">
                <Button size="lg" className="font-bold gap-2 text-sm h-12 shadow-lg shadow-gold-500/10 bg-gradient-to-r from-gold-500 to-gold-600 text-obsidian-950 hover:from-gold-400 hover:to-gold-500">
                  Quero o Aplicativo <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <Link href="/login?tab=signup">
                <Button size="lg" variant="secondary" className="text-sm h-12 border-zinc-800 hover:bg-zinc-900">
                  Começar Teste Grátis
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-4 mt-6 text-xs text-zinc-500 font-medium">
              <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-gold-500" /> Sem cartão</span>
              <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-gold-500" /> Teste de 7 dias</span>
            </div>
          </div>

          <div className="flex justify-center items-center">
            <div className="w-full flex flex-col items-center">
              <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest mb-3 bg-zinc-900/60 px-3 py-1 rounded-full border border-zinc-800/80">
                👉 Toque para experimentar
              </span>
              <BookingSimulator />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-zinc-900/60 bg-obsidian-950/40 backdrop-blur-md py-8">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl md:text-3xl font-black text-gold-500">-80%</div>
            <div className="text-xs text-zinc-500 uppercase font-semibold mt-1">No-shows (Faltas)</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black text-gold-500">2 Minutos</div>
            <div className="text-xs text-zinc-500 uppercase font-semibold mt-1">Tempo de Configuração</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black text-gold-500">+100k</div>
            <div className="text-xs text-zinc-500 uppercase font-semibold mt-1">Agendamentos Feitos</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black text-gold-500">98%</div>
            <div className="text-xs text-zinc-500 uppercase font-semibold mt-1">Satisfação dos Parceiros</div>
          </div>
        </div>
      </section>

      {/* Benefits / Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Tudo o que sua barbearia precisa para <span className="text-gold-500">crescer</span>
          </h2>
          <p className="text-sm text-zinc-400 mt-3 leading-relaxed">
            Elimine processos manuais, organize seu financeiro e pare de perder clientes por falta de resposta no WhatsApp.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((item, i) => {
            const Icon = item.icon;
            return (
              <Card key={i} className="border-zinc-800/80 bg-obsidian-900/30 hover:border-gold-500/20 transition-all duration-300">
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="h-10 w-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-500 shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-200 text-base">{item.title}</h3>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* WhatsApp Flow Section */}
      <section className="bg-obsidian-900/20 border-y border-zinc-900/60 py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-500 font-extrabold uppercase mb-4">
              <Zap className="h-3 w-3" /> Comunicação sem esforço
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Como funciona o <span className="text-gold-500">WhatsApp Integrado</span>
            </h2>
            <p className="text-sm text-zinc-400 mt-3 leading-relaxed">
              O sistema se comunica automaticamente com o seu cliente. Menos burocracia, mais eficiência e zero esquecimento.
            </p>
          </div>

          <div className="w-full">
            <WhatsAppChatDemo />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold">Como funciona em <span className="text-gold-500">4 passos</span></h2>
            <p className="text-sm text-zinc-400 mt-2">Do cadastro ao seu primeiro agendamento em menos de 5 minutos</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <Card key={i} className="bg-obsidian-900/20 border-zinc-800/80 text-center hover:border-gold-500/20 transition-colors">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-full bg-gold-500/10 text-gold-500 flex items-center justify-center font-bold text-base mx-auto mb-4 border border-gold-500/20">{i + 1}</div>
                  <h3 className="font-bold text-zinc-200 text-sm">{step.title}</h3>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Differentiators + Testimonial */}
      <section className="max-w-7xl mx-auto px-6 py-12 pb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col text-left">
            <h2 className="text-2xl md:text-3xl font-bold">Por que escolher o <span className="text-gold-500">BarberZap</span>?</h2>
            <ul className="mt-6 space-y-3">
              {differentiators.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-zinc-400">
                  <Check className="h-5 w-5 text-gold-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 self-start">
              <a href="#planos">
                <Button size="lg" className="font-bold text-sm h-12">Quero o Aplicativo →</Button>
              </a>
            </div>
          </div>
          <div className="bg-obsidian-900/40 border border-zinc-800/85 rounded-2xl p-6 text-left">
            <div className="flex items-center gap-2 text-gold-500 mb-4">
              <Star className="h-5 w-5 fill-current" />
              <span className="font-bold text-xs uppercase tracking-wider">Depoimento real</span>
            </div>
            <blockquote className="text-zinc-300 italic text-sm leading-relaxed">
              "Antes eu perdia cerca de 4 a 5 cortes por semana com clientes que esqueciam e não apareciam. Com as notificações automáticas do BarberZap, a taxa de faltas despencou em mais de 90%. Minha agenda nunca mais teve furos inesperados."
            </blockquote>
            <div className="mt-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-500 font-bold text-xs">RM</div>
              <div>
                <div className="font-bold text-zinc-200 text-xs">Ricardo M.</div>
                <div className="text-[10px] text-zinc-500">Barbearia Corte Nobre</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="bg-obsidian-900/30 border-y border-zinc-900/60 py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-[10px] text-gold-500 font-extrabold uppercase mb-4">
              ✨ Preço Justo e Sem Surpresas
            </div>
            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-zinc-100">
              Escolha o plano ideal para sua <span className="text-gold-500">barbearia</span>
            </h2>
            <p className="text-sm text-zinc-400 mt-3 max-w-lg mx-auto leading-relaxed">
              Tudo o que sua barbearia precisa para crescer e fidelizar clientes, sem taxas ocultas ou limites de agendamento.
            </p>
          </div>

          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center bg-obsidian-900/80 border border-zinc-800 rounded-full p-1 text-xs font-bold">
              <button className="px-5 py-2 rounded-full bg-zinc-800/60 text-zinc-400 cursor-not-allowed">Mensal</button>
              <button className="px-5 py-2 rounded-full bg-gradient-to-r from-gold-500 to-gold-600 text-obsidian-950 shadow-lg shadow-gold-500/20 cursor-pointer flex items-center gap-1.5">
                Semanal <span className="text-[9px] bg-obsidian-950/20 px-1.5 py-0.5 rounded-full font-black">-70%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* PLANO SEMANAL */}
            <Card className="border-gold-500/80 bg-obsidian-900/90 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-gold-500/10 ring-1 ring-gold-500/25 md:scale-105 md:-translate-y-2">
              <div className="absolute top-0 right-0 bg-gold-500 text-obsidian-950 text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider">🔥 Mais Popular</div>
              <CardContent className="p-7 md:p-8 text-center flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-zinc-400 font-black text-xs tracking-widest uppercase mb-3">PLANO SEMANAL</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-xs font-bold text-zinc-400 align-super">R$</span>
                    <span className="text-6xl font-black text-gold-500 tracking-tight">5</span>
                    <span className="text-2xl font-black text-gold-500">,99</span>
                    <span className="text-zinc-500 text-sm">/semana</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-3 leading-relaxed">Perfeito para testar ou para período de alta demanda. Sem fidelidade, cancele quando quiser.</p>
                  <div className="h-px bg-zinc-800/60 my-5"></div>
                  <ul className="space-y-2.5 text-left">
                    {["Agendamentos ilimitados", "Lembretes automáticos via WhatsApp (24h e 2h antes)", "Cartão Fidelidade digital", "CRM completo de clientes", "Página de agendamento personalizada", "Suporte via WhatsApp"].map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-zinc-200">
                        <Check className="h-4 w-4 text-gold-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <a href="https://pay.cakto.com.br/qbf9j65_918041" target="_blank" rel="noopener noreferrer" className="w-full mt-6 font-black text-xs h-12 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-obsidian-950 shadow-lg shadow-gold-500/30 cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl transition-all hover:scale-[1.02]">
                  Assinar Plano Semanal <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </CardContent>
            </Card>

            {/* PLANO MENSAL */}
            <Card className="border-zinc-700/60 bg-obsidian-900/70 relative overflow-hidden transition-all duration-300 hover:border-gold-500/40 hover:shadow-xl">
              <div className="absolute top-0 right-0 bg-zinc-800 text-zinc-300 text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider">Mensal</div>
              <CardContent className="p-7 md:p-8 text-center flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-zinc-400 font-black text-xs tracking-widest uppercase mb-3">PLANO MENSAL</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-xs font-bold text-zinc-400 align-super">R$</span>
                    <span className="text-5xl font-black text-zinc-100 tracking-tight">19</span>
                    <span className="text-2xl font-black text-zinc-100">,90</span>
                    <span className="text-zinc-500 text-sm">/mês</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-800/60 border border-zinc-700/50 mt-2">
                    <span className="text-[10px] text-zinc-400 font-black uppercase tracking-wider">Cobrança mensal</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-3 leading-relaxed">A escolha ideal para quem quer todos os recursos premium com economia em relação ao plano semanal.</p>
                  <div className="h-px bg-zinc-800/60 my-5"></div>
                  <ul className="space-y-2.5 text-left">
                    {["Tudo do Plano Semanal +", "Relatórios financeiros avançados", "Métricas de ocupação em tempo real", "Suporte prioritário 1-1 via WhatsApp", "Gestão de comissões por barbeiro", "Acesso antecipado a novos recursos"].map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-zinc-200">
                        <Check className="h-4 w-4 text-gold-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <a href="https://pay.cakto.com.br/qbf9j65_918041" target="_blank" rel="noopener noreferrer" className="w-full mt-6 font-black text-xs h-12 bg-zinc-800 hover:bg-gold-500 text-zinc-100 hover:text-obsidian-950 border border-zinc-700 hover:border-gold-500 cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl transition-all hover:scale-[1.02]">
                  Assinar Plano Mensal <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center gap-6 mt-12 text-[10px] text-zinc-500 font-semibold flex-wrap">
            <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5 text-gold-500" /> Sem fidelidade, cancele quando quiser</span>
            <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-gold-500" /> Ativação imediata</span>
            <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-gold-500" /> Pagamento seguro via Cakto</span>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-obsidian-950 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Perguntas <span className="text-gold-500">Frequentes</span></h2>
            <p className="text-sm text-zinc-400 mt-3">Tudo o que você precisa saber sobre o funcionamento do BarberZap</p>
          </div>

          <div className="space-y-4">
            <FAQItem question="O cliente precisa baixar algum aplicativo?" answer="Não. O seu cliente acessa a sua página de agendamentos online diretamente pelo navegador do celular ou computador, bastando clicar no link enviado ou disponível na sua bio do Instagram. É rápido, intuitivo e sem senhas." />
            <FAQItem question="Como funcionam os envios de mensagens por WhatsApp?" answer="O envio de confirmações e lembretes automáticos é 100% nativo do sistema BarberZap. Nós fornecemos os servidores e a infraestrutura para disparar as mensagens diretamente para o número do cliente, sem custos adicionais nos planos Pro e Premium." />
            <FAQItem question="Posso cadastrar mais profissionais na mesma barbearia?" answer="Sim! O plano Corporativo (Premium) é perfeito para equipes. Você pode cadastrar múltiplos profissionais, configurar horários de trabalho e comissões individuais, além de gerenciar a agenda compartilhada no mesmo dashboard." />
            <FAQItem question="Existe taxa de fidelidade ou cancelamento?" answer="Nenhuma. Você pode cancelar sua assinatura a qualquer momento, sem taxas escondidas, sem fidelidade contratual e sem burocracia. Oferecemos dois planos flexíveis: o Semanal de R$ 5,99 (ideal para testar ou para alta demanda) e o Mensal de R$ 19,90 (com todos os recursos premium incluídos)." />
            <FAQItem question="É possível gerenciar cartão fidelidade no sistema?" answer="Sim! O BarberZap possui um sistema de fidelidade digital completo. Cada agendamento finalizado acumula selos automaticamente no número de WhatsApp do cliente. Quando ele alcança a meta configurada, o sistema notifica que ele ganhou um corte grátis!" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900/60 py-8 text-center text-xs text-zinc-500 bg-obsidian-950">
        <div className="max-w-7xl mx-auto px-6">
          <p>© 2026 BarberZap — Sistema de agendamento online para barbearias</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/login" className="hover:text-zinc-300">Login</Link>
            <Link href="/barberzap" target="_blank" className="hover:text-zinc-300">Demo Cliente</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// FAQ Accordion Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-zinc-900 bg-obsidian-900/25 rounded-xl overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-obsidian-900/40 transition-colors cursor-pointer"
      >
        <span className="font-bold text-sm text-zinc-200">{question}</span>
        <span className={`text-gold-500 font-bold transition-transform duration-300 text-lg ${isOpen ? "rotate-45" : ""}`}>+</span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-6 pb-5 pt-1 text-xs text-zinc-400 leading-relaxed border-t border-zinc-900/30">{answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}