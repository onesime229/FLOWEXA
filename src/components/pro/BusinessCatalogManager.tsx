import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Image as ImageIcon,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Camera,
  Star,
  Check,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Upload,
  Layers,
  DollarSign,
  Phone,
  Compass,
  PhoneCall,
  MessageCircle,
  Building2,
  Bed,
  Scissors,
  Wrench,
  ShoppingBag,
} from 'lucide-react';
import {
  CatalogItem,
  CatalogCategory,
  CatalogOfferType,
  CatalogPriceType,
  PublicationStatus,
  AvailabilityStatus,
  BusinessModuleCode,
  CatalogItemImage,
} from '../../types';
import { flowexaApi } from '../../services/api';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { Modal } from '../design-system/Modal';
import { Input, Select } from '../design-system/Input';

export interface BusinessCatalogManagerProps {
  businessId?: string;
  moduleCode?: BusinessModuleCode;
  defaultOfferType?: CatalogOfferType;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

const PRICE_TYPE_LABELS: Record<CatalogPriceType, string> = {
  FIXED: 'Prix fixe',
  PER_DAY: '/ jour',
  PER_NIGHT: '/ nuit',
  PER_HOUR: '/ heure',
  FROM: 'À partir de',
  CONTACT: 'Sur devis',
};

// Module specific presets
const MODULE_CONFIG: Record<
  string,
  {
    singularName: string;
    addLabel: string;
    types: string[];
    defaultPriceType: CatalogPriceType;
    defaultPrice: string;
    defaultOfferType: CatalogOfferType;
    icon: React.ReactNode;
  }
> = {
  IMMOBILIER: {
    singularName: 'bien',
    addLabel: 'Ajouter un bien',
    types: ['Appartement', 'Maison', 'Studio', 'Villa', 'Terrain', 'Bureau'],
    defaultPriceType: 'FIXED',
    defaultPrice: '150000',
    defaultOfferType: 'BIEN',
    icon: <Building2 className="w-5 h-5 text-[#0BE9EF]" />,
  },
  GUEST_HOUSE: {
    singularName: 'chambre',
    addLabel: 'Ajouter une chambre',
    types: ['Chambre standard', 'Chambre climatisée', 'Suite Deluxe', 'Suite VIP', 'Studio meublé'],
    defaultPriceType: 'PER_NIGHT',
    defaultPrice: '35000',
    defaultOfferType: 'CHAMBRE',
    icon: <Bed className="w-5 h-5 text-[#FB8205]" />,
  },
  COIFFURE: {
    singularName: 'prestation',
    addLabel: 'Ajouter une prestation',
    types: ['Coupe & Coiffage', 'Tresses & Nattes', 'Coloration & Mèches', 'Soin Capillaire', 'Lissage & Défrisage'],
    defaultPriceType: 'FIXED',
    defaultPrice: '15000',
    defaultOfferType: 'PRESTATION',
    icon: <Scissors className="w-5 h-5 text-[#8B5CF6]" />,
  },
  BARBIER: {
    singularName: 'prestation',
    addLabel: 'Ajouter une prestation',
    types: ['Coupe Homme', 'Taille de barbe', 'Soin du visage', 'Pack Complet'],
    defaultPriceType: 'FIXED',
    defaultPrice: '8000',
    defaultOfferType: 'PRESTATION',
    icon: <Scissors className="w-5 h-5 text-[#8B5CF6]" />,
  },
  GARAGE: {
    singularName: 'intervention',
    addLabel: 'Ajouter une intervention',
    types: ['Vidange & Révision', 'Freinage & Sécurité', 'Diagnostic Électronique', 'Climatisation Auto', 'Pneumatiques'],
    defaultPriceType: 'FIXED',
    defaultPrice: '25000',
    defaultOfferType: 'VEHICULE_INTERVENTION',
    icon: <Wrench className="w-5 h-5 text-[#FB8205]" />,
  },
  DEFAULT: {
    singularName: 'offre',
    addLabel: 'Ajouter une offre',
    types: ['Offre Standard', 'Formule Complète', 'Option Spéciale'],
    defaultPriceType: 'FIXED',
    defaultPrice: '15000',
    defaultOfferType: 'SERVICE',
    icon: <Package className="w-5 h-5 text-[#FB8205]" />,
  },
};

const GUEST_HOUSE_AMENITIES = [
  'Wifi gratuit',
  'Climatisation',
  'Vue mer',
  'Petit-déjeuner inclus',
  'Balcon privé',
  'TV écran plat',
  'Salle de bain privée',
  'Mini-bar',
  'Eau chaude',
  'Service de ménage quotidien',
];

export const BusinessCatalogManager: React.FC<BusinessCatalogManagerProps> = ({
  businessId = 'biz-immo-1',
  moduleCode = 'IMMOBILIER',
  defaultOfferType,
  onShowToast,
}) => {
  const currentConfig = MODULE_CONFIG[moduleCode] || MODULE_CONFIG.DEFAULT;

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('ALL');

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Preview Modal
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewItem, setPreviewItem] = useState<CatalogItem | null>(null);

