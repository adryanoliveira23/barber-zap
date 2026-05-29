"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Scissors, Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/toast";

function LoginContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  
  const { signIn, signUp, resetPassword, user } = useAuth();
  const router = useRouter();
  const { success, error, info } = useToast();
  const searchParams = useSearchParams();

  // Se o usuário já estiver logado, redirecionar
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Checar se veio de uma redefinição de senha
  useEffect(() => {
    if (searchParams.get("reset") === "true") {
      success("Senha redefinida com sucesso!", "Por favor, faça login com sua nova senha.");
    }
  }, [searchParams, success]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      error("Erro de validação", "Por favor, preencha todos os campos.");
      return;
    }

    if (password.length < 6) {
      error("Senha muito curta", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (!isLogin && !fullName) {
      error("Erro de validação", "Por favor, informe seu nome completo.");
      return;
    }

    setLoading(true);

    if (isLogin) {
      const { error: err } = await signIn(email, password);
      if (err) {
        error("Falha ao entrar", err.message || "E-mail ou senha incorretos.");
      } else {
        success("Seja bem-vindo de volta!", "Você foi conectado com sucesso.");
        router.push("/dashboard");
      }
    } else {
      const { error: err } = await signUp(email, password, fullName);
      if (err) {
        error("Falha no cadastro", err.message || "Não foi possível criar sua conta.");
      } else {
        success("Conta criada!", "Verifique seu e-mail para confirmar o cadastro ou faça login.");
        setIsLogin(true);
      }
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      error("Erro de validação", "Por favor, digite seu e-mail.");
      return;
    }

    setLoading(true);
    const { error: err } = await resetPassword(forgotEmail);
    if (err) {
      error("Falha no envio", err.message || "Não foi possível enviar o link de recuperação.");
    } else {
      success("E-mail enviado!", "Instruções de redefinição foram enviadas para seu e-mail.");
      setShowForgot(false);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-obsidian-950 px-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-gold-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-gold-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 flex flex-col items-center">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 mb-8 select-none">
          <div className="h-12 w-12 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-500">
            <Scissors className="h-6 w-6 rotate-90" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-1.5">
              Barber<span className="text-gold-500 font-extrabold">Zap</span>
            </h1>
            <p className="text-xs text-zinc-500 font-semibold tracking-wider uppercase">Scheduling SaaS</p>
          </div>
        </div>

        {/* Forgot Password Section */}
        <AnimatePresence mode="wait">
          {showForgot ? (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full"
            >
              <Card className="glass-panel">
                <CardContent className="pt-6">
                  <h2 className="text-lg font-bold text-zinc-100 mb-2">Recuperar Senha</h2>
                  <p className="text-sm text-zinc-400 mb-6">
                    Digite seu e-mail cadastrado e enviaremos um link para você redefinir sua senha de acesso.
                  </p>

                  <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                    <Input
                      type="email"
                      label="E-mail profissional"
                      placeholder="seuemail@provedor.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />

                    <Button type="submit" isLoading={loading} className="w-full mt-2">
                      Enviar Link de Recuperação
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowForgot(false)}
                      className="w-full text-xs text-zinc-500"
                    >
                      Voltar para o login
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full"
            >
              <Card className="glass-panel">
                <CardContent className="pt-6">
                  {/* Tab Selector */}
                  <div className="grid grid-cols-2 p-1 bg-obsidian-950/80 border border-zinc-800/30 rounded-xl mb-6">
                    <button
                      onClick={() => setIsLogin(true)}
                      className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        isLogin
                          ? "bg-gold-500 text-obsidian-950 shadow-md"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Entrar
                    </button>
                    <button
                      onClick={() => setIsLogin(false)}
                      className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        !isLogin
                          ? "bg-gold-500 text-obsidian-950 shadow-md"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Criar Conta
                    </button>
                  </div>

                  <form onSubmit={handleAuth} className="flex flex-col gap-4">
                    <AnimatePresence mode="wait">
                      {!isLogin && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Input
                            type="text"
                            label="Nome Completo"
                            placeholder="Ex: Carlos Barber"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required={!isLogin}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Input
                      type="email"
                      label="E-mail profissional"
                      placeholder="seuemail@provedor.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />

                    <div className="flex flex-col gap-1.5 relative">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                          Senha
                        </label>
                        {isLogin && (
                          <button
                            type="button"
                            onClick={() => setShowForgot(true)}
                            className="text-xs text-gold-500 hover:underline cursor-pointer"
                          >
                            Esqueceu a senha?
                          </button>
                        )}
                      </div>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>

                    <Button type="submit" isLoading={loading} className="w-full mt-2">
                      {isLogin ? "Entrar no Painel" : "Criar Minha Barbearia"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Footer Help */}
              <div className="mt-6 flex flex-col items-center gap-1.5 text-center px-4">
                <p className="text-xs text-zinc-500 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-gold-500" />
                  Pronto para profissionalizar sua barbearia hoje?
                </p>
                <p className="text-[10px] text-zinc-600 leading-normal">
                  Ao continuar, você concorda com nossos Termos de Serviço. BarberZap MVP conectado à nuvem Supabase.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-obsidian-950">
        <div className="h-10 w-10 rounded-full border-2 border-gold-500 border-t-transparent animate-spin" />
      </div>
    }>
      <LoginContent />
    </React.Suspense>
  );
}
