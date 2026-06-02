"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    OneSignalDeferred?: any;
    OneSignal?: any;
  }
}

const ONESIGNAL_APP_ID = "b54b6a5d-7703-4d8a-9a17-67592d7c1fce";
const ONESIGNAL_SAFARI_WEB_ID = "web.onesignal.auto.08b05e7f-114b-4b4f-a485-263bca659097";

export default function OneSignalProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Só inicializa se estiver exatamente no domínio de produção
    const isProductionDomain = window.location.hostname === "barber-zap-three.vercel.app";
    
    if (!isProductionDomain) {
      // Não inicializa em desenvolvimento ou outros domínios
      console.log("OneSignal: ambiente não é produção, ignorando inicialização.");
      return;
    }

    // Carrega o SDK do OneSignal apenas em produção
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.defer = true;
    document.head.appendChild(script);

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      try {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          safari_web_id: ONESIGNAL_SAFARI_WEB_ID,
          allowLocalhostAsSecureOrigin: false, // Não precisa para produção
          notifyButton: { enable: true },
          serviceWorkerPath: "/OneSignalSDKWorker.js",
        });
      } catch (err) {
        console.error("OneSignal init error:", err);
      }
    });

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return null;
}
