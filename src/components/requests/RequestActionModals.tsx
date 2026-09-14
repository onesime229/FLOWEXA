import React, { useState } from 'react';
import {
  CheckCircle2,
  PlayCircle,
  Ban,
  XCircle,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { FlowexaRequestItem, RequestStatus } from '../../types';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { Textarea } from '../design-system/Input';

export interface RequestActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: FlowexaRequestItem | null;
  actionType: 'START' | 'COMPLETE' | 'CANCEL' | 'REJECT' | 'NO_SHOW' | null;
  businessId?: string;
  callerRole?: 'CLIENT' | 'BUSINESS_OWNER' | 'SUPER_ADMIN';
  onSuccess: (updatedRequest: FlowexaRequestItem) => void;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const RequestActionModal: React.FC<RequestActionModalProps> = ({
  isOpen,
  onClose,
  request,
  actionType,
  businessId,
  callerRole = 'BUSINESS_OWNER',
  onSuccess,
  onShowToast,
}) => {
  if (!isOpen || !request || !actionType) return null;

  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getModalConfig = () => {
    switch (actionType) {
      case 'START':
        return {
          title: 'Démarrer la Prestation',
          icon: <PlayCircle className="w-5 h-5 text-emerald-400" />,
          description: 'La prestation va basculer au statut EN COURS. L’horodatage de démarrage sera consigné.',
          placeholder: 'Note optionnelle (ex: Arrivée sur site effectuée, matériel installé...)',
          btnText: 'Démarrer maintenant',
          btnVariant: 'primary' as const,
          endpoint: `/api/v1/requests/${request.id}/start`,
          bodyKey: 'note',
        };
      case 'COMPLETE':
        return {
          title: 'Clôturer la Prestation',
          icon: <CheckCircle2 className="w-5 h-5 text-cyan-400" />,
          description: 'La prestation sera marquée comme TERMINÉE. Le client pourra ensuite déposer un avis vérifié.',
          placeholder: 'Rapport de fin / Note de clôture (ex: Prestation réalisée avec succès, remise des clés effectuée...)',
          btnText: 'Valider la clôture',
          btnVariant: 'primary' as const,
          endpoint: `/api/v1/requests/${request.id}/complete`,
          bodyKey: 'note',
        };
      case 'CANCEL':
        return {
          title: 'Annuler la Réservation',
          icon: <Ban className="w-5 h-5 text-rose-400" />,
          description: 'Attention : cette action est définitive. Une réservation annulée ne peut plus être réactivée.',
          placeholder: 'Motif de l’annulation (obligatoire)...',
          btnText: 'Confirmer l’annulation',
          btnVariant: 'danger' as const,
          endpoint: `/api/v1/requests/${request.id}/cancel`,
          bodyKey: 'reason',
        };
      case 'REJECT':
        return {
          title: 'Refuser la Demande',
          icon: <XCircle className="w-5 h-5 text-rose-400" />,
          description: 'Indiquez au client la raison du refus afin de maintenir une relation de confiance.',
          placeholder: 'Motif du refus (ex: Capacité d’accueil atteinte, créneau déjà réservé...)',
          btnText: 'Confirmer le refus',
          btnVariant: 'danger' as const,
          endpoint: `/api/v1/requests/${request.id}/reject`,
          bodyKey: 'reason',
        };
      case 'NO_SHOW':
        return {
          title: 'Signaler un Rendez-vous non honoré (No-Show)',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
          description: 'Le client ne s’est pas présenté au rendez-vous convenu sans préavis.',
          placeholder: 'Précisions sur l’absence du client...',
          btnText: 'Enregistrer le No-Show',
          btnVariant: 'danger' as const,
          endpoint: `/api/v1/requests/${request.id}/status`,
          bodyKey: 'reason',
        };
    }
  };

  const config = getModalConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((actionType === 'CANCEL' || actionType === 'REJECT') && !note.trim()) {
      setErrorMessage('Le motif est obligatoire pour cette action.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-role': callerRole,
      };
      if (callerRole === 'CLIENT') {
        headers['x-client-id'] = 'client-test-1';
      } else if (businessId) {
        headers['x-business-id'] = businessId;
      }

      let url = config.endpoint;
      let payload: any = {};

      if (actionType === 'NO_SHOW') {
        payload = {
          status: 'NO_SHOW',
          reason: note.trim() || 'Client absent au rendez-vous',
        };
      } else {
        payload = {
          [config.bodyKey]: note.trim() || undefined,
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMessage(json.message || 'Action impossible à effectuer.');
        setIsSubmitting(false);
        return;
      }

      onShowToast(
        'Statut mis à jour',
        json.message || 'Le statut de la prestation a été actualisé.',
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
      title={config.title}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div className="flex items-center gap-3 p-3 bg-[#020919] rounded-xl border border-white/10 text-xs">
          {config.icon}
          <div>
            <div className="font-bold text-white">{request.title}</div>
            <div className="text-gray-400">Réf: {request.id.substring(0, 10)} • Client: {request.clientName}</div>
          </div>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed">
          {config.description}
        </p>

        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Note ou motif {(actionType === 'CANCEL' || actionType === 'REJECT') && '*'}
          </label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder={config.placeholder}
            required={actionType === 'CANCEL' || actionType === 'REJECT'}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant={config.btnVariant}
            size="sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Traitement...' : config.btnText}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
