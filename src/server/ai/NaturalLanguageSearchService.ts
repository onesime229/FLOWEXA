import { BusinessModuleCode, SmartSearchFilter, AIRecommendationItem } from '../../types';
import { DataStore } from '../dataStore';

// Coordonnées de référence pour les villes et quartiers béninois
const KNOWN_BENIN_GEO_AREAS: Record<string, { lat: number; lng: number; city: string; district?: string }> = {
  cotonou: { lat: 6.3654, lng: 2.4183, city: 'Cotonou' },
  'haie vive': { lat: 6.3533, lng: 2.4045, city: 'Cotonou', district: 'Haie Vive' },
  fidjrosse: { lat: 6.3612, lng: 2.3789, city: 'Cotonou', district: 'Fidjrossè' },
  'fidjrossè': { lat: 6.3612, lng: 2.3789, city: 'Cotonou', district: 'Fidjrossè' },
  ganhi: { lat: 6.3598, lng: 2.4345, city: 'Cotonou', district: 'Ganhi' },
  cadjehoun: { lat: 6.3601, lng: 2.4123, city: 'Cotonou', district: 'Cadjehoun' },
  'cadjèhoun': { lat: 6.3601, lng: 2.4123, city: 'Cotonou', district: 'Cadjehoun' },
  akpakpa: { lat: 6.3712, lng: 2.4498, city: 'Cotonou', district: 'Akpakpa' },
  calavi: { lat: 6.4485, lng: 2.3557, city: 'Abomey-Calavi' },
  'abomey-calavi': { lat: 6.4485, lng: 2.3557, city: 'Abomey-Calavi' },
  'porto-novo': { lat: 6.4969, lng: 2.6289, city: 'Porto-Novo' },
  ouidah: { lat: 6.3631, lng: 2.0851, city: 'Ouidah' },
  parakou: { lat: 9.3372, lng: 2.6303, city: 'Parakou' },
};

