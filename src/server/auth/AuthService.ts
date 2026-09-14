import crypto from 'crypto';
import { store, UserAccountEntity, UserSessionEntity } from '../dataStore';
import type {
  RoleType,
  VerificationStatus,
  RegisterClientPayload,
  RegisterBusinessPayload,
  UserProfile,
  BusinessModuleCode,
} from '../../types';

const JWT_SECRET = process.env.JWT_SECRET || 'flowexa_benin_jwt_secret_2026_production_key';
const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24; // 24 heures
const REFRESH_TOKEN_TTL_DAYS = 30; // 30 jours

// Métiers autorisés Flowexa (Les 10 SEULS métiers officiels)
export const VALID_FLOWEXA_MODULES: BusinessModuleCode[] = [
  'IMMOBILIER',
  'GUEST_HOUSE',
  'COIFFURE',
  'BARBIER',
  'INSTITUT_COSMETIQUE',
  'SPA_MASSAGE',
  'PHOTOGRAPHE',
  'BRODERIE_IMPRESSION',
  'GARAGE',
  'PHARMACIE',
];

// Helper: Base64URL encoding/decoding
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf-8');
}

// Token Payload
export interface TokenPayload {
  sub: string;
  role: RoleType;
  businessId?: string;
  tenantId?: string;
  email: string;
  phone: string;
  name: string;
  status: string;
  verificationStatus: VerificationStatus;
  exp: number;
  iat: number;
}

