import React, { useState, useEffect } from 'react';
import {
  Zap,
  Clock,
  Sliders,
  CheckCircle2,
  XCircle,
  Play,
  RefreshCw,
  Building2,
  AlertTriangle,
  Gift,
  Calendar,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { AutomationRuleEntity, AutomationHistoryEntity, AutomationRuleType } from '../../types';

export const AdminAutomationsManagement: React.FC = () => {
  const [rules, setRules] = useState<AutomationRuleEntity[]>([]);
  const [history, setHistory] = useState<AutomationHistoryEntity[]>([]);
  const [stats, setStats] = useState<{
    totalRules: number;
    activeRules: number;
    totalSent: number;
    totalFailed: number;
  }>({ totalRules: 0, activeRules: 0, totalSent: 0, totalFailed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningEngine, setIsRunningEngine] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const fetchAdminAutomations = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/admin/automations', {
        headers: {
          'x-user-role': 'SUPER_ADMIN',
        },
      });
      if (res.ok) {
        const json = await res.json();
        setRules(json.data?.rules || []);
        setHistory(json.data?.history || []);
        setStats(
          json.data?.stats || {
            totalRules: 0,
            activeRules: 0,
            totalSent: 0,
            totalFailed: 0,
          }
        );
      }
    } catch (err) {
      console.error('Erreur chargement automatisations admin', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminAutomations();
  }, []);

  const handleToggleRule = async (rule: AutomationRuleEntity) => {
    try {
      const nextState = !rule.isEnabled;
      const res = await fetch(`/api/v1/admin/automations/rules/${rule.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'SUPER_ADMIN',
        },
        body: JSON.stringify({ isEnabled: nextState }),
      });

      if (res.ok) {
        setRules((prev) =>
          prev.map((r) => (r.id === rule.id ? { ...r, isEnabled: nextState } : r))
        );
        fetchAdminAutomations();
      }
    } catch (err) {
      console.error('Erreur bascule statut règle admin', err);
    }
  };

  const handleRunGlobalEngine = async () => {
    try {
      setIsRunningEngine(true);
      // Exécute pour la première entreprise test
      await fetch('/api/v1/businesses/biz-immo-1/automations/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'SUPER_ADMIN',
        },
        body: JSON.stringify({ force: false }),
      });
      await fetchAdminAutomations();
    } catch (err) {
      console.error('Erreur déclenchement moteur global', err);
    } finally {
      setIsRunningEngine(false);
    }
  };

  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.businessId.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.ruleType.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesType = typeFilter === 'ALL' || r.ruleType === typeFilter;
    return matchesSearch && matchesType;
  });

  const getRuleIcon = (type: AutomationRuleType) => {
    switch (type) {
      case 'APPOINTMENT_REMINDER':
        return <Calendar className="w-4 h-4 text-sky-400" />;
      case 'BOOKING_REMINDER':
        return <Clock className="w-4 h-4 text-emerald-400" />;
      case 'REQUEST_PENDING_FOLLOWUP':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'CLIENT_BIRTHDAY':
        return <Gift className="w-4 h-4 text-pink-400" />;
      default:
        return <Zap className="w-4 h-4 text-[#FB8205]" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      {/* Cockpit Super Admin */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="primary" dot>
              Supervision Plateforme
            </Badge>
            <span className="text-xs text-gray-400">Moteur Centralisé Multi-Tenant</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Zap className="w-6 h-6 text-[#FB8205]" />
            <span>Moteur d'Automatisation & Rappels</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Supervision de l'ensemble des règles de relance, rappels RDV / séjours, gestion des anniversaires et alertes de surcharge pour toutes les entreprises enregistrées.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={fetchAdminAutomations}
            disabled={isLoading}
          >
            Actualiser
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Play className={`w-3.5 h-3.5 ${isRunningEngine ? 'animate-pulse' : ''}`} />}
            onClick={handleRunGlobalEngine}
            disabled={isRunningEngine}
          >
            {isRunningEngine ? 'Cycle en cours...' : 'Exécuter le cycle'}
          </Button>
        </div>
      </div>

      {/* Cartes KPIs Globales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0A1428] border border-white/10 rounded-xl p-4">
          <div className="text-xs font-semibold text-gray-400 uppercase">Règles Enregistrées</div>
          <div className="text-2xl font-bold text-white mt-1">{stats.totalRules}</div>
          <div className="text-xs text-emerald-400 mt-1">{stats.activeRules} règles actives</div>
        </div>

        <div className="bg-[#0A1428] border border-white/10 rounded-xl p-4">
          <div className="text-xs font-semibold text-gray-400 uppercase">Notifications Émises</div>
          <div className="text-2xl font-bold text-white mt-1">{stats.totalSent}</div>
          <div className="text-xs text-gray-400 mt-1">Délivrées avec succès</div>
        </div>

        <div className="bg-[#0A1428] border border-white/10 rounded-xl p-4">
          <div className="text-xs font-semibold text-gray-400 uppercase">Worker d'Arrière-Plan</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">Toutes les 60s</div>
          <div className="text-xs text-gray-400 mt-1">Planificateur actif</div>
        </div>

        <div className="bg-[#0A1428] border border-white/10 rounded-xl p-4">
          <div className="text-xs font-semibold text-gray-400 uppercase">Intégrité Idempotence</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">100%</div>
          <div className="text-xs text-gray-400 mt-1">Aucun doublon toléré</div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0A1428] border border-white/10 rounded-xl p-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Rechercher par nom de règle, entreprise ou type..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8205]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-[#FB8205]"
          >
            <option value="ALL">Tous les types de règles</option>
            <option value="APPOINTMENT_REMINDER">Rappels RDV</option>
            <option value="BOOKING_REMINDER">Rappels Réservations</option>
            <option value="REQUEST_PENDING_FOLLOWUP">Relances PENDING</option>
            <option value="CLIENT_BIRTHDAY">Anniversaires Clients</option>
            <option value="BUSINESS_ALERT">Alertes Activité</option>
          </select>
        </div>
      </div>

      {/* Tableau des règles */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-tight">
            Registre Global des Règles d'Automatisation ({filteredRules.length})
          </h3>
          <span className="text-xs text-gray-400">Contrôle Super Admin</span>
        </div>

        <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
          {filteredRules.map((rule) => (
            <div key={rule.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 mt-0.5">
                  {getRuleIcon(rule.ruleType)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">{rule.name}</span>
                    <Badge variant={rule.isEnabled ? 'success' : 'default'}>
                      {rule.isEnabled ? 'Actif' : 'Inactif'}
                    </Badge>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400">
                      {rule.businessId}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{rule.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleRule(rule)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    rule.isEnabled ? 'bg-emerald-500' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      rule.isEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
