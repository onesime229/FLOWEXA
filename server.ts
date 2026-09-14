import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import {
  store,
  BusinessEntity,
  PropertyEntity,
  RoomEntity,
  ServiceEntity,
  BookingEntity,
  DemandeEntity,
  CatalogItemEntity,
  CatalogCategoryEntity,
  FlowexaRequestEntity,
  FlowexaNotificationEntity,
  InteractionType,
  RequestStatus,
  FlowexaPaymentEntity,
  FlowexaTransactionEntity,
  PaymentProviderCode,
  PaymentStatus,
} from './src/server/dataStore';
import {
  getPaymentProvider,
  getAllSupportedProviders,
} from './src/server/paymentProviders';
import { AIService } from './src/server/ai/AIService';
import { isBusinessOpenNow } from './src/server/ai/NaturalLanguageSearchService';
import { AuthService, TokenPayload } from './src/server/auth/AuthService';
import { notificationService } from './src/server/notifications/NotificationService';
import { communicationService } from './src/server/notifications/CommunicationService';
import { consentService } from './src/server/notifications/ConsentService';
import { SecurityService } from './src/server/security/SecurityService';
import { cacheService } from './src/server/cache/CacheService';
import { performanceMonitor } from './src/server/performance/PerformanceMonitor';
import { concurrencyManager } from './src/server/concurrency/ConcurrencyManager';
import { ImageOptimizer } from './src/server/media/ImageOptimizer';
import { flowexaOpenApiSpec, renderSwaggerHtml } from './src/server/openapiSpec';

const app = express();
const PORT = 3000;
const aiService = new AIService(store);

// SPRINT B32: Profiling et monitoring des performances en temps réel
app.use(performanceMonitor.middleware());

// SPRINT B31 : En-têtes HTTP de sécurité (Anti-Sniff, Anti-XSS, Strict-Origin)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// SPRINT B31 : Épuration automatique des entrées utilisateur (Anti-XSS & Anti-Prototype-Pollution)
app.use((req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = SecurityService.sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = SecurityService.sanitizeObject(req.query);
  }
  next();
});

// Helper de limitation de débit (Rate Limiter Middleware)
function createRateLimitMiddleware(options: { keyPrefix: string; limit: number; windowSeconds: number }) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    const identifier = req.body?.identifier || req.body?.phone || req.body?.email || '';
    const key = `${options.keyPrefix}:${ip}:${identifier}`;

    const check = SecurityService.checkRateLimit(key, options.limit, options.windowSeconds, ip);
    if (!check.allowed) {
      res.setHeader('Retry-After', check.retryAfterSeconds || 60);
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Trop de requêtes. Veuillez patienter ${check.retryAfterSeconds || 60} secondes avant de réessayer.`,
      });
    }
    next();
  };
}

// Health Check
app.get('/api/health', (_req, res) => {
  const memory = process.memoryUsage();
  res.json({
    status: 'ok',
    service: 'Flowexa Full-Stack Multi-Tenant API',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    cache: cacheService.getStats(),
    memoryMb: {
      rss: Math.round(memory.rss / (1024 * 1024)),
      heapUsed: Math.round(memory.heapUsed / (1024 * 1024)),
    },
  });
});

// Static uploads
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer setup for real photo uploads (max 5MB, images only)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `flowexa-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporté. Formats acceptés : JPG, PNG, WEBP.'));
    }
  },
});

// Haversine formula for real proximity distance in kilometers
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// SPRINT B32: Filtrage préalable rapide par Boîte Englobante (Bounding Box / AABB)
// Évite les calculs trigonométriques coûteux sur les coordonnées hors-zone
function isWithinBoundingBox(
  originLat: number,
  originLng: number,
  targetLat?: number,
  targetLng?: number,
  radiusKm?: number | null
): boolean {
  if (typeof targetLat !== 'number' || typeof targetLng !== 'number') return false;
  if (!radiusKm || radiusKm <= 0) return true;

  // 1 degré de latitude correspond à environ 110.5 km
  const deltaLat = (radiusKm * 1.05) / 110.5;
  if (Math.abs(targetLat - originLat) > deltaLat) return false;

  // 1 degré de longitude dépend de la latitude : 110.5 * cos(lat)
  const latRad = (originLat * Math.PI) / 180;
  const cosLat = Math.max(0.1, Math.cos(latRad));
  const deltaLng = (radiusKm * 1.05) / (110.5 * cosLat);
  if (Math.abs(targetLng - originLng) > deltaLng) return false;

  return true;
}

// SPRINT B32: Helper standardisé de pagination avec plafond strict maxLimit=100
function paginateItems<T>(
  items: T[],
  pageParam?: any,
  limitParam?: any,
  maxLimit: number = 100
): {
  data: T[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
} {
  if (pageParam === undefined && limitParam === undefined) {
    return { data: items };
  }

  const rawPage = parseInt(String(pageParam), 10);
  const rawLimit = parseInt(String(limitParam), 10);

  const page = !isNaN(rawPage) && rawPage > 0 ? rawPage : 1;
  const pageSize = !isNaN(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, maxLimit) : 20;

  const total = items.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const offset = (page - 1) * pageSize;
  const paginatedData = items.slice(offset, offset + pageSize);

  return {
    data: paginatedData,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// -------------------------------------------------------------
// API V1 ROUTES
// -------------------------------------------------------------

// Health
app.get('/api/v1/health', (_req, res) => {
  const memory = process.memoryUsage();
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    platform: 'Flowexa Multi-Tenant',
    uptimeSeconds: Math.round(process.uptime()),
    cache: cacheService.getStats(),
    memoryMb: {
      rss: Math.round(memory.rss / (1024 * 1024)),
      heapUsed: Math.round(memory.heapUsed / (1024 * 1024)),
    },
  });
});

// SPRINT B32: Audit de performance et métriques en temps réel
app.get('/api/v1/admin/performance/audit', (_req, res) => {
  const report = performanceMonitor.generateAuditReport();
  res.json({
    success: true,
    data: report,
    cache: cacheService.getStats(),
  });
});

// SPRINT B34: OpenAPI 3.0 Documentation & Swagger UI
app.get(['/api/v1/openapi.json', '/api/schema/'], (_req, res) => {
  res.json(flowexaOpenApiSpec);
});

app.get(['/api/docs', '/api/v1/docs'], (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(renderSwaggerHtml('/api/v1/openapi.json'));
});

// =========================================================================
// SPRINT B24: MIDDLEWARES D'AUTHENTIFICATION, RÔLES & MULTI-TENANT
// =========================================================================

interface AuthenticatedRequest extends express.Request {
  user?: TokenPayload;
  businessId?: string;
  tenantId?: string;
}

function authMiddleware(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentification requise.' });
  }
  const token = authHeader.substring(7);
  const payload = AuthService.verifyJwt(token);
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Session invalide ou expirée.' });
  }
  req.user = payload;
  next();
}

function tenantMiddleware(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  // S'assurer que le JWT est vérifié (authMiddleware ou extraction directe)
  if (!req.user) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = AuthService.verifyJwt(token);
      if (payload) {
        req.user = payload;
      }
    }
  }

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentification requise pour identifier le tenant.' });
  }

  const role = req.user.role;

  // SUPER_ADMIN : autoriser un override explicite par paramètre, journalisé dans les logs d'audit
  if (role === 'SUPER_ADMIN') {
    const overrideId = (req.query.business_id as string) || (req.query.businessId as string) || (req.body?.businessId as string);
    if (overrideId && overrideId !== req.user.businessId) {
      req.businessId = overrideId;
      const targetBiz = store.getBusinessById(overrideId);
      req.tenantId = targetBiz?.tenantId || overrideId;
      store.logAudit({
        userId: req.user.sub,
        userEmail: req.user.email || 'admin@flowexa.com',
        action: 'SUPERADMIN_TENANT_OVERRIDE',
        entityType: 'TENANT',
        entityId: overrideId,
        description: `SuperAdmin override tenant context to [${overrideId}] on ${req.method} ${req.path}`,
        ip: req.ip || '127.0.0.1',
      });
    } else {
      req.businessId = req.user.businessId || '';
      req.tenantId = req.user.tenantId || '';
    }
    return next();
  }

  // BUSINESS_OWNER / MANAGER / EMPLOYEE : pose req.businessId et req.tenantId UNIQUEMENT depuis le JWT vérifié.
  // Ignorer et NE JAMAIS lire x-business-id.
  if (role === 'BUSINESS_OWNER' || role === 'MANAGER' || role === 'EMPLOYEE') {
    if (!req.user.businessId) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Aucun établissement rattaché à ce compte professionnel.',
      });
    }
    req.businessId = req.user.businessId;
    const biz = store.getBusinessById(req.user.businessId);
    req.tenantId = req.user.tenantId || biz?.tenantId || req.user.businessId;
    return next();
  }

  // CLIENT : pas de businessId (l'accès aux objets est filtré par l'identité du client depuis le JWT, jamais par un id libre)
  if (role === 'CLIENT') {
    req.businessId = undefined;
    req.tenantId = undefined;
    return next();
  }

  return res.status(403).json({ success: false, message: 'Rôle non autorisé.' });
}

function roleMiddleware(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentification requise.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Accès refusé : permissions insuffisantes.' });
    }
    next();
  };
}

// -------------------------------------------------------------
// SPRINT B24: API AUTHENTIFICATION & GESTION DES COMPTES
// -------------------------------------------------------------

// 1. Inscription Client
const authRegisterRateLimit = createRateLimitMiddleware({ keyPrefix: 'auth-register', limit: 5, windowSeconds: 60 });
const authLoginRateLimit = createRateLimitMiddleware({ keyPrefix: 'auth-login', limit: 5, windowSeconds: 60 });
const authForgotRateLimit = createRateLimitMiddleware({ keyPrefix: 'auth-forgot', limit: 3, windowSeconds: 60 });

const handleRegisterClient = (req: express.Request, res: express.Response) => {
  try {
    const result = AuthService.registerClient(req.body, req.ip);
    res.status(201).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Erreur lors de l’inscription.' });
  }
};
app.post('/api/auth/register-client', authRegisterRateLimit, handleRegisterClient);
app.post('/api/v1/auth/register-client', authRegisterRateLimit, handleRegisterClient);

// 2. Inscription Entreprise
const handleRegisterBusiness = (req: express.Request, res: express.Response) => {
  try {
    const result = AuthService.registerBusiness(req.body, req.ip);
    res.status(201).json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Erreur lors de l’inscription entreprise.' });
  }
};
app.post('/api/auth/register-business', authRegisterRateLimit, handleRegisterBusiness);
app.post('/api/v1/auth/register-business', authRegisterRateLimit, handleRegisterBusiness);

// 3. Connexion
const handleLogin = (req: express.Request, res: express.Response) => {
  try {
    const { identifier, password } = req.body;
    const result = AuthService.login(identifier, password, req.ip, req.headers['user-agent']);
    res.json({ success: true, ...result });
  } catch (error: any) {
    const status = error.message?.includes('suspendu') ? 403 : 401;
    res.status(status).json({ success: false, message: error.message || 'Erreur lors de la connexion.' });
  }
};
app.post('/api/auth/login', authLoginRateLimit, handleLogin);
app.post('/api/v1/auth/login', authLoginRateLimit, handleLogin);

