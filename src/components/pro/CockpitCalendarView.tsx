import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Filter, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare,
  Sparkles,
  Search
} from 'lucide-react';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { flowexaApi } from '../../services/api';
import type { BusinessCalendarEvent } from '../../types';

interface CockpitCalendarViewProps {
  businessId: string;
  businessName: string;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  onNavigateToRequest?: (requestId: string) => void;
  onNavigateToMessages?: () => void;
}

export const CockpitCalendarView: React.FC<CockpitCalendarViewProps> = ({
  businessId,
  businessName,
  onShowToast,
  onNavigateToRequest,
  onNavigateToMessages,
}) => {
  const [events, setEvents] = useState<BusinessCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'all'>('today');
  const [typeFilter, setTypeFilter] = useState<'all' | 'APPOINTMENT' | 'BOOKING'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const res = await flowexaApi.getBusinessCalendar(businessId);
      if (res.success && Array.isArray(res.data)) {
        setEvents(res.data);
      }
    } catch (e) {
      console.error(e);
      onShowToast('Erreur', 'Impossible de charger le calendrier.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [businessId]);

  const filteredEvents = events.filter((ev) => {
    // Type filter
    if (typeFilter !== 'all' && ev.type !== typeFilter) return false;

    // Time filter
    if (timeFilter === 'today') {
      if (ev.date !== todayStr) return false;
    } else if (timeFilter === 'week') {
      const now = new Date();
      const in7Days = new Date();
      in7Days.setDate(now.getDate() + 7);
      const evDate = new Date(ev.date);
      if (evDate < now || evDate > in7Days) return false;
    }

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = ev.clientName?.toLowerCase().includes(term);
      const matchPhone = ev.clientPhone?.includes(term);
      const matchTitle = ev.title?.toLowerCase().includes(term);
      if (!matchName && !matchPhone && !matchTitle) return false;
    }

    return true;
  });

  const todayCount = events.filter((e) => e.date === todayStr).length;
  const appointmentCount = events.filter((e) => e.type === 'APPOINTMENT').length;
  const bookingCount = events.filter((e) => e.type === 'BOOKING').length;

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="orange" dot>
              Agenda Opérationnel
            </Badge>
            <span className="text-xs text-gray-400">Établissement : {businessName}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Calendrier des Rendez-vous & Réservations</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Visualisez et pilotez tous vos créneaux clients en temps réel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchCalendar}
            className="text-xs border-white/10"
          >
            Actualiser
          </Button>
          {onNavigateToMessages && (
            <Button
              size="sm"
              variant="primary"
              onClick={onNavigateToMessages}
              leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Messagerie Client
            </Button>
          )}
        </div>
      </div>

      {/* Quick Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0A1428] border border-white/5 rounded-xl p-4">
          <p className="text-xs text-gray-400">Aujourd'hui</p>
          <p className="text-xl font-bold text-white mt-1">{todayCount} créneau(x)</p>
          <span className="text-[10px] text-emerald-400 font-medium">À honorer ce jour</span>
        </div>

        <div className="bg-[#0A1428] border border-white/5 rounded-xl p-4">
          <p className="text-xs text-gray-400">Rendez-vous programmés</p>
          <p className="text-xl font-bold text-[#FB8205] mt-1">{appointmentCount}</p>
          <span className="text-[10px] text-gray-500">Prestations & consultations</span>
        </div>

        <div className="bg-[#0A1428] border border-white/5 rounded-xl p-4">
          <p className="text-xs text-gray-400">Réservations confirmées</p>
          <p className="text-xl font-bold text-[#0BE9EF] mt-1">{bookingCount}</p>
          <span className="text-[10px] text-gray-500">Chambres & Séjours</span>
        </div>

        <div className="bg-[#0A1428] border border-white/5 rounded-xl p-4">
          <p className="text-xs text-gray-400">Total au planning</p>
          <p className="text-xl font-bold text-white mt-1">{events.length}</p>
          <span className="text-[10px] text-gray-500">Toutes dates confondues</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Time Tabs */}
        <div className="flex items-center gap-1.5 bg-[#020919] p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setTimeFilter('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeFilter === 'today'
                ? 'bg-[#FB8205] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Aujourd'hui ({todayCount})
          </button>
          <button
            onClick={() => setTimeFilter('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeFilter === 'week'
                ? 'bg-[#FB8205] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            7 prochains jours
          </button>
          <button
            onClick={() => setTimeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeFilter === 'all'
                ? 'bg-[#FB8205] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Tous ({events.length})
          </button>
        </div>

        {/* Type & Search */}
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            aria-label="Filtrer par type de créneau"
            className="bg-[#020919] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FB8205]"
          >
            <option value="all">Tous les types</option>
            <option value="APPOINTMENT">Rendez-vous uniquement</option>
            <option value="BOOKING">Réservations uniquement</option>
          </select>

          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher client ou prestation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#020919] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8205]"
            />
          </div>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-12 text-center text-gray-400 text-sm">
          <Clock className="w-6 h-6 text-[#FB8205] animate-spin mx-auto mb-2" />
          Chargement de votre planning...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-12 text-center text-gray-400">
          <Calendar className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="font-semibold text-white">Aucun créneau trouvé pour ce filtre</p>
          <p className="text-xs text-gray-500 mt-1">
            {timeFilter === 'today'
              ? "Aucun rendez-vous ni réservation planifié pour aujourd'hui."
              : "Aucune donnée de calendrier correspondant à vos critères."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map((ev) => {
            const isToday = ev.date === todayStr;
            return (
              <div
                key={ev.id}
                className={`p-5 rounded-2xl border transition-all text-left flex flex-col justify-between gap-4 ${
                  isToday
                    ? 'bg-[#0A1428] border-[#FB8205]/40 shadow-lg shadow-[#FB8205]/5'
                    : 'bg-[#0A1428] border-white/5 hover:border-white/15'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#FB8205]" />
                        <span>{ev.time || '09:00'}</span>
                      </span>

                      <Badge variant={ev.type === 'APPOINTMENT' ? 'orange' : 'cyan'}>
                        {ev.type === 'APPOINTMENT' ? 'Rendez-vous' : 'Réservation'}
                      </Badge>

                      {isToday && <Badge variant="success">Aujourd'hui</Badge>}
                    </div>

                    <span className="text-xs font-mono text-gray-400">{ev.date}</span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {ev.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1 text-white font-medium">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {ev.clientName}
                      </span>
                      <span className="font-mono text-gray-400 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        {ev.clientPhone}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#020919] rounded-xl border border-white/5 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-gray-500 text-[11px]">Tarif prévu</span>
                      <p className="font-bold text-white">
                        {typeof ev.price === 'number' ? `${ev.price.toLocaleString()} ${ev.currency || 'FCFA'}` : 'Sur devis'}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-500 text-[11px]">Règlement</span>
                      <p className="font-semibold text-emerald-400">
                        {ev.paymentStatus === 'PAID'
                          ? 'Payé'
                          : ev.paymentStatus === 'PARTIALLY_PAID'
                          ? 'Acompte versé'
                          : 'Au rendez-vous'}
                      </p>
                    </div>

                    {ev.assignedEmployeeName && (
                      <div>
                        <span className="text-gray-500 text-[11px]">Collaborateur</span>
                        <p className="font-medium text-gray-300">{ev.assignedEmployeeName}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  <a
                    href={`tel:${ev.clientPhone}`}
                    className="flex-1 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Appeler</span>
                  </a>

                  <a
                    href={`https://wa.me/229${ev.clientPhone}?text=${encodeURIComponent(
                      `Bonjour ${ev.clientName}, nous vous confirmons votre créneau pour ${ev.title} prévu le ${ev.date} à ${ev.time}.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 px-3 py-2 rounded-xl bg-[#FB8205]/10 hover:bg-[#FB8205]/20 text-[#FB8205] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  {onNavigateToRequest && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigateToRequest(ev.requestId)}
                      className="text-xs border-white/10"
                    >
                      Détails
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