export class AuthService {
  // 1. Password Hashing (PBKDF2 SHA-512 with salt)
  public static hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const s = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, s, 10000, 64, 'sha512').toString('hex');
    return { hash, salt: s };
  }

  public static verifyPassword(password: string, hash: string, salt: string): boolean {
    const computed = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
    } catch {
      return false;
    }
  }

  // 2. JWT Generation & Verification (HS256)
  public static generateJwt(user: UserAccountEntity): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const payload: TokenPayload = {
      sub: user.id,
      role: user.role as RoleType,
      businessId: user.businessId,
      tenantId: (user as any).tenantId || user.businessId,
      email: user.email,
      phone: user.phone,
      name: user.fullName,
      status: user.status,
      verificationStatus: user.verificationStatus,
      iat: now,
      exp: now + ACCESS_TOKEN_TTL_SECONDS,
    };

    const headerEncoded = base64UrlEncode(JSON.stringify(header));
    const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
    const dataToSign = `${headerEncoded}.${payloadEncoded}`;

    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(dataToSign)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return `${dataToSign}.${signature}`;
  }

  public static verifyJwt(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [headerB64, payloadB64, signature] = parts;
      const dataToVerify = `${headerB64}.${payloadB64}`;

      const expectedSig = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(dataToVerify)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
        return null;
      }

      const payload = JSON.parse(base64UrlDecode(payloadB64)) as TokenPayload;
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return null; // Expired
      }

      // SPRINT B31 : Révocation instantanée en temps réel si compte ou entreprise suspendu(e)
      const user = store.getUserById(payload.sub);
      if (user) {
        if (user.status === 'SUSPENDED' || user.status === 'INACTIVE' || user.verificationStatus === 'SUSPENDU') {
          return null; // Compte inactif ou suspendu : rejet immédiat du token
        }
        if (user.businessId && user.role !== 'SUPER_ADMIN') {
          const biz = store.getBusinessById(user.businessId);
          if (biz && biz.status === 'SUSPENDED') {
            return null; // Établissement suspendu : accès bloqué
          }
        }
      }

      return payload;
    } catch (e) {
      return null;
    }
  }

  // 3. Transform entity to client-safe UserProfile
  public static toUserProfile(user: UserAccountEntity): UserProfile {
    const business = user.businessId ? store.getBusinessById(user.businessId) : null;
    return {
      id: user.id,
      name: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      birthDate: user.birthDate,
      initials: `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase() || 'FX',
      role: user.role as RoleType,
      tenantName: business?.name || (user.role === 'SUPER_ADMIN' ? 'Administration Flowexa' : 'Compte Client Flowexa'),
      businessName: business?.name,
      businessId: user.businessId,
      activeBusinessModule: (business?.module_code as BusinessModuleCode) || 'IMMOBILIER',
      avatarUrl: user.avatarUrl,
      verificationStatus: user.verificationStatus,
      status: user.status,
      twoFactorEnabled: !!user.twoFactorEnabled,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      notificationPreferences: {
        appointmentReminders: true,
        bookingReminders: true,
        messages: true,
        promotions: !!user.notificationPreferences?.marketing,
        paymentReminders: true,
      },
    };
  }

  // 4. Inscription Client (Sprint B24 - Section 2)
  public static registerClient(payload: RegisterClientPayload, ip = '127.0.0.1'): { user: UserProfile; token: string; refreshToken: string } {
    if (!payload.firstName?.trim() || !payload.lastName?.trim()) {
      throw new Error('Le nom et le prénom sont obligatoires.');
    }
    if (!payload.phone?.trim()) {
      throw new Error('Le numéro de téléphone est obligatoire.');
    }
    if (!payload.password || payload.password.length < 6) {
      throw new Error('Le mot de passe doit comporter au moins 6 caractères.');
    }
    if (!payload.acceptTerms) {
      throw new Error('Vous devez accepter les conditions générales d’utilisation.');
    }

    // Vérification de doublon par téléphone
    const existingByPhone = store.getUserByEmailOrPhone(payload.phone);
    if (existingByPhone) {
      throw new Error('Un compte existe déjà avec ce numéro de téléphone.');
    }

    if (payload.email) {
      const existingByEmail = store.getUserByEmailOrPhone(payload.email);
      if (existingByEmail) {
        throw new Error('Un compte existe déjà avec cette adresse email.');
      }
    }

    const { hash, salt } = this.hashPassword(payload.password);
    const fullName = `${payload.firstName.trim()} ${payload.lastName.trim()}`;

    const newUser = store.createUser({
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      fullName,
      phone: payload.phone.trim(),
      email: payload.email?.trim().toLowerCase() || `${payload.phone.replace(/\D/g, '')}@client.flowexa.bj`,
      passwordHash: hash,
      passwordSalt: salt,
      role: 'CLIENT',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIE',
      notificationPreferences: {
        email: !!payload.email,
        sms: true,
        whatsapp: true,
        marketing: false,
      },
    });

    const token = this.generateJwt(newUser);
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshExpiry = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 3600 * 1000).toISOString();
    store.createSession({
      userId: newUser.id,
      refreshToken,
      expiresAt: refreshExpiry,
      ip,
    });

    store.logAudit({
      userId: newUser.id,
      userEmail: newUser.email,
      action: 'USER_REGISTER_CLIENT',
      entityType: 'UserAccount',
      entityId: newUser.id,
      description: `Inscription nouveau compte client : ${newUser.fullName} (${newUser.phone})`,
      ip,
    });

    return {
      user: this.toUserProfile(newUser),
      token,
      refreshToken,
    };
  }

  // 5. Inscription Entreprise (Sprint B24 - Section 3 & 4)
  public static registerBusiness(payload: RegisterBusinessPayload, ip = '127.0.0.1'): { user: UserProfile; token: string; refreshToken: string; business: any } {
    const firstName = (payload.firstName || (payload as any).ownerFirstName || '').trim();
    const lastName = (payload.lastName || (payload as any).ownerLastName || '').trim();
    const businessName = payload.businessName?.trim();
    const phone = payload.phone?.trim();
    const email = payload.email?.trim()?.toLowerCase();
    const chosenModule = (payload.moduleCode || (payload as any).businessModule) as BusinessModuleCode;

    if (!firstName || !lastName) {
      throw new Error('Le nom et prénom du responsable sont requis.');
    }
    if (!businessName) {
      throw new Error('Le nom de l’entreprise est requis.');
    }
    if (!phone) {
      throw new Error('Le numéro de téléphone officiel est requis.');
    }
    if (!email) {
      throw new Error('L’email professionnel est requis.');
    }
    if (!payload.password || payload.password.length < 6) {
      throw new Error('Le mot de passe doit comporter au moins 6 caractères.');
    }
    if (!payload.acceptTerms) {
      throw new Error('Vous devez accepter les conditions générales de la plateforme Flowexa.');
    }

    // Contrôle strict du métier : parmi les catégories autorisées, SANS couturier / tailleur
    if (!VALID_FLOWEXA_MODULES.includes(chosenModule)) {
      throw new Error(
        `Le métier sélectionné n'est pas autorisé ou n'existe pas. Métiers supportés : ${VALID_FLOWEXA_MODULES.join(
          ', '
        )}`
      );
    }

    // Vérification de doublon
    const existingUser = store.getUserByEmailOrPhone(email) || store.getUserByEmailOrPhone(phone);
    if (existingUser) {
      throw new Error('Un compte existe déjà avec cette adresse email ou ce numéro de téléphone.');
    }

    // Création de l'entreprise
    const businessId = `biz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const tenantId = `tenant_${businessName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
    const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newBusiness = {
      id: businessId,
      tenantId,
      name: businessName,
      slug,
      module_code: chosenModule,
      enabled_modules: [chosenModule],
      status: 'ACTIVE' as const,
      phone,
      whatsapp: phone,
      email,
      website: '',
      address: payload.address || `${payload.district || ''}, ${payload.city || 'Cotonou'}`,
      city: payload.city || 'Cotonou',
      district: payload.district || '',
      description: payload.description || `Entreprise spécialisée en ${chosenModule} certifiée Flowexa Bénin.`,
      logo_url: '',
      cover_image_url: '',
      rating_average: 5.0,
      reviews_count: 0,
      is_verified: true,
      subscription_plan: 'PRO',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: [],
    };

    store.getDb().businesses.push(newBusiness as any);

    // Création de l'utilisateur Propriétaire (BUSINESS_OWNER, strictement pas SUPER_ADMIN)
    const { hash, salt } = this.hashPassword(payload.password);
    const fullName = `${firstName} ${lastName}`;

    const ownerUser = store.createUser({
      firstName,
      lastName,
      fullName,
      phone,
      email,
      passwordHash: hash,
      passwordSalt: salt,
      role: 'BUSINESS_OWNER',
      businessId,
      tenantId,
      status: 'ACTIVE',
      verificationStatus: 'VERIFIE',
      notificationPreferences: {
        email: true,
        sms: true,
        whatsapp: true,
        marketing: false,
      },
      permissions: {
        canViewRequests: true,
        canManageAppointments: true,
        canViewClients: true,
        canViewStats: true,
        canManageCatalog: true,
      },
    });

    const token = this.generateJwt(ownerUser);
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshExpiry = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 3600 * 1000).toISOString();
    store.createSession({
      userId: ownerUser.id,
      refreshToken,
      expiresAt: refreshExpiry,
      ip,
    });

    store.logAudit({
      userId: ownerUser.id,
      userEmail: ownerUser.email,
      action: 'BUSINESS_REGISTER',
      entityType: 'Business',
      entityId: businessId,
      description: `Création entreprise [${newBusiness.name}] avec gérant [${ownerUser.fullName}] (${newBusiness.module_code})`,
      ip,
    });

    return {
      user: this.toUserProfile(ownerUser),
      token,
      refreshToken,
      business: newBusiness,
    };
  }

  // 6. Connexion (Sprint B24 - Section 8)
  public static login(
    identifier: string,
    password: string,
    ip = '127.0.0.1',
    userAgent = 'Web Browser'
  ): { user: UserProfile; token: string; refreshToken: string } {
    if (!identifier?.trim() || !password) {
      throw new Error('Veuillez fournir un identifiant (email ou téléphone) et un mot de passe.');
    }

    const user = store.getUserByEmailOrPhone(identifier);
    if (!user || user.status === 'INACTIVE') {
      throw new Error('Identifiant ou mot de passe incorrect.');
    }

    // Vérification de suspension de compte (Section 23)
    if (user.status === 'SUSPENDED' || user.verificationStatus === 'SUSPENDU') {
      store.logAudit({
        userId: user.id,
        userEmail: user.email,
        action: 'LOGIN_BLOCKED_SUSPENDED',
        entityType: 'UserAccount',
        entityId: user.id,
        description: `Tentative de connexion refusée sur compte suspendu : ${user.email}`,
        ip,
      });
      throw new Error('Votre compte est suspendu. Veuillez contacter le support Flowexa.');
    }

    // Vérification du mot de passe haché
    const valid = this.verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!valid) {
      store.logAudit({
        userId: user.id,
        userEmail: user.email,
        action: 'LOGIN_FAILED',
        entityType: 'UserAccount',
        entityId: user.id,
        description: `Échec de connexion : mot de passe erroné pour ${user.email}`,
        ip,
      });
      throw new Error('Identifiant ou mot de passe incorrect.');
    }

    // Vérification si l'entreprise associée est suspendue
    if (user.businessId && user.role !== 'SUPER_ADMIN') {
      const biz = store.getBusinessById(user.businessId);
      if (biz && biz.status === 'SUSPENDED') {
        store.logAudit({
          userId: user.id,
          userEmail: user.email,
          action: 'LOGIN_BLOCKED_BUSINESS_SUSPENDED',
          entityType: 'Business',
          entityId: biz.id,
          description: `Tentative d'accès à une entreprise suspendue [${biz.name}] par ${user.email}`,
          ip,
        });
        throw new Error('L’entreprise à laquelle vous appartenez est suspendue.');
      }
    }

    // Mise à jour de la dernière connexion
    user.lastLoginAt = new Date().toISOString();
    store.updateUser(user.id, { lastLoginAt: user.lastLoginAt });

    const token = this.generateJwt(user);
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshExpiry = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 3600 * 1000).toISOString();

    store.createSession({
      userId: user.id,
      refreshToken,
      expiresAt: refreshExpiry,
      userAgent,
      ip,
    });

    store.logAudit({
      userId: user.id,
      userEmail: user.email,
      action: 'USER_LOGIN',
      entityType: 'UserAccount',
      entityId: user.id,
      description: `Connexion réussie : ${user.fullName} (${user.role})`,
      ip,
    });

    return {
      user: this.toUserProfile(user),
      token,
      refreshToken,
    };
  }

  // 7. Déconnexion (Sprint B24 - Section 10)
  public static logout(refreshToken?: string, userId?: string, ip = '127.0.0.1'): boolean {
    if (refreshToken) {
      store.revokeSession(refreshToken);
    }
    if (userId) {
      store.logAudit({
        userId,
        userEmail: store.getUserById(userId)?.email || 'inconnu',
        action: 'USER_LOGOUT',
        entityType: 'UserAccount',
        entityId: userId,
        description: `Déconnexion utilisateur et révocation de session`,
        ip,
      });
    }
    return true;
  }

  // 8. Refresh Token (Sprint B24 - Section 10)
  public static refreshToken(oldRefreshToken: string): { token: string; refreshToken: string } {
    if (!oldRefreshToken) {
      throw new Error('Refresh token manquant.');
    }
    const session = store.getSessionByRefreshToken(oldRefreshToken);
    if (!session) {
      throw new Error('Session invalide ou expirée.');
    }
    if (new Date(session.expiresAt) < new Date()) {
      store.revokeSession(oldRefreshToken);
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    const user = store.getUserById(session.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new Error('Compte inactif ou introuvable.');
    }

    // Révocation de l'ancien refresh token et création d'un nouveau (Token Rotation)
    store.revokeSession(oldRefreshToken);

    const newAccessToken = this.generateJwt(user);
    const newRefreshToken = crypto.randomBytes(32).toString('hex');
    const refreshExpiry = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 3600 * 1000).toISOString();

    store.createSession({
      userId: user.id,
      refreshToken: newRefreshToken,
      expiresAt: refreshExpiry,
      userAgent: session.userAgent,
      ip: session.ip,
    });

    return {
      token: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  // 9. Mot de passe oublié (Sprint B24 - Section 9)
  public static forgotPassword(phoneOrEmail: string, ip = '127.0.0.1'): { resetToken: string; testCode: string } {
    if (!phoneOrEmail?.trim()) {
      throw new Error('Veuillez renseigner votre email ou téléphone.');
    }

    const user = store.getUserByEmailOrPhone(phoneOrEmail);
    if (!user) {
      // Message générique pour éviter l'énumération d'utilisateurs
      throw new Error('Si ce compte existe, un code de sécurité a été transmis par SMS / WhatsApp.');
    }

    // Génération du code à 6 chiffres et d'un jeton unique de réinitialisation
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    store.createPasswordReset({
      userId: user.id,
      phoneOrEmail: user.phone || user.email,
      code,
      token,
      expiresAt,
    });

    store.logAudit({
      userId: user.id,
      userEmail: user.email,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'UserAccount',
      entityId: user.id,
      description: `Demande de réinitialisation mot de passe pour ${user.phone || user.email}`,
      ip,
    });

    return {
      resetToken: token,
      testCode: code,
    };
  }

  // 10. Réinitialiser mot de passe (Sprint B24 - Section 9)
  public static resetPassword(tokenOrCode: string, newPassword: string, ip = '127.0.0.1'): boolean {
    if (!tokenOrCode?.trim()) {
      throw new Error('Code ou jeton de réinitialisation manquant.');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Le nouveau mot de passe doit comporter au moins 6 caractères.');
    }

    const reset = store.getPasswordReset(tokenOrCode);
    if (!reset) {
      throw new Error('Code ou jeton expiré ou invalide. Veuillez renouveler votre demande.');
    }

    const user = store.getUserById(reset.userId);
    if (!user) {
      throw new Error('Utilisateur introuvable.');
    }

    const { hash, salt } = this.hashPassword(newPassword);
    store.updateUser(user.id, {
      passwordHash: hash,
      passwordSalt: salt,
    });

    // Invalidation de toutes les sessions actives (Sécurité Section 10)
    store.revokeUserSessions(user.id);
    store.markPasswordResetUsed(reset.id);

    store.logAudit({
      userId: user.id,
      userEmail: user.email,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'UserAccount',
      entityId: user.id,
      description: `Mot de passe mis à jour avec succès pour ${user.email}`,
      ip,
    });

    return true;
  }

  // 11. Multi-Tenant Guard (Sprint B24 - Section 14 & 15)
  // RÈGLE ABSOLUE : Un utilisateur appartenant à Entreprise A ne peut JAMAIS accéder aux données d'Entreprise B
  public static assertTenantAccess(user: UserAccountEntity, requestedBusinessId?: string): boolean {
    if (user.role === 'SUPER_ADMIN') {
      return true; // Super Admin a accès global supervisé
    }
    if (!requestedBusinessId) {
      return true; // Requête sans scope entreprise spécifique
    }
    if (user.role === 'CLIENT') {
      // Les clients peuvent consulter les informations publiques d'une entreprise mais pas son backoffice
      return true;
    }
    if (user.businessId !== requestedBusinessId) {
      store.logAudit({
        userId: user.id,
        userEmail: user.email,
        action: 'TENANT_BREACH_ATTEMPT',
        entityType: 'Security',
        entityId: requestedBusinessId,
        description: `Tentative d'accès non autorisée d'un employé/gérant de [${user.businessId}] vers [${requestedBusinessId}]`,
        ip: '127.0.0.1',
      });
      throw new Error('Violation d’isolation multi-tenant : vous n’avez pas accès aux données de cette entreprise.');
    }
    return true;
  }
}
