/**
 * FLOWEXA B32 - Image & Media Optimization Helper
 * Validates payload sizes, generates thumbnail parameters, and ensures
 * images meet performance and bandwidth budgets.
 */

export interface ImageOptimizationResult {
  valid: boolean;
  error?: string;
  originalSizeBytes?: number;
  mimeType?: string;
  recommendedDimensions?: {
    thumbnail: { width: number; height: number };
    card: { width: number; height: number };
    banner: { width: number; height: number };
  };
}

export class ImageOptimizer {
  private static MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB max
  private static ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  /**
   * Valide un fichier image uploadé (chemin, mimetype, taille en octets)
   */
  public static validateImage(
    filePath: string,
    mimeType: string,
    sizeBytes: number
  ): { valid: boolean; error?: string; optimized?: boolean } {
    if (!ImageOptimizer.ALLOWED_MIME_TYPES.includes(mimeType)) {
      return {
        valid: false,
        error: `Format d'image non supporté (${mimeType}). Formats autorisés : JPEG, PNG, WebP.`,
      };
    }

    if (sizeBytes > ImageOptimizer.MAX_IMAGE_SIZE_BYTES) {
      return {
        valid: false,
        error: `L'image dépasse la limite maximale autorisée de 5 Mo (taille: ${(sizeBytes / (1024 * 1024)).toFixed(1)} Mo).`,
      };
    }

    return {
      valid: true,
      optimized: sizeBytes > 500 * 1024, // drapeau d'optimisation si supérieur à 500KB
    };
  }

  /**
   * Valider et préparer les métadonnées d'une image uploadée (URL ou Base64)
   */
  public static validateAndInspect(input: string): ImageOptimizationResult {
    if (!input) {
      return { valid: false, error: 'Aucun contenu d\'image fourni.' };
    }

    // Si c'est une image Data URL (base64)
    if (input.startsWith('data:')) {
      const parts = input.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'unknown';

      if (!ImageOptimizer.ALLOWED_MIME_TYPES.includes(mimeType)) {
        return {
          valid: false,
          error: `Format d'image non supporté (${mimeType}). Formats autorisés : JPEG, PNG, WebP.`,
        };
      }

      // Calcul approximatif de la taille base64 en octets
      const base64Length = parts[1] ? parts[1].length : 0;
      const sizeBytes = Math.round((base64Length * 3) / 4);

      if (sizeBytes > ImageOptimizer.MAX_IMAGE_SIZE_BYTES) {
        return {
          valid: false,
          error: `L'image dépasse la limite maximale autorisée de 5 Mo (taille actuelle: ${(sizeBytes / (1024 * 1024)).toFixed(1)} Mo).`,
          originalSizeBytes: sizeBytes,
        };
      }

      return {
        valid: true,
        originalSizeBytes: sizeBytes,
        mimeType,
        recommendedDimensions: {
          thumbnail: { width: 120, height: 120 },
          card: { width: 640, height: 480 },
          banner: { width: 1280, height: 720 },
        },
      };
    }

    // Si c'est une URL externe (ex: /uploads/... ou https://...)
    return {
      valid: true,
      mimeType: 'image/jpeg',
      recommendedDimensions: {
        thumbnail: { width: 120, height: 120 },
        card: { width: 640, height: 480 },
        banner: { width: 1280, height: 720 },
      },
    };
  }
}
