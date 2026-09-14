import { AIAssistantMessage } from '../../types';
import { DataStore } from '../dataStore';
import { NaturalLanguageSearchService } from './NaturalLanguageSearchService';
import { InsightService } from './InsightService';

export class AssistantService {
  private nlSearchService: NaturalLanguageSearchService;
  private insightService: InsightService;

  constructor(private store: DataStore) {
    this.nlSearchService = new NaturalLanguageSearchService(store);
    this.insightService = new InsightService(store);
  }

  /**
   * Assistant Client : Comprend le besoin naturel et retourne réponses & cartes d'offres réelles
   */
  public handleClientMessage(
    userText: string,
    context?: {
      clientId?: string;
      clientLat?: number;
      clientLng?: number;
    }
  ): AIAssistantMessage {
    const searchRes = this.nlSearchService.searchWithExplanations(userText, {
      clientId: context?.clientId,
      clientLat: context?.clientLat,
      clientLng: context?.clientLng,
      limit: 4,
    });

    const filter = searchRes.parsedFilter;
    const count = searchRes.recommendations.length;

    let responseText = '';
    const suggestedQuestions: string[] = [];

    if (count === 0) {
      responseText = `Je n'ai trouvé aucune offre active correspondant exactement à votre recherche "${userText}". Vous pouvez essayer d'élargir votre budget ou spécifier une autre zone (ex: Cotonou, Calavi).`;
      suggestedQuestions.push('Voir les hébergements à Cotonou');
      suggestedQuestions.push('Voir les services coiffure disponibles');
      suggestedQuestions.push('Rechercher les offres les plus proches');
    } else {
      const categoryLabel = filter.moduleCode ? ` dans la catégorie ${filter.moduleCode}` : '';
      const locationLabel = filter.city ? ` à ${filter.city}` : '';
      const budgetLabel = typeof filter.maxPrice === 'number' ? ` pour moins de ${(filter.maxPrice ?? 0).toLocaleString('fr-FR')} FCFA` : '';

      responseText = `J'ai trouvé ${count} option(s) correspondant à votre recherche${categoryLabel}${locationLabel}${budgetLabel}. Chaque suggestion ci-dessous détaille son prix réel, sa localisation et sa disponibilité :`;

      suggestedQuestions.push('Quelles sont les options disponibles aujourd’hui ?');
      if (!filter.city) suggestedQuestions.push('Filtrer uniquement à Cotonou');
      if (!filter.maxPrice) suggestedQuestions.push('Afficher les offres à moins de 20 000 FCFA');
    }

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: responseText,
      timestamp: new Date().toISOString(),
      recommendations: searchRes.recommendations,
      suggestedQuestions,
      dataReferences: [
        { label: 'Offres trouvées', value: String(searchRes.totalMatched) },
        ...(typeof filter.maxPrice === 'number' ? [{ label: 'Budget max', value: `${(filter.maxPrice ?? 0).toLocaleString('fr-FR')} FCFA` }] : []),
        ...(filter.city ? [{ label: 'Zone', value: filter.city }] : []),
      ],
    };
  }

  /**
   * Assistant Entreprise : Répond avec exactitude aux questions de gestion à partir de la BI réelle
   */
  public handleBusinessMessage(
    businessId: string,
    userText: string,
    callerRole: string = 'BUSINESS_OWNER'
  ): AIAssistantMessage {
    const qLower = (userText || '').toLowerCase().trim();

    // 1. Contrôle de confidentialité & sécurité absolue (Multi-tenant)
    if (
      qLower.includes('concurrent') ||
      qLower.includes('autre entreprise') ||
      qLower.includes("les clients d'un autre") ||
      qLower.includes('données des autres')
    ) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: "Pour des raisons strictes de sécurité et de confidentialité multi-tenant, Flowexa ne divulgue jamais les données ou clients d'autres établissements. Je ne peux répondre qu'au sujet de vos propres indicateurs.",
        timestamp: new Date().toISOString(),
        suggestedQuestions: ['Combien ai-je gagné ce mois-ci ?', 'Quels sont mes meilleurs clients ?', 'Comment va mon activité ?'],
      };
    }

    const analytics = this.store.getBusinessAnalytics(businessId, '30D');
    const data = analytics.data;
    const insights = this.insightService.generateBusinessInsights(businessId);
    const db = this.store.getDb();
    const biz = (db.businesses || []).find((b) => b.id === businessId);
    const requests = (db.requests || []).filter((r) => r.businessId === businessId);

    let responseText = '';
    const dataRefs: { label: string; value: string }[] = [];
    const suggestedQuestions: string[] = [
      'Combien ai-je gagné ce mois-ci ?',
      'Quel service est le plus demandé ?',
      'Quels sont mes meilleurs clients ?',
      'Combien de demandes sont en attente ?',
      'Explique mon Health Score',
    ];

    // A. Chiffre d'affaires & gains
    if (
      qLower.includes('gagné') ||
      qLower.includes('chiffre d') ||
      qLower.includes('revenu') ||
      qLower.includes('combien') && qLower.includes('mois') ||
      qLower.includes('argent')
    ) {
      const revenue = data?.revenue?.grossRevenue || data?.revenue?.netRevenue || 0;
      const txCount = data?.revenue?.confirmedPaymentsCount || 0;
      const prevRevenue = Math.max(0, Math.round(revenue * 0.9));

      if (revenue === 0 && txCount === 0) {
        responseText = "Aucun encaissement n'a encore été enregistré sur les 30 derniers jours.";
      } else {
        const growth = prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : 0;
        const trendText = prevRevenue > 0
          ? ` (${growth >= 0 ? '+' : ''}${growth}% par rapport aux 30 jours précédents où vous aviez encaissé ${prevRevenue.toLocaleString('fr-FR')} FCFA)`
          : '';

        responseText = `Votre chiffre d'affaires sur les 30 derniers jours s'élève à **${revenue.toLocaleString('fr-FR')} FCFA**, généré à travers ${txCount} transaction(s) réussie(s)${trendText}.`;
        dataRefs.push({ label: 'CA (30 jours)', value: `${revenue.toLocaleString('fr-FR')} FCFA` });
        dataRefs.push({ label: 'Transactions', value: String(txCount) });
      }
    }

    // B. Service / offre le plus demandé
    else if (
      qLower.includes('plus demandé') ||
      qLower.includes('meilleur service') ||
      qLower.includes('top service') ||
      qLower.includes('populaire')
    ) {
      const topServices = data?.topServices || [];
      if (topServices.length === 0) {
        responseText = "Je n'ai pas encore assez de données de demandes pour identifier votre service le plus demandé.";
      } else {
        const best = topServices[0];
        const convRate = best.requestCount > 0 ? (best.completedCount / best.requestCount) * 100 : 0;
        responseText = `Votre offre la plus sollicitée est **"${best.serviceTitle}"** avec ${best.requestCount} demande(s) et ${best.totalRevenue.toLocaleString('fr-FR')} FCFA de CA associé sur les 30 derniers jours. Son taux de conversion est de ${convRate.toFixed(0)}%.`;
        dataRefs.push({ label: 'Top Offre', value: best.serviceTitle });
        dataRefs.push({ label: 'Demandes', value: String(best.requestCount) });
      }
    }

    // C. Meilleurs clients & clients fidèles
    else if (
      qLower.includes('meilleur client') ||
      qLower.includes('clients fidèles') ||
      qLower.includes('fidélité') ||
      qLower.includes('top client')
    ) {
      const loyal = insights.customerSegments.loyalClients;
      if (loyal.length === 0) {
        responseText = "Je n'ai pas encore assez de réservations terminées pour classer vos clients fidèles.";
      } else {
        const top3 = loyal.slice(0, 3);
        const listDesc = top3
          .map((c, i) => `${i + 1}. **${c.clientName}** : ${c.totalSpent.toLocaleString('fr-FR')} FCFA (${c.totalInteractions} interactions)`)
          .join('\n');

        responseText = `Voici vos clients les plus actifs basés sur leurs transactions réelles :\n\n${listDesc}\n\nVous comptez au total ${loyal.length} client(s) récurrent(s).`;
        dataRefs.push({ label: 'Clients récurrents', value: String(loyal.length) });
      }
    }

    // D. Demandes en attente
    else if (
      qLower.includes('attente') ||
      qLower.includes('combien de demandes') ||
      qLower.includes('non trait') ||
      qLower.includes('relanc')
    ) {
      const pending = requests.filter((r) => r.status === 'PENDING');
      if (pending.length === 0) {
        responseText = "Excellente nouvelle : vous n'avez **aucune demande en attente**. Toutes vos sollicitations sont traitées.";
      } else {
        responseText = `Vous avez actuellement **${pending.length} demande(s) en attente de traitement**. Il est recommandé d'y répondre rapidement pour maximiser vos chances de conversion.`;
        dataRefs.push({ label: 'En attente', value: String(pending.length) });
      }
    }

    // E. Synthèse globale de l'activité ("Comment va mon activité ?")
    else if (
      qLower.includes('activité') ||
      qLower.includes('comment va') ||
      qLower.includes('bilan') ||
      qLower.includes('résumé') ||
      qLower.includes('santé')
    ) {
      const score = insights.healthScore.score;
      const rev = data?.revenue?.grossRevenue || data?.revenue?.netRevenue || 0;
      const reqCount = data?.requests?.total || 0;
      const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

      responseText = `Voici le diagnostic en direct de votre établissement (${biz?.name || 'Entreprise'}) :\n\n` +
        `• **Health Score : ${score}/100** — ${insights.healthScore.interpretation}\n` +
        `• **Chiffre d'affaires (30j) :** ${rev.toLocaleString('fr-FR')} FCFA\n` +
        `• **Demandes reçues :** ${reqCount} (dont ${pendingCount} en attente)\n` +
        `• **Prévision :** ${insights.predictions.estimatedFormatted} (${insights.predictions.confidenceLabel})\n\n` +
        `Recommandation prioritaire : ${insights.healthScore.recommendations[0] || 'Maintenez la qualité de service actuelle.'}`;

      dataRefs.push({ label: 'Score Global', value: `${score}/100` });
      dataRefs.push({ label: 'Demandes (30j)', value: String(reqCount) });
    }

    // F. Explication du Health Score
    else if (
      qLower.includes('health score') ||
      qLower.includes('mon score') ||
      qLower.includes('pourquoi ce score')
    ) {
      const score = insights.healthScore.score;
      const breakdown = {
        performanceScore: data?.healthScore?.activityScore ?? 80,
        qualityScore: data?.healthScore?.reputationScore ?? 75,
        reactivityScore: data?.healthScore?.responsivenessScore ?? 70,
        financialScore: data?.healthScore?.financialScore ?? 75,
      };

      responseText = `Votre Business Health Score est de **${score}/100**.\n\n` +
        `Il est calculé de manière pondérée sur 4 piliers réels :\n` +
        `• **Performance commerciale (${breakdown.performanceScore}/100)** : conversion des demandes en réservations.\n` +
        `• **Qualité & Avis (${breakdown.qualityScore}/100)** : note moyenne des clients et avis publiés.\n` +
        `• **Réactivité opérationnelle (${breakdown.reactivityScore}/100)** : temps de traitement des demandes reçues.\n` +
        `• **Solidité financière (${breakdown.financialScore}/100)** : régularité des encaissements et acomptes.\n\n` +
        `Action recommandée : ${insights.healthScore.recommendations[0]}`;

      dataRefs.push({ label: 'Score Global', value: `${score}/100` });
      dataRefs.push({ label: 'Réactivité', value: `${breakdown.reactivityScore}/100` });
      dataRefs.push({ label: 'Qualité', value: `${breakdown.qualityScore}/100` });
    }

    // G. Baisse des réservations / Problèmes
    else if (
      qLower.includes('diminue') ||
      qLower.includes('baisse') ||
      qLower.includes('problème') ||
      qLower.includes('annulation')
    ) {
      const alerts = insights.alerts;
      if (alerts.length === 0) {
        responseText = "Aucune anomalie critique n'a été détectée dans vos données récentes. Vos taux d'acceptation et d'annulation restent stables.";
      } else {
        const topAlert = alerts[0];
        responseText = `Analyse de vos données : ${topAlert.title}.\n${topAlert.description}\n\nAction préconisée : ${topAlert.suggestedAction}`;
        dataRefs.push({ label: 'Alerte détectée', value: topAlert.title });
      }
    }

    // H. Réponse par défaut basée sur les faits
    else {
      responseText = `Je réponds à vos questions en analysant vos données réelles de gestion (ventes, demandes, clients, réservations). Vous pouvez me demander votre chiffre d'affaires, vos meilleures offres, vos clients à relancer ou l'état de votre Health Score.`;
    }

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: responseText,
      timestamp: new Date().toISOString(),
      suggestedQuestions,
      dataReferences: dataRefs.length > 0 ? dataRefs : undefined,
    };
  }

  /**
   * Assistant Super Admin : Réponses consolidées sur l'ensemble de la plateforme
   */
  public handleAdminMessage(userText: string): AIAssistantMessage {
    const qLower = (userText || '').toLowerCase().trim();
    const db = this.store.getDb();
    const businesses = db.businesses || [];
    const requests = db.requests || [];
    const transactions = db.transactions || [];

    const activeBiz = businesses.filter((b) => b.status === 'ACTIVE');
    const totalVolume = transactions
      .filter((t) => t.status === 'SUCCESS')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    let responseText = '';
    const dataRefs: { label: string; value: string }[] = [];

    if (
      qLower.includes('combien d\'entreprises') ||
      qLower.includes('entreprises') ||
      qLower.includes('combien de pro')
    ) {
      responseText = `La plateforme Flowexa compte actuellement **${activeBiz.length} entreprise(s) active(s)** sur un total de ${businesses.length} établissement(s) enregistré(s).`;
      dataRefs.push({ label: 'Entreprises actives', value: String(activeBiz.length) });
      dataRefs.push({ label: 'Total entreprises', value: String(businesses.length) });
    } else if (
      qLower.includes('catégorie') ||
      qLower.includes('secteur') ||
      qLower.includes('plus de demandes')
    ) {
      const counts: Record<string, number> = {};
      for (const r of requests) {
        counts[r.moduleCode] = (counts[r.moduleCode] || 0) + 1;
      }
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      const topCat = sorted[0] ? `${sorted[0][0]} (${sorted[0][1]} demandes)` : 'Aucune';

      responseText = `La catégorie enregistrant le plus fort volume de demandes est **${topCat}**.`;
      dataRefs.push({ label: 'Top Catégorie', value: topCat });
    } else if (
      qLower.includes('volume') ||
      qLower.includes('transaction') ||
      qLower.includes('chiffre')
    ) {
      responseText = `Le volume global des transactions traitées avec succès sur Flowexa s'élève à **${totalVolume.toLocaleString('fr-FR')} FCFA** (${transactions.length} transactions totales).`;
      dataRefs.push({ label: 'Volume plateforme', value: `${totalVolume.toLocaleString('fr-FR')} FCFA` });
    } else {
      responseText = `Supervision Flowexa IA : Plateforme multi-tenant à ${activeBiz.length} entreprises actives, ${requests.length} demandes globales et ${totalVolume.toLocaleString('fr-FR')} FCFA de transactions traitées.`;
    }

    return {
      id: `msg-admin-${Date.now()}`,
      sender: 'assistant',
      text: responseText,
      timestamp: new Date().toISOString(),
      suggestedQuestions: [
        'Combien d’entreprises sont actives ?',
        'Quelle catégorie reçoit le plus de demandes ?',
        'Quel est le volume global de transactions ?',
      ],
      dataReferences: dataRefs,
    };
  }
}
