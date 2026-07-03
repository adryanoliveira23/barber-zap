"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { updateBarbershop } from "@/lib/db";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Settings,
  Instagram,
  Phone,
  MapPin,
  Globe,
  Lock,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const formatWhatsApp = (value: string) => {
  const digits = value.replace(/\D/g, "");
  const limited = digits.slice(0, 11);

  if (limited.length === 0) return "";
  if (limited.length <= 2) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  if (limited.length <= 10) return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
  return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
};

export default function SettingsPage() {
  const { barbershop, refreshShop } = useDashboard();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [origin, setOrigin] = useState("https://barberzap.com.br");

  // Password change states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (barbershop) {
      setSlug(barbershop.slug || "");
      setName(barbershop.name || "");
      setWhatsapp(formatWhatsApp(barbershop.whatsapp || ""));
      setInstagram(barbershop.instagram || "");
      setAddress(barbershop.address || "");
      setDescription(barbershop.description || "");
    }
  }, [barbershop]);

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow lowercase letters, numbers, and dashes
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(value);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barbershop) return;

    if (!slug) {
      error("Erro", "O nome de usuário (@) não pode ficar em branco.");
      return;
    }

    if (!name.trim()) {
      error("Erro", "O nome da barbearia é obrigatório.");
      return;
    }

    setLoading(true);

    try {
      const updatedShop = {
        ...barbershop,
        slug,
        name: name.trim(),
        whatsapp: whatsapp.replace(/\D/g, ""),
        instagram: instagram.replace(/@/g, "").trim(),
        address: address.trim(),
        description: description.trim(),
      };

      await updateBarbershop(updatedShop);
      await refreshShop();
      success("Sucesso", "Configurações salvas com sucesso!");
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("unique_slug")) {
        error("Usuário já existe", "Este nome de usuário (@) já está em uso por outro barbeiro. Escolha outro.");
      } else {
        error("Erro ao salvar", err.message || "Ocorreu um erro ao atualizar suas configurações.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;

    if (password !== confirmPassword) {
      error("Erro", "As senhas não coincidem. Tente novamente.");
      return;
    }

    if (password.length < 6) {
      error("Erro", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;
      
      success("Sucesso", "Sua senha foi alterada com segurança.");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      error("Erro de Segurança", err.message || "Não foi possível alterar a senha.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-10">
      {/* Title Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-500">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Configurações da Barbearia</h1>
          <p className="text-xs text-zinc-500">Ajuste os dados públicos da sua barbearia e seu link exclusivo.</p>
        </div>
      </div>

      <Card className="border-zinc-800/80 bg-obsidian-900/40 relative overflow-hidden">
        {/* Decorative gold gradient border at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-500/30 via-gold-500 to-gold-500/30"></div>

        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSave} className="flex flex-col gap-6">

            {/* Seção 1: Identidade e Handle */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500">Identidade Digital</h3>

              {/* @ Username Slug */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-400">Nome de Usuário (@)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm font-bold text-gold-500/80 select-none">@</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={handleSlugChange}
                    placeholder="ex: barbearia-do-john"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-zinc-800/80 bg-obsidian-950/80 text-zinc-250 text-sm font-bold placeholder-zinc-650 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/25 outline-none transition-all text-zinc-200"
                    required
                  />
                </div>

                {/* Real-time Link Preview */}
                {slug && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-950/40 border border-zinc-850 text-[10px] text-zinc-500">
                    <Globe className="h-3.5 w-3.5 text-gold-500/60" />
                    <span>Seu link será:</span>
                    <strong className="text-gold-500/90 truncate font-semibold">
                      {origin}/{slug}
                    </strong>
                  </div>
                )}

                <p className="text-[10px] text-zinc-500 leading-normal">
                  Este é o seu handle único. Ele define o link que você enviará para os clientes realizarem agendamentos. Apenas letras minúsculas, números e hífens.
                </p>
              </div>

              {/* Barbershop Name */}
              <Input
                label="Nome da Barbearia"
                placeholder="Ex: John's Classic Barber"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="h-px bg-zinc-800/40 my-1"></div>

            {/* Seção 2: Informações de Contato e Redes */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500">Contato & Localização</h3>

              {/* WhatsApp */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400">WhatsApp (com DDD)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-zinc-500"><Phone className="h-4 w-4" /></span>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
                    placeholder="Ex: (81) 91111-1111"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-800/80 bg-obsidian-950/80 text-zinc-250 text-sm placeholder-zinc-600 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/25 outline-none transition-all text-zinc-200"
                  />
                </div>
                <p className="text-[10px] text-zinc-500">Utilizado pelos clientes para tirar dúvidas ou enviar mensagens diretas.</p>
              </div>

              {/* Instagram */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400">Usuário do Instagram</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-zinc-500"><Instagram className="h-4 w-4" /></span>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="Ex: @johndoe_barber"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-800/80 bg-obsidian-950/80 text-zinc-250 text-sm placeholder-zinc-650 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/25 outline-none transition-all text-zinc-200"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400">Endereço da Barbearia</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-zinc-500"><MapPin className="h-4 w-4" /></span>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex: Av. Paulista, 1000 - Sala 4 - Bela Vista, São Paulo - SP"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-800/80 bg-obsidian-950/80 text-zinc-250 text-sm placeholder-zinc-600 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/25 outline-none transition-all text-zinc-200"
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-zinc-800/40 my-1"></div>

            {/* Seção 3: Apresentação */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500">Sobre a Barbearia</h3>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400">Descrição / Biografia</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Escreva uma breve apresentação da sua barbearia para aparecer aos clientes."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-800/80 bg-obsidian-950/80 text-zinc-200 text-sm placeholder-zinc-600 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/25 outline-none transition-all resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Save Button */}
            <Button
              type="submit"
              isLoading={loading}
              className="w-full mt-4 bg-gold-500 hover:bg-gold-600 text-obsidian-950 font-black h-11 transition-all"
            >
              Salvar Alterações
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-zinc-800/80 bg-obsidian-900/40 relative overflow-hidden mt-2">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-gold-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500">Segurança</h3>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-xs font-bold text-zinc-400">Nova Senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-800/80 bg-obsidian-950/80 text-zinc-250 text-sm placeholder-zinc-650 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/25 outline-none transition-all text-zinc-200"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-xs font-bold text-zinc-400">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-800/80 bg-obsidian-950/80 text-zinc-250 text-sm placeholder-zinc-650 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/25 outline-none transition-all text-zinc-200"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="outline"
                isLoading={isChangingPassword}
                disabled={!password || !confirmPassword}
                className="w-full md:w-auto self-end border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all mt-2"
              >
                Atualizar Senha
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
