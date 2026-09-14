import { ServiceModule } from '../types';

export const FLOWEXA_MODULES: ServiceModule[] = [
  {
    id: 'immobilier',
    code: 'IMMOBILIER',
    number: '01.',
    name: 'Immobilier',
    subtitle: 'Vente, Location & Gestion',
    category: 'Logement & Espaces',
    description: 'Gestion de biens immobiliers, baux locatifs, visites programmées, quittances et portail propriétaires.',
    accentColor: '#FB8205',
    features: ['Catalogue de biens & villas', 'Gestion des baux & quittances', 'Réservation de visites', 'État des lieux numérique'],
    sampleQuery: 'Je cherche un appartement à Cotonou pour 120 000 FCFA'
  },
  {
    id: 'guest_house',
    code: 'GUEST_HOUSE',
    number: '02.',
    name: 'Guest House',
    subtitle: 'Séjours courte durée',
    category: 'Hébergement',
    description: 'Gestion des chambres, check-in/out en temps réel, tarification saisonnière et conciergerie.',
    accentColor: '#FB8205',
    features: ['Planning des réservations', 'Gestion du ménage & inventaire', 'Tarification dynamique', 'Check-in autonome'],
    sampleQuery: 'Guest house calme avec piscine pour un week-end à Ouidah'
  },
  {
    id: 'coiffure',
    code: 'COIFFURE',
    number: '03.',
    name: 'Coiffure',
    subtitle: 'Style & Visagisme',
    category: 'Beauté & Bien-être',
    description: 'Prise de rendez-vous en ligne, planning des coiffeurs, gestion des forfaits et fiches techniques clientes.',
    accentColor: '#FB8205',
    features: ['Agenda par collaborateur', 'Catalogue des coiffures & tarifs', 'Rappels SMS & notifications', 'Fiches historiques soins'],
    sampleQuery: 'Tresses africaines sans douleur samedi matin vers 10h'
  },
  {
    id: 'barbier',
    code: 'BARBIER',
    number: '04.',
    name: 'Barbier',
    subtitle: 'Soins masculins',
    category: 'Beauté & Bien-être',
    description: 'Espace barbier traditionnel et moderne, gestion des sièges en temps réel, soins de barbe et coupe.',
    accentColor: '#FB8205',
    features: ['File d’attente & créneaux', 'Formules taille de barbe & soins', 'Gestion des pourboires', 'Programme de fidélité'],
    sampleQuery: 'Barbier ouvert après 19h pour dégradé et taille de barbe'
  },
  {
    id: 'institut_cosmetique',
    code: 'INSTITUT_COSMETIQUE',
    number: '05.',
    name: 'Institut / Cosmétique',
    subtitle: 'Soins & Produits',
    category: 'Beauté & Cosmétique',
    description: 'Soins du visage, onglerie, vente de produits cosmétiques haut de gamme et suivi dermatologique.',
    accentColor: '#FB8205',
    features: ['Diagnostic de peau', 'Boutique cosmétique intégrée', 'Gestion des stocks crèmes & soins', 'Réservation de cabines'],
    sampleQuery: 'Soin éclat du visage et manucure semi-permanente'
  },
  {
    id: 'spa_massage',
    code: 'SPA_MASSAGE',
    number: '06.',
    name: 'Spa / Massage',
    subtitle: 'Relaxation & Bien-être',
    category: 'Bien-être',
    description: 'Gestion des cabines de massage, rituels thermaux, forfaits duo et gestion des praticiens.',
    accentColor: '#0BE9EF',
    features: ['Planning des cabines & tables', 'Rituels huiles chaudes & hammam', 'Bons cadeaux & forfaits', 'Gestion des huiles & consommables'],
    sampleQuery: 'Massage relaxant duo 60 min dimanche après-midi'
  },
  {
    id: 'photographe',
    code: 'PHOTOGRAPHE',
    number: '07.',
    name: 'Photographe',
    subtitle: 'Capture de moments',
    category: 'Créatif & Médias',
    description: 'Réservation de shootings studio et extérieurs, galeries de sélection privées et commande de tirages.',
    accentColor: '#0BE9EF',
    features: ['Réservation de séances studio', 'Galerie client protégée par mot de passe', 'Sélection & validation des clichés', 'Facturation d’événements & mariages'],
    sampleQuery: 'Shooting photo corporate en studio pour 3 personnes'
  },
  {
    id: 'broderie_impression',
    code: 'BRODERIE_IMPRESSION',
    number: '08.',
    name: 'Broderie / Impression',
    subtitle: 'Textile & Broderie',
    category: 'Artisanat & Marquage',
    description: 'Personnalisation textile, sérigraphie, broderie industrielle, devis sur mesure et suivi de confection.',
    accentColor: '#0BE9EF',
    features: ['Calculateur de devis par quantité', 'Suivi du BAT (Bon à tirer)', 'Gestion des commandes groupées', 'Statut de production en atelier'],
    sampleQuery: 'Impression de 50 polos brodés avec logo entreprise'
  },
  {
    id: 'garage',
    code: 'GARAGE',
    number: '09.',
    name: 'Garage',
    subtitle: 'Mécanique & Entretien',
    category: 'Automobile & Entretien',
    description: 'Ordres de réparation, planification d’ateliers mécaniques, devis pièces et révisions périodiques.',
    accentColor: '#0BE9EF',
    features: ['Ordres de réparation (OR)', 'Gestion des pièces détachées', 'Diagnostics & devis rapides', 'Historique carnet d’entretien'],
    sampleQuery: 'Vidange complète et révision freinage Toyota RAV4'
  },
  {
    id: 'pharmacie',
    code: 'PHARMACIE',
    number: '10.',
    name: 'Pharmacie',
    subtitle: 'Santé & Garde',
    category: 'Santé',
    description: 'Vérification des stocks de médicaments, officines de garde, dépôt d’ordonnances et conseils santé.',
    accentColor: '#0BE9EF',
    features: ['Disponibilité des médicaments', 'Calendrier des gardes de nuit', 'Dépôt d’ordonnance sécurisé', 'Alertes renouvellement'],
    sampleQuery: 'Pharmacie de garde ouverte cette nuit avec délivrance ordonnance'
  }
];