// 4. Déconnexion
const handleLogout = (req: express.Request, res: express.Response) => {
  try {
    const { refreshToken, userId } = req.body;
    AuthService.logout(refreshToken, userId, req.ip);
    res.json({ success: true, message: 'Déconnexion effectuée avec succès.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
app.post('/api/auth/logout', handleLogout);
app.post('/api/v1/auth/logout', handleLogout);

// 5. Rafraîchissement de jeton (Token Refresh)
const handleRefreshToken = (req: express.Request, res: express.Response) => {
  try {
    const { refreshToken } = req.body;
    const tokens = AuthService.refreshToken(refreshToken);
    res.json({ success: true, ...tokens });
  } catch (error: any) {
    res.status(401).json({ success: false, message: error.message });
  }
};
app.post('/api/auth/refresh-token', handleRefreshToken);
app.post('/api/v1/auth/refresh-token', handleRefreshToken);
app.post('/api/auth/refresh', handleRefreshToken);
app.post('/api/v1/auth/refresh', handleRefreshToken);

// 6. Mot de passe oublié
const handleForgotPassword = (req: express.Request, res: express.Response) => {
  try {
    const { phoneOrEmail } = req.body;
    const result = AuthService.forgotPassword(phoneOrEmail, req.ip);
    res.json({
      success: true,
      message: 'Un code de sécurité à 6 chiffres a été généré.',
      ...result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
app.post('/api/auth/forgot-password', authForgotRateLimit, handleForgotPassword);
app.post('/api/v1/auth/forgot-password', authForgotRateLimit, handleForgotPassword);

// 7. Réinitialisation mot de passe
const handleResetPassword = (req: express.Request, res: express.Response) => {
  try {
    const { tokenOrCode, newPassword } = req.body;
    AuthService.resetPassword(tokenOrCode, newPassword, req.ip);
    res.json({ success: true, message: 'Votre mot de passe a été réinitialisé avec succès.' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
app.post('/api/auth/reset-password', handleResetPassword);
app.post('/api/v1/auth/reset-password', handleResetPassword);

// 8. Récupérer le profil courant
const handleGetMe = (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const user = store.getUserById(req.user!.sub);
    if (!user || user.status === 'INACTIVE') {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }
    res.json({ success: true, user: AuthService.toUserProfile(user) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
app.get('/api/auth/me', authMiddleware, handleGetMe);
app.get('/api/v1/auth/me', authMiddleware, handleGetMe);

// 9. Mettre à jour son propre profil
const handleUpdateMe = (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user!.sub;
    const { firstName, lastName, phone, email, birthDate, notificationPreferences, avatarUrl } = req.body;
    const existing = store.getUserById(userId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    const updates: any = {};
    if (firstName) updates.firstName = firstName.trim();
    if (lastName) updates.lastName = lastName.trim();
    if (firstName || lastName) {
      updates.fullName = `${updates.firstName || existing.firstName} ${updates.lastName || existing.lastName}`.trim();
    }
    if (phone) updates.phone = phone.trim();
    if (email) updates.email = email.trim().toLowerCase();
    if (birthDate !== undefined) updates.birthDate = birthDate;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    if (notificationPreferences) {
      updates.notificationPreferences = {
        email: !!notificationPreferences.email,
        sms: !!notificationPreferences.sms,
        whatsapp: !!notificationPreferences.whatsapp,
        marketing: !!notificationPreferences.marketing,
      };
    }

    const updated = store.updateUser(userId, updates);
    if (!updated) {
      return res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour.' });
    }

    res.json({ success: true, user: AuthService.toUserProfile(updated), message: 'Profil mis à jour.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
app.put('/api/auth/me', authMiddleware, handleUpdateMe);
app.put('/api/v1/auth/me', authMiddleware, handleUpdateMe);

// 10. Modifier mot de passe (authentifié)
const handleChangePassword = (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user!.sub;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe actuel et un nouveau mot de passe d’au moins 6 caractères sont requis.',
      });
    }

    const user = store.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    const valid = AuthService.verifyPassword(currentPassword, user.passwordHash, user.passwordSalt);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Mot de passe actuel incorrect.' });
    }

    const { hash, salt } = AuthService.hashPassword(newPassword);
    store.updateUser(userId, { passwordHash: hash, passwordSalt: salt });
    store.revokeUserSessions(userId);

    res.json({ success: true, message: 'Mot de passe modifié avec succès.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
app.put('/api/auth/change-password', authMiddleware, handleChangePassword);
app.put('/api/v1/auth/change-password', authMiddleware, handleChangePassword);

// 11. Vue de sécurité (sessions, 2FA, logins)
const handleGetSecurity = (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user!.sub;
    const user = store.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    const activeSessionsCount = store.getActiveSessionsCount(userId);
    const audits = store.getDb().auditLogs || [];
    const userAudits = audits
      .filter((a) => a.userId === userId || a.userEmail === user.email)
      .slice(0, 10)
      .map((a) => ({
        id: a.id,
        timestamp: a.timestamp,
        ip: a.ip || '127.0.0.1',
        action: a.action,
        device: 'Navigateur Web',
      }));

    res.json({
      success: true,
      security: {
        user: AuthService.toUserProfile(user),
        activeSessionsCount: Math.max(activeSessionsCount, 1),
        twoFactorEnabled: !!user.twoFactorEnabled,
        recentLogins: userAudits,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
app.get('/api/auth/security', authMiddleware, handleGetSecurity);
app.get('/api/v1/auth/security', authMiddleware, handleGetSecurity);

// 12. Activer / Désactiver 2FA
const handleToggle2fa = (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user!.sub;
    const user = store.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    const next2fa = !user.twoFactorEnabled;
    store.updateUser(userId, { twoFactorEnabled: next2fa });

    res.json({
      success: true,
      twoFactorEnabled: next2fa,
      message: next2fa ? 'Authentification à double facteur activée.' : 'Double facteur désactivé.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
app.post('/api/auth/toggle-2fa', authMiddleware, handleToggle2fa);
app.post('/api/v1/auth/toggle-2fa', authMiddleware, handleToggle2fa);

// 13. SUPER ADMIN: Liste des utilisateurs & filtres
app.get('/api/admin/users', authMiddleware, roleMiddleware(['SUPER_ADMIN']), (req: express.Request, res: express.Response) => {
  try {
    const { role, status, search } = req.query;
    let users = store.getUsers().filter((u) => u.status !== 'INACTIVE');

    if (role && typeof role === 'string' && role !== 'ALL') {
      users = users.filter((u) => u.role === role);
    }
    if (status && typeof status === 'string' && status !== 'ALL') {
      users = users.filter((u) => u.status === status || u.verificationStatus === status);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      users = users.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q)
      );
    }

    const safeUsers = users.map((u) => AuthService.toUserProfile(u));
    res.json({ success: true, count: safeUsers.length, users: safeUsers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 14. SUPER ADMIN: Statut d'un compte (Suspension / Activation / Vérification)
app.put(
  '/api/admin/users/:id/status',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN']),
  (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const { status, verificationStatus } = req.body;

      const user = store.getUserById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
      }

      // Interdiction de suspendre un autre SUPER_ADMIN
      if (user.role === 'SUPER_ADMIN') {
        return res.status(403).json({ success: false, message: 'Impossible de suspendre un Super Administrateur.' });
      }

      const updates: any = {};
      if (status) updates.status = status;
      if (verificationStatus) updates.verificationStatus = verificationStatus;

      const updated = store.updateUser(id, updates);
      if (status === 'SUSPENDED') {
        store.revokeUserSessions(id);
      }

      res.json({
        success: true,
        user: AuthService.toUserProfile(updated!),
        message: `Statut du compte mis à jour (${status || verificationStatus}).`,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// 15. SUPER ADMIN: Modification du rôle
app.put(
  '/api/admin/users/:id/role',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN']),
  (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const user = store.getUserById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
      }

      const updated = store.updateUser(id, { role });
      res.json({
        success: true,
        user: AuthService.toUserProfile(updated!),
        message: `Rôle mis à jour avec succès : ${role}.`,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// -------------------------------------------------------------
// 1. BUSINESSES (Profil, Geolocation, Photos, Heures d'ouverture)
// -------------------------------------------------------------

// -------------------------------------------------------------
// CATEGORIES & MODULES (10 MODULES OFFICIELS - STRICTEMENT SANS COUTURIER)
// -------------------------------------------------------------
app.get('/api/v1/categories', (req, res) => {
  const cached = cacheService.get<any>('categories_list');
  if (cached) {
    return res.json(cached);
  }

  const db = store.getDb();
  const activeBusinesses = db.businesses.filter((b) => b.status === 'ACTIVE');

  // Strict list of the 10 official Flowexa business modules
  const officialModules = [
    {
      id: 'immobilier',
      code: 'IMMOBILIER',
      name: 'Immobilier',
      subtitle: 'Vente, Location & Gestion',
      category: 'Logement & Espaces',
      description: 'Gestion de biens immobiliers, baux locatifs, visites programmées et quittances.',
      accentColor: '#FB8205',
      features: ['Catalogue de biens', 'Gestion des baux', 'Réservation de visites', 'État des lieux'],
      sampleQuery: 'Je cherche un appartement à louer à Cotonou',
      iconName: 'Building2',
    },
    {
      id: 'guest_house',
      code: 'GUEST_HOUSE',
      name: 'Guest House',
      subtitle: 'Séjours courte durée & Nuitées',
      category: 'Hébergement',
      description: 'Gestion des chambres, arrivées/départs en temps réel et réservations.',
      accentColor: '#0BE9EF',
      features: ['Planning des réservations', 'Gestion du ménage', 'Tarification par nuitée', 'Disponibilités'],
      sampleQuery: 'Je cherche une chambre pour ce soir à Cotonou',
      iconName: 'Home',
    },
    {
      id: 'coiffure',
      code: 'COIFFURE',
      name: 'Coiffure',
      subtitle: 'Style & Coiffure',
      category: 'Beauté & Soins',
      description: 'Prise de rendez-vous, planning des coiffeurs, gestion des forfaits et prestations.',
      accentColor: '#FB8205',
      features: ['Agenda par collaborateur', 'Catalogue des coiffures & tarifs', 'Rappels automatiques', 'Fiches prestations'],
      sampleQuery: 'Je cherche un salon de coiffure pour tresses samedi',
      iconName: 'Scissors',
    },
    {
      id: 'barbier',
      code: 'BARBIER',
      name: 'Barbier',
      subtitle: 'Grooming masculin & Soins',
      category: 'Beauté & Soins',
      description: 'Gestion des créneaux, soins de barbe, taille et coupe.',
      accentColor: '#0BE9EF',
      features: ['Créneaux & disponibilités', 'Formules taille de barbe & soins', 'Tarifs par prestation', 'Fidélité'],
      sampleQuery: 'Je cherche un barbier ouvert maintenant',
      iconName: 'Sparkles',
    },
    {
      id: 'institut_cosmetique',
      code: 'INSTITUT_COSMETIQUE',
      name: 'Institut / Cosmétique',
      subtitle: 'Soins & Produits de beauté',
      category: 'Beauté & Soins',
      description: 'Soins du visage, onglerie, manucure, vente de produits cosmétiques.',
      accentColor: '#FB8205',
      features: ['Soins personnalisés', 'Gestion des cabines', 'Catalogue produits', 'Rendez-vous'],
      sampleQuery: 'Soin du visage et manucure à Cotonou',
      iconName: 'HeartHandshake',
    },
    {
      id: 'spa_massage',
      code: 'SPA_MASSAGE',
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
      name: 'Photographe',
      subtitle: 'Séances & Reportages photo',
      category: 'Création & Média',
      description: 'Réservation de séances photo studio, reportages événementiels et galeries.',
      accentColor: '#FB8205',
      features: ['Réservation de séances', 'Galeries photos', 'Tirages & forfaits', 'Post-traitement'],
      sampleQuery: 'Shooting photo portrait en studio à Cotonou',
      iconName: 'Camera',
    },
    {
      id: 'broderie_impression',
      code: 'BRODERIE_IMPRESSION',
      name: 'Broderie / Impression textile',
      subtitle: 'Broderie, Flocage & Impression',
      category: 'Textile & Artisanat',
      description: 'Personnalisation textile, broderie artisanale et industrielle, flocage, sérigraphie.',
      accentColor: '#0BE9EF',
      features: ['Personnalisation & motifs', 'Suivi des commandes', 'Flocage & sérigraphie', 'Impression textile'],
      sampleQuery: 'Broderie et flocage sur polos ou casquettes',
      iconName: 'Palette',
    },
    {
      id: 'garage',
      code: 'GARAGE',
      name: 'Garage & Mécanique',
      subtitle: 'Entretien auto, Vidange & Réparation',
      category: 'Automobile',
      description: 'Prise en charge véhicule, ordres de réparation, vidange, révision et dépannage.',
      accentColor: '#FB8205',
      features: ['Ordres de réparation', 'Carnet d’entretien', 'Devis prestations', 'Diagnostic auto'],
      sampleQuery: 'Je cherche un garage pour vidange et révision',
      iconName: 'Wrench',
    },
    {
      id: 'pharmacie',
      code: 'PHARMACIE',
      name: 'Pharmacie',
      subtitle: 'Officine, Localisation & Garde',
      category: 'Officine',
      description: 'Disponibilité des produits officinaux, permanence et pharmacies de garde.',
      accentColor: '#10D97F',
      features: ['Disponibilité en direct', 'Pharmacies de garde', 'Localisation', 'Contact direct officine'],
      sampleQuery: 'Pharmacie de garde ouverte ce soir',
      iconName: 'ShieldCheck',
    },
  ];

  const enriched = officialModules.map((m) => {
    const count = activeBusinesses.filter(
      (b) => b.module_code === m.code || b.enabled_modules?.includes(m.code)
    ).length;
    return {
      ...m,
      businessCount: count,
    };
  });

  const responsePayload = { success: true, data: enriched, count: enriched.length };
  cacheService.set('categories_list', responsePayload, 600, ['categories']);
  res.json(responsePayload);
});

// List active businesses (Public & Directory) with real ratings & open status
app.get('/api/v1/businesses', (req, res) => {
  const db = store.getDb();
  let list = db.businesses.filter((b) => b.status === 'ACTIVE');
  const moduleCode = req.query.module_code as string;
  const city = req.query.city as string;
  const district = req.query.district as string;
  const openOnly = req.query.open_now === 'true';
  const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
  const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
  const radiusKm = req.query.radius && req.query.radius !== 'all' ? parseFloat(req.query.radius as string) : undefined;
  const page = req.query.page;
  const limit = req.query.limit || req.query.page_size;

  const cacheKey = `biz_list_${moduleCode || 'all'}_${city || 'all'}_${district || 'all'}_${openOnly}_${lat || 'none'}_${lng || 'none'}_${radiusKm || 'all'}_${page || 'all'}_${limit || 'all'}`;
  const cached = cacheService.get<any>(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  if (moduleCode) {
    list = list.filter((b) => b.module_code === moduleCode || b.enabled_modules?.includes(moduleCode));
  }

  if (city) {
    list = list.filter((b) => b.city?.toLowerCase().includes(city.toLowerCase()));
  }

  if (district) {
    list = list.filter((b) => b.district?.toLowerCase().includes(district.toLowerCase()));
  }

  const enriched = list.map((b) => {
    const ratingSummary = store.calculateRating(b.id);
    const isOpen = isBusinessOpenNow(b);
    let distanceKm: number | undefined;
    let distanceFormatted: string | undefined;

    if (lat !== undefined && lng !== undefined && b.latitude && b.longitude) {
      distanceKm = Math.round(getHaversineDistance(lat, lng, b.latitude, b.longitude) * 10) / 10;
      distanceFormatted = distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`;
    }

    return {
      ...b,
      phone: '0154100617',
      whatsapp: '0154100617',
      is_open_now: isOpen,
      rating: ratingSummary.reviewCount > 0 ? ratingSummary.averageRating : null,
      review_count: ratingSummary.reviewCount,
      ratingSummary,
      distanceKm,
      distanceFormatted,
    };
  });

  let filtered = enriched;
  if (openOnly) {
    filtered = filtered.filter((b) => b.is_open_now);
  }

  if (radiusKm !== undefined) {
    filtered = filtered.filter((b) => b.distanceKm === undefined || b.distanceKm <= radiusKm);
  }

  if (lat !== undefined && lng !== undefined) {
    filtered.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
  }

  const paginated = paginateItems(filtered, page, limit);

  const responsePayload = {
    success: true,
    data: paginated.data,
    count: filtered.length,
    pagination: paginated.pagination,
  };

  cacheService.set(cacheKey, responsePayload, 120, ['businesses']);
  res.json(responsePayload);
});

// Get current business (Isolated tenant view)
app.get('/api/v1/businesses/my-business', (req, res) => {
  const auth = getRequestAuthContext(req);
  const businessId = auth.businessId;
  if (!businessId) {
    return res.status(403).json({ success: false, message: 'Accès refusé. Aucun établissement rattaché à cette session.' });
  }
  const db = store.getDb();
  const business = db.businesses.find((b) => b.id === businessId);
  if (!business) {
    return res.status(404).json({ success: false, message: 'Entreprise introuvable pour cette session.' });
  }
  const ratingSummary = store.calculateRating(business.id);
  res.json({
    success: true,
    data: {
      ...business,
      phone: '0154100617',
      whatsapp: '0154100617',
      is_open_now: isBusinessOpenNow(business),
      rating: ratingSummary.reviewCount > 0 ? ratingSummary.averageRating : null,
      review_count: ratingSummary.reviewCount,
    },
  });
});

// Public single business details with published catalog items and real ratings
app.get('/api/v1/businesses/:id', (req, res) => {
  const { id } = req.params;
  const db = store.getDb();
  const business = db.businesses.find((b) => b.id === id && b.status === 'ACTIVE');
  if (!business) {
    return res.status(404).json({ success: false, message: 'Entreprise non trouvée ou indisponible.' });
  }

  const ratingSummary = store.calculateRating(business.id);
  const catalogItems = (db.catalogItems || []).filter((item) => item.businessId === business.id && item.status === 'PUBLISHED');
  const reviews = (db.reviews || []).filter((r) => r.businessId === business.id && r.status === 'PUBLISHED');

  res.json({
    success: true,
    data: {
      ...business,
      phone: '0154100617',
      whatsapp: '0154100617',
      is_open_now: isBusinessOpenNow(business),
      rating: ratingSummary.reviewCount > 0 ? ratingSummary.averageRating : null,
      review_count: ratingSummary.reviewCount,
      ratingSummary,
      catalogItems,
      reviews,
    },
  });
});

// Update business details (Address, Geolocation, Phone, WhatsApp, Opening Hours)
app.patch('/api/v1/businesses/my-business', (req, res) => {
  const auth = getRequestAuthContext(req);
  const businessId = auth.businessId;
  if (!businessId) {
    return res.status(403).json({ success: false, message: 'Accès refusé. Aucun établissement rattaché à cette session.' });
  }
  const db = store.getDb();
  const business = db.businesses.find((b) => b.id === businessId);
  if (!business) {
    return res.status(404).json({ success: false, message: 'Entreprise introuvable.' });
  }

  const { name, phone, whatsapp, email, address, city, district, latitude, longitude, opening_hours, is_open_now, module_code } = req.body;

  if (name !== undefined) business.name = name;
  if (phone !== undefined) business.phone = phone;
  if (whatsapp !== undefined) business.whatsapp = whatsapp;
  if (email !== undefined) business.email = email;
  if (address !== undefined) business.address = address;
  if (city !== undefined) business.city = city;
  if (district !== undefined) business.district = district;
  if (latitude !== undefined) business.latitude = parseFloat(latitude);
  if (longitude !== undefined) business.longitude = parseFloat(longitude);
  if (opening_hours !== undefined) business.opening_hours = opening_hours;
  if (is_open_now !== undefined) business.is_open_now = Boolean(is_open_now);
  if (module_code !== undefined) {
    business.module_code = module_code;
    if (!business.enabled_modules.includes(module_code)) {
      business.enabled_modules.push(module_code);
    }
  }

  business.updatedAt = new Date().toISOString();
  store.commit();

  store.logAudit({
    userId: req.body.userId || 'pro-user',
    userEmail: business.email || 'pro@flowexa.com',
    action: 'BUSINESS_UPDATE',
    entityType: 'BUSINESS',
    entityId: business.id,
    description: `Mise à jour coordonnées et géolocalisation pour ${business.name}`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({ success: true, data: business, message: 'Informations de l\'entreprise mises à jour.' });
});

// Upload business photo
app.post('/api/v1/businesses/my-business/images', upload.single('image'), (req, res) => {
  const auth = getRequestAuthContext(req);
  const businessId = auth.businessId;
  if (!businessId) {
    return res.status(403).json({ success: false, message: 'Accès refusé. Aucun établissement rattaché à cette session.' });
  }
  const db = store.getDb();
  const business = db.businesses.find((b) => b.id === businessId);
  if (!business) {
    return res.status(404).json({ success: false, message: 'Entreprise introuvable.' });
  }

  // SPRINT B31 : Contrôle strict de l'isolation multi-tenant
  const tenantCheck = SecurityService.assertTenantAccess(auth, business.id, 'Upload photo établissement', req.ip);
  if (!tenantCheck.allowed) {
    return res.status(403).json({ success: false, message: tenantCheck.reason });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP - max 5MB).' });
  }

  // SPRINT B32: Validation stricte de l'image et optimisation du payload
  const imageValidation = ImageOptimizer.validateImage(req.file.path, req.file.mimetype, req.file.size);
  if (!imageValidation.valid) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_IMAGE_PAYLOAD',
      message: imageValidation.error,
    });
  }

  const title = (req.body.title as string) || 'Photo établissement';
  const isPrimary = req.body.isPrimary === 'true' || business.images.length === 0;

  if (isPrimary) {
    business.images.forEach((img) => (img.isPrimary = false));
  }

  const newImage = {
    id: `img-${Date.now()}`,
    url: `/uploads/${req.file.filename}`,
    title,
    isPrimary,
    order: business.images.length,
    optimized: imageValidation.optimized,
  };

  business.images.push(newImage);
  business.updatedAt = new Date().toISOString();
  store.commit();
  cacheService.invalidateTags(['businesses', 'nearby']);

  store.logAudit({
    userId: auth.userId || 'pro-user',
    userEmail: business.email || 'pro@flowexa.com',
    action: 'PHOTO_UPLOAD',
    entityType: 'BUSINESS_IMAGE',
    entityId: newImage.id,
    description: `Upload photo pour ${business.name}`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({ success: true, data: newImage, message: 'Photo ajoutée avec succès.' });
});

// Delete business photo
app.delete('/api/v1/businesses/my-business/images/:id', (req, res) => {
  const auth = getRequestAuthContext(req);
  const businessId = auth.businessId;
  if (!businessId) {
    return res.status(403).json({ success: false, message: 'Accès refusé. Aucun établissement rattaché à cette session.' });
  }
  const db = store.getDb();
  const business = db.businesses.find((b) => b.id === businessId);
  if (!business) {
    return res.status(404).json({ success: false, message: 'Entreprise introuvable.' });
  }

  // SPRINT B31 : Contrôle strict de l'isolation multi-tenant
  const tenantCheck = SecurityService.assertTenantAccess(auth, business.id, 'Suppression photo établissement', req.ip);
  if (!tenantCheck.allowed) {
    return res.status(403).json({ success: false, message: tenantCheck.reason });
  }

  const imgId = req.params.id;
  const initialLen = business.images.length;
  business.images = business.images.filter((img) => img.id !== imgId);

  if (business.images.length === initialLen) {
    return res.status(404).json({ success: false, message: 'Photo introuvable.' });
  }

  if (business.images.length > 0 && !business.images.some((img) => img.isPrimary)) {
    business.images[0].isPrimary = true;
  }

  business.updatedAt = new Date().toISOString();
  store.commit();

  res.json({ success: true, message: 'Photo supprimée.' });
});

// -------------------------------------------------------------
// SPRINT B11: CATALOG & PUBLICATION ENGINE (Common Architecture)
// -------------------------------------------------------------

// 1. Get Catalog Items (Tenant-isolated for Cockpit Pro OR Published-only for Public)
app.get('/api/v1/catalog/items', (req, res) => {
  const db = store.getDb();
  const auth = getRequestAuthContext(req);

  let businessId: string | undefined;
  let isProViewingOwnItems = false;

  if (auth.isAuthenticated) {
    if (auth.role === 'SUPER_ADMIN') {
      businessId = req.query.business_id as string;
      isProViewingOwnItems = true;
    } else if (auth.role === 'BUSINESS_OWNER' || auth.role === 'MANAGER' || auth.role === 'EMPLOYEE') {
      businessId = auth.businessId;
      isProViewingOwnItems = true;
    }
  }

  // Pour une requête publique ou un client consultant une vitrine
  if (!isProViewingOwnItems && req.query.business_id) {
    businessId = req.query.business_id as string;
  }
  const statusFilter = req.query.status as string; // 'DRAFT', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED', 'ALL'
  const availabilityFilter = req.query.availability as string; // 'AVAILABLE', 'UNAVAILABLE'
  const offerType = req.query.offer_type as string;
  const moduleCode = req.query.module_code as string;
  const categoryId = req.query.category_id as string;
  const search = (req.query.search as string || '').toLowerCase().trim();
  const lat = req.query.lat ? parseFloat(req.query.lat as string) : null;
  const lng = req.query.lng ? parseFloat(req.query.lng as string) : null;
  const page = req.query.page;
  const limit = req.query.limit || req.query.page_size;

  // Cache pour les requêtes publiques fréquentes
  const cacheKey = !isProViewingOwnItems && !businessId
    ? `catalog_pub_${statusFilter || 'all'}_${availabilityFilter || 'all'}_${offerType || 'all'}_${moduleCode || 'all'}_${categoryId || 'all'}_${search || 'all'}_${lat || 'none'}_${lng || 'none'}_${page || 'all'}_${limit || 'all'}`
    : null;

  if (cacheKey) {
    const cached = cacheService.get<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }
  }

  let items = db.catalogItems || [];

  // Tenant Isolation: If isProViewingOwnItems, restrict strictly to this business and allow drafts
  if (isProViewingOwnItems && businessId) {
    items = items.filter((item) => item.businessId === businessId);
    if (statusFilter && statusFilter !== 'ALL') {
      items = items.filter((item) => item.status === statusFilter);
    }
  } else if (businessId) {
    // Client or visitor viewing a specific business's public showcase
    items = items.filter((item) => item.businessId === businessId && item.status === 'PUBLISHED');
  } else {
    // Public directory mode: strictly return PUBLISHED items only
    items = items.filter((item) => item.status === 'PUBLISHED');
  }

  if (availabilityFilter && availabilityFilter !== 'ALL') {
    items = items.filter((item) => item.availability === availabilityFilter);
  }

  if (offerType && offerType !== 'ALL') {
    items = items.filter((item) => item.offerType === offerType);
  }

  if (moduleCode && moduleCode !== 'ALL') {
    items = items.filter((item) => item.moduleCode === moduleCode);
  }

  if (categoryId) {
    items = items.filter((item) => item.categoryId === categoryId);
  }

  if (search) {
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search) ||
        (item.city && item.city.toLowerCase().includes(search)) ||
        (item.district && item.district.toLowerCase().includes(search))
    );
  }

  // Pre-index businesses and categories into Maps for O(1) lookups
  const bizMap = new Map<string, BusinessEntity>();
  for (const b of db.businesses) {
    bizMap.set(b.id, b);
  }
  const catMap = new Map<string, CatalogCategoryEntity>();
  for (const c of db.catalogCategories || []) {
    catMap.set(c.id, c);
  }

  // Enrich with business details & distance
  const enriched = items.map((item) => {
    const parentBiz = bizMap.get(item.businessId);
    let distanceKm: number | undefined = undefined;
    let distanceFormatted: string | undefined = undefined;

    if (lat !== null && lng !== null) {
      const itemLat = item.hasOwnLocation && item.latitude ? item.latitude : parentBiz?.latitude || 6.3654;
      const itemLng = item.hasOwnLocation && item.longitude ? item.longitude : parentBiz?.longitude || 2.4183;
      const d = getHaversineDistance(lat, lng, itemLat, itemLng);
      distanceKm = Math.round(d * 10) / 10;
      distanceFormatted = d < 1 ? `${Math.round(d * 1000)} m` : `${distanceKm.toFixed(1)} km`;
    }

    const category = item.categoryId ? catMap.get(item.categoryId) : undefined;

    return {
      ...item,
      businessName: parentBiz?.name || 'Entreprise Partenaire',
      businessPhone: '0154100617',
      businessWhatsApp: '0154100617',
      categoryName: category?.name,
      distanceKm,
      distanceFormatted,
    };
  });

  const paginated = paginateItems(enriched, page, limit);

  const responsePayload = {
    success: true,
    data: paginated.data,
    count: enriched.length,
    businessId: businessId || null,
    pagination: paginated.pagination,
  };

  if (cacheKey) {
    cacheService.set(cacheKey, responsePayload, 180, ['catalog']);
  }

  res.json(responsePayload);
});

// 2. Get Single Catalog Item
app.get('/api/v1/catalog/items/:id', (req, res) => {
  const db = store.getDb();
  const item = (db.catalogItems || []).find((i) => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Offre introuvable dans le catalogue.' });
  }

  const parentBiz = db.businesses.find((b) => b.id === item.businessId);
  const category = (db.catalogCategories || []).find((c) => c.id === item.categoryId);
  const ratingSummary = store.calculateRating(undefined, item.id);

  res.json({
    success: true,
    data: {
      ...item,
      rating: ratingSummary.averageRating,
      reviewCount: ratingSummary.reviewCount,
      ratingSummary,
      businessName: parentBiz?.name || 'Entreprise Partenaire',
      businessPhone: '0154100617',
      businessWhatsApp: '0154100617',
      categoryName: category?.name,
    },
  });
});

// 3. Create Catalog Item
app.post('/api/v1/catalog/items', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }
  let businessId: string;
  if (auth.role === 'SUPER_ADMIN') {
    businessId = (req.body.businessId as string) || (req.query.business_id as string) || auth.businessId;
  } else if (auth.role === 'BUSINESS_OWNER' || auth.role === 'MANAGER' || auth.role === 'EMPLOYEE') {
    if (!auth.businessId) {
      return res.status(403).json({ success: false, message: 'Accès refusé. Aucun établissement rattaché.' });
    }
    if (req.body.businessId && req.body.businessId !== auth.businessId) {
      return res.status(403).json({ success: false, message: 'Violation d’isolation multi-tenant : création interdite pour un autre établissement.' });
    }
    businessId = auth.businessId;
  } else {
    return res.status(403).json({ success: false, message: 'Accès réservé aux professionnels.' });
  }
  const db = store.getDb();
  const business = db.businesses.find((b) => b.id === businessId);
  if (!business) {
    return res.status(404).json({ success: false, message: 'Entreprise introuvable pour ce catalogue.' });
  }

  // SPRINT B31 : Contrôle strict de l'isolation multi-tenant
  const tenantCheck = SecurityService.assertTenantAccess(auth, business.id, 'Création offre catalogue', req.ip);
  if (!tenantCheck.allowed) {
    return res.status(403).json({ success: false, message: tenantCheck.reason });
  }

  // SPRINT B25: Contrôle strict des quotas du plan d'abonnement
  const limitCheck = store.checkBusinessLimit(business.id, 'offers');
  if (!limitCheck.allowed) {
    return res.status(403).json({ success: false, message: limitCheck.reason, code: 'LIMIT_REACHED' });
  }

  const {
    title,
    description,
    price,
    currency,
    priceType,
    offerType,
    moduleCode,
    categoryId,
    availability,
    status,
    specs,
    hasOwnLocation,
    address,
    city,
    district,
    latitude,
    longitude,
    images,
  } = req.body;

  if (!title || price === undefined) {
    return res.status(400).json({ success: false, message: 'Le titre et le prix de l\'offre sont obligatoires.' });
  }

  const newItem: CatalogItemEntity = {
    id: `cat-item-${Date.now()}`,
    businessId: business.id,
    categoryId: categoryId || undefined,
    moduleCode: moduleCode || business.module_code || 'IMMOBILIER',
    offerType: offerType || 'BIEN',
    title: title.trim(),
    description: description ? description.trim() : '',
    price: Number(price) || 0,
    currency: currency || 'FCFA',
    priceType: priceType || 'FIXED',
    availability: availability || 'AVAILABLE',
    status: status || 'DRAFT',
    images: Array.isArray(images) ? images : [],
    specs: specs || {},
    hasOwnLocation: Boolean(hasOwnLocation),
    address: address || undefined,
    city: city || business.city || 'Cotonou',
    district: district || business.district || undefined,
    latitude: latitude ? parseFloat(latitude) : undefined,
    longitude: longitude ? parseFloat(longitude) : undefined,
    viewsCount: 0,
    inquiriesCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.catalogItems.unshift(newItem);
  store.commit();
  cacheService.invalidateTags(['catalog', 'nearby']);

  store.logAudit({
    userId: req.body.userId || 'pro-user',
    userEmail: business.email || 'pro@flowexa.com',
    action: 'CATALOG_ITEM_CREATE',
    entityType: 'CATALOG_ITEM',
    entityId: newItem.id,
    description: `Création de l'offre "${newItem.title}" (${newItem.price} ${newItem.currency} - ${newItem.status}) par ${business.name}`,
    ip: req.ip || '127.0.0.1',
  });

  res.status(201).json({
    success: true,
    data: newItem,
    message: `Offre "${newItem.title}" enregistrée avec succès (${newItem.status === 'PUBLISHED' ? 'Publiée' : 'Brouillon'}).`,
  });
});

// 4. Update Catalog Item
app.patch('/api/v1/catalog/items/:id', (req, res) => {
  const auth = getRequestAuthContext(req);
  const db = store.getDb();
  const item = (db.catalogItems || []).find((i) => i.id === req.params.id);

  if (!item) {
    return res.status(404).json({ success: false, message: 'Offre introuvable dans le catalogue.' });
  }

  // SPRINT B31 : Contrôle strict de l'isolation multi-tenant & IDOR
  const tenantCheck = SecurityService.assertTenantAccess(auth, item.businessId, `Modification de l'offre [${item.id}]`, req.ip);
  if (!tenantCheck.allowed) {
    return res.status(403).json({ success: false, message: tenantCheck.reason });
  }

  const {
    title,
    description,
    price,
    currency,
    priceType,
    offerType,
    categoryId,
    availability,
    status,
    specs,
    hasOwnLocation,
    address,
    city,
    district,
    latitude,
    longitude,
  } = req.body;

  if (title !== undefined) item.title = title.trim();
  if (description !== undefined) item.description = description.trim();
  if (price !== undefined) item.price = Number(price);
  if (currency !== undefined) item.currency = currency;
  if (priceType !== undefined) item.priceType = priceType;
  if (offerType !== undefined) item.offerType = offerType;
  if (categoryId !== undefined) item.categoryId = categoryId;
  if (availability !== undefined) item.availability = availability;
  if (status !== undefined) item.status = status;
  if (specs !== undefined) item.specs = { ...item.specs, ...specs };
  if (hasOwnLocation !== undefined) item.hasOwnLocation = Boolean(hasOwnLocation);
  if (address !== undefined) item.address = address;
  if (city !== undefined) item.city = city;
  if (district !== undefined) item.district = district;
  if (latitude !== undefined) item.latitude = parseFloat(latitude);
  if (longitude !== undefined) item.longitude = parseFloat(longitude);

  item.updatedAt = new Date().toISOString();
  store.commit();
  cacheService.invalidateTags(['catalog', 'nearby']);

  store.logAudit({
    userId: req.body.userId || 'pro-user',
    userEmail: 'pro@flowexa.com',
    action: 'CATALOG_ITEM_UPDATE',
    entityType: 'CATALOG_ITEM',
    entityId: item.id,
    description: `Mise à jour de l'offre "${item.title}" (${item.status})`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({ success: true, data: item, message: 'Offre mise à jour avec succès.' });
});

// 5. Delete Catalog Item
app.delete('/api/v1/catalog/items/:id', (req, res) => {
  const auth = getRequestAuthContext(req);
  const db = store.getDb();
  const itemIndex = (db.catalogItems || []).findIndex((i) => i.id === req.params.id);

  if (itemIndex === -1) {
    return res.status(404).json({ success: false, message: 'Offre introuvable.' });
  }

  const item = db.catalogItems[itemIndex];
  // SPRINT B31 : Contrôle strict de l'isolation multi-tenant & IDOR
  const tenantCheck = SecurityService.assertTenantAccess(auth, item.businessId, `Suppression de l'offre [${item.id}]`, req.ip);
  if (!tenantCheck.allowed) {
    return res.status(403).json({ success: false, message: tenantCheck.reason });
  }

  db.catalogItems.splice(itemIndex, 1);
  store.commit();
  cacheService.invalidateTags(['catalog', 'nearby']);

  store.logAudit({
    userId: 'pro-user',
    userEmail: 'pro@flowexa.com',
    action: 'CATALOG_ITEM_DELETE',
    entityType: 'CATALOG_ITEM',
    entityId: item.id,
    description: `Suppression de l'offre "${item.title}"`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({ success: true, message: `L'offre "${item.title}" a été supprimée avec succès.` });
});

// 6. Quick Publish / Unpublish / Availability Endpoints
app.post('/api/v1/catalog/items/:id/publish', (req, res) => {
  const auth = getRequestAuthContext(req);
  const db = store.getDb();
  const item = (db.catalogItems || []).find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Offre introuvable.' });

  // SPRINT B31 : Contrôle strict de l'isolation multi-tenant
  const tenantCheck = SecurityService.assertTenantAccess(auth, item.businessId, `Publication de l'offre [${item.id}]`, req.ip);
  if (!tenantCheck.allowed) {
    return res.status(403).json({ success: false, message: tenantCheck.reason });
  }

  // 1. Entreprise valide
  const business = db.businesses.find((b) => b.id === item.businessId);
  if (!business) {
    return res.status(422).json({
      success: false,
      message: 'Publication refusée : l’entreprise associée est introuvable.',
      field: 'businessId',
    });
  }
  if (business.status === 'SUSPENDED') {
    return res.status(403).json({
      success: false,
      message: 'Publication refusée : le compte de l’entreprise est suspendu.',
      field: 'businessStatus',
    });
  }

  // 3. Informations obligatoires
  if (!item.title || item.title.trim().length < 3) {
    return res.status(422).json({
      success: false,
      message: 'Publication refusée : le titre de l’offre doit comporter au moins 3 caractères.',
      field: 'title',
    });
  }

  // 4. Prix valide si nécessaire
  if (item.priceType !== 'CONTACT' && (typeof item.price !== 'number' || item.price <= 0)) {
    return res.status(422).json({
      success: false,
      message: 'Publication refusée : un prix supérieur à 0 FCFA est obligatoire (sauf si tarif sur devis).',
      field: 'price',
    });
  }

  // 5. Localisation si nécessaire
  if (item.hasOwnLocation) {
    if (!item.city || (!item.district && !item.address)) {
      return res.status(422).json({
        success: false,
        message: 'Publication refusée : la localisation propre à l’offre requiert au moins la ville et le quartier.',
        field: 'location',
      });
    }
  } else if (!business.city && !item.city) {
    return res.status(422).json({
      success: false,
      message: 'Publication refusée : aucune localisation géographique n’est définie pour cette offre ou votre établissement.',
      field: 'location',
    });
  }

  // 6. Validation photos
  if (!Array.isArray(item.images) || item.images.length === 0) {
    return res.status(422).json({
      success: false,
      message: 'Publication refusée : vous devez ajouter au moins une photo pour rendre l’offre visible sur Flowexa.',
      field: 'photos',
    });
  }

  // Ensure an image is marked as cover
  if (!item.images.some((img) => img.isCover)) {
    item.images[0].isCover = true;
  }

  item.status = 'PUBLISHED';
  item.updatedAt = new Date().toISOString();
  store.commit();

  store.logAudit({
    userId: 'pro-user',
    userEmail: business.email || 'pro@flowexa.com',
    action: 'CATALOG_PUBLISH',
    entityType: 'CATALOG_ITEM',
    entityId: item.id,
    description: `Publication réussie de l'offre "${item.title}" (${item.price} FCFA) par ${business.name}`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    data: item,
    message: `Offre "${item.title}" publiée avec succès ! Elle est désormais active et immédiatement visible dans la recherche Flowexa.`,
  });
});

app.post('/api/v1/catalog/items/:id/unpublish', (req, res) => {
  const auth = getRequestAuthContext(req);
  const db = store.getDb();
  const item = (db.catalogItems || []).find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Offre introuvable.' });

  // SPRINT B31 : Contrôle strict de l'isolation multi-tenant
  const tenantCheck = SecurityService.assertTenantAccess(auth, item.businessId, `Dépublication de l'offre [${item.id}]`, req.ip);
  if (!tenantCheck.allowed) {
    return res.status(403).json({ success: false, message: tenantCheck.reason });
  }

  item.status = 'UNPUBLISHED';
  item.updatedAt = new Date().toISOString();
  store.commit();

  res.json({ success: true, data: item, message: `Offre "${item.title}" dépubliée. Elle n'apparaît plus dans les résultats publics.` });
});

app.post('/api/v1/catalog/items/:id/toggle-availability', (req, res) => {
  const auth = getRequestAuthContext(req);
  const db = store.getDb();
  const item = (db.catalogItems || []).find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Offre introuvable.' });

  // SPRINT B31 : Contrôle strict de l'isolation multi-tenant
  const tenantCheck = SecurityService.assertTenantAccess(auth, item.businessId, `Disponibilité de l'offre [${item.id}]`, req.ip);
  if (!tenantCheck.allowed) {
    return res.status(403).json({ success: false, message: tenantCheck.reason });
  }

  item.availability = item.availability === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
  item.updatedAt = new Date().toISOString();
  store.commit();

  res.json({
    success: true,
    data: item,
    message: `Disponibilité de "${item.title}" mise à jour : ${item.availability === 'AVAILABLE' ? 'Disponible' : 'Indisponible'}.`,
  });
});

// 7. Catalog Item Photo Upload & Management
app.post('/api/v1/catalog/items/:id/images', upload.single('image'), (req, res) => {
  const auth = getRequestAuthContext(req);
  const db = store.getDb();
  const item = (db.catalogItems || []).find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Offre introuvable.' });

  // SPRINT B31 : Contrôle strict de l'isolation multi-tenant
  const tenantCheck = SecurityService.assertTenantAccess(auth, item.businessId, `Upload photo offre [${item.id}]`, req.ip);
  if (!tenantCheck.allowed) {
    return res.status(403).json({ success: false, message: tenantCheck.reason });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP - max 5MB).' });
  }

  // SPRINT B32: Validation stricte de l'image et optimisation du payload
  const imageValidation = ImageOptimizer.validateImage(req.file.path, req.file.mimetype, req.file.size);
  if (!imageValidation.valid) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_IMAGE_PAYLOAD',
      message: imageValidation.error,
    });
  }

  const isCover = req.body.isCover === 'true' || item.images.length === 0;
  if (isCover) {
    item.images.forEach((img) => (img.isCover = false));
  }

  const newImg = {
    id: `img-${Date.now()}`,
    url: `/uploads/${req.file.filename}`,
    title: (req.body.title as string) || item.title,
    isCover,
    order: item.images.length + 1,
    optimized: imageValidation.optimized,
  };

  item.images.push(newImg);
  item.updatedAt = new Date().toISOString();
  store.commit();
  cacheService.invalidateTags(['catalog', 'nearby']);

  res.json({ success: true, data: newImg, message: 'Photo ajoutée à la galerie de l\'offre.' });
});

app.delete('/api/v1/catalog/items/:id/images/:imageId', (req, res) => {
  const auth = getRequestAuthContext(req);
  const db = store.getDb();
  const item = (db.catalogItems || []).find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Offre introuvable.' });

  // SPRINT B31 : Contrôle strict de l'isolation multi-tenant
  const tenantCheck = SecurityService.assertTenantAccess(auth, item.businessId, `Suppression photo offre [${item.id}]`, req.ip);
  if (!tenantCheck.allowed) {
    return res.status(403).json({ success: false, message: tenantCheck.reason });
  }

  const initialLen = item.images.length;
  item.images = item.images.filter((img) => img.id !== req.params.imageId);

  if (item.images.length === initialLen) {
    return res.status(404).json({ success: false, message: 'Photo introuvable.' });
  }

  // If deleted was cover, set first as cover
  if (item.images.length > 0 && !item.images.some((img) => img.isCover)) {
    item.images[0].isCover = true;
  }

  item.updatedAt = new Date().toISOString();
  store.commit();

  res.json({ success: true, message: 'Photo retirée de la galerie.' });
});

app.patch('/api/v1/catalog/items/:id/images/:imageId/cover', (req, res) => {
  const auth = getRequestAuthContext(req);
  const db = store.getDb();
  const item = (db.catalogItems || []).find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Offre introuvable.' });

  // SPRINT B31 : Contrôle strict de l'isolation multi-tenant
  const tenantCheck = SecurityService.assertTenantAccess(auth, item.businessId, `Définition couverture offre [${item.id}]`, req.ip);
  if (!tenantCheck.allowed) {
    return res.status(403).json({ success: false, message: tenantCheck.reason });
  }

  const target = item.images.find((img) => img.id === req.params.imageId);
  if (!target) return res.status(404).json({ success: false, message: 'Photo introuvable.' });

  item.images.forEach((img) => (img.isCover = false));
  target.isCover = true;
  item.updatedAt = new Date().toISOString();
  store.commit();

  res.json({ success: true, message: 'Photo définie comme image principale (couverture).' });
});

// 8. Categories CRUD
app.get('/api/v1/catalog/categories', (req, res) => {
  const auth = getRequestAuthContext(req);
  const requestedBusinessId = (req.query.business_id as string) || (req.query.businessId as string);
  const db = store.getDb();
  let cats = db.catalogCategories || [];
  if (auth.isAuthenticated && (auth.role === 'BUSINESS_OWNER' || auth.role === 'MANAGER' || auth.role === 'EMPLOYEE')) {
    if (requestedBusinessId && requestedBusinessId !== auth.businessId) {
      return res.status(403).json({ success: false, message: 'Accès refusé. Isolation multi-tenant.' });
    }
    cats = cats.filter((c) => c.businessId === auth.businessId);
  } else if (requestedBusinessId) {
    cats = cats.filter((c) => c.businessId === requestedBusinessId);
  }
  res.json({ success: true, data: cats, count: cats.length });
});

app.post('/api/v1/catalog/categories', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }
  let businessId: string;
  if (auth.role === 'SUPER_ADMIN') {
    businessId = (req.body.businessId as string) || (req.query.business_id as string) || auth.businessId;
  } else if (auth.role === 'BUSINESS_OWNER' || auth.role === 'MANAGER' || auth.role === 'EMPLOYEE') {
    if (!auth.businessId) {
      return res.status(403).json({ success: false, message: 'Accès refusé. Aucun établissement rattaché.' });
    }
    if (req.body.businessId && req.body.businessId !== auth.businessId) {
      return res.status(403).json({ success: false, message: 'Violation d’isolation multi-tenant.' });
    }
    businessId = auth.businessId;
  } else {
    return res.status(403).json({ success: false, message: 'Accès réservé aux professionnels.' });
  }
  const db = store.getDb();
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Nom de la catégorie obligatoire.' });

  const newCat = {
    id: `cat-${Date.now()}`,
    businessId,
    name: name.trim(),
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    order: (db.catalogCategories || []).length + 1,
  };

  db.catalogCategories.push(newCat);
  store.commit();

  res.status(201).json({ success: true, data: newCat, message: 'Catégorie créée.' });
});

app.delete('/api/v1/catalog/categories/:id', (req, res) => {
  const db = store.getDb();
  db.catalogCategories = (db.catalogCategories || []).filter((c) => c.id !== req.params.id);
  store.commit();
  res.json({ success: true, message: 'Catégorie supprimée.' });
});

// -------------------------------------------------------------
// 2. IMMOBILIER (Properties CRUD) - Strictly Isolated by Business
// -------------------------------------------------------------

app.get('/api/v1/properties', (req, res) => {
  const auth = getRequestAuthContext(req);
  const requestedBusinessId = (req.query.business_id as string) || (req.query.businessId as string);
  const db = store.getDb();
  let list = db.properties;

  if (auth.isAuthenticated && (auth.role === 'BUSINESS_OWNER' || auth.role === 'MANAGER' || auth.role === 'EMPLOYEE')) {
    if (requestedBusinessId && requestedBusinessId !== auth.businessId) {
      return res.status(403).json({ success: false, message: 'Accès refusé. Isolation multi-tenant.' });
    }
    list = list.filter((p) => p.businessId === auth.businessId);
  } else if (requestedBusinessId) {
    list = list.filter((p) => p.businessId === requestedBusinessId);
  } else {
    // If public directory query, only show published
    list = list.filter((p) => p.isPublished);
  }
  res.json({ success: true, data: list, count: list.length });
});

app.post('/api/v1/properties', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }

  let businessId: string;
  if (auth.role === 'SUPER_ADMIN') {
    businessId = (req.body.businessId as string) || (req.query.business_id as string) || auth.businessId;
  } else if (auth.role === 'BUSINESS_OWNER' || auth.role === 'MANAGER' || auth.role === 'EMPLOYEE') {
    if (!auth.businessId) {
      return res.status(403).json({ success: false, message: 'Accès refusé. Aucun établissement rattaché.' });
    }
    if (req.body.businessId && req.body.businessId !== auth.businessId) {
      return res.status(403).json({ success: false, message: 'Violation d’isolation multi-tenant.' });
    }
    businessId = auth.businessId;
  } else {
    return res.status(403).json({ success: false, message: 'Accès réservé aux professionnels.' });
  }

  const db = store.getDb();
  const business = db.businesses.find((b) => b.id === businessId);
  if (!business) {
    return res.status(404).json({ success: false, message: 'Entreprise immobilière introuvable.' });
  }

  const {
    title,
    category,
    typeTransaction,
    price,
    pricePeriod,
    address,
    city,
    district,
    latitude,
    longitude,
    surface,
    rooms,
    bedrooms,
    bathrooms,
    description,
    status,
    isPublished,
    amenities,
    images,
  } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'Le titre du bien est requis.' });
  }

  const newProp: PropertyEntity = {
    id: `prop-${Date.now()}`,
    businessId: business.id,
    title,
    category: category || 'Appartement',
    typeTransaction: typeTransaction || 'Location',
    price: Number(price) || 0,
    pricePeriod: pricePeriod || 'mois',
    address: address || business.address,
    city: city || business.city,
    district: district || business.district,
    latitude: latitude ? parseFloat(latitude) : business.latitude,
    longitude: longitude ? parseFloat(longitude) : business.longitude,
    surface: Number(surface) || 0,
    rooms: Number(rooms) || 0,
    bedrooms: Number(bedrooms) || 0,
    bathrooms: Number(bathrooms) || 0,
    description: description || '',
    status: status || 'Disponible',
    isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
    amenities: Array.isArray(amenities) ? amenities : [],
    images: Array.isArray(images) ? images : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.properties.unshift(newProp);
  store.commit();

  store.logAudit({
    userId: 'pro-user',
    userEmail: business.email || 'pro@flowexa.com',
    action: 'PROPERTY_CREATE',
    entityType: 'PROPERTY',
    entityId: newProp.id,
    description: `Création du bien "${newProp.title}" (${newProp.price} FCFA) dans ${business.name}`,
    ip: req.ip || '127.0.0.1',
  });

  res.status(201).json({ success: true, data: newProp, message: 'Bien immobilier enregistré avec succès.' });
});

app.patch('/api/v1/properties/:id', (req, res) => {
  const db = store.getDb();
  const prop = db.properties.find((p) => p.id === req.params.id);
  if (!prop) {
    return res.status(404).json({ success: false, message: 'Bien immobilier introuvable.' });
  }

  Object.assign(prop, req.body);
  prop.updatedAt = new Date().toISOString();
  store.commit();

  res.json({ success: true, data: prop, message: 'Bien immobilier mis à jour.' });
});

app.delete('/api/v1/properties/:id', (req, res) => {
  const db = store.getDb();
  const initialLen = db.properties.length;
  db.properties = db.properties.filter((p) => p.id !== req.params.id);
  if (db.properties.length === initialLen) {
    return res.status(404).json({ success: false, message: 'Bien introuvable.' });
  }
  store.commit();
  res.json({ success: true, message: 'Bien supprimé avec succès.' });
});

// -------------------------------------------------------------
// 3. GUEST HOUSE (Rooms & Bookings) - Strictly Isolated
// -------------------------------------------------------------

app.get('/api/v1/rooms', (req, res) => {
  const auth = getRequestAuthContext(req);
  const requestedBusinessId = (req.query.business_id as string) || (req.query.businessId as string);
  const db = store.getDb();
  let list = db.rooms;

  if (auth.isAuthenticated && (auth.role === 'BUSINESS_OWNER' || auth.role === 'MANAGER' || auth.role === 'EMPLOYEE')) {
    if (requestedBusinessId && requestedBusinessId !== auth.businessId) {
      return res.status(403).json({ success: false, message: 'Accès refusé. Isolation multi-tenant.' });
    }
    list = list.filter((r) => r.businessId === auth.businessId);
  } else if (requestedBusinessId) {
    list = list.filter((r) => r.businessId === requestedBusinessId);
  }
  res.json({ success: true, data: list, count: list.length });
});

app.post('/api/v1/rooms', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }

  let businessId: string;
  if (auth.role === 'SUPER_ADMIN') {
    businessId = (req.body.businessId as string) || (req.query.business_id as string) || auth.businessId;
  } else if (auth.role === 'BUSINESS_OWNER' || auth.role === 'MANAGER' || auth.role === 'EMPLOYEE') {
    if (!auth.businessId) {
      return res.status(403).json({ success: false, message: 'Accès refusé. Aucun établissement rattaché.' });
    }
    if (req.body.businessId && req.body.businessId !== auth.businessId) {
      return res.status(403).json({ success: false, message: 'Violation d’isolation multi-tenant.' });
    }
    businessId = auth.businessId;
  } else {
    return res.status(403).json({ success: false, message: 'Accès réservé aux professionnels.' });
  }

  const db = store.getDb();
  const business = db.businesses.find((b) => b.id === businessId);
  if (!business) {
    return res.status(404).json({ success: false, message: 'Guest House introuvable.' });
  }

  const { roomNumber, name, category, pricePerNight, capacity, status, amenities, description, isPublished, images } = req.body;

  if (!name || !roomNumber) {
    return res.status(400).json({ success: false, message: 'Le numéro et le nom de la chambre sont obligatoires.' });
  }

  const newRoom: RoomEntity = {
    id: `room-${Date.now()}`,
    businessId: business.id,
    roomNumber,
    name,
    category: category || 'Chambre Standard',
    pricePerNight: Number(pricePerNight) || 0,
    capacity: Number(capacity) || 2,
    status: status || 'Disponible',
    amenities: Array.isArray(amenities) ? amenities : [],
    description: description || '',
    isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
    images: Array.isArray(images) ? images : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.rooms.push(newRoom);
  store.commit();

  store.logAudit({
    userId: 'pro-user',
    userEmail: business.email || 'gh@flowexa.com',
    action: 'ROOM_CREATE',
    entityType: 'ROOM',
    entityId: newRoom.id,
    description: `Ajout chambre ${newRoom.roomNumber} - ${newRoom.name} (${newRoom.pricePerNight} FCFA)`,
    ip: req.ip || '127.0.0.1',
  });

  res.status(201).json({ success: true, data: newRoom, message: 'Chambre enregistrée avec succès.' });
});

app.patch('/api/v1/rooms/:id', (req, res) => {
  const db = store.getDb();
  const room = db.rooms.find((r) => r.id === req.params.id);
  if (!room) {
    return res.status(404).json({ success: false, message: 'Chambre introuvable.' });
  }

  Object.assign(room, req.body);
  room.updatedAt = new Date().toISOString();
  store.commit();

  res.json({ success: true, data: room, message: 'Chambre mise à jour.' });
});

app.delete('/api/v1/rooms/:id', (req, res) => {
  const db = store.getDb();
  const initialLen = db.rooms.length;
  db.rooms = db.rooms.filter((r) => r.id !== req.params.id);
  if (db.rooms.length === initialLen) {
    return res.status(404).json({ success: false, message: 'Chambre introuvable.' });
  }
  store.commit();
  res.json({ success: true, message: 'Chambre supprimée avec succès.' });
});

// Bookings
app.get('/api/v1/bookings', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }

  const requestedBusinessId = (req.query.business_id as string) || (req.query.businessId as string);
  const db = store.getDb();
  let list = db.bookings || [];

  if (auth.role === 'SUPER_ADMIN') {
    if (requestedBusinessId) {
      list = list.filter((b) => b.businessId === requestedBusinessId);
    }
  } else if (auth.role === 'BUSINESS_OWNER' || auth.role === 'MANAGER' || auth.role === 'EMPLOYEE') {
    if (!auth.businessId) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Aucun établissement rattaché à ce compte professionnel.',
      });
    }
    if (requestedBusinessId && requestedBusinessId !== auth.businessId) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous ne pouvez consulter que les réservations de votre propre établissement.',
      });
    }
    list = list.filter((b) => b.businessId === auth.businessId);
  } else {
    // CLIENT : filtré par l'identité du client depuis le JWT, jamais par un id libre
    if (!auth.userId && !auth.clientPhone) {
      return res.status(403).json({ success: false, message: 'Identité client manquante.' });
    }
    list = list.filter((b) => (b.clientId && b.clientId === auth.userId) || (auth.clientPhone && b.clientPhone === auth.clientPhone));
  }

  res.json({ success: true, data: list, count: list.length });
});

app.post('/api/v1/bookings', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }

  let businessId: string;
  if (auth.role === 'SUPER_ADMIN') {
    businessId = (req.body.businessId as string) || (req.query.business_id as string) || auth.businessId;
  } else if (auth.role === 'BUSINESS_OWNER' || auth.role === 'MANAGER' || auth.role === 'EMPLOYEE') {
    if (!auth.businessId) {
      return res.status(403).json({ success: false, message: 'Accès refusé. Aucun établissement rattaché.' });
    }
    if (req.body.businessId && req.body.businessId !== auth.businessId) {
      return res.status(403).json({
        success: false,
        message: 'Violation d’isolation multi-tenant : vous ne pouvez pas créer de réservation pour un autre établissement.',
      });
    }
    businessId = auth.businessId;
  } else {
    businessId = req.body.businessId as string;
    if (!businessId) {
      return res.status(400).json({ success: false, message: 'Identifiant de l’établissement requis.' });
    }
  }

  const db = store.getDb();
  const business = db.businesses.find((b) => b.id === businessId);
  if (!business) {
    return res.status(404).json({ success: false, message: 'Établissement introuvable.' });
  }

  const { roomId, roomName, clientName, clientPhone, checkIn, checkOut, guestsCount, totalAmount, paymentStatus, status } = req.body;

  const resolvedCheckIn = checkIn || new Date().toISOString().split('T')[0];
  const resolvedCheckOut = checkOut || new Date().toISOString().split('T')[0];

  // SPRINT B32: Verrou atomique contre la concurrence de requêtes simultanées
  const lockKey = `booking_${roomId || 'gen'}_${resolvedCheckIn}_${resolvedCheckOut}`;
  const lockOwner = `${req.ip || '127.0.0.1'}_${Date.now()}`;
  if (!concurrencyManager.acquireLock(lockKey, lockOwner, 8000)) {
    return res.status(409).json({
      success: false,
      code: 'CONCURRENT_BOOKING_LOCKED',
      message: 'Ce créneau ou cette chambre est actuellement en cours de réservation. Veuillez patienter un instant.',
    });
  }

  try {
    // SPRINT B32: Détection stricte de collision de réservation (double-booking)
    if (roomId) {
      const collision = db.bookings.find((b) => {
        if (b.roomId !== roomId || b.status === 'Annulée') return false;
        // Chevauchement d'intervalles de dates [checkIn, checkOut]
        return !(resolvedCheckOut <= b.checkIn || resolvedCheckIn >= b.checkOut);
      });

      if (collision) {
        return res.status(409).json({
          success: false,
          code: 'ROOM_ALREADY_BOOKED',
          message: `La chambre "${roomName || roomId}" est déjà réservée du ${collision.checkIn} au ${collision.checkOut}.`,
        });
      }
    }

    const newBooking: BookingEntity = {
      id: `book-${Date.now()}`,
      businessId,
      roomId: roomId || '',
      roomName: roomName || 'Chambre',
      clientName: clientName || 'Client',
      clientPhone: clientPhone || '',
      checkIn: resolvedCheckIn,
      checkOut: resolvedCheckOut,
      guestsCount: Number(guestsCount) || 1,
      totalAmount: Number(totalAmount) || 0,
      paymentStatus: paymentStatus || 'En attente',
      status: status || 'Confirmée',
      createdAt: new Date().toISOString(),
    };

    db.bookings.unshift(newBooking);
    store.commit();

    cacheService.invalidateTag('stats');

    res.status(201).json({ success: true, data: newBooking, message: 'Réservation enregistrée.' });
  } finally {
    concurrencyManager.releaseLock(lockKey, lockOwner);
  }
});

// -------------------------------------------------------------
// 4. SERVICES (Coiffure, Barbier, Institut, Spa, Photo, Broderie, Garage, Pharmacie)
// -------------------------------------------------------------

app.get('/api/v1/services', (req, res) => {
  const auth = getRequestAuthContext(req);
  const requestedBusinessId = (req.query.business_id as string) || (req.query.businessId as string);
  const moduleCode = req.query.module_code as string;
  const db = store.getDb();
  let list = db.services || [];

  if (auth.isAuthenticated && (auth.role === 'BUSINESS_OWNER' || auth.role === 'MANAGER' || auth.role === 'EMPLOYEE')) {
    if (!auth.businessId) {
      return res.status(403).json({ success: false, message: 'Accès refusé. Aucun établissement rattaché.' });
    }
    if (requestedBusinessId && requestedBusinessId !== auth.businessId) {
      return res.status(403).json({
        success: false,
        message: 'Violation d’isolation multi-tenant : vous ne pouvez pas accéder aux prestations d’un autre établissement.',
      });
    }
    list = list.filter((s) => s.businessId === auth.businessId);
  } else if (auth.role === 'SUPER_ADMIN') {
    if (requestedBusinessId) {
      list = list.filter((s) => s.businessId === requestedBusinessId);
    }
  } else if (requestedBusinessId) {
    list = list.filter((s) => s.businessId === requestedBusinessId);
  }

  if (moduleCode) {
    list = list.filter((s) => s.moduleCode === moduleCode);
  }
  res.json({ success: true, data: list, count: list.length });
});

app.post('/api/v1/services', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }

  let businessId: string;
  if (auth.role === 'SUPER_ADMIN') {
    businessId = (req.body.businessId as string) || (req.query.business_id as string) || auth.businessId;
  } else if (auth.role === 'BUSINESS_OWNER' || auth.role === 'MANAGER' || auth.role === 'EMPLOYEE') {
    if (!auth.businessId) {
      return res.status(403).json({ success: false, message: 'Accès refusé. Aucun établissement rattaché.' });
    }
    if (req.body.businessId && req.body.businessId !== auth.businessId) {
      return res.status(403).json({
        success: false,
        message: 'Violation d’isolation multi-tenant : vous ne pouvez pas créer de prestation pour un autre établissement.',
      });
    }
    businessId = auth.businessId;
  } else {
    return res.status(403).json({ success: false, message: 'Accès réservé aux professionnels.' });
  }

  const db = store.getDb();
  const business = db.businesses.find((b) => b.id === businessId);
  if (!business) {
    return res.status(404).json({ success: false, message: 'Entreprise introuvable.' });
  }

  // SPRINT B31 : Contrôle strict de l'isolation multi-tenant
  const tenantCheck = SecurityService.assertTenantAccess(auth, business.id, 'Ajout prestation de service', req.ip);
  if (!tenantCheck.allowed) {
    return res.status(403).json({ success: false, message: tenantCheck.reason });
  }

  // SPRINT B25: Contrôle strict des quotas du plan d'abonnement
  const limitCheck = store.checkBusinessLimit(business.id, 'services');
  if (!limitCheck.allowed) {
    return res.status(403).json({ success: false, message: limitCheck.reason, code: 'LIMIT_REACHED' });
  }

  const { name, category, price, durationMinutes, description, isActive, images, moduleCode } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Le nom de la prestation est requis.' });
  }

  const newService: ServiceEntity = {
    id: `srv-${Date.now()}`,
    businessId: business.id,
    moduleCode: moduleCode || business.module_code,
    name,
    category: category || 'Général',
    price: Number(price) || 0,
    durationMinutes: Number(durationMinutes) || 45,
    description: description || '',
    isActive: isActive !== undefined ? Boolean(isActive) : true,
    images: Array.isArray(images) ? images : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.services.push(newService);
  store.commit();
  cacheService.invalidateTags(['services', 'nearby', 'catalog']);

  store.logAudit({
    userId: 'pro-user',
    userEmail: business.email || 'pro@flowexa.com',
    action: 'SERVICE_CREATE',
    entityType: 'SERVICE',
    entityId: newService.id,
    description: `Ajout prestation "${newService.name}" (${newService.price} FCFA) par ${business.name}`,
    ip: req.ip || '127.0.0.1',
  });

  res.status(201).json({ success: true, data: newService, message: 'Prestation enregistrée avec succès.' });
});

const handleUpdateService = (req: express.Request, res: express.Response) => {
  const auth = getRequestAuthContext(req);
  const db = store.getDb();
  const srv = db.services.find((s) => s.id === req.params.id);
  if (!srv) {
    return res.status(404).json({ success: false, message: 'Prestation introuvable.' });
  }

  // SPRINT B31 : Contrôle strict de l'isolation multi-tenant & IDOR
  const tenantCheck = SecurityService.assertTenantAccess(auth, srv.businessId, `Modification prestation [${srv.id}]`, req.ip);
  if (!tenantCheck.allowed) {
    return res.status(403).json({ success: false, message: tenantCheck.reason });
  }

  Object.assign(srv, req.body);
  srv.updatedAt = new Date().toISOString();
  store.commit();
  cacheService.invalidateTags(['services', 'nearby', 'catalog']);

  store.logAudit({
    userId: auth.userId || 'pro-user',
    userEmail: auth.userEmail || 'pro@flowexa.com',
    action: 'SERVICE_UPDATE',
    entityType: 'SERVICE',
    entityId: srv.id,
    description: `Modification prestation "${srv.name}"`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({ success: true, data: srv, message: 'Prestation mise à jour.' });
};

app.patch('/api/v1/services/:id', handleUpdateService);
app.put('/api/v1/services/:id', handleUpdateService);

app.delete('/api/v1/services/:id', (req, res) => {
  const auth = getRequestAuthContext(req);
  const db = store.getDb();
  const srv = db.services.find((s) => s.id === req.params.id);
  if (!srv) {
    return res.status(404).json({ success: false, message: 'Prestation introuvable.' });
  }

  // SPRINT B31 : Contrôle strict de l'isolation multi-tenant & IDOR
  const tenantCheck = SecurityService.assertTenantAccess(auth, srv.businessId, `Suppression prestation [${srv.id}]`, req.ip);
  if (!tenantCheck.allowed) {
    return res.status(403).json({ success: false, message: tenantCheck.reason });
  }

  db.services = db.services.filter((s) => s.id !== req.params.id);
  store.commit();
  cacheService.invalidateTags(['services', 'nearby', 'catalog']);

  store.logAudit({
    userId: auth.userId || 'pro-user',
    userEmail: auth.userEmail || 'pro@flowexa.com',
    action: 'SERVICE_DELETE',
    entityType: 'SERVICE',
    entityId: srv.id,
    description: `Suppression prestation "${srv.name}"`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({ success: true, message: 'Prestation supprimée avec succès.' });
});

// -------------------------------------------------------------
// 5. GEOLOCATION & PROXIMITY SEARCH (Haversine Formula)
// -------------------------------------------------------------

app.get('/api/v1/search/nearby', (req, res) => {
  const db = store.getDb();
  const lat = req.query.lat ? parseFloat(req.query.lat as string) : 6.3654;
  const lng = req.query.lng ? parseFloat(req.query.lng as string) : 2.4183;
  const radiusParam = req.query.radius as string; // '0.5', '1', '2', '5', '10', 'all'
  const radiusKm = radiusParam && radiusParam !== 'all' ? parseFloat(radiusParam) : null;
  const moduleCode = req.query.module_code as string;
  const openOnly = req.query.open_now === 'true';
  const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
  const limit = req.query.limit || req.query.page_size ? parseInt((req.query.limit || req.query.page_size) as string, 10) : undefined;

  // SPRINT B32: Cache géolocalisé court (30s) basé sur coordonnées arrondies à 3 décimales (~100m)
  const cacheKey = `nearby_${lat.toFixed(3)}_${lng.toFixed(3)}_${radiusKm || 'all'}_${moduleCode || 'all'}_${openOnly}_${page || 'all'}_${limit || 'all'}`;
  const cachedResult = cacheService.get<any>(cacheKey);
  if (cachedResult) {
    return res.json(cachedResult);
  }

  let businesses = db.businesses.filter((b) => b.status === 'ACTIVE');

  if (moduleCode) {
    businesses = businesses.filter(
      (b) => b.module_code === moduleCode || b.enabled_modules?.includes(moduleCode)
    );
  }

  if (openOnly) {
    businesses = businesses.filter((b) => isBusinessOpenNow(b));
  }

  // Filtrage préalable ultra-rapide par boîte englobante (AABB) si un rayon est spécifié
  if (radiusKm !== null) {
    businesses = businesses.filter((b) => isWithinBoundingBox(lat, lng, b.latitude, b.longitude, radiusKm));
  }

  // Calcul Haversine précis uniquement sur les éléments dans la boîte englobante
  const withDistance = businesses.map((b) => {
    const dist = getHaversineDistance(lat, lng, b.latitude, b.longitude);
    const ratingSummary = store.calculateRating(b.id);
    return {
      business: {
        ...b,
        phone: '0154100617',
        whatsapp: '0154100617',
        is_open_now: isBusinessOpenNow(b),
        rating: ratingSummary.reviewCount > 0 ? ratingSummary.averageRating : null,
        review_count: ratingSummary.reviewCount,
        ratingSummary,
      },
      distanceKm: Math.round(dist * 10) / 10,
      distanceMeters: Math.round(dist * 1000),
      distanceFormatted: dist < 1 ? `${Math.round(dist * 1000)} m` : `${(Math.round(dist * 10) / 10).toFixed(1)} km`,
    };
  });

  let filteredBusinesses = withDistance;
  if (radiusKm !== null) {
    filteredBusinesses = withDistance.filter((item) => item.distanceKm <= radiusKm);
  }
  filteredBusinesses.sort((a, b) => a.distanceKm - b.distanceKm);

  // Proximité pour les articles de catalogue publiés
  let catalogItems = (db.catalogItems || []).filter((item) => item.status === 'PUBLISHED');
  if (moduleCode) {
    catalogItems = catalogItems.filter(
      (i) => i.moduleCode === moduleCode
    );
  }

  // Indexation O(1) des entreprises actives pour éviter un find() O(N) à chaque itération
  const activeBizMap = new Map<string, BusinessEntity>();
  for (const b of db.businesses) {
    if (b.status === 'ACTIVE') {
      activeBizMap.set(b.id, b);
    }
  }

  const catalogWithDistance = catalogItems
    .map((item) => {
      const parentBiz = activeBizMap.get(item.businessId);
      if (!parentBiz) return null;
      const isOpen = isBusinessOpenNow(parentBiz);
      if (openOnly && !isOpen) return null;

      const itemLat = item.hasOwnLocation && item.latitude ? item.latitude : parentBiz?.latitude || 6.3654;
      const itemLng = item.hasOwnLocation && item.longitude ? item.longitude : parentBiz?.longitude || 2.4183;

      // Filtrage rapide par Bounding Box
      if (radiusKm !== null && !isWithinBoundingBox(lat, lng, itemLat, itemLng, radiusKm)) {
        return null;
      }

      const dist = getHaversineDistance(lat, lng, itemLat, itemLng);
      if (radiusKm !== null && dist > radiusKm) return null;

      const ratingSummary = store.calculateRating(parentBiz.id, item.id);

      return {
        ...item,
        businessName: parentBiz?.name || 'Entreprise Partenaire',
        businessPhone: '0154100617',
        businessWhatsApp: '0154100617',
        is_open_now: isOpen,
        rating: ratingSummary.reviewCount > 0 ? ratingSummary.averageRating : null,
        reviewCount: ratingSummary.reviewCount,
        ratingSummary,
        distanceKm: Math.round(dist * 10) / 10,
        distanceMeters: Math.round(dist * 1000),
        distanceFormatted: dist < 1 ? `${Math.round(dist * 1000)} m` : `${(Math.round(dist * 10) / 10).toFixed(1)} km`,
        effectiveLocation: {
          isItemSpecific: Boolean(item.hasOwnLocation),
          address: item.hasOwnLocation ? item.address : parentBiz?.address,
          district: item.hasOwnLocation ? item.district : parentBiz?.district,
          city: item.hasOwnLocation ? item.city : parentBiz?.city,
          latitude: itemLat,
          longitude: itemLng,
        },
      };
    })
    .filter(Boolean) as any[];

  catalogWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);

  // Pagination standardisée si demandée
  const paginatedBusinesses = paginateItems(filteredBusinesses, page, limit);
  const paginatedCatalog = paginateItems(catalogWithDistance, page, limit);

  const responsePayload = {
    success: true,
    data: paginatedBusinesses.data,
    catalogItems: paginatedCatalog.data,
    count: filteredBusinesses.length,
    catalogCount: catalogWithDistance.length,
    clientLocation: { lat, lng },
    radiusKm,
    pagination: paginatedBusinesses.pagination,
    ...(filteredBusinesses.length === 0 && catalogWithDistance.length === 0
      ? {
          message: 'Aucun résultat disponible pour le moment.',
          suggestion: 'Élargissez la zone de recherche ou sélectionnez un autre rayon.',
        }
      : {}),
  };

  // Mettre en cache pour 30s avec tag 'nearby'
  cacheService.set(cacheKey, responsePayload, 30, ['nearby', 'businesses', 'catalog']);

  res.json(responsePayload);
});

// -------------------------------------------------------------
// UNIFIED SEARCH ENGINE (GET /api/v1/search)
// -------------------------------------------------------------
app.get('/api/v1/search', (req, res) => {
  const q = (req.query.q as string || '').trim();
  const moduleCode = (req.query.module_code as string || req.query.category as string || '').trim();
  const city = (req.query.city as string || '').trim();
  const district = (req.query.district as string || '').trim();
  const minPrice = req.query.min_price ? parseFloat(req.query.min_price as string) : undefined;
  const maxPrice = req.query.max_price ? parseFloat(req.query.max_price as string) : undefined;
  const openOnly = req.query.open_now === 'true';
  const availableToday = req.query.available_today === 'true';
  const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
  const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
  const radiusParam = req.query.radius as string;
  const radiusKm = radiusParam && radiusParam !== 'all' ? parseFloat(radiusParam) : undefined;
  const sort = (req.query.sort as string) || 'relevance'; // relevance | distance | price_asc | price_desc | rating
  const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
  const limit = Math.max(1, Math.min(50, parseInt(req.query.limit as string || '20', 10)));

  // Run natural language search service with explanations
  const searchResult = aiService.search.searchWithExplanations(q, {
    clientLat: lat,
    clientLng: lng,
    radiusKm,
    openNow: openOnly,
    availableToday,
    limit: 100,
  });

  let items = searchResult.recommendations;

  // Apply explicit query filters if provided
  if (moduleCode) {
    items = items.filter((i) => i.moduleCode === moduleCode);
  }
  if (city) {
    items = items.filter((i) => i.city?.toLowerCase().includes(city.toLowerCase()));
  }
  if (district) {
    items = items.filter((i) => i.district?.toLowerCase().includes(district.toLowerCase()));
  }
  if (minPrice !== undefined) {
    items = items.filter((i) => i.price >= minPrice);
  }
  if (maxPrice !== undefined) {
    items = items.filter((i) => i.price <= maxPrice);
  }
  if (openOnly) {
    items = items.filter((i) => i.isOpenNow);
  }
  if (availableToday) {
    items = items.filter((i) => i.availableToday);
  }

  // Sorting
  if (sort === 'distance' && lat !== undefined && lng !== undefined) {
    items.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
  } else if (sort === 'price_asc') {
    items.sort((a, b) => a.price - b.price);
  } else if (sort === 'price_desc') {
    items.sort((a, b) => b.price - a.price);
  } else if (sort === 'rating') {
    items.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  } else {
    // relevance score
    items.sort((a, b) => b.score - a.score);
  }

  const total = items.length;
  const startIndex = (page - 1) * limit;
  const paginatedItems = items.slice(startIndex, startIndex + limit);

  res.json({
    success: true,
    query: q,
    parsedFilter: searchResult.parsedFilter,
    data: paginatedItems,
    catalogItems: paginatedItems.filter((i) => i.kind === 'catalog_item'),
    businesses: paginatedItems.filter((i) => i.kind === 'business'),
    total,
    page,
    limit,
    hasMore: startIndex + limit < total,
    alternatives: total === 0 ? searchResult.alternatives : [],
  });
});

// -------------------------------------------------------------
// SEARCH SUGGESTIONS & AUTOCOMPLETE (GET /api/v1/search/suggestions)
// -------------------------------------------------------------
app.get('/api/v1/search/suggestions', (req, res) => {
  const query = (req.query.q as string || '').toLowerCase().trim();
  const db = store.getDb();

  const commonCustomerNeeds = [
    'Je cherche une chambre pour ce soir à Cotonou',
    'Je cherche une agence immobilière pour louer un appartement',
    'Je cherche un barbier ouvert maintenant',
    'Je cherche un garage pour vidange et révision',
    'Je cherche un salon de coiffure pour tresses',
    'Je cherche un service de broderie et flocage textile',
    'Je cherche un massage relaxant aux huiles naturelles',
    'Je cherche un photographe pour shooting portrait en studio',
    'Je cherche un institut pour soin du visage et manucure',
    'Je cherche une pharmacie de garde ouverte',
    'Je cherche un logement meublé à la Haie Vive',
    'Je cherche une villa avec piscine à louer',
    'Je cherche un studio proche de moi',
  ];

  let filteredQueries = commonCustomerNeeds;
  if (query) {
    filteredQueries = commonCustomerNeeds.filter((n) => n.toLowerCase().includes(query));
  }

  // Matching active businesses
  const matchingBusinesses = db.businesses
    .filter((b) => b.status === 'ACTIVE' && (!query || b.name.toLowerCase().includes(query) || b.city.toLowerCase().includes(query)))
    .slice(0, 5)
    .map((b) => ({
      id: b.id,
      name: b.name,
      moduleCode: b.module_code,
      city: b.city,
      district: b.district,
    }));

  // Matching popular Benin areas
  const districts = ['Haie Vive', 'Ganhi', 'Fidjrossè', 'Cadjehoun', 'Akpakpa', 'Abomey-Calavi', 'Porto-Novo', 'Parakou', 'Ouidah'];
  const filteredDistricts = query ? districts.filter((d) => d.toLowerCase().includes(query)) : districts;

  res.json({
    success: true,
    suggestions: {
      queries: filteredQueries.slice(0, 6),
      businesses: matchingBusinesses,
      locations: filteredDistricts.slice(0, 5),
    },
  });
});

// -------------------------------------------------------------
// NATURAL LANGUAGE SEARCH WITH EXPLANATIONS (POST /api/v1/search/natural-language)
// -------------------------------------------------------------
app.post('/api/v1/search/natural-language', (req, res) => {
  const query = (req.body.q || req.body.query || req.body.text || '').trim();
  if (!query) {
    return res.status(400).json({ success: false, message: 'Veuillez exprimer votre besoin (texte requis).' });
  }

  const clientLat = req.body.lat ? parseFloat(req.body.lat) : 6.3654;
  const clientLng = req.body.lng ? parseFloat(req.body.lng) : 2.4183;
  const radiusKm = req.body.radius ? parseFloat(req.body.radius) : undefined;
  const openNow = req.body.open_now === true || req.body.open_now === 'true';
  const availableToday = req.body.available_today === true || req.body.available_today === 'true';
  const clientId = (req.headers['x-client-id'] as string) || req.body.clientId || '';

  const results = aiService.search.searchWithExplanations(query, {
    clientLat,
    clientLng,
    radiusKm,
    openNow,
    availableToday,
    clientId,
    limit: 25,
  });

  res.json({
    success: true,
    data: results,
  });
});

// -------------------------------------------------------------
// 6. SMART SEARCH (SPRINT B11: Catalog Publication & Relevance Score)
// -------------------------------------------------------------

app.post('/api/v1/search/smart', (req, res) => {
  const query = (req.body.q || req.body.query || req.body.searchTerm || '').trim();
  const db = store.getDb();
  const clientLat = req.body.lat ? parseFloat(req.body.lat) : req.body.clientLat ? parseFloat(req.body.clientLat) : 6.3654;
  const clientLng = req.body.lng ? parseFloat(req.body.lng) : req.body.clientLng ? parseFloat(req.body.clientLng) : 2.4183;
  const radiusKm = req.body.radius ? parseFloat(req.body.radius) : null;
  const callerClientId =
    (req.headers['x-client-id'] as string) ||
    (req.headers['x-user-id'] as string) ||
    (req.body.clientId as string) ||
    '';

  if (!query) {
    return res.status(400).json({ success: false, message: 'Requête vide.' });
  }

  const qLower = query.toLowerCase();
  const tokens = qLower
    .split(/[\s,.'’\-–]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2);

  // Detect sector module
  let detectedModule: string | null = null;
  if (
    qLower.includes('maison') ||
    qLower.includes('villa') ||
    qLower.includes('appart') ||
    qLower.includes('studio') ||
    qLower.includes('terrain') ||
    qLower.includes('loyer') ||
    qLower.includes('louer') ||
    qLower.includes('immo')
  ) {
    detectedModule = 'IMMOBILIER';
  } else if (
    qLower.includes('guest') ||
    qLower.includes('chambre') ||
    qLower.includes('nuit') ||
    qLower.includes('séjour') ||
    qLower.includes('héberg') ||
    qLower.includes('piscine')
  ) {
    detectedModule = 'GUEST_HOUSE';
  } else if (
    qLower.includes('coiff') ||
    qLower.includes('tresse') ||
    qLower.includes('cheveux') ||
    qLower.includes('brushing')
  ) {
    detectedModule = 'COIFFURE';
  } else if (qLower.includes('barb') || qLower.includes('barbe') || qLower.includes('dégradé')) {
    detectedModule = 'BARBIER';
  } else if (
    qLower.includes('garage') ||
    qLower.includes('voiture') ||
    qLower.includes('frein') ||
    qLower.includes('moteur') ||
    qLower.includes('vidange') ||
    qLower.includes('mécanique')
  ) {
    detectedModule = 'GARAGE';
  } else if (qLower.includes('pharma') || qLower.includes('médicament') || qLower.includes('garde')) {
    detectedModule = 'PHARMACIE';
  } else if (qLower.includes('photo') || qLower.includes('shooting') || qLower.includes('mariage')) {
    detectedModule = 'PHOTOGRAPHE';
  } else if (qLower.includes('massage') || qLower.includes('spa') || qLower.includes('détente')) {
    detectedModule = 'SPA_MASSAGE';
  } else if (qLower.includes('soin') || qLower.includes('visage') || qLower.includes('manucure') || qLower.includes('cosmétique')) {
    detectedModule = 'INSTITUT_COSMETIQUE';
  } else if (qLower.includes('broderie') || qLower.includes('t-shirt') || qLower.includes('flocage') || qLower.includes('textile')) {
    detectedModule = 'BRODERIE_IMPRESSION';
  }

  // Detect budget numbers (e.g. 150 000 FCFA, 150000 cfa)
  const budgetMatch = query.match(/(\d+[\s\d]*)\s*(fcfa|cfa|f)/i);
  let budgetMax: number | null = null;
  if (budgetMatch) {
    budgetMax = parseInt(budgetMatch[1].replace(/\s/g, ''), 10);
  }

  // Filter PUBLISHED catalog items only
  let publishedItems = (db.catalogItems || []).filter((item) => item.status === 'PUBLISHED');

  // Filter by detected module if detected
  if (detectedModule) {
    publishedItems = publishedItems.filter((item) => item.moduleCode === detectedModule);
  }

  // Filter by budget if explicitly given (price <= budgetMax)
  if (budgetMax !== null) {
    publishedItems = publishedItems.filter((item) => item.price <= budgetMax!);
  }

  // Score each item based on Relevance Score criteria
  const scoredItems = publishedItems.map((item) => {
    const parentBiz = db.businesses.find((b) => b.id === item.businessId);

    // Item-level Geolocation check (Point 8)
    const itemLat = item.hasOwnLocation && item.latitude ? item.latitude : parentBiz?.latitude || 6.3654;
    const itemLng = item.hasOwnLocation && item.longitude ? item.longitude : parentBiz?.longitude || 2.4183;
    const distanceKm = Math.round(getHaversineDistance(clientLat, clientLng, itemLat, itemLng) * 10) / 10;
    const distanceFormatted = distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`;

    // Relevance Score calculation (Point 10)
    let relevanceScore = 0;

    // 1. Demand correspondence (keywords)
    const titleLower = item.title.toLowerCase();
    const descLower = item.description.toLowerCase();
    const specsStr = JSON.stringify(item.specs || {}).toLowerCase();

    let keywordMatches = 0;
    tokens.forEach((tok) => {
      if (titleLower.includes(tok)) {
        relevanceScore += 30;
        keywordMatches++;
      } else if (descLower.includes(tok)) {
        relevanceScore += 15;
        keywordMatches++;
      } else if (specsStr.includes(tok)) {
        relevanceScore += 10;
        keywordMatches++;
      }
    });

    // 2. Exact module correspondence
    if (detectedModule && item.moduleCode === detectedModule) {
      relevanceScore += 35;
    }

    // 3. Proximity score (closer gets higher boost)
    if (distanceKm <= 2.0) {
      relevanceScore += 30;
    } else if (distanceKm <= 5.0) {
      relevanceScore += 20;
    } else if (distanceKm <= 10.0) {
      relevanceScore += 10;
    }

    // 4. Availability
    if (item.availability === 'AVAILABLE') {
      relevanceScore += 20;
    }

    // 5. Budget adherence
    if (budgetMax !== null && item.price <= budgetMax) {
      relevanceScore += 25;
      const ratio = item.price / budgetMax;
      if (ratio >= 0.6 && ratio <= 1.0) {
        relevanceScore += 10; // optimal budget fit
      }
    }

    // 6. Quality of profile (real photos present)
    if (item.images && item.images.length > 0) {
      relevanceScore += 15;
    }

    // 7. SPRINT B13: Real ratings from verified published reviews ONLY
    const ratingSummary = store.calculateRating(item.businessId, item.id);
    if (ratingSummary.reviewCount > 0 && ratingSummary.averageRating !== null) {
      relevanceScore += Math.round(ratingSummary.averageRating * 4);
    }

    const isFav = callerClientId
      ? store.isFavorite(callerClientId, { catalogItemId: item.id })
      : false;

    return {
      ...item,
      rating: ratingSummary.averageRating, // null if 0 reviews (never invent fake numbers!)
      reviewCount: ratingSummary.reviewCount,
      isFavorite: isFav,
      businessName: parentBiz?.name || 'Entreprise Partenaire',
      businessPhone: '0154100617',
      businessWhatsApp: '0154100617',
      distanceKm,
      distanceFormatted,
      relevanceScore,
      keywordMatches,
      explanations: [
        ...(distanceKm < 3 ? [`À proximité immédiate (${distanceFormatted})`] : []),
        ...(item.availability === 'AVAILABLE' ? ['Disponible immédiatement'] : []),
        ...(budgetMax !== null && typeof item.price === 'number' && item.price <= budgetMax ? [`Dans votre budget (${item.price.toLocaleString('fr-FR')} FCFA)`] : []),
        ...(ratingSummary.reviewCount > 0 && ratingSummary.averageRating && ratingSummary.averageRating >= 4.5 ? [`Excellente note client (${ratingSummary.averageRating.toFixed(1)}/5)`] : []),
        ...(isFav ? ['Présent dans vos favoris'] : []),
      ],
      effectiveLocation: {
        isItemSpecific: Boolean(item.hasOwnLocation),
        address: item.hasOwnLocation ? item.address : parentBiz?.address,
        district: item.hasOwnLocation ? item.district : parentBiz?.district,
        city: item.hasOwnLocation ? item.city : parentBiz?.city,
        latitude: itemLat,
        longitude: itemLng,
      },
    };
  });

  // Filter by radius if provided
  let filteredItems = scoredItems;
  if (radiusKm !== null) {
    filteredItems = scoredItems.filter((i) => i.distanceKm <= radiusKm);
  }

  // Sort by Relevance Score (highest first), then by distance (closest first)
  filteredItems.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    return a.distanceKm - b.distanceKm;
  });

  // Also collect matching active businesses
  let matchedBusinesses = db.businesses.filter((b) => b.status === 'ACTIVE');
  if (detectedModule) {
    matchedBusinesses = matchedBusinesses.filter(
      (b) => b.module_code === detectedModule || b.enabled_modules?.includes(detectedModule)
    );
  }

  const businessesWithDist = matchedBusinesses.map((b) => {
    const d = getHaversineDistance(clientLat, clientLng, b.latitude, b.longitude);
    const bizRating = store.calculateRating(b.id);
    const isBizFav = callerClientId ? store.isFavorite(callerClientId, { businessId: b.id }) : false;

    return {
      ...b,
      phone: '0154100617',
      whatsapp: '0154100617',
      rating: bizRating.averageRating, // null if 0 reviews
      reviewCount: bizRating.reviewCount,
      isFavorite: isBizFav,
      distanceKm: Math.round(d * 10) / 10,
      distanceFormatted: d < 1 ? `${Math.round(d * 1000)} m` : `${(Math.round(d * 10) / 10).toFixed(1)} km`,
    };
  });
  businessesWithDist.sort((a, b) => a.distanceKm - b.distanceKm);

  res.json({
    success: true,
    data: {
      query,
      detectedModule,
      budgetMax,
      clientLocation: { lat: clientLat, lng: clientLng },
      catalogItems: filteredItems,
      items: filteredItems,
      businesses: businessesWithDist,
      hasResults: filteredItems.length > 0 || businessesWithDist.length > 0,
      emptyMessage:
        filteredItems.length === 0 && businessesWithDist.length === 0
          ? 'Aucun résultat disponible pour le moment. Essayez d’élargir vos critères ou de retirer certains filtres.'
          : null,
    },
  });
});

// -------------------------------------------------------------
// 7. DEMANDES & CONTACT (Client -> Business)
// -------------------------------------------------------------

app.post('/api/v1/demandes', (req, res) => {
  const db = store.getDb();
  const { businessId, clientName, clientPhone, moduleCode, title, details, budgetMax, location } = req.body;

  const newDemande: DemandeEntity = {
    id: `dem-${Date.now()}`,
    businessId,
    clientName: clientName || 'Client',
    clientPhone: clientPhone || '',
    moduleCode: moduleCode || 'IMMOBILIER',
    title: title || 'Demande d\'information',
    details: details || '',
    budgetMax: budgetMax ? Number(budgetMax) : undefined,
    location: location || 'Cotonou',
    status: 'Nouvelle',
    createdAt: new Date().toISOString(),
  };

  db.demandes.unshift(newDemande);
  store.commit();

  res.status(201).json({ success: true, data: newDemande, message: 'Votre demande a été transmise au professionnel.' });
});

app.get('/api/v1/demandes', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }
  const db = store.getDb();
  let list = db.demandes || [];

  if (auth.role === 'SUPER_ADMIN') {
    const overrideBiz = req.query.business_id as string;
    if (overrideBiz) {
      list = list.filter((d) => d.businessId === overrideBiz);
    }
  } else if (auth.role === 'CLIENT') {
    list = list.filter((d) => d.clientId === auth.userId);
  } else {
    // PRO (BUSINESS_OWNER / MANAGER / EMPLOYEE)
    if (!auth.businessId) {
      return res.status(403).json({ success: false, message: 'Accès refusé. Aucun établissement rattaché.' });
    }
    list = list.filter((d) => d.businessId === auth.businessId);
  }

  res.json({ success: true, data: list, count: list.length });
});

// -------------------------------------------------------------
// 7.2 SPRINT B12: DEMANDES, CONTACT, RENDEZ-VOUS & RÉSERVATIONS
// -------------------------------------------------------------

// Helper to extract identity and role strictly from verified JWT
function getRequestAuthContext(req: express.Request) {
  const authReq = req as AuthenticatedRequest;
  let payload = authReq.user;

  // 1. Si authMiddleware n'a pas encore posé req.user, vérifier le Bearer JWT
  if (!payload) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const verified = AuthService.verifyJwt(token);
      if (verified) {
        payload = verified;
        authReq.user = verified;
      }
    }
  }

  // 2. Si JWT valide et vérifié
  if (payload) {
    const role = payload.role as 'SUPER_ADMIN' | 'BUSINESS_OWNER' | 'MANAGER' | 'EMPLOYEE' | 'CLIENT';

    // SUPER_ADMIN : autoriser un override explicite par paramètre, journalisé dans les logs d'audit
    if (role === 'SUPER_ADMIN') {
      const overrideId = (req.query.business_id as string) || (req.query.businessId as string) || (req.body?.businessId as string);
      if (overrideId && overrideId !== payload.businessId) {
        authReq.businessId = overrideId;
        const targetBiz = store.getBusinessById(overrideId);
        authReq.tenantId = targetBiz?.tenantId || overrideId;
        store.logAudit({
          userId: payload.sub,
          userEmail: payload.email || 'admin@flowexa.com',
          action: 'SUPERADMIN_TENANT_OVERRIDE',
          entityType: 'TENANT',
          entityId: overrideId,
          description: `SuperAdmin override tenant context to [${overrideId}] on ${req.method} ${req.path}`,
          ip: req.ip || '127.0.0.1',
        });
        return {
          role,
          userId: payload.sub,
          userName: payload.name,
          businessId: overrideId,
          tenantId: authReq.tenantId,
          clientPhone: payload.phone,
          userEmail: payload.email,
          isAuthenticated: true,
        };
      }

      authReq.businessId = payload.businessId || '';
      authReq.tenantId = payload.tenantId || '';
      return {
        role,
        userId: payload.sub,
        userName: payload.name,
        businessId: authReq.businessId,
        tenantId: authReq.tenantId,
        clientPhone: payload.phone,
        userEmail: payload.email,
        isAuthenticated: true,
      };
    }

    // BUSINESS_OWNER / MANAGER / EMPLOYEE : businessId et tenantId UNIQUEMENT depuis le JWT vérifié.
    // Ignorer et NE JAMAIS lire x-business-id !
    if (role === 'BUSINESS_OWNER' || role === 'MANAGER' || role === 'EMPLOYEE') {
      authReq.businessId = payload.businessId || '';
      const biz = authReq.businessId ? store.getBusinessById(authReq.businessId) : null;
      authReq.tenantId = payload.tenantId || biz?.tenantId || authReq.businessId;
      return {
        role,
        userId: payload.sub,
        userName: payload.name,
        businessId: authReq.businessId,
        tenantId: authReq.tenantId,
        clientPhone: payload.phone,
        userEmail: payload.email,
        isAuthenticated: true,
      };
    }

    // CLIENT : l'accès aux objets est filtré par l'identité du client depuis le JWT, jamais par un id libre
    authReq.businessId = undefined;
    authReq.tenantId = undefined;
    return {
      role: 'CLIENT',
      userId: payload.sub,
      userName: payload.name,
      businessId: '',
      tenantId: undefined,
      clientPhone: payload.phone,
      userEmail: payload.email,
      isAuthenticated: true,
    };
  }

  // 3. Aucun JWT valide : aucune identité professionnelle, aucun fallback arbitraire
  return {
    role: 'CLIENT' as const,
    userId: '',
    userName: '',
    businessId: '',
    tenantId: undefined,
    clientPhone: undefined,
    userEmail: '',
    isAuthenticated: false,
  };
}

// 1. GET /api/v1/requests - Liste des demandes filtrée selon les permissions
app.get('/api/v1/requests', (req, res) => {
  const { role, userId, businessId: currentBusinessId, clientPhone, isAuthenticated } = getRequestAuthContext(req);
  if (!isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }

  const db = store.getDb();
  const requestedBusinessId = (req.query.business_id as string) || (req.query.businessId as string);
  const requestedClientId = (req.query.client_id as string) || (req.query.clientId as string);
  const statusFilter = req.query.status as string;
  const interactionFilter = req.query.interaction_type as string;
  const catalogItemIdFilter = req.query.catalog_item_id as string;
  const assignedEmployeeFilter = req.query.assigned_employee_id as string;
  const assignedOnly = req.query.assigned_only === 'true';

  let list = [...(db.requests || [])];

  // RBAC PERMISSION CHECKS:
  if (role === 'SUPER_ADMIN') {
    // Super Admin voit tout. Filtres optionnels autorisés.
    if (requestedBusinessId) {
      list = list.filter((r) => r.businessId === requestedBusinessId);
    }
    if (requestedClientId) {
      list = list.filter((r) => r.clientId === requestedClientId);
    }
  } else if (role === 'BUSINESS_OWNER' || role === 'MANAGER') {
    // Propriétaire ou Manager ne voit que les demandes de son entreprise
    if (!currentBusinessId) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Aucun établissement rattaché à ce compte professionnel.',
      });
    }
    if (requestedBusinessId && requestedBusinessId !== currentBusinessId) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous ne pouvez consulter que les demandes de votre propre entreprise.',
      });
    }
    list = list.filter((r) => r.businessId === currentBusinessId);
  } else if (role === 'EMPLOYEE') {
    // Employé ne voit que les demandes de son entreprise, avec filtre optionnel sur son assignation
    if (!currentBusinessId) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Aucun établissement rattaché à ce compte professionnel.',
      });
    }
    if (requestedBusinessId && requestedBusinessId !== currentBusinessId) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous ne pouvez consulter que les demandes de votre propre entreprise.',
      });
    }
    list = list.filter((r) => r.businessId === currentBusinessId);
    if (assignedOnly) {
      list = list.filter((r) => r.assignedEmployeeId === userId);
    }
  } else {
    // CLIENT : ne peut voir que ses propres demandes
    if (!userId) {
      return res.status(403).json({ success: false, message: 'Identité client manquante.' });
    }
    if (requestedClientId && requestedClientId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous ne pouvez consulter que vos propres demandes.',
      });
    }
    list = list.filter(
      (r) => r.clientId === userId || (clientPhone && r.clientPhone === clientPhone)
    );
  }

  // Filtres métier supplémentaires
  if (statusFilter) {
    list = list.filter((r) => r.status === statusFilter.toUpperCase());
  }
  if (interactionFilter) {
    list = list.filter((r) => r.interactionType === interactionFilter.toUpperCase());
  }
  if (catalogItemIdFilter) {
    list = list.filter((r) => r.catalogItemId === catalogItemIdFilter);
  }
  if (assignedEmployeeFilter) {
    list = list.filter((r) => r.assignedEmployeeId === assignedEmployeeFilter);
  }

  // Pagination optionnelle
  const page = parseInt(req.query.page as string, 10);
  const limit = parseInt(req.query.limit as string, 10);
  const total = list.length;

  if (!isNaN(page) && !isNaN(limit) && limit > 0) {
    const startIndex = Math.max(0, (page - 1) * limit);
    list = list.slice(startIndex, startIndex + limit);
    return res.json({
      success: true,
      data: list,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      viewerRole: role,
    });
  }

  res.json({
    success: true,
    data: list,
    count: list.length,
    total,
    viewerRole: role,
  });
});

// 2. GET /api/v1/requests/:id - Détails d'une demande avec contrôle de permission
app.get('/api/v1/requests/:id', (req, res) => {
  const { role, userId, businessId: currentBusinessId, clientPhone } = getRequestAuthContext(req);
  const db = store.getDb();
  const request = (db.requests || []).find((r) => r.id === req.params.id);

  if (!request) {
    return res.status(404).json({ success: false, message: 'Demande introuvable.' });
  }

  // Vérification de permission
  if (role === 'SUPER_ADMIN') {
    // autorisé
  } else if (role === 'BUSINESS_OWNER' || role === 'MANAGER' || role === 'EMPLOYEE') {
    if (request.businessId !== currentBusinessId) {
      return res.status(403).json({
        success: false,
        message: 'Accès interdit. Cette demande n\'appartient pas à votre entreprise.',
      });
    }
  } else {
    // CLIENT
    if (request.clientId !== userId && (!clientPhone || request.clientPhone !== clientPhone)) {
      return res.status(403).json({
        success: false,
        message: 'Accès interdit. Vous ne pouvez pas consulter la demande d\'un autre client.',
      });
    }
  }

  res.json({ success: true, data: request });
});

// 3. POST /api/v1/requests - Création d'une nouvelle demande (Client)
app.post('/api/v1/requests', (req, res) => {
  const db = store.getDb();
  const {
    businessId,
    catalogItemId,
    interactionType = 'REQUEST',
    title,
    message,
    requestedDate,
    requestedTime,
    endDate,
    guestsCount,
    location,
    clientId,
    clientName,
    clientPhone,
    clientEmail,
  } = req.body;

  // Validation entreprise
  if (!businessId) {
    return res.status(400).json({ success: false, message: 'businessId est obligatoire.' });
  }
  const business = db.businesses.find((b) => b.id === businessId);
  if (!business) {
    return res.status(404).json({ success: false, message: 'Entreprise destinataire introuvable.' });
  }

  // VALIDATION CRITIQUE : Offre publiée uniquement
  let catalogItem: CatalogItemEntity | undefined;
  if (catalogItemId) {
    catalogItem = (db.catalogItems || []).find((item) => item.id === catalogItemId);
    if (!catalogItem) {
      return res.status(404).json({ success: false, message: 'Offre catalogue introuvable.' });
    }
    if (catalogItem.status !== 'PUBLISHED') {
      return res.status(400).json({
        success: false,
        code: 'OFFER_NOT_PUBLISHED',
        message: 'Les offres non publiées ne peuvent pas recevoir de demandes.',
      });
    }

    // SPRINT B15: ANTI DOUBLE-BOOKING & CONCURRENCE CHECK LORS DE LA CRÉATION
    if (requestedDate) {
      const conflict = store.checkBookingConflict({
        catalogItemId,
        requestedDate,
        requestedTime,
        endDate,
      });
      if (conflict.hasConflict) {
        return res.status(409).json({
          success: false,
          code: 'CONFLICT_DOUBLE_BOOKING',
          message: conflict.message || 'Ce créneau ou cette offre est déjà réservé(e).',
          conflictingRequestId: conflict.conflictingRequestId,
        });
      }
    }
  }

  if (!message || message.trim() === '') {
    return res.status(400).json({ success: false, message: 'Le message de la demande est obligatoire.' });
  }

  const validInteractionTypes: InteractionType[] = ['CONTACT_ONLY', 'REQUEST', 'APPOINTMENT', 'BOOKING'];
  const finalInteractionType: InteractionType = validInteractionTypes.includes(interactionType)
    ? interactionType
    : 'REQUEST';

  const auth = getRequestAuthContext(req);
  const finalClientId = auth.role === 'CLIENT'
    ? auth.userId
    : (auth.role === 'SUPER_ADMIN' ? (clientId || auth.userId) : (auth.userId || clientId || `client-${Date.now()}`));
  const finalClientName = (auth.role === 'CLIENT' ? auth.userName : undefined) || clientName || 'Client Flowexa';
  const finalClientPhone = (auth.role === 'CLIENT' ? auth.clientPhone : undefined) || clientPhone || '0154100617';
  const finalClientEmail = (auth.role === 'CLIENT' ? auth.userEmail : undefined) || clientEmail || 'client@flowexa.com';

  const defaultTitle = catalogItem
    ? `${finalInteractionType === 'BOOKING' ? 'Réservation' : finalInteractionType === 'APPOINTMENT' ? 'Rendez-vous' : finalInteractionType === 'CONTACT_ONLY' ? 'Contact' : 'Demande'} : ${catalogItem.title}`
    : `Demande (${finalInteractionType}) pour ${business.name}`;

  // SPRINT B15: Snapshot immuable du prix à la réservation
  const lockedPrice = catalogItem ? catalogItem.price : (Number(req.body.catalogItemPrice) || 0);
  const lockedCurrency = catalogItem ? catalogItem.currency : (req.body.catalogItemCurrency || 'FCFA');

  const newRequest: FlowexaRequestEntity = {
    id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    clientId: finalClientId,
    clientName: finalClientName,
    clientPhone: finalClientPhone,
    clientEmail: finalClientEmail,
    businessId: business.id,
    businessName: business.name,
    businessPhone: business.phone || '0154100617',
    moduleCode: catalogItem?.moduleCode || business.module_code || 'SERVICES',
    catalogItemId: catalogItem?.id,
    catalogItemTitle: catalogItem?.title,
    catalogItemPrice: lockedPrice,
    catalogItemCurrency: lockedCurrency,
    lockedPrice,
    lockedCurrency,
    catalogItemImage: catalogItem?.images?.[0]?.url,
    offerType: catalogItem?.offerType,
    interactionType: finalInteractionType,
    title: title?.trim() || defaultTitle,
    message: message.trim(),
    requestedDate: requestedDate || undefined,
    requestedTime: requestedTime || undefined,
    endDate: endDate || undefined,
    guestsCount: guestsCount ? Number(guestsCount) : undefined,
    location: location?.trim() || catalogItem?.city || business.city || 'Cotonou',
    status: 'PENDING',
    statusHistory: [
      {
        status: 'PENDING',
        changedBy: 'CLIENT',
        changedByName: finalClientName,
        note: 'Création de la demande par le client',
        timestamp: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Enregistrement persistant
  store.createRequest(newRequest);

  // Incrémenter inquiriesCount si rattaché à une offre
  if (catalogItem) {
    catalogItem.inquiriesCount = (catalogItem.inquiriesCount || 0) + 1;
    store.commit();
  }

  // NOTIFICATION CRÉÉE POUR L'ENTREPRISE
  store.createNotification({
    recipientType: 'BUSINESS',
    recipientId: business.id,
    recipientName: business.name,
    title: `Nouvelle demande (${finalInteractionType}) reçue`,
    message: `${finalClientName} vous a envoyé une demande (${finalInteractionType}) : "${newRequest.title}".`,
    requestId: newRequest.id,
    interactionType: finalInteractionType,
    channel: 'INTERNAL',
    metadata: {
      clientPhone: finalClientPhone,
      requestedDate: requestedDate || null,
      catalogItemId: catalogItem?.id || null,
    },
  });

  // Log d'audit
  store.logAudit({
    userId: finalClientId,
    userEmail: finalClientEmail,
    action: 'CREATE_REQUEST',
    entityType: 'REQUEST',
    entityId: newRequest.id,
    description: `Nouvelle demande (${finalInteractionType}) créée par ${finalClientName} pour ${business.name}`,
    ip: req.ip || '127.0.0.1',
  });

  res.status(201).json({
    success: true,
    data: newRequest,
    message: 'Votre demande a été transmise avec succès à l\'entreprise.',
  });
});

// 4. POST /api/v1/requests/:id/accept - L'entreprise accepte la demande
app.post('/api/v1/requests/:id/accept', (req, res) => {
  const { role, businessId: currentBusinessId } = getRequestAuthContext(req);
  const db = store.getDb();
  const request = (db.requests || []).find((r) => r.id === req.params.id);

  if (!request) {
    return res.status(404).json({ success: false, message: 'Demande introuvable.' });
  }

  // Contrôle de permission
  if (role !== 'SUPER_ADMIN' && request.businessId !== currentBusinessId) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Vous n\'êtes pas autorisé à accepter les demandes d\'une autre entreprise.',
    });
  }

  const note = req.body.note || 'Votre demande a été acceptée avec succès.';
  const transition = store.transitionRequestStatus({
    id: request.id,
    nextStatus: 'ACCEPTED',
    changedBy: 'BUSINESS',
    changedByName: request.businessName,
    note,
  });

  if (!transition.success) {
    return res.status(400).json({ success: false, message: transition.error, code: transition.code });
  }

  const updated = transition.request!;

  // NOTIFICATION POUR LE CLIENT
  store.createNotification({
    recipientType: 'CLIENT',
    recipientId: request.clientId,
    recipientName: request.clientName,
    title: 'Demande acceptée !',
    message: `${request.businessName} a accepté votre demande (${request.interactionType}) pour "${request.title}". Note : ${note}`,
    requestId: request.id,
    interactionType: request.interactionType,
    channel: 'INTERNAL',
    metadata: {
      businessPhone: request.businessPhone || '0154100617',
      acceptedAt: new Date().toISOString(),
    },
  });

  // Log d'audit
  store.logAudit({
    userId: currentBusinessId || 'biz-owner',
    userEmail: 'business@flowexa.com',
    action: 'ACCEPT_REQUEST',
    entityType: 'REQUEST',
    entityId: request.id,
    description: `Demande acceptée par ${request.businessName} pour ${request.clientName}`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    data: updated,
    message: 'Demande acceptée avec succès. Le client a été notifié.',
  });
});

// SPRINT B15: 4b. POST /api/v1/requests/:id/confirm - Confirmation ferme de réservation
app.post('/api/v1/requests/:id/confirm', (req, res) => {
  const { role, businessId: currentBusinessId } = getRequestAuthContext(req);
  const db = store.getDb();
  const request = (db.requests || []).find((r) => r.id === req.params.id);

  if (!request) {
    return res.status(404).json({ success: false, message: 'Réservation/Demande introuvable.' });
  }

  if (role !== 'SUPER_ADMIN' && request.businessId !== currentBusinessId) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Vous n\'êtes pas autorisé à confirmer les réservations d\'une autre entreprise.',
    });
  }

  // Anti double-booking lors de la confirmation
  if (request.catalogItemId && request.requestedDate) {
    const conflict = store.checkBookingConflict({
      catalogItemId: request.catalogItemId,
      requestedDate: request.requestedDate,
      requestedTime: request.requestedTime,
      endDate: request.endDate,
      excludeRequestId: request.id,
    });
    if (conflict.hasConflict) {
      return res.status(409).json({
        success: false,
        code: 'CONFLICT_DOUBLE_BOOKING',
        message: conflict.message || 'Un conflit de réservation empêche la confirmation de ce créneau.',
      });
    }
  }

  const note = req.body.note || 'Votre réservation a été confirmée avec succès.';
  const transition = store.transitionRequestStatus({
    id: request.id,
    nextStatus: 'CONFIRMED',
    changedBy: role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'BUSINESS',
    changedByName: request.businessName,
    note,
    forceAdmin: role === 'SUPER_ADMIN',
  });

  if (!transition.success) {
    return res.status(400).json({ success: false, message: transition.error, code: transition.code });
  }

  const updated = transition.request!;

  store.createNotification({
    recipientType: 'CLIENT',
    recipientId: request.clientId,
    recipientName: request.clientName,
    title: 'Réservation confirmée !',
    message: `${request.businessName} a confirmé votre réservation pour "${request.title}". Note : ${note}`,
    requestId: request.id,
    interactionType: request.interactionType,
    channel: 'INTERNAL',
  });

  store.logAudit({
    userId: currentBusinessId || 'biz-user',
    userEmail: 'pro@flowexa.com',
    action: 'CONFIRM_BOOKING',
    entityType: 'REQUEST',
    entityId: request.id,
    description: `Réservation confirmée par ${request.businessName} pour ${request.clientName}`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    data: updated,
    message: 'Réservation confirmée avec succès. Le client a été notifié.',
  });
});

// SPRINT B15: 4c. POST /api/v1/requests/:id/schedule - Planification de rendez-vous
app.post('/api/v1/requests/:id/schedule', (req, res) => {
  const { role, businessId: currentBusinessId } = getRequestAuthContext(req);
  const db = store.getDb();
  const request = (db.requests || []).find((r) => r.id === req.params.id);

  if (!request) {
    return res.status(404).json({ success: false, message: 'Réservation introuvable.' });
  }

  if (role !== 'SUPER_ADMIN' && request.businessId !== currentBusinessId) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Vous n\'êtes pas autorisé à planifier les rendez-vous d\'une autre entreprise.',
    });
  }

  const { scheduledDate, scheduledTime, durationMinutes, assignedEmployeeId, assignedEmployeeName, note } = req.body;

  if (!scheduledDate) {
    return res.status(400).json({ success: false, message: 'La date du rendez-vous (scheduledDate) est obligatoire.' });
  }

  // Vérification de conflit sur le nouveau créneau planifié
  if (request.catalogItemId) {
    const conflict = store.checkBookingConflict({
      catalogItemId: request.catalogItemId,
      requestedDate: scheduledDate,
      requestedTime: scheduledTime,
      excludeRequestId: request.id,
    });
    if (conflict.hasConflict) {
      return res.status(409).json({
        success: false,
        code: 'CONFLICT_DOUBLE_BOOKING',
        message: conflict.message || 'Le créneau planifié est déjà occupé pour cette prestation.',
      });
    }
  }

  const transition = store.transitionRequestStatus({
    id: request.id,
    nextStatus: 'SCHEDULED',
    changedBy: role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'BUSINESS',
    changedByName: request.businessName,
    note: note || `Rendez-vous planifié le ${scheduledDate}${scheduledTime ? ' à ' + scheduledTime : ''}`,
    scheduledDate,
    scheduledTime,
    durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
    assignedEmployeeId,
    assignedEmployeeName,
    forceAdmin: role === 'SUPER_ADMIN',
  });

  if (!transition.success) {
    return res.status(400).json({ success: false, message: transition.error, code: transition.code });
  }

  const updated = transition.request!;

  store.createNotification({
    recipientType: 'CLIENT',
    recipientId: request.clientId,
    recipientName: request.clientName,
    title: 'Rendez-vous planifié !',
    message: `${request.businessName} a planifié votre rendez-vous le ${scheduledDate}${scheduledTime ? ' à ' + scheduledTime : ''}${assignedEmployeeName ? ' avec ' + assignedEmployeeName : ''}.`,
    requestId: request.id,
    interactionType: request.interactionType,
    channel: 'INTERNAL',
  });

  store.logAudit({
    userId: currentBusinessId || 'biz-user',
    userEmail: 'pro@flowexa.com',
    action: 'SCHEDULE_BOOKING',
    entityType: 'REQUEST',
    entityId: request.id,
    description: `Rendez-vous planifié le ${scheduledDate} à ${scheduledTime || 'N/A'} pour ${request.clientName}`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    data: updated,
    message: 'Rendez-vous planifié avec succès. Le client a été notifié.',
  });
});

// SPRINT B15: 4d. POST /api/v1/requests/:id/start - Démarrage de la prestation (IN_PROGRESS)
app.post('/api/v1/requests/:id/start', (req, res) => {
  const { role, businessId: currentBusinessId } = getRequestAuthContext(req);
  const db = store.getDb();
  const request = (db.requests || []).find((r) => r.id === req.params.id);

  if (!request) {
    return res.status(404).json({ success: false, message: 'Réservation introuvable.' });
  }

  if (role !== 'SUPER_ADMIN' && request.businessId !== currentBusinessId) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Vous n\'êtes pas autorisé à modifier les réservations d\'une autre entreprise.',
    });
  }

  const transition = store.transitionRequestStatus({
    id: request.id,
    nextStatus: 'IN_PROGRESS',
    changedBy: role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'BUSINESS',
    changedByName: request.businessName,
    note: req.body.note || 'La prestation a démarré.',
    forceAdmin: role === 'SUPER_ADMIN',
  });

  if (!transition.success) {
    return res.status(400).json({ success: false, message: transition.error, code: transition.code });
  }

  const updated = transition.request!;

  store.createNotification({
    recipientType: 'CLIENT',
    recipientId: request.clientId,
    recipientName: request.clientName,
    title: 'Prestation en cours',
    message: `${request.businessName} a démarré la réalisation de votre prestation : "${request.title}".`,
    requestId: request.id,
    interactionType: request.interactionType,
    channel: 'INTERNAL',
  });

  store.logAudit({
    userId: currentBusinessId || 'biz-user',
    userEmail: 'pro@flowexa.com',
    action: 'START_SERVICE',
    entityType: 'REQUEST',
    entityId: request.id,
    description: `Prestation démarrée par ${request.businessName} pour ${request.clientName}`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    data: updated,
    message: 'Prestation démarrée (En cours).',
  });
});

// SPRINT B15: 4e. POST /api/v1/requests/:id/assign-employee - Attribution à un collaborateur
app.post('/api/v1/requests/:id/assign-employee', (req, res) => {
  const { role, businessId: currentBusinessId } = getRequestAuthContext(req);
  const db = store.getDb();
  const request = (db.requests || []).find((r) => r.id === req.params.id);

  if (!request) {
    return res.status(404).json({ success: false, message: 'Réservation introuvable.' });
  }

  if (role !== 'SUPER_ADMIN' && request.businessId !== currentBusinessId) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Vous n\'êtes pas autorisé à assigner des collaborateurs pour une autre entreprise.',
    });
  }

  const { employeeId, employeeName } = req.body;
  if (!employeeId || !employeeName) {
    return res.status(400).json({ success: false, message: 'employeeId et employeeName sont obligatoires.' });
  }

  const result = store.assignEmployeeToRequest({
    requestId: request.id,
    employeeId,
    employeeName,
    assignedByRole: role === 'SUPER_ADMIN' ? 'ADMIN' : 'BUSINESS',
    assignedByName: request.businessName,
  });

  if (!result.success) {
    return res.status(400).json({ success: false, message: result.error });
  }

  store.logAudit({
    userId: currentBusinessId || 'biz-user',
    userEmail: 'pro@flowexa.com',
    action: 'ASSIGN_EMPLOYEE',
    entityType: 'REQUEST',
    entityId: request.id,
    description: `Collaborateur ${employeeName} assigné à la réservation ${request.id}`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    data: result.request,
    message: `Le collaborateur ${employeeName} a été assigné avec succès.`,
  });
});

// SPRINT B15: 4f. POST /api/v1/requests/:id/conversation - Récupérer ou lier une conversation
app.post('/api/v1/requests/:id/conversation', (req, res) => {
  const { role, userId, businessId: currentBusinessId, clientPhone } = getRequestAuthContext(req);
  const db = store.getDb();
  const request = (db.requests || []).find((r) => r.id === req.params.id);

  if (!request) {
    return res.status(404).json({ success: false, message: 'Réservation introuvable.' });
  }

  // Contrôle de permission : le client concerné, l'entreprise ou l'admin
  const isAuthorized =
    role === 'SUPER_ADMIN' ||
    (role === 'CLIENT' && (request.clientId === userId || (clientPhone && request.clientPhone === clientPhone))) ||
    ((role === 'BUSINESS_OWNER' || role === 'MANAGER' || role === 'EMPLOYEE') && request.businessId === currentBusinessId);

  if (!isAuthorized) {
    return res.status(403).json({ success: false, message: 'Accès refusé à la conversation de cette réservation.' });
  }

  // Créer ou récupérer la conversation via DataStore
  const convResult = store.createOrGetConversation({
    clientId: request.clientId,
    clientName: request.clientName,
    clientPhone: request.clientPhone,
    businessId: request.businessId,
    catalogItemId: request.catalogItemId,
    requestId: request.interactionType === 'REQUEST' ? request.id : undefined,
    bookingId: request.interactionType === 'BOOKING' ? request.id : undefined,
    appointmentId: request.interactionType === 'APPOINTMENT' ? request.id : undefined,
    initialMessage: `Discussion concernant la réservation / demande : "${request.title}"`,
    callerRole: role,
  });

  if (convResult.conversation && !request.conversationId) {
    request.conversationId = convResult.conversation.id;
    store.commit();
  }

  res.json({
    success: true,
    data: convResult.conversation,
    isNew: !convResult.isExisting,
  });
});

// 5. POST /api/v1/requests/:id/reject - L'entreprise refuse la demande
app.post('/api/v1/requests/:id/reject', (req, res) => {
  const { role, businessId: currentBusinessId } = getRequestAuthContext(req);
  const db = store.getDb();
  const request = (db.requests || []).find((r) => r.id === req.params.id);

  if (!request) {
    return res.status(404).json({ success: false, message: 'Demande introuvable.' });
  }

  // Contrôle de permission
  if (role !== 'SUPER_ADMIN' && request.businessId !== currentBusinessId) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Vous n\'êtes pas autorisé à refuser les demandes d\'une autre entreprise.',
    });
  }

  const reason = req.body.reason || req.body.note || 'Créneau ou service indisponible.';
  const transition = store.transitionRequestStatus({
    id: request.id,
    nextStatus: 'REJECTED',
    changedBy: role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'BUSINESS',
    changedByName: request.businessName,
    reason,
    forceAdmin: role === 'SUPER_ADMIN',
  });

  if (!transition.success) {
    return res.status(400).json({ success: false, message: transition.error, code: transition.code });
  }

  const updated = transition.request!;

  // NOTIFICATION POUR LE CLIENT
  store.createNotification({
    recipientType: 'CLIENT',
    recipientId: request.clientId,
    recipientName: request.clientName,
    title: 'Demande non retenue',
    message: `${request.businessName} n'a pas pu accepter votre demande. Motif : ${reason}`,
    requestId: request.id,
    interactionType: request.interactionType,
    channel: 'INTERNAL',
  });

  res.json({
    success: true,
    data: updated,
    message: 'Demande refusée. Le client a été notifié.',
  });
});

// 6. POST /api/v1/requests/:id/cancel - Annulation par le client ou l'entreprise
app.post('/api/v1/requests/:id/cancel', (req, res) => {
  const { role, userId, businessId: currentBusinessId, clientPhone } = getRequestAuthContext(req);
  const db = store.getDb();
  const request = (db.requests || []).find((r) => r.id === req.params.id);

  if (!request) {
    return res.status(404).json({ success: false, message: 'Demande introuvable.' });
  }

  const reason = req.body.reason || req.body.note || 'Annulation à la demande de l\'utilisateur.';

  // Vérification selon le rôle
  if (role === 'CLIENT') {
    if (request.clientId !== userId && (!clientPhone || request.clientPhone !== clientPhone)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous ne pouvez annuler que vos propres demandes.',
      });
    }

    if (request.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Impossible d\'annuler une prestation déjà terminée.',
        code: 'TRANSITION_FORBIDDEN',
      });
    }
    if (request.status === 'CANCELLED' || request.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: `Cette demande est déjà au statut ${request.status}.`,
        code: 'TRANSITION_FORBIDDEN',
      });
    }

    const transition = store.transitionRequestStatus({
      id: request.id,
      nextStatus: 'CANCELLED',
      changedBy: 'CLIENT',
      changedByName: request.clientName,
      reason,
    });

    if (!transition.success) {
      return res.status(400).json({ success: false, message: transition.error, code: transition.code });
    }

    const updated = transition.request!;

    // Notifier l'entreprise de l'annulation
    store.createNotification({
      recipientType: 'BUSINESS',
      recipientId: request.businessId,
      recipientName: request.businessName,
      title: 'Demande annulée par le client',
      message: `${request.clientName} a annulé sa demande (${request.interactionType}) pour "${request.title}".`,
      requestId: request.id,
      interactionType: request.interactionType,
      channel: 'INTERNAL',
    });

    return res.json({
      success: true,
      data: updated,
      message: 'Votre demande a été annulée avec succès.',
    });
  } else if (role === 'BUSINESS_OWNER' || role === 'MANAGER' || role === 'EMPLOYEE') {
    if (request.businessId !== currentBusinessId) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous ne pouvez annuler que les demandes de votre propre entreprise.',
      });
    }

    if (request.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Impossible d\'annuler une prestation déjà terminée.',
        code: 'TRANSITION_FORBIDDEN',
      });
    }

    const transition = store.transitionRequestStatus({
      id: request.id,
      nextStatus: 'CANCELLED',
      changedBy: 'BUSINESS',
      changedByName: request.businessName,
      reason,
    });

    if (!transition.success) {
      return res.status(400).json({ success: false, message: transition.error, code: transition.code });
    }

    const updated = transition.request!;

    // Notifier le client de l'annulation par l'entreprise
    store.createNotification({
      recipientType: 'CLIENT',
      recipientId: request.clientId,
      recipientName: request.clientName,
      title: 'Demande annulée par le professionnel',
      message: `${request.businessName} a annulé la demande (${request.interactionType}) pour "${request.title}". Motif : ${reason}`,
      requestId: request.id,
      interactionType: request.interactionType,
      channel: 'INTERNAL',
    });

    return res.json({
      success: true,
      data: updated,
      message: 'La demande a été annulée. Le client a été informé.',
    });
  } else {
    // SUPER_ADMIN
    const transition = store.transitionRequestStatus({
      id: request.id,
      nextStatus: 'CANCELLED',
      changedBy: 'SUPER_ADMIN',
      changedByName: 'Super Admin Flowexa',
      reason,
      forceAdmin: true,
    });

    return res.json({
      success: true,
      data: transition.request,
      message: 'Demande annulée par l\'administrateur.',
    });
  }
});

// 7. POST /api/v1/requests/:id/complete - L'entreprise marque la prestation terminée
app.post('/api/v1/requests/:id/complete', (req, res) => {
  const { role, businessId: currentBusinessId } = getRequestAuthContext(req);
  const db = store.getDb();
  const request = (db.requests || []).find((r) => r.id === req.params.id);

  if (!request) {
    return res.status(404).json({ success: false, message: 'Demande introuvable.' });
  }

  if (role !== 'SUPER_ADMIN' && request.businessId !== currentBusinessId) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Vous n\'êtes pas autorisé à modifier les demandes d\'une autre entreprise.',
    });
  }

  const transition = store.transitionRequestStatus({
    id: request.id,
    nextStatus: 'COMPLETED',
    changedBy: role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'BUSINESS',
    changedByName: request.businessName,
    note: req.body.note || 'Prestation réalisée et terminée avec succès.',
    forceAdmin: role === 'SUPER_ADMIN',
  });

  if (!transition.success) {
    return res.status(400).json({ success: false, message: transition.error, code: transition.code });
  }

  const updated = transition.request!;

  // Notifier le client
  store.createNotification({
    recipientType: 'CLIENT',
    recipientId: request.clientId,
    recipientName: request.clientName,
    title: 'Prestation terminée',
    message: `${request.businessName} a marqué votre prestation pour "${request.title}" comme terminée. Vous pouvez dès à présent laisser votre avis vérifié !`,
    requestId: request.id,
    interactionType: request.interactionType,
    channel: 'INTERNAL',
  });

  store.logAudit({
    userId: currentBusinessId || 'biz-user',
    userEmail: 'pro@flowexa.com',
    action: 'COMPLETE_SERVICE',
    entityType: 'REQUEST',
    entityId: request.id,
    description: `Prestation clôturée par ${request.businessName} pour ${request.clientName}`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    data: updated,
    message: 'Prestation marquée comme terminée avec succès. Le client peut déposer son avis.',
  });
});

// 8. NOTIFICATIONS & COMMUNICATIONS API (SPRINT B30 + F30)
app.get('/api/v1/notifications', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise pour consulter les notifications.' });
  }

  const { role, userId, businessId: currentBusinessId } = auth;
  let recipientType: 'BUSINESS' | 'CLIENT';
  let recipientId: string;

  if (role === 'SUPER_ADMIN') {
    recipientType = (req.query.recipient_type as 'BUSINESS' | 'CLIENT') || 'BUSINESS';
    recipientId = (req.query.recipient_id as string) || currentBusinessId || userId;
  } else if (role === 'BUSINESS_OWNER' || role === 'MANAGER' || role === 'EMPLOYEE') {
    if (!currentBusinessId) {
      return res.status(403).json({ success: false, message: 'Accès refusé. Aucun établissement rattaché.' });
    }
    const requestedRecipientId = req.query.recipient_id as string;
    if (requestedRecipientId && requestedRecipientId !== currentBusinessId) {
      return res.status(403).json({
        success: false,
        message: 'Accès interdit. Vous ne pouvez pas consulter les notifications d’un autre établissement.',
      });
    }
    recipientType = 'BUSINESS';
    recipientId = currentBusinessId;
  } else {
    // CLIENT : filtré par l'identité du client depuis le JWT, jamais par un id libre
    if (!userId) {
      return res.status(403).json({ success: false, message: 'Identité client manquante.' });
    }
    const requestedRecipientId = req.query.recipient_id as string;
    if (requestedRecipientId && requestedRecipientId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès interdit. Vous ne pouvez pas consulter les notifications d’un autre utilisateur.',
      });
    }
    recipientType = 'CLIENT';
    recipientId = userId;
  }

  const unreadOnly = req.query.unread === 'true';
  const category = req.query.category as string;
  const priority = req.query.priority as string;

  const db = store.getDb();
  let list = (db.notifications || []).filter(
    (n) => n.recipientType === recipientType && n.recipientId === recipientId
  );

  if (unreadOnly) {
    list = list.filter((n) => !n.isRead);
  }

  if (category && category !== 'ALL') {
    list = list.filter((n) => n.category === category);
  }

  if (priority && priority !== 'ALL') {
    list = list.filter((n) => n.priority === priority);
  }

  // Trier par date la plus récente
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = list.filter((n) => !n.isRead).length;

  res.json({
    success: true,
    data: list,
    unreadCount,
    count: list.length,
  });
});

app.get('/api/v1/notifications/unread', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }

  const { role, userId, businessId: currentBusinessId } = auth;
  let recipientType: 'BUSINESS' | 'CLIENT';
  let recipientId: string;

  if (role === 'SUPER_ADMIN') {
    recipientType = (req.query.recipient_type as 'BUSINESS' | 'CLIENT') || 'BUSINESS';
    recipientId = (req.query.recipient_id as string) || currentBusinessId || userId;
  } else if (role === 'BUSINESS_OWNER' || role === 'MANAGER' || role === 'EMPLOYEE') {
    if (!currentBusinessId) {
      return res.status(403).json({ success: false, message: 'Accès refusé. Aucun établissement rattaché.' });
    }
    recipientType = 'BUSINESS';
    recipientId = currentBusinessId;
  } else {
    if (!userId) {
      return res.status(403).json({ success: false, message: 'Identité client manquante.' });
    }
    recipientType = 'CLIENT';
    recipientId = userId;
  }

  const db = store.getDb();
  const list = (db.notifications || []).filter(
    (n) => n.recipientType === recipientType && n.recipientId === recipientId && !n.isRead
  );

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    unreadCount: list.length,
    data: list.slice(0, 10),
  });
});

