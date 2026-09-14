import {
  ServiceModule,
  SearchResultItem,
  ProTodayMetrics,
  PropertyItem,
  GuestRoom,
  GuestBooking,
  ServiceRecord,
  CRMContact,
  UserProfile,
  TenantEnterprise,
  AdminUserItem,
  SubscriptionItem,
  PlatformPayment,
  SystemAuditActivity,
} from '../types';

export const FLOWEXA_MODULES: ServiceModule[] = [
  {
    id: 'immobilier',
    code: 'IMMOBILIER',
    number: '01.',
    name: 'Immobilier',
    subtitle: 'Vente, Location & Gestion',
    category: 'Logement & Espaces',
    description: 'Gestion de biens immobiliers, baux locatifs, visites programmées et quittances.',
    accentColor: '#FB8205',
    features: ['Catalogue de biens', 'Gestion des baux', 'Réservation de visites', 'État des lieux'],
    sampleQuery: 'Je cherche un appartement à Cotonou',
    iconName: 'Building2',
  },
  {
    id: 'guest_house',
    code: 'GUEST_HOUSE',
    number: '02.',
    name: 'Guest House',
    subtitle: 'Séjours courte durée',
    category: 'Hébergement',
    description: 'Gestion des chambres, arrivées/départs en temps réel et réservations.',
    accentColor: '#0BE9EF',
    features: ['Planning des réservations', 'Gestion du ménage', 'Tarification par nuitée', 'Disponibilités'],
    sampleQuery: 'Guest house calme avec piscine pour un week-end',
    iconName: 'Home',
  },
  {
    id: 'coiffure',
    code: 'COIFFURE',
    number: '03.',
    name: 'Coiffure',
    subtitle: 'Style & Coiffure',
    category: 'Beauté & Soins',
    description: 'Prise de rendez-vous, planning des coiffeurs, gestion des forfaits et prestations.',
    accentColor: '#FB8205',
    features: ['Agenda par collaborateur', 'Catalogue des coiffures & tarifs', 'Rappels automatiques', 'Fiches prestations'],
    sampleQuery: 'Tresses ou brushing samedi matin',
    iconName: 'Scissors',
  },
  {
    id: 'barbier',
    code: 'BARBIER',
    number: '04.',
    name: 'Barbier',
    subtitle: 'Grooming masculin',
    category: 'Beauté & Soins',
    description: 'Gestion des créneaux, soins de barbe, taille et coupe.',
    accentColor: '#0BE9EF',
    features: ['Créneaux & disponibilités', 'Formules taille de barbe & soins', 'Tarifs par prestation', 'Fidélité'],
    sampleQuery: 'Barbier ouvert en soirée pour taille de barbe',
    iconName: 'Sparkles',
  },
  {
    id: 'institut_cosmetique',
    code: 'INSTITUT_COSMETIQUE',
    number: '05.',
    name: 'Institut / Cosmétique',
    subtitle: 'Soins & Produits',
    category: 'Beauté & Soins',
    description: 'Soins du visage, onglerie, vente de produits cosmétiques.',
    accentColor: '#FB8205',
    features: ['Soins personnalisés', 'Gestion des cabines', 'Catalogue produits', 'Rendez-vous'],
    sampleQuery: 'Soin du visage et pose de vernis',
    iconName: 'HeartHandshake',
  },
  {
    id: 'spa_massage',
    code: 'SPA_MASSAGE',
    number: '06.',
    name: 'Spa & Massage',
    subtitle: 'Détente & Bien-être',
    category: 'Bien-être',
    description: 'Massages relaxants, hammam, soins bien-être et forfaits duo.',
    accentColor: '#0BE9EF',
    features: ['Réservation cabines duo & solo', 'Protocoles de massage', 'Forfaits détente', 'Bons cadeaux'],
    sampleQuery: 'Massage relaxant aux huiles naturelles',
    iconName: 'Activity',
  },
  {
    id: 'photographe',
    code: 'PHOTOGRAPHE',
    number: '07.',
    name: 'Photographe',
    subtitle: 'Séances & Reportages',
    category: 'Création & Média',
    description: 'Réservation de séances photo studio, reportages événementiels et galeries.',
    accentColor: '#FB8205',
    features: ['Réservation de séances', 'Galeries photos', 'Tirages & forfaits', 'Post-traitement'],
    sampleQuery: 'Shooting photo portrait en studio',
    iconName: 'Camera',
  },
  {
    id: 'broderie_impression',
    code: 'BRODERIE_IMPRESSION',
    number: '08.',
    name: 'Broderie / Impression textile',
    subtitle: 'Broderie, Flocage & Impression',
    category: 'Textile & Artisanat',
    description: 'Personnalisation textile, broderie artisanale et industrielle, flocage, sérigraphie et impression.',
    accentColor: '#0BE9EF',
    features: ['Personnalisation & motifs', 'Suivi des commandes', 'Flocage & sérigraphie', 'Impression textile'],
    sampleQuery: 'Broderie et flocage sur polos et t-shirts',
    iconName: 'Palette',
  },
  {
    id: 'garage',
    code: 'GARAGE',
    number: '09.',
    name: 'Garage',
    subtitle: 'Entretien & Mécanique',
    category: 'Automobile',
    description: 'Prise en charge véhicule, ordres de réparation, devis instantanés et entretien.',
    accentColor: '#FB8205',
    features: ['Ordres de réparation', 'Carnet d’entretien', 'Devis prestations', 'Notification véhicule prêt'],
    sampleQuery: 'Diagnostic électronique et vidange',
    iconName: 'Wrench',
  },
  {
    id: 'pharmacie',
    code: 'PHARMACIE',
    number: '10.',
    name: 'Pharmacie',
    subtitle: 'Santé & Médicaments',
    category: 'Santé',
    description: 'Disponibilité des produits, pharmacies de garde et conseils.',
    accentColor: '#10D97F',
    features: ['Disponibilité en direct', 'Pharmacies de garde', 'Conseils & posologie', 'Horaires'],
    sampleQuery: 'Pharmacie de garde ouverte ce soir',
    iconName: 'ShieldCheck',
  },
];

