import React, { useState } from 'react';
import {
  Layers,
  FileText,
  Calendar,
  Clock,
  ShoppingBag,
  Home,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Inbox,
  ArrowRight,
  Truck,
  Scissors,
} from 'lucide-react';
import { FlowexaRequestItem } from '../../types';

interface ClientActivityViewProps {
  requests: FlowexaRequestItem[];
  onOpenRequestDetail: (req: FlowexaRequestItem) => void;
  onOpenQuote: (quoteId: string) => void;
  onOpenOrderDetail: (orderId: string) => void;
  onOpenBookingDetail: (req: FlowexaRequestItem) => void;
  onNewRequest: () => void;
}

export const ClientActivityView: React.FC<ClientActivityViewProps> = ({
  requests,
  onOpenRequestDetail,
  onOpenQuote,
  onOpenOrderDetail,
  onOpenBookingDetail,
  onNewRequest,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'DEMANDES' | 'RESERVATIONS' | 'RDV' | 'COMMANDES' | 'DEVIS'>('ALL');

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] pb-24">
      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-xl sm:text-2xl font-black text-[#111827] font-disp">Mon activité</h1>
        <p className="text-xs text-[#5C6B80] font-medium mt-1">
          Suivi en temps réel de vos demandes, réservations, devis et commandes.
        </p>
      </div>

      {/* Filter Chips */}
      <div className="px-5 py-2 flex gap-2 overflow-x-auto scrollbar-none">
        {[
          { key: 'ALL', label: 'Tout' },
          { key: 'DEMANDES', label: 'Demandes' },
          { key: 'RESERVATIONS', label: 'Réservations' },
          { key: 'RDV', label: 'Rendez-vous' },
          { key: 'COMMANDES', label: 'Commandes' },
          { key: 'DEVIS', label: 'Devis' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterType(f.key as any)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filterType === f.key
                ? 'bg-[#0794A0] text-white shadow-xs'
                : 'bg-white border border-[#E8EDF3] text-[#5C6B80] hover:bg-[#F8FAFC]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Activity Timeline List */}
      <div className="p-5 max-w-xl mx-auto space-y-6">
        {/* Timeline Section: Aujourd'hui */}
        <div>
          <div className="flex items-center gap-3 text-xs font-black tracking-wider text-[#0794A0] uppercase mb-4 font-disp">
            <span>Aujourd’hui</span>
            <span className="flex-1 h-px bg-[#E8EDF3]" />
          </div>

          <div className="space-y-4">
            {/* Item 1: Devis reçu */}
            {(filterType === 'ALL' || filterType === 'DEVIS') && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center flex-shrink-0 w-6">
                  <span className="w-5 h-5 rounded-full border-2 border-[#FB8205] bg-white flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-[#FB8205]" />
                  </span>
                  <span className="w-0.5 flex-1 bg-[#E8EDF3] my-1" />
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#E8EDF3] shadow-xs flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-black uppercase text-[#E06900] bg-[#FFF2E1] px-2 py-0.5 rounded-full">
                        Devis reçu
                      </span>
                      <h3 className="font-extrabold text-sm text-[#111827] mt-1.5">
                        Devis — Location maison 2 chambres
                      </h3>
                      <div className="text-xs text-[#5C6B80] mt-0.5">
                        Immo Bénin Services · 280 000 FCFA total entrée
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenQuote('quote-1')}
                    className="mt-3 text-xs font-black text-[#E06900] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Examiner le devis ›
                  </button>
                </div>
              </div>
            )}

            {/* Item 2: Commande en livraison */}
            {(filterType === 'ALL' || filterType === 'COMMANDES') && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center flex-shrink-0 w-6">
                  <span className="w-5 h-5 rounded-full bg-[#0794A0] text-white flex items-center justify-center text-[10px] font-bold">
                    <Truck className="w-3 h-3" />
                  </span>
                  <span className="w-0.5 flex-1 bg-[#E8EDF3] my-1" />
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#E8EDF3] shadow-xs flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-black uppercase text-[#0794A0] bg-[#E1FBFD] px-2 py-0.5 rounded-full">
                        En livraison
                      </span>
                      <h3 className="font-extrabold text-sm text-[#111827] mt-1.5">
                        Commande Marketplace — 2 articles
                      </h3>
                      <div className="text-xs text-[#5C6B80] mt-0.5">
                        Kalia Créations · Arrivée estimée demain
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenOrderDetail('ord-1')}
                    className="mt-3 text-xs font-black text-[#0794A0] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Suivre le colis ›
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline Section: Plus tôt */}
        <div>
          <div className="flex items-center gap-3 text-xs font-black tracking-wider text-[#0794A0] uppercase mb-4 font-disp">
            <span>Cette semaine</span>
            <span className="flex-1 h-px bg-[#E8EDF3]" />
          </div>

          <div className="space-y-4">
            {/* Item 3: Rendez-vous */}
            {(filterType === 'ALL' || filterType === 'RDV') && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center flex-shrink-0 w-6">
                  <span className="w-5 h-5 rounded-full bg-[#FB8205] text-white flex items-center justify-center text-[10px] font-bold">
                    <Clock className="w-3 h-3" />
                  </span>
                  <span className="w-0.5 flex-1 bg-[#E8EDF3] my-1" />
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#E8EDF3] shadow-xs flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-black uppercase text-[#0A9159] bg-[#E2FBEF] px-2 py-0.5 rounded-full">
                        Confirmé
                      </span>
                      <h3 className="font-extrabold text-sm text-[#111827] mt-1.5">
                        Rendez-vous Coiffure & Tresses
                      </h3>
                      <div className="text-xs text-[#5C6B80] mt-0.5">
                        Salon Élégance · Demain à 10:00 (Cadjehoun)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Item 4: Réservation confirmée */}
            {(filterType === 'ALL' || filterType === 'RESERVATIONS') && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center flex-shrink-0 w-6">
                  <span className="w-5 h-5 rounded-full bg-[#10D97F] text-white flex items-center justify-center text-[10px] font-black">
                    ✓
                  </span>
                  <span className="w-0.5 flex-1 bg-[#E8EDF3] my-1" />
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#E8EDF3] shadow-xs flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-black uppercase text-[#0A9159] bg-[#E2FBEF] px-2 py-0.5 rounded-full">
                        Confirmée
                      </span>
                      <h3 className="font-extrabold text-sm text-[#111827] mt-1.5">
                        Réservation Chambre — Résidence Palma
                      </h3>
                      <div className="text-xs text-[#5C6B80] mt-0.5">
                        Samedi 13 septembre · 18:00 · 2 personnes
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Item 5: Demande générale envoyée */}
            {(filterType === 'ALL' || filterType === 'DEMANDES') && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center flex-shrink-0 w-6">
                  <span className="w-5 h-5 rounded-full bg-[#E8EDF3] text-[#5C6B80] flex items-center justify-center text-[10px] font-bold">
                    •
                  </span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#E8EDF3] shadow-xs flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-black uppercase text-[#0794A0] bg-[#E1FBFD] px-2 py-0.5 rounded-full">
                        En attente
                      </span>
                      <h3 className="font-extrabold text-sm text-[#111827] mt-1.5">
                        Demande : Maison 2 chambres à Calavi
                      </h3>
                      <div className="text-xs text-[#5C6B80] mt-0.5">
                        Transmise à 2 agences partenaires agréées
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onNewRequest}
                    className="mt-3 text-xs font-black text-[#E06900] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Suivre le traitement ›
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Real Backend Requests mapped */}
        {requests.length > 0 && (
          <div>
            <div className="flex items-center gap-3 text-xs font-black tracking-wider text-[#0794A0] uppercase mb-4 font-disp">
              <span>Demandes enregistrées sur la plateforme</span>
              <span className="flex-1 h-px bg-[#E8EDF3]" />
            </div>

            <div className="space-y-3">
              {requests.map((r) => (
                <div
                  key={r.id}
                  onClick={() => onOpenRequestDetail(r)}
                  className="bg-white p-4 rounded-2xl border border-[#E8EDF3] shadow-xs hover:border-[#0794A0] transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#111827]">
                      {r.serviceName || r.offerTitle || 'Demande Flowexa'}
                    </span>
                    <span
                      className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                        r.status === 'CONFIRMED' || r.status === 'COMPLETED'
                          ? 'bg-[#E2FBEF] text-[#0A9159]'
                          : r.status === 'CANCELLED'
                          ? 'bg-[#FDE8E8] text-[#C0392B]'
                          : 'bg-[#FFF2E1] text-[#E06900]'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div className="text-xs text-[#5C6B80] mt-1">
                    {r.businessName || 'Établissement'} · {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
