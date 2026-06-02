"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(
          (registration) => {
            console.log("ServiceWorker registrado com sucesso:", registration);
          },
          (err) => {
            console.log("Falha ao registrar ServiceWorker:", err);
          }
        );
      });
    }
  }, []);

  return null;
}
