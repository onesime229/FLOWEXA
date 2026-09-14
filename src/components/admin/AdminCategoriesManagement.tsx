import React, { useEffect, useState } from 'react';
import {
  Layers,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Edit2,
  ExternalLink,
  ShieldCheck,
  Tag,
  Building2,
  RefreshCw,
  Eye,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { flowexaApi } from '../../services/api';
import { PlatformCategoryEntity } from '../../types';

export const AdminCategoriesManagement: React.FC = () => {
  const [categories, setCategories] = useState<PlatformCategoryEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<string>('ALL');
  const [editingCategory, setEditingCategory] = useState<PlatformCategoryEntity | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    subtitle: '',
    category: '',
    description: '',
    accentColor: '#FB8205',
    iconName: 'Building2',
    order: 1,
    associatedModuleCodes: ['IMMOBILIER'],
    features: '',
    sampleQuery: '',
    seoTitle: '',
    seoDescription: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await flowexaApi.getAdminCategories();
      if (res.success && Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Erreur chargement catégories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleToggle = async (cat: PlatformCategoryEntity) => {
    try {
      const res = await flowexaApi.adminToggleCategory(cat.id);
      if (res.success && res.data) {
        setCategories((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, isActive: res.data.isActive } : c))
        );
        showToast(`Catégorie "${cat.name}" : statut ${res.data.isActive ? 'activé' : 'désactivé'}.`);
      }
    } catch (err) {
      showToast('Erreur lors du changement de statut.');
    }
  };

  const openEdit = (cat: PlatformCategoryEntity) => {
    setEditingCategory(cat);
    setIsCreating(false);
    setFormData({
      code: cat.code,
      name: cat.name,
      subtitle: cat.subtitle,
      category: cat.category,
      description: cat.description,
      accentColor: cat.accentColor || '#FB8205',
      iconName: cat.iconName || 'Building2',
      order: cat.order || 1,
      associatedModuleCodes: cat.associatedModuleCodes || [cat.code],
      features: (cat.features || []).join(', '),
      sampleQuery: cat.sampleQuery || '',
      seoTitle: cat.seo?.metaTitle || '',
      seoDescription: cat.seo?.metaDescription || '',
    });
  };

  const openCreate = () => {
    setEditingCategory(null);
    setIsCreating(true);
    setFormData({
      code: '',
      name: '',
      subtitle: '',
      category: 'Services',
      description: '',
      accentColor: '#FB8205',
      iconName: 'Building2',
      order: categories.length + 1,
      associatedModuleCodes: ['IMMOBILIER'],
      features: 'Réservation en ligne, Rappels automatiques',
      sampleQuery: '',
      seoTitle: '',
      seoDescription: '',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      showToast('Le nom et le code technique sont obligatoires.');
      return;
    }

    const payload = {
      code: formData.code.toUpperCase().trim(),
      name: formData.name.trim(),
      subtitle: formData.subtitle.trim(),
      category: formData.category.trim(),
      description: formData.description.trim(),
      accentColor: formData.accentColor,
      iconName: formData.iconName,
      order: Number(formData.order) || 1,
      isActive: true,
      associatedModuleCodes: formData.associatedModuleCodes,
      features: formData.features.split(',').map((f) => f.trim()).filter(Boolean),
      sampleQuery: formData.sampleQuery.trim(),
      seo: {
        metaTitle: formData.seoTitle.trim(),
        metaDescription: formData.seoDescription.trim(),
        keywords: [formData.name, formData.category, 'Bénin'],
      },
    };

    try {
      if (editingCategory) {
        const res = await flowexaApi.adminUpdateCategory(editingCategory.id, payload);
        if (res.success && res.data) {
          setCategories((prev) =>
            prev.map((c) => (c.id === editingCategory.id ? { ...c, ...res.data } : c))
          );
          showToast(`Catégorie "${payload.name}" mise à jour avec succès.`);
          setEditingCategory(null);
        } else {
          showToast(res.message || 'Erreur lors de la mise à jour.');
        }
      } else if (isCreating) {
        const res = await flowexaApi.adminCreateCategory(payload);
        if (res.success && res.data) {
          setCategories((prev) => [...prev, res.data]);
          showToast(`Catégorie "${payload.name}" créée avec succès.`);
          setIsCreating(false);
        } else {
          showToast(res.message || 'Erreur lors de la création.');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Erreur réseau.');
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (filterActive === 'ACTIVE' && !c.isActive) return false;
    if (filterActive === 'INACTIVE' && c.isActive) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#020919] border border-[#10D97F]/40 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#10D97F]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0A1428] border border-white/10 rounded-2xl p-4 md:p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0BE9EF]/20 border border-[#0BE9EF]/30 flex items-center justify-center text-[#0BE9EF]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Gestion des Catégories & Secteurs Métiers
              <span className="text-[11px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-full font-semibold">
                {categories.length} configurées
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Paramétrez les libellés, méta-titres SEO, filtres Marketplace et règles métiers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadCategories}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Actualiser
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={openCreate}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Ajouter un secteur
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#0A1428] border border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 flex-1 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher par nom, code (ex: IMMOBILIER), domaine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#020919] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8205]"
            />
          </div>

          <div className="flex items-center gap-1">
            {[
              { label: 'Tous', value: 'ALL' },
              { label: 'Actifs', value: 'ACTIVE' },
              { label: 'Inactifs', value: 'INACTIVE' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterActive(f.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  filterActive === f.value
                    ? 'bg-[#FB8205] text-white'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-400">
          Affichage de <strong className="text-white">{filteredCategories.length}</strong> sur {categories.length}
        </div>
      </div>

      {/* Category List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCategories.map((cat) => (
          <div
            key={cat.id}
            className={`bg-[#0A1428] border rounded-2xl p-4 shadow-lg transition-all space-y-3 ${
              cat.isActive ? 'border-white/10 hover:border-white/20' : 'border-red-500/20 opacity-70'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs"
                  style={{
                    backgroundColor: `${cat.accentColor}20`,
                    color: cat.accentColor,
                    border: `1px solid ${cat.accentColor}40`,
                  }}
                >
                  #{cat.order}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm">{cat.name}</h3>
                    <span className="text-[10px] font-mono bg-white/5 text-gray-300 px-2 py-0.5 rounded border border-white/10">
                      {cat.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">{cat.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEdit(cat)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                  title="Modifier"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleToggle(cat)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    cat.isActive
                      ? 'bg-[#10D97F]/10 text-[#10D97F] hover:bg-[#10D97F]/20'
                      : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                  }`}
                  title={cat.isActive ? 'Désactiver' : 'Activer'}
                >
                  {cat.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-400 line-clamp-2">{cat.description}</p>

            {/* Features Tags */}
            {cat.features && cat.features.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {cat.features.map((feat, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-white/5 text-gray-300 px-2 py-0.5 rounded-md border border-white/5"
                  >
                    {feat}
                  </span>
                ))}
              </div>
            )}

            {/* Footer Information */}
            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#0BE9EF]" />
                  <strong className="text-white">{cat.businessCount || 0}</strong> entreprise(s)
                </span>
                <span>• Domaine: <strong className="text-gray-300">{cat.category}</strong></span>
              </div>
              <span
                className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                  cat.isActive
                    ? 'bg-[#10D97F]/10 text-[#10D97F] border border-[#10D97F]/30'
                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}
              >
                {cat.isActive ? 'Actif sur la plateforme' : 'Désactivé'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Modal */}
      {(editingCategory || isCreating) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A1428] border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FB8205]/20 text-[#FB8205] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-base">
                  {editingCategory ? `Modifier la catégorie : ${editingCategory.name}` : 'Créer une nouvelle catégorie'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setIsCreating(false);
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Nom affiché *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#020919] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FB8205]"
                    placeholder="Ex: Salons de Coiffure"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Code technique unique (MAJUSCULES) *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingCategory}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full bg-[#020919] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FB8205] disabled:opacity-50"
                    placeholder="Ex: COIFFURE"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Sous-titre / Accroche</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full bg-[#020919] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FB8205]"
                    placeholder="Ex: Style, Brushing & Soins capillaires"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Famille / Regroupement</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#020919] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FB8205]"
                    placeholder="Ex: Beauté & Soins"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Description détaillée</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#020919] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FB8205]"
                  placeholder="Explication claire des services et prises en charge pour ce secteur."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Couleur d'accentuation</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <span className="font-mono text-gray-300">{formData.accentColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Ordre d'affichage</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    className="w-full bg-[#020919] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FB8205]"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Exemple de requête IA</label>
                  <input
                    type="text"
                    value={formData.sampleQuery}
                    onChange={(e) => setFormData({ ...formData, sampleQuery: e.target.value })}
                    className="w-full bg-[#020919] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FB8205]"
                    placeholder="Ex: Tresses samedi matin"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Fonctionnalités incluses (séparées par virgule)</label>
                <input
                  type="text"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className="w-full bg-[#020919] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FB8205]"
                  placeholder="Agenda par collaborateur, Catalogue forfaits, Rappels SMS"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[#020919] border border-white/5 space-y-3">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#0BE9EF]" />
                  Référencement & SEO Bénin
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 mb-1 text-[11px]">Titre SEO (Meta Title)</label>
                    <input
                      type="text"
                      value={formData.seoTitle}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      className="w-full bg-[#0A1428] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#FB8205]"
                      placeholder="Ex: Meilleurs Salons de Coiffure au Bénin | Flowexa"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1 text-[11px]">Description SEO</label>
                    <input
                      type="text"
                      value={formData.seoDescription}
                      onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                      className="w-full bg-[#0A1428] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#FB8205]"
                      placeholder="Prenez rendez-vous en ligne chez les coiffeurs réputés."
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingCategory(null);
                    setIsCreating(false);
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingCategory ? 'Sauvegarder les modifications' : 'Créer la catégorie'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
