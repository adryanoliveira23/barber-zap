"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Scissors, Lock, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Verificar senha mestra via API (para não expor no cliente)
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem("admin_token", "authenticated");
        router.push("/admin/users");
      } else {
        setError(data.error || "Senha incorreta");
      }
    } catch (err) {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-gold-500/30 bg-obsidian-900">
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-500">
              <Scissors className="h-8 w-8 rotate-90" />
            </div>
            <h2 className="text-xl font-bold text-zinc-100">Acesso Administrativo</h2>
            <p className="text-xs text-zinc-500 text-center">
              Digite a senha mestra para acessar o painel de controle geral.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Senha mestra"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                autoFocus
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

            {error && (
              <p className="text-xs text-red-400 text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" isLoading={loading}>
              Acessar Painel
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
