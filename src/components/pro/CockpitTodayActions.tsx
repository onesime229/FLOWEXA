import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Calendar, 
  MessageSquare, 
  Inbox, 
  DollarSign, 
  Sparkles 
} from 'lucide-react';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import type { BusinessTodayAction } from '../../types';

interface CockpitTodayActionsProps {
  actions: BusinessTodayAction[];
  onNavigate: (section: 'demandes' | 'messages' | 'calendrier' | 'finances') => void;
  onRefresh?: () => void;
}

export const CockpitTodayActions: React.FC<CockpitTodayActionsProps> = ({
  actions,
  onNavigate,
}) => {
  if (!actions || actions.length === 0) {
    return (
      <div className="bg-[#0A1428] border border-emerald-500/20 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>À faire aujourd'hui</span>
              <Badge variant="success">À jour</Badge>
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">
              Toutes les demandes, rendez-vous et messages prioritaires ont été traités.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Surveillance continue</span>
        </div>
      </div>
    );
  }

  const getActionIcon = (type: BusinessTodayAction['type']) => {
    switch (type) {
      case 'PENDING_REQUEST':
        return <Inbox className="w-4 h-4 text-[#FB8205]" />;
      case 'TODAY_APPOINTMENT':
        return <Calendar className="w-4 h-4 text-[#0BE9EF]" />;
      case 'TODAY_BOOKING':
        return <Clock className="w-4 h-4 text-emerald-400" />;
      case 'PENDING_PAYMENT':
        return <DollarSign className="w-4 h-4 text-amber-400" />;
      case 'UNREAD_MESSAGE':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'PENDING_TASK':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FB8205]/10 border border-[#FB8205]/20 flex items-center justify-center text-[#FB8205]">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>À faire aujourd'hui</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#FB8205]/20 text-[#FB8205] font-extrabold border border-[#FB8205]/30">
                {actions.length} action(s) prioritaire(s)
              </span>
            </h3>
            <p className="text-xs text-gray-400">
              Actions concrètes requérant votre attention pour le bon déroulement de votre activité.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {actions.map((action) => (
          <div
            key={action.id}
            className="p-3.5 rounded-xl bg-[#020919] border border-white/5 hover:border-white/20 transition-all flex flex-col justify-between gap-3 group text-left"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                    {getActionIcon(action.type)}
                  </div>
                  {action.time && (
                    <span className="text-[11px] font-mono text-gray-400 font-semibold">
                      {action.time}
                    </span>
                  )}
                </div>
                <Badge
                  variant={
                    action.priority === 'HIGH'
                      ? 'orange'
                      : action.priority === 'MEDIUM'
                      ? 'cyan'
                      : 'neutral'
                  }
                >
                  {action.priority === 'HIGH' ? 'Urgent' : 'Important'}
                </Badge>
              </div>

              <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#FB8205] transition-colors">
                {action.title}
              </h4>
              <p className="text-[11px] text-gray-400 line-clamp-2">
                {action.subtitle}
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => onNavigate(action.actionTarget)}
              className="w-full text-xs border-white/10 hover:border-[#FB8205]/40 hover:text-white justify-between"
            >
              <span>{action.actionLabel}</span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
