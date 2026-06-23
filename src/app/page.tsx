"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Calendar,
  Check,
  Headphones,
  Link as LinkIcon,
  Lock,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import UtmifyScript from "@/components/UtmifyScript";

const weeklyCheckoutUrl = "https://pay.cakto.com.br/qbf9j65_918041";
const monthlyCheckoutUrl = "https://pay.cakto.com.br/8odd28u_908528";

type LandingEventName = "landing_view" | "section_view" | "cta_click" | "checkout_click" | "pricing_view";

function getLandingSessionId() {
  const storageKey = "barberzap_landing_session_id";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;

  const generated = crypto.randomUUID();
  window.localStorage.setItem(storageKey, generated);
  return generated;
}

function getUtmParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get("utm_source") || undefined,
    medium: params.get("utm_medium") || undefined,
    campaign: params.get("utm_campaign") || undefined,
    content: params.get("utm_content") || undefined,
    term: params.get("utm_term") || undefined,
  };
}

function trackLandingEvent(eventName: LandingEventName, metadata: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  const payload = {
    sessionId: getLandingSessionId(),
    eventName,
    path: window.location.pathname,
    referrer: document.referrer || undefined,
    utm: getUtmParams(),
    metadata,
  };

  const body = JSON.stringify(payload);
  const blob = new Blob([body], { type: "application/json" });

  if (navigator.sendBeacon?.("/api/analytics", blob)) return;

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}

const features = [
  { icon: Calendar, label: "Agendamento\nOnline" },
  { icon: MessageCircle, label: "Lembretes\nno WhatsApp" },
  { icon: Users, label: "Programa de\nFidelidade" },
  { icon: BarChart3, label: "Relatórios e\nIndicadores" },
];

const howItWorks = [
  { icon: LinkIcon, title: "Cliente acessa seu link", desc: "Você envia o link da sua barbearia para o cliente." },
  { icon: Calendar, title: "Escolhe serviço e horário", desc: "O cliente escolhe o serviço e o melhor horário." },
  { icon: Check, title: "Agendamento confirmado", desc: "O cliente recebe a confirmação no WhatsApp na hora." },
  { icon: Bell, title: "Lembrete automático", desc: "Enviamos lembretes com botão de confirmação antes do horário." },
  { icon: Star, title: "Cliente volta sempre", desc: "Com o programa de fidelidade, ele acumula pontos e volta mais." },
];

const stats = [
  { icon: Users, value: "+100k", label: "Agendamentos realizados" },
  { icon: Star, value: "98%", label: "Taxa de satisfação" },
  { icon: MessageSquare, value: "340+", label: "Avaliações positivas" },
  { icon: Trophy, value: "+2.500", label: "Barbearias atendidas" },
];

const testimonials = [
  {
    name: "Felipe Santos",
    initials: "FS",
    shop: "Barbearia FS - São Paulo/SP",
    text: "O BarberZap mudou minha barbearia. Agenda sempre cheia e muito menos falta. Os lembretes no WhatsApp são sensacionais!",
  },
  {
    name: "Ricardo M.",
    initials: "RM",
    shop: "Barbearia Corte Nobre",
    text: "Antes eu perdia 4 a 5 cortes por semana com clientes que esqueciam. Os lembretes automáticos praticamente acabaram com os furos.",
  },
  {
    name: "Lucas R.",
    initials: "LR",
    shop: "The Barbers Club",
    text: "O painel deixou claro quais serviços vendem mais e onde eu estava perdendo horário. A rotina ficou mais profissional.",
  },
];

const benefits = [
  { icon: ShieldCheck, title: "Sem instalação", desc: "Tudo 100% online. Comece em minutos." },
  { icon: Smartphone, title: "Funciona no celular", desc: "Você e seus clientes podem usar de onde estiver." },
  { icon: Lock, title: "Pagamento seguro", desc: "Seus dados e pagamentos sempre protegidos." },
  { icon: RefreshCw, title: "Cancele quando quiser", desc: "Sem fidelidade. Você tem controle." },
  { icon: Headphones, title: "Suporte humano", desc: "Atendimento rápido pelo WhatsApp." },
];

