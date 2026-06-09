"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, CheckCheck, Smartphone } from "lucide-react";

interface Message {
    id: string;
    sender: "ai" | "client";
    text: string;
    time: string;
    buttons?: string[];
}

export default function WhatsAppHeroDemo() {
    const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
    const [isAiTyping, setIsAiTyping] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Simula o fluxo de confirmação completo com auto-play
    useEffect(() => {
        const messages: Message[] = [
            {
                id: "1",
                sender: "ai",
                text: "Olá Alessandro! ✂️ Aqui é o assistente virtual da *Barbearia do Carlos*.\n\nPassando para lembrar do seu horário de *Corte Degradê* amanhã às *14:00*.\n\nPodemos confirmar a sua presença?",
                time: "10:30",
                buttons: ["✅ Confirmar", "🔄 Reagendar"]
            },
            {
                id: "2",
                sender: "client",
                text: "✅ Confirmar",
                time: "10:31"
            },
            {
                id: "3",
                sender: "ai",
                text: "Perfeito! ✅ Sua presença foi confirmada no sistema. Você receberá um outro lembrete 2 horas antes. Até amanhã! 🤝💈",
                time: "10:31"
            }
        ];

        let timeoutIds: NodeJS.Timeout[] = [];

        const runSequence = (index: number) => {
            if (index >= messages.length) return;

            const msg = messages[index];

            if (msg.sender === "ai") {
                setIsAiTyping(true);
                const delay = index === 0 ? 600 : 1200;
                timeoutIds.push(setTimeout(() => {
                    setIsAiTyping(false);
                    setVisibleMessages(prev => [...prev, msg]);
                    timeoutIds.push(setTimeout(() => runSequence(index + 1), index === 0 ? 2500 : 2000));
                }, delay));
            } else {
                timeoutIds.push(setTimeout(() => {
                    setVisibleMessages(prev => [...prev, msg]);
                    timeoutIds.push(setTimeout(() => runSequence(index + 1), 1000));
                }, 1000));
            }
        };

        const initialTimeout = setTimeout(() => runSequence(0), 1500);
        timeoutIds.push(initialTimeout);

        return () => timeoutIds.forEach(clearTimeout);
    }, []);

    // Scroll do container
    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) return;
        const id = requestAnimationFrame(() => {
            try { container.scrollTop = container.scrollHeight; } catch { }
        });
        return () => cancelAnimationFrame(id);
    }, [visibleMessages, isAiTyping]);

    return (
        <div className="relative w-full max-w-[280px] mx-auto">
            {/* Moldura do celular */}
            <div className="relative bg-gradient-to-b from-zinc-900 to-obsidian-950 rounded-[32px] p-[5px] shadow-[0_30px_70px_-20px_rgba(245,158,11,0.2),0_20px_40px_-15px_rgba(0,0,0,0.9),inset_0_0_0_1.5px_rgba(255,255,255,0.06)] border border-zinc-800/70">
                {/* Dynamic Island */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 h-5 w-20 bg-black rounded-full z-50 flex items-center justify-center gap-1 px-3 shadow-inner">
                    <div className="h-1 w-1 rounded-full bg-zinc-700" />
                    <div className="h-1.5 w-1.5 rounded-full bg-zinc-900 border border-zinc-800/80" />
                </div>

                {/* Tela */}
                <div className="w-full h-[460px] bg-[#0b141a] rounded-[28px] overflow-hidden flex flex-col relative text-zinc-200 font-sans">

                    {/* Header WhatsApp */}
                    <div className="bg-[#121b22] px-3.5 pt-6 pb-2 flex items-center justify-between border-b border-zinc-800/50 shrink-0">
                        <div className="flex items-center gap-2 mt-2">
                            <div className="h-7 w-7 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-500 relative shrink-0">
                                <MessageSquare className="h-3.5 w-3.5" />
                                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border border-[#121b22]" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                    <span className="text-[9px] font-bold text-zinc-100 truncate">BarberZap</span>
                                    <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full flex items-center justify-center text-[6px] text-zinc-950 font-black">✓</span>
                                </div>
                                <span className="text-[7px] text-zinc-400 block mt-0.5 leading-none">
                                    {isAiTyping ? (
                                        <span className="text-emerald-400 font-semibold animate-pulse">digitando...</span>
                                    ) : "online"}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-500 mt-2">
                            <Smartphone className="h-3 w-3" />
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-1.5 relative z-10">
                        {/* Encryption Notice */}
                        <div className="bg-[#182229] border border-zinc-800/30 rounded-lg p-1.5 text-center max-w-[200px] mx-auto mb-1 shrink-0">
                            <p className="text-[6px] text-zinc-500 leading-snug">🔒 Criptografado</p>
                        </div>

                        {/* Mensagens */}
                        <AnimatePresence initial={false}>
                            {visibleMessages.map((msg) => {
                                const isAi = msg.sender === "ai";
                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ type: "spring", damping: 22, stiffness: 220 }}
                                        className={`flex flex-col max-w-[88%] ${isAi ? "self-start" : "self-end"}`}
                                    >
                                        <div className={`p-2 rounded-2xl shadow-sm text-[8.5px] leading-relaxed relative ${isAi
                                                ? "bg-[#202c33] text-zinc-100 rounded-tl-none border border-zinc-800/40"
                                                : "bg-[#005c4b] text-zinc-100 rounded-tr-none border border-emerald-800/40"
                                            }`}>
                                            <p className="whitespace-pre-line font-medium">
                                                {msg.text.split("\n").map((line, lIdx) => (
                                                    <span key={lIdx} className="block min-h-[4px]">
                                                        {line.split("*").map((chunk, cIdx) =>
                                                            cIdx % 2 === 1 ? <strong key={cIdx} className="font-extrabold text-gold-400">{chunk}</strong> : chunk
                                                        )}
                                                    </span>
                                                ))}
                                            </p>
                                            <div className="flex items-center justify-end gap-1 mt-1">
                                                <span className="text-[6px] text-zinc-500/80 font-semibold">{msg.time}</span>
                                                {!isAi && <CheckCheck className="h-2.5 w-2.5 text-sky-400" />}
                                            </div>
                                        </div>

                                        {/* Botões interativos */}
                                        {isAi && msg.buttons && msg.buttons.length > 0 && (
                                            <div className="flex flex-col gap-1 mt-1 w-full">
                                                {msg.buttons.map((btn, bIdx) => (
                                                    <div
                                                        key={bIdx}
                                                        className="w-full bg-[#202c33] text-sky-400 font-bold py-1.5 px-2.5 rounded-xl border border-zinc-800/40 text-[8px] flex items-center justify-center gap-1 shadow-sm"
                                                    >
                                                        {btn}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}

                            {/* Typing Indicator */}
                            {isAiTyping && (
                                <motion.div
                                    key="typing"
                                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-[#202c33] border border-zinc-800/40 text-zinc-100 p-2 rounded-2xl rounded-tl-none self-start flex items-center gap-1 px-3 shadow-sm"
                                >
                                    <span className="h-1 w-1 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <span className="h-1 w-1 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <span className="h-1 w-1 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Input bar */}
                    <div className="bg-[#1f2c34] px-3 py-2 flex items-center gap-2 border-t border-zinc-800/40 shrink-0">
                        <div className="flex-1 bg-[#2a3942] rounded-full px-2.5 py-1 text-[8px] text-zinc-500 font-medium border border-zinc-800/50">
                            Mensagem
                        </div>
                        <div className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center text-zinc-100 shrink-0">
                            <svg className="h-2.5 w-2.5 fill-current rotate-45 ml-0.5" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                        </div>
                    </div>

                    {/* Home bar */}
                    <div className="h-3 w-full bg-[#1f2c34] flex justify-center items-center shrink-0">
                        <div className="h-0.5 w-14 bg-zinc-600 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}