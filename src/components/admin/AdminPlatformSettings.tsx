import React, { useEffect, useState } from 'react';
import {
  Settings,
  Shield,
  Bell,
  Globe,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  MessageSquare,
  Lock,
  Compass,
} from 'lucide-react';
import { Button } from '../design-system/Button';
import { flowexaApi } from '../../services/api';
import { FlowexaPlatformSettings } from '../../types';

export const AdminPlatformSettings: React.FC = () => {
  const [settings, setSettings] = useState<FlowexaPlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadSettings = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await flowexaApi.getAdminPlatformSettings();
      if (res.success && res.data) {
        setSettings(res.data);
      } else {
        setErrorMessage(res.message || 'Impossible de charger les paramètres.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      const res = await flowexaApi.adminUpdatePlatformSettings(settings);
      if (res.success && res.data) {
        setSettings(res.data);
        showToast('Paramètres de la plateforme mis à jour avec succès.');
      } else {
        showToast(res.message || 'Erreur lors de la sauvegarde.');
      }
    } catch (err: any) {
      showToast(err.message || 'Erreur réseau lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-12 text-center shadow-xl">
        <RefreshCw className="w-8 h-8 text-[#FB8205] animate-spin mx-auto mb-3" />
        <h3 className="text-white font-bold text-sm">Chargement des paramètres de la plateforme...</h3>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6 text-center shadow-xl space-y-3">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
        <p className="text-xs text-red-300">{errorMessage || 'Données introuvables.'}</p>
        <Button size="sm" variant="outline" onClick={loadSettings}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#020919] border border-[#10D97F]/40 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#10D97F]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0A1428] border border-white/10 rounded-2xl p-4 md:p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FB8205]/20 border border-[#FB8205]/30 flex items-center justify-center text-[#FB8205]">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Paramètres Généraux de la Plateforme
              <span className="text-[10px] bg-[#10D97F]/10 text-[#10D97F] border border-[#10D97F]/30 px-2 py-0.5 rounded-full font-semibold">
                Version 2.9 (Live)
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Gérez l'identité de marque, les politiques de modération, passerelles et sécurité
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadSettings}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Réinitialiser
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={handleSubmit}
            isLoading={saving}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            Sauvegarder
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Maintenance Banner Switch */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            settings.maintenanceMode
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-[#0A1428] border-white/10'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  settings.maintenanceMode
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-white/5 text-gray-400'
                }`}
              >
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Mode Maintenance Plateforme</h3>
                <p className="text-xs text-gray-400">
                  Bloque temporairement l'accès public Marketplace et affiche un message d'information
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) =>
                  setSettings({ ...settings, maintenanceMode: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
            </label>
          </div>
        </div>

        {/* Section 1: Identité & Contact */}
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-white/10 pb-3">
            <Globe className="w-4 h-4 text-[#0BE9EF]" />
            Identité Plateforme & Contact Officiel
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-gray-400 mb-1 font-semibold">Nom de la Plateforme</label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                className="w-full bg-[#020919] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FB8205]"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-semibold">Email de Contact Support</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full bg-[#020919] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FB8205]"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-semibold">Téléphone / WhatsApp Support Bénin</label>
              <input
                type="text"
                value={settings.supportPhone}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                className="w-full bg-[#020919] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FB8205]"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-semibold">Pays d'Opération Principal</label>
              <input
                type="text"
                value={settings.defaultCountry}
                onChange={(e) => setSettings({ ...settings, defaultCountry: e.target.value })}
                className="w-full bg-[#020919] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FB8205]"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-semibold">Devise Plateforme</label>
              <input
                type="text"
                value={settings.defaultCurrency}
                onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                className="w-full bg-[#020919] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FB8205]"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-semibold">Fuseau Horaire</label>
              <input
                type="text"
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full bg-[#020919] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FB8205]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Politiques d'Entreprise & Modération */}
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-white/10 pb-3">
            <Shield className="w-4 h-4 text-[#FB8205]" />
            Politiques d'Adhésion & Modération
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#020919] border border-white/5 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-xs">Exiger validation manuelle (KYC)</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Les nouvelles entreprises inscrites restent au statut 'PENDING' jusqu'à approbation Super Admin
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={settings.requireBusinessReview}
                  onChange={(e) =>
                    setSettings({ ...settings, requireBusinessReview: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FB8205]"></div>
              </label>
            </div>

            <div className="p-4 rounded-xl bg-[#020919] border border-white/5 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-xs">Autoriser les auto-inscriptions publiques</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Permettre à de nouveaux professionnels de créer leur fiche via le portail d'inscription
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={settings.allowPublicRegistrations}
                  onChange={(e) =>
                    setSettings({ ...settings, allowPublicRegistrations: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#10D97F]"></div>
              </label>
            </div>

            <div className="p-4 rounded-xl bg-[#020919] border border-white/5 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-xs">Publication automatique des avis clients</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Si activé, les avis vérifiés sont publiés immédiatement sans validation préalable
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={settings.reviewModerationAutoPublish}
                  onChange={(e) =>
                    setSettings({ ...settings, reviewModerationAutoPublish: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0BE9EF]"></div>
              </label>
            </div>

            <div className="p-4 rounded-xl bg-[#020919] border border-white/5 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-xs">Rayon de recherche géolocalisée max</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Distance maximale pour le matching géolocalisé au Bénin
                </p>
              </div>
              <div className="flex items-center gap-1.5 ml-4">
                <input
                  type="number"
                  min="5"
                  max="150"
                  value={settings.searchRadiusKm}
                  onChange={(e) =>
                    setSettings({ ...settings, searchRadiusKm: Number(e.target.value) })
                  }
                  className="w-16 bg-[#0A1428] border border-white/10 rounded-lg px-2 py-1 text-center text-xs text-white focus:outline-none focus:border-[#FB8205]"
                />
                <span className="text-xs text-gray-400">km</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Passerelles de Notification */}
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-white/10 pb-3">
            <Bell className="w-4 h-4 text-[#10D97F]" />
            Passerelles de Notification & Alertes
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-[#020919] border border-white/5 flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Canal SMS Bénin</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled?.sms}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notificationsEnabled: {
                        ...settings.notificationsEnabled,
                        sms: e.target.checked,
                      },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#10D97F]"></div>
              </label>
            </div>

            <div className="p-3.5 rounded-xl bg-[#020919] border border-white/5 flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Canal Email Transactionnel</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled?.email}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notificationsEnabled: {
                        ...settings.notificationsEnabled,
                        email: e.target.checked,
                      },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#10D97F]"></div>
              </label>
            </div>

            <div className="p-3.5 rounded-xl bg-[#020919] border border-white/5 flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Canal WhatsApp Direct</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled?.whatsapp}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notificationsEnabled: {
                        ...settings.notificationsEnabled,
                        whatsapp: e.target.checked,
                      },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#10D97F]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500">
            Dernière mise à jour enregistrée : {settings.updatedAt ? new Date(settings.updatedAt).toLocaleString('fr-FR') : 'Initiale'}
          </span>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={saving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </div>
  );
};
