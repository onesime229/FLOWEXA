import React, { useState } from 'react';
import {
  ArrowLeft,
  Heart,
  Phone,
  MessageCircle,
  Navigation,
  Star,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Share2,
} from 'lucide-react';
import { ClientEstablishment } from './clientData';

interface ClientEstablishmentViewProps {
  establishment: ClientEstablishment;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onBack: () => void;
  onStartBooking: (type: string, serviceTitle?: string, price?: number) => void;
  onOpenChat: (businessName: string, contextTitle: string) => void;
  onOpenReviewModal: () => void;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ClientEstablishmentView: React.FC<ClientEstablishmentViewProps> = ({
  establishment,
  isFavorite,
  onToggleFavorite,
  onBack,
  onStartBooking,
  onOpenChat,
  onOpenReviewModal,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'ABOUT' | 'SERVICES' | 'OFFERS' | 'PHOTOS' | 'REVIEWS'>('ABOUT');

  const getCtaLabel = () => {
    switch (establishment.bookingType) {
      case 'visite':
        return 'Demander une visite';
      case 'rdv':
        return 'Prendre rendez-vous';
      case 'table':
        return 'Réserver une table';
      case 'vehicule':
        return 'Réserver ce véhicule';
      case 'devis':
        return 'Demander un devis';
      case 'nuit':
      default:
        return 'Réserver maintenant';
    }
  };

  return (
    <div className="relative pb-28 min-h-screen bg-[#F8FAFC] text-[#111827]">
      {/* Hero Banner */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden">
        <img
          src={establishment.coverImage}
          alt={establishment.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20" />

        <button
          onClick={onBack}
          aria-label="Retour"
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/95 shadow-md flex items-center justify-center text-[#111827] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <button
          onClick={onToggleFavorite}
          aria-label="Ajouter aux favoris"
          className={`absolute top-4 right-4 w-10 h-10 rounded-full bg-white/95 shadow-md flex items-center justify-center transition-all cursor-pointer ${
            isFavorite ? 'text-[#E5484D] fxa-pop' : 'text-[#C0C9D6]'
          }`}
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Main Info Card */}
      <div className="relative -mt-6 bg-white rounded-t-3xl pt-5 px-5 pb-3 shadow-xs border-t border-[#E8EDF3]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#111827] leading-tight font-disp">
              {establishment.name}
            </h1>
            <div className="text-xs sm:text-sm text-[#5C6B80] font-semibold mt-1">
              {establishment.categoryName} · {establishment.neighborhood}, {establishment.city}
            </div>
          </div>
        </div>

        {/* Metaline */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs sm:text-sm font-semibold text-[#5C6B80]">
          {establishment.isVerified && (
            <span className="text-[#0794A0] font-black flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Vérifié
            </span>
          )}
          <span className="text-[#C3CCD9]">·</span>
          <span className="text-[#E06900] font-black flex items-center gap-0.5">
            <Star className="w-3.5 h-3.5 fill-[#E06900]" /> {establishment.rating}
          </span>
          <span className="text-[#97A3B4]">({establishment.reviewCount} avis)</span>
          <span className="text-[#C3CCD9]">·</span>
          <span>{establishment.distanceKm} km</span>
          <span className="text-[#C3CCD9]">·</span>
          <span className="text-[#0A9159] font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#10D97F]" /> {establishment.openHoursText}
          </span>
        </div>

        {/* Secondary Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <a
            href={`tel:${establishment.phone}`}
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-[#F8FAFC] border border-[#E8EDF3] text-xs font-bold text-[#111827] hover:bg-[#EEF1F5] active:scale-95 transition-all text-center"
          >
            <Phone className="w-3.5 h-3.5 text-[#FB8205]" />
            <span>Appeler</span>
          </a>
          <button
            onClick={() => onOpenChat(establishment.name, `${establishment.categoryName} · Demande d'information`)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-[#F8FAFC] border border-[#E8EDF3] text-xs font-bold text-[#111827] hover:bg-[#EEF1F5] active:scale-95 transition-all text-center cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#0794A0]" />
            <span>Écrire</span>
          </button>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(`${establishment.name} ${establishment.city} Benin`)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-[#F8FAFC] border border-[#E8EDF3] text-xs font-bold text-[#111827] hover:bg-[#EEF1F5] active:scale-95 transition-all text-center"
          >
            <Navigation className="w-3.5 h-3.5 text-[#10D97F]" />
            <span>Itinéraire</span>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E8EDF3] px-4 py-2 flex gap-1.5 overflow-x-auto scrollbar-none">
        {[
          { key: 'ABOUT', label: 'À propos' },
          { key: 'SERVICES', label: 'Services' },
          { key: 'OFFERS', label: 'Offres' },
          { key: 'PHOTOS', label: 'Photos' },
          { key: 'REVIEWS', label: 'Avis' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === t.key
                ? 'bg-[#111827] text-white shadow-xs'
                : 'bg-white text-[#5C6B80] hover:bg-[#F8FAFC]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-5 max-w-2xl mx-auto">
        {/* 1. ABOUT TAB */}
        {activeTab === 'ABOUT' && (
          <div className="space-y-6">
            <div>
              <p className="text-sm sm:text-base leading-relaxed text-[#3C4A5F] font-medium">
                {establishment.description}
              </p>
            </div>

            {/* Quick Services Preview */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8EDF3] shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-[#111827]">Prestations principales</h3>
                <button
                  onClick={() => setActiveTab('SERVICES')}
                  className="text-xs font-extrabold text-[#E06900] hover:underline"
                >
                  Tout voir ›
                </button>
              </div>

              <div className="divide-y divide-[#E8EDF3]">
                {establishment.services.slice(0, 2).map((s) => (
                  <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-sm text-[#111827]">{s.title}</div>
                      <div className="text-xs text-[#5C6B80]">{s.subtitle}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-black text-sm text-[#111827]">{s.priceFormatted}</div>
                      <button
                        onClick={() => onStartBooking(establishment.bookingType, s.title, s.price)}
                        className="text-xs font-extrabold text-[#FB8205] hover:underline cursor-pointer"
                      >
                        Choisir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Reviews Preview */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8EDF3] shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-[#111827]">Avis récents</h3>
                <button
                  onClick={() => setActiveTab('REVIEWS')}
                  className="text-xs font-extrabold text-[#E06900] hover:underline"
                >
                  Lire les avis ›
                </button>
              </div>

              {establishment.reviews[0] && (
                <div className="text-xs text-[#3C4A5F] space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[11px]"
                      style={{ backgroundColor: establishment.reviews[0].avatarColor }}
                    >
                      {establishment.reviews[0].author[0]}
                    </span>
                    <span className="font-bold text-[#111827]">{establishment.reviews[0].author}</span>
                    <span className="text-[#E06900]">★ {establishment.reviews[0].rating}</span>
                    <span className="text-[#97A3B4]">· {establishment.reviews[0].date}</span>
                  </div>
                  <p className="italic pl-8 leading-relaxed">
                    « {establishment.reviews[0].comment} »
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. SERVICES TAB */}
        {activeTab === 'SERVICES' && (
          <div className="bg-white rounded-2xl border border-[#E8EDF3] p-4 shadow-xs divide-y divide-[#E8EDF3]">
            <h2 className="text-base font-extrabold text-[#111827] pb-3">Catalogue des services</h2>
            {establishment.services.map((s) => (
              <div key={s.id} className="py-3.5 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-sm text-[#111827]">{s.title}</div>
                  <div className="text-xs text-[#5C6B80] mt-0.5">{s.subtitle}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-black text-sm text-[#111827]">{s.priceFormatted}</div>
                  <button
                    onClick={() => onStartBooking(establishment.bookingType, s.title, s.price)}
                    className="mt-1 px-3 py-1 bg-[#FFF2E1] text-[#E06900] font-extrabold text-xs rounded-lg hover:bg-[#ffe3c2] active:scale-95 transition-all cursor-pointer"
                  >
                    Réserver
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. OFFERS TAB */}
        {activeTab === 'OFFERS' && (
          <div className="space-y-3">
            {establishment.offers.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-[#E8EDF3] text-sm text-[#5C6B80]">
                Aucune promotion active pour le moment chez cet établissement.
              </div>
            ) : (
              establishment.offers.map((off) => (
                <div key={off.id} className="bg-white rounded-2xl p-4 border border-[#E8EDF3] shadow-xs">
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-[#FFF2E1] text-[#E06900]">
                    {off.badge}
                  </span>
                  <h3 className="font-bold text-sm text-[#111827] mt-2">{off.title}</h3>
                  <div className="text-xs text-[#5C6B80] mt-0.5">{off.subtitle}</div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#E8EDF3]">
                    <div className="font-black text-sm text-[#111827]">
                      {off.discountedPrice}{' '}
                      {off.originalPrice && (
                        <span className="text-xs text-[#97A3B4] line-through font-normal">
                          {off.originalPrice}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onStartBooking(establishment.bookingType, off.title)}
                      className="px-3 py-1.5 bg-[#FB8205] text-white font-extrabold text-xs rounded-xl shadow-xs hover:brightness-95 cursor-pointer"
                    >
                      En profiter
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 4. PHOTOS TAB */}
        {activeTab === 'PHOTOS' && (
          <div className="grid grid-cols-2 gap-3">
            {establishment.photos.map((ph, idx) => (
              <img
                key={idx}
                src={ph}
                alt={`${establishment.name} ${idx}`}
                className="w-full h-36 sm:h-48 object-cover rounded-2xl border border-[#E8EDF3]"
              />
            ))}
          </div>
        )}

        {/* 5. REVIEWS TAB */}
        {activeTab === 'REVIEWS' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-[#E8EDF3] flex items-center justify-between">
              <div>
                <div className="text-3xl font-black text-[#111827]">{establishment.rating}</div>
                <div className="text-[#FB8205] text-sm tracking-wider">★★★★★</div>
                <div className="text-xs text-[#5C6B80] mt-0.5">{establishment.reviewCount} avis vérifiés</div>
              </div>
              <button
                onClick={onOpenReviewModal}
                className="px-4 py-2.5 bg-[#FFF2E1] text-[#E06900] font-extrabold text-xs rounded-xl shadow-xs hover:bg-[#ffe3c2] cursor-pointer"
              >
                Donner mon avis
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8EDF3] p-4 divide-y divide-[#E8EDF3]">
              {establishment.reviews.map((r) => (
                <div key={r.id} className="py-3.5 space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs"
                      style={{ backgroundColor: r.avatarColor }}
                    >
                      {r.author[0]}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-[#111827]">{r.author}</div>
                      <div className="text-[10px] text-[#97A3B4]">
                        {'★'.repeat(r.rating)} · {r.date} {r.isVoice && '· avis vocal'}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-[#3C4A5F] leading-relaxed pt-1">
                    « {r.comment} »
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E8EDF3] p-3 sm:p-4 px-5 flex items-center justify-between gap-4 max-w-3xl mx-auto shadow-lg">
        <div>
          <div className="text-base sm:text-lg font-black text-[#111827]">
            {establishment.priceStartingAt.toLocaleString()} FCFA
          </div>
          <div className="text-[11px] text-[#5C6B80] font-bold">
            {establishment.priceUnitText || 'tarif indicatif'}
          </div>
        </div>

        <button
          onClick={() => onStartBooking(establishment.bookingType)}
          className="flex-1 max-w-xs py-3.5 px-6 rounded-2xl bg-[#FB8205] text-white font-extrabold text-sm sm:text-base shadow-md hover:brightness-95 active:scale-98 transition-all text-center cursor-pointer"
        >
          {getCtaLabel()}
        </button>
      </div>
    </div>
  );
};
