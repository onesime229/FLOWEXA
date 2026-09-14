import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  ShieldCheck,
  Building2,
  Layers,
  CreditCard,
  ArrowRight,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { flowexaApi } from '../../services/api';
import { AIAssistantMessage } from '../../types';

interface AdminAIAssistantProps {
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const AdminAIAssistant: React.FC<AdminAIAssistantProps> = ({ onShowToast }) => {
  const [messages, setMessages] = useState<AIAssistantMessage[]>([
    {
      id: 'admin-welcome',
      sender: 'assistant',
      text: "Bonjour Super Admin. Je suis l'Assistant IA Plateforme Flowexa. Je consolide les données globales de l'écosystème multi-tenant (entreprises actives, volume de transactions, catégories de services les plus dynamiques). Comment puis-je vous éclairer ?",
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      suggestedQuestions: [
        'Combien d’entreprises sont actives ?',
        'Quelle catégorie reçoit le plus de demandes ?',
        'Quel est le volume global de transactions ?',
      ],
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || isSending) return;

    const userMsg: AIAssistantMessage = {
      id: `admin-usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsSending(true);

    try {
      const res = await flowexaApi.askAdminAssistant(text);
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'assistant',
            text: res.message || "Impossible d'analyser les métriques pour le moment.",
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'Erreur réseau lors de la consultation de l’Assistant Admin.',
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#0A1428] via-[#0E1E38] to-[#12284C] border border-[#0BE9EF]/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0BE9EF]/10 border border-[#0BE9EF]/30 text-[#0BE9EF] text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Supervision Globale IA</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Assistant Stratégique Plateforme
            </h2>
            <p className="text-gray-300 text-sm mt-1 max-w-xl">
              Interrogez l'ensemble des métriques de la plateforme en langage naturel pour suivre l'adoption et la volumétrie.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Gouvernance Multi-Tenant Sécurisée</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-[#0A1428] border border-white/10 rounded-2xl flex flex-col h-[520px] overflow-hidden shadow-2xl">
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    {msg.sender === 'assistant' ? (
                      <>
                        <div className="w-5 h-5 rounded-full bg-[#0BE9EF]/20 text-[#0BE9EF] flex items-center justify-center text-xs font-bold">
                          IA
                        </div>
                        <span className="text-xs text-[#0BE9EF] font-semibold">Assistant Admin Flowexa</span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">Super Admin</span>
                    )}
                    <span className="text-[10px] text-gray-500">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-[#FB8205] text-white rounded-tr-none shadow-md shadow-[#FB8205]/20 font-medium'
                        : 'bg-[#12284C] text-gray-100 rounded-tl-none border border-white/10 shadow-lg'
                    }`}
                  >
                    {msg.text}

                    {msg.dataReferences && msg.dataReferences.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                        {msg.dataReferences.map((ref, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0A1428] border border-white/10 text-xs text-gray-300 font-mono"
                          >
                            <span className="text-gray-400">{ref.label} :</span>
                            <span className="text-[#0BE9EF] font-bold">{ref.value}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 max-w-[85%]">
                      {msg.suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(q)}
                          className="text-xs bg-white/5 hover:bg-[#0BE9EF]/15 border border-white/10 hover:border-[#0BE9EF]/30 text-gray-300 hover:text-[#0BE9EF] px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-left"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isSending && (
                <div className="flex items-center gap-2 text-xs text-[#0BE9EF] p-2 bg-[#12284C]/50 rounded-xl max-w-xs border border-white/5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Calcul des statistiques consolidées...</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-[#050C1A] border-t border-white/10">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputQuery);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Posez une question sur le réseau, les inscriptions, le volume..."
                  className="flex-1 bg-[#0A1428] border border-white/10 focus:border-[#0BE9EF] outline-none px-4 py-2.5 rounded-xl text-white text-sm placeholder-gray-500 transition-colors"
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!inputQuery.trim() || isSending}
                  className="bg-[#FB8205] hover:bg-[#E06900] text-white px-5 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="bg-[#0A1428] border-white/10 p-5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#0BE9EF]" />
              <span>Requêtes fréquentes</span>
            </h4>
            <div className="space-y-2">
              {[
                'Combien d’entreprises sont actives ?',
                'Quelle catégorie reçoit le plus de demandes ?',
                'Quel est le volume global de transactions ?',
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(q)}
                  className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-[#0BE9EF]/10 border border-white/5 hover:border-[#0BE9EF]/30 text-xs text-gray-200 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <span>{q}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#0BE9EF] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </Card>

          <Card className="bg-[#0A1428] border-white/10 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Supervision & Intégrité</h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  L'assistant s'appuie sur la base de données réelle (DataStore / BI). Il ne formule aucune prédiction fantaisiste et synthétise fidèlement les transactions et statuts actuels.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
