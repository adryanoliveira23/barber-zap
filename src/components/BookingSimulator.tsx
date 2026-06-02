"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  MessageCircle,
  RefreshCw,
  Star,
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

const mockServices: Service[] = [
  { id: "1", name: "Corte Degradê", price: 45, duration: 40 },
  { id: "2", name: "Barba Terapia", price: 35, duration: 30 },
  { id: "3", name: "Combo Cabelo + Barba", price: 70, duration: 70 },
  { id: "4", name: "Design de Sobrancelha", price: 15, duration: 15 },
];

const mockTimes = ["09:00", "10:15", "11:30", "14:00", "15:15", "16:30", "17:45"];

export default function BookingSimulator() {
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getNextDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 1; i <= 4; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      days.push({
        dateString: d.toLocaleDateString("sv-SE"),
        dayNum: d.getDate(),
        month: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        weekday: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
      });
    }
    return days;
  };
  const nextDays = getNextDays();

  const toggleService = (s: Service) =>
    setSelectedServices((prev) =>
      prev.some((x) => x.id === s.id) ? prev.filter((x) => x.id !== s.id) : [...prev, s]
    );

  const totalPrice = selectedServices.reduce((a, s) => a + s.price, 0);
  const totalDuration = selectedServices.reduce((a, s) => a + s.duration, 0);

  const formatPhone = (v: string) => {
    const r = v.replace(/\D/g, "");
    if (r.length <= 2) return r;
    if (r.length <= 7) return `(${r.slice(0, 2)}) ${r.slice(2)}`;
    return `(${r.slice(0, 2)}) ${r.slice(2, 7)}-${r.slice(7, 11)}`;
  };

  const getFormattedDate = () => {
    if (!selectedDate) return "";
    const [y, m, d] = selectedDate.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || customerPhone.length < 14) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep(5);
      setTimeout(() => setShowNotification(true), 1200);
    }, 1500);
  };

  const reset = () => {
    setStep(1); setSelectedServices([]); setSelectedDate("");
    setSelectedTime(""); setCustomerName(""); setCustomerPhone("");
    setShowNotification(false);
  };

  const stepLabels = ["Serviços", "Data", "Horário", "Confirmar"];

  return (
    <div className="relative w-full max-w-[340px] mx-auto select-none">
      {/* Glow aura */}
      <div className="absolute -inset-4 bg-gradient-to-br from-amber-500/20 via-gold-500/10 to-transparent rounded-[60px] blur-2xl pointer-events-none" />

      {/* Floating badges */}
      <motion.div
        initial={{ opacity: 0, x: 40, y: -10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.6, type: "spring" }}
        className="absolute -right-6 top-16 z-20 bg-emerald-500 text-zinc-950 text-[8px] font-black px-2.5 py-1.5 rounded-full shadow-lg shadow-emerald-500/30 flex items-center gap-1 whitespace-nowrap"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-950/40 animate-ping" />
        ONLINE
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -40, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.9, type: "spring" }}
        className="absolute -left-8 bottom-28 z-20 bg-zinc-900 border border-zinc-700/80 text-zinc-200 text-[8px] font-bold px-2.5 py-1.5 rounded-xl shadow-xl flex items-center gap-1.5 whitespace-nowrap"
      >
        <Star className="h-2.5 w-2.5 text-amber-400 fill-current" />
        4.9 · 340 avaliações
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, type: "spring" }}
        className="absolute -right-7 bottom-36 z-20 bg-zinc-900 border border-zinc-700/80 text-[8px] font-bold px-2.5 py-1.5 rounded-xl shadow-xl flex items-center gap-1.5 whitespace-nowrap text-zinc-300"
      >
        💬 Lembrete enviado!
      </motion.div>

      {/* Phone Shell */}
      <div className="relative w-full aspect-[9/19] bg-zinc-950 rounded-[44px] p-[10px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8),inset_0_0_0_1px_rgba(255,255,255,0.06)] border border-zinc-800/60">
        {/* Side buttons */}
        <div className="absolute left-[-3px] top-24 h-10 w-[3px] bg-zinc-700 rounded-l-full" />
        <div className="absolute left-[-3px] top-36 h-16 w-[3px] bg-zinc-700 rounded-l-full" />
        <div className="absolute right-[-3px] top-28 h-14 w-[3px] bg-zinc-700 rounded-r-full" />

        {/* Screen */}
        <div className="w-full h-full bg-zinc-50 rounded-[36px] overflow-hidden flex flex-col text-zinc-800 relative">

          {/* Dynamic Island */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 h-6 w-24 bg-zinc-950 rounded-full z-50 flex items-center justify-center gap-1.5 px-3">
            <div className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
            <div className="h-2 w-2 rounded-full bg-zinc-800/60 border border-zinc-700/60" />
          </div>

          {/* Status bar */}
          <div className="h-10 w-full bg-white/80 backdrop-blur-sm flex justify-between items-end px-5 pb-1.5 text-[9px] font-bold text-zinc-500 shrink-0 border-b border-zinc-100">
            <span className="tracking-tight">09:41</span>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_2px_rgba(34,197,94,0.4)]" />
              <span className="text-[7px] text-emerald-600 font-black uppercase tracking-widest">Online</span>
            </div>
          </div>

          {/* Barbearia Header */}
          {step < 5 && (
            <div className="bg-gradient-to-b from-amber-400 to-amber-500 px-4 pt-2 pb-3 flex flex-col items-center text-center shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0,0,0,.15) 8px, rgba(0,0,0,.15) 9px)" }} />
              <div className="relative h-10 w-10 rounded-2xl bg-zinc-900 shadow-lg shadow-zinc-900/40 flex items-center justify-center font-black text-amber-400 text-sm mb-1.5 border border-zinc-800">
                BC
              </div>
              <h4 className="text-[11px] font-black text-zinc-900 relative">Barbearia do Carlos</h4>
              <span className="text-[8px] text-zinc-800/70 mt-0.5 flex items-center gap-1 font-semibold relative">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shadow-[0_0_4px_2px_rgba(22,163,74,0.5)]" />
                Aberto agora
              </span>
            </div>
          )}

          {/* Step indicators */}
          {step < 5 && (
            <div className="flex items-center gap-0 px-3 py-2 bg-white border-b border-zinc-100 shrink-0">
              {stepLabels.map((label, i) => {
                const idx = i + 1;
                const done = step > idx;
                const active = step === idx;
                return (
                  <React.Fragment key={idx}>
                    <div className="flex flex-col items-center gap-0.5 flex-1">
                      <div className={`h-4 w-4 rounded-full flex items-center justify-center text-[7px] font-black transition-all duration-300 ${
                        done ? "bg-emerald-500 text-white" : active ? "bg-amber-500 text-zinc-900" : "bg-zinc-200 text-zinc-400"
                      }`}>
                        {done ? "✓" : idx}
                      </div>
                      <span className={`text-[6px] font-bold uppercase tracking-wider ${active ? "text-amber-600" : done ? "text-emerald-600" : "text-zinc-400"}`}>{label}</span>
                    </div>
                    {i < stepLabels.length - 1 && (
                      <div className={`h-px flex-1 mx-0.5 transition-colors duration-300 ${step > idx ? "bg-emerald-400" : "bg-zinc-200"}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <AnimatePresence mode="wait">

              {/* STEP 1: Services */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }} className="p-3 flex flex-col gap-2">
                  <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest px-0.5">Escolha os serviços</p>
                  <div className="flex flex-col gap-1.5">
                    {mockServices.map((service) => {
                      const sel = selectedServices.some((s) => s.id === service.id);
                      return (
                        <button key={service.id} onClick={() => toggleService(service)}
                          className={`p-2.5 rounded-xl border text-left flex justify-between items-center gap-2 transition-all cursor-pointer ${
                            sel ? "bg-amber-50 border-amber-400 ring-1 ring-amber-300/50" : "bg-white border-zinc-200 hover:border-amber-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="min-w-0">
                              <p className={`text-[10px] font-bold truncate ${sel ? "text-amber-700" : "text-zinc-800"}`}>{service.name}</p>
                              <p className="text-[7px] text-zinc-400 font-medium">{service.duration} min</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-extrabold text-amber-600">R${service.price}</span>
                            <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all ${sel ? "bg-amber-500 border-amber-500" : "border-zinc-300"}`}>
                              {sel && <span className="text-white text-[7px] font-black">✓</span>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <AnimatePresence>
                    {selectedServices.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                        className="flex items-center justify-between bg-amber-500 rounded-xl px-3 py-2 mt-1 cursor-pointer"
                        onClick={() => setStep(2)}
                      >
                        <div>
                          <p className="text-[8px] font-black text-zinc-900 uppercase">Total: R${totalPrice}</p>
                          <p className="text-[7px] text-zinc-900/60 font-medium">{selectedServices.length} serviço(s) · {totalDuration}min</p>
                        </div>
                        <div className="flex items-center gap-1 text-zinc-900 font-black text-[9px]">
                          Avançar <ChevronRight className="h-3 w-3" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* STEP 2: Date */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }} className="p-3 flex flex-col gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setStep(1)} className="text-[8px] text-amber-600 font-bold cursor-pointer">← Voltar</button>
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Escolha a data</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {nextDays.map((day) => {
                      const sel = selectedDate === day.dateString;
                      return (
                        <button key={day.dateString} onClick={() => { setSelectedDate(day.dateString); setStep(3); }}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                            sel ? "bg-amber-500 border-amber-500 shadow-md shadow-amber-500/20" : "bg-white border-zinc-200 hover:border-amber-300"
                          }`}
                        >
                          <span className={`text-[7px] uppercase tracking-widest font-bold ${sel ? "text-zinc-900" : "text-zinc-400"}`}>{day.weekday}</span>
                          <span className={`text-xl font-black ${sel ? "text-zinc-900" : "text-zinc-700"}`}>{day.dayNum}</span>
                          <span className={`text-[7px] uppercase tracking-wide font-semibold ${sel ? "text-zinc-900/70" : "text-zinc-400"}`}>{day.month}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Time */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }} className="p-3 flex flex-col gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setStep(2)} className="text-[8px] text-amber-600 font-bold cursor-pointer">← Voltar</button>
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Escolha o horário</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {mockTimes.map((time) => {
                      const sel = selectedTime === time;
                      return (
                        <button key={time} onClick={() => { setSelectedTime(time); setStep(4); }}
                          className={`py-2 rounded-xl border text-[10px] font-bold text-center transition-all cursor-pointer ${
                            sel ? "bg-amber-500 border-amber-500 text-zinc-950 shadow" : "bg-white border-zinc-200 hover:border-amber-300 text-zinc-700"
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Confirm */}
              {step === 4 && (
                <motion.div key="s4" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }} className="p-3 flex flex-col gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setStep(3)} className="text-[8px] text-amber-600 font-bold cursor-pointer">← Voltar</button>
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Seus dados</span>
                  </div>
                  {/* Summary pill */}
                  <div className="bg-amber-500/8 border border-amber-400/30 rounded-xl p-2.5 flex flex-col gap-0.5 border-dashed">
                    <p className="text-[8px] font-black text-amber-700 uppercase tracking-wider">Resumo</p>
                    <p className="text-[9px] text-zinc-600 font-medium truncate">{selectedServices.map(s => s.name).join(", ")}</p>
                    <p className="text-[8px] text-zinc-500">Dia {getFormattedDate()} às {selectedTime} · {totalDuration}min</p>
                    <p className="text-[9px] font-black text-amber-700 mt-0.5">R$ {totalPrice.toFixed(2)}</p>
                  </div>
                  <form onSubmit={handleConfirm} className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[7px] font-bold text-zinc-400 uppercase tracking-wider">Seu Nome</label>
                      <input type="text" placeholder="Ex: Alessandro Silva" required value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="h-8 px-2.5 rounded-lg border border-zinc-200 bg-white text-[10px] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-400 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[7px] font-bold text-zinc-400 uppercase tracking-wider">WhatsApp (com DDD)</label>
                      <input type="tel" placeholder="(11) 99999-9999" required value={customerPhone}
                        onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
                        maxLength={15}
                        className="h-8 px-2.5 rounded-lg border border-zinc-200 bg-white text-[10px] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-400 transition-all"
                      />
                    </div>
                    <button type="submit" disabled={isSubmitting || !customerName || customerPhone.length < 14}
                      className="w-full h-9 text-[10px] font-black bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-zinc-950 rounded-xl mt-1 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/25"
                    >
                      {isSubmitting ? <><RefreshCw className="h-3 w-3 animate-spin" /> Reservando...</> : "Confirmar Agendamento"}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* STEP 5: Success */}
              {step === 5 && (
                <motion.div key="s5" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center justify-center py-6 px-4 gap-3 h-full min-h-[300px]">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
                    className="h-14 w-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-500"
                  >
                    <CheckCircle2 className="h-7 w-7" />
                  </motion.div>
                  <div>
                    <h4 className="text-sm font-black text-zinc-900">Horário Confirmado! 🎉</h4>
                    <p className="text-[9px] text-zinc-400 leading-relaxed max-w-[180px] mx-auto mt-1">
                      Você receberá uma confirmação no WhatsApp em instantes!
                    </p>
                  </div>
                  <div className="w-full bg-white border border-zinc-200 rounded-xl p-2.5 text-left flex flex-col gap-1 border-dashed">
                    {[
                      ["Cliente", customerName],
                      ["Serviço", selectedServices.map(s => s.name).join(", ")],
                      ["Horário", `Dia ${getFormattedDate()} às ${selectedTime}`],
                      ["Total", `R$ ${totalPrice.toFixed(2)}`],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between text-[8px]">
                        <span className="text-zinc-400 font-bold">{label}:</span>
                        <span className="font-black text-zinc-800 truncate max-w-[120px] text-right">{val}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={reset} className="flex items-center gap-1 text-[8px] font-bold text-zinc-400 hover:text-amber-500 transition-colors cursor-pointer mt-1">
                    <RefreshCw className="h-2.5 w-2.5" /> Fazer outro teste
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* WhatsApp Notification */}
          <AnimatePresence>
            {showNotification && (
              <motion.div
                initial={{ opacity: 0, y: -90, scale: 0.9 }}
                animate={{ opacity: 1, y: 8, scale: 1 }}
                exit={{ opacity: 0, y: -90 }}
                transition={{ type: "spring", damping: 20 }}
                className="absolute top-10 left-3 right-3 bg-zinc-900/96 backdrop-blur-md border border-zinc-700/60 rounded-2xl p-3 shadow-2xl z-[100] flex gap-2.5"
              >
                <div className="h-8 w-8 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
                  <MessageCircle className="h-4 w-4 fill-white text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-wider">WhatsApp</span>
                    <span className="text-[7px] text-zinc-500 font-bold">agora</span>
                  </div>
                  <p className="text-[8px] font-black text-zinc-100 mt-0.5">Barbearia do Carlos</p>
                  <p className="text-[8px] text-zinc-400 leading-snug mt-0.5 line-clamp-2">
                    Olá <span className="text-zinc-200 font-bold">{customerName}</span>! Seu agendamento de{" "}
                    <span className="text-amber-400 font-bold">{selectedServices.map(s => s.name).join(", ")}</span>{" "}
                    está confirmado para dia <span className="text-zinc-100 font-bold">{getFormattedDate()} às {selectedTime}</span>. Nos vemos lá!
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Home bar */}
          <div className="h-5 w-full bg-white flex justify-center items-center shrink-0">
            <div className="h-1 w-20 bg-zinc-300 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
