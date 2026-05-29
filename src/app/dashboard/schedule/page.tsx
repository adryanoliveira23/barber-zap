"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { getSchedule, saveSchedule, Schedule } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { CalendarClock, Save, Plus, Trash2, ShieldAlert, Calendar } from "lucide-react";

export default function SchedulePage() {
  const { barbershop } = useDashboard();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  // Estados locais para controle de novas pausas e datas bloqueadas
  const [newBreakStart, setNewBreakStart] = useState("12:00");
  const [newBreakEnd, setNewBreakEnd] = useState("13:00");
  const [newBlockDate, setNewBlockDate] = useState("");

  const loadSchedule = async () => {
    if (!barbershop) return;
    try {
      setLoading(true);
      const data = await getSchedule(barbershop.id);
      setSchedule(data);
    } catch (e) {
      error("Erro ao carregar", "Não foi possível recuperar as configurações da sua agenda.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [barbershop]);

  const handleDayToggle = (day: string) => {
    if (!schedule) return;
    setSchedule({
      ...schedule,
      weekly_hours: {
        ...schedule.weekly_hours,
        [day]: {
          ...schedule.weekly_hours[day],
          active: !schedule.weekly_hours[day].active,
        },
      },
    });
  };

  const handleTimeChange = (day: string, type: "open" | "close", value: string) => {
    if (!schedule) return;
    setSchedule({
      ...schedule,
      weekly_hours: {
        ...schedule.weekly_hours,
        [day]: {
          ...schedule.weekly_hours[day],
          [type]: value,
        },
      },
    });
  };

  const handleIntervalChange = (value: number) => {
    if (!schedule) return;
    setSchedule({
      ...schedule,
      interval_minutes: value,
    });
  };

  const handleAddBreak = () => {
    if (!schedule) return;
    
    // Validar se término é maior que início
    if (newBreakStart >= newBreakEnd) {
      error("Erro", "O horário de término da pausa deve ser posterior ao horário de início.");
      return;
    }

    // Verificar se já existe
    const exists = schedule.break_times.some(
      (b) => b.start === newBreakStart && b.end === newBreakEnd
    );
    if (exists) {
      error("Erro", "Este horário de pausa já está cadastrado.");
      return;
    }

    setSchedule({
      ...schedule,
      break_times: [...schedule.break_times, { start: newBreakStart, end: newBreakEnd }].sort(
        (a, b) => a.start.localeCompare(b.start)
      ),
    });
    success("Pausa adicionada", "Pausa inserida temporariamente. Lembre-se de salvar.");
  };

  const handleRemoveBreak = (index: number) => {
    if (!schedule) return;
    setSchedule({
      ...schedule,
      break_times: schedule.break_times.filter((_, i) => i !== index),
    });
    success("Pausa removida", "Pausa removida temporariamente. Lembre-se de salvar.");
  };

  const handleAddBlockedDate = () => {
    if (!schedule || !newBlockDate) return;
    
    if (schedule.blocked_dates.includes(newBlockDate)) {
      error("Erro", "Esta data já está bloqueada.");
      return;
    }

    setSchedule({
      ...schedule,
      blocked_dates: [...schedule.blocked_dates, newBlockDate].sort(),
    });
    setNewBlockDate("");
    success("Data bloqueada", "Data bloqueada temporariamente. Lembre-se de salvar.");
  };

  const handleRemoveBlockedDate = (date: string) => {
    if (!schedule) return;
    setSchedule({
      ...schedule,
      blocked_dates: schedule.blocked_dates.filter((d) => d !== date),
    });
    success("Data liberada", "Data liberada temporariamente. Lembre-se de salvar.");
  };

  const handleSave = async () => {
    if (!schedule) return;
    setSaving(true);
    try {
      await saveSchedule(schedule);
      success("Agenda atualizada!", "Suas configurações de horário foram gravadas com sucesso.");
    } catch (e) {
      error("Erro ao salvar", "Ocorreu uma falha ao persistir as configurações.");
    } finally {
      setSaving(false);
    }
  };

  const daysLabels: { [key: string]: string } = {
    monday: "Segunda-feira",
    tuesday: "Terça-feira",
    wednesday: "Quarta-feira",
    thursday: "Quinta-feira",
    friday: "Sexta-feira",
    saturday: "Sábado",
    sunday: "Domingo",
  };

  const daysOrdered = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-20 w-full rounded-2xl bg-zinc-900/50" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 rounded-2xl bg-zinc-900/50" />
          <div className="h-96 rounded-2xl bg-zinc-900/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      
      {/* Header com botão Salvar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-gold-500" />
            Agenda Inteligente
          </h3>
          <p className="text-xs text-zinc-500 font-medium">Defina seu horário de atendimento, pausas recorrentes e bloqueio de folgas.</p>
        </div>
        
        <Button onClick={handleSave} isLoading={saving} className="text-xs font-semibold gap-1.5 h-10 px-5">
          <Save className="h-4 w-4" />
          Salvar Agenda
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CONFIGURAÇÃO DE HORÁRIOS SEMANAIS */}
        <Card className="lg:col-span-2">
          <div className="px-6 py-4 border-b border-zinc-800/40 bg-zinc-950/20">
            <h4 className="text-sm font-bold text-zinc-200">Dias de Funcionamento</h4>
          </div>
          <CardContent className="p-6 flex flex-col gap-4">
            {schedule &&
              daysOrdered.map((day) => {
                const dayConfig = schedule.weekly_hours[day];
                return (
                  <div
                    key={day}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-xl border transition-all ${
                      dayConfig.active
                        ? "bg-obsidian-900 border-zinc-800"
                        : "bg-zinc-950/40 border-zinc-900 opacity-50"
                    }`}
                  >
                    {/* Dia e Switch */}
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={dayConfig.active}
                        aria-label={`Toggle ${daysLabels[day]}`}
                        onClick={() => handleDayToggle(day)}
                        className={`h-6 w-11 rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer ${
                          dayConfig.active ? "bg-gold-500" : "bg-zinc-800"
                        }`}
                      >
                        <div
                          className={`h-5 w-5 rounded-full bg-obsidian-950 transition-transform ${
                            dayConfig.active ? "transform translate-x-5" : ""
                          }`}
                        />
                      </button>
                      
                      <span className="text-sm font-bold text-zinc-200">{daysLabels[day]}</span>
                    </div>

                    {/* Seleção de Horários */}
                    {dayConfig.active ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={dayConfig.open}
                          onChange={(e) => handleTimeChange(day, "open", e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-zinc-800 text-xs text-zinc-200 bg-obsidian-950 focus:outline-none focus:border-gold-500"
                        />
                        <span className="text-xs text-zinc-500">às</span>
                        <input
                          type="time"
                          value={dayConfig.close}
                          onChange={(e) => handleTimeChange(day, "close", e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-zinc-800 text-xs text-zinc-200 bg-obsidian-950 focus:outline-none focus:border-gold-500"
                        />
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-900">
                        Fechado
                      </span>
                    )}
                  </div>
                );
              })}
          </CardContent>
        </Card>

        {/* INTERVALO, PAUSAS E DATAS BLOQUEADAS */}
        <div className="flex flex-col gap-6">
          
          {/* CONFIGURAÇÃO DE INTERVALOS */}
          <Card>
            <CardContent className="p-6">
              <h4 className="text-sm font-bold text-zinc-200 mb-4">Configurações de Fluxo</h4>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Intervalo entre Agendamentos
                </label>
                <select
                  value={schedule?.interval_minutes}
                  onChange={(e) => handleIntervalChange(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold-500/50 focus:border-gold-500 glass-input text-zinc-100 bg-obsidian-900 border border-zinc-800"
                >
                  <option value="15" className="bg-obsidian-900">15 minutos</option>
                  <option value="30" className="bg-obsidian-900">30 minutos</option>
                  <option value="45" className="bg-obsidian-900">45 minutos</option>
                  <option value="60" className="bg-obsidian-900">1 hora</option>
                </select>
                <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                  Define a frequência de slots disponíveis para agendamento (Ex: a cada 30 min).
                </p>
              </div>
            </CardContent>
          </Card>

          {/* PAUSAS / HORÁRIO DE ALMOÇO */}
          <Card>
            <CardContent className="p-6">
              <h4 className="text-sm font-bold text-zinc-200 mb-2">Pausas Recorrentes (Almoço)</h4>
              <p className="text-[10px] text-zinc-500 mb-4 font-medium">Bloqueia horários da agenda de forma repetitiva todos os dias.</p>
              
              {/* Adicionar Pausa */}
              <div className="flex gap-2 mb-4 items-end">
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase">Início</span>
                  <input
                    type="time"
                    value={newBreakStart}
                    onChange={(e) => setNewBreakStart(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-zinc-800 text-xs text-zinc-200 bg-obsidian-900"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase">Fim</span>
                  <input
                    type="time"
                    value={newBreakEnd}
                    onChange={(e) => setNewBreakEnd(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-zinc-800 text-xs text-zinc-200 bg-obsidian-900"
                  />
                </div>
                <Button type="button" onClick={handleAddBreak} className="h-9 px-3 rounded-lg text-xs">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Lista de Pausas */}
              {schedule && schedule.break_times.length === 0 ? (
                <p className="text-xs text-zinc-600 text-center py-2">Nenhuma pausa cadastrada.</p>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                  {schedule?.break_times.map((brk, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-zinc-950/40 border border-zinc-900/60 p-2 rounded-lg text-xs text-zinc-300">
                      <span>Pausa: {brk.start} às {brk.end}</span>
                      <button
                        onClick={() => handleRemoveBreak(idx)}
                        className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-red-500/5 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* DATAS BLOQUEADAS (FOLGAS/FERIADOS) */}
          <Card>
            <CardContent className="p-6">
              <h4 className="text-sm font-bold text-zinc-200 mb-2">Bloquear Datas Específicas</h4>
              <p className="text-[10px] text-zinc-500 mb-4 font-medium">Folgas, feriados ou férias. Clientes não poderão agendar nessas datas.</p>

              {/* Adicionar Bloqueio */}
              <div className="flex gap-2 mb-4 items-end">
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase">Escolha a data</span>
                  <input
                    type="date"
                    value={newBlockDate}
                    onChange={(e) => setNewBlockDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-zinc-800 text-xs text-zinc-200 bg-obsidian-900"
                  />
                </div>
                <Button type="button" onClick={handleAddBlockedDate} className="h-9 px-3 rounded-lg text-xs">
                  Bloquear
                </Button>
              </div>

              {/* Lista de Bloqueios */}
              {schedule && schedule.blocked_dates.length === 0 ? (
                <p className="text-xs text-zinc-600 text-center py-2">Nenhuma data bloqueada.</p>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                  {schedule?.blocked_dates.map((date) => (
                    <div key={date} className="flex justify-between items-center bg-zinc-950/40 border border-zinc-900/60 p-2 rounded-lg text-xs text-zinc-300">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-red-400" />
                        {new Date(date + "T00:00:00").toLocaleDateString("pt-BR")}
                      </span>
                      <button
                        onClick={() => handleRemoveBlockedDate(date)}
                        className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-red-500/5 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
