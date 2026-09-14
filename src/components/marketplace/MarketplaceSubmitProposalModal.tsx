import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  DollarSign,
  Send,
  Loader2,
  Package,
  CheckCircle2,
  AlertCircle,
  Building,
} from 'lucide-react';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { Input, Textarea, Select } from '../design-system/Input';
import { MarketplaceRequestEntity, CatalogItem } from '../../types';
import { api } from '../../services/api';

export interface MarketplaceSubmitProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: MarketplaceRequestEntity;
  businessId: string;
  businessName: string;
  onSuccess: (response: any, message: string) => void;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const MarketplaceSubmitProposalModal: React.FC<MarketplaceSubmitProposalModalProps> = ({
  isOpen,
  onClose,
  request,
  businessId,
  businessName,
  onSuccess,
  onShowToast,
}) => {
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState<string>('');
  const [proposedPrice, setProposedPrice] = useState<string>(
    request.budgetMax ? request.budgetMax.toString() : ''
  );
  const [availableDate, setAvailableDate] = useState<string>(
    request.desiredDate || new Date().toISOString().split('T')[0]
  );
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoadingItems(true);
      try {
        const res = await api.getCatalogItems({ business_id: businessId });
        if (res.success && Array.isArray(res.data)) {
          setCatalogItems(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingItems(false);
      }
    };
    if (isOpen) {
      fetchCatalog();
    }
  }, [isOpen, businessId]);

  const handleCatalogItemChange = (itemId: string) => {
    setSelectedCatalogItemId(itemId);
    const item = catalogItems.find((c) => c.id === itemId);
    if (item && item.price) {
      setProposedPrice(item.price.toString());
      if (!message.trim()) {
        setMessage(`Bonjour, nous vous proposons notre prestation "${item.title}". Tout est inclus selon vos exigences.`);
      }
    }
  };

  const handleSubmit = async () => {
    const priceNum = parseInt(proposedPrice, 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      onShowToast('Prix invalide', 'Veuillez renseigner un prix proposé valide en FCFA.', 'warning');
      return;
    }
    if (!availableDate) {
      onShowToast('Date requise', 'Veuillez indiquer votre date de disponibilité.', 'warning');
      return;
    }
    if (!message.trim()) {
      onShowToast('Message requis', 'Veuillez rédiger un message expliquant votre proposition au client.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedItem = catalogItems.find((c) => c.id === selectedCatalogItemId);
      const res = await api.submitMarketplaceResponse(
        {
          marketplaceRequestId: request.id,
          businessId,
          businessName,
          catalogItemId: selectedCatalogItemId || undefined,
          catalogItemTitle: selectedItem ? selectedItem.title : undefined,
          proposedPrice: priceNum,
          availableDate,
          message,
        },
        { businessId, role: 'BUSINESS_OWNER' }
      );

      if (res.success && res.data) {
        onSuccess(res.data, 'Votre proposition a été transmise au client avec succès !');
        onClose();
      } else {
        onShowToast('Erreur', res.message || 'Impossible d’envoyer votre proposition.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      onShowToast('Erreur réseau', 'Impossible de joindre le serveur.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const catalogOptions = [
    { value: '', label: '-- Prestation ou devis sur-mesure --' },
    ...catalogItems.map((item) => ({
      value: item.id,
      label: `${item.title} (${(item.price || 0).toLocaleString('fr-FR')} FCFA)`,
    })),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transmettre une proposition commerciale">
      <div className="space-y-5 text-left text-white max-h-[75vh] overflow-y-auto pr-1">
        {/* Client Request Summary */}
        <div className="bg-[#111C38] border border-white/10 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FB8205] bg-[#FB8205]/10 px-2 py-0.5 rounded-lg border border-[#FB8205]/20 inline-block mb-1">
            Demande client : {request.category}
          </span>
          <h4 className="font-bold text-base text-white">{request.title}</h4>
          <p className="text-xs text-gray-300 mt-1 italic">"{request.description}"</p>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/5 text-xs text-gray-400">
            <div>
              <span>Localisation : </span>
              <strong className="text-white">{request.location}</strong>
            </div>
            <div>
              <span>Budget max client : </span>
              <strong className="text-emerald-400">
                {typeof request.budgetMax === 'number' ? `${request.budgetMax.toLocaleString('fr-FR')} FCFA` : 'Non spécifié'}
              </strong>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Rattacher une offre de votre catalogue (optionnel)
            </label>
            <Select
              value={selectedCatalogItemId}
              onChange={(e) => handleCatalogItemChange(e.target.value)}
              options={catalogOptions}
              className="w-full bg-[#0A1428] text-white border-white/10"
            />
            <span className="text-[11px] text-gray-400 mt-1 block">
              Permet au client de consulter les photos et caractéristiques complètes de votre offre.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Prix proposé (FCFA TTC) <span className="text-[#FB8205]">*</span>
              </label>
              <Input
                type="number"
                placeholder="Ex: 120000"
                value={proposedPrice}
                onChange={(e) => setProposedPrice(e.target.value)}
                className="w-full bg-[#0A1428] text-white border-white/10"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Date de disponibilité <span className="text-[#FB8205]">*</span>
              </label>
              <Input
                type="date"
                value={availableDate}
                onChange={(e) => setAvailableDate(e.target.value)}
                className="w-full bg-[#0A1428] text-white border-white/10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Message d’accompagnement <span className="text-[#FB8205]">*</span>
            </label>
            <Textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Expliquez pourquoi votre établissement est le partenaire idéal pour cette demande (qualité, garanties, réactivité)..."
              className="w-full bg-[#0A1428] text-white border-white/10"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#FB8205] hover:bg-[#e07304] text-white font-bold flex items-center gap-2 shadow-lg"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Envoyer la proposition</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
