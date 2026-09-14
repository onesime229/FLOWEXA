import React, { useState } from 'react';
import {
  Heart,
  Trash2,
  ExternalLink,
  MessageCircle,
  MapPin,
  Building2,
  Calendar,
  Sparkles,
  Phone,
  Search,
} from 'lucide-react';
import { FavoriteItem } from '../../types';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { flowexaApi } from '../../services/api';

export interface ClientFavoritesProps {
  favorites: FavoriteItem[];
  onRefresh: () => void;
  onRequestItem: (target: {
    businessId: string;
    businessName: string;
    businessPhone: string;
    catalogItemId?: string;
    catalogItemTitle?: string;
    catalogItemPrice?: number;
    catalogItemCurrency?: string;
    defaultInteractionType: 'REQUEST' | 'BOOKING' | 'APPOINTMENT' | 'CONTACT';
  }) => void;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  onExplore: () => void;
}

export const ClientFavorites: React.FC<ClientFavoritesProps> = ({
  favorites,
  onRefresh,
  onRequestItem,
  onShowToast,
  onExplore,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'OFFERS' | 'BUSINESSES'>('ALL');
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemoveFavorite = async (id: string, name: string) => {
    setRemovingId(id);
    try {
      const res = await flowexaApi.removeFavorite(id, 'client-test-1');
      if (res.success) {
        onShowToast('Favori retiré', `"${name}" a été retiré de vos favoris.`, 'info');
        onRefresh();
      } else {
        onShowToast('Erreur', res.message || 'Impossible de retirer le favori.', 'error');
      }
    } catch (err: any) {
      onShowToast('Erreur réseau', err.message, 'error');
    } finally {
      setRemovingId(null);
    }
  };

  const filteredFavorites = favorites.filter((fav) => {
    if (filter === 'OFFERS') return Boolean(fav.catalogItemId);
    if (filter === 'BUSINESSES') return Boolean(fav.businessId && !fav.catalogItemId);
    return true;
  });

  return (
    <div className="w-full space-y-6 text-left animate-in fade-in duration-200">
      {/* Header with filter tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Mes Favoris</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#FB8205]/20 text-[#FB8205] border border-[#FB8205]/30">
              {favorites.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Retrouvez en un clic les entreprises et les offres que vous avez sauvegardées.
          </p>
        </div>

        {favorites.length > 0 && (
          <div className="flex items-center gap-1.5 bg-[#0A1428] border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-[#FB8205] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Tous ({favorites.length})
            </button>
            <button
              onClick={() => setFilter('OFFERS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === 'OFFERS'
                  ? 'bg-[#FB8205] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Offres ({favorites.filter((f) => f.catalogItemId).length})
            </button>
            <button
              onClick={() => setFilter('BUSINESSES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === 'BUSINESSES'
                  ? 'bg-[#FB8205] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Entreprises ({favorites.filter((f) => f.businessId && !f.catalogItemId).length})
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {favorites.length === 0 ? (
        <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
            <Heart className="w-6 h-6 text-rose-400" />
          </div>
          <h4 className="text-base font-bold text-white">Aucun favori enregistré</h4>
          <p className="text-xs text-gray-400">
            En explorant les offres ou entreprises Flowexa, cliquez sur le bouton cœur pour les retrouver facilement ici.
          </p>
          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={onExplore} leftIcon={<Search className="w-3.5 h-3.5" />}>
              Explorer le catalogue
            </Button>
          </div>
        </div>
      ) : filteredFavorites.length === 0 ? (
        <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-8 text-center text-xs text-gray-400">
          Aucun élément dans cette catégorie de favoris.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFavorites.map((fav) => {
            const isOffer = Boolean(fav.catalogItem);
            const isBusiness = Boolean(fav.business && !fav.catalogItem);

            if (isOffer && fav.catalogItem) {
              const item = fav.catalogItem;
              return (
                <div
                  key={fav.id}
                  className="bg-[#0A1428] border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden flex flex-col justify-between transition-all group shadow-md"
                >
                  <div>
                    {/* Offer Image */}
                    <div className="relative h-44 w-full bg-[#020919] overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          <Building2 className="w-10 h-10" />
                        </div>
                      )}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0A1428]/80 backdrop-blur-md text-[#FB8205] border border-white/10">
                          {item.offerType || 'OFFRE'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveFavorite(fav.id, item.title)}
                        disabled={removingId === fav.id}
                        className="absolute top-2.5 right-2.5 p-2 rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600 transition-transform active:scale-95 cursor-pointer"
                        title="Retirer des favoris"
                      >
                        <Heart className="w-4 h-4 fill-white" />
                      </button>
                    </div>

                    {/* Offer details */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#0BE9EF]" />
                          {item.district ? `${item.district}, ` : ''}{item.city}
                        </span>
                        <span className="text-gray-400 font-medium">{item.businessName}</span>
                      </div>

                      <h4 className="text-sm font-bold text-white line-clamp-2">{item.title}</h4>

                      <div className="text-emerald-400 font-extrabold text-sm">
                        {(item.price ?? 0).toLocaleString()} {item.currency || 'FCFA'}{' '}
                        <span className="text-[11px] font-normal text-gray-400">
                          {item.priceType === 'PER_NIGHT' ? '/ nuit' : item.priceType === 'PER_DAY' ? '/ jour' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 pt-0 flex items-center gap-2 border-t border-white/5 mt-2">
                    <Button
                      size="sm"
                      variant="primary"
                      className="flex-1 text-xs"
                      onClick={() =>
                        onRequestItem({
                          businessId: item.businessId,
                          businessName: item.businessName,
                          businessPhone: '0154100617',
                          catalogItemId: item.id,
                          catalogItemTitle: item.title,
                          catalogItemPrice: item.price,
                          catalogItemCurrency: item.currency,
                          defaultInteractionType:
                            item.moduleCode === 'GUEST_HOUSE'
                              ? 'BOOKING'
                              : item.moduleCode === 'IMMOBILIER'
                              ? 'APPOINTMENT'
                              : 'REQUEST',
                        })
                      }
                    >
                      Interagir / Réserver
                    </Button>
                    <button
                      onClick={() => handleRemoveFavorite(fav.id, item.title)}
                      disabled={removingId === fav.id}
                      className="p-2 text-gray-400 hover:text-rose-400 transition-colors rounded-xl border border-white/5 hover:border-rose-500/30 cursor-pointer"
                      title="Retirer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            }

            if (isBusiness && fav.business) {
              const b = fav.business;
              return (
                <div
                  key={fav.id}
                  className="bg-[#0A1428] border border-white/10 hover:border-white/20 rounded-2xl p-4 flex flex-col justify-between transition-all group shadow-md space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#020919] border border-white/10 flex items-center justify-center text-white overflow-hidden shrink-0">
                          {b.image ? (
                            <img src={b.image} alt={b.name} className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="w-6 h-6 text-[#FB8205]" />
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[#0BE9EF] uppercase tracking-wider">
                            Entreprise Partenaire
                          </span>
                          <h4 className="text-sm font-bold text-white line-clamp-1">{b.name}</h4>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-500" />
                            {b.district ? `${b.district}, ` : ''}{b.city}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveFavorite(fav.id, b.name)}
                        disabled={removingId === fav.id}
                        className="p-1.5 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                        title="Retirer des favoris"
                      >
                        <Heart className="w-4 h-4 fill-rose-500" />
                      </button>
                    </div>

                    <div className="text-xs text-gray-300 font-mono bg-[#020919] p-2.5 rounded-xl border border-white/5 flex items-center justify-between">
                      <span>Tél : {b.phone}</span>
                      <span className="text-emerald-400 font-sans font-semibold">Vérifiée ✓</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <a
                      href={`https://wa.me/229${b.whatsapp || b.phone}?text=${encodeURIComponent(
                        `Bonjour ${b.name}, je vous contacte depuis vos favoris sur Flowexa.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Pro</span>
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-white/10"
                      onClick={() =>
                        onRequestItem({
                          businessId: b.id,
                          businessName: b.name,
                          businessPhone: b.phone,
                          defaultInteractionType: 'CONTACT',
                        })
                      }
                    >
                      Message
                    </Button>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
};
