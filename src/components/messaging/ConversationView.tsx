import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Check,
  CheckCheck,
  Lock,
  Unlock,
  RefreshCw,
  Clock,
  Building2,
  User,
  ShoppingBag,
  FileText,
  Calendar,
  AlertCircle,
  Phone,
} from 'lucide-react';
import { ConversationItem, MessageItem, RoleType } from '../../types';
import { flowexaApi } from '../../services/api';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';

export interface ConversationViewProps {
  conversation: ConversationItem;
  callerRole: 'CLIENT' | 'BUSINESS' | 'SUPER_ADMIN';
  callerId?: string;
  callerName?: string;
  onUpdateConversation?: (updated: ConversationItem) => void;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  onClose?: () => void;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  conversation,
  callerRole,
  callerId = 'client-test-1',
  callerName = 'Utilisateur Flowexa',
  onUpdateConversation,
  onShowToast,
  onClose,
}) => {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isClosed = conversation.status === 'CLOSED';

  // Caller auth payload
  const authContext = {
    role: callerRole === 'BUSINESS' ? 'BUSINESS_OWNER' : callerRole,
    clientId: callerRole === 'CLIENT' ? callerId : undefined,
    businessId: callerRole === 'BUSINESS' ? callerId : undefined,
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await flowexaApi.getMessages(conversation.id, authContext);
      if (res.success && Array.isArray(res.data)) {
        setMessages(res.data);
        // Marquer comme lus
        await flowexaApi.markMessagesRead(conversation.id, authContext);
        if (onUpdateConversation) {
          onUpdateConversation({
            ...conversation,
            unreadCountClient: callerRole === 'CLIENT' ? 0 : conversation.unreadCountClient,
            unreadCountBusiness: callerRole === 'BUSINESS' ? 0 : conversation.unreadCountBusiness,
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Rafraîchissement automatique toutes les 8 secondes (mode quasi temps-réel)
    const interval = setInterval(fetchMessages, 8000);
    return () => clearInterval(interval);
  }, [conversation.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending || isClosed) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const res = await flowexaApi.sendMessage(
        conversation.id,
        {
          content: textToSend,
          senderName: callerName,
        },
        authContext
      );

      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data]);
        if (onUpdateConversation && res.conversation) {
          onUpdateConversation(res.conversation);
        }
      } else {
        onShowToast('Erreur d\'envoi', res.error || 'Impossible d\'envoyer le message.', 'error');
        setInputText(textToSend);
      }
    } catch (err: any) {
      onShowToast('Erreur', 'Une erreur est survenue lors de l\'envoi.', 'error');
      setInputText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const handleToggleClose = async () => {
    setActionLoading(true);
    try {
      if (isClosed) {
        const res = await flowexaApi.reopenConversation(conversation.id, authContext);
        if (res.success && res.data) {
          onShowToast('Conversation réouverte', 'Vous pouvez à nouveau échanger.', 'success');
          if (onUpdateConversation) onUpdateConversation(res.data);
        }
      } else {
        const res = await flowexaApi.closeConversation(
          conversation.id,
          'Clôture à l\'initiative de l\'utilisateur',
          authContext
        );
        if (res.success && res.data) {
          onShowToast('Conversation clôturée', 'La discussion est maintenant fermée.', 'info');
          if (onUpdateConversation) onUpdateConversation(res.data);
        }
      }
    } catch (err) {
      onShowToast('Erreur', 'Impossible de modifier le statut.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const partnerName = callerRole === 'CLIENT' ? conversation.businessName : conversation.clientName;
  const partnerPhone = callerRole === 'CLIENT' ? conversation.businessPhone : conversation.clientPhone;

  return (
    <div className="flex flex-col h-full bg-[#0A1428] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-[#0A1428]/95 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
            {callerRole === 'CLIENT' ? (
              <Building2 className="w-5 h-5 text-[#0BE9EF]" />
            ) : (
              <User className="w-5 h-5 text-[#FB8205]" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white truncate">{partnerName}</h3>
              <Badge variant={isClosed ? 'gray' : 'emerald'} size="sm">
                {isClosed ? 'Clôturée' : 'Active'}
              </Badge>
            </div>
            {partnerPhone && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-mono mt-0.5">
                <Phone className="w-3 h-3 text-[#0BE9EF]" />
                <span>{partnerPhone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchMessages}
            title="Rafraîchir"
            className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleToggleClose}
            disabled={actionLoading}
            leftIcon={isClosed ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            className="text-xs border-white/10 hover:border-white/20"
          >
            {isClosed ? 'Réouvrir' : 'Clôturer'}
          </Button>

          {onClose && (
            <button
              onClick={onClose}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 bg-white/5 rounded-lg cursor-pointer md:hidden"
            >
              Retour
            </button>
          )}
        </div>
      </div>

      {/* Context Banner (Offer, Request, Booking) */}
      {(conversation.catalogItemTitle || conversation.requestId || conversation.bookingId) && (
        <div className="px-4 py-2.5 bg-gradient-to-r from-[#0BE9EF]/10 via-[#0A1428] to-[#FB8205]/10 border-b border-white/5 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {conversation.contextType === 'OFFER' ? (
              <ShoppingBag className="w-4 h-4 text-[#0BE9EF] shrink-0" />
            ) : conversation.contextType === 'BOOKING' ? (
              <Calendar className="w-4 h-4 text-[#FB8205] shrink-0" />
            ) : (
              <FileText className="w-4 h-4 text-[#0BE9EF] shrink-0" />
            )}
            <span className="text-gray-300 truncate">
              Contexte :{' '}
              <strong className="text-white font-medium">
                {conversation.catalogItemTitle || `Demande #${conversation.requestId?.slice(0, 10)}`}
              </strong>
            </span>
          </div>

          {typeof conversation.catalogItemPrice === 'number' && (
            <span className="text-[#0BE9EF] font-bold shrink-0 font-mono text-[11px]">
              {(conversation.catalogItemPrice ?? 0).toLocaleString()} {conversation.catalogItemCurrency || 'FCFA'}
            </span>
          )}
        </div>
      )}

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px]">
        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#0BE9EF]" />
            <span className="text-xs">Chargement des messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
              <Send className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">Début de la conversation</p>
            <p className="text-xs text-gray-400 max-w-xs">
              Échangez directement et en toute sécurité. Posez vos questions ou convenez des détails de la prestation.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe =
              callerRole === 'SUPER_ADMIN'
                ? msg.senderRole === 'SUPER_ADMIN'
                : callerRole === 'BUSINESS'
                ? msg.senderRole === 'BUSINESS'
                : msg.senderRole === 'CLIENT';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[11px] font-medium text-gray-400">
                    {isMe ? 'Vous' : msg.senderName}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-2xl max-w-[85%] sm:max-w-[75%] text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    isMe
                      ? 'bg-gradient-to-r from-[#FB8205] to-[#FB8205]/90 text-white rounded-br-xs shadow-md'
                      : 'bg-white/10 text-gray-100 rounded-bl-xs border border-white/5'
                  }`}
                >
                  {msg.content}
                </div>

                {isMe && (
                  <div className="flex items-center gap-1 mt-0.5 px-1 text-[10px] text-gray-500">
                    {msg.isRead ? (
                      <span className="text-[#0BE9EF] flex items-center gap-0.5">
                        <CheckCheck className="w-3 h-3" /> Lu
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Envoyé
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Closed Warning Banner */}
      {isClosed && (
        <div className="p-3 bg-red-950/40 border-t border-red-500/20 text-center text-xs text-red-200 flex items-center justify-center gap-2 shrink-0">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>Cette conversation est clôturée. Réouvrez-la pour envoyer un nouveau message.</span>
        </div>
      )}

      {/* Input Form */}
      {!isClosed && (
        <form
          onSubmit={handleSend}
          className="p-3 bg-[#0A1428] border-t border-white/10 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Écrivez votre message..."
            disabled={sending}
            className="flex-1 bg-white/5 border border-white/10 focus:border-[#0BE9EF] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none transition"
          />

          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={!inputText.trim() || sending}
            leftIcon={<Send className={`w-3.5 h-3.5 ${sending ? 'animate-pulse' : ''}`} />}
            className="px-4 py-2.5 rounded-xl shrink-0"
          >
            Envoyer
          </Button>
        </form>
      )}
    </div>
  );
};
