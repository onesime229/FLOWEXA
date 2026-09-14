import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { FlowexaRequestItem } from '../../types';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { Input, Textarea, Select } from '../design-system/Input';

export interface ScheduleAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: FlowexaRequestItem | null;
  businessId: string;
  onSuccess: (updatedRequest: FlowexaRequestItem) => void;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ScheduleAppointmentModal: React.FC<ScheduleAppointmentModalProps> = ({
  isOpen,
  onClose,
  request,
  businessId,
  onSuccess,
  onShowToast,
}) => {
  if (!isOpen || !request) return null;

  const [scheduledDate, setScheduledDate] = useState(
    request.scheduledDate || request.requestedDate || new Date().toISOString().split('T')[0]
  );
  const [scheduledTime, setScheduledTime] = useState(
    request.scheduledTime || request.requestedTime || '14:00'
  );
  const [durationMinutes, setDurationMinutes] = useState(
    request.durationMinutes ? String(request.durationMinutes) : '60'
  );
  const [assignedEmployee, setAssignedEmployee] = useState(
    request.assignedEmployeeName || 'Jean-Marc Houénou'
  );
  const [note, setNote] = useState(
    'Rendez-vous planifié. Notre collaborateur sera prêt pour vous accueillir / intervenir.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Suggested employees
  const staffOptions = [
    { id: 'emp-101', name: 'Jean-Marc Houénou (Expert Sénior)' },
    { id: 'emp-102', name: 'Sophie Dossou (Responsable Service)' },
    { id: 'emp-103', name: 'Armand Agossa (Technicien Spécialisé)' },
    { id: 'emp-104', name: 'Clémence Bio (Conseillère Clientèle)' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDate) {
      setErrorMessage('La date de rendez-vous est obligatoire.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const selectedStaff = staffOptions.find((s) => s.name === assignedEmployee);
      const res = await fetch(`/api/v1/requests/${request.id}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'BUSINESS_OWNER',
          'x-business-id': businessId,
        },
        body: JSON.stringify({
          scheduledDate,
          scheduledTime,
          durationMinutes: Number(durationMinutes) || 60,
          assignedEmployeeId: selectedStaff?.id || 'emp-101',
          assignedEmployeeName: assignedEmployee,
          note: note.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.code === 'BOOKING_CONFLICT') {
          setErrorMessage('Conflit détecté : une autre prestation est déjà planifiée sur ce même créneau/collaborateur.');
        } else {
          setErrorMessage(json.message || 'Impossible de planifier le rendez-vous.');
        }
        setIsSubmitting(false);
        return;
      }

      onShowToast(
        'Rendez-vous planifié avec succès',
        `La prestation a été planifiée le ${scheduledDate} à ${scheduledTime}. Le client a été notifié.`,
        'success'
      );

      onSuccess(json.data);
      onClose();
    } catch (err) {
      setErrorMessage('Erreur réseau. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Planifier le Rendez-vous & Assigner un Collaborateur"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Reservation summary */}
        <div className="bg-[#020919] p-3 rounded-xl border border-white/10 flex items-center justify-between text-xs">
          <div>
            <div className="text-gray-400">Prestation</div>
            <div className="text-white font-bold">{request.title}</div>
            <div className="text-gray-400 mt-0.5">Client : {request.clientName} ({request.clientPhone})</div>
          </div>
          {typeof request.lockedPrice === 'number' && (
            <div className="text-right">
              <div className="text-gray-400">Prix verrouillé</div>
              <div className="text-emerald-400 font-bold font-mono">
                {request.lockedPrice.toLocaleString()} {request.lockedCurrency || 'FCFA'}
              </div>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Date du rendez-vous *
            </label>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Heure de début *
            </label>
            <Input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Durée estimée (minutes)
            </label>
            <Select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
            >
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 heure (60 min)</option>
              <option value="90">1h30 (90 min)</option>
              <option value="120">2 heures (120 min)</option>
              <option value="180">3 heures (180 min)</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Collaborateur / Intervenant
            </label>
            <Select
              value={assignedEmployee}
              onChange={(e) => setAssignedEmployee(e.target.value)}
            >
              {staffOptions.map((staff) => (
                <option key={staff.id} value={staff.name}>
                  {staff.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Consignes / Message d'information client
          </label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Informations utiles pour le client..."
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting}
            leftIcon={<Calendar className="w-4 h-4" />}
          >
            {isSubmitting ? 'Planification en cours...' : 'Confirmer la Planification'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
