"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const ONESIGNAL_APP_ID = "b54b6a5d-7703-4d8a-9a17-67592d7c1fce";

export default function OneSignalProvider() {
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Carrega o SDK do OneSignal via CDN (v16)
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.defer = true;
    document.head.appendChild(script);

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true, // Para testes locais
        notifyButton: { enable: false }, // Controle manual do prompt
        serviceWorkerPath: "/OneSignalSDKWorker.js",
      });

      // Solicita permissão automaticamente após init
      await OneSignal.Notifications.requestPermission();
    });

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Associa o usuário logado ao OneSignal (External ID = user.id do Supabase)
  useEffect(() => {
    if (!user?.id || typeof window === "undefined") return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      try {
        await OneSignal.login(user.id);
        await OneSignal.User.addTags({
          email: user.email ?? "",
          role: "barbershop_owner",
        });
      } catch (e) {
        // Ignora silenciosamente — pode falhar em dev sem HTTPS
      }
    });
  }, [user?.id]);

  return null; // Componente invisível
}
