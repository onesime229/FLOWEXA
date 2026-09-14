import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  RefreshCw,
  Eye,
  AlertTriangle,
  Building2,
  User,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../design-system/Button';
import { Card } from '../design-system/Card';
import { Badge } from '../design-system/Badge';
import { Modal } from '../design-system/Modal';
import { flowexaApi } from '../../services/api';
import { ConversationItem, MessageItem } from '../../types';

export const AdminConversationsManagement: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected conversation for inspection / thread view
  const [selectedConv, setSelectedConv] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await flowexaApi.getAdminConversations({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      if (res.success && Array.isArray(res.data)) {
        setConversations(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [statusFilter]);

  const handleInspectConversation = async (conv: ConversationItem) => {
    setSelectedConv(conv);
    setLoadingMessages(true);
    try {
      const res = await flowexaApi.getMessages(conv.id, { role: 'SUPER_ADMIN' });
      if (res.success && Array.isArray(res.data)) {
        setMessages(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleToggleStatus = async (convId: string, currentStatus: string) => {
    setActionLoading(true);
    try {
      let res;
      if (currentStatus === 'OPEN') {
        res = await flowexaApi.closeConversation(
          convId,
          'Clôturé par le Super Admin (modération Flowexa)',
          { role: 'SUPER_ADMIN' }
        );
      } else {
        res = await flowexaApi.reopenConversation(convId, { role: 'SUPER_ADMIN' });
      }
      if (res.success) {
        await fetchConversations();
        if (selectedConv?.id === convId && res.data) {
          setSelectedConv(res.data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const query = searchTerm.toLowerCase();
    return (
      c.id.toLowerCase().includes(query) ||
      c.clientName.toLowerCase().includes(query) ||
      (c.businessName && c.businessName.toLowerCase().includes(query)) ||
      c.businessId.toLowerCase().includes(query) ||
      (c.lastMessagePreview && c.lastMessagePreview.toLowerCase().includes(query))
    );
  });

  const openCount = conversations.filter((c) => c.status === 'OPEN').length;
  const closedCount = conversations.filter((c) => c.status === 'CLOSED').length;

  return (
    <div className="space-y-6">
      {/* Header & Overview cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0A1428] border border-white/10 rounded-2xl p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Audit & Modération des Conversations
            </h2>
            <Badge variant="cyan">Temps Réel</Badge>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Supervision centralisée des échanges clients-entreprises, détection des litiges et respect des règles de la plateforme.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchConversations}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            className="border-white/10"
          >
            Actualiser
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-4">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Conversations</span>
          <div className="text-2xl font-black text-white mt-1">{conversations.length}</div>
          <span className="text-xs text-gray-500">Toutes interactions confondues</span>
        </div>

        <div className="bg-[#0A1428] border border-emerald-500/20 rounded-2xl p-4">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Discussions Ouvertes</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">{openCount}</div>
          <span className="text-xs text-gray-500">En cours d'échange actif</span>
        </div>

        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-4">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Discussions Fermées</span>
          <div className="text-2xl font-black text-gray-400 mt-1">{closedCount}</div>
          <span className="text-xs text-gray-500">Traitées ou clôturées</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0A1428] border border-white/10 rounded-2xl p-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par client, pro, ID..."
            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#0BE9EF]/50"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-white/20 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Toutes ({conversations.length})
          </button>
          <button
            onClick={() => setStatusFilter('OPEN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              statusFilter === 'OPEN'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Ouvertes ({openCount})
          </button>
          <button
            onClick={() => setStatusFilter('CLOSED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              statusFilter === 'CLOSED'
                ? 'bg-gray-700/40 text-gray-300 border border-white/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Fermées ({closedCount})
          </button>
        </div>
      </div>

      {/* Conversations Table */}
      {filteredConversations.length === 0 ? (
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-12 text-center">
          <MessageSquare className="w-10 h-10 text-gray-500 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white mb-1">Aucune conversation trouvée</h4>
          <p className="text-xs text-gray-400">
            Ajustez vos filtres de recherche ou attendez que de nouveaux échanges soient créés.
          </p>
        </div>
      ) : (
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-white/5 text-[11px] text-gray-400 uppercase font-bold border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">ID / Date</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Établissement</th>
                  <th className="px-4 py-3">Dernier Message</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredConversations.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-4 py-3.5 font-mono">
                      <div className="font-bold text-white">{c.id}</div>
                      <div className="text-[10px] text-gray-500">
                        {new Date(c.updatedAt || c.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#0BE9EF]" />
                        <span>{c.clientName}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono">{c.clientPhone}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#FB8205]" />
                        <span>{c.businessName || c.businessId}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">{c.businessId}</div>
                    </td>

                    <td className="px-4 py-3.5 max-w-xs truncate">
                      <p className="truncate text-gray-300">
                        {c.lastMessagePreview || <span className="text-gray-500 italic">Aucun message</span>}
                      </p>
                      {c.requestId && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] bg-blue-500/10 text-blue-400 font-mono">
                          Demande : {c.requestId}
                        </span>
                      )}
                      {c.bookingId && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/10 text-emerald-400 font-mono">
                          Réservation : {c.bookingId}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {c.status === 'OPEN' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Ouverte
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-500/10 text-gray-400 border border-gray-500/20">
                          <XCircle className="w-3 h-3" />
                          Clôturée
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleInspectConversation(c)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        className="text-xs border-white/10 hover:border-white/20"
                      >
                        Voir fil
                      </Button>

                      <Button
                        size="sm"
                        variant={c.status === 'OPEN' ? 'secondary' : 'outline'}
                        onClick={() => handleToggleStatus(c.id, c.status)}
                        disabled={actionLoading}
                        className={`text-xs ${
                          c.status === 'OPEN'
                            ? 'text-rose-400 hover:bg-rose-500/10 border-rose-500/20'
                            : 'text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20'
                        }`}
                      >
                        {c.status === 'OPEN' ? 'Fermer' : 'Rouvrir'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Thread Inspection Modal */}
      {selectedConv && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedConv(null)}
          title={`Fil de conversation — ${selectedConv.id}`}
        >
          <div className="space-y-4 text-xs">
            {/* Conversation meta header */}
            <div className="bg-[#020919] p-3 rounded-xl border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Client :</span>
                <span className="text-white font-bold">{selectedConv.clientName} ({selectedConv.clientPhone})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Établissement :</span>
                <span className="text-white font-bold">{selectedConv.businessName || selectedConv.businessId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Statut actuel :</span>
                <span className={`font-bold ${selectedConv.status === 'OPEN' ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {selectedConv.status === 'OPEN' ? 'Ouverte' : 'Clôturée'}
                </span>
              </div>
            </div>

            {/* Messages box */}
            <div className="max-h-72 overflow-y-auto space-y-2 p-3 bg-[#020919] rounded-xl border border-white/5">
              {loadingMessages ? (
                <div className="text-center py-6 text-gray-500">Chargement des messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-6 text-gray-500">Aucun message dans ce fil.</div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-2.5 rounded-xl text-xs max-w-[85%] ${
                      m.senderRole === 'CLIENT'
                        ? 'bg-[#0BE9EF]/10 border border-[#0BE9EF]/20 text-white mr-auto'
                        : 'bg-[#FB8205]/10 border border-[#FB8205]/20 text-white ml-auto'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[10px] text-gray-400 mb-1">
                      <span className="font-bold">
                        {m.senderRole === 'CLIENT' ? 'Client' : 'Entreprise'} ({m.senderName})
                      </span>
                      <span>
                        {new Date(m.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="leading-relaxed">{m.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedConv(null)}
              >
                Fermer l'aperçu
              </Button>

              <Button
                variant={selectedConv.status === 'OPEN' ? 'primary' : 'cyan'}
                size="sm"
                onClick={() => handleToggleStatus(selectedConv.id, selectedConv.status)}
                disabled={actionLoading}
              >
                {selectedConv.status === 'OPEN' ? 'Clôturer cette conversation' : 'Rouvrir cette conversation'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