// Marquer une notification comme lue (PATCH & POST)
const handleMarkNotificationRead = (req: express.Request, res: express.Response) => {
  const success = store.markNotificationRead(req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, message: 'Notification introuvable.' });
  }
  res.json({ success: true, message: 'Notification marquée comme lue.' });
};
app.patch('/api/v1/notifications/:id/read', handleMarkNotificationRead);
app.post('/api/v1/notifications/:id/read', handleMarkNotificationRead);

// Tout marquer comme lu (PATCH & POST)
const handleMarkAllNotificationsRead = (req: express.Request, res: express.Response) => {
  const { role, userId, businessId: currentBusinessId } = getRequestAuthContext(req);
  const recipientType = (req.body?.recipient_type as 'BUSINESS' | 'CLIENT') || (role === 'BUSINESS_OWNER' ? 'BUSINESS' : 'CLIENT');
  const recipientId = (req.body?.recipient_id as string) || (recipientType === 'BUSINESS' ? currentBusinessId : userId);

  const updatedCount = store.markAllNotificationsRead(recipientType, recipientId);
  res.json({ success: true, updatedCount, message: `${updatedCount} notifications marquées comme lues.` });
};
app.patch('/api/v1/notifications/read-all', handleMarkAllNotificationsRead);
app.post('/api/v1/notifications/mark-all-read', handleMarkAllNotificationsRead);

