"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { getSchedule, saveSchedule, Schedule } from "@/lib/db";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CalendarClock,
  Coffee,
  Ban,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
} from "lucide-react";

const DAYS = [
  { key: "monday", label: "Segunda-feira", short: "Seg" },
  { key: "tuesday", label: "Terça-feira", short: "Ter" },
  { key: "wednesday", label: "Quarta-feira", short: "Qua" },
  { key: "thursday", label: "Quinta-feira", short: "Qui" },
  { key: "friday", label: "Sexta-feira", short: "Sex" },
  { key: "saturday", label: "Sábado", short: "Sáb" },
  { key: "sunday", label: "Domingo", short: "Dom" },
];

const INTERVAL_OPTIONS = [15, 20, 30, 45, 60];

type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export default function SchedulePage() {
  const { barbershop } = useDashboard();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<Schedule | null>(null);

  const loadSchedule = useCallback(async () => {
    if (!barbershop) return;
    try {
      setLoading(true);
      const s = await getSchedule(barbershop.id);
      setSchedule(s);
    } catch (e) {
      error("Erro", "Não foi possível carregar os horários de funcionamento.");
    } finally {
      setLoading(false);
    }
  }, [barbershop, error]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const handleDayToggle = (dayKey: DayKey) => {
    if (!schedule) return;
    setSchedule((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        weekly_hours: {
          ...prev.weekly_hours,
          [dayKey]: {
            ...prev.weekly_hours[dayKey],
            active: !prev.weekly_hours[dayKey].active,
          },
        },
      };
    });
  };

  const handleDayTimeChange = (dayKey: DayKey, field: "open" | "close", value: string) => {
    if (!schedule) return;
    setSchedule((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        weekly_hours: {
          ...prev.weekly_hours,
          [dayKey]: {
            ...prev.weekly_hours[dayKey],
            [field]: value,
          },
        },
      };
    });
  };

  const handleIntervalChange = (minutes: number) => {
    if (!schedule) return;
    setSchedule((prev) => prev ? { ...prev, interval_minutes: minutes } : prev);
  };

  const handleAddBreak = () => {
    if (!schedule) return;
    setSchedule((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        break_times: [...prev.break_times, { start: "12:00", end: "13:00" }],
      };
    });
  };

  const handleRemoveBreak = (idx: number) => {
    if (!schedule) return;
    setSchedule((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        break_times: prev.break_times.filter((_, i) => i !== idx),
      };
    });
  };

  const handleBreakChange = (idx: number, field: "start" | "end", value: string) => {
    if (!schedule) return;
    setSchedule((prev) => {
      if (!prev) return prev;
      const updated = [...prev.break_times];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, break_times: updated };
    });
  };

  const handleAddBlockedDate = () => {
    if (!schedule) return;
    const today = new Date().toLocaleDateString("sv-SE");
    if (schedule.blocked_dates.includes(today)) return;
    setSchedule((prev) => {
      if (!prev) return prev;
      return { ...prev, blocked_dates: [...prev.blocked_dates, today] };
    });
  };

  const handleRemoveBlockedDate = (dateStr: string) => {
    if (!schedule) return;
    setSchedule((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        blocked_dates: prev.blocked_dates.filter((d) => d !== dateStr),
      };
    });
  };

  const handleBlockedDateChange = (oldDate: string, newDate: string) => {
    if (!schedule) return;
    setSchedule((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        blocked_dates: prev.blocked_dates.map((d) => (d === oldDate ? newDate : d)),
      };
    });
  };

  const handleSave = async () => {
    if (!schedule) return;
    setSaving(true);
    try {
      await saveSchedule(schedule);
      success("Salvo!", "Horários de funcionamento atualizados com sucesso.");
    } catch (e: any) {
      error("Erro ao salvar", e.message || "Não foi possível salvar os horários.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gold-500/10 border border-gold-500/30 animate-pulse" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-48 bg-zinc-800 rounded animate-pulse" />
            <div className="h-3 w-64 bg-zinc-800/60 rounded animate-pulse" />
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 w-full rounded-xl bg-zinc-900/50 border border-zinc-800/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!schedule) return null;

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-10">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-500">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Horários de Funcionamento</h1>
            <p className="text-xs text-zinc-500">
              Defina os dias e horários em que sua barbearia aceita agendamentos.
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          isLoading={saving}
          className="hidden sm:flex bg-gold-500 hover:bg-gold-600 text-obsidian-950 font-black h-10 px-5 transition-all"
        >
          <Save className="h-4 w-4 mr-2" />
          Salvar
        </Button>
      </div>

      {/* ── Seção 1: Dias da Semana ── */}
      <Card className="border-zinc-800/80 bg-obsidian-900/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-500/30 via-gold-500 to-gold-500/30" />
        <CardContent className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-gold-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500">
              Dias e Horários
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            {DAYS.map(({ key, label, short }) => {
              const dayData = schedule.weekly_hours[key] || { active: false, open: "09:00", close: "18:00" };
              const isActive = dayData.active;
              return (
                <div
                  key={key}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl border transition-all ${
                    isActive
                      ? "border-gold-500/20 bg-obsidian-950/60"
                      : "border-zinc-800/40 bg-zinc-900/20 opacity-60"
                  }`}
                >
                  {/* Toggle + Day Label */}
                  <div className="flex items-center gap-3 w-full sm:w-40 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDayToggle(key as DayKey)}
                      className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                        isActive ? "bg-gold-500" : "bg-zinc-700"
                      }`}
                      aria-label={`Ativar ${label}`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          isActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className={`text-sm font-semibold ${isActive ? "text-zinc-200" : "text-zinc-500"}`}>
                      <span className="hidden sm:inline">{label}</span>
                      <span className="sm:hidden">{short}</span>
                    </span>
                  </div>

                  {/* Time inputs */}
                  <div className={`flex items-center gap-2 flex-1 transition-opacity ${isActive ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                    <div className="flex flex-col gap-0.5 flex-1">
                      <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Abre</label>
                      <input
                        type="time"
                        value={dayData.open}
                        onChange={(e) => handleDayTimeChange(key as DayKey, "open", e.target.value)}
                        disabled={!isActive}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-800/80 bg-obsidian-950/80 text-zinc-200 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500/25 outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                    </div>
                    <span className="text-zinc-600 font-bold mt-4">→</span>
                    <div className="flex flex-col gap-0.5 flex-1">
                      <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Fecha</label>
                      <input
                        type="time"
                        value={dayData.close}
                        onChange={(e) => handleDayTimeChange(key as DayKey, "close", e.target.value)}
                        disabled={!isActive}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-800/80 bg-obsidian-950/80 text-zinc-200 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500/25 outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Seção 2: Intervalo entre Agendamentos ── */}
      <Card className="border-zinc-800/80 bg-obsidian-900/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-500/30 via-gold-500 to-gold-500/30" />
        <CardContent className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-gold-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500">
              Intervalo entre Agendamentos
            </h3>
          </div>
          <p className="text-xs text-zinc-500 -mt-2">
            Define de quanto em quanto tempo os clientes podem agendar um horário.
          </p>
          <div className="flex flex-wrap gap-2">
            {INTERVAL_OPTIONS.map((min) => {
              const isSelected = schedule.interval_minutes === min;
              return (
                <button
                  key={min}
                  type="button"
                  onClick={() => handleIntervalChange(min)}
                  className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-gold-500 border-gold-500 text-obsidian-950 shadow-md shadow-gold-500/10"
                      : "bg-obsidian-950/60 border-zinc-800 text-zinc-400 hover:border-gold-500/40 hover:text-zinc-200"
                  }`}
                >
                  {min} min
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Seção 3: Intervalos / Pausas ── */}
      <Card className="border-zinc-800/80 bg-obsidian-900/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-500/30 via-gold-500 to-gold-500/30" />
        <CardContent className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Coffee className="h-4 w-4 text-gold-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500">
                Pausas (Almoço, Intervalo)
              </h3>
            </div>
            <button
              type="button"
              onClick={handleAddBreak}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-500 hover:bg-gold-500/20 text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar Pausa
            </button>
          </div>
          <p className="text-xs text-zinc-500 -mt-2">
            Horários bloqueados diariamente em todos os dias ativos.
          </p>

          {schedule.break_times.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-center flex-col gap-2">
              <Coffee className="h-8 w-8 text-zinc-700" />
              <p className="text-xs text-zinc-600 font-medium">Nenhuma pausa configurada.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {schedule.break_times.map((brk, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800/60 bg-obsidian-950/40">
                  <div className="flex flex-col gap-0.5 flex-1">
                    <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Início</label>
                    <input
                      type="time"
                      value={brk.start}
                      onChange={(e) => handleBreakChange(idx, "start", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-800/80 bg-obsidian-950/80 text-zinc-200 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500/25 outline-none transition-all"
                    />
                  </div>
                  <span className="text-zinc-600 font-bold mt-4">→</span>
                  <div className="flex flex-col gap-0.5 flex-1">
                    <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Fim</label>
                    <input
                      type="time"
                      value={brk.end}
                      onChange={(e) => handleBreakChange(idx, "end", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-800/80 bg-obsidian-950/80 text-zinc-200 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500/25 outline-none transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveBreak(idx)}
                    className="mt-4 p-2 rounded-lg border border-red-500/10 bg-red-500/5 hover:bg-red-500/15 text-red-400 transition-all cursor-pointer shrink-0"
                    title="Remover pausa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Seção 4: Datas Bloqueadas ── */}
      <Card className="border-zinc-800/80 bg-obsidian-900/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-500/30 via-gold-500 to-gold-500/30" />
        <CardContent className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Ban className="h-4 w-4 text-gold-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500">
                Datas Bloqueadas
              </h3>
            </div>
            <button
              type="button"
              onClick={handleAddBlockedDate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-500 hover:bg-gold-500/20 text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Bloquear Data
            </button>
          </div>
          <p className="text-xs text-zinc-500 -mt-2">
            Feriados, férias ou dias específicos em que a barbearia estará fechada.
          </p>

          {schedule.blocked_dates.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-center flex-col gap-2">
              <CheckCircle2 className="h-8 w-8 text-zinc-700" />
              <p className="text-xs text-zinc-600 font-medium">Nenhuma data bloqueada.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {schedule.blocked_dates
                .slice()
                .sort()
                .map((dateStr) => (
                  <div key={dateStr} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800/60 bg-obsidian-950/40">
                    <Ban className="h-4 w-4 text-red-400 shrink-0" />
                    <input
                      type="date"
                      value={dateStr}
                      onChange={(e) => handleBlockedDateChange(dateStr, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-zinc-800/80 bg-obsidian-950/80 text-zinc-200 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500/25 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveBlockedDate(dateStr)}
                      className="p-2 rounded-lg border border-red-500/10 bg-red-500/5 hover:bg-red-500/15 text-red-400 transition-all cursor-pointer shrink-0"
                      title="Remover data bloqueada"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button (mobile) */}
      <Button
        onClick={handleSave}
        isLoading={saving}
        className="sm:hidden w-full bg-gold-500 hover:bg-gold-600 text-obsidian-950 font-black h-11 transition-all"
      >
        <Save className="h-4 w-4 mr-2" />
        Salvar Horários
      </Button>
    </div>
  );
}
