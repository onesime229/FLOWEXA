import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Users,
  MessageSquare,
  Phone,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  MessageCircle,
} from 'lucide-react';
import { InteractionType, FlowexaRequestItem } from '../../types';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { Input, Textarea } from '../design-system/Input';
import { Badge } from '../design-system/Badge';

export interface RequestModalTarget {
  businessId: string;
  businessName: string;
  businessPhone?: string;
  catalogItemId?: string;
  catalogItemTitle?: string;
  catalogItemPrice?: number;
  catalogItemCurrency?: string;
  catalogItemImage?: string;
  moduleCode?: string;
  location?: string;
  defaultInteractionType?: InteractionType;
}

export interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: RequestModalTarget | null;
  onSuccess: (newRequest: FlowexaRequestItem) => void;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const RequestModal: React.FC<RequestModalProps> = ({
  isOpen,
  onClose,
  target,
  onSuccess,
  onShowToast,
}) => {
  if (!isOpen || !target) return null;

  // Determine appropriate interaction type based on target
  const initialType: InteractionType =
    target.defaultInteractionType ||
    (target.moduleCode === 'GUEST_HOUSE'
      ? 'BOOKING'
      : target.moduleCode === 'COIFFURE' || target.moduleCode === 'SPA_MASSAGE'
      ? 'APPOINTMENT'
      : 'REQUEST');

  const [interactionType, setInteractionType] = useState<InteractionType>(initialType);
  const [clientName, setClientName] = useState('Onésime Sovide');
  const [clientPhone, setClientPhone] = useState('0154100617');
  const [clientEmail, setClientEmail] = useState('sovionesime@gmail.com');
  const [requestedDate, setRequestedDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [requestedTime, setRequestedTime] = useState('10:00');
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [guestsCount, setGuestsCount] = useState('2');
  const [location, setLocation] = useState(target.location || 'Cotonou, Bénin');
  const [message, setMessage] = useState(
    interactionType === 'BOOKING'
      ? 'Bonjour, je souhaite réserver cet hébergement pour les dates indiquées. Merci de me confirmer la disponibilité.'
      : interactionType === 'APPOINTMENT'
      ? 'Bonjour, je souhaite prendre rendez-vous pour cette prestation au créneau indiqué.'
      : interactionType === 'CONTACT_ONLY'
      ? 'Bonjour, je souhaite avoir plus de renseignements sur cette offre.'
      : 'Bonjour, je souhaite planifier une visite / demande concernant cette annonce.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getTitle = () => {
    switch (interactionType) {
      case 'BOOKING':
        return 'Demande de Réservation';
      case 'APPOINTMENT':
        return 'Prendre un Rendez-vous';
      case 'CONTACT_ONLY':
        return 'Contacter l’établissement';
      case 'REQUEST':
      default:
        return target.moduleCode === 'IMMOBILIER'
          ? 'Demander une visite'
          : target.moduleCode === 'GARAGE'
          ? 'Demande d’intervention mécanique'
          : 'Envoyer une demande';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!message.trim()) {
      setErrorMsg('Veuillez préciser votre message ou demande.');
      return;
    }

    if (!clientPhone.trim()) {
      setErrorMsg('Veuillez indiquer un numéro de téléphone de contact.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        businessId: target.businessId,
        catalogItemId: target.catalogItemId,
        interactionType,
        message: message.trim(),
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim(),
        location: location.trim(),
      };

      if (interactionType === 'BOOKING') {
        payload.requestedDate = requestedDate;
        payload.endDate = endDate;
        payload.guestsCount = Number(guestsCount) || 1;
        payload.title = `Réservation : ${target.catalogItemTitle || target.businessName}`;
      } else if (interactionType === 'APPOINTMENT') {
        payload.requestedDate = requestedDate;
        payload.requestedTime = requestedTime;
        payload.title = `Rendez-vous : ${target.catalogItemTitle || target.businessName}`;
      } else if (interactionType === 'REQUEST') {
        payload.requestedDate = requestedDate;
        payload.requestedTime = requestedTime;
        payload.title = `${target.moduleCode === 'IMMOBILIER' ? 'Visite' : 'Demande'} : ${target.catalogItemTitle || target.businessName}`;
      } else {
        payload.title = `Message : ${target.catalogItemTitle || target.businessName}`;
      }

      const res = await fetch('/api/v1/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'CLIENT',
          'x-client-id': 'client-test-1',
          'x-client-phone': clientPhone.trim(),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.code === 'OFFER_NOT_PUBLISHED') {
          setErrorMsg('Cette offre n’est pas actuellement disponible pour les réservations (statut non publié).');
        } else {
          setErrorMsg(data.message || 'Impossible d’envoyer votre demande.');
        }
        setIsSubmitting(false);
        return;
      }

      onShowToast(
        'Demande transmise avec succès',
        `Votre demande a été envoyée à ${target.businessName}. Vous recevrez une notification dès sa prise en compte.`,
        'success'
      );

      onSuccess(data.data);
      onClose();
    } catch (err: any) {
      setErrorMsg('Erreur de connexion au serveur Flowexa. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppDirect = () => {
    const phone = target.businessPhone || '0154100617';
    const text = encodeURIComponent(
      `Bonjour ${target.businessName}, je vous contacte via Flowexa au sujet de l'offre : "${target.catalogItemTitle || 'votre service'}".`
    );
    window.open(`https://wa.me/229${phone}?text=${text}`, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5 text-left">
        {/* Target Summary Card */}
        <div className="bg-[#020919] border border-white/10 rounded-xl p-3.5 flex items-center gap-3.5">
          {target.catalogItemImage ? (
            <img
              src={target.catalogItemImage}
              alt={target.catalogItemTitle || target.businessName}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xl shrink-0">
              🏢
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#FB8205] uppercase tracking-wider">
                {target.businessName}
              </span>
              <Badge variant="cyan" size="sm">
                Certifié Flowexa
              </Badge>
            </div>
            <h4 className="text-sm font-bold text-white truncate mt-0.5">
              {target.catalogItemTitle || target.businessName}
            </h4>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              {typeof target.catalogItemPrice === 'number' && (
                <span className="font-bold text-emerald-400">
                  {target.catalogItemPrice.toLocaleString()} {target.catalogItemCurrency || 'FCFA'}
                </span>
              )}
              {target.location && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-[#0BE9EF]" />
                  {target.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Interaction Type Switcher (if user wants to adapt) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-300">
            Type d'interaction
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { type: 'REQUEST', label: 'Demande', icon: '📝' },
              { type: 'APPOINTMENT', label: 'Rendez-vous', icon: '📅' },
              { type: 'BOOKING', label: 'Réservation', icon: '🏨' },
              { type: 'CONTACT_ONLY', label: 'Contact', icon: '💬' },
            ].map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => {
                  setInteractionType(item.type as InteractionType);
                  if (item.type === 'BOOKING') {
                    setMessage('Bonjour, je souhaite réserver cet hébergement pour les dates indiquées. Merci de me confirmer la disponibilité.');
                  } else if (item.type === 'APPOINTMENT') {
                    setMessage('Bonjour, je souhaite prendre rendez-vous pour cette prestation au créneau indiqué.');
                  } else if (item.type === 'CONTACT_ONLY') {
                    setMessage('Bonjour, je souhaite avoir plus de renseignements sur cette offre.');
                  } else {
                    setMessage('Bonjour, je souhaite planifier une visite / demande concernant cette annonce.');
                  }
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  interactionType === item.type
                    ? 'bg-[#FB8205] text-white border-[#FB8205] shadow-lg shadow-[#FB8205]/20'
                    : 'bg-[#0A1428] text-gray-400 border-white/5 hover:border-white/20 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Fields based on Interaction Type */}
        {interactionType === 'BOOKING' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0A1428] p-3.5 rounded-xl border border-white/5">
            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1">
                Date d'arrivée
              </label>
              <Input
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1">
                Date de départ
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1">
                Voyageurs
              </label>
              <Input
                type="number"
                min={1}
                max={20}
                value={guestsCount}
                onChange={(e) => setGuestsCount(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
        )}

        {(interactionType === 'APPOINTMENT' || interactionType === 'REQUEST') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0A1428] p-3.5 rounded-xl border border-white/5">
            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1">
                Date souhaitée
              </label>
              <Input
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1">
                Heure / Créneau souhaité
              </label>
              <Input
                type="time"
                value={requestedTime}
                onChange={(e) => setRequestedTime(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
        )}

        {/* Client Identity Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">
              Votre Nom complet
            </label>
            <Input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ex: Onésime Sovide"
              className="text-xs"
              leftIcon={<User className="w-3.5 h-3.5 text-gray-400" />}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">
              Téléphone (WhatsApp / SMS)
            </label>
            <Input
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="0154100617"
              className="text-xs font-mono"
              leftIcon={<Phone className="w-3.5 h-3.5 text-emerald-400" />}
            />
          </div>
        </div>

        {/* Message / Details */}
        <div>
          <label className="text-xs font-medium text-gray-300 block mb-1">
            Précisions / Votre message pour l'entreprise
          </label>
          <Textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Détaillez vos besoins ou contraintes horaires..."
            className="text-xs"
          />
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleWhatsAppDirect}
            leftIcon={<MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />}
            className="w-full sm:w-auto border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400"
          >
            Échanger sur WhatsApp ({target.businessPhone || '0154100617'})
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial"
            >
              Fermer
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              leftIcon={<Send className="w-4 h-4" />}
              className="flex-1 sm:flex-initial"
            >
              {isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
