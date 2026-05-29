"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { getCustomers, getLoyaltyStatus, resetLoyaltyProgress, Customer, Loyalty } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { Search, Gift, ShieldAlert, Award, Star, History, Calendar, RotateCcw, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

export default function CustomersPage() {
  const { barbershop } = useDashboard();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Controle de Modal do Cartão Fidelidade
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loyaltyData, setLoyaltyData] = useState<Loyalty | null>(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const { success, error, info } = useToast();

  const loadCustomers = async () => {
    if (!barbershop) return;
    try {
      setLoading(true);
      const data = await getCustomers(barbershop.id);
      setCustomers(data);
    } catch (e) {
      error("Erro", "Não foi possível carregar a lista de clientes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [barbershop]);

  const handleOpenLoyalty = async (customer: Customer) => {
    if (!barbershop) return;
    setSelectedCustomer(customer);
    setLoyaltyData(null);
    setLoyaltyLoading(true);
    
    try {
      const data = await getLoyaltyStatus(barbershop.id, customer.phone);
      if (data) {
        setLoyaltyData(data);
      } else {
        // Se por algum motivo não existir cartão fidelidade para esse telefone cadastrado
        setLoyaltyData({
          id: "temp",
          barbershop_id: barbershop.id,
          customer_phone: customer.phone,
          visits_count: customer.visits_count,
          progress: 0,
        });
      }
    } catch (e) {
      error("Erro", "Não foi possível carregar o cartão fidelidade do cliente.");
    } finally {
      setLoyaltyLoading(false);
    }
  };

  const handleResetLoyalty = async () => {
    if (!loyaltyData || loyaltyData.id === "temp") return;
    setResetting(true);
    try {
      await resetLoyaltyProgress(loyaltyData.id);
      setLoyaltyData({ ...loyaltyData, progress: 0 });
      success("Corte resgatado!", "O cartão fidelidade foi zerado e o cliente recebeu seu corte grátis.");
    } catch (e) {
      error("Erro", "Falha ao resgatar benefício.");
    } finally {
      setResetting(false);
    }
  };

  // Filtragem de clientes por busca
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  return (
    <div className="flex flex-col gap-6 pb-10">
      
      {/* Header e Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Award className="h-5 w-5 text-gold-500" />
            CRM & Fidelidade
          </h3>
          <p className="text-xs text-zinc-500 font-medium">Controle a frequência de visitas e recompense seus clientes mais fiéis.</p>
        </div>

        {/* Campo de Busca */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Buscar por nome ou celular..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
      </div>

      {/* Tabela de Clientes */}
      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 w-full bg-zinc-900/50 border border-zinc-800/40 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800/60 flex items-center justify-center text-zinc-650 mb-3">
                <Search className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-zinc-400">Nenhum cliente localizado</p>
              <p className="text-xs text-zinc-600 mt-1 max-w-[280px]">
                Tente buscar por outro termo ou aguarde o agendamento de novos clientes.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/50 text-xs font-semibold text-zinc-400 uppercase tracking-wider bg-zinc-950/20">
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Celular</th>
                  <th className="px-6 py-4">Total de Visitas</th>
                  <th className="px-6 py-4">Último Atendimento</th>
                  <th className="px-6 py-4 text-right">Fidelidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/20">
                {filteredCustomers.map((c) => {
                  const lastVisitDate = new Date(c.last_visit);
                  const diffTime = Math.abs(new Date().getTime() - lastVisitDate.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const isInactive = diffDays >= 20;

                  const cleanPhone = c.phone.replace(/\D/g, "");
                  const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
                  const appUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
                  const messageText = `Olá ${c.name}! Faz ${diffDays} dias que você não passa na ${barbershop?.name || "barbearia"}. Que tal agendar seu próximo horário? Agende aqui: ${appUrl}/${barbershop?.slug || ""}`;
                  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageText)}`;

                  return (
                    <tr key={c.id} className="hover:bg-zinc-900/25 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-zinc-200">{c.name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-zinc-500 font-semibold uppercase">Cliente Gold</span>
                            {isInactive && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-semibold border border-red-500/20">
                                Inativo há {diffDays} dias
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">{c.phone}</td>
                      <td className="px-6 py-4 text-sm font-bold text-zinc-300">{c.visits_count} visitas</td>
                      <td className="px-6 py-4 text-xs text-zinc-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-gold-500" />
                          {new Date(c.last_visit).toLocaleDateString("pt-BR")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isInactive && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => window.open(whatsappUrl, "_blank")}
                              className="h-9 px-3 rounded-lg text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                            >
                              <MessageSquare className="h-3.5 w-3.5 mr-1" />
                              Reengajar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="gold-outline"
                            onClick={() => handleOpenLoyalty(c)}
                            className="h-9 px-3 rounded-lg text-xs"
                          >
                            <Gift className="h-3.5 w-3.5 mr-1" />
                            Ver Cartão
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Modal do Cartão Fidelidade */}
      <Dialog
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={`Cartão Fidelidade: ${selectedCustomer?.name || ""}`}
      >
        {loyaltyLoading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-gold-500 border-t-transparent animate-spin" />
            <p className="text-xs text-zinc-500">Carregando selos...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 items-center">
            
            {/* Visual Loyalty Card */}
            <div className="w-full p-6 rounded-2xl bg-gradient-to-br from-obsidian-900 to-zinc-900 border border-gold-500/20 relative overflow-hidden shadow-2xl">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gold-500/5 rounded-full blur-2xl" />
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-xs font-bold text-gold-500 tracking-widest uppercase">Cartão Fidelidade</h4>
                  <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">BarberZap Premium Club</p>
                </div>
                <Award className="h-6 w-6 text-gold-500" />
              </div>

              {/* Stamps Grid */}
              <div className="grid grid-cols-5 gap-3 mb-6">
                {Array.from({ length: 10 }).map((_, i) => {
                  const stampNumber = i + 1;
                  const isStamped = (loyaltyData?.progress || 0) >= stampNumber;
                  const isLast = stampNumber === 10;
                  
                  return (
                    <div
                      key={i}
                      className={`h-11 rounded-xl flex items-center justify-center border transition-all ${
                        isStamped
                          ? "bg-gold-500 border-gold-500 text-obsidian-950 shadow-md shadow-gold-500/10 font-bold scale-102"
                          : isLast
                          ? "bg-gold-500/5 border-dashed border-gold-500/30 text-gold-500 animate-pulse"
                          : "bg-obsidian-950 border-zinc-800 text-zinc-600"
                      }`}
                      title={isLast ? "Prêmio no 10º corte!" : `Corte ${stampNumber}`}
                    >
                      {isStamped ? (
                        <Star className="h-4.5 w-4.5 fill-current" />
                      ) : isLast ? (
                        <Gift className="h-4.5 w-4.5" />
                      ) : (
                        <span className="text-xs font-semibold">{stampNumber}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center border-t border-zinc-800/40 pt-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Progresso</span>
                  <span className="text-sm font-extrabold text-zinc-300">
                    {loyaltyData?.progress || 0} / 10 Cortes
                  </span>
                </div>

                <span className="text-[10px] text-zinc-400 font-semibold bg-zinc-950/80 px-2.5 py-1 rounded-full border border-zinc-850">
                  Total acumulado: {loyaltyData?.visits_count || 0}
                </span>
              </div>
            </div>

            {/* Ação de Resgatar Recompensa */}
            {(loyaltyData?.progress || 0) >= 10 ? (
              <div className="w-full flex flex-col gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 items-center text-center">
                <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-1">
                  <Gift className="h-5 w-5" />
                </div>
                <h5 className="text-sm font-bold text-emerald-400">Cliente Elegível para Recompensa!</h5>
                <p className="text-xs text-zinc-400 leading-normal max-w-sm">
                  Este cliente atingiu a meta de 10 agendamentos finalizados. Zere o progresso dele e dê o 11º corte gratuitamente como prêmio.
                </p>
                <Button
                  onClick={handleResetLoyalty}
                  isLoading={resetting}
                  className="w-full mt-2 bg-emerald-500 text-zinc-950 hover:bg-emerald-400 focus:ring-emerald-500 font-bold"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Resgatar e Zerar Cartão
                </Button>
              </div>
            ) : (
              <div className="w-full flex items-center gap-3 p-4 rounded-xl bg-zinc-950 border border-zinc-850">
                <ShieldAlert className="h-5 w-5 text-zinc-500 shrink-0" />
                <p className="text-xs text-zinc-500 leading-normal">
                  A barra de fidelidade é preenchida automaticamente sempre que você marca um agendamento do cliente como **"Finalizado"** no painel principal.
                </p>
              </div>
            )}

            <Button
              type="button"
              variant="secondary"
              onClick={() => setSelectedCustomer(null)}
              className="w-full mt-2"
            >
              Fechar Cartão
            </Button>

          </div>
        )}
      </Dialog>

    </div>
  );
}
