import React from 'react';
import {
  CheckCircle2,
  Clock,
  Calendar,
  UserCheck,
  PlayCircle,
  Award,
  AlertTriangle,
  XCircle,
  Ban,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { FlowexaRequestItem, RequestStatus } from '../../types';
import { Badge } from '../design-system/Badge';

export interface ReservationStepperProps {
  request: FlowexaRequestItem;
  className?: string;
  showDetails?: boolean;
}

const STEPS: { status: RequestStatus; label: string; shortDesc: string }[] = [
  { status: 'PENDING', label: 'Reçue', shortDesc: 'En attente de confirmation' },
  { status: 'CONFIRMED', label: 'Confirmée', shortDesc: 'Disponibilité validée' },
  { status: 'SCHEDULED', label: 'Planifiée', shortDesc: 'Créneau & équipe fixés' },
  { status: 'IN_PROGRESS', label: 'En cours', shortDesc: 'Prestation en réalisation' },
  { status: 'COMPLETED', label: 'Terminée', shortDesc: 'Clôturée avec succès' },
];

export const ReservationStepper: React.FC<ReservationStepperProps> = ({
  request,
  className = '',
  showDetails = true,
}) => {
  const currentStatus = request.status;
  const isTerminalNegative = ['CANCELLED', 'REJECTED', 'NO_SHOW'].includes(currentStatus);

  // Determine active step index (0 to 4)
  const getStepIndex = (status: RequestStatus): number => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'CONFIRMED':
      case 'ACCEPTED':
        return 1;
      case 'SCHEDULED':
        return 2;
      case 'IN_PROGRESS':
        return 3;
      case 'COMPLETED':
        return 4;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(currentStatus);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Price lock highlight & Financial Status */}
      {(request.lockedPrice !== undefined || request.catalogItemPrice !== undefined) && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="font-semibold">Prix contractuel garanti :</span>
            </div>
            <div className="font-mono font-black text-white text-sm">
              {(request.lockedPrice ?? request.catalogItemPrice)?.toLocaleString()}{' '}
              {request.lockedCurrency || request.catalogItemCurrency || 'FCFA'}
            </div>
          </div>

          {/* État du paiement et décomposition acompte / solde */}
          <div className="pt-2 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">Statut financier :</span>
              {request.paymentStatus === 'PAID' ? (
                <Badge variant="success" size="sm">Payé à 100%</Badge>
              ) : request.paymentStatus === 'PARTIALLY_PAID' ? (
                <Badge variant="orange" size="sm">Acompte réglé</Badge>
              ) : request.paymentStatus === 'REFUNDED' ? (
                <Badge variant="primary" size="sm">Remboursé</Badge>
              ) : request.paymentStatus === 'PARTIALLY_REFUNDED' ? (
                <Badge variant="orange" size="sm">Partiellement remboursé</Badge>
              ) : (
                <Badge variant="warning" size="sm">En attente de paiement</Badge>
              )}
            </div>

            {/* Détails montants acompte et solde */}
            <div className="flex items-center gap-3 font-mono text-gray-300">
              {typeof request.paidAmount === 'number' && request.paidAmount > 0 && (
                <span>
                  Versé : <strong className="text-emerald-400">{request.paidAmount.toLocaleString()} FCFA</strong>
                </span>
              )}
              {typeof request.remainingAmount === 'number' && request.remainingAmount > 0 && (
                <span>
                  Solde : <strong className="text-amber-300">{request.remainingAmount.toLocaleString()} FCFA</strong>
                </span>
              )}
              {typeof request.refundAmount === 'number' && request.refundAmount > 0 && (
                <span>
                  Remboursé : <strong className="text-rose-400">-{request.refundAmount.toLocaleString()} FCFA</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Negative Terminal State Banner */}
      {isTerminalNegative && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
          {currentStatus === 'CANCELLED' && <Ban className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />}
          {currentStatus === 'REJECTED' && <XCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />}
          {currentStatus === 'NO_SHOW' && <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />}
          <div className="flex-1 space-y-1">
            <div className="font-bold text-white uppercase tracking-wide">
              {currentStatus === 'CANCELLED' && 'Réservation Annulée'}
              {currentStatus === 'REJECTED' && 'Demande Non Retenue / Refusée'}
              {currentStatus === 'NO_SHOW' && 'Rendez-vous marqué comme Non Honoré (No-Show)'}
            </div>
            {request.cancellationReason && (
              <p className="text-gray-300">
                <span className="font-medium text-gray-400">Motif :</span> « {request.cancellationReason} »
                {request.cancelledBy && (
                  <span className="ml-1 text-[11px] text-gray-400">
                    (Par {request.cancelledBy === 'CLIENT' ? 'le client' : 'l’établissement'})
                  </span>
                )}
              </p>
            )}
            {request.rejectionReason && (
              <p className="text-gray-300">
                <span className="font-medium text-gray-400">Motif du refus :</span> « {request.rejectionReason} »
              </p>
            )}
          </div>
        </div>
      )}

      {/* Visual Stepper Bar */}
      <div className="relative py-2">
        {/* Connection line */}
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-white/10 rounded-full z-0">
          <div
            className="h-full bg-gradient-to-r from-[#FB8205] to-[#10D97F] rounded-full transition-all duration-500"
            style={{
              width: isTerminalNegative
                ? '0%'
                : `${Math.min(100, Math.max(0, (currentIndex / (STEPS.length - 1)) * 100))}%`,
            }}
          />
        </div>

        {/* Step Nodes */}
        <div className="relative z-10 flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const isPassed = !isTerminalNegative && idx <= currentIndex;
            const isCurrent = !isTerminalNegative && idx === currentIndex;

            return (
              <div key={step.status} className="flex flex-col items-center group">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isCurrent
                      ? 'bg-[#FB8205] text-white ring-4 ring-[#FB8205]/30 shadow-lg scale-110'
                      : isPassed
                      ? 'bg-[#10D97F] text-black shadow'
                      : 'bg-[#0A1428] text-gray-400 border border-white/20'
                  }`}
                >
                  {isPassed && idx < currentIndex ? (
                    <CheckCircle2 className="w-4 h-4 text-black" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <div className="text-center mt-2 hidden sm:block">
                  <div
                    className={`text-xs font-semibold ${
                      isCurrent
                        ? 'text-[#FB8205]'
                        : isPassed
                        ? 'text-white'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-[10px] text-gray-500 max-w-[90px] truncate">
                    {step.shortDesc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Meta Information */}
      {showDetails && (
        <div className="bg-[#020919]/60 border border-white/5 rounded-xl p-3.5 space-y-2.5 text-xs text-gray-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Scheduled Date/Time */}
            {(request.scheduledDate || request.requestedDate) && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">
                    {request.scheduledDate ? 'Date planifiée' : 'Date souhaitée'}
                  </div>
                  <div className="text-white font-medium">
                    {request.scheduledDate || request.requestedDate}
                    {(request.scheduledTime || request.requestedTime) && (
                      <span className="ml-1 text-gray-400">
                        à {request.scheduledTime || request.requestedTime}
                        {request.durationMinutes ? ` (${request.durationMinutes} min)` : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Assigned Staff */}
            {request.assignedEmployeeName && (
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#0BE9EF] shrink-0" />
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">
                    Intervenant dédié
                  </div>
                  <div className="text-white font-medium">
                    {request.assignedEmployeeName}
                  </div>
                </div>
              </div>
            )}

            {/* Started At */}
            {request.startedAt && (
              <div className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">
                    Démarrage prestation
                  </div>
                  <div className="text-white font-medium font-mono text-[11px]">
                    {new Date(request.startedAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: 'short',
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Completed At */}
            {request.completedAt && (
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">
                    Clôture prestation
                  </div>
                  <div className="text-white font-medium font-mono text-[11px]">
                    {new Date(request.completedAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: 'short',
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Full Audit History Timeline */}
          {request.statusHistory && request.statusHistory.length > 0 && (
            <div className="pt-2 border-t border-white/5 space-y-1.5">
              <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400">
                <Clock className="w-3 h-3" />
                <span>Journal d'audit du cycle de réservation</span>
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {request.statusHistory.map((hist, i) => (
                  <div
                    key={hist.id || i}
                    className="text-[11px] bg-white/5 p-2 rounded-lg flex items-start justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white">
                          {hist.status}
                        </span>
                        {hist.previousStatus && (
                          <span className="text-gray-400 text-[10px]">
                            (depuis {hist.previousStatus})
                          </span>
                        )}
                        <span className="text-[10px] text-[#FB8205]">
                          par {hist.changedByName}
                        </span>
                      </div>
                      {hist.note && (
                        <div className="text-gray-300 italic text-[10px]">
                          « {hist.note} »
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 shrink-0">
                      {new Date(hist.changedAt).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
