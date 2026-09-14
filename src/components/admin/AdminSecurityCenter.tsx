import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Activity,
  UserX,
  FileCheck,
  Database,
  Layers,
  Search,
} from 'lucide-react';
import { Badge } from '../design-system/Badge';
import { Button } from '../design-system/Button';

interface SecurityStatus {
  multiTenantEnforced: boolean;
  realtimeSuspensionCheck: boolean;
  rateLimitingActive: boolean;
  inputSanitizationActive: boolean;
  jwtAlgorithm: string;
  auditTrailCount: number;
  recentSecurityIncidents: number;
  lastAuditDate: string;
}

interface SecurityAuditTestItem {
  id: string;
  name: string;
  category: string;
  status: 'PASSED' | 'FAILED';
  description: string;
  details?: string;
  timestamp: string;
}

interface SecurityAuditResult {
  timestamp: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    rate: string;
  };
  tests: SecurityAuditTestItem[];
}

interface SecurityLog {
  id: string;
  timestamp: string;
  action: string;
  entityType: string;
  entityId: string;
  userEmail: string;
  description: string;
  ip: string;
}

export const AdminSecurityCenter: React.FC = () => {
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [testResults, setTestResults] = useState<SecurityAuditResult | null>(null);
  const [recentLogs, setRecentLogs] = useState<SecurityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [logFilter, setLogFilter] = useState('');

  const fetchSecurityData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('flowexa_token') || '';
      const headers: Record<string, string> = {
        'x-user-role': 'SUPER_ADMIN',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const [statusRes, logsRes] = await Promise.all([
        fetch('/api/v1/admin/security/status', { credentials: 'include', headers }),
        fetch('/api/v1/admin/audit-logs?limit=15', { credentials: 'include', headers }),
      ]);

      if (statusRes.ok) {
        const json = await statusRes.json();
        if (json.success) setStatus(json.data);
      }

      if (logsRes.ok) {
        const json = await logsRes.json();
        if (json.success) setRecentLogs(json.data || []);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des données de sécurité:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunSecurityTests = async () => {
    setIsRunningTests(true);
    try {
      const token = localStorage.getItem('flowexa_token') || '';
      const res = await fetch('/api/v1/admin/security/run-tests', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'SUPER_ADMIN',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setTestResults(json.data);
          // Rafraîchir les logs pour voir l'exécution de l'audit
          fetchSecurityData();
        }
      }
    } catch (err) {
      console.error('Erreur lors de l’exécution des tests de sécurité:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const filteredLogs = recentLogs.filter((log) => {
    if (!logFilter) return true;
    const q = logFilter.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.description.toLowerCase().includes(q) ||
      log.userEmail.toLowerCase().includes(q) ||
      log.ip.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#10D97F]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#10D97F]/20 border border-[#10D97F]/40 flex items-center justify-center text-[#10D97F] shadow-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-extrabold text-white">
                  Centre de Sécurité & Conformité Multi-Tenant
                </h2>
                <Badge variant="success">B31 & F31 Actif</Badge>
              </div>
              <p className="text-xs text-gray-400">
                Isolation stricte des données, protection IDOR, révocation temps réel et audit de traçabilité
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSecurityData}
              disabled={isLoading}
              className="border-white/10 text-gray-300 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunSecurityTests}
              disabled={isRunningTests}
              className="bg-[#10D97F] hover:bg-[#0eb86b] text-black font-bold shadow-lg shadow-[#10D97F]/20"
            >
              <Play className={`w-3.5 h-3.5 mr-1.5 ${isRunningTests ? 'animate-spin' : ''}`} />
              {isRunningTests ? 'Audit en cours...' : 'Lancer les tests de sécurité'}
            </Button>
          </div>
        </div>
      </div>

      {/* Security Pillars Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0A1428] border border-white/10 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Isolation Multi-Tenant</span>
            <Layers className="w-4 h-4 text-[#0BE9EF]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-white">Étanche</span>
            <span className="text-[10px] font-bold text-[#10D97F] bg-[#10D97F]/10 px-1.5 py-0.5 rounded">
              Tenant A ≠ B
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            Cloisonnement des catalogues, réservations, collaborateurs et messages.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0A1428] border border-white/10 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Révocation Temps Réel</span>
            <UserX className="w-4 h-4 text-[#FB8205]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-white">Active</span>
            <span className="text-[10px] font-bold text-[#10D97F] bg-[#10D97F]/10 px-1.5 py-0.5 rounded">
              0s Latence
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            Jeton invalidé dès qu'un compte ou une entreprise est suspendu.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0A1428] border border-white/10 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Protection Anti-Brute Force</span>
            <Activity className="w-4 h-4 text-[#10D97F]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-white">Rate Limiter</span>
            <span className="text-[10px] font-bold text-[#0BE9EF] bg-[#0BE9EF]/10 px-1.5 py-0.5 rounded">
              Fenêtre glissante
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            Limitation stricte des tentatives d'authentification et requêtes sensibles.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0A1428] border border-white/10 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Traçabilité & Audit</span>
            <FileCheck className="w-4 h-4 text-[#A855F7]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-white">
              {status?.auditTrailCount ? `${status.auditTrailCount} logs` : 'Complet'}
            </span>
            <span className="text-[10px] font-bold text-[#A855F7] bg-[#A855F7]/10 px-1.5 py-0.5 rounded">
              Inaltérable
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            Historique complet des actions avec IP, identifiant et horodatage ISO.
          </p>
        </div>
      </div>

      {/* Automated Tests Results Section (When Run) */}
      {testResults && (
        <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-[#10D97F]" />
              <h3 className="text-base font-bold text-white">Rapport d'Audit Automatisé</h3>
              <span className="text-xs text-gray-400">
                (Exécuté le {new Date(testResults.timestamp).toLocaleTimeString('fr-FR')})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-300">
                Score de sécurité : <strong className="text-[#10D97F]">{testResults.summary.rate}</strong> ({testResults.summary.passed}/{testResults.summary.total} réussis)
              </span>
              <Badge variant={testResults.summary.failed === 0 ? 'success' : 'danger'}>
                {testResults.summary.failed === 0 ? 'Conforme' : 'Attention requise'}
              </Badge>
            </div>
          </div>

          <div className="space-y-2.5">
            {testResults.tests.map((test) => {
              const isPassed = test.status === 'PASSED';
              return (
                <div
                  key={test.id}
                  className="p-3.5 rounded-xl bg-[#020919] border border-white/5 flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-[#10D97F]" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-gray-500">{test.id}</span>
                        <h4 className="text-xs font-bold text-white">{test.name}</h4>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">{test.description}</p>
                      {test.details && (
                        <p className="text-[11px] text-[#0BE9EF] mt-1 font-mono">{test.details}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={isPassed ? 'success' : 'danger'}>
                      {test.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Security Infrastructure Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-[#0A1428] border border-white/10 shadow-lg space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#0BE9EF]" />
            <h3 className="text-sm font-bold text-white">Chiffrement & Protection des Données</h3>
          </div>
          <div className="space-y-2.5 text-xs text-gray-300">
            <div className="p-3 rounded-xl bg-[#020919] border border-white/5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">En-têtes HTTP de Sécurité</p>
                <p className="text-[11px] text-gray-400">X-Content-Type-Options, X-XSS-Protection, Strict-Origin</p>
              </div>
              <Badge variant="success">Actif</Badge>
            </div>
            <div className="p-3 rounded-xl bg-[#020919] border border-white/5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">Protection Anti-XSS & Prototype Pollution</p>
                <p className="text-[11px] text-gray-400">Sanitisation récursive de tous les req.body et req.query</p>
              </div>
              <Badge variant="success">Actif</Badge>
            </div>
            <div className="p-3 rounded-xl bg-[#020919] border border-white/5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">Stockage Sécurisé des Mots de Passe</p>
                <p className="text-[11px] text-gray-400">Hachage SHA-256 avec salage cryptographique unique</p>
              </div>
              <Badge variant="success">Conforme</Badge>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0A1428] border border-white/10 shadow-lg space-y-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#10D97F]" />
            <h3 className="text-sm font-bold text-white">Sauvegardes & Intégrité Système</h3>
          </div>
          <div className="space-y-2.5 text-xs text-gray-300">
            <div className="p-3 rounded-xl bg-[#020919] border border-white/5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">Sauvegardes Automatiques (Vault)</p>
                <p className="text-[11px] text-gray-400">Snapshot quotidien automatique des données d'entreprises</p>
              </div>
              <Badge variant="success">Quotidien</Badge>
            </div>
            <div className="p-3 rounded-xl bg-[#020919] border border-white/5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">Rôle Super Administrateur Protégé</p>
                <p className="text-[11px] text-gray-400">Impossibilité d'élévation de privilèges via l'API collaborateurs</p>
              </div>
              <Badge variant="success">Verrouillé</Badge>
            </div>
            <div className="p-3 rounded-xl bg-[#020919] border border-white/5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">Contrôle Strict des Webhooks de Paiement</p>
                <p className="text-[11px] text-gray-400">Vérification de signature Kkiapay & FedaPay avant traitement</p>
              </div>
              <Badge variant="success">Protégé</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Live Security Audit Log Stream */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#0BE9EF]" />
            <h3 className="text-sm font-bold text-white">Journal d'Audit des Actions Sensibles</h3>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filtrer les actions..."
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#020919] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#0BE9EF]"
            />
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">
            Aucun événement sensible enregistré correspondant aux critères.
          </p>
        ) : (
          <div className="divide-y divide-white/5 max-h-96 overflow-y-auto pr-1">
            {filteredLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#0BE9EF] bg-[#0BE9EF]/10 px-1.5 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="text-[11px] text-gray-400">{log.userEmail}</span>
                    <span className="text-[10px] text-gray-500 font-mono">({log.ip})</span>
                  </div>
                  <p className="text-xs text-gray-300">{log.description}</p>
                </div>
                <span className="text-[10px] text-gray-500 font-mono flex-shrink-0">
                  {new Date(log.timestamp).toLocaleString('fr-FR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
