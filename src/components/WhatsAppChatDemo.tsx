"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  User,
  Check,
  CheckCheck,
  Smartphone,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Calendar,
  Gift,
  Clock
} from "lucide-react";

interface Message {
  id: string;
  sender: "ai" | "client";
  text: string;
  time: string;
  buttons?: string[];
  isTemplate?: boolean;
}

interface Scenario {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  messages: Message[];
}

export default function WhatsAppChatDemo() {
  const [activeScenario, setActiveScenario] = useState(1);
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scenarios: Scenario[] = [
    {
      id: 1,
      title: "Confirmação Automática",
      description: "Como a IA confirma horários e reduz faltas em até 80%",
      icon: ShieldCheck,
      messages: [
        {
          id: "1-1",
          sender: "ai",
          text: "Olá Alessandro! ✂️ Aqui é o assistente virtual da *Barbearia do Carlos*.\n\nPassando para lembrar do seu horário de *Corte Degradê* amanhã às *14:00*.\n\nPodemos confirmar a sua presença?",
          time: "10:30",
          buttons: ["✅ Confirmar Presença", "🔄 Reagendar"],
          isTemplate: true
        },
        {
          id: "1-2",
          sender: "client",
          text: "✅ Confirmar Presença",
          time: "10:31"
        },
        {
          id: "1-3",
          sender: "ai",
          text: "Perfeito, Alessandro! Sua presença foi confirmada no sistema. O Carlos já está com tudo pronto para te receber. Até amanhã! 🤝💈",
          time: "10:31"
        }
      ]
    },
    {
      id: 2,
      title: "Reagendamento Inteligente",
      description: "A IA resolve imprevistos e remarca o cliente sem intervenção humana",
      icon: Clock,
      messages: [
        {
          id: "2-1",
          sender: "ai",
          text: "Olá Alessandro! Lembramos do seu horário de *Corte + Barba* amanhã às *14:00*. Tudo certo para amanhã?",
          time: "14:15",
          buttons: ["✅ Confirmar", "🔄 Reagendar"],
          isTemplate: true
        },
        {
          id: "2-2",
          sender: "client",
          text: "Tenho um imprevisto, posso reagendar para mais tarde?",
          time: "14:16"
        },
        {
          id: "2-3",
          sender: "ai",
          text: "Sem problemas! O sistema localizou seu agendamento.\n\nTenho estes horários livres para amanhã (Segunda-feira):\n\n1️⃣ *15:15*\n2️⃣ *16:30*\n3️⃣ *17:45*\n\nQual deles fica melhor para você?",
          time: "14:16",
          buttons: ["🕒 15:15", "🕒 16:30", "🕒 17:45"],
          isTemplate: true
        },
        {
          id: "2-4",
          sender: "client",
          text: "🕒 15:15",
          time: "14:17"
        },
        {
          id: "2-5",
          sender: "ai",
          text: "Processando alteração... 🔄",
          time: "14:17"
        },
        {
          id: "2-6",
          sender: "ai",
          text: "Pronto! Seu horário foi reagendado para amanhã às *15:15*. O Carlos já foi notificado. Novo lembrete enviado com sucesso! 📅✨",
          time: "14:17"
        }
      ]
    },
    {
      id: 3,
      title: "Cartão Fidelidade Digital",
      description: "Disparo automático de prêmios que fideliza o cliente",
      icon: Gift,
      messages: [
        {
          id: "3-1",
          sender: "ai",
          text: "Fala Alessandro! 💈 Seu corte de hoje foi concluído. Com isso, você completou *10 cortes* no seu Cartão Fidelidade Digital! 🎉",
          time: "18:40"
        },
        {
          id: "3-2",
          sender: "ai",
          text: "Parabéns! Você ganhou *1 Corte Totalmente Grátis* para usar na sua próxima visita! 🎁\n\nGostaria de já deixar agendado o seu corte de cortesia?",
          time: "18:40",
          buttons: ["📅 Agendar Grátis", "Deixar para depois"],
          isTemplate: true
        },
        {
          id: "3-3",
          sender: "client",
          text: "📅 Agendar Grátis",
          time: "18:41"
        },
        {
          id: "3-4",
          sender: "ai",
          text: "Excelente escolha! Clique no link abaixo para escolher a data e garantir sua vaga cortesia:\n\n🔗 *barberzap.com/carlos/resgatar-fidelidade*",
          time: "18:41"
        }
      ]
    }
  ];

  const currentScenario = scenarios.find(s => s.id === activeScenario) || scenarios[0];

  useEffect(() => {
    // Reset and start animation whenever scenario changes
    setVisibleMessages([]);
    setStepIndex(0);
    setIsAiTyping(false);

    // Start sequence
    runSequence(0);
  }, [activeScenario]);

  // Auto-scroll APENAS dentro do container do chat (manipulando scrollTop diretamente)
  // Não usa scrollIntoView pois pode rolar a página inteira junto
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const id = requestAnimationFrame(() => {
      // Manipulação direta de scrollTop do container - não afeta o viewport da página
      try {
        container.scrollTop = container.scrollHeight;
      } catch {
        // ignora erros de DOM
      }
    });
    return () => cancelAnimationFrame(id);
  }, [visibleMessages, isAiTyping]);

  const runSequence = (index: number) => {
    const msgs = currentScenario.messages;
    if (index >= msgs.length) return;

    const currentMsg = msgs[index];
    setStepIndex(index);

    if (currentMsg.sender === "ai") {
      setIsAiTyping(true);
      const delay = index === 0 ? 800 : 1500;
      setTimeout(() => {
        setIsAiTyping(false);
        setVisibleMessages(prev => [...prev, currentMsg]);

        // Schedule next message if not waiting for client action
        const nextIndex = index + 1;
        if (nextIndex < msgs.length) {
          const nextMsg = msgs[nextIndex];
          if (nextMsg.sender === "ai") {
            // AI continues talking
            setTimeout(() => runSequence(nextIndex), 1000);
          } else {
            // It's a client action, wait for client click or simulate after 2s
            setTimeout(() => runSequence(nextIndex), 2000);
          }
        }
      }, delay);
    } else {
      // Simulating client typing/replying
      setTimeout(() => {
        setVisibleMessages(prev => [...prev, currentMsg]);
        // Schedule next AI message
        setTimeout(() => runSequence(index + 1), 1000);
      }, 1000);
    }
  };

  const handleButtonClick = (buttonText: string) => {
    const nextIndex = stepIndex + 1;
    const msgs = currentScenario.messages;
    if (nextIndex < msgs.length && msgs[nextIndex].sender === "client" && msgs[nextIndex].text.toLowerCase().includes(buttonText.toLowerCase().replace(/[^a-zA-Z0-9]/g, ""))) {
      // The user clicked the correct button to advance the conversation
      // We skip the timeout and push it instantly
      setVisibleMessages(prev => [...prev, msgs[nextIndex]]);
      setTimeout(() => runSequence(nextIndex + 1), 1000);
    }
  };

  const resetDemo = () => {
    setVisibleMessages([]);
    setStepIndex(0);
    setIsAiTyping(false);
    setTimeout(() => runSequence(0), 400);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-stretch justify-center py-6">
      {/* Controls / Tabs Column */}
      <div className="flex flex-col gap-3 justify-center md:w-1/3 shrink-0">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-[10px] text-gold-500 font-extrabold uppercase tracking-wider self-start mb-2">
          <Sparkles className="h-3 w-3" /> Escolha o fluxo para ver
        </div>
        <h3 className="text-xl md:text-2xl font-black text-zinc-100 leading-tight">
          Assista à IA em <span className="text-gold-500">ação real</span>
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed mb-4">
          Nossa inteligência artificial conversa de forma humanizada, negocia horários e ajuda a fidelizar sua clientela sem você tocar no celular.
        </p>

        <div className="flex flex-col gap-2.5">
          {scenarios.map((scenario) => {
            const Icon = scenario.icon;
            const active = scenario.id === activeScenario;
            return (
              <button
                key={scenario.id}
                onClick={() => setActiveScenario(scenario.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-300 flex items-start gap-3.5 group cursor-pointer ${active
                  ? "bg-zinc-900 border-gold-500/30 shadow-lg shadow-gold-500/5 ring-1 ring-gold-500/20"
                  : "bg-obsidian-900/30 border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/50"
                  }`}
              >
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${active ? "bg-gold-500/10 border border-gold-500/30 text-gold-500" : "bg-zinc-800/40 border border-zinc-800/80 text-zinc-400 group-hover:text-zinc-350"
                  }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h4 className={`text-xs font-bold transition-colors ${active ? "text-gold-400" : "text-zinc-300 group-hover:text-zinc-200"}`}>
                    {scenario.title}
                  </h4>
                  <p className="text-[10px] text-zinc-500 leading-tight mt-1 truncate">
                    {scenario.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={resetDemo}
          className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 hover:text-gold-500 transition-colors self-start px-3 py-1.5 rounded-lg hover:bg-zinc-900/60 border border-transparent hover:border-zinc-800 cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" /> Reiniciar Conversa
        </button>
      </div>

      {/* WhatsApp Window Column */}
      <div className="flex-1 min-w-0 flex items-center justify-center">
        <div className="w-full max-w-[370px] h-[700px] sm:h-[750px] rounded-[38px] p-2.5 bg-zinc-950 border border-zinc-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden">

          {/* Dynamic Island */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 h-5 w-20 bg-zinc-950 rounded-full z-50 flex items-center justify-center gap-1 px-3">
            <div className="h-1 w-1 rounded-full bg-zinc-700" />
            <div className="h-1.5 w-1.5 rounded-full bg-zinc-800/60 border border-zinc-700/60" />
          </div>

          {/* Screen Content Wrapper */}
          <div className="w-full h-full bg-[#0b141a] rounded-[30px] overflow-hidden flex flex-col relative text-zinc-200 font-sans">

            {/* WhatsApp Header */}
            <div className="bg-[#121b22] px-4 pt-6 pb-2.5 flex items-center justify-between border-b border-zinc-800/50 shrink-0">
              <div className="flex items-center gap-2.5 mt-2">
                <div className="h-8 w-8 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-500 relative shrink-0">
                  <MessageSquare className="h-4 w-4" />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-[#121b22]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-zinc-100 truncate">Assistente BarberZap</span>
                    <span className="h-3 w-3 bg-emerald-500 rounded-full flex items-center justify-center text-[7px] text-zinc-950 font-black scale-90">✓</span>
                  </div>
                  <span className="text-[8px] text-zinc-400 block mt-0.5 leading-none">
                    {isAiTyping ? (
                      <span className="text-emerald-400 font-semibold animate-pulse">digitando...</span>
                    ) : (
                      "online"
                    )}
                  </span>
                </div>
              </div>

              {/* WhatsApp Call / Video Icons Mock */}
              <div className="flex items-center gap-3 text-zinc-400 mt-2">
                <div className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                <div className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                <div className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
              </div>
            </div>

            {/* Chat Wallpaper Background Overlay */}
            <div className="absolute inset-0 top-[52px] bottom-[48px] opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath fill-rule='evenodd' d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zM11 61c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm74-7c0 3.866-3.134 7-7 7s-7-3.134-7-7 3.134-7 7-7 7 3.134 7 7zM44 70c0 2.21-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4 4 1.79 4 4z'/%3E%3C/g%3E%3C/svg%3E")`
              }}
            />

            {/* Chat Messages Body */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 relative z-10">

              {/* Encryption Notice */}
              <div className="bg-[#182229] border border-zinc-800/30 rounded-lg p-2 text-center max-w-[240px] mx-auto mb-1 shrink-0 shadow-sm">
                <p className="text-[7px] text-zinc-400 leading-snug">
                  🔒 As mensagens são criptografadas de ponta a ponta. A BarberZap protege seu negócio.
                </p>
              </div>

              {/* Message History */}
              <AnimatePresence initial={false}>
                {visibleMessages.map((msg) => {
                  const isAi = msg.sender === "ai";
                  return (
                    <motion.div
                      key={`${activeScenario}-${msg.id}`}
                      initial={{ opacity: 0, y: 12, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring", damping: 22, stiffness: 220 }}
                      className={`flex flex-col max-w-[85%] ${isAi ? "self-start" : "self-end"}`}
                    >
                      <div className={`p-2.5 rounded-2xl shadow-sm text-[9.5px] leading-relaxed relative ${isAi
                        ? "bg-[#202c33] text-zinc-100 rounded-tl-none border border-zinc-800/40"
                        : "bg-[#005c4b] text-zinc-100 rounded-tr-none border border-emerald-800/40"
                        }`}>

                        {/* Text Content */}
                        <p className="whitespace-pre-line font-medium">
                          {/* Parse markdown bold format manually or simply styled */}
                          {msg.text.split("\n").map((line, lIdx) => (
                            <span key={lIdx} className="block min-h-[5px]">
                              {line.split("*").map((chunk, cIdx) =>
                                cIdx % 2 === 1 ? <strong key={cIdx} className="font-extrabold text-gold-400">{chunk}</strong> : chunk
                              )}
                            </span>
                          ))}
                        </p>

                        {/* Message Time and Status */}
                        <div className="flex items-center justify-end gap-1.5 mt-1.5">
                          <span className="text-[6.5px] text-zinc-400/80 font-semibold">{msg.time}</span>
                          {!isAi && (
                            <CheckCheck className="h-3 w-3 text-sky-400" />
                          )}
                        </div>
                      </div>

                      {/* Interactive Buttons (WhatsApp Templates) */}
                      {isAi && msg.buttons && msg.buttons.length > 0 && (
                        <div className="flex flex-col gap-1 mt-1.5 w-full">
                          {msg.buttons.map((btn, bIdx) => (
                            <button
                              key={bIdx}
                              onClick={() => handleButtonClick(btn)}
                              className="w-full bg-[#202c33] hover:bg-[#2a3942] active:bg-[#1f2c34] text-sky-400 font-bold py-2 px-3 rounded-xl border border-zinc-800/40 text-[9px] transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                            >
                              {btn}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                {/* AI Typing Indicator Bubble */}
                {isAiTyping && (
                  <motion.div
                    key="typing-indicator"
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-[#202c33] border border-zinc-800/40 text-zinc-100 p-2.5 rounded-2xl rounded-tl-none self-start flex items-center gap-1 px-3.5 shadow-sm"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat End Marker */}
              <div ref={chatEndRef} />
            </div>

            {/* WhatsApp Footer Input Bar */}
            <div className="bg-[#1f2c34] px-3.5 py-2.5 flex items-center gap-2 border-t border-zinc-800/40 shrink-0">
              <div className="flex-1 bg-[#2a3942] rounded-full px-3 py-1.5 flex items-center text-[9px] text-zinc-500 font-medium border border-zinc-800/50">
                Mensagem
              </div>
              <div className="h-7 w-7 rounded-full bg-emerald-600 flex items-center justify-center text-zinc-100 shrink-0 shadow shadow-black/25">
                <Send className="h-3 w-3 fill-current rotate-45 mr-0.5" />
              </div>
            </div>

            {/* Simulated iOS bottom home bar */}
            <div className="h-4 w-full bg-[#1f2c34] flex justify-center items-center shrink-0">
              <div className="h-0.5 w-16 bg-zinc-600 rounded-full" />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
