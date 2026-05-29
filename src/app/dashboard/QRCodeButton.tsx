'use client';

import { useDashboard } from '@/context/DashboardContext';
import QRCodeGenerator from '@/components/QRCodeGenerator';

export default function QRCodeButton() {
  const { barbershop } = useDashboard();
  if (!barbershop) return null;

  const bookingUrl = `${window.location.origin}/${barbershop.slug}`;
  return <QRCodeGenerator bookingUrl={bookingUrl} />;
}
