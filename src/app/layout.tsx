import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/toast";
import OneSignalProvider from "@/components/OneSignalProvider";
import UtmifyScript from "@/components/UtmifyScript";

// Extend window type for OneSignal
declare global {
  interface Window {
    OneSignalDeferred?: any;
    OneSignal?: any;
  }
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BarberZap - Agendamento Inteligente para Barbearias",
  description: "SaaS premium de agendamento mobile-first para barbearias modernas.",
  icons: {
    icon: "/assets/logo.png",
    apple: "/assets/logo.png",
  },
};

const BACK_REDIRECT_LINK = "https://meubackredirect.com.br";

function setBackRedirect(url: string) {
  let urlBackRedirect = url;
  urlBackRedirect =
    urlBackRedirect.trim() +
    (urlBackRedirect.indexOf("?") > 0 ? "&" : "?") +
    document.location.search.replace("?", "").toString();

  history.pushState({}, "", location.href);
  history.pushState({}, "", location.href);
  history.pushState({}, "", location.href);

  window.addEventListener("popstate", () => {
    console.log("onpopstate", urlBackRedirect);
    setTimeout(() => {
      location.href = urlBackRedirect;
    }, 1);
  });
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head />
      <body className="min-h-full flex flex-col bg-obsidian-950 text-zinc-100" suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            <OneSignalProvider />
            {children}
          </ToastProvider>
        </AuthProvider>

        {/* UTMify - injetado via cliente para não quebrar hidratação */}
        <UtmifyScript />

        {/* Back Redirect Script - Previne perda de lead ao sair */}
        <Script id="back-redirect" strategy="afterInteractive">
          {`
            const link = "${BACK_REDIRECT_LINK}";
            function setBackRedirect(url) {
              let urlBackRedirect = url;
              urlBackRedirect =
                urlBackRedirect.trim() +
                (urlBackRedirect.indexOf("?") > 0 ? "&" : "?") +
                document.location.search.replace("?", "").toString();

              history.pushState({}, "", location.href);
              history.pushState({}, "", location.href);
              history.pushState({}, "", location.href);

              window.addEventListener("popstate", () => {
                console.log("onpopstate", urlBackRedirect);
                setTimeout(() => {
                  location.href = urlBackRedirect;
                }, 1);
              });
            }
            setBackRedirect(link);
          `}
        </Script>
      </body>
    </html>
  );
}
