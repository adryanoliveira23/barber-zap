"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getOrCreateBarbershop, Barbershop } from "@/lib/db";

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

  if ((authLoading || loadingShop) && !barbershop) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-obsidian-950 gap-4">
        <div className="relative animate-pulse">
          <img src="/assets/logo.png" alt="BarberZap Logo" className="h-12 object-contain" />
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
