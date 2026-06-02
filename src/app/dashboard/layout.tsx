"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DashboardProvider, useDashboard } from "@/context/DashboardContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Scissors,
  LayoutDashboard,
  CalendarClock,
  Users,
  MessageSquare,
  LogOut,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  CreditCard,
  Settings,
} from "lucide-react";
import { motion } from "framer-motion";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { barbershop } = useDashboard();
  const { signOut, user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { success, error } = useToast();
  const [copied, setCopied] = useState(false);

  const isSubscribed = !!user?.user_metadata?.is_subscribed;
  const isTrialActive = user?.created_at
    ? new Date(user.created_at).getTime() + 7 * 24 * 60 * 60 * 1000 > Date.now()
    : false;
  const hasAccess = isSubscribed || isTrialActive;
  const isSubscriptionPage = pathname === "/dashboard/subscription";

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/login");
      } else if (!hasAccess && !isSubscriptionPage) {
        router.replace("/dashboard/subscription");
      }
    }
  }, [authLoading, user, hasAccess, isSubscriptionPage, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-obsidian-950 gap-4">
        <div className="relative animate-pulse">
          <img src="/assets/logo.png" alt="BarberZap Logo" className="h-20 md:h-24 object-contain" />
        </div>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <p className="text-sm font-semibold text-zinc-300">Carregando BarberZap...</p>
          <p className="text-xs text-zinc-500">Verificando credenciais de acesso...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: "Painel", href: "/dashboard", icon: LayoutDashboard, locked: !hasAccess },
    { name: "Serviços", href: "/dashboard/services", icon: Scissors, locked: !hasAccess },
    { name: "Clientes & CRM", href: "/dashboard/customers", icon: Users, locked: !hasAccess },
    { name: "Mensagens WhatsApp", href: "/dashboard/whatsapp", icon: MessageSquare, locked: !hasAccess },
    { name: "Assinatura", href: "/dashboard/subscription", icon: CreditCard, locked: false },
    { name: "Configurações", href: "/dashboard/settings", icon: Settings, locked: !hasAccess },
  ];

  const handleCopyLink = async () => {
    if (!barbershop) return;
    const bookingUrl = `${window.location.origin}/${barbershop.slug}`;
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      success("Link copiado!", "Link da sua página pública foi copiado para a área de transferência.");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      error("Erro ao copiar", "Não foi possível copiar o link. Copie manualmente: " + bookingUrl);
    }
  };

  const handleSignOut = async () => {
    const { error: err } = await signOut();
    if (err) {
      error("Erro ao sair", err.message);
    } else {
      success("Até logo!", "Você foi desconectado com sucesso.");
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen w-full bg-obsidian-950 flex flex-col md:flex-row pb-20 md:pb-0">

      {/* 1. SIDEBAR (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-obsidian-900 border-r border-zinc-800/40 p-5 justify-between shrink-0 h-screen sticky top-0">
        <div className="flex flex-col gap-8">
          {/* Logo Brand */}
          <div className="flex items-center gap-2 select-none px-2">
            <Link href="/" className="flex items-center">
              <img src="/assets/logo.png" alt="BarberZap Logo" className="h-14 md:h-16 object-contain" />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              if (item.locked) {
                return (
                  <div key={item.href} className="relative opacity-50 cursor-not-allowed" title="Assinatura Pro necessária">
                    <span className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500">
                      <Icon className="h-4.5 w-4.5 text-zinc-650" />
                      {item.name}
                      <span className="ml-auto text-[9px] font-extrabold bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded tracking-wider">
                        PRO
                      </span>
                    </span>
                  </div>
                );
              }
              return (
                <Link key={item.href} href={item.href} className="relative">
                  <span
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer group ${isActive
                        ? "text-gold-500 bg-gold-500/5 font-semibold"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                      }`}
                  >
                    <Icon className={`h-4.5 w-4.5 ${isActive ? "text-gold-500" : "text-zinc-400 group-hover:text-zinc-200"}`} />
                    {item.name}

                    {isActive && (
                      <motion.div
                        layoutId="active-indicator"
                        className="absolute right-2 w-1.5 h-1.5 rounded-full bg-gold-500"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & Info */}
        <div className="flex flex-col gap-4 border-t border-zinc-800/50 pt-5">
          {barbershop && (
            <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-800/40 flex flex-col gap-2">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Sua barbearia</span>
                <span className="text-sm font-bold text-zinc-200 truncate">{barbershop.name}</span>
              </div>

              <button
                onClick={handleCopyLink}
                className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg bg-obsidian-850 hover:bg-obsidian-800 text-[11px] text-gold-500 border border-gold-500/10 hover:border-gold-500/30 transition-all font-medium cursor-pointer"
              >
                <span className="truncate max-w-[120px]">@{barbershop.slug}</span>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}

          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-zinc-300 truncate max-w-[120px]">
                {user?.user_metadata?.full_name || "Barbeiro"}
              </span>
              <span className="text-[10px] text-zinc-500 truncate max-w-[120px]">{user?.email}</span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-8 w-8 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/5"
              title="Sair do sistema"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* 2. BOTTOM NAVIGATION BAR (Mobile-first) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-obsidian-900/90 backdrop-blur-md border-t border-zinc-800/60 px-4 py-2 flex justify-around items-center">
        {menuItems.filter(item => !["Assinatura", "Configurações", "Agenda Inteligente"].includes(item.name)).map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          if (item.locked) {
            return (
              <div key={item.href} className="flex flex-col items-center gap-0.5 relative py-1 opacity-40 cursor-not-allowed">
                <span className="p-1.5 text-zinc-500">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-medium text-zinc-500">
                  {item.name.split(" ")[0]}
                </span>
              </div>
            );
          }
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 relative py-1">
              <span className={`p-1.5 rounded-xl transition-all cursor-pointer ${isActive ? "text-gold-500 bg-gold-500/10 scale-105" : "text-zinc-500"}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className={`text-[10px] font-medium transition-all ${isActive ? "text-zinc-200 font-bold" : "text-zinc-500"}`}>
                {item.name.split(" ")[0]}
              </span>
            </Link>
          );
        })}
        <button
          onClick={handleSignOut}
          className="flex flex-col items-center gap-0.5 py-1 text-zinc-500 hover:text-red-400 cursor-pointer"
        >
          <span className="p-1.5">
            <LogOut className="h-5 w-5" />
          </span>
          <span className="text-[10px]">Sair</span>
        </button>
      </nav>

      {/* 3. MOBILE HEADER */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 bg-obsidian-900 border-b border-zinc-800/40 sticky top-0 z-30">
        <div className="flex items-center gap-2 select-none">
          <Link href="/" className="flex items-center">
            <img src="/assets/logo.png" alt="BarberZap Logo" className="h-10 object-contain" />
          </Link>
        </div>

        {barbershop && (
          <div className="flex items-center gap-1.5">
            <Link
              href="/dashboard/subscription"
              className={`p-2 rounded-lg border transition-all cursor-pointer ${pathname === "/dashboard/subscription" ? "bg-gold-500/20 border-gold-500/40 text-gold-400" : "bg-zinc-950/60 border-zinc-800/60 text-zinc-400 hover:text-gold-500"}`}
              title="Assinatura e Faturamento"
            >
              <CreditCard className="h-4.5 w-4.5" />
            </Link>
            <Link
              href="/dashboard/settings"
              className={`p-2 rounded-lg border transition-all cursor-pointer ${pathname === "/dashboard/settings" ? "bg-gold-500/20 border-gold-500/40 text-gold-400" : "bg-zinc-950/60 border-zinc-800/60 text-zinc-400 hover:text-gold-500"}`}
              title="Configurações da Barbearia"
            >
              <Settings className="h-4.5 w-4.5" />
            </Link>
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60 text-gold-500 hover:text-gold-400 cursor-pointer"
              title="Copiar Link de Agendamento"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
            <Link
              href={`/${barbershop.slug}`}
              target="_blank"
              className="p-2 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-500 hover:text-gold-400 hover:bg-gold-500/20 cursor-pointer"
              title="Ver Página Pública"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        )}
      </header>

      {/* 4. MAIN CONTAINER CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-y-auto bg-obsidian-950">
        {/* Top Header Desktop */}
        <header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-zinc-800/20 sticky top-0 bg-obsidian-950/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
            <span>BarberZap</span>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
            <span className="text-zinc-200 capitalize font-bold">
              {pathname === "/dashboard" ? "Painel Geral" : pathname.split("/").pop()?.replace("-", " ")}
            </span>
          </div>

          {barbershop && (
            <div className="flex items-center gap-4">
              <Link
                href={`/${barbershop.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gold-500/10 border border-gold-500/30 text-gold-500 hover:bg-gold-500/20 transition-all cursor-pointer"
              >
                Página de Agendamento
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </header>

        {/* Content Children */}
        <div className="flex-1 p-5 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardProvider>
  );
}
