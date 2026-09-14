import React, { useState } from 'react';
import {
  ArrowLeft,
  Phone,
  Send,
  Mic,
  Calendar,
  Check,
  CheckCheck,
  MessageSquare,
} from 'lucide-react';

interface ClientMessagesViewProps {
  initialBusinessName?: string;
  contextTitle?: string;
  onBack?: () => void;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ClientMessagesView: React.FC<ClientMessagesViewProps> = ({
  initialBusinessName = 'Résidence Palma',
  contextTitle = 'Réservation · Samedi 13 sept. · 18:00',
  onBack,
  onShowToast,
}) => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(initialBusinessName);
  const [inputText, setInputText] = useState('');

  const [conversations, setConversations] = useState([
    {
      id: 'c-1',
      businessName: 'Résidence Palma',
      avatarUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=150&q=80',
      context: 'Réservation · 13 sept.',
      lastMessage: 'Votre réservation de chambre est confirmée',
      time: '10:24',
      unread: 2,
    },
    {
      id: 'c-2',
      businessName: 'Salon Élégance',
      avatarUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=150&q=80',
      context: 'Rendez-vous · Demain 10:00',
      lastMessage: 'À demain pour votre séance tresses !',
      time: 'Hier',
      unread: 0,
    },
    {
      id: 'c-3',
      businessName: 'Immo Bénin Services',
      avatarUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=150&q=80',
      context: 'Demande · Maison 2 chambres Calavi',
      lastMessage: 'Nous avons envoyé votre devis complet.',
      time: 'Mar.',
      unread: 1,
    },
  ]);

  const [messages, setMessages] = useState<
    { id: string; sender: 'them' | 'me'; text: string; time: string }[]
  >([
    {
      id: 'm-1',
      sender: 'them',
      text: 'Bonjour ! Merci d’avoir choisi notre établissement.',
      time: '10:20',
    },
    {
      id: 'm-2',
      sender: 'them',
      text: 'Votre réservation est confirmée pour le samedi 13 septembre à 18:00.',
      time: '10:21',
    },
    {
      id: 'm-3',
      sender: 'me',
      text: 'Merci beaucoup ! Y a-t-il une navette aéroport disponible à notre arrivée ?',
      time: '10:24',
    },
  ]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMsg = {
      id: `m-${Date.now()}`,
      sender: 'me' as const,
      text: inputText.trim(),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Simulated quick response from the establishment
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now() + 1}`,
          sender: 'them',
          text: 'Oui tout à fait ! Notre chauffeur sera à l’aéroport avec une pancarte à votre nom.',
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1200);
  };

  // If viewing a single conversation (like s-convo)
  if (selectedConversation) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#F8FAFC] text-[#111827]">
        {/* Top Bar */}
        <div className="bg-white border-b border-[#E8EDF3] p-3.5 px-4 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedConversation(null)}
              className="w-9 h-9 rounded-full bg-[#F8FAFC] border border-[#E8EDF3] flex items-center justify-center text-[#111827] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-[#E1FBFD] flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1590490360182-c33d57733427?w=150&q=80"
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-[#111827] leading-tight">
                {selectedConversation}
              </h2>
              <div className="text-[11px] font-bold text-[#0A9159] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10D97F]" /> En ligne
              </div>
            </div>
          </div>

          <a
            href="tel:+22997000000"
            className="w-9 h-9 rounded-xl bg-[#F8FAFC] border border-[#E8EDF3] flex items-center justify-center text-[#FB8205] hover:bg-[#FFF2E1] transition-colors"
          >
            <Phone className="w-4 h-4" />
          </a>
        </div>

        {/* Reservation Context Banner */}
        <div className="bg-[#E1FBFD] px-4 py-2.5 border-b border-[#E8EDF3] flex items-center justify-between text-xs font-semibold text-[#0794A0]">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              <b>Contexte</b> · {contextTitle}
            </span>
          </div>
          <span className="font-black text-[#0794A0] hover:underline cursor-pointer">
            Détails ›
          </span>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col max-w-[80%] ${
                m.sender === 'me' ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <div
                className={`p-3 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed ${
                  m.sender === 'me'
                    ? 'bg-[#FB8205] text-white rounded-br-xs shadow-xs'
                    : 'bg-white text-[#111827] rounded-bl-xs border border-[#E8EDF3] shadow-xs'
                }`}
              >
                {m.text}
                <div
                  className={`text-[10px] mt-1 text-right font-bold opacity-75 ${
                    m.sender === 'me' ? 'text-white' : 'text-[#97A3B4]'
                  }`}
                >
                  {m.time}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Composer */}
        <div className="bg-white border-t border-[#E8EDF3] p-3 px-4 flex items-center gap-2">
          <button
            onClick={() => onShowToast('Message vocal', 'Enregistrement vocal prêt.', 'info')}
            className="w-10 h-10 rounded-full bg-[#E1FBFD] text-[#0794A0] flex items-center justify-center flex-shrink-0 cursor-pointer"
          >
            <Mic className="w-4 h-4" />
          </button>
          <input
            type="text"
            placeholder="Écrire un message…"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            className="flex-1 bg-[#F8FAFC] border border-[#E8EDF3] rounded-full px-4 py-2.5 text-xs sm:text-sm font-medium text-[#111827] outline-none focus:border-[#0BE9EF]"
          />
          <button
            onClick={handleSendMessage}
            className="w-10 h-10 rounded-full bg-[#FB8205] text-white flex items-center justify-center flex-shrink-0 shadow-md hover:brightness-95 active:scale-95 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Conversation List
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] pb-24">
      <div className="px-5 pt-6 pb-3">
        <h1 className="text-xl sm:text-2xl font-black text-[#111827] font-disp">Messages</h1>
        <p className="text-xs text-[#5C6B80] font-medium mt-1">
          Discussions directes avec les établissements et professionnels.
        </p>
      </div>

      <div className="p-4 max-w-xl mx-auto space-y-2">
        {conversations.map((c) => (
          <div
            key={c.id}
            onClick={() => setSelectedConversation(c.businessName)}
            className="bg-white p-3.5 rounded-2xl border border-[#E8EDF3] shadow-xs flex items-center gap-3 hover:border-[#0BE9EF] transition-all cursor-pointer"
          >
            <img
              src={c.avatarUrl}
              alt={c.businessName}
              className="w-12 h-12 rounded-2xl object-cover flex-shrink-0 border border-[#E8EDF3]"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-[#111827] truncate">
                  {c.businessName}
                </h3>
                <span className="text-[10px] text-[#97A3B4] font-bold">{c.time}</span>
              </div>
              <div className="text-[11px] font-black text-[#0794A0] truncate">{c.context}</div>
              <div className="text-xs text-[#5C6B80] font-medium truncate mt-0.5">
                {c.lastMessage}
              </div>
            </div>

            {c.unread > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#FB8205] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                {c.unread}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
