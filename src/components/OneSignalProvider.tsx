"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    OneSignalDeferred?: any[];
    OneSignal?: any;
  }
}

export default function OneSignalProvider() {
  useEffect(() => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      await OneSignal.init({
        appId: "b54b6a5d-7703-4d8a-9a17-67592d7c1fce",
        safari_web_id: "web.onesignal.auto.08b05e7f-114b-4b4f-a485-263bca659097",
        notifyButton: {
          enable: true,
        },
      });
    });

    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  return null;
}
