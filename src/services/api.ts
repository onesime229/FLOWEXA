import type {
  MarketplaceRequestEntity,
  MarketplaceResponseEntity,
  MarketplaceMatchResult,
  MarketplaceStats,
} from '../types';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
  [key: string]: any;
}

export interface NearbyResult {
  business: {
    id: string;
    name: string;
    module_code: string;
    status: string;
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    city: string;
    district: string;
    latitude: number;
    longitude: number;
    opening_hours: Record<string, string>;
    is_open_now: boolean;
    images: Array<{ id: string; url: string; title: string; isPrimary: boolean }>;
  };
  distanceKm: number;
  distanceMeters: number;
  distanceFormatted: string;
}

export interface BusinessData {
  id: string;
  name: string;
  slug?: string;
  module_code: string;
  description?: string;
  address?: string;
  city?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  whatsapp?: string;
  email?: string;
  opening_hours?: Record<string, string>;
  is_verified?: boolean;
  status?: string;
  created_at?: string;
  images?: Array<{ id: string; url: string; caption?: string; title?: string; is_primary?: boolean }>;
}

export const flowexaApi = {
  // Business
  async getMyBusiness(businessId = 'bus_default_01') {
    const res = await fetch(`/api/v1/businesses/my-business?business_id=${encodeURIComponent(businessId)}`, {
      headers: { 'x-business-id': businessId },
    });
    return (await res.json()) as ApiResponse<BusinessData>;
  },

  async updateMyBusiness(payloadOrBusinessId: any, maybePayload?: any) {
    const businessId = typeof payloadOrBusinessId === 'string' ? payloadOrBusinessId : 'bus_default_01';
    const payload = typeof payloadOrBusinessId === 'string' ? maybePayload : payloadOrBusinessId;

    const res = await fetch('/api/v1/businesses/my-business', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessId,
      },
      body: JSON.stringify(payload),
    });
    return (await res.json()) as ApiResponse<BusinessData>;
  },

  async uploadBusinessPhoto(businessId: string, file: File, title: string, isPrimary = false) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('title', title);
    formData.append('isPrimary', String(isPrimary));

    const res = await fetch('/api/v1/businesses/my-business/images', {
      method: 'POST',
      headers: {
        'x-business-id': businessId,
      },
      body: formData,
    });
    return (await res.json()) as ApiResponse;
  },

  async uploadBusinessImage(file: File, title: string, businessId = 'bus_default_01') {
    return this.uploadBusinessPhoto(businessId, file, title);
  },

  async deleteBusinessPhoto(businessId: string, photoId: string) {
    const res = await fetch(`/api/v1/businesses/my-business/images/${encodeURIComponent(photoId)}`, {
      method: 'DELETE',
      headers: {
        'x-business-id': businessId,
      },
    });
    return (await res.json()) as ApiResponse;
  },

  async deleteBusinessImage(photoId: string, businessId = 'bus_default_01') {
    return this.deleteBusinessPhoto(businessId, photoId);
  },

  // Immobilier
  async getProperties(businessId?: string) {
    const url = businessId ? `/api/v1/properties?business_id=${encodeURIComponent(businessId)}` : '/api/v1/properties';
    const res = await fetch(url, {
      headers: businessId ? { 'x-business-id': businessId } : {},
    });
    return (await res.json()) as ApiResponse;
  },

  async createProperty(businessId: string, data: any) {
    const res = await fetch('/api/v1/properties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessId,
      },
      body: JSON.stringify({ ...data, businessId }),
    });
    return (await res.json()) as ApiResponse;
  },

  async updateProperty(propertyId: string, data: any) {
    const res = await fetch(`/api/v1/properties/${encodeURIComponent(propertyId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return (await res.json()) as ApiResponse;
  },

  async deleteProperty(propertyId: string) {
    const res = await fetch(`/api/v1/properties/${encodeURIComponent(propertyId)}`, {
      method: 'DELETE',
    });
    return (await res.json()) as ApiResponse;
  },

  // Guest House
  async getRooms(businessId?: string) {
    const url = businessId ? `/api/v1/rooms?business_id=${encodeURIComponent(businessId)}` : '/api/v1/rooms';
    const res = await fetch(url, {
      headers: businessId ? { 'x-business-id': businessId } : {},
    });
    return (await res.json()) as ApiResponse;
  },

  async createRoom(businessId: string, data: any) {
    const res = await fetch('/api/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessId,
      },
      body: JSON.stringify({ ...data, businessId }),
    });
    return (await res.json()) as ApiResponse;
  },

  async updateRoom(roomId: string, data: any) {
    const res = await fetch(`/api/v1/rooms/${encodeURIComponent(roomId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return (await res.json()) as ApiResponse;
  },

  async deleteRoom(roomId: string) {
    const res = await fetch(`/api/v1/rooms/${encodeURIComponent(roomId)}`, {
      method: 'DELETE',
    });
    return (await res.json()) as ApiResponse;
  },

  async getBookings(businessId?: string) {
    const url = businessId ? `/api/v1/bookings?business_id=${encodeURIComponent(businessId)}` : '/api/v1/bookings';
    const res = await fetch(url, {
      headers: businessId ? { 'x-business-id': businessId } : {},
    });
    return (await res.json()) as ApiResponse;
  },

  async createBooking(businessId: string, data: any) {
    const res = await fetch('/api/v1/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessId,
      },
      body: JSON.stringify({ ...data, businessId }),
    });
    return (await res.json()) as ApiResponse;
  },

  // Services (Coiffure, Barbier, Institut, Spa, Photo, Broderie, Garage, Pharmacie)
  async getServices(businessId?: string, moduleCode?: string) {
    const params = new URLSearchParams();
    if (businessId) params.append('business_id', businessId);
    if (moduleCode) params.append('module_code', moduleCode);
    const res = await fetch(`/api/v1/services?${params.toString()}`, {
      headers: businessId ? { 'x-business-id': businessId } : {},
    });
    return (await res.json()) as ApiResponse;
  },

  async createService(businessId: string, data: any) {
    const res = await fetch('/api/v1/services', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessId,
      },
      body: JSON.stringify({ ...data, businessId }),
    });
    return (await res.json()) as ApiResponse;
  },

  async updateService(serviceId: string, data: any) {
    const res = await fetch(`/api/v1/services/${encodeURIComponent(serviceId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return (await res.json()) as ApiResponse;
  },

  async deleteService(serviceId: string) {
    const res = await fetch(`/api/v1/services/${encodeURIComponent(serviceId)}`, {
      method: 'DELETE',
    });
    return (await res.json()) as ApiResponse;
  },

  // Search & Proximity
  async searchNearby(params: { lat: number; lng: number; radius?: string; module_code?: string; open_now?: boolean }) {
    const searchParams = new URLSearchParams();
    searchParams.append('lat', String(params.lat));
    searchParams.append('lng', String(params.lng));
    if (params.radius) searchParams.append('radius', params.radius);
    if (params.module_code) searchParams.append('module_code', params.module_code);
    if (params.open_now) searchParams.append('open_now', 'true');

    const res = await fetch(`/api/v1/search/nearby?${searchParams.toString()}`);
    return (await res.json()) as ApiResponse;
  },

  async searchUnified(params: {
    q?: string;
    module_code?: string;
    category?: string;
    city?: string;
    district?: string;
    min_price?: number;
    max_price?: number;
    open_now?: boolean;
    available_today?: boolean;
    lat?: number;
    lng?: number;
    radius?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.append('q', params.q);
    if (params.module_code) searchParams.append('module_code', params.module_code);
    if (params.category) searchParams.append('category', params.category);
    if (params.city) searchParams.append('city', params.city);
    if (params.district) searchParams.append('district', params.district);
    if (params.min_price !== undefined) searchParams.append('min_price', String(params.min_price));
    if (params.max_price !== undefined) searchParams.append('max_price', String(params.max_price));
    if (params.open_now) searchParams.append('open_now', 'true');
    if (params.available_today) searchParams.append('available_today', 'true');
    if (params.lat !== undefined) searchParams.append('lat', String(params.lat));
    if (params.lng !== undefined) searchParams.append('lng', String(params.lng));
    if (params.radius) searchParams.append('radius', params.radius);
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.page) searchParams.append('page', String(params.page));
    if (params.limit) searchParams.append('limit', String(params.limit));

    const res = await fetch(`/api/v1/search?${searchParams.toString()}`);
    return (await res.json()) as ApiResponse;
  },

  async getSearchSuggestions(query: string) {
    const res = await fetch(`/api/v1/search/suggestions?q=${encodeURIComponent(query)}`);
    return (await res.json()) as { success: boolean; suggestions: { queries: string[]; businesses: any[]; locations: string[] } };
  },

  async searchNaturalLanguage(params: {
    q: string;
    lat?: number;
    lng?: number;
    radius?: number;
    open_now?: boolean;
    available_today?: boolean;
    clientId?: string;
  }) {
    const res = await fetch('/api/v1/search/natural-language', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return (await res.json()) as ApiResponse;
  },

  async getCategories() {
    const res = await fetch('/api/v1/categories');
    return (await res.json()) as ApiResponse;
  },

  async getBusinessById(businessId: string) {
    const res = await fetch(`/api/v1/businesses/${businessId}`);
    return (await res.json()) as ApiResponse;
  },

  async smartSearch(query: string, options?: { lat?: number; lng?: number; radius?: number; open_now?: boolean }) {
    const res = await fetch('/api/v1/search/smart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: query,
        lat: options?.lat,
        lng: options?.lng,
        radius: options?.radius,
        open_now: options?.open_now,
      }),
    });
    return (await res.json()) as ApiResponse;
  },

  // SPRINT B11 & F11: CATALOG & PUBLICATION ENGINE
  async getCatalogItems(params?: {
    business_id?: string;
    status?: string;
    availability?: string;
    offer_type?: string;
    module_code?: string;
    category_id?: string;
    search?: string;
    lat?: number;
    lng?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.business_id) searchParams.append('business_id', params.business_id);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.availability) searchParams.append('availability', params.availability);
    if (params?.offer_type) searchParams.append('offer_type', params.offer_type);
    if (params?.module_code) searchParams.append('module_code', params.module_code);
    if (params?.category_id) searchParams.append('category_id', params.category_id);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.lat !== undefined) searchParams.append('lat', String(params.lat));
    if (params?.lng !== undefined) searchParams.append('lng', String(params.lng));

    const headers: Record<string, string> = {};
    if (params?.business_id) {
      headers['x-business-id'] = params.business_id;
    }

    const res = await fetch(`/api/v1/catalog/items?${searchParams.toString()}`, { headers });
    return (await res.json()) as ApiResponse;
  },

  async getCatalogItem(id: string) {
    const res = await fetch(`/api/v1/catalog/items/${encodeURIComponent(id)}`);
    return (await res.json()) as ApiResponse;
  },

  async createCatalogItem(data: any, businessId?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (businessId) {
      headers['x-business-id'] = businessId;
    }
    const res = await fetch('/api/v1/catalog/items', {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...data, businessId }),
    });
    return (await res.json()) as ApiResponse;
  },

  async updateCatalogItem(id: string, data: any, businessId?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (businessId) {
      headers['x-business-id'] = businessId;
    }
    const res = await fetch(`/api/v1/catalog/items/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    return (await res.json()) as ApiResponse;
  },

  async deleteCatalogItem(id: string, businessId?: string) {
    const headers: Record<string, string> = {};
    if (businessId) {
      headers['x-business-id'] = businessId;
    }
    const res = await fetch(`/api/v1/catalog/items/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers,
    });
    return (await res.json()) as ApiResponse;
  },

  async publishCatalogItem(id: string, businessId?: string) {
    const res = await fetch(`/api/v1/catalog/items/${encodeURIComponent(id)}/publish`, {
      method: 'POST',
      headers: businessId ? { 'x-business-id': businessId } : {},
    });
    return (await res.json()) as ApiResponse;
  },

  async unpublishCatalogItem(id: string) {
    const res = await fetch(`/api/v1/catalog/items/${encodeURIComponent(id)}/unpublish`, {
      method: 'POST',
    });
    return (await res.json()) as ApiResponse;
  },

  async toggleCatalogItemAvailability(id: string) {
    const res = await fetch(`/api/v1/catalog/items/${encodeURIComponent(id)}/toggle-availability`, {
      method: 'POST',
    });
    return (await res.json()) as ApiResponse;
  },

  async uploadCatalogItemImage(id: string, file: File, title?: string, isCover = false) {
    const formData = new FormData();
    formData.append('image', file);
    if (title) formData.append('title', title);
    formData.append('isCover', String(isCover));

    const res = await fetch(`/api/v1/catalog/items/${encodeURIComponent(id)}/images`, {
      method: 'POST',
      body: formData,
    });
    return (await res.json()) as ApiResponse;
  },

  async deleteCatalogItemImage(id: string, imageId: string) {
    const res = await fetch(`/api/v1/catalog/items/${encodeURIComponent(id)}/images/${encodeURIComponent(imageId)}`, {
      method: 'DELETE',
    });
    return (await res.json()) as ApiResponse;
  },

  async setCatalogItemCoverImage(id: string, imageId: string) {
    const res = await fetch(`/api/v1/catalog/items/${encodeURIComponent(id)}/images/${encodeURIComponent(imageId)}/cover`, {
      method: 'PATCH',
    });
    return (await res.json()) as ApiResponse;
  },

  async getCatalogCategories(businessId?: string) {
    const search = businessId ? `?business_id=${encodeURIComponent(businessId)}` : '';
    const res = await fetch(`/api/v1/catalog/categories${search}`, {
      headers: businessId ? { 'x-business-id': businessId } : {},
    });
    return (await res.json()) as ApiResponse;
  },

  async createCatalogCategory(name: string, businessId?: string) {
    const res = await fetch('/api/v1/catalog/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, businessId }),
    });
    return (await res.json()) as ApiResponse;
  },

  async deleteCatalogCategory(id: string) {
    const res = await fetch(`/api/v1/catalog/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return (await res.json()) as ApiResponse;
  },

  // Demandes
  async submitDemande(data: any) {
    const res = await fetch('/api/v1/demandes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return (await res.json()) as ApiResponse;
  },

  async getDemandes(businessId?: string) {
    const url = businessId ? `/api/v1/demandes?business_id=${encodeURIComponent(businessId)}` : '/api/v1/demandes';
    const res = await fetch(url, {
      headers: businessId ? { 'x-business-id': businessId } : {},
    });
    return (await res.json()) as ApiResponse;
  },

  // Super Admin (Sprint B29 / F29)
  async getAdminDashboardSummary() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') : null;
    const res = await fetch('/api/v1/admin/dashboard', {
      headers: {
        'x-user-role': 'SUPER_ADMIN',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return (await res.json()) as ApiResponse;
  },

  async getAdminBusinesses(params?: { search?: string; status?: string; moduleCode?: string; page?: number; limit?: number }) {
    const sp = new URLSearchParams();
    if (params?.search) sp.append('search', params.search);
    if (params?.status) sp.append('status', params.status);
    if (params?.moduleCode) sp.append('module_code', params.moduleCode);
    if (params?.page) sp.append('page', String(params.page));
    if (params?.limit) sp.append('limit', String(params.limit));

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') : null;
    const res = await fetch(`/api/v1/admin/businesses?${sp.toString()}`, {
      headers: {
        'x-user-role': 'SUPER_ADMIN',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return (await res.json()) as ApiResponse;
  },

  async getAdminBusinessDetail(businessId: string) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') : null;
    const res = await fetch(`/api/v1/admin/businesses/${encodeURIComponent(businessId)}`, {
      headers: {
        'x-user-role': 'SUPER_ADMIN',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return (await res.json()) as ApiResponse;
  },

  async adminActivateBusiness(businessId: string) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') : null;
    const res = await fetch(`/api/v1/admin/businesses/${encodeURIComponent(businessId)}/activate`, {
      method: 'POST',
      headers: {
        'x-user-role': 'SUPER_ADMIN',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return (await res.json()) as ApiResponse;
  },

  async adminSuspendBusiness(businessId: string, reason?: string) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') : null;
    const res = await fetch(`/api/v1/admin/businesses/${encodeURIComponent(businessId)}/suspend`, {
      method: 'POST',
      headers: {
        'x-user-role': 'SUPER_ADMIN',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ reason }),
    });
    return (await res.json()) as ApiResponse;
  },

  async adminModerateBusiness(businessId: string, action: string, reason?: string) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') : null;
    const res = await fetch(`/api/v1/admin/businesses/${encodeURIComponent(businessId)}/moderate`, {
      method: 'POST',
      headers: {
        'x-user-role': 'SUPER_ADMIN',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ action, reason }),
    });
    return (await res.json()) as ApiResponse;
  },

  async toggleBusinessStatus(businessId: string) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') : null;
    const res = await fetch(`/api/v1/admin/businesses/${encodeURIComponent(businessId)}/toggle-status`, {
      method: 'POST',
      headers: {
        'x-user-role': 'SUPER_ADMIN',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return (await res.json()) as ApiResponse;
  },

  async getAdminUsers(params?: { search?: string; role?: string; status?: string; page?: number; limit?: number }) {
    const sp = new URLSearchParams();
    if (params?.search) sp.append('search', params.search);
    if (params?.role) sp.append('role', params.role);
    if (params?.status) sp.append('status', params.status);
    if (params?.page) sp.append('page', String(params.page));
    if (params?.limit) sp.append('limit', String(params.limit));

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') : null;
    const res = await fetch(`/api/v1/admin/users?${sp.toString()}`, {
      headers: {
        'x-user-role': 'SUPER_ADMIN',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return (await res.json()) as ApiResponse;
  },

  async getAdminUserDetail(userId: string) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') : null;
    const res = await fetch(`/api/v1/admin/users/${encodeURIComponent(userId)}`, {
      headers: {
        'x-user-role': 'SUPER_ADMIN',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return (await res.json()) as ApiResponse;
  },

  async adminUpdateUserStatus(userId: string, status: string, reason?: string) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') : null;
    const res = await fetch(`/api/v1/admin/users/${encodeURIComponent(userId)}/status`, {
      method: 'PUT',
      headers: {
        'x-user-role': 'SUPER_ADMIN',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status, reason }),
    });
    return (await res.json()) as ApiResponse;
  },

  async adminUpdateUserRole(userId: string, role: string) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') : null;
    const res = await fetch(`/api/v1/admin/users/${encodeURIComponent(userId)}/role`, {
      method: 'PUT',
      headers: {
        'x-user-role': 'SUPER_ADMIN',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ role }),
    });
    return (await res.json()) as ApiResponse;
  },

  async adminArchiveUser(userId: string) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') : null;
    const res = await fetch(`/api/v1/admin/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: {
        'x-user-role': 'SUPER_ADMIN',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return (await res.json()) as ApiResponse;
  },

  async getAdminCategories() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') : null;
    const res = await fetch('/api/v1/admin/categories', {
      headers: {
        'x-user-role': 'SUPER_ADMIN',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return (await res.json()) as ApiResponse;
  },

  async adminCreateCategory(categoryData: any) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') : null;
    const res = await fetch('/api/v1/admin/categories', {
      method: 'POST',
      headers: {
        'x-user-role': 'SUPER_ADMIN',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(categoryData),
    });
    return (await res.json()) as ApiResponse;
  },

  async adminUpdateCategory(id: string, updates: any) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') : null;
    const res = await fetch(`/api/v1/admin/categories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'x-user-role': 'SUPER_ADMIN',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(updates),
    });
    return (await res.json()) as ApiResponse;
  },

  async adminToggleCategory(id: string) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') : null;
    const res = await fetch(`/api/v1/admin/categories/${encodeURIComponent(id)}/toggle`, {
      method: 'PATCH',
      headers: {
        'x-user-role': 'SUPER_ADMIN',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return (await res.json()) as ApiResponse;
  },

  async getAdminPlatformSettings() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') : null;
    const res = await fetch('/api/v1/admin/settings', {
      headers: {
        'x-user-role': 'SUPER_ADMIN',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return (await res.json()) as ApiResponse;
  },

  async adminUpdatePlatformSettings(settings: any) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') : null;
    const res = await fetch('/api/v1/admin/settings', {
      method: 'PUT',
      headers: {
        'x-user-role': 'SUPER_ADMIN',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(settings),
    });
    return (await res.json()) as ApiResponse;
  },

  async getAdminRequests(params?: { search?: string; status?: string; interactionType?: string; businessId?: string; page?: number; limit?: number }) {
    const sp = new URLSearchParams();
    if (params?.search) sp.append('search', params.search);
    if (params?.status) sp.append('status', params.status);
    if (params?.interactionType) sp.append('interaction_type', params.interactionType);
    if (params?.businessId) sp.append('business_id', params.businessId);
    if (params?.page) sp.append('page', String(params.page));
    if (params?.limit) sp.append('limit', String(params.limit));

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') : null;
    const res = await fetch(`/api/v1/admin/requests?${sp.toString()}`, {
      headers: {
        'x-user-role': 'SUPER_ADMIN',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return (await res.json()) as ApiResponse;
  },

  async getAdminAuditLogs(params?: { search?: string; action?: string; entityType?: string; page?: number; limit?: number }) {
    const sp = new URLSearchParams();
    if (params?.search) sp.append('search', params.search);
    if (params?.action) sp.append('action', params.action);
    if (params?.entityType) sp.append('entity_type', params.entityType);
    if (params?.page) sp.append('page', String(params.page));
    if (params?.limit) sp.append('limit', String(params.limit));

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') : null;
    const res = await fetch(`/api/v1/admin/audit-logs?${sp.toString()}`, {
      headers: {
        'x-user-role': 'SUPER_ADMIN',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return (await res.json()) as ApiResponse;
  },

  async getAdminStats() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') : null;
    const res = await fetch('/api/v1/admin/stats', {
      headers: {
        'x-user-role': 'SUPER_ADMIN',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return (await res.json()) as ApiResponse;
  },

  // SPRINT B13: FAVORIS
  async getFavorites(clientId = 'client-test-1') {
    const res = await fetch(`/api/v1/favorites?client_id=${encodeURIComponent(clientId)}`, {
      headers: {
        'x-user-role': 'CLIENT',
        'x-client-id': clientId,
      },
    });
    return (await res.json()) as ApiResponse;
  },

  async addFavorite(data: { businessId?: string; catalogItemId?: string }, clientId = 'client-test-1') {
    const res = await fetch('/api/v1/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'CLIENT',
        'x-client-id': clientId,
      },
      body: JSON.stringify(data),
    });
    return (await res.json()) as ApiResponse;
  },

  async removeFavorite(id: string, clientId = 'client-test-1') {
    const res = await fetch(`/api/v1/favorites/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'x-user-role': 'CLIENT',
        'x-client-id': clientId,
      },
    });
    return (await res.json()) as ApiResponse;
  },

  async removeFavoriteByTarget(
    target: { businessId?: string; catalogItemId?: string },
    clientId = 'client-test-1'
  ) {
    const res = await fetch('/api/v1/favorites', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'CLIENT',
        'x-client-id': clientId,
      },
      body: JSON.stringify(target),
    });
    return (await res.json()) as ApiResponse;
  },

  // SPRINT B13: AVIS & NOTATION
  async getReviews(params?: {
    business_id?: string;
    businessId?: string;
    catalog_item_id?: string;
    catalogItemId?: string;
  }) {
    const sp = new URLSearchParams();
    const bId = params?.business_id || params?.businessId;
    const cId = params?.catalog_item_id || params?.catalogItemId;
    if (bId) sp.append('business_id', bId);
    if (cId) sp.append('catalog_item_id', cId);
    const res = await fetch(`/api/v1/reviews?${sp.toString()}`);
    return (await res.json()) as ApiResponse;
  },

  async getMyReviews(clientId = 'client-test-1') {
    const res = await fetch('/api/v1/reviews/my', {
      headers: {
        'x-user-role': 'CLIENT',
        'x-client-id': clientId,
      },
    });
    return (await res.json()) as ApiResponse;
  },

  async getBusinessReviews(businessId: string) {
    const res = await fetch(`/api/v1/businesses/${encodeURIComponent(businessId)}/reviews`, {
      headers: {
        'x-user-role': 'BUSINESS_OWNER',
        'x-business-id': businessId,
      },
    });
    return (await res.json()) as ApiResponse;
  },

  async createReview(
    data: {
      requestId?: string;
      businessId?: string;
      catalogItemId?: string;
      rating: number;
      comment: string;
      clientName?: string;
      clientEmail?: string;
    },
    clientId = 'client-test-1'
  ) {
    const res = await fetch('/api/v1/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'CLIENT',
        'x-client-id': clientId,
      },
      body: JSON.stringify(data),
    });
    return (await res.json()) as ApiResponse;
  },

  async reportReview(
    reviewId: string,
    data: { reason: string; details: string; reporterName?: string },
    reporterId = 'client-test-1'
  ) {
    const res = await fetch(`/api/v1/reviews/${encodeURIComponent(reviewId)}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'CLIENT',
        'x-client-id': reporterId,
      },
      body: JSON.stringify(data),
    });
    return (await res.json()) as ApiResponse;
  },

  // SUPER ADMIN MODERATION
  async getAdminReviews(status?: string, reportedOnly?: boolean) {
    const sp = new URLSearchParams();
    if (status) sp.append('status', status);
    if (reportedOnly) sp.append('reported_only', 'true');
    const res = await fetch(`/api/v1/admin/reviews?${sp.toString()}`, {
      headers: {
        'x-user-role': 'SUPER_ADMIN',
      },
    });
    return (await res.json()) as ApiResponse;
  },

  async getAdminReports(status?: string) {
    const sp = new URLSearchParams();
    if (status) sp.append('status', status);
    const res = await fetch(`/api/v1/admin/reviews/reports?${sp.toString()}`, {
      headers: {
        'x-user-role': 'SUPER_ADMIN',
      },
    });
    return (await res.json()) as ApiResponse;
  },

  async adminHideReview(id: string, reason?: string) {
    const res = await fetch(`/api/v1/admin/reviews/${encodeURIComponent(id)}/hide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'SUPER_ADMIN',
      },
      body: JSON.stringify({ reason }),
    });
    return (await res.json()) as ApiResponse;
  },

  async adminRestoreReview(id: string, reason?: string) {
    const res = await fetch(`/api/v1/admin/reviews/${encodeURIComponent(id)}/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'SUPER_ADMIN',
      },
      body: JSON.stringify({ reason }),
    });
    return (await res.json()) as ApiResponse;
  },

  async adminRejectReview(id: string, reason?: string) {
    const res = await fetch(`/api/v1/admin/reviews/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'SUPER_ADMIN',
      },
      body: JSON.stringify({ reason }),
    });
    return (await res.json()) as ApiResponse;
  },

  async adminDeleteReview(id: string, reason?: string) {
    const res = await fetch(`/api/v1/admin/reviews/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'SUPER_ADMIN',
      },
      body: JSON.stringify({ reason }),
    });
    return (await res.json()) as ApiResponse;
  },

  async adminResolveReport(id: string) {
    const res = await fetch(`/api/v1/admin/reviews/reports/${encodeURIComponent(id)}/resolve`, {
      method: 'POST',
      headers: {
        'x-user-role': 'SUPER_ADMIN',
      },
    });
    return (await res.json()) as ApiResponse;
  },

  async adminDismissReport(id: string) {
    const res = await fetch(`/api/v1/admin/reviews/reports/${encodeURIComponent(id)}/dismiss`, {
      method: 'POST',
      headers: {
        'x-user-role': 'SUPER_ADMIN',
      },
    });
    return (await res.json()) as ApiResponse;
  },

  // SPRINT B14: MESSAGERIE & CONVERSATIONS
  async getConversations(
    caller: { role: string; clientId?: string; businessId?: string },
    filters?: { search?: string; status?: string; businessId?: string; clientId?: string }
  ) {
    const sp = new URLSearchParams();
    if (filters?.search) sp.append('search', filters.search);
    if (filters?.status) sp.append('status', filters.status);
    if (filters?.businessId) sp.append('business_id', filters.businessId);
    if (filters?.clientId) sp.append('client_id', filters.clientId);

    const headers: Record<string, string> = {
      'x-user-role': caller.role,
    };
    if (caller.clientId) headers['x-client-id'] = caller.clientId;
    if (caller.businessId) headers['x-business-id'] = caller.businessId;

    const res = await fetch(`/api/v1/conversations?${sp.toString()}`, { headers });
    return (await res.json()) as ApiResponse;
  },

  async getConversation(
    id: string,
    caller: { role: string; clientId?: string; businessId?: string }
  ) {
    const headers: Record<string, string> = {
      'x-user-role': caller.role,
    };
    if (caller.clientId) headers['x-client-id'] = caller.clientId;
    if (caller.businessId) headers['x-business-id'] = caller.businessId;

    const res = await fetch(`/api/v1/conversations/${encodeURIComponent(id)}`, { headers });
    return (await res.json()) as ApiResponse;
  },

  async createOrGetConversation(
    data: {
      clientId?: string;
      clientName?: string;
      clientPhone?: string;
      clientEmail?: string;
      businessId: string;
      requestId?: string;
      bookingId?: string;
      appointmentId?: string;
      catalogItemId?: string;
      initialMessage?: string;
    },
    caller?: { role?: string; clientId?: string; businessId?: string }
  ) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-role': caller?.role || 'CLIENT',
    };
    if (caller?.clientId || data.clientId) {
      headers['x-client-id'] = caller?.clientId || data.clientId || 'client-test-1';
    }
    if (caller?.businessId) {
      headers['x-business-id'] = caller.businessId;
    }

    const res = await fetch('/api/v1/conversations', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return (await res.json()) as ApiResponse;
  },

  async getMessages(
    conversationId: string,
    caller: { role: string; clientId?: string; businessId?: string },
    page = 1,
    limit = 100
  ) {
    const headers: Record<string, string> = {
      'x-user-role': caller.role,
    };
    if (caller.clientId) headers['x-client-id'] = caller.clientId;
    if (caller.businessId) headers['x-business-id'] = caller.businessId;

    const res = await fetch(
      `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages?page=${page}&limit=${limit}`,
      { headers }
    );
    return (await res.json()) as ApiResponse;
  },

  async sendMessage(
    conversationId: string,
    data: { content: string; senderName?: string; attachments?: any[] },
    caller: { role: string; clientId?: string; businessId?: string }
  ) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-role': caller.role,
    };
    if (caller.clientId) headers['x-client-id'] = caller.clientId;
    if (caller.businessId) headers['x-business-id'] = caller.businessId;

    const res = await fetch(`/api/v1/conversations/${encodeURIComponent(conversationId)}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return (await res.json()) as ApiResponse;
  },

  async markMessagesRead(
    conversationId: string,
    caller: { role: string; clientId?: string; businessId?: string }
  ) {
    const headers: Record<string, string> = {
      'x-user-role': caller.role,
    };
    if (caller.clientId) headers['x-client-id'] = caller.clientId;
    if (caller.businessId) headers['x-business-id'] = caller.businessId;

    const res = await fetch(`/api/v1/conversations/${encodeURIComponent(conversationId)}/read`, {
      method: 'PATCH',
      headers,
    });
    return (await res.json()) as ApiResponse;
  },

  async closeConversation(
    conversationId: string,
    reason?: string,
    caller?: { role: string; clientId?: string; businessId?: string }
  ) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-role': caller?.role || 'CLIENT',
    };
    if (caller?.clientId) headers['x-client-id'] = caller.clientId;
    if (caller?.businessId) headers['x-business-id'] = caller.businessId;

    const res = await fetch(`/api/v1/conversations/${encodeURIComponent(conversationId)}/close`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ reason }),
    });
    return (await res.json()) as ApiResponse;
  },

  async reopenConversation(
    conversationId: string,
    caller?: { role: string; clientId?: string; businessId?: string }
  ) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-role': caller?.role || 'SUPER_ADMIN',
    };
    if (caller?.clientId) headers['x-client-id'] = caller.clientId;
    if (caller?.businessId) headers['x-business-id'] = caller.businessId;

    const res = await fetch(`/api/v1/conversations/${encodeURIComponent(conversationId)}/reopen`, {
      method: 'PATCH',
      headers,
    });
    return (await res.json()) as ApiResponse;
  },

  async getUnreadMessagesCount(caller: { role: string; clientId?: string; businessId?: string }) {
    const headers: Record<string, string> = {
      'x-user-role': caller.role,
    };
    if (caller.clientId) headers['x-client-id'] = caller.clientId;
    if (caller.businessId) headers['x-business-id'] = caller.businessId;

    const res = await fetch('/api/v1/conversations/unread-count', { headers });
    return (await res.json()) as ApiResponse;
  },

  async getAdminConversations(filters?: {
    search?: string;
    status?: string;
    businessId?: string;
    clientId?: string;
  }) {
    const sp = new URLSearchParams();
    if (filters?.search) sp.append('search', filters.search);
    if (filters?.status) sp.append('status', filters.status);
    if (filters?.businessId) sp.append('business_id', filters.businessId);
    if (filters?.clientId) sp.append('client_id', filters.clientId);

    const res = await fetch(`/api/v1/admin/conversations?${sp.toString()}`, {
      headers: {
        'x-user-role': 'SUPER_ADMIN',
      },
    });
    return (await res.json()) as ApiResponse;
  },

  // SPRINT B16 + F16: Paiements, Transactions & Intégration Kkiapay
  async getPaymentProviders() {
    const res = await fetch('/api/v1/payments/providers');
    return (await res.json()) as ApiResponse<Array<{ code: string; name: string }>>;
  },

  async getKkiapayConfig() {
    const res = await fetch('/api/v1/payments/kkiapay/config');
    return (await res.json()) as { success: boolean; publicKey: string; sandbox: boolean; theme?: string };
  },

  async initiatePayment(
    data: {
      bookingId: string;
      provider: string;
      paymentType?: string;
      clientName?: string;
      clientPhone?: string;
      clientEmail?: string;
      notes?: string;
      idempotencyKey?: string;
    },
    caller?: { role: string; userId?: string; clientPhone?: string }
  ) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-role': caller?.role || 'CLIENT',
    };
    if (caller?.userId) headers['x-user-id'] = caller.userId;
    if (caller?.clientPhone) headers['x-client-phone'] = caller.clientPhone;
    if (data.idempotencyKey) headers['idempotency-key'] = data.idempotencyKey;

    const res = await fetch('/api/v1/payments', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return (await res.json()) as ApiResponse;
  },

  async verifyKkiapayPayment(
    data: { paymentId: string; transactionId: string },
    caller?: { role: string; userId?: string; clientPhone?: string }
  ) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-role': caller?.role || 'CLIENT',
    };
    if (caller?.userId) headers['x-user-id'] = caller.userId;
    if (caller?.clientPhone) headers['x-client-phone'] = caller.clientPhone;

    const res = await fetch('/api/v1/payments/kkiapay/verify', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return (await res.json()) as ApiResponse;
  },

  async cancelPayment(
    paymentId: string,
    data?: { reason?: string },
    caller?: { role: string; userId?: string; businessId?: string; clientPhone?: string }
  ) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-role': caller?.role || 'CLIENT',
    };
    if (caller?.userId) headers['x-user-id'] = caller.userId;
    if (caller?.businessId) headers['x-business-id'] = caller.businessId;
    if (caller?.clientPhone) headers['x-client-phone'] = caller.clientPhone;

    const res = await fetch(`/api/v1/payments/${encodeURIComponent(paymentId)}/cancel`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data || {}),
    });
    return (await res.json()) as ApiResponse;
  },

  async refundPayment(
    paymentId: string,
    data: { amount?: number; reason: string },
    caller?: { role: string; userId?: string; businessId?: string }
  ) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-role': caller?.role || 'SUPER_ADMIN',
    };
    if (caller?.userId) headers['x-user-id'] = caller.userId;
    if (caller?.businessId) headers['x-business-id'] = caller.businessId;

    const res = await fetch(`/api/v1/payments/${encodeURIComponent(paymentId)}/refund`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return (await res.json()) as ApiResponse;
  },

  async getRequestPayments(requestId: string, caller?: { role: string; userId?: string; businessId?: string }) {
    const headers: Record<string, string> = {
      'x-user-role': caller?.role || 'CLIENT',
    };
    if (caller?.userId) headers['x-user-id'] = caller.userId;
    if (caller?.businessId) headers['x-business-id'] = caller.businessId;

    const res = await fetch(`/api/v1/requests/${encodeURIComponent(requestId)}/payments`, { headers });
    return (await res.json()) as ApiResponse;
  },

  async getPayments(
    filters?: { status?: string; booking_id?: string },
    caller?: { role: string; userId?: string; businessId?: string }
  ) {
    const headers: Record<string, string> = {
      'x-user-role': caller?.role || 'CLIENT',
    };
    if (caller?.userId) headers['x-user-id'] = caller.userId;
    if (caller?.businessId) headers['x-business-id'] = caller.businessId;

    const sp = new URLSearchParams();
    if (filters?.status) sp.append('status', filters.status);
    if (filters?.booking_id) sp.append('booking_id', filters.booking_id);

    const res = await fetch(`/api/v1/payments?${sp.toString()}`, { headers });
    return (await res.json()) as ApiResponse;
  },

  async getTransactions(
    filters?: { payment_id?: string; booking_id?: string },
    caller?: { role: string; userId?: string; businessId?: string }
  ) {
    const headers: Record<string, string> = {
      'x-user-role': caller?.role || 'CLIENT',
    };
    if (caller?.userId) headers['x-user-id'] = caller.userId;
    if (caller?.businessId) headers['x-business-id'] = caller.businessId;

    const sp = new URLSearchParams();
    if (filters?.payment_id) sp.append('payment_id', filters.payment_id);
    if (filters?.booking_id) sp.append('booking_id', filters.booking_id);

    const res = await fetch(`/api/v1/transactions?${sp.toString()}`, { headers });
    return (await res.json()) as ApiResponse;
  },

  async getAdminPayments(filters?: { status?: string; provider?: string; payment_type?: string }) {
    const sp = new URLSearchParams();
    if (filters?.status) sp.append('status', filters.status);
    if (filters?.provider) sp.append('provider', filters.provider);
    if (filters?.payment_type) sp.append('payment_type', filters.payment_type);

    const res = await fetch(`/api/v1/admin/payments?${sp.toString()}`, {
      headers: {
        'x-user-role': 'SUPER_ADMIN',
      },
    });
    return (await res.json()) as ApiResponse;
  },

  async getAdminTransactions() {
    const res = await fetch('/api/v1/admin/transactions', {
      headers: {
        'x-user-role': 'SUPER_ADMIN',
      },
    });
    return (await res.json()) as ApiResponse;
  },

  // SPRINT B18 + F18: Business Intelligence & Analytics
  async getBusinessAnalytics(
    businessId: string,
    period: string = '30D',
    caller?: { role?: string; businessId?: string }
  ) {
    const headers: Record<string, string> = {
      'x-user-role': caller?.role || 'BUSINESS_OWNER',
      'x-business-id': businessId,
    };
    const res = await fetch(
      `/api/v1/businesses/${encodeURIComponent(businessId)}/analytics?period=${encodeURIComponent(period)}`,
      { headers }
    );
    return (await res.json()) as ApiResponse;
  },

  async getBusinessAnalyticsReport(
    businessId: string,
    period: string = '30D',
    caller?: { role?: string; businessId?: string }
  ) {
    const headers: Record<string, string> = {
      'x-user-role': caller?.role || 'BUSINESS_OWNER',
      'x-business-id': businessId,
    };
    const res = await fetch(
      `/api/v1/businesses/${encodeURIComponent(businessId)}/analytics/report?period=${encodeURIComponent(period)}`,
      { headers }
    );
    return (await res.json()) as ApiResponse;
  },

  async explainAnalyticsWithAI(
    businessId: string,
    params?: { period?: string; question?: string },
    caller?: { role?: string; businessId?: string }
  ) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-role': caller?.role || 'BUSINESS_OWNER',
      'x-business-id': businessId,
    };
    const res = await fetch(
      `/api/v1/businesses/${encodeURIComponent(businessId)}/analytics/ai-explain`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(params || {}),
      }
    );
    return (await res.json()) as ApiResponse;
  },

  async getAdminAnalytics(filters?: { period?: string; module_code?: string; city?: string }) {
    const sp = new URLSearchParams();
    if (filters?.period) sp.append('period', filters.period);
    if (filters?.module_code) sp.append('module_code', filters.module_code);
    if (filters?.city) sp.append('city', filters.city);

    const res = await fetch(`/api/v1/admin/analytics?${sp.toString()}`, {
      headers: {
        'x-user-role': 'SUPER_ADMIN',
      },
    });
    return (await res.json()) as ApiResponse;
  },

  // SPRINT B20 + F20: IA FLOWEXA - RECOMMANDATIONS, PRÉDICTIONS & ASSISTANTS
  async searchAI(params: {
    query: string;
    lat?: number;
    lng?: number;
    radius?: number;
    clientId?: string;
    limit?: number;
  }) {
    const res = await fetch('/api/v1/ai/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: params.query,
        lat: params.lat,
        lng: params.lng,
        radius: params.radius,
        clientId: params.clientId,
        limit: params.limit,
      }),
    });
    return (await res.json()) as ApiResponse;
  },

  async askClientAssistant(params: {
    message: string;
    clientId?: string;
    lat?: number;
    lng?: number;
  }) {
    const res = await fetch('/api/v1/ai/client-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return (await res.json()) as ApiResponse;
  },

  async askBusinessAssistant(params: {
    businessId: string;
    message: string;
    role?: string;
  }) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-role': params.role || 'BUSINESS_OWNER',
      'x-business-id': params.businessId,
    };
    const res = await fetch('/api/v1/ai/business-assistant', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        businessId: params.businessId,
        message: params.message,
      }),
    });
    return (await res.json()) as ApiResponse;
  },

  async askAdminAssistant(message: string) {
    const res = await fetch('/api/v1/ai/admin-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'SUPER_ADMIN',
      },
      body: JSON.stringify({ message }),
    });
    return (await res.json()) as ApiResponse;
  },

  async getClientRecommendations(params?: {
    clientId?: string;
    moduleCode?: string;
    limit?: number;
  }) {
    const sp = new URLSearchParams();
    if (params?.clientId) sp.append('client_id', params.clientId);
    if (params?.moduleCode) sp.append('module_code', params.moduleCode);
    if (params?.limit) sp.append('limit', String(params.limit));

    const res = await fetch(`/api/v1/ai/recommendations?${sp.toString()}`);
    return (await res.json()) as ApiResponse;
  },

  async getBusinessOpportunities(businessId: string, role: string = 'BUSINESS_OWNER') {
    const res = await fetch(`/api/v1/businesses/${encodeURIComponent(businessId)}/ai/opportunities`, {
      headers: {
        'x-user-role': role,
        'x-business-id': businessId,
      },
    });
    return (await res.json()) as ApiResponse;
  },

  async getBusinessAlerts(businessId: string, role: string = 'BUSINESS_OWNER') {
    const res = await fetch(`/api/v1/businesses/${encodeURIComponent(businessId)}/ai/alerts`, {
      headers: {
        'x-user-role': role,
        'x-business-id': businessId,
      },
    });
    return (await res.json()) as ApiResponse;
  },

  async getBusinessPredictions(businessId: string, role: string = 'BUSINESS_OWNER') {
    const res = await fetch(`/api/v1/businesses/${encodeURIComponent(businessId)}/ai/predictions`, {
      headers: {
        'x-user-role': role,
        'x-business-id': businessId,
      },
    });
    return (await res.json()) as ApiResponse;
  },

  async getBusinessInsights(businessId: string, role: string = 'BUSINESS_OWNER') {
    const res = await fetch(`/api/v1/businesses/${encodeURIComponent(businessId)}/ai/insights`, {
      headers: {
        'x-user-role': role,
        'x-business-id': businessId,
      },
    });
    return (await res.json()) as ApiResponse;
  },

  // MARKETPLACE FLOWEXA (B21)
  async getMarketplaceRequests(params?: {
    role?: string;
    clientId?: string;
    businessId?: string;
    status?: string;
  }) {
    const sp = new URLSearchParams();
    if (params?.status) sp.append('status', params.status);
    if (params?.clientId) sp.append('client_id', params.clientId);
    if (params?.businessId) sp.append('business_id', params.businessId);

    const headers: Record<string, string> = {};
    if (params?.role) headers['x-user-role'] = params.role;
    if (params?.clientId) headers['x-client-id'] = params.clientId;
    if (params?.businessId) headers['x-business-id'] = params.businessId;

    const res = await fetch(`/api/v1/marketplace/requests?${sp.toString()}`, { headers });
    return (await res.json()) as ApiResponse<MarketplaceRequestEntity[]>;
  },

  async getMarketplaceRequestById(id: string, headersData?: { role?: string; clientId?: string; businessId?: string }) {
    const headers: Record<string, string> = {};
    if (headersData?.role) headers['x-user-role'] = headersData.role;
    if (headersData?.clientId) headers['x-client-id'] = headersData.clientId;
    if (headersData?.businessId) headers['x-business-id'] = headersData.businessId;

    const res = await fetch(`/api/v1/marketplace/requests/${encodeURIComponent(id)}`, { headers });
    return (await res.json()) as ApiResponse<MarketplaceRequestEntity & { responses: MarketplaceResponseEntity[] }>;
  },

  async createMarketplaceRequest(data: any, headersData?: { clientId?: string; clientName?: string; clientPhone?: string }) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-role': 'CLIENT',
    };
    if (headersData?.clientId) headers['x-client-id'] = headersData.clientId;
    if (headersData?.clientName) headers['x-client-name'] = headersData.clientName;
    if (headersData?.clientPhone) headers['x-client-phone'] = headersData.clientPhone;

    const res = await fetch('/api/v1/marketplace/requests', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return (await res.json()) as ApiResponse<MarketplaceRequestEntity>;
  },

  async publishMarketplaceRequest(id: string, clientId: string = 'client-test-1') {
    const res = await fetch(`/api/v1/marketplace/requests/${encodeURIComponent(id)}/publish`, {
      method: 'POST',
      headers: {
        'x-client-id': clientId,
        'x-user-role': 'CLIENT',
      },
    });
    return (await res.json()) as ApiResponse<MarketplaceRequestEntity>;
  },

  async cancelMarketplaceRequest(id: string, reason?: string, clientId: string = 'client-test-1') {
    const res = await fetch(`/api/v1/marketplace/requests/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': clientId,
        'x-user-role': 'CLIENT',
      },
      body: JSON.stringify({ reason }),
    });
    return (await res.json()) as ApiResponse;
  },

  async getMarketplaceMatches(id: string) {
    const res = await fetch(`/api/v1/marketplace/requests/${encodeURIComponent(id)}/matches`);
    return (await res.json()) as ApiResponse<MarketplaceMatchResult[]>;
  },

  async parseMarketplacePrompt(prompt: string) {
    const res = await fetch('/api/v1/marketplace/parse-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    return (await res.json()) as ApiResponse<any>;
  },

  async submitMarketplaceResponse(data: any, headersData?: { businessId?: string; role?: string }) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-role': headersData?.role || 'BUSINESS_OWNER',
    };
    if (headersData?.businessId) headers['x-business-id'] = headersData.businessId;

    const res = await fetch('/api/v1/marketplace/responses', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return (await res.json()) as ApiResponse<MarketplaceResponseEntity>;
  },

  async getMarketplaceResponses(params?: {
    requestId?: string;
    businessId?: string;
    role?: string;
    clientId?: string;
  }) {
    const sp = new URLSearchParams();
    if (params?.requestId) sp.append('request_id', params.requestId);
    if (params?.businessId) sp.append('business_id', params.businessId);

    const headers: Record<string, string> = {};
    if (params?.role) headers['x-user-role'] = params.role;
    if (params?.clientId) headers['x-client-id'] = params.clientId;
    if (params?.businessId) headers['x-business-id'] = params.businessId;

    const res = await fetch(`/api/v1/marketplace/responses?${sp.toString()}`, { headers });
    return (await res.json()) as ApiResponse<MarketplaceResponseEntity[]>;
  },

  async acceptMarketplaceResponse(params: {
    requestId: string;
    responseId: string;
    clientId?: string;
  }) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-role': 'CLIENT',
    };
    if (params.clientId) headers['x-client-id'] = params.clientId;

    const res = await fetch('/api/v1/marketplace/accept', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    return (await res.json()) as ApiResponse<{
      request: MarketplaceRequestEntity;
      response: MarketplaceResponseEntity;
      convertedBooking: any;
      conversationId?: string;
    }>;
  },

  async getMarketplaceStats() {
    const res = await fetch('/api/v1/marketplace/stats');
    return (await res.json()) as ApiResponse<MarketplaceStats>;
  },

  // ==========================================
  // SPRINT B22 + F22: COCKPIT ENTREPRISE PRO
  // ==========================================

  async getCockpitSummary(businessId: string) {
    const res = await fetch(`/api/v1/businesses/${businessId}/cockpit-summary`, {
      headers: { 'x-business-id': businessId },
    });
    return (await res.json()) as ApiResponse<any>;
  },

  async getBusinessClients(businessId: string) {
    const res = await fetch(`/api/v1/businesses/${businessId}/clients`, {
      headers: { 'x-business-id': businessId },
    });
    return (await res.json()) as ApiResponse<any[]>;
  },

  async getBusinessClientDetail(businessId: string, clientId: string) {
    const res = await fetch(`/api/v1/businesses/${businessId}/clients/${clientId}`, {
      headers: { 'x-business-id': businessId },
    });
    return (await res.json()) as ApiResponse<any>;
  },

  async getBusinessCalendar(businessId: string) {
    const res = await fetch(`/api/v1/businesses/${businessId}/calendar`, {
      headers: { 'x-business-id': businessId },
    });
    return (await res.json()) as ApiResponse<any[]>;
  },

  async getBusinessActivityLog(businessId: string) {
    const res = await fetch(`/api/v1/businesses/${businessId}/activity-log`, {
      headers: { 'x-business-id': businessId },
    });
    return (await res.json()) as ApiResponse<any[]>;
  },

  async getTeamMembers(businessId: string) {
    const res = await fetch(`/api/v1/businesses/${businessId}/team`, {
      headers: { 'x-business-id': businessId },
    });
    return (await res.json()) as ApiResponse<any[]>;
  },

  async addTeamMember(businessId: string, data: any) {
    const res = await fetch(`/api/v1/businesses/${businessId}/team`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessId,
      },
      body: JSON.stringify(data),
    });
    return (await res.json()) as ApiResponse<any>;
  },

  async updateTeamMember(businessId: string, employeeId: string, updates: any) {
    const res = await fetch(`/api/v1/businesses/${businessId}/team/${employeeId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessId,
      },
      body: JSON.stringify(updates),
    });
    return (await res.json()) as ApiResponse<any>;
  },

  async deleteTeamMember(businessId: string, employeeId: string) {
    const res = await fetch(`/api/v1/businesses/${businessId}/team/${employeeId}`, {
      method: 'DELETE',
      headers: { 'x-business-id': businessId },
    });
    return (await res.json()) as ApiResponse<any>;
  },

  async getBusinessTasks(businessId: string) {
    const res = await fetch(`/api/v1/businesses/${businessId}/tasks`, {
      headers: { 'x-business-id': businessId },
    });
    return (await res.json()) as ApiResponse<any[]>;
  },

  async addBusinessTask(businessId: string, data: any) {
    const res = await fetch(`/api/v1/businesses/${businessId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessId,
      },
      body: JSON.stringify(data),
    });
    return (await res.json()) as ApiResponse<any>;
  },

  async updateBusinessTask(businessId: string, taskId: string, updates: any) {
    const res = await fetch(`/api/v1/businesses/${businessId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessId,
      },
      body: JSON.stringify(updates),
    });
    return (await res.json()) as ApiResponse<any>;
  },

  async deleteBusinessTask(businessId: string, taskId: string) {
    const res = await fetch(`/api/v1/businesses/${businessId}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { 'x-business-id': businessId },
    });
    return (await res.json()) as ApiResponse<any>;
  },

  // =============================================================
  // SPRINT B25 + F25: Facturation Entreprise, Abonnements & Plans
  // =============================================================
  async getBusinessSubscription(businessId: string) {
    const res = await fetch(`/api/v1/billing/subscription?businessId=${encodeURIComponent(businessId)}`, {
      headers: {
        'x-business-id': businessId,
      },
    });
    return (await res.json()) as ApiResponse<any>;
  },

  async getBusinessUsage(businessId: string) {
    const res = await fetch(`/api/v1/billing/usage?businessId=${encodeURIComponent(businessId)}`, {
      headers: {
        'x-business-id': businessId,
      },
    });
    return (await res.json()) as ApiResponse<any>;
  },

  async getBillingPlans() {
    const res = await fetch('/api/v1/billing/plans');
    return (await res.json()) as ApiResponse<any[]>;
  },

  async subscribeToPlan(payload: {
    businessId: string;
    planId: string;
    period?: 'MONTHLY' | 'YEARLY';
    provider?: string;
    autoRenew?: boolean;
    clientPhone?: string;
    idempotencyKey?: string;
  }) {
    const res = await fetch('/api/v1/billing/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': payload.businessId,
      },
      body: JSON.stringify(payload),
    });
    return (await res.json()) as ApiResponse<{
      subscription: any;
      payment: any;
      transaction: any;
    }>;
  },

  async toggleSubscriptionAutoRenew(businessId: string, autoRenew: boolean) {
    const res = await fetch('/api/v1/billing/autorenew', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessId,
      },
      body: JSON.stringify({ businessId, autoRenew }),
    });
    return (await res.json()) as ApiResponse<any>;
  },

  async cancelSubscription(businessId: string, reason?: string) {
    const res = await fetch('/api/v1/billing/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessId,
      },
      body: JSON.stringify({ businessId, reason }),
    });
    return (await res.json()) as ApiResponse<any>;
  },

  async getBusinessInvoices(businessId: string) {
    const res = await fetch(`/api/v1/billing/invoices?businessId=${encodeURIComponent(businessId)}`, {
      headers: {
        'x-business-id': businessId,
      },
    });
    return (await res.json()) as ApiResponse<any[]>;
  },

  async getInvoiceDetails(invoiceId: string, businessId?: string) {
    const res = await fetch(`/api/v1/billing/invoices/${encodeURIComponent(invoiceId)}`, {
      headers: {
        ...(businessId ? { 'x-business-id': businessId } : {}),
      },
    });
    return (await res.json()) as ApiResponse<any>;
  },

  // Admin Monetization
  async getAdminPlans() {
    const res = await fetch('/api/v1/admin/plans', {
      headers: { 'x-user-role': 'SUPER_ADMIN' },
    });
    return (await res.json()) as ApiResponse<any[]>;
  },

  async createAdminPlan(planData: any) {
    const res = await fetch('/api/v1/admin/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'SUPER_ADMIN',
      },
      body: JSON.stringify(planData),
    });
    return (await res.json()) as ApiResponse<any>;
  },

  async updateAdminPlan(planId: string, updates: any) {
    const res = await fetch(`/api/v1/admin/plans/${encodeURIComponent(planId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'SUPER_ADMIN',
      },
      body: JSON.stringify(updates),
    });
    return (await res.json()) as ApiResponse<any>;
  },

  async toggleAdminPlanStatus(planId: string) {
    const res = await fetch(`/api/v1/admin/plans/${encodeURIComponent(planId)}/toggle`, {
      method: 'PATCH',
      headers: { 'x-user-role': 'SUPER_ADMIN' },
    });
    return (await res.json()) as ApiResponse<any>;
  },

  async getAdminSubscriptions() {
    const res = await fetch('/api/v1/admin/subscriptions', {
      headers: { 'x-user-role': 'SUPER_ADMIN' },
    });
    return (await res.json()) as ApiResponse<any[]>;
  },

  async getAdminInvoices() {
    const res = await fetch('/api/v1/admin/invoices', {
      headers: { 'x-user-role': 'SUPER_ADMIN' },
    });
    return (await res.json()) as ApiResponse<any[]>;
  },

  // --- SPRINT B27 + F27: CRM, SEGMENTS, RELANCES, CAMPAGNES & CROISSANCE ---

  async getCRMSegments(businessId: string, inactiveThresholdDays = 45) {
    const res = await fetch(`/api/v1/businesses/${businessId}/crm/segments?inactiveThresholdDays=${inactiveThresholdDays}`, {
      headers: { 'x-business-id': businessId },
    });
    return (await res.json()) as ApiResponse<any[]>;
  },

  async getCRMClients(businessId: string, params?: { segment?: string; search?: string; limit?: number; offset?: number; inactiveThresholdDays?: number }) {
    const query = new URLSearchParams();
    if (params?.segment && params.segment !== 'ALL') query.set('segment', params.segment);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    if (params?.inactiveThresholdDays) query.set('inactiveThresholdDays', String(params.inactiveThresholdDays));

    const res = await fetch(`/api/v1/businesses/${businessId}/crm/clients?${query.toString()}`, {
      headers: { 'x-business-id': businessId },
    });
    return (await res.json()) as ApiResponse<any[]> & { total?: number; segments?: any[] };
  },

  async getCRMClientDetail(businessId: string, clientId: string, inactiveThresholdDays = 45) {
    const res = await fetch(`/api/v1/businesses/${businessId}/crm/clients/${clientId}?inactiveThresholdDays=${inactiveThresholdDays}`, {
      headers: { 'x-business-id': businessId },
    });
    return (await res.json()) as ApiResponse<any>;
  },

  async addCRMClientNote(businessId: string, clientId: string, note: string) {
    const res = await fetch(`/api/v1/businesses/${businessId}/crm/clients/${clientId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessId,
      },
      body: JSON.stringify({ note }),
    });
    return (await res.json()) as ApiResponse<any>;
  },

  async getCRMReminders(businessId: string) {
    const res = await fetch(`/api/v1/businesses/${businessId}/crm/reminders`, {
      headers: { 'x-business-id': businessId },
    });
    return (await res.json()) as ApiResponse<any[]>;
  },

  async sendCRMReminder(businessId: string, reminderId: string, customMessage?: string) {
    const res = await fetch(`/api/v1/businesses/${businessId}/crm/reminders/${reminderId}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessId,
      },
      body: JSON.stringify({ customMessage }),
    });
    return (await res.json()) as ApiResponse<any>;
  },

  async getCampaigns(businessId: string) {
    const res = await fetch(`/api/v1/businesses/${businessId}/campaigns`, {
      headers: { 'x-business-id': businessId },
    });
    return (await res.json()) as ApiResponse<any[]>;
  },

  async getCampaignById(businessId: string, campaignId: string) {
    const res = await fetch(`/api/v1/businesses/${businessId}/campaigns/${campaignId}`, {
      headers: { 'x-business-id': businessId },
    });
    return (await res.json()) as ApiResponse<any>;
  },

  async createCampaign(businessId: string, data: any) {
    const res = await fetch(`/api/v1/businesses/${businessId}/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessId,
      },
      body: JSON.stringify(data),
    });
    return (await res.json()) as ApiResponse<any>;
  },

  async updateCampaign(businessId: string, campaignId: string, data: any) {
    const res = await fetch(`/api/v1/businesses/${businessId}/campaigns/${campaignId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessId,
      },
      body: JSON.stringify(data),
    });
    return (await res.json()) as ApiResponse<any>;
  },

  async deleteCampaign(businessId: string, campaignId: string) {
    const res = await fetch(`/api/v1/businesses/${businessId}/campaigns/${campaignId}`, {
      method: 'DELETE',
      headers: { 'x-business-id': businessId },
    });
    return (await res.json()) as ApiResponse<any>;
  },

  async sendCampaign(businessId: string, campaignId: string) {
    const res = await fetch(`/api/v1/businesses/${businessId}/campaigns/${campaignId}/send`, {
      method: 'POST',
      headers: { 'x-business-id': businessId },
    });
    return (await res.json()) as ApiResponse<any>;
  },

  async cancelCampaign(businessId: string, campaignId: string) {
    const res = await fetch(`/api/v1/businesses/${businessId}/campaigns/${campaignId}/cancel`, {
      method: 'POST',
      headers: { 'x-business-id': businessId },
    });
    return (await res.json()) as ApiResponse<any>;
  },

  async generateCampaignAIDraft(businessId: string, params: { objective: string; segment: string; serviceName?: string }) {
    const res = await fetch(`/api/v1/businesses/${businessId}/campaigns/ai-draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessId,
      },
      body: JSON.stringify(params),
    });
    return (await res.json()) as ApiResponse<any>;
  },

  async getGrowthDashboard(businessId: string) {
    const res = await fetch(`/api/v1/businesses/${businessId}/growth`, {
      headers: { 'x-business-id': businessId },
    });
    return (await res.json()) as ApiResponse<any>;
  },
};

export const api = flowexaApi;

