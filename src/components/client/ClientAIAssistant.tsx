import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  MapPin,
  Star,
  CheckCircle2,
  Clock,
  ArrowRight,
  Heart,
  ShieldCheck,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import {
  AIRecommendationItem,
  AIAssistantMessage,
  BusinessModuleCode,
} from '../../types';
import { flowexaApi } from '../../services/api';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';

interface ClientAIAssistantProps {
  clientId?: string;
  onSelectResult?: (result: any) => void;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ClientAIAssistant: React.FC<ClientAIAssistantProps> = ({
  clientId = 'client-test-1',
  onSelectResult,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'assistant' | 'recommendations'>('assistant');
  const [messages, setMessages] = useState<AIAssistantMessage[]>([
    {
      id: 'welcome-client',
      sender: 'assistant',
      text: "Bonjour ! Je suis votre Assistant Flowexa. Décrivez simplement ce que vous cherchez (lieu, type de service, budget, urgence...) et je vous proposerai les meilleures offres réelles et vérifiées du réseau :",
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      suggestedQuestions: [
        'Je cherche un logement proche de Cotonou',
        'Barbier ou coiffure ouvert aujourd’hui',
        'Hébergement avec piscine pour le week-end',
        'Offres disponibles à moins de 20 000 FCFA',
      ],
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Personalized recommendations
  const [recommendations, setRecommendations] = useState<AIRecommendationItem[]>([]);
  const [recReasoning, setRecReasoning] = useState<string>('');
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  const fetchRecommendations = async () => {
    try {
      setIsLoadingRecs(true);
      const res = await flowexaApi.getClientRecommendations({ clientId, limit: 8 });
      if (res.success && res.data) {
        setRecommendations(res.data.recommendations || []);
        setRecReasoning(res.data.reasoning || '');
      }
    } catch (err) {
      console.error('Erreur chargement recommandations', err);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [clientId]);

  const handleSendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || isSending) return;

    const userMsg: AIAssistantMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsSending(true);

    try {
      const res = await flowexaApi.askClientAssistant({
        message: text,
        clientId,
      });

      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'assistant',
            text: res.message || "Je n'ai pas pu traiter votre demande pour le moment.",
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
          text: 'Une erreur de communication est survenue.',
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0A1428] via-[#0E1E38] to-[#12284C] border border-[#0BE9EF]/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#0BE9EF]/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0BE9EF]/10 border border-[#0BE9EF]/30 text-[#0BE9EF] text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Assistant Intelligent Flowexa</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Recherchez naturellement vos prestations
            </h2>
            <p className="text-gray-300 text-sm mt-1 max-w-xl">
              Trouvez immédiatement les hébergements, artisans et services disponibles selon votre localisation, vos critères et votre budget.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('assistant')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'assistant'
                  ? 'bg-[#0BE9EF] text-[#0A1428] shadow-md shadow-[#0BE9EF]/20'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              Assistant Conversationnel
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'recommendations'
                  ? 'bg-[#0BE9EF] text-[#0A1428] shadow-md shadow-[#0BE9EF]/20'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              Recommandations Personnalisées
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: ASSISTANT CONVERSATIONNEL */}
      {activeTab === 'assistant' && (
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl flex flex-col h-[600px] overflow-hidden shadow-2xl">
          {/* Messages list */}
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
                      <span className="text-xs text-[#0BE9EF] font-semibold">Assistant Flowexa</span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400">Vous</span>
                  )}
                  <span className="text-[10px] text-gray-500">{msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-[90%] md:max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#FB8205] text-white rounded-tr-none shadow-md shadow-[#FB8205]/20 font-medium'
                      : 'bg-[#12284C] text-gray-100 rounded-tl-none border border-white/10 shadow-lg'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Recommendation Cards inside the message */}
                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/10">
                      {msg.recommendations.map((rec) => (
                        <div
                          key={rec.id}
                          className="bg-[#0A1428] border border-white/10 hover:border-[#0BE9EF]/40 rounded-xl p-3.5 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#0BE9EF]/10 text-[#0BE9EF] font-semibold">
                                {rec.category}
                              </span>
                              {rec.highlightBadge && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold">
                                  {rec.highlightBadge}
                                </span>
                              )}
                            </div>

                            <h5 className="text-sm font-bold text-white line-clamp-1">{rec.title}</h5>
                            <div className="text-xs text-gray-400 mt-0.5">{rec.businessName}</div>

                            <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-[#0BE9EF]" />
                                <span>{rec.location}</span>
                              </span>
                              {rec.rating !== null && (
                                <span className="flex items-center gap-1 text-amber-400">
                                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                                  <span>{rec.rating.toFixed(1)}</span>
                                </span>
                              )}
                            </div>

                            {/* Explicable Reasons badges */}
                            {rec.explanations && rec.explanations.length > 0 && (
                              <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1">
                                {rec.explanations.slice(0, 2).map((exp, i) => (
                                  <div
                                    key={i}
                                    className="text-[11px] text-emerald-400 flex items-center gap-1.5"
                                  >
                                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                                    <span className="line-clamp-1">{exp}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                            <div className="text-sm font-bold text-white">
                              {rec.priceFormatted}
                              {rec.priceUnit && (
                                <span className="text-[11px] font-normal text-gray-400"> {rec.priceUnit}</span>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                if (onSelectResult) {
                                  onSelectResult(rec);
                                }
                              }}
                              className="text-xs py-1 px-3 bg-[#FB8205] hover:bg-[#E06900]"
                            >
                              <span>Choisir</span>
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Suggested questions */}
                {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 max-w-[90%] md:max-w-[80%]">
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
                <span>Recherche et analyse des offres...</span>
              </div>
            )}
          </div>

          {/* Chat input form */}
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
                placeholder="Ex : Chambre d'hôte à Cotonou avec piscine pour moins de 40 000 FCFA..."
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
      )}

      {/* TAB 2: RECOMMANDATIONS PERSONNALISÉES */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#0BE9EF]" />
                <span>Sélection Personnalisée Pour Vous</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {recReasoning || "Calculé d'après vos réservations antérieures et vos favoris enregistrés."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRecommendations}
              disabled={isLoadingRecs}
              className="border-white/10 text-gray-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoadingRecs ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </Button>
          </div>

          {recommendations.length === 0 ? (
            <Card className="bg-[#0A1428] border-white/10 p-8 text-center">
              <Sparkles className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-300">Aucune recommandation pour l'instant</div>
              <p className="text-xs text-gray-500 mt-1">
                Explorez des services ou enregistrez des favoris pour alimenter vos recommandations intelligentes.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((item) => (
                <Card
                  key={item.id}
                  className="bg-[#0A1428] border-white/10 hover:border-[#0BE9EF]/40 p-4 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#0BE9EF]/10 text-[#0BE9EF] font-semibold">
                        {item.category}
                      </span>
                      {item.isFavorite && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 flex items-center gap-1 font-semibold">
                          <Heart className="w-3 h-3 fill-red-400" />
                          <span>Favori</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-white line-clamp-1">{item.title}</h4>
                    <div className="text-xs text-gray-400 mt-0.5">{item.businessName}</div>

                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#0BE9EF]" />
                        <span>{item.location}</span>
                      </span>
                      {item.rating !== null && (
                        <span className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{item.rating.toFixed(1)}</span>
                          <span className="text-gray-500">({item.reviewCount})</span>
                        </span>
                      )}
                    </div>

                    {/* Explicable justifications */}
                    {item.explanations && item.explanations.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-white/5 space-y-1">
                        {item.explanations.slice(0, 2).map((exp, idx) => (
                          <div
                            key={idx}
                            className="text-[11px] text-emerald-400 flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            <span className="line-clamp-1">{exp}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">
                        {item.priceFormatted}
                        {item.priceUnit && (
                          <span className="text-[11px] font-normal text-gray-400"> {item.priceUnit}</span>
                        )}
                      </div>
                      <div className="text-[10px] text-emerald-400">Disponible</div>
                    </div>

                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        if (onSelectResult) {
                          onSelectResult(item);
                        }
                      }}
                      className="bg-[#FB8205] hover:bg-[#E06900] text-xs px-3"
                    >
                      <span>Consulter</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
