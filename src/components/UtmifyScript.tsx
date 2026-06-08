"use client";

import { useEffect } from "react";

export default function UtmifyScript() {
    useEffect(() => {
        // Injetar script UTMify apenas no cliente, após hidratação completa
        const script = document.createElement("script");
        script.src = "https://cdn.utmify.com.br/scripts/utms/latest.js";
        script.setAttribute("data-utmify-prevent-xcod-sck", "");
        script.setAttribute("data-utmify-prevent-subids", "");
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        return () => {
            // Cleanup se desmontar
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, []);

    return null;
}