import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Building2,
  MapPin,
  Clock,
  Camera,
  Upload,
  Trash2,
  Compass,
  CheckCircle2,
  Save,
  AlertCircle,
  Phone,
  MessageCircle,
  Mail,
  FileText,
} from 'lucide-react';
import { Button } from '../design-system/Button';
import { Input } from '../design-system/Input';
import { Badge } from '../design-system/Badge';
import { flowexaApi, BusinessData } from '../../services/api';
import { FLOWEXA_MODULES } from '../../data/mockData';

interface BusinessSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  onBusinessUpdated?: (updated: BusinessData) => void;
}

export const BusinessSettingsModal: React.FC<BusinessSettingsModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onBusinessUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'INFO' | 'GEO' | 'PHOTOS'>('INFO');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State (initialized clean)
  const [formData, setFormData] = useState<Partial<BusinessData>>({
    name: '',
    module_code: 'IMMOBILIER',
    description: '',
    address: '',
    city: 'Cotonou',
    district: '',
    latitude: 6.355,
    longitude: 2.41,
    phone: '',
    whatsapp: '',
    email: '',
    opening_hours: {
      lundi: '08:00 - 18:00',
      mardi: '08:00 - 18:00',
      mercredi: '08:00 - 18:00',
      jeudi: '08:00 - 18:00',
      vendredi: '08:00 - 18:00',
      samedi: '09:00 - 16:00',
      dimanche: 'Fermé',
    },
    images: [],
  });

  // Load business details from API
  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    flowexaApi
      .getMyBusiness()
      .then((res) => {
        if (res.success && res.data) {
          setFormData((prev) => ({
            ...prev,
            ...res.data,
            opening_hours: res.data.opening_hours || prev.opening_hours,
            images: res.data.images || [],
          }));
        }
      })
      .catch((err) => {
        console.error('Erreur chargement profil entreprise:', err);
      })
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  // Geolocation detection via HTML5 API
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      onShowToast('GPS non supporté', 'Votre navigateur ne prend pas en charge la géolocalisation.', 'warning');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        setIsLocating(false);
        onShowToast('Coordonnées GPS capturées', `Latitude: ${lat}, Longitude: ${lng}`, 'success');
      },
      (error) => {
        setIsLocating(false);
        onShowToast('Erreur GPS', 'Impossible de récupérer la position GPS précise.', 'warning');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Upload image
  const handleFileUpload = async (file: File) => {
    try {
      onShowToast('Téléversement', 'Envoi de la photo en cours...', 'info');
      const res = await flowexaApi.uploadBusinessImage(file, 'Photo de l’établissement');
      if (res.success && res.data) {
        setFormData((prev) => ({
          ...prev,
          images: [...(prev.images || []), res.data],
        }));
        onShowToast('Photo ajoutée', 'La photo a été téléversée avec succès.', 'success');
      }
    } catch (err: any) {
      onShowToast('Erreur téléversement', err.message || 'Échec de l’envoi de la photo.', 'error');
    }
  };

  // Submit profile updates to API
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await flowexaApi.updateMyBusiness({
        name: formData.name,
        module_code: formData.module_code,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        district: formData.district,
        latitude: formData.latitude,
        longitude: formData.longitude,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        email: formData.email,
        opening_hours: formData.opening_hours,
      });

      if (res.success && res.data) {
        onShowToast('Profil entreprise mis à jour', 'Les coordonnées et informations ont été enregistrées.', 'success');
        if (onBusinessUpdated) {
          onBusinessUpdated(res.data);
        }
        onClose();
      }
    } catch (err: any) {
      onShowToast('Erreur', err.message || 'Impossible d’enregistrer les modifications.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#020919]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FB8205]/10 border border-[#FB8205]/30 flex items-center justify-center text-[#FB8205]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Paramètres Établissement & Vitrine</h2>
              <p className="text-xs text-gray-400">Profil d'entreprise, coordonnées GPS et photos réelles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-white/5 bg-[#020919]/50">
          <button
            type="button"
            onClick={() => setActiveTab('INFO')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'INFO'
                ? 'border-[#FB8205] text-[#FB8205]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Informations & Horaires</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('GEO')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'GEO'
                ? 'border-[#0BE9EF] text-[#0BE9EF]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Adresse & Géolocalisation GPS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PHOTOS')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'PHOTOS'
                ? 'border-[#10D97F] text-[#10D97F]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Photos Vitrine ({formData.images?.length || 0})</span>
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: INFORMATIONS GÉNÉRALES & HORAIRES */}
          {activeTab === 'INFO' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Nom commercial de l'entreprise *</label>
                  <Input
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex : Mon Entreprise"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Secteur métier Flowexa</label>
                  <select
                    value={formData.module_code || 'IMMOBILIER'}
                    onChange={(e) => setFormData({ ...formData, module_code: e.target.value as any })}
                    className="w-full bg-[#020919] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FB8205]"
                  >
                    {FLOWEXA_MODULES.map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.name} ({m.subtitle})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Téléphone standard</label>
                  <Input
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Ex : +229 00 00 00 00"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Numéro WhatsApp direct</label>
                  <Input
                    value={formData.whatsapp || ''}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="Ex : +229 00 00 00 00"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Email professionnel</label>
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@domaine.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Description de l'activité & engagements</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Présentation des services, spécialités et conditions d'accueil..."
                  className="w-full bg-[#020919] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8205]"
                />
              </div>

              {/* Horaires d'ouverture */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FB8205]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Horaires d'ouverture hebdomadaires
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'].map((day) => (
                    <div key={day} className="flex items-center justify-between p-2 rounded-lg bg-[#020919] border border-white/5">
                      <span className="capitalize text-gray-400 font-medium">{day}</span>
                      <input
                        type="text"
                        value={(formData.opening_hours as any)?.[day] || '08:00 - 18:00'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            opening_hours: {
                              ...(formData.opening_hours as any),
                              [day]: e.target.value,
                            },
                          })
                        }
                        placeholder="Ex : 08:00 - 19:00 ou Fermé"
                        className="bg-transparent border-b border-white/10 text-right text-white text-xs py-0.5 focus:outline-none focus:border-[#FB8205] w-32"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ADRESSE & GÉOLOCALISATION GPS */}
          {activeTab === 'GEO' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-[#0BE9EF]/5 border border-[#0BE9EF]/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#0BE9EF]">
                    <Compass className="w-4 h-4 animate-spin-slow" />
                    <span className="text-xs font-bold">Localisation GPS pour la recherche de proximité</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    isLoading={isLocating}
                    onClick={handleDetectGPS}
                    leftIcon={<Compass className="w-3.5 h-3.5 text-[#0BE9EF]" />}
                    className="border-[#0BE9EF]/40 text-[#0BE9EF]"
                  >
                    Détecter ma position GPS actuelle
                  </Button>
                </div>
                <p className="text-[11px] text-gray-400">
                  Ces coordonnées exactes permettent aux clients utilisant le filtre « Autour de moi » de localiser votre établissement avec calcul précis de la distance (Haversine).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Ville (Bénin) *</label>
                  <Input
                    required
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Ex : Cotonou"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Quartier / Zone *</label>
                  <Input
                    required
                    value={formData.district || ''}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="Ex : Haie Vive, Fidjrossè, Ganhi..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Adresse détaillée ou repère géographique</label>
                <Input
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Ex : Rue 380, face pharmacie..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Coordonnée Latitude (GPS)</label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.latitude ?? ''}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                    placeholder="Ex : 6.355000"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Coordonnée Longitude (GPS)</label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.longitude ?? ''}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                    placeholder="Ex : 2.410000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PHOTOS & VITRINE */}
          {activeTab === 'PHOTOS' && (
            <div className="space-y-5">
              {/* Drag and drop upload zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 hover:border-[#10D97F]/50 rounded-2xl p-8 text-center bg-[#020919] cursor-pointer transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-400 group-hover:text-[#10D97F] group-hover:bg-[#10D97F]/10 transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white mt-3">Cliquez pour téléverser une photo réelle</h4>
                <p className="text-xs text-gray-500 mt-1">Formats acceptés : PNG, JPG, WEBP (Max 10 Mo)</p>
              </div>

              {/* Gallery of uploaded photos */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Photos actuelles de la vitrine ({formData.images?.length || 0})
                </h4>

                {(!formData.images || formData.images.length === 0) ? (
                  <p className="text-xs text-gray-500 italic p-4 bg-[#020919] rounded-xl text-center">
                    Aucune photo ajoutée pour le moment. Téléversez des photos pour attirer des clients depuis la recherche.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {formData.images.map((img) => (
                      <div key={img.id} className="relative rounded-xl overflow-hidden border border-white/10 group h-32">
                        <img src={img.url} alt={img.caption || 'Vitrine'} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await flowexaApi.deleteBusinessImage(img.id);
                                setFormData((prev) => ({
                                  ...prev,
                                  images: prev.images?.filter((i) => i.id !== img.id),
                                }));
                                onShowToast('Photo supprimée', 'La photo a été retirée de la vitrine.', 'info');
                              } catch (err: any) {
                                onShowToast('Erreur', err.message || 'Impossible de supprimer.', 'error');
                              }
                            }}
                            className="p-2 rounded-lg bg-red-500/80 text-white hover:bg-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