// Préférences de notification de l'utilisateur & Consentements horodatés (APDP / RGPD)
app.get('/api/v1/notification-preferences', (req, res) => {
  const { userId, businessId } = getRequestAuthContext(req);
  const targetId = userId || businessId || 'default-user';
  const prefs = notificationService.getUserPreferences(targetId);
  const consentMatrix = consentService.getLatestConsentMatrix(targetId);
  const consentHistory = consentService.getUserConsentHistory(targetId);

  res.json({
    success: true,
    data: prefs,
    consents: consentMatrix,
    history: consentHistory,
  });
});

app.patch('/api/v1/notification-preferences', (req, res) => {
  const { userId, businessId } = getRequestAuthContext(req);
  const targetId = userId || businessId || 'default-user';
  const source = req.body?.source || 'NOTIFICATION_CENTER_UI';

  // RÈGLE : Toute modification des notificationPreferences du user écrit une ligne de consentement horodatée.
  const updated = notificationService.updateUserPreferences(targetId, req.body, source);
  const consentMatrix = consentService.getLatestConsentMatrix(targetId);
  const consentHistory = consentService.getUserConsentHistory(targetId);

  res.json({
    success: true,
    data: updated,
    consents: consentMatrix,
    history: consentHistory,
    message: 'Préférences et consentements horodatés enregistrés avec succès.',
  });
});

