import {
  UserProfile,
  RegisterClientPayload,
  RegisterBusinessPayload,
  AuthResponse,
} from '../types';

const TOKEN_KEY = 'flowexa_token';
const REFRESH_TOKEN_KEY = 'flowexa_refresh_token';

export const authStorage = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setTokens(token: string, refreshToken?: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch (e) {
      console.warn('Unable to persist tokens to localStorage', e);
    }
  },
  clearTokens() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (e) {
      console.warn('Unable to clear tokens', e);
    }
  },
};

function getAuthHeaders(): HeadersInit {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const authApi = {
  // 1. Connexion (Email ou Téléphone + Mot de passe)
  async login(identifier: string, password: string): Promise<AuthResponse> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Identifiants invalides');
    }
    if (data.token) {
      authStorage.setTokens(data.token, data.refreshToken);
    }
    return data;
  },

  // 2. Inscription Client
  async registerClient(payload: Omit<RegisterClientPayload, 'type'>): Promise<AuthResponse> {
    const res = await fetch('/api/auth/register-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, type: 'CLIENT' }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Échec de l’inscription client');
    }
    if (data.token) {
      authStorage.setTokens(data.token, data.refreshToken);
    }
    return data;
  },

  // 3. Inscription Entreprise
  async registerBusiness(payload: Omit<RegisterBusinessPayload, 'type'>): Promise<AuthResponse> {
    const res = await fetch('/api/auth/register-business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, type: 'BUSINESS' }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Échec de l’inscription entreprise');
    }
    if (data.token) {
      authStorage.setTokens(data.token, data.refreshToken);
    }
    return data;
  },

  // 4. Déconnexion
  async logout(userId?: string): Promise<void> {
    const refreshToken = authStorage.getRefreshToken();
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ refreshToken, userId }),
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      authStorage.clearTokens();
    }
  },

  // 5. Récupérer le profil courant (Session restore)
  async getMe(): Promise<UserProfile | null> {
    const token = authStorage.getToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/auth/me', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        // Token expiré ou invalide
        authStorage.clearTokens();
        return null;
      }
      const data = await res.json();
      return data.user || null;
    } catch {
      return null;
    }
  },

  // 6. Mettre à jour son propre profil
  async updateMe(updates: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch('/api/auth/me', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Impossible de mettre à jour le profil');
    }
    return data.user;
  },

  // 7. Modifier mot de passe
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const res = await fetch('/api/auth/change-password', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Échec de la modification du mot de passe');
    }
  },

  // 8. Vue de sécurité
  async getSecurityOverview(): Promise<{
    user: UserProfile;
    activeSessionsCount: number;
    twoFactorEnabled: boolean;
    recentLogins: Array<{ id: string; timestamp: string; ip: string; action: string; device: string }>;
  }> {
    const res = await fetch('/api/auth/security', {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Impossible de charger la vue sécurité');
    }
    return data.security;
  },

  // 9. Activer/Désactiver 2FA
  async toggle2fa(): Promise<boolean> {
    const res = await fetch('/api/auth/toggle-2fa', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Impossible de modifier le 2FA');
    }
    return !!data.twoFactorEnabled;
  },

  // 10. Mot de passe oublié
  async forgotPassword(phoneOrEmail: string): Promise<{ testCode?: string; resetToken?: string; message: string }> {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneOrEmail }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Compte introuvable');
    }
    return data;
  },

  // 11. Réinitialisation mot de passe
  async resetPassword(tokenOrCode: string, newPassword: string): Promise<void> {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenOrCode, newPassword }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Échec de la réinitialisation');
    }
  },
};
