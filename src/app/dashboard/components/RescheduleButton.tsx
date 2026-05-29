'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Calendar, Clock } from 'lucide-react';
import { Appointment } from '@/lib/db';
import { useToast } from '@/components/ui/toast';

interface RescheduleButtonProps {
  appointment: Appointment;
  onReschedule: () => void;
}

export default function RescheduleButton({ appointment, onReschedule }: RescheduleButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleReschedule = async () => {
    if (!newDate || !newTime) {
      error('Erro', 'Selecione nova data e horário.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.id,
          newDate,
          newTime,
        }),
      });

      if (!res.ok) throw new Error('Failed to reschedule');

      success('Sucesso', 'Agendamento remarcado com sucesso!');
      setIsOpen(false);
      onReschedule();
    } catch (err) {
      error('Erro', 'Não foi possível remarcar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setIsOpen(true)}>
        <Calendar className="h-4 w-4 mr-2" />
        Reagendar
      </Button>

      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Remarcar Agendamento"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-zinc-400 block mb-1">Nova Data</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full bg-obsidian-900 border border-obsidian-700 rounded px-3 py-2 text-zinc-100"
            />
          </div>
          <div>
            <label className="text-sm text-zinc-400 block mb-1">Novo Horário</label>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full bg-obsidian-900 border border-obsidian-700 rounded px-3 py-2 text-zinc-100"
            />
          </div>
          <Button onClick={handleReschedule} disabled={loading} className="w-full">
            {loading ? 'Remarcando...' : 'Confirmar Remarcação'}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
