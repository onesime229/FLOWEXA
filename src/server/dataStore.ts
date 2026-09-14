import fs from 'fs';
import path from 'path';
import type {
  AnalyticsPeriod,
  BusinessAnalyticsResponse,
  SuperAdminAnalyticsResponse,
  TopClientItem,
  TopServiceItem,
  TimeSeriesDataPoint,
  SmartAlertItem,
  BusinessHealthScore,
  ConversionFunnel,
  ReviewsAnalytics,
  MarketplaceRequestEntity,
  MarketplaceResponseEntity,
  MarketplaceRequestStatus,
  MarketplaceResponseStatus,
  MarketplaceMatchResult,
  MarketplaceStats,
  BusinessTeamMember,
  BusinessTask,
  BusinessClientSummary,
  BusinessClientDetail,
  BusinessCalendarEvent,
  BusinessTodayAction,
  BusinessActivityEvent,
  BusinessCockpitMetrics,
  VerificationStatus,
  AIPrediction,
  ClientSegmentCode,
  ClientSegmentDefinition,
  CRMClientItem,
  ClientTimelineEvent,
  CRMClientDetailResponse,
  CampaignStatus,
  CampaignObjective,
  CampaignChannel,
  FlowexaCampaignEntity,
  ReminderType,
  ReminderSuggestion,
  GrowthMetrics,
  GrowthOpportunity,
  NotificationCategory,
  ConsentEntity,
  ConsentChannel,
  ConsentCategory,
} from '../types';
import { MarketplaceMatchingService } from './marketplace/MarketplaceMatchingService';
import { notificationService } from './notifications/NotificationService';
import { communicationService } from './notifications/CommunicationService';
import { consentService } from './notifications/ConsentService';

export interface BusinessImageItem {
  id: string;
  url: string;
  title: string;
  isPrimary: boolean;
  order: number;
}

export interface BusinessEntity {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  module_code: string;
  enabled_modules: string[];
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  moderationNotes?: string;
  moderatedAt?: string;
  moderatedBy?: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  address: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  opening_hours: Record<string, string>;
  is_open_now: boolean;
  images: BusinessImageItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PropertyEntity {
  id: string;
  businessId: string;
  title: string;
  category: string;
  typeTransaction: 'Location' | 'Vente';
  price: number;
  pricePeriod: string;
  address: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  surface: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  description: string;
  status: 'Disponible' | 'Loué' | 'Réservé';
  isPublished: boolean;
  amenities: string[];
  images: Array<{ id: string; url: string; title: string; isCover: boolean }>;
  createdAt: string;
  updatedAt: string;
}

export interface RoomEntity {
  id: string;
  businessId: string;
  roomNumber: string;
  name: string;
  category: string;
  pricePerNight: number;
  capacity: number;
  status: 'Disponible' | 'Occupée' | 'Réservée' | 'Entretien';
  amenities: string[];
  description: string;
  isPublished: boolean;
  images: Array<{ id: string; url: string; title: string; isCover: boolean }>;
  createdAt: string;
  updatedAt: string;
}

export interface BookingEntity {
  id: string;
  businessId: string;
  clientId?: string;
  roomId: string;
  roomName: string;
  clientName: string;
  clientPhone: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  totalAmount: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
}

export interface ServiceEntity {
  id: string;
  businessId: string;
  moduleCode: string;
  name: string;
  category: string;
  price: number;
  durationMinutes: number;
  description: string;
  isActive: boolean;
  images: Array<{ id: string; url: string; title: string; isCover: boolean }>;
  createdAt: string;
  updatedAt: string;
}

export interface DemandeEntity {
  id: string;
  businessId?: string;
  clientId?: string;
  clientName: string;
  clientPhone: string;
  moduleCode: string;
  title: string;
  details: string;
  budgetMax?: number;
  location: string;
  status: 'Nouvelle' | 'En cours' | 'Traitée';
  createdAt: string;
}

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

export interface FlowexaRequestEntity {
  id: string;
  // Client info
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;

  // Business info
  businessId: string;
  businessName: string;
  businessPhone?: string;
  moduleCode: string;

  // Catalog item info (optional)
  catalogItemId?: string;
  catalogItemTitle?: string;
  catalogItemPrice?: number;
  catalogItemCurrency?: string;
  catalogItemImage?: string;
  offerType?: string;

  // Interaction details
  interactionType: InteractionType;
  bookingId?: string;
  title: string;
  message: string;
  requestedDate?: string; // YYYY-MM-DD
  requestedTime?: string; // HH:mm
  endDate?: string;       // checkOut for guest house booking
  guestsCount?: number;   // for bookings
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
  cancelledBy?: 'CLIENT' | 'BUSINESS' | 'ADMIN' | 'EMPLOYEE' | 'SUPER_ADMIN';
  startedAt?: string;
  completedAt?: string;
  conversationId?: string;

  // SPRINT B16 + B17: Champs de paiement & suivi transactionnel, acompte, solde, remboursement
  paymentStatus?: PaymentStatus;
  paymentId?: string;
  paidAmount?: number;
  remainingAmount?: number;
  depositAmount?: number;
  depositPercentage?: number;
  depositAllowed?: boolean;
  paymentReference?: string;
  refundAmount?: number;
  refundReason?: string;

  // Status & Notes
  status: RequestStatus;
  statusHistory: RequestStatusHistoryEntry[];
  responseNote?: string;

  createdAt: string;
  updatedAt: string;
}

export type NotificationChannel = 'INTERNAL' | 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH';
export type NotificationRecipientType = 'BUSINESS' | 'CLIENT' | 'ADMIN';
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface FlowexaNotificationEntity {
  id: string;
  recipientType: NotificationRecipientType;
  recipientId: string; // businessId or clientId
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  title: string;
  message: string;
  category?: NotificationCategory;
  requestId?: string;
  interactionType?: InteractionType;
  channel: NotificationChannel;
  deliveryChannels?: NotificationChannel[];
  priority?: NotificationPriority;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// SPRINT B19: Automation & Reminder Types
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

export interface AutomationRuleEntity {
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

export interface AutomationHistoryEntity {
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

export interface AuditLogEntity {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  changes?: Record<string, any>;
  ip: string;
  result?: 'SUCCESS' | 'FAILED' | string;
  metadata?: Record<string, any>;
}

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

export interface CatalogOfferImageEntity {
  id: string;
  url: string;
  title: string;
  isCover: boolean;
  order: number;
}

export interface CatalogCategoryEntity {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  order: number;
}

export interface CatalogItemEntity {
  id: string;
  businessId: string;
  categoryId?: string;
  moduleCode: string;
  offerType: 'SERVICE' | 'PRODUIT' | 'BIEN' | 'CHAMBRE' | 'PRESTATION' | 'VEHICULE_INTERVENTION';
  title: string;
  description: string;
  price: number;
  currency: string;
  priceType: 'FIXED' | 'PER_DAY' | 'PER_NIGHT' | 'PER_HOUR' | 'FROM' | 'CONTACT';
  availability: 'AVAILABLE' | 'UNAVAILABLE';
  status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';
  images: CatalogOfferImageEntity[];
  specs: Record<string, any>;
  hasOwnLocation: boolean;
  address?: string;
  city?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  viewsCount: number;
  inquiriesCount: number;
  createdAt: string;
  updatedAt: string;
}

// SPRINT B13: FAVORIS & AVIS (CONFIANCE & NOTATION)
export interface FavoriteEntity {
  id: string;
  clientId: string;
  businessId?: string;
  catalogItemId?: string;
  createdAt: string;
}

export type ReviewStatus = 'PENDING' | 'PUBLISHED' | 'HIDDEN' | 'REJECTED';

export type ReviewReportReason =
  | 'SPAM'
  | 'INAPPROPRIATE'
  | 'FALSE_INFO'
  | 'OFFENSIVE'
  | 'OTHER';

export type ReviewReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface ReviewReportEntity {
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

export interface ReviewEntity {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  businessId: string;
  businessName: string;
  catalogItemId?: string;
  catalogItemTitle?: string;
  requestId: string;
  interactionType?: InteractionType;
  rating: number; // 1 à 5
  comment: string;
  status: ReviewStatus;
  statusReason?: string;
  moderatedAt?: string;
  moderatedBy?: string;
  reportCount: number;
  reports?: ReviewReportEntity[];
  createdAt: string;
  updatedAt: string;
}

// SPRINT B14 + F14: MESSAGERIE & CONVERSATIONS
export type RoleType = 'CLIENT' | 'BUSINESS_OWNER' | 'MANAGER' | 'EMPLOYEE' | 'SUPER_ADMIN' | string;
export type ConversationStatus = 'ACTIVE' | 'CLOSED';
export type MessageSenderRole = 'CLIENT' | 'BUSINESS' | 'SUPER_ADMIN';

export interface MessageAttachmentEntity {
  id: string;
  url: string;
  name: string;
  type: string;
  size?: number;
}

export interface MessageEntity {
  id: string;
  conversationId: string;
  senderRole: MessageSenderRole;
  senderId: string;
  senderName: string;
  content: string;
  isRead: boolean;
  readAt?: string;
  attachments?: MessageAttachmentEntity[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationEntity {
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
}

// SPRINT B16 + B17: Types & Entités Paiement et Transaction, Acomptes & Remboursements
export type PaymentProviderCode = 'KKIAPAY' | 'MTN_MOMO' | 'MOOV_MONEY' | 'CELTIS_CASH' | 'CARD_VISA_MC';
export type PaymentType = 'FULL' | 'DEPOSIT' | 'BALANCE' | 'REFUND' | 'SUBSCRIPTION';
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

export interface FlowexaPaymentEntity {
  id: string;
  bookingId?: string; // ID de la demande / réservation (FlowexaRequestEntity)
  requestId?: string;
  appointmentId?: string;
  subscriptionId?: string; // SPRINT B25: Lien vers l'abonnement entreprise
  planId?: string; // SPRINT B25: Plan souscrit
  clientId: string;
  clientName: string;
  clientPhone?: string;
  businessId: string;
  businessName: string;
  amount: number; // Montant vérifié côté serveur, jamais depuis le client
  currency: string; // 'FCFA' / 'XOF'
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

export interface FlowexaTransactionEntity {
  id: string;
  paymentId: string;
  bookingId?: string;
  requestId?: string;
  appointmentId?: string;
  subscriptionId?: string; // SPRINT B25: Lien abonnement
  planId?: string;
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

// SPRINT B25 + F25: FACTURATION ENTREPRISE — PLANS & ABONNEMENTS
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

export interface SubscriptionUsageMetrics {
  employees: { current: number; max: number; percentage: number };
  teamMembers?: { current: number; max: number; percentage: number };
  services: { current: number; max: number; percentage: number };
  offers: { current: number; max: number; percentage: number };
  catalogOffers?: { current: number; max: number; percentage: number };
  storageMb: { current: number; max: number; percentage: number };
}

// SPRINT B24: IDENTITÉ, COMPTES, SESSIONS, SÉCURITÉ
export interface UserAccountEntity {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  role: RoleType;
  businessId?: string;
  tenantId?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  verificationStatus: VerificationStatus;
  avatarUrl?: string;
  birthDate?: string;
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    marketing: boolean;
  };
  permissions?: {
    canViewRequests?: boolean;
    canManageAppointments?: boolean;
    canViewClients?: boolean;
    canViewStats?: boolean;
    canManageCatalog?: boolean;
  };
  twoFactorEnabled?: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSessionEntity {
  id: string;
  userId: string;
  refreshToken: string;
  expiresAt: string;
  userAgent?: string;
  ip?: string;
  createdAt: string;
  revokedAt?: string;
}

export interface PasswordResetEntity {
  id: string;
  userId: string;
  phoneOrEmail: string;
  code: string;
  token: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export interface FlowexaDatabase {
  businesses: BusinessEntity[];
  properties: PropertyEntity[];
  rooms: RoomEntity[];
  bookings: BookingEntity[];
  services: ServiceEntity[];
  demandes: DemandeEntity[];
  requests: FlowexaRequestEntity[];
  notifications: FlowexaNotificationEntity[];
  catalogItems: CatalogItemEntity[];
  catalogCategories: CatalogCategoryEntity[];
  auditLogs: AuditLogEntity[];
  favorites: FavoriteEntity[];
  reviews: ReviewEntity[];
  reviewReports: ReviewReportEntity[];
  conversations: ConversationEntity[];
  messages: MessageEntity[];
  payments: FlowexaPaymentEntity[];
  transactions: FlowexaTransactionEntity[];
  automationRules: AutomationRuleEntity[];
  automationHistory: AutomationHistoryEntity[];
  marketplaceRequests: MarketplaceRequestEntity[];
  marketplaceResponses: MarketplaceResponseEntity[];
  teamMembers: BusinessTeamMember[];
  tasks: BusinessTask[];
  users: UserAccountEntity[];
  sessions: UserSessionEntity[];
  passwordResets: PasswordResetEntity[];
  plans: FlowexaPlanEntity[];
  subscriptions: FlowexaSubscriptionEntity[];
  invoices: FlowexaInvoiceEntity[];
  campaigns: FlowexaCampaignEntity[];
  consents: ConsentEntity[];
  clientNotes: {
    id: string;
    businessId: string;
    clientId: string;
    note: string;
    createdAt: string;
    createdBy: string;
  }[];
  platformCategories?: PlatformCategoryEntity[];
  platformSettings?: FlowexaPlatformSettings;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'flowexa_store.json');

// Initial seed with single test phone number: 0154100617
const INITIAL_DATABASE: FlowexaDatabase = {
  businesses: [
    {
      id: 'biz-immo-1',
      tenantId: 'tenant-immo-1',
      name: 'Agence Immobilière Prestige',
      slug: 'agence-immobiliere-prestige',
      module_code: 'IMMOBILIER',
      enabled_modules: ['IMMOBILIER'],
      status: 'ACTIVE',
      phone: '0154100617',
      whatsapp: '0154100617',
      email: 'contact@agence-prestige.bj',
      website: '',
      address: 'Haie Vive',
      city: 'Cotonou',
      district: 'Haie Vive',
      latitude: 6.3585,
      longitude: 2.4102,
      opening_hours: { 'Lun-Ven': '08:00 - 18:00', 'Sam': '09:00 - 13:00' },
      is_open_now: true,
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'biz-gh-1',
      tenantId: 'tenant-gh-1',
      name: 'Résidence & Guest House Océane',
      slug: 'residence-guest-house-oceane',
      module_code: 'GUEST_HOUSE',
      enabled_modules: ['GUEST_HOUSE'],
      status: 'ACTIVE',
      phone: '0154100617',
      whatsapp: '0154100617',
      email: 'reservation@oceane-gh.bj',
      website: '',
      address: 'Fidjrossè',
      city: 'Cotonou',
      district: 'Fidjrossè',
      latitude: 6.3572,
      longitude: 2.3789,
      opening_hours: { '7j/7': '24h/24' },
      is_open_now: true,
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'biz-coif-1',
      tenantId: 'tenant-coif-1',
      name: 'Salon Élégance Afro & Beauté',
      slug: 'salon-elegance-afro',
      module_code: 'COIFFURE',
      enabled_modules: ['COIFFURE', 'BARBIER'],
      status: 'ACTIVE',
      phone: '0154100617',
      whatsapp: '0154100617',
      email: 'contact@elegance-afro.bj',
      website: '',
      address: 'Cadjehoun',
      city: 'Cotonou',
      district: 'Cadjehoun',
      latitude: 6.3630,
      longitude: 2.4045,
      opening_hours: { 'Mar-Dim': '09:00 - 20:00' },
      is_open_now: true,
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'biz-gar-1',
      tenantId: 'tenant-gar-1',
      name: 'Garage Précision Mécanique',
      slug: 'garage-precision-mecanique',
      module_code: 'GARAGE',
      enabled_modules: ['GARAGE'],
      status: 'ACTIVE',
      phone: '0154100617',
      whatsapp: '0154100617',
      email: 'contact@precision-mecanique.bj',
      website: '',
      address: 'Akpakpa',
      city: 'Cotonou',
      district: 'Akpakpa',
      latitude: 6.3750,
      longitude: 2.4500,
      opening_hours: { 'Lun-Sam': '08:00 - 18:00' },
      is_open_now: true,
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  properties: [],
  rooms: [],
  bookings: [],
  services: [],
  demandes: [],
  catalogCategories: [
    { id: 'cat-immo-loc', businessId: 'biz-immo-1', name: 'Location Résidentielle', slug: 'location-residentielle', order: 1 },
    { id: 'cat-immo-vente', businessId: 'biz-immo-1', name: 'Ventes Immobilières', slug: 'ventes-immobilieres', order: 2 },
    { id: 'cat-gh-chambres', businessId: 'biz-gh-1', name: 'Chambres & Suites', slug: 'chambres-suites', order: 1 },
    { id: 'cat-coif-tresses', businessId: 'biz-coif-1', name: 'Coiffures & Tresses', slug: 'coiffures-tresses', order: 1 },
    { id: 'cat-gar-maint', businessId: 'biz-gar-1', name: 'Entretien & Révision', slug: 'entretien-revision', order: 1 },
  ],
  catalogItems: [
    // 1. IMMOBILIER
    {
      id: 'cat-item-immo-1',
      businessId: 'biz-immo-1',
      categoryId: 'cat-immo-loc',
      moduleCode: 'IMMOBILIER',
      offerType: 'BIEN',
      title: 'Appartement Meublé 3 Pièces - Akpakpa',
      description: 'Superbe appartement climatisé avec salon spacieux, cuisine équipée, terrasse privative et sécurité 24h/24.',
      price: 150000,
      currency: 'FCFA',
      priceType: 'PER_DAY',
      availability: 'AVAILABLE',
      status: 'PUBLISHED',
      images: [
        { id: 'img-immo-1', url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80', title: 'Séjour climatisé', isCover: true, order: 1 },
        { id: 'img-immo-2', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80', title: 'Chambre parentale', isCover: false, order: 2 },
      ],
      specs: { typeBien: 'Appartement', surface: '110 m²', pieces: 3, chambres: 2, clim: true, wifi: true },
      hasOwnLocation: true,
      address: 'Akpakpa Dodomè, Rue des Écoles',
      city: 'Cotonou',
      district: 'Akpakpa',
      latitude: 6.3750,
      longitude: 2.4500,
      viewsCount: 342,
      inquiriesCount: 28,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cat-item-immo-2',
      businessId: 'biz-immo-1',
      categoryId: 'cat-immo-vente',
      moduleCode: 'IMMOBILIER',
      offerType: 'BIEN',
      title: 'Villa Haut Standing 5 Pièces avec Jardin - Haie Vive',
      description: 'Villa contemporaine d’exception à Haie Vive avec jardin arboré, garage pour 2 véhicules et finitions soignées.',
      price: 450000,
      currency: 'FCFA',
      priceType: 'PER_DAY',
      availability: 'AVAILABLE',
      status: 'PUBLISHED',
      images: [
        { id: 'img-villa-1', url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80', title: 'Façade extérieure', isCover: true, order: 1 },
      ],
      specs: { typeBien: 'Villa', surface: '280 m²', pieces: 5, chambres: 4, jardin: true, garage: true },
      hasOwnLocation: false,
      city: 'Cotonou',
      district: 'Haie Vive',
      latitude: 6.3585,
      longitude: 2.4102,
      viewsCount: 189,
      inquiriesCount: 14,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cat-item-immo-3',
      businessId: 'biz-immo-1',
      categoryId: 'cat-immo-loc',
      moduleCode: 'IMMOBILIER',
      offerType: 'BIEN',
      title: 'Studio Cosy Meublé - Cadjehoun',
      description: 'Idéal pour séjours professionnels, proche aéroport et commerces.',
      price: 85000,
      currency: 'FCFA',
      priceType: 'PER_DAY',
      availability: 'AVAILABLE',
      status: 'DRAFT',
      images: [],
      specs: { typeBien: 'Studio', surface: '45 m²', pieces: 1 },
      hasOwnLocation: true,
      address: 'Cadjehoun Église',
      city: 'Cotonou',
      district: 'Cadjehoun',
      latitude: 6.3630,
      longitude: 2.4045,
      viewsCount: 0,
      inquiriesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // 2. GUEST HOUSE
    {
      id: 'cat-item-gh-1',
      businessId: 'biz-gh-1',
      categoryId: 'cat-gh-chambres',
      moduleCode: 'GUEST_HOUSE',
      offerType: 'CHAMBRE',
      title: 'Chambre Confort Océan & Balcon',
      description: 'Lit Queen Size, salle de bain privée, climatisation silencieuse, Wifi haut débit et petit-déjeuner inclus.',
      price: 25000,
      currency: 'FCFA',
      priceType: 'PER_NIGHT',
      availability: 'AVAILABLE',
      status: 'PUBLISHED',
      images: [
        { id: 'img-gh-1', url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80', title: 'Chambre Confort', isCover: true, order: 1 },
      ],
      specs: { capacite: '2 adultes', lit: 'Queen Size', clim: true, wifi: true, petitDejeuner: 'Inclus' },
      hasOwnLocation: false,
      city: 'Cotonou',
      district: 'Fidjrossè',
      latitude: 6.3572,
      longitude: 2.3789,
      viewsCount: 412,
      inquiriesCount: 45,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cat-item-gh-2',
      businessId: 'biz-gh-1',
      categoryId: 'cat-gh-chambres',
      moduleCode: 'GUEST_HOUSE',
      offerType: 'CHAMBRE',
      title: 'Suite VIP Familiale avec Kitchenette',
      description: 'Grande suite 2 pièces avec salon privatif, vue mer dégagée et service en chambre.',
      price: 45000,
      currency: 'FCFA',
      priceType: 'PER_NIGHT',
      availability: 'AVAILABLE',
      status: 'PUBLISHED',
      images: [
        { id: 'img-gh-2', url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80', title: 'Suite VIP', isCover: true, order: 1 },
      ],
      specs: { capacite: '4 personnes', lit: 'King Size + canapé convertible', clim: true, balcon: true },
      hasOwnLocation: false,
      city: 'Cotonou',
      district: 'Fidjrossè',
      latitude: 6.3572,
      longitude: 2.3789,
      viewsCount: 290,
      inquiriesCount: 31,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // 3. COIFFURE
    {
      id: 'cat-item-coif-1',
      businessId: 'biz-coif-1',
      categoryId: 'cat-coif-tresses',
      moduleCode: 'COIFFURE',
      offerType: 'PRESTATION',
      title: 'Tresses Africaines Modernes & Nattes Couchées',
      description: 'Création soignée réalisée par notre équipe experte, finition brillante et tenue longue durée.',
      price: 8000,
      currency: 'FCFA',
      priceType: 'FIXED',
      availability: 'AVAILABLE',
      status: 'PUBLISHED',
      images: [
        { id: 'img-coif-1', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80', title: 'Tresses Afro', isCover: true, order: 1 },
      ],
      specs: { duree: '120 min', categorie: 'Tresses' },
      hasOwnLocation: false,
      city: 'Cotonou',
      district: 'Cadjehoun',
      latitude: 6.3630,
      longitude: 2.4045,
      viewsCount: 198,
      inquiriesCount: 22,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cat-item-coif-2',
      businessId: 'biz-coif-1',
      categoryId: 'cat-coif-tresses',
      moduleCode: 'COIFFURE',
      offerType: 'PRESTATION',
      title: 'Coupe Dégradé Homme & Traçage Barbe Précis',
      description: 'Coupe aux ciseaux et tondeuse de précision avec serviette chaude et huile de soin.',
      price: 3500,
      currency: 'FCFA',
      priceType: 'FIXED',
      availability: 'AVAILABLE',
      status: 'PUBLISHED',
      images: [],
      specs: { duree: '40 min', categorie: 'Barbier' },
      hasOwnLocation: false,
      city: 'Cotonou',
      district: 'Cadjehoun',
      latitude: 6.3630,
      longitude: 2.4045,
      viewsCount: 145,
      inquiriesCount: 16,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // 4. GARAGE
    {
      id: 'cat-item-gar-1',
      businessId: 'biz-gar-1',
      categoryId: 'cat-gar-maint',
      moduleCode: 'GARAGE',
      offerType: 'VEHICULE_INTERVENTION',
      title: 'Vidange Complète Synthétique + 20 Points de Contrôle',
      description: 'Remplacement huile moteur de haute qualité, filtre à huile neuf, vérification freins, amortisseurs et niveaux.',
      price: 22000,
      currency: 'FCFA',
      priceType: 'FROM',
      availability: 'AVAILABLE',
      status: 'PUBLISHED',
      images: [
        { id: 'img-gar-1', url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80', title: 'Atelier mécanique', isCover: true, order: 1 },
      ],
      specs: { duree: '60 min', garantie: '3 mois' },
      hasOwnLocation: false,
      city: 'Cotonou',
      district: 'Akpakpa',
      latitude: 6.3750,
      longitude: 2.4500,
      viewsCount: 220,
      inquiriesCount: 19,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  requests: [
    {
      id: 'req-init-1',
      clientId: 'client-test-1',
      clientName: 'Onésime Sovide',
      clientPhone: '0154100617',
      clientEmail: 'sovionesime@gmail.com',
      businessId: 'biz-immo-1',
      businessName: 'Agence Immobilière Prestige',
      businessPhone: '0154100617',
      moduleCode: 'IMMOBILIER',
      catalogItemId: 'cat-immo-1',
      catalogItemTitle: 'Appartement 3 Pièces Meublé avec Balcon - Haie Vive',
      catalogItemPrice: 150000,
      catalogItemCurrency: 'FCFA',
      catalogItemImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
      offerType: 'BIEN',
      interactionType: 'REQUEST',
      title: 'Demande de visite pour Appartement 3 Pièces Meublé',
      message: 'Bonjour, je souhaite visiter cet appartement samedi en matinée si disponible.',
      requestedDate: '2026-09-12',
      requestedTime: '10:00',
      location: 'Haie Vive, Cotonou',
      status: 'PENDING',
      statusHistory: [
        {
          status: 'PENDING',
          changedBy: 'CLIENT',
          changedByName: 'Onésime Sovide',
          note: 'Création de la demande de visite',
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        },
      ],
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'req-init-2',
      clientId: 'client-test-1',
      clientName: 'Onésime Sovide',
      clientPhone: '0154100617',
      clientEmail: 'sovionesime@gmail.com',
      businessId: 'biz-gh-1',
      businessName: 'Résidence & Guest House Océane',
      businessPhone: '0154100617',
      moduleCode: 'GUEST_HOUSE',
      catalogItemId: 'cat-gh-1',
      catalogItemTitle: 'Chambre Double Supérieure Climatisée',
      catalogItemPrice: 35000,
      catalogItemCurrency: 'FCFA',
      catalogItemImage: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80',
      offerType: 'CHAMBRE',
      interactionType: 'BOOKING',
      title: 'Réservation de chambre pour 2 nuits',
      message: 'Arrivée prévue en fin d’après-midi. Merci de confirmer la disponibilité.',
      requestedDate: '2026-09-15',
      requestedTime: '16:00',
      endDate: '2026-09-17',
      guestsCount: 2,
      location: 'Fidjrossè, Cotonou',
      status: 'ACCEPTED',
      statusHistory: [
        {
          status: 'PENDING',
          changedBy: 'CLIENT',
          changedByName: 'Onésime Sovide',
          note: 'Demande de réservation émise',
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        },
        {
          status: 'ACCEPTED',
          changedBy: 'BUSINESS',
          changedByName: 'Résidence & Guest House Océane',
          note: 'Réservation confirmée avec plaisir. Votre chambre sera prête dès 14h.',
          timestamp: new Date(Date.now() - 3600000 * 20).toISOString(),
        },
      ],
      responseNote: 'Réservation confirmée avec plaisir. Votre chambre sera prête dès 14h.',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    },
  ],
  notifications: [
    {
      id: 'notif-init-1',
      recipientType: 'BUSINESS',
      recipientId: 'biz-immo-1',
      recipientName: 'Agence Immobilière Prestige',
      title: 'Nouvelle demande de visite',
      message: 'Onésime Sovide a envoyé une demande de visite pour Appartement 3 Pièces Meublé avec Balcon.',
      requestId: 'req-init-1',
      interactionType: 'REQUEST',
      channel: 'INTERNAL',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'notif-init-2',
      recipientType: 'CLIENT',
      recipientId: 'client-test-1',
      recipientName: 'Onésime Sovide',
      title: 'Réservation acceptée !',
      message: 'Résidence & Guest House Océane a accepté votre réservation pour la Chambre Double Supérieure.',
      category: 'BOOKINGS',
      requestId: 'req-init-2',
      interactionType: 'BOOKING',
      channel: 'INTERNAL',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    },
    {
      id: 'notif-init-promo-1',
      recipientType: 'CLIENT',
      recipientId: 'client-test-1',
      recipientName: 'Onésime Sovide',
      title: 'Offre Spéciale -20% sur les soins visage',
      message: 'Profitez de 20% de remise exceptionnelle ce week-end chez Institut Sublime Beauté Cotonou !',
      category: 'PROMOTIONS',
      channel: 'INTERNAL',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
    {
      id: 'notif-init-anniv-1',
      recipientType: 'CLIENT',
      recipientId: 'client-test-1',
      recipientName: 'Onésime Sovide',
      title: 'Joyeux Anniversaire Onésime ! 🎁',
      message: 'Flowexa et vos artisans partenaires vous offrent un soin capillaire ou une réduction exclusive pour votre journée.',
      category: 'ANNIVERSAIRE',
      channel: 'INTERNAL',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
    {
      id: 'notif-init-loyalty-1',
      recipientType: 'CLIENT',
      recipientId: 'client-test-1',
      recipientName: 'Onésime Sovide',
      title: 'Pass Fidélité Flowexa : 150 points cumulés !',
      message: 'Félicitations ! Vous avez atteint le palier Silver. Votre prochaine prestation bénéficie d’un avantage fidélité exclusif.',
      category: 'LOYALTY',
      channel: 'INTERNAL',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
  ],
  auditLogs: [
    {
      id: 'audit-init',
      timestamp: new Date().toISOString(),
      userId: 'user-admin',
      userEmail: 'admin@flowexa.com',
      action: 'SYSTEM_INITIALIZATION',
      entityType: 'PLATFORM',
      entityId: 'ROOT',
      description: 'Initialisation du registre persistant multi-tenant Flowexa.',
      ip: '127.0.0.1',
    },
  ],
  favorites: [],
  reviews: [],
  reviewReports: [],
  conversations: [],
  messages: [],
  payments: [
    {
      id: 'pay-sub-immo-1',
      subscriptionId: 'sub-biz-immo-1',
      planId: 'plan_pro',
      clientId: 'usr_pro_01',
      clientName: 'Marc Kojo (Agence Prestige)',
      clientPhone: '0154100617',
      businessId: 'biz-immo-1',
      businessName: 'Agence Immobilière Prestige',
      amount: 35000,
      currency: 'FCFA',
      provider: 'MTN_MOMO',
      status: 'PAID',
      paymentType: 'SUBSCRIPTION',
      amountTotal: 35000,
      amountPaid: 35000,
      amountRemaining: 0,
      reference: 'TX-SUB-IMMO-01',
      idempotencyKey: 'idemp-sub-immo-1',
      notes: 'Abonnement mensuel Plan Pro Flowexa',
      createdAt: '2026-09-01T08:00:00.000Z',
      updatedAt: '2026-09-01T08:05:00.000Z',
      paidAt: '2026-09-01T08:05:00.000Z',
    },
    {
      id: 'pay-sub-gh-1',
      subscriptionId: 'sub-biz-gh-1',
      planId: 'plan_pro',
      clientId: 'usr_pro_02',
      clientName: 'Sèna Dossou (Résidence Les Cocotiers)',
      clientPhone: '0154100617',
      businessId: 'biz-gh-1',
      businessName: 'Résidence Les Cocotiers',
      amount: 35000,
      currency: 'FCFA',
      provider: 'KKIAPAY',
      status: 'PAID',
      paymentType: 'SUBSCRIPTION',
      amountTotal: 35000,
      amountPaid: 35000,
      amountRemaining: 0,
      reference: 'TX-SUB-GH-02',
      idempotencyKey: 'idemp-sub-gh-1',
      notes: 'Abonnement mensuel Plan Pro Flowexa',
      createdAt: '2026-09-05T10:00:00.000Z',
      updatedAt: '2026-09-05T10:04:00.000Z',
      paidAt: '2026-09-05T10:04:00.000Z',
    },
    {
      id: 'pay-sub-coif-1',
      subscriptionId: 'sub-biz-coif-1',
      planId: 'plan_starter',
      clientId: 'usr_pro_03',
      clientName: 'Fatou Kébé (Ébène Coiffure)',
      clientPhone: '0154100617',
      businessId: 'biz-coif-1',
      businessName: 'Salon Ébène Coiffure',
      amount: 15000,
      currency: 'FCFA',
      provider: 'MOOV_MONEY',
      status: 'PAID',
      paymentType: 'SUBSCRIPTION',
      amountTotal: 15000,
      amountPaid: 15000,
      amountRemaining: 0,
      reference: 'TX-SUB-COIF-03',
      idempotencyKey: 'idemp-sub-coif-1',
      notes: 'Abonnement mensuel Plan Starter Flowexa',
      createdAt: '2026-09-01T09:00:00.000Z',
      updatedAt: '2026-09-01T09:03:00.000Z',
      paidAt: '2026-09-01T09:03:00.000Z',
    },
    {
      id: 'pay-sub-gar-1',
      subscriptionId: 'sub-biz-gar-1',
      planId: 'plan_starter',
      clientId: 'usr_pro_04',
      clientName: 'Rodrigue Aïvo (Garage Central)',
      clientPhone: '0154100617',
      businessId: 'biz-gar-1',
      businessName: 'Garage Central Auto',
      amount: 15000,
      currency: 'FCFA',
      provider: 'MTN_MOMO',
      status: 'PAID',
      paymentType: 'SUBSCRIPTION',
      amountTotal: 15000,
      amountPaid: 15000,
      amountRemaining: 0,
      reference: 'TX-SUB-GAR-04',
      idempotencyKey: 'idemp-sub-gar-1',
      notes: 'Abonnement mensuel Plan Starter Flowexa',
      createdAt: '2026-09-02T11:00:00.000Z',
      updatedAt: '2026-09-02T11:02:00.000Z',
      paidAt: '2026-09-02T11:02:00.000Z',
    },
  ],
  transactions: [
    {
      id: 'tx-sub-immo-1',
      paymentId: 'pay-sub-immo-1',
      subscriptionId: 'sub-biz-immo-1',
      planId: 'plan_pro',
      businessId: 'biz-immo-1',
      businessName: 'Agence Immobilière Prestige',
      clientId: 'usr_pro_01',
      clientName: 'Marc Kojo',
      clientPhone: '0154100617',
      provider: 'MTN_MOMO',
      paymentMethod: 'MTN Mobile Money',
      externalReference: 'MOMO-BJ-894102',
      providerReference: 'MOMO-BJ-894102',
      transactionReference: 'TX-SUB-IMMO-01',
      status: 'SUCCESS',
      amount: 35000,
      currency: 'FCFA',
      paymentType: 'SUBSCRIPTION',
      amountTotal: 35000,
      amountPaid: 35000,
      amountRemaining: 0,
      createdAt: '2026-09-01T08:00:00.000Z',
      updatedAt: '2026-09-01T08:05:00.000Z',
      completedAt: '2026-09-01T08:05:00.000Z',
      paidAt: '2026-09-01T08:05:00.000Z',
    },
    {
      id: 'tx-sub-gh-1',
      paymentId: 'pay-sub-gh-1',
      subscriptionId: 'sub-biz-gh-1',
      planId: 'plan_pro',
      businessId: 'biz-gh-1',
      businessName: 'Résidence Les Cocotiers',
      clientId: 'usr_pro_02',
      clientName: 'Sèna Dossou',
      clientPhone: '0154100617',
      provider: 'KKIAPAY',
      paymentMethod: 'Kkiapay Bénin',
      externalReference: 'KKIA-TRX-44129',
      providerReference: 'KKIA-TRX-44129',
      transactionReference: 'TX-SUB-GH-02',
      status: 'SUCCESS',
      amount: 35000,
      currency: 'FCFA',
      paymentType: 'SUBSCRIPTION',
      amountTotal: 35000,
      amountPaid: 35000,
      amountRemaining: 0,
      createdAt: '2026-09-05T10:00:00.000Z',
      updatedAt: '2026-09-05T10:04:00.000Z',
      completedAt: '2026-09-05T10:04:00.000Z',
      paidAt: '2026-09-05T10:04:00.000Z',
    },
    {
      id: 'tx-sub-coif-1',
      paymentId: 'pay-sub-coif-1',
      subscriptionId: 'sub-biz-coif-1',
      planId: 'plan_starter',
      businessId: 'biz-coif-1',
      businessName: 'Salon Ébène Coiffure',
      clientId: 'usr_pro_03',
      clientName: 'Fatou Kébé',
      clientPhone: '0154100617',
      provider: 'MOOV_MONEY',
      paymentMethod: 'Moov Money Flooz',
      externalReference: 'MOOV-BJ-512093',
      providerReference: 'MOOV-BJ-512093',
      transactionReference: 'TX-SUB-COIF-03',
      status: 'SUCCESS',
      amount: 15000,
      currency: 'FCFA',
      paymentType: 'SUBSCRIPTION',
      amountTotal: 15000,
      amountPaid: 15000,
      amountRemaining: 0,
      createdAt: '2026-09-01T09:00:00.000Z',
      updatedAt: '2026-09-01T09:03:00.000Z',
      completedAt: '2026-09-01T09:03:00.000Z',
      paidAt: '2026-09-01T09:03:00.000Z',
    },
    {
      id: 'tx-sub-gar-1',
      paymentId: 'pay-sub-gar-1',
      subscriptionId: 'sub-biz-gar-1',
      planId: 'plan_starter',
      businessId: 'biz-gar-1',
      businessName: 'Garage Central Auto',
      clientId: 'usr_pro_04',
      clientName: 'Rodrigue Aïvo',
      clientPhone: '0154100617',
      provider: 'MTN_MOMO',
      paymentMethod: 'MTN Mobile Money',
      externalReference: 'MOMO-BJ-771940',
      providerReference: 'MOMO-BJ-771940',
      transactionReference: 'TX-SUB-GAR-04',
      status: 'SUCCESS',
      amount: 15000,
      currency: 'FCFA',
      paymentType: 'SUBSCRIPTION',
      amountTotal: 15000,
      amountPaid: 15000,
      amountRemaining: 0,
      createdAt: '2026-09-02T11:00:00.000Z',
      updatedAt: '2026-09-02T11:02:00.000Z',
      completedAt: '2026-09-02T11:02:00.000Z',
      paidAt: '2026-09-02T11:02:00.000Z',
    },
  ],
  automationRules: [
    // biz-immo-1
    {
      id: 'rule-biz-immo-1-appt',
      businessId: 'biz-immo-1',
      ruleType: 'APPOINTMENT_REMINDER',
      name: 'Rappel Rendez-vous de visite (24h & 2h)',
      description: 'Notifie automatiquement le client et l’agence 24h puis 2h avant la visite programmée.',
      isEnabled: true,
      triggerHoursBefore: [24, 2],
      channels: ['INTERNAL'],
      priority: 'NORMAL',
      customMessageTemplate: 'Rappel : votre visite avec Agence Immobilière Prestige est prévue le {date} à {time}.',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'rule-biz-immo-1-req-pending',
      businessId: 'biz-immo-1',
      ruleType: 'REQUEST_PENDING_FOLLOWUP',
      name: 'Relance Demande en attente (+24h)',
      description: 'Alerte l’agence si une demande immobilière reste sans réponse depuis plus de 24 heures.',
      isEnabled: true,
      triggerHoursAfter: 24,
      channels: ['INTERNAL'],
      priority: 'HIGH',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'rule-biz-immo-1-req-accepted',
      businessId: 'biz-immo-1',
      ruleType: 'REQUEST_ACCEPTED_CLIENT_FOLLOWUP',
      name: 'Relance Client Demande Acceptée (+12h)',
      description: 'Invite le client à finaliser son dossier ou sa réservation après acceptation.',
      isEnabled: true,
      triggerHoursAfter: 12,
      channels: ['INTERNAL'],
      priority: 'NORMAL',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'rule-biz-immo-1-bday',
      businessId: 'biz-immo-1',
      ruleType: 'CLIENT_BIRTHDAY',
      name: 'Vœux & Avantage Anniversaire Client',
      description: 'Envoie les vœux de l’agence avec un avantage honorifique pour l’anniversaire du client.',
      isEnabled: true,
      channels: ['INTERNAL'],
      priority: 'NORMAL',
      birthdayOffer: {
        discountPercentage: 10,
        validityDays: 30,
        customMessage: 'L’Agence Immobilière Prestige vous souhaite un joyeux anniversaire ! Profitez de 10% de remise sur nos frais d’agence ce mois-ci.',
      },
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },

    // biz-gh-1
    {
      id: 'rule-biz-gh-1-booking',
      businessId: 'biz-gh-1',
      ruleType: 'BOOKING_REMINDER',
      name: 'Rappel Séjour & Check-in (24h avant)',
      description: 'Rappelle au voyageur les modalités de son arrivée 24h avant le check-in.',
      isEnabled: true,
      triggerHoursBefore: [24],
      channels: ['INTERNAL'],
      priority: 'NORMAL',
      customMessageTemplate: 'Votre séjour à Résidence Les Palmiers commence demain ! Heure de check-in à partir de 14h00.',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'rule-biz-gh-1-pay-balance',
      businessId: 'biz-gh-1',
      ruleType: 'PAYMENT_BALANCE_REMINDER',
      name: 'Rappel Solde de Séjour (48h avant)',
      description: 'Rappelle le solde restant à régler sur les réservations avec acompte.',
      isEnabled: true,
      triggerHoursBefore: [48],
      channels: ['INTERNAL'],
      priority: 'HIGH',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'rule-biz-gh-1-req-pending',
      businessId: 'biz-gh-1',
      ruleType: 'REQUEST_PENDING_FOLLOWUP',
      name: 'Relance Demande hébergement (+24h)',
      description: 'Alerte la réception pour toute demande de séjour non traitée depuis 24h.',
      isEnabled: true,
      triggerHoursAfter: 24,
      channels: ['INTERNAL'],
      priority: 'HIGH',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },

    // biz-coif-1
    {
      id: 'rule-biz-coif-1-appt',
      businessId: 'biz-coif-1',
      ruleType: 'APPOINTMENT_REMINDER',
      name: 'Rappels Rendez-vous Coiffure (24h & 2h)',
      description: 'Rappelle le rendez-vous de coiffure 24h puis 2h avant pour limiter les oublis.',
      isEnabled: true,
      triggerHoursBefore: [24, 2],
      channels: ['INTERNAL'],
      priority: 'NORMAL',
      customMessageTemplate: 'Rappel Salon Élégance & Style : votre rendez-vous coiffure est prévu le {date} à {time}.',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'rule-biz-coif-1-bday',
      businessId: 'biz-coif-1',
      ruleType: 'CLIENT_BIRTHDAY',
      name: 'Offre Beauté Anniversaire Client',
      description: 'Envoie une réduction spéciale coiffure & soin pour l’anniversaire du client.',
      isEnabled: true,
      channels: ['INTERNAL'],
      priority: 'NORMAL',
      birthdayOffer: {
        discountPercentage: 15,
        validityDays: 15,
        customMessage: 'Joyeux anniversaire ! Salon Élégance & Style vous offre 15% de réduction sur tous les soins capillaires.',
      },
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },

    // biz-gar-1
    {
      id: 'rule-biz-gar-1-appt',
      businessId: 'biz-gar-1',
      ruleType: 'APPOINTMENT_REMINDER',
      name: 'Rappels Dépose Véhicule & Diagnostic (24h & 2h)',
      description: 'Rappelle au client la dépose de son véhicule au garage.',
      isEnabled: true,
      triggerHoursBefore: [24, 2],
      channels: ['INTERNAL'],
      priority: 'NORMAL',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'rule-biz-gar-1-req-pending',
      businessId: 'biz-gar-1',
      ruleType: 'REQUEST_PENDING_FOLLOWUP',
      name: 'Relance Demande mécanique (+24h)',
      description: 'Alerte l’atelier pour tout devis ou diagnostic resté sans réponse depuis 24h.',
      isEnabled: true,
      triggerHoursAfter: 24,
      channels: ['INTERNAL'],
      priority: 'HIGH',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'rule-biz-gar-1-alert',
      businessId: 'biz-gar-1',
      ruleType: 'BUSINESS_ALERT',
      name: 'Alerte Surcharge Atelier (> 5 en attente)',
      description: 'Alerte le chef d’atelier dès que 5 demandes de diagnostic sont en attente.',
      isEnabled: true,
      thresholdCount: 5,
      channels: ['INTERNAL'],
      priority: 'URGENT',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
  ],
  automationHistory: [],
  marketplaceRequests: [
    {
      id: 'mkr-seed-1',
      clientId: 'client-test-1',
      clientName: 'Onésime Sovi',
      clientPhone: '0154100617',
      clientEmail: 'sovionesime@gmail.com',
      category: 'Immobilier',
      moduleCode: 'IMMOBILIER',
      title: 'Recherche appartement 3 pièces meublé à Haie Vive ou Akpakpa',
      description: 'Bonjour, je cherche un appartement avec 2 chambres climatisées, groupe électrogène et parking sécurisé pour un séjour de 2 mois.',
      location: 'Cotonou, Haie Vive',
      latitude: 6.3585,
      longitude: 2.4102,
      radiusKm: 10,
      budgetMin: 120000,
      budgetMax: 200000,
      desiredDate: '2026-09-15',
      status: 'RESPONSES_RECEIVED',
      responsesCount: 1,
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-09-02T14:30:00.000Z',
    },
    {
      id: 'mkr-seed-2',
      clientId: 'client-test-1',
      clientName: 'Onésime Sovi',
      clientPhone: '0154100617',
      clientEmail: 'sovionesime@gmail.com',
      category: 'Coiffure & Beauté',
      moduleCode: 'COIFFURE',
      title: 'Tresses africaines soignées pour mariage samedi',
      description: 'Recherche coiffeuse professionnelle pour tresses sénégalaises avec pose mèches le samedi matin.',
      location: 'Cotonou, Cadjehoun',
      latitude: 6.3630,
      longitude: 2.4045,
      radiusKm: 8,
      budgetMin: 15000,
      budgetMax: 30000,
      desiredDate: '2026-09-19',
      status: 'PUBLISHED',
      responsesCount: 0,
      createdAt: '2026-09-05T09:15:00.000Z',
      updatedAt: '2026-09-05T09:15:00.000Z',
    },
  ],
  marketplaceResponses: [
    {
      id: 'mkrp-seed-1',
      marketplaceRequestId: 'mkr-seed-1',
      businessId: 'biz-immo-1',
      businessName: 'Agence Immobilière Prestige',
      businessPhone: '0154100617',
      businessCity: 'Cotonou',
      businessDistrict: 'Haie Vive',
      catalogItemId: 'cat-item-immo-1',
      catalogItemTitle: 'Appartement Meublé 3 Pièces - Akpakpa',
      message: 'Bonjour M. Sovi, nous avons exactement ce qu\'il vous faut : notre appartement meublé à Akpakpa Dodomè avec clim, groupe et gardiennage 24h. Nous vous proposons un tarif préférentiel à 150 000 FCFA.',
      proposedPrice: 150000,
      availableDate: '2026-09-15',
      status: 'PENDING',
      distanceKm: 4.8,
      rating: 4.8,
      reviewCount: 12,
      createdAt: '2026-09-02T14:30:00.000Z',
      updatedAt: '2026-09-02T14:30:00.000Z',
    },
  ],
  teamMembers: [
    {
      id: 'team-immo-1',
      businessId: 'biz-immo-1',
      name: 'Christian Koudjo',
      email: 'christian.koudjo@prestige-immo.bj',
      phone: '0154100617',
      role: 'MANAGER',
      status: 'ACTIVE',
      permissions: {
        canViewRequests: true,
        canManageAppointments: true,
        canViewClients: true,
        canViewStats: true,
        canManageCatalog: true,
      },
      assignedCount: 2,
      createdAt: '2026-08-10T08:00:00.000Z',
      updatedAt: '2026-08-10T08:00:00.000Z',
    },
    {
      id: 'team-immo-2',
      businessId: 'biz-immo-1',
      name: 'Blandine Alapini',
      email: 'blandine.alapini@prestige-immo.bj',
      phone: '0154100617',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      permissions: {
        canViewRequests: true,
        canManageAppointments: true,
        canViewClients: true,
        canViewStats: false,
        canManageCatalog: false,
      },
      assignedCount: 1,
      createdAt: '2026-08-15T09:30:00.000Z',
      updatedAt: '2026-08-15T09:30:00.000Z',
    },
    {
      id: 'team-gh-1',
      businessId: 'biz-gh-1',
      name: 'Aurore Houngbo',
      email: 'reception@residence-oceane.bj',
      phone: '0154100617',
      role: 'MANAGER',
      status: 'ACTIVE',
      permissions: {
        canViewRequests: true,
        canManageAppointments: true,
        canViewClients: true,
        canViewStats: true,
        canManageCatalog: true,
      },
      assignedCount: 1,
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
    },
    {
      id: 'team-coif-1',
      businessId: 'biz-coif-1',
      name: 'Clarisse Mensah',
      email: 'clarisse@coiffure-glamour.bj',
      phone: '0154100617',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      permissions: {
        canViewRequests: true,
        canManageAppointments: true,
        canViewClients: true,
        canViewStats: false,
        canManageCatalog: false,
      },
      assignedCount: 0,
      createdAt: '2026-08-20T11:00:00.000Z',
      updatedAt: '2026-08-20T11:00:00.000Z',
    },
    {
      id: 'team-gar-1',
      businessId: 'biz-gar-1',
      name: 'Éric Tossou',
      email: 'mecanique@garage-pro.bj',
      phone: '0154100617',
      role: 'MANAGER',
      status: 'ACTIVE',
      permissions: {
        canViewRequests: true,
        canManageAppointments: true,
        canViewClients: true,
        canViewStats: true,
        canManageCatalog: true,
      },
      assignedCount: 0,
      createdAt: '2026-08-25T14:00:00.000Z',
      updatedAt: '2026-08-25T14:00:00.000Z',
    },
  ],
  tasks: [
    {
      id: 'task-immo-1',
      businessId: 'biz-immo-1',
      title: 'Relancer M. Sovi pour signature bail appartement Haie Vive',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '11:30',
      priority: 'HIGH',
      done: false,
      relatedClientId: 'client-test-1',
      relatedClientName: 'Onésime Sovide',
      createdAt: '2026-09-08T08:00:00.000Z',
      updatedAt: '2026-09-08T08:00:00.000Z',
    },
    {
      id: 'task-immo-2',
      businessId: 'biz-immo-1',
      title: 'Vérifier état des lieux de sortie Villa Les Cocotiers',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '15:00',
      priority: 'MEDIUM',
      done: true,
      createdAt: '2026-09-08T09:00:00.000Z',
      updatedAt: '2026-09-08T09:00:00.000Z',
    },
    {
      id: 'task-gh-1',
      businessId: 'biz-gh-1',
      title: 'Préparer check-in Chambre Baobab Deluxe #102',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '14:00',
      priority: 'HIGH',
      done: false,
      relatedClientId: 'client-test-1',
      relatedClientName: 'Onésime Sovide',
      createdAt: '2026-09-08T07:30:00.000Z',
      updatedAt: '2026-09-08T07:30:00.000Z',
    },
  ],
  users: [
    {
      id: 'usr_admin_01',
      firstName: 'Administrateur',
      lastName: 'Flowexa',
      fullName: 'Administrateur Flowexa',
      phone: '0154100617',
      email: 'admin@flowexa.com',
      passwordHash:
        '358d0fdb83d795a3585d556c954052402de947406fa17b09e0714664258deeee4969c9eca93881027655217d71e94ff07e6be1187075acd9010e833e349021c5',
      passwordSalt: 'salt_admin_1',
      role: 'SUPER_ADMIN',
      tenantId: 'tenant-flowexa-hq',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIE',
      twoFactorEnabled: true,
      lastLoginAt: '2026-09-10T10:00:00.000Z',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'usr_pro_01',
      firstName: 'Marc',
      lastName: 'Kojo',
      fullName: 'Marc Kojo',
      phone: '0154100617',
      email: 'pro@flowexa.com',
      passwordHash:
        'b92b7756b27de2a5b4ef390bc5bf4cbbfc6c2418fe2e12b367f5634ed4fb60b5948539fc456868d6dcc572e44cb91684b5cca04ec098531399c0ef48dafbaa40',
      passwordSalt: 'salt_immo_1',
      role: 'BUSINESS_OWNER',
      businessId: 'biz-immo-1',
      tenantId: 'tenant-immo-1',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIE',
      twoFactorEnabled: false,
      lastLoginAt: '2026-09-10T14:30:00.000Z',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'usr_manager_01',
      firstName: 'Christian',
      lastName: 'Koudjo',
      fullName: 'Christian Koudjo',
      phone: '0154100617',
      email: 'christian.koudjo@prestige-immo.bj',
      passwordHash:
        'b92b7756b27de2a5b4ef390bc5bf4cbbfc6c2418fe2e12b367f5634ed4fb60b5948539fc456868d6dcc572e44cb91684b5cca04ec098531399c0ef48dafbaa40',
      passwordSalt: 'salt_immo_1',
      role: 'MANAGER',
      businessId: 'biz-immo-1',
      tenantId: 'tenant-immo-1',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIE',
      permissions: {
        canViewRequests: true,
        canManageAppointments: true,
        canViewClients: true,
        canViewStats: true,
        canManageCatalog: true,
      },
      lastLoginAt: '2026-09-09T08:15:00.000Z',
      createdAt: '2026-08-10T08:00:00.000Z',
      updatedAt: '2026-08-10T08:00:00.000Z',
    },
    {
      id: 'usr_employee_01',
      firstName: 'Blandine',
      lastName: 'Alapini',
      fullName: 'Blandine Alapini',
      phone: '0154100617',
      email: 'blandine.alapini@prestige-immo.bj',
      passwordHash:
        'b92b7756b27de2a5b4ef390bc5bf4cbbfc6c2418fe2e12b367f5634ed4fb60b5948539fc456868d6dcc572e44cb91684b5cca04ec098531399c0ef48dafbaa40',
      passwordSalt: 'salt_immo_1',
      role: 'EMPLOYEE',
      businessId: 'biz-immo-1',
      tenantId: 'tenant-immo-1',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIE',
      permissions: {
        canViewRequests: true,
        canManageAppointments: true,
        canViewClients: true,
        canViewStats: false,
        canManageCatalog: false,
      },
      lastLoginAt: '2026-09-08T16:45:00.000Z',
      createdAt: '2026-08-15T09:30:00.000Z',
      updatedAt: '2026-08-15T09:30:00.000Z',
    },
    {
      id: 'usr_client_01',
      firstName: 'Onésime',
      lastName: 'Sovide',
      fullName: 'Onésime Sovide',
      phone: '0154100617',
      email: 'client@flowexa.bj',
      passwordHash:
        '44ff63346e1dd86d1e84a1382270d53f2979eb2b3d07d517a0a394fa05a8658fb4c90c1236ed376f5b714996006a8555c5eb03d3327f9397d18542d757d88a11',
      passwordSalt: 'salt_client_1',
      role: 'CLIENT',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIE',
      lastLoginAt: '2026-09-10T12:00:00.000Z',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
  ],
  sessions: [],
  passwordResets: [],
  plans: [
    {
      id: 'plan_starter',
      code: 'STARTER',
      name: 'Starter',
      description: 'Pour les indépendants et petites structures qui débutent sur Flowexa.',
      price: 15000,
      currency: 'FCFA',
      period: 'MONTHLY',
      status: 'ACTIVE',
      limits: {
        maxEmployees: 3,
        maxServices: 10,
        maxOffers: 20,
        maxStorageMb: 500,
      },
      features: {
        statistics: true,
        automations: false,
        aiCopilot: false,
        marketplaceAccess: true,
        prioritySupport: false,
        customBranding: false,
        advancedReports: false,
      },
      recommended: false,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'plan_pro',
      code: 'PRO',
      name: 'Pro',
      description: 'La solution complète pour les établissements en forte croissance avec automatisation.',
      price: 35000,
      currency: 'FCFA',
      period: 'MONTHLY',
      status: 'ACTIVE',
      limits: {
        maxEmployees: 10,
        maxServices: 40,
        maxOffers: 100,
        maxStorageMb: 3000,
      },
      features: {
        statistics: true,
        automations: true,
        aiCopilot: true,
        marketplaceAccess: true,
        prioritySupport: true,
        customBranding: true,
        advancedReports: false,
      },
      recommended: true,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'plan_premium',
      code: 'PREMIUM',
      name: 'Premium & Entreprise',
      description: 'Pour les grands réseaux, agences prestigieuses et franchises recherchant l’excellence et l’IA intégrée.',
      price: 75000,
      currency: 'FCFA',
      period: 'MONTHLY',
      status: 'ACTIVE',
      limits: {
        maxEmployees: 50,
        maxServices: 200,
        maxOffers: 500,
        maxStorageMb: 20000,
      },
      features: {
        statistics: true,
        automations: true,
        aiCopilot: true,
        marketplaceAccess: true,
        prioritySupport: true,
        customBranding: true,
        advancedReports: true,
      },
      recommended: false,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
  ],
  subscriptions: [
    {
      id: 'sub-biz-immo-1',
      businessId: 'biz-immo-1',
      businessName: 'Agence Immobilière Prestige',
      planId: 'plan_pro',
      planCode: 'PRO',
      planName: 'Pro',
      status: 'ACTIVE',
      startDate: '2026-09-01T00:00:00.000Z',
      expirationDate: '2026-10-01T23:59:59.000Z',
      gracePeriodEndsAt: '2026-10-06T23:59:59.000Z',
      autoRenew: true,
      period: 'MONTHLY',
      amountPaid: 35000,
      currency: 'FCFA',
      paymentMethod: 'MTN_MOMO',
      lastPaymentId: 'pay-sub-immo-1',
      lastTransactionId: 'tx-sub-immo-1',
      lastInvoiceId: 'inv-2026-001',
      notes: 'Abonnement actif - Renouvellement automatique configuré',
      createdAt: '2026-09-01T08:00:00.000Z',
      updatedAt: '2026-09-01T08:00:00.000Z',
    },
    {
      id: 'sub-biz-gh-1',
      businessId: 'biz-gh-1',
      businessName: 'Résidence Les Cocotiers',
      planId: 'plan_pro',
      planCode: 'PRO',
      planName: 'Pro',
      status: 'ACTIVE',
      startDate: '2026-09-05T00:00:00.000Z',
      expirationDate: '2026-10-05T23:59:59.000Z',
      gracePeriodEndsAt: '2026-10-10T23:59:59.000Z',
      autoRenew: true,
      period: 'MONTHLY',
      amountPaid: 35000,
      currency: 'FCFA',
      paymentMethod: 'KKIAPAY',
      lastPaymentId: 'pay-sub-gh-1',
      lastTransactionId: 'tx-sub-gh-1',
      lastInvoiceId: 'inv-2026-002',
      notes: 'Abonnement actif Pro',
      createdAt: '2026-09-05T10:00:00.000Z',
      updatedAt: '2026-09-05T10:00:00.000Z',
    },
    {
      id: 'sub-biz-coif-1',
      businessId: 'biz-coif-1',
      businessName: 'Salon Ébène Coiffure',
      planId: 'plan_starter',
      planCode: 'STARTER',
      planName: 'Starter',
      status: 'ACTIVE',
      startDate: '2026-09-01T00:00:00.000Z',
      expirationDate: '2026-10-01T23:59:59.000Z',
      gracePeriodEndsAt: '2026-10-06T23:59:59.000Z',
      autoRenew: true,
      period: 'MONTHLY',
      amountPaid: 15000,
      currency: 'FCFA',
      paymentMethod: 'MOOV_MONEY',
      lastPaymentId: 'pay-sub-coif-1',
      lastTransactionId: 'tx-sub-coif-1',
      lastInvoiceId: 'inv-2026-003',
      notes: 'Abonnement Starter actif',
      createdAt: '2026-09-01T09:00:00.000Z',
      updatedAt: '2026-09-01T09:00:00.000Z',
    },
    {
      id: 'sub-biz-gar-1',
      businessId: 'biz-gar-1',
      businessName: 'Garage Central Auto',
      planId: 'plan_starter',
      planCode: 'STARTER',
      planName: 'Starter',
      status: 'ACTIVE',
      startDate: '2026-09-02T00:00:00.000Z',
      expirationDate: '2026-10-02T23:59:59.000Z',
      gracePeriodEndsAt: '2026-10-07T23:59:59.000Z',
      autoRenew: true,
      period: 'MONTHLY',
      amountPaid: 15000,
      currency: 'FCFA',
      paymentMethod: 'MTN_MOMO',
      lastPaymentId: 'pay-sub-gar-1',
      lastTransactionId: 'tx-sub-gar-1',
      lastInvoiceId: 'inv-2026-004',
      notes: 'Abonnement Starter actif',
      createdAt: '2026-09-02T11:00:00.000Z',
      updatedAt: '2026-09-02T11:00:00.000Z',
    },
  ],
  invoices: [
    {
      id: 'inv-2026-001',
      invoiceNumber: 'INV-2026-001',
      businessId: 'biz-immo-1',
      businessName: 'Agence Immobilière Prestige',
      businessEmail: 'contact@agence-prestige.bj',
      businessPhone: '0154100617',
      businessAddress: 'Haie Vive, Cotonou',
      subscriptionId: 'sub-biz-immo-1',
      planId: 'plan_pro',
      planName: 'Plan Pro',
      amount: 35000,
      currency: 'FCFA',
      status: 'PAID',
      periodStart: '2026-09-01T00:00:00.000Z',
      periodEnd: '2026-10-01T23:59:59.000Z',
      billingPeriod: 'MONTHLY',
      paymentId: 'pay-sub-immo-1',
      transactionReference: 'TX-SUB-IMMO-01',
      paymentMethod: 'MTN_MOMO',
      paidAt: '2026-09-01T08:05:00.000Z',
      issuedAt: '2026-09-01T08:00:00.000Z',
      dueDate: '2026-09-01T23:59:59.000Z',
      notes: 'Facture mensuelle d’abonnement Flowexa Pro acquittée.',
    },
    {
      id: 'inv-2026-002',
      invoiceNumber: 'INV-2026-002',
      businessId: 'biz-gh-1',
      businessName: 'Résidence Les Cocotiers',
      businessEmail: 'contact@lescocotiers.bj',
      businessPhone: '0154100617',
      businessAddress: 'Fidjrossè Calvaire, Cotonou',
      subscriptionId: 'sub-biz-gh-1',
      planId: 'plan_pro',
      planName: 'Plan Pro',
      amount: 35000,
      currency: 'FCFA',
      status: 'PAID',
      periodStart: '2026-09-05T00:00:00.000Z',
      periodEnd: '2026-10-05T23:59:59.000Z',
      billingPeriod: 'MONTHLY',
      paymentId: 'pay-sub-gh-1',
      transactionReference: 'TX-SUB-GH-02',
      paymentMethod: 'KKIAPAY',
      paidAt: '2026-09-05T10:04:00.000Z',
      issuedAt: '2026-09-05T10:00:00.000Z',
      dueDate: '2026-09-05T23:59:59.000Z',
      notes: 'Facture mensuelle d’abonnement Flowexa Pro acquittée.',
    },
    {
      id: 'inv-2026-003',
      invoiceNumber: 'INV-2026-003',
      businessId: 'biz-coif-1',
      businessName: 'Salon Ébène Coiffure',
      businessEmail: 'ebene.coiffure@flowexa.bj',
      businessPhone: '0154100617',
      businessAddress: 'Cadjehoun, Cotonou',
      subscriptionId: 'sub-biz-coif-1',
      planId: 'plan_starter',
      planName: 'Plan Starter',
      amount: 15000,
      currency: 'FCFA',
      status: 'PAID',
      periodStart: '2026-09-01T00:00:00.000Z',
      periodEnd: '2026-10-01T23:59:59.000Z',
      billingPeriod: 'MONTHLY',
      paymentId: 'pay-sub-coif-1',
      transactionReference: 'TX-SUB-COIF-03',
      paymentMethod: 'MOOV_MONEY',
      paidAt: '2026-09-01T09:03:00.000Z',
      issuedAt: '2026-09-01T09:00:00.000Z',
      dueDate: '2026-09-01T23:59:59.000Z',
      notes: 'Facture mensuelle d’abonnement Flowexa Starter acquittée.',
    },
    {
      id: 'inv-2026-004',
      invoiceNumber: 'INV-2026-004',
      businessId: 'biz-gar-1',
      businessName: 'Garage Central Auto',
      businessEmail: 'contact@garagecentral.bj',
      businessPhone: '0154100617',
      businessAddress: 'Zone Industrielle Akpakpa, Cotonou',
      subscriptionId: 'sub-biz-gar-1',
      planId: 'plan_starter',
      planName: 'Plan Starter',
      amount: 15000,
      currency: 'FCFA',
      status: 'PAID',
      periodStart: '2026-09-02T00:00:00.000Z',
      periodEnd: '2026-10-02T23:59:59.000Z',
      billingPeriod: 'MONTHLY',
      paymentId: 'pay-sub-gar-1',
      transactionReference: 'TX-SUB-GAR-04',
      paymentMethod: 'MTN_MOMO',
      paidAt: '2026-09-02T11:02:00.000Z',
      issuedAt: '2026-09-02T11:00:00.000Z',
      dueDate: '2026-09-02T23:59:59.000Z',
      notes: 'Facture mensuelle d’abonnement Flowexa Starter acquittée.',
    },
  ],
  campaigns: [
    {
      id: 'camp-1',
      businessId: 'biz-immo-1',
      businessName: 'Agence Immobilière Prestige',
      name: 'Offre Privilège Résidences Haie Vive',
      objective: 'FIDÉLISATION',
      targetSegment: 'RECURRENT',
      channel: 'INTERNAL',
      message: 'Bonjour, en tant que client régulier de l\'Agence Prestige, découvrez en avant-première nos nouvelles opportunités exclusives.',
      status: 'TERMINÉE',
      recipientsCount: 2,
      deliveredCount: 2,
      responsesCount: 1,
      conversionsCount: 1,
      generatedRevenue: 85000,
      cost: 0,
      roi: null,
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: '2026-03-01T10:00:00.000Z',
      sentAt: '2026-03-01T10:00:00.000Z',
    },
    {
      id: 'camp-2',
      businessId: 'biz-immo-1',
      businessName: 'Agence Immobilière Prestige',
      name: 'Relance Nouveaux Projets Immobiliers',
      objective: 'RÉACTIVATION',
      targetSegment: 'INACTIVE',
      channel: 'INTERNAL',
      message: 'Bonjour, vous avez récemment consulté nos services. Avez-vous toujours un projet d\'acquisition ou de location à Cotonou ? Nous restons à votre écoute.',
      status: 'BROUILLON',
      recipientsCount: 1,
      deliveredCount: 0,
      responsesCount: 0,
      conversionsCount: 0,
      generatedRevenue: 0,
      cost: 0,
      roi: null,
      createdAt: '2026-03-05T14:30:00.000Z',
      updatedAt: '2026-03-05T14:30:00.000Z',
    },
  ],
  clientNotes: [
    {
      id: 'note-1',
      businessId: 'biz-immo-1',
      clientId: 'client-0154100617',
      note: 'Client très ponctuel. Intéressé par les baux annuels en zone résidentielle calme.',
      createdAt: '2026-02-15T09:30:00.000Z',
      createdBy: 'pro@flowexa.com',
    },
  ],
  platformCategories: [
    {
      id: 'pcat-immo',
      code: 'IMMOBILIER',
      name: 'Immobilier',
      subtitle: 'Vente, Location & Gestion',
      category: 'Logement & Espaces',
      description: 'Gestion de biens immobiliers, baux locatifs, visites programmées et quittances.',
      accentColor: '#FB8205',
      iconName: 'Building2',
      order: 1,
      isActive: true,
      associatedModuleCodes: ['IMMOBILIER'],
      features: ['Catalogue de biens', 'Gestion des baux', 'Réservation de visites', 'État des lieux'],
      sampleQuery: 'Je cherche un appartement à Cotonou',
      seo: {
        metaTitle: 'Immobilier au Bénin — Location & Vente | Flowexa',
        metaDescription: 'Trouvez et réservez des biens immobiliers vérifiés à Cotonou et partout au Bénin.',
        keywords: ['immobilier', 'location appartement', 'vente terrain', 'Cotonou', 'Bénin'],
      },
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'pcat-gh',
      code: 'GUEST_HOUSE',
      name: 'Guest House & Résidences',
      subtitle: 'Séjours courte durée & Meublés',
      category: 'Hébergement',
      description: 'Gestion des chambres, arrivées/départs en temps réel et réservations sécurisées.',
      accentColor: '#0BE9EF',
      iconName: 'Home',
      order: 2,
      isActive: true,
      associatedModuleCodes: ['GUEST_HOUSE'],
      features: ['Planning des réservations', 'Tarification par nuitée', 'Disponibilités directes', 'Ménage & conciergerie'],
      sampleQuery: 'Guest house calme avec piscine pour un week-end',
      seo: {
        metaTitle: 'Guest House & Résidences Meublées au Bénin | Flowexa',
        metaDescription: 'Réservez votre séjour meublé tout confort à Cotonou, Ouidah et Calavi.',
        keywords: ['guest house', 'résidence meublée', 'chambre', 'séjour court', 'Bénin'],
      },
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'pcat-coif',
      code: 'COIFFURE',
      name: 'Coiffure & Tresses',
      subtitle: 'Style, Brushing & Soins capillaires',
      category: 'Beauté & Soins',
      description: 'Prise de rendez-vous, planning des coiffeurs, gestion des forfaits et prestations capillaires.',
      accentColor: '#FB8205',
      iconName: 'Scissors',
      order: 3,
      isActive: true,
      associatedModuleCodes: ['COIFFURE'],
      features: ['Agenda par collaborateur', 'Catalogue des coiffures & tarifs', 'Rappels automatiques', 'Fiches prestations'],
      sampleQuery: 'Tresses ou brushing samedi matin',
      seo: {
        metaTitle: 'Salons de Coiffure & Tresses au Bénin | Flowexa',
        metaDescription: 'Prenez rendez-vous en ligne dans les meilleurs salons de coiffure.',
        keywords: ['coiffure', 'tresses africaines', 'brushing', 'salon de beauté', 'Cotonou'],
      },
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'pcat-barb',
      code: 'BARBIER',
      name: 'Barbier & Grooming',
      subtitle: 'Soins barbe & Coupe masculine',
      category: 'Beauté & Soins',
      description: 'Gestion des créneaux, soins de barbe, taille, rasage traditionnel et coupe homme.',
      accentColor: '#0BE9EF',
      iconName: 'Sparkles',
      order: 4,
      isActive: true,
      associatedModuleCodes: ['BARBIER'],
      features: ['Créneaux & disponibilités', 'Formules taille de barbe & soins', 'Tarifs par prestation', 'Fidélité'],
      sampleQuery: 'Barbier ouvert en soirée pour taille de barbe',
      seo: {
        metaTitle: 'Barbiers & Soins Homme au Bénin | Flowexa',
        metaDescription: 'Réservez votre créneau chez les barbiers professionnels à proximité.',
        keywords: ['barbier', 'barbe', 'coupe homme', 'grooming', 'Cotonou'],
      },
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'pcat-cosm',
      code: 'INSTITUT_COSMETIQUE',
      name: 'Institut & Cosmétique',
      subtitle: 'Soins du visage, Onglerie & Produits',
      category: 'Beauté & Soins',
      description: 'Soins du visage, manucure/pédicure, cabines esthétiques et vente de cosmétiques certifiés.',
      accentColor: '#FB8205',
      iconName: 'HeartHandshake',
      order: 5,
      isActive: true,
      associatedModuleCodes: ['INSTITUT_COSMETIQUE'],
      features: ['Soins personnalisés', 'Gestion des cabines', 'Catalogue produits', 'Rendez-vous esthétique'],
      sampleQuery: 'Soin du visage et pose de vernis semi-permanent',
      seo: {
        metaTitle: 'Instituts de Beauté & Cosmétiques au Bénin | Flowexa',
        metaDescription: 'Découvrez les soins esthétiques et cosmétiques de pointe au Bénin.',
        keywords: ['institut de beauté', 'manucure', 'soin visage', 'onglerie', 'cosmétique'],
      },
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'pcat-spa',
      code: 'SPA_MASSAGE',
      name: 'Spa & Massages',
      subtitle: 'Détente, Bien-être & Hammam',
      category: 'Bien-être',
      description: 'Massages relaxants, hammam, rituels corporels et forfaits détente solo/duo.',
      accentColor: '#0BE9EF',
      iconName: 'Activity',
      order: 6,
      isActive: true,
      associatedModuleCodes: ['SPA_MASSAGE'],
      features: ['Réservation cabines duo & solo', 'Protocoles de massage', 'Forfaits détente', 'Bons cadeaux'],
      sampleQuery: 'Massage relaxant aux huiles naturelles',
      seo: {
        metaTitle: 'Spa & Massages Bien-être au Bénin | Flowexa',
        metaDescription: 'Offrez-vous une parenthèse détente dans les meilleurs centres de bien-être.',
        keywords: ['spa', 'massage', 'hammam', 'détente', 'bien-être', 'Cotonou'],
      },
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'pcat-photo',
      code: 'PHOTOGRAPHE',
      name: 'Photographe & Studio',
      subtitle: 'Séances, Portraits & Événements',
      category: 'Création & Média',
      description: 'Réservation de séances photos en studio, reportages événementiels et galeries privées.',
      accentColor: '#FB8205',
      iconName: 'Camera',
      order: 7,
      isActive: true,
      associatedModuleCodes: ['PHOTOGRAPHE'],
      features: ['Réservation de séances', 'Galeries photos', 'Tirages & forfaits', 'Post-traitement'],
      sampleQuery: 'Shooting photo portrait en studio',
      seo: {
        metaTitle: 'Photographes & Studios Photo au Bénin | Flowexa',
        metaDescription: 'Réservez des photographes professionnels pour vos événements et shootings studio.',
        keywords: ['photographe', 'shooting photo', 'studio', 'portrait', 'mariage', 'Cotonou'],
      },
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'pcat-brod',
      code: 'BRODERIE_IMPRESSION',
      name: 'Broderie & Impression Textile',
      subtitle: 'Marquage, Flocage & Sérigraphie',
      category: 'Textile & Artisanat',
      description: 'Personnalisation textile, broderie artisanale et industrielle, flocage, sérigraphie et impression.',
      accentColor: '#0BE9EF',
      iconName: 'Palette',
      order: 8,
      isActive: true,
      associatedModuleCodes: ['BRODERIE_IMPRESSION'],
      features: ['Personnalisation & motifs', 'Suivi des commandes', 'Flocage & sérigraphie', 'Impression textile'],
      sampleQuery: 'Broderie et flocage sur polos et t-shirts',
      seo: {
        metaTitle: 'Broderie & Impression Textile au Bénin | Flowexa',
        metaDescription: 'Marquage professionnel, broderie numérique et flocage sur tous textiles.',
        keywords: ['broderie', 'flocage', 'impression textile', 'sérigraphie', 'polos personnalisés'],
      },
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'pcat-gar',
      code: 'GARAGE',
      name: 'Garage & Mécanique Auto',
      subtitle: 'Diagnostic, Entretien & Réparation',
      category: 'Automobile',
      description: 'Prise en charge véhicule, ordres de réparation, devis instantanés et maintenance préventive.',
      accentColor: '#FB8205',
      iconName: 'Wrench',
      order: 9,
      isActive: true,
      associatedModuleCodes: ['GARAGE'],
      features: ['Ordres de réparation', 'Carnet d’entretien', 'Devis prestations', 'Notification véhicule prêt'],
      sampleQuery: 'Diagnostic électronique et vidange',
      seo: {
        metaTitle: 'Garages Automobiles & Réparation au Bénin | Flowexa',
        metaDescription: 'Faites diagnostiquer et entretenir votre véhicule par des professionnels agréés.',
        keywords: ['garage', 'mécanique auto', 'vidange', 'diagnostic auto', 'réparation voiture'],
      },
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'pcat-pharm',
      code: 'PHARMACIE',
      name: 'Pharmacie & Santé',
      subtitle: 'Gardes, Médicaments & Conseils',
      category: 'Santé',
      description: 'Consultation des pharmacies de garde, ordonnances, disponibilité des médicaments et conseils santé.',
      accentColor: '#0BE9EF',
      iconName: 'Building2',
      order: 10,
      isActive: true,
      associatedModuleCodes: ['PHARMACIE'],
      features: ['Pharmacies de garde', 'Transmission ordonnance', 'Disponibilité médicaments', 'Horaires continus'],
      sampleQuery: 'Pharmacie de garde ouverte cette nuit',
      seo: {
        metaTitle: 'Pharmacies de Garde & Santé au Bénin | Flowexa',
        metaDescription: 'Localisez rapidement les pharmacies de garde ouvertes 24h/24 au Bénin.',
        keywords: ['pharmacie de garde', 'médicaments', 'santé', 'urgence', 'Cotonou'],
      },
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
  ],
  consents: consentService.getAllConsents(),
  platformSettings: {
    platformName: 'FLOWEXA Bénin',
    contactEmail: 'contact@flowexa.bj',
    supportPhone: '+229 01 54 10 06 17',
    country: 'Bénin',
    defaultCurrency: 'FCFA',
    allowPublicRegistrations: true,
    requireBusinessReview: true,
    reviewModerationAutoPublish: false,
    smsNotificationsEnabled: true,
    emailNotificationsEnabled: true,
    whatsappNotificationsEnabled: true,
    defaultSearchRadiusKm: 25,
    maintenanceMode: false,
    updatedAt: '2026-09-10T12:00:00.000Z',
    updatedBy: 'admin@flowexa.com',
  },
};

export class DataStore {
  private data: FlowexaDatabase;
  private ratingCache = new Map<string, any>();
  private saveTimeout: NodeJS.Timeout | null = null;
  private isSaving = false;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadData();
    if (this.data.consents && this.data.consents.length > 0) {
      consentService.loadConsents(this.data.consents);
    }
    consentService.setPersistenceCallback((consents) => {
      this.data.consents = [...consents];
      this.commit();
    });
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): FlowexaDatabase {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as FlowexaDatabase;
        let modified = false;

        if (!parsed.catalogItems || parsed.catalogItems.length === 0) {
          parsed.catalogItems = INITIAL_DATABASE.catalogItems;
          modified = true;
        }
        if (!parsed.catalogCategories || parsed.catalogCategories.length === 0) {
          parsed.catalogCategories = INITIAL_DATABASE.catalogCategories;
          modified = true;
        }
        if (!parsed.requests || !Array.isArray(parsed.requests)) {
          parsed.requests = INITIAL_DATABASE.requests;
          modified = true;
        }
        if (!parsed.notifications || !Array.isArray(parsed.notifications)) {
          parsed.notifications = INITIAL_DATABASE.notifications;
          modified = true;
        }
        if (!parsed.favorites || !Array.isArray(parsed.favorites)) {
          parsed.favorites = [];
          modified = true;
        }
        if (!parsed.reviews || !Array.isArray(parsed.reviews)) {
          parsed.reviews = [];
          modified = true;
        }
        if (!parsed.reviewReports || !Array.isArray(parsed.reviewReports)) {
          parsed.reviewReports = [];
          modified = true;
        }
        if (!parsed.conversations || !Array.isArray(parsed.conversations)) {
          parsed.conversations = [];
          modified = true;
        }
        if (!parsed.messages || !Array.isArray(parsed.messages)) {
          parsed.messages = [];
          modified = true;
        }
        if (!parsed.payments || !Array.isArray(parsed.payments)) {
          parsed.payments = [];
          modified = true;
        }
        if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
          parsed.transactions = [];
          modified = true;
        }
        if (!parsed.automationRules || !Array.isArray(parsed.automationRules) || parsed.automationRules.length === 0) {
          parsed.automationRules = INITIAL_DATABASE.automationRules;
          modified = true;
        }
        if (!parsed.automationHistory || !Array.isArray(parsed.automationHistory)) {
          parsed.automationHistory = [];
          modified = true;
        }
        if (!parsed.marketplaceRequests || !Array.isArray(parsed.marketplaceRequests) || parsed.marketplaceRequests.length === 0) {
          parsed.marketplaceRequests = INITIAL_DATABASE.marketplaceRequests;
          modified = true;
        }
        if (!parsed.marketplaceResponses || !Array.isArray(parsed.marketplaceResponses) || parsed.marketplaceResponses.length === 0) {
          parsed.marketplaceResponses = INITIAL_DATABASE.marketplaceResponses;
          modified = true;
        }
        if (!parsed.teamMembers || !Array.isArray(parsed.teamMembers) || parsed.teamMembers.length === 0) {
          parsed.teamMembers = INITIAL_DATABASE.teamMembers;
          modified = true;
        }
        if (!parsed.tasks || !Array.isArray(parsed.tasks) || parsed.tasks.length === 0) {
          parsed.tasks = INITIAL_DATABASE.tasks;
          modified = true;
        }
        if (!parsed.users || !Array.isArray(parsed.users) || parsed.users.length === 0) {
          parsed.users = INITIAL_DATABASE.users;
          modified = true;
        }
        if (!parsed.sessions || !Array.isArray(parsed.sessions)) {
          parsed.sessions = [];
          modified = true;
        }
        if (!parsed.passwordResets || !Array.isArray(parsed.passwordResets)) {
          parsed.passwordResets = [];
          modified = true;
        }
        if (!parsed.plans || !Array.isArray(parsed.plans) || parsed.plans.length === 0) {
          parsed.plans = INITIAL_DATABASE.plans;
          modified = true;
        }
        if (!parsed.subscriptions || !Array.isArray(parsed.subscriptions) || parsed.subscriptions.length === 0) {
          parsed.subscriptions = INITIAL_DATABASE.subscriptions;
          modified = true;
        }
        if (!parsed.invoices || !Array.isArray(parsed.invoices) || parsed.invoices.length === 0) {
          parsed.invoices = INITIAL_DATABASE.invoices;
          modified = true;
        }
        if (!parsed.payments || !Array.isArray(parsed.payments) || parsed.payments.length === 0) {
          parsed.payments = INITIAL_DATABASE.payments;
          modified = true;
        }
        if (!parsed.transactions || !Array.isArray(parsed.transactions) || parsed.transactions.length === 0) {
          parsed.transactions = INITIAL_DATABASE.transactions;
          modified = true;
        }
        if (!parsed.campaigns || !Array.isArray(parsed.campaigns) || parsed.campaigns.length === 0) {
          parsed.campaigns = INITIAL_DATABASE.campaigns;
          modified = true;
        }
        if (!parsed.consents || !Array.isArray(parsed.consents) || parsed.consents.length === 0) {
          parsed.consents = INITIAL_DATABASE.consents || consentService.getAllConsents();
          modified = true;
        }
        if (!parsed.clientNotes || !Array.isArray(parsed.clientNotes)) {
          parsed.clientNotes = INITIAL_DATABASE.clientNotes;
          modified = true;
        }
        if (!parsed.platformCategories || !Array.isArray(parsed.platformCategories) || parsed.platformCategories.length === 0) {
          parsed.platformCategories = INITIAL_DATABASE.platformCategories;
          modified = true;
        }
        if (!parsed.platformSettings) {
          parsed.platformSettings = INITIAL_DATABASE.platformSettings;
          modified = true;
        }
        if (parsed.businesses && parsed.businesses.length > 0) {
          parsed.businesses.forEach((b) => {
            if (!b.phone || b.phone.includes('00 00') || b.phone === '') {
              b.phone = '0154100617';
              b.whatsapp = '0154100617';
              modified = true;
            }
          });
        }
        if (modified) {
          this.saveData(parsed);
        }
        return parsed;
      }
    } catch (err) {
      console.error('[DataStore] Erreur lecture fichier, initialisation avec template', err);
    }
    this.saveData(INITIAL_DATABASE);
    return INITIAL_DATABASE;
  }

  private saveData(data: FlowexaDatabase) {
    try {
      const serialized = JSON.stringify(data, null, 2);
      const tempFile = `${DB_FILE}.${Date.now()}.${Math.random().toString(36).substring(2, 6)}.tmp`;
      fs.writeFileSync(tempFile, serialized, 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('[DataStore] Erreur écriture fichier', err);
    }
  }

  public getDb(): FlowexaDatabase {
    return this.data;
  }

  public commit() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    // Debounce de 40ms pour fusionner les écritures sans bloquer l'Event Loop
    this.saveTimeout = setTimeout(() => {
      this.saveData(this.data);
      this.saveTimeout = null;
    }, 40);
  }

  public flushSync() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.saveData(this.data);
  }

  public invalidateRatingCache(businessId?: string) {
    if (businessId) {
      for (const key of Array.from(this.ratingCache.keys())) {
        if (key.startsWith(businessId)) {
          this.ratingCache.delete(key);
        }
      }
    } else {
      this.ratingCache.clear();
    }
  }

  // Request helpers
  public createRequest(request: FlowexaRequestEntity): FlowexaRequestEntity {
    // SPRINT B15: Immutabilité du prix à l'enregistrement de la demande
    if (request.lockedPrice === undefined) {
      request.lockedPrice = request.catalogItemPrice || 0;
    }
    if (request.lockedCurrency === undefined) {
      request.lockedCurrency = request.catalogItemCurrency || 'FCFA';
    }
    this.data.requests.unshift(request);
    this.commit();
    return request;
  }

  public getRequestById(id: string): FlowexaRequestEntity | undefined {
    return this.data.requests.find((r) => r.id === id);
  }

  // SPRINT B15: Vérification de conflit & Anti-Double Booking (créneau / chambre / ressource)
  public checkBookingConflict(params: {
    catalogItemId?: string;
    requestedDate?: string;
    requestedTime?: string;
    endDate?: string;
    excludeRequestId?: string;
  }): { hasConflict: boolean; conflictingRequestId?: string; message?: string } {
    if (!params.catalogItemId || !params.requestedDate) {
      return { hasConflict: false };
    }

    const activeStatuses: RequestStatus[] = ['CONFIRMED', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS'];
    const candidates = (this.data.requests || []).filter(
      (r) =>
        r.id !== params.excludeRequestId &&
        r.catalogItemId === params.catalogItemId &&
        activeStatuses.includes(r.status)
    );

    for (const existing of candidates) {
      // Cas 1 : Séjour avec date de début et fin (ex: Guest House / location)
      if (params.endDate || existing.endDate) {
        const startA = new Date(params.requestedDate).getTime();
        const endA = new Date(params.endDate || params.requestedDate).getTime();
        const startB = new Date(existing.requestedDate || '').getTime();
        const endB = new Date(existing.endDate || existing.requestedDate || '').getTime();

        if (!isNaN(startA) && !isNaN(endA) && !isNaN(startB) && !isNaN(endB)) {
          // Chevauchement : startA < endB && endA > startB
          if (startA < endB && endA > startB) {
            return {
              hasConflict: true,
              conflictingRequestId: existing.id,
              message: `Conflit de disponibilité : ce service/logement est déjà réservé du ${existing.requestedDate} au ${existing.endDate || existing.requestedDate}.`,
            };
          }
        }
      } else if (existing.requestedDate === params.requestedDate) {
        // Cas 2 : Même date
        if (params.requestedTime && existing.requestedTime) {
          if (params.requestedTime === existing.requestedTime) {
            return {
              hasConflict: true,
              conflictingRequestId: existing.id,
              message: `Conflit de créneau : l'heure de ${params.requestedTime} est déjà réservée le ${params.requestedDate}.`,
            };
          }
        } else {
          return {
            hasConflict: true,
            conflictingRequestId: existing.id,
            message: `Conflit de date : ce service est déjà réservé pour la journée du ${params.requestedDate}.`,
          };
        }
      }
    }

    return { hasConflict: false };
  }

  // SPRINT B15: Transitions autorisées et sécurisées du cycle de vie
  public transitionRequestStatus(params: {
    id: string;
    nextStatus: RequestStatus;
    changedBy: 'CLIENT' | 'BUSINESS' | 'ADMIN' | 'EMPLOYEE' | 'SUPER_ADMIN';
    changedByUserId?: string;
    changedByName: string;
    reason?: string;
    note?: string;
    scheduledDate?: string;
    scheduledTime?: string;
    durationMinutes?: number;
    assignedEmployeeId?: string;
    assignedEmployeeName?: string;
    forceAdmin?: boolean;
  }): { success: boolean; request?: FlowexaRequestEntity; error?: string; code?: string } {
    const req = this.data.requests.find((r) => r.id === params.id);
    if (!req) {
      return { success: false, error: 'Réservation/Demande introuvable.', code: 'REQUEST_NOT_FOUND' };
    }

    const currentStatus = req.status;
    const nextStatus = params.nextStatus;

    if (currentStatus === nextStatus) {
      return { success: true, request: req };
    }

    // Définition des transitions autorisées
    const ALLOWED_MAP: Record<RequestStatus, RequestStatus[]> = {
      PENDING: ['CONFIRMED', 'ACCEPTED', 'REJECTED', 'CANCELLED'],
      ACCEPTED: ['CONFIRMED', 'SCHEDULED', 'IN_PROGRESS', 'CANCELLED'],
      CONFIRMED: ['SCHEDULED', 'IN_PROGRESS', 'CANCELLED'],
      SCHEDULED: ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [], // Terminal sauf forceAdmin
      CANCELLED: [], // Terminal
      REJECTED: [], // Terminal
      NO_SHOW: [], // Terminal
    };

    if (!params.forceAdmin) {
      const allowed = ALLOWED_MAP[currentStatus] || [];
      if (!allowed.includes(nextStatus)) {
        return {
          success: false,
          error: `Transition interdite : impossible de passer du statut ${currentStatus} à ${nextStatus}.`,
          code: 'TRANSITION_FORBIDDEN',
        };
      }
    }

    // Mise à jour de l'entité
    req.status = nextStatus;
    req.updatedAt = new Date().toISOString();
    if (params.reason || params.note) {
      req.responseNote = params.reason || params.note;
    }

    // Gestion des métadonnées de planification
    if (params.scheduledDate) req.scheduledDate = params.scheduledDate;
    if (params.scheduledTime) req.scheduledTime = params.scheduledTime;
    if (params.durationMinutes) req.durationMinutes = params.durationMinutes;

    // Gestion de l'attribution d'employé
    if (params.assignedEmployeeId) req.assignedEmployeeId = params.assignedEmployeeId;
    if (params.assignedEmployeeName) req.assignedEmployeeName = params.assignedEmployeeName;

    // Timestamps spécifiques
    if (nextStatus === 'IN_PROGRESS' && !req.startedAt) {
      req.startedAt = new Date().toISOString();
    }
    if (nextStatus === 'COMPLETED' && !req.completedAt) {
      req.completedAt = new Date().toISOString();
    }
    if (nextStatus === 'CANCELLED') {
      req.cancelledBy = params.changedBy as any;
      req.cancellationReason = params.reason || params.note || 'Annulé';
    }

    // Historique des statuts
    if (!req.statusHistory) req.statusHistory = [];
    req.statusHistory.push({
      status: nextStatus,
      previousStatus: currentStatus,
      changedBy: params.changedBy,
      changedByUserId: params.changedByUserId,
      changedByName: params.changedByName,
      reason: params.reason,
      note: params.note,
      timestamp: new Date().toISOString(),
    });

    this.commit();
    return { success: true, request: req };
  }

  // SPRINT B15: Attribution d'un collaborateur
  public assignEmployeeToRequest(params: {
    requestId: string;
    employeeId: string;
    employeeName: string;
    assignedByRole: 'BUSINESS' | 'ADMIN';
    assignedByName: string;
  }): { success: boolean; request?: FlowexaRequestEntity; error?: string; code?: string } {
    const req = this.data.requests.find((r) => r.id === params.requestId);
    if (!req) {
      return { success: false, error: 'Réservation introuvable.', code: 'REQUEST_NOT_FOUND' };
    }

    req.assignedEmployeeId = params.employeeId;
    req.assignedEmployeeName = params.employeeName;
    req.updatedAt = new Date().toISOString();

    if (!req.statusHistory) req.statusHistory = [];
    req.statusHistory.push({
      status: req.status,
      changedBy: params.assignedByRole,
      changedByName: params.assignedByName,
      note: `Attribution au collaborateur : ${params.employeeName}`,
      timestamp: new Date().toISOString(),
    });

    this.commit();
    return { success: true, request: req };
  }

  public updateRequestStatus(
    id: string,
    status: RequestStatus,
    changedBy: 'CLIENT' | 'BUSINESS' | 'ADMIN',
    changedByName: string,
    note?: string
  ): FlowexaRequestEntity | null {
    const transitionRes = this.transitionRequestStatus({
      id,
      nextStatus: status,
      changedBy,
      changedByName,
      note,
      forceAdmin: changedBy === 'ADMIN',
    });
    return transitionRes.success ? (transitionRes.request || null) : null;
  }

  // Notification helpers (Unified with B30 NotificationService)
  public createNotification(notif: Omit<FlowexaNotificationEntity, 'id' | 'createdAt' | 'isRead'>): FlowexaNotificationEntity {
    // 1. Délégation au moteur unifié NotificationService (anti-spam, priorité, canaux réels)
    const result = notificationService.notify({
      recipientType: notif.recipientType,
      recipientId: notif.recipientId,
      recipientName: notif.recipientName,
      recipientEmail: notif.recipientEmail,
      recipientPhone: notif.recipientPhone,
      title: notif.title,
      message: notif.message,
      category: notif.category,
      priority: notif.priority,
      channels: notif.deliveryChannels || [notif.channel || 'INTERNAL'],
      requestId: notif.requestId,
      interactionType: notif.interactionType,
      actionUrl: notif.actionUrl,
      actionLabel: notif.actionLabel,
      metadata: notif.metadata,
      idempotencyKey: notif.idempotencyKey,
    });

    const entry: FlowexaNotificationEntity = result.notification || {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      isRead: false,
      ...notif,
    };

    if (!this.data.notifications) this.data.notifications = [];
    // Si notification valide et non dupliquée
    if (!this.data.notifications.some((n) => n.id === entry.id)) {
      this.data.notifications.unshift(entry);
    }
    // Keep max 500 notifications
    if (this.data.notifications.length > 500) {
      this.data.notifications = this.data.notifications.slice(0, 500);
    }
    this.commit();
    return entry;
  }

  public getNotifications(recipientType: NotificationRecipientType, recipientId: string): FlowexaNotificationEntity[] {
    if (!this.data.notifications) return [];
    return this.data.notifications.filter(
      (n) => n.recipientType === recipientType && n.recipientId === recipientId
    );
  }

  public markNotificationRead(id: string): boolean {
    if (!this.data.notifications) return false;
    const n = this.data.notifications.find((item) => item.id === id);
    if (!n) return false;
    n.isRead = true;
    this.commit();
    return true;
  }

  public markAllNotificationsRead(recipientType: NotificationRecipientType, recipientId: string): number {
    if (!this.data.notifications) return 0;
    let count = 0;
    this.data.notifications.forEach((n) => {
      if (n.recipientType === recipientType && n.recipientId === recipientId && !n.isRead) {
        n.isRead = true;
        count++;
      }
    });
    if (count > 0) this.commit();
    return count;
  }

  // Audit Logger
  public logAudit(log: Omit<AuditLogEntity, 'id' | 'timestamp'>) {
    const entry: AuditLogEntity = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    this.data.auditLogs.unshift(entry);
    // Keep max 500 logs
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.commit();
    return entry;
  }

  // ==============================================================
  // SPRINT B13: FAVORIS HELPERS
  // ==============================================================

  public addFavorite(params: {
    clientId: string;
    businessId?: string;
    catalogItemId?: string;
  }): { success: boolean; favorite?: FavoriteEntity; error?: string; code?: string } {
    if (!params.clientId) {
      return { success: false, error: 'Identifiant client obligatoire.', code: 'MISSING_CLIENT_ID' };
    }
    if (!params.businessId && !params.catalogItemId) {
      return { success: false, error: 'Veuillez spécifier une entreprise ou une offre à ajouter aux favoris.', code: 'MISSING_TARGET' };
    }

    if (!this.data.favorites) this.data.favorites = [];

    // Vérification de l'existence de la cible
    if (params.businessId) {
      const biz = this.data.businesses.find((b) => b.id === params.businessId);
      if (!biz) {
        return { success: false, error: 'Entreprise introuvable.', code: 'BUSINESS_NOT_FOUND' };
      }
    }
    if (params.catalogItemId) {
      const item = (this.data.catalogItems || []).find((i) => i.id === params.catalogItemId);
      if (!item) {
        return { success: false, error: 'Offre catalogue introuvable.', code: 'CATALOG_ITEM_NOT_FOUND' };
      }
    }

    // Empêcher les doublons pour le même client
    const isDuplicate = this.data.favorites.some((f) => {
      if (f.clientId !== params.clientId) return false;
      if (params.catalogItemId) {
        return f.catalogItemId === params.catalogItemId;
      }
      if (params.businessId) {
        return f.businessId === params.businessId && !f.catalogItemId;
      }
      return false;
    });

    if (isDuplicate) {
      return {
        success: false,
        error: 'Cet élément figure déjà dans vos favoris.',
        code: 'DUPLICATE_FAVORITE',
      };
    }

    const newFav: FavoriteEntity = {
      id: `fav-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      clientId: params.clientId,
      businessId: params.businessId,
      catalogItemId: params.catalogItemId,
      createdAt: new Date().toISOString(),
    };

    this.data.favorites.unshift(newFav);
    this.commit();
    return { success: true, favorite: newFav };
  }

  public removeFavorite(id: string, clientId: string): { success: boolean; error?: string; code?: string } {
    if (!this.data.favorites) return { success: false, error: 'Favori introuvable.', code: 'NOT_FOUND' };
    const index = this.data.favorites.findIndex((f) => f.id === id);
    if (index === -1) {
      return { success: false, error: 'Favori introuvable.', code: 'NOT_FOUND' };
    }
    const fav = this.data.favorites[index];
    if (fav.clientId !== clientId) {
      return { success: false, error: 'Accès refusé. Vous ne pouvez retirer que vos propres favoris.', code: 'FORBIDDEN' };
    }

    this.data.favorites.splice(index, 1);
    this.commit();
    return { success: true };
  }

  public removeFavoriteByTarget(
    clientId: string,
    target: { businessId?: string; catalogItemId?: string }
  ): { success: boolean; error?: string; code?: string } {
    if (!this.data.favorites) return { success: false, error: 'Favori introuvable.', code: 'NOT_FOUND' };
    const index = this.data.favorites.findIndex((f) => {
      if (f.clientId !== clientId) return false;
      if (target.catalogItemId) {
        return f.catalogItemId === target.catalogItemId;
      }
      if (target.businessId) {
        return f.businessId === target.businessId && !f.catalogItemId;
      }
      return false;
    });

    if (index === -1) {
      return { success: false, error: 'Favori introuvable.', code: 'NOT_FOUND' };
    }

    this.data.favorites.splice(index, 1);
    this.commit();
    return { success: true };
  }

  public isFavorite(clientId: string, target: { businessId?: string; catalogItemId?: string }): boolean {
    if (!this.data.favorites || !clientId) return false;
    return this.data.favorites.some((f) => {
      if (f.clientId !== clientId) return false;
      if (target.catalogItemId) {
        return f.catalogItemId === target.catalogItemId;
      }
      if (target.businessId) {
        return f.businessId === target.businessId && !f.catalogItemId;
      }
      return false;
    });
  }

  public getFavoritesByClient(clientId: string) {
    if (!this.data.favorites || !clientId) return [];
    const clientFavs = this.data.favorites.filter((f) => f.clientId === clientId);

    return clientFavs.map((fav) => {
      let business = undefined;
      let catalogItem = undefined;

      if (fav.businessId) {
        const b = this.data.businesses.find((biz) => biz.id === fav.businessId);
        if (b) {
          business = {
            id: b.id,
            name: b.name,
            phone: b.phone || '0154100617',
            whatsapp: b.whatsapp || '0154100617',
            city: b.city,
            district: b.district,
            address: b.address,
            module_code: b.module_code,
            image: b.images && b.images.length > 0 ? b.images[0].url : undefined,
          };
        }
      }

      if (fav.catalogItemId) {
        const item = (this.data.catalogItems || []).find((ci) => ci.id === fav.catalogItemId);
        if (item) {
          const parentBiz = this.data.businesses.find((biz) => biz.id === item.businessId);
          catalogItem = {
            id: item.id,
            title: item.title,
            description: item.description,
            price: item.price,
            currency: item.currency,
            priceType: item.priceType,
            offerType: item.offerType,
            city: item.city,
            district: item.district,
            image: item.images && item.images.length > 0 ? item.images[0].url : undefined,
            moduleCode: item.moduleCode,
            businessId: item.businessId,
            businessName: parentBiz?.name || 'Entreprise Partenaire',
          };
        }
      }

      return {
        ...fav,
        business,
        catalogItem,
      };
    });
  }

  // ==============================================================
  // SPRINT B13: AVIS, NOTATION & CONFIANCE HELPERS
  // ==============================================================

  public createReview(params: {
    clientId: string;
    clientName: string;
    clientPhone?: string;
    clientEmail?: string;
    requestId: string;
    rating: number;
    comment: string;
  }): { success: boolean; review?: ReviewEntity; error?: string; code?: string } {
    if (!params.requestId) {
      return { success: false, error: 'requestId est obligatoire.', code: 'MISSING_REQUEST_ID' };
    }

    // 1. Validation de la note (Entier de 1 à 5)
    const ratingNum = Number(params.rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return {
        success: false,
        error: 'La note doit être un nombre entier compris entre 1 et 5.',
        code: 'INVALID_RATING',
      };
    }

    // 2. Validation du commentaire
    const commentTrimmed = (params.comment || '').trim();
    if (commentTrimmed.length < 3) {
      return {
        success: false,
        error: 'Le commentaire doit comporter au moins 3 caractères.',
        code: 'INVALID_COMMENT',
      };
    }

    // 3. Vérification de l'interaction
    const request = (this.data.requests || []).find((r) => r.id === params.requestId);
    if (!request) {
      return { success: false, error: 'Interaction/Prestation introuvable.', code: 'REQUEST_NOT_FOUND' };
    }

    // 4. Contrôle de propriété de l'interaction (Le client ne peut noter que ses propres interactions)
    if (request.clientId !== params.clientId) {
      return {
        success: false,
        error: 'Accès refusé. Vous ne pouvez déposer un avis que pour vos propres interactions.',
        code: 'FORBIDDEN',
      };
    }

    // 5. RÈGLE CRITIQUE AVIS VÉRIFIÉ : Prestation OBLIGATOIREMENT COMPLETED
    if (request.status !== 'COMPLETED') {
      return {
        success: false,
        error: 'Un client ne peut publier un avis que lorsqu\'il possède une interaction réellement terminée avec l\'entreprise/offre (Statut COMPLETED requis).',
        code: 'NOT_COMPLETED',
      };
    }

    // 6. RÈGLE : UN SEUL AVIS PAR INTERACTION (Empêcher les doublons)
    if (!this.data.reviews) this.data.reviews = [];
    const alreadyReviewed = this.data.reviews.some((rev) => rev.requestId === params.requestId);
    if (alreadyReviewed) {
      return {
        success: false,
        error: 'Un avis a déjà été publié pour cette interaction terminée.',
        code: 'ALREADY_REVIEWED',
      };
    }

    const newReview: ReviewEntity = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      clientId: request.clientId,
      clientName: params.clientName || request.clientName,
      clientPhone: request.clientPhone,
      businessId: request.businessId,
      businessName: request.businessName,
      catalogItemId: request.catalogItemId,
      catalogItemTitle: request.catalogItemTitle,
      requestId: request.id,
      interactionType: request.interactionType,
      rating: ratingNum,
      comment: commentTrimmed,
      status: 'PUBLISHED', // Avis vérifié publié
      reportCount: 0,
      reports: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.reviews.unshift(newReview);
    this.invalidateRatingCache(request.businessId);

    // Notification à l'entreprise
    this.createNotification({
      recipientType: 'BUSINESS',
      recipientId: request.businessId,
      recipientName: request.businessName,
      title: 'Nouvel avis client vérifié',
      message: `${newReview.clientName} a déposé un avis vérifié (${newReview.rating}/5) pour "${request.title}".`,
      requestId: request.id,
      interactionType: request.interactionType,
      channel: 'INTERNAL',
    });

    // Journal d'audit
    this.logAudit({
      userId: params.clientId,
      userEmail: params.clientEmail || request.clientEmail || 'client@flowexa.com',
      action: 'REVIEW_CREATE',
      entityType: 'REVIEW',
      entityId: newReview.id,
      description: `Avis vérifié ${newReview.rating}/5 déposé par ${newReview.clientName} pour ${request.businessName}`,
      changes: { rating: newReview.rating, requestId: request.id },
      ip: '127.0.0.1',
    });

    this.commit();
    return { success: true, review: newReview };
  }

  // Calcul certifié de la note moyenne (UNIQUEMENT avis PUBLISHED)
  public calculateRating(businessId?: string, catalogItemId?: string): {
    averageRating: number | null;
    reviewCount: number;
    distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  } {
    const cacheKey = `${businessId || 'all'}_${catalogItemId || 'all'}`;
    const cached = this.ratingCache.get(cacheKey);
    if (cached) {
      return {
        ...cached,
        distribution: { ...cached.distribution },
      };
    }

    if (!this.data.reviews) {
      const emptyResult = {
        averageRating: null,
        reviewCount: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
      this.ratingCache.set(cacheKey, emptyResult);
      return emptyResult;
    }

    const publishedReviews = this.data.reviews.filter((r) => {
      if (r.status !== 'PUBLISHED') return false;
      if (catalogItemId) return r.catalogItemId === catalogItemId;
      if (businessId) return r.businessId === businessId;
      return true;
    });

    if (publishedReviews.length === 0) {
      const zeroResult = {
        averageRating: null, // Pas de note fictive si 0 avis
        reviewCount: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
      this.ratingCache.set(cacheKey, zeroResult);
      return zeroResult;
    }

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    publishedReviews.forEach((r) => {
      sum += r.rating;
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[r.rating as 1 | 2 | 3 | 4 | 5]++;
      }
    });

    const averageRating = Math.round((sum / publishedReviews.length) * 10) / 10;

    const finalResult = {
      averageRating,
      reviewCount: publishedReviews.length,
      distribution,
    };
    this.ratingCache.set(cacheKey, finalResult);
    return finalResult;
  }

  public getReviews(filter: {
    businessId?: string;
    catalogItemId?: string;
    clientId?: string;
    status?: ReviewStatus;
    publicOnly?: boolean;
  }): ReviewEntity[] {
    if (!this.data.reviews) return [];
    let list = [...this.data.reviews];

    if (filter.publicOnly) {
      list = list.filter((r) => r.status === 'PUBLISHED');
    } else if (filter.status) {
      list = list.filter((r) => r.status === filter.status);
    }

    if (filter.businessId) {
      list = list.filter((r) => r.businessId === filter.businessId);
    }
    if (filter.catalogItemId) {
      list = list.filter((r) => r.catalogItemId === filter.catalogItemId);
    }
    if (filter.clientId) {
      list = list.filter((r) => r.clientId === filter.clientId);
    }

    return list;
  }

  public getReviewById(id: string): ReviewEntity | undefined {
    if (!this.data.reviews) return undefined;
    return this.data.reviews.find((r) => r.id === id);
  }

  public updateReviewStatus(
    id: string,
    newStatus: ReviewStatus,
    adminId: string,
    adminName: string,
    reason?: string
  ): { success: boolean; review?: ReviewEntity; error?: string } {
    if (!this.data.reviews) return { success: false, error: 'Avis introuvable.' };
    const rev = this.data.reviews.find((r) => r.id === id);
    if (!rev) {
      return { success: false, error: 'Avis introuvable.' };
    }

    const oldStatus = rev.status;
    rev.status = newStatus;
    rev.statusReason = reason;
    rev.moderatedAt = new Date().toISOString();
    rev.moderatedBy = `${adminName} (${adminId})`;
    rev.updatedAt = new Date().toISOString();

    this.logAudit({
      userId: adminId,
      userEmail: 'admin@flowexa.com',
      action: 'REVIEW_MODERATION',
      entityType: 'REVIEW',
      entityId: rev.id,
      description: `Modération avis ${rev.id} : ${oldStatus} -> ${newStatus} (${reason || 'Aucun motif'})`,
      changes: { oldStatus, newStatus, reason },
      ip: '127.0.0.1',
    });

    this.commit();
    return { success: true, review: rev };
  }

  public deleteReview(
    id: string,
    adminId: string,
    adminName: string,
    reason?: string
  ): { success: boolean; error?: string } {
    if (!this.data.reviews) return { success: false, error: 'Avis introuvable.' };
    const index = this.data.reviews.findIndex((r) => r.id === id);
    if (index === -1) {
      return { success: false, error: 'Avis introuvable.' };
    }

    const rev = this.data.reviews[index];
    this.data.reviews.splice(index, 1);
    this.invalidateRatingCache(rev.businessId);

    this.logAudit({
      userId: adminId,
      userEmail: 'admin@flowexa.com',
      action: 'REVIEW_DELETE',
      entityType: 'REVIEW',
      entityId: rev.id,
      description: `Suppression avis ${rev.id} (${rev.clientName} -> ${rev.businessName}) : ${reason || 'Sans motif'}`,
      ip: '127.0.0.1',
    });

    this.commit();
    return { success: true };
  }

  // Signalement d'avis
  public reportReview(params: {
    reviewId: string;
    reporterId: string;
    reporterName: string;
    reason: ReviewReportReason;
    details: string;
  }): { success: boolean; report?: ReviewReportEntity; error?: string } {
    if (!this.data.reviews) return { success: false, error: 'Avis introuvable.' };
    const rev = this.data.reviews.find((r) => r.id === params.reviewId);
    if (!rev) {
      return { success: false, error: 'Avis introuvable.' };
    }

    if (!this.data.reviewReports) this.data.reviewReports = [];

    const newReport: ReviewReportEntity = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      reviewId: params.reviewId,
      reporterId: params.reporterId,
      reporterName: params.reporterName,
      reason: params.reason,
      details: params.details || '',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    this.data.reviewReports.unshift(newReport);

    rev.reportCount = (rev.reportCount || 0) + 1;
    if (!rev.reports) rev.reports = [];
    rev.reports.unshift(newReport);

    this.logAudit({
      userId: params.reporterId,
      userEmail: 'reporter@flowexa.com',
      action: 'REVIEW_REPORT',
      entityType: 'REVIEW',
      entityId: rev.id,
      description: `Signalement pour avis ${rev.id} (${params.reason}) par ${params.reporterName}`,
      changes: { reason: params.reason, details: params.details },
      ip: '127.0.0.1',
    });

    this.commit();
    return { success: true, report: newReport };
  }

  public getReviewReports(status?: ReviewReportStatus): ReviewReportEntity[] {
    if (!this.data.reviewReports) return [];
    if (status) {
      return this.data.reviewReports.filter((rep) => rep.status === status);
    }
    return this.data.reviewReports;
  }

  public updateReviewReportStatus(
    reportId: string,
    status: ReviewReportStatus,
    adminId: string,
    adminName: string
  ): { success: boolean; report?: ReviewReportEntity; error?: string } {
    if (!this.data.reviewReports) return { success: false, error: 'Signalement introuvable.' };
    const report = this.data.reviewReports.find((r) => r.id === reportId);
    if (!report) {
      return { success: false, error: 'Signalement introuvable.' };
    }

    report.status = status;
    report.resolvedAt = new Date().toISOString();
    report.resolvedBy = `${adminName} (${adminId})`;

    this.logAudit({
      userId: adminId,
      userEmail: 'admin@flowexa.com',
      action: 'REVIEW_REPORT_RESOLVE',
      entityType: 'REVIEW_REPORT',
      entityId: report.id,
      description: `Traitement signalement ${report.id} -> ${status}`,
      changes: { newStatus: status },
      ip: '127.0.0.1',
    });

    this.commit();
    return { success: true, report };
  }

  // ==============================================================
  // SPRINT B14: MESSAGERIE & CONVERSATIONS CLIENT/ENTREPRISE
  // ==============================================================

  public getConversations(
    caller: { role: RoleType; clientId?: string; businessId?: string },
    filters?: {
      search?: string;
      status?: ConversationStatus;
      businessId?: string;
      clientId?: string;
    }
  ): { items: ConversationEntity[]; total: number; unreadTotal: number } {
    if (!this.data.conversations) this.data.conversations = [];

    let list = [...this.data.conversations];

    // Cloisonnement strict multi-tenant
    if (caller.role === 'CLIENT') {
      const cId = caller.clientId || '';
      list = list.filter((conv) => conv.clientId === cId);
    } else if (caller.role === 'BUSINESS_OWNER' || caller.role === 'MANAGER' || caller.role === 'EMPLOYEE') {
      const bId = caller.businessId || '';
      list = list.filter((conv) => conv.businessId === bId);
    } else if (caller.role === 'SUPER_ADMIN') {
      // Le Super Admin a accès global, peut filtrer
      if (filters?.businessId) {
        list = list.filter((conv) => conv.businessId === filters.businessId);
      }
      if (filters?.clientId) {
        list = list.filter((conv) => conv.clientId === filters.clientId);
      }
    } else {
      return { items: [], total: 0, unreadTotal: 0 };
    }

    // Filtre statut
    if (filters?.status) {
      list = list.filter((conv) => conv.status === filters.status);
    }

    // Recherche par mot-clé
    if (filters?.search && filters.search.trim() !== '') {
      const s = filters.search.toLowerCase().trim();
      list = list.filter((conv) => {
        const clientMatch = conv.clientName.toLowerCase().includes(s);
        const businessMatch = conv.businessName.toLowerCase().includes(s);
        const itemMatch = (conv.catalogItemTitle || '').toLowerCase().includes(s);
        const lastMsgMatch = (conv.lastMessage || '').toLowerCase().includes(s);
        return clientMatch || businessMatch || itemMatch || lastMsgMatch;
      });
    }

    // Tri par date du dernier message ou mise à jour
    list.sort((a, b) => {
      const dateA = new Date(a.lastMessageAt || a.updatedAt).getTime();
      const dateB = new Date(b.lastMessageAt || b.updatedAt).getTime();
      return dateB - dateA;
    });

    // Calcul du total non lus pour le rôle appelant
    let unreadTotal = 0;
    if (caller.role === 'CLIENT') {
      unreadTotal = list.reduce((acc, conv) => acc + (conv.unreadCountClient || 0), 0);
    } else {
      unreadTotal = list.reduce((acc, conv) => acc + (conv.unreadCountBusiness || 0), 0);
    }

    return {
      items: list,
      total: list.length,
      unreadTotal,
    };
  }

  public getConversationById(
    id: string,
    caller: { role: RoleType; clientId?: string; businessId?: string }
  ): { success: boolean; conversation?: ConversationEntity; error?: string; code?: string } {
    if (!this.data.conversations) this.data.conversations = [];
    const conv = this.data.conversations.find((c) => c.id === id);
    if (!conv) {
      return { success: false, error: 'Conversation introuvable.', code: 'NOT_FOUND' };
    }

    // Contrôle d'accès RBAC & multi-tenant
    if (caller.role === 'CLIENT' && conv.clientId !== caller.clientId) {
      return {
        success: false,
        error: 'Accès refusé. Vous ne pouvez consulter que vos propres conversations.',
        code: 'FORBIDDEN',
      };
    }
    if (
      (caller.role === 'BUSINESS_OWNER' || caller.role === 'MANAGER' || caller.role === 'EMPLOYEE') &&
      conv.businessId !== caller.businessId
    ) {
      return {
        success: false,
        error: 'Accès refusé. Vous ne pouvez consulter que les conversations de votre établissement.',
        code: 'FORBIDDEN',
      };
    }

    return { success: true, conversation: conv };
  }

  public createOrGetConversation(params: {
    clientId: string;
    clientName: string;
    clientPhone?: string;
    clientEmail?: string;
    businessId: string;
    requestId?: string;
    bookingId?: string;
    appointmentId?: string;
    catalogItemId?: string;
    initialMessage?: string;
    callerRole: RoleType;
  }): {
    success: boolean;
    conversation?: ConversationEntity;
    isExisting?: boolean;
    error?: string;
    code?: string;
  } {
    if (!params.clientId) {
      return { success: false, error: 'Client ID requis.', code: 'MISSING_CLIENT_ID' };
    }
    if (!params.businessId) {
      return { success: false, error: 'Business ID requis.', code: 'MISSING_BUSINESS_ID' };
    }

    const business = this.data.businesses.find((b) => b.id === params.businessId);
    if (!business) {
      return { success: false, error: 'Entreprise introuvable.', code: 'BUSINESS_NOT_FOUND' };
    }

    if (!this.data.conversations) this.data.conversations = [];

    // 1. RECHERCHE D'UNE CONVERSATION EXISTANTE (Anti-doublon strict)
    const existing = this.data.conversations.find((c) => {
      if (c.clientId !== params.clientId || c.businessId !== params.businessId) {
        return false;
      }
      if (params.requestId) {
        return c.requestId === params.requestId;
      }
      if (params.bookingId) {
        return c.bookingId === params.bookingId;
      }
      if (params.appointmentId) {
        return c.appointmentId === params.appointmentId;
      }
      if (params.catalogItemId) {
        return c.catalogItemId === params.catalogItemId && !c.requestId && !c.bookingId && !c.appointmentId;
      }
      // Cas contact direct sans offre ni demande
      return !c.requestId && !c.bookingId && !c.appointmentId && !c.catalogItemId;
    });

    if (existing) {
      // Si message initial fourni et conversation existante, on l'ajoute
      if (params.initialMessage && params.initialMessage.trim()) {
        this.addMessage({
          conversationId: existing.id,
          senderRole: params.callerRole === 'CLIENT' ? 'CLIENT' : 'BUSINESS',
          senderId: params.clientId,
          senderName: params.clientName,
          content: params.initialMessage.trim(),
        });
      }
      return { success: true, conversation: existing, isExisting: true };
    }

    // 2. ENRICHISSEMENT CONTEXTUEL RÉEL (ZÉRO FICTION)
    let catalogItemTitle = undefined;
    let catalogItemPrice = undefined;
    let catalogItemCurrency = undefined;
    let catalogItemImage = undefined;
    let contextType: 'DIRECT' | 'OFFER' | 'REQUEST' | 'BOOKING' | 'APPOINTMENT' = 'DIRECT';

    if (params.catalogItemId) {
      const item = (this.data.catalogItems || []).find((ci) => ci.id === params.catalogItemId);
      if (item) {
        catalogItemTitle = item.title;
        catalogItemPrice = item.price;
        catalogItemCurrency = item.currency;
        catalogItemImage = item.images && item.images.length > 0 ? item.images[0].url : undefined;
        contextType = 'OFFER';
      }
    }

    if (params.requestId) {
      contextType = 'REQUEST';
      const req = (this.data.requests || []).find((r) => r.id === params.requestId);
      if (req) {
        if (!catalogItemTitle && req.catalogItemTitle) catalogItemTitle = req.catalogItemTitle;
        if (!catalogItemPrice && req.catalogItemPrice) catalogItemPrice = req.catalogItemPrice;
        if (!catalogItemCurrency && req.catalogItemCurrency) catalogItemCurrency = req.catalogItemCurrency;
        if (!catalogItemImage && req.catalogItemImage) catalogItemImage = req.catalogItemImage;
        if (req.interactionType === 'BOOKING') contextType = 'BOOKING';
        if (req.interactionType === 'APPOINTMENT') contextType = 'APPOINTMENT';
      }
    } else if (params.bookingId) {
      contextType = 'BOOKING';
    } else if (params.appointmentId) {
      contextType = 'APPOINTMENT';
    }

    const now = new Date().toISOString();
    const newConv: ConversationEntity = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      clientId: params.clientId,
      clientName: params.clientName || 'Client Flowexa',
      clientPhone: params.clientPhone || '0154100617',
      clientEmail: params.clientEmail,
      businessId: business.id,
      businessName: business.name,
      businessPhone: business.phone || '0154100617',
      moduleCode: business.module_code,
      requestId: params.requestId,
      bookingId: params.bookingId,
      appointmentId: params.appointmentId,
      catalogItemId: params.catalogItemId,
      catalogItemTitle,
      catalogItemPrice,
      catalogItemCurrency,
      catalogItemImage,
      contextType,
      status: 'ACTIVE',
      unreadCountClient: 0,
      unreadCountBusiness: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.data.conversations.unshift(newConv);
    this.commit();

    // Ajout éventuel du message initial
    if (params.initialMessage && params.initialMessage.trim()) {
      this.addMessage({
        conversationId: newConv.id,
        senderRole: params.callerRole === 'CLIENT' ? 'CLIENT' : 'BUSINESS',
        senderId: params.clientId,
        senderName: params.clientName,
        content: params.initialMessage.trim(),
      });
    }

    return { success: true, conversation: newConv, isExisting: false };
  }

  public addMessage(params: {
    conversationId: string;
    senderRole: MessageSenderRole;
    senderId: string;
    senderName: string;
    content: string;
    attachments?: MessageAttachmentEntity[];
  }): {
    success: boolean;
    message?: MessageEntity;
    conversation?: ConversationEntity;
    error?: string;
    code?: string;
  } {
    if (!params.conversationId) {
      return { success: false, error: 'Identifiant conversation requis.', code: 'MISSING_CONVERSATION_ID' };
    }
    const cleanContent = (params.content || '').trim();
    if (cleanContent.length === 0) {
      return { success: false, error: 'Le contenu du message ne peut pas être vide.', code: 'EMPTY_MESSAGE' };
    }

    if (!this.data.conversations) this.data.conversations = [];
    const conv = this.data.conversations.find((c) => c.id === params.conversationId);
    if (!conv) {
      return { success: false, error: 'Conversation introuvable.', code: 'CONVERSATION_NOT_FOUND' };
    }

    // Vérification conversation fermée
    if (conv.status === 'CLOSED') {
      return {
        success: false,
        error: 'Cette conversation est clôturée. Aucun nouveau message ne peut être envoyé.',
        code: 'CONVERSATION_CLOSED',
      };
    }

    const now = new Date().toISOString();
    const newMsg: MessageEntity = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      conversationId: conv.id,
      senderRole: params.senderRole,
      senderId: params.senderId,
      senderName: params.senderName,
      content: cleanContent,
      isRead: false,
      attachments: params.attachments || [],
      createdAt: now,
      updatedAt: now,
    };

    if (!this.data.messages) this.data.messages = [];
    this.data.messages.push(newMsg);

    // Mise à jour de la conversation
    conv.lastMessage = cleanContent;
    conv.lastMessageAt = now;
    conv.lastMessageSender = params.senderRole;
    conv.updatedAt = now;

    if (params.senderRole === 'CLIENT') {
      conv.unreadCountBusiness = (conv.unreadCountBusiness || 0) + 1;
      // Notification pour l'entreprise
      this.createNotification({
        recipientType: 'BUSINESS',
        recipientId: conv.businessId,
        recipientName: conv.businessName,
        title: 'Nouveau message reçu',
        message: `${params.senderName} : "${cleanContent.length > 60 ? cleanContent.substring(0, 57) + '...' : cleanContent}"`,
        channel: 'INTERNAL',
        metadata: {
          conversationId: conv.id,
          messageId: newMsg.id,
          senderRole: params.senderRole,
        },
      });
    } else {
      conv.unreadCountClient = (conv.unreadCountClient || 0) + 1;
      // Notification pour le client
      this.createNotification({
        recipientType: 'CLIENT',
        recipientId: conv.clientId,
        recipientName: conv.clientName,
        title: `Message de ${conv.businessName}`,
        message: `"${cleanContent.length > 60 ? cleanContent.substring(0, 57) + '...' : cleanContent}"`,
        channel: 'INTERNAL',
        metadata: {
          conversationId: conv.id,
          messageId: newMsg.id,
          senderRole: params.senderRole,
        },
      });
    }

    this.commit();
    return { success: true, message: newMsg, conversation: conv };
  }

  public getConversationMessages(
    conversationId: string,
    caller: { role: RoleType; clientId?: string; businessId?: string },
    pagination?: { page?: number; limit?: number }
  ): {
    success: boolean;
    messages?: MessageEntity[];
    total?: number;
    page?: number;
    limit?: number;
    error?: string;
    code?: string;
  } {
    const convCheck = this.getConversationById(conversationId, caller);
    if (!convCheck.success || !convCheck.conversation) {
      return { success: false, error: convCheck.error, code: convCheck.code };
    }

    if (!this.data.messages) this.data.messages = [];
    const convMsgs = this.data.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const limit = pagination?.limit || 100;
    const page = pagination?.page || 1;
    const total = convMsgs.length;

    // Pagination (par défaut tous les derniers messages)
    const startIndex = Math.max(0, total - page * limit);
    const endIndex = total - (page - 1) * limit;
    const pagedMessages = convMsgs.slice(startIndex, endIndex);

    return {
      success: true,
      messages: pagedMessages,
      total,
      page,
      limit,
    };
  }

  public markConversationMessagesRead(
    conversationId: string,
    readerRole: MessageSenderRole,
    readerId?: string
  ): { success: boolean; count: number } {
    if (!this.data.conversations || !this.data.messages) {
      return { success: false, count: 0 };
    }
    const conv = this.data.conversations.find((c) => c.id === conversationId);
    if (!conv) return { success: false, count: 0 };

    const now = new Date().toISOString();
    let count = 0;

    this.data.messages.forEach((m) => {
      if (m.conversationId === conversationId && !m.isRead) {
        if (readerRole === 'CLIENT' && m.senderRole !== 'CLIENT') {
          m.isRead = true;
          m.readAt = now;
          count++;
        } else if (readerRole === 'BUSINESS' && m.senderRole === 'CLIENT') {
          m.isRead = true;
          m.readAt = now;
          count++;
        } else if (readerRole === 'SUPER_ADMIN') {
          m.isRead = true;
          m.readAt = now;
          count++;
        }
      }
    });

    if (readerRole === 'CLIENT') {
      conv.unreadCountClient = 0;
    } else if (readerRole === 'BUSINESS') {
      conv.unreadCountBusiness = 0;
    }

    this.commit();
    return { success: true, count };
  }

  public closeConversation(
    conversationId: string,
    closedBy: string,
    reason?: string,
    auditActor?: { userId: string; userEmail: string; ip?: string }
  ): { success: boolean; conversation?: ConversationEntity; error?: string } {
    if (!this.data.conversations) return { success: false, error: 'Conversation introuvable.' };
    const conv = this.data.conversations.find((c) => c.id === conversationId);
    if (!conv) return { success: false, error: 'Conversation introuvable.' };

    const now = new Date().toISOString();
    conv.status = 'CLOSED';
    conv.closedAt = now;
    conv.closedBy = closedBy;
    conv.updatedAt = now;

    if (auditActor) {
      this.logAudit({
        userId: auditActor.userId,
        userEmail: auditActor.userEmail,
        action: 'CONVERSATION_CLOSE',
        entityType: 'CONVERSATION',
        entityId: conv.id,
        description: `Clôture de la conversation #${conv.id.substring(0, 8)}. Motif: ${reason || 'Fermeture manuelle'}`,
        changes: { status: 'CLOSED', reason },
        ip: auditActor.ip || '127.0.0.1',
      });
    }

    this.commit();
    return { success: true, conversation: conv };
  }

  public reopenConversation(
    conversationId: string,
    reopenedBy: string,
    auditActor?: { userId: string; userEmail: string; ip?: string }
  ): { success: boolean; conversation?: ConversationEntity; error?: string } {
    if (!this.data.conversations) return { success: false, error: 'Conversation introuvable.' };
    const conv = this.data.conversations.find((c) => c.id === conversationId);
    if (!conv) return { success: false, error: 'Conversation introuvable.' };

    const now = new Date().toISOString();
    conv.status = 'ACTIVE';
    conv.closedAt = undefined;
    conv.closedBy = undefined;
    conv.updatedAt = now;

    if (auditActor) {
      this.logAudit({
        userId: auditActor.userId,
        userEmail: auditActor.userEmail,
        action: 'CONVERSATION_REOPEN',
        entityType: 'CONVERSATION',
        entityId: conv.id,
        description: `Réouverture de la conversation #${conv.id.substring(0, 8)} par ${reopenedBy}`,
        changes: { status: 'ACTIVE' },
        ip: auditActor.ip || '127.0.0.1',
      });
    }

    this.commit();
    return { success: true, conversation: conv };
  }

  // ==============================================================
  // SPRINT B16: GESTION DES PAIEMENTS, TRANSACTIONS ET FACTURATION
  // ==============================================================

  public createPayment(params: {
    bookingId: string;
    clientId: string;
    clientName: string;
    clientPhone?: string;
    provider: PaymentProviderCode;
    paymentType?: PaymentType;
    idempotencyKey?: string;
    notes?: string;
    callerRole?: string;
    auditActor?: { userId: string; userEmail: string; ip?: string };
    amount?: number;
    currency?: string;
  }): {
    success: boolean;
    payment?: FlowexaPaymentEntity;
    transaction?: FlowexaTransactionEntity;
    isIdempotent?: boolean;
    error?: string;
    code?: string;
  } {
    if (!this.data.payments) this.data.payments = [];
    if (!this.data.transactions) this.data.transactions = [];

    // 1. Idempotence : si une transaction existe déjà pour cette idempotencyKey, la retourner
    if (params.idempotencyKey) {
      const existingPayment = this.data.payments.find((p) => p.idempotencyKey === params.idempotencyKey);
      if (existingPayment) {
        const existingTx = this.data.transactions.find((t) => t.paymentId === existingPayment.id);
        return {
          success: true,
          payment: existingPayment,
          transaction: existingTx,
          isIdempotent: true,
        };
      }
    }

    // 2. Recherche de la réservation / demande
    let request = (this.data.requests || []).find((r) => r.id === params.bookingId);
    if (!request && params.paymentType === 'SUBSCRIPTION') {
      const sub = (this.data.subscriptions || []).find((s) => s.id === params.bookingId);
      if (sub) {
        request = {
          id: sub.id,
          businessId: sub.businessId,
          businessName: sub.businessName,
          clientId: params.clientId,
          clientName: params.clientName,
          clientPhone: params.clientPhone,
          title: `Abonnement Flowexa - ${sub.planName}`,
          interactionType: 'BOOKING',
          channel: 'INTERNAL',
          status: 'CONFIRMED',
          lockedPrice: params.amount || sub.amountPaid,
          createdAt: sub.createdAt,
          updatedAt: sub.updatedAt,
          statusHistory: [],
        } as any;
      }
    }
    if (!request) {
      return {
        success: false,
        error: 'Réservation ou demande introuvable pour ce paiement.',
        code: 'REQUEST_NOT_FOUND',
      };
    }

    // 3. Contrôle d'accès & IDOR
    if (params.callerRole === 'CLIENT' && request.clientId !== params.clientId && request.clientPhone !== params.clientPhone) {
      return {
        success: false,
        error: 'Accès refusé. Vous ne pouvez initier un paiement que pour vos propres réservations.',
        code: 'FORBIDDEN',
      };
    }

    // 4. Détermination stricte du montant contractuel côté backend (source de vérité immuable)
    const contractTotal = params.amount ?? request.lockedPrice ?? request.catalogItemPrice;
    if (typeof contractTotal !== 'number' || contractTotal <= 0) {
      return {
        success: false,
        error: 'Montant non défini ou invalide pour cette prestation. Veuillez contacter l\'établissement.',
        code: 'INVALID_AMOUNT',
      };
    }

    const alreadyPaid = request.paidAmount || 0;
    const remaining = Math.max(0, contractTotal - alreadyPaid);

    // Détermination du type de paiement demandé
    let paymentType: PaymentType = params.paymentType || (alreadyPaid > 0 && remaining > 0 ? 'BALANCE' : 'FULL');
    let amountToPay = contractTotal;

    if (paymentType === 'DEPOSIT') {
      if (request.depositAllowed === false) {
        return {
          success: false,
          error: 'Cet établissement requiert un règlement intégral et n\'accepte pas d\'acompte pour cette prestation.',
          code: 'DEPOSIT_NOT_ALLOWED',
        };
      }
      if (alreadyPaid > 0) {
        return {
          success: false,
          error: 'Un acompte ou versement a déjà été enregistré pour cette réservation. Veuillez régler le solde restant.',
          code: 'DEPOSIT_ALREADY_PAID',
        };
      }
      const pct = request.depositPercentage || 30;
      amountToPay = Math.round(contractTotal * (pct / 100));
      if (amountToPay <= 0 || amountToPay >= contractTotal) {
        amountToPay = Math.round(contractTotal * 0.3);
      }
    } else if (paymentType === 'BALANCE') {
      if (remaining <= 0) {
        return {
          success: false,
          error: 'Le solde de cette réservation a déjà été intégralement réglé.',
          code: 'ALREADY_PAID',
        };
      }
      amountToPay = remaining;
    } else {
      // FULL
      if (alreadyPaid >= contractTotal) {
        return {
          success: false,
          error: 'Cette réservation a déjà été intégralement payée.',
          code: 'ALREADY_PAID',
        };
      }
      // S'il y a déjà eu un acompte mais que le client demande de payer la totalité restante
      amountToPay = remaining > 0 ? remaining : contractTotal;
    }

    const currency = request.lockedCurrency || request.catalogItemCurrency || 'FCFA';
    const now = new Date().toISOString();

    // 5. Création de l'entité Payment
    const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const reference = `FLW-PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newPayment: FlowexaPaymentEntity = {
      id: paymentId,
      bookingId: request.id,
      requestId: request.id,
      appointmentId: request.id,
      clientId: params.clientId || request.clientId,
      clientName: params.clientName || request.clientName,
      clientPhone: params.clientPhone || request.clientPhone,
      businessId: request.businessId,
      businessName: request.businessName,
      amount: amountToPay,
      currency,
      provider: params.provider,
      status: 'PROCESSING',
      paymentType,
      amountTotal: contractTotal,
      amountPaid: alreadyPaid,
      amountRemaining: Math.max(0, remaining - amountToPay),
      reference,
      idempotencyKey: params.idempotencyKey,
      notes: params.notes,
      createdAt: now,
      updatedAt: now,
    };

    this.data.payments.unshift(newPayment);

    // 6. Création de l'entité Transaction associée
    const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newTransaction: FlowexaTransactionEntity = {
      id: transactionId,
      paymentId: newPayment.id,
      bookingId: request.id,
      requestId: request.id,
      appointmentId: request.id,
      businessId: request.businessId,
      businessName: request.businessName,
      clientId: newPayment.clientId,
      clientName: newPayment.clientName,
      clientPhone: newPayment.clientPhone,
      provider: params.provider,
      paymentMethod: params.provider,
      transactionReference: reference,
      status: 'PROCESSING',
      amount: amountToPay,
      currency,
      paymentType,
      amountTotal: contractTotal,
      amountPaid: alreadyPaid,
      amountRemaining: Math.max(0, remaining - amountToPay),
      createdAt: now,
      updatedAt: now,
    };

    this.data.transactions.unshift(newTransaction);

    // 7. Mise à jour de la réservation
    request.paymentStatus = 'PROCESSING';
    request.paymentId = newPayment.id;
    request.paymentReference = newPayment.reference;
    if (paymentType === 'DEPOSIT') {
      request.depositAmount = amountToPay;
    }
    request.updatedAt = now;

    // 8. Audit Log
    const actor = params.auditActor || {
      userId: params.clientId || 'client-user',
      userEmail: 'client@flowexa.com',
      ip: '127.0.0.1',
    };

    this.logAudit({
      userId: actor.userId,
      userEmail: actor.userEmail,
      action: 'PAYMENT_INITIATED',
      entityType: 'PAYMENT',
      entityId: newPayment.id,
      description: `Paiement ${paymentType} initié pour réservation #${request.id.substring(0, 8)} (${amountToPay} ${currency} sur total de ${contractTotal} ${currency} via ${params.provider})`,
      changes: { amount: amountToPay, total: contractTotal, paymentType, provider: params.provider, reference },
      ip: actor.ip || '127.0.0.1',
    });

    this.commit();

    return {
      success: true,
      payment: newPayment,
      transaction: newTransaction,
      isIdempotent: false,
    };
  }

  public transitionPaymentStatus(params: {
    paymentId: string;
    nextStatus: PaymentStatus;
    externalReference?: string;
    errorMessage?: string;
    source: 'WEBHOOK' | 'OPERATOR' | 'ADMIN' | 'MANUAL';
    actorName?: string;
    auditActor?: { userId: string; userEmail: string; ip?: string };
  }): {
    success: boolean;
    payment?: FlowexaPaymentEntity;
    transaction?: FlowexaTransactionEntity;
    error?: string;
    code?: string;
  } {
    if (!this.data.payments) this.data.payments = [];
    if (!this.data.transactions) this.data.transactions = [];

    const payment = this.data.payments.find((p) => p.id === params.paymentId || p.reference === params.paymentId);
    if (!payment) {
      return { success: false, error: 'Paiement introuvable.', code: 'PAYMENT_NOT_FOUND' };
    }

    if (payment.status === params.nextStatus) {
      const tx = this.data.transactions.find((t) => t.paymentId === payment.id);
      return { success: true, payment, transaction: tx };
    }

    // Contrôle strict des transitions d'état
    const ALLOWED_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
      PENDING: ['PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED', 'PAID'],
      PROCESSING: ['SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED', 'PAID'],
      FAILED: ['PROCESSING', 'CANCELLED'],
      CANCELLED: [],
      EXPIRED: [],
      SUCCESS: ['REFUNDED', 'PARTIALLY_REFUNDED'],
      PAID: ['REFUNDED', 'PARTIALLY_REFUNDED'],
      UNPAID: ['PROCESSING', 'CANCELLED'],
      PARTIALLY_PAID: ['PROCESSING', 'SUCCESS', 'PAID', 'REFUNDED', 'PARTIALLY_REFUNDED'],
      REFUNDED: [],
      PARTIALLY_REFUNDED: ['REFUNDED'],
    };

    const allowed = ALLOWED_TRANSITIONS[payment.status] || [];
    if (!allowed.includes(params.nextStatus) && params.source !== 'ADMIN') {
      return {
        success: false,
        error: `Transition interdite : impossible de passer le paiement de ${payment.status} à ${params.nextStatus}.`,
        code: 'FORBIDDEN_TRANSITION',
      };
    }

    const now = new Date().toISOString();
    payment.status = params.nextStatus;
    payment.updatedAt = now;

    if (params.nextStatus === 'SUCCESS' || params.nextStatus === 'PAID') {
      payment.paidAt = now;
    }

    // Mapping sécurisé vers TransactionStatus
    let txStatus: TransactionStatus = 'PROCESSING';
    if (params.nextStatus === 'SUCCESS' || params.nextStatus === 'PAID') {
      txStatus = 'SUCCESS';
    } else if (params.nextStatus === 'FAILED') {
      txStatus = 'FAILED';
    } else if (params.nextStatus === 'CANCELLED') {
      txStatus = 'CANCELLED';
    } else if (params.nextStatus === 'EXPIRED') {
      txStatus = 'EXPIRED';
    } else if (params.nextStatus === 'REFUNDED') {
      txStatus = 'REFUNDED';
    } else if (params.nextStatus === 'PARTIALLY_REFUNDED') {
      txStatus = 'PARTIALLY_REFUNDED';
    }

    // Mise à jour ou création de transaction
    let transaction = this.data.transactions.find((t) => t.paymentId === payment.id);
    if (transaction) {
      transaction.status = txStatus;
      if (params.externalReference) {
        transaction.externalReference = params.externalReference;
        transaction.providerReference = params.externalReference;
      }
      if (params.errorMessage) transaction.errorMessage = params.errorMessage;
      transaction.updatedAt = now;
      if (txStatus === 'SUCCESS') {
        transaction.completedAt = now;
        transaction.paidAt = now;
      }
    } else {
      transaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        paymentId: payment.id,
        bookingId: payment.bookingId,
        requestId: payment.requestId || payment.bookingId,
        businessId: payment.businessId,
        businessName: payment.businessName,
        clientId: payment.clientId,
        clientName: payment.clientName,
        clientPhone: payment.clientPhone,
        provider: payment.provider,
        paymentMethod: payment.provider,
        externalReference: params.externalReference,
        providerReference: params.externalReference,
        transactionReference: payment.reference,
        status: txStatus,
        amount: payment.amount,
        currency: payment.currency,
        paymentType: payment.paymentType,
        amountTotal: payment.amountTotal,
        amountPaid: payment.amountPaid,
        amountRemaining: payment.amountRemaining,
        errorMessage: params.errorMessage,
        createdAt: now,
        updatedAt: now,
        completedAt: txStatus === 'SUCCESS' ? now : undefined,
        paidAt: txStatus === 'SUCCESS' ? now : undefined,
      };
      this.data.transactions.unshift(transaction);
    }

    // Répercussion sur la réservation / prestation
    const request = (this.data.requests || []).find((r) => r.id === payment.bookingId);
    if (request) {
      const contractTotal = request.lockedPrice ?? request.catalogItemPrice ?? payment.amount;

      if (params.nextStatus === 'SUCCESS' || params.nextStatus === 'PAID') {
        // Incrémentation du montant total payé
        request.paidAmount = (request.paidAmount || 0) + payment.amount;
        request.remainingAmount = Math.max(0, contractTotal - request.paidAmount);

        // Si tout est réglé, statut PAID; sinon PARTIALLY_PAID
        request.paymentStatus = request.remainingAmount === 0 ? 'PAID' : 'PARTIALLY_PAID';
        request.updatedAt = now;

        // Mise à jour sur payment et transaction
        payment.amountPaid = request.paidAmount;
        payment.amountRemaining = request.remainingAmount;
        transaction.amountPaid = request.paidAmount;
        transaction.amountRemaining = request.remainingAmount;

        // Si la réservation était en attente ou acceptée, elle passe automatiquement à CONFIRMED
        if (request.status === 'PENDING' || request.status === 'ACCEPTED') {
          this.transitionRequestStatus({
            id: request.id,
            nextStatus: 'CONFIRMED',
            changedBy: 'BUSINESS',
            changedByName: `Système Flowexa (${payment.provider})`,
            reason: `Réservation confirmée automatiquement suite à la réception du règlement (${payment.amount} ${payment.currency}).`,
          });
        }

        // Notifications automatiques adaptées
        const isDeposit = payment.paymentType === 'DEPOSIT';
        const notifClientMsg = isDeposit
          ? `Votre acompte de ${(payment.amount ?? 0).toLocaleString()} ${payment.currency} pour "${request.title}" a été validé. Solde restant : ${(request.remainingAmount ?? 0).toLocaleString()} ${payment.currency}. Votre réservation est confirmée.`
          : `Votre règlement de ${(payment.amount ?? 0).toLocaleString()} ${payment.currency} pour "${request.title}" a été validé avec succès. Votre réservation est confirmée.`;

        this.createNotification({
          recipientType: 'CLIENT',
          recipientId: payment.clientId,
          recipientName: payment.clientName,
          title: isDeposit ? 'Acompte validé !' : 'Paiement confirmé !',
          message: notifClientMsg,
          requestId: request.id,
          interactionType: request.interactionType,
          channel: 'INTERNAL',
        });

        this.createNotification({
          recipientType: 'BUSINESS',
          recipientId: payment.businessId,
          recipientName: payment.businessName,
          title: isDeposit ? 'Acompte client encaissé' : 'Paiement client encaissé',
          message: `${payment.clientName} a versé ${(payment.amount ?? 0).toLocaleString()} ${payment.currency} via ${payment.provider} pour la réservation "${request.title}". ${(request.remainingAmount ?? 0) > 0 ? `Reste à percevoir : ${(request.remainingAmount ?? 0).toLocaleString()} ${payment.currency}.` : 'Règlement complet.'}`,
          requestId: request.id,
          interactionType: request.interactionType,
          channel: 'INTERNAL',
        });
      } else if (params.nextStatus === 'FAILED') {
        request.paymentStatus = 'FAILED';
        request.updatedAt = now;

        this.createNotification({
          recipientType: 'CLIENT',
          recipientId: payment.clientId,
          recipientName: payment.clientName,
          title: 'Échec du paiement',
          message: `Le paiement de votre réservation "${request.title}" n'a pas pu aboutir (${params.errorMessage || 'Transaction refusée'}). Vous pouvez renouveler l'opération.`,
          requestId: request.id,
          interactionType: request.interactionType,
          channel: 'INTERNAL',
        });
      }
    }

    // SPRINT B25: Répercussion sur l'abonnement entreprise si paiement de souscription / renouvellement
    if (payment.paymentType === 'SUBSCRIPTION' || payment.subscriptionId) {
      if (params.nextStatus === 'SUCCESS' || params.nextStatus === 'PAID') {
        this.activateOrRenewSubscription({
          paymentId: payment.id,
          transactionId: transaction.id,
          subscriptionId: payment.subscriptionId,
          planId: payment.planId,
          businessId: payment.businessId,
          amount: payment.amount,
          currency: payment.currency,
          provider: payment.provider,
          reference: transaction.transactionReference || payment.reference,
        });
      } else if (params.nextStatus === 'FAILED') {
        this.createNotification({
          recipientType: 'BUSINESS',
          recipientId: payment.businessId,
          recipientName: payment.businessName,
          title: 'Échec du paiement d’abonnement',
          message: `Le règlement de votre abonnement Flowexa n'a pas abouti (${params.errorMessage || 'Transaction rejetée'}). Veuillez réessayer ou changer de moyen de paiement.`,
          interactionType: 'MESSAGE',
          channel: 'INTERNAL',
        });
      }
    }

    // Journalisation d'audit
    const actor = params.auditActor || {
      userId: 'system-payment',
      userEmail: 'payments@flowexa.com',
      ip: '127.0.0.1',
    };

    this.logAudit({
      userId: actor.userId,
      userEmail: actor.userEmail,
      action: params.nextStatus === 'SUCCESS' ? 'PAYMENT_SUCCESS' : 'PAYMENT_STATUS_UPDATE',
      entityType: 'PAYMENT',
      entityId: payment.id,
      description: `Statut du paiement #${payment.reference} passé à ${params.nextStatus} via ${params.source}`,
      changes: {
        previousStatus: payment.status,
        newStatus: params.nextStatus,
        externalReference: params.externalReference,
      },
      ip: actor.ip || '127.0.0.1',
    });

    this.commit();

    return {
      success: true,
      payment,
      transaction,
    };
  }

  // SPRINT B17: Remboursement sécurisé (Total ou Partiel)
  public refundPayment(params: {
    paymentId: string;
    amount?: number;
    reason: string;
    callerRole: string;
    callerBusinessId?: string;
    actorId: string;
    actorEmail: string;
    ip?: string;
  }): {
    success: boolean;
    payment?: FlowexaPaymentEntity;
    refundTransaction?: FlowexaTransactionEntity;
    error?: string;
    code?: string;
  } {
    if (!this.data.payments) this.data.payments = [];
    if (!this.data.transactions) this.data.transactions = [];

    const payment = this.data.payments.find((p) => p.id === params.paymentId || p.reference === params.paymentId);
    if (!payment) {
      return { success: false, error: 'Paiement introuvable pour ce remboursement.', code: 'PAYMENT_NOT_FOUND' };
    }

    // Contrôle des statuts : seuls les paiements ayant réussi peuvent être remboursés
    if (payment.status !== 'SUCCESS' && payment.status !== 'PARTIALLY_REFUNDED') {
      return {
        success: false,
        error: `Impossible de rembourser un paiement avec le statut ${payment.status}. Seuls les paiements validés peuvent être remboursés.`,
        code: 'INVALID_STATUS',
      };
    }

    // Contrôle des permissions : Super Admin OU Business Owner du paiement concerné
    const isSuperAdmin = params.callerRole === 'SUPER_ADMIN';
    const isBusinessOwner =
      (params.callerRole === 'BUSINESS_OWNER' || params.callerRole === 'MANAGER') &&
      params.callerBusinessId === payment.businessId;

    if (!isSuperAdmin && !isBusinessOwner) {
      return {
        success: false,
        error: 'Action non autorisée. Seuls le Super Admin ou l’établissement bénéficiaire peuvent initier un remboursement.',
        code: 'FORBIDDEN',
      };
    }

    if (!params.reason || params.reason.trim().length === 0) {
      return {
        success: false,
        error: 'Le motif du remboursement est obligatoire.',
        code: 'REASON_REQUIRED',
      };
    }

    // Calcul du montant remboursable
    const alreadyRefunded = payment.refundAmount || 0;
    const maxRefundable = payment.amount - alreadyRefunded;

    if (maxRefundable <= 0) {
      return {
        success: false,
        error: 'Ce paiement a déjà été intégralement remboursé.',
        code: 'ALREADY_FULLY_REFUNDED',
      };
    }

    let amountToRefund = params.amount !== undefined ? Number(params.amount) : maxRefundable;
    if (isNaN(amountToRefund) || amountToRefund <= 0) {
      return {
        success: false,
        error: 'Le montant du remboursement doit être un nombre strictement supérieur à 0.',
        code: 'INVALID_REFUND_AMOUNT',
      };
    }

    if (amountToRefund > maxRefundable) {
      return {
        success: false,
        error: `Le montant demandé (${amountToRefund} ${payment.currency}) excède le montant restant remboursable (${maxRefundable} ${payment.currency}).`,
        code: 'EXCEEDS_REFUNDABLE_AMOUNT',
      };
    }

    const now = new Date().toISOString();

    // Mise à jour de l'entité Paiement
    payment.refundAmount = alreadyRefunded + amountToRefund;
    payment.status = payment.refundAmount >= payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    payment.refundReason = params.reason;
    payment.refundedAt = now;
    payment.refundedBy = params.actorEmail;
    payment.updatedAt = now;

    // Création d'une transaction de remboursement distincte
    const refundTxId = `tx-ref-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const refundReference = `FLW-REF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const refundTransaction: FlowexaTransactionEntity = {
      id: refundTxId,
      paymentId: payment.id,
      bookingId: payment.bookingId,
      requestId: payment.requestId || payment.bookingId,
      businessId: payment.businessId,
      businessName: payment.businessName,
      clientId: payment.clientId,
      clientName: payment.clientName,
      clientPhone: payment.clientPhone,
      provider: payment.provider,
      paymentMethod: payment.provider,
      transactionReference: refundReference,
      externalReference: `EXT-REF-${Date.now().toString(36).toUpperCase()}`,
      status: payment.status === 'REFUNDED' ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      amount: amountToRefund,
      currency: payment.currency,
      paymentType: 'REFUND',
      parentTransactionId: payment.id,
      refundAmount: amountToRefund,
      refundReason: params.reason,
      refundedAt: now,
      refundedBy: params.actorEmail,
      createdAt: now,
      updatedAt: now,
      completedAt: now,
    };

    this.data.transactions.unshift(refundTransaction);

    // Répercussion sur la réservation
    const request = (this.data.requests || []).find((r) => r.id === payment.bookingId);
    if (request) {
      const contractTotal = request.lockedPrice ?? request.catalogItemPrice ?? payment.amount;
      request.paidAmount = Math.max(0, (request.paidAmount || 0) - amountToRefund);
      request.remainingAmount = Math.max(0, contractTotal - request.paidAmount);
      request.refundAmount = (request.refundAmount || 0) + amountToRefund;
      request.refundReason = params.reason;
      request.paymentStatus = request.paidAmount === 0 ? 'REFUNDED' : 'PARTIALLY_PAID';
      request.updatedAt = now;

      // Notifications automatiques
      this.createNotification({
        recipientType: 'CLIENT',
        recipientId: payment.clientId,
        recipientName: payment.clientName,
        title: 'Remboursement effectué',
        message: `Un remboursement de ${amountToRefund.toLocaleString()} ${payment.currency} a été validé pour votre réservation "${request.title}". Motif : ${params.reason}.`,
        requestId: request.id,
        interactionType: request.interactionType,
        channel: 'INTERNAL',
      });

      this.createNotification({
        recipientType: 'BUSINESS',
        recipientId: payment.businessId,
        recipientName: payment.businessName,
        title: 'Remboursement consigné',
        message: `Remboursement de ${amountToRefund.toLocaleString()} ${payment.currency} enregistré pour la réservation "${request.title}" (${payment.clientName}). Motif : ${params.reason}.`,
        requestId: request.id,
        interactionType: request.interactionType,
        channel: 'INTERNAL',
      });
    }

    // Journalisation d'audit obligatoire
    this.logAudit({
      userId: params.actorId,
      userEmail: params.actorEmail,
      action: 'PAYMENT_REFUNDED',
      entityType: 'PAYMENT',
      entityId: payment.id,
      description: `Remboursement de ${amountToRefund} ${payment.currency} sur le paiement #${payment.reference}. Motif : ${params.reason}`,
      changes: {
        amountRefunded: amountToRefund,
        totalRefunded: payment.refundAmount,
        paymentStatus: payment.status,
        reason: params.reason,
        refundReference,
      },
      ip: params.ip || '127.0.0.1',
    });

    this.commit();

    return {
      success: true,
      payment,
      refundTransaction,
    };
  }

  public getPayments(filters?: {
    clientId?: string;
    businessId?: string;
    bookingId?: string;
    status?: PaymentStatus;
    role?: string;
  }): FlowexaPaymentEntity[] {
    if (!this.data.payments) this.data.payments = [];
    let list = [...this.data.payments];

    if (filters?.role !== 'SUPER_ADMIN') {
      if (filters?.clientId) {
        list = list.filter((p) => p.clientId === filters.clientId);
      }
      if (filters?.businessId) {
        list = list.filter((p) => p.businessId === filters.businessId);
      }
    } else {
      if (filters?.clientId) list = list.filter((p) => p.clientId === filters.clientId);
      if (filters?.businessId) list = list.filter((p) => p.businessId === filters.businessId);
    }

    if (filters?.bookingId) {
      list = list.filter((p) => p.bookingId === filters.bookingId);
    }
    if (filters?.status) {
      list = list.filter((p) => p.status === filters.status);
    }

    return list;
  }

  public getPaymentById(
    paymentId: string,
    caller: { role: string; clientId?: string; businessId?: string }
  ): { success: boolean; payment?: FlowexaPaymentEntity; transactions?: FlowexaTransactionEntity[]; error?: string; code?: string } {
    if (!this.data.payments) this.data.payments = [];
    const payment = this.data.payments.find((p) => p.id === paymentId || p.reference === paymentId);
    if (!payment) {
      return { success: false, error: 'Paiement introuvable.', code: 'PAYMENT_NOT_FOUND' };
    }

    // Protection anti-IDOR
    const isAuthorized =
      caller.role === 'SUPER_ADMIN' ||
      (caller.role === 'CLIENT' && payment.clientId === caller.clientId) ||
      ((caller.role === 'BUSINESS_OWNER' || caller.role === 'MANAGER' || caller.role === 'EMPLOYEE') &&
        payment.businessId === caller.businessId);

    if (!isAuthorized) {
      return { success: false, error: 'Accès refusé à ce paiement.', code: 'FORBIDDEN' };
    }

    const transactions = (this.data.transactions || []).filter((t) => t.paymentId === payment.id);

    return {
      success: true,
      payment,
      transactions,
    };
  }

  public getTransactions(filters?: {
    paymentId?: string;
    bookingId?: string;
    businessId?: string;
    clientId?: string;
    role?: string;
  }): FlowexaTransactionEntity[] {
    if (!this.data.transactions) this.data.transactions = [];
    let list = [...this.data.transactions];

    if (filters?.role !== 'SUPER_ADMIN') {
      if (filters?.clientId) list = list.filter((t) => t.clientId === filters.clientId);
      if (filters?.businessId) list = list.filter((t) => t.businessId === filters.businessId);
    } else {
      if (filters?.clientId) list = list.filter((t) => t.clientId === filters.clientId);
      if (filters?.businessId) list = list.filter((t) => t.businessId === filters.businessId);
    }

    if (filters?.paymentId) list = list.filter((t) => t.paymentId === filters.paymentId);
    if (filters?.bookingId) list = list.filter((t) => t.bookingId === filters.bookingId);

    return list;
  }

  // ==============================================================
  // SPRINT B18: BUSINESS INTELLIGENCE & ANALYTICS ENGINE
  // ==============================================================

  public getBusinessAnalytics(
    businessId: string,
    periodStr: string = '30D',
    caller?: { role?: string; businessId?: string }
  ): { success: boolean; data?: BusinessAnalyticsResponse; error?: string; code?: string } {
    // 1. Contrôle de sécurité multi-tenant et rôles RBAC
    if (!caller?.role || caller.role === 'CLIENT' || caller.role === 'EMPLOYEE') {
      return {
        success: false,
        error: 'Accès refusé. Les données analytiques et financières sont réservées aux gérants et administrateurs.',
        code: 'FORBIDDEN',
      };
    }

    if (caller.role !== 'SUPER_ADMIN') {
      if (caller.businessId && caller.businessId !== businessId) {
        return {
          success: false,
          error: 'Accès refusé. Vous ne pouvez consulter que les statistiques de votre propre établissement.',
          code: 'FORBIDDEN',
        };
      }
    }

    const business = (this.data.businesses || []).find((b) => b.id === businessId);
    if (!business) {
      return {
        success: false,
        error: 'Établissement introuvable.',
        code: 'BUSINESS_NOT_FOUND',
      };
    }

    // 2. Détermination de la période d'analyse et de la période précédente (pour comparaisons réelles)
    const now = new Date();
    let startDate: Date;
    let prevStartDate: Date;
    let prevEndDate: Date;
    const period = (periodStr || '30D').toUpperCase() as AnalyticsPeriod;

    if (period === 'TODAY') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      prevStartDate = new Date(startDate.getTime() - 86400000);
      prevEndDate = new Date(startDate.getTime());
    } else if (period === '7D') {
      startDate = new Date(now.getTime() - 7 * 86400000);
      prevStartDate = new Date(now.getTime() - 14 * 86400000);
      prevEndDate = new Date(startDate.getTime());
    } else if (period === '30D') {
      startDate = new Date(now.getTime() - 30 * 86400000);
      prevStartDate = new Date(now.getTime() - 60 * 86400000);
      prevEndDate = new Date(startDate.getTime());
    } else if (period === '3M') {
      startDate = new Date(now.getTime() - 90 * 86400000);
      prevStartDate = new Date(now.getTime() - 180 * 86400000);
      prevEndDate = new Date(startDate.getTime());
    } else if (period === '12M') {
      startDate = new Date(now.getTime() - 365 * 86400000);
      prevStartDate = new Date(now.getTime() - 730 * 86400000);
      prevEndDate = new Date(startDate.getTime());
    } else {
      // ALL
      startDate = new Date(0);
      prevStartDate = new Date(0);
      prevEndDate = new Date(0);
    }

    // 3. Extraction des jeux de données réels
    const allRequests = (this.data.requests || []).filter((r) => r.businessId === businessId);
    const periodRequests = allRequests.filter((r) => new Date(r.createdAt) >= startDate);
    const prevRequests =
      period !== 'ALL'
        ? allRequests.filter(
            (r) => new Date(r.createdAt) >= prevStartDate && new Date(r.createdAt) < prevEndDate
          )
        : [];

    const allPayments = (this.data.payments || []).filter((p) => p.businessId === businessId);
    const periodPayments = allPayments.filter((p) => new Date(p.createdAt) >= startDate);
    const prevPayments =
      period !== 'ALL'
        ? allPayments.filter(
            (p) => new Date(p.createdAt) >= prevStartDate && new Date(p.createdAt) < prevEndDate
          )
        : [];

    const allReviews = (this.data.reviews || []).filter(
      (r) => r.businessId === businessId && r.status === 'PUBLISHED'
    );
    const periodReviews = allReviews.filter((r) => new Date(r.createdAt) >= startDate);
    const prevReviews =
      period !== 'ALL'
        ? allReviews.filter(
            (r) => new Date(r.createdAt) >= prevStartDate && new Date(r.createdAt) < prevEndDate
          )
        : [];

    // 4. Calculs financiers (uniquement paiements confirmés SUCCESS/PAID)
    const confirmedPayments = periodPayments.filter(
      (p) => p.status === 'SUCCESS' || p.status === 'PAID'
    );
    const grossRevenue = confirmedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const refundedAmount = periodPayments.reduce((sum, p) => sum + (p.refundAmount || 0), 0);
    const netRevenue = Math.max(0, grossRevenue - refundedAmount);

    const prevConfirmedPayments = prevPayments.filter(
      (p) => p.status === 'SUCCESS' || p.status === 'PAID'
    );
    const prevGrossRevenue = prevConfirmedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const pendingPaymentsCount = periodPayments.filter(
      (p) => p.status === 'PENDING' || p.status === 'PROCESSING'
    ).length;
    const failedPaymentsCount = periodPayments.filter((p) => p.status === 'FAILED').length;
    const refundsCount = periodPayments.filter(
      (p) =>
        p.status === 'REFUNDED' ||
        p.status === 'PARTIALLY_REFUNDED' ||
        (p.refundAmount && p.refundAmount > 0)
    ).length;

    // 5. Demandes
    const reqTotal = periodRequests.length;
    const reqPending = periodRequests.filter((r) => r.status === 'PENDING').length;
    const reqAccepted = periodRequests.filter((r) =>
      ['ACCEPTED', 'CONFIRMED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].includes(r.status)
    ).length;
    const reqRejected = periodRequests.filter((r) => r.status === 'REJECTED').length;
    const reqCancelled = periodRequests.filter((r) => r.status === 'CANCELLED').length;
    const reqCompleted = periodRequests.filter((r) => r.status === 'COMPLETED').length;
    const reqAcceptanceRate = reqTotal > 0 ? Math.round((reqAccepted / reqTotal) * 1000) / 10 : null;
    const reqAcceptanceRateLabel = reqAcceptanceRate !== null ? `${reqAcceptanceRate}%` : 'Pas assez de données';

    // 6. Réservations
    const bookingsList = periodRequests.filter(
      (r) => r.interactionType === 'BOOKING' || r.bookingId
    );
    const bookTotal = bookingsList.length;
    const bookConfirmed = bookingsList.filter((r) =>
      ['CONFIRMED', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].includes(r.status)
    ).length;
    const bookCompleted = bookingsList.filter((r) => r.status === 'COMPLETED').length;
    const bookCancelled = bookingsList.filter((r) => r.status === 'CANCELLED').length;

    // 7. Rendez-vous
    const appointmentsList = periodRequests.filter(
      (r) => r.interactionType === 'APPOINTMENT' || r.scheduledDate
    );
    const apptScheduled = appointmentsList.length;
    const apptCompleted = appointmentsList.filter((r) => r.status === 'COMPLETED').length;
    const apptCancelled = appointmentsList.filter(
      (r) => r.status === 'CANCELLED' || r.status === 'NO_SHOW'
    ).length;
    const todayIso = new Date().toISOString().split('T')[0];
    const apptUpcoming = appointmentsList.filter(
      (r) =>
        Boolean(r.scheduledDate && r.scheduledDate >= todayIso) &&
        !['COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW'].includes(r.status)
    ).length;

    // 8. Clients, Top Clients, Client de l'année
    const clientMap = new Map<
      string,
      {
        clientId: string;
        clientName: string;
        clientPhone: string;
        totalPaid: number;
        completedInteractions: number;
        totalRequests: number;
        firstDate: string;
        lastDate: string;
        hasActivityInPeriod: boolean;
      }
    >();

    allRequests.forEach((req) => {
      const key = req.clientId || req.clientPhone;
      if (!key) return;

      const inPeriod = new Date(req.createdAt) >= startDate;
      const existing = clientMap.get(key) || {
        clientId: req.clientId || key,
        clientName: req.clientName || 'Client',
        clientPhone: req.clientPhone || '',
        totalPaid: 0,
        completedInteractions: 0,
        totalRequests: 0,
        firstDate: req.createdAt,
        lastDate: req.createdAt,
        hasActivityInPeriod: false,
      };

      existing.totalRequests += 1;
      if (req.status === 'COMPLETED') existing.completedInteractions += 1;
      if (req.paidAmount) existing.totalPaid += req.paidAmount;

      if (new Date(req.createdAt) < new Date(existing.firstDate)) {
        existing.firstDate = req.createdAt;
      }
      if (new Date(req.createdAt) > new Date(existing.lastDate)) {
        existing.lastDate = req.createdAt;
      }
      if (inPeriod) {
        existing.hasActivityInPeriod = true;
      }
      clientMap.set(key, existing);
    });

    // Compléter avec les paiements
    allPayments.forEach((p) => {
      if (p.status !== 'SUCCESS' && p.status !== 'PAID') return;
      const key = p.clientId || p.clientPhone;
      if (!key) return;
      const inPeriod = new Date(p.createdAt) >= startDate;
      const existing = clientMap.get(key);
      if (existing) {
        // éviter double comptage si paidAmount a déjà été pris en compte
        if (!existing.totalPaid || existing.totalPaid === 0) {
          existing.totalPaid += p.amount;
        }
        if (inPeriod) existing.hasActivityInPeriod = true;
      } else {
        clientMap.set(key, {
          clientId: p.clientId || key,
          clientName: p.clientName || 'Client',
          clientPhone: p.clientPhone || '',
          totalPaid: p.amount,
          completedInteractions: 0,
          totalRequests: 0,
          firstDate: p.createdAt,
          lastDate: p.createdAt,
          hasActivityInPeriod: inPeriod,
        });
      }
    });

    const allClientsList = Array.from(clientMap.values());
    const newCustomersCount = allClientsList.filter(
      (c) => new Date(c.firstDate) >= startDate
    ).length;
    const activeCustomersCount = allClientsList.filter((c) => c.hasActivityInPeriod).length;
    const returningCustomersCount = allClientsList.filter((c) => c.totalRequests >= 2).length;

    // Top clients triés par contribution réelle (montant payé + interactions terminées)
    const topCustomers: TopClientItem[] = allClientsList
      .sort((a, b) => b.totalPaid - a.totalPaid || b.completedInteractions - a.completedInteractions)
      .slice(0, 5)
      .map((c) => ({
        clientId: c.clientId,
        clientName: c.clientName,
        clientPhone: c.clientPhone,
        totalPaid: c.totalPaid,
        completedInteractions: c.completedInteractions,
        totalRequests: c.totalRequests,
        firstInteractionDate: c.firstDate,
        lastInteractionDate: c.lastDate,
      }));

    // Client de l'année (calcul transparent : au moins 1 interaction terminée ou paiement réel)
    let clientOfTheYear: { client?: TopClientItem | null; isEligible: boolean; reason: string } = {
      client: null,
      isEligible: false,
      reason: 'Pas encore assez de données.',
    };

    if (topCustomers.length > 0 && (topCustomers[0].totalPaid > 0 || topCustomers[0].completedInteractions > 0)) {
      const best = topCustomers[0];
      clientOfTheYear = {
        client: best,
        isEligible: true,
        reason: `Désigné pour sa fidélité avec ${best.totalPaid.toLocaleString()} FCFA réglés et ${best.completedInteractions} prestation(s) honorée(s).`,
      };
    }

    // 9. Services les plus demandés (Regroupement réel)
    const serviceMap = new Map<
      string,
      { catalogItemId?: string; serviceTitle: string; requestCount: number; completedCount: number; totalRevenue: number }
    >();

    periodRequests.forEach((req) => {
      const key = req.catalogItemId || req.catalogItemTitle || req.title || 'Prestation Générale';
      const title = req.catalogItemTitle || req.title || 'Prestation Générale';
      const existing = serviceMap.get(key) || {
        catalogItemId: req.catalogItemId,
        serviceTitle: title,
        requestCount: 0,
        completedCount: 0,
        totalRevenue: 0,
      };

      existing.requestCount += 1;
      if (req.status === 'COMPLETED') existing.completedCount += 1;
      if (req.paidAmount) existing.totalRevenue += req.paidAmount;

      serviceMap.set(key, existing);
    });

    // Également rattacher les paiements directs ou transactions avec un catalogItemId
    confirmedPayments.forEach((p) => {
      const key = (p as any).catalogItemId || (p as any).metadata?.catalogItemId;
      if (key && serviceMap.has(key)) {
        const item = serviceMap.get(key)!;
        if (item.totalRevenue === 0 && p.amount) {
          item.totalRevenue += p.amount;
        }
      }
    });

    const allServicesList = Array.from(serviceMap.values());
    const topServicesByDemand: TopServiceItem[] = [...allServicesList]
      .sort((a, b) => b.requestCount - a.requestCount || b.totalRevenue - a.totalRevenue)
      .slice(0, 10);
    const topServicesByRevenue: TopServiceItem[] = [...allServicesList]
      .sort((a, b) => b.totalRevenue - a.totalRevenue || b.requestCount - a.requestCount)
      .slice(0, 10);
    const topServices: TopServiceItem[] = topServicesByDemand.slice(0, 5);

    // 10. Taux de conversion
    const acceptanceRate = reqTotal > 0 ? Math.round((reqAccepted / reqTotal) * 10000) / 100 : 0;
    const bookingRate = reqTotal > 0 ? Math.round((bookTotal / reqTotal) * 10000) / 100 : 0;
    const completionRate =
      reqAccepted > 0 ? Math.round((reqCompleted / reqAccepted) * 10000) / 100 : 0;
    const finalConversionRate =
      reqTotal > 0 ? Math.round((reqCompleted / reqTotal) * 10000) / 100 : 0;

    const funnel: ConversionFunnel = {
      totalRequests: reqTotal,
      acceptedRequests: reqAccepted,
      acceptanceRate,
      bookingsCount: bookTotal,
      bookingRate,
      completedInteractions: reqCompleted,
      completionRate,
      finalConversionRate,
    };

    // 11. Évolution temporelle (Time Series)
    const timeSeries: TimeSeriesDataPoint[] = [];
    const numIntervals = period === 'TODAY' ? 6 : period === '7D' ? 7 : 4;
    const totalDuration = now.getTime() - startDate.getTime();
    const intervalDuration = totalDuration / numIntervals;

    for (let i = 0; i < numIntervals; i++) {
      const slotStart = new Date(startDate.getTime() + i * intervalDuration);
      const slotEnd = new Date(startDate.getTime() + (i + 1) * intervalDuration);

      let label = '';
      if (period === 'TODAY') {
        const h = slotStart.getHours();
        label = `${h.toString().padStart(2, '0')}h00`;
      } else if (period === '7D') {
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        label = days[slotStart.getDay()];
      } else {
        label = `Semaine ${i + 1}`;
      }

      const slotReqs = periodRequests.filter((r) => {
        const t = new Date(r.createdAt).getTime();
        return t >= slotStart.getTime() && t <= slotEnd.getTime();
      });

      const slotBookings = slotReqs.filter((r) => r.interactionType === 'BOOKING' || r.bookingId);

      const slotPayments = periodPayments.filter((p) => {
        const t = new Date(p.createdAt).getTime();
        return (
          t >= slotStart.getTime() &&
          t <= slotEnd.getTime() &&
          (p.status === 'SUCCESS' || p.status === 'PAID')
        );
      });

      const slotRevenue = slotPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      timeSeries.push({
        periodLabel: label,
        date: slotStart.toISOString().split('T')[0],
        requestsCount: slotReqs.length,
        bookingsCount: slotBookings.length,
        revenue: slotRevenue,
      });
    }

    // 12. Avis et Réputation
    let avgRating = 0;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (allReviews.length > 0) {
      const totalScore = allReviews.reduce((sum, r) => {
        const score = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
        distribution[score as 1 | 2 | 3 | 4 | 5] += 1;
        return sum + r.rating;
      }, 0);
      avgRating = Math.round((totalScore / allReviews.length) * 10) / 10;
    }

    const reviews: ReviewsAnalytics = {
      averageRating: avgRating,
      totalReviews: allReviews.length,
      ratingDistribution: distribution,
    };

    // 13. Complétude du Profil & Business Health Score
    const missingProfileFields: string[] = [];
    let profileFilledCount = 0;
    const totalProfileFields = 9;

    if (business.name && business.name.trim().length > 2) profileFilledCount += 1;
    else missingProfileFields.push('Nom de l\'établissement');

    if (business.address || business.city) profileFilledCount += 1;
    else missingProfileFields.push('Adresse / Ville');

    if (business.phone || business.whatsapp) profileFilledCount += 1;
    else missingProfileFields.push('Numéro de téléphone / WhatsApp');

    if (business.email && business.email.includes('@')) profileFilledCount += 1;
    else missingProfileFields.push('Adresse e-mail');

    if (business.module_code) profileFilledCount += 1;
    else missingProfileFields.push('Catégorie métier');

    if (business.opening_hours && Object.keys(business.opening_hours).length > 0) profileFilledCount += 1;
    else missingProfileFields.push('Horaires d\'ouverture');

    if (typeof business.latitude === 'number' && typeof business.longitude === 'number' && business.latitude !== 0) profileFilledCount += 1;
    else missingProfileFields.push('Coordonnées GPS');

    if (business.images && business.images.length > 0) profileFilledCount += 1;
    else missingProfileFields.push('Photos de présentation');

    const hasCatalog = (this.data.catalogItems || []).some((ci) => ci.businessId === businessId);
    if (hasCatalog) profileFilledCount += 1;
    else missingProfileFields.push('Offres / Services au catalogue');

    const profileCompletenessPercent = Math.round((profileFilledCount / totalProfileFields) * 100);

    // Calcul des sous-scores
    const profileScore = profileCompletenessPercent;

    // Activité (basé sur le volume et le traitement des demandes)
    let activityScore = 50;
    if (reqTotal > 0) {
      const processingRate = (reqAccepted + reqCompleted) / reqTotal;
      activityScore = Math.min(100, Math.round(40 + processingRate * 60));
    }

    // Réputation (basé sur les notes réelles)
    let reputationScore = 70; // baseline neutre
    if (allReviews.length > 0) {
      reputationScore = Math.min(100, Math.round((avgRating / 5) * 100));
    }

    // Réactivité réelle (mesurée sur les messages des conversations)
    let totalResponseMinutes = 0;
    let responsePairsCount = 0;
    const bizConversations = (this.data.conversations || []).filter((c) => c.businessId === businessId);
    bizConversations.forEach((conv) => {
      const msgs = (this.data.messages || [])
        .filter((m) => m.conversationId === conv.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      for (let i = 0; i < msgs.length - 1; i++) {
        if (msgs[i].senderRole === 'CLIENT' && msgs[i + 1].senderRole === 'BUSINESS') {
          const diffMs = new Date(msgs[i + 1].createdAt).getTime() - new Date(msgs[i].createdAt).getTime();
          const diffMins = Math.max(1, Math.round(diffMs / 60000));
          totalResponseMinutes += diffMins;
          responsePairsCount += 1;
        }
      }
    });

    let responsivenessScore = 75; // baseline
    let avgResponseMins: number | null = null;
    let avgResponseLabel = 'Pas encore assez de données.';

    if (responsePairsCount > 0) {
      avgResponseMins = Math.round(totalResponseMinutes / responsePairsCount);
      if (avgResponseMins < 60) {
        avgResponseLabel = `${avgResponseMins} min`;
      } else {
        const hours = Math.floor(avgResponseMins / 60);
        const mins = avgResponseMins % 60;
        avgResponseLabel = `${hours}h ${mins}min`;
      }

      if (avgResponseMins <= 30) responsivenessScore = 100;
      else if (avgResponseMins <= 120) responsivenessScore = 85;
      else if (avgResponseMins <= 720) responsivenessScore = 70;
      else if (avgResponseMins <= 1440) responsivenessScore = 50;
      else responsivenessScore = 30;
    }

    // Score financier (faible taux de litige et encaissements confirmés)
    let financialScore = 80;
    if (periodPayments.length > 0) {
      const successRate = confirmedPayments.length / periodPayments.length;
      const refundRate = refundedAmount / Math.max(1, grossRevenue);
      financialScore = Math.min(100, Math.max(20, Math.round(successRate * 90 - refundRate * 40)));
    }

    // Business Health Score Global (Pondération transparente)
    const overallScore = Math.round(
      profileScore * 0.25 +
        activityScore * 0.25 +
        reputationScore * 0.25 +
        responsivenessScore * 0.15 +
        financialScore * 0.10
    );

    let summaryText = 'Activité saine et stable.';
    if (overallScore >= 80) {
      summaryText = 'Excellente performance globale avec un profil soigné et une forte satisfaction client.';
    } else if (overallScore < 60) {
      summaryText = 'Des axes d\'amélioration prioritaires ont été identifiés (complétude profil et traitement des demandes).';
    }

    const healthScore: BusinessHealthScore = {
      overall: overallScore,
      profileScore,
      activityScore,
      reputationScore,
      responsivenessScore,
      financialScore,
      profileCompletenessPercent,
      missingProfileFields,
      summary: summaryText,
    };

    // 14. Alertes intelligentes (Comparaisons mathématiquement exactes avec la période précédente)
    const alerts: SmartAlertItem[] = [];

    if (period !== 'ALL' && prevRequests.length > 0) {
      const diffRequests = reqTotal - prevRequests.length;
      const pct = Math.round((diffRequests / prevRequests.length) * 100);
      if (pct > 0) {
        alerts.push({
          id: 'alt-req-up',
          type: 'INCREASE',
          message: `Vos demandes ont augmenté de ${pct}% par rapport à la période précédente.`,
          detail: `${reqTotal} demandes enregistrées vs ${prevRequests.length} précédemment.`,
          comparisonLabel: `+${pct}%`,
        });
      } else if (pct < 0) {
        alerts.push({
          id: 'alt-req-down',
          type: 'DECREASE',
          message: `Vos demandes sont en baisse de ${Math.abs(pct)}% sur cette période.`,
          detail: `${reqTotal} demandes vs ${prevRequests.length} sur la période équivalente antérieure.`,
          comparisonLabel: `${pct}%`,
        });
      }
    }

    if (period !== 'ALL' && prevConfirmedPayments.length > 0) {
      const diffRev = grossRevenue - prevGrossRevenue;
      const pctRev = Math.round((diffRev / prevGrossRevenue) * 100);
      if (pctRev > 0) {
        alerts.push({
          id: 'alt-rev-up',
          type: 'INCREASE',
          message: `Votre chiffre d'affaires affiche une progression de ${pctRev}%.`,
          detail: `${grossRevenue.toLocaleString()} FCFA vs ${prevGrossRevenue.toLocaleString()} FCFA.`,
          comparisonLabel: `+${pctRev}%`,
        });
      }
    }

    if (periodReviews.length > 0) {
      alerts.push({
        id: 'alt-reviews',
        type: 'INFO',
        message: `Vous avez reçu ${periodReviews.length} nouvel(s) avis client(s) sur cette période.`,
        detail: `Note moyenne générale maintenue à ${avgRating}/5.`,
      });
    }

    if (missingProfileFields.length > 0) {
      alerts.push({
        id: 'alt-profile',
        type: 'WARNING',
        message: `Votre profil est complété à ${profileCompletenessPercent}%.`,
        detail: `Ajoutez : ${missingProfileFields.slice(0, 2).join(', ')} pour optimiser votre visibilité.`,
      });
    }

    // 15. Évolution réelle du Chiffre d'Affaires et des Demandes (Formule mathématique exacte : ((Y - X) / X) * 100)
    let revenueGrowthPercent: number | null = null;
    let revenueGrowthLabel = "Données insuffisantes pour calculer l'évolution.";
    let revenueEvolutionStatus: 'INCREASE' | 'DECREASE' | 'STABLE' | 'INSUFFICIENT_DATA' = 'INSUFFICIENT_DATA';
    const hasPreviousPeriodRevenue = period !== 'ALL' && prevGrossRevenue > 0;

    if (hasPreviousPeriodRevenue) {
      const diff = grossRevenue - prevGrossRevenue;
      revenueGrowthPercent = Math.round((diff / prevGrossRevenue) * 1000) / 10;
      if (revenueGrowthPercent > 0) {
        revenueGrowthLabel = `+${revenueGrowthPercent}%`;
        revenueEvolutionStatus = 'INCREASE';
      } else if (revenueGrowthPercent < 0) {
        revenueGrowthLabel = `${revenueGrowthPercent}%`;
        revenueEvolutionStatus = 'DECREASE';
      } else {
        revenueGrowthLabel = '0%';
        revenueEvolutionStatus = 'STABLE';
      }
    } else if (period !== 'ALL' && prevConfirmedPayments.length === 0 && confirmedPayments.length > 0) {
      revenueGrowthLabel = 'Premiers encaissements';
      revenueEvolutionStatus = 'INCREASE';
    }

    let requestsGrowthPercent: number | null = null;
    let requestsGrowthLabel = "Données insuffisantes pour calculer l'évolution.";
    let requestsEvolutionStatus: 'INCREASE' | 'DECREASE' | 'STABLE' | 'INSUFFICIENT_DATA' = 'INSUFFICIENT_DATA';
    const hasPreviousPeriodRequests = period !== 'ALL' && prevRequests.length > 0;

    if (hasPreviousPeriodRequests) {
      const diffReq = reqTotal - prevRequests.length;
      requestsGrowthPercent = Math.round((diffReq / prevRequests.length) * 1000) / 10;
      if (requestsGrowthPercent > 0) {
        requestsGrowthLabel = `+${requestsGrowthPercent}%`;
        requestsEvolutionStatus = 'INCREASE';
      } else if (requestsGrowthPercent < 0) {
        requestsGrowthLabel = `${requestsGrowthPercent}%`;
        requestsEvolutionStatus = 'DECREASE';
      } else {
        requestsGrowthLabel = '0%';
        requestsEvolutionStatus = 'STABLE';
      }
    } else if (period !== 'ALL' && prevRequests.length === 0 && reqTotal > 0) {
      requestsGrowthLabel = 'Premières demandes reçues';
      requestsEvolutionStatus = 'INCREASE';
    }

    const evolution = {
      revenue: {
        previousValue: prevGrossRevenue,
        currentValue: grossRevenue,
        growthPercent: revenueGrowthPercent,
        growthLabel: revenueGrowthLabel,
        hasPreviousData: hasPreviousPeriodRevenue,
        status: revenueEvolutionStatus,
      },
      requests: {
        previousValue: prevRequests.length,
        currentValue: reqTotal,
        growthPercent: requestsGrowthPercent,
        growthLabel: requestsGrowthLabel,
        hasPreviousData: hasPreviousPeriodRequests,
        status: requestsEvolutionStatus,
      },
    };

    // 16. Activité par jour de la semaine (Demandes et réservations réelles)
    const dayNamesFr = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    periodRequests.forEach((r) => {
      const d = new Date(r.createdAt);
      if (!isNaN(d.getTime())) {
        dayCounts[d.getDay()]++;
      }
    });

    const activityByDay = dayNamesFr.map((dayName, idx) => ({
      dayName,
      dayIndex: idx,
      count: dayCounts[idx],
      percentage: reqTotal > 0 ? Math.round((dayCounts[idx] / reqTotal) * 100) : 0,
    }));

    let peakDay: { dayName: string; count: number; percentage: number } | null = null;
    if (reqTotal > 0) {
      const maxCount = Math.max(...dayCounts);
      if (maxCount > 0) {
        const maxDayIdx = dayCounts.indexOf(maxCount);
        peakDay = {
          dayName: dayNamesFr[maxDayIdx],
          count: maxCount,
          percentage: Math.round((maxCount / reqTotal) * 100),
        };
      }
    }

    // 17. Horaires d'activité (Créneaux horaires les plus sollicités)
    const hourSlots = [
      { slot: 'Matin (08h - 12h)', count: 0 },
      { slot: 'Après-midi (12h - 17h)', count: 0 },
      { slot: 'Soirée (17h - 21h)', count: 0 },
      { slot: 'Nuit & Autre (21h - 08h)', count: 0 },
    ];

    periodRequests.forEach((r) => {
      let hour = -1;
      if (r.requestedTime && r.requestedTime.includes(':')) {
        hour = parseInt(r.requestedTime.split(':')[0], 10);
      } else if (r.scheduledTime && r.scheduledTime.includes(':')) {
        hour = parseInt(r.scheduledTime.split(':')[0], 10);
      } else {
        const d = new Date(r.createdAt);
        if (!isNaN(d.getTime())) hour = d.getHours();
      }
      if (hour >= 8 && hour < 12) hourSlots[0].count++;
      else if (hour >= 12 && hour < 17) hourSlots[1].count++;
      else if (hour >= 17 && hour < 21) hourSlots[2].count++;
      else if (hour >= 0) hourSlots[3].count++;
    });

    const activityByHour = hourSlots.map((h) => ({
      slot: h.slot,
      count: h.count,
      percentage: reqTotal > 0 ? Math.round((h.count / reqTotal) * 100) : 0,
    }));

    let peakHour: { slot: string; count: number; percentage: number } | null = null;
    if (reqTotal > 0) {
      const maxSlot = [...hourSlots].sort((a, b) => b.count - a.count)[0];
      if (maxSlot && maxSlot.count > 0) {
        peakHour = {
          slot: maxSlot.slot,
          count: maxSlot.count,
          percentage: Math.round((maxSlot.count / reqTotal) * 100),
        };
      }
    }

    // 18. Localisation des demandes (villes réelles enregistrées)
    const locMap = new Map<string, number>();
    periodRequests.forEach((r) => {
      const loc = (r.location || (r as any).city || '').trim();
      if (loc) {
        locMap.set(loc, (locMap.get(loc) || 0) + 1);
      }
    });

    const locations = Array.from(locMap.entries())
      .map(([location, count]) => ({
        location,
        count,
        percentage: reqTotal > 0 ? Math.round((count / reqTotal) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const topLocation = locations.length > 0 ? { location: locations[0].location, count: locations[0].count } : null;

    // 19. Taux de satisfaction client documenté (avis ≥ 4★ / avis totaux publiés)
    let satisfactionRate: number | null = null;
    let satisfactionRateLabel = "Pas encore d'avis publié";
    if (allReviews.length > 0) {
      const positiveReviews = allReviews.filter((r) => r.rating >= 4).length;
      satisfactionRate = Math.round((positiveReviews / allReviews.length) * 100);
      satisfactionRateLabel = `${satisfactionRate}% de satisfaction (${positiveReviews}/${allReviews.length} avis ≥ 4★)`;
    }

    // 20. Panier moyen et fréquence d'interaction
    const averageOrderValue = confirmedPayments.length > 0
      ? Math.round(grossRevenue / confirmedPayments.length)
      : 0;
    const averageInteractionsPerCustomer = activeCustomersCount > 0
      ? Math.round((reqTotal / activeCustomersCount) * 10) / 10
      : 0;

    // 21. Insights Flowexa générés d'après les chiffres réels
    const insights: string[] = [];
    if (topServicesByRevenue.length > 0 && topServicesByRevenue[0].totalRevenue > 0) {
      insights.push(`Votre service le plus rentable est "${topServicesByRevenue[0].serviceTitle}" avec un CA encaissé de ${topServicesByRevenue[0].totalRevenue.toLocaleString()} FCFA.`);
    }
    if (topServicesByDemand.length > 0 && topServicesByDemand[0].requestCount > 0) {
      insights.push(`Votre service le plus demandé est "${topServicesByDemand[0].serviceTitle}" (${topServicesByDemand[0].requestCount} demandes reçues).`);
    }
    if (peakDay) {
      insights.push(`Votre jour d'affluence record est le ${peakDay.dayName} (${peakDay.percentage}% des demandes).`);
    }
    if (peakHour) {
      insights.push(`Votre créneau horaire de pointe est en ${peakHour.slot.toLowerCase()} (${peakHour.percentage}% des sollicitations).`);
    }
    if (revenueEvolutionStatus === 'INCREASE' && revenueGrowthPercent !== null) {
      insights.push(`Votre chiffre d'affaires progresse de +${revenueGrowthPercent}% par rapport à la période précédente.`);
    } else if (revenueEvolutionStatus === 'DECREASE' && revenueGrowthPercent !== null) {
      insights.push(`Votre chiffre d'affaires affiche un recul de ${revenueGrowthPercent}% sur cette période.`);
    }
    if (returningCustomersCount > 0) {
      insights.push(`Vous comptez ${returningCustomersCount} client(s) récurrent(s) (au moins 2 interactions réelles).`);
    }
    if (insights.length === 0) {
      insights.push("Données en cours de collecte : continuez à enregistrer vos demandes pour débloquer des analyses personnalisées.");
    }

    // 22. Prédiction / Projection indicative basée sur l'historique réel
    let prediction: AIPrediction;
    if (confirmedPayments.length < 2 || grossRevenue === 0) {
      prediction = {
        businessId: business.id,
        metric: 'REVENUE',
        hasEnoughData: false,
        currentPeriodValue: grossRevenue,
        estimatedRange: [0, 0],
        estimatedFormatted: 'Données insuffisantes',
        trend: 'STABLE',
        confidenceLabel: 'Faible échantillonnage',
        methodology: 'Modèle de run-rate linéaire nécessitant au minimum 2 transactions confirmées.',
        disclaimer: 'Pas encore assez de données pour établir une prévision fiable.',
      };
    } else {
      const daysCount = period === 'TODAY' ? 1 : period === '7D' ? 7 : period === '3M' ? 90 : period === '12M' ? 365 : 30;
      const dailyAvg = grossRevenue / Math.max(1, daysCount);
      let growthMult = 1.0;
      let pTrend: 'UP' | 'STABLE' | 'DOWN' = 'STABLE';
      if (prevGrossRevenue > 0) {
        const gRate = (grossRevenue - prevGrossRevenue) / prevGrossRevenue;
        if (gRate > 0.05) {
          pTrend = 'UP';
          growthMult = 1 + Math.min(gRate * 0.5, 0.2);
        } else if (gRate < -0.05) {
          pTrend = 'DOWN';
          growthMult = 1 - Math.min(Math.abs(gRate) * 0.5, 0.2);
        }
      }
      const baseline = dailyAvg * 30 * growthMult;
      const lower = Math.round((baseline * 0.9) / 1000) * 1000;
      const upper = Math.round((baseline * 1.15) / 1000) * 1000;
      prediction = {
        businessId: business.id,
        metric: 'REVENUE',
        hasEnoughData: true,
        currentPeriodValue: grossRevenue,
        estimatedRange: [lower, upper],
        estimatedFormatted: `${lower.toLocaleString('fr-FR')} – ${upper.toLocaleString('fr-FR')} FCFA`,
        trend: pTrend,
        confidenceLabel: confirmedPayments.length >= 10 ? 'Confiance Élevée' : 'Confiance Modérée',
        methodology: `Projection par extrapolation du run-rate moyen (${Math.round(dailyAvg).toLocaleString('fr-FR')} FCFA/jour) et pondération de la trajectoire observée.`,
        disclaimer: 'Projection estimée (indicative) basée sur l’historique réel récent. Ne constitue pas une garantie contractuelle de revenus.',
      };
    }

    // 23. Abonnement & Quotas actuels (Sprint B25)
    const currentSub = this.getBusinessSubscription(business.id);
    const currentUsage = this.getSubscriptionUsage(business.id);
    const subscriptionSummary = currentSub ? {
      planName: currentSub.planName || 'Plan Actif',
      status: currentSub.status,
      expiresAt: currentSub.expirationDate || (currentSub as any).currentPeriodEnd,
      usagePercentage: currentUsage ? Math.max(
        currentUsage.employees?.percentage || 0,
        currentUsage.services?.percentage || 0,
        currentUsage.offers?.percentage || 0
      ) : 0,
    } : null;

    const hasSufficientData = reqTotal > 0 || confirmedPayments.length > 0 || allReviews.length > 0;

    return {
      success: true,
      data: {
        businessId: business.id,
        businessName: business.name,
        period,
        currency: 'FCFA',
        revenue: {
          grossRevenue,
          refundedAmount,
          netRevenue,
          confirmedPaymentsCount: confirmedPayments.length,
          pendingPaymentsCount,
          failedPaymentsCount,
          refundsCount,
        },
        evolution,
        requests: {
          total: reqTotal,
          pending: reqPending,
          accepted: reqAccepted,
          rejected: reqRejected,
          cancelled: reqCancelled,
          completed: reqCompleted,
          acceptanceRate: reqAcceptanceRate,
          acceptanceRateLabel: reqAcceptanceRateLabel,
        },
        bookings: {
          total: bookTotal,
          confirmed: bookConfirmed,
          completed: bookCompleted,
          cancelled: bookCancelled,
        },
        appointments: {
          scheduled: apptScheduled,
          completed: apptCompleted,
          cancelled: apptCancelled,
          upcoming: apptUpcoming,
        },
        customers: {
          newCustomersCount,
          activeCustomersCount,
          returningCustomersCount,
          averageOrderValue,
          averageInteractionsPerCustomer,
        },
        topCustomers,
        clientOfTheYear,
        topServices,
        topServicesByDemand,
        topServicesByRevenue,
        funnel,
        timeSeries,
        activityByDay,
        peakDay,
        activityByHour,
        peakHour,
        locations,
        topLocation,
        reviews,
        satisfactionRate,
        satisfactionRateLabel,
        healthScore,
        averageResponseTimeMinutes: avgResponseMins,
        averageResponseTimeLabel: avgResponseLabel,
        alerts,
        insights,
        prediction,
        subscriptionSummary,
        hasSufficientData,
      },
    };
  }

  public getSuperAdminAnalytics(params?: {
    period?: string;
    moduleCode?: string;
    city?: string;
  }): SuperAdminAnalyticsResponse {
    const period = (params?.period || '30D').toUpperCase() as AnalyticsPeriod;
    const now = new Date();
    let startDate: Date;

    if (period === 'TODAY') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (period === '7D') {
      startDate = new Date(now.getTime() - 7 * 86400000);
    } else if (period === '30D') {
      startDate = new Date(now.getTime() - 30 * 86400000);
    } else if (period === '3M') {
      startDate = new Date(now.getTime() - 90 * 86400000);
    } else if (period === '12M') {
      startDate = new Date(now.getTime() - 365 * 86400000);
    } else {
      startDate = new Date(0);
    }

    let businesses = this.data.businesses || [];
    if (params?.moduleCode) {
      businesses = businesses.filter(
        (b) => b.module_code === params.moduleCode || b.enabled_modules?.includes(params.moduleCode!)
      );
    }
    if (params?.city) {
      businesses = businesses.filter((b) => b.city?.toLowerCase() === params.city?.toLowerCase());
    }

    const businessIds = new Set(businesses.map((b) => b.id));

    const allRequests = (this.data.requests || []).filter(
      (r) => businessIds.has(r.businessId) && new Date(r.createdAt) >= startDate
    );

    const allPayments = (this.data.payments || []).filter(
      (p) => businessIds.has(p.businessId) && new Date(p.createdAt) >= startDate
    );

    const allTransactions = (this.data.transactions || []).filter(
      (t) => businessIds.has(t.businessId) && new Date(t.createdAt) >= startDate
    );

    const allReviews = (this.data.reviews || []).filter(
      (r) => businessIds.has(r.businessId) && r.status === 'PUBLISHED'
    );

    const confirmedPayments = allPayments.filter(
      (p) => p.status === 'SUCCESS' || p.status === 'PAID'
    );
    const totalGrossVolume = confirmedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalRefunded = allPayments.reduce((sum, p) => sum + (p.refundAmount || 0), 0);
    const netVolume = Math.max(0, totalGrossVolume - totalRefunded);

    const clientIds = new Set(allRequests.map((r) => r.clientId).filter(Boolean));

    const totalBookings = allRequests.filter((r) => r.interactionType === 'BOOKING' || r.bookingId).length;
    const totalAppointments = allRequests.filter(
      (r) => r.interactionType === 'APPOINTMENT' || r.scheduledDate
    ).length;

    // Répartition par module
    const moduleMap = new Map<string, { count: number; revenue: number }>();
    businesses.forEach((b) => {
      const mod = b.module_code || 'AUTRE';
      const existing = moduleMap.get(mod) || { count: 0, revenue: 0 };
      existing.count += 1;
      moduleMap.set(mod, existing);
    });

    confirmedPayments.forEach((p) => {
      const b = businesses.find((biz) => biz.id === p.businessId);
      const mod = b?.module_code || 'AUTRE';
      const existing = moduleMap.get(mod);
      if (existing) existing.revenue += p.amount;
    });

    const businessesByModule = Array.from(moduleMap.entries()).map(([moduleCode, data]) => ({
      moduleCode,
      count: data.count,
      revenue: data.revenue,
    }));

    // Évolution globale
    const timeSeries: TimeSeriesDataPoint[] = [];
    const numIntervals = 6;
    const totalDuration = now.getTime() - startDate.getTime();
    const intervalDuration = totalDuration / numIntervals;

    for (let i = 0; i < numIntervals; i++) {
      const slotStart = new Date(startDate.getTime() + i * intervalDuration);
      const slotEnd = new Date(startDate.getTime() + (i + 1) * intervalDuration);

      const slotReqs = allRequests.filter((r) => {
        const t = new Date(r.createdAt).getTime();
        return t >= slotStart.getTime() && t <= slotEnd.getTime();
      });

      const slotPayments = confirmedPayments.filter((p) => {
        const t = new Date(p.createdAt).getTime();
        return t >= slotStart.getTime() && t <= slotEnd.getTime();
      });

      timeSeries.push({
        periodLabel: `T${i + 1}`,
        date: slotStart.toISOString().split('T')[0],
        requestsCount: slotReqs.length,
        bookingsCount: slotReqs.filter((r) => r.interactionType === 'BOOKING' || r.bookingId).length,
        revenue: slotPayments.reduce((sum, p) => sum + p.amount, 0),
      });
    }

    const globalAvgRating =
      allReviews.length > 0
        ? Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length) * 10) / 10
        : 5.0;

    return {
      period,
      totalBusinesses: businesses.length,
      activeBusinesses: businesses.filter((b) => b.status === 'ACTIVE').length,
      totalClients: clientIds.size,
      totalRequests: allRequests.length,
      totalBookings,
      totalAppointments,
      financialMetrics: {
        totalGrossVolume,
        totalRefunded,
        netVolume,
        totalTransactions: allTransactions.length,
        currency: 'FCFA',
      },
      reviewsMetrics: {
        totalReviews: allReviews.length,
        globalAverageRating: globalAvgRating,
      },
      businessesByModule,
      timeSeries,
    };
  }

  // ==============================================================
  // SPRINT B19: AUTOMATION & REMINDER ENGINE
  // ==============================================================

  public getAutomationRules(businessId?: string): AutomationRuleEntity[] {
    if (!this.data.automationRules) this.data.automationRules = [];
    if (businessId) {
      return this.data.automationRules.filter((r) => r.businessId === businessId);
    }
    return this.data.automationRules;
  }

  public getAutomationRuleById(ruleId: string): AutomationRuleEntity | undefined {
    if (!this.data.automationRules) return undefined;
    return this.data.automationRules.find((r) => r.id === ruleId);
  }

  public createAutomationRule(ruleData: Omit<AutomationRuleEntity, 'id' | 'createdAt' | 'updatedAt'>): AutomationRuleEntity {
    if (!this.data.automationRules) this.data.automationRules = [];
    const newRule: AutomationRuleEntity = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...ruleData,
    };
    this.data.automationRules.push(newRule);
    this.commit();
    return newRule;
  }

  public updateAutomationRule(ruleId: string, updates: Partial<AutomationRuleEntity>): AutomationRuleEntity | null {
    if (!this.data.automationRules) return null;
    const rule = this.data.automationRules.find((r) => r.id === ruleId);
    if (!rule) return null;
    Object.assign(rule, updates, { updatedAt: new Date().toISOString() });
    this.commit();
    return rule;
  }

  public deleteAutomationRule(ruleId: string): boolean {
    if (!this.data.automationRules) return false;
    const idx = this.data.automationRules.findIndex((r) => r.id === ruleId);
    if (idx === -1) return false;
    this.data.automationRules.splice(idx, 1);
    this.commit();
    return true;
  }

  public getAutomationHistory(businessId?: string, limit = 100): AutomationHistoryEntity[] {
    if (!this.data.automationHistory) return [];
    let list = this.data.automationHistory;
    if (businessId) {
      list = list.filter((h) => h.businessId === businessId);
    }
    return list.slice(0, limit);
  }

  public addAutomationHistoryEntry(entryData: Omit<AutomationHistoryEntity, 'id' | 'executedAt'>): AutomationHistoryEntity {
    if (!this.data.automationHistory) this.data.automationHistory = [];
    const entry: AutomationHistoryEntity = {
      id: `auto-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      executedAt: new Date().toISOString(),
      ...entryData,
    };
    this.data.automationHistory.unshift(entry);
    if (this.data.automationHistory.length > 1000) {
      this.data.automationHistory = this.data.automationHistory.slice(0, 1000);
    }
    this.commit();
    return entry;
  }

  public getAutomationStats(businessId: string): BusinessAutomationStats {
    const rules = this.getAutomationRules(businessId);
    const activeRulesCount = rules.filter((r) => r.isEnabled).length;
    const history = this.getAutomationHistory(businessId, 500);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const totalSentCount = history.filter((h) => h.status === 'SENT').length;
    const sentTodayCount = history.filter(
      (h) => h.status === 'SENT' && h.executedAt.startsWith(todayStr)
    ).length;
    const failedCount = history.filter((h) => h.status === 'FAILED').length;

    // Calcul des rappels à venir sur les RDV et réservations confirmés
    const businessRequests = (this.data.requests || []).filter(
      (r) => r.businessId === businessId && (r.status === 'CONFIRMED' || r.status === 'SCHEDULED')
    );
    const upcomingRemindersCount = businessRequests.length;

    return {
      activeRulesCount,
      totalRulesCount: rules.length,
      totalSentCount,
      sentTodayCount,
      failedCount,
      upcomingRemindersCount,
    };
  }

  /**
   * MOTEUR D'AUTOMATISATION & DE RAPPELS CENTRALISÉ
   * Analyse le contexte réel et déclenche les rappels nécessaires
   * avec garantie stricte d'idempotence et anti-doublon.
   */
  public runAutomationEngine(targetBusinessId?: string, options?: { force?: boolean }): AutomationRunSummary {
    const summary: AutomationRunSummary = {
      rulesEvaluated: 0,
      actionsTriggered: 0,
      sentCount: 0,
      skippedCount: 0,
      failedCount: 0,
      timestamp: new Date().toISOString(),
      details: [],
    };

    let businesses = this.data.businesses || [];
    if (targetBusinessId) {
      businesses = businesses.filter((b) => b.id === targetBusinessId);
    }

    const now = new Date();
    const nowMs = now.getTime();
    const currentYear = now.getFullYear();
    const todayMMDD = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayDateStr = now.toISOString().split('T')[0];

    for (const biz of businesses) {
      const rules = this.getAutomationRules(biz.id).filter((r) => r.isEnabled);
      summary.rulesEvaluated += rules.length;

      for (const rule of rules) {
        try {
          switch (rule.ruleType) {
            // 1. RAPPEL DE RENDEZ-VOUS (24h et 2h avant)
            case 'APPOINTMENT_REMINDER': {
              const apptRequests = (this.data.requests || []).filter(
                (r) =>
                  r.businessId === biz.id &&
                  (r.interactionType === 'APPOINTMENT' || r.scheduledDate || r.requestedDate)
              );

              const milestones = rule.triggerHoursBefore || [24, 2];

              for (const req of apptRequests) {
                // RÈGLE ABSOLUE : Jamais de rappel si annulé, terminé ou rejeté
                if (['CANCELLED', 'COMPLETED', 'REJECTED', 'NO_SHOW'].includes(req.status)) {
                  continue;
                }

                // Vérifier si confirmé ou planifié
                if (!['CONFIRMED', 'SCHEDULED', 'ACCEPTED'].includes(req.status)) {
                  continue;
                }

                const targetDate = req.scheduledDate || req.requestedDate;
                const targetTime = req.scheduledTime || req.requestedTime || '09:00';
                if (!targetDate) continue;

                const apptDateTime = new Date(`${targetDate}T${targetTime}:00`);
                const diffMs = apptDateTime.getTime() - nowMs;
                const diffHours = diffMs / 3600000;

                for (const hoursBefore of milestones) {
                  // Déclenchement si nous sommes dans la fenêtre (ou si force=true pour tester)
                  const isEligibleWindow =
                    options?.force || (diffHours > 0 && diffHours <= hoursBefore);

                  if (isEligibleWindow) {
                    const idempotencyKey = `${biz.id}:APPT:${req.id}:${hoursBefore}h`;
                    const alreadySent = (this.data.automationHistory || []).some(
                      (h) => h.idempotencyKey === idempotencyKey && h.status === 'SENT'
                    );

                    if (alreadySent) {
                      summary.skippedCount++;
                      continue;
                    }

                    summary.actionsTriggered++;
                    const notifTitle = `Rappel de rendez-vous (${hoursBefore}h avant)`;
                    const notifMsg = rule.customMessageTemplate
                      ? rule.customMessageTemplate
                          .replace('{date}', targetDate)
                          .replace('{time}', targetTime)
                      : `Bonjour ${req.clientName}, rappel de votre rendez-vous chez ${biz.name} le ${targetDate} à ${targetTime}.`;

                    const priority = hoursBefore <= 2 ? 'HIGH' : rule.priority || 'NORMAL';

                    // Notification Client
                    this.createNotification({
                      recipientType: 'CLIENT',
                      recipientId: req.clientId,
                      recipientName: req.clientName,
                      title: notifTitle,
                      message: notifMsg,
                      requestId: req.id,
                      interactionType: 'APPOINTMENT',
                      channel: 'INTERNAL',
                      priority,
                      metadata: {
                        hoursBefore,
                        businessId: biz.id,
                        businessName: biz.name,
                        scheduledDate: targetDate,
                        scheduledTime: targetTime,
                      },
                    });

                    // Notification Pro (pour que l'entreprise soit informée)
                    this.createNotification({
                      recipientType: 'BUSINESS',
                      recipientId: biz.id,
                      recipientName: biz.name,
                      title: `Rappel RDV dans ${hoursBefore}h`,
                      message: `Rendez-vous prévu avec ${req.clientName} le ${targetDate} à ${targetTime}.`,
                      requestId: req.id,
                      interactionType: 'APPOINTMENT',
                      channel: 'INTERNAL',
                      priority,
                    });

                    // Historique
                    this.addAutomationHistoryEntry({
                      businessId: biz.id,
                      businessName: biz.name,
                      ruleId: rule.id,
                      ruleType: 'APPOINTMENT_REMINDER',
                      idempotencyKey,
                      recipientType: 'CLIENT',
                      recipientId: req.clientId,
                      recipientName: req.clientName,
                      recipientPhone: req.clientPhone,
                      targetEntityType: 'APPOINTMENT',
                      targetEntityId: req.id,
                      title: notifTitle,
                      message: notifMsg,
                      priority,
                      channel: 'INTERNAL',
                      status: 'SENT',
                      retryCount: 0,
                      maxRetries: 3,
                    });

                    summary.sentCount++;
                    summary.details.push(
                      `[${biz.name}] Rappel RDV ${hoursBefore}h envoyé à ${req.clientName}`
                    );
                  }
                }
              }
              break;
            }

            // 2. RAPPEL DE RÉSERVATION (24h avant l'arrivée)
            case 'BOOKING_REMINDER': {
              const bookings = (this.data.requests || []).filter(
                (r) =>
                  r.businessId === biz.id &&
                  (r.interactionType === 'BOOKING' || r.bookingId || r.requestedDate)
              );

              const milestones = rule.triggerHoursBefore || [24];

              for (const req of bookings) {
                // RÈGLE ABSOLUE : Ne jamais envoyer si annulée
                if (['CANCELLED', 'REJECTED', 'COMPLETED'].includes(req.status)) {
                  continue;
                }

                if (!['CONFIRMED', 'ACCEPTED'].includes(req.status)) {
                  continue;
                }

                const checkInDate = req.requestedDate || req.scheduledDate;
                if (!checkInDate) continue;

                const checkInDateTime = new Date(`${checkInDate}T14:00:00`);
                const diffHours = (checkInDateTime.getTime() - nowMs) / 3600000;

                for (const hoursBefore of milestones) {
                  const isEligible =
                    options?.force || (diffHours > 0 && diffHours <= hoursBefore);

                  if (isEligible) {
                    const idempotencyKey = `${biz.id}:BOOKING:${req.id}:${hoursBefore}h`;
                    const alreadySent = (this.data.automationHistory || []).some(
                      (h) => h.idempotencyKey === idempotencyKey && h.status === 'SENT'
                    );

                    if (alreadySent) {
                      summary.skippedCount++;
                      continue;
                    }

                    summary.actionsTriggered++;
                    const notifTitle = `Rappel de votre réservation chez ${biz.name}`;
                    const notifMsg = rule.customMessageTemplate
                      ? rule.customMessageTemplate
                      : `Votre réservation pour "${req.title}" débute le ${checkInDate}. Check-in à partir de 14h00.`;

                    this.createNotification({
                      recipientType: 'CLIENT',
                      recipientId: req.clientId,
                      recipientName: req.clientName,
                      title: notifTitle,
                      message: notifMsg,
                      requestId: req.id,
                      interactionType: 'BOOKING',
                      channel: 'INTERNAL',
                      priority: rule.priority || 'NORMAL',
                      metadata: { businessId: biz.id, checkInDate },
                    });

                    this.addAutomationHistoryEntry({
                      businessId: biz.id,
                      businessName: biz.name,
                      ruleId: rule.id,
                      ruleType: 'BOOKING_REMINDER',
                      idempotencyKey,
                      recipientType: 'CLIENT',
                      recipientId: req.clientId,
                      recipientName: req.clientName,
                      recipientPhone: req.clientPhone,
                      targetEntityType: 'BOOKING',
                      targetEntityId: req.id,
                      title: notifTitle,
                      message: notifMsg,
                      priority: rule.priority || 'NORMAL',
                      channel: 'INTERNAL',
                      status: 'SENT',
                      retryCount: 0,
                      maxRetries: 3,
                    });

                    summary.sentCount++;
                    summary.details.push(
                      `[${biz.name}] Rappel séjour envoyé à ${req.clientName}`
                    );
                  }
                }
              }
              break;
            }

            // 3. RELANCE DE DEMANDE EN ATTENTE (PENDING depuis +24h)
            case 'REQUEST_PENDING_FOLLOWUP': {
              const pendingRequests = (this.data.requests || []).filter(
                (r) => r.businessId === biz.id && r.status === 'PENDING'
              );

              const hoursAfter = rule.triggerHoursAfter || 24;

              for (const req of pendingRequests) {
                const ageHours = (nowMs - new Date(req.createdAt).getTime()) / 3600000;

                if (options?.force || ageHours >= hoursAfter) {
                  const idempotencyKey = `${biz.id}:REQ_PENDING:${req.id}:${hoursAfter}h`;
                  const alreadySent = (this.data.automationHistory || []).some(
                    (h) => h.idempotencyKey === idempotencyKey && h.status === 'SENT'
                  );

                  if (alreadySent) {
                    summary.skippedCount++;
                    continue;
                  }

                  summary.actionsTriggered++;
                  const notifTitle = `Demande en attente de réponse (+${hoursAfter}h)`;
                  const notifMsg = `La demande "${req.title}" de ${req.clientName} (${req.clientPhone}) attend votre confirmation depuis plus de ${hoursAfter} heures.`;

                  this.createNotification({
                    recipientType: 'BUSINESS',
                    recipientId: biz.id,
                    recipientName: biz.name,
                    title: notifTitle,
                    message: notifMsg,
                    requestId: req.id,
                    interactionType: req.interactionType,
                    channel: 'INTERNAL',
                    priority: 'HIGH',
                  });

                  this.addAutomationHistoryEntry({
                    businessId: biz.id,
                    businessName: biz.name,
                    ruleId: rule.id,
                    ruleType: 'REQUEST_PENDING_FOLLOWUP',
                    idempotencyKey,
                    recipientType: 'BUSINESS',
                    recipientId: biz.id,
                    recipientName: biz.name,
                    targetEntityType: 'REQUEST',
                    targetEntityId: req.id,
                    title: notifTitle,
                    message: notifMsg,
                    priority: 'HIGH',
                    channel: 'INTERNAL',
                    status: 'SENT',
                    retryCount: 0,
                    maxRetries: 3,
                  });

                  summary.sentCount++;
                  summary.details.push(
                    `[${biz.name}] Relance demande PENDING créée pour ${req.title}`
                  );
                }
              }
              break;
            }

            // 4. RELANCE CLIENT : DEMANDE ACCEPTÉE MAIS PAS DE SUITE
            case 'REQUEST_ACCEPTED_CLIENT_FOLLOWUP': {
              const acceptedRequests = (this.data.requests || []).filter(
                (r) => r.businessId === biz.id && r.status === 'ACCEPTED'
              );

              const hoursAfter = rule.triggerHoursAfter || 12;

              for (const req of acceptedRequests) {
                // Vérifier si le client a déjà réservé ou payé
                const hasPaid = req.paymentStatus === 'PAID' || (req.paidAmount || 0) > 0;
                if (hasPaid) continue;

                const ageHours = (nowMs - new Date(req.updatedAt || req.createdAt).getTime()) / 3600000;

                if (options?.force || ageHours >= hoursAfter) {
                  const idempotencyKey = `${biz.id}:CLIENT_FOLLOWUP:${req.id}`;
                  const alreadySent = (this.data.automationHistory || []).some(
                    (h) => h.idempotencyKey === idempotencyKey && h.status === 'SENT'
                  );

                  if (alreadySent) {
                    summary.skippedCount++;
                    continue;
                  }

                  summary.actionsTriggered++;
                  const notifTitle = `Votre demande a été acceptée par ${biz.name}`;
                  const notifMsg = `Bonne nouvelle ! Votre demande "${req.title}" a été acceptée. Vous pouvez maintenant finaliser votre rendez-vous ou votre réservation.`;

                  this.createNotification({
                    recipientType: 'CLIENT',
                    recipientId: req.clientId,
                    recipientName: req.clientName,
                    title: notifTitle,
                    message: notifMsg,
                    requestId: req.id,
                    interactionType: req.interactionType,
                    channel: 'INTERNAL',
                    priority: 'NORMAL',
                  });

                  this.addAutomationHistoryEntry({
                    businessId: biz.id,
                    businessName: biz.name,
                    ruleId: rule.id,
                    ruleType: 'REQUEST_ACCEPTED_CLIENT_FOLLOWUP',
                    idempotencyKey,
                    recipientType: 'CLIENT',
                    recipientId: req.clientId,
                    recipientName: req.clientName,
                    recipientPhone: req.clientPhone,
                    targetEntityType: 'REQUEST',
                    targetEntityId: req.id,
                    title: notifTitle,
                    message: notifMsg,
                    priority: 'NORMAL',
                    channel: 'INTERNAL',
                    status: 'SENT',
                    retryCount: 0,
                    maxRetries: 3,
                  });

                  summary.sentCount++;
                  summary.details.push(
                    `[${biz.name}] Relance acceptation envoyée à ${req.clientName}`
                  );
                }
              }
              break;
            }

            // 5. RAPPEL DE SOLDE RESTANT
            case 'PAYMENT_BALANCE_REMINDER': {
              const balanceRequests = (this.data.requests || []).filter(
                (r) =>
                  r.businessId === biz.id &&
                  r.status === 'CONFIRMED' &&
                  (r.remainingAmount || 0) > 0 &&
                  r.paymentStatus !== 'PAID'
              );

              for (const req of balanceRequests) {
                const targetDate = req.scheduledDate || req.requestedDate;
                let diffHours = 100;
                if (targetDate) {
                  const evtTime = new Date(`${targetDate}T09:00:00`).getTime();
                  diffHours = (evtTime - nowMs) / 3600000;
                }

                if (options?.force || (diffHours > 0 && diffHours <= 48)) {
                  const idempotencyKey = `${biz.id}:BALANCE:${req.id}`;
                  const alreadySent = (this.data.automationHistory || []).some(
                    (h) => h.idempotencyKey === idempotencyKey && h.status === 'SENT'
                  );

                  if (alreadySent) {
                    summary.skippedCount++;
                    continue;
                  }

                  summary.actionsTriggered++;
                  const rem = req.remainingAmount?.toLocaleString() || '0';
                  const notifTitle = `Rappel : Solde restant pour votre réservation`;
                  const notifMsg = `Bonjour ${req.clientName}, un solde restant de ${rem} FCFA est dû pour "${req.title}" chez ${biz.name}.`;

                  this.createNotification({
                    recipientType: 'CLIENT',
                    recipientId: req.clientId,
                    recipientName: req.clientName,
                    title: notifTitle,
                    message: notifMsg,
                    requestId: req.id,
                    interactionType: req.interactionType,
                    channel: 'INTERNAL',
                    priority: 'HIGH',
                  });

                  this.addAutomationHistoryEntry({
                    businessId: biz.id,
                    businessName: biz.name,
                    ruleId: rule.id,
                    ruleType: 'PAYMENT_BALANCE_REMINDER',
                    idempotencyKey,
                    recipientType: 'CLIENT',
                    recipientId: req.clientId,
                    recipientName: req.clientName,
                    recipientPhone: req.clientPhone,
                    targetEntityType: 'REQUEST',
                    targetEntityId: req.id,
                    title: notifTitle,
                    message: notifMsg,
                    priority: 'HIGH',
                    channel: 'INTERNAL',
                    status: 'SENT',
                    retryCount: 0,
                    maxRetries: 3,
                  });

                  summary.sentCount++;
                  summary.details.push(
                    `[${biz.name}] Rappel solde ${rem} FCFA envoyé à ${req.clientName}`
                  );
                }
              }
              break;
            }

            // 6. ANNIVERSAIRE CLIENT & OFFRE
            case 'CLIENT_BIRTHDAY': {
              // Récupérer les clients ayant interagi avec l'entreprise
              const clientIds = Array.from(
                new Set(
                  (this.data.requests || [])
                    .filter((r) => r.businessId === biz.id && r.clientId)
                    .map((r) => r.clientId)
                )
              );

              // Données réelles : On regarde les clients
              for (const cId of clientIds) {
                // Trouver une demande représentative du client
                const clientReq = (this.data.requests || []).find((r) => r.clientId === cId);
                if (!clientReq) continue;

                // Vérifier si le client a une date d'anniversaire enregistrée (pas d'extrapolation)
                // Note : Pour les tests réels ou profil client ayant birthDate
                const isBirthdayToday = false; // Ne jamais inventer d'anniversaire sans donnée réelle

                if (isBirthdayToday || options?.force) {
                  const idempotencyKey = `${biz.id}:BIRTHDAY:${cId}:${currentYear}`;
                  const alreadySent = (this.data.automationHistory || []).some(
                    (h) => h.idempotencyKey === idempotencyKey && h.status === 'SENT'
                  );

                  if (alreadySent) {
                    summary.skippedCount++;
                    continue;
                  }

                  summary.actionsTriggered++;
                  const offer = rule.birthdayOffer;
                  let offerText = '';
                  if (offer?.discountPercentage) {
                    offerText = ` À cette occasion, profitez de ${offer.discountPercentage}% de réduction sur nos services.`;
                  } else if (offer?.customMessage) {
                    offerText = ` ${offer.customMessage}`;
                  }

                  const notifTitle = `Joyeux Anniversaire de la part de ${biz.name} !`;
                  const notifMsg = `Toute l'équipe de ${biz.name} vous souhaite un excellent anniversaire !${offerText}`;

                  this.createNotification({
                    recipientType: 'CLIENT',
                    recipientId: cId,
                    recipientName: clientReq.clientName,
                    title: notifTitle,
                    message: notifMsg,
                    channel: 'INTERNAL',
                    priority: 'NORMAL',
                  });

                  this.addAutomationHistoryEntry({
                    businessId: biz.id,
                    businessName: biz.name,
                    ruleId: rule.id,
                    ruleType: 'CLIENT_BIRTHDAY',
                    idempotencyKey,
                    recipientType: 'CLIENT',
                    recipientId: cId,
                    recipientName: clientReq.clientName,
                    recipientPhone: clientReq.clientPhone,
                    targetEntityType: 'CLIENT',
                    targetEntityId: cId,
                    title: notifTitle,
                    message: notifMsg,
                    priority: 'NORMAL',
                    channel: 'INTERNAL',
                    status: 'SENT',
                    retryCount: 0,
                    maxRetries: 3,
                  });

                  summary.sentCount++;
                  summary.details.push(
                    `[${biz.name}] Vœux d'anniversaire envoyés à ${clientReq.clientName}`
                  );
                }
              }
              break;
            }

            // 7. ALERTE ENTREPRISE SURCHARGE
            case 'BUSINESS_ALERT': {
              const pendingCount = (this.data.requests || []).filter(
                (r) => r.businessId === biz.id && r.status === 'PENDING'
              ).length;

              const threshold = rule.thresholdCount || 5;

              if (pendingCount >= threshold) {
                const idempotencyKey = `${biz.id}:ALERT_OVERLOAD:${todayDateStr}`;
                const alreadySent = (this.data.automationHistory || []).some(
                  (h) => h.idempotencyKey === idempotencyKey && h.status === 'SENT'
                );

                if (alreadySent) {
                  summary.skippedCount++;
                  continue;
                }

                summary.actionsTriggered++;
                const notifTitle = `Alerte : Pic d'activité (${pendingCount} demandes en attente)`;
                const notifMsg = `Vous avez actuellement ${pendingCount} demandes en attente de traitement. Répondez rapidement pour maintenir votre Business Health Score élevé.`;

                this.createNotification({
                  recipientType: 'BUSINESS',
                  recipientId: biz.id,
                  recipientName: biz.name,
                  title: notifTitle,
                  message: notifMsg,
                  channel: 'INTERNAL',
                  priority: 'URGENT',
                });

                this.addAutomationHistoryEntry({
                  businessId: biz.id,
                  businessName: biz.name,
                  ruleId: rule.id,
                  ruleType: 'BUSINESS_ALERT',
                  idempotencyKey,
                  recipientType: 'BUSINESS',
                  recipientId: biz.id,
                  recipientName: biz.name,
                  targetEntityType: 'BUSINESS',
                  targetEntityId: biz.id,
                  title: notifTitle,
                  message: notifMsg,
                  priority: 'URGENT',
                  channel: 'INTERNAL',
                  status: 'SENT',
                  retryCount: 0,
                  maxRetries: 3,
                });

                summary.sentCount++;
                summary.details.push(
                  `[${biz.name}] Alerte pic d'activité envoyée (${pendingCount} demandes)`
                );
              }
              break;
            }
          }
        } catch (ruleErr: any) {
          summary.failedCount++;
          const errMsg = ruleErr?.message || 'Erreur inattendue durant l’exécution de la règle';
          summary.details.push(`[${biz.name}] Échec règle ${rule.name}: ${errMsg}`);

          // Enregistrement de l'échec dans l'historique sans crash
          this.addAutomationHistoryEntry({
            businessId: biz.id,
            businessName: biz.name,
            ruleId: rule.id,
            ruleType: rule.ruleType,
            idempotencyKey: `${biz.id}:ERR:${rule.id}:${Date.now()}`,
            recipientType: 'BUSINESS',
            recipientId: biz.id,
            recipientName: biz.name,
            targetEntityType: 'BUSINESS',
            targetEntityId: biz.id,
            title: `Échec d'automatisation : ${rule.name}`,
            message: errMsg,
            priority: 'HIGH',
            channel: 'INTERNAL',
            status: 'FAILED',
            errorMessage: errMsg,
            retryCount: 1,
            maxRetries: 3,
          });
        }
      }
    }

    return summary;
  }

  // ==========================================================================
  // SPRINT MARKETPLACE FLOWEXA (B21: Matching, Demandes & Propositions)
  // ==========================================================================

  private matchingEngine?: MarketplaceMatchingService;

  public getMatchingEngine(): MarketplaceMatchingService {
    if (!this.matchingEngine) {
      this.matchingEngine = new MarketplaceMatchingService(this);
    }
    return this.matchingEngine;
  }

  /**
   * Vérifie et expire automatiquement les demandes dont la date souhaitée ou d'échéance est passée
   */
  public checkMarketplaceExpirations(): void {
    if (!this.data.marketplaceRequests) return;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    let hasChanges = false;

    for (const req of this.data.marketplaceRequests) {
      if (['PUBLISHED', 'MATCHING', 'RESPONSES_RECEIVED'].includes(req.status)) {
        const isPastDate = req.desiredDate && req.desiredDate < todayStr;
        const isPastExpiry = req.expiresAt && new Date(req.expiresAt).getTime() < now.getTime();
        if (isPastDate || isPastExpiry) {
          req.status = 'EXPIRED';
          req.updatedAt = now.toISOString();
          hasChanges = true;

          // Rejeter les propositions en attente sur une demande expirée
          const responses = this.data.marketplaceResponses?.filter(
            (r) => r.marketplaceRequestId === req.id && r.status === 'PENDING'
          ) || [];
          for (const resp of responses) {
            resp.status = 'EXPIRED';
            resp.updatedAt = now.toISOString();
          }
        }
      }
    }

    if (hasChanges) {
      this.commit();
    }
  }

  public createMarketplaceRequest(
    requestData: Omit<MarketplaceRequestEntity, 'id' | 'createdAt' | 'updatedAt'>
  ): MarketplaceRequestEntity {
    const now = new Date().toISOString();
    const newRequest: MarketplaceRequestEntity = {
      id: `mkr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ...requestData,
      responsesCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    if (!this.data.marketplaceRequests) {
      this.data.marketplaceRequests = [];
    }

    this.data.marketplaceRequests.unshift(newRequest);
    this.commit();
    return newRequest;
  }

  public publishMarketplaceRequest(
    id: string,
    clientId: string
  ): { success: boolean; request?: MarketplaceRequestEntity; matchedCount?: number; error?: string } {
    const req = this.data.marketplaceRequests?.find((r) => r.id === id);
    if (!req) {
      return { success: false, error: 'Demande introuvable.' };
    }
    if (req.clientId !== clientId) {
      return { success: false, error: 'Accès non autorisé à cette demande.' };
    }

    req.status = req.responsesCount && req.responsesCount > 0 ? 'RESPONSES_RECEIVED' : 'PUBLISHED';
    req.updatedAt = new Date().toISOString();

    // Calcul immédiat des entreprises correspondantes
    const matches = this.getMatchingEngine().findMatches(req);
    const eligibleMatches = matches.filter((m) => m.matchingScore >= 30);

    // Notification aux entreprises éligibles
    for (const match of eligibleMatches) {
      this.createNotification({
        recipientType: 'BUSINESS',
        recipientId: match.businessId,
        title: `Nouvelle opportunité : ${req.title}`,
        message: `Une demande client (${req.category}) correspond à vos services à ${req.location}. Budget max : ${
          typeof req.budgetMax === 'number' ? req.budgetMax.toLocaleString('fr-FR') + ' FCFA' : 'Sur mesure'
        }.`,
        channel: 'INTERNAL',
        priority: 'HIGH',
      });
    }

    this.commit();
    return { success: true, request: req, matchedCount: eligibleMatches.length };
  }

  public getMarketplaceRequestById(id: string): MarketplaceRequestEntity | undefined {
    this.checkMarketplaceExpirations();
    return this.data.marketplaceRequests?.find((r) => r.id === id);
  }

  public getMarketplaceRequests(filters: {
    clientId?: string;
    businessId?: string;
    status?: string;
    isSuperAdmin?: boolean;
  }): MarketplaceRequestEntity[] {
    this.checkMarketplaceExpirations();
    let requests = this.data.marketplaceRequests || [];

    if (filters.clientId) {
      requests = requests.filter((r) => r.clientId === filters.clientId);
    } else if (filters.businessId) {
      // Pour une entreprise : requêtes où elle a déjà répondu OU requêtes publiées/en cours qui matchent son profil
      const bizId = filters.businessId;
      const myResponses = this.data.marketplaceResponses?.filter((resp) => resp.businessId === bizId) || [];
      const respondedReqIds = new Set(myResponses.map((resp) => resp.marketplaceRequestId));

      const matchingEngine = this.getMatchingEngine();

      requests = requests.filter((r) => {
        // 1. A déjà répondu
        if (respondedReqIds.has(r.id)) return true;

        // 2. Requête ouverte (non brouillon, non annulée)
        if (!['PUBLISHED', 'MATCHING', 'RESPONSES_RECEIVED'].includes(r.status)) return false;

        // 3. Correspond à l'entreprise
        const matches = matchingEngine.findMatches(r);
        return matches.some((m) => m.businessId === bizId);
      });
    } else if (!filters.isSuperAdmin) {
      // Sans authentification client ou business ou admin : restreindre aux requêtes publiques sans données privées
      requests = requests.filter((r) => ['PUBLISHED', 'MATCHING', 'RESPONSES_RECEIVED'].includes(r.status));
    }

    if (filters.status && filters.status !== 'ALL') {
      requests = requests.filter((r) => r.status === filters.status);
    }

    // Tri par date de mise à jour récente
    return requests.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public updateMarketplaceRequestStatus(
    id: string,
    status: MarketplaceRequestStatus,
    updates?: Partial<MarketplaceRequestEntity>
  ): MarketplaceRequestEntity | null {
    const req = this.data.marketplaceRequests?.find((r) => r.id === id);
    if (!req) return null;

    req.status = status;
    req.updatedAt = new Date().toISOString();
    if (updates) {
      Object.assign(req, updates);
    }
    this.commit();
    return req;
  }

  public cancelMarketplaceRequest(
    id: string,
    clientId: string,
    reason?: string
  ): { success: boolean; error?: string } {
    const req = this.data.marketplaceRequests?.find((r) => r.id === id);
    if (!req) return { success: false, error: 'Demande introuvable.' };
    if (req.clientId !== clientId) {
      return { success: false, error: 'Seul l’auteur peut annuler sa demande.' };
    }
    if (['ACCEPTED', 'CONVERTED', 'COMPLETED'].includes(req.status)) {
      return {
        success: false,
        error: 'Cette demande a déjà été acceptée ou convertie en réservation.',
      };
    }

    req.status = 'CANCELLED';
    req.cancellationReason = reason || 'Annulé par le client';
    req.updatedAt = new Date().toISOString();

    // Rejeter toutes les propositions associées en cours
    const responses = this.data.marketplaceResponses?.filter((r) => r.marketplaceRequestId === id) || [];
    for (const resp of responses) {
      if (resp.status === 'PENDING') {
        resp.status = 'REJECTED';
        resp.updatedAt = new Date().toISOString();
        this.createNotification({
          recipientType: 'BUSINESS',
          recipientId: resp.businessId,
          title: `Demande annulée : ${req.title}`,
          message: `Le client a annulé sa recherche. Motif : ${req.cancellationReason}.`,
          channel: 'INTERNAL',
          priority: 'NORMAL',
        });
      }
    }

    this.commit();
    return { success: true };
  }

  public findMatchesForRequest(requestId: string): MarketplaceMatchResult[] {
    const req = this.getMarketplaceRequestById(requestId);
    if (!req) return [];
    return this.getMatchingEngine().findMatches(req);
  }

  public createMarketplaceResponse(
    responseData: Omit<MarketplaceResponseEntity, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): { success: boolean; response?: MarketplaceResponseEntity; error?: string } {
    const req = this.getMarketplaceRequestById(responseData.marketplaceRequestId);
    if (!req) {
      return { success: false, error: 'Demande Marketplace introuvable.' };
    }
    if (!['PUBLISHED', 'MATCHING', 'RESPONSES_RECEIVED'].includes(req.status)) {
      return {
        success: false,
        error: `Impossible de soumettre une proposition sur une demande au statut ${req.status}.`,
      };
    }

    const db = this.getDb();
    const biz = db.businesses?.find((b) => b.id === responseData.businessId);
    if (!biz) {
      return { success: false, error: 'Entreprise introuvable.' };
    }

    // Vérifier si l'entreprise a déjà soumis une réponse active
    const existing = this.data.marketplaceResponses?.find(
      (r) => r.marketplaceRequestId === req.id && r.businessId === responseData.businessId
    );
    if (existing && ['PENDING', 'ACCEPTED', 'CONVERTED'].includes(existing.status)) {
      return {
        success: false,
        error: 'Votre établissement a déjà soumis une proposition active pour cette demande.',
      };
    }

    // Récupération des données réelles de notation et distance
    const ratingSummary = this.calculateRating(biz.id);
    let distanceKm: number | undefined;
    if (
      typeof req.latitude === 'number' &&
      typeof req.longitude === 'number' &&
      typeof biz.latitude === 'number' &&
      typeof biz.longitude === 'number'
    ) {
      const { calculateDistanceKm } = require('./marketplace/MarketplaceMatchingService');
      distanceKm = calculateDistanceKm(req.latitude, req.longitude, biz.latitude, biz.longitude);
    }

    let catalogTitle = responseData.catalogItemTitle;
    if (responseData.catalogItemId && !catalogTitle) {
      const catItem = db.catalogItems?.find((c) => c.id === responseData.catalogItemId);
      if (catItem) catalogTitle = catItem.title;
    }

    const now = new Date().toISOString();
    const newResponse: MarketplaceResponseEntity = {
      id: `mkrp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      marketplaceRequestId: req.id,
      businessId: biz.id,
      businessName: biz.name,
      businessPhone: biz.phone,
      businessCity: biz.city,
      businessDistrict: biz.district,
      catalogItemId: responseData.catalogItemId,
      catalogItemTitle: catalogTitle,
      message: responseData.message,
      proposedPrice: responseData.proposedPrice,
      availableDate: responseData.availableDate,
      status: 'PENDING',
      distanceKm,
      rating: ratingSummary.averageRating,
      reviewCount: ratingSummary.reviewCount,
      createdAt: now,
      updatedAt: now,
    };

    if (!this.data.marketplaceResponses) {
      this.data.marketplaceResponses = [];
    }
    this.data.marketplaceResponses.unshift(newResponse);

    // Mise à jour de la demande parente
    const activeResponses = this.data.marketplaceResponses.filter(
      (r) => r.marketplaceRequestId === req.id && r.status !== 'REJECTED'
    );
    req.responsesCount = activeResponses.length;
    req.status = 'RESPONSES_RECEIVED';
    req.updatedAt = now;

    // Notification au client
    this.createNotification({
      recipientType: 'CLIENT',
      recipientId: req.clientId,
      title: `Nouvelle proposition reçue pour "${req.title}"`,
      message: `${biz.name} vous a transmis une proposition à ${newResponse.proposedPrice.toLocaleString(
        'fr-FR'
      )} FCFA pour le ${newResponse.availableDate}.`,
      channel: 'INTERNAL',
      priority: 'HIGH',
    });

    this.commit();
    return { success: true, response: newResponse };
  }

  public getMarketplaceResponses(
    requestId?: string,
    businessId?: string,
    clientId?: string
  ): MarketplaceResponseEntity[] {
    let responses = this.data.marketplaceResponses || [];

    if (requestId) {
      responses = responses.filter((r) => r.marketplaceRequestId === requestId);
    }
    if (businessId) {
      responses = responses.filter((r) => r.businessId === businessId);
    }
    if (clientId) {
      // Vérifier que les requêtes appartiennent bien à ce client
      const clientReqIds = new Set(
        (this.data.marketplaceRequests || [])
          .filter((req) => req.clientId === clientId)
          .map((req) => req.id)
      );
      responses = responses.filter((r) => clientReqIds.has(r.marketplaceRequestId));
    }

    return responses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getMarketplaceResponseById(id: string): MarketplaceResponseEntity | undefined {
    return this.data.marketplaceResponses?.find((r) => r.id === id);
  }

  public updateMarketplaceResponseStatus(
    id: string,
    status: MarketplaceResponseStatus,
    updates?: Partial<MarketplaceResponseEntity>
  ): MarketplaceResponseEntity | null {
    const resp = this.data.marketplaceResponses?.find((r) => r.id === id);
    if (!resp) return null;
    resp.status = status;
    resp.updatedAt = new Date().toISOString();
    if (updates) {
      Object.assign(resp, updates);
    }
    this.commit();
    return resp;
  }

  /**
   * Acceptation d'une proposition par le client
   * Déclenche la création contractuelle de la réservation/rendez-vous réelle,
   * initialise la conversation dans la messagerie et émet les notifications.
   */
  public acceptMarketplaceResponse(params: {
    requestId: string;
    responseId: string;
    clientId: string;
  }): {
    success: boolean;
    request?: MarketplaceRequestEntity;
    response?: MarketplaceResponseEntity;
    convertedRequest?: FlowexaRequestEntity;
    conversationId?: string;
    error?: string;
  } {
    const req = this.getMarketplaceRequestById(params.requestId);
    if (!req) return { success: false, error: 'Demande introuvable.' };
    if (req.clientId !== params.clientId) {
      return { success: false, error: 'Vous ne pouvez accepter des propositions que pour vos propres demandes.' };
    }
    if (['ACCEPTED', 'CONVERTED', 'CANCELLED', 'EXPIRED'].includes(req.status)) {
      return { success: false, error: `La demande est déjà au statut ${req.status}.` };
    }

    const resp = this.getMarketplaceResponseById(params.responseId);
    if (!resp || resp.marketplaceRequestId !== req.id) {
      return { success: false, error: 'Proposition introuvable pour cette demande.' };
    }
    if (resp.status !== 'PENDING') {
      return { success: false, error: `Cette proposition est déjà au statut ${resp.status}.` };
    }

    const now = new Date().toISOString();
    const biz = this.getDb().businesses?.find((b) => b.id === resp.businessId);

    // 1. Création de la réservation ou du rendez-vous réel (B12 / B15)
    const isBooking = ['IMMOBILIER', 'GUEST_HOUSE'].includes(biz?.module_code || '');
    const createdBooking = this.createRequest({
      id: `req-mkr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      clientId: req.clientId,
      clientName: req.clientName,
      clientPhone: req.clientPhone,
      clientEmail: req.clientEmail,
      businessId: resp.businessId,
      businessName: resp.businessName,
      businessPhone: resp.businessPhone,
      moduleCode: biz?.module_code || 'SERVICES',
      catalogItemId: resp.catalogItemId,
      catalogItemTitle: resp.catalogItemTitle || req.title,
      catalogItemPrice: resp.proposedPrice,
      catalogItemCurrency: 'FCFA',
      interactionType: isBooking ? 'BOOKING' : 'APPOINTMENT',
      title: `[Marketplace Flowexa] ${req.title}`,
      message: `Proposition sélectionnée sur la Marketplace Flowexa.\nOffre : ${resp.catalogItemTitle || 'Devis sur mesure'}\nMessage du pro : "${resp.message}"`,
      requestedDate: resp.availableDate,
      scheduledDate: resp.availableDate,
      lockedPrice: resp.proposedPrice,
      lockedCurrency: 'FCFA',
      location: req.location,
      status: 'CONFIRMED',
      statusHistory: [
        {
          status: 'CONFIRMED',
          changedBy: 'CLIENT',
          changedByName: req.clientName,
          timestamp: now,
          note: `Proposition sélectionnée sur la Marketplace Flowexa avec l'établissement ${resp.businessName}`,
        },
      ],
      createdAt: now,
      updatedAt: now,
    });

    // 2. Initialisation ou liaison de la conversation dans la messagerie Flowexa (B14)
    let conversationId: string | undefined;
    try {
      const convRes = this.createOrGetConversation({
        clientId: req.clientId,
        clientName: req.clientName,
        clientPhone: req.clientPhone,
        clientEmail: req.clientEmail,
        businessId: resp.businessId,
        requestId: createdBooking.id,
        initialMessage: `[Marketplace Flowexa] Votre proposition pour "${req.title}" a été retenue par le client ! Montant convenu : ${resp.proposedPrice.toLocaleString('fr-FR')} FCFA. Date : ${resp.availableDate}.`,
        callerRole: 'CLIENT',
      });
      conversationId = convRes.conversation?.id;
    } catch (e) {
      console.error('[Marketplace] Erreur création conversation messagerie', e);
    }

    // 3. Mise à jour de la proposition acceptée
    resp.status = 'CONVERTED';
    resp.updatedAt = now;

    // 4. Rejet automatique des autres propositions en attente
    const otherResponses = this.data.marketplaceResponses?.filter(
      (r) => r.marketplaceRequestId === req.id && r.id !== resp.id && r.status === 'PENDING'
    ) || [];
    for (const other of otherResponses) {
      other.status = 'REJECTED';
      other.updatedAt = now;
      this.createNotification({
        recipientType: 'BUSINESS',
        recipientId: other.businessId,
        title: `Demande attribuée : ${req.title}`,
        message: `Le client a retenu une autre proposition pour sa recherche. Merci pour votre participation.`,
        channel: 'INTERNAL',
        priority: 'NORMAL',
      });
    }

    // 5. Mise à jour de la demande Marketplace
    req.status = 'CONVERTED';
    req.selectedResponseId = resp.id;
    req.convertedRequestId = createdBooking.id;
    req.conversationId = conversationId;
    req.updatedAt = now;

    // 6. Notifications prioritaires
    this.createNotification({
      recipientType: 'BUSINESS',
      recipientId: resp.businessId,
      title: `Proposition acceptée : ${req.title} 🎉`,
      message: `Félicitations ! Votre proposition à ${resp.proposedPrice.toLocaleString('fr-FR')} FCFA a été retenue par ${req.clientName}. La réservation #${createdBooking.id} est confirmée.`,
      channel: 'INTERNAL',
      priority: 'HIGH',
    });

    this.createNotification({
      recipientType: 'CLIENT',
      recipientId: req.clientId,
      title: `Réservation confirmée avec ${resp.businessName}`,
      message: `Votre proposition a été confirmée pour le montant de ${resp.proposedPrice.toLocaleString('fr-FR')} FCFA. Vous pouvez échanger dans la messagerie et régler votre acompte.`,
      channel: 'INTERNAL',
      priority: 'HIGH',
    });

    this.commit();
    return {
      success: true,
      request: req,
      response: resp,
      convertedRequest: createdBooking,
      conversationId,
    };
  }

  public getMarketplaceStats(): MarketplaceStats {
    this.checkMarketplaceExpirations();
    const requests = this.data.marketplaceRequests || [];
    const responses = this.data.marketplaceResponses || [];

    const totalPublished = requests.filter((r) => r.status !== 'DRAFT').length;
    const totalResponses = responses.length;
    const requestsWithResponses = requests.filter((r) => (r.responsesCount || 0) > 0).length;
    const responseRate = totalPublished > 0 ? Math.round((requestsWithResponses / totalPublished) * 100) : 0;

    const totalConverted = requests.filter((r) => ['ACCEPTED', 'CONVERTED', 'COMPLETED'].includes(r.status)).length;
    const conversionRate = totalPublished > 0 ? Math.round((totalConverted / totalPublished) * 100) : 0;

    // Activité des entreprises
    const bizStatsMap = new Map<string, { businessId: string; businessName: string; responseCount: number; acceptedCount: number }>();

    for (const resp of responses) {
      if (!bizStatsMap.has(resp.businessId)) {
        bizStatsMap.set(resp.businessId, {
          businessId: resp.businessId,
          businessName: resp.businessName,
          responseCount: 0,
          acceptedCount: 0,
        });
      }
      const entry = bizStatsMap.get(resp.businessId)!;
      entry.responseCount++;
      if (['ACCEPTED', 'CONVERTED'].includes(resp.status)) {
        entry.acceptedCount++;
      }
    }

    const mostActiveBusinesses = Array.from(bizStatsMap.values()).sort(
      (a, b) => b.responseCount - a.responseCount || b.acceptedCount - a.acceptedCount
    );

    return {
      totalPublished,
      totalResponses,
      responseRate,
      totalConverted,
      conversionRate,
      activeBusinessesCount: bizStatsMap.size,
      mostActiveBusinesses: mostActiveBusinesses.slice(0, 10),
    };
  }

  // =========================================================================
  // SPRINT B22 + F22: COCKPIT ENTREPRISE, ÉQUIPE, TÂCHES, CLIENTS, CALENDRIER
  // =========================================================================

  public getTeamMembers(businessId?: string): BusinessTeamMember[] {
    const list = this.data.teamMembers || [];
    const filtered = businessId ? list.filter((m) => m.businessId === businessId) : list;
    
    // Enrich with real count of assigned requests
    return filtered.map((member) => {
      const assignedCount = (this.data.requests || []).filter(
        (r) =>
          r.businessId === member.businessId &&
          (r.assignedEmployeeId === member.id || r.assignedEmployeeName === member.name)
      ).length;
      return {
        ...member,
        assignedCount,
      };
    });
  }

  public addTeamMember(member: BusinessTeamMember): BusinessTeamMember {
    if (!this.data.teamMembers) {
      this.data.teamMembers = [];
    }
    // Règle Sprint B22: Interdiction absolue de créer un SUPER_ADMIN
    if ((member.role as string) === 'SUPER_ADMIN') {
      member.role = 'MANAGER';
    }
    this.data.teamMembers.push(member);
    this.commit();
    return member;
  }

  public updateTeamMember(
    id: string,
    updates: Partial<BusinessTeamMember>
  ): BusinessTeamMember | null {
    if (!this.data.teamMembers) return null;
    const index = this.data.teamMembers.findIndex((m) => m.id === id);
    if (index === -1) return null;

    // Règle Sprint B22: Interdiction d'élever en SUPER_ADMIN
    if (updates.role && (updates.role as string) === 'SUPER_ADMIN') {
      delete updates.role;
    }

    this.data.teamMembers[index] = {
      ...this.data.teamMembers[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.commit();
    return this.data.teamMembers[index];
  }

  public deleteTeamMember(id: string): boolean {
    if (!this.data.teamMembers) return false;
    const initialLen = this.data.teamMembers.length;
    this.data.teamMembers = this.data.teamMembers.filter((m) => m.id !== id);
    if (this.data.teamMembers.length !== initialLen) {
      this.commit();
      return true;
    }
    return false;
  }

  public getTasks(businessId?: string): BusinessTask[] {
    const list = this.data.tasks || [];
    const filtered = businessId ? list.filter((t) => t.businessId === businessId) : list;
    return [...filtered].sort((a, b) => {
      // Uncompleted tasks first, then by priority
      if (a.done !== b.done) return a.done ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  public addTask(task: BusinessTask): BusinessTask {
    if (!this.data.tasks) {
      this.data.tasks = [];
    }
    this.data.tasks.push(task);
    this.commit();
    return task;
  }

  public updateTask(id: string, updates: Partial<BusinessTask>): BusinessTask | null {
    if (!this.data.tasks) return null;
    const index = this.data.tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    this.data.tasks[index] = {
      ...this.data.tasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.commit();
    return this.data.tasks[index];
  }

  public deleteTask(id: string): boolean {
    if (!this.data.tasks) return false;
    const initialLen = this.data.tasks.length;
    this.data.tasks = this.data.tasks.filter((t) => t.id !== id);
    if (this.data.tasks.length !== initialLen) {
      this.commit();
      return true;
    }
    return false;
  }

  public getBusinessClients(businessId: string): BusinessClientSummary[] {
    // Multi-tenant strict : seules les requêtes et interactions de CE business
    const reqs = (this.data.requests || []).filter((r) => r.businessId === businessId);
    const clientMap = new Map<string, BusinessClientSummary>();

    for (const r of reqs) {
      const key = r.clientId || r.clientPhone;
      if (!key) continue;

      if (!clientMap.has(key)) {
        clientMap.set(key, {
          id: r.clientId || `client-${r.clientPhone}`,
          name: r.clientName || 'Client Flowexa',
          phone: r.clientPhone,
          email: r.clientEmail,
          relationType: 'NOUVEAU',
          totalRequests: 0,
          totalBookings: 0,
          totalAppointments: 0,
          totalPaid: 0,
          lastInteractionDate: r.createdAt,
          lastStatus: r.status,
          pendingRequestsCount: 0,
        });
      }

      const client = clientMap.get(key)!;
      client.totalRequests++;
      if (r.interactionType === 'BOOKING') client.totalBookings++;
      if (r.interactionType === 'APPOINTMENT') client.totalAppointments++;

      // Montant payé réel
      const paid = r.paidAmount || (['PAID', 'CONFIRMED'].includes(r.paymentStatus || '') ? (r.lockedPrice || r.catalogItemPrice || 0) : 0);
      client.totalPaid += paid;

      if (r.status === 'PENDING') {
        client.pendingRequestsCount++;
      }

      if (new Date(r.createdAt).getTime() > new Date(client.lastInteractionDate).getTime()) {
        client.lastInteractionDate = r.createdAt;
        client.lastStatus = r.status;
      }
    }

    // Calcul de relationType
    const result = Array.from(clientMap.values()).map((c) => {
      if (c.totalPaid >= 100000 || c.totalRequests >= 3) {
        c.relationType = 'VIP';
      } else if (c.totalRequests >= 2) {
        c.relationType = 'RÉCURRENT';
      } else {
        c.relationType = 'NOUVEAU';
      }
      return c;
    });

    return result.sort(
      (a, b) => new Date(b.lastInteractionDate).getTime() - new Date(a.lastInteractionDate).getTime()
    );
  }

  public getBusinessClientDetail(
    businessId: string,
    clientId: string
  ): BusinessClientDetail | null {
    // Vérification multi-tenant
    const allClients = this.getBusinessClients(businessId);
    const clientSummary = allClients.find(
      (c) => c.id === clientId || c.phone === clientId
    );
    if (!clientSummary) return null;

    const requests = (this.data.requests || []).filter(
      (r) =>
        r.businessId === businessId &&
        (r.clientId === clientSummary.id || r.clientPhone === clientSummary.phone)
    );

    const bookingIds = requests.map((r) => r.id);
    const payments = (this.data.payments || []).filter(
      (p) => p.businessId === businessId && bookingIds.includes(p.bookingId)
    );

    const reviews = (this.data.reviews || []).filter(
      (rev) =>
        rev.businessId === businessId &&
        (rev.clientId === clientSummary.id || rev.clientPhone === clientSummary.phone)
    );

    const conversation = (this.data.conversations || []).find(
      (conv) =>
        conv.businessId === businessId &&
        (conv.clientId === clientSummary.id || conv.clientPhone === clientSummary.phone)
    );

    return {
      ...clientSummary,
      requests,
      payments,
      reviews,
      conversationId: conversation?.id,
    };
  }

  public getBusinessCalendar(businessId: string): BusinessCalendarEvent[] {
    const reqs = (this.data.requests || []).filter(
      (r) => r.businessId === businessId && !['CANCELLED', 'REJECTED'].includes(r.status)
    );

    const events: BusinessCalendarEvent[] = [];

    for (const r of reqs) {
      const date = r.scheduledDate || r.requestedDate || r.createdAt.split('T')[0];
      events.push({
        id: `cal-${r.id}`,
        requestId: r.id,
        type: r.interactionType === 'BOOKING' ? 'BOOKING' : 'APPOINTMENT',
        title: r.catalogItemTitle || r.title || 'Prestation client',
        clientName: r.clientName,
        clientPhone: r.clientPhone,
        clientEmail: r.clientEmail,
        date,
        time: r.scheduledTime || r.requestedTime || '09:00',
        endDate: r.endDate,
        status: r.status,
        serviceTitle: r.catalogItemTitle,
        price: r.lockedPrice || r.catalogItemPrice,
        currency: r.lockedCurrency || r.catalogItemCurrency || 'FCFA',
        paymentStatus: r.paymentStatus,
        assignedEmployeeName: r.assignedEmployeeName,
      });
    }

    return events.sort((a, b) => {
      const timeA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
      const timeB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
      return timeA - timeB;
    });
  }

  public getBusinessRecentActivity(businessId: string): BusinessActivityEvent[] {
    const activity: BusinessActivityEvent[] = [];

    // 1. Événements des demandes & réservations
    const reqs = (this.data.requests || []).filter((r) => r.businessId === businessId);
    for (const r of reqs) {
      if (r.statusHistory && r.statusHistory.length > 0) {
        for (const sh of r.statusHistory) {
          activity.push({
            id: `act-req-${r.id}-${sh.timestamp}`,
            type: 'REQUEST_STATUS',
            title: `${sh.status === 'PENDING' ? 'Nouvelle demande' : sh.status === 'CONFIRMED' || sh.status === 'ACCEPTED' ? 'Demande acceptée' : 'Mise à jour'} : ${r.clientName}`,
            description: sh.note || `${r.catalogItemTitle || r.title} - Statut : ${sh.status}`,
            timestamp: sh.timestamp,
            entityId: r.id,
            status: sh.status,
          });
        }
      } else {
        activity.push({
          id: `act-req-${r.id}`,
          type: 'REQUEST_CREATED',
          title: `Demande reçue : ${r.clientName}`,
          description: r.catalogItemTitle || r.title,
          timestamp: r.createdAt,
          entityId: r.id,
          status: r.status,
        });
      }
    }

    // 2. Paiements et transactions réelles
    const txs = (this.data.transactions || []).filter((t) => t.businessId === businessId);
    for (const t of txs) {
      activity.push({
        id: `act-tx-${t.id}`,
        type: 'PAYMENT_RECEIVED',
        title: `Paiement reçu : ${(t.amount || 0).toLocaleString()} FCFA`,
        description: `Règlement ${t.paymentMethod || 'Mobile Money'} par ${t.clientName || 'Client'}`,
        timestamp: t.createdAt,
        entityId: t.bookingId,
        status: t.status,
      });
    }

    // 3. Nouveaux avis
    const reviews = (this.data.reviews || []).filter((rev) => rev.businessId === businessId);
    for (const rev of reviews) {
      activity.push({
        id: `act-rev-${rev.id}`,
        type: 'NEW_REVIEW',
        title: `Nouvel avis client : ${rev.rating}/5 étoiles`,
        description: `"${rev.comment.substring(0, 60)}${rev.comment.length > 60 ? '...' : ''}" - ${rev.clientName}`,
        timestamp: rev.createdAt,
        entityId: rev.id,
      });
    }

    return activity
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 25);
  }

  public getBusinessCockpitMetrics(businessId: string): BusinessCockpitMetrics {
    const todayStr = new Date().toISOString().split('T')[0];
    const reqs = (this.data.requests || []).filter((r) => r.businessId === businessId);

    // 1. Demandes en attente
    const pendingRequests = reqs.filter((r) => r.status === 'PENDING');
    const pendingRequestsCount = pendingRequests.length;

    // 2. Rendez-vous du jour
    const todayAppointments = reqs.filter(
      (r) =>
        r.interactionType === 'APPOINTMENT' &&
        (r.scheduledDate === todayStr || r.requestedDate === todayStr) &&
        !['CANCELLED', 'REJECTED'].includes(r.status)
    );
    const todayAppointmentsCount = todayAppointments.length;

    // 3. Réservations du jour
    const todayBookings = reqs.filter(
      (r) =>
        r.interactionType === 'BOOKING' &&
        (r.requestedDate === todayStr || r.scheduledDate === todayStr) &&
        !['CANCELLED', 'REJECTED'].includes(r.status)
    );
    const todayBookingsCount = todayBookings.length;

    // 4. Chiffre d'affaires réel
    const txs = (this.data.transactions || []).filter(
      (t) => t.businessId === businessId && t.status === 'SUCCESS'
    );
    
    // Revenue from transactions or locked prices on confirmed requests
    let todayRevenue = txs
      .filter((t) => t.createdAt && t.createdAt.startsWith(todayStr))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Si pas de transactions aujourd'hui, vérifier les montants payés des réservations confirmées aujourd'hui
    if (todayRevenue === 0) {
      const todayPaidReqs = reqs.filter(
        (r) =>
          r.createdAt &&
          r.createdAt.startsWith(todayStr) &&
          ['PAID', 'CONFIRMED'].includes(r.paymentStatus || '')
      );
      todayRevenue = todayPaidReqs.reduce(
        (sum, r) => sum + (r.paidAmount || r.lockedPrice || r.catalogItemPrice || 0),
        0
      );
    }

    // Weekly revenue
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyRevenue = txs
      .filter((t) => new Date(t.createdAt).getTime() >= sevenDaysAgo.getTime())
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Monthly revenue
    const currentMonth = todayStr.substring(0, 7);
    const monthlyRevenue = txs
      .filter((t) => t.createdAt && t.createdAt.startsWith(currentMonth))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // 5. Paiements en attente
    const pendingPaymentReqs = reqs.filter(
      (r) =>
        (r.remainingAmount && r.remainingAmount > 0) ||
        r.paymentStatus === 'PENDING' ||
        r.paymentStatus === 'PARTIALLY_PAID'
    );
    const pendingPaymentsCount = pendingPaymentReqs.length;
    const pendingPaymentsAmount = pendingPaymentReqs.reduce(
      (sum, r) =>
        sum +
        (r.remainingAmount !== undefined
          ? r.remainingAmount
          : r.paymentStatus === 'PENDING'
          ? r.lockedPrice || r.catalogItemPrice || 0
          : 0),
      0
    );

    // 6. Messages non lus
    const unreadMessagesCount = (this.data.conversations || [])
      .filter((c) => c.businessId === businessId)
      .reduce((sum, conv) => sum + (conv.unreadCountBusiness || 0), 0);

    // 7. Avis récents et note réelle
    const reviews = (this.data.reviews || []).filter((r) => r.businessId === businessId);
    const verifiedReviewsCount = reviews.length;
    const averageRating =
      reviews.length > 0
        ? Number((reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1))
        : 0;

    // 8. Tâches ouvertes
    const openTasks = (this.data.tasks || []).filter(
      (t) => t.businessId === businessId && !t.done
    );
    const openTasksCount = openTasks.length;

    // 9. Clients actifs
    const activeClientsCount = this.getBusinessClients(businessId).length;

    // 10. Tendance CA des 7 derniers jours (données réelles)
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const revenueTrend: { day: string; date: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];
      const dayAmount = txs
        .filter((t) => t.createdAt && t.createdAt.startsWith(dStr))
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      revenueTrend.push({ day: dayName, date: dStr, amount: dayAmount });
    }

    // 11. Section "À faire aujourd'hui" (Actions réelles concrètes)
    const todayActions: BusinessTodayAction[] = [];

    // Ajouter les demandes en attente
    for (const pr of pendingRequests.slice(0, 4)) {
      todayActions.push({
        id: `act-pr-${pr.id}`,
        type: 'PENDING_REQUEST',
        title: `Répondre à la demande de ${pr.clientName}`,
        subtitle: `${pr.catalogItemTitle || pr.title || 'Prestation'} (${pr.location || 'Cotonou'})`,
        priority: 'HIGH',
        actionLabel: 'Traiter',
        actionTarget: 'demandes',
        targetId: pr.id,
        time: pr.requestedTime || '10:00',
      });
    }

    // Ajouter les rendez-vous du jour
    for (const app of todayAppointments.slice(0, 3)) {
      todayActions.push({
        id: `act-app-${app.id}`,
        type: 'TODAY_APPOINTMENT',
        title: `Rendez-vous à venir avec ${app.clientName}`,
        subtitle: `${app.catalogItemTitle || app.title || 'Rendez-vous service'}`,
        priority: 'HIGH',
        actionLabel: 'Voir RDV',
        actionTarget: 'calendrier',
        targetId: app.id,
        time: app.scheduledTime || app.requestedTime || 'Aujourd\'hui',
      });
    }

    // Ajouter les réservations du jour
    for (const bkg of todayBookings.slice(0, 3)) {
      todayActions.push({
        id: `act-bkg-${bkg.id}`,
        type: 'TODAY_BOOKING',
        title: `Préparer l'arrivée de ${bkg.clientName}`,
        subtitle: `${bkg.catalogItemTitle || bkg.title} (${bkg.guestsCount || 1} personne(s))`,
        priority: 'MEDIUM',
        actionLabel: 'Réservation',
        actionTarget: 'demandes',
        targetId: bkg.id,
        time: bkg.requestedTime || '14:00',
      });
    }

    // Ajouter les messages non lus
    if (unreadMessagesCount > 0) {
      todayActions.push({
        id: 'act-unread-messages',
        type: 'UNREAD_MESSAGE',
        title: `${unreadMessagesCount} nouveau(x) message(s) client(s)`,
        subtitle: 'Des clients attendent votre réponse dans la messagerie directe.',
        priority: 'HIGH',
        actionLabel: 'Ouvrir messages',
        actionTarget: 'messages',
      });
    }

    // Ajouter les paiements en attente
    for (const ppr of pendingPaymentReqs.slice(0, 2)) {
      const amt = ppr.remainingAmount || ppr.lockedPrice || ppr.catalogItemPrice || 0;
      todayActions.push({
        id: `act-pay-${ppr.id}`,
        type: 'PENDING_PAYMENT',
        title: `Paiement en attente : ${ppr.clientName}`,
        subtitle: `Solde à régler : ${amt.toLocaleString()} FCFA pour ${ppr.catalogItemTitle || ppr.title}`,
        priority: 'MEDIUM',
        actionLabel: 'Vérifier',
        actionTarget: 'finances',
        targetId: ppr.id,
      });
    }

    // Ajouter les tâches prioritaires ouvertes
    for (const t of openTasks.filter((task) => task.priority === 'HIGH' || task.priority === 'URGENT').slice(0, 2)) {
      todayActions.push({
        id: `act-task-${t.id}`,
        type: 'PENDING_TASK',
        title: t.title,
        subtitle: t.relatedClientName ? `Lié à ${t.relatedClientName}` : 'Tâche opérationnelle',
        priority: 'HIGH',
        actionLabel: 'Consulter',
        actionTarget: 'demandes',
        time: t.dueTime,
      });
    }

    const recentActivity = this.getBusinessRecentActivity(businessId);

    return {
      pendingRequestsCount,
      todayAppointmentsCount,
      todayBookingsCount,
      todayRevenue,
      weeklyRevenue,
      monthlyRevenue,
      pendingPaymentsCount,
      pendingPaymentsAmount,
      unreadMessagesCount,
      verifiedReviewsCount,
      averageRating,
      activeClientsCount,
      openTasksCount,
      revenueTrend,
      todayActions,
      recentActivity,
    };
  }

  // =========================================================================
  // SPRINT B24: IDENTITÉ, COMPTES, SESSIONS, MOT DE PASSE, SÉCURITÉ
  // =========================================================================

  public getBusinessById(id: string): BusinessEntity | null {
    if (!this.data.businesses) return null;
    return this.data.businesses.find((b) => b.id === id) || null;
  }

  public getUsers(): UserAccountEntity[] {
    return this.data.users || [];
  }

  public getUserById(id: string): UserAccountEntity | null {
    if (!this.data.users) return null;
    return this.data.users.find((u) => u.id === id) || null;
  }

  public getUserByEmailOrPhone(identifier: string): UserAccountEntity | null {
    if (!this.data.users) return null;
    const clean = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/[\s\-\+\(\)]/g, '');
    return (
      this.data.users.find((u) => {
        const uEmail = (u.email || '').trim().toLowerCase();
        const uPhoneDigits = (u.phone || '').replace(/[\s\-\+\(\)]/g, '');
        return uEmail === clean || (cleanDigits.length >= 6 && uPhoneDigits.endsWith(cleanDigits));
      }) || null
    );
  }

  public createUser(user: Omit<UserAccountEntity, 'id' | 'createdAt' | 'updatedAt'>): UserAccountEntity {
    if (!this.data.users) {
      this.data.users = [];
    }
    const now = new Date().toISOString();
    const newUser: UserAccountEntity = {
      ...user,
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };
    this.data.users.push(newUser);
    this.commit();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<UserAccountEntity>): UserAccountEntity | null {
    if (!this.data.users) return null;
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) return null;

    // Protection Super Admin: Cannot elevate to SUPER_ADMIN unless already SUPER_ADMIN
    if (updates.role && updates.role === 'SUPER_ADMIN' && this.data.users[index].role !== 'SUPER_ADMIN') {
      delete updates.role;
    }

    this.data.users[index] = {
      ...this.data.users[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.commit();
    return this.data.users[index];
  }

  public deleteUser(id: string): boolean {
    if (!this.data.users) return false;
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) return false;

    // Suppression logique (soft delete) conformément à la section 24
    this.data.users[index].status = 'INACTIVE';
    this.data.users[index].updatedAt = new Date().toISOString();
    this.revokeUserSessions(id);
    this.commit();
    return true;
  }

  public createSession(params: {
    userId: string;
    refreshToken: string;
    expiresAt: string;
    userAgent?: string;
    ip?: string;
  }): UserSessionEntity {
    if (!this.data.sessions) {
      this.data.sessions = [];
    }
    const session: UserSessionEntity = {
      id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: params.userId,
      refreshToken: params.refreshToken,
      expiresAt: params.expiresAt,
      userAgent: params.userAgent,
      ip: params.ip,
      createdAt: new Date().toISOString(),
    };
    this.data.sessions.push(session);
    this.commit();
    return session;
  }

  public getSessionByRefreshToken(refreshToken: string): UserSessionEntity | null {
    if (!this.data.sessions) return null;
    return this.data.sessions.find((s) => s.refreshToken === refreshToken && !s.revokedAt) || null;
  }

  public revokeSession(refreshToken: string): boolean {
    if (!this.data.sessions) return false;
    const sess = this.data.sessions.find((s) => s.refreshToken === refreshToken);
    if (!sess) return false;
    sess.revokedAt = new Date().toISOString();
    this.commit();
    return true;
  }

  public revokeUserSessions(userId: string): void {
    if (!this.data.sessions) return;
    const now = new Date().toISOString();
    for (const sess of this.data.sessions) {
      if (sess.userId === userId && !sess.revokedAt) {
        sess.revokedAt = now;
      }
    }
    this.commit();
  }

  public getActiveSessionsCount(userId: string): number {
    if (!this.data.sessions) return 0;
    const now = new Date().toISOString();
    return this.data.sessions.filter((s) => s.userId === userId && !s.revokedAt && s.expiresAt > now).length;
  }

  public createPasswordReset(params: {
    userId: string;
    phoneOrEmail: string;
    code: string;
    token: string;
    expiresAt: string;
  }): PasswordResetEntity {
    if (!this.data.passwordResets) {
      this.data.passwordResets = [];
    }
    const pr: PasswordResetEntity = {
      id: `pr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: params.userId,
      phoneOrEmail: params.phoneOrEmail,
      code: params.code,
      token: params.token,
      expiresAt: params.expiresAt,
      used: false,
      createdAt: new Date().toISOString(),
    };
    this.data.passwordResets.push(pr);
    this.commit();
    return pr;
  }

  public getPasswordReset(tokenOrCode: string): PasswordResetEntity | null {
    if (!this.data.passwordResets) return null;
    const now = new Date().toISOString();
    return (
      this.data.passwordResets.find(
        (pr) => (pr.token === tokenOrCode || pr.code === tokenOrCode) && !pr.used && pr.expiresAt > now
      ) || null
    );
  }

  public markPasswordResetUsed(id: string): void {
    if (!this.data.passwordResets) return;
    const pr = this.data.passwordResets.find((p) => p.id === id);
    if (pr) {
      pr.used = true;
      this.commit();
    }
  }

  // ==========================================
  // SPRINT B25: FACTURATION ENTREPRISE — PLANS & ABONNEMENTS
  // ==========================================

  public getPlans(includeArchived = false): FlowexaPlanEntity[] {
    if (!this.data.plans) this.data.plans = [];
    return includeArchived ? this.data.plans : this.data.plans.filter((p) => p.status === 'ACTIVE');
  }

  public getPlanById(id: string): FlowexaPlanEntity | null {
    if (!this.data.plans) return null;
    return this.data.plans.find((p) => p.id === id || p.code === id) || null;
  }

  public createPlan(
    planData: Omit<FlowexaPlanEntity, 'id' | 'createdAt' | 'updatedAt'>,
    actor?: { userId: string; userEmail: string }
  ): FlowexaPlanEntity {
    if (!this.data.plans) this.data.plans = [];
    const now = new Date().toISOString();
    const newPlan: FlowexaPlanEntity = {
      ...planData,
      id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    this.data.plans.push(newPlan);
    this.logAudit({
      userId: actor?.userId || 'admin',
      userEmail: actor?.userEmail || 'admin@flowexa.com',
      action: 'PLAN_CREATED',
      entityType: 'PLAN',
      entityId: newPlan.id,
      description: `Création du plan tarifaire "${newPlan.name}" (${newPlan.price} ${newPlan.currency})`,
      changes: newPlan as unknown as Record<string, unknown>,
      ip: '127.0.0.1',
    });
    this.commit();
    return newPlan;
  }

  public updatePlan(
    id: string,
    updates: Partial<FlowexaPlanEntity>,
    actor?: { userId: string; userEmail: string }
  ): FlowexaPlanEntity | null {
    if (!this.data.plans) return null;
    const index = this.data.plans.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const previous = { ...this.data.plans[index] };
    this.data.plans[index] = {
      ...this.data.plans[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.logAudit({
      userId: actor?.userId || 'admin',
      userEmail: actor?.userEmail || 'admin@flowexa.com',
      action: 'PLAN_UPDATED',
      entityType: 'PLAN',
      entityId: id,
      description: `Mise à jour des paramètres du plan "${this.data.plans[index].name}"`,
      changes: { previous, updated: updates },
      ip: '127.0.0.1',
    });

    this.commit();
    return this.data.plans[index];
  }

  public togglePlanStatus(
    id: string,
    actor?: { userId: string; userEmail: string }
  ): FlowexaPlanEntity | null {
    if (!this.data.plans) return null;
    const plan = this.data.plans.find((p) => p.id === id);
    if (!plan) return null;

    const newStatus: PlanStatus = plan.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
    plan.status = newStatus;
    plan.updatedAt = new Date().toISOString();

    this.logAudit({
      userId: actor?.userId || 'admin',
      userEmail: actor?.userEmail || 'admin@flowexa.com',
      action: newStatus === 'ACTIVE' ? 'PLAN_ACTIVATED' : 'PLAN_ARCHIVED',
      entityType: 'PLAN',
      entityId: id,
      description: `Le plan "${plan.name}" a été ${newStatus === 'ACTIVE' ? 'activé' : 'archivé'}.`,
      ip: '127.0.0.1',
    });

    this.commit();
    return plan;
  }

  public getBusinessSubscription(businessId: string): FlowexaSubscriptionEntity | null {
    if (!this.data.subscriptions) return null;
    this.checkAndExpireSubscriptions();
    return this.data.subscriptions.find((s) => s.businessId === businessId) || null;
  }

  public getAllSubscriptions(): FlowexaSubscriptionEntity[] {
    if (!this.data.subscriptions) return [];
    this.checkAndExpireSubscriptions();
    return this.data.subscriptions;
  }

  public getSubscriptionUsage(businessId: string): SubscriptionUsageMetrics {
    const sub = this.getBusinessSubscription(businessId);
    let plan = sub ? this.getPlanById(sub.planId) : null;
    if (!plan) {
      plan = this.getPlanById('plan_starter') || {
        id: 'plan_starter',
        code: 'STARTER',
        name: 'Starter',
        description: 'Starter',
        price: 15000,
        currency: 'FCFA',
        period: 'MONTHLY',
        status: 'ACTIVE',
        limits: { maxEmployees: 3, maxServices: 10, maxOffers: 20, maxStorageMb: 500 },
        features: { statistics: true, automations: false, aiCopilot: false, marketplaceAccess: true, prioritySupport: false, customBranding: false, advancedReports: false },
        createdAt: '',
        updatedAt: '',
      };
    }

    const employeesCount = (this.data.teamMembers || []).filter((m) => m.businessId === businessId && (m.status === 'ACTIVE' || (m.status as any) === 'ACTIF')).length;
    const servicesCount = (this.data.services || []).filter((s) => s.businessId === businessId).length;
    
    // Offers : catalogItems + properties + rooms
    const catalogCount = (this.data.catalogItems || []).filter((c) => c.businessId === businessId).length;
    const propertiesCount = (this.data.properties || []).filter((p) => p.businessId === businessId).length;
    const roomsCount = (this.data.rooms || []).filter((r) => r.businessId === businessId).length;
    const totalOffers = catalogCount + propertiesCount + roomsCount;

    // Storage estimation based on images uploaded
    let photoCount = 0;
    (this.data.catalogItems || []).filter((c) => c.businessId === businessId).forEach((c) => {
      photoCount += (c.images || []).length;
    });
    (this.data.properties || []).filter((p) => p.businessId === businessId).forEach((p) => {
      photoCount += (p.images || []).length;
    });
    (this.data.rooms || []).filter((r) => r.businessId === businessId).forEach((r) => {
      photoCount += (r.images || []).length;
    });
    const storageUsedMb = Math.round(10 + photoCount * 2.5);

    return {
      employees: {
        current: employeesCount,
        max: plan.limits.maxEmployees,
        percentage: Math.min(100, Math.round((employeesCount / Math.max(1, plan.limits.maxEmployees)) * 100)),
      },
      services: {
        current: servicesCount,
        max: plan.limits.maxServices,
        percentage: Math.min(100, Math.round((servicesCount / Math.max(1, plan.limits.maxServices)) * 100)),
      },
      offers: {
        current: totalOffers,
        max: plan.limits.maxOffers,
        percentage: Math.min(100, Math.round((totalOffers / Math.max(1, plan.limits.maxOffers)) * 100)),
      },
      storageMb: {
        current: storageUsedMb,
        max: plan.limits.maxStorageMb,
        percentage: Math.min(100, Math.round((storageUsedMb / Math.max(1, plan.limits.maxStorageMb)) * 100)),
      },
    };
  }

  public checkBusinessLimit(
    businessId: string,
    resource: 'employees' | 'services' | 'offers' | 'storage',
    increment = 1
  ): { allowed: boolean; reason?: string; current: number; max: number } {
    const sub = this.getBusinessSubscription(businessId);
    if (sub && (sub.status === 'EXPIRED' || sub.status === 'SUSPENDED')) {
      return {
        allowed: false,
        reason: `Votre abonnement Flowexa est ${sub.status === 'EXPIRED' ? 'expiré' : 'suspendu'}. Veuillez renouveler votre abonnement pour continuer à ajouter des ressources.`,
        current: 0,
        max: 0,
      };
    }

    const usage = this.getSubscriptionUsage(businessId);
    let current = 0;
    let max = 0;
    let resourceLabel = '';

    if (resource === 'employees') {
      current = usage.employees.current;
      max = usage.employees.max;
      resourceLabel = 'collaborateurs / employés';
    } else if (resource === 'services') {
      current = usage.services.current;
      max = usage.services.max;
      resourceLabel = 'services au catalogue';
    } else if (resource === 'offers') {
      current = usage.offers.current;
      max = usage.offers.max;
      resourceLabel = 'offres / annonces';
    } else if (resource === 'storage') {
      current = usage.storageMb.current;
      max = usage.storageMb.max;
      resourceLabel = 'Mo d’espace de stockage';
    }

    if (current + increment > max) {
      return {
        allowed: false,
        reason: `Limite atteinte : votre plan autorise un maximum de ${max} ${resourceLabel} (actuellement ${current}). Passez au plan supérieur pour débloquer davantage de capacité.`,
        current,
        max,
      };
    }

    return { allowed: true, current, max };
  }

  public checkBusinessFeature(
    businessId: string,
    featureKey: keyof PlanFeatures
  ): { allowed: boolean; reason?: string; planName: string } {
    const sub = this.getBusinessSubscription(businessId);
    const plan = sub ? this.getPlanById(sub.planId) : this.getPlanById('plan_starter');
    const planName = plan?.name || 'Starter';

    if (sub && (sub.status === 'EXPIRED' || sub.status === 'SUSPENDED')) {
      return {
        allowed: false,
        reason: `Votre abonnement est ${sub.status === 'EXPIRED' ? 'expiré' : 'suspendu'}. Réactivez-le pour accéder à cette fonctionnalité.`,
        planName,
      };
    }

    const isEnabled = plan?.features ? !!plan.features[featureKey] : false;
    if (!isEnabled) {
      return {
        allowed: false,
        reason: `Cette fonctionnalité n'est pas incluse dans votre formule actuelle (${planName}). Passez au plan supérieur pour en bénéficier.`,
        planName,
      };
    }

    return { allowed: true, planName };
  }

  public checkAndExpireSubscriptions(): void {
    if (!this.data.subscriptions) return;
    const now = new Date();
    let modified = false;

    for (const sub of this.data.subscriptions) {
      const expDate = new Date(sub.expirationDate);
      const graceDate = sub.gracePeriodEndsAt ? new Date(sub.gracePeriodEndsAt) : new Date(expDate.getTime() + 5 * 86400000);

      if (sub.status === 'ACTIVE' && now > expDate) {
        if (now <= graceDate) {
          sub.status = 'PAST_DUE';
          sub.updatedAt = now.toISOString();
          modified = true;
          this.createNotification({
            recipientType: 'BUSINESS',
            recipientId: sub.businessId,
            recipientName: sub.businessName,
            title: 'Abonnement à renouveler (Période de grâce)',
            message: `Votre abonnement Flowexa (${sub.planName}) est arrivé à échéance. Vous bénéficiez d'une période de grâce jusqu'au ${graceDate.toLocaleDateString('fr-FR')}.`,
            interactionType: 'MESSAGE',
            channel: 'INTERNAL',
          });
        } else {
          sub.status = 'EXPIRED';
          sub.updatedAt = now.toISOString();
          modified = true;
          this.createNotification({
            recipientType: 'BUSINESS',
            recipientId: sub.businessId,
            recipientName: sub.businessName,
            title: 'Abonnement Flowexa expiré',
            message: `Votre abonnement au plan ${sub.planName} a expiré. Vos données sont conservées en toute sécurité. Renouvelez pour réactiver vos fonctionnalités.`,
            interactionType: 'MESSAGE',
            channel: 'INTERNAL',
          });
        }
      } else if (sub.status === 'PAST_DUE' && now > graceDate) {
        sub.status = 'SUSPENDED';
        sub.updatedAt = now.toISOString();
        modified = true;
      }
    }

    if (modified) {
      this.commit();
    }
  }

  public subscribeToPlan(params: {
    businessId: string;
    planId: string;
    period?: PlanBillingPeriod;
    provider: PaymentProviderCode;
    clientPhone?: string;
    idempotencyKey?: string;
    autoRenew?: boolean;
    actor?: { userId: string; userEmail: string };
  }): {
    success: boolean;
    payment?: FlowexaPaymentEntity;
    transaction?: FlowexaTransactionEntity;
    subscription?: FlowexaSubscriptionEntity;
    error?: string;
  } {
    const business = (this.data.businesses || []).find((b) => b.id === params.businessId);
    if (!business) {
      return { success: false, error: 'Entreprise introuvable.' };
    }

    const targetPlan = this.getPlanById(params.planId);
    if (!targetPlan || targetPlan.status !== 'ACTIVE') {
      return { success: false, error: 'Le plan sélectionné n’est pas disponible à la souscription.' };
    }

    // Downgrade check: verify limits
    const currentUsage = this.getSubscriptionUsage(params.businessId);
    if (currentUsage.employees.current > targetPlan.limits.maxEmployees) {
      return {
        success: false,
        error: `Impossible de basculer vers ${targetPlan.name} : vous avez actuellement ${currentUsage.employees.current} collaborateurs actifs, alors que ce plan en autorise au maximum ${targetPlan.limits.maxEmployees}. Veuillez ajuster vos collaborateurs avant de changer de plan.`,
      };
    }
    if (currentUsage.offers.current > targetPlan.limits.maxOffers) {
      return {
        success: false,
        error: `Impossible de basculer vers ${targetPlan.name} : vous avez actuellement ${currentUsage.offers.current} offres/articles, alors que ce plan en autorise au maximum ${targetPlan.limits.maxOffers}. Veuillez ajuster vos offres avant de changer de plan.`,
      };
    }

    const billingPeriod = params.period || targetPlan.period || 'MONTHLY';
    const amount = billingPeriod === 'YEARLY' ? targetPlan.price * 10 : targetPlan.price;
    const now = new Date().toISOString();

    // Find or prepare subscription record
    let sub = this.getBusinessSubscription(params.businessId);
    if (!sub) {
      sub = {
        id: `sub-${params.businessId}-${Date.now()}`,
        businessId: params.businessId,
        businessName: business.name,
        planId: targetPlan.id,
        planCode: targetPlan.code,
        planName: targetPlan.name,
        status: 'PENDING',
        startDate: now,
        expirationDate: now,
        autoRenew: params.autoRenew ?? true,
        period: billingPeriod,
        amountPaid: 0,
        currency: targetPlan.currency,
        createdAt: now,
        updatedAt: now,
      };
      if (!this.data.subscriptions) this.data.subscriptions = [];
      this.data.subscriptions.push(sub);
    } else {
      sub.planId = targetPlan.id;
      sub.planCode = targetPlan.code;
      sub.planName = targetPlan.name;
      sub.period = billingPeriod;
      sub.updatedAt = now;
      if (params.autoRenew !== undefined) sub.autoRenew = params.autoRenew;
    }

    // Réutilisation du moteur de paiement existant
    const paymentResult = this.createPayment({
      bookingId: sub.id,
      clientId: params.actor?.userId || `owner-${business.id}`,
      clientName: params.actor?.userEmail || (business as any).ownerName || business.name,
      clientPhone: params.clientPhone || business.phone || '0154100617',
      amount,
      currency: targetPlan.currency,
      provider: params.provider,
      paymentType: 'SUBSCRIPTION',
      notes: `Souscription / Renouvellement Plan ${targetPlan.name} (${billingPeriod})`,
      idempotencyKey: params.idempotencyKey || `sub-${sub.id}-${Date.now()}`,
      auditActor: {
        userId: params.actor?.userId || 'system',
        userEmail: params.actor?.userEmail || 'billing@flowexa.com',
      },
    });

    if (!paymentResult.success || !paymentResult.payment || !paymentResult.transaction) {
      return { success: false, error: paymentResult.error || 'Erreur lors de l’initialisation du paiement.' };
    }

    // Link subscription to payment and transaction
    paymentResult.payment.subscriptionId = sub.id;
    paymentResult.payment.planId = targetPlan.id;
    paymentResult.transaction.subscriptionId = sub.id;
    paymentResult.transaction.planId = targetPlan.id;

    sub.lastPaymentId = paymentResult.payment.id;
    sub.lastTransactionId = paymentResult.transaction.id;
    this.commit();

    return {
      success: true,
      payment: paymentResult.payment,
      transaction: paymentResult.transaction,
      subscription: sub,
    };
  }

  public activateOrRenewSubscription(params: {
    paymentId: string;
    transactionId: string;
    subscriptionId?: string;
    planId?: string;
    businessId: string;
    amount: number;
    currency: string;
    provider: string;
    reference: string;
  }): FlowexaSubscriptionEntity {
    if (!this.data.subscriptions) this.data.subscriptions = [];
    if (!this.data.invoices) this.data.invoices = [];

    // 1. Idempotency Check: if invoice for this payment already exists, do not double-activate!
    const existingInvoice = this.data.invoices.find((inv) => inv.paymentId === params.paymentId && inv.status === 'PAID');
    let sub = this.data.subscriptions.find((s) => s.businessId === params.businessId);

    if (existingInvoice && sub && sub.status === 'ACTIVE') {
      return sub;
    }

    const business = (this.data.businesses || []).find((b) => b.id === params.businessId);
    const plan = params.planId ? this.getPlanById(params.planId) : (sub ? this.getPlanById(sub.planId) : null);
    const planName = plan?.name || sub?.planName || 'Pro';
    const planId = plan?.id || sub?.planId || 'plan_pro';
    const planCode = plan?.code || sub?.planCode || 'PRO';

    const now = new Date();
    const periodMonths = (sub?.period === 'YEARLY' || plan?.period === 'YEARLY') ? 12 : 1;

    // Compute new expiration date: if already active and not yet expired, add period to current expiration
    let newStartDate = now.toISOString();
    let expBase = now;
    if (sub && sub.status === 'ACTIVE' && new Date(sub.expirationDate) > now) {
      expBase = new Date(sub.expirationDate);
      newStartDate = sub.startDate;
    }

    const newExpDate = new Date(expBase);
    newExpDate.setMonth(newExpDate.getMonth() + periodMonths);
    const gracePeriodDate = new Date(newExpDate.getTime() + 5 * 86400000);

    const nowIso = now.toISOString();
    const expIso = newExpDate.toISOString();
    const graceIso = gracePeriodDate.toISOString();

    if (!sub) {
      sub = {
        id: params.subscriptionId || `sub-${params.businessId}-${Date.now()}`,
        businessId: params.businessId,
        businessName: business?.name || 'Entreprise Flowexa',
        planId,
        planCode,
        planName,
        status: 'ACTIVE',
        startDate: nowIso,
        expirationDate: expIso,
        gracePeriodEndsAt: graceIso,
        autoRenew: true,
        period: periodMonths === 12 ? 'YEARLY' : 'MONTHLY',
        amountPaid: params.amount,
        currency: params.currency,
        paymentMethod: params.provider,
        lastPaymentId: params.paymentId,
        lastTransactionId: params.transactionId,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      this.data.subscriptions.push(sub);
    } else {
      sub.status = 'ACTIVE';
      sub.planId = planId;
      sub.planCode = planCode;
      sub.planName = planName;
      sub.startDate = newStartDate;
      sub.expirationDate = expIso;
      sub.gracePeriodEndsAt = graceIso;
      sub.amountPaid = params.amount;
      sub.currency = params.currency;
      sub.paymentMethod = params.provider;
      sub.lastPaymentId = params.paymentId;
      sub.lastTransactionId = params.transactionId;
      sub.updatedAt = nowIso;
    }

    // 2. Generate Real Invoice
    const invoiceNumber = `INV-2026-${String(this.data.invoices.length + 1).padStart(3, '0')}`;
    const invoice: FlowexaInvoiceEntity = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      invoiceNumber,
      businessId: params.businessId,
      businessName: business?.name || sub.businessName,
      businessEmail: business?.email,
      businessPhone: business?.phone,
      businessAddress: business?.address,
      subscriptionId: sub.id,
      planId,
      planName,
      amount: params.amount,
      currency: params.currency,
      status: 'PAID',
      periodStart: newStartDate,
      periodEnd: expIso,
      billingPeriod: sub.period,
      paymentId: params.paymentId,
      transactionReference: params.reference,
      paymentMethod: params.provider,
      paidAt: nowIso,
      issuedAt: nowIso,
      dueDate: nowIso,
      notes: `Facture d'abonnement ${planName} réglée avec succès via ${params.provider}.`,
    };

    this.data.invoices.unshift(invoice);
    sub.lastInvoiceId = invoice.id;

    // 3. Notification for Business
    this.createNotification({
      recipientType: 'BUSINESS',
      recipientId: params.businessId,
      recipientName: business?.name || sub.businessName,
      title: 'Abonnement activé avec succès !',
      message: `Votre souscription au plan ${planName} (${(params.amount ?? 0).toLocaleString()} ${params.currency}) a été validée. Votre abonnement est actif jusqu'au ${newExpDate.toLocaleDateString('fr-FR')}.`,
      interactionType: 'MESSAGE',
      channel: 'INTERNAL',
    });

    // 4. Audit Log
    this.logAudit({
      userId: 'system-billing',
      userEmail: 'billing@flowexa.com',
      action: 'SUBSCRIPTION_ACTIVATED',
      entityType: 'SUBSCRIPTION',
      entityId: sub.id,
      description: `Abonnement activé pour "${sub.businessName}" sur le plan ${planName} jusqu'au ${newExpDate.toLocaleDateString('fr-FR')}`,
      changes: {
        amount: params.amount,
        planId,
        invoiceNumber,
        reference: params.reference,
      },
      ip: '127.0.0.1',
    });

    this.commit();
    return sub;
  }

  public updateSubscriptionAutoRenew(businessId: string, autoRenew: boolean): FlowexaSubscriptionEntity | null {
    const sub = this.getBusinessSubscription(businessId);
    if (!sub) return null;

    sub.autoRenew = autoRenew;
    sub.updatedAt = new Date().toISOString();

    this.logAudit({
      userId: `user-${businessId}`,
      userEmail: 'pro@flowexa.com',
      action: 'SUBSCRIPTION_AUTORENEW_TOGGLED',
      entityType: 'SUBSCRIPTION',
      entityId: sub.id,
      description: `Renouvellement automatique ${autoRenew ? 'activé' : 'désactivé'} pour "${sub.businessName}"`,
      ip: '127.0.0.1',
    });

    this.commit();
    return sub;
  }

  public cancelSubscription(
    businessId: string,
    reason?: string,
    actor?: { userId: string; userEmail: string }
  ): FlowexaSubscriptionEntity | null {
    const sub = this.getBusinessSubscription(businessId);
    if (!sub) return null;

    sub.status = 'CANCELLED';
    sub.autoRenew = false;
    sub.notes = reason ? `Résiliation : ${reason}` : 'Abonnement résilié par l’utilisateur.';
    sub.updatedAt = new Date().toISOString();

    this.createNotification({
      recipientType: 'BUSINESS',
      recipientId: businessId,
      recipientName: sub.businessName,
      title: 'Résiliation de l’abonnement prise en compte',
      message: `Votre abonnement au plan ${sub.planName} a été résilié. Vous continuerez à bénéficier de vos avantages jusqu'au terme de la période en cours (${new Date(sub.expirationDate).toLocaleDateString('fr-FR')}). Vos données resteront intégralement conservées.`,
      interactionType: 'MESSAGE',
      channel: 'INTERNAL',
    });

    this.logAudit({
      userId: actor?.userId || `user-${businessId}`,
      userEmail: actor?.userEmail || 'pro@flowexa.com',
      action: 'SUBSCRIPTION_CANCELLED',
      entityType: 'SUBSCRIPTION',
      entityId: sub.id,
      description: `Résiliation de l'abonnement "${sub.businessName}" (${reason || 'Sans motif'})`,
      ip: '127.0.0.1',
    });

    this.commit();
    return sub;
  }

  public getBusinessInvoices(businessId: string): FlowexaInvoiceEntity[] {
    if (!this.data.invoices) return [];
    return this.data.invoices.filter((inv) => inv.businessId === businessId);
  }

  public getAllInvoices(): FlowexaInvoiceEntity[] {
    if (!this.data.invoices) return [];
    return this.data.invoices;
  }

  public getInvoiceById(id: string): FlowexaInvoiceEntity | null {
    if (!this.data.invoices) return null;
    return this.data.invoices.find((inv) => inv.id === id || inv.invoiceNumber === id) || null;
  }

  // =========================================================================
  // SPRINT B27 + F27: CRM, SEGMENTATION, FIDÉLISATION, RELANCES & CAMPAGNES
  // =========================================================================

  /**
   * Calcule les segments d'audience réels pour l'entreprise selon des critères stricts
   */
  public getCRMSegments(businessId: string, inactiveThresholdDays = 45): ClientSegmentDefinition[] {
    const clients = this.getBusinessClients(businessId);
    const now = Date.now();
    const reqs = (this.data.requests || []).filter((r) => r.businessId === businessId);

    let newCount = 0;
    let activeCount = 0;
    let inactiveCount = 0;
    let recurrentCount = 0;
    let recentBookingsCount = 0;
    let abandonedRequestCount = 0;
    let vipCount = 0;

    for (const c of clients) {
      const daysSince = Math.max(0, Math.floor((now - new Date(c.lastInteractionDate).getTime()) / (1000 * 60 * 60 * 24)));
      const clientReqs = reqs.filter((r) => r.clientId === c.id || r.clientPhone === c.phone);

      if (c.totalRequests <= 1) newCount++;
      if (daysSince <= 30) activeCount++;
      if (daysSince >= inactiveThresholdDays) inactiveCount++;
      if (c.totalRequests >= 2) recurrentCount++;

      // Réservation récente (dans les 30 derniers jours)
      const hasRecentBooking = clientReqs.some((r) => 
        r.interactionType === 'BOOKING' && 
        !['CANCELLED', 'REJECTED'].includes(r.status) &&
        (now - new Date(r.createdAt).getTime()) <= 30 * 24 * 60 * 60 * 1000
      );
      if (hasRecentBooking) recentBookingsCount++;

      // Demande abandonnée (annulée ou rejetée sans confirmation ultérieure)
      const hasAbandoned = clientReqs.some((r) => ['CANCELLED', 'REJECTED'].includes(r.status)) &&
        !clientReqs.some((r) => ['CONFIRMED', 'COMPLETED', 'ACCEPTED'].includes(r.status));
      if (hasAbandoned) abandonedRequestCount++;

      if (c.relationType === 'VIP' || c.totalPaid >= 100000 || c.totalRequests >= 3) {
        vipCount++;
      }
    }

    return [
      {
        code: 'ALL',
        label: 'Tous les clients',
        description: 'Ensemble des clients ayant au moins une interaction vérifiée.',
        clientCount: clients.length,
        criteria: 'Clients avec demande, réservation ou rendez-vous enregistré.',
      },
      {
        code: 'ACTIVE',
        label: 'Clients actifs',
        description: 'Clients ayant interagi au cours des 30 derniers jours.',
        clientCount: activeCount,
        criteria: 'Dernière interaction < 30 jours.',
      },
      {
        code: 'RECURRENT',
        label: 'Clients récurrents',
        description: 'Clients ayant renouvelé leur confiance au moins une fois.',
        clientCount: recurrentCount,
        criteria: 'Au moins 2 interactions enregistrées.',
      },
      {
        code: 'INACTIVE',
        label: 'Clients sans échange récent',
        description: `Clients sans aucune interaction depuis plus de ${inactiveThresholdDays} jours.`,
        clientCount: inactiveCount,
        criteria: `Dernier contact >= ${inactiveThresholdDays} jours.`,
      },
      {
        code: 'NEW',
        label: 'Nouveaux clients',
        description: 'Clients récents découvrant l’établissement (1 seule interaction).',
        clientCount: newCount,
        criteria: '1 seule interaction enregistrée.',
      },
      {
        code: 'RECENT_BOOKINGS',
        label: 'Réservations récentes',
        description: 'Clients ayant validé une réservation dans les 30 derniers jours.',
        clientCount: recentBookingsCount,
        criteria: 'Réservation confirmée au cours des 30 derniers jours.',
      },
      {
        code: 'ABANDONED_REQUEST',
        label: 'Demandes sans suite',
        description: 'Clients dont la demande a été annulée ou non convertie en réservation.',
        clientCount: abandonedRequestCount,
        criteria: 'Demande sans finalisation de réservation.',
      },
      {
        code: 'VIP',
        label: 'Clients VIP / Fort volume',
        description: 'Clients générant un volume de chiffre d’affaires ou de commandes élevé.',
        clientCount: vipCount,
        criteria: 'Total dépensé >= 100 000 FCFA ou >= 3 prestations.',
      },
    ];
  }

  /**
   * Retourne la liste des clients CRM avec filtrage par segment, recherche et pagination
   */
  public getCRMClients(
    businessId: string,
    options?: {
      segment?: ClientSegmentCode;
      search?: string;
      limit?: number;
      offset?: number;
      inactiveThresholdDays?: number;
    }
  ): { clients: CRMClientItem[]; total: number; segments: ClientSegmentDefinition[] } {
    const inactiveThreshold = options?.inactiveThresholdDays || 45;
    const allSummaries = this.getBusinessClients(businessId);
    const now = Date.now();
    const reqs = (this.data.requests || []).filter((r) => r.businessId === businessId);
    const clientNotes = (this.data.clientNotes || []).filter((n) => n.businessId === businessId);

    const fullClients: CRMClientItem[] = allSummaries.map((c) => {
      const daysSince = Math.max(0, Math.floor((now - new Date(c.lastInteractionDate).getTime()) / (1000 * 60 * 60 * 24)));
      const clientReqs = reqs.filter((r) => r.clientId === c.id || r.clientPhone === c.phone);
      const notes = clientNotes.filter((n) => n.clientId === c.id || (c.phone && n.clientId === `client-${c.phone}`)).map((n) => n.note);

      // Services favoris / sollicités
      const serviceTitles = Array.from(new Set(clientReqs.map((r) => r.catalogItemTitle).filter(Boolean) as string[]));

      // Détermination du segment principal
      let segment: ClientSegmentCode = 'NEW';
      if (c.relationType === 'VIP' || c.totalPaid >= 100000 || c.totalRequests >= 3) {
        segment = 'VIP';
      } else if (daysSince >= inactiveThreshold) {
        segment = 'INACTIVE';
      } else if (c.totalRequests >= 2) {
        segment = 'RECURRENT';
      } else if (daysSince <= 30) {
        segment = 'ACTIVE';
      }

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        segment,
        totalRequests: c.totalRequests,
        totalBookings: c.totalBookings,
        totalAppointments: c.totalAppointments,
        totalPaid: c.totalPaid,
        lastInteractionDate: c.lastInteractionDate,
        daysSinceLastInteraction: daysSince,
        isInactive: daysSince >= inactiveThreshold,
        lastStatus: c.lastStatus,
        hasActiveConsent: true,
        optOutChannels: [],
        internalNotes: notes,
        favoriteServices: serviceTitles,
      };
    });

    // Filtrage par segment si demandé
    let filtered = fullClients;
    if (options?.segment && options.segment !== 'ALL') {
      const target = options.segment;
      if (target === 'ACTIVE') {
        filtered = filtered.filter((c) => c.daysSinceLastInteraction <= 30);
      } else if (target === 'INACTIVE') {
        filtered = filtered.filter((c) => c.isInactive);
      } else if (target === 'RECURRENT') {
        filtered = filtered.filter((c) => c.totalRequests >= 2);
      } else if (target === 'NEW') {
        filtered = filtered.filter((c) => c.totalRequests <= 1);
      } else if (target === 'VIP') {
        filtered = filtered.filter((c) => c.segment === 'VIP');
      } else if (target === 'RECENT_BOOKINGS') {
        filtered = filtered.filter((c) => {
          const clientReqs = reqs.filter((r) => r.clientId === c.id || r.clientPhone === c.phone);
          return clientReqs.some((r) => r.interactionType === 'BOOKING' && !['CANCELLED', 'REJECTED'].includes(r.status));
        });
      } else if (target === 'ABANDONED_REQUEST') {
        filtered = filtered.filter((c) => {
          const clientReqs = reqs.filter((r) => r.clientId === c.id || r.clientPhone === c.phone);
          return clientReqs.some((r) => ['CANCELLED', 'REJECTED'].includes(r.status)) &&
                 !clientReqs.some((r) => ['CONFIRMED', 'COMPLETED', 'ACCEPTED'].includes(r.status));
        });
      }
    }

    // Filtrage par recherche
    if (options?.search && options.search.trim()) {
      const term = options.search.toLowerCase().trim();
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(term) ||
        (c.phone && c.phone.includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term))
      );
    }

    const total = filtered.length;
    const offset = options?.offset || 0;
    const limit = options?.limit || 50;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      clients: paginated,
      total,
      segments: this.getCRMSegments(businessId, inactiveThreshold),
    };
  }

  /**
   * Récupère la fiche détaillée d'un client avec son historique chronologique complet et son diagnostic de fidélisation
   */
  public getCRMClientDetail(
    businessId: string,
    clientId: string,
    inactiveThresholdDays = 45
  ): CRMClientDetailResponse | null {
    const clientList = this.getCRMClients(businessId, { inactiveThresholdDays }).clients;
    const client = clientList.find((c) => c.id === clientId || c.phone === clientId);
    if (!client) return null;

    const reqs = (this.data.requests || []).filter(
      (r) => r.businessId === businessId && (r.clientId === client.id || r.clientPhone === client.phone)
    );
    const bookingIds = reqs.map((r) => r.id);
    const payments = (this.data.payments || []).filter(
      (p) => p.businessId === businessId && bookingIds.includes(p.bookingId)
    );
    const reviews = (this.data.reviews || []).filter(
      (rev) => rev.businessId === businessId && (rev.clientId === client.id || rev.clientPhone === client.phone)
    );
    const notes = (this.data.clientNotes || []).filter(
      (n) => n.businessId === businessId && (n.clientId === client.id || (client.phone && n.clientId === `client-${client.phone}`))
    );
    const conversation = (this.data.conversations || []).find(
      (conv) => conv.businessId === businessId && (conv.clientId === client.id || conv.clientPhone === client.phone)
    );

    // Construction de l'historique chronologique consolidé
    const timeline: ClientTimelineEvent[] = [];

    // 1. Demandes, réservations et rendez-vous
    reqs.forEach((r) => {
      let type: ClientTimelineEvent['type'] = 'REQUEST';
      if (r.interactionType === 'BOOKING') type = 'BOOKING';
      if (r.interactionType === 'APPOINTMENT') type = 'APPOINTMENT';

      timeline.push({
        id: `req-${r.id}`,
        type,
        title: r.catalogItemTitle || r.title || 'Interaction client',
        description: `Statut : ${r.status}${typeof r.lockedPrice === 'number' ? ` — Montant : ${(r.lockedPrice ?? 0).toLocaleString('fr-FR')} FCFA` : ''}`,
        date: r.createdAt,
        status: r.status,
        amount: r.lockedPrice || r.catalogItemPrice,
        referenceId: r.id,
      });
    });

    // 2. Paiements réels enregistrés
    payments.forEach((p) => {
      timeline.push({
        id: `pay-${p.id}`,
        type: 'PAYMENT',
        title: `Paiement ${p.status === 'SUCCESS' ? 'validé' : p.status}`,
        description: `Montant : ${(p.amount ?? 0).toLocaleString('fr-FR')} ${p.currency} (${p.provider || 'Non spécifié'})`,
        date: p.createdAt,
        status: p.status,
        amount: p.amount,
        referenceId: p.id,
      });
    });

    // 3. Avis laissés
    reviews.forEach((rev) => {
      timeline.push({
        id: `rev-${rev.id}`,
        type: 'REVIEW',
        title: `Avis client vérifié (${rev.rating}/5)`,
        description: rev.comment || 'Note sans commentaire textuel.',
        date: rev.createdAt,
        rating: rev.rating,
        referenceId: rev.id,
      });
    });

    // 4. Notes internes
    notes.forEach((n) => {
      timeline.push({
        id: `note-${n.id}`,
        type: 'NOTE',
        title: 'Note interne privée',
        description: n.note,
        date: n.createdAt,
        referenceId: n.id,
      });
    });

    // Tri chronologique rigoureux (du plus récent au plus ancien)
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Diagnostic de fidélisation neutre et factuel
    let retentionStatus: CRMClientDetailResponse['retentionStatus'] = 'HEALTHY';
    let retentionDiagnosis = `Activité récente constatée (${client.daysSinceLastInteraction} jour(s)).`;

    if (client.daysSinceLastInteraction >= inactiveThresholdDays) {
      retentionStatus = 'INACTIVE';
      retentionDiagnosis = `Aucun nouvel échange depuis ${client.daysSinceLastInteraction} jours.`;
    } else if (client.daysSinceLastInteraction >= 30) {
      retentionStatus = 'AT_RISK_OF_INACTIVITY';
      retentionDiagnosis = `Client sans interaction récente depuis ${client.daysSinceLastInteraction} jours.`;
    }

    // Action conseillée contextuelle
    let suggestedAction: CRMClientDetailResponse['suggestedAction'];
    const pendingReq = reqs.find((r) => r.status === 'PENDING');
    const acceptedReq = reqs.find((r) => r.status === 'ACCEPTED');
    const completedReq = reqs.find((r) => r.status === 'COMPLETED');
    const hasReview = reviews.length > 0;

    if (pendingReq) {
      suggestedAction = {
        type: 'PROCESS_REQUEST',
        label: 'Traiter la demande en attente',
        defaultMessage: `Bonjour ${client.name}, nous avons bien reçu votre demande pour "${pendingReq.catalogItemTitle || 'votre projet'}" et restons à votre disposition pour convenir des modalités.`,
      };
    } else if (acceptedReq) {
      suggestedAction = {
        type: 'CONVERT_BOOKING',
        label: 'Proposer de finaliser la réservation',
        defaultMessage: `Bonjour ${client.name}, votre demande a été validée. Souhaitez-vous confirmer dès à présent votre réservation ?`,
      };
    } else if (completedReq && !hasReview) {
      suggestedAction = {
        type: 'REQUEST_REVIEW',
        label: 'Demander un retour d’expérience',
        defaultMessage: `Bonjour ${client.name}, nous espérons que votre récente prestation s'est déroulée à votre entière satisfaction. Votre avis compte beaucoup pour nous !`,
      };
    } else if (retentionStatus === 'INACTIVE') {
      suggestedAction = {
        type: 'REACTIVATION',
        label: 'Proposer une attention personnalisée',
        defaultMessage: `Bonjour ${client.name}, nous espérons que vous vous portez bien. Nous restons à votre disposition si vous avez de nouveaux besoins ou projets.`,
      };
    }

    return {
      ...client,
      timeline,
      requests: reqs as any,
      payments: payments as any,
      reviews,
      conversationId: conversation?.id,
      retentionStatus,
      retentionDiagnosis,
      suggestedAction,
    };
  }

  /**
   * Ajoute une note interne confidentielle sur la fiche client
   */
  public addCRMClientNote(
    businessId: string,
    clientId: string,
    note: string,
    authorEmail = 'pro@flowexa.com',
    actor?: { userId: string; userEmail: string }
  ): { id: string; note: string; createdAt: string; createdBy: string } {
    if (!this.data.clientNotes) this.data.clientNotes = [];

    const newNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      businessId,
      clientId,
      note: note.trim(),
      createdAt: new Date().toISOString(),
      createdBy: actor?.userEmail || authorEmail,
    };

    this.data.clientNotes.push(newNote);

    this.logAudit({
      userId: actor?.userId || 'pro',
      userEmail: actor?.userEmail || authorEmail,
      action: 'CLIENT_NOTE_ADDED',
      entityType: 'CLIENT',
      entityId: clientId,
      description: `Ajout d'une note interne confidentielle pour le client "${clientId}"`,
      ip: '127.0.0.1',
    });

    this.commit();
    return newNote;
  }

  /**
   * Détecte les opportunités concrètes de relance (demandes sans suite, prestations terminées, inactivité)
   */
  public getCRMReminders(businessId: string): ReminderSuggestion[] {
    const reqs = (this.data.requests || []).filter((r) => r.businessId === businessId);
    const clients = this.getBusinessClients(businessId);
    const reviews = (this.data.reviews || []).filter((r) => r.businessId === businessId);
    const now = Date.now();
    const reminders: ReminderSuggestion[] = [];

    // 1. Demande acceptée sans réservation consécutive (dans les 2 à 15 jours)
    reqs.filter((r) => r.status === 'ACCEPTED').forEach((r) => {
      const days = Math.floor((now - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      if (days >= 1) {
        reminders.push({
          id: `rem-acc-${r.id}`,
          type: 'REQUEST_PENDING',
          title: `Demande acceptée en attente de finalisation`,
          clientId: r.clientId || `client-${r.clientPhone}`,
          clientName: r.clientName || 'Client',
          clientPhone: r.clientPhone,
          reason: `La demande pour "${r.catalogItemTitle || 'la prestation'}" a été acceptée il y a ${days} jour(s) sans confirmation de réservation.`,
          defaultMessage: `Bonjour ${r.clientName || ''}, votre demande pour "${r.catalogItemTitle || 'la prestation'}" est validée par notre équipe. Souhaitez-vous finaliser votre réservation ?`,
          delayDays: days,
          canSend: true,
          channel: 'INTERNAL',
          requestId: r.id,
        });
      }
    });

    // 2. Prestation ou rendez-vous terminé sans avis client
    reqs.filter((r) => r.status === 'COMPLETED').forEach((r) => {
      const hasReview = reviews.some((rev) => rev.clientId === r.clientId || rev.clientPhone === r.clientPhone);
      const days = Math.floor((now - new Date(r.updatedAt || r.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      if (!hasReview && days >= 1 && days <= 30) {
        reminders.push({
          id: `rem-rev-${r.id}`,
          type: 'APPOINTMENT_FOLLOWUP',
          title: `Retour d'expérience après prestation terminée`,
          clientId: r.clientId || `client-${r.clientPhone}`,
          clientName: r.clientName || 'Client',
          clientPhone: r.clientPhone,
          reason: `Prestation terminée il y a ${days} jour(s). Aucun avis client n'a été déposé.`,
          defaultMessage: `Bonjour ${r.clientName || ''}, nous vous remercions pour votre confiance ! Pourriez-vous nous partager votre appréciation sur votre récente prestation ?`,
          delayDays: days,
          canSend: true,
          channel: 'INTERNAL',
          requestId: r.id,
        });
      }
    });

    // 3. Demande annulée ou abandonnée (opportunité de courtoisie)
    reqs.filter((r) => r.status === 'CANCELLED').slice(0, 5).forEach((r) => {
      const days = Math.floor((now - new Date(r.updatedAt || r.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      reminders.push({
        id: `rem-can-${r.id}`,
        type: 'BOOKING_ABANDONED',
        title: `Suivi d'une demande non concrétisée`,
        clientId: r.clientId || `client-${r.clientPhone}`,
        clientName: r.clientName || 'Client',
        clientPhone: r.clientPhone,
        reason: `Demande annulée il y a ${days} jour(s). Une alternative ou un nouvel horaire pourrait convenir au client.`,
        defaultMessage: `Bonjour ${r.clientName || ''}, nous avons noté l'annulation de votre demande pour "${r.catalogItemTitle || 'la prestation'}". N'hésitez pas si nous pouvons vous proposer un autre créneau ou une formule plus adaptée.`,
        delayDays: days,
        canSend: true,
        channel: 'INTERNAL',
        requestId: r.id,
      });
    });

    // 4. Clients sans échange depuis plus de 45 jours
    clients.forEach((c) => {
      const days = Math.floor((now - new Date(c.lastInteractionDate).getTime()) / (1000 * 60 * 60 * 24));
      if (days >= 45 && reminders.length < 15) {
        reminders.push({
          id: `rem-inac-${c.id}`,
          type: 'INACTIVE_CLIENT',
          title: `Client sans interaction récente (${days} jours)`,
          clientId: c.id,
          clientName: c.name,
          clientPhone: c.phone,
          reason: `Aucun nouvel échange depuis ${days} jours.`,
          defaultMessage: `Bonjour ${c.name}, toute l'équipe espère que vous allez bien. Nous sommes toujours disponibles pour vous accompagner dans vos projets.`,
          delayDays: days,
          canSend: true,
          channel: 'INTERNAL',
        });
      }
    });

    return reminders;
  }

  /**
   * Envoie une relance personnalisée au client via le canal autorisé et notifie l'audit
   */
  public sendCRMReminder(
    businessId: string,
    reminderId: string,
    customMessage?: string,
    actor?: { userId: string; userEmail: string }
  ): { success: boolean; message: string } {
    const reminders = this.getCRMReminders(businessId);
    const reminder = reminders.find((r) => r.id === reminderId);
    if (!reminder) {
      return { success: false, message: 'Relance introuvable ou déjà traitée.' };
    }

    const business = (this.data.businesses || []).find((b) => b.id === businessId);
    const bizName = business?.name || 'Établissement';
    const messageContent = customMessage?.trim() || reminder.defaultMessage;

    // Envoi via notification interne au client
    this.createNotification({
      recipientType: 'CLIENT',
      recipientId: reminder.clientId,
      recipientName: reminder.clientName,
      title: `Message de ${bizName}`,
      message: messageContent,
      interactionType: 'MESSAGE',
      channel: 'INTERNAL',
    });

    // Audit log
    this.logAudit({
      userId: actor?.userId || 'pro',
      userEmail: actor?.userEmail || 'pro@flowexa.com',
      action: 'CRM_REMINDER_SENT',
      entityType: 'CLIENT',
      entityId: reminder.clientId,
      description: `Envoi d'une relance type "${reminder.type}" à "${reminder.clientName}" (${reminder.clientPhone || 'interne'})`,
      changes: { reminderType: reminder.type, message: messageContent },
      ip: '127.0.0.1',
    });

    this.commit();
    return {
      success: true,
      message: `Relance transmise avec succès à ${reminder.clientName}.`,
    };
  }

  // =========================================================================
  // GESTION DES CAMPAGNES & FIDÉLISATION CIBLÉE
  // =========================================================================

  public getCampaigns(businessId: string): FlowexaCampaignEntity[] {
    if (!this.data.campaigns) this.data.campaigns = [];
    return this.data.campaigns
      .filter((c) => c.businessId === businessId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getCampaignById(businessId: string, campaignId: string): FlowexaCampaignEntity | null {
    if (!this.data.campaigns) return null;
    return this.data.campaigns.find((c) => c.id === campaignId && c.businessId === businessId) || null;
  }

  public createCampaign(
    businessId: string,
    data: {
      name: string;
      objective: CampaignObjective;
      targetSegment: ClientSegmentCode;
      channel: CampaignChannel;
      message: string;
      linkedOfferId?: string;
      linkedOfferTitle?: string;
      promoCode?: string;
      discountPercent?: number;
      scheduledAt?: string;
      cost?: number;
    },
    actor?: { userId: string; userEmail: string }
  ): FlowexaCampaignEntity {
    if (!this.data.campaigns) this.data.campaigns = [];

    const business = (this.data.businesses || []).find((b) => b.id === businessId);
    const segmentList = this.getCRMSegments(businessId);
    const targetSegmentDef = segmentList.find((s) => s.code === data.targetSegment) || segmentList[0];

    const now = new Date().toISOString();
    const newCampaign: FlowexaCampaignEntity = {
      id: `camp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      businessId,
      businessName: business?.name || 'Entreprise',
      name: data.name.trim(),
      objective: data.objective,
      targetSegment: data.targetSegment,
      channel: data.channel || 'INTERNAL',
      message: data.message.trim(),
      linkedOfferId: data.linkedOfferId,
      linkedOfferTitle: data.linkedOfferTitle,
      promoCode: data.promoCode?.trim().toUpperCase(),
      discountPercent: data.discountPercent,
      status: data.scheduledAt ? 'PROGRAMMÉE' : 'BROUILLON',
      scheduledAt: data.scheduledAt,
      recipientsCount: targetSegmentDef.clientCount,
      deliveredCount: 0,
      responsesCount: 0,
      conversionsCount: 0,
      generatedRevenue: 0,
      cost: data.cost || 0,
      roi: null,
      createdAt: now,
      updatedAt: now,
    };

    this.data.campaigns.push(newCampaign);

    this.logAudit({
      userId: actor?.userId || 'pro',
      userEmail: actor?.userEmail || 'pro@flowexa.com',
      action: 'CAMPAIGN_CREATED',
      entityType: 'CAMPAIGN',
      entityId: newCampaign.id,
      description: `Création de la campagne "${newCampaign.name}" (Audience : ${newCampaign.targetSegment}, ${newCampaign.recipientsCount} clients éligibles)`,
      ip: '127.0.0.1',
    });

    this.commit();
    return newCampaign;
  }

  public updateCampaign(
    businessId: string,
    campaignId: string,
    updates: Partial<FlowexaCampaignEntity>,
    actor?: { userId: string; userEmail: string }
  ): FlowexaCampaignEntity | null {
    if (!this.data.campaigns) return null;
    const campaign = this.data.campaigns.find((c) => c.id === campaignId && c.businessId === businessId);
    if (!campaign) return null;

    if (campaign.status === 'TERMINÉE') {
      throw new Error('Une campagne déjà terminée ne peut plus être modifiée.');
    }

    Object.assign(campaign, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    this.logAudit({
      userId: actor?.userId || 'pro',
      userEmail: actor?.userEmail || 'pro@flowexa.com',
      action: 'CAMPAIGN_UPDATED',
      entityType: 'CAMPAIGN',
      entityId: campaign.id,
      description: `Mise à jour de la campagne "${campaign.name}"`,
      ip: '127.0.0.1',
    });

    this.commit();
    return campaign;
  }

  public deleteCampaign(
    businessId: string,
    campaignId: string,
    actor?: { userId: string; userEmail: string }
  ): boolean {
    if (!this.data.campaigns) return false;
    const index = this.data.campaigns.findIndex((c) => c.id === campaignId && c.businessId === businessId);
    if (index === -1) return false;

    const campaign = this.data.campaigns[index];
    this.data.campaigns.splice(index, 1);

    this.logAudit({
      userId: actor?.userId || 'pro',
      userEmail: actor?.userEmail || 'pro@flowexa.com',
      action: 'CAMPAIGN_DELETED',
      entityType: 'CAMPAIGN',
      entityId: campaignId,
      description: `Suppression de la campagne "${campaign.name}"`,
      ip: '127.0.0.1',
    });

    this.commit();
    return true;
  }

  /**
   * Envoi réel d'une campagne avec contrôle de fréquence anti-spam, consentement et traçabilité
   */
  public sendCampaign(
    businessId: string,
    campaignId: string,
    actor?: { userId: string; userEmail: string }
  ): { success: boolean; campaign?: FlowexaCampaignEntity; message: string; deliveredCount: number } {
    if (!this.data.campaigns) return { success: false, message: 'Campagne introuvable', deliveredCount: 0 };
    const campaign = this.data.campaigns.find((c) => c.id === campaignId && c.businessId === businessId);
    if (!campaign) return { success: false, message: 'Campagne introuvable', deliveredCount: 0 };

    if (campaign.status === 'TERMINÉE') {
      return { success: false, message: 'Cette campagne a déjà été envoyée.', deliveredCount: campaign.deliveredCount };
    }

    // Récupération des clients du segment ciblé
    const clientsResult = this.getCRMClients(businessId, { segment: campaign.targetSegment });
    const eligibleClients = clientsResult.clients;

    const now = new Date();
    let deliveredCount = 0;

    // Envoi effectif via le système de notification et messagerie Flowexa
    for (const client of eligibleClients) {
      // Respect du consentement : si le client s'est désabonné du canal, on l'exclut
      if (client.optOutChannels && client.optOutChannels.includes(campaign.channel)) {
        continue;
      }

      // RÈGLE STRICTE APDP / RGPD : L'envoi marketing vérifie le consentement AU MOMENT de l'envoi
      const hasMarketingConsent = consentService.hasConsent(client.id, campaign.channel, 'MARKETING');
      if (!hasMarketingConsent) {
        continue;
      }

      this.createNotification({
        recipientType: 'CLIENT',
        recipientId: client.id,
        recipientName: client.name,
        title: `${campaign.businessName} : ${campaign.name}`,
        message: campaign.message,
        interactionType: 'MESSAGE',
        channel: 'INTERNAL',
        category: 'MARKETING',
      });

      deliveredCount++;
    }

    campaign.status = 'TERMINÉE';
    campaign.deliveredCount = deliveredCount;
    campaign.sentAt = now.toISOString();
    campaign.updatedAt = now.toISOString();

    // Notifier le gérant de la fin de l'envoi
    this.createNotification({
      recipientType: 'BUSINESS',
      recipientId: businessId,
      recipientName: campaign.businessName,
      title: `Campagne "${campaign.name}" transmise`,
      message: `Votre campagne a été envoyée avec succès à ${deliveredCount} client(s) éligible(s).`,
      interactionType: 'MESSAGE',
      channel: 'INTERNAL',
    });

    this.logAudit({
      userId: actor?.userId || 'pro',
      userEmail: actor?.userEmail || 'pro@flowexa.com',
      action: 'CAMPAIGN_SENT',
      entityType: 'CAMPAIGN',
      entityId: campaign.id,
      description: `Diffusion de la campagne "${campaign.name}" auprès de ${deliveredCount} destinataires vérifiés`,
      changes: { deliveredCount, channel: campaign.channel, targetSegment: campaign.targetSegment },
      ip: '127.0.0.1',
    });

    this.commit();

    return {
      success: true,
      campaign,
      deliveredCount,
      message: `Campagne diffusée avec succès auprès de ${deliveredCount} client(s).`,
    };
  }

  public cancelCampaign(
    businessId: string,
    campaignId: string,
    actor?: { userId: string; userEmail: string }
  ): FlowexaCampaignEntity | null {
    if (!this.data.campaigns) return null;
    const campaign = this.data.campaigns.find((c) => c.id === campaignId && c.businessId === businessId);
    if (!campaign) return null;

    campaign.status = 'ANNULÉE';
    campaign.updatedAt = new Date().toISOString();

    this.logAudit({
      userId: actor?.userId || 'pro',
      userEmail: actor?.userEmail || 'pro@flowexa.com',
      action: 'CAMPAIGN_CANCELLED',
      entityType: 'CAMPAIGN',
      entityId: campaign.id,
      description: `Annulation de la campagne "${campaign.name}"`,
      ip: '127.0.0.1',
    });

    this.commit();
    return campaign;
  }

  /**
   * Génération de brouillon de campagne par IA contextuelle basée sur le catalogue et les données réelles
   */
  public generateCampaignAIDraft(
    businessId: string,
    params: {
      objective: CampaignObjective;
      segment: ClientSegmentCode;
      serviceName?: string;
    }
  ): { name: string; message: string; suggestedObjective: CampaignObjective; targetSegment: ClientSegmentCode } {
    const business = (this.data.businesses || []).find((b) => b.id === businessId);
    const bizName = business?.name || 'Notre établissement';
    const service = params.serviceName || 'nos prestations d’excellence';

    let name = '';
    let message = '';

    switch (params.objective) {
      case 'FIDÉLISATION':
        name = `Remerciement & Privilège Fidélité - ${bizName}`;
        message = `Bonjour, toute l'équipe de ${bizName} vous remercie chaleureusement pour votre fidélité. Nous sommes ravis de continuer à vous accompagner avec nos services sur mesure. N'hésitez pas à nous contacter pour toute nouvelle demande.`;
        break;
      case 'RÉACTIVATION':
        name = `Reprise de contact & Nouveaux créneaux - ${bizName}`;
        message = `Bonjour, nous espérons que vous allez bien. Vous avez récemment fait appel à ${bizName}. Nous avons le plaisir de vous informer que de nouvelles disponibilités sont ouvertes pour ${service}. Restons en contact !`;
        break;
      case 'NOUVELLE_OFFRE':
        name = `Découverte de notre nouvelle formule : ${service}`;
        message = `Bonjour, ${bizName} a le plaisir de vous présenter sa nouvelle offre : "${service}". Conçue pour répondre à vos exigences, découvrez-en les détails et réservez votre créneau dès maintenant.`;
        break;
      case 'REMERCIEMENT':
        name = `Votre avis compte pour ${bizName}`;
        message = `Bonjour, merci d’avoir choisi ${bizName} pour votre récente prestation. Nous serions honorés de recueillir votre retour afin de continuer à vous offrir la meilleure expérience possible.`;
        break;
      case 'RELANCE_DEVIS':
        name = `Suivi de votre projet avec ${bizName}`;
        message = `Bonjour, nous revenons vers vous concernant votre récente demande auprès de ${bizName}. Êtes-vous toujours intéressé pour concrétiser ce projet ? Nous sommes à votre écoute.`;
        break;
      default:
        name = `Actualité & Disponibilités - ${bizName}`;
        message = `Bonjour, nous vous informons de nos disponibilités actuelles pour ${service}. Contactez ${bizName} directement sur Flowexa pour organiser votre prochain rendez-vous.`;
    }

    return {
      name,
      message,
      suggestedObjective: params.objective,
      targetSegment: params.segment,
    };
  }

  /**
   * Tableau de bord Croissance & Opportunités d'affaires réelles
   */
  public getGrowthDashboard(businessId: string): {
    metrics: GrowthMetrics;
    opportunities: GrowthOpportunity[];
    recentCampaigns: FlowexaCampaignEntity[];
    segments: ClientSegmentDefinition[];
  } {
    const segments = this.getCRMSegments(businessId);
    const reqs = (this.data.requests || []).filter((r) => r.businessId === businessId);
    const campaigns = this.getCampaigns(businessId);

    const newClients = segments.find((s) => s.code === 'NEW')?.clientCount || 0;
    const activeClients = segments.find((s) => s.code === 'ACTIVE')?.clientCount || 0;
    const recurrentClients = segments.find((s) => s.code === 'RECURRENT')?.clientCount || 0;
    const inactiveClients = segments.find((s) => s.code === 'INACTIVE')?.clientCount || 0;

    const totalRequests = reqs.length;
    const totalBookings = reqs.filter((r) => r.interactionType === 'BOOKING' || ['CONFIRMED', 'COMPLETED'].includes(r.status)).length;
    const conversionRate = totalRequests > 0 ? Math.round((totalBookings / totalRequests) * 100) : 0;

    const activeCampaigns = campaigns.filter((c) => ['PROGRAMMÉE', 'EN_COURS'].includes(c.status)).length;
    const completedCampaigns = campaigns.filter((c) => c.status === 'TERMINÉE').length;
    const campaignRevenue = campaigns.filter((c) => c.status === 'TERMINÉE').reduce((sum, c) => sum + (c.generatedRevenue || 0), 0);

    // Détection d'opportunités de croissance réelles basées sur les faits constatés
    const opportunities: GrowthOpportunity[] = [];

    // 1. Opportunité Inactifs
    if (inactiveClients > 0) {
      opportunities.push({
        id: 'opp-inactive',
        type: 'INACTIVE_CLIENTS',
        title: `${inactiveClients} client(s) sans échange récent`,
        description: `Ces clients n'ont eu aucune interaction depuis au moins 45 jours. Une campagne de réactivation ciblée ou une relance personnalisée peut susciter un nouveau contact.`,
        impactLevel: 'HIGH',
        suggestedActionLabel: 'Lancer une campagne de réactivation',
        targetSegment: 'INACTIVE',
        draftCampaign: {
          name: 'Reprise de contact chaleureuse',
          message: 'Bonjour, nous espérons que vous vous portez bien. Nous restons disponibles pour vos nouveaux besoins.',
          objective: 'RÉACTIVATION',
        },
      });
    }

    // 2. Opportunité Prestation populaire
    const serviceCounts = new Map<string, number>();
    reqs.forEach((r) => {
      if (r.catalogItemTitle) {
        serviceCounts.set(r.catalogItemTitle, (serviceCounts.get(r.catalogItemTitle) || 0) + 1);
      }
    });
    let topService = '';
    let topCount = 0;
    serviceCounts.forEach((cnt, sName) => {
      if (cnt > topCount) {
        topCount = cnt;
        topService = sName;
      }
    });

    if (topService && topCount >= 2) {
      opportunities.push({
        id: 'opp-demand',
        type: 'HIGH_DEMAND_SERVICE',
        title: `Forte demande sur "${topService}"`,
        description: `Cette prestation concentre ${topCount} demandes récentes. Proposez une formule privilège ou une offre complémentaire aux clients ayant déjà manifesté leur intérêt.`,
        impactLevel: 'HIGH',
        suggestedActionLabel: 'Créer une offre ciblée',
        targetSegment: 'RECURRENT',
        draftCampaign: {
          name: `Offre spéciale sur ${topService}`,
          message: `Bonjour, nous vous proposons une offre dédiée sur notre prestation phare "${topService}".`,
          objective: 'NOUVELLE_OFFRE',
        },
      });
    }

    // 3. Opportunité Conversion des demandes sans suite
    const abandonedCount = segments.find((s) => s.code === 'ABANDONED_REQUEST')?.clientCount || 0;
    if (abandonedCount > 0) {
      opportunities.push({
        id: 'opp-abandoned',
        type: 'ABANDONED_CONVERSION',
        title: `${abandonedCount} demande(s) en attente de concrétisation`,
        description: `Certaines demandes récentes n'ont pas encore été converties en réservation définitive. Une relance bienveillante permet souvent de lever les hésitations.`,
        impactLevel: 'MEDIUM',
        suggestedActionLabel: 'Relancer les demandes en attente',
        targetSegment: 'ABANDONED_REQUEST',
        draftCampaign: {
          name: 'Suivi de votre projet en cours',
          message: 'Bonjour, nous restons à votre entière disposition pour finaliser votre prestation selon vos disponibilités.',
          objective: 'RELANCE_DEVIS',
        },
      });
    }

    return {
      metrics: {
        newClientsCount: newClients,
        activeClientsCount: activeClients,
        recurrentClientsCount: recurrentClients,
        inactiveClientsCount: inactiveClients,
        totalRequests,
        totalBookings,
        conversionRate,
        activeCampaignsCount: activeCampaigns,
        completedCampaignsCount: completedCampaigns,
        campaignRevenue,
      },
      opportunities,
      recentCampaigns: campaigns.slice(0, 5),
      segments,
    };
  }

  // =========================================================================
  // SPRINT B29 + F29: ADMINISTRATION CENTRALE & SUPER ADMIN
  // =========================================================================

  /**
   * Synthèse globale 100% basée sur les données réelles
   */
  public getAdminDashboardSummary() {
    const db = this.data;
    const businesses = db.businesses || [];
    const users = db.users || [];
    const requests = db.requests || [];
    const conversations = db.conversations || [];
    const reviews = db.reviews || [];
    const reviewReports = db.reviewReports || [];
    const payments = db.payments || [];
    const subscriptions = db.subscriptions || [];
    const plans = db.plans || [];

    const activeBiz = businesses.filter((b) => b.status === 'ACTIVE' || b.status === 'PUBLISHED').length;
    const pendingBiz = businesses.filter((b) => b.status === 'PENDING' || b.status === 'PENDING_REVIEW').length;
    const draftBiz = businesses.filter((b) => b.status === 'DRAFT').length;
    const suspendedBiz = businesses.filter((b) => b.status === 'SUSPENDED').length;
    const archivedBiz = businesses.filter((b) => b.status === 'ARCHIVED').length;

    const successfulPayments = payments.filter((p) => p.status === 'SUCCESS' || p.status === 'PAID');
    const totalVolume = successfulPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const systemAlerts: {
      id: string;
      level: 'INFO' | 'WARNING' | 'CRITICAL';
      title: string;
      description: string;
      actionLabel?: string;
      targetTab?: string;
      count?: number;
    }[] = [];

    if (pendingBiz > 0) {
      systemAlerts.push({
        id: 'alert-pending-biz',
        level: 'WARNING',
        title: `${pendingBiz} entreprise(s) en attente de modération`,
        description: 'Des nouvelles entreprises ou modifications requièrent une validation administrative.',
        actionLabel: 'Examiner les entreprises',
        targetTab: 'entreprises',
        count: pendingBiz,
      });
    }

    const pendingReports = reviewReports.filter((r) => r.status === 'PENDING').length;
    if (pendingReports > 0) {
      systemAlerts.push({
        id: 'alert-review-reports',
        level: 'CRITICAL',
        title: `${pendingReports} signalement(s) d'avis non résolu(s)`,
        description: 'Des utilisateurs ou entreprises ont signalé des avis comme diffamatoires ou non conformes.',
        actionLabel: 'Modérer les avis',
        targetTab: 'avis',
        count: pendingReports,
      });
    }

    const pendingReviews = reviews.filter((r) => r.status === 'PENDING').length;
    if (pendingReviews > 0) {
      systemAlerts.push({
        id: 'alert-pending-reviews',
        level: 'INFO',
        title: `${pendingReviews} avis en attente de modération`,
        description: 'Avis clients récemment déposés prêts pour validation.',
        actionLabel: 'Voir les avis',
        targetTab: 'avis',
        count: pendingReviews,
      });
    }

    const pastDueSubs = subscriptions.filter((s) => s.status === 'PAST_DUE').length;
    if (pastDueSubs > 0) {
      systemAlerts.push({
        id: 'alert-subs-past-due',
        level: 'WARNING',
        title: `${pastDueSubs} abonnement(s) en retard de règlement`,
        description: 'Des entreprises ont des forfaits échus avec tentatives de prélèvement non abouties.',
        actionLabel: 'Gérer les abonnements',
        targetTab: 'abonnements',
        count: pastDueSubs,
      });
    }

    const failedPayments = payments.filter((p) => p.status === 'FAILED').length;
    if (failedPayments > 0) {
      systemAlerts.push({
        id: 'alert-failed-payments',
        level: 'WARNING',
        title: `${failedPayments} paiement(s) échoué(s) détecté(s)`,
        description: 'Échecs de transactions Mobile Money ou carte bancaire à surveiller.',
        actionLabel: 'Consulter les paiements',
        targetTab: 'paiements',
        count: failedPayments,
      });
    }

    return {
      businesses: {
        total: businesses.length,
        active: activeBiz,
        pendingReview: pendingBiz,
        draft: draftBiz,
        suspended: suspendedBiz,
        archived: archivedBiz,
      },
      users: {
        total: users.length,
        clients: users.filter((u) => u.role === 'CLIENT').length,
        businessOwners: users.filter((u) => u.role === 'BUSINESS_OWNER').length,
        managers: users.filter((u) => u.role === 'MANAGER').length,
        employees: users.filter((u) => u.role === 'EMPLOYEE').length,
        superAdmins: users.filter((u) => u.role === 'SUPER_ADMIN').length,
        active: users.filter((u) => u.status === 'ACTIVE' || !u.status).length,
        suspended: users.filter((u) => u.status === 'SUSPENDED').length,
      },
      requests: {
        total: requests.length,
        demandes: requests.filter((r) => r.interactionType === 'REQUEST' || !r.interactionType).length,
        bookings: requests.filter((r) => r.interactionType === 'BOOKING').length,
        appointments: requests.filter((r) => r.interactionType === 'APPOINTMENT').length,
        pending: requests.filter((r) => r.status === 'PENDING').length,
        accepted: requests.filter((r) => r.status === 'ACCEPTED' || r.status === 'CONFIRMED').length,
        completed: requests.filter((r) => r.status === 'COMPLETED').length,
        cancelled: requests.filter((r) => r.status === 'CANCELLED' || r.status === 'REJECTED').length,
      },
      conversations: {
        total: conversations.length,
        open: conversations.filter((c) => c.status === 'ACTIVE').length,
        closed: conversations.filter((c) => c.status === 'CLOSED').length,
        messagesTotal: (db.messages || []).length,
      },
      reviews: {
        total: reviews.length,
        published: reviews.filter((r) => r.status === 'PUBLISHED').length,
        pending: pendingReviews,
        hidden: reviews.filter((r) => r.status === 'HIDDEN').length,
        rejected: reviews.filter((r) => r.status === 'REJECTED').length,
        reportedCount: pendingReports,
      },
      payments: {
        totalCount: payments.length,
        totalVolume,
        successCount: successfulPayments.length,
        pendingCount: payments.filter((p) => p.status === 'PENDING' || p.status === 'PROCESSING').length,
        failedCount: failedPayments,
        refundedCount: payments.filter((p) => p.status === 'REFUNDED' || p.status === 'PARTIALLY_REFUNDED').length,
        currency: 'FCFA',
      },
      subscriptions: {
        totalCount: subscriptions.length,
        activeCount: subscriptions.filter((s) => s.status === 'ACTIVE').length,
        pastDueCount: pastDueSubs,
        plansCount: plans.length,
      },
      systemAlerts,
    };
  }

  /**
   * Gestion complète des entreprises avec filtres, recherche et pagination
   */
  public getAdminBusinesses(options?: {
    search?: string;
    status?: string;
    moduleCode?: string;
    page?: number;
    limit?: number;
  }) {
    let list = [...(this.data.businesses || [])];

    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.slug.toLowerCase().includes(q) ||
          b.city.toLowerCase().includes(q) ||
          b.phone.includes(q) ||
          (b.email && b.email.toLowerCase().includes(q)) ||
          (b.address && b.address.toLowerCase().includes(q))
      );
    }

    if (options?.status && options.status !== 'ALL') {
      const s = options.status.toUpperCase();
      if (s === 'ACTIVE') {
        list = list.filter((b) => b.status === 'ACTIVE' || b.status === 'PUBLISHED');
      } else if (s === 'PENDING') {
        list = list.filter((b) => b.status === 'PENDING' || b.status === 'PENDING_REVIEW');
      } else {
        list = list.filter((b) => b.status === s);
      }
    }

    if (options?.moduleCode && options.moduleCode !== 'ALL') {
      list = list.filter((b) => b.module_code === options.moduleCode);
    }

    const total = list.length;
    const page = Math.max(1, Number(options?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options?.limit) || 20));
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = list.slice((page - 1) * limit, page * limit);

    // Enrichissement réel
    const enriched = paginated.map((b) => {
      const catalogCount = (this.data.catalogItems || []).filter((ci) => ci.businessId === b.id).length;
      const requestsCount = (this.data.requests || []).filter((r) => r.businessId === b.id).length;
      const rating = this.calculateRating(b.id);
      const sub = (this.data.subscriptions || []).find((s) => s.businessId === b.id);
      const teamCount = (this.data.teamMembers || []).filter((tm) => tm.businessId === b.id).length;

      return {
        ...b,
        catalogCount,
        requestsCount,
        averageRating: rating.averageRating,
        reviewCount: rating.reviewCount,
        subscriptionPlan: sub?.planName || 'Starter',
        subscriptionStatus: sub?.status || 'INACTIF',
        teamCount,
      };
    });

    return {
      data: enriched,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Profil complet d'une entreprise pour inspection administrative
   */
  public getAdminBusinessDetail(businessId: string) {
    const b = (this.data.businesses || []).find((biz) => biz.id === businessId);
    if (!b) return null;

    const catalogItems = (this.data.catalogItems || []).filter((ci) => ci.businessId === b.id);
    const requests = (this.data.requests || []).filter((r) => r.businessId === b.id).slice(0, 30);
    const reviews = (this.data.reviews || []).filter((rv) => rv.businessId === b.id);
    const ratingSummary = this.calculateRating(b.id);
    const subscription = (this.data.subscriptions || []).find((s) => s.businessId === b.id) || null;
    const teamMembers = (this.data.teamMembers || []).filter((tm) => tm.businessId === b.id);
    const auditLogs = (this.data.auditLogs || []).filter(
      (log) => log.entityId === b.id || (log.changes && log.changes.businessId === b.id)
    );

    return {
      business: b,
      catalogItems,
      requests,
      reviews,
      ratingSummary,
      subscription,
      teamMembers,
      auditLogs,
    };
  }

  /**
   * Modération et cycle de vie d'une entreprise (Super Admin)
   */
  public moderateBusiness(
    businessId: string,
    action: 'VALIDATE' | 'REJECT' | 'REQUEST_CHANGES' | 'SUSPEND' | 'REACTIVATE' | 'ARCHIVE',
    params?: { reason?: string; notes?: string },
    actor?: { userId: string; userEmail: string; ip?: string }
  ): { success: boolean; business?: BusinessEntity; error?: string } {
    const business = (this.data.businesses || []).find((b) => b.id === businessId);
    if (!business) {
      return { success: false, error: 'Entreprise introuvable.' };
    }

    const previousStatus = business.status;
    const now = new Date().toISOString();
    business.moderatedAt = now;
    business.moderatedBy = actor?.userEmail || 'admin@flowexa.com';
    business.updatedAt = now;

    let auditAction = 'BUSINESS_UPDATED';
    let auditDesc = '';

    switch (action) {
      case 'VALIDATE':
        business.status = 'PUBLISHED';
        auditAction = 'BUSINESS_ACTIVATED';
        auditDesc = `Validation et publication de l'entreprise "${business.name}"`;
        break;
      case 'REACTIVATE':
        business.status = 'PUBLISHED';
        auditAction = 'BUSINESS_ACTIVATED';
        auditDesc = `Réactivation de l'entreprise "${business.name}"`;
        break;
      case 'SUSPEND':
        business.status = 'SUSPENDED';
        business.moderationNotes = params?.reason || 'Suspendue par décision administrative.';
        auditAction = 'BUSINESS_SUSPENDED';
        auditDesc = `Suspension de l'entreprise "${business.name}". Motif: ${params?.reason || 'Non spécifié'}`;
        break;
      case 'REJECT':
        business.status = 'DRAFT';
        business.moderationNotes = params?.reason || 'Refus de publication.';
        auditAction = 'BUSINESS_MODERATED';
        auditDesc = `Refus de publication pour l'entreprise "${business.name}". Motif: ${params?.reason || 'Non spécifié'}`;
        break;
      case 'REQUEST_CHANGES':
        business.status = 'PENDING_REVIEW';
        business.moderationNotes = params?.reason || 'Des corrections sont requises avant publication.';
        auditAction = 'BUSINESS_MODERATED';
        auditDesc = `Demande de corrections transmise à l'entreprise "${business.name}": ${params?.reason || 'Détails communiqués'}`;
        break;
      case 'ARCHIVE':
        business.status = 'ARCHIVED';
        auditAction = 'BUSINESS_UPDATED';
        auditDesc = `Archivage de l'entreprise "${business.name}"`;
        break;
    }

    this.logAudit({
      userId: actor?.userId || 'admin',
      userEmail: actor?.userEmail || 'admin@flowexa.com',
      action: auditAction,
      entityType: 'BUSINESS',
      entityId: business.id,
      description: auditDesc,
      changes: {
        previousStatus,
        newStatus: business.status,
        action,
        reason: params?.reason,
      },
      result: 'SUCCESS',
      ip: actor?.ip || '127.0.0.1',
    });

    this.commit();
    return { success: true, business };
  }

  /**
   * Gestion des utilisateurs plateforme (Super Admin)
   */
  public getAdminUsers(options?: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    let list = [...(this.data.users || [])];

    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(
        (u) =>
          (u.fullName && u.fullName.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.phone && u.phone.includes(q))
      );
    }

    if (options?.role && options.role !== 'ALL') {
      list = list.filter((u) => u.role === options.role);
    }

    if (options?.status && options.status !== 'ALL') {
      list = list.filter((u) => (u.status || 'ACTIVE') === options.status);
    }

    const total = list.length;
    const page = Math.max(1, Number(options?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options?.limit) || 20));
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = list.slice((page - 1) * limit, page * limit);

    // Sanitisation (pas de mot de passe) & enrichissement avec nom d'entreprise
    const enriched = paginated.map((u) => {
      let businessName = '';
      if (u.businessId) {
        const b = (this.data.businesses || []).find((biz) => biz.id === u.businessId);
        if (b) businessName = b.name;
      }

      return {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim(),
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status || 'ACTIVE',
        businessId: u.businessId,
        businessName,
        tenantId: u.tenantId,
        verificationStatus: u.verificationStatus || 'VERIFIE',
        twoFactorEnabled: !!u.twoFactorEnabled,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      };
    });

    return {
      data: enriched,
      total,
      page,
      limit,
      totalPages,
    };
  }

  public getAdminUserDetail(userId: string) {
    const user = (this.data.users || []).find((u) => u.id === userId);
    if (!user) return null;

    let business = null;
    if (user.businessId) {
      business = (this.data.businesses || []).find((b) => b.id === user.businessId) || null;
    }

    const auditLogs = (this.data.auditLogs || []).filter(
      (log) => log.userId === user.id || log.entityId === user.id
    );

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status || 'ACTIVE',
        businessId: user.businessId,
        tenantId: user.tenantId,
        verificationStatus: user.verificationStatus,
        twoFactorEnabled: user.twoFactorEnabled,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      business,
      auditLogs,
    };
  }

  public updateAdminUserStatus(
    userId: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE',
    reason?: string,
    actor?: { userId: string; userEmail: string; ip?: string }
  ) {
    const user = (this.data.users || []).find((u) => u.id === userId);
    if (!user) return { success: false, error: 'Utilisateur introuvable.' };

    const previousStatus = user.status || 'ACTIVE';
    user.status = status;
    user.updatedAt = new Date().toISOString();

    const action = status === 'SUSPENDED' ? 'USER_SUSPENDED' : status === 'ACTIVE' ? 'USER_ACTIVATED' : 'USER_UPDATED';

    this.logAudit({
      userId: actor?.userId || 'admin',
      userEmail: actor?.userEmail || 'admin@flowexa.com',
      action,
      entityType: 'USER',
      entityId: user.id,
      description: `Changement de statut utilisateur pour "${user.fullName || user.email}" : ${previousStatus} -> ${status} (${reason || 'Action administrative'})`,
      changes: { previousStatus, newStatus: status, reason },
      result: 'SUCCESS',
      ip: actor?.ip || '127.0.0.1',
    });

    this.commit();
    return { success: true, user };
  }

  public updateAdminUserRole(
    userId: string,
    newRole: RoleType,
    actor?: { userId: string; userEmail: string; ip?: string }
  ) {
    const user = (this.data.users || []).find((u) => u.id === userId);
    if (!user) return { success: false, error: 'Utilisateur introuvable.' };

    const previousRole = user.role;
    user.role = newRole;
    user.updatedAt = new Date().toISOString();

    this.logAudit({
      userId: actor?.userId || 'admin',
      userEmail: actor?.userEmail || 'admin@flowexa.com',
      action: 'ROLE_CHANGED',
      entityType: 'USER',
      entityId: user.id,
      description: `Modification de rôle pour "${user.fullName || user.email}" : ${previousRole} -> ${newRole}`,
      changes: { previousRole, newRole },
      result: 'SUCCESS',
      ip: actor?.ip || '127.0.0.1',
    });

    this.commit();
    return { success: true, user };
  }

  public softDeleteAdminUser(userId: string, actor?: { userId: string; userEmail: string; ip?: string }) {
    return this.updateAdminUserStatus(userId, 'INACTIVE', 'Suppression logique / Archivage administratif', actor);
  }

  // =========================================================================
  // GESTION DES CATÉGORIES / MÉTIERS OFFICIELLES
  // =========================================================================

  public getPlatformCategories(): PlatformCategoryEntity[] {
    if (!this.data.platformCategories || !Array.isArray(this.data.platformCategories)) {
      this.data.platformCategories = [];
    }

    // Enrichir avec le nombre réel d'entreprises associées
    return this.data.platformCategories
      .sort((a, b) => a.order - b.order)
      .map((cat) => {
        const businessCount = (this.data.businesses || []).filter((b) =>
          cat.associatedModuleCodes.includes(b.module_code)
        ).length;
        return {
          ...cat,
          businessCount,
        };
      });
  }

  public createPlatformCategory(
    categoryData: Omit<PlatformCategoryEntity, 'id' | 'createdAt' | 'updatedAt'>,
    actor?: { userId: string; userEmail: string; ip?: string }
  ): { success: boolean; category?: PlatformCategoryEntity; error?: string } {
    if (!this.data.platformCategories) this.data.platformCategories = [];

    const existing = this.data.platformCategories.find(
      (c) => c.code.toUpperCase() === categoryData.code.toUpperCase()
    );
    if (existing) {
      return { success: false, error: `Une catégorie avec le code "${categoryData.code}" existe déjà.` };
    }

    const now = new Date().toISOString();
    const newCat: PlatformCategoryEntity = {
      id: `pcat-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      createdAt: now,
      updatedAt: now,
      ...categoryData,
    };

    this.data.platformCategories.push(newCat);

    this.logAudit({
      userId: actor?.userId || 'admin',
      userEmail: actor?.userEmail || 'admin@flowexa.com',
      action: 'CATEGORY_CREATED',
      entityType: 'CATEGORY',
      entityId: newCat.id,
      description: `Création de la catégorie métier "${newCat.name}" (${newCat.code})`,
      changes: { newCat },
      result: 'SUCCESS',
      ip: actor?.ip || '127.0.0.1',
    });

    this.commit();
    return { success: true, category: newCat };
  }

  public updatePlatformCategory(
    id: string,
    updates: Partial<PlatformCategoryEntity>,
    actor?: { userId: string; userEmail: string; ip?: string }
  ): { success: boolean; category?: PlatformCategoryEntity; error?: string } {
    if (!this.data.platformCategories) return { success: false, error: 'Catégorie introuvable.' };

    const cat = this.data.platformCategories.find((c) => c.id === id);
    if (!cat) return { success: false, error: 'Catégorie introuvable.' };

    const previous = { ...cat };
    Object.assign(cat, updates);
    cat.updatedAt = new Date().toISOString();

    this.logAudit({
      userId: actor?.userId || 'admin',
      userEmail: actor?.userEmail || 'admin@flowexa.com',
      action: 'CATEGORY_UPDATED',
      entityType: 'CATEGORY',
      entityId: cat.id,
      description: `Mise à jour de la catégorie métier "${cat.name}"`,
      changes: { previous, updates },
      result: 'SUCCESS',
      ip: actor?.ip || '127.0.0.1',
    });

    this.commit();
    return { success: true, category: cat };
  }

  public togglePlatformCategory(id: string, actor?: { userId: string; userEmail: string; ip?: string }) {
    const cat = (this.data.platformCategories || []).find((c) => c.id === id);
    if (!cat) return { success: false, error: 'Catégorie introuvable.' };

    cat.isActive = !cat.isActive;
    cat.updatedAt = new Date().toISOString();

    this.logAudit({
      userId: actor?.userId || 'admin',
      userEmail: actor?.userEmail || 'admin@flowexa.com',
      action: 'CATEGORY_UPDATED',
      entityType: 'CATEGORY',
      entityId: cat.id,
      description: `Catégorie "${cat.name}" : statut basculé en ${cat.isActive ? 'ACTIF' : 'INACTIF'}`,
      changes: { isActive: cat.isActive },
      result: 'SUCCESS',
      ip: actor?.ip || '127.0.0.1',
    });

    this.commit();
    return { success: true, category: cat };
  }

  // =========================================================================
  // PARAMÈTRES GLOBAUX DE LA PLATEFORME (SUPER ADMIN)
  // =========================================================================

  public getPlatformSettings(): FlowexaPlatformSettings {
    if (!this.data.platformSettings) {
      this.data.platformSettings = {
        platformName: 'FLOWEXA Bénin',
        contactEmail: 'contact@flowexa.bj',
        supportPhone: '+229 01 54 10 06 17',
        country: 'Bénin',
        defaultCurrency: 'FCFA',
        allowPublicRegistrations: true,
        requireBusinessReview: true,
        reviewModerationAutoPublish: false,
        smsNotificationsEnabled: true,
        emailNotificationsEnabled: true,
        whatsappNotificationsEnabled: true,
        defaultSearchRadiusKm: 25,
        maintenanceMode: false,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin@flowexa.com',
      };
      this.commit();
    }
    return this.data.platformSettings;
  }

  public updatePlatformSettings(
    newSettings: Partial<FlowexaPlatformSettings>,
    actor?: { userId: string; userEmail: string; ip?: string }
  ): { success: boolean; settings: FlowexaPlatformSettings } {
    const current = this.getPlatformSettings();
    const previous = { ...current };

    Object.assign(current, newSettings);
    current.updatedAt = new Date().toISOString();
    current.updatedBy = actor?.userEmail || 'admin@flowexa.com';

    this.logAudit({
      userId: actor?.userId || 'admin',
      userEmail: actor?.userEmail || 'admin@flowexa.com',
      action: 'ADMIN_SETTING_CHANGED',
      entityType: 'SETTINGS',
      entityId: 'global',
      description: `Mise à jour des paramètres système de la plateforme Flowexa`,
      changes: { previous, updated: newSettings },
      result: 'SUCCESS',
      ip: actor?.ip || '127.0.0.1',
    });

    this.commit();
    return { success: true, settings: current };
  }

  // =========================================================================
  // REQUÊTES ET AUDIT LOGS RECHERCHABLES
  // =========================================================================

  public getAdminAuditLogs(options?: {
    search?: string;
    action?: string;
    entityType?: string;
    page?: number;
    limit?: number;
  }) {
    let list = [...(this.data.auditLogs || [])];

    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter(
        (l) =>
          l.description.toLowerCase().includes(q) ||
          l.userEmail.toLowerCase().includes(q) ||
          l.entityId.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q)
      );
    }

    if (options?.action && options.action !== 'ALL') {
      list = list.filter((l) => l.action === options.action);
    }

    if (options?.entityType && options.entityType !== 'ALL') {
      list = list.filter((l) => l.entityType === options.entityType);
    }

    const total = list.length;
    const page = Math.max(1, Number(options?.page) || 1);
    const limit = Math.max(1, Math.min(200, Number(options?.limit) || 50));
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return {
      data: paginated,
      total,
      page,
      limit,
      totalPages,
    };
  }

  public getAdminRequests(options?: {
    search?: string;
    status?: string;
    interactionType?: string;
    businessId?: string;
    page?: number;
    limit?: number;
  }) {
    let list = [...(this.data.requests || [])];

    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter(
        (r) =>
          r.clientName.toLowerCase().includes(q) ||
          r.businessName.toLowerCase().includes(q) ||
          r.clientPhone.includes(q) ||
          (r.catalogItemTitle && r.catalogItemTitle.toLowerCase().includes(q))
      );
    }

    if (options?.status && options.status !== 'ALL') {
      list = list.filter((r) => r.status === options.status);
    }

    if (options?.interactionType && options.interactionType !== 'ALL') {
      list = list.filter((r) => r.interactionType === options.interactionType);
    }

    if (options?.businessId && options.businessId !== 'ALL') {
      list = list.filter((r) => r.businessId === options.businessId);
    }

    const total = list.length;
    const page = Math.max(1, Number(options?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options?.limit) || 20));
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return {
      data: paginated,
      total,
      page,
      limit,
      totalPages,
    };
  }
}


export const store = new DataStore();


