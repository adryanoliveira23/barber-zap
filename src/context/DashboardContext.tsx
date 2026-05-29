"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getOrCreateBarbershop, Barbershop } from "@/lib/db";
import { Scissors } from "lucide-react";

interface DashboardContextType {
  barbershop: Barbershop | null;
  loadingShop: boolean;
  refreshShop: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [loadingShop, setLoadingShop] = useState(true);

  const fetchShop = async () => {
    if (!user) return;
    try {
      setLoadingShop(true);
      // Pega ou cria a barbearia do usuário com o nome default
      const shopName = user.user_metadata?.full_name 
        ? `Barbearia de ${user.user_metadata.full_name.split(" ")[0]}` 
        : "Minha Barbearia";
      
      const shop = await getOrCreateBarbershop(user.id, shopName);
      setBarbershop(shop);
    } catch (e) {
      console.error("Erro ao carregar barbearia:", e);
    } finally {
      setLoadingShop(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchShop();
      } else {
        setBarbershop(null);
        setLoadingShop(false);
      }
    }
  }, [user, authLoading]);

  const refreshShop = async () => {
    await fetchShop();
  };

  if (authLoading || (user && loadingShop)) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-obsidian-950 gap-4">
        <div className="h-16 w-16 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-500 relative animate-pulse">
          <Scissors className="h-8 w-8 rotate-90" />
        </div>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <p className="text-sm font-semibold text-zinc-300">Carregando BarberZap...</p>
          <p className="text-xs text-zinc-500">Preparando sua barbearia digital de luxo</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardContext.Provider value={{ barbershop, loadingShop, refreshShop }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard deve ser usado dentro de um DashboardProvider");
  }
  return context;
};
