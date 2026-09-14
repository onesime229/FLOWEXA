import { DataStore } from '../dataStore';
import {
  BusinessModuleCode,
  MarketplaceMatchResult,
  MarketplaceRequestEntity,
} from '../../types';

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export class MarketplaceMatchingService {
  private store: DataStore;

  constructor(store: DataStore) {
    this.store = store;
  }

  /**
   * Effectue un matching multicritère rigoureux et explicable
   * Ne génère aucun prix fictif ni entreprise imaginaire.
   */
  public findMatches(request: MarketplaceRequestEntity): MarketplaceMatchResult[] {
    const db = this.store.getDb();
    const businesses = db.businesses || [];
    const catalog = db.catalogItems || [];

    const reqText = `${request.title} ${request.description} ${request.category}`.toLowerCase();
    const reqLocation = (request.location || '').toLowerCase();
    const radius = request.radiusKm || 15;

    const results: MarketplaceMatchResult[] = [];

    for (const biz of businesses) {
      if (biz.status !== 'ACTIVE') continue;

      let score = 0;
      const reasons: string[] = [];

      // 1. MATCHING MÉTIER / CATÉGORIE
      const bizModule = biz.module_code as BusinessModuleCode;
      let moduleMatch = false;

      if (request.moduleCode && request.moduleCode === bizModule) {
        moduleMatch = true;
        score += 35;
        reasons.push(`Spécialisé dans le domaine demandé (${bizModule})`);
      } else if (
        request.category &&
        (bizModule.toLowerCase().includes(request.category.toLowerCase()) ||
          request.category.toLowerCase().includes(bizModule.toLowerCase()) ||
          biz.name.toLowerCase().includes(request.category.toLowerCase()))
      ) {
        moduleMatch = true;
        score += 25;
        reasons.push(`Correspondance avec la catégorie "${request.category}"`);
      } else {
        // Recherche par mots-clés
        const kwMatches = [
          'appartement', 'chambre', 'villa', 'immo', 'logement',
          'guest', 'nuitée', 'hotel', 'auberge',
          'coiffure', 'cheveux', 'tresse', 'barbier', 'barbe',
          'massage', 'spa', 'gommage', 'détente',
          'photo', 'studio', 'shooting',
          'broderie', 'couture', 'couturier', 'boubou',
          'garage', 'vidange', 'frein', 'mécanique', 'pneu'
        ];
        for (const kw of kwMatches) {
          if (reqText.includes(kw) && (biz.name.toLowerCase().includes(kw) || bizModule.toLowerCase().includes(kw))) {
            moduleMatch = true;
            score += 20;
            reasons.push(`Activité liée à vos besoins ("${kw}")`);
            break;
          }
        }
      }

      // Si aucune correspondance de métier, on exclut l'entreprise pour respecter la pertinence
      if (!moduleMatch) {
        continue;
      }

      // 2. GÉOLOCALISATION & DISTANCE RÉELLE
      let distanceKm: number | undefined;
      const hasClientGps = typeof request.latitude === 'number' && typeof request.longitude === 'number';
      const hasBizGps = typeof biz.latitude === 'number' && typeof biz.longitude === 'number';

      if (hasClientGps && hasBizGps) {
        distanceKm = calculateDistanceKm(request.latitude!, request.longitude!, biz.latitude!, biz.longitude!);
        if (distanceKm <= radius) {
          score += Math.max(10, Math.round(25 * (1 - distanceKm / radius)));
          reasons.push(`À ${distanceKm} km (dans votre rayon cible de ${radius} km)`);
        } else if (distanceKm <= radius * 1.5) {
          // Légèrement au-delà du rayon mais même agglomération
          score += 5;
          reasons.push(`À ${distanceKm} km (légèrement au-delà de ${radius} km)`);
        } else {
          // Trop éloigné de la zone cible
          continue;
        }
      } else {
        // Matching textuel sur ville / quartier
        const bizCity = (biz.city || '').toLowerCase();
        const bizDistrict = (biz.district || '').toLowerCase();
        if (reqLocation && (reqLocation.includes(bizCity) || reqLocation.includes(bizDistrict) || (bizCity && reqLocation.includes(bizCity)))) {
          score += 18;
          reasons.push(`Situé dans la zone souhaitée (${biz.district ? `${biz.district}, ` : ''}${biz.city})`);
        } else {
          score += 8;
          reasons.push(`Établissement situé à ${biz.city}`);
        }
      }

      // 3. CATALOGUE & BUDGET RÉEL
      const bizOffers = catalog.filter((c) => c.businessId === biz.id && c.status === 'PUBLISHED');
      const eligibleItems: MarketplaceMatchResult['eligibleCatalogItems'] = [];

      if (bizOffers.length > 0) {
        for (const offer of bizOffers) {
          const offerPrice = offer.price;
          let isBudgetFit = true;

          if (request.budgetMax && offerPrice > request.budgetMax * 1.2) {
            isBudgetFit = false;
          }
          if (request.budgetMin && offerPrice < request.budgetMin * 0.7) {
            isBudgetFit = false;
          }

          if (isBudgetFit) {
            eligibleItems.push({
              id: offer.id,
              title: offer.title,
              price: offer.price,
              currency: offer.currency || 'FCFA',
              availability: offer.availability,
            });
          }
        }

        if (eligibleItems.length > 0) {
          score += 20;
          const validPrices = eligibleItems.map((i) => i.price).filter((p) => typeof p === 'number' && !isNaN(p));
          if (validPrices.length > 0) {
            const minPrice = Math.min(...validPrices);
            reasons.push(
              `${eligibleItems.length} offre(s) correspondant à votre profil (à partir de ${minPrice.toLocaleString('fr-FR')} FCFA)`
            );
          } else {
            reasons.push(
              `${eligibleItems.length} offre(s) correspondant à votre profil (sur devis)`
            );
          }
        } else if (request.budgetMax) {
          score += 5;
          reasons.push(`Propose des services dans ce secteur (devis sur-mesure possible)`);
        }
      } else {
        score += 5;
      }

      // 4. RÉPUTATION & AVIS VÉRIFIÉS
      const ratingSummary = this.store.calculateRating(biz.id);
      const rating = ratingSummary.averageRating;
      const reviewCount = ratingSummary.reviewCount;

      if (rating >= 4.5 && reviewCount > 0) {
        score += 15;
        reasons.push(`Excellente réputation vérifiée (${rating.toFixed(1)}/5 pour ${reviewCount} avis)`);
      } else if (rating >= 4.0 && reviewCount > 0) {
        score += 10;
        reasons.push(`Établissement bien noté (${rating.toFixed(1)}/5 pour ${reviewCount} avis)`);
      }

      // 5. DISPONIBILITÉ & OUVERTURE
      const isOpen = !!biz.is_open_now;
      if (isOpen) {
        score += 10;
        reasons.push(`Établissement actuellement ouvert`);
      }

      const finalScore = Math.min(100, Math.max(10, score));

      results.push({
        businessId: biz.id,
        businessName: biz.name,
        moduleCode: bizModule,
        city: biz.city,
        district: biz.district,
        latitude: biz.latitude,
        longitude: biz.longitude,
        distanceKm,
        rating,
        reviewCount,
        isOpenNow: isOpen,
        matchingScore: finalScore,
        matchReasons: reasons,
        eligibleCatalogItems: eligibleItems,
      });
    }

    // Tri par score décroissant puis distance croissante
    results.sort((a, b) => {
      if (b.matchingScore !== a.matchingScore) {
        return b.matchingScore - a.matchingScore;
      }
      return (a.distanceKm || 999) - (b.distanceKm || 999);
    });

    return results;
  }
}
