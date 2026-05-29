import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/toast";
import OneSignalProvider from "@/components/OneSignalProvider";

// Extend window type for OneSignal
declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void | Promise<void>>;
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
};

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
      <body className="min-h-full flex flex-col bg-obsidian-950 text-zinc-100" suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            <OneSignalProvider />
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
