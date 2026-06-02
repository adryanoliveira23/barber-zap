"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Scissors, Mail, Lock, User, ArrowRight, Sparkles, ArrowLeft, Eye, EyeOff, AlertCircle } from "lucide-react";
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
  const [whatsapp, setWhatsapp] = useState("");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const { signIn, signUp, resetPassword, user } = useAuth();
  const router = useRouter();
  const { success, error, info } = useToast();
  const searchParams = useSearchParams();

  // Carregar dados salvos no mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("barberzap_remembered_email");
      const savedPassword = localStorage.getItem("barberzap_remembered_password");
      if (savedEmail) setEmail(savedEmail);
      if (savedPassword) setPassword(savedPassword);
    }
  }, []);

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

  const handleTabChange = (val: boolean) => {
    setIsLogin(val);
    setAuthError("");
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!email || !password) {
      setAuthError("Por favor, preencha todos os campos.");
      return;
    }

    if (password.length < 6) {
      setAuthError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (!isLogin) {
      if (!fullName) {
        setAuthError("Por favor, informe seu nome completo.");
        return;
      }
      if (!whatsapp) {
        setAuthError("Por favor, informe seu WhatsApp/Celular.");
        return;
      }
    }

    setLoading(true);

    if (isLogin) {
      const { error: err } = await signIn(email, password);
      if (err) {
        const errorMsg = err.message === "Invalid login credentials" ? "E-mail ou senha inválidos. Por favor, tente novamente." : (err.message || "E-mail ou senha incorretos.");
        setAuthError(errorMsg);
        error("Falha ao entrar", errorMsg);
      } else {
        if (rememberMe) {
          localStorage.setItem("barberzap_remembered_email", email);
          localStorage.setItem("barberzap_remembered_password", password);
        } else {
          localStorage.removeItem("barberzap_remembered_email");
          localStorage.removeItem("barberzap_remembered_password");
        }
        success("Seja bem-vindo de volta!", "Você foi conectado com sucesso.");
        router.push("/dashboard");
      }
    } else {
      const { error: err } = await signUp(email, password, fullName, whatsapp);
      if (err) {
        setAuthError(err.message || "Não foi possível criar sua conta.");
        error("Falha no cadastro", err.message || "Não foi possível criar sua conta.");
      } else {
        if (rememberMe) {
          localStorage.setItem("barberzap_remembered_email", email);
          localStorage.setItem("barberzap_remembered_password", password);
        }
        success("Conta criada!", "Sua barbearia foi registrada. Redirecionando para a página de pagamento...");
        setTimeout(() => {
          window.location.href = "https://pay.cakto.com.br/8odd28u_908528";
        }, 1500);
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
        {/* Voltar para o site */}
        <div className="w-full mb-4">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-gold-500 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para o site
          </Link>
        </div>

        {/* Brand Logo clicável */}
        <Link href="/" className="flex items-center mb-8 select-none group">
          <img src="/assets/logo.png" alt="BarberZap Logo" className="h-24 md:h-28 object-contain group-hover:scale-105 transition-transform" />
        </Link>

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
                      type="button"
                      onClick={() => handleTabChange(true)}
                      className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        isLogin
                          ? "bg-gold-500 text-obsidian-950 shadow-md"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Entrar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabChange(false)}
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
                          key="signup-fields"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex flex-col gap-4"
                        >
                          <Input
                            type="text"
                            label="Nome Completo"
                            placeholder="Ex: Carlos Barber"
                            value={fullName}
                            onChange={(e) => {
                              setFullName(e.target.value);
                              setAuthError("");
                            }}
                            required={!isLogin}
                          />
                          <Input
                            type="tel"
                            label="WhatsApp / Celular"
                            placeholder="Ex: (66) 99762-2785"
                            value={whatsapp}
                            onChange={(e) => {
                              setWhatsapp(e.target.value);
                              setAuthError("");
                            }}
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
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setAuthError("");
                      }}
                      required
                    />

                    <div className="flex flex-col gap-1.5">
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
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setAuthError("");
                          }}
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-gold-500 transition-colors cursor-pointer"
                          tabIndex={-1}
                          aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 select-none py-1">
                      <input
                        id="rememberMe"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-850 bg-obsidian-950 text-gold-500 focus:ring-gold-500 focus:ring-offset-obsidian-950 accent-gold-500 cursor-pointer"
                      />
                      <label htmlFor="rememberMe" className="text-xs font-semibold text-zinc-400 cursor-pointer">
                        Lembrar meus dados de acesso
                      </label>
                    </div>

                    {authError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{authError}</span>
                      </div>
                    )}

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
