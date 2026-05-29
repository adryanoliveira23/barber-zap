'use client';

import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Dialog } from './ui/dialog';
import { QrCode } from 'lucide-react';

interface QRCodeGeneratorProps {
  bookingUrl: string;
}

export default function QRCodeGenerator({ bookingUrl }: QRCodeGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [qrSvg, setQrSvg] = useState<string>('');

  useEffect(() => {
    if (!bookingUrl) return;
    // Dynamically import qrcode to avoid SSR issues
    import('qrcode').then((QRCode) => {
      QRCode.toString(bookingUrl, { type: 'svg', margin: 1 }, (err, svg) => {
        if (!err) setQrSvg(svg);
      });
    });
  }, [bookingUrl]);

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setIsOpen(true)}>
        <QrCode className="h-4 w-4 mr-2" />
        QR Code Balcão
      </Button>

      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="QR Code para Agendamento"
      >
        <div className="flex flex-col items-center gap-4 p-4">
          <p className="text-sm text-zinc-400 text-center">
            Escaneie com o celular para agendar direto no balcão
          </p>
          {qrSvg ? (
            <div dangerouslySetInnerHTML={{ __html: qrSvg }} className="w-48 h-48 bg-white p-2 rounded" />
          ) : (
            <div className="w-48 h-48 bg-zinc-800 animate-pulse rounded" />
          )}
          <p className="text-xs text-zinc-500 break-all text-center">{bookingUrl}</p>
        </div>
      </Dialog>
    </>
  );
}