const faqs = [
  ["O cliente precisa baixar aplicativo?", "Não. Ele agenda pelo navegador do celular, usando o link da sua barbearia. É rápido, sem senha e sem instalação."],
  ["Como funcionam os lembretes no WhatsApp?", "O BarberZap envia confirmação e lembretes automáticos para o número informado pelo cliente, reduzindo esquecimentos e atrasos."],
  ["Serve para barbearia com vários profissionais?", "Sim. Você pode configurar equipe, horários, serviços e comissões para acompanhar tudo no mesmo painel."],
  ["Tem fidelidade ou taxa de cancelamento?", "Não. Os planos são flexíveis, sem contrato longo e sem multa de cancelamento."],
];

export default function LandingPage() {
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const isScrollingDown = currentScrollY > lastScrollY;

        setIsHeaderHidden(isScrollingDown && currentScrollY > 90);
        lastScrollY = Math.max(currentScrollY, 0);
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  React.useEffect(() => {
    trackLandingEvent("landing_view");

    const trackedSections = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const section = entry.target.getAttribute("data-track-section");
          if (!entry.isIntersecting || !section || trackedSections.has(section)) return;

          trackedSections.add(section);
          trackLandingEvent(section === "planos" ? "pricing_view" : "section_view", { section });
        });
      },
      { threshold: 0.45 }
    );

    document.querySelectorAll("[data-track-section]").forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-obsidian-950 text-zinc-100 antialiased selection:bg-gold-500/25 selection:text-gold-200">
      <header className={`fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-black/25 backdrop-blur-md transition-transform duration-300 ease-out ${isHeaderHidden ? "-translate-y-full" : "translate-y-0"}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 md:px-8">
          <Link href="/" prefetch={false} className="flex items-center gap-3">
            <Image src="/assets/logo.png" alt="BarberZap" width={150} height={48} priority className="h-9 w-auto object-contain" />
          </Link>

          <nav className="hidden items-center gap-7 text-xs font-bold text-zinc-100 xl:flex">
            <a href="#recursos" onClick={() => trackLandingEvent("cta_click", { source: "nav", target: "recursos" })} className="hover:text-gold-300">Recursos</a>
            <a href="#planos" onClick={() => trackLandingEvent("cta_click", { source: "nav", target: "planos" })} className="hover:text-gold-300">Planos</a>
            <a href="#depoimentos" onClick={() => trackLandingEvent("cta_click", { source: "nav", target: "depoimentos" })} className="hover:text-gold-300">Depoimentos</a>
            <a href="#faq" onClick={() => trackLandingEvent("cta_click", { source: "nav", target: "faq" })} className="hover:text-gold-300">FAQ</a>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link href="/login" prefetch={false} className="rounded-lg px-2.5 py-2 text-xs font-bold text-zinc-300 transition-colors hover:bg-white/5 hover:text-white sm:px-3">
              Entrar
            </Link>
            <Link href="/login?tab=signup" prefetch={false} onClick={() => trackLandingEvent("cta_click", { source: "header", target: "signup" })}>
              <Button size="sm" variant="gold-outline" className="h-9 rounded-lg border-white/20 px-3 text-xs font-black text-white hover:border-gold-500 hover:bg-gold-500/10 sm:px-4">
                Criar conta
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <Image src="/assets/barbershop-hero-bg.png" alt="" fill priority className="object-cover opacity-45" sizes="100vw" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_25%,rgba(245,158,11,0.18),transparent_30%),linear-gradient(90deg,rgba(0,0,0,0.97)_0%,rgba(0,0,0,0.82)_38%,rgba(0,0,0,0.62)_100%)]" />

          <div className="relative mx-auto grid min-h-[620px] max-w-7xl gap-8 px-5 pb-14 pt-28 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="max-w-[560px]">
              <div className="mb-4 inline-flex items-center rounded-full border border-gold-500/60 bg-black/35 px-4 py-1.5 text-[10px] font-black uppercase tracking-wide text-gold-200">
                Mais tempo para cortar. Menos tempo organizando.
              </div>

              <h1 className="text-4xl font-black leading-[1.06] tracking-tight text-white md:text-5xl lg:text-[3.4rem]">
                Sua barbearia no <span className="text-gold-500">piloto automático</span>
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-relaxed text-zinc-200 md:text-base">
                Agendamento online, lembretes automáticos no WhatsApp e programa de fidelidade para lotar sua agenda e fazer seus clientes voltarem.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {features.map((item, index) => (
                  <div key={item.label} className={`flex items-center gap-3 sm:block sm:text-center ${index > 0 ? "sm:border-l sm:border-white/20" : ""}`}>
                    <item.icon className="mx-auto h-5 w-5 shrink-0 text-gold-500" />
                    <div className="mt-2 whitespace-pre-line text-xs font-semibold leading-tight text-zinc-100">{item.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href={weeklyCheckoutUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackLandingEvent("checkout_click", { source: "hero", plan: "weekly" })}>
                  <Button size="lg" className="h-12 w-full rounded-lg bg-gold-500 px-7 text-sm font-black text-obsidian-950 shadow-xl shadow-gold-500/20 hover:bg-gold-400 sm:w-auto">
                    Testar agora por R$5,99
                  </Button>
                </a>
                <a href="#demo" onClick={() => trackLandingEvent("cta_click", { source: "hero", target: "demo" })}>
                  <Button size="lg" variant="gold-outline" className="h-12 w-full rounded-lg border-white/60 bg-black/20 px-7 text-sm font-black text-white hover:border-gold-400 hover:bg-gold-500/10 sm:w-auto">
                    Ver demonstração <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
              </div>

              <p className="mt-4 text-xs font-medium text-zinc-400">Teste por 7 dias. Sem fidelidade.</p>
            </div>

            <AdminHeroMockup />
          </div>
        </section>

        <section id="demo" data-track-section="demo" className="relative z-10 border-y border-zinc-900/80 bg-[#071014] text-zinc-100">
          <div className="mx-auto max-w-7xl px-5 py-7 md:px-8">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-7 shadow-2xl shadow-black/30 backdrop-blur-sm">
              <h2 className="text-center text-xl font-black text-white md:text-2xl">Como funciona</h2>
              <div className="mt-7 grid gap-5 md:grid-cols-5">
                {howItWorks.map((step, index) => (
                  <div key={step.title} className="relative text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold-500/25 bg-gold-500/10 text-gold-500">
                      <step.icon className="h-6 w-6" />
                    </div>
                    {index < howItWorks.length - 1 && <div className="absolute left-[calc(50%+52px)] top-6 hidden h-px w-[calc(100%-72px)] bg-zinc-700 md:block" />}
                    <h3 className="mt-5 text-xs font-black text-white">{index + 1}. {step.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-400">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="depoimentos" data-track-section="depoimentos" className="bg-[#071014] py-8">
            <div className="mx-auto grid max-w-7xl gap-5 px-5 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-center">
                  <stat.icon className="mx-auto h-5 w-5 text-gold-500" />
                  <div className="mt-2 text-2xl font-black text-white">{stat.value}</div>
                  <div className="mt-1 text-[11px] text-zinc-400">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="flex min-h-[150px] items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-gold-500/25 bg-gold-500/15 text-sm font-black text-gold-400 md:h-20 md:w-20">
                {testimonials[0].initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-gold-500">Depoimento real</div>
                <div className="text-sm font-black text-white">{testimonials[0].name}</div>
                <div className="text-xs text-zinc-500">{testimonials[0].shop}</div>
                <blockquote className="mt-3 text-sm font-medium leading-relaxed text-zinc-200">
                  &ldquo;{testimonials[0].text}&rdquo;
                </blockquote>
                <div className="mt-3 flex gap-1 text-gold-500">
                  {[...Array(5)].map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="planos" data-track-section="planos" className="bg-[#071014] pb-10 pt-8">
          <div className="mx-auto max-w-4xl px-5 md:px-8">
            <h2 className="mb-6 text-center text-2xl font-black text-white md:text-3xl">Escolha o plano ideal</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <PricingCard
                title="Semanal"
                price="5,99"
                period="/semana"
                desc="Ideal para testar"
                url={weeklyCheckoutUrl}
                cta="Testar agora"
                trackingPlan="weekly"
                features={["Agendamento Online", "Lembretes no WhatsApp", "Fidelidade Básico", "Suporte via WhatsApp"]}
              />
              <PricingCard
                highlighted
                title="Mensal"
                price="19,90"
                period="/mês"
                desc="Melhor custo-benefício"
                url={monthlyCheckoutUrl}
                cta="Assinar agora"
                trackingPlan="monthly"
                features={["Tudo do plano Semanal", "Relatórios e Indicadores", "Fidelidade Avançado", "Suporte Prioritário"]}
              />
            </div>
          </div>
        </section>

        <section id="recursos" data-track-section="recursos" className="border-y border-gold-500/10 bg-[#050b0d] py-7 text-zinc-100">
          <div className="mx-auto grid max-w-7xl gap-4 px-5 md:grid-cols-5 md:px-8">
            {benefits.map((item) => (
              <div key={item.title} className="flex min-h-24 items-center gap-4 rounded-xl border border-white/10 bg-[#0c1518] p-4 shadow-lg shadow-black/20">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold-500/20 bg-gold-500/10">
                  <item.icon className="h-6 w-6 text-gold-400" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">{item.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" data-track-section="faq" className="bg-obsidian-950 py-16">
          <div className="mx-auto max-w-3xl px-5 md:px-12">
            <h2 className="text-center text-3xl font-black text-white">Perguntas frequentes</h2>
            <div className="mt-8 space-y-3">
              {faqs.map(([question, answer], index) => (
                <FAQItem key={question} question={question} answer={answer} defaultOpen={index === 0} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-900 bg-obsidian-950 py-7 text-xs text-zinc-500">
        <div className="mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-4 px-5 md:flex-row md:px-12">
          <Image src="/assets/logo.png" alt="BarberZap" width={128} height={42} className="h-8 w-auto object-contain opacity-80" />
          <p>© 2026 BarberZap. Todos os direitos reservados.</p>
        </div>
      </footer>

      <UtmifyScript />
    </div>
  );
}

function AdminHeroMockup() {
  const rows = [
    ["Hoje - 14:00", "João Silva", "Degradê + Barba"],
    ["Hoje - 15:30", "Carlos Pereira", "Corte + Barba"],
    ["Amanhã - 09:00", "Lucas Santos", "Corte Tradicional"],
    ["Amanhã - 10:30", "Rafael Lima", "Degradê"],
  ];

  return (
    <div className="relative hidden min-h-[430px] items-center justify-center lg:flex">
      <div className="relative w-full max-w-[560px] rounded-[24px] border border-zinc-600 bg-zinc-950 p-2.5 shadow-[0_30px_90px_rgba(0,0,0,0.75)]">
        <div className="absolute left-1/2 top-2 h-1.5 w-20 -translate-x-1/2 rounded-full bg-zinc-700" />
        <div className="overflow-hidden rounded-[18px] bg-white text-black">
          <div className="grid min-h-[335px] grid-cols-[116px_1fr]">
            <aside className="bg-[#091117] p-3 text-white">
              <div className="mb-5 flex items-center gap-2 text-[10px] font-black text-gold-400">
                <Calendar className="h-4 w-4" /> BarberZap
              </div>
              {["Dashboard", "Agendamentos", "Serviços", "Clientes", "Profissionais", "Relatórios", "Fidelidade", "Configurações"].map((item, index) => (
                <div key={item} className={`mb-1.5 rounded-md px-2 py-1.5 text-[8px] font-semibold ${index === 0 ? "bg-gold-500 text-black" : "text-zinc-300"}`}>
                  {item}
                </div>
              ))}
            </aside>
            <div className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-black">Dashboard</h3>
                <div className="flex gap-3 text-zinc-600"><Bell className="h-4 w-4" /><Users className="h-4 w-4" /></div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  ["Agendamentos", "127", "+18% esta semana"],
                  ["Faturamento", "R$ 8.460", "+22% esta semana"],
                  ["Novos Clientes", "43", "+12% esta semana"],
                  ["Taxa de Comparecimento", "98%", "+8% esta semana"],
                ].map(([label, value, change]) => (
                  <div key={label} className="rounded-lg border border-zinc-200 p-2.5">
                    <div className="text-[8px] text-zinc-500">{label}</div>
                    <div className="mt-1 text-sm font-black">{value}</div>
                    <div className="mt-1 text-[8px] font-bold text-gold-600">{change}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-zinc-200 p-3">
                <h4 className="mb-3 text-xs font-black">Próximos Agendamentos</h4>
                <div className="space-y-2">
                  {rows.map(([time, client, service]) => (
                    <div key={time} className="grid grid-cols-[78px_1fr_1fr_70px] items-center border-b border-zinc-100 py-1.5 text-[8px] last:border-b-0">
                      <span>{time}</span>
                      <span className="font-bold">{client}</span>
                      <span>{service}</span>
                      <span className="rounded-full bg-gold-500/15 px-2 py-1 text-center font-black text-gold-700">Confirmado</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto h-4 w-[92%] rounded-b-[80%] bg-gradient-to-b from-zinc-700 to-zinc-950" />
      </div>

      <div className="absolute -right-3 bottom-10 w-[138px] rounded-[24px] border border-zinc-700/80 bg-zinc-950 p-1.5 shadow-[0_24px_70px_rgba(0,0,0,0.85)]">
        <div className="overflow-hidden rounded-[20px] bg-[#0b141a] text-white">
          <div className="flex items-center gap-2 bg-[#1f2c34] px-2.5 pb-2 pt-4">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-gold-400">
              <MessageCircle className="h-3 w-3" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[7px] font-black">Barbearia Top</div>
              <div className="text-[5px] font-semibold text-emerald-400">online</div>
            </div>
          </div>
          <div className="space-y-1.5 p-2.5">
            <div className="max-w-[92%] rounded-xl rounded-tl-none bg-[#202c33] p-2 text-[6.5px] leading-relaxed text-zinc-100">
              Oi, Joao! Passando para lembrar do seu horario amanha as 14:00.
              <br />
              <span className="font-semibold text-gold-300">Degrade + Barba</span>
            </div>
            <div className="ml-auto max-w-[74%] rounded-xl rounded-tr-none bg-[#005c4b] p-1.5 text-[6.5px] leading-relaxed text-white">
              Confirmado!
            </div>
            <div className="max-w-[90%] rounded-xl rounded-tl-none bg-[#202c33] p-2 text-[6.5px] leading-relaxed text-zinc-100">
              Perfeito. Sua presenca foi confirmada no sistema.
              <br />
              Ate amanha!
            </div>
            <div className="mt-1 rounded-full bg-[#1f2c34] px-2 py-1 text-[5.5px] text-zinc-500">
              Mensagem
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingCard({
  title,
  price,
  period,
  desc,
  features: cardFeatures,
  url,
  cta,
  trackingPlan,
  highlighted = false,
}: {
  title: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  url: string;
  cta: string;
  trackingPlan: "weekly" | "monthly";
  highlighted?: boolean;
}) {
  return (
    <div className={`relative rounded-2xl border p-6 shadow-xl ${highlighted ? "border-gold-500 bg-[#16120a] shadow-gold-500/10" : "border-zinc-800 bg-[#0e1418] shadow-black/30"}`}>
      {highlighted && <div className="absolute -top-3 right-8 rounded-full bg-gold-500 px-5 py-1 text-xs font-black text-black">Mais escolhido</div>}
      <h3 className="text-xl font-black text-white">{title}</h3>
      <div className="mt-5 flex items-end gap-1">
        <span className="mb-2 text-sm font-bold text-gold-400">R$</span>
        <span className="text-4xl font-black text-gold-500">{price}</span>
        <span className="mb-2 text-sm font-semibold text-zinc-300">{period}</span>
      </div>
      <p className="mt-3 text-sm text-zinc-400">{desc}</p>
      <ul className="mt-6 space-y-2.5">
        {cardFeatures.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-zinc-200">
            <Check className="h-4 w-4 text-gold-500" />
            {item}
          </li>
        ))}
      </ul>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 block"
        onClick={() => trackLandingEvent("checkout_click", { source: "pricing", plan: trackingPlan })}
      >
        <Button className={`h-12 w-full rounded-lg text-sm font-black ${highlighted ? "bg-gold-500 text-black hover:bg-gold-400" : "border border-gold-500/50 bg-transparent text-gold-400 hover:bg-gold-500/10 hover:text-gold-300"}`}>
          {cta}
        </Button>
      </a>
    </div>
  );
}

function FAQItem({ question, answer, defaultOpen = false }: { question: string; answer: string; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-obsidian-900/50">
      <button onClick={() => setIsOpen((value) => !value)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="text-sm font-black text-white">{question}</span>
        <span className={`text-xl font-black text-gold-500 transition-transform ${isOpen ? "rotate-45" : ""}`}>+</span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}>
            <div className="border-t border-zinc-800 px-5 pb-5 pt-3 text-sm leading-relaxed text-zinc-400">{answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