// Registre des consentements horodatés (Consultation et audit utilisateur)
app.get('/api/v1/consents', (req, res) => {
  const { userId, businessId } = getRequestAuthContext(req);
  const targetId = userId || businessId || 'default-user';
  const history = consentService.getUserConsentHistory(targetId);
  const matrix = consentService.getLatestConsentMatrix(targetId);

  res.json({
    success: true,
    data: history,
    matrix,
    count: history.length,
  });
});

app.post('/api/v1/consents', (req, res) => {
  const { userId, businessId } = getRequestAuthContext(req);
  const targetId = userId || businessId || 'default-user';
  const { channel, category, granted, source } = req.body;

  if (!channel || !category) {
    return res.status(400).json({ success: false, message: 'Canal et catégorie de consentement obligatoires.' });
  }

  const entry = consentService.recordConsent({
    userId: targetId,
    channel,
    category,
    granted: !!granted,
    source: source || 'USER_SETTINGS_EXPLICIT',
  });

  res.json({
    success: true,
    data: entry,
    message: `Consentement ${granted ? 'accordé' : 'révoqué'} pour le canal ${channel} (${category}).`,
  });
});

// Logs de communication pour le client ou pro connecté
app.get('/api/v1/communications', (req, res) => {
  const { role, userId, businessId: currentBusinessId } = getRequestAuthContext(req);
  const recipientId = role === 'BUSINESS_OWNER' ? currentBusinessId : userId;

  const logs = communicationService.getLogs({
    recipientId: recipientId || undefined,
    tenantId: currentBusinessId || undefined,
    limit: 50,
  });

  res.json({ success: true, data: logs, count: logs.length });
});

// Super Admin : Logs complets de communication
app.get('/api/v1/admin/communications', (req, res) => {
  const { role } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const channel = req.query.channel as any;
  const status = req.query.status as any;
  const recipientType = req.query.recipient_type as any;
  const limit = req.query.limit ? Number(req.query.limit) : 100;

  const logs = communicationService.getLogs({
    channel: channel !== 'ALL' ? channel : undefined,
    status: status !== 'ALL' ? status : undefined,
    recipientType: recipientType !== 'ALL' ? recipientType : undefined,
    limit,
  });

  res.json({ success: true, data: logs, count: logs.length });
});

// Super Admin : Statistiques de communication & état des providers
app.get('/api/v1/admin/communications/stats', (req, res) => {
  const { role } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const stats = communicationService.getStats();
  res.json({ success: true, data: stats });
});

// Super Admin : Relancer une communication échouée (retry)
app.post('/api/v1/admin/communications/:id/retry', async (req, res) => {
  const { role } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const result = await communicationService.retryCommunication(req.params.id);
  res.json({ success: result.success, message: result.message, log: result.log });
});

// Super Admin : Configuration globale des canaux
app.patch('/api/v1/admin/communications/channels', (req, res) => {
  const { role } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const updated = communicationService.updateChannelSettings(req.body);
  res.json({ success: true, data: updated, message: 'Configuration globale des canaux mise à jour.' });
});

// Déclencheur de test (pour vérifier la chaîne de communication)
app.post('/api/v1/notifications/test-event', (req, res) => {
  const { role, userId, businessId: currentBusinessId } = getRequestAuthContext(req);
  const { title, message, category, priority, channels, recipientEmail, recipientPhone } = req.body;

  const result = notificationService.notify({
    recipientType: role === 'BUSINESS_OWNER' ? 'BUSINESS' : 'CLIENT',
    recipientId: (role === 'BUSINESS_OWNER' ? currentBusinessId : userId) || 'usr-test',
    recipientName: 'Testeur Flowexa',
    recipientEmail: recipientEmail,
    recipientPhone: recipientPhone,
    title: title || 'Notification de vérification Flowexa',
    message: message || 'Ceci est un test de la chaîne de communication unifiée Flowexa.',
    category: category || 'SYSTEM',
    priority: priority || 'NORMAL',
    channels: channels || ['INTERNAL'],
  });

  res.json({ success: result.success, notification: result.notification, skippedReason: result.skippedReason });
});


// -------------------------------------------------------------
// 9. SPRINT B13: FAVORIS (Client Only - Strict Multi-Tenant)
// -------------------------------------------------------------

// 9.1 GET /api/v1/favorites - Consulter ses favoris
app.get(['/api/v1/favorites', '/api/v1/favorites/my', '/api/v1/client/favorites'], (req, res) => {
  const { role, userId } = getRequestAuthContext(req);
  const requestedClientId = (req.query.client_id as string) || userId;

  // Un client ne doit accéder qu'à ses propres favoris
  if (role !== 'SUPER_ADMIN' && requestedClientId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Vous ne pouvez consulter que vos propres favoris.',
    });
  }

  const list = store.getFavoritesByClient(requestedClientId);
  res.json({
    success: true,
    data: list,
    count: list.length,
    clientId: requestedClientId,
  });
});

// 9.2 POST /api/v1/favorites - Ajouter un favori (Entreprise ou Offre, sans doublons)
app.post(['/api/v1/favorites', '/api/v1/client/favorites'], (req, res) => {
  const { userId } = getRequestAuthContext(req);
  const { businessId, catalogItemId } = req.body;

  const result = store.addFavorite({
    clientId: userId,
    businessId,
    catalogItemId,
  });

  if (!result.success) {
    const statusCode = result.code === 'DUPLICATE_FAVORITE' ? 409 : 400;
    return res.status(statusCode).json({
      success: false,
      code: result.code,
      message: result.error,
    });
  }

  store.logAudit({
    userId,
    userEmail: 'client@flowexa.com',
    action: 'FAVORITE_ADD',
    entityType: 'FAVORITE',
    entityId: result.favorite!.id,
    description: `Ajout en favori de ${catalogItemId ? `l'offre ${catalogItemId}` : `l'entreprise ${businessId}`} par le client ${userId}`,
    ip: req.ip || '127.0.0.1',
  });

  res.status(201).json({
    success: true,
    data: result.favorite,
    message: 'Élément ajouté à vos favoris avec succès.',
  });
});

// 9.3 DELETE /api/v1/favorites/:id - Retirer un favori par son identifiant
app.delete('/api/v1/favorites/:id', (req, res) => {
  const { role, userId } = getRequestAuthContext(req);
  const db = store.getDb();
  const fav = (db.favorites || []).find((f) => f.id === req.params.id);

  if (!fav) {
    return res.status(404).json({ success: false, message: 'Favori introuvable.' });
  }

  // Contrôle de permission : le client ne peut retirer que son propre favori
  if (role !== 'SUPER_ADMIN' && fav.clientId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Vous ne pouvez retirer que vos propres favoris.',
    });
  }

  store.removeFavorite(fav.id, fav.clientId);

  store.logAudit({
    userId,
    userEmail: 'client@flowexa.com',
    action: 'FAVORITE_REMOVE',
    entityType: 'FAVORITE',
    entityId: fav.id,
    description: `Retrait du favori ${fav.id} par le client ${userId}`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({ success: true, message: 'Favori retiré avec succès.' });
});

// 9.4 DELETE /api/v1/favorites - Retirer par cible (business_id ou catalog_item_id)
app.delete('/api/v1/favorites', (req, res) => {
  const { userId } = getRequestAuthContext(req);
  const businessId = (req.query.business_id as string) || (req.body.businessId as string);
  const catalogItemId = (req.query.catalog_item_id as string) || (req.body.catalogItemId as string);

  if (!businessId && !catalogItemId) {
    return res.status(400).json({ success: false, message: 'Paramètre business_id ou catalog_item_id requis.' });
  }

  const result = store.removeFavoriteByTarget(userId, { businessId, catalogItemId });
  if (!result.success) {
    return res.status(404).json({ success: false, message: result.error || 'Favori introuvable.' });
  }

  res.json({ success: true, message: 'Favori retiré avec succès.' });
});

// -------------------------------------------------------------
// 10. SPRINT B13: AVIS & NOTATION (Avis Vérifiés, Pas de fausses notes)
// -------------------------------------------------------------

// 10.1 POST /api/v1/reviews - Déposer un avis (Uniquement sur interaction COMPLETED)
app.post('/api/v1/reviews', (req, res) => {
  const auth = getRequestAuthContext(req);
  const userId = auth.userId || (req.headers['x-user-id'] as string) || (req.headers['x-client-id'] as string) || (req.query.client_id as string);
  const role = auth.role || (req.headers['x-user-role'] as string) || (req.query.role as string);

  if (!userId && !role) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Authentification requise pour déposer un avis.',
    });
  }

  const { clientPhone } = auth;
  const {
    requestId,
    rating,
    comment,
    clientName,
    clientEmail,
  } = req.body;

  if (!requestId) {
    return res.status(400).json({ success: false, message: 'requestId est obligatoire.' });
  }

  const result = store.createReview({
    clientId: userId,
    clientName,
    clientPhone,
    clientEmail,
    requestId,
    rating: Number(rating),
    comment,
  });

  if (!result.success) {
    let statusCode = 400;
    if (result.code === 'REQUEST_NOT_FOUND') statusCode = 404;
    else if (result.code === 'FORBIDDEN') statusCode = 403;
    else if (result.code === 'ALREADY_REVIEWED') statusCode = 409;

    return res.status(statusCode).json({
      success: false,
      code: result.code,
      message: result.error,
    });
  }

  res.status(201).json({
    success: true,
    data: result.review,
    message: 'Votre avis vérifié a été publié avec succès. Merci de votre confiance !',
  });
});

// 10.2 GET /api/v1/reviews - Consultation publique des avis (PUBLISHED uniquement)
app.get('/api/v1/reviews', (req, res) => {
  const businessId = (req.query.business_id as string) || undefined;
  const catalogItemId = (req.query.catalog_item_id as string) || undefined;

  // Calcul certifié de la note
  const ratingSummary = store.calculateRating(businessId, catalogItemId);

  // Pour le public, ne renvoyer que les avis PUBLISHED
  const reviews = store.getReviews({
    businessId,
    catalogItemId,
    publicOnly: true,
  });

  res.json({
    success: true,
    data: reviews,
    count: reviews.length,
    ratingSummary,
  });
});

// 10.3 GET /api/v1/reviews/my - Mes avis déposés (Espace Client)
app.get('/api/v1/reviews/my', (req, res) => {
  const { userId } = getRequestAuthContext(req);
  const myReviews = store.getReviews({ clientId: userId });

  res.json({
    success: true,
    data: myReviews,
    count: myReviews.length,
  });
});

// 10.4 GET /api/v1/businesses/:id/reviews - Avis de l'entreprise (Espace Pro)
app.get('/api/v1/businesses/:id/reviews', (req, res) => {
  const { role, businessId: currentBusinessId } = getRequestAuthContext(req);
  const targetBizId = req.params.id;

  // Sécurité multi-tenant : une entreprise ne voit pas les avis d'une autre entreprise en privé
  if (role === 'BUSINESS_OWNER' && currentBusinessId && currentBusinessId !== targetBizId) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Vous ne pouvez consulter que les avis de votre propre entreprise.',
    });
  }

  // L'entreprise peut voir tous ses avis (PUBLISHED et en cours)
  const list = store.getReviews({ businessId: targetBizId });
  const ratingSummary = store.calculateRating(targetBizId);

  res.json({
    success: true,
    data: {
      rating: ratingSummary.averageRating,
      averageRating: ratingSummary.averageRating,
      reviewCount: ratingSummary.reviewCount,
      reviews: list,
      ratingSummary,
    },
    reviews: list,
    count: list.length,
    ratingSummary,
    rating: ratingSummary.averageRating,
    reviewCount: ratingSummary.reviewCount,
  });
});

// 10.5 POST /api/v1/reviews/:id/report - Signaler un avis
app.post('/api/v1/reviews/:id/report', (req, res) => {
  const { userId } = getRequestAuthContext(req);
  const { reason, details, reporterName } = req.body;

  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Le motif de signalement est obligatoire.',
    });
  }

  const reasonMap: Record<string, 'SPAM' | 'INAPPROPRIATE' | 'FALSE_INFO' | 'OFFENSIVE' | 'OTHER'> = {
    'SPAM': 'SPAM',
    'spam': 'SPAM',
    'INAPPROPRIATE': 'INAPPROPRIATE',
    'inappropriate': 'INAPPROPRIATE',
    'Contenu inapproprié': 'INAPPROPRIATE',
    'contenu inapproprié': 'INAPPROPRIATE',
    'FALSE_INFO': 'FALSE_INFO',
    'false_info': 'FALSE_INFO',
    'Information fausse': 'FALSE_INFO',
    'information fausse': 'FALSE_INFO',
    'OFFENSIVE': 'OFFENSIVE',
    'offensive': 'OFFENSIVE',
    'Contenu offensant': 'OFFENSIVE',
    'contenu offensant': 'OFFENSIVE',
    'OTHER': 'OTHER',
    'other': 'OTHER',
    'Autre': 'OTHER',
    'autre': 'OTHER',
  };

  const normalizedReason = reasonMap[reason.trim()] || (['SPAM', 'INAPPROPRIATE', 'FALSE_INFO', 'OFFENSIVE', 'OTHER'].includes(reason.trim()) ? reason.trim() as any : null);

  if (!normalizedReason) {
    return res.status(400).json({
      success: false,
      message: `Motif invalide. Valeurs acceptées : SPAM, INAPPROPRIATE, FALSE_INFO, OFFENSIVE, OTHER`,
    });
  }

  const result = store.reportReview({
    reviewId: req.params.id,
    reporterId: userId,
    reporterName: reporterName || 'Utilisateur Flowexa',
    reason: normalizedReason,
    details: details || '',
  });

  if (!result.success) {
    return res.status(404).json({ success: false, message: result.error });
  }

  res.status(201).json({
    success: true,
    data: result.report,
    message: 'Votre signalement a été enregistré et transmis à l\'équipe de modération.',
  });
});

// -------------------------------------------------------------
// 10.6 SUPER ADMIN: GESTION & MODÉRATION DES AVIS
// -------------------------------------------------------------

// Super Admin : Liste globale de tous les avis
app.get('/api/v1/admin/reviews', (req, res) => {
  const { role } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs.' });
  }

  const status = req.query.status as any;
  const reportedOnly = req.query.reported_only === 'true';

  let list = store.getReviews({ status });
  if (reportedOnly) {
    list = list.filter((r) => (r.reportCount || 0) > 0);
  }

  res.json({
    success: true,
    data: list,
    count: list.length,
  });
});

// Super Admin : Consulter les signalements
app.get('/api/v1/admin/reviews/reports', (req, res) => {
  const { role } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs.' });
  }

  const status = req.query.status as any;
  const reports = store.getReviewReports(status);

  res.json({
    success: true,
    data: reports,
    count: reports.length,
  });
});

// Super Admin : Masquer un avis (HIDDEN)
const handleHideReview = (req: express.Request, res: express.Response) => {
  const { role, userId } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs.' });
  }

  const reason = req.body.reason || 'Non respect des règles communautaires.';
  const result = store.updateReviewStatus(req.params.id, 'HIDDEN', userId, 'Super Admin Flowexa', reason);

  if (!result.success) {
    return res.status(404).json({ success: false, message: result.error });
  }

  res.json({
    success: true,
    data: result.review,
    message: 'L\'avis a été masqué du public avec succès.',
  });
};
app.post('/api/v1/admin/reviews/:id/hide', handleHideReview);
app.patch('/api/v1/admin/reviews/:id/hide', handleHideReview);

// Super Admin : Restaurer un avis (PUBLISHED)
const handleRestoreReview = (req: express.Request, res: express.Response) => {
  const { role, userId } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs.' });
  }

  const reason = req.body.reason || 'Conforme après vérification approfondie.';
  const result = store.updateReviewStatus(req.params.id, 'PUBLISHED', userId, 'Super Admin Flowexa', reason);

  if (!result.success) {
    return res.status(404).json({ success: false, message: result.error });
  }

  res.json({
    success: true,
    data: result.review,
    message: 'L\'avis a été restauré en statut publié.',
  });
};
app.post('/api/v1/admin/reviews/:id/restore', handleRestoreReview);
app.patch('/api/v1/admin/reviews/:id/restore', handleRestoreReview);

// Super Admin : Rejeter un avis (REJECTED)
const handleRejectReview = (req: express.Request, res: express.Response) => {
  const { role, userId } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs.' });
  }

  const reason = req.body.reason || 'Rejeté par la modération.';
  const result = store.updateReviewStatus(req.params.id, 'REJECTED', userId, 'Super Admin Flowexa', reason);

  if (!result.success) {
    return res.status(404).json({ success: false, message: result.error });
  }

  res.json({
    success: true,
    data: result.review,
    message: 'L\'avis a été rejeté.',
  });
};
app.post('/api/v1/admin/reviews/:id/reject', handleRejectReview);
app.patch('/api/v1/admin/reviews/:id/reject', handleRejectReview);

// Super Admin : Supprimer un avis
app.delete('/api/v1/admin/reviews/:id', (req, res) => {
  const { role, userId } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs.' });
  }

  const reason = req.body.reason || 'Suppression administrative';
  const result = store.deleteReview(req.params.id, userId, 'Super Admin Flowexa', reason);

  if (!result.success) {
    return res.status(404).json({ success: false, message: result.error });
  }

  res.json({
    success: true,
    message: 'L\'avis a été supprimé définitivement du système.',
  });
});

// Super Admin : Traiter un signalement (Résoudre / Classer sans suite)
app.post('/api/v1/admin/reviews/reports/:id/resolve', (req, res) => {
  const { role, userId } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs.' });
  }

  const result = store.updateReviewReportStatus(req.params.id, 'RESOLVED', userId, 'Super Admin Flowexa');
  if (!result.success) {
    return res.status(404).json({ success: false, message: result.error });
  }

  res.json({
    success: true,
    data: result.report,
    message: 'Signalement marqué comme résolu.',
  });
});

app.post('/api/v1/admin/reviews/reports/:id/dismiss', (req, res) => {
  const { role, userId } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs.' });
  }

  const result = store.updateReviewReportStatus(req.params.id, 'DISMISSED', userId, 'Super Admin Flowexa');
  if (!result.success) {
    return res.status(404).json({ success: false, message: result.error });
  }

  res.json({
    success: true,
    data: result.report,
    message: 'Signalement classé sans suite.',
  });
});

// -------------------------------------------------------------
// 8. SUPER ADMIN & AUDIT (SPRINT B29)
// -------------------------------------------------------------

// 1. Dashboard Synthèse Globale (100% données réelles)
app.get(['/api/v1/admin/dashboard', '/api/v1/admin/dashboard/summary'], (req, res) => {
  const { role } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const summary = store.getAdminDashboardSummary();
  res.json({ success: true, data: summary });
});

// Backward-compatible stats endpoint
app.get('/api/v1/admin/stats', (req, res) => {
  const { role } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const db = store.getDb();
  const summary = store.getAdminDashboardSummary();
  res.json({
    success: true,
    data: {
      ...summary,
      totalBusinesses: summary.businesses.total,
      activeBusinesses: summary.businesses.active,
      suspendedBusinesses: summary.businesses.suspended,
      totalProperties: db.properties?.length || 0,
      totalRooms: db.rooms?.length || 0,
      totalServices: db.services?.length || 0,
      totalBookings: summary.requests.bookings,
      totalDemandes: summary.requests.demandes,
      totalAuditLogs: summary.businesses.total,
    },
  });
});

// 2. Gestion & Modération des Entreprises
app.get('/api/v1/admin/businesses', (req, res) => {
  const { role } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const search = req.query.search as string;
  const status = (req.query.status as string) || (req.query.filter as string);
  const moduleCode = (req.query.module_code as string) || (req.query.category as string);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const result = store.getAdminBusinesses({ search, status, moduleCode, page, limit });
  res.json({
    success: true,
    data: result.data,
    total: result.total,
    count: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  });
});

app.get('/api/v1/admin/businesses/:id', (req, res) => {
  const { role } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const detail = store.getAdminBusinessDetail(req.params.id);
  if (!detail) {
    return res.status(404).json({ success: false, message: 'Entreprise introuvable.' });
  }

  res.json({ success: true, data: detail });
});

app.post('/api/v1/admin/businesses/:id/activate', (req, res) => {
  const { role, userId, userEmail } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const result = store.moderateBusiness(req.params.id, 'VALIDATE', {}, {
    userId: userId || 'admin',
    userEmail: userEmail || 'admin@flowexa.com',
    ip: req.ip || '127.0.0.1',
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json({ success: true, data: result.business, message: 'Entreprise validée et publiée.' });
});

app.post('/api/v1/admin/businesses/:id/suspend', (req, res) => {
  const { role, userId, userEmail } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const reason = req.body.reason || req.body.motif || 'Décision administrative.';
  const result = store.moderateBusiness(req.params.id, 'SUSPEND', { reason }, {
    userId: userId || 'admin',
    userEmail: userEmail || 'admin@flowexa.com',
    ip: req.ip || '127.0.0.1',
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json({ success: true, data: result.business, message: 'Entreprise suspendue avec succès.' });
});

app.post('/api/v1/admin/businesses/:id/moderate', (req, res) => {
  const { role, userId, userEmail } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const action = req.body.action as any;
  const reason = req.body.reason || req.body.notes;

  if (!action || !['VALIDATE', 'REJECT', 'REQUEST_CHANGES', 'SUSPEND', 'REACTIVATE', 'ARCHIVE'].includes(action)) {
    return res.status(400).json({ success: false, message: 'Action de modération invalide.' });
  }

  const result = store.moderateBusiness(req.params.id, action, { reason }, {
    userId: userId || 'admin',
    userEmail: userEmail || 'admin@flowexa.com',
    ip: req.ip || '127.0.0.1',
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json({ success: true, data: result.business, message: `Action ${action} effectuée avec succès.` });
});

app.post('/api/v1/admin/businesses/:id/toggle-status', (req, res) => {
  const { role, userId, userEmail } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const db = store.getDb();
  const business = db.businesses.find((b) => b.id === req.params.id);
  if (!business) {
    return res.status(404).json({ success: false, message: 'Entreprise introuvable.' });
  }

  const nextAction = (business.status === 'ACTIVE' || business.status === 'PUBLISHED') ? 'SUSPEND' : 'REACTIVATE';
  const result = store.moderateBusiness(req.params.id, nextAction, { reason: 'Bascule de statut' }, {
    userId: userId || 'admin',
    userEmail: userEmail || 'admin@flowexa.com',
    ip: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    data: result.business,
    message: `Entreprise ${business.name} passée en statut ${result.business?.status}. Action consignée dans l'audit.`,
  });
});

// 3. Gestion des Utilisateurs Plateforme
app.get(['/api/v1/admin/users', '/api/admin/users'], (req, res) => {
  const { role } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const search = req.query.search as string;
  const userRole = (req.query.role as string) || (req.query.user_role as string);
  const status = req.query.status as string;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const result = store.getAdminUsers({ search, role: userRole, status, page, limit });
  res.json({
    success: true,
    data: result.data,
    total: result.total,
    count: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  });
});

app.get('/api/v1/admin/users/:id', (req, res) => {
  const { role } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const detail = store.getAdminUserDetail(req.params.id);
  if (!detail) {
    return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
  }

  res.json({ success: true, data: detail });
});

app.put('/api/v1/admin/users/:id/status', (req, res) => {
  const { role, userId: actorId, userEmail: actorEmail } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const status = req.body.status;
  const reason = req.body.reason;
  if (!status || !['ACTIVE', 'SUSPENDED', 'ARCHIVED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Statut utilisateur invalide.' });
  }

  const result = store.updateAdminUserStatus(req.params.id, status, reason, {
    userId: actorId || 'admin',
    userEmail: actorEmail || 'admin@flowexa.com',
    ip: req.ip || '127.0.0.1',
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json({ success: true, data: result.user, message: `Statut utilisateur mis à jour en ${status}.` });
});

app.post('/api/v1/admin/users/:id/suspend', (req, res) => {
  const { role, userId: actorId, userEmail: actorEmail } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const result = store.updateAdminUserStatus(req.params.id, 'SUSPENDED', req.body.reason, {
    userId: actorId || 'admin',
    userEmail: actorEmail || 'admin@flowexa.com',
    ip: req.ip || '127.0.0.1',
  });

  if (!result.success) return res.status(400).json(result);
  res.json({ success: true, data: result.user, message: 'Utilisateur suspendu.' });
});

app.post('/api/v1/admin/users/:id/activate', (req, res) => {
  const { role, userId: actorId, userEmail: actorEmail } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const result = store.updateAdminUserStatus(req.params.id, 'ACTIVE', req.body.reason, {
    userId: actorId || 'admin',
    userEmail: actorEmail || 'admin@flowexa.com',
    ip: req.ip || '127.0.0.1',
  });

  if (!result.success) return res.status(400).json(result);
  res.json({ success: true, data: result.user, message: 'Utilisateur activé.' });
});

app.put('/api/v1/admin/users/:id/role', (req, res) => {
  const { role, userId: actorId, userEmail: actorEmail } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const newRole = req.body.role;
  if (!newRole || !['SUPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'EMPLOYEE', 'CLIENT'].includes(newRole)) {
    return res.status(400).json({ success: false, message: 'Rôle invalide.' });
  }

  const result = store.updateAdminUserRole(req.params.id, newRole, {
    userId: actorId || 'admin',
    userEmail: actorEmail || 'admin@flowexa.com',
    ip: req.ip || '127.0.0.1',
  });

  if (!result.success) return res.status(400).json(result);
  res.json({ success: true, data: result.user, message: `Rôle mis à jour en ${newRole}.` });
});

app.delete('/api/v1/admin/users/:id', (req, res) => {
  const { role, userId: actorId, userEmail: actorEmail } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const result = store.softDeleteAdminUser(req.params.id, {
    userId: actorId || 'admin',
    userEmail: actorEmail || 'admin@flowexa.com',
    ip: req.ip || '127.0.0.1',
  });

  if (!result.success) return res.status(400).json(result);
  res.json({ success: true, message: 'Utilisateur archivé avec succès (conservation intégrité des données).' });
});

// 4. Gestion des Catégories / Métiers (Pas de module textile/couturier)
app.get('/api/v1/admin/categories', (req, res) => {
  const { role } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const categories = store.getPlatformCategories();
  res.json({ success: true, data: categories, count: categories.length });
});

app.post('/api/v1/admin/categories', (req, res) => {
  const { role, userId, userEmail } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const result = store.createPlatformCategory(req.body, {
    userId: userId || 'admin',
    userEmail: userEmail || 'admin@flowexa.com',
    ip: req.ip || '127.0.0.1',
  });

  if (!result.success) return res.status(400).json(result);
  res.json({ success: true, data: result.category, message: 'Catégorie créée avec succès.' });
});

app.put('/api/v1/admin/categories/:id', (req, res) => {
  const { role, userId, userEmail } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const result = store.updatePlatformCategory(req.params.id, req.body, {
    userId: userId || 'admin',
    userEmail: userEmail || 'admin@flowexa.com',
    ip: req.ip || '127.0.0.1',
  });

  if (!result.success) return res.status(400).json(result);
  res.json({ success: true, data: result.category, message: 'Catégorie mise à jour.' });
});

app.patch('/api/v1/admin/categories/:id/toggle', (req, res) => {
  const { role, userId, userEmail } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const result = store.togglePlatformCategory(req.params.id, {
    userId: userId || 'admin',
    userEmail: userEmail || 'admin@flowexa.com',
    ip: req.ip || '127.0.0.1',
  });

  if (!result.success) return res.status(400).json(result);
  res.json({ success: true, data: result.category, message: `Catégorie ${result.category?.isActive ? 'activée' : 'désactivée'}.` });
});

// 5. Paramètres Globaux de la Plateforme
app.get('/api/v1/admin/settings', (req, res) => {
  const { role } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const settings = store.getPlatformSettings();
  res.json({ success: true, data: settings });
});

app.put('/api/v1/admin/settings', (req, res) => {
  const { role, userId, userEmail } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const result = store.updatePlatformSettings(req.body, {
    userId: userId || 'admin',
    userEmail: userEmail || 'admin@flowexa.com',
    ip: req.ip || '127.0.0.1',
  });

  res.json({ success: true, data: result.settings, message: 'Paramètres plateforme enregistrés avec succès.' });
});

// 6. Audit Logs Centralisés
app.get('/api/v1/admin/audit-logs', (req, res) => {
  const { role } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const search = req.query.search as string;
  const action = req.query.action as string;
  const entityType = req.query.entity_type as string;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;

  const result = store.getAdminAuditLogs({ search, action, entityType, page, limit });
  res.json({
    success: true,
    data: result.data,
    total: result.total,
    count: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  });
});

// SPRINT B31 : Diagnostic & Audit de Sécurité Super Admin
app.get('/api/v1/admin/security/status', (req, res) => {
  const { role } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const status = SecurityService.getSecurityStatus();
  res.json({ success: true, data: status });
});

app.post('/api/v1/admin/security/run-tests', (req, res) => {
  const { role, userEmail } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const results = SecurityService.runAutomatedSecurityAudit();
  store.logAudit({
    userId: 'admin',
    userEmail: userEmail || 'admin@flowexa.bj',
    action: 'SECURITY_AUDIT_RUN',
    entityType: 'SECURITY',
    entityId: 'audit-suite',
    description: `Audit de sécurité automatisé exécuté : ${results.summary.passed}/${results.summary.total} tests réussis (${results.summary.rate})`,
    ip: (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1',
    result: results.summary.failed === 0 ? 'SUCCESS' : 'WARNING',
  });

  res.json({ success: true, data: results });
});

// 7. Supervision Globale des Demandes & Réservations
app.get('/api/v1/admin/requests', (req, res) => {
  const { role } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const search = req.query.search as string;
  const status = req.query.status as string;
  const interactionType = req.query.interaction_type as string;
  const businessId = req.query.business_id as string;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const result = store.getAdminRequests({ search, status, interactionType, businessId, page, limit });
  res.json({
    success: true,
    data: result.data,
    total: result.total,
    count: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  });
});

// -------------------------------------------------------------
// SPRINT B14: MESSAGERIE & CONVERSATIONS CLIENT / ENTREPRISE
// -------------------------------------------------------------

// 1. GET /api/v1/conversations - Liste des conversations selon le rôle et l'identité
app.get('/api/v1/conversations', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }
  const { role, userId, businessId } = auth;
  const search = req.query.search as string;
  const status = req.query.status as any;
  const filterBizId = req.query.business_id as string;
  const filterClientId = req.query.client_id as string;

  if (role === 'BUSINESS_OWNER' || role === 'MANAGER' || role === 'EMPLOYEE') {
    if (!businessId) {
      return res.status(403).json({ success: false, message: 'Accès refusé. Aucun établissement rattaché.' });
    }
    if (filterBizId && filterBizId !== businessId) {
      return res.status(403).json({ success: false, message: 'Violation d’isolation multi-tenant.' });
    }
  } else if (role === 'CLIENT') {
    if (filterClientId && filterClientId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous ne pouvez pas accéder aux messages d’un autre client.',
      });
    }
  }

  const result = store.getConversations(
    { role, clientId: userId, businessId },
    { search, status, businessId: filterBizId, clientId: filterClientId }
  );

  res.json({
    success: true,
    data: result.items,
    total: result.total,
    unreadTotal: result.unreadTotal,
  });
});

// 2. GET /api/v1/conversations/unread-count - Compteur global de messages non lus
app.get('/api/v1/conversations/unread-count', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }
  const { role, userId, businessId } = auth;
  const result = store.getConversations({ role, clientId: userId, businessId });
  res.json({
    success: true,
    unreadCount: result.unreadTotal,
  });
});

// 3. GET /api/v1/conversations/:id - Détail d'une conversation avec vérification des droits
app.get('/api/v1/conversations/:id', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }
  const { role, userId, businessId } = auth;
  const convId = req.params.id;

  const result = store.getConversationById(convId, { role, clientId: userId, businessId });
  if (!result.success) {
    return res.status(result.code === 'FORBIDDEN' ? 403 : 404).json({
      success: false,
      error: result.error,
    });
  }

  res.json({
    success: true,
    data: result.conversation,
  });
});

// 4. POST /api/v1/conversations - Initier ou récupérer une conversation existante (anti-doublon)
app.post('/api/v1/conversations', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }
  const { role, userId, businessId: callerBizId } = auth;
  const body = req.body || {};

  let clientId: string;
  let businessId: string;

  if (role === 'SUPER_ADMIN') {
    clientId = body.clientId || userId;
    businessId = body.businessId || callerBizId;
  } else if (role === 'CLIENT') {
    clientId = userId; // Forcé depuis le JWT !
    businessId = body.businessId;
  } else {
    // PRO (BUSINESS_OWNER / MANAGER / EMPLOYEE)
    if (!callerBizId) {
      return res.status(403).json({ success: false, message: 'Accès refusé. Aucun établissement rattaché.' });
    }
    if (body.businessId && body.businessId !== callerBizId) {
      return res.status(403).json({ success: false, message: 'Violation d’isolation multi-tenant.' });
    }
    businessId = callerBizId; // Forcé depuis le JWT !
    clientId = body.clientId;
  }

  if (!clientId) {
    return res.status(400).json({ success: false, error: 'Identifiant client requis.' });
  }
  if (!businessId) {
    return res.status(400).json({ success: false, error: 'Identifiant entreprise requis.' });
  }

  const result = store.createOrGetConversation({
    clientId,
    clientName: body.clientName || 'Client Flowexa',
    clientPhone: body.clientPhone || '0154100617',
    clientEmail: body.clientEmail,
    businessId,
    requestId: body.requestId,
    bookingId: body.bookingId,
    appointmentId: body.appointmentId,
    catalogItemId: body.catalogItemId,
    initialMessage: body.initialMessage,
    callerRole: role,
  });

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error,
    });
  }

  res.status(result.isExisting ? 200 : 201).json({
    success: true,
    data: result.conversation,
    isExisting: result.isExisting,
  });
});