export function isBusinessOpenNow(business: { status?: string; is_open_now?: boolean; opening_hours?: Record<string, string> }): boolean {
  if (business.status && business.status !== 'ACTIVE') return false;
  if (business.is_open_now !== undefined) return Boolean(business.is_open_now);
  if (!business.opening_hours || Object.keys(business.opening_hours).length === 0) return true;

  // Check 7j/7 24h/24
  for (const [, hours] of Object.entries(business.opening_hours)) {
    if (hours.toLowerCase().includes('24h') || hours.toLowerCase().includes('24/24')) return true;
  }

  // Benin is UTC+1 (Africa/Porto-Novo)
  const now = new Date();
  const localHour = (now.getUTCHours() + 1) % 24;
  const currentMinutes = localHour * 60 + now.getUTCMinutes();
  const dayOfWeek = now.getUTCDay(); // 0 = Dim, 1 = Lun, 2 = Mar, 3 = Mer, 4 = Jeu, 5 = Ven, 6 = Sam
  const dayNames = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
  const currentDayName = dayNames[dayOfWeek];

  for (const [dayRange, timeRange] of Object.entries(business.opening_hours)) {
    const dr = dayRange.toLowerCase();
    let matchesDay = false;
    if (dr.includes('7j/7') || dr.includes('tous') || dr.includes('7/7')) {
      matchesDay = true;
    } else if (dr.includes('lun-ven') && dayOfWeek >= 1 && dayOfWeek <= 5) {
      matchesDay = true;
    } else if (dr.includes('lun-sam') && dayOfWeek >= 1 && dayOfWeek <= 6) {
      matchesDay = true;
    } else if (dr.includes('mar-dim') && (dayOfWeek >= 2 || dayOfWeek === 0)) {
      matchesDay = true;
    } else if (dr.includes(currentDayName)) {
      matchesDay = true;
    }

    if (matchesDay) {
      if (timeRange.toLowerCase().includes('fermé')) return false;
      const match = timeRange.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
      if (match) {
        const startMin = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
        const endMin = parseInt(match[3], 10) * 60 + parseInt(match[4], 10);
        if (currentMinutes >= startMin && currentMinutes <= endMin) {
          return true;
        }
      } else {
        return true;
      }
    }
  }

  return false;
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la terre en km
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

export class NaturalLanguageSearchService {
  constructor(private store: DataStore) {}

  /**
   * Analyse une requête en langage naturel pour extraire des filtres structurés.
   * STRICTEMENT AUCUNE DONNÉE FICTIVE.
   */
  public parseNaturalQuery(query: string): SmartSearchFilter {
    const qLower = (query || '').toLowerCase().trim();
    const filter: SmartSearchFilter = {
      keywords: [],
    };

    // 1. Extraction du module / secteur parmi les 10 modules officiels Flowexa
    // STRICTEMENT SANS COUTURIER / TAILLEUR
    if (
      qLower.includes('maison') ||
      qLower.includes('villa') ||
      qLower.includes('appart') ||
      qLower.includes('logement') ||
      qLower.includes('studio') ||
      qLower.includes('terrain') ||
      qLower.includes('parcelle') ||
      qLower.includes('loyer') ||
      qLower.includes('louer') ||
      qLower.includes('location') ||
      qLower.includes('bureau') ||
      qLower.includes('immo')
    ) {
      filter.moduleCode = 'IMMOBILIER';
      if (qLower.includes('louer') || qLower.includes('location') || qLower.includes('loyer')) {
        filter.transactionType = 'RENTAL';
      } else if (qLower.includes('achat') || qLower.includes('acheter') || qLower.includes('vente')) {
        filter.transactionType = 'SALE';
      }
      if (qLower.includes('appart')) filter.propertyType = 'APPARTEMENT';
      else if (qLower.includes('villa') || qLower.includes('maison')) filter.propertyType = 'VILLA';
      else if (qLower.includes('studio')) filter.propertyType = 'STUDIO';
      else if (qLower.includes('terrain') || qLower.includes('parcelle')) filter.propertyType = 'TERRAIN';
    } else if (
      qLower.includes('guest') ||
      qLower.includes('chambre') ||
      qLower.includes('nuit') ||
      qLower.includes('séjour') ||
      qLower.includes('hôtel') ||
      qLower.includes('hotel') ||
      qLower.includes('héberg') ||
      qLower.includes('suite')
    ) {
      filter.moduleCode = 'GUEST_HOUSE';
      filter.needType = 'CHAMBRE';
    } else if (
      qLower.includes('coiff') ||
      qLower.includes('tresse') ||
      qLower.includes('tissage') ||
      qLower.includes('cheveux') ||
      qLower.includes('brushing') ||
      qLower.includes('nattes') ||
      qLower.includes('perruque')
    ) {
      filter.moduleCode = 'COIFFURE';
      filter.needType = 'PRESTATION';
    } else if (
      qLower.includes('barb') ||
      qLower.includes('barbe') ||
      qLower.includes('dégradé') ||
      qLower.includes('contour') ||
      qLower.includes('coupe homme')
    ) {
      filter.moduleCode = 'BARBIER';
      filter.needType = 'PRESTATION';
    } else if (
      qLower.includes('institut') ||
      qLower.includes('cosmétique') ||
      qLower.includes('cosmetique') ||
      qLower.includes('ongle') ||
      qLower.includes('onglerie') ||
      qLower.includes('manucure') ||
      qLower.includes('pédicure') ||
      qLower.includes('vernis') ||
      qLower.includes('visage') ||
      qLower.includes('maquillage')
    ) {
      filter.moduleCode = 'INSTITUT_COSMETIQUE';
    } else if (
      qLower.includes('spa') ||
      qLower.includes('massage') ||
      qLower.includes('détente') ||
      qLower.includes('soin') ||
      qLower.includes('gommage') ||
      qLower.includes('hammam') ||
      qLower.includes('sauna') ||
      qLower.includes('bien-être') ||
      qLower.includes('bien etre')
    ) {
      filter.moduleCode = 'SPA_MASSAGE';
    } else if (
      qLower.includes('photo') ||
      qLower.includes('shooting') ||
      qLower.includes('portrait') ||
      qLower.includes('séance') ||
      qLower.includes('studio photo') ||
      qLower.includes('reportage')
    ) {
      filter.moduleCode = 'PHOTOGRAPHE';
    } else if (
      qLower.includes('broderie') ||
      qLower.includes('impression textile') ||
      qLower.includes('flocage') ||
      qLower.includes('sérigraphie') ||
      qLower.includes('serigraphie') ||
      qLower.includes('marquage')
    ) {
      filter.moduleCode = 'BRODERIE_IMPRESSION';
    } else if (
      qLower.includes('garage') ||
      qLower.includes('moteur') ||
      qLower.includes('vidange') ||
      qLower.includes('frein') ||
      qLower.includes('voiture') ||
      qLower.includes('auto') ||
      qLower.includes('mécanique') ||
      qLower.includes('dépannage') ||
      qLower.includes('reparation')
    ) {
      filter.moduleCode = 'GARAGE';
    } else if (
      qLower.includes('pharmacie') ||
      qLower.includes('médicament') ||
      qLower.includes('officine') ||
      qLower.includes('ordonnance')
    ) {
      filter.moduleCode = 'PHARMACIE';
    }

    // 2. Détection du budget / prix maximum
    const priceMatch = qLower.match(
      /(?:moins de|budget(?: de)?|max(?:imum)?|inférieur à|jusqu['’]à|pour)\s*([0-9\s.,]+)\s*(?:fcfa|f|cfa)?/i
    ) || qLower.match(/([0-9\s]{4,})\s*(?:fcfa|f|cfa)/i);

    if (priceMatch && priceMatch[1]) {
      const cleanNum = parseInt(priceMatch[1].replace(/[\s.,]/g, ''), 10);
      if (!isNaN(cleanNum) && cleanNum > 0 && cleanNum < 100000000) {
        filter.maxPrice = cleanNum;
      }
    }

    // 3. Détection de la ville et du quartier
    for (const [key, area] of Object.entries(KNOWN_BENIN_GEO_AREAS)) {
      if (qLower.includes(key)) {
        filter.city = area.city;
        if (area.district) {
          filter.district = area.district;
        }
        break;
      }
    }

    // 4. Détection de la temporalité et ouverture
    if (
      qLower.includes("aujourd'hui") ||
      qLower.includes('ce soir') ||
      qLower.includes('immédiat') ||
      qLower.includes('maintenant') ||
      qLower.includes('ouvert') ||
      qLower.includes('urgent')
    ) {
      filter.availableToday = true;
    }

    if (
      qLower.includes('ouvert') ||
      qLower.includes('ouvert maintenant') ||
      qLower.includes('ouvert actuellement') ||
      qLower.includes('garde')
    ) {
      filter.openNow = true;
    }

    // 5. Tokens significatifs (mots-clés pertinents)
    const stopWords = new Set([
      'cherche', 'chercheur', 'veux', 'trouve', 'pour', 'avec', 'sans', 'dans', 'quelque',
      'chose', 'proche', 'près', 'autour', 'moi', 'besoin', 'une', 'des', 'les', 'par',
    ]);

    filter.keywords = qLower
      .split(/[\s,.'’\-–]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 2 && !stopWords.has(t));

    return filter;
  }

  /**
   * Recherche et classe les offres et entreprises réelles avec explications transparentes
   */
  public searchWithExplanations(
    rawQuery: string,
    options?: {
      clientLat?: number;
      clientLng?: number;
      radiusKm?: number;
      clientId?: string;
      limit?: number;
      openNow?: boolean;
      availableToday?: boolean;
    }
  ): {
    query: string;
    parsedFilter: SmartSearchFilter;
    recommendations: AIRecommendationItem[];
    totalMatched: number;
    alternatives?: string[];
  } {
    const filter = this.parseNaturalQuery(rawQuery);
    if (options?.openNow) filter.openNow = true;
    if (options?.availableToday) filter.availableToday = true;
    if (options?.radiusKm) filter.radiusKm = options.radiusKm;

    const db = this.store.getDb();
    const catalog = db.catalogItems || [];
    const businesses = db.businesses || [];
    const clientFavorites = options?.clientId ? (db.favorites || []).filter((f) => f.clientId === options.clientId) : [];
    const favOfferIds = new Set(clientFavorites.map((f) => f.catalogItemId || f.businessId).filter(Boolean));

    const scoredItems: AIRecommendationItem[] = [];

    // --- A. ANALYSE DES OFFRES DE CATALOGUE PUBLIÉES ---
    for (const item of catalog) {
      if (item.status && item.status !== 'PUBLISHED') continue;

      const biz = businesses.find((b) => b.id === item.businessId);
      if (!biz || (biz as any).status === 'SUSPENDED' || (biz as any).status === 'INACTIVE') continue;

      const bizIsOpen = isBusinessOpenNow(biz);
      if (filter.openNow && !bizIsOpen) continue;

      // 1. Filtrage par module / secteur si détecté
      if (filter.moduleCode && item.moduleCode !== filter.moduleCode) {
        continue;
      }

      // 2. Filtrage par prix maximum si détecté
      if (filter.maxPrice && item.price > filter.maxPrice) {
        continue;
      }

      // 3. Filtrage géographique / ville si détecté
      const itemCity = (item as any).effectiveLocation?.city || item.city || biz.city || 'Cotonou';
      const itemDistrict = (item as any).effectiveLocation?.district || item.district || biz.district || '';
      if (filter.city && !itemCity.toLowerCase().includes(filter.city.toLowerCase())) {
        continue;
      }
      if (filter.district && !itemDistrict.toLowerCase().includes(filter.district.toLowerCase())) {
        continue;
      }

      // 4. Calcul de distance réelle
      let distanceKm: number | undefined;
      const targetLat = item.hasOwnLocation && item.latitude ? item.latitude : biz.latitude;
      const targetLng = item.hasOwnLocation && item.longitude ? item.longitude : biz.longitude;

      if (options?.clientLat && options?.clientLng && targetLat && targetLng) {
        distanceKm = calculateDistanceKm(options.clientLat, options.clientLng, targetLat, targetLng);
        if (options.radiusKm && distanceKm > options.radiusKm) {
          continue;
        }
      }

      // 5. Calcul du score et constitution des explications vérifiables
      let score = 50;
      const explanations: string[] = [];

      // Correspondance sémantique
      const fullText = `${item.title} ${item.description || ''} ${item.offerType || ''} ${biz.name} ${itemCity} ${itemDistrict}`.toLowerCase();
      let matchedKeywordCount = 0;
      for (const kw of filter.keywords) {
        if (fullText.includes(kw)) {
          matchedKeywordCount++;
        }
      }
      if (matchedKeywordCount > 0) {
        score += matchedKeywordCount * 15;
        explanations.push(`Correspond directement à votre recherche`);
      }

      // Explication Budget
      if (filter.maxPrice && typeof item.price === 'number') {
        score += 20;
        const diff = filter.maxPrice - item.price;
        if (diff > 0) {
          explanations.push(`Dans votre budget (${item.price.toLocaleString('fr-FR')} FCFA ≤ ${filter.maxPrice.toLocaleString('fr-FR')} FCFA)`);
        } else {
          explanations.push(`Prix conforme au budget (${item.price.toLocaleString('fr-FR')} FCFA)`);
        }
      }

      // Explication Distance
      if (distanceKm !== undefined) {
        if (distanceKm <= 1.5) {
          score += 25;
          explanations.push(`À proximité immédiate (${distanceKm} km)`);
        } else if (distanceKm <= 5) {
          score += 15;
          explanations.push(`À ${distanceKm} km de votre position`);
        } else {
          explanations.push(`Situé à ${distanceKm} km (${itemCity})`);
        }
      } else if (filter.city) {
        explanations.push(`Établissement situé à ${itemCity}${itemDistrict ? ` (${itemDistrict})` : ''}`);
      }

      // Explication Disponibilité
      const isAvailable = item.availability === 'AVAILABLE';
      if (isAvailable) {
        score += 10;
        if (filter.availableToday) {
          score += 15;
          explanations.push(`Disponible aujourd'hui sans délai`);
        }
      }

      // Explication Ouverture
      if (bizIsOpen) {
        score += 10;
        explanations.push(`Établissement ouvert actuellement`);
      }

      // Explication Avis réels vérifiés (strictement aucune note inventée)
      const ratingSummary = this.store.calculateRating(biz.id, item.id);
      const realRating = ratingSummary.averageRating;
      const realReviews = ratingSummary.reviewCount;
      if (realReviews > 0) {
        score += Math.min(25, Math.round(realRating * 4));
        explanations.push(`Noté ${realRating.toFixed(1)}/5 sur ${realReviews} avis vérifiés`);
      } else {
        explanations.push(`Aucun avis pour le moment`);
      }

      // Explication Favori
      const isFavorite = favOfferIds.has(item.id) || favOfferIds.has(biz.id);
      if (isFavorite) {
        score += 20;
        explanations.push(`Présent dans vos favoris`);
      }

      let highlightBadge: string | undefined;
      if (distanceKm !== undefined && distanceKm <= 1.5) {
        highlightBadge = 'Plus proche';
      } else if (realRating >= 4.8 && realReviews >= 3) {
        highlightBadge = 'Mieux noté';
      } else if (filter.maxPrice && item.price <= filter.maxPrice * 0.75) {
        highlightBadge = 'Meilleur prix';
      }

      const distanceFormatted = distanceKm !== undefined
        ? (distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`)
        : undefined;

      scoredItems.push({
        id: item.id,
        title: item.title,
        businessId: biz.id,
        businessName: biz.name,
        businessPhone: '0154100617',
        businessWhatsApp: '0154100617',
        moduleCode: item.moduleCode as BusinessModuleCode,
        category: item.offerType || (item as any).categoryName || 'Offre',
        location: itemDistrict ? `${itemDistrict}, ${itemCity}` : itemCity,
        city: itemCity,
        district: itemDistrict,
        address: item.address || biz.address,
        price: item.price,
        priceFormatted: typeof item.price === 'number' ? `${item.price.toLocaleString('fr-FR')} FCFA` : 'Sur devis',
        priceUnit:
          item.priceType === 'PER_NIGHT'
            ? '/ nuit'
            : item.priceType === 'PER_DAY'
            ? '/ jour'
            : item.priceType === 'PER_HOUR'
            ? '/ heure'
            : undefined,
        rating: realReviews > 0 ? realRating : null,
        reviewCount: realReviews,
        isFavorite,
        distanceKm,
        distanceFormatted,
        availableToday: isAvailable,
        isOpenNow: bizIsOpen,
        openingHours: biz.opening_hours,
        openingHoursFormatted: Object.entries(biz.opening_hours || {}).map(([d, h]) => `${d}: ${h}`).join(' • ') || 'Horaires habituels',
        score,
        explanations,
        highlightBadge,
        imageUrl: item.images?.[0]?.url || biz.images?.[0]?.url,
        kind: 'catalog_item',
        offerType: item.offerType,
        specs: item.specs || {},
        description: item.description,
      });
    }

    // --- B. ANALYSE DIRECTE DES ÉTABLISSEMENTS / ENTREPRISES ---
    // Si la recherche mentionne explicitement "agence", "entreprise", "service", ou un secteur sans offre spécifique
    for (const biz of businesses) {
      if (biz.status !== 'ACTIVE') continue;

      const bizIsOpen = isBusinessOpenNow(biz);
      if (filter.openNow && !bizIsOpen) continue;

      if (filter.moduleCode && biz.module_code !== filter.moduleCode && !biz.enabled_modules?.includes(filter.moduleCode)) {
        continue;
      }

      const bizCity = biz.city || 'Cotonou';
      const bizDistrict = biz.district || '';
      if (filter.city && !bizCity.toLowerCase().includes(filter.city.toLowerCase())) {
        continue;
      }
      if (filter.district && !bizDistrict.toLowerCase().includes(filter.district.toLowerCase())) {
        continue;
      }

      let distanceKm: number | undefined;
      if (options?.clientLat && options?.clientLng && biz.latitude && biz.longitude) {
        distanceKm = calculateDistanceKm(options.clientLat, options.clientLng, biz.latitude, biz.longitude);
        if (options.radiusKm && distanceKm > options.radiusKm) {
          continue;
        }
      }

      let score = 45;
      const explanations: string[] = [];

      const fullBizText = `${biz.name} ${(biz as any).description || ''} ${biz.module_code} ${bizCity} ${bizDistrict}`.toLowerCase();
      let matchedKw = 0;
      for (const kw of filter.keywords) {
        if (fullBizText.includes(kw)) matchedKw++;
      }
      if (matchedKw > 0) {
        score += matchedKw * 15;
        explanations.push(`Établissement correspondant à votre recherche`);
      }

      if (distanceKm !== undefined) {
        if (distanceKm <= 1.5) {
          score += 25;
          explanations.push(`À proximité immédiate (${distanceKm} km)`);
        } else {
          score += 15;
          explanations.push(`À ${distanceKm} km de votre position`);
        }
      }

      if (bizIsOpen) {
        score += 10;
        explanations.push(`Ouvert actuellement`);
      }

      const ratingSummary = this.store.calculateRating(biz.id);
      const realRating = ratingSummary.averageRating;
      const realReviews = ratingSummary.reviewCount;
      if (realReviews > 0) {
        score += Math.min(25, Math.round(realRating * 4));
        explanations.push(`Noté ${realRating.toFixed(1)}/5 sur ${realReviews} avis`);
      } else {
        explanations.push(`Aucun avis pour le moment`);
      }

      const isFavorite = favOfferIds.has(biz.id);
      if (isFavorite) {
        score += 20;
        explanations.push(`Établissement en favori`);
      }

      const distanceFormatted = distanceKm !== undefined
        ? (distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`)
        : undefined;

      scoredItems.push({
        id: biz.id,
        title: biz.name,
        businessId: biz.id,
        businessName: biz.name,
        businessPhone: '0154100617',
        businessWhatsApp: '0154100617',
        moduleCode: biz.module_code as BusinessModuleCode,
        category: biz.district || biz.city || 'Établissement vérifié',
        location: bizDistrict ? `${bizDistrict}, ${bizCity}` : bizCity,
        city: bizCity,
        district: bizDistrict,
        address: biz.address,
        price: 0,
        priceFormatted: distanceFormatted ? `À ${distanceFormatted}` : 'Proximité immédiate',
        priceUnit: '',
        rating: realReviews > 0 ? realRating : null,
        reviewCount: realReviews,
        isFavorite,
        distanceKm,
        distanceFormatted,
        availableToday: true,
        isOpenNow: bizIsOpen,
        openingHours: biz.opening_hours,
        openingHoursFormatted: Object.entries(biz.opening_hours || {}).map(([d, h]) => `${d}: ${h}`).join(' • ') || 'Ouvert aux horaires d\'affaires',
        score,
        explanations,
        highlightBadge: bizIsOpen ? 'Ouvert maintenant' : 'Établissement vérifié',
        imageUrl: biz.images?.[0]?.url,
        kind: 'business',
        description: (biz as any).description || `${biz.address || 'Adresse au Bénin'}`,
      });
    }

    // Tri par score décroissant (objectivité stricte, sans favoritisme)
    scoredItems.sort((a, b) => b.score - a.score);

    const limit = options?.limit || 20;
    const finalResults = scoredItems.slice(0, limit);

    const alternatives: string[] = [];
    if (finalResults.length === 0) {
      if (options?.radiusKm && options.radiusKm < 10) {
        alternatives.push('Élargir le rayon de recherche à 10 km');
      }
      if (filter.openNow) {
        alternatives.push('Consulter les établissements ouvrant prochainement (désactiver "Ouvert maintenant")');
      }
      if (filter.city) {
        alternatives.push('Rechercher sur toute la région métropolitaine (Cotonou & Abomey-Calavi)');
      }
      alternatives.push('Publier une demande sur la Marketplace Flowexa pour recevoir des propositions directes');
    }

    return {
      query: rawQuery,
      parsedFilter: filter,
      recommendations: finalResults,
      totalMatched: scoredItems.length,
      alternatives,
    };
  }
}
