import React, { useState } from 'react';
import {
  MessageSquare,
  Search,
  Building2,
  User,
  ShoppingBag,
  FileText,
  Calendar,
  Clock,
  CheckCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { ConversationItem, ConversationStatus } from '../../types';
import { Badge } from '../design-system/Badge';

export interface ConversationsListProps {
  conversations: ConversationItem[];
  selectedId?: string;
  callerRole: 'CLIENT' | 'BUSINESS' | 'SUPER_ADMIN';
  onSelectConversation: (conversation: ConversationItem) => void;
  loading?: boolean;
}

export const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  selectedId,
  callerRole,
  onSelectConversation,
  loading = false,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');

  const filtered = conversations.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (search.trim() !== '') {
      const s = search.toLowerCase().trim();
      const partner = (callerRole === 'CLIENT' ? c.businessName : c.clientName).toLowerCase();
      const item = (c.catalogItemTitle || '').toLowerCase();
      const last = (c.lastMessage || '').toLowerCase();
      return partner.includes(s) || item.includes(s) || last.includes(s);
    }
    return true;
  });

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;
    if (diffDays === 1) return 'Hier';
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="flex flex-col h-full bg-[#0A1428] border border-white/10 rounded-2xl overflow-hidden">
      {/* Search & Filter Bar */}
      <div className="p-3.5 border-b border-white/10 space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une conversation..."
            className="w-full bg-white/5 border border-white/10 focus:border-[#0BE9EF] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer shrink-0 ${
              statusFilter === 'ALL'
                ? 'bg-white/15 text-white font-bold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Toutes ({conversations.length})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer shrink-0 ${
              statusFilter === 'ACTIVE'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Actives ({conversations.filter((c) => c.status === 'ACTIVE').length})
          </button>
          <button
            onClick={() => setStatusFilter('CLOSED')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer shrink-0 ${
              statusFilter === 'CLOSED'
                ? 'bg-white/10 text-gray-300 font-bold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Clôturées ({conversations.filter((c) => c.status === 'CLOSED').length})
          </button>
        </div>
      </div>

      {/* List content */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {loading && conversations.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            Chargement des conversations...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-white">Aucune conversation trouvée</p>
            <p className="text-[11px] text-gray-500 mt-1">
              Vos échanges avec les partenaires Flowexa apparaîtront ici.
            </p>
          </div>
        ) : (
          filtered.map((c) => {
            const partnerName = callerRole === 'CLIENT' ? c.businessName : c.clientName;
            const unreadCount =
              callerRole === 'CLIENT' ? c.unreadCountClient : c.unreadCountBusiness;
            const isSelected = selectedId === c.id;

            return (
              <div
                key={c.id}
                onClick={() => onSelectConversation(c)}
                className={`p-3.5 transition cursor-pointer flex items-start gap-3 relative ${
                  isSelected
                    ? 'bg-white/10 border-l-2 border-[#FB8205]'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
                  {callerRole === 'CLIENT' ? (
                    <Building2 className="w-4 h-4 text-[#0BE9EF]" />
                  ) : (
                    <User className="w-4 h-4 text-[#FB8205]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <h4 className="text-xs font-bold text-white truncate">{partnerName}</h4>
                    <span className="text-[10px] text-gray-500 font-mono shrink-0">
                      {formatRelativeTime(c.lastMessageAt || c.updatedAt)}
                    </span>
                  </div>

                  {c.catalogItemTitle && (
                    <div className="flex items-center gap-1 text-[11px] text-[#0BE9EF] truncate mb-1">
                      <ShoppingBag className="w-3 h-3 shrink-0" />
                      <span className="truncate">{c.catalogItemTitle}</span>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 truncate leading-tight">
                    {c.lastMessage || 'Aucun message pour l\'instant'}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full ${
                          c.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-gray-500'
                        }`}
                      />
                      <span className="text-[10px] text-gray-400">
                        {c.status === 'ACTIVE' ? 'Active' : 'Clôturée'}
                      </span>
                    </div>

                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#FB8205] text-white text-[10px] font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