  // Form Fields
  const [formSubtype, setFormSubtype] = useState<string>(currentConfig.types[0]);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('150000');
  const [formPriceType, setFormPriceType] = useState<CatalogPriceType>(currentConfig.defaultPriceType);
  const [formOfferType, setFormOfferType] = useState<CatalogOfferType>(
    defaultOfferType || currentConfig.defaultOfferType
  );
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formStatus, setFormStatus] = useState<PublicationStatus>('PUBLISHED');
  const [formAvailability, setFormAvailability] = useState<AvailabilityStatus>('AVAILABLE');

  // Geolocation
  const [formHasOwnLocation, setFormHasOwnLocation] = useState(moduleCode === 'IMMOBILIER');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('Cotonou');
  const [formDistrict, setFormDistrict] = useState(moduleCode === 'IMMOBILIER' ? 'Akpakpa' : 'Haie Vive');
  const [formLat, setFormLat] = useState('6.3750');
  const [formLng, setFormLng] = useState('2.4500');

  // Specs
  const [specSurface, setSpecSurface] = useState('110');
  const [specRooms, setSpecRooms] = useState('3');
  const [specCapacity, setSpecCapacity] = useState('2');
  const [specDuration, setSpecDuration] = useState('45');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Wifi gratuit',
    'Climatisation',
    'TV écran plat',
  ]);

  // Photo Management in Form
  const [formImages, setFormImages] = useState<CatalogItemImage[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Items
  const loadItems = async () => {
    setIsLoading(true);
    try {
      const res = await flowexaApi.getCatalogItems({ business_id: businessId });
      if (res.success && Array.isArray(res.data)) {
        setItems(res.data);
      }
    } catch (err) {
      console.error('Erreur chargement catalogue:', err);
      onShowToast('Erreur', 'Impossible de charger les éléments du catalogue.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await flowexaApi.getCatalogCategories(businessId);
      if (res.success && Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Erreur chargement catégories:', err);
    }
  };

  useEffect(() => {
    loadItems();
    loadCategories();
  }, [businessId, moduleCode]);

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormSubtype(currentConfig.types[0] || 'Standard');
    setFormTitle('');
    setFormDescription('');
    setFormPrice(currentConfig.defaultPrice);
    setFormPriceType(currentConfig.defaultPriceType);
    setFormOfferType(defaultOfferType || currentConfig.defaultOfferType);
    setFormCategoryId(categories[0]?.id || '');
    setFormStatus('PUBLISHED');
    setFormAvailability('AVAILABLE');
    setFormHasOwnLocation(moduleCode === 'IMMOBILIER');
    setFormAddress(moduleCode === 'IMMOBILIER' ? 'Rue 124, Face Église' : '');
    setFormCity('Cotonou');
    setFormDistrict(moduleCode === 'IMMOBILIER' ? 'Akpakpa' : 'Haie Vive');
    setFormLat('6.3750');
    setFormLng('2.4500');
    setSpecSurface('110');
    setSpecRooms('3');
    setSpecCapacity('2');
    setSpecDuration('45');
    setSelectedAmenities(['Wifi gratuit', 'Climatisation', 'TV écran plat']);

    // Default sample image if available
    const defaultSampleUrl =
      moduleCode === 'IMMOBILIER'
        ? 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80'
        : moduleCode === 'GUEST_HOUSE'
        ? 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80';

    setFormImages([
      {
        id: `img-${Date.now()}-1`,
        url: defaultSampleUrl,
        title: 'Vue principale',
        isCover: true,
        order: 1,
      },
    ]);

    setIsEditModalOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (item: CatalogItem) => {
    setEditingItem(item);
    setFormSubtype(item.specs?.subtype || currentConfig.types[0] || 'Standard');
    setFormTitle(item.title);
    setFormDescription(item.description || '');
    setFormPrice(String(item.price));
    setFormPriceType(item.priceType);
    setFormOfferType(item.offerType);
    setFormCategoryId(item.categoryId || '');
    setFormStatus(item.status);
    setFormAvailability(item.availability);
    setFormHasOwnLocation(Boolean(item.hasOwnLocation));
    setFormAddress(item.address || '');
    setFormCity(item.city || 'Cotonou');
    setFormDistrict(item.district || '');
    setFormLat(item.latitude ? String(item.latitude) : '6.3750');
    setFormLng(item.longitude ? String(item.longitude) : '2.4500');

    setSpecSurface(item.specs?.surfaceM2 ? String(item.specs.surfaceM2) : '');
    setSpecRooms(item.specs?.roomsCount ? String(item.specs.roomsCount) : '');
    setSpecCapacity(item.specs?.capacityPersons ? String(item.specs.capacityPersons) : '');
    setSpecDuration(item.specs?.durationMinutes ? String(item.specs.durationMinutes) : '');
    setSelectedAmenities(Array.isArray(item.specs?.amenities) ? item.specs.amenities : ['Wifi gratuit', 'Climatisation']);

    setFormImages(item.images && item.images.length > 0 ? [...item.images] : []);
    setIsEditModalOpen(true);
  };

  // Geolocation detection helper
  const handleDetectCoordinates = () => {
    if (!navigator.geolocation) {
      onShowToast('GPS non supporté', 'Votre navigateur ne supporte pas la géolocalisation.', 'warning');
      return;
    }
    onShowToast('Recherche GPS...', 'Acquisition de vos coordonnées satellites...', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormLat(pos.coords.latitude.toFixed(5));
        setFormLng(pos.coords.longitude.toFixed(5));
        onShowToast(
          'Coordonnées détectées',
          `Latitude: ${pos.coords.latitude.toFixed(4)}, Longitude: ${pos.coords.longitude.toFixed(4)}`,
          'success'
        );
      },
      (err) => {
        onShowToast('Erreur GPS', err.message, 'error');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Drag & Drop Photo Handlers
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Format validation
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        onShowToast('Format invalide', `"${file.name}" n'est pas un fichier JPG, PNG ou WEBP.`, 'warning');
        continue;
      }
      // Size validation (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        onShowToast('Fichier trop volumineux', `"${file.name}" dépasse la limite autorisée de 5 Mo.`, 'warning');
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newImg: CatalogItemImage = {
            id: `img-local-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            url: event.target.result as string,
            title: file.name.replace(/\.[^/.]+$/, ''),
            isCover: formImages.length === 0, // First image is cover by default
            order: formImages.length + 1,
          };
          setFormImages((prev) => {
            const hasCover = prev.some((img) => img.isCover);
            if (!hasCover && prev.length === 0) newImg.isCover = true;
            return [...prev, newImg];
          });
          onShowToast('Photo ajoutée', `"${file.name}" a été ajoutée à l'offre.`, 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSetCoverPhoto = (photoId: string) => {
    setFormImages((prev) =>
      prev.map((img) => ({
        ...img,
        isCover: img.id === photoId,
      }))
    );
    onShowToast('Photo principale', 'Image définie comme couverture de l’offre.', 'info');
  };

  const handleDeletePhoto = (photoId: string) => {
    setFormImages((prev) => {
      const remaining = prev.filter((img) => img.id !== photoId);
      // If deleted image was cover, assign cover to the first remaining image
      if (remaining.length > 0 && !remaining.some((img) => img.isCover)) {
        remaining[0].isCover = true;
      }
      return remaining;
    });
  };

  // Toggle Amenity Checkbox
  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  // Build Payload
  const buildPayload = (forcedStatus?: PublicationStatus) => {
    const parsedPrice = parseFloat(formPrice) || 0;

    const specs: Record<string, any> = {
      subtype: formSubtype,
    };
    if (specSurface) specs.surfaceM2 = parseFloat(specSurface);
    if (specRooms) specs.roomsCount = parseInt(specRooms, 10);
    if (specCapacity) specs.capacityPersons = parseInt(specCapacity, 10);
    if (specDuration) specs.durationMinutes = parseInt(specDuration, 10);
    if (selectedAmenities.length > 0) specs.amenities = selectedAmenities;

    // Ensure cover exists if images exist
    const finalImages = formImages.map((img, idx) => ({
      ...img,
      order: idx + 1,
    }));
    if (finalImages.length > 0 && !finalImages.some((i) => i.isCover)) {
      finalImages[0].isCover = true;
    }

    return {
      title: formTitle.trim(),
      description: formDescription.trim(),
      price: parsedPrice,
      currency: 'FCFA',
      priceType: formPriceType,
      offerType: formOfferType,
      moduleCode: moduleCode || 'IMMOBILIER',
      categoryId: formCategoryId || undefined,
      status: forcedStatus || formStatus,
      availability: formAvailability,
      hasOwnLocation: formHasOwnLocation,
      address: formHasOwnLocation ? formAddress.trim() : undefined,
      city: formCity.trim(),
      district: formDistrict.trim(),
      latitude: formHasOwnLocation && formLat ? parseFloat(formLat) : undefined,
      longitude: formHasOwnLocation && formLng ? parseFloat(formLng) : undefined,
      specs,
      images: finalImages,
    };
  };

  // Save (Draft or Current Status)
  const handleSaveOnly = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formTitle.trim()) {
      onShowToast('Champ requis', 'Veuillez saisir un titre pour votre offre.', 'warning');
      return;
    }

    setIsSaving(true);
    const payload = buildPayload();

    try {
      if (editingItem) {
        const res = await flowexaApi.updateCatalogItem(editingItem.id, payload, businessId);
        if (res.success) {
          onShowToast('Offre enregistrée', `"${formTitle}" mise à jour avec succès.`, 'success');
        }
      } else {
        const res = await flowexaApi.createCatalogItem(payload, businessId);
        if (res.success) {
          onShowToast('Offre enregistrée', `"${formTitle}" créée dans votre catalogue.`, 'success');
        }
      }
      setIsEditModalOpen(false);
      loadItems();
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      onShowToast('Erreur', 'Impossible d’enregistrer l’offre.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Publish Directly (with full validation)
  const handleSaveAndPublish = async () => {
    // 1. Mandatory Title
    if (!formTitle.trim() || formTitle.trim().length < 3) {
      onShowToast('Titre requis', 'Le titre de l’offre doit comporter au moins 3 caractères.', 'warning');
      return;
    }

    // 2. Price Validation
    const parsedPrice = parseFloat(formPrice);
    if (formPriceType !== 'CONTACT' && (!parsedPrice || parsedPrice <= 0)) {
      onShowToast(
        'Prix obligatoire',
        'Veuillez saisir un prix supérieur à 0 FCFA (ou sélectionner "Sur devis").',
        'warning'
      );
      return;
    }

    // 3. Location Validation
    if (formHasOwnLocation && (!formDistrict.trim() || !formCity.trim())) {
      onShowToast(
        'Localisation requise',
        'Veuillez renseigner la ville et le quartier où se situe le bien ou la prestation.',
        'warning'
      );
      return;
    }

    // 4. Photos Validation
    if (formImages.length === 0) {
      onShowToast(
        'Photo requise',
        'Vous devez ajouter au moins une photo pour publier l’offre sur Flowexa.',
        'warning'
      );
      return;
    }

    setIsSaving(true);
    const payload = buildPayload('PUBLISHED');

    try {
      let savedItemId = editingItem?.id;

      if (editingItem) {
        const res = await flowexaApi.updateCatalogItem(editingItem.id, payload, businessId);
        if (!res.success) {
          throw new Error(res.message || 'Erreur mise à jour');
        }
      } else {
        const res = await flowexaApi.createCatalogItem(payload, businessId);
        if (!res.success) {
          throw new Error(res.message || 'Erreur création');
        }
        savedItemId = res.data?.id;
      }

      // Call backend publication endpoint for security check
      if (savedItemId) {
        const pubRes = await flowexaApi.publishCatalogItem(savedItemId, businessId);
        if (pubRes.success) {
          onShowToast(
            'Offre Publiée !',
            `"${formTitle}" est désormais active et immédiatement visible dans la recherche Flowexa.`,
            'success'
          );
        } else {
          onShowToast('Attention', pubRes.message || 'Offre enregistrée mais publication en attente.', 'warning');
        }
      }

      setIsEditModalOpen(false);
      loadItems();
    } catch (err: any) {
      console.error('Erreur publication:', err);
      onShowToast('Erreur publication', err.message || 'Impossible de publier cette offre.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Fast Publish Toggle from Catalog Grid or Preview
  const handleTogglePublish = async (item: CatalogItem) => {
    try {
      if (item.status === 'PUBLISHED') {
        const res = await flowexaApi.unpublishCatalogItem(item.id);
        if (res.success) {
          onShowToast('Offre dépubliée', `"${item.title}" a été retirée des résultats publics.`, 'info');
          if (previewItem?.id === item.id) {
            setPreviewItem({ ...previewItem, status: 'UNPUBLISHED' });
          }
        }
      } else {
        const res = await flowexaApi.publishCatalogItem(item.id, businessId);
        if (res.success) {
          onShowToast(
            'Offre publiée !',
            `"${item.title}" est en ligne et trouvable sur Flowexa.`,
            'success'
          );
          if (previewItem?.id === item.id) {
            setPreviewItem({ ...previewItem, status: 'PUBLISHED' });
          }
        } else {
          onShowToast('Publication refusée', res.message || 'Vérifiez les champs obligatoires.', 'warning');
        }
      }
      loadItems();
    } catch (err: any) {
      onShowToast('Erreur', err.message || 'Impossible de modifier le statut.', 'error');
    }
  };

  // Toggle Availability
  const handleToggleAvailability = async (item: CatalogItem) => {
    try {
      const res = await flowexaApi.toggleCatalogItemAvailability(item.id);
      if (res.success) {
        const newStatus = item.availability === 'AVAILABLE' ? 'Indisponible' : 'Disponible';
        onShowToast('Disponibilité', `"${item.title}" marquée comme ${newStatus}.`, 'success');
        if (previewItem?.id === item.id) {
          setPreviewItem({
            ...previewItem,
            availability: item.availability === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE',
          });
        }
        loadItems();
      }
    } catch (err) {
      onShowToast('Erreur', 'Impossible de modifier la disponibilité.', 'error');
    }
  };

  // Delete Item
  const handleDeleteItem = async (item: CatalogItem) => {
    if (!window.confirm(`Confirmez-vous la suppression définitive de "${item.title}" ?`)) {
      return;
    }
    try {
      const res = await flowexaApi.deleteCatalogItem(item.id, businessId);
      if (res.success) {
        onShowToast('Offre supprimée', `"${item.title}" a été supprimée du catalogue.`, 'info');
        loadItems();
      }
    } catch (err) {
      onShowToast('Erreur', 'Impossible de supprimer cette offre.', 'error');
    }
  };

  // Open Preview Modal directly from Item
  const handleOpenPreview = (item: CatalogItem) => {
    setPreviewItem(item);
    setIsPreviewModalOpen(true);
  };

  // Open Preview Modal from Form Fields
  const handlePreviewFromForm = () => {
    if (!formTitle.trim()) {
      onShowToast('Titre manquant', 'Veuillez saisir au moins un titre pour afficher l’aperçu.', 'warning');
      return;
    }
    const tempPayload = buildPayload();
    const tempItem: CatalogItem = {
      id: editingItem?.id || 'temp-preview',
      businessId,
      ...tempPayload,
      viewsCount: editingItem?.viewsCount || 0,
      inquiriesCount: editingItem?.inquiriesCount || 0,
      createdAt: editingItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPreviewItem(tempItem);
    setIsPreviewModalOpen(true);
  };

  // Filter items in memory
  const filteredItems = items.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (availabilityFilter !== 'ALL' && item.availability !== availabilityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchCity = item.city?.toLowerCase().includes(q);
      const matchDistrict = item.district?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCity && !matchDistrict) return false;
    }
    return true;
  });

  const publishedCount = items.filter((i) => i.status === 'PUBLISHED').length;
  const draftCount = items.filter((i) => i.status === 'DRAFT').length;
  const unavailableCount = items.filter((i) => i.availability === 'UNAVAILABLE').length;

  return (
    <div className="w-full space-y-6 text-left animate-in fade-in duration-300">
      {/* 1. Header Section: MON CATALOGUE + Ajouter Button */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="orange" dot>
              SPRINT F11 — Catalogue & Publication
            </Badge>
            <span className="text-xs text-gray-400 font-mono">Établissement : {businessId}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            {currentConfig.icon}
            <span>MON CATALOGUE</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl leading-relaxed">
            Gérez vos offres réelles ({currentConfig.singularName}s). Chaque offre dispose de son prix librement fixé,
            de ses photos avec image principale, de sa disponibilité et de sa géolocalisation.
          </p>
        </div>

        {/* Big + Ajouter Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="primary"
            size="lg"
            leftIcon={<Plus className="w-5 h-5" />}
            onClick={handleOpenCreate}
            className="w-full sm:w-auto shadow-lg shadow-[#FB8205]/20 font-bold"
          >
            {currentConfig.addLabel}
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0A1428]/60 border border-white/5 rounded-xl p-4">
          <div className="text-xs text-gray-400 font-medium">Total Offres</div>
          <div className="text-2xl font-bold text-white mt-1">{items.length}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Dans ce catalogue</div>
        </div>

        <div className="bg-[#0A1428]/60 border border-emerald-500/20 rounded-xl p-4">
          <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Publiées (En ligne)
          </div>
          <div className="text-2xl font-bold text-emerald-300 mt-1">{publishedCount}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Visibles sur Flowexa</div>
        </div>

        <div className="bg-[#0A1428]/60 border border-amber-500/20 rounded-xl p-4">
          <div className="text-xs text-amber-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Brouillons (DRAFT)
          </div>
          <div className="text-2xl font-bold text-amber-300 mt-1">{draftCount}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">En cours de rédaction</div>
        </div>

        <div className="bg-[#0A1428]/60 border border-rose-500/20 rounded-xl p-4">
          <div className="text-xs text-rose-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            Indisponibles
          </div>
          <div className="text-2xl font-bold text-rose-300 mt-1">{unavailableCount}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Suspendues temporairement</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#0A1428]/40 border border-white/5 rounded-xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par titre, quartier, ville..."
            className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8205] transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center bg-black/30 border border-white/10 rounded-lg p-1 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-[#FB8205] text-white font-semibold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Tous ({items.length})
            </button>
            <button
              onClick={() => setStatusFilter('PUBLISHED')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'PUBLISHED'
                  ? 'bg-emerald-500 text-white font-semibold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Publiés
            </button>
            <button
              onClick={() => setStatusFilter('DRAFT')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'DRAFT' ? 'bg-amber-500 text-white font-semibold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Brouillons
            </button>
          </div>

          {/* Availability filter */}
          <div className="flex items-center bg-black/30 border border-white/10 rounded-lg p-1 text-xs">
            <button
              onClick={() => setAvailabilityFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                availabilityFilter === 'ALL'
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Dispo: Tous
            </button>
            <button
              onClick={() => setAvailabilityFilter('AVAILABLE')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                availabilityFilter === 'AVAILABLE'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Disponibles
            </button>
          </div>
        </div>
      </div>

      {/* Catalog Items Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-gray-400 bg-[#0A1428]/30 rounded-2xl border border-white/5">
          <div className="inline-block w-8 h-8 border-2 border-[#FB8205] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Chargement du catalogue...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-[#0A1428]/30 rounded-2xl border border-white/5">
          <Package className="w-12 h-12 text-gray-500 mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-bold text-white mb-1">Aucune offre trouvée</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto mb-4">
            {searchQuery || statusFilter !== 'ALL' || availabilityFilter !== 'ALL'
              ? 'Aucune offre ne correspond à vos filtres actuels.'
              : 'Votre catalogue est vide. Ajoutez votre première offre pour commencer le cycle de matching Flowexa.'}
          </p>
          <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>
            {currentConfig.addLabel}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const coverImg = item.images?.find((img) => img.isCover) || item.images?.[0];

            return (
              <div
                key={item.id}
                className="bg-[#0A1428]/80 border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden flex flex-col transition-all duration-200 group hover:shadow-xl hover:shadow-black/40"
              >
                {/* Image Area */}
                <div className="relative h-48 bg-black/40 overflow-hidden">
                  {coverImg ? (
                    <img
                      src={coverImg.url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gradient-to-br from-black/40 to-black/80">
                      <ImageIcon className="w-10 h-10 mb-2 opacity-40" />
                      <span className="text-xs">Aucune photo</span>
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-black/70 text-white backdrop-blur-sm border border-white/10">
                      {item.specs?.subtype || item.offerType}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Status */}
                      {item.status === 'PUBLISHED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/90 text-white flex items-center gap-1 shadow-sm backdrop-blur-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Publié
                        </span>
                      ) : item.status === 'DRAFT' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/90 text-black flex items-center gap-1 shadow-sm backdrop-blur-sm">
                          <Clock className="w-3 h-3" />
                          Brouillon
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-600/90 text-white shadow-sm backdrop-blur-sm">
                          Dépublié
                        </span>
                      )}

                      {/* Availability */}
                      {item.availability === 'AVAILABLE' ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-black/60 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
                          Dispo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-black/60 text-rose-300 border border-rose-500/30 backdrop-blur-sm">
                          Indispo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Photos count pill */}
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/70 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm border border-white/10">
                    <Camera className="w-3.5 h-3.5 text-[#FB8205]" />
                    <span>
                      {item.images?.length || 0} photo{(item.images?.length || 0) > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Price and Price Type */}
                    <div className="flex items-baseline justify-between gap-2 mb-2">
                      <div className="text-xl font-extrabold text-white tracking-tight">
                        {(item.price ?? 0).toLocaleString('fr-FR')}{' '}
                        <span className="text-xs font-medium text-[#FB8205]">{item.currency}</span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">
                        {PRICE_TYPE_LABELS[item.priceType] || item.priceType}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-white mb-1.5 line-clamp-1 group-hover:text-[#FB8205] transition-colors">
                      {item.title}
                    </h3>

                    {/* Description */}
                    {item.description && (
                      <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* Geolocation */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                      <MapPin className="w-3.5 h-3.5 text-[#0BE9EF] shrink-0" />
                      <span className="truncate">
                        {item.district ? `${item.district}, ` : ''}
                        {item.city || 'Cotonou'}
                      </span>
                      {item.hasOwnLocation && (
                        <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#0BE9EF]/10 text-[#0BE9EF] shrink-0">
                          GPS dédié
                        </span>
                      )}
                    </div>

                    {/* Specs Pills */}
                    {item.specs && (
                      <div className="flex flex-wrap gap-1.5 mb-3 text-[11px] text-gray-300">
                        {item.specs.surfaceM2 && (
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">
                            {item.specs.surfaceM2} m²
                          </span>
                        )}
                        {item.specs.roomsCount && (
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">
                            {item.specs.roomsCount} pièces
                          </span>
                        )}
                        {item.specs.capacityPersons && (
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">
                            {item.specs.capacityPersons} pers.
                          </span>
                        )}
                        {item.specs.durationMinutes && (
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">
                            {item.specs.durationMinutes} min
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    {/* Preview Button */}
                    <button
                      onClick={() => handleOpenPreview(item)}
                      className="text-xs px-2.5 py-1.5 rounded-lg font-semibold bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
                      title="Prévisualiser l'offre comme un client"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#0BE9EF]" />
                      <span>Aperçu</span>
                    </button>

                    {/* Fast publish toggle button */}
                    <button
                      onClick={() => handleTogglePublish(item)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        item.status === 'PUBLISHED'
                          ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                          : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                      }`}
                    >
                      {item.status === 'PUBLISHED' ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Dépublier</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Publier</span>
                        </>
                      )}
                    </button>

                    {/* Fast availability toggle */}
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                        item.availability === 'AVAILABLE'
                          ? 'text-gray-400 hover:text-white bg-white/5'
                          : 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10'
                      }`}
                    >
                      {item.availability === 'AVAILABLE' ? 'Marquer indispo' : 'Rendre dispo'}
                    </button>

                    {/* Edit & Delete */}
                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title="Modifier l'offre"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ADAPTIVE "AJOUTER / MODIFIER" MODAL (Sprint F11 Points 2, 3, 4, 6)     */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={
          editingItem
            ? `Modifier : ${editingItem.title}`
            : `${currentConfig.addLabel} (${moduleCode})`
        }
        size="xl"
      >
        <div className="space-y-6 text-left max-h-[80vh] overflow-y-auto pr-1">
          {/* Section 1: Classification Adaptée au Métier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Type de {currentConfig.singularName} *
              </label>
              <select
                value={formSubtype}
                onChange={(e) => setFormSubtype(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#FB8205] transition-colors"
              >
                {currentConfig.types.map((t) => (
                  <option key={t} value={t} className="bg-[#0A1428] text-white">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <Select
              label="Disponibilité"
              value={formAvailability}
              onChange={(e) => setFormAvailability(e.target.value as AvailabilityStatus)}
              options={[
                { value: 'AVAILABLE', label: '🟢 Disponible immédiatement' },
                { value: 'UNAVAILABLE', label: '🔴 Indisponible / Occupé' },
              ]}
            />
          </div>

          {/* Section 2: Titre & Description */}
          <div className="space-y-4">
            <Input
              label={
                moduleCode === 'IMMOBILIER'
                  ? 'Titre du bien *'
                  : moduleCode === 'GUEST_HOUSE'
                  ? 'Nom de la chambre *'
                  : 'Nom de la prestation *'
              }
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder={
                moduleCode === 'IMMOBILIER'
                  ? 'Ex: Appartement 3 pièces meublé avec terrasse vue lagune'
                  : moduleCode === 'GUEST_HOUSE'
                  ? 'Ex: Suite Océane avec Jacuzzi et balcon privé'
                  : 'Ex: Soin capillaire profond et tresses sénégalaises'
              }
              required
            />

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Description détaillée
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                placeholder="Décrivez les atouts, les conditions d'accueil ou spécificités..."
                className="w-full px-3.5 py-2.5 bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8205] transition-colors"
              />
            </div>
          </div>

          {/* Section 3: Gestion du Prix (Sprint F11 Point 4) */}
          <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-[#FB8205] uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5" />
                Tarification
              </div>
              <span className="text-[11px] text-gray-400 italic">
                L'entreprise saisit elle-même son prix. Flowexa ne décide jamais du prix.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Prix (FCFA) *"
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="Ex: 150000"
                required
              />

              <Select
                label="Type de tarification"
                value={formPriceType}
                onChange={(e) => setFormPriceType(e.target.value as CatalogPriceType)}
                options={[
                  { value: 'FIXED', label: 'Prix fixe standard' },
                  { value: 'PER_NIGHT', label: 'Par nuit (Hôtel / Guest House)' },
                  { value: 'PER_DAY', label: 'Par jour' },
                  { value: 'PER_HOUR', label: 'Par heure' },
                  { value: 'FROM', label: 'À partir de' },
                  { value: 'CONTACT', label: 'Sur devis' },
                ]}
              />
            </div>
          </div>

          {/* Section 4: Zone de Gestion des Photos (Sprint F11 Point 3) */}
          <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-3.5 h-3.5 text-[#FB8205]" />
                Gestion des photos ({formImages.length})
              </div>
              <span className="text-[11px] text-gray-400">
                Formats JPG, PNG, WEBP (Max 5 Mo)
              </span>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-[#FB8205] bg-[#FB8205]/10 scale-[1.01]'
                  : 'border-white/20 bg-black/20 hover:border-[#FB8205]/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#FB8205]/10 flex items-center justify-center text-[#FB8205]">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-white">📷 Ajouter des photos</div>
                <div className="text-xs text-gray-400">
                  Glisser-déposer ou sélectionner
                </div>
              </div>
            </div>

            {/* Photos Grid with Cover Selection & Delete */}
            {formImages.length > 0 && (
              <div>
                <div className="text-[11px] text-gray-400 mb-2 font-medium">
                  Cliquez sur l'étoile pour désigner l'image principale :
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {formImages.map((img) => (
                    <div
                      key={img.id}
                      className={`relative rounded-xl overflow-hidden border ${
                        img.isCover ? 'border-[#FB8205] ring-2 ring-[#FB8205]/30' : 'border-white/10'
                      } group bg-black/40`}
                    >
                      <img src={img.url} alt={img.title} className="w-full h-24 object-cover" />

                      {/* ⭐ Image Principale Badge */}
                      {img.isCover && (
                        <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-[#FB8205] text-black font-extrabold text-[10px] flex items-center gap-1 shadow-md">
                          <Star className="w-3 h-3 fill-black" />
                          Image principale
                        </div>
                      )}

                      {/* Action buttons on hover */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {!img.isCover && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetCoverPhoto(img.id);
                            }}
                            className="p-1.5 rounded-lg bg-white text-black hover:bg-gray-200 transition-colors cursor-pointer"
                            title="Définir comme image principale ⭐"
                          >
                            <Star className="w-4 h-4 text-black" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePhoto(img.id);
                          }}
                          className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer"
                          title="Supprimer la photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Caractéristiques Adaptées au Métier */}
          {moduleCode === 'IMMOBILIER' && (
            <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
              <div className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#0BE9EF]" />
                Caractéristiques du bien
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Surface (m²)"
                  type="number"
                  value={specSurface}
                  onChange={(e) => setSpecSurface(e.target.value)}
                  placeholder="110"
                />
                <Input
                  label="Nombre de pièces"
                  type="number"
                  value={specRooms}
                  onChange={(e) => setSpecRooms(e.target.value)}
                  placeholder="3"
                />
              </div>
            </div>
          )}

          {moduleCode === 'GUEST_HOUSE' && (
            <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
              <div className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Bed className="w-3.5 h-3.5 text-[#FB8205]" />
                Capacité & Équipements de la chambre
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Capacité (Personnes)"
                  type="number"
                  value={specCapacity}
                  onChange={(e) => setSpecCapacity(e.target.value)}
                  placeholder="2"
                />
                <Input
                  label="Nombre de pièces"
                  type="number"
                  value={specRooms}
                  onChange={(e) => setSpecRooms(e.target.value)}
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">
                  Équipements inclus dans la chambre :
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {GUEST_HOUSE_AMENITIES.map((amenity) => {
                    const checked = selectedAmenities.includes(amenity);
                    return (
                      <label
                        key={amenity}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          checked
                            ? 'bg-[#FB8205]/10 border-[#FB8205]/40 text-white'
                            : 'bg-black/20 border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAmenity(amenity)}
                          className="rounded border-white/20 text-[#FB8205] focus:ring-[#FB8205]"
                        />
                        <span>{amenity}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {(moduleCode === 'COIFFURE' || moduleCode === 'BARBIER') && (
            <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
              <div className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Scissors className="w-3.5 h-3.5 text-[#8B5CF6]" />
                Durée de la prestation
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Durée estimée (minutes)"
                  type="number"
                  value={specDuration}
                  onChange={(e) => setSpecDuration(e.target.value)}
                  placeholder="45"
                />
              </div>
            </div>
          )}

          {/* Section 6: Localisation (Point 8) */}
          <div className="p-4 bg-[#0BE9EF]/5 rounded-xl border border-[#0BE9EF]/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-[#0BE9EF] uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                Localisation du contenu
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formHasOwnLocation}
                  onChange={(e) => setFormHasOwnLocation(e.target.checked)}
                  className="rounded border-white/20 text-[#0BE9EF] focus:ring-[#0BE9EF]"
                />
                <span>Emplacement spécifique (différent du siège)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Quartier *"
                value={formDistrict}
                onChange={(e) => setFormDistrict(e.target.value)}
                placeholder="Ex: Akpakpa, Haie Vive, Ganhi..."
              />
              <Input
                label="Ville *"
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
                placeholder="Ex: Cotonou, Calavi..."
              />
              <Input
                label="Adresse précise"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="Ex: Rue 244, Face Pharmacie"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-1">
              <Input
                label="Latitude GPS"
                value={formLat}
                onChange={(e) => setFormLat(e.target.value)}
                placeholder="6.3750"
              />
              <Input
                label="Longitude GPS"
                value={formLng}
                onChange={(e) => setFormLng(e.target.value)}
                placeholder="2.4500"
              />
              <Button
                type="button"
                variant="outline"
                size="md"
                leftIcon={<Compass className="w-4 h-4 text-[#0BE9EF]" />}
                onClick={handleDetectCoordinates}
                className="w-full border-white/10 hover:border-[#0BE9EF]/50"
              >
                Détecter GPS
              </Button>
            </div>
          </div>

          {/* Form Bottom Actions (Sprint F11 Points 2 & 5: [Enregistrer], [Publier], [Aperçu]) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              size="md"
              leftIcon={<Eye className="w-4 h-4 text-[#0BE9EF]" />}
              onClick={handlePreviewFromForm}
              className="border-white/20 text-white hover:bg-white/5"
            >
              Aperçu avant publication
            </Button>

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSaving}
              >
                Annuler
              </Button>

              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => handleSaveOnly()}
                disabled={isSaving}
                className="border-white/20 text-gray-300 hover:text-white"
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSaveAndPublish}
                disabled={isSaving}
                className="shadow-lg shadow-[#FB8205]/20 font-bold"
              >
                {isSaving ? 'Publication...' : 'Publier sur Flowexa'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 3. MODAL "APERÇU" (Sprint F11 Point 5)                                   */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="APERÇU DE L'OFFRE"
        size="lg"
      >
        {previewItem && (
          <div className="space-y-6 text-left">
            {/* Photos Gallery / Cover in Preview */}
            <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10">
              {previewItem.images && previewItem.images.length > 0 ? (
                <div>
                  {/* Main Cover */}
                  <div className="h-64 sm:h-72 w-full relative">
                    <img
                      src={
                        previewItem.images.find((i) => i.isCover)?.url ||
                        previewItem.images[0]?.url
                      }
                      alt={previewItem.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#FB8205] text-black shadow-lg">
                        ⭐ Photo principale
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {previewItem.status === 'PUBLISHED' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-lg flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          PUBLISHED (En ligne)
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-black shadow-lg">
                          DRAFT (Brouillon)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail strip */}
                  {previewItem.images.length > 1 && (
                    <div className="p-3 bg-[#0A1428] flex items-center gap-2 overflow-x-auto border-t border-white/10">
                      {previewItem.images.map((img) => (
                        <div
                          key={img.id}
                          className={`w-16 h-16 rounded-lg overflow-hidden border shrink-0 ${
                            img.isCover ? 'border-[#FB8205] ring-2 ring-[#FB8205]/40' : 'border-white/10'
                          }`}
                        >
                          <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-gray-500 bg-black/40">
                  <ImageIcon className="w-10 h-10 mb-2 opacity-40" />
                  <span className="text-xs">Aucune photo enregistrée</span>
                </div>
              )}
            </div>

            {/* Title & Price */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#FB8205]">
                  {previewItem.specs?.subtype || previewItem.offerType}
                </span>
                <h2 className="text-2xl font-black text-white mt-0.5">{previewItem.title}</h2>
              </div>

              <div className="text-right">
                <div className="text-3xl font-black text-[#FB8205] tracking-tight">
                  {(previewItem.price ?? 0).toLocaleString('fr-FR')}{' '}
                  <span className="text-sm font-semibold text-white">FCFA</span>
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  {PRICE_TYPE_LABELS[previewItem.priceType] || previewItem.priceType}
                </div>
              </div>
            </div>

            {/* Description */}
            {previewItem.description && (
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</div>
                <p className="text-sm text-gray-300 leading-relaxed">{previewItem.description}</p>
              </div>
            )}

            {/* Details & Location Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Localisation */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1.5">
                <div className="text-xs font-bold text-[#0BE9EF] uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  Localisation
                </div>
                <div className="text-sm font-semibold text-white">
                  {previewItem.district ? `${previewItem.district}, ` : ''}
                  {previewItem.city || 'Cotonou'}
                </div>
                {previewItem.address && (
                  <div className="text-xs text-gray-400">{previewItem.address}</div>
                )}
                {previewItem.latitude && previewItem.longitude && (
                  <div className="text-[11px] text-[#0BE9EF] font-mono mt-1">
                    GPS: {previewItem.latitude.toFixed(4)}, {previewItem.longitude.toFixed(4)}
                  </div>
                )}
              </div>

              {/* Disponibilité & Caractéristiques */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1.5">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Statut & Spécifications
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      previewItem.availability === 'AVAILABLE'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {previewItem.availability === 'AVAILABLE' ? '🟢 Disponible' : '🔴 Indisponible'}
                  </span>
                </div>

                {previewItem.specs && (
                  <div className="text-xs text-gray-300 pt-1 space-y-0.5">
                    {previewItem.specs.surfaceM2 && <div>Surface : {previewItem.specs.surfaceM2} m²</div>}
                    {previewItem.specs.roomsCount && <div>Pièces : {previewItem.specs.roomsCount}</div>}
                    {previewItem.specs.capacityPersons && (
                      <div>Capacité : {previewItem.specs.capacityPersons} personnes</div>
                    )}
                    {previewItem.specs.durationMinutes && (
                      <div>Durée : {previewItem.specs.durationMinutes} minutes</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Équipements inclus si guest house */}
            {Array.isArray(previewItem.specs?.amenities) && previewItem.specs.amenities.length > 0 && (
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
                <div className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Équipements inclus :
                </div>
                <div className="flex flex-wrap gap-2">
                  {previewItem.specs.amenities.map((a: string) => (
                    <span
                      key={a}
                      className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-xs text-white"
                    >
                      ✓ {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Test Contact Flowexa (Numéro unique : 0154100617) */}
            <div className="p-4 bg-gradient-to-r from-emerald-950/40 to-[#0A1428] rounded-xl border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Contact Client Flowexa
                </div>
                <div className="text-sm text-white font-mono mt-0.5">
                  Numéro d'appel & WhatsApp : <strong>0154100617</strong>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = 'tel:0154100617';
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tester Appel</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.open('https://wa.me/2290154100617', '_blank');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Tester WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Preview Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <Button variant="outline" size="md" onClick={() => setIsPreviewModalOpen(false)}>
                Fermer l'aperçu
              </Button>

              {previewItem.id !== 'temp-preview' && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleTogglePublish(previewItem)}
                  className="font-bold"
                >
                  {previewItem.status === 'PUBLISHED' ? 'Dépublier l’offre' : 'Publier sur Flowexa'}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
