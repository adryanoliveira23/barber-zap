"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { getServices, saveService, deleteService, Service } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { Plus, Edit2, Trash2, Power, DollarSign, Clock, LayoutGrid } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function ServicesPage() {
  const { barbershop } = useDashboard();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Controle de Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  // Campos do Formulário
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("30");
  const [description, setDescription] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const { success, error } = useToast();

  const loadServices = async () => {
    if (!barbershop) return;
    try {
      setLoading(true);
      const data = await getServices(barbershop.id);
      setServices(data);
    } catch (e) {
      error("Erro ao carregar", "Não foi possível buscar a lista de serviços.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [barbershop]);

  const handleOpenAddModal = () => {
    setEditingService(null);
    setName("");
    setPrice("");
    setDuration("30");
    setDescription("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service: Service) => {
    setEditingService(service);
    setName(service.name);
    setPrice(service.price.toString());
    setDuration(service.duration.toString());
    setDescription(service.description || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !duration) {
      error("Validação", "Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (!barbershop) return;

    setFormLoading(true);
    try {
      const serviceData = {
        barbershop_id: barbershop.id,
        name,
        price: Number(price),
        duration: Number(duration),
        description,
        active: editingService ? editingService.active : true,
      };

      if (editingService) {
        // Atualizando
        const updated = await saveService({ ...serviceData, id: editingService.id });
        setServices((prev) => prev.map((s) => (s.id === editingService.id ? updated : s)));
        success("Serviço atualizado!", `O serviço "${name}" foi salvo com sucesso.`);
      } else {
        // Criando novo
        const created = await saveService(serviceData);
        setServices((prev) => [...prev, created]);
        success("Serviço criado!", `O serviço "${name}" foi adicionado com sucesso.`);
      }
      setIsModalOpen(false);
    } catch (e) {
      error("Erro ao salvar", "Ocorreu um erro ao salvar o serviço no banco de dados.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este serviço?")) return;
    try {
      await deleteService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
      success("Serviço removido!", "O serviço foi excluído do catálogo.");
    } catch (e) {
      error("Erro ao excluir", "Não foi possível excluir o serviço.");
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      const updated = await saveService({ ...service, active: !service.active });
      setServices((prev) => prev.map((s) => (s.id === service.id ? updated : s)));
      success(
        updated.active ? "Serviço Ativado" : "Serviço Inativado",
        `O serviço "${service.name}" agora está ${updated.active ? "visível" : "oculto"} para os clientes.`
      );
    } catch (e) {
      error("Erro", "Não foi possível alterar o status do serviço.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header com botão de adicionar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-gold-500" />
            Catálogo de Serviços
          </h3>
          <p className="text-xs text-zinc-500 font-medium">Cadastre os serviços oferecidos e seus respectivos valores.</p>
        </div>
        <Button onClick={handleOpenAddModal} className="text-xs font-semibold gap-1.5 h-10">
          <Plus className="h-4 w-4" />
          Adicionar Serviço
        </Button>
      </div>

      {/* Lista de Serviços */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-10 w-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-500 animate-spin">
            <Clock className="h-5 w-5" />
          </div>
          <p className="text-xs text-zinc-550 text-zinc-500 font-semibold mt-3 animate-pulse">Carregando serviços...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center glass-panel rounded-2xl border border-zinc-850">
          <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-3">
            <LayoutGrid className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold text-zinc-400">Nenhum serviço cadastrado</p>
          <p className="text-xs text-zinc-600 max-w-[280px] mt-1">
            Clique no botão acima para adicionar seu primeiro serviço e liberar o agendamento público.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {services.map((service) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={`h-full relative overflow-hidden transition-all ${
                  !service.active ? "opacity-60 border-dashed" : ""
                }`}>
                  {/* Destaque decorativo superior */}
                  <div className={`h-1.5 w-full ${service.active ? "bg-gold-500" : "bg-zinc-800"}`} />
                  
                  <CardContent className="pt-5 flex flex-col justify-between h-full min-h-[150px] gap-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm text-zinc-200 truncate">{service.name}</h4>
                        
                        {/* Indicador Ativo/Inativo */}
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          service.active 
                            ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/10" 
                            : "text-zinc-500 bg-zinc-950 border-zinc-850"
                        }`}>
                          {service.active ? "Ativo" : "Inativo"}
                        </span>
                      </div>

                      {service.description && (
                        <p className="text-xs text-zinc-500 leading-normal line-clamp-2">
                          {service.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-800/40 pt-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center text-xs text-zinc-400 font-semibold gap-1">
                          <DollarSign className="h-3.5 w-3.5 text-gold-500 shrink-0" />
                          R$ {service.price.toFixed(2)}
                        </div>
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleActive(service)}
                          className={`p-2 rounded-lg border transition-all cursor-pointer ${
                            service.active 
                              ? "bg-zinc-950/40 border-zinc-800 text-zinc-500 hover:text-amber-500 hover:border-amber-500/30"
                              : "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                          }`}
                          title={service.active ? "Inativar Serviço" : "Ativar Serviço"}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>
                        
                        <button
                          onClick={() => handleOpenEditModal(service)}
                          className="p-2 rounded-lg border border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all cursor-pointer"
                          title="Editar Serviço"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        
                        <button
                          onClick={() => handleDelete(service.id)}
                          className="p-2 rounded-lg border border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:text-red-400 hover:border-red-500/20 transition-all cursor-pointer"
                          title="Excluir Serviço"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal Adicionar / Editar */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? "Editar Serviço" : "Cadastrar Novo Serviço"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nome do Serviço *"
            placeholder="Ex: Corte Degradê, Barba Terapia"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Preço (R$) *"
            type="number"
            step="0.01"
            placeholder="Ex: 50.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Descrição (Opcional)
            </label>
            <textarea
              placeholder="Detalhe o serviço para o cliente (ex: toalha quente, cremes importados...)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-1 focus:ring-gold-500/50 focus:border-gold-500 glass-input text-zinc-100 bg-obsidian-900 border border-zinc-800 resize-none"
            />
          </div>

          <div className="flex gap-2 justify-end mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              className="px-4"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={formLoading}
              className="px-5"
            >
              Salvar Serviço
            </Button>
          </div>
        </form>
      </Dialog>

    </div>
  );
}
