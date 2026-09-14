/**
 * FLOWEXA OPENAPI 3.0 SPECIFICATION (SPRINT B34)
 * Documentation officielle de l'API Flowexa v1
 * Reflète fidèlement les routes, schémas, authentification Bearer JWT, rôles, pagination et erreurs standards.
 * Zéro secret exposé, zéro donnée fictive trompeuse.
 */

export const flowexaOpenApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Flowexa Multi-Tenant Platform API',
    version: '1.0.0',
    description: 'Documentation officielle des points de terminaison REST de la plateforme FLOWEXA. Supporte l’authentification JWT, l’isolation stricte multi-tenant, la recherche géospatiale, les devis, réservations, paiements Mobile Money/Carte et la messagerie sécurisée.',
    contact: {
      name: 'Support Technique Flowexa',
      email: 'contact@flowexa.bj',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Serveur API v1 Actuel',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Jeton JWT d’accès obtenu via /auth/login ou /auth/register-client. Transmis via l’en-tête "Authorization: Bearer <token>".',
      },
    },
    schemas: {
      StandardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          code: { type: 'string', example: 'BAD_REQUEST' },
          message: { type: 'string' },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          pageSize: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 42 },
          totalPages: { type: 'integer', example: 3 },
          hasNext: { type: 'boolean', example: true },
          hasPrev: { type: 'boolean', example: false },
        },
      },
      Business: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          category: { type: 'string' },
          address: { type: 'string' },
          city: { type: 'string' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          phone: { type: 'string' },
          email: { type: 'string' },
          rating: { type: 'number', nullable: true },
          reviewCount: { type: 'integer' },
          isOpenNow: { type: 'boolean' },
        },
      },
      Booking: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          businessId: { type: 'string' },
          roomId: { type: 'string' },
          clientName: { type: 'string' },
          clientPhone: { type: 'string' },
          checkIn: { type: 'string', format: 'date' },
          checkOut: { type: 'string', format: 'date' },
          totalAmount: { type: 'number' },
          status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'CANCELLED'] },
        },
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Santé générale du système',
        tags: ['Système'],
        security: [],
        responses: {
          '200': { description: 'Système opérationnel' },
        },
      },
    },
    '/auth/register-client': {
      post: {
        summary: 'Inscription d’un nouveau client',
        tags: ['Authentification'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName', 'phone', 'password'],
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  phone: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Compte créé avec succès' },
          '400': { description: 'Paramètres invalides' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Connexion utilisateur (JWT)',
        tags: ['Authentification'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['identifier', 'password'],
                properties: {
                  identifier: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Connexion réussie avec token JWT et refreshToken' },
          '401': { description: 'Identifiants incorrects ou compte suspendu' },
        },
      },
    },
    '/auth/refresh-token': {
      post: {
        summary: 'Renouvellement de token JWT d’accès',
        tags: ['Authentification'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Nouveau token JWT émis' },
          '401': { description: 'Jeton de rafraîchissement révoqué ou expiré' },
        },
      },
    },
    '/businesses': {
      get: {
        summary: 'Liste paginée des établissements professionnels',
        tags: ['Entreprises'],
        security: [],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Liste des entreprises et pagination' },
        },
      },
    },
    '/search/nearby': {
      get: {
        summary: 'Recherche spatiale et par mots-clés à proximité',
        tags: ['Recherche'],
        security: [],
        parameters: [
          { name: 'lat', in: 'query', schema: { type: 'number' } },
          { name: 'lng', in: 'query', schema: { type: 'number' } },
          { name: 'radius', in: 'query', schema: { type: 'number', default: 10 } },
          { name: 'keyword', in: 'query', schema: { type: 'string' } },
          { name: 'open_now', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: {
          '200': { description: 'Résultats triés par distance' },
        },
      },
    },
    '/bookings': {
      post: {
        summary: 'Créer une réservation avec détection de collision de dates',
        tags: ['Réservations'],
        responses: {
          '201': { description: 'Réservation créée' },
          '409': { description: 'Conflit : chambre déjà réservée sur cette période' },
        },
      },
    },
    '/payments': {
      post: {
        summary: 'Initialisation d’une transaction de paiement (Kkiapay, Mobile Money)',
        tags: ['Paiements'],
        responses: {
          '201': { description: 'Paiement initié' },
          '400': { description: 'Réservation introuvable ou paramètres invalides' },
        },
      },
    },
    '/payments/webhook': {
      post: {
        summary: 'Point de terminaison Webhook sécurisé par signature HMAC',
        tags: ['Paiements'],
        security: [],
        responses: {
          '200': { description: 'Webhook traité avec succès' },
          '401': { description: 'Signature cryptographique invalide' },
        },
      },
    },
  },
};

export function renderSwaggerHtml(specUrl: string = '/api/v1/openapi.json'): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>FLOWEXA — Documentation API Swagger / OpenAPI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; padding: 0; background: #fafafa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .topbar { background: #0f172a; color: white; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; }
    .topbar h1 { margin: 0; font-size: 1.25rem; font-weight: 700; letter-spacing: -0.025em; }
    .topbar a { color: #38bdf8; text-decoration: none; font-size: 0.875rem; font-weight: 500; }
  </style>
</head>
<body>
  <div class="topbar">
    <h1>FLOWEXA REST API — Spécification OpenAPI 3.0</h1>
    <a href="/">← Retour à l'application</a>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "${specUrl}",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;
}
