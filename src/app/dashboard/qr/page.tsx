"use client";

import { useDashboard } from "@/context/DashboardContext";
import { Card, CardContent } from "@/components/ui/card";
import QRCodeGenerator from "@/components/QRCodeGenerator";

export default function QRPage() {
  const { barbershop } = useDashboard();
  if (!barbershop) return null;

  const bookingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${barbershop.slug}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">QR Code Balcão</h2>
        <p className="text-zinc-400 text-sm">
          Imprima ou exiba este QR Code no balcão para clientes agendarem sozinhos.
        </p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6 flex flex-col items-center gap-4">
          <QRCodeGenerator bookingUrl={bookingUrl} />
          <p className="text-xs text-zinc-500 text-center mt-4">
            Ao escanear, o cliente será direcionado para a página de agendamento da sua barbearia.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