// 5. GET /api/v1/conversations/:id/messages - Historique des messages d'une conversation
app.get('/api/v1/conversations/:id/messages', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }
  const { role, userId, businessId } = auth;
  const convId = req.params.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 100;

  const result = store.getConversationMessages(
    convId,
    { role, clientId: userId, businessId },
    { page, limit }
  );

  if (!result.success) {
    return res.status(result.code === 'FORBIDDEN' ? 403 : 404).json({
      success: false,
      error: result.error,
    });
  }

  res.json({
    success: true,
    data: result.messages,
    total: result.total,
    page: result.page,
    limit: result.limit,
  });
});

// 6. POST /api/v1/conversations/:id/messages - Envoyer un message dans une conversation
const handleSendMessage = (req: express.Request, res: express.Response) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }
  const { role, userId, businessId } = auth;
  const convId = req.params.id || req.body.conversationId;
  const content = req.body.content;

  if (!convId) {
    return res.status(400).json({ success: false, error: 'Identifiant conversation requis.' });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, error: 'Le contenu du message est requis.' });
  }

  // Vérifier d'abord que la conversation existe et que l'utilisateur y a accès
  const convCheck = store.getConversationById(convId, { role, clientId: userId, businessId });
  if (!convCheck.success || !convCheck.conversation) {
    return res.status(convCheck.code === 'FORBIDDEN' ? 403 : 404).json({
      success: false,
      error: convCheck.error,
    });
  }

  let senderRole: 'CLIENT' | 'BUSINESS' | 'SUPER_ADMIN' = 'CLIENT';
  let senderName = req.body.senderName || 'Client Flowexa';

  if (role === 'SUPER_ADMIN') {
    senderRole = 'SUPER_ADMIN';
    senderName = 'Support Flowexa (Super Admin)';
  } else if (role === 'BUSINESS_OWNER' || businessId === convCheck.conversation.businessId) {
    senderRole = 'BUSINESS';
    senderName = convCheck.conversation.businessName || 'Établissement';
  } else {
    senderRole = 'CLIENT';
    senderName = convCheck.conversation.clientName || 'Client';
  }

  const result = store.addMessage({
    conversationId: convId,
    senderRole,
    senderId: userId,
    senderName,
    content: content.trim(),
    attachments: req.body.attachments || [],
  });

  if (!result.success) {
    return res.status(result.code === 'CONVERSATION_CLOSED' ? 400 : 404).json({
      success: false,
      error: result.error,
      code: result.code,
    });
  }

  res.status(201).json({
    success: true,
    data: result.message,
    conversation: result.conversation,
  });
};

app.post('/api/v1/conversations/:id/messages', handleSendMessage);
app.post('/api/v1/messages', handleSendMessage);

// 7. PATCH & POST /api/v1/conversations/:id/read - Marquer les messages comme lus
const handleMarkRead = (req: express.Request, res: express.Response) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }
  const { role, userId, businessId } = auth;
  const convId = req.params.id;

  const convCheck = store.getConversationById(convId, { role, clientId: userId, businessId });
  if (!convCheck.success) {
    return res.status(convCheck.code === 'FORBIDDEN' ? 403 : 404).json({
      success: false,
      error: convCheck.error,
    });
  }

  const readerRole = role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : role === 'BUSINESS_OWNER' ? 'BUSINESS' : 'CLIENT';
  const result = store.markConversationMessagesRead(convId, readerRole, userId);

  res.json({
    success: true,
    count: result.count,
    message: `${result.count} message(s) marqué(s) comme lu(s).`,
  });
};

app.patch('/api/v1/conversations/:id/read', handleMarkRead);
app.post('/api/v1/conversations/:id/read', handleMarkRead);

// 8. PATCH & POST /api/v1/conversations/:id/close - Clôturer une conversation
const handleCloseConv = (req: express.Request, res: express.Response) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }
  const { role, userId, businessId } = auth;
  const convId = req.params.id;
  const reason = req.body.reason || 'Demande traitée et clôturée';

  const convCheck = store.getConversationById(convId, { role, clientId: userId, businessId });
  if (!convCheck.success) {
    return res.status(convCheck.code === 'FORBIDDEN' ? 403 : 404).json({
      success: false,
      error: convCheck.error,
    });
  }

  const closerName = role === 'SUPER_ADMIN' ? 'Super Admin' : role === 'BUSINESS_OWNER' ? 'Entreprise' : 'Client';
  const result = store.closeConversation(convId, closerName, reason, {
    userId,
    userEmail: role === 'SUPER_ADMIN' ? 'admin@flowexa.com' : 'user@flowexa.com',
    ip: (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1',
  });

  if (!result.success) {
    return res.status(404).json({ success: false, error: result.error });
  }

  res.json({
    success: true,
    data: result.conversation,
    message: 'Conversation clôturée avec succès.',
  });
};

app.patch('/api/v1/conversations/:id/close', handleCloseConv);
app.post('/api/v1/conversations/:id/close', handleCloseConv);

// 9. PATCH & POST /api/v1/conversations/:id/reopen - Réouvrir une conversation clôturée
const handleReopenConv = (req: express.Request, res: express.Response) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }
  const { role, userId, businessId } = auth;
  const convId = req.params.id;

  const convCheck = store.getConversationById(convId, { role, clientId: userId, businessId });
  if (!convCheck.success) {
    return res.status(convCheck.code === 'FORBIDDEN' ? 403 : 404).json({
      success: false,
      error: convCheck.error,
    });
  }

  const openerName = role === 'SUPER_ADMIN' ? 'Super Admin' : role === 'BUSINESS_OWNER' ? 'Entreprise' : 'Client';
  const result = store.reopenConversation(convId, openerName, {
    userId,
    userEmail: role === 'SUPER_ADMIN' ? 'admin@flowexa.com' : 'user@flowexa.com',
    ip: (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1',
  });

  if (!result.success) {
    return res.status(404).json({ success: false, error: result.error });
  }

  res.json({
    success: true,
    data: result.conversation,
    message: 'Conversation réouverte avec succès.',
  });
};

app.patch('/api/v1/conversations/:id/reopen', handleReopenConv);
app.post('/api/v1/conversations/:id/reopen', handleReopenConv);

// 10. GET /api/v1/admin/conversations - Supervision globale des conversations (Super Admin uniquement)
app.get('/api/v1/admin/conversations', (req, res) => {
  const { role } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Accès réservé au Super Administrateur.',
    });
  }

  const search = req.query.search as string;
  const status = req.query.status as any;
  const filterBizId = req.query.business_id as string;
  const filterClientId = req.query.client_id as string;

  const result = store.getConversations(
    { role: 'SUPER_ADMIN' },
    { search, status, businessId: filterBizId, clientId: filterClientId }
  );

  res.json({
    success: true,
    data: result.items,
    total: result.total,
    unreadTotal: result.unreadTotal,
  });
});

// =============================================================
// SPRINT B16: ROUTES PAIEMENTS, TRANSACTIONS & WEBHOOKS SÉCURISÉS
// =============================================================

// 1. GET /api/v1/payments/providers - Liste des opérateurs de paiement disponibles
app.get('/api/v1/payments/providers', (_req, res) => {
  res.json({
    success: true,
    data: getAllSupportedProviders(),
  });
});

// 2. POST /api/v1/payments - Initier un paiement sécurisé pour une réservation
app.post('/api/v1/payments', async (req, res) => {
  const { role, userId, clientPhone } = getRequestAuthContext(req);
  const { bookingId, provider, notes } = req.body;
  const idempotencyKey =
    req.body.idempotencyKey ||
    (req.headers['x-idempotency-key'] as string) ||
    (req.headers['idempotency-key'] as string);

  if (!bookingId || typeof bookingId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Identifiant de réservation obligatoire (bookingId).',
      code: 'MISSING_BOOKING_ID',
    });
  }

  const validProviders: PaymentProviderCode[] = ['KKIAPAY', 'MTN_MOMO', 'MOOV_MONEY', 'CELTIS_CASH', 'CARD_VISA_MC'];
  if (!provider || !validProviders.includes(provider)) {
    return res.status(400).json({
      success: false,
      error: `Passerelle de paiement invalide. Choix possibles : ${validProviders.join(', ')}.`,
      code: 'INVALID_PROVIDER',
    });
  }

  const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
  const auditActor = {
    userId: userId || 'client-anonymous',
    userEmail: role === 'SUPER_ADMIN' ? 'admin@flowexa.com' : 'client@flowexa.com',
    ip,
  };

  // Création du paiement et validation stricte du montant côté backend
  const targetBooking = store.getRequestById(bookingId);
  const creationResult = store.createPayment({
    bookingId,
    clientId: userId || targetBooking?.clientId || 'anonymous-client',
    clientName: req.body.clientName || targetBooking?.clientName || 'Client Flowexa',
    clientPhone: clientPhone || req.body.clientPhone || targetBooking?.clientPhone,
    provider,
    paymentType: req.body.paymentType,
    idempotencyKey,
    notes,
    callerRole: role,
    auditActor,
  });

  if (!creationResult.success) {
    const statusCode = creationResult.code === 'FORBIDDEN' ? 403 : creationResult.code === 'REQUEST_NOT_FOUND' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      error: creationResult.error,
      code: creationResult.code,
    });
  }

  const payment = creationResult.payment!;
  const transaction = creationResult.transaction!;

  // Si c'est un rejeu idempotent, retourner immédiatement le paiement existant
  if (creationResult.isIdempotent) {
    return res.json({
      success: true,
      data: payment,
      transaction,
      isIdempotent: true,
      message: 'Paiement déjà initialisé pour cette requête.',
    });
  }

  // Appel de l'adapter du provider choisi
  try {
    const adapter = getPaymentProvider(provider);
    const providerInit = await adapter.initiatePayment({
      paymentId: payment.id,
      reference: payment.reference,
      amount: payment.amount,
      currency: payment.currency,
      clientName: payment.clientName,
      clientPhone: payment.clientPhone,
      clientEmail: req.body.clientEmail,
      metadata: { bookingId: payment.bookingId, businessId: payment.businessId },
    });

    if (providerInit.externalReference && transaction) {
      transaction.externalReference = providerInit.externalReference;
      store.commit();
    }

    res.status(201).json({
      success: true,
      data: payment,
      transaction,
      providerMessage: providerInit.message,
      checkoutUrl: providerInit.checkoutUrl,
      message: `Demande de paiement de ${payment.amount.toLocaleString()} ${payment.currency} initiée via ${adapter.name}.`,
    });
  } catch (err: any) {
    console.error('[Payment Initiation Error]', err);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la communication avec la passerelle de paiement.',
      code: 'GATEWAY_ERROR',
    });
  }
});

// 3. GET /api/v1/payments - Récupérer les paiements avec filtrage multi-tenant
app.get('/api/v1/payments', (req, res) => {
  const { role, userId, businessId } = getRequestAuthContext(req);
  const status = req.query.status as any;
  const bookingId = req.query.booking_id as string;

  let filters: any = { status, bookingId, role };

  if (role === 'CLIENT') {
    filters.clientId = userId;
  } else if (role === 'BUSINESS_OWNER' || role === 'MANAGER' || role === 'EMPLOYEE') {
    filters.businessId = businessId;
  }

  const list = store.getPayments(filters);

  res.json({
    success: true,
    data: list,
    count: list.length,
  });
});

// 4. GET /api/v1/payments/:id - Détail d'un paiement spécifique avec ses transactions
app.get('/api/v1/payments/:id', (req, res) => {
  const { role, userId, businessId } = getRequestAuthContext(req);
  const result = store.getPaymentById(req.params.id, { role, clientId: userId, businessId });

  if (!result.success) {
    return res.status(result.code === 'FORBIDDEN' ? 403 : 404).json({
      success: false,
      error: result.error,
      code: result.code,
    });
  }

  res.json({
    success: true,
    data: result.payment,
    transactions: result.transactions,
  });
});

// 5. GET /api/v1/requests/:id/payments - Historique des paiements d'une réservation
app.get('/api/v1/requests/:id/payments', (req, res) => {
  const { role, userId, businessId } = getRequestAuthContext(req);
  const db = store.getDb();
  const request = (db.requests || []).find((r) => r.id === req.params.id);

  if (!request) {
    return res.status(404).json({ success: false, error: 'Réservation introuvable.' });
  }

  const isAuthorized =
    role === 'SUPER_ADMIN' ||
    (role === 'CLIENT' && request.clientId === userId) ||
    ((role === 'BUSINESS_OWNER' || role === 'MANAGER' || role === 'EMPLOYEE') && request.businessId === businessId);

  if (!isAuthorized) {
    return res.status(403).json({ success: false, error: 'Accès refusé aux paiements de cette réservation.' });
  }

  const payments = store.getPayments({ bookingId: request.id });
  const transactions = store.getTransactions({ bookingId: request.id });

  res.json({
    success: true,
    data: {
      request: {
        id: request.id,
        title: request.title,
        status: request.status,
        lockedPrice: request.lockedPrice ?? request.catalogItemPrice,
        currency: request.lockedCurrency || request.catalogItemCurrency || 'FCFA',
        paymentStatus: request.paymentStatus,
        paidAmount: request.paidAmount,
      },
      payments,
      transactions,
    },
  });
});

// 5b. GET /api/v1/payments/kkiapay/config - Configuration publique pour le widget client Kkiapay
app.get('/api/v1/payments/kkiapay/config', (_req, res) => {
  const publicKey = process.env.KKIAPAY_PUBLIC_KEY || process.env.VITE_KKIAPAY_PUBLIC_KEY || 'kkiapay_sandbox_public_key';
  const isSandbox = process.env.KKIAPAY_SANDBOX !== 'false';

  res.json({
    success: true,
    publicKey,
    sandbox: isSandbox,
    theme: '#0f172a',
    supportedMethods: ['momo', 'moov', 'celtis', 'card'],
  });
});

// 5c. POST /api/v1/payments/kkiapay/verify - Vérification côté serveur post-widget Kkiapay
app.post('/api/v1/payments/kkiapay/verify', async (req, res) => {
  const { role, userId, clientPhone } = getRequestAuthContext(req);
  const { paymentId, transactionId } = req.body;

  if (!paymentId || !transactionId) {
    return res.status(400).json({
      success: false,
      error: 'Identifiants paymentId et transactionId obligatoires pour la vérification Kkiapay.',
    });
  }

  const db = store.getDb();
  const payment = (db.payments || []).find((p) => p.id === paymentId || p.reference === paymentId);
  if (!payment) {
    return res.status(404).json({ success: false, error: 'Paiement introuvable.' });
  }

  // Contrôle anti-IDOR
  if (role === 'CLIENT' && payment.clientId !== userId && payment.clientPhone !== clientPhone) {
    return res.status(403).json({ success: false, error: 'Accès refusé à ce paiement.' });
  }

  // Si déjà payé, renvoyer succès immédiatement
  if (payment.status === 'SUCCESS') {
    return res.json({
      success: true,
      data: payment,
      message: 'Ce paiement a déjà été validé avec succès.',
    });
  }

  try {
    const kkiapayAdapter = getPaymentProvider('KKIAPAY');
    const verification = await kkiapayAdapter.verifyPayment({
      reference: payment.reference,
      externalReference: transactionId,
    });

    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';

    // Si vérifié avec succès ou en sandbox
    const finalStatus: PaymentStatus = verification.status === 'FAILED' ? 'FAILED' : 'SUCCESS';

    const result = store.transitionPaymentStatus({
      paymentId: payment.id,
      nextStatus: finalStatus,
      externalReference: transactionId,
      source: 'OPERATOR',
      actorName: 'Kkiapay Verification API',
      auditActor: {
        userId: userId || 'kkiapay-verifier',
        userEmail: role === 'SUPER_ADMIN' ? 'admin@flowexa.com' : 'client@flowexa.com',
        ip,
      },
    });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      data: result.payment,
      transaction: result.transaction,
      message: `Paiement Kkiapay vérifié avec succès ! Référence transaction : ${transactionId}`,
    });
  } catch (err: any) {
    console.error('[Kkiapay Verify Endpoint Error]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la vérification de la transaction Kkiapay.' });
  }
});

// 6. POST /api/v1/payments/webhook - Traitement webhook sécurisé
app.post(['/api/v1/payments/webhook', '/api/v1/payments/webhook/kkiapay', '/api/v1/payments/webhook/momo'], async (req, res) => {
  let providerParam = (req.query.provider as PaymentProviderCode) || (req.headers['x-payment-provider'] as PaymentProviderCode);

  // Détection automatique si webhook Kkiapay
  if (!providerParam && (req.headers['x-kkiapay-secret'] || req.headers['x-kkiapay-signature'])) {
    providerParam = 'KKIAPAY';
  }
  if (!providerParam) {
    providerParam = 'MTN_MOMO';
  }

  let adapter;
  try {
    adapter = getPaymentProvider(providerParam);
  } catch {
    return res.status(400).json({ success: false, error: `Opérateur inconnu : ${providerParam}` });
  }

  // Vérification de signature cryptographique
  const rawBody = JSON.stringify(req.body);
  const isSignatureValid = adapter.verifyWebhookSignature(req.headers as any, rawBody);
  if (!isSignatureValid) {
    console.warn(`[Webhook] Signature invalide reçue pour ${providerParam}`);
    return res.status(401).json({ success: false, error: 'Signature de webhook invalide.' });
  }

  // Décodage du payload par l'adapter
  const webhookData = await adapter.handleWebhook(req.body, req.headers as any);
  if (!webhookData.success || !webhookData.reference) {
    return res.status(400).json({ success: false, error: webhookData.error || 'Données de paiement incomplètes.' });
  }

  const db = store.getDb();
  const payment = (db.payments || []).find((p) => p.reference === webhookData.reference || p.id === webhookData.reference);

  if (!payment) {
    console.warn(`[Webhook] Paiement avec référence ${webhookData.reference} introuvable.`);
    return res.status(404).json({ success: false, error: 'Référence de paiement inconnue dans le système.' });
  }

  // Si un montant est spécifié dans le webhook, vérification de cohérence stricte
  if (webhookData.amount !== undefined && webhookData.amount !== payment.amount) {
    console.error(`[Webhook Alert] Incohérence de montant détectée pour ${payment.reference} ! Attendu: ${payment.amount}, Reçu: ${webhookData.amount}`);
    store.logAudit({
      userId: 'webhook-security',
      userEmail: 'security@flowexa.com',
      action: 'PAYMENT_AMOUNT_MISMATCH_ALERT',
      entityType: 'PAYMENT',
      entityId: payment.id,
      description: `Alerte sécurité : Le montant renvoyé par le webhook (${webhookData.amount}) diffère du montant contractuel (${payment.amount})`,
      ip: (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1',
    });
    return res.status(400).json({ success: false, error: 'Incohérence de montant détectée.' });
  }

  const targetStatus = webhookData.status || 'SUCCESS';
  const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';

  const transitionResult = store.transitionPaymentStatus({
    paymentId: payment.id,
    nextStatus: targetStatus,
    externalReference: webhookData.externalReference,
    errorMessage: targetStatus === 'FAILED' ? 'Refus de débit par l\'opérateur.' : undefined,
    source: 'WEBHOOK',
    auditActor: {
      userId: `webhook-${providerParam}`,
      userEmail: `${providerParam.toLowerCase()}@gateway.flowexa.com`,
      ip,
    },
  });

  if (!transitionResult.success) {
    return res.status(400).json({ success: false, error: transitionResult.error });
  }

  res.json({
    success: true,
    status: targetStatus,
    reference: payment.reference,
    message: `Webhook traité avec succès. Statut du paiement mis à jour en ${targetStatus}.`,
  });
});

// 7. POST /api/v1/payments/:id/simulate-sandbox-callback - Simulation de notification de paiement sécurisée en environnement de test
app.post('/api/v1/payments/:id/simulate-sandbox-callback', (req, res) => {
  const { role } = getRequestAuthContext(req);
  const paymentId = req.params.id;
  const targetStatus: PaymentStatus = req.body.status || 'SUCCESS';

  const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
  const result = store.transitionPaymentStatus({
    paymentId,
    nextStatus: targetStatus,
    externalReference: `SANDBOX-OP-${Date.now().toString(36).toUpperCase()}`,
    source: 'OPERATOR',
    actorName: 'Sandbox Opérateur',
    auditActor: {
      userId: 'sandbox-operator',
      userEmail: 'sandbox@flowexa.com',
      ip,
    },
  });

  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error, code: result.code });
  }

  res.json({
    success: true,
    data: result.payment,
    transaction: result.transaction,
    message: `Paiement mis à jour vers le statut ${targetStatus} (Simulation opérateur sandbox).`,
  });
});

// 7b. POST /api/v1/payments/:id/cancel - Annuler une session de paiement non aboutie
app.post('/api/v1/payments/:id/cancel', async (req, res) => {
  const { role, userId, clientPhone, businessId } = getRequestAuthContext(req);
  const paymentId = req.params.id;
  const db = store.getDb();
  const payment = (db.payments || []).find((p) => p.id === paymentId || p.reference === paymentId);

  if (!payment) {
    return res.status(404).json({ success: false, error: 'Paiement introuvable.' });
  }

  // Contrôle anti-IDOR
  const isAuthorized =
    role === 'SUPER_ADMIN' ||
    (role === 'CLIENT' && (payment.clientId === userId || payment.clientPhone === clientPhone)) ||
    ((role === 'BUSINESS_OWNER' || role === 'MANAGER') && payment.businessId === businessId);

  if (!isAuthorized) {
    return res.status(403).json({ success: false, error: 'Accès non autorisé pour annuler ce paiement.' });
  }

  if (payment.status === 'SUCCESS' || payment.status === 'PAID') {
    return res.status(400).json({
      success: false,
      error: 'Impossible d\'annuler un paiement déjà validé. Utilisez la procédure de remboursement.',
      code: 'ALREADY_PAID',
    });
  }

  const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
  const reason = req.body.reason || 'Annulation demandée par l\'utilisateur.';

  // Appel de l'adapter pour libérer les sessions distantes si applicable
  try {
    const adapter = getPaymentProvider(payment.provider);
    await adapter.cancelPayment({ reference: payment.reference, reason });
  } catch (err) {
    console.warn('[Payment Cancel Provider Warning]', err);
  }

  const result = store.transitionPaymentStatus({
    paymentId: payment.id,
    nextStatus: 'CANCELLED',
    source: role === 'SUPER_ADMIN' ? 'ADMIN' : 'MANUAL',
    actorName: role === 'CLIENT' ? 'Client' : 'Administrateur',
    errorMessage: reason,
    auditActor: {
      userId: userId || 'user',
      userEmail: role === 'SUPER_ADMIN' ? 'admin@flowexa.com' : 'client@flowexa.com',
      ip,
    },
  });

  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error, code: result.code });
  }

  res.json({
    success: true,
    data: result.payment,
    message: `Paiement #${payment.reference} annulé avec succès.`,
  });
});

// 7c. POST /api/v1/payments/:id/refund - Remboursement sécurisé (Total ou Partiel)
app.post('/api/v1/payments/:id/refund', async (req, res) => {
  const { role, userId, businessId } = getRequestAuthContext(req);
  const paymentId = req.params.id;
  const { amount, reason } = req.body;

  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Le motif du remboursement est obligatoire.',
      code: 'REASON_REQUIRED',
    });
  }

  const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
  const actorEmail = role === 'SUPER_ADMIN' ? 'admin@flowexa.com' : 'business@flowexa.com';

  const refundResult = store.refundPayment({
    paymentId,
    amount: amount !== undefined ? Number(amount) : undefined,
    reason: reason.trim(),
    callerRole: role,
    callerBusinessId: businessId,
    actorId: userId || 'admin-actor',
    actorEmail,
    ip,
  });

  if (!refundResult.success) {
    const statusCode =
      refundResult.code === 'FORBIDDEN' ? 403 : refundResult.code === 'PAYMENT_NOT_FOUND' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      error: refundResult.error,
      code: refundResult.code,
    });
  }

  // Notifier le provider de paiement du remboursement si nécessaire
  try {
    const payment = refundResult.payment!;
    const adapter = getPaymentProvider(payment.provider);
    await adapter.refundPayment({
      reference: payment.reference,
      amount: refundResult.refundTransaction?.amount || payment.amount,
      reason: reason.trim(),
    });
  } catch (err) {
    console.warn('[Payment Provider Refund Warning]', err);
  }

  res.json({
    success: true,
    data: refundResult.payment,
    refundTransaction: refundResult.refundTransaction,
    message: `Remboursement de ${refundResult.refundTransaction?.amount?.toLocaleString()} ${refundResult.payment?.currency} validé avec succès.`,
  });
});

// 7d. GET /api/v1/transactions - Liste des transactions (Multi-tenant : Client, Business, Super Admin)
app.get('/api/v1/transactions', (req, res) => {
  const { role, userId, businessId } = getRequestAuthContext(req);
  const paymentId = req.query.payment_id as string;
  const bookingId = req.query.booking_id as string;

  let filters: any = { role, paymentId, bookingId };
  if (role === 'CLIENT') {
    filters.clientId = userId;
  } else if (role === 'BUSINESS_OWNER' || role === 'MANAGER' || role === 'EMPLOYEE') {
    filters.businessId = businessId;
  }

  const transactions = store.getTransactions(filters);

  res.json({
    success: true,
    data: transactions,
    count: transactions.length,
  });
});

// 8. GET /api/v1/admin/payments - Supervision globale Super Admin
app.get('/api/v1/admin/payments', (req, res) => {
  const { role } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, error: 'Accès réservé au Super Administrateur.' });
  }

  const status = req.query.status as any;
  const provider = req.query.provider as any;
  const paymentType = req.query.payment_type as any;
  const payments = store.getPayments({ role: 'SUPER_ADMIN', status });

  let filtered = provider ? payments.filter((p) => p.provider === provider) : payments;
  if (paymentType) {
    filtered = filtered.filter((p) => p.paymentType === paymentType);
  }

  // Calcul des métriques globales enrichies
  const totalVolume = filtered
    .filter((p) => p.status === 'SUCCESS' || p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalRefunded = filtered
    .reduce((sum, p) => sum + (p.refundAmount || 0), 0);

  const successfulCount = filtered.filter((p) => p.status === 'SUCCESS' || p.status === 'PAID').length;
  const processingCount = filtered.filter((p) => p.status === 'PROCESSING' || p.status === 'PENDING').length;
  const failedCount = filtered.filter((p) => p.status === 'FAILED').length;
  const refundedCount = filtered.filter((p) => p.status === 'REFUNDED' || p.status === 'PARTIALLY_REFUNDED').length;
  const depositCount = filtered.filter((p) => p.paymentType === 'DEPOSIT').length;
  const fullCount = filtered.filter((p) => p.paymentType === 'FULL').length;
  const balanceCount = filtered.filter((p) => p.paymentType === 'BALANCE').length;

  res.json({
    success: true,
    data: filtered,
    count: filtered.length,
    metrics: {
      totalVolume,
      totalRefunded,
      netVolume: Math.max(0, totalVolume - totalRefunded),
      successfulCount,
      processingCount,
      failedCount,
      refundedCount,
      depositCount,
      fullCount,
      balanceCount,
      currency: 'FCFA',
    },
  });
});

// 9. GET /api/v1/admin/transactions - Supervision des transactions Super Admin
app.get('/api/v1/admin/transactions', (req, res) => {
  const { role } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, error: 'Accès réservé au Super Administrateur.' });
  }

  const transactions = store.getTransactions({ role: 'SUPER_ADMIN' });

  res.json({
    success: true,
    data: transactions,
    count: transactions.length,
  });
});

// -------------------------------------------------------------
// SPRINT B18: BUSINESS INTELLIGENCE & ANALYTICS ROUTES
// -------------------------------------------------------------

// 10. GET /api/v1/businesses/:businessId/analytics - Données analytiques d'une entreprise (Multi-tenant sécurisé)
app.get('/api/v1/businesses/:businessId/analytics', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, error: 'Authentification requise.' });
  }
  const targetBusinessId = req.params.businessId;

  if (auth.role !== 'SUPER_ADMIN') {
    if (auth.role === 'CLIENT') {
      return res.status(403).json({ success: false, error: 'Accès réservé aux professionnels.' });
    }
    if (!auth.businessId || auth.businessId !== targetBusinessId) {
      return res.status(403).json({ success: false, error: 'Accès refusé. Isolation multi-tenant stricte.' });
    }
  }

  const period = (req.query.period as string) || '30D';
  const result = store.getBusinessAnalytics(targetBusinessId, period, {
    role: auth.role,
    businessId: auth.businessId,
  });

  if (!result.success) {
    const statusCode = result.code === 'FORBIDDEN' ? 403 : result.code === 'BUSINESS_NOT_FOUND' ? 404 : 400;
    return res.status(statusCode).json(result);
  }

  res.json(result);
});

// 10.b GET /api/v1/businesses/:businessId/finances - Données financières de l'entreprise (réservées au propriétaire/gérant)
app.get('/api/v1/businesses/:businessId/finances', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, error: 'Authentification requise.' });
  }
  const targetBusinessId = req.params.businessId;

  // Strict RBAC : réservé aux gérants de cette entreprise et super admins
  if (auth.role !== 'BUSINESS_OWNER' && auth.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Accès interdit. Les recettes et finances sont réservées au gérant d’entreprise.',
      code: 'FORBIDDEN',
    });
  }

  if (auth.role !== 'SUPER_ADMIN' && (!auth.businessId || auth.businessId !== targetBusinessId)) {
    return res.status(403).json({
      success: false,
      error: 'Accès refusé. Isolation multi-tenant stricte.',
      code: 'FORBIDDEN',
    });
  }

  const period = (req.query.period as string) || '30D';
  const result = store.getBusinessAnalytics(targetBusinessId, period, {
    role: auth.role,
    businessId: auth.businessId,
  });

  if (!result.success) {
    const statusCode = result.code === 'FORBIDDEN' ? 403 : result.code === 'BUSINESS_NOT_FOUND' ? 404 : 400;
    return res.status(statusCode).json(result);
  }

  res.json(result);
});

// 11. GET /api/v1/analytics/business - Route générique pour l'entreprise connectée
app.get('/api/v1/analytics/business', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, error: 'Authentification requise.' });
  }
  if (auth.role === 'CLIENT') {
    return res.status(403).json({ success: false, error: 'Accès réservé aux professionnels.' });
  }

  let targetBusinessId: string;
  if (auth.role === 'SUPER_ADMIN') {
    targetBusinessId = (req.query.business_id as string) || auth.businessId;
    if (!targetBusinessId) {
      return res.status(400).json({ success: false, error: 'Paramètre business_id requis pour le Super Admin.' });
    }
  } else {
    // PRO : forcé depuis le JWT, ignorer tout header/paramètre
    if (!auth.businessId) {
      return res.status(403).json({ success: false, error: 'Accès refusé. Aucun établissement associé.' });
    }
    targetBusinessId = auth.businessId;
  }

  const period = (req.query.period as string) || '30D';
  const result = store.getBusinessAnalytics(targetBusinessId, period, {
    role: auth.role,
    businessId: auth.businessId,
  });

  if (!result.success) {
    const statusCode = result.code === 'FORBIDDEN' ? 403 : result.code === 'BUSINESS_NOT_FOUND' ? 404 : 400;
    return res.status(statusCode).json(result);
  }

  res.json(result);
});

// 12. GET /api/v1/admin/analytics - Statistiques globales Super Admin
app.get('/api/v1/admin/analytics', (req, res) => {
  const { role } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, error: 'Accès réservé au Super Administrateur.' });
  }

  const period = (req.query.period as string) || '30D';
  const moduleCode = req.query.module_code as string | undefined;
  const city = req.query.city as string | undefined;

  const data = store.getSuperAdminAnalytics({
    period,
    moduleCode,
    city,
  });

  res.json({
    success: true,
    data,
  });
});

