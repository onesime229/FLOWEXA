import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Users,
  Send,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
  BarChart3,
  Calendar,
  DollarSign,
  FileText,
  RefreshCw,
  Info,
  AlertCircle,
} from 'lucide-react';
import {
  AIBusinessInsights,
  AIAssistantMessage,
  AIOpportunity,
  AIProblemAlert,
  AIPrediction,
} from '../../types';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { flowexaApi } from '../../services/api';

interface BusinessAIAssistantProps {
  businessId: string;
  businessName: string;
  moduleCode: string;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  onNavigateToTab?: (tab: string) => void;
}

export const BusinessAIAssistant: React.FC<BusinessAIAssistantProps> = ({
  businessId,
  businessName,
  moduleCode,
  onShowToast,
  onNavigateToTab,
}) => {
  const [insights, setInsights] = useState<AIBusinessInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'assistant' | 'opportunities' | 'alerts' | 'predictions' | 'segments'>('assistant');

  // Chat conversation state
  const [chatMessages, setChatMessages] = useState<AIAssistantMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `Bonjour ! Je suis votre Assistant IA Flowexa pour **${businessName}**. Je consulte vos données réelles de gestion (ventes, demandes, Health Score, réservations) pour vous aider à piloter votre activité. Cliquez sur une suggestion ci-dessous ou posez-moi votre question :`,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      suggestedQuestions: [
        'Combien ai-je gagné ce mois-ci ?',
        'Quel service est le plus demandé ?',
        'Quels sont mes meilleurs clients ?',
        'Combien de demandes sont en attente ?',
        'Comment va mon activité ?',
        'Explique mon Health Score',
      ],
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchInsights = async () => {
    try {
      setIsLoading(true);
      const res = await flowexaApi.getBusinessInsights(businessId);
      if (res.success && res.data) {
        setInsights(res.data);
      }
    } catch (err) {
      console.error('Erreur chargement IA insights', err);
      onShowToast('Erreur', 'Impossible de charger les données analytiques IA.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [businessId]);

  const handleSendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || isSending) return;

    const userMsg: AIAssistantMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsSending(true);

    try {
      const res = await flowexaApi.askBusinessAssistant({
        businessId,
        message: text,
      });

      if (res.success && res.data) {
        setChatMessages((prev) => [...prev, res.data]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'assistant',
            text: res.message || "Désolé, je n'ai pas pu traiter votre requête en raison d'une indisponibilité temporaire.",
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'Une erreur réseau est survenue lors de la communication avec le serveur IA.',
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const quickPrompts = [
    'Combien ai-je gagné ce mois-ci ?',
    'Quel service est le plus demandé ?',
    'Quels sont mes clients fidèles ?',
    'Combien de demandes sont en attente ?',
    'Comment va mon activité ?',
    'Explique mon Health Score',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: AI Flowexa Assistant Overview */}
      <div className="bg-gradient-to-r from-[#0A1428] via-[#0E1E38] to-[#12284C] border border-[#0BE9EF]/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#0BE9EF]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0BE9EF]/10 border border-[#0BE9EF]/30 text-[#0BE9EF] text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Flowexa Intelligence & Décisionnel</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <span>Assistant IA & Pilotage Stratégique</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-normal">
                Données réelles vérifiées
              </span>
            </h2>
            <p className="text-gray-300 text-sm mt-1 max-w-2xl">
              Analyse automatique de votre activité, détection d'opportunités, alertes opérationnelles, prévisions statistiques et assistant interactif connecté à vos métriques de gestion.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchInsights}
              disabled={isLoading}
              className="border-white/10 hover:border-white/20 text-gray-200"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Actualiser l'analyse</span>
            </Button>
          </div>
        </div>

        {/* Quick KPI strip */}
        {insights && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
            <div className="bg-[#050C1A]/60 rounded-xl p-3 border border-white/5">
              <div className="text-xs text-gray-400">Health Score Actuel</div>
              <div className="text-xl font-bold text-[#0BE9EF] mt-0.5">
                {insights.healthScore.score}/100
              </div>
              <div className="text-[11px] text-gray-400 truncate mt-0.5">{insights.healthScore.interpretation}</div>
            </div>

            <div className="bg-[#050C1A]/60 rounded-xl p-3 border border-white/5">
              <div className="text-xs text-gray-400">Opportunités Détectées</div>
              <div className="text-xl font-bold text-amber-400 mt-0.5">
                {insights.opportunities.length}
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">Axes de croissance</div>
            </div>

            <div className="bg-[#050C1A]/60 rounded-xl p-3 border border-white/5">
              <div className="text-xs text-gray-400">Alertes & Risques</div>
              <div className={`text-xl font-bold mt-0.5 ${insights.alerts.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {insights.alerts.length}
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                {insights.alerts.length === 0 ? 'Tous indicateurs sains' : 'Points d’attention'}
              </div>
            </div>

            <div className="bg-[#050C1A]/60 rounded-xl p-3 border border-white/5">
              <div className="text-xs text-gray-400">Tendance Estimée (30j)</div>
              <div className="text-lg font-bold text-white mt-0.5 truncate">
                {insights.predictions.hasEnoughData ? insights.predictions.estimatedFormatted : 'En cours'}
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5 truncate">{insights.predictions.confidenceLabel}</div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSection('assistant')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
            activeSection === 'assistant'
              ? 'bg-[#0BE9EF]/15 text-[#0BE9EF] border border-[#0BE9EF]/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Assistant Entreprise</span>
        </button>

        <button
          onClick={() => setActiveSection('opportunities')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
            activeSection === 'opportunities'
              ? 'bg-[#0BE9EF]/15 text-[#0BE9EF] border border-[#0BE9EF]/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Opportunités</span>
          {insights && insights.opportunities.length > 0 && (
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {insights.opportunities.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSection('alerts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
            activeSection === 'alerts'
              ? 'bg-[#0BE9EF]/15 text-[#0BE9EF] border border-[#0BE9EF]/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Alertes & Problèmes</span>
          {insights && insights.alerts.length > 0 && (
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
              {insights.alerts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSection('predictions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
            activeSection === 'predictions'
              ? 'bg-[#0BE9EF]/15 text-[#0BE9EF] border border-[#0BE9EF]/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Prévisions CA</span>
        </button>

        <button
          onClick={() => setActiveSection('segments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
            activeSection === 'segments'
              ? 'bg-[#0BE9EF]/15 text-[#0BE9EF] border border-[#0BE9EF]/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Segmentation Clients</span>
        </button>
      </div>

      {/* SECTION 1: ASSISTANT CHAT INTERACTIF */}
      {activeSection === 'assistant' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Conversation box */}
            <div className="bg-[#0A1428] border border-white/10 rounded-2xl flex flex-col h-[520px] overflow-hidden">
              {/* Messages container */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {chatMessages.map((msg) => (
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
                      className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.sender === 'user'
                          ? 'bg-[#FB8205] text-white rounded-tr-none shadow-md shadow-[#FB8205]/20 font-medium'
                          : 'bg-[#12284C] text-gray-100 rounded-tl-none border border-white/10 shadow-lg'
                      }`}
                    >
                      {msg.text}

                      {/* Structured References pills if present */}
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

                    {/* Suggested questions clickable pills from assistant */}
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
                    <span>Analyse des métriques réelles en cours...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
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
                    placeholder="Posez une question sur vos ventes, clients, demandes, avis..."
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

          {/* Quick Prompts & AI Directives Card */}
          <div className="space-y-4">
            <Card className="bg-[#0A1428] border-white/10 p-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#0BE9EF]" />
                <span>Questions fréquentes</span>
              </h3>
              <p className="text-xs text-gray-400 mb-3">
                Cliquez pour obtenir une réponse instantanée calculée à partir de vos données :
              </p>
              <div className="space-y-2">
                {quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(prompt)}
                    className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-[#0BE9EF]/10 border border-white/5 hover:border-[#0BE9EF]/30 text-xs text-gray-200 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <span>{prompt}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#0BE9EF] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </Card>

            <Card className="bg-[#0A1428] border-white/10 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Confidentialité & Rigueur</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    L'Assistant Flowexa respecte une étanchéité multi-tenant stricte. Aucune donnée d'un autre établissement n'est accessible, et toutes les réponses proviennent de votre activité réelle.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* SECTION 2: OPPORTUNITÉS DÉTECTÉES */}
      {activeSection === 'opportunities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                <span>Détection d'Opportunités Commerciales</span>
              </h3>
              <p className="text-sm text-gray-400">
                Conclusions objectives calculées à partir de vos volumes de demandes et de vos taux de conversion.
              </p>
            </div>
            <Badge variant="warning">
              {insights?.opportunities.length || 0} opportunité(s)
            </Badge>
          </div>

          {insights?.opportunities.length === 0 ? (
            <Card className="bg-[#0A1428] border-white/10 p-8 text-center">
              <Info className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-300">Aucune opportunité saillante pour l'instant</div>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                Continuez à enregistrer des demandes et réservations. Dès que des tendances récurrentes émergent, Flowexa les mettra en évidence.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights?.opportunities.map((opp) => (
                <Card key={opp.id} className="bg-[#0A1428] border-white/10 p-5 flex flex-col justify-between hover:border-amber-500/30 transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                        {opp.impact === 'HIGH' ? 'Impact Élevé' : 'Impact Modéré'}
                      </span>
                      {opp.metric && (
                        <span className="text-xs font-mono text-[#0BE9EF] font-bold">
                          {opp.metric}
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-white">{opp.title}</h4>
                    <p className="text-xs text-gray-300 mt-1 leading-relaxed">{opp.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 bg-white/5 -mx-5 -mb-5 p-4 rounded-b-xl">
                    <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                      <Zap className="w-3.5 h-3.5 text-[#0BE9EF]" />
                      <span>Action recommandée</span>
                    </div>
                    <div className="text-xs text-emerald-300 font-medium">{opp.suggestedAction}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: ALERTES & PROBLÈMES */}
      {activeSection === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span>Alertes Opérationnelles & Détection de Risques</span>
              </h3>
              <p className="text-sm text-gray-400">
                Identification préventive des retards, des baisses d'acceptation et des anomalies de paiement.
              </p>
            </div>
            <Badge variant={insights && insights.alerts.length > 0 ? 'danger' : 'success'}>
              {insights?.alerts.length || 0} alerte(s)
            </Badge>
          </div>

          {insights?.alerts.length === 0 ? (
            <Card className="bg-[#0A1428] border-white/10 p-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <div className="text-base font-bold text-white">Aucune anomalie détectée</div>
              <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                Toutes vos demandes sont traitées dans les délais, et vos taux de conversion et d'encaissement restent stables.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {insights?.alerts.map((al) => (
                <Card
                  key={al.id}
                  className={`p-5 border transition-colors ${
                    al.severity === 'CRITICAL'
                      ? 'bg-red-950/20 border-red-500/30'
                      : al.severity === 'WARNING'
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-blue-950/20 border-blue-500/30'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${
                        al.severity === 'CRITICAL' ? 'text-red-400' : al.severity === 'WARNING' ? 'text-amber-400' : 'text-blue-400'
                      }`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{al.title}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            al.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-300' : al.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {al.severity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 mt-1">{al.description}</p>
                      </div>
                    </div>
                    {al.metric && (
                      <span className="text-xs font-mono font-bold text-white px-2.5 py-1 bg-black/40 rounded-md border border-white/10 shrink-0">
                        {al.metric}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <div className="text-gray-300 flex items-center gap-1.5">
                      <span className="text-gray-400 font-medium">Action préconisée :</span>
                      <span className="text-white font-medium">{al.suggestedAction}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: PRÉVISIONS DU CHIFFRE D'AFFAIRES */}
      {activeSection === 'predictions' && insights && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#0BE9EF]" />
              <span>Modèle Prévisionnel du Chiffre d'Affaires</span>
            </h3>
            <p className="text-sm text-gray-400">
              Estimation statistique basée sur le run-rate journalier réel et l'historique des 30 derniers jours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-[#0A1428] border-white/10 p-6 md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Tendance Estimée (30 prochains jours)</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  insights.predictions.trend === 'UP'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : insights.predictions.trend === 'DOWN'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  {insights.predictions.trend === 'UP' && <TrendingUp className="w-3.5 h-3.5" />}
                  {insights.predictions.trend === 'DOWN' && <TrendingDown className="w-3.5 h-3.5" />}
                  <span>{insights.predictions.trend === 'UP' ? 'Trajectoire positive' : insights.predictions.trend === 'DOWN' ? 'Trajectoire en recul' : 'Trajectoire stable'}</span>
                </span>
              </div>

              <div className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                {insights.predictions.hasEnoughData ? insights.predictions.estimatedFormatted : 'Données insuffisantes'}
              </div>

              <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/5 space-y-1.5">
                <div className="text-xs text-gray-400">
                  <span className="text-gray-300 font-semibold">Méthodologie : </span>
                  {insights.predictions.methodology}
                </div>
                <div className="text-xs text-gray-400">
                  <span className="text-gray-300 font-semibold">Niveau de fiabilité : </span>
                  <span className="text-[#0BE9EF]">{insights.predictions.confidenceLabel}</span>
                </div>
              </div>

              <div className="mt-4 text-[11px] text-gray-500 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
                <span>{insights.predictions.disclaimer}</span>
              </div>
            </Card>

            <Card className="bg-[#0A1428] border-white/10 p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-white mb-2">Chiffre d'Affaires Actuel (30j)</h4>
                <div className="text-2xl font-bold text-[#FB8205]">
                  {(insights.predictions?.currentPeriodValue ?? 0).toLocaleString('fr-FR')} FCFA
                </div>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Somme réelle de toutes les transactions Mobile Money et paiements terminés avec succès sur la période écoulée.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="text-xs font-semibold text-gray-300 mb-1">Règle de rigueur Flowexa</div>
                <div className="text-[11px] text-gray-400 leading-relaxed">
                  Le système ne formule jamais de pourcentage inventé. Si moins de 2 transactions sont enregistrées, l'estimation est mise en attente.
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* SECTION 5: SEGMENTATION CLIENTS RÉELLE */}
      {activeSection === 'segments' && insights && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <span>Segmentation Clients Réelle</span>
            </h3>
            <p className="text-sm text-gray-400">
              Identification des clients récurrents et des clients sans interaction récente à réengager.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Clients Fidèles */}
            <Card className="bg-[#0A1428] border-white/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Clients Fidèles & Récurrents</span>
                </h4>
                <Badge variant="success">
                  {insights.customerSegments.loyalClients.length} identifié(s)
                </Badge>
              </div>

              {insights.customerSegments.loyalClients.length === 0 ? (
                <p className="text-xs text-gray-500 py-6 text-center">
                  Aucun client récurrent pour le moment (nécessite 2+ demandes ou commandes terminées).
                </p>
              ) : (
                <div className="space-y-2.5">
                  {insights.customerSegments.loyalClients.map((c, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{c.clientName}</div>
                        <div className="text-[11px] text-gray-400">{c.totalInteractions} interaction(s) au total</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-[#0BE9EF]">
                          {(c.totalSpent ?? 0) > 0 ? `${(c.totalSpent).toLocaleString('fr-FR')} FCFA` : 'Engagé'}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Dernier : {new Date(c.lastInteractionDate).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Clients à risque / À relancer */}
            <Card className="bg-[#0A1428] border-white/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Clients Inactifs à Relancer (&gt;30 jours)</span>
                </h4>
                <Badge variant="warning">
                  {insights.customerSegments.atRiskClients.length} à relancer
                </Badge>
              </div>

              {insights.customerSegments.atRiskClients.length === 0 ? (
                <p className="text-xs text-gray-500 py-6 text-center">
                  Aucun client en phase d'inactivité prolongée. Votre base reste active !
                </p>
              ) : (
                <div className="space-y-2.5">
                  {insights.customerSegments.atRiskClients.map((c, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{c.clientName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                          Inactif depuis {c.daysSinceLastActivity} jours
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-300">{c.suggestedAction}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
