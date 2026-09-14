import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Radio,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Filter,
  RefreshCw,
  Send,
  ShieldAlert,
  Server,
  Activity,
  Check,
} from 'lucide-react';
import {
  CommunicationLog,
  CommunicationProviderStatus,
  CommunicationStats,
  NotificationChannel,
  CommunicationStatus,
} from '../../types';

export const AdminCommunicationsManagement: React.FC = () => {
  const [stats, setStats] = useState<CommunicationStats | null>(null);
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRetryingId, setIsRetryingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedRecipientType, setSelectedRecipientType] = useState<string>('ALL');

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('flowexa_token') : null;
    return {
      'x-user-role': 'SUPER_ADMIN',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, logsRes] = await Promise.all([
        fetch('/api/v1/admin/communications/stats', {
          headers: getAuthHeaders(),
        }),
        fetch(
          `/api/v1/admin/communications?channel=${selectedChannel}&status=${selectedStatus}&recipient_type=${selectedRecipientType}`,
          {
            headers: getAuthHeaders(),
          }
        ),
      ]);

      const statsJson = await statsRes.json();
      const logsJson = await logsRes.json();

      if (statsJson.success) setStats(statsJson.data);
      if (logsJson.success && Array.isArray(logsJson.data)) setLogs(logsJson.data);
    } catch (err) {
      console.error('Erreur chargement communications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedChannel, selectedStatus, selectedRecipientType]);

  // Relancer une communication
  const handleRetry = async (logId: string) => {
    setIsRetryingId(logId);
    try {
      const res = await fetch(`/api/v1/admin/communications/${logId}/retry`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: data.message });
        fetchData();
      } else {
        setFeedback({ type: 'error', message: data.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Erreur lors de la tentative de relance.' });
    } finally {
      setIsRetryingId(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Basculer l'activation d'un canal globalement
  const handleToggleChannel = async (channelKey: string, currentValue: boolean) => {
    try {
      const fieldMap: Record<string, string> = {
        INTERNAL: 'inAppEnabled',
        EMAIL: 'emailEnabled',
        SMS: 'smsEnabled',
        WHATSAPP: 'whatsappEnabled',
        PUSH: 'pushEnabled',
      };
      const field = fieldMap[channelKey];
      if (!field) return;

      const res = await fetch('/api/v1/admin/communications/channels', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ [field]: !currentValue }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          message: `Canal ${channelKey} ${!currentValue ? 'activé' : 'désactivé'} avec succès.`,
        });
        fetchData();
      }
    } catch (err) {
      console.error('Erreur bascule canal:', err);
    } finally {
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  // Test en direct
  const handleTriggerTest = async () => {
    try {
      const res = await fetch('/api/v1/notifications/test-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          title: 'Test Supervision Admin Flowexa',
          message: 'Vérification du routage multi-canal exécutée depuis le panneau Super Admin.',
          category: 'SYSTEM',
          priority: 'NORMAL',
          channels: ['INTERNAL', 'EMAIL', 'SMS', 'WHATSAPP'],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Test de communication envoyé et journalisé.' });
        fetchData();
      } else {
        setFeedback({ type: 'error', message: data.skippedReason || 'Notification ignorée (anti-spam).' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Erreur lors du test de notification.' });
    } finally {
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#0A1428]/80 border border-white/5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0BE9EF]/10 border border-[#0BE9EF]/30 flex items-center justify-center text-[#0BE9EF]">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Communications & Notifications (Sprint B30 + F30)
              <span className="px-2 py-0.5 rounded-full bg-[#0BE9EF]/20 text-[#0BE9EF] text-[10px] font-bold border border-[#0BE9EF]/30">
                Hub Multi-Canal
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Supervision des fournisseurs réels, métriques de délivrabilité, anti-spam et audit technique.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleTriggerTest}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FB8205] text-white hover:bg-[#FB8205]/90 text-xs font-semibold shadow-md cursor-pointer transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Tester un envoi</span>
          </button>

          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 text-xs font-semibold cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#0BE9EF]' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {feedback.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Providers Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats?.providers.map((p) => {
          const getIcon = () => {
            switch (p.channel) {
              case 'INTERNAL':
                return <Bell className="w-5 h-5 text-[#0BE9EF]" />;
              case 'EMAIL':
                return <Mail className="w-5 h-5 text-sky-400" />;
              case 'SMS':
                return <Smartphone className="w-5 h-5 text-amber-400" />;
              case 'WHATSAPP':
                return <MessageSquare className="w-5 h-5 text-emerald-400" />;
              default:
                return <Server className="w-5 h-5 text-gray-400" />;
            }
          };

          return (
            <div
              key={p.channel}
              className="p-4 rounded-xl bg-[#0A1428]/60 border border-white/5 flex flex-col justify-between gap-3 relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                    {getIcon()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{p.providerName}</h4>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">{p.channel}</span>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                    p.isConfigured
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      p.isConfigured ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  {p.isConfigured ? 'Connecté' : 'Non configuré'}
                </span>
              </div>

              <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                {p.details}
              </p>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-gray-500 text-[10px]">Canal actif</span>
                <button
                  onClick={() => handleToggleChannel(p.channel, p.isEnabled)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    p.isEnabled ? 'bg-[#0BE9EF]' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      p.isEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0A1428]/40 border border-white/5">
          <div className="text-[11px] text-gray-400 font-medium">Total Émis</div>
          <div className="text-xl font-bold text-white mt-1">{stats?.total || 0}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Toutes notifications</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0A1428]/40 border border-white/5">
          <div className="text-[11px] text-gray-400 font-medium">Succès / Envoyés</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {(stats?.sent || 0) + (stats?.delivered || 0)}
          </div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5">Délivrés aux destinataires</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0A1428]/40 border border-white/5">
          <div className="text-[11px] text-gray-400 font-medium">Échecs / Non configurés</div>
          <div className="text-xl font-bold text-amber-400 mt-1">{stats?.failed || 0}</div>
          <div className="text-[10px] text-amber-500/80 mt-0.5">Fournisseurs manquants ou erreurs</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0A1428]/40 border border-white/5">
          <div className="text-[11px] text-gray-400 font-medium">En attente / Queue</div>
          <div className="text-xl font-bold text-[#0BE9EF] mt-1">{stats?.pending || 0}</div>
          <div className="text-[10px] text-cyan-500/80 mt-0.5">File de traitement asynchrone</div>
        </div>
      </div>

      {/* Logs Section */}
      <div className="p-5 bg-[#0A1428]/60 border border-white/5 rounded-2xl space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#0BE9EF]" />
            Journal Technique d'Envoi (CommunicationLog)
          </h3>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Canal */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">Canal :</span>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="bg-[#020919] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#0BE9EF]"
              >
                <option value="ALL">Tous les canaux</option>
                <option value="INTERNAL">In-App</option>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </div>

            {/* Filter Statut */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">Statut :</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-[#020919] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#0BE9EF]"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="SENT">Envoyé</option>
                <option value="DELIVERED">Délivré</option>
                <option value="FAILED">Échoué</option>
                <option value="PENDING">En attente</option>
                <option value="CANCELLED">Annulé</option>
              </select>
            </div>

            {/* Filter Destinataire */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">Public :</span>
              <select
                value={selectedRecipientType}
                onChange={(e) => setSelectedRecipientType(e.target.value)}
                className="bg-[#020919] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#0BE9EF]"
              >
                <option value="ALL">Tous</option>
                <option value="CLIENT">Clients</option>
                <option value="BUSINESS">Entreprises</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#020919] text-gray-400 border-b border-white/5 font-semibold">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Canal</th>
                <th className="px-4 py-3">Destinataire</th>
                <th className="px-4 py-3">Objet & Message</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Fournisseur & Erreur</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#0A1428]/30">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Aucun enregistrement de communication ne correspond aux filtres.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-gray-300">
                        {log.channel === 'EMAIL' && <Mail className="w-3 h-3 text-sky-400" />}
                        {log.channel === 'SMS' && <Smartphone className="w-3 h-3 text-amber-400" />}
                        {log.channel === 'WHATSAPP' && <MessageSquare className="w-3 h-3 text-emerald-400" />}
                        {log.channel === 'INTERNAL' && <Bell className="w-3 h-3 text-cyan-400" />}
                        <span>{log.channel}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-white">{log.recipientName || log.recipientId}</div>
                      <div className="text-[10px] text-gray-400">{log.recipientContact || 'In-App User'}</div>
                    </td>

                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-medium text-gray-200 truncate">{log.title}</div>
                      <div className="text-[11px] text-gray-400 truncate max-w-xs">{log.message}</div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'SENT' || log.status === 'DELIVERED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : log.status === 'FAILED'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : log.status === 'CANCELLED'
                            ? 'bg-gray-700/40 text-gray-400 border border-gray-600/30'
                            : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 max-w-xs">
                      <div className="text-gray-300 text-[11px] font-mono">{log.provider}</div>
                      {log.errorMessage ? (
                        <div className="text-red-400 text-[10px] truncate" title={log.errorMessage}>
                          {log.errorMessage}
                        </div>
                      ) : (
                        <div className="text-gray-500 text-[10px]">Aucune erreur</div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {log.status === 'FAILED' && (
                        <button
                          onClick={() => handleRetry(log.id)}
                          disabled={isRetryingId === log.id || log.retryCount >= log.maxRetries}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0BE9EF]/10 hover:bg-[#0BE9EF]/20 text-[#0BE9EF] border border-[#0BE9EF]/30 text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <RotateCcw className={`w-3 h-3 ${isRetryingId === log.id ? 'animate-spin' : ''}`} />
                          <span>Relancer ({log.retryCount}/{log.maxRetries})</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
