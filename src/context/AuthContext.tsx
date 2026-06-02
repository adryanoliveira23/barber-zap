"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

interface Profile {
  id: string;
  full_name: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, whatsapp: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let active = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;
        
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id, session.user.email || "");
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("Erro ao carregar sessão inicial:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        if (!active) return;

        if (session?.user) {
          setUser(session.user);
          setLoading(true);
          try {
            await fetchProfile(session.user.id, session.user.email || "");
          } finally {
            if (active) {
              setLoading(false);
            }
          }
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string, email: string) => {
    const fallbackProfile = {
      id: userId,
      full_name: email.split("@")[0] || "Barbeiro",
    };

    try {
      const queryPromise = supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout de conexão")), 2500);
      });

      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      const { data, error } = result;

      if (error) {
        console.warn("Erro ao carregar perfil (tabela pode não existir ainda):", error.message);
        setProfile(fallbackProfile);
      } else {
        setProfile(data || fallbackProfile);
      }
    } catch (err: any) {
      console.warn("Aviso ao buscar perfil (carregando dados locais):", err?.message || err);
      setProfile(fallbackProfile);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, whatsapp: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            whatsapp,
          },
        },
      });

      if (error) return { error };

      if (data.user) {
        const userId = data.user.id;

        // 1. Upsert profile
        try {
          await supabase.from("profiles").upsert({
            id: userId,
            full_name: fullName,
          });
        } catch (e) {
          console.warn("Erro ao fazer upsert de perfil:", e);
        }

        // 2. Criar barbearia — slug com sufixo aleatório para evitar colisão
        const firstName = fullName.split(" ")[0] || "Barbeiro";
        const shopName = `Barbearia de ${firstName}`;
        const randomSuffix = Math.random().toString(36).slice(2, 6);
        const slug = `${firstName.toLowerCase().replace(/[^a-z0-9]/g, "")}-${randomSuffix}`;

        let barbershopId: string | null = null;
        try {
          const newShop = {
            id: crypto.randomUUID(),
            user_id: userId,
            name: shopName,
            slug,
            description: "Sua barbearia moderna com agendamento rápido.",
            address: "",
            whatsapp: whatsapp.replace(/\D/g, ""),
            instagram: "",
          };
          const { data: createdShop, error: shopErr } = await supabase
            .from("barbershops")
            .insert(newShop)
            .select()
            .single();

          if (shopErr) {
            console.warn("Erro ao criar barbearia no signup:", shopErr.message);
          } else {
            barbershopId = createdShop.id;
          }
        } catch (e) {
          console.warn("Erro inesperado ao criar barbearia:", e);
        }

        // 3. Criar serviços padrão
        if (barbershopId) {
          const defaultServices = [
            { name: "Corte Social", price: 40, duration: 30, description: "Corte clássico na tesoura e máquina." },
            { name: "Corte Degradê", price: 50, duration: 40, description: "Degradê moderno com transições suaves." },
            { name: "Barba Completa", price: 35, duration: 30, description: "Toalha quente, navalha e hidratante." },
            { name: "Combo Cabelo + Barba", price: 75, duration: 60, description: "Combo completo com toalha quente." },
          ].map((s) => ({
            id: crypto.randomUUID(),
            barbershop_id: barbershopId,
            ...s,
            active: true,
          }));

          try {
            await supabase.from("services").insert(defaultServices);
          } catch (e) {
            console.warn("Erro ao criar serviços padrão:", e);
          }
        }
      }

      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };


  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?reset=true`,
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
