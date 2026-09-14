import { AIRecommendationItem, BusinessModuleCode } from '../../types';
import { DataStore } from '../dataStore';

export class RecommendationService {
  constructor(private store: DataStore) {}

  /**
   * Recommandations personnalisées pour un client
   * Basées strictement sur son historique réel (demandes passées, favoris, catégories consultées).
   * Si le client n'a pas d'historique, propose les offres les mieux notées et les plus populaires réelles.
   */
  public getClientRecommendations(
    clientId: string,
    options?: {
      clientLat?: number;
      clientLng?: number;
      moduleCode?: BusinessModuleCode;
      limit?: number;
    }
  ): {
    recommendations: AIRecommendationItem[];
    reasoning: string;
    hasHistory: boolean;
  } {
    const db = this.store.getDb();
    const catalog = db.catalogItems || [];
    const businesses = db.businesses || [];
    const clientFavorites = clientId ? (db.favorites || []).filter((f) => f.clientId === clientId) : [];
    const clientRequests = clientId ? (db.requests || []).filter((r) => r.clientId === clientId) : [];

    const favOfferIds = new Set(clientFavorites.map((f) => f.catalogItemId || f.businessId).filter(Boolean));
    const pastModules = new Set<string>();
    const pastBusinessIds = new Set<string>();

    for (const req of clientRequests) {
      if (req.moduleCode) pastModules.add(req.moduleCode);
      if (req.businessId) pastBusinessIds.add(req.businessId);
    }

    const hasHistory = clientRequests.length > 0 || clientFavorites.length > 0;
    const recommendations: AIRecommendationItem[] = [];

    for (const item of catalog) {
      if (item.status && item.status !== 'PUBLISHED') continue;
      const biz = businesses.find((b) => b.id === item.businessId);
      if (!biz || biz.status === 'SUSPENDED') continue;

      if (options?.moduleCode && item.moduleCode !== options.moduleCode) {
        continue;
      }

      let score = 50;
      const explanations: string[] = [];

      const isFav = favOfferIds.has(item.id) || favOfferIds.has(biz.id);
      if (isFav) {
        score += 35;
        explanations.push('Enregistré dans vos favoris');
      }

      const hasUsedModule = pastModules.has(item.moduleCode);
      if (hasUsedModule) {
        score += 25;
        explanations.push(`Basé sur vos réservations passées dans la catégorie ${item.moduleCode}`);
      }

      const hasUsedBusiness = pastBusinessIds.has(biz.id);
      if (hasUsedBusiness) {
        score += 20;
        explanations.push(`Établissement chez qui vous avez déjà réservé (${biz.name})`);
      }

      const ratingSummary = this.store.calculateRating(biz.id, item.id);
      const rating = ratingSummary.averageRating;
      const reviews = ratingSummary.reviewCount;
      if (rating >= 4.5 && reviews > 0) {
        score += 15;
        explanations.push(`Note vérifiée de ${rating.toFixed(1)}/5 (${reviews} avis)`);
      }

      if (item.availability === 'AVAILABLE') {
        score += 10;
        explanations.push('Disponible immédiatement');
      }

      if (explanations.length === 0) {
        explanations.push('Offre recommandée selon les avis clients de la plateforme');
      }

      const itemCity = item.city || biz.city || 'Cotonou';
      const itemDistrict = item.district || biz.district || '';

      recommendations.push({
        id: item.id,
        title: item.title,
        businessId: biz.id,
        businessName: biz.name,
        moduleCode: item.moduleCode as BusinessModuleCode,
        category: item.offerType || 'Offre',
        location: itemDistrict ? `${itemDistrict}, ${itemCity}` : itemCity,
        city: itemCity,
        price: item.price,
        priceFormatted: typeof item.price === 'number' ? `${item.price.toLocaleString('fr-FR')} FCFA` : 'Sur devis',
        priceUnit:
          item.priceType === 'PER_NIGHT'
            ? '/ nuit'
            : item.priceType === 'PER_DAY'
            ? '/ jour'
            : item.priceType === 'PER_HOUR'
            ? '/ h'
            : undefined,
        rating: rating > 0 ? rating : null,
        reviewCount: reviews,
        isFavorite: isFav,
        availableToday: item.availability === 'AVAILABLE',
        score,
        explanations,
        imageUrl: item.images?.[0]?.url || biz.images?.[0]?.url,
      });
    }

    recommendations.sort((a, b) => b.score - a.score);
    const limit = options?.limit || 6;
    const finalItems = recommendations.slice(0, limit);

    const reasoning = hasHistory
      ? `Sélection personnalisée selon vos ${clientRequests.length} demande(s) passée(s) et ${clientFavorites.length} favori(s).`
      : 'Sélection des offres les plus appréciées et disponibles sur la plateforme.';

    return {
      recommendations: finalItems,
      reasoning,
      hasHistory,
    };
  }
}
