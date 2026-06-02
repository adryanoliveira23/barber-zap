"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scissors,
  Calendar,
  Clock,
  User,
  Check,
  CheckCircle2,
  ChevronRight,
  MessageCircle,
  Phone,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
}

const mockServices: Service[] = [
  { id: "1", name: "Corte Degradê", price: 45.00, duration: 40, description: "Corte moderno com acabamento perfeito na navalha." },
  { id: "2", name: "Barba Terapia", price: 35.00, duration: 30, description: "Barba desenhada com toalha quente e óleos essenciais." },
  { id: "3", name: "Combo Cabelo + Barba", price: 70.00, duration: 70, description: "O pacote completo para dar aquele trato no visual." },
  { id: "4", name: "Design de Sobrancelha", price: 15.00, duration: 15, description: "Alinhamento e limpeza de sobrancelha com navalha." },
];

const mockTimes = ["09:00", "10:15", "11:30", "14:00", "15:15", "16:30", "17:45"];

export default function BookingSimulator() {
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [showNotification, setShowNotification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formatar próximas datas
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

  const handleToggleService = (service: Service) => {
    if (selectedServices.some((s) => s.id === service.id)) {
      setSelectedServices(selectedServices.filter((s) => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const getSelectedPrice = () => {
    return selectedServices.reduce((sum, s) => sum + s.price, 0);
  };

  const getSelectedDuration = () => {
    return selectedServices.reduce((sum, s) => sum + s.duration, 0);
  };

  const formatPhone = (value: string) => {
    const raw = value.replace(/\D/g, "");
    if (raw.length <= 2) return raw;
    if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerPhone(formatPhone(e.target.value));
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || customerPhone.length < 14) return;
    
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep(5);
      // Exibir balão do WhatsApp após 1.2 segundos da confirmação
      setTimeout(() => {
        setShowNotification(true);
      }, 1200);
    }, 1500);
  };

  const resetSimulator = () => {
    setStep(1);
    setSelectedServices([]);
    setSelectedDate("");
    setSelectedTime("");
    setCustomerName("");
    setCustomerPhone("");
    setShowNotification(false);
  };

  const getFormattedSelectedDate = () => {
    if (!selectedDate) return "";
    const [year, month, day] = selectedDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  return (
    <div className="relative w-full max-w-[360px] mx-auto z-10">
      {/* Decoração de fundo com brilhos */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-gold-500 to-amber-400 rounded-[44px] blur opacity-30 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
      
      {/* Smartphone Outer Shell */}
      <div className="relative w-full aspect-[9/18.5] bg-zinc-950 rounded-[40px] p-3 border-4 border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Notch/Speaker */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-32 bg-zinc-950 rounded-b-2xl z-50 flex justify-center items-center">
          <div className="h-1.5 w-12 bg-zinc-800 rounded-full mb-1"></div>
        </div>

        {/* Screen Content Area (Simulating light client theme) */}
        <div className="w-full h-full bg-zinc-50 rounded-[30px] overflow-hidden flex flex-col text-zinc-800 relative select-none">
          
          {/* Mock Status Bar */}
          <div className="h-8 w-full bg-zinc-100/80 backdrop-blur-sm border-b border-zinc-200/50 flex justify-between items-center px-6 text-[10px] font-bold text-zinc-500 shrink-0">
            <span>09:41</span>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-[8px] uppercase tracking-wider text-emerald-600">Online</span>
            </div>
          </div>

          {/* Shop Header Cover */}
          {step < 5 && (
            <div className="bg-gradient-to-b from-amber-400/80 to-amber-500 px-4 py-4 pt-3 flex flex-col items-center text-center border-b border-amber-200/40 shrink-0">
              <div className="h-10 w-10 rounded-xl bg-zinc-900 shadow-md flex items-center justify-center font-black text-amber-500 text-sm mb-1">
                BC
              </div>
              <h4 className="text-xs font-black text-zinc-900 leading-tight">Barbearia do Carlos</h4>
              <span className="text-[8px] text-zinc-700 mt-0.5 flex items-center gap-1 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span> Aberto agora
              </span>
            </div>
          )}

          {/* App Progress Bar */}
          {step < 5 && (
            <div className="w-full h-1 bg-zinc-200/70 shrink-0">
              <motion.div 
                className="h-full bg-gold-500" 
                animate={{ width: `${(step / 4) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}

          {/* Steps Content Body */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
            <AnimatePresence mode="wait">
              {/* STEP 1: Services Selection */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-2.5 h-full"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Escolha os Serviços</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-600 font-bold uppercase">Múltipla escolha</span>
                  </div>

                  <div className="flex flex-col gap-2 overflow-y-auto max-h-[220px] pr-0.5 scrollbar-thin">
                    {mockServices.map((service) => {
                      const isSelected = selectedServices.some((s) => s.id === service.id);
                      return (
                        <button
                          key={service.id}
                          onClick={() => handleToggleService(service)}
                          className={`p-3 rounded-xl border text-left flex justify-between items-start transition-all cursor-pointer ${
                            isSelected
                              ? "bg-amber-50/70 border-amber-500 ring-1 ring-amber-300"
                              : "bg-white border-zinc-200 hover:border-amber-300 hover:bg-amber-50/20"
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <h5 className={`text-xs font-bold truncate ${isSelected ? "text-amber-700" : "text-zinc-800"}`}>
                              {service.name}
                            </h5>
                            <p className="text-[9px] text-zinc-500 leading-snug line-clamp-1 mt-0.5">{service.description}</p>
                            <span className="text-[8px] text-zinc-400 mt-1 block font-medium">🕒 {service.duration} min</span>
                          </div>
                          <span className="text-xs font-extrabold text-amber-600 shrink-0">
                            R$ {service.price.toFixed(0)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Summary & Next Button */}
                  {selectedServices.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border-t border-zinc-200 pt-3 mt-auto flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Total ({selectedServices.length})</span>
                        <span className="text-xs font-black text-amber-600">R$ {getSelectedPrice().toFixed(2)}</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setStep(2)}
                        className="h-8 text-[10px] font-bold px-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 gap-1 rounded-lg"
                      >
                        Avançar <ChevronRight className="h-3 w-3" />
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* STEP 2: Date Selection */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-2.5 h-full"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <button onClick={() => setStep(1)} className="text-[9px] text-zinc-400 font-bold hover:text-zinc-600 cursor-pointer">
                      ← Voltar
                    </button>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Escolha a data</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {nextDays.map((day) => {
                      const isSelected = selectedDate === day.dateString;
                      return (
                        <button
                          key={day.dateString}
                          onClick={() => {
                            setSelectedDate(day.dateString);
                            setStep(3);
                          }}
                          className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-amber-500 text-zinc-950 border-amber-500 font-bold shadow-md"
                              : "bg-white border-zinc-200 hover:border-amber-300 text-zinc-600 font-medium"
                          }`}
                        >
                          <span className={`text-[7px] uppercase tracking-wider font-bold ${isSelected ? "text-zinc-900" : "text-zinc-400"}`}>
                            {day.weekday}
                          </span>
                          <span className="text-sm font-extrabold">{day.dayNum}</span>
                          <span className={`text-[7px] uppercase tracking-wider ${isSelected ? "text-zinc-900" : "text-zinc-500"}`}>
                            {day.month}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Time Selection */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-2.5 h-full"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <button onClick={() => setStep(2)} className="text-[9px] text-zinc-400 font-bold hover:text-zinc-600 cursor-pointer">
                      ← Voltar
                    </button>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Escolha o horário</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[220px] pr-0.5">
                    {mockTimes.map((time) => {
                      const isSelected = selectedTime === time;
                      return (
                        <button
                          key={time}
                          onClick={() => {
                            setSelectedTime(time);
                            setStep(4);
                          }}
                          className={`py-2 rounded-lg border text-[10px] font-bold text-center transition-all cursor-pointer ${
                            isSelected
                              ? "bg-amber-500 text-zinc-950 border-amber-500 shadow"
                              : "bg-white border-zinc-200 hover:border-amber-300 text-zinc-700"
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Client Form Details */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-3 h-full"
                >
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setStep(3)} className="text-[9px] text-zinc-400 font-bold hover:text-zinc-600 cursor-pointer">
                      ← Voltar
                    </button>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Confirme seus dados</span>
                  </div>

                  <form onSubmit={handleConfirm} className="flex flex-col gap-2.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] font-bold text-zinc-500 uppercase">Seu Nome</label>
                      <input
                        type="text"
                        placeholder="Ex: Alessandro Silva"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="h-8 px-2.5 rounded-lg border border-zinc-200 bg-white text-[10px] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-400"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] font-bold text-zinc-500 uppercase">WhatsApp (com DDD)</label>
                      <input
                        type="tel"
                        placeholder="Ex: (11) 99999-9999"
                        required
                        value={customerPhone}
                        onChange={handlePhoneChange}
                        maxLength={15}
                        className="h-8 px-2.5 rounded-lg border border-zinc-200 bg-white text-[10px] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-400"
                      />
                    </div>

                    {/* Simple summary card */}
                    <div className="p-2.5 rounded-xl border border-amber-200/50 bg-amber-500/5 text-[9px] text-zinc-600 flex flex-col gap-0.5 mt-1 border-dashed">
                      <span className="font-bold text-amber-700 text-[8px] uppercase tracking-wide">Resumo do Horário</span>
                      <span className="truncate">📋 {selectedServices.map(s => s.name).join(", ")}</span>
                      <span>📅 Dia {getFormattedSelectedDate()} às {selectedTime} ({getSelectedDuration()} min)</span>
                      <span className="font-extrabold text-amber-700 mt-0.5">Total: R$ {getSelectedPrice().toFixed(2)}</span>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || !customerName || customerPhone.length < 14}
                      className="w-full h-8 text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-lg mt-1"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-1 justify-center">
                          <RefreshCw className="h-3 w-3 animate-spin" /> Reservando...
                        </span>
                      ) : (
                        "Confirmar Agendamento"
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* STEP 5: Success & Booking Ticket */}
              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center justify-center py-4 px-1 gap-2.5 h-full"
                >
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 animate-bounce">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-black text-zinc-900">Horário Confirmado! 🎉</h4>
                    <p className="text-[9px] text-zinc-400 leading-normal max-w-[180px] mx-auto mt-0.5">
                      Sua reserva foi concluída. Veja a notificação do WhatsApp enviada acima!
                    </p>
                  </div>

                  <div className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 flex flex-col gap-1 text-[9px] text-zinc-700 text-left my-1 border-dashed">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Cliente:</span>
                      <span className="font-bold truncate max-w-[110px]">{customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Serviço:</span>
                      <span className="font-bold truncate max-w-[110px]">{selectedServices.map(s => s.name).join(", ")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Horário:</span>
                      <span className="font-bold text-amber-600">Dia {getFormattedSelectedDate()} às {selectedTime}</span>
                    </div>
                    <div className="flex justify-between border-t border-zinc-200/60 pt-1.5 mt-1 font-bold">
                      <span className="text-zinc-400">Valor Total:</span>
                      <span className="text-zinc-800">R$ {getSelectedPrice().toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={resetSimulator}
                    className="mt-1 flex items-center justify-center gap-1.5 text-[9px] font-bold text-zinc-400 hover:text-amber-500 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" /> Fazer outro teste
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Simulated WhatsApp Notification Toast Overlay */}
          <AnimatePresence>
            {showNotification && (
              <motion.div
                initial={{ opacity: 0, y: -80, scale: 0.95 }}
                animate={{ opacity: 1, y: 10, scale: 1 }}
                exit={{ opacity: 0, y: -80, scale: 0.95 }}
                className="absolute top-10 left-3 right-3 bg-zinc-900/95 backdrop-blur border border-zinc-800/80 rounded-2xl p-3 shadow-xl z-[100] flex gap-3 text-left"
              >
                <div className="h-8 w-8 rounded-xl bg-emerald-500 flex items-center justify-center text-zinc-950 shrink-0 shadow-lg shadow-emerald-500/25">
                  <MessageCircle className="h-4.5 w-4.5 fill-current" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-extrabold text-emerald-500 uppercase tracking-wider">WhatsApp</span>
                    <span className="text-[8px] text-zinc-500 font-bold">agora</span>
                  </div>
                  <h5 className="text-[10px] font-black text-zinc-100 mt-0.5">Barbearia do Carlos</h5>
                  <p className="text-[9px] text-zinc-400 leading-snug mt-0.5 font-medium line-clamp-3">
                    Olá {customerName}! Seu horário de <span className="text-amber-400 font-bold">{selectedServices.map(s => s.name).join(", ")}</span> está confirmado para <span className="text-zinc-100 font-bold">dia {getFormattedSelectedDate()} às {selectedTime}</span>. Nos vemos lá! 💈
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Simulated Home Indicator Bar */}
          <div className="h-5 w-full bg-zinc-100/50 flex justify-center items-center shrink-0">
            <div className="h-1 w-24 bg-zinc-300 rounded-full"></div>
          </div>

        </div>
      </div>
    </div>
  );
}
