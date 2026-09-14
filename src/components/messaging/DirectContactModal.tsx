import React, { useState } from 'react';
import { Send, Building2, ShoppingBag, X } from 'lucide-react';
import { flowexaApi } from '../../services/api';
import { Button } from '../design-system/Button';
import { Modal } from '../design-system/Modal';

export interface DirectContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: {
    businessId: string;
    businessName: string;
    catalogItemId?: string;
    catalogItemTitle?: string;
    catalogItemPrice?: number;
    catalogItemCurrency?: string;
    requestId?: string;
    bookingId?: string;
  } | null;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  onSuccess: (conversationId: string) => void;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const DirectContactModal: React.FC<DirectContactModalProps> = ({
  isOpen,
  onClose,
  target,
  clientId = 'client-test-1',
  clientName = 'Client Flowexa',
  clientPhone = '0154100617',
  onSuccess,
  onShowToast,
}) => {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!target) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await flowexaApi.createOrGetConversation(
        {
          clientId,
          clientName,
          clientPhone,
          businessId: target.businessId,
          catalogItemId: target.catalogItemId,
          requestId: target.requestId,
          bookingId: target.bookingId,
          initialMessage: message.trim(),
        },
        { role: 'CLIENT', clientId }
      );

      if (res.success && res.data) {
        onShowToast(
          res.isExisting ? 'Conversation reprise' : 'Message envoyé',
          `Votre échange avec ${target.businessName} est ouvert.`,
          'success'
        );
        setMessage('');
        onClose();
        onSuccess(res.data.id);
      } else {
        onShowToast('Erreur', res.error || 'Impossible d\'initier la conversation.', 'error');
      }
    } catch (err: any) {
      onShowToast('Erreur', 'Une erreur est survenue lors de l\'envoi.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contacter l'établissement">
      <div className="space-y-4">
        {/* Context Card */}
        <div className="p-3.5 bg-[#0A1428] border border-white/10 rounded-xl flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-[#0BE9EF] shrink-0" />
              <span className="text-xs font-bold text-white truncate">{target.businessName}</span>
            </div>
            {target.catalogItemTitle && (
              <div className="flex items-center gap-1.5 text-xs text-gray-300">
                <ShoppingBag className="w-3.5 h-3.5 text-[#FB8205] shrink-0" />
                <span className="truncate">{target.catalogItemTitle}</span>
              </div>
            )}
          </div>

          {typeof target.catalogItemPrice === 'number' && (
            <span className="text-[#0BE9EF] font-bold font-mono text-xs shrink-0">
              {(target.catalogItemPrice ?? 0).toLocaleString()} {target.catalogItemCurrency || 'FCFA'}
            </span>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Votre message à l'attention de l'entreprise
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Bonjour, je souhaiterais des renseignements concernant vos disponibilités ou tarifs..."
              className="w-full bg-white/5 border border-white/10 focus:border-[#0BE9EF] rounded-xl p-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none transition resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
              className="border-white/10 text-xs"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!message.trim() || submitting}
              leftIcon={<Send className={`w-3.5 h-3.5 ${submitting ? 'animate-pulse' : ''}`} />}
              className="text-xs font-bold"
            >
              {submitting ? 'Envoi...' : 'Envoyer le message'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
