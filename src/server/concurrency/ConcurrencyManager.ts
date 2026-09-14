/**
 * FLOWEXA B32 - Concurrency & Lock Manager
 * Prevents race conditions, double bookings, and duplicate submissions
 * using in-memory atomic locks with automatic timeout release.
 */

interface ActiveLock {
  resourceId: string;
  ownerId: string;
  acquiredAt: number;
  expiresAt: number;
}

export class ConcurrencyManager {
  private static instance: ConcurrencyManager;
  private locks = new Map<string, ActiveLock>();
  private idempotencyStore = new Map<string, { response: any; timestamp: number }>();

  private constructor() {
    // Nettoyage régulier des verrous expirés toutes les 10 secondes
    setInterval(() => this.cleanup(), 10000);
  }

  public static getInstance(): ConcurrencyManager {
    if (!ConcurrencyManager.instance) {
      ConcurrencyManager.instance = new ConcurrencyManager();
    }
    return ConcurrencyManager.instance;
  }

  /**
   * Tenter d'acquérir un verrou sur une ressource (ex: chambre pour des dates données)
   * @param resourceKey Identifiant de la ressource (ex: `booking:room-101:2026-09-15:2026-09-18`)
   * @param ownerId Identifiant du demandeur / requête
   * @param ttlMs Durée de validité du verrou en ms (défaut 5000ms)
   */
  public acquireLock(resourceKey: string, ownerId: string, ttlMs: number = 5000): boolean {
    const now = Date.now();
    const existing = this.locks.get(resourceKey);

    if (existing && existing.expiresAt > now) {
      // Verrou déjà détenu par un autre processus actif
      return false;
    }

    this.locks.set(resourceKey, {
      resourceId: resourceKey,
      ownerId,
      acquiredAt: now,
      expiresAt: now + ttlMs,
    });
    return true;
  }

  /**
   * Libérer un verrou
   */
  public releaseLock(resourceKey: string, ownerId?: string): boolean {
    const existing = this.locks.get(resourceKey);
    if (!existing) return true;

    if (ownerId && existing.ownerId !== ownerId) {
      return false; // Seul le propriétaire peut libérer le verrou
    }

    return this.locks.delete(resourceKey);
  }

  /**
   * Enregistrer ou vérifier une clé d'idempotence
   */
  public checkIdempotency(key: string): any | null {
    const record = this.idempotencyStore.get(key);
    if (!record) return null;
    // Si la clé date de moins de 24 heures
    if (Date.now() - record.timestamp < 86400000) {
      return record.response;
    }
    this.idempotencyStore.delete(key);
    return null;
  }

  public saveIdempotency(key: string, response: any): void {
    this.idempotencyStore.set(key, {
      response,
      timestamp: Date.now(),
    });
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, lock] of this.locks.entries()) {
      if (now > lock.expiresAt) {
        this.locks.delete(key);
      }
    }
  }
}

export const concurrencyManager = ConcurrencyManager.getInstance();
