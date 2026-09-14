import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, RefreshCw, MessageCircle } from 'lucide-react';
import { ConversationItem, RoleType } from '../../types';
import { flowexaApi } from '../../services/api';
import { ConversationsList } from './ConversationsList';
import { ConversationView } from './ConversationView';
import { Button } from '../design-system/Button';

export interface MessagingCenterProps {
  callerRole: 'CLIENT' | 'BUSINESS' | 'SUPER_ADMIN';
  callerId?: string;
  callerName?: string;
  activeConversationId?: string;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  onRequestNewChat?: () => void;
}

export const MessagingCenter: React.FC<MessagingCenterProps> = ({
  callerRole,
  callerId = 'client-test-1',
  callerName = 'Client Flowexa',
  activeConversationId,
  onShowToast,
  onRequestNewChat,
}) => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationItem | null>(null);
  const [loading, setLoading] = useState(false);

  const authContext = {
    role: callerRole === 'BUSINESS' ? 'BUSINESS_OWNER' : callerRole,
    clientId: callerRole === 'CLIENT' ? callerId : undefined,
    businessId: callerRole === 'BUSINESS' ? callerId : undefined,
  };

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await flowexaApi.getConversations(authContext);
      if (res.success && Array.isArray(res.data)) {
        setConversations(res.data);
        if (activeConversationId) {
          const match = res.data.find((c) => c.id === activeConversationId);
          if (match) setSelectedConv(match);
        } else if (!selectedConv && res.data.length > 0) {
          setSelectedConv(res.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [callerId, callerRole]);

  useEffect(() => {
    if (activeConversationId && conversations.length > 0) {
      const match = conversations.find((c) => c.id === activeConversationId);
      if (match) setSelectedConv(match);
    }
  }, [activeConversationId]);

  const handleUpdateConversation = (updated: ConversationItem) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    if (selectedConv?.id === updated.id) {
      setSelectedConv(updated);
    }
  };

  return (
    <div className="w-full h-[640px] max-h-[80vh] flex flex-col md:flex-row gap-4 bg-[#070F1E] p-2 sm:p-4 rounded-3xl border border-white/5 shadow-2xl">
      {/* Left panel: Conversations List */}
      <div
        className={`w-full md:w-80 lg:w-96 flex flex-col h-full shrink-0 ${
          selectedConv ? 'hidden md:flex' : 'flex'
        }`}
      >
        <ConversationsList
          conversations={conversations}
          selectedId={selectedConv?.id}
          callerRole={callerRole}
          onSelectConversation={(conv) => setSelectedConv(conv)}
          loading={loading}
        />
      </div>

      {/* Right panel: Active Conversation View */}
      <div
        className={`w-full flex-1 flex flex-col h-full min-w-0 ${
          !selectedConv ? 'hidden md:flex' : 'flex'
        }`}
      >
        {selectedConv ? (
          <ConversationView
            conversation={selectedConv}
            callerRole={callerRole}
            callerId={callerId}
            callerName={callerName}
            onUpdateConversation={handleUpdateConversation}
            onShowToast={onShowToast}
            onClose={() => setSelectedConv(null)}
          />
        ) : (
          <div className="h-full bg-[#0A1428] border border-white/10 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-gray-400">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 mb-4">
              <MessageCircle className="w-8 h-8 text-[#0BE9EF]" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Sélectionnez une conversation</h3>
            <p className="text-xs text-gray-400 max-w-sm">
              Choisissez un échange dans la liste pour consulter les messages, convenir des détails ou poser des questions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
