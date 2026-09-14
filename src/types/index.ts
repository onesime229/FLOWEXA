export type BusinessModuleCode =
  | 'IMMOBILIER'
  | 'GUEST_HOUSE'
  | 'COIFFURE'
  | 'BARBIER'
  | 'INSTITUT_COSMETIQUE'
  | 'SPA_MASSAGE'
  | 'PHOTOGRAPHE'
  | 'BRODERIE_IMPRESSION'
  | 'GARAGE'
  | 'PHARMACIE';

export interface ServiceModule {
  id: string;
  code: BusinessModuleCode;
  number: string;
  name: string;
  subtitle: string;
  category: string;
  description: string;
  accentColor: string;
  features: string[];
  sampleQuery: string;
  iconName?: string;
}

export interface SearchResult {
  title: string;
  category: string;
  location: string;
  price: string;
  rating: number;
  businessName: string;
  badgeText: string;
}

export type RoleType = 'SUPER_ADMIN' | 'BUSINESS_OWNER' | 'MANAGER' | 'EMPLOYEE' | 'CLIENT';

export type VerificationStatus = 'NON_VERIFIE' | 'EN_ATTENTE' | 'VERIFIE' | 'SUSPENDU';

export interface UserProfile {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  birthDate?: string; // YYYY-MM-DD ou MM-DD
  notificationPreferences?: UserNotificationPreferences;
  initials: string;
  role: RoleType;
  tenantName: string;
  businessName?: string;
  businessId?: string;
  activeBusinessModule: BusinessModuleCode;
  avatarUrl?: string;
  verificationStatus?: VerificationStatus;
  status?: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  twoFactorEnabled?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  refreshToken?: string;
  user?: UserProfile;
  resetToken?: string;
  testCode?: string;
}

export interface RegisterClientPayload {
  type: 'CLIENT';
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  password: string;
  acceptTerms: boolean;
}

export interface RegisterBusinessPayload {
  type: 'BUSINESS';
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  businessName: string;
  moduleCode: BusinessModuleCode;
  city: string;
  district?: string;
  address?: string;
  description?: string;
  services?: string[];
  acceptTerms: boolean;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface UserSecurityOverview {
  user: UserProfile;
  activeSessionsCount: number;
  twoFactorEnabled: boolean;
  recentLogins: Array<{
    id: string;
    timestamp: string;
    ip: string;
    action: string;
    device: string;
  }>;
}

export type AuthViewMode =
  | 'LOGIN'
  | 'REGISTER'
  | 'REGISTER_CLIENT'
  | 'REGISTER_BUSINESS'
  | 'OTP'
  | 'FORGOT_PASSWORD'
  | 'RESET_PASSWORD'
  | 'ACCOUNT_VERIFICATION';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

// Client Search & Results
export interface SearchResultItem {
  id: string;
  title: string;
  moduleCode: BusinessModuleCode;
  category: string;
  location: string;
  price: number;
  priceFormatted: string;
  priceUnit?: string;
  rating: number | null; // null if no reviews yet
  reviewCount: number;
  businessName: string;
  businessPhone: string;
  businessWhatsApp: string;
  badgeText: string;
  imageUrl: string;
  description: string;
  specs: Record<string, string | number>;
  isAvailable: boolean;
  isFavorite?: boolean;
  kind?: 'catalog_item' | 'business';
  offerType?: CatalogOfferType;
  priceType?: CatalogPriceType;
  hasOwnLocation?: boolean;
  distanceKm?: number;
  distanceFormatted?: string;
  relevanceScore?: number;
  effectiveLocation?: {
    address?: string;
    city?: string;
    district?: string;
    latitude?: number;
    longitude?: number;
  };
  images?: Array<{ id: string; url: string; isCover?: boolean; title?: string }>;
  businessId?: string;
  explanations?: string[];
  isOpenNow?: boolean;
  openingHoursFormatted?: string;
}

// Pro Metrics
export interface ProTodayMetrics {
  newClients: number;
  prospects: number;
  appointments: number;
  bookings: number;
  pendingTasks: number;
  todayRevenue: number;
  revenueComparisonPercent: number;
}

// Real Estate Item
export interface PropertyItem {
  id: string;
  title: string;
  type: 'Appartement' | 'Villa' | 'Bureau' | 'Studio' | 'Terrain';
  transaction: 'Location' | 'Vente';
  price: number;
  location: string;
  surface: number;
  rooms: number;
  status: 'Disponible' | 'Loué' | 'Sous offre' | 'Travaux';
  tenantName?: string;
  imageUrl: string;
}

// Guest House Room & Booking
export interface GuestRoom {
  id: string;
  name: string;
  type: 'Standard' | 'Deluxe' | 'Suite Executive' | 'Bungalow';
  pricePerNight: number;
  capacity: number;
  floor: string;
  status: 'Disponible' | 'Occupée' | 'Nettoyage' | 'Maintenance';
  currentGuest?: string;
  imageUrl: string;
}

export interface GuestBooking {
  id: string;
  guestName: string;
  guestPhone: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmount: number;
  status: 'Confirmée' | 'En attente' | 'Check-in fait' | 'Check-out fait' | 'Annulée';
  paymentStatus: 'Payé' | 'Acompte versé' | 'En attente';
}

// Service Appointment / Order
export interface ServiceRecord {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceTitle: string;
  practitionerOrStaff: string;
  dateTime: string;
  durationMinutes: number;
  price: number;
  status: 'Confirmé' | 'En cours' | 'Terminé' | 'Annulé';
  notes?: string;
}

// Client CRM Contact
export interface CRMContact {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  stage: 'Nouveau' | 'Contacté' | 'Qualifié' | 'Proposition' | 'Gagné' | 'Perdu';
  relationType: 'Prospect' | 'Client actif' | 'VIP';
  lifetimeValue: number;
  lastInteractionDate: string;
  associatedBusiness: string;
}

// SPRINT F08: Flowexa Search Funnel Types
export type SearchFunnelStep = 'QUERY' | 'COMPREHENSION' | 'RESULTS' | 'COMPARISON' | 'BOOKING';

export interface AIComprehensionData {
  originalQuery: string;
  detectedIntent: string;
  detectedModule: BusinessModuleCode;
  detectedLocation: string;
  budgetCap?: number;
  budgetCapFormatted?: string;
  timeframe: string;
  confidenceScore: number;
  extractedKeywords: string[];
}

// SPRINT F09: Flowexa AI Types
export type AIMode = 'PRO' | 'CLIENT';

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  mode: AIMode;
  chartData?: {
    type: 'bar' | 'metric';
    title: string;
    items?: { label: string; value: number; formattedValue: string }[];
    metricValue?: string;
    metricLabel?: string;
  };
  actionButtons?: {
    label: string;
    actionType: 'WHATSAPP' | 'VIEW_PROSPECT' | 'BOOK' | 'GENERATE_REPORT';
    payload?: any;
    primary?: boolean;
  }[];
  cards?: SearchResultItem[];
}

