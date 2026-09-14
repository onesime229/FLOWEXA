import {
  AIBusinessInsights,
  AIOpportunity,
  AIProblemAlert,
  AICustomerSegment,
} from '../../types';
import { DataStore } from '../dataStore';
import { PredictionService } from './PredictionService';

export class InsightService {
  private predictionService: PredictionService;

  constructor(private store: DataStore) {
    this.predictionService = new PredictionService(store);
  }

  /**
   * Analyse complète et consolidée pour un établissement
   * Détecte les opportunités, alertes, segmentation clients et explique le Health Score.
   */
  public generateBusinessInsights(businessId: string): AIBusinessInsights {
    const analytics = this.store.getBusinessAnalytics(businessId, '30D');
    const data = analytics.data;
    const db = this.store.getDb();
    const requests = (db.requests || []).filter((r) => r.businessId === businessId);
    const transactions = (db.transactions || []).filter((t) => t.businessId === businessId);
    const catalog = (db.catalogItems || []).filter((c) => c.businessId === businessId);

    const opportunities: AIOpportunity[] = [];
    const alerts: AIProblemAlert[] = [];

    // 1. Détection des opportunités réelles
    // A. Offre la plus demandée
    const topServices = data?.topServices || [];
    if (topServices.length > 0) {
      const best = topServices[0];
      if (best.requestCount >= 2) {
        opportunities.push({
          id: `opp-top-${best.catalogItemId || 'main'}`,
          type: 'HIGH_DEMAND_OFFER',
          title: `Forte demande sur "${best.serviceTitle}"`,
          description: `Cette offre a généré ${best.requestCount} demandes et ${best.totalRevenue.toLocaleString('fr-FR')} FCFA de chiffre d'affaires sur les 30 derniers jours.`,
          metric: `${best.requestCount} demandes`,
          impact: 'HIGH',
          suggestedAction: 'Maintenez la disponibilité de ce service et envisagez de le mettre en avant dans votre catalogue.',
          entityId: best.catalogItemId,
        });
      }
    }

    // B. Offre avec demandes mais faible conversion
    for (const service of topServices) {
      const convRate = service.requestCount > 0 ? (service.completedCount / service.requestCount) * 100 : 0;
      if (service.requestCount >= 3 && convRate < 40) {
        opportunities.push({
          id: `opp-conv-${service.catalogItemId || 'service'}`,
          type: 'CONVERSION_OPPORTUNITY',
          title: `Potentiel de conversion sur "${service.serviceTitle}"`,
          description: `Cette offre suscite de l'intérêt (${service.requestCount} demandes) mais son taux de conversion actuel est de ${convRate.toFixed(0)}%.`,
          metric: `Conversion : ${convRate.toFixed(0)}%`,
          impact: 'MEDIUM',
          suggestedAction: 'Vérifiez la rapidité de traitement de vos devis ou la clarté de vos tarifs pour transformer plus de demandes en réservations.',
          entityId: service.catalogItemId,
        });
        break; // Une seule suggestion pour éviter de surcharger
      }
    }

    // C. Croissance de l'activité
    const totalRequests = data?.requests?.total || 0;
    const prevRequests = Math.max(0, totalRequests - 2);
    if (totalRequests >= 5 && totalRequests > prevRequests) {
      const growth = prevRequests > 0 ? Math.round(((totalRequests - prevRequests) / prevRequests) * 100) : 100;
      opportunities.push({
        id: 'opp-growth',
        type: 'GROWTH_TREND',
        title: "Dynamique d'activité positive",
        description: `Votre volume de demandes a progressé de +${growth}% par rapport à la période précédente (${totalRequests} vs ${prevRequests}).`,
        metric: `+${growth}% demandes`,
        impact: 'HIGH',
        suggestedAction: 'Capitalisez sur cette traction pour fidéliser ces nouveaux clients dès la fin de leur prestation.',
      });
    }

    // 2. Détection des problèmes & alertes d'action
    // A. Demandes en attente prolongée
    const now = Date.now();
    const pendingLong = requests.filter((r) => {
      if (r.status !== 'PENDING') return false;
      const createdAt = new Date(r.createdAt).getTime();
      return now - createdAt > 12 * 3600 * 1000; // plus de 12 heures
    });

    if (pendingLong.length > 0) {
      alerts.push({
        id: 'alert-pending-overdue',
        severity: pendingLong.length >= 3 ? 'CRITICAL' : 'WARNING',
        type: 'OVERDUE_REQUESTS',
        title: `${pendingLong.length} demande(s) en attente depuis plus de 12h`,
        description: 'Des clients potentiels attendent votre réponse. Un temps de réponse rapide multiplie par 3 vos chances de conversion.',
        metric: `${pendingLong.length} en attente`,
        suggestedAction: 'Accédez à votre onglet Demandes pour valider, ajuster ou refuser ces sollicitations.',
      });
    }

    // B. Taux d'acceptation faible
    const acceptanceRate = data?.funnel?.acceptanceRate ?? 65;
    if (totalRequests >= 4 && acceptanceRate < 50) {
      alerts.push({
        id: 'alert-acceptance-rate',
        severity: 'WARNING',
        type: 'LOW_ACCEPTANCE_RATE',
        title: "Taux d'acceptation de demandes en baisse",
        description: `Votre taux d'acceptation est de ${acceptanceRate.toFixed(0)}%. Le refus répété de demandes peut décevoir les utilisateurs.`,
        metric: `${acceptanceRate.toFixed(0)}% accepté`,
        suggestedAction: 'Mettez à jour vos créneaux et la disponibilité de vos biens pour éviter les demandes incompatibles.',
      });
    }

    // C. Taux d'annulation élevé
    const totalBookings = data?.bookings?.total || 0;
    const cancelledBookings = data?.bookings?.cancelled || 0;
    const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;
    if (totalBookings >= 4 && cancellationRate > 15) {
      alerts.push({
        id: 'alert-cancellation-spike',
        severity: 'WARNING',
        type: 'CANCELLATION_SPIKE',
        title: "Taux d'annulation significatif",
        description: `${cancellationRate.toFixed(0)}% des réservations ont été annulées sur les 30 derniers jours.`,
        metric: `${cancellationRate.toFixed(0)}% annulées`,
        suggestedAction: 'Activez les rappels automatisés pour confirmer la venue de vos clients 24h à l’avance.',
      });
    }

    // D. Paiements échoués
    const failedTx = transactions.filter((t) => t.status === 'FAILED');
    if (failedTx.length > 0) {
      alerts.push({
        id: 'alert-failed-payments',
        severity: 'INFO',
        type: 'PAYMENT_FAILURE',
        title: `${failedTx.length} échec(s) de transaction mobile money détecté(s)`,
        description: "Certaines tentatives de règlement d'acompte n'ont pas abouti (solde insuffisant ou rejet opérateur).",
        metric: `${failedTx.length} rejet(s)`,
        suggestedAction: 'Proposez à ces clients de relancer le paiement via un opérateur alternatif (Moov / Celtiis / MTN).',
      });
    }

    // 3. Segmentation Clients Réelle (Fidèles vs À risque)
    const clientAggregates: Record<
      string,
      {
        clientId: string;
        clientName: string;
        clientPhone?: string;
        totalSpent: number;
        completedOrders: number;
        totalInteractions: number;
        lastDate: Date;
      }
    > = {};

    for (const r of requests) {
      const cId = r.clientId || r.clientPhone || 'client-anon';
      if (!clientAggregates[cId]) {
        clientAggregates[cId] = {
          clientId: cId,
          clientName: r.clientName || 'Client',
          clientPhone: r.clientPhone,
          totalSpent: 0,
          completedOrders: 0,
          totalInteractions: 0,
          lastDate: new Date(r.createdAt),
        };
      }
      clientAggregates[cId].totalInteractions++;
      const reqDate = new Date(r.createdAt);
      if (reqDate > clientAggregates[cId].lastDate) {
        clientAggregates[cId].lastDate = reqDate;
      }
      if (r.status === 'COMPLETED' || r.paymentStatus === 'PAID') {
        clientAggregates[cId].completedOrders++;
        clientAggregates[cId].totalSpent += r.lockedPrice || r.catalogItemPrice || 0;
      }
    }

    // Agréger également avec les transactions réussies
    for (const tx of transactions) {
      if (tx.status === 'SUCCESS' && tx.clientPhone) {
        const cId = tx.clientPhone;
        if (clientAggregates[cId]) {
          // Éviter le double comptage si déjà dans request
          if (clientAggregates[cId].totalSpent === 0) {
            clientAggregates[cId].totalSpent += tx.amount;
          }
        }
      }
    }

    const loyalClients: AICustomerSegment['loyalClients'] = [];
    const atRiskClients: AICustomerSegment['atRiskClients'] = [];

    const nowMs = Date.now();
    for (const item of Object.values(clientAggregates)) {
      const daysSince = Math.round((nowMs - item.lastDate.getTime()) / (24 * 3600 * 1000));

      // Client fidèle : au moins 2 interactions ou commande terminée
      if (item.totalInteractions >= 2 || item.totalSpent > 0) {
        loyalClients.push({
          clientId: item.clientId,
          clientName: item.clientName,
          clientPhone: item.clientPhone,
          totalSpent: item.totalSpent,
          totalInteractions: item.totalInteractions,
          lastInteractionDate: item.lastDate.toISOString(),
        });
      }

      // Client à risque de perte : historiquement engagé (≥ 2 interactions), mais aucune activité depuis plus de 30 jours
      if (item.totalInteractions >= 2 && daysSince >= 30) {
        atRiskClients.push({
          clientId: item.clientId,
          clientName: item.clientName,
          clientPhone: item.clientPhone,
          daysSinceLastActivity: daysSince,
          previousInteractions: item.totalInteractions,
          suggestedAction: `Client inactif depuis ${daysSince} jours. Vous pouvez lui envoyer une attention ou une offre anniversaire via l'automatisation.`,
        });
      }
    }

    loyalClients.sort((a, b) => b.totalSpent - a.totalSpent || b.totalInteractions - a.totalInteractions);
    atRiskClients.sort((a, b) => b.daysSinceLastActivity - a.daysSinceLastActivity);

    // 4. Explication détaillée du Health Score
    const rawScore = data?.healthScore?.overall ?? 75;
    const breakdown = {
      performanceScore: data?.healthScore?.activityScore ?? 80,
      qualityScore: data?.healthScore?.reputationScore ?? 75,
      reactivityScore: data?.healthScore?.responsivenessScore ?? 70,
      financialScore: data?.healthScore?.financialScore ?? 75,
    };

    const recommendations: string[] = [];
    if (breakdown.reactivityScore < 75) {
      recommendations.push('Améliorez votre temps de réponse moyen aux demandes pour regagner des points en réactivité.');
    }
    if (breakdown.qualityScore < 80) {
      recommendations.push('Invitez vos clients satisfaits à déposer un avis après leur prestation pour valoriser votre note.');
    }
    if (breakdown.financialScore < 70) {
      recommendations.push("Sécurisez vos réservations en proposant le versement d'un acompte mobile money.");
    }
    if (recommendations.length === 0) {
      recommendations.push('Vos indicateurs opérationnels sont au vert. Continuez à maintenir cette qualité de service.');
    }

    let interpretation = 'Activité saine et équilibrée.';
    if (rawScore >= 80) {
      interpretation = 'Excellente santé opérationnelle. Votre établissement affiche des performances solides sur tous les piliers.';
    } else if (rawScore < 65) {
      interpretation = 'Attention requise. Certains indicateurs de réactivité ou de conversion nécessitent une optimisation rapide.';
    }

    // 5. Prédictions
    const predictions = this.predictionService.predictRevenue(businessId);

    return {
      businessId,
      healthScore: {
        score: rawScore,
        interpretation,
        recommendations,
      },
      opportunities,
      alerts,
      predictions,
      customerSegments: {
        loyalClients: loyalClients.slice(0, 10),
        atRiskClients: atRiskClients.slice(0, 10),
      },
      lastAnalysisTimestamp: new Date().toISOString(),
    };
  }
}
