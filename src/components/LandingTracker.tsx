"use client";

import { useEffect } from "react";

type EventPayload = Record<string, any>;

const SESSION_KEY = "barberzap_landing_session_id";
const EVENTS_KEY = "barberzap_landing_events_buffer";
const FLUSH_INTERVAL_MS = 15000;
const MAX_BUFFER_SIZE = 10;
const EVENT_ENDPOINT = "/api/analytics/landing";

function buildSessionId() {
    const existing = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(SESSION_KEY) : null;
    if (existing) return existing;

    const next = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(SESSION_KEY, next);
    }
    return next;
}

function readBuffer(): EventPayload[] {
    if (typeof localStorage === "undefined") return [];
    try {
        const raw = localStorage.getItem(EVENTS_KEY);
        return raw ? (JSON.parse(raw) as EventPayload[]) : [];
    } catch {
        return [];
    }
}

function writeBuffer(events: EventPayload[]) {
    if (typeof localStorage === "undefined") return;
    try {
        localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-MAX_BUFFER_SIZE)));
    } catch {
        // Silently ignore quota errors
    }
}

function enqueue(event: EventPayload) {
    const buffer = readBuffer();
    buffer.push(event);
    writeBuffer(buffer);
}

async function flushBuffer() {
    if (typeof navigator === "undefined" || !navigator.sendBeacon) return;
    const buffer = readBuffer();
    if (buffer.length === 0) return;

    try {
        const payload = JSON.stringify({ events: buffer });
        navigator.sendBeacon(EVENT_ENDPOINT, payload);
        writeBuffer([]);
    } catch {
        // Ignore
    }
}

export default function LandingTracker() {
    useEffect(() => {
        const sessionId = buildSessionId();
        const baseEvent: EventPayload = {
            session_id: sessionId,
            device: /mobile|android|iphone/i.test(navigator.userAgent) ? "mobile" : "desktop",
            created_at: new Date().toISOString(),
        };

        const track = (eventName: string, metadata: EventPayload = {}) => {
            enqueue({
                ...baseEvent,
                event_name: eventName,
                metadata,
            });
        };

        // Tempo na página
        const start = Date.now();
        const unloadHandler = () => {
            const duration = Math.round((Date.now() - start) / 1000);
            track("session_end", { duration_seconds: duration });
            flushBuffer();
        };
        window.addEventListener("beforeunload", unloadHandler);
        window.addEventListener("pagehide", unloadHandler);

        // View inicial
        track("landing_view");

        // Scroll por seções principais (apenas 1x por seção)
        const sectionIds = ["demonstracao", "planos"];
        const sectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute("id");
                        if (id) {
                            track("section_view", { section_id: id });
                            sectionObserver.unobserve(entry.target);
                        }
                    }
                });
            },
            { threshold: 0.25 }
        );

        sectionIds.forEach((id) => {
            const el = document.getElementById(id);
            if (el) sectionObserver.observe(el);
        });

        // Heatmap simplificado de scroll (apenas 50% e 100%)
        const scrollMilestones = [50, 100];
        const reached = new Set<number>();
        const scrollHandler = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (docHeight <= 0) return;

            const pct = Math.round((scrollTop / docHeight) * 100);

            scrollMilestones.forEach((m) => {
                if (pct >= m && !reached.has(m)) {
                    reached.add(m);
                    track("scroll_depth", { percent: m });
                }
            });
        };
        window.addEventListener("scroll", scrollHandler, { passive: true });

        // Cliques em botões relevantes por data-* attributes (apenas CTAs principais)
        const clickHandler = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;
            const button = target.closest("button, a") as HTMLElement | null;
            if (!button) return;
            const trackName = button.getAttribute("data-track") || null;
            if (trackName) {
                track("clicked", { target: trackName, href: button.getAttribute("href") || undefined });
            }
        };
        window.addEventListener("click", clickHandler);

        // Flush periódico
        const interval = setInterval(() => {
            flushBuffer();
        }, FLUSH_INTERVAL_MS);

        return () => {
            window.removeEventListener("beforeunload", unloadHandler);
            window.removeEventListener("pagehide", unloadHandler);
            window.removeEventListener("scroll", scrollHandler);
            window.removeEventListener("click", clickHandler);
            sectionObserver.disconnect();
            clearInterval(interval);
            flushBuffer();
        };
    }, []);

    return null;
}