import React, { useEffect, useState } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  User,
  Phone,
  Calendar,
  DollarSign,
  Tag,
  AlertCircle,
  X,
} from 'lucide-react';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { flowexaApi } from '../../services/api';

export const AdminRequestsSupervision: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await flowexaApi.getAdminRequests({
        search: searchQuery.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        interactionType: typeFilter !== 'ALL' ? typeFilter : undefined,
        limit: 50,
      });

      if (res.success && res.data) {
        setRequests(res.data.items || []);
        setTotalCount(res.data.total || (res.data.items || []).length);
      }
    } catch (err) {
      console.error('Erreur chargement demandes admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadRequests();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'ACCEPTED':
      case 'COMPLETED':
        return <Badge variant="success">{status === 'COMPLETED' ? 'Terminée' : 'Confirmée'}</Badge>;
      case 'PENDING':
        return <Badge variant="warning">En attente</Badge>;
      case 'CANCELLED':
      case 'REJECTED':
        return <Badge variant="danger">Annulée</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0A1428] border border-white/10 rounded-2xl p-4 md:p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#10D97F]/20 border border-[#10D97F]/30 flex items-center justify-center text-[#10D97F]">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Supervision des Demandes, Devis & Réservations
              <span className="text-[11px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-full font-semibold">
                {totalCount} dossiers
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Audit transverse de toutes les transactions et rendez-vous entre clients et entreprises
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={loadRequests}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
        >
          Actualiser
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#0A1428] border border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full md:w-auto relative">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher par client, téléphone, entreprise, service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#020919] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8205]"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#020919] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FB8205] cursor-pointer"
          >
            <option value="ALL">Tous types</option>
            <option value="BOOKING">Réservations Directes</option>
            <option value="QUOTE_REQUEST">Demandes de Devis</option>
            <option value="APPOINTMENT">Rendez-vous</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#020919] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FB8205] cursor-pointer"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="ACCEPTED">Acceptées</option>
            <option value="CONFIRMED">Confirmées</option>
            <option value="COMPLETED">Finalisées</option>
            <option value="CANCELLED">Annulées</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl overflow-x-auto shadow-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/10 bg-[#020919] text-gray-400 uppercase font-semibold">
              <th className="p-3.5">Type & Réf</th>
              <th className="p-3.5">Client & Contact</th>
              <th className="p-3.5">Établissement prestataire</th>
              <th className="p-3.5">Service / Prestation</th>
              <th className="p-3.5">Date souhaitée</th>
              <th className="p-3.5">Montant</th>
              <th className="p-3.5">Statut</th>
              <th className="p-3.5 text-right">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  Aucune demande trouvée avec les filtres sélectionnés.
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-3.5">
                    <span className="font-mono text-[10px] bg-white/5 text-gray-300 px-2 py-0.5 rounded border border-white/10 block w-fit">
                      {r.id.substring(0, 8)}
                    </span>
                    <span className="text-[10px] text-[#0BE9EF] font-semibold mt-0.5 block">
                      {r.type === 'BOOKING' ? 'RÉSERVATION' : r.type === 'QUOTE_REQUEST' ? 'DEMANDE DEVIS' : 'RDV'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-white">{r.client_name || 'Client Flowexa'}</div>
                    <div className="text-[11px] text-gray-400">{r.client_phone || '+229 01 00 00 00'}</div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-gray-200">{r.business_name || 'Prestataire'}</div>
                    <div className="text-[10px] text-gray-500 font-mono">{r.business_id}</div>
                  </td>
                  <td className="p-3.5 text-gray-300">
                    {r.service_title || 'Prestation standard'}
                  </td>
                  <td className="p-3.5 text-gray-300 font-medium">
                    {r.date ? new Date(r.date).toLocaleDateString('fr-FR') : 'Non précisé'}
                  </td>
                  <td className="p-3.5 font-bold text-[#10D97F]">
                    {r.amount ? `${r.amount.toLocaleString()} FCFA` : 'Sur devis'}
                  </td>
                  <td className="p-3.5">
                    {getStatusBadge(r.status)}
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => setSelectedRequest(r)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                      title="Inspecter"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A1428] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-[#10D97F]" />
                <h3 className="font-bold text-white text-base">
                  Détail du Dossier #{selectedRequest.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#020919] border border-white/5 flex items-center justify-between">
                <span className="text-gray-400">Statut du dossier :</span>
                <div>{getStatusBadge(selectedRequest.status)}</div>
              </div>

              <div className="p-3 rounded-xl bg-[#020919] border border-white/5 space-y-2">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#0BE9EF]" />
                  Informations Client
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-gray-400 block">Nom complet :</span>
                    <span className="text-white font-semibold">{selectedRequest.client_name || 'Client Flowexa'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Téléphone :</span>
                    <span className="text-white font-semibold">{selectedRequest.client_phone || 'Non renseigné'}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#020919] border border-white/5 space-y-2">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#FB8205]" />
                  Entreprise Prestataire
                </div>
                <div className="text-[11px]">
                  <span className="text-gray-400 block">Nom commercial :</span>
                  <span className="text-white font-semibold">{selectedRequest.business_name}</span>
                </div>
                <div className="text-[11px]">
                  <span className="text-gray-400 block">Service demandé :</span>
                  <span className="text-gray-200">{selectedRequest.service_title}</span>
                </div>
              </div>

              {selectedRequest.notes && (
                <div className="p-3 rounded-xl bg-[#020919] border border-white/5">
                  <span className="text-gray-400 text-[11px] block mb-1">Commentaires / Instructions :</span>
                  <p className="text-gray-300 italic">{selectedRequest.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-white/10">
              <Button size="sm" variant="outline" onClick={() => setSelectedRequest(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
