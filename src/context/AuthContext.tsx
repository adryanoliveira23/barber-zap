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

      if (!error && data.user) {
        try {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            full_name: fullName,
          });
        } catch (e) {
          console.warn("Erro ao fazer upsert manual de perfil:", e);
        }
      }

      return { error };
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