// 12.b GET /api/v1/businesses/:businessId/analytics/report - Rapport d'activité synthétique structuré
app.get('/api/v1/businesses/:businessId/analytics/report', (req, res) => {
  const { role, businessId: callerBusinessId } = getRequestAuthContext(req);
  const targetBusinessId = req.params.businessId;
  const period = (req.query.period as string) || '30D';

  const result = store.getBusinessAnalytics(targetBusinessId, period, {
    role,
    businessId: callerBusinessId,
  });

  if (!result.success || !result.data) {
    const statusCode = result.code === 'FORBIDDEN' ? 403 : result.code === 'BUSINESS_NOT_FOUND' ? 404 : 400;
    return res.status(statusCode).json(result);
  }

  const d = result.data;
  const generatedAt = new Date().toISOString();

  const report = {
    metadata: {
      businessId: d.businessId,
      businessName: d.businessName,
      period: d.period,
      currency: d.currency,
      generatedAt,
      reportTitle: `Rapport d'Activité Flowexa — ${d.businessName}`,
    },
    executiveSummary: {
      healthScore: d.healthScore.overall,
      healthStatus: d.healthScore.overall >= 80 ? 'EXCELLENT' : d.healthScore.overall >= 60 ? 'BON' : 'ATTENTION',
      healthSummary: d.healthScore.summary,
      satisfactionRateLabel: d.satisfactionRateLabel,
      totalGrossRevenue: d.revenue.grossRevenue,
      netRevenue: d.revenue.netRevenue,
      totalRequests: d.requests.total,
      acceptanceRateLabel: d.requests.acceptanceRateLabel,
      totalBookings: d.bookings.total,
      completedInteractions: d.requests.completed,
    },
    evolution: d.evolution,
    financials: d.revenue,
    operations: {
      requests: d.requests,
      bookings: d.bookings,
      appointments: d.appointments,
      conversionFunnel: d.funnel,
      averageResponseTime: d.averageResponseTimeLabel,
    },
    customers: d.customers,
    topCustomers: d.topCustomers,
    clientOfTheYear: d.clientOfTheYear,
    catalogPerformance: {
      topByDemand: d.topServicesByDemand,
      topByRevenue: d.topServicesByRevenue,
    },
    activityDistribution: {
      busiestDay: d.peakDay,
      busiestHourSlot: d.peakHour,
      geographicLocations: d.locations,
    },
    reviewsAndReputation: {
      averageRating: d.reviews.averageRating,
      totalReviews: d.reviews.totalReviews,
      satisfactionRate: d.satisfactionRate,
      ratingDistribution: d.reviews.ratingDistribution,
    },
    keyAlerts: d.alerts,
    keyInsights: d.insights,
    projection: d.prediction,
    subscription: d.subscriptionSummary,
  };

  res.json({
    success: true,
    data: report,
  });
});

// 12.c POST /api/v1/businesses/:businessId/analytics/ai-explain - Diagnostic exécutif par IA fondé sur les données réelles
app.post('/api/v1/businesses/:businessId/analytics/ai-explain', (req, res) => {
  const { role, businessId: callerBusinessId } = getRequestAuthContext(req);
  const targetBusinessId = req.params.businessId;
  const period = (req.body?.period as string) || (req.query.period as string) || '30D';
  const customQuestion = req.body?.question as string | undefined;

  const result = store.getBusinessAnalytics(targetBusinessId, period, {
    role,
    businessId: callerBusinessId,
  });

  if (!result.success || !result.data) {
    const statusCode = result.code === 'FORBIDDEN' ? 403 : result.code === 'BUSINESS_NOT_FOUND' ? 404 : 400;
    return res.status(statusCode).json(result);
  }

  const d = result.data;

  // Formuler des réponses objectives, ancrées sur les chiffres réels sans aucune hallucination
  const activityAssessment = d.healthScore.overall >= 80
    ? `Votre activité est robuste et dynamique (Score de santé : ${d.healthScore.overall}/100). Le chiffre d'affaires net s'établit à ${d.revenue.netRevenue.toLocaleString('fr-FR')} FCFA avec ${d.revenue.confirmedPaymentsCount} encaissement(s) confirmé(s).`
    : d.healthScore.overall >= 60
    ? `Votre activité est stable (Score de santé : ${d.healthScore.overall}/100). Quelques axes de conversion commerciale et de réactivité méritent votre attention.`
    : `Votre activité requiert un plan d'action immédiat (Score de santé : ${d.healthScore.overall}/100). La régularité des confirmations et le profil doivent être renforcés.`;

  const whatWorks = [];
  if (d.topServicesByRevenue.length > 0 && d.topServicesByRevenue[0].totalRevenue > 0) {
    whatWorks.push(`Le service "${d.topServicesByRevenue[0].serviceTitle}" est votre principal moteur de rentabilité avec ${d.topServicesByRevenue[0].totalRevenue.toLocaleString('fr-FR')} FCFA encaissés.`);
  }
  if (d.customers.returningCustomersCount > 0) {
    whatWorks.push(`Vous avez fidélisé ${d.customers.returningCustomersCount} client(s) récurrent(s).`);
  }
  if (d.reviews.averageRating >= 4.0 && d.reviews.totalReviews > 0) {
    whatWorks.push(`Excellente satisfaction client avec une note moyenne vérifiée de ${d.reviews.averageRating}/5 (${d.reviews.totalReviews} avis).`);
  }
  if (whatWorks.length === 0) {
    whatWorks.push("La configuration initiale de votre espace entreprise est en place. Traitez vos prochaines demandes pour amplifier vos points forts.");
  }

  const whatDeclines = [];
  if (d.evolution.revenue.status === 'DECREASE' && d.evolution.revenue.growthPercent !== null) {
    whatDeclines.push(`Baisse de ${Math.abs(d.evolution.revenue.growthPercent)}% du CA par rapport à la période antérieure.`);
  }
  if (d.evolution.requests.status === 'DECREASE' && d.evolution.requests.growthPercent !== null) {
    whatDeclines.push(`Recul de ${Math.abs(d.evolution.requests.growthPercent)}% du volume de demandes.`);
  }
  if (d.requests.rejected > 0) {
    whatDeclines.push(`${d.requests.rejected} demande(s) ont été refusée(s).`);
  }
  if (whatDeclines.length === 0) {
    whatDeclines.push("Aucune dégradation notable détectée sur les indicateurs clés de la période.");
  }

  const whereToAct = [];
  if (d.healthScore.missingProfileFields.length > 0) {
    whereToAct.push(`Complétez votre profil : ${d.healthScore.missingProfileFields.join(', ')}.`);
  }
  if (d.requests.pending > 0) {
    whereToAct.push(`Vous avez ${d.requests.pending} demande(s) en attente nécessitant une réponse rapide.`);
  }
  if (d.peakDay) {
    whereToAct.push(`Optimisez votre disponibilité le ${d.peakDay.dayName}, votre journée de plus forte affluence (${d.peakDay.percentage}% des demandes).`);
  }
  if (whereToAct.length === 0) {
    whereToAct.push("Poursuivez la relance de vos devis et maintenez la qualité de service actuelle.");
  }

  res.json({
    success: true,
    data: {
      businessId: d.businessId,
      period: d.period,
      activityAssessment,
      whatWorks,
      whatDeclines,
      whereToAct,
      clientOrigins: d.locations.length > 0
        ? d.locations.map((l) => `${l.location} (${l.percentage}%)`).join(', ')
        : 'Localisation non spécifiée sur les demandes actuelles.',
      busiestWindow: d.peakHour ? `${d.peakHour.slot} (${d.peakHour.percentage}% des flux)` : 'Créneau non consolidé',
      customQuestionResponse: customQuestion ? `Analyse spécifique pour "${customQuestion}" : En se basant sur vos ${d.requests.total} demandes et ${d.revenue.grossRevenue.toLocaleString('fr-FR')} FCFA de CA, la tendance observée est ${d.evolution.revenue.status === 'INCREASE' ? 'favorable' : d.evolution.revenue.status === 'DECREASE' ? 'en repli' : 'stable'}.` : undefined,
    },
  });
});

// 12.d GET /api/v1/business/analytics - Alias direct multi-tenant
app.get('/api/v1/business/analytics', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, error: 'Authentification requise.' });
  }
  if (auth.role === 'CLIENT') {
    return res.status(403).json({ success: false, error: 'Accès réservé aux professionnels.' });
  }

  let targetBusinessId: string;
  if (auth.role === 'SUPER_ADMIN') {
    targetBusinessId = (req.query.businessId as string) || (req.query.business_id as string) || auth.businessId;
    if (!targetBusinessId) {
      return res.status(400).json({ success: false, error: 'Paramètre business_id requis pour le Super Admin.' });
    }
  } else {
    // PRO : strictement le JWT
    if (!auth.businessId) {
      return res.status(403).json({ success: false, error: 'Accès refusé. Aucun établissement rattaché.' });
    }
    targetBusinessId = auth.businessId;
  }

  const period = (req.query.period as string) || '30D';
  const result = store.getBusinessAnalytics(targetBusinessId, period, {
    role: auth.role,
    businessId: auth.businessId,
  });

  if (!result.success) {
    const statusCode = result.code === 'FORBIDDEN' ? 403 : result.code === 'BUSINESS_NOT_FOUND' ? 404 : 400;
    return res.status(statusCode).json(result);
  }

  res.json(result);
});

// -------------------------------------------------------------
// SPRINT B19: AUTOMATISATION INTELLIGENTE, RAPPELS & ALERTES
// -------------------------------------------------------------

// 1. GET /api/v1/businesses/:businessId/automations/rules
app.get('/api/v1/businesses/:businessId/automations/rules', (req, res) => {
  const { role, businessId: callerBusinessId } = getRequestAuthContext(req);
  const targetBusinessId = req.params.businessId;

  // Contrôle d'accès multi-tenant strict
  if (role !== 'SUPER_ADMIN' && callerBusinessId && callerBusinessId !== targetBusinessId) {
    return res.status(403).json({
      success: false,
      error: 'Accès interdit aux règles d’automatisation d’une autre entreprise.',
    });
  }

  const rules = store.getAutomationRules(targetBusinessId);
  res.json({
    success: true,
    data: rules,
  });
});

// 2. PATCH /api/v1/businesses/:businessId/automations/rules/:ruleId
app.patch('/api/v1/businesses/:businessId/automations/rules/:ruleId', (req, res) => {
  const { role, businessId: callerBusinessId, userId, userEmail } = getRequestAuthContext(req);
  const targetBusinessId = req.params.businessId;
  const ruleId = req.params.ruleId;

  if (role !== 'SUPER_ADMIN' && callerBusinessId && callerBusinessId !== targetBusinessId) {
    return res.status(403).json({
      success: false,
      error: 'Accès non autorisé pour modifier cette règle d’automatisation.',
    });
  }

  const existingRule = store.getAutomationRuleById(ruleId);
  if (!existingRule) {
    return res.status(404).json({
      success: false,
      error: 'Règle d’automatisation introuvable.',
    });
  }

  if (existingRule.businessId !== targetBusinessId && role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Cette règle n’appartient pas à votre entreprise.',
    });
  }

  const allowedUpdates: any = {};
  if (typeof req.body.isEnabled === 'boolean') allowedUpdates.isEnabled = req.body.isEnabled;
  if (Array.isArray(req.body.triggerHoursBefore)) allowedUpdates.triggerHoursBefore = req.body.triggerHoursBefore;
  if (typeof req.body.triggerHoursAfter === 'number') allowedUpdates.triggerHoursAfter = req.body.triggerHoursAfter;
  if (typeof req.body.customMessageTemplate === 'string') allowedUpdates.customMessageTemplate = req.body.customMessageTemplate;
  if (req.body.birthdayOffer) allowedUpdates.birthdayOffer = req.body.birthdayOffer;
  if (req.body.thresholdCount && typeof req.body.thresholdCount === 'number') allowedUpdates.thresholdCount = req.body.thresholdCount;
  if (req.body.priority) allowedUpdates.priority = req.body.priority;

  const updated = store.updateAutomationRule(ruleId, allowedUpdates);

  // Traçabilité AuditLog
  store.logAudit({
    userId,
    userEmail,
    action: 'UPDATE_AUTOMATION_RULE',
    entityType: 'AUTOMATION_RULE',
    entityId: ruleId,
    description: `Modification règle d'automatisation ${existingRule.name} (actif=${updated?.isEnabled})`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    data: updated,
  });
});

// 3. POST /api/v1/businesses/:businessId/automations/rules - Création règle personnalisée
app.post('/api/v1/businesses/:businessId/automations/rules', (req, res) => {
  const { role, businessId: callerBusinessId, userId, userEmail } = getRequestAuthContext(req);
  const targetBusinessId = req.params.businessId;

  if (role !== 'SUPER_ADMIN' && callerBusinessId && callerBusinessId !== targetBusinessId) {
    return res.status(403).json({
      success: false,
      error: 'Accès interdit.',
    });
  }

  const { ruleType, name, description, triggerHoursBefore, triggerHoursAfter, customMessageTemplate, birthdayOffer, thresholdCount, priority } = req.body;

  if (!ruleType || !name) {
    return res.status(400).json({
      success: false,
      error: 'Les champs ruleType et name sont obligatoires.',
    });
  }

  const created = store.createAutomationRule({
    businessId: targetBusinessId,
    ruleType,
    name,
    description: description || '',
    isEnabled: true,
    triggerHoursBefore,
    triggerHoursAfter,
    customMessageTemplate,
    birthdayOffer,
    thresholdCount,
    priority: priority || 'NORMAL',
    channels: ['INTERNAL'],
  });

  store.logAudit({
    userId,
    userEmail,
    action: 'CREATE_AUTOMATION_RULE',
    entityType: 'AUTOMATION_RULE',
    entityId: created.id,
    description: `Création de la règle d'automatisation ${name}`,
    ip: req.ip || '127.0.0.1',
  });

  res.status(201).json({
    success: true,
    data: created,
  });
});

// 4. DELETE /api/v1/businesses/:businessId/automations/rules/:ruleId
app.delete('/api/v1/businesses/:businessId/automations/rules/:ruleId', (req, res) => {
  const { role, businessId: callerBusinessId } = getRequestAuthContext(req);
  const targetBusinessId = req.params.businessId;
  const ruleId = req.params.ruleId;

  if (role !== 'SUPER_ADMIN' && callerBusinessId && callerBusinessId !== targetBusinessId) {
    return res.status(403).json({
      success: false,
      error: 'Accès interdit.',
    });
  }

  const existing = store.getAutomationRuleById(ruleId);
  if (!existing || (existing.businessId !== targetBusinessId && role !== 'SUPER_ADMIN')) {
    return res.status(404).json({
      success: false,
      error: 'Règle non trouvée pour cette entreprise.',
    });
  }

  const deleted = store.deleteAutomationRule(ruleId);
  res.json({
    success: deleted,
  });
});

// 5. GET /api/v1/businesses/:businessId/automations/history - Journal d'exécution
app.get('/api/v1/businesses/:businessId/automations/history', (req, res) => {
  const { role, businessId: callerBusinessId } = getRequestAuthContext(req);
  const targetBusinessId = req.params.businessId;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

  if (role !== 'SUPER_ADMIN' && callerBusinessId && callerBusinessId !== targetBusinessId) {
    return res.status(403).json({
      success: false,
      error: 'Accès interdit à l’historique d’automatisation.',
    });
  }

  const history = store.getAutomationHistory(targetBusinessId, limit);
  res.json({
    success: true,
    data: history,
  });
});

// 6. GET /api/v1/businesses/:businessId/automations/stats - Métriques d'automatisation
app.get('/api/v1/businesses/:businessId/automations/stats', (req, res) => {
  const { role, businessId: callerBusinessId } = getRequestAuthContext(req);
  const targetBusinessId = req.params.businessId;

  if (role !== 'SUPER_ADMIN' && callerBusinessId && callerBusinessId !== targetBusinessId) {
    return res.status(403).json({
      success: false,
      error: 'Accès interdit aux statistiques d’automatisation.',
    });
  }

  const stats = store.getAutomationStats(targetBusinessId);
  res.json({
    success: true,
    data: stats,
  });
});

// 7. POST /api/v1/businesses/:businessId/automations/run - Déclenchement manuel ou forcé (test/assistant)
app.post('/api/v1/businesses/:businessId/automations/run', (req, res) => {
  const { role, businessId: callerBusinessId, userId, userEmail } = getRequestAuthContext(req);
  const targetBusinessId = req.params.businessId;
  const force = req.body.force === true;

  if (role !== 'SUPER_ADMIN' && callerBusinessId && callerBusinessId !== targetBusinessId) {
    return res.status(403).json({
      success: false,
      error: 'Accès non autorisé pour exécuter le moteur d’automatisation.',
    });
  }

  const summary = store.runAutomationEngine(targetBusinessId, { force });

  store.logAudit({
    userId,
    userEmail,
    action: 'RUN_AUTOMATION_ENGINE',
    entityType: 'AUTOMATION_ENGINE',
    entityId: targetBusinessId,
    description: `Exécution du moteur d'automatisation (envoyés: ${summary.sentCount}, ignorés: ${summary.skippedCount})`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    data: summary,
  });
});

// 8. GET /api/v1/admin/automations - Vue Super Admin consolidée
app.get('/api/v1/admin/automations', (req, res) => {
  const { role } = getRequestAuthContext(req);

  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Accès réservé au Super Administrateur.',
    });
  }

  const allRules = store.getAutomationRules();
  const allHistory = store.getAutomationHistory(undefined, 200);

  const totalRules = allRules.length;
  const activeRules = allRules.filter((r) => r.isEnabled).length;
  const totalSent = allHistory.filter((h) => h.status === 'SENT').length;
  const totalFailed = allHistory.filter((h) => h.status === 'FAILED').length;

  res.json({
    success: true,
    data: {
      stats: {
        totalRules,
        activeRules,
        totalSent,
        totalFailed,
      },
      rules: allRules,
      history: allHistory,
    },
  });
});

// 9. PATCH /api/v1/admin/automations/rules/:ruleId - Super Admin modifie n'importe quelle règle
app.patch('/api/v1/admin/automations/rules/:ruleId', (req, res) => {
  const { role, userId, userEmail } = getRequestAuthContext(req);
  const ruleId = req.params.ruleId;

  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Accès réservé au Super Administrateur.',
    });
  }

  const updated = store.updateAutomationRule(ruleId, req.body);
  if (!updated) {
    return res.status(404).json({
      success: false,
      error: 'Règle non trouvée.',
    });
  }

  store.logAudit({
    userId,
    userEmail,
    action: 'ADMIN_UPDATE_AUTOMATION_RULE',
    entityType: 'AUTOMATION_RULE',
    entityId: ruleId,
    description: `Mise à jour Super Admin règle ${updated.name}`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    data: updated,
  });
});

// -------------------------------------------------------------
// SPRINT B20: IA FLOWEXA - RECOMMANDATIONS, PRÉDICTIONS & ASSISTANTS
// -------------------------------------------------------------

// 1. POST /api/v1/ai/search - Recherche naturelle intelligente avec explications
app.post('/api/v1/ai/search', (req, res) => {
  const query = (req.body.q || req.body.query || req.body.searchTerm || '').trim();
  if (!query) {
    return res.status(400).json({ success: false, message: 'Requête vide.' });
  }

  const clientLat = req.body.lat ? parseFloat(req.body.lat) : req.body.clientLat ? parseFloat(req.body.clientLat) : undefined;
  const clientLng = req.body.lng ? parseFloat(req.body.lng) : req.body.clientLng ? parseFloat(req.body.clientLng) : undefined;
  const radiusKm = req.body.radius ? parseFloat(req.body.radius) : undefined;
  const clientId =
    (req.headers['x-client-id'] as string) ||
    (req.headers['x-user-id'] as string) ||
    (req.body.clientId as string) ||
    undefined;

  const results = aiService.search.searchWithExplanations(query, {
    clientLat,
    clientLng,
    radiusKm,
    clientId,
    limit: req.body.limit ? parseInt(req.body.limit, 10) : 15,
  });

  res.json({
    success: true,
    data: results,
  });
});

// 2. POST /api/v1/ai/client-assistant - Assistant interactif pour les clients
app.post('/api/v1/ai/client-assistant', (req, res) => {
  const message = (req.body.message || req.body.text || req.body.q || '').trim();
  if (!message) {
    return res.status(400).json({ success: false, message: 'Message requis.' });
  }

  const clientId =
    (req.headers['x-client-id'] as string) ||
    (req.headers['x-user-id'] as string) ||
    (req.body.clientId as string) ||
    undefined;

  const clientLat = req.body.lat ? parseFloat(req.body.lat) : undefined;
  const clientLng = req.body.lng ? parseFloat(req.body.lng) : undefined;

  const reply = aiService.assistant.handleClientMessage(message, {
    clientId,
    clientLat,
    clientLng,
  });

  res.json({
    success: true,
    data: reply,
  });
});

// 3. POST /api/v1/ai/business-assistant - Assistant interactif pour l'entreprise
app.post('/api/v1/ai/business-assistant', (req, res) => {
  const message = (req.body.message || req.body.text || req.body.q || '').trim();
  if (!message) {
    return res.status(400).json({ success: false, message: 'Message requis.' });
  }

  const { role, businessId: callerBusinessId } = getRequestAuthContext(req);
  const targetBusinessId = (req.body.businessId as string) || callerBusinessId;

  if (!targetBusinessId) {
    return res.status(400).json({ success: false, message: 'Identifiant d’entreprise requis.' });
  }

  // Contrôle strict de sécurité multi-tenant
  if (role !== 'SUPER_ADMIN') {
    if (callerBusinessId && callerBusinessId !== targetBusinessId) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé. Vous ne pouvez interroger l'assistant que pour votre propre établissement.",
        code: 'FORBIDDEN',
      });
    }
  }

  const reply = aiService.assistant.handleBusinessMessage(targetBusinessId, message, role);

  res.json({
    success: true,
    data: reply,
  });
});

// 4. POST /api/v1/ai/admin-assistant - Assistant Super Admin consolidé
app.post('/api/v1/ai/admin-assistant', (req, res) => {
  const { role } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: "Accès réservé à l'administrateur de la plateforme.",
      code: 'FORBIDDEN',
    });
  }

  const message = (req.body.message || req.body.text || req.body.q || '').trim();
  const reply = aiService.assistant.handleAdminMessage(message);

  res.json({
    success: true,
    data: reply,
  });
});

// 5. GET /api/v1/ai/recommendations - Recommandations personnalisées pour un client
app.get('/api/v1/ai/recommendations', (req, res) => {
  const { userId } = getRequestAuthContext(req);
  const clientId = (req.query.client_id as string) || userId;
  const moduleCode = req.query.module_code ? (req.query.module_code as any) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 6;

  const result = aiService.recommendations.getClientRecommendations(clientId, {
    moduleCode,
    limit,
  });

  res.json({
    success: true,
    data: result,
  });
});

// 6. GET /api/v1/businesses/:businessId/ai/opportunities - Détection d'opportunités
app.get('/api/v1/businesses/:businessId/ai/opportunities', (req, res) => {
  const { businessId } = req.params;
  const { role, businessId: callerBusinessId } = getRequestAuthContext(req);

  if (role !== 'SUPER_ADMIN') {
    if (callerBusinessId && callerBusinessId !== businessId) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous ne pouvez consulter que les opportunités de votre propre établissement.',
        code: 'FORBIDDEN',
      });
    }
  }

  const insights = aiService.insights.generateBusinessInsights(businessId);

  res.json({
    success: true,
    data: {
      businessId,
      opportunities: insights.opportunities,
    },
  });
});

// 7. GET /api/v1/businesses/:businessId/ai/alerts - Détection des problèmes & alertes
app.get('/api/v1/businesses/:businessId/ai/alerts', (req, res) => {
  const { businessId } = req.params;
  const { role, businessId: callerBusinessId } = getRequestAuthContext(req);

  if (role !== 'SUPER_ADMIN') {
    if (callerBusinessId && callerBusinessId !== businessId) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous ne pouvez consulter que les alertes de votre propre établissement.',
        code: 'FORBIDDEN',
      });
    }
  }

  const insights = aiService.insights.generateBusinessInsights(businessId);

  res.json({
    success: true,
    data: {
      businessId,
      alerts: insights.alerts,
    },
  });
});

// 8. GET /api/v1/businesses/:businessId/ai/predictions - Prévision statistique du CA & de la demande
app.get('/api/v1/businesses/:businessId/ai/predictions', (req, res) => {
  const { businessId } = req.params;
  const { role, businessId: callerBusinessId } = getRequestAuthContext(req);

  if (role !== 'SUPER_ADMIN') {
    if (callerBusinessId && callerBusinessId !== businessId) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous ne pouvez consulter que les prévisions de votre propre établissement.',
        code: 'FORBIDDEN',
      });
    }
  }

  const predictions = aiService.predictions.predictRevenue(businessId);

  res.json({
    success: true,
    data: predictions,
  });
});

// 9. GET /api/v1/businesses/:businessId/ai/insights - Analyse consolidée complète
app.get('/api/v1/businesses/:businessId/ai/insights', (req, res) => {
  const { businessId } = req.params;
  const { role, businessId: callerBusinessId } = getRequestAuthContext(req);

  if (role !== 'SUPER_ADMIN') {
    if (callerBusinessId && callerBusinessId !== businessId) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous ne pouvez consulter que les insights de votre propre établissement.',
        code: 'FORBIDDEN',
      });
    }
  }

  const insights = aiService.insights.generateBusinessInsights(businessId);

  res.json({
    success: true,
    data: insights,
  });
});

// -------------------------------------------------------------
// SPRINT MARKETPLACE FLOWEXA API ROUTES (B21)
// -------------------------------------------------------------

// 1. Analyse IA / NLP d'une demande formulée en langage naturel
app.post('/api/v1/marketplace/parse-prompt', (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ success: false, message: 'Le texte de la demande est requis.' });
  }

  const pLower = prompt.toLowerCase();
  let category = 'Général';
  let moduleCode: any = undefined;

  if (pLower.includes('appartement') || pLower.includes('villa') || pLower.includes('maison') || pLower.includes('logement') || pLower.includes('immo')) {
    category = 'Immobilier';
    moduleCode = 'IMMOBILIER';
  } else if (pLower.includes('guest') || pLower.includes('hotel') || pLower.includes('chambre') || pLower.includes('nuitée')) {
    category = 'Hébergement & Guest House';
    moduleCode = 'GUEST_HOUSE';
  } else if (pLower.includes('coiffure') || pLower.includes('tresse') || pLower.includes('cheveux') || pLower.includes('barbe') || pLower.includes('barbier')) {
    category = 'Coiffure & Beauté';
    moduleCode = 'COIFFURE';
  } else if (pLower.includes('massage') || pLower.includes('spa') || pLower.includes('détente') || pLower.includes('gommage')) {
    category = 'Spa & Massage';
    moduleCode = 'SPA_MASSAGE';
  } else if (pLower.includes('photo') || pLower.includes('shooting') || pLower.includes('studio')) {
    category = 'Photographie & Studio';
    moduleCode = 'PHOTOGRAPHE';
  } else if (pLower.includes('couture') || pLower.includes('broderie') || pLower.includes('boubou') || pLower.includes('chemise')) {
    category = 'Mode & Broderie sur mesure';
    moduleCode = 'BRODERIE_IMPRESSION';
  } else if (pLower.includes('garage') || pLower.includes('mecanique') || pLower.includes('vidange') || pLower.includes('frein') || pLower.includes('pneu')) {
    category = 'Garage & Entretien Véhicules';
    moduleCode = 'GARAGE';
  }

  // Extraction de la localisation
  let location = 'Cotonou';
  const zones = ['haie vive', 'fidjrossè', 'cadjehoun', 'akpakpa', 'saint michel', 'ganhi', 'calavi', 'porto-novo', 'ouidah'];
  for (const z of zones) {
    if (pLower.includes(z)) {
      location = `${z.charAt(0).toUpperCase() + z.slice(1)}, Cotonou`;
      break;
    }
  }

  // Extraction du budget
  let budgetMax: number | undefined;
  const budgetMatch = prompt.match(/(?:budget|prix|max|moins de|pour)?\s*([0-9\s.,]{3,})\s*(?:fcfa|f|cfa)/i);
  if (budgetMatch && budgetMatch[1]) {
    const rawNum = budgetMatch[1].replace(/[\s.,]/g, '');
    const val = parseInt(rawNum, 10);
    if (!isNaN(val) && val > 0) {
      budgetMax = val;
    }
  }

  // Extraction de date
  let desiredDate: string | undefined;
  if (pLower.includes('samedi')) {
    const d = new Date();
    d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
    desiredDate = d.toISOString().split('T')[0];
  } else if (pLower.includes('dimanche')) {
    const d = new Date();
    d.setDate(d.getDate() + ((7 - d.getDay() + 7) % 7 || 7));
    desiredDate = d.toISOString().split('T')[0];
  } else if (pLower.includes('demain')) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    desiredDate = d.toISOString().split('T')[0];
  }

  // Génération d'un titre synthétique
  const title = `Recherche ${category.toLowerCase()} à ${location}`;

  res.json({
    success: true,
    data: {
      category,
      moduleCode,
      title,
      description: prompt,
      location,
      budgetMax,
      desiredDate,
      radiusKm: 10,
    },
  });
});

// 2. Création d'une demande Marketplace
app.post('/api/v1/marketplace/requests', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }

  const clientId = auth.role === 'CLIENT' ? auth.userId : (auth.role === 'SUPER_ADMIN' ? (req.body.clientId || auth.userId) : auth.userId);
  const clientName = (auth.role === 'CLIENT' ? auth.userName : undefined) || req.body.clientName || 'Client Flowexa';
  const clientPhone = (auth.role === 'CLIENT' ? auth.clientPhone : undefined) || req.body.clientPhone || '0154100617';

  const {
    category,
    moduleCode,
    title,
    description,
    location,
    latitude,
    longitude,
    radiusKm,
    budgetMin,
    budgetMax,
    desiredDate,
    publishImmediately,
  } = req.body;

  if (!title || !description || !location) {
    return res.status(400).json({
      success: false,
      message: 'Le titre, la description et la zone géographique sont obligatoires.',
    });
  }

  const initialStatus = publishImmediately ? 'PUBLISHED' : 'DRAFT';

  const created = store.createMarketplaceRequest({
    clientId,
    clientName,
    clientPhone,
    clientEmail: req.body.clientEmail,
    category: category || 'Général',
    moduleCode,
    title,
    description,
    location,
    latitude: typeof latitude === 'number' ? latitude : undefined,
    longitude: typeof longitude === 'number' ? longitude : undefined,
    radiusKm: typeof radiusKm === 'number' ? radiusKm : 10,
    budgetMin: typeof budgetMin === 'number' ? budgetMin : undefined,
    budgetMax: typeof budgetMax === 'number' ? budgetMax : undefined,
    desiredDate,
    status: initialStatus,
  });

  let matchedCount = 0;
  if (publishImmediately) {
    const pubRes = store.publishMarketplaceRequest(created.id, clientId);
    matchedCount = pubRes.matchedCount || 0;
  }

  res.status(201).json({
    success: true,
    data: created,
    matchedCount,
    message: publishImmediately
      ? `Demande publiée avec succès ! ${matchedCount} établissement(s) correspondant(s) notifié(s).`
      : 'Demande enregistrée en brouillon.',
  });
});

// 3. Publication d'une demande existante
app.post('/api/v1/marketplace/requests/:id/publish', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }
  const clientId = auth.role === 'CLIENT' ? auth.userId : (auth.role === 'SUPER_ADMIN' ? (req.body.clientId || auth.userId) : auth.userId);
  const { id } = req.params;

  const result = store.publishMarketplaceRequest(id, clientId);
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.error });
  }

  res.json({
    success: true,
    data: result.request,
    matchedCount: result.matchedCount,
    message: `Demande publiée avec succès ! ${result.matchedCount || 0} établissement(s) notifié(s).`,
  });
});

// 4. Liste des demandes (Client, Pro ou Super Admin)
app.get('/api/v1/marketplace/requests', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }
  const { role, userId, businessId } = auth;
  const status = req.query.status as string;

  let requests;
  if (role === 'SUPER_ADMIN') {
    const overrideBiz = req.query.business_id as string;
    requests = store.getMarketplaceRequests({ isSuperAdmin: !overrideBiz, businessId: overrideBiz, status });
  } else if (role === 'BUSINESS_OWNER' || role === 'MANAGER' || role === 'EMPLOYEE') {
    if (!businessId) {
      return res.status(403).json({ success: false, message: 'Accès refusé. Aucun établissement rattaché.' });
    }
    requests = store.getMarketplaceRequests({ businessId, status });
  } else {
    // Client : filtré strictement par son identité JWT
    requests = store.getMarketplaceRequests({ clientId: userId, status });
  }

  res.json({
    success: true,
    data: requests,
    count: requests.length,
  });
});

// 5. Détail d'une demande
app.get('/api/v1/marketplace/requests/:id', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }
  const { id } = req.params;
  const request = store.getMarketplaceRequestById(id);
  if (!request) {
    return res.status(404).json({ success: false, message: 'Demande introuvable.' });
  }

  const { role, userId, businessId } = auth;
  let responses = store.getMarketplaceResponses(id);

  // Confidentialité : une entreprise ne voit QUE sa propre proposition si elle consulte la demande
  if (role === 'SUPER_ADMIN') {
    // Accès complet
  } else if (role === 'CLIENT') {
    if (request.clientId !== userId) {
      return res.status(403).json({ success: false, message: 'Accès interdit à cette demande.' });
    }
  } else {
    // Pro
    if (!businessId) {
      return res.status(403).json({ success: false, message: 'Accès refusé. Aucun établissement rattaché.' });
    }
    responses = responses.filter((r) => r.businessId === businessId);
  }

  res.json({
    success: true,
    data: {
      ...request,
      responses,
    },
  });
});

// 6. Matching intelligent en temps réel pour une demande
app.get('/api/v1/marketplace/requests/:id/matches', (req, res) => {
  const { id } = req.params;
  const matches = store.findMatchesForRequest(id);
  res.json({
    success: true,
    data: matches,
    count: matches.length,
  });
});

// 7. Annulation d'une demande par le client
app.post('/api/v1/marketplace/requests/:id/cancel', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }
  const clientId = auth.role === 'CLIENT' ? auth.userId : (auth.role === 'SUPER_ADMIN' ? (req.body.clientId || auth.userId) : auth.userId);
  const { id } = req.params;
  const { reason } = req.body;

  const result = store.cancelMarketplaceRequest(id, clientId, reason);
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.error });
  }

  res.json({
    success: true,
    message: 'Demande annulée avec succès.',
  });
});

// 8. Soumission d'une proposition par une entreprise
app.post('/api/v1/marketplace/responses', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }
  if (auth.role === 'CLIENT') {
    return res.status(403).json({ success: false, message: 'Seuls les professionnels peuvent formuler des propositions.' });
  }

  let businessId: string;
  if (auth.role === 'SUPER_ADMIN') {
    businessId = req.body.businessId || auth.businessId;
  } else {
    if (!auth.businessId) {
      return res.status(403).json({ success: false, message: 'Accès refusé. Aucun établissement rattaché.' });
    }
    businessId = auth.businessId; // Forcé depuis le JWT !
  }

  if (!businessId) {
    return res.status(400).json({ success: false, message: 'Identifiant d’entreprise requis.' });
  }

  const {
    marketplaceRequestId,
    catalogItemId,
    catalogItemTitle,
    message,
    proposedPrice,
    availableDate,
  } = req.body;

  if (!marketplaceRequestId || !message || typeof proposedPrice !== 'number' || !availableDate) {
    return res.status(400).json({
      success: false,
      message: 'Veuillez renseigner la demande, le message, le prix proposé et la date de disponibilité.',
    });
  }

  const result = store.createMarketplaceResponse({
    marketplaceRequestId,
    businessId,
    businessName: req.body.businessName || 'Établissement',
    catalogItemId,
    catalogItemTitle,
    message,
    proposedPrice,
    availableDate,
  });

  if (!result.success) {
    return res.status(400).json({ success: false, message: result.error });
  }

  res.status(201).json({
    success: true,
    data: result.response,
    message: 'Votre proposition a été transmise au client avec succès.',
  });
});