// SPRINT F10 + B29 + F29: Super Admin Types
export type SuperAdminTab =
  | 'dashboard'
  | 'entreprises'
  | 'utilisateurs'
  | 'categories'
  | 'modules'
  | 'demandes'
  | 'abonnements'
  | 'paiements'
  | 'clients'
  | 'prospects'
  | 'activite'
  | 'statistiques'
  | 'ia'
  | 'support'
  | 'securite'
  | 'avis'
  | 'conversations'
  | 'integrations'
  | 'automatisations'
  | 'communications'
  | 'settings';

export type BusinessModerationStatus =
  | 'ACTIVE'
  | 'PUBLISHED'
  | 'PENDING_REVIEW'
  | 'DRAFT'
  | 'SUSPENDED'
  | 'ARCHIVED';

export interface PlatformCategoryEntity {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  category: string;
  description: string;
  accentColor: string;
  iconName: string;
  order: number;
  isActive: boolean;
  associatedModuleCodes: string[];
  features?: string[];
  sampleQuery?: string;
  seo?: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
  };
  businessCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FlowexaPlatformSettings {
  platformName: string;
  contactEmail: string;
  supportPhone: string;
  country: string;
  defaultCurrency: string;
  allowPublicRegistrations: boolean;
  requireBusinessReview: boolean;
  reviewModerationAutoPublish: boolean;
  smsNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  whatsappNotificationsEnabled: boolean;
  defaultSearchRadiusKm: number;
  maintenanceMode: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface AdminDashboardMetrics {
  businesses: {
    total: number;
    active: number;
    pendingReview: number;
    draft: number;
    suspended: number;
    archived: number;
  };
  users: {
    total: number;
    clients: number;
    businessOwners: number;
    managers: number;
    employees: number;
    superAdmins: number;
    active: number;
    suspended: number;
  };
  requests: {
    total: number;
    demandes: number;
    bookings: number;
    appointments: number;
    pending: number;
    accepted: number;
    completed: number;
    cancelled: number;
  };
  conversations: {
    total: number;
    open: number;
    closed: number;
    messagesTotal: number;
  };
  reviews: {
    total: number;
    published: number;
    pending: number;
    hidden: number;
    rejected: number;
    reportedCount: number;
  };
  payments: {
    totalCount: number;
    totalVolume: number;
    successCount: number;
    pendingCount: number;
    failedCount: number;
    refundedCount: number;
    currency: string;
  };
  subscriptions: {
    totalCount: number;
    activeCount: number;
    pastDueCount: number;
    plansCount: number;
  };
  systemAlerts: {
    id: string;
    level: 'INFO' | 'WARNING' | 'CRITICAL';
    title: string;
    description: string;
    actionLabel?: string;
    targetTab?: SuperAdminTab;
    count?: number;
  }[];
}

export interface TenantEnterprise {
  id: string;
  name: string;
  category: string;
  moduleCode: BusinessModuleCode;
  city: string;
  ownerName: string;
  phone: string;
  subscriptionPlan: 'Starter' | 'Pro' | 'Enterprise';
  status: 'Actif' | 'En attente KYC' | 'Suspendu';
  monthlyRevenue: number;
  joinedDate: string;
}

export interface AdminUserItem {
  id: string;
  fullName: string;
  email: string;
  role: RoleType;
  tenantName: string;
  status: 'Actif' | 'Inactif' | 'Bloqué';
  twoFactorEnabled: boolean;
  lastLogin: string;
}

export interface SubscriptionItem {
  id: string;
  tenantName: string;
  plan: 'Starter' | 'Pro' | 'Enterprise';
  amountPerMonth: number;
  nextBillingDate: string;
  paymentMethod: 'MTN Mobile Money' | 'Moov Money' | 'Carte Bancaire';
  status: 'Actif' | 'En retard' | 'Annulé';
}

// SPRINT B25 + F25: Facturation Entreprise, Plans & Abonnements Flowexa
export type PlanBillingPeriod = 'MONTHLY' | 'YEARLY';
export type PlanStatus = 'ACTIVE' | 'ARCHIVED';

export interface PlanLimits {
  maxEmployees: number;
  maxServices: number;
  maxOffers: number;
  maxStorageMb: number;
}

export interface PlanFeatures {
  statistics: boolean;
  automations: boolean;
  aiCopilot: boolean;
  marketplaceAccess: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  advancedReports: boolean;
}

export interface FlowexaPlanEntity {
  id: string;
  code: 'STARTER' | 'PRO' | 'PREMIUM' | string;
  name: string;
  description: string;
  price: number;
  currency: string;
  period: PlanBillingPeriod;
  status: PlanStatus;
  limits: PlanLimits;
  features: PlanFeatures;
  recommended?: boolean;
  isPopular?: boolean;
  badgeText?: string;
  createdAt: string;
  updatedAt: string;
}

export type Plan = FlowexaPlanEntity;

export type SubscriptionStatus =
  | 'TRIAL'
  | 'PENDING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'SUSPENDED';

export interface FlowexaSubscriptionEntity {
  id: string;
  businessId: string;
  businessName: string;
  planId: string;
  planCode: string;
  planName: string;
  status: SubscriptionStatus;
  startDate: string;
  expirationDate: string;
  currentPeriodEnd?: string;
  gracePeriodEndsAt?: string;
  autoRenew: boolean;
  period: PlanBillingPeriod;
  amountPaid: number;
  currency: string;
  paymentMethod?: string;
  lastPaymentId?: string;
  lastTransactionId?: string;
  lastInvoiceId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type Subscription = FlowexaSubscriptionEntity;

export type InvoiceStatus = 'DRAFT' | 'PAID' | 'VOID' | 'PENDING';

export interface FlowexaInvoiceEntity {
  id: string;
  invoiceNumber: string;
  businessId: string;
  businessName: string;
  businessEmail?: string;
  businessPhone?: string;
  businessAddress?: string;
  subscriptionId?: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  periodStart: string;
  periodEnd: string;
  billingPeriod: PlanBillingPeriod;
  paymentId?: string;
  transactionReference?: string;
  paymentMethod?: string;
  paidAt?: string;
  issuedAt: string;
  dueDate: string;
  notes?: string;
}

export type Invoice = FlowexaInvoiceEntity;

export interface SubscriptionUsageMetrics {
  employees: { current: number; max: number; percentage: number };
  teamMembers?: { current: number; max: number; percentage: number };
  services: { current: number; max: number; percentage: number };
  offers: { current: number; max: number; percentage: number };
  catalogOffers?: { current: number; max: number; percentage: number };
  storageMb: { current: number; max: number; percentage: number };
}

export type UsageMetrics = SubscriptionUsageMetrics;

export interface PlatformPayment {
  id: string;
  reference: string;
  tenantName: string;
  clientName: string;
  amount: number;
  platformFee: number;
  gateway: 'MTN MoMo' | 'Moov Money' | 'Celtiis' | 'Carte Bancaire';
  status: 'Validé' | 'En cours' | 'Échoué';
  date: string;
}

export interface SystemAuditActivity {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
  status: 'SUCCESS' | 'WARNING' | 'ALERT';
  ipAddress: string;
}

// SPRINT B11 + F11: Common Catalog & Publication Types
export type CatalogOfferType =
  | 'SERVICE'
  | 'PRODUIT'
  | 'BIEN'
  | 'CHAMBRE'
  | 'PRESTATION'
  | 'VEHICULE_INTERVENTION';

export type CatalogPriceType =
  | 'FIXED'
  | 'PER_DAY'
  | 'PER_NIGHT'
  | 'PER_HOUR'
  | 'FROM'
  | 'CONTACT';

export type PublicationStatus = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';

export type AvailabilityStatus = 'AVAILABLE' | 'UNAVAILABLE';

export interface CatalogImageItem {
  id: string;
  url: string;
  title: string;
  isCover: boolean;
  order: number;
}

export type CatalogItemImage = CatalogImageItem;

export interface CatalogCategory {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  order: number;
}

export interface CatalogItem {
  id: string;
  businessId: string;
  businessName?: string;
  businessPhone?: string;
  businessWhatsApp?: string;
  categoryId?: string;
  categoryName?: string;
  moduleCode: BusinessModuleCode | string;
  offerType: CatalogOfferType;
  title: string;
  description: string;
  price: number;
  currency: string; // 'FCFA'
  priceType: CatalogPriceType;
  availability: AvailabilityStatus;
  status: PublicationStatus;
  images: CatalogImageItem[];
  specs: Record<string, any>;
  hasOwnLocation: boolean;
  address?: string;
  city?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  distanceFormatted?: string;
  relevanceScore?: number;
  viewsCount: number;
  inquiriesCount: number;
  createdAt: string;
  updatedAt: string;
}

// SPRINT F12 & SPRINT B15: Request & Booking Types
export type InteractionType = 'CONTACT_ONLY' | 'REQUEST' | 'APPOINTMENT' | 'BOOKING' | 'MESSAGE';
export type RequestStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'CONFIRMED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'NO_SHOW';

export interface RequestStatusHistoryEntry {
  status: RequestStatus;
  previousStatus?: RequestStatus;
  changedBy: 'CLIENT' | 'BUSINESS' | 'ADMIN' | 'EMPLOYEE' | 'SUPER_ADMIN';
  changedByUserId?: string;
  changedByName: string;
  reason?: string;
  note?: string;
  timestamp: string;
}

export interface FlowexaRequestItem {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  businessId: string;
  businessName: string;
  businessPhone?: string;
  moduleCode: string;
  catalogItemId?: string;
  catalogItemTitle?: string;
  catalogItemPrice?: number;
  catalogItemCurrency?: string;
  catalogItemImage?: string;
  offerType?: string;
  interactionType: InteractionType;
  bookingId?: string;
  title: string;
  message: string;
  requestedDate?: string;
  requestedTime?: string;
  endDate?: string;
  guestsCount?: number;
  location?: string;
  // SPRINT B15 fields:
  lockedPrice?: number; // Snapshot contractuel immuable
  lockedCurrency?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  durationMinutes?: number;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  cancellationReason?: string;
  cancelledBy?: 'CLIENT' | 'BUSINESS' | 'ADMIN';
  startedAt?: string;
  completedAt?: string;
  conversationId?: string;
  // SPRINT B16 + B17 fields:
  paymentStatus?: PaymentStatus | 'PAID' | 'UNPAID' | 'PARTIALLY_PAID';
  paymentId?: string;
  paidAmount?: number;
  remainingAmount?: number;
  depositAmount?: number;
  depositPercentage?: number;
  depositAllowed?: boolean;
  paymentReference?: string;
  refundAmount?: number;
  refundReason?: string;
  status: RequestStatus;
  statusHistory?: RequestStatusHistoryEntry[];
  responseNote?: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationChannel = 'INTERNAL' | 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH';
export type NotificationRecipientType = 'BUSINESS' | 'CLIENT' | 'ADMIN';
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type NotificationCategory =
  | 'APPOINTMENTS'
  | 'BOOKINGS'
  | 'MESSAGES'
  | 'PAYMENTS'
  | 'REVIEWS'
  | 'DEMANDES'
  | 'MARKETPLACE'
  | 'SUBSCRIPTIONS'
  | 'SECURITY'
  | 'MARKETING'
  | 'PROMOTIONS'
  | 'ANNIVERSAIRE'
  | 'LOYALTY'
  | 'SYSTEM';

export type CommunicationStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'CANCELLED';

export type ConsentChannel = 'WHATSAPP' | 'SMS' | 'EMAIL' | 'PUSH';
export type ConsentCategory = 'TRANSACTIONNEL' | 'MARKETING';

export interface ConsentEntity {
  id: string;
  userId: string;
  channel: ConsentChannel;
  category: ConsentCategory;
  granted: boolean;
  grantedAt: string;
  revokedAt?: string | null;
  source: string;
}

export interface ChannelPreferences {
  inApp: boolean;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  push: boolean;
}

export interface MarketingChannelPreferences {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  push: boolean;
}

export interface CategoryPreferences {
  // Catégories transactionnelles : NON DÉSACTIVABLES
  appointments: boolean;
  bookings: boolean;
  messages: boolean;
  payments: boolean;
  security: boolean;
  // Autres
  reviews?: boolean;
  marketplace?: boolean;
  subscriptions?: boolean;
  loyalty?: boolean;
  // Catégories marketing : DÉSACTIVABLES (par canal)
  marketing: boolean;
  promotions: boolean;
  anniversaire: boolean;
}

export interface NotificationPreferences {
  channels: ChannelPreferences;
  categories: CategoryPreferences;
  marketingChannels?: MarketingChannelPreferences;
  marketingByChannel?: {
    promotions?: Partial<MarketingChannelPreferences>;
    anniversaire?: Partial<MarketingChannelPreferences>;
    marketing?: Partial<MarketingChannelPreferences>;
  };
}

export interface UserNotificationPreferences {
  appointmentReminders?: boolean;
  bookingReminders?: boolean;
  messages?: boolean;
  promotions?: boolean;
  paymentReminders?: boolean;
  email?: boolean;
  sms?: boolean;
  whatsapp?: boolean;
  marketing?: boolean;
  channels?: Partial<ChannelPreferences>;
  categories?: Partial<CategoryPreferences>;
}

export interface FlowexaNotificationItem {
  id: string;
  recipientType: NotificationRecipientType;
  recipientId: string;
  recipientName?: string;
  title: string;
  message: string;
  category?: NotificationCategory;
  requestId?: string;
  interactionType?: InteractionType;
  channel: NotificationChannel;
  deliveryChannels?: NotificationChannel[];
  priority: NotificationPriority;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
  createdAt: string;
}

export interface CommunicationLog {
  id: string;
  recipientId: string;
  recipientType: NotificationRecipientType;
  recipientName?: string;
  recipientContact?: string;
  channel: NotificationChannel;
  category: NotificationCategory;
  title: string;
  message: string;
  eventId?: string;
  eventType?: string;
  status: CommunicationStatus;
  provider: string;
  providerRef?: string;
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
  retryCount: number;
  maxRetries: number;
  tenantId?: string;
  priority: NotificationPriority;
  metadata?: Record<string, any>;
}

export interface CommunicationProviderStatus {
  channel: NotificationChannel;
  providerName: string;
  isConfigured: boolean;
  isEnabled: boolean;
  details: string;
  lastUsedAt?: string;
}

export interface CommunicationStats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
  byChannel: {
    inApp: number;
    email: number;
    sms: number;
    whatsapp: number;
    push: number;
  };
  providers: CommunicationProviderStatus[];
}

// ==============================================================
// SPRINT B13 + F13: FAVORIS, AVIS, NOTATION & CONFIANCE
// ==============================================================

export interface FavoriteItem {
  id: string;
  clientId: string;
  businessId?: string;
  catalogItemId?: string;
  createdAt: string;
  // Hydrated data (optional for enriched views)
  business?: {
    id: string;
    name: string;
    phone: string;
    whatsapp: string;
    city: string;
    district: string;
    address: string;
    module_code: string;
    image?: string;
  };
  catalogItem?: {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    priceType: string;
    offerType: string;
    city?: string;
    district?: string;
    image?: string;
    moduleCode: string;
    businessId: string;
    businessName: string;
  };
}

export type ReviewStatus = 'PENDING' | 'PUBLISHED' | 'HIDDEN' | 'REJECTED';

export type ReviewReportReason =
  | 'SPAM'
  | 'INAPPROPRIATE'
  | 'FALSE_INFO'
  | 'OFFENSIVE'
  | 'OTHER';

export type ReviewReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface ReviewReportItem {
  id: string;
  reviewId: string;
  reporterId: string;
  reporterName: string;
  reason: ReviewReportReason;
  details: string;
  status: ReviewReportStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ReviewItem {
  id: string;
  // Client details
  clientId: string;
  clientName: string;
  clientPhone: string;
  // Business details
  businessId: string;
  businessName: string;
  // Catalog item details (optional)
  catalogItemId?: string;
  catalogItemTitle?: string;
  // Completed interaction details
  requestId: string;
  interactionType?: InteractionType;
  // Rating & Feedback (1 to 5)
  rating: number;
  comment: string;
  // Moderation status
  status: ReviewStatus;
  statusReason?: string;
  moderatedAt?: string;
  moderatedBy?: string;
  // Reports
  reportCount: number;
  reports?: ReviewReportItem[];
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface RatingSummary {
  averageRating: number | null; // null if no published reviews
  reviewCount: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// ==============================================================
// SPRINT B14 + F14: MESSAGERIE & CONVERSATIONS CLIENT/ENTREPRISE
// ==============================================================

export type ConversationStatus = 'ACTIVE' | 'CLOSED';
export type MessageSenderRole = 'CLIENT' | 'BUSINESS' | 'SUPER_ADMIN';

export interface MessageAttachment {
  id: string;
  url: string;
  name: string;
  type: string;
  size?: number;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderRole: MessageSenderRole;
  senderId: string;
  senderName: string;
  content: string;
  isRead: boolean;
  readAt?: string;
  attachments?: MessageAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationItem {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  businessId: string;
  businessName: string;
  businessPhone?: string;
  moduleCode?: string;

  // Liens contextuels (Zéro fiction : données réelles existantes uniquement)
  requestId?: string;
  bookingId?: string;
  appointmentId?: string;
  catalogItemId?: string;
  catalogItemTitle?: string;
  catalogItemPrice?: number;
  catalogItemCurrency?: string;
  catalogItemImage?: string;
  contextType?: 'DIRECT' | 'OFFER' | 'REQUEST' | 'BOOKING' | 'APPOINTMENT';

  status: ConversationStatus;
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageSender?: MessageSenderRole;
  unreadCountClient: number;
  unreadCountBusiness: number;

  closedAt?: string;
  closedBy?: string;
  createdAt: string;
  updatedAt: string;
  messages?: MessageItem[];
}

// ==============================================================
// SPRINT B16 + B17 + F17: PAIEMENTS, TRANSACTIONS, ACOMPTES, HISTORIQUE & REMBOURSEMENT
// ==============================================================

export type PaymentProviderCode = 'KKIAPAY' | 'MTN_MOMO' | 'MOOV_MONEY' | 'CELTIS_CASH' | 'CARD_VISA_MC';

export type PaymentType = 'FULL' | 'DEPOSIT' | 'BALANCE' | 'REFUND';

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'PAID'
  | 'UNPAID'
  | 'PARTIALLY_PAID'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type TransactionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export interface FlowexaPaymentItem {
  id: string;
  bookingId?: string;
  requestId?: string;
  appointmentId?: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  businessId: string;
  businessName: string;
  amount: number;
  currency: string;
  provider: PaymentProviderCode;
  status: PaymentStatus;
  paymentType: PaymentType;
  amountTotal?: number;
  amountPaid?: number;
  amountRemaining?: number;
  reference: string;
  idempotencyKey?: string;
  notes?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: string;
  refundedBy?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export interface FlowexaTransactionItem {
  id: string;
  paymentId: string;
  bookingId?: string;
  requestId?: string;
  appointmentId?: string;
  businessId: string;
  businessName?: string;
  clientId: string;
  clientName?: string;
  clientPhone?: string;
  provider: PaymentProviderCode;
  paymentMethod?: string;
  externalReference?: string;
  providerReference?: string;
  transactionReference?: string;
  status: TransactionStatus;
  amount: number;
  currency: string;
  paymentType?: PaymentType;
  amountTotal?: number;
  amountPaid?: number;
  amountRemaining?: number;
  errorMessage?: string;
  parentTransactionId?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: string;
  refundedBy?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  paidAt?: string;
}

// ==============================================================
// SPRINT B18 + F18: BUSINESS INTELLIGENCE & ANALYTICS
// ==============================================================

export type AnalyticsPeriod = 'TODAY' | '7D' | '30D' | '3M' | '12M' | 'ALL';

export interface BusinessHealthScore {
  overall: number; // 0 to 100
  profileScore: number; // 0 to 100
  activityScore: number; // 0 to 100
  reputationScore: number; // 0 to 100
  responsivenessScore: number; // 0 to 100
  financialScore: number; // 0 to 100
  profileCompletenessPercent: number; // 0 to 100
  missingProfileFields: string[];
  summary: string;
}

export interface TopClientItem {
  clientId: string;
  clientName: string;
  clientPhone: string;
  totalPaid: number;
  completedInteractions: number;
  totalRequests: number;
  firstInteractionDate?: string;
  lastInteractionDate?: string;
}

export interface ClientOfTheYear {
  client?: TopClientItem | null;
  isEligible: boolean;
  reason: string;
}

export interface TopServiceItem {
  catalogItemId?: string;
  serviceTitle: string;
  requestCount: number;
  completedCount: number;
  totalRevenue: number;
}

export interface TimeSeriesDataPoint {
  periodLabel: string;
  date: string;
  requestsCount: number;
  bookingsCount: number;
  revenue: number;
}

export interface ConversionFunnel {
  totalRequests: number;
  acceptedRequests: number;
  acceptanceRate: number; // %
  bookingsCount: number;
  bookingRate: number; // %
  completedInteractions: number;
  completionRate: number; // %
  finalConversionRate: number; // %
}

export interface ReviewsAnalytics {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface SmartAlertItem {
  id: string;
  type: 'INCREASE' | 'DECREASE' | 'MILESTONE' | 'WARNING' | 'INFO';
  message: string;
  detail?: string;
  comparisonLabel?: string;
}

export interface BusinessAnalyticsEvolutionItem {
  previousValue: number;
  currentValue: number;
  growthPercent: number | null;
  growthLabel: string;
  hasPreviousData: boolean;
  status: 'INCREASE' | 'DECREASE' | 'STABLE' | 'INSUFFICIENT_DATA';
}

export interface BusinessAnalyticsActivityByDay {
  dayName: string;
  dayIndex: number;
  count: number;
  percentage: number;
}

export interface BusinessAnalyticsActivityByHour {
  slot: string;
  count: number;
  percentage: number;
}

export interface BusinessAnalyticsLocationItem {
  location: string;
  count: number;
  percentage: number;
}

export interface BusinessAnalyticsResponse {
  businessId: string;
  businessName: string;
  period: AnalyticsPeriod;
  currency: string;
  revenue: {
    grossRevenue: number;
    refundedAmount: number;
    netRevenue: number;
    confirmedPaymentsCount: number;
    pendingPaymentsCount: number;
    failedPaymentsCount: number;
    refundsCount: number;
  };
  evolution: {
    revenue: BusinessAnalyticsEvolutionItem;
    requests: BusinessAnalyticsEvolutionItem;
  };
  requests: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    cancelled: number;
    completed: number;
    acceptanceRate: number | null;
    acceptanceRateLabel: string;
  };
  bookings: {
    total: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  appointments: {
    scheduled: number;
    completed: number;
    cancelled: number;
    upcoming: number;
  };
  customers: {
    newCustomersCount: number;
    activeCustomersCount: number;
    returningCustomersCount: number;
    averageOrderValue: number;
    averageInteractionsPerCustomer: number;
  };
  topCustomers: TopClientItem[];
  clientOfTheYear: ClientOfTheYear;
  topServices: TopServiceItem[];
  topServicesByDemand: TopServiceItem[];
  topServicesByRevenue: TopServiceItem[];
  funnel: ConversionFunnel;
  timeSeries: TimeSeriesDataPoint[];
  activityByDay: BusinessAnalyticsActivityByDay[];
  peakDay: { dayName: string; count: number; percentage: number } | null;
  activityByHour: BusinessAnalyticsActivityByHour[];
  peakHour: { slot: string; count: number; percentage: number } | null;
  locations: BusinessAnalyticsLocationItem[];
  topLocation: { location: string; count: number } | null;
  reviews: ReviewsAnalytics;
  satisfactionRate: number | null;
  satisfactionRateLabel: string;
  healthScore: BusinessHealthScore;
  averageResponseTimeMinutes?: number | null;
  averageResponseTimeLabel: string;
  alerts: SmartAlertItem[];
  insights: string[];
  prediction?: AIPrediction | null;
  subscriptionSummary?: {
    planName: string;
    status: string;
    expiresAt?: string;
    usagePercentage?: number;
  } | null;
  hasSufficientData: boolean;
}

export interface SuperAdminAnalyticsResponse {
  period: AnalyticsPeriod;
  totalBusinesses: number;
  activeBusinesses: number;
  totalClients: number;
  totalRequests: number;
  totalBookings: number;
  totalAppointments: number;
  financialMetrics: {
    totalGrossVolume: number;
    totalRefunded: number;
    netVolume: number;
    totalTransactions: number;
    currency: string;
  };
  reviewsMetrics: {
    totalReviews: number;
    globalAverageRating: number;
  };
  businessesByModule: Array<{
    moduleCode: string;
    count: number;
    revenue: number;
  }>;
  timeSeries: TimeSeriesDataPoint[];
}

// ==============================================================
// SPRINT B19 + F19: AUTOMATISATION INTELLIGENTE, RAPPELS, RELANCES & ALERTES
// ==============================================================

export type AutomationRuleType =
  | 'APPOINTMENT_REMINDER'
  | 'BOOKING_REMINDER'
  | 'REQUEST_PENDING_FOLLOWUP'
  | 'REQUEST_ACCEPTED_CLIENT_FOLLOWUP'
  | 'PAYMENT_BALANCE_REMINDER'
  | 'CLIENT_BIRTHDAY'
  | 'BUSINESS_ALERT';

export type AutomationExecutionStatus = 'SENT' | 'FAILED' | 'CANCELLED' | 'SKIPPED';

export interface BirthdayOfferConfig {
  discountPercentage?: number;
  fixedDiscountAmount?: number;
  giftDescription?: string;
  customMessage?: string;
  validityDays?: number;
}

export interface AutomationRule {
  id: string;
  businessId: string;
  ruleType: AutomationRuleType;
  name: string;
  description: string;
  isEnabled: boolean;
  triggerHoursBefore?: number[]; // ex: [24, 2] pour RDV
  triggerHoursAfter?: number;    // ex: 24 pour demande en attente
  channels: NotificationChannel[];
  priority: NotificationPriority;
  customMessageTemplate?: string;
  birthdayOffer?: BirthdayOfferConfig;
  thresholdCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationHistoryItem {
  id: string;
  businessId: string;
  businessName?: string;
  ruleId: string;
  ruleType: AutomationRuleType;
  idempotencyKey: string;
  recipientType: NotificationRecipientType;
  recipientId: string;
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  targetEntityType: 'REQUEST' | 'BOOKING' | 'APPOINTMENT' | 'CLIENT' | 'BUSINESS';
  targetEntityId: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  channel: NotificationChannel;
  status: AutomationExecutionStatus;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  executedAt: string;
}

export interface AutomationRunSummary {
  rulesEvaluated: number;
  actionsTriggered: number;
  sentCount: number;
  skippedCount: number;
  failedCount: number;
  timestamp: string;
  details: string[];
}

export interface BusinessAutomationStats {
  activeRulesCount: number;
  totalRulesCount: number;
  totalSentCount: number;
  sentTodayCount: number;
  failedCount: number;
  upcomingRemindersCount: number;
}

export type AutomationRuleEntity = AutomationRule;
export type AutomationHistoryEntity = AutomationHistoryItem;

// ==========================================
// SPRINT B20 + F20: IA FLOWEXA - ASSISTANT, RECOMMANDATIONS, PRÉDICTIONS & INSIGHTS
// ==========================================

export interface RecommendationExplanation {
  reasons: string[];
  distanceKm?: number;
  isAvailableToday?: boolean;
  isWithinBudget?: boolean;
  isFavorite?: boolean;
  rating?: number;
  reviewCount?: number;
}

export interface SmartSearchFilter {
  category?: string;
  moduleCode?: BusinessModuleCode;
  city?: string;
  district?: string;
  maxPrice?: number;
  minPrice?: number;
  availableToday?: boolean;
  openNow?: boolean;
  needType?: string;
  transactionType?: 'RENTAL' | 'SALE';
  propertyType?: string;
  serviceType?: string;
  radiusKm?: number;
  keywords: string[];
}

export interface AIRecommendationItem {
  id: string;
  title: string;
  businessId: string;
  businessName: string;
  businessPhone?: string;
  businessWhatsApp?: string;
  moduleCode: BusinessModuleCode;
  category: string;
  location: string;
  city: string;
  district?: string;
  address?: string;
  price: number;
  priceFormatted: string;
  priceUnit?: string;
  rating?: number | null;
  reviewCount: number;
  isFavorite?: boolean;
  distanceKm?: number;
  distanceFormatted?: string;
  availableToday: boolean;
  isOpenNow?: boolean;
  openingHours?: Record<string, string>;
  openingHoursFormatted?: string;
  score: number;
  explanations: string[];
  highlightBadge?: string;
  imageUrl?: string;
  kind?: 'catalog_item' | 'business';
  offerType?: string;
  specs?: Record<string, any>;
  description?: string;
}

export interface AIOpportunity {
  id: string;
  type: 'HIGH_DEMAND_OFFER' | 'CONVERSION_OPPORTUNITY' | 'RETURNING_CLIENTS' | 'GROWTH_TREND';
  title: string;
  description: string;
  metric?: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedAction: string;
  entityId?: string;
}

export interface AIProblemAlert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  type: 'OVERDUE_REQUESTS' | 'LOW_ACCEPTANCE_RATE' | 'CANCELLATION_SPIKE' | 'SLOW_RESPONSE' | 'PAYMENT_FAILURE';
  title: string;
  description: string;
  metric?: string;
  suggestedAction: string;
}

export interface AIPrediction {
  businessId: string;
  metric: 'REVENUE' | 'DEMAND';
  hasEnoughData: boolean;
  currentPeriodValue: number;
  estimatedRange: [number, number];
  estimatedFormatted: string;
  trend: 'UP' | 'STABLE' | 'DOWN';
  confidenceLabel: string;
  methodology: string;
  disclaimer: string;
}

export interface AICustomerSegment {
  loyalClients: {
    clientId: string;
    clientName: string;
    clientPhone?: string;
    totalSpent: number;
    totalInteractions: number;
    lastInteractionDate: string;
  }[];
  atRiskClients: {
    clientId: string;
    clientName: string;
    clientPhone?: string;
    daysSinceLastActivity: number;
    previousInteractions: number;
    suggestedAction: string;
  }[];
}

export interface AIBusinessInsights {
  businessId: string;
  healthScore: {
    score: number;
    interpretation: string;
    recommendations: string[];
  };
  opportunities: AIOpportunity[];
  alerts: AIProblemAlert[];
  predictions: AIPrediction;
  customerSegments: AICustomerSegment;
  lastAnalysisTimestamp: string;
}

export interface AIAssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  recommendations?: AIRecommendationItem[];
  suggestedQuestions?: string[];
  dataReferences?: { label: string; value: string }[];
}

// ============================================================================
// MARKETPLACE FLOWEXA TYPES & INTERFACES (Sprint Marketplace)
// ============================================================================

export type MarketplaceRequestStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'MATCHING'
  | 'RESPONSES_RECEIVED'
  | 'ACCEPTED'
  | 'CONVERTED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'COMPLETED';

export type MarketplaceResponseStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CONVERTED';

export interface MarketplaceRequestEntity {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  category: string;
  moduleCode?: BusinessModuleCode;
  title: string;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  radiusKm: number;
  budgetMin?: number;
  budgetMax?: number;
  desiredDate?: string;
  status: MarketplaceRequestStatus;
  responsesCount?: number;
  selectedResponseId?: string;
  convertedRequestId?: string;
  convertedBookingId?: string;
  conversationId?: string;
  cancellationReason?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceResponseEntity {
  id: string;
  marketplaceRequestId: string;
  businessId: string;
  businessName: string;
  businessPhone?: string;
  businessCity?: string;
  businessDistrict?: string;
  catalogItemId?: string;
  catalogItemTitle?: string;
  message: string;
  proposedPrice: number;
  availableDate: string;
  status: MarketplaceResponseStatus;
  distanceKm?: number;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceMatchResult {
  businessId: string;
  businessName: string;
  moduleCode: BusinessModuleCode;
  city: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  rating: number;
  reviewCount: number;
  isOpenNow: boolean;
  matchingScore: number;
  matchReasons: string[];
  eligibleCatalogItems: {
    id: string;
    title: string;
    price: number;
    currency: string;
    availability: string;
  }[];
}

export interface MarketplaceStats {
  totalPublished: number;
  totalResponses: number;
  responseRate: number;
  totalConverted: number;
  conversionRate: number;
  activeBusinessesCount: number;
  mostActiveBusinesses: {
    businessId: string;
    businessName: string;
    responseCount: number;
    acceptedCount: number;
  }[];
}

// ==========================================
// SPRINT B22 + F22: COCKPIT ENTREPRISE PRO
// ==========================================

export interface BusinessTeamMember {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone: string;
  role: 'MANAGER' | 'EMPLOYEE';
  status: 'ACTIVE' | 'INACTIVE';
  permissions: {
    canViewRequests: boolean;
    canManageAppointments: boolean;
    canViewClients: boolean;
    canViewStats: boolean;
    canManageCatalog: boolean;
  };
  assignedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessTask {
  id: string;
  businessId: string;
  title: string;
  dueDate?: string;
  dueTime?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  done: boolean;
  status?: string;
  relatedClientId?: string;
  relatedClientName?: string;
  relatedRequestId?: string;
  assignedToEmployeeId?: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
}

export type BusinessTaskItem = BusinessTask;

export interface BusinessClientSummary {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationType: 'NOUVEAU' | 'RÉCURRENT' | 'VIP';
  totalRequests: number;
  totalBookings: number;
  totalAppointments: number;
  totalPaid: number;
  lastInteractionDate: string;
  lastStatus: string;
  pendingRequestsCount: number;
}

export interface BusinessClientDetail extends BusinessClientSummary {
  requests: any[];
  payments: any[];
  reviews: any[];
  conversationId?: string;
}

export interface BusinessCalendarEvent {
  id: string;
  requestId: string;
  type: 'APPOINTMENT' | 'BOOKING' | 'VISIT';
  title: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  date: string;
  time?: string;
  endDate?: string;
  status: string;
  serviceTitle?: string;
  price?: number;
  currency?: string;
  paymentStatus?: string;
  assignedEmployeeName?: string;
}

export interface BusinessTodayAction {
  id: string;
  type: 'PENDING_REQUEST' | 'TODAY_APPOINTMENT' | 'TODAY_BOOKING' | 'PENDING_PAYMENT' | 'UNREAD_MESSAGE' | 'PENDING_TASK';
  title: string;
  subtitle: string;
  priority: 'HIGH' | 'MEDIUM' | 'NORMAL';
  actionLabel: string;
  actionTarget: 'demandes' | 'messages' | 'calendrier' | 'finances';
  targetId?: string;
  time?: string;
}

export interface BusinessActivityEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  entityId?: string;
  status?: string;
}

export interface BusinessCockpitMetrics {
  pendingRequestsCount: number;
  todayAppointmentsCount: number;
  todayBookingsCount: number;
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  pendingPaymentsCount: number;
  pendingPaymentsAmount: number;
  unreadMessagesCount: number;
  verifiedReviewsCount: number;
  averageRating: number;
  activeClientsCount: number;
  openTasksCount: number;
  revenueTrend: { day: string; date: string; amount: number }[];
  todayActions: BusinessTodayAction[];
  recentActivity: BusinessActivityEvent[];
}

// SPRINT B27 + F27: CRM, FIDÉLISATION, RELANCES, CAMPAGNES, CROISSANCE
export type ClientSegmentCode =
  | 'ALL'
  | 'NEW'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'RECURRENT'
  | 'RECENT_BOOKINGS'
  | 'ABANDONED_REQUEST'
  | 'VIP';

export interface ClientSegmentDefinition {
  code: ClientSegmentCode;
  label: string;
  description: string;
  clientCount: number;
  criteria: string;
}

export interface CRMClientItem {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  segment: ClientSegmentCode;
  totalRequests: number;
  totalBookings: number;
  totalAppointments: number;
  totalPaid: number;
  lastInteractionDate: string;
  daysSinceLastInteraction: number;
  isInactive: boolean;
  lastStatus: RequestStatus | string;
  hasActiveConsent: boolean;
  optOutChannels?: ('INTERNAL' | 'EMAIL' | 'SMS' | 'WHATSAPP')[];
  internalNotes?: string[];
  favoriteServices?: string[];
}

export interface ClientTimelineEvent {
  id: string;
  type: 'REQUEST' | 'MESSAGE' | 'BOOKING' | 'PAYMENT' | 'APPOINTMENT' | 'REVIEW' | 'CAMPAIGN_MESSAGE' | 'NOTE';
  title: string;
  description: string;
  date: string;
  status?: string;
  amount?: number;
  rating?: number;
  referenceId?: string;
}

export interface CRMClientDetailResponse extends CRMClientItem {
  timeline: ClientTimelineEvent[];
  requests: FlowexaRequestItem[];
  payments: FlowexaPaymentItem[];
  reviews: ReviewItem[];
  conversationId?: string;
  retentionStatus: 'HEALTHY' | 'AT_RISK_OF_INACTIVITY' | 'INACTIVE';
  retentionDiagnosis: string;
  suggestedAction?: {
    type: string;
    label: string;
    defaultMessage: string;
  };
}

export type CampaignStatus =
  | 'BROUILLON'
  | 'PROGRAMMÉE'
  | 'EN_COURS'
  | 'TERMINÉE'
  | 'ANNULÉE';

export type CampaignObjective =
  | 'FIDÉLISATION'
  | 'RÉACTIVATION'
  | 'NOUVELLE_OFFRE'
  | 'REMERCIEMENT'
  | 'RELANCE_DEVIS'
  | 'AUTRE';

export type CampaignChannel = 'INTERNAL' | 'EMAIL' | 'SMS' | 'WHATSAPP';

export interface FlowexaCampaignEntity {
  id: string;
  businessId: string;
  businessName: string;
  name: string;
  objective: CampaignObjective;
  targetSegment: ClientSegmentCode;
  channel: CampaignChannel;
  message: string;
  linkedOfferId?: string;
  linkedOfferTitle?: string;
  promoCode?: string;
  discountPercent?: number;
  status: CampaignStatus;
  scheduledAt?: string;
  sentAt?: string;
  recipientsCount: number;
  deliveredCount: number;
  responsesCount: number;
  conversionsCount: number;
  generatedRevenue: number;
  cost: number;
  roi?: number | null;
  createdAt: string;
  updatedAt: string;
}

export type ReminderType =
  | 'REQUEST_PENDING'
  | 'BOOKING_ABANDONED'
  | 'APPOINTMENT_FOLLOWUP'
  | 'INACTIVE_CLIENT'
  | 'PENDING_PAYMENT';

export interface ReminderSuggestion {
  id: string;
  type: ReminderType;
  title: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  reason: string;
  defaultMessage: string;
  delayDays: number;
  canSend: boolean;
  channel: 'INTERNAL' | 'WHATSAPP' | 'SMS';
  requestId?: string;
}

export type CRMReminderItem = ReminderSuggestion;

export interface GrowthMetrics {
  newClientsCount: number;
  activeClientsCount: number;
  recurrentClientsCount: number;
  inactiveClientsCount: number;
  totalRequests: number;
  totalBookings: number;
  conversionRate: number;
  activeCampaignsCount: number;
  completedCampaignsCount: number;
  campaignRevenue: number;
}

export interface GrowthOpportunity {
  id: string;
  type: 'HIGH_DEMAND_SERVICE' | 'INACTIVE_CLIENTS' | 'REPEAT_PURCHASE' | 'ABANDONED_CONVERSION';
  title: string;
  description: string;
  impactLevel: 'HIGH' | 'MEDIUM' | 'INFO';
  suggestedActionLabel: string;
  targetSegment?: ClientSegmentCode;
  draftCampaign?: {
    name: string;
    message: string;
    objective: CampaignObjective;
  };
}

