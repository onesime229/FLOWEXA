import React, { useState } from 'react';
import {
  X,
  Sparkles,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Send,
  Loader2,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { Input, Textarea, Select } from '../design-system/Input';
import { api } from '../../services/api';

export interface MarketplaceNewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (request: any, message: string) => void;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

const CATEGORY_OPTIONS = [
  { value: 'Immobilier', label: 'Immobilier (Vente / Location)' },
  { value: 'Hébergement & Guest House', label: 'Hébergement & Guest House' },
  { value: 'Coiffure & Beauté', label: 'Coiffure & Beauté' },
  { value: 'Spa & Massage', label: 'Spa & Massage' },
  { value: 'Photographie & Studio', label: 'Photographie & Studio' },
  { value: 'Mode & Broderie sur mesure', label: 'Mode & Broderie sur mesure' },
  { value: 'Garage & Entretien Véhicules', label: 'Garage & Mécanique' },
  { value: 'Services Généraux', label: 'Autre prestation' },
];

export const MarketplaceNewRequestModal: React.FC<MarketplaceNewRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onShowToast,
}) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Immobilier');
  const [location, setLocation] = useState('Cotonou, Haie Vive');
  const [radiusKm, setRadiusKm] = useState(10);
  const [budgetMin, setBudgetMin] = useState<string>('');
  const [budgetMax, setBudgetMax] = useState<string>('');
  const [desiredDate, setDesiredDate] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAiParse = async () => {
    if (!aiPrompt.trim()) {
      onShowToast('Texte requis', 'Veuillez décrire votre besoin pour l’analyse IA.', 'warning');
      return;
    }
    setIsAnalyzing(true);
    try {
      const res = await api.parseMarketplacePrompt(aiPrompt);
      if (res.success && res.data) {
        const d = res.data;
        if (d.title) setTitle(d.title);
        if (d.category) {
          const matchedCat = CATEGORY_OPTIONS.find((c) => c.value.toLowerCase().includes(d.category.toLowerCase()));
          if (matchedCat) setCategory(matchedCat.value);
        }
        if (d.location) setLocation(d.location);
        if (d.budgetMax) setBudgetMax(d.budgetMax.toString());
        if (d.desiredDate) setDesiredDate(d.desiredDate);
        if (d.description) setDescription(d.description);
        onShowToast('Analyse réussie', 'Les critères ont été extraits et renseignés automatiquement.', 'success');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Erreur analyse', 'Impossible d’analyser le texte automatiquement.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (publishImmediately: boolean) => {
    if (!title.trim() || !description.trim() || !location.trim()) {
      onShowToast('Champs obligatoires', 'Veuillez renseigner au moins le titre, la description et la zone géographique.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createMarketplaceRequest({
        title,
        category,
        location,
        radiusKm: Number(radiusKm) || 10,
        budgetMin: budgetMin ? parseInt(budgetMin, 10) : undefined,
        budgetMax: budgetMax ? parseInt(budgetMax, 10) : undefined,
        desiredDate: desiredDate || undefined,
        description,
        publishImmediately,
      });

      if (res.success && res.data) {
        onSuccess(
          res.data,
          publishImmediately
            ? `Demande publiée ! Les entreprises de ${category} à proximité ont été notifiées.`
            : 'Demande enregistrée en brouillon.'
        );
        onClose();
      } else {
        onShowToast('Erreur', res.message || 'Échec de l’enregistrement de la demande.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      onShowToast('Erreur réseau', 'Impossible de joindre le serveur Flowexa.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Publier une demande sur la Marketplace Flowexa">
      <div className="space-y-5 text-left text-white max-h-[75vh] overflow-y-auto pr-1">
        {/* IA Smart Assistant Box */}
        <div className="bg-[#111C38] border border-[#FB8205]/30 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-2 text-[#FB8205] text-sm font-bold mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Assistant IA Flowexa (Formulation libre)</span>
          </div>
          <p className="text-xs text-gray-300 mb-3">
            Décrivez votre besoin avec vos propres mots. Notre système extrait automatiquement la catégorie, la ville, le budget et les dates.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: Recherche studio meublé avec groupe à Cadjehoun pour 100 000 FCFA début octobre..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAiParse();
              }}
              className="flex-1 bg-[#0A1428] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8205]"
            />
            <button
              type="button"
              onClick={handleAiParse}
              disabled={isAnalyzing}
              className="bg-[#FB8205] hover:bg-[#e07304] disabled:opacity-50 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Analyser</span>
            </button>
          </div>
        </div>

        {/* Manual Detailed Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Titre de la demande <span className="text-[#FB8205]">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Tresses africaines soignées pour cérémonie samedi matin"
              className="w-full bg-[#0A1428] text-white border-white/10"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Catégorie de service <span className="text-[#FB8205]">*</span>
            </label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={CATEGORY_OPTIONS}
              className="w-full bg-[#0A1428] text-white border-white/10"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Zone géographique / Ville <span className="text-[#FB8205]">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Cotonou, Haie Vive ou Akpakpa"
                className="w-full pl-9 bg-[#0A1428] text-white border-white/10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Rayon de recherche max ({radiusKm} km)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="50"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="flex-1 accent-[#FB8205]"
              />
              <span className="text-xs font-mono font-bold text-[#FB8205] w-12">{radiusKm} km</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Date souhaitée
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <Input
                type="date"
                value={desiredDate}
                onChange={(e) => setDesiredDate(e.target.value)}
                className="w-full pl-9 bg-[#0A1428] text-white border-white/10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Budget min (FCFA)
            </label>
            <Input
              type="number"
              placeholder="Ex: 20000"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              className="w-full bg-[#0A1428] text-white border-white/10"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Budget max (FCFA)
            </label>
            <Input
              type="number"
              placeholder="Ex: 50000"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              className="w-full bg-[#0A1428] text-white border-white/10"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Description détaillée des attentes <span className="text-[#FB8205]">*</span>
            </label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Précisez toutes vos contraintes, équipements requis ou particularités de votre demande..."
              className="w-full bg-[#0A1428] text-white border-white/10"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="border-white/20 hover:bg-white/5"
          >
            Enregistrer brouillon
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="bg-[#FB8205] hover:bg-[#e07304] text-white font-bold flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Publier et lancer le matching</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