// 9. Liste des propositions
app.get('/api/v1/marketplace/responses', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }
  const { role, userId, businessId } = auth;
  const requestId = req.query.request_id as string;

  let responses;
  if (role === 'SUPER_ADMIN') {
    const overrideBiz = req.query.business_id as string;
    responses = store.getMarketplaceResponses(requestId, overrideBiz);
  } else if (role === 'BUSINESS_OWNER' || role === 'MANAGER' || role === 'EMPLOYEE') {
    if (!businessId) {
      return res.status(403).json({ success: false, message: 'Accès refusé. Aucun établissement rattaché.' });
    }
    responses = store.getMarketplaceResponses(requestId, businessId);
  } else {
    // Client
    responses = store.getMarketplaceResponses(requestId, undefined, userId);
  }

  res.json({
    success: true,
    data: responses,
    count: responses.length,
  });
});

// 10. Acceptation d'une proposition par le client (Conversion Demande -> Réservation)
app.post('/api/v1/marketplace/accept', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }
  const clientId = auth.role === 'CLIENT' ? auth.userId : (auth.role === 'SUPER_ADMIN' ? (req.body.clientId || auth.userId) : auth.userId);
  const { requestId, responseId } = req.body;

  if (!requestId || !responseId) {
    return res.status(400).json({
      success: false,
      message: 'Les identifiants de la demande et de la proposition sont requis.',
    });
  }

  const result = store.acceptMarketplaceResponse({
    requestId,
    responseId,
    clientId,
  });

  if (!result.success) {
    return res.status(400).json({ success: false, message: result.error });
  }

  res.json({
    success: true,
    data: {
      request: result.request,
      response: result.response,
      convertedBooking: result.convertedRequest,
      conversationId: result.conversationId,
    },
    message: 'Proposition acceptée ! La réservation a été créée et transmise à l’entreprise.',
  });
});

// 11. Statistiques globales de la Marketplace
app.get('/api/v1/marketplace/stats', (_req, res) => {
  const stats = store.getMarketplaceStats();
  res.json({
    success: true,
    data: stats,
  });
});

// =============================================================
// SPRINT B22 + F22: COCKPIT ENTREPRISE PRO — API MULTI-TENANT
// =============================================================

// 1. Cockpit Summary (Indicateurs temps réel, Actions du jour, Activité récente)
app.get(['/api/v1/business/cockpit', '/api/v1/business/cockpit-summary'], (req, res) => {
  const { businessId } = getRequestAuthContext(req);
  if (!businessId) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Aucun établissement rattaché à ce compte professionnel.',
    });
  }
  const metrics = store.getBusinessCockpitMetrics(businessId);
  res.json({
    success: true,
    data: metrics,
  });
});

app.get('/api/v1/businesses/:businessId/cockpit-summary', (req, res) => {
  const { businessId } = req.params;
  const { role, businessId: callerBusinessId } = getRequestAuthContext(req);

  // Multi-tenant strict
  if (role !== 'SUPER_ADMIN' && callerBusinessId && callerBusinessId !== businessId) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Vous ne pouvez consulter que le cockpit de votre propre entreprise.',
    });
  }

  const metrics = store.getBusinessCockpitMetrics(businessId);
  res.json({
    success: true,
    data: metrics,
  });
});

// 2. Mes clients (Agrégation isolée par entreprise)
app.get('/api/v1/businesses/:businessId/clients', (req, res) => {
  const { businessId } = req.params;
  const { role, businessId: callerBusinessId } = getRequestAuthContext(req);

  if (role !== 'SUPER_ADMIN' && callerBusinessId && callerBusinessId !== businessId) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Vous ne pouvez consulter que le portefeuille client de votre propre entreprise.',
    });
  }

  const clients = store.getBusinessClients(businessId);
  res.json({
    success: true,
    data: clients,
    count: clients.length,
  });
});

// 3. Fiche client détaillée
app.get('/api/v1/businesses/:businessId/clients/:clientId', (req, res) => {
  const { businessId, clientId } = req.params;
  const { role, businessId: callerBusinessId } = getRequestAuthContext(req);

  if (role !== 'SUPER_ADMIN' && callerBusinessId && callerBusinessId !== businessId) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Isolation multi-tenant stricte.',
    });
  }

  const detail = store.getBusinessClientDetail(businessId, clientId);
  if (!detail) {
    return res.status(404).json({
      success: false,
      message: 'Client introuvable ou aucune interaction avec cet établissement.',
    });
  }

  res.json({
    success: true,
    data: detail,
  });
});

// 4. Calendrier des rendez-vous et réservations
app.get('/api/v1/businesses/:businessId/calendar', (req, res) => {
  const { businessId } = req.params;
  const { role, businessId: callerBusinessId } = getRequestAuthContext(req);

  if (role !== 'SUPER_ADMIN' && callerBusinessId && callerBusinessId !== businessId) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Isolation multi-tenant stricte.',
    });
  }

  const events = store.getBusinessCalendar(businessId);
  res.json({
    success: true,
    data: events,
    count: events.length,
  });
});

// 5. Journal d'activité récente
app.get('/api/v1/businesses/:businessId/activity-log', (req, res) => {
  const { businessId } = req.params;
  const { role, businessId: callerBusinessId } = getRequestAuthContext(req);

  if (role !== 'SUPER_ADMIN' && callerBusinessId && callerBusinessId !== businessId) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Isolation multi-tenant stricte.',
    });
  }

  const activity = store.getBusinessRecentActivity(businessId);
  res.json({
    success: true,
    data: activity,
    count: activity.length,
  });
});

// 6. Gestion de l'équipe (Liste des membres)
app.get('/api/v1/businesses/:businessId/team', (req, res) => {
  const { businessId } = req.params;
  const { role, businessId: callerBusinessId } = getRequestAuthContext(req);

  if (role !== 'SUPER_ADMIN' && callerBusinessId && callerBusinessId !== businessId) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Isolation multi-tenant stricte.',
    });
  }

  const members = store.getTeamMembers(businessId);
  res.json({
    success: true,
    data: members,
    count: members.length,
  });
});

// 7. Ajouter un collaborateur / employé
app.post('/api/v1/businesses/:businessId/team', (req, res) => {
  const { businessId } = req.params;
  const auth = getRequestAuthContext(req);

  // SPRINT B31 : Contrôle strict de l'isolation multi-tenant
  const tenantCheck = SecurityService.assertTenantAccess(auth, businessId, 'Ajout collaborateur équipe', req.ip);
  if (!tenantCheck.allowed) {
    return res.status(403).json({ success: false, message: tenantCheck.reason });
  }

  const { name, email, phone, role: memberRole, permissions } = req.body;
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Le nom et l’adresse email sont obligatoires.',
    });
  }

  // SPRINT B25: Contrôle strict des quotas du plan d'abonnement (collaborateurs / employés)
  const limitCheck = store.checkBusinessLimit(businessId, 'employees');
  if (!limitCheck.allowed) {
    return res.status(403).json({ success: false, message: limitCheck.reason, code: 'LIMIT_REACHED' });
  }

  // Règle Sprint B22: Interdiction absolue de créer un SUPER_ADMIN
  const safeRole = memberRole === 'MANAGER' ? 'MANAGER' : 'EMPLOYEE';

  const newMember = store.addTeamMember({
    id: `team-${Date.now()}`,
    businessId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : '0154100617',
    role: safeRole,
    status: 'ACTIVE',
    permissions: {
      canViewRequests: permissions?.canViewRequests ?? true,
      canManageAppointments: permissions?.canManageAppointments ?? true,
      canViewClients: permissions?.canViewClients ?? true,
      canViewStats: permissions?.canViewStats ?? (safeRole === 'MANAGER'),
      canManageCatalog: permissions?.canManageCatalog ?? (safeRole === 'MANAGER'),
    },
    assignedCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  store.logAudit({
    userId: auth.userId || 'pro-user',
    userEmail: auth.userEmail || email,
    action: 'TEAM_MEMBER_ADD',
    entityType: 'TEAM_MEMBER',
    entityId: newMember.id,
    description: `Ajout collaborateur ${newMember.name} (${safeRole}) dans entreprise ${businessId}`,
    ip: req.ip || '127.0.0.1',
  });

  res.status(201).json({
    success: true,
    data: newMember,
    message: `Collaborateur ${newMember.name} ajouté avec succès.`,
  });
});

// 8. Modifier un membre d'équipe
app.patch('/api/v1/businesses/:businessId/team/:employeeId', (req, res) => {
  const { businessId, employeeId } = req.params;
  const auth = getRequestAuthContext(req);

  // SPRINT B31 : Contrôle strict de l'isolation multi-tenant
  const tenantCheck = SecurityService.assertTenantAccess(auth, businessId, `Modification collaborateur [${employeeId}]`, req.ip);
  if (!tenantCheck.allowed) {
    return res.status(403).json({ success: false, message: tenantCheck.reason });
  }

  const updates = req.body;
  // Bloquer l'élévation en SUPER_ADMIN
  if (updates.role && updates.role === 'SUPER_ADMIN') {
    delete updates.role;
  }

  const updated = store.updateTeamMember(employeeId, updates);
  if (!updated) {
    return res.status(404).json({
      success: false,
      message: 'Collaborateur introuvable.',
    });
  }

  store.logAudit({
    userId: auth.userId || 'pro-user',
    userEmail: auth.userEmail || 'pro@flowexa.com',
    action: 'TEAM_MEMBER_UPDATE',
    entityType: 'TEAM_MEMBER',
    entityId: employeeId,
    description: `Mise à jour collaborateur ${updated.name} dans entreprise ${businessId}`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    data: updated,
    message: 'Membre d’équipe mis à jour.',
  });
});

// 9. Supprimer un membre d'équipe
app.delete('/api/v1/businesses/:businessId/team/:employeeId', (req, res) => {
  const { businessId, employeeId } = req.params;
  const auth = getRequestAuthContext(req);

  // SPRINT B31 : Contrôle strict de l'isolation multi-tenant
  const tenantCheck = SecurityService.assertTenantAccess(auth, businessId, `Suppression collaborateur [${employeeId}]`, req.ip);
  if (!tenantCheck.allowed) {
    return res.status(403).json({ success: false, message: tenantCheck.reason });
  }

  const deleted = store.deleteTeamMember(employeeId);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'Collaborateur introuvable ou déjà supprimé.',
    });
  }

  store.logAudit({
    userId: auth.userId || 'pro-user',
    userEmail: auth.userEmail || 'pro@flowexa.com',
    action: 'TEAM_MEMBER_DELETE',
    entityType: 'TEAM_MEMBER',
    entityId: employeeId,
    description: `Suppression collaborateur ${employeeId} de l'entreprise ${businessId}`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    message: 'Collaborateur retiré de l’équipe.',
  });
});

// 10. Gestion des tâches quotidiennes (Liste)
app.get('/api/v1/businesses/:businessId/tasks', (req, res) => {
  const { businessId } = req.params;
  const { role, businessId: callerBusinessId, isAuthenticated } = getRequestAuthContext(req);

  if (!isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }

  if (role !== 'SUPER_ADMIN' && (!callerBusinessId || callerBusinessId !== businessId)) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Isolation multi-tenant.',
    });
  }

  const tasks = store.getTasks(businessId);
  res.json({
    success: true,
    data: tasks,
    count: tasks.length,
  });
});

// 11. Créer une tâche
app.post('/api/v1/businesses/:businessId/tasks', (req, res) => {
  const { businessId } = req.params;
  const { role, businessId: callerBusinessId, isAuthenticated } = getRequestAuthContext(req);

  if (!isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }

  if (role !== 'SUPER_ADMIN' && (!callerBusinessId || callerBusinessId !== businessId)) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Isolation multi-tenant.',
    });
  }

  const { title, dueDate, dueTime, priority, relatedClientId, relatedClientName } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Le titre de la tâche est requis.',
    });
  }

  const newTask = store.addTask({
    id: `task-${Date.now()}`,
    businessId,
    title: title.trim(),
    dueDate: dueDate || new Date().toISOString().split('T')[0],
    dueTime: dueTime || '12:00',
    priority: priority || 'MEDIUM',
    done: false,
    relatedClientId,
    relatedClientName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  res.status(201).json({
    success: true,
    data: newTask,
    message: 'Tâche ajoutée.',
  });
});

// 12. Mettre à jour une tâche (cocher / décocher / modifier)
app.patch('/api/v1/businesses/:businessId/tasks/:taskId', (req, res) => {
  const { businessId, taskId } = req.params;
  const { role, businessId: callerBusinessId, isAuthenticated } = getRequestAuthContext(req);

  if (!isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }

  if (role !== 'SUPER_ADMIN' && (!callerBusinessId || callerBusinessId !== businessId)) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Isolation multi-tenant.',
    });
  }

  const updated = store.updateTask(taskId, req.body);
  if (!updated) {
    return res.status(404).json({
      success: false,
      message: 'Tâche introuvable.',
    });
  }

  res.json({
    success: true,
    data: updated,
    message: 'Tâche mise à jour.',
  });
});

// 13. Supprimer une tâche
app.delete('/api/v1/businesses/:businessId/tasks/:taskId', (req, res) => {
  const { businessId, taskId } = req.params;
  const { role, businessId: callerBusinessId, isAuthenticated } = getRequestAuthContext(req);

  if (!isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }

  if (role !== 'SUPER_ADMIN' && (!callerBusinessId || callerBusinessId !== businessId)) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Isolation multi-tenant.',
    });
  }

  const deleted = store.deleteTask(taskId);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'Tâche introuvable ou déjà supprimée.',
    });
  }

  res.json({
    success: true,
    message: 'Tâche supprimée.',
  });
});

// =============================================================
// SPRINT B25: FACTURATION ENTREPRISE — PLANS & ABONNEMENTS
// =============================================================

function resolveBillingContext(req: any, res: any) {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    res.status(403).json({ success: false, message: 'Authentification requise.' });
    return null;
  }

  // RBAC strict : seuls BUSINESS_OWNER et SUPER_ADMIN peuvent gérer la facturation
  if (auth.role !== 'BUSINESS_OWNER' && auth.role !== 'SUPER_ADMIN') {
    res.status(403).json({ success: false, message: 'Accès interdit. La facturation est réservée au gérant.' });
    return null;
  }

  let targetBusinessId: string | undefined;
  if (auth.role === 'SUPER_ADMIN') {
    targetBusinessId = (req.query.businessId as string) || (req.body?.businessId as string) || auth.businessId;
    if (targetBusinessId && targetBusinessId !== auth.businessId) {
      store.logAudit({
        userId: auth.userId,
        userEmail: auth.userEmail || 'admin@flowexa.com',
        action: 'SUPER_ADMIN_BILLING_OVERRIDE',
        entityType: 'BILLING',
        entityId: targetBusinessId,
        description: `SuperAdmin billing override to [${targetBusinessId}] on ${req.method} ${req.path}`,
        ip: req.ip || '127.0.0.1',
      });
    }
  } else {
    // PRO : strictement depuis le JWT, ignorer tout header/paramètre
    targetBusinessId = auth.businessId;
  }

  if (!targetBusinessId) {
    res.status(403).json({ success: false, message: 'Accès refusé. Aucun établissement associé.' });
    return null;
  }

  return {
    targetBusinessId,
    role: auth.role,
    userId: auth.userId,
    userEmail: auth.userEmail,
    clientPhone: auth.clientPhone,
  };
}

// 1. GET /api/v1/billing/subscription - Abonnement actif de l'entreprise connectée
app.get('/api/v1/billing/subscription', (req, res) => {
  const ctx = resolveBillingContext(req, res);
  if (!ctx) return;

  const subscription = store.getBusinessSubscription(ctx.targetBusinessId);
  const plan = subscription ? store.getPlanById(subscription.planId) : store.getPlanById('plan_starter');
  const usage = store.getSubscriptionUsage(ctx.targetBusinessId);

  res.json({
    success: true,
    data: subscription
      ? {
          ...subscription,
          planDetails: plan,
        }
      : null,
    usage,
  });
});

// 2. GET /api/v1/billing/usage - Consommation réelle des quotas (Métriques calculées réelles)
app.get('/api/v1/billing/usage', (req, res) => {
  const ctx = resolveBillingContext(req, res);
  if (!ctx) return;

  const usage = store.getSubscriptionUsage(ctx.targetBusinessId);
  res.json({
    success: true,
    data: usage,
  });
});

// 3. GET /api/v1/billing/plans - Liste des plans disponibles pour souscription
app.get('/api/v1/billing/plans', (_req, res) => {
  const plans = store.getPlans(false);
  res.json({
    success: true,
    data: plans,
  });
});

// 4. POST /api/v1/billing/subscribe - Souscription ou changement de plan
app.post('/api/v1/billing/subscribe', (req, res) => {
  const ctx = resolveBillingContext(req, res);
  if (!ctx) return;

  const { planId, period, provider, autoRenew, clientPhone: reqPhone, idempotencyKey } = req.body;
  if (!planId) {
    return res.status(400).json({ success: false, message: 'Le choix d’un plan tarifaire est obligatoire.' });
  }

  const validProvider: PaymentProviderCode = provider || 'ORANGE_MONEY';

  const result = store.subscribeToPlan({
    businessId: ctx.targetBusinessId,
    planId,
    period: period || 'MONTHLY',
    provider: validProvider,
    clientPhone: reqPhone || ctx.clientPhone,
    idempotencyKey,
    autoRenew: autoRenew ?? true,
    actor: {
      userId: ctx.userId || 'pro-user',
      userEmail: ctx.userEmail || 'pro@flowexa.com',
    },
  });

  if (!result.success) {
    return res.status(400).json({ success: false, message: result.error });
  }

  res.json({
    success: true,
    message: 'Demande d’abonnement initiée. Veuillez finaliser le règlement.',
    data: {
      subscription: result.subscription,
      payment: result.payment,
      transaction: result.transaction,
    },
  });
});

// 5. POST /api/v1/billing/autorenew - Activer / désactiver le renouvellement automatique
app.post('/api/v1/billing/autorenew', (req, res) => {
  const ctx = resolveBillingContext(req, res);
  if (!ctx) return;

  const { autoRenew } = req.body;
  const updated = store.updateSubscriptionAutoRenew(ctx.targetBusinessId, !!autoRenew);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Aucun abonnement trouvé pour cette entreprise.' });
  }

  res.json({
    success: true,
    data: updated,
    message: `Renouvellement automatique ${updated.autoRenew ? 'activé' : 'désactivé'}.`,
  });
});

// 6. POST /api/v1/billing/cancel - Résiliation d'abonnement (maintien des données)
app.post('/api/v1/billing/cancel', (req, res) => {
  const ctx = resolveBillingContext(req, res);
  if (!ctx) return;

  const { reason } = req.body;
  const updated = store.cancelSubscription(ctx.targetBusinessId, reason, {
    userId: ctx.userId || 'pro-user',
    userEmail: ctx.userEmail || 'pro@flowexa.com',
  });

  if (!updated) {
    return res.status(404).json({ success: false, message: 'Aucun abonnement actif trouvé.' });
  }

  res.json({
    success: true,
    data: updated,
    message: 'Votre abonnement a été résilié. Vos avantages restent actifs jusqu’à la date d’échéance.',
  });
});

// 7. GET /api/v1/billing/invoices - Factures de l'entreprise (Multi-tenant)
app.get('/api/v1/billing/invoices', (req, res) => {
  const ctx = resolveBillingContext(req, res);
  if (!ctx) return;

  const invoices = store.getBusinessInvoices(ctx.targetBusinessId);
  res.json({
    success: true,
    data: invoices,
  });
});

// 8. GET /api/v1/billing/invoices/:id - Détail facture
app.get('/api/v1/billing/invoices/:id', (req, res) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    return res.status(403).json({ success: false, message: 'Authentification requise.' });
  }

  const invoice = store.getInvoiceById(req.params.id);
  if (!invoice) {
    return res.status(404).json({ success: false, message: 'Facture introuvable.' });
  }

  if (auth.role !== 'SUPER_ADMIN') {
    if (auth.role !== 'BUSINESS_OWNER') {
      return res.status(403).json({ success: false, message: 'Accès interdit. La facturation est réservée au gérant.' });
    }
    if (!auth.businessId || auth.businessId !== invoice.businessId) {
      return res.status(403).json({ success: false, message: 'Accès refusé. Isolation multi-tenant stricte.' });
    }
  }

  res.json({
    success: true,
    data: invoice,
  });
});

// 9. SUPER ADMIN : GET /api/v1/admin/plans - Gestion des plans
app.get('/api/v1/admin/plans', (req, res) => {
  const { role } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const plans = store.getPlans(true);
  res.json({
    success: true,
    data: plans,
  });
});

// 10. SUPER ADMIN : POST /api/v1/admin/plans - Créer un plan
app.post('/api/v1/admin/plans', (req, res) => {
  const { role, userId, userEmail } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const { name, code, description, price, currency, period, limits, features, isPopular, badgeText } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ success: false, message: 'Nom et prix obligatoires.' });
  }

  const newPlan = store.createPlan(
    {
      name: name.trim(),
      code: (code || name).toUpperCase().replace(/\s+/g, '_'),
      description: description ? description.trim() : '',
      price: Number(price),
      currency: currency || 'FCFA',
      period: period || 'MONTHLY',
      status: 'ACTIVE',
      isPopular: !!isPopular,
      badgeText: badgeText || undefined,
      limits: {
        maxEmployees: Number(limits?.maxEmployees) || 5,
        maxServices: Number(limits?.maxServices) || 20,
        maxOffers: Number(limits?.maxOffers) || 30,
        maxStorageMb: Number(limits?.maxStorageMb) || 1000,
      },
      features: {
        statistics: !!features?.statistics,
        automations: !!features?.automations,
        aiCopilot: !!features?.aiCopilot,
        marketplaceAccess: features?.marketplaceAccess ?? true,
        prioritySupport: !!features?.prioritySupport,
        customBranding: !!features?.customBranding,
        advancedReports: !!features?.advancedReports,
      },
    },
    { userId: userId || 'admin', userEmail: userEmail || 'admin@flowexa.com' }
  );

  res.json({
    success: true,
    data: newPlan,
    message: `Plan "${newPlan.name}" créé avec succès.`,
  });
});

// 11. SUPER ADMIN : PUT /api/v1/admin/plans/:id - Mettre à jour un plan
app.put('/api/v1/admin/plans/:id', (req, res) => {
  const { role, userId, userEmail } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const updated = store.updatePlan(
    req.params.id,
    req.body,
    { userId: userId || 'admin', userEmail: userEmail || 'admin@flowexa.com' }
  );

  if (!updated) {
    return res.status(404).json({ success: false, message: 'Plan introuvable.' });
  }

  res.json({
    success: true,
    data: updated,
    message: `Plan "${updated.name}" mis à jour avec succès.`,
  });
});

// 12. SUPER ADMIN : PATCH /api/v1/admin/plans/:id/toggle - Activer / Archiver un plan
app.patch('/api/v1/admin/plans/:id/toggle', (req, res) => {
  const { role, userId, userEmail } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const updated = store.togglePlanStatus(req.params.id, {
    userId: userId || 'admin',
    userEmail: userEmail || 'admin@flowexa.com',
  });

  if (!updated) {
    return res.status(404).json({ success: false, message: 'Plan introuvable.' });
  }

  res.json({
    success: true,
    data: updated,
    message: `Plan "${updated.name}" est désormais ${updated.status === 'ACTIVE' ? 'actif' : 'archivé'}.`,
  });
});

// 13. SUPER ADMIN : GET /api/v1/admin/subscriptions - Liste de tous les abonnements entreprises
app.get('/api/v1/admin/subscriptions', (req, res) => {
  const { role } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const subscriptions = store.getAllSubscriptions();
  res.json({
    success: true,
    data: subscriptions,
    count: subscriptions.length,
  });
});

// 14. SUPER ADMIN : GET /api/v1/admin/invoices - Liste de toutes les factures
app.get('/api/v1/admin/invoices', (req, res) => {
  const { role } = getRequestAuthContext(req);
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé au Super Administrateur.' });
  }

  const invoices = store.getAllInvoices();
  res.json({
    success: true,
    data: invoices,
    count: invoices.length,
  });
});

// =========================================================================
// SPRINT B27 + F27: APIS CRM, SEGMENTS, RELANCES, CAMPAGNES & CROISSANCE
// =========================================================================

const checkCrmAccess = (req: express.Request, res: express.Response, targetBusinessId: string) => {
  const auth = getRequestAuthContext(req);
  if (!auth.isAuthenticated) {
    res.status(403).json({ success: false, message: 'Authentification requise.' });
    return false;
  }
  if (auth.role === 'SUPER_ADMIN') {
    return true;
  }
  if (auth.role === 'CLIENT') {
    res.status(403).json({ success: false, message: 'Accès réservé aux professionnels.' });
    return false;
  }
  if (!auth.businessId || auth.businessId !== targetBusinessId) {
    res.status(403).json({
      success: false,
      message: 'Accès refusé. Isolation multi-tenant stricte.',
    });
    return false;
  }
  return true;
};

// 1. GET /api/v1/businesses/:businessId/crm/segments
app.get('/api/v1/businesses/:businessId/crm/segments', (req, res) => {
  const { businessId } = req.params;
  if (!checkCrmAccess(req, res, businessId)) return;

  const inactiveThreshold = req.query.inactiveThresholdDays ? parseInt(req.query.inactiveThresholdDays as string, 10) : 45;
  const segments = store.getCRMSegments(businessId, inactiveThreshold);
  res.json({
    success: true,
    data: segments,
  });
});

// 2. GET /api/v1/businesses/:businessId/crm/clients
app.get('/api/v1/businesses/:businessId/crm/clients', (req, res) => {
  const { businessId } = req.params;
  if (!checkCrmAccess(req, res, businessId)) return;

  const segment = req.query.segment as any;
  const search = req.query.search as string;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
  const inactiveThreshold = req.query.inactiveThresholdDays ? parseInt(req.query.inactiveThresholdDays as string, 10) : 45;

  const result = store.getCRMClients(businessId, {
    segment,
    search,
    limit,
    offset,
    inactiveThresholdDays: inactiveThreshold,
  });

  res.json({
    success: true,
    data: result.clients,
    total: result.total,
    segments: result.segments,
  });
});

// 3. GET /api/v1/businesses/:businessId/crm/clients/:clientId
app.get('/api/v1/businesses/:businessId/crm/clients/:clientId', (req, res) => {
  const { businessId, clientId } = req.params;
  if (!checkCrmAccess(req, res, businessId)) return;

  const inactiveThreshold = req.query.inactiveThresholdDays ? parseInt(req.query.inactiveThresholdDays as string, 10) : 45;
  const detail = store.getCRMClientDetail(businessId, clientId, inactiveThreshold);
  if (!detail) {
    return res.status(404).json({
      success: false,
      message: 'Fiche client introuvable.',
    });
  }

  res.json({
    success: true,
    data: detail,
  });
});

// 4. POST /api/v1/businesses/:businessId/crm/clients/:clientId/notes
app.post('/api/v1/businesses/:businessId/crm/clients/:clientId/notes', (req, res) => {
  const { businessId, clientId } = req.params;
  if (!checkCrmAccess(req, res, businessId)) return;

  const { userId, userEmail } = getRequestAuthContext(req);
  const { note } = req.body;
  if (!note || !note.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Le contenu de la note est obligatoire.',
    });
  }

  const newNote = store.addCRMClientNote(businessId, clientId, note, userEmail || 'pro@flowexa.com', {
    userId: userId || 'pro',
    userEmail: userEmail || 'pro@flowexa.com',
  });

  res.status(201).json({
    success: true,
    data: newNote,
    message: 'Note interne enregistrée avec succès.',
  });
});

// 5. GET /api/v1/businesses/:businessId/crm/reminders
app.get('/api/v1/businesses/:businessId/crm/reminders', (req, res) => {
  const { businessId } = req.params;
  if (!checkCrmAccess(req, res, businessId)) return;

  const reminders = store.getCRMReminders(businessId);
  res.json({
    success: true,
    data: reminders,
    count: reminders.length,
  });
});

// 6. POST /api/v1/businesses/:businessId/crm/reminders/:reminderId/send
app.post('/api/v1/businesses/:businessId/crm/reminders/:reminderId/send', (req, res) => {
  const { businessId, reminderId } = req.params;
  if (!checkCrmAccess(req, res, businessId)) return;

  const { userId, userEmail } = getRequestAuthContext(req);
  const { customMessage } = req.body;
  const result = store.sendCRMReminder(businessId, reminderId, customMessage, {
    userId: userId || 'pro',
    userEmail: userEmail || 'pro@flowexa.com',
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

// 7. GET /api/v1/businesses/:businessId/campaigns
app.get('/api/v1/businesses/:businessId/campaigns', (req, res) => {
  const { businessId } = req.params;
  if (!checkCrmAccess(req, res, businessId)) return;

  const campaigns = store.getCampaigns(businessId);
  res.json({
    success: true,
    data: campaigns,
    count: campaigns.length,
  });
});

// 8. GET /api/v1/businesses/:businessId/campaigns/:campaignId
app.get('/api/v1/businesses/:businessId/campaigns/:campaignId', (req, res) => {
  const { businessId, campaignId } = req.params;
  if (!checkCrmAccess(req, res, businessId)) return;

  const campaign = store.getCampaignById(businessId, campaignId);
  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campagne introuvable.',
    });
  }

  res.json({
    success: true,
    data: campaign,
  });
});

// 9. POST /api/v1/businesses/:businessId/campaigns
app.post('/api/v1/businesses/:businessId/campaigns', (req, res) => {
  const { businessId } = req.params;
  if (!checkCrmAccess(req, res, businessId)) return;

  const { userId, userEmail } = getRequestAuthContext(req);
  const { name, objective, targetSegment, channel, message, linkedOfferId, linkedOfferTitle, promoCode, discountPercent, scheduledAt, cost } = req.body;
  if (!name || !objective || !targetSegment || !message) {
    return res.status(400).json({
      success: false,
      message: 'Le titre, l’objectif, le segment cible et le message sont obligatoires.',
    });
  }

  const campaign = store.createCampaign(
    businessId,
    {
      name,
      objective,
      targetSegment,
      channel: channel || 'INTERNAL',
      message,
      linkedOfferId,
      linkedOfferTitle,
      promoCode,
      discountPercent,
      scheduledAt,
      cost,
    },
    { userId: userId || 'pro', userEmail: userEmail || 'pro@flowexa.com' }
  );

  res.status(201).json({
    success: true,
    data: campaign,
    message: 'Campagne enregistrée avec succès.',
  });
});

// 10. PATCH /api/v1/businesses/:businessId/campaigns/:campaignId
app.patch('/api/v1/businesses/:businessId/campaigns/:campaignId', (req, res) => {
  const { businessId, campaignId } = req.params;
  if (!checkCrmAccess(req, res, businessId)) return;

  const { userId, userEmail } = getRequestAuthContext(req);
  try {
    const updated = store.updateCampaign(businessId, campaignId, req.body, {
      userId: userId || 'pro',
      userEmail: userEmail || 'pro@flowexa.com',
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Campagne introuvable.' });
    }
    res.json({ success: true, data: updated, message: 'Campagne mise à jour.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Erreur lors de la mise à jour.' });
  }
});

// 11. DELETE /api/v1/businesses/:businessId/campaigns/:campaignId
app.delete('/api/v1/businesses/:businessId/campaigns/:campaignId', (req, res) => {
  const { businessId, campaignId } = req.params;
  if (!checkCrmAccess(req, res, businessId)) return;

  const { userId, userEmail } = getRequestAuthContext(req);
  const ok = store.deleteCampaign(businessId, campaignId, {
    userId: userId || 'pro',
    userEmail: userEmail || 'pro@flowexa.com',
  });
  if (!ok) {
    return res.status(404).json({ success: false, message: 'Campagne introuvable.' });
  }
  res.json({ success: true, message: 'Campagne supprimée avec succès.' });
});

// 12. POST /api/v1/businesses/:businessId/campaigns/:campaignId/send
app.post('/api/v1/businesses/:businessId/campaigns/:campaignId/send', (req, res) => {
  const { businessId, campaignId } = req.params;
  if (!checkCrmAccess(req, res, businessId)) return;

  const { userId, userEmail } = getRequestAuthContext(req);
  const result = store.sendCampaign(businessId, campaignId, {
    userId: userId || 'pro',
    userEmail: userEmail || 'pro@flowexa.com',
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

// 13. POST /api/v1/businesses/:businessId/campaigns/:campaignId/cancel
app.post('/api/v1/businesses/:businessId/campaigns/:campaignId/cancel', (req, res) => {
  const { businessId, campaignId } = req.params;
  if (!checkCrmAccess(req, res, businessId)) return;

  const { userId, userEmail } = getRequestAuthContext(req);
  const cancelled = store.cancelCampaign(businessId, campaignId, {
    userId: userId || 'pro',
    userEmail: userEmail || 'pro@flowexa.com',
  });
  if (!cancelled) {
    return res.status(404).json({ success: false, message: 'Campagne introuvable.' });
  }

  res.json({ success: true, data: cancelled, message: 'Campagne programmée annulée.' });
});

// 14. POST /api/v1/businesses/:businessId/campaigns/ai-draft
app.post('/api/v1/businesses/:businessId/campaigns/ai-draft', (req, res) => {
  const { businessId } = req.params;
  if (!checkCrmAccess(req, res, businessId)) return;

  const { objective, segment, serviceName } = req.body;
  const draft = store.generateCampaignAIDraft(businessId, {
    objective: objective || 'FIDÉLISATION',
    segment: segment || 'RECURRENT',
    serviceName,
  });

  res.json({
    success: true,
    data: draft,
  });
});

// 15. GET /api/v1/businesses/:businessId/growth
app.get('/api/v1/businesses/:businessId/growth', (req, res) => {
  const { businessId } = req.params;
  if (!checkCrmAccess(req, res, businessId)) return;

  const growth = store.getGrowthDashboard(businessId);
  res.json({
    success: true,
    data: growth,
  });
});

// -------------------------------------------------------------
// VITE MIDDLEWARE & STATIC SERVING
// -------------------------------------------------------------

async function startServer() {
  // SPRINT B33: 404 JSON standard pour toute route API inexistante
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      code: 'NOT_FOUND',
      message: `Point d'accès API introuvable : ${req.method} ${req.path}`,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Flowexa Full-Stack] Server running on http://0.0.0.0:${PORT}`);

    // Initialisation immédiate du moteur d'automatisation et de facturation
    try {
      const initRun = store.runAutomationEngine();
      console.log(`[Automation Engine] Initial run completed: ${initRun.sentCount} sent, ${initRun.skippedCount} skipped.`);
      store.checkAndExpireSubscriptions();
    } catch (e) {
      console.error('[Automation Engine] Error during initial run', e);
    }

    // Tâche récurrente d'arrière-plan (similaire au worker Celery / cron)
    setInterval(() => {
      try {
        store.runAutomationEngine();
        store.checkAndExpireSubscriptions();
      } catch (err) {
        console.error('[Automation Engine] Background task cycle error', err);
      }
    }, 60000);
  });
}

startServer();