export const DEMO_USER: UserProfile = {
  id: 'usr_test_01',
  name: 'Utilisateur Test',
  email: 'pro@flowexa.com',
  phone: '',
  initials: 'UT',
  role: 'BUSINESS_OWNER',
  tenantName: 'Organisation Test',
  businessName: 'Entreprise Test Immobilier',
  activeBusinessModule: 'IMMOBILIER',
};

// Generic Search Results (without invented names/phones)
export const MOCK_SEARCH_RESULTS: SearchResultItem[] = [];

// Pro Today Global Metrics
export const MOCK_TODAY_METRICS: ProTodayMetrics = {
  newClients: 0,
  prospects: 0,
  appointments: 0,
  bookings: 0,
  pendingTasks: 0,
  todayRevenue: 0,
  revenueComparisonPercent: 0,
};

// Real Estate Generic List
export const MOCK_PROPERTIES: PropertyItem[] = [];

// Guest House Rooms
export const MOCK_GUEST_ROOMS: GuestRoom[] = [];

// Guest Bookings
export const MOCK_GUEST_BOOKINGS: GuestBooking[] = [];

// Common Service Records
export const MOCK_SERVICE_RECORDS: Record<string, ServiceRecord[]> = {
  COIFFURE: [],
  BARBIER: [],
  SPA_MASSAGE: [],
  INSTITUT_COSMETIQUE: [],
  PHOTOGRAPHE: [],
  BRODERIE_IMPRESSION: [],
  GARAGE: [],
  PHARMACIE: [],
};

// CRM Contacts
export const MOCK_CRM_CONTACTS: CRMContact[] = [];

// Super Admin Tenants
export const MOCK_TENANTS: TenantEnterprise[] = [
  {
    id: 'ent_test_01',
    name: 'Entreprise Test Immobilier',
    category: 'Immobilier',
    moduleCode: 'IMMOBILIER',
    city: 'Cotonou',
    ownerName: 'Gestionnaire Test',
    phone: '',
    subscriptionPlan: 'Enterprise',
    status: 'Actif',
    monthlyRevenue: 0,
    joinedDate: '01 Jan 2026',
  },
  {
    id: 'ent_test_02',
    name: 'Entreprise Test Guest House',
    category: 'Guest House',
    moduleCode: 'GUEST_HOUSE',
    city: 'Cotonou',
    ownerName: 'Gestionnaire Test',
    phone: '',
    subscriptionPlan: 'Pro',
    status: 'Actif',
    monthlyRevenue: 0,
    joinedDate: '01 Jan 2026',
  },
];

export const MOCK_ADMIN_USERS: AdminUserItem[] = [
  {
    id: 'usr_admin_01',
    fullName: 'Administrateur Plateforme',
    email: 'admin@flowexa.com',
    role: 'SUPER_ADMIN',
    tenantName: 'Flowexa HQ',
    status: 'Actif',
    twoFactorEnabled: true,
    lastLogin: 'En ligne',
  },
];

export const MOCK_SUBSCRIPTIONS: SubscriptionItem[] = [];

export const MOCK_PLATFORM_PAYMENTS: PlatformPayment[] = [];

export const MOCK_SYSTEM_ACTIVITIES: SystemAuditActivity[] = [
  {
    id: 'act_init',
    timestamp: 'Initialisé',
    actor: 'admin@flowexa.com',
    action: 'Initialisation du registre Flowexa',
    entity: 'Plateforme',
    status: 'SUCCESS',
    ipAddress: '127.0.0.1',
  },
];
