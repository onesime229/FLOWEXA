export interface DetectedIntent {
  rawQuery: string;
  title: string;
  chips: { label: string; type: 'category' | 'date' | 'location' | 'budget' }[];
  cta: string;
  targetBusinessId?: string;
  categoryFilter?: string;
}

export const INTENT_PATTERNS = [
  {
    re: /(garage|vidange|moteur|mécanique|mecanique|frein|voiture|pneu|révision|revision|diagnostic auto)/i,
    title: 'Entretien & réparation auto',
    chips: [
      { label: 'Garage mécanique', type: 'category' as const },
      { label: 'Dès que possible', type: 'date' as const },
      { label: 'Ganhi / Cotonou', type: 'location' as const },
      { label: 'Dès 15 000 F', type: 'budget' as const },
    ],
    cta: 'Voir les garages disponibles',
    targetBusinessId: 'biz-garage',
    categoryFilter: 'GARAGE',
  },
  {
    re: /(photo|photographe|shooting|studio photo|portrait|book photo)/i,
    title: 'Séance photo studio professionnelle',
    chips: [
      { label: 'Séance portrait studio', type: 'category' as const },
      { label: 'Sur réservation', type: 'date' as const },
      { label: 'Haie Vive / Cotonou', type: 'location' as const },
      { label: 'Dès 15 000 F', type: 'budget' as const },
    ],
    cta: 'Voir les photographes disponibles',
    targetBusinessId: 'biz-photo',
    categoryFilter: 'PHOTOGRAPHE',
  },
  {
    re: /(broderie|flocage|sérigraphie|serigraphie|impression textile|t-shirt personnalisé|casquette brodée)/i,
    title: 'Broderie & flocage textile personnalisé',
    chips: [
      { label: 'Broderie & Flocage', type: 'category' as const },
      { label: 'Commande sur mesure', type: 'date' as const },
      { label: 'Akpakpa / Cotonou', type: 'location' as const },
      { label: 'Sur devis', type: 'budget' as const },
    ],
    cta: 'Voir les ateliers disponibles',
    targetBusinessId: 'biz-broderie',
    categoryFilter: 'BRODERIE_IMPRESSION',
  },
  {
    re: /(barb|barbier|dégradé|degrade|grooming|taille de barbe)/i,
    title: 'Barbier & soins homme',
    chips: [
      { label: 'Taille de barbe & coupe', type: 'category' as const },
      { label: 'Aujourd’hui', type: 'date' as const },
      { label: 'Cadjehoun / Cotonou', type: 'location' as const },
      { label: 'Dès 3 000 F', type: 'budget' as const },
    ],
    cta: 'Voir les barbiers disponibles',
    targetBusinessId: 'biz-barbier',
    categoryFilter: 'BARBIER',
  },
  {
    re: /(tress|coiff|cheveu|braid|coiffure)/i,
    title: 'Coiffure & tresses, demain',
    chips: [
      { label: 'Tresses & Coiffure', type: 'category' as const },
      { label: 'Demain', type: 'date' as const },
      { label: 'Cadjehoun / Cotonou', type: 'location' as const },
      { label: 'Dès 4 000 F', type: 'budget' as const },
    ],
    cta: 'Voir les salons disponibles',
    targetBusinessId: 'biz-elegance',
    categoryFilter: 'COIFFURE',
  },
  {
    re: /(soin visage|manucure|vernis|onglerie|esthétique|esthetique|cosmétique|cosmetique)/i,
    title: 'Soins visage & onglerie',
    chips: [
      { label: 'Institut & Cosmétique', type: 'category' as const },
      { label: 'Cette semaine', type: 'date' as const },
      { label: 'Haie Vive / Cotonou', type: 'location' as const },
      { label: 'Dès 8 000 F', type: 'budget' as const },
    ],
    cta: 'Voir les instituts de beauté',
    targetBusinessId: 'biz-institut',
    categoryFilter: 'INSTITUT_COSMETIQUE',
  },
  {
    re: /(massage|spa|hammam|détente|detente|bien-être|bien etre|relaxation)/i,
    title: 'Massage relaxant & spa bien-être',
    chips: [
      { label: 'Massage & Spa', type: 'category' as const },
      { label: 'Créneau détente', type: 'date' as const },
      { label: 'Fidjrossè / Cotonou', type: 'location' as const },
      { label: 'Dès 20 000 F', type: 'budget' as const },
    ],
    cta: 'Voir les spas & massages',
    targetBusinessId: 'biz-spa',
    categoryFilter: 'SPA_MASSAGE',
  },
  {
    re: /(chambre|nuit|séjour|sejour|guest|hôtel|hotel|dormir)/i,
    title: 'Chambre à Cotonou, ce soir',
    chips: [
      { label: 'Chambre confort', type: 'category' as const },
      { label: 'Ce soir', type: 'date' as const },
      { label: '2 personnes', type: 'category' as const },
      { label: 'Cotonou', type: 'location' as const },
      { label: 'Dès 25 000 F / nuit', type: 'budget' as const },
    ],
    cta: 'Voir les établissements disponibles',
    targetBusinessId: 'biz-palma',
    categoryFilter: 'GUEST_HOUSE',
  },
  {
    re: /(maison|appartement|louer|acheter|terrain|bureau|immobilier|villa)/i,
    title: 'Maison ou appartement à louer',
    chips: [
      { label: 'Location résidentielle', type: 'category' as const },
      { label: '2-3 chambres', type: 'category' as const },
      { label: 'Haie Vive / Calavi', type: 'location' as const },
      { label: 'Budget 80 000 - 150 000 F', type: 'budget' as const },
    ],
    cta: 'Voir les biens disponibles',
    targetBusinessId: 'biz-haie-vive',
    categoryFilter: 'IMMOBILIER',
  },
  {
    re: /(pharmac|garde|médicament|medicament|officine)/i,
    title: 'Pharmacies de garde ouvertes',
    chips: [
      { label: 'Pharmacie & Officine', type: 'category' as const },
      { label: 'Ouverte maintenant', type: 'date' as const },
      { label: 'Autour de vous', type: 'location' as const },
    ],
    cta: 'Voir les pharmacies de garde',
    targetBusinessId: 'biz-pharmacie',
    categoryFilter: 'PHARMACIE',
  },
];

export function parseIntentFromQuery(text: string): DetectedIntent {
  const q = text.trim();
  const match = INTENT_PATTERNS.find((item) => item.re.test(q));
  if (match) {
    return {
      rawQuery: q,
      title: match.title,
      chips: match.chips,
      cta: match.cta,
      targetBusinessId: match.targetBusinessId,
      categoryFilter: match.categoryFilter,
    };
  }

  // Fallback intent
  return {
    rawQuery: q,
    title: q ? `Recherche : ${q}` : 'Recherche de service à Cotonou',
    chips: [
      { label: 'Tous services', type: 'category' },
      { label: 'Aujourd’hui', type: 'date' },
      { label: 'Autour de vous', type: 'location' },
    ],
    cta: 'Voir les résultats correspondants',
  };
}
