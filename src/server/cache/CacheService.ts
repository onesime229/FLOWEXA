/**
 * FLOWEXA B32 - High-Performance Cache Service
 * Provides in-memory and Redis-ready caching with Tag-based invalidation,
 * TTL enforcement, serialization safety, and hit/miss observability.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: string[];
  createdAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  invalidations: number;
  keysCount: number;
  hitRate: number;
}

export class CacheService {
  private static instance: CacheService;
  private cache = new Map<string, CacheEntry<any>>();
  private tagIndex = new Map<string, Set<string>>();
  
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    invalidations: 0,
    keysCount: 0,
    hitRate: 0,
  };

  private constructor() {
    // Nettoyage périodique des entrées expirées toutes les 60 secondes
    setInterval(() => this.pruneExpired(), 60000);
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Récupérer une valeur du cache
   */
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    this.stats.hits++;
    this.updateHitRate();
    // Retourner une copie profonde pour éviter les mutations directes
    try {
      return JSON.parse(JSON.stringify(entry.value)) as T;
    } catch {
      return entry.value as T;
    }
  }

  /**
   * Écrire une valeur dans le cache avec TTL en secondes et tags d'invalidation
   */
  public set<T>(key: string, value: T, ttlSeconds: number = 300, tags: string[] = []): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    
    // Associer aux tags pour invalidation rapide
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }

    this.cache.set(key, {
      value: JSON.parse(JSON.stringify(value)),
      expiresAt,
      tags,
      createdAt: Date.now(),
    });

    this.stats.sets++;
    this.stats.keysCount = this.cache.size;
    this.updateHitRate();
  }

  /**
   * Supprimer une clé
   */
  public delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    for (const tag of entry.tags) {
      const keysWithTag = this.tagIndex.get(tag);
      if (keysWithTag) {
        keysWithTag.delete(key);
        if (keysWithTag.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    }

    const deleted = this.cache.delete(key);
    this.stats.keysCount = this.cache.size;
    return deleted;
  }

  /**
   * Invalider toutes les entrées associées à un tag (ex: 'catalog', 'businesses', 'stats', 'nearby')
   */
  public invalidateTag(tag: string): number {
    const keys = this.tagIndex.get(tag);
    if (!keys || keys.size === 0) return 0;

    let count = 0;
    for (const key of Array.from(keys)) {
      if (this.delete(key)) {
        count++;
      }
    }

    this.tagIndex.delete(tag);
    this.stats.invalidations += count;
    return count;
  }

  /**
   * Invalider plusieurs tags en une seule opération
   */
  public invalidateTags(tags: string[]): number {
    let total = 0;
    for (const tag of tags) {
      total += this.invalidateTag(tag);
    }
    return total;
  }

  /**
   * Vider complètement le cache
   */
  public clear(): void {
    this.cache.clear();
    this.tagIndex.clear();
    this.stats.keysCount = 0;
  }

  /**
   * Obtenir les statistiques du cache
   */
  public getStats(): CacheStats & { memoryKeys: number; memoryTags: number } {
    return {
      ...this.stats,
      memoryKeys: this.cache.size,
      memoryTags: this.tagIndex.size,
    };
  }

  private pruneExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.delete(key);
      }
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? Math.round((this.stats.hits / total) * 1000) / 10 : 0;
  }
}

export const cacheService = CacheService.getInstance();
