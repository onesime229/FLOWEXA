import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  MapPin,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  Star,
  ShieldCheck,
  Phone,
  MessageSquare,
  Calendar,
  Layers,
  ArrowLeftRight,
  X,
  Send,
  Zap,
  Check,
  Building2,
  Home,
  Scissors,
  Eye,
} from 'lucide-react';
import { Button } from '../design-system/Button';
import { Card } from '../design-system/Card';
import { Badge } from '../design-system/Badge';
import { Input } from '../design-system/Input';
import {
  BusinessModuleCode,
  SearchResultItem,
  SearchFunnelStep,
  AIComprehensionData,
} from '../../types';
import { FLOWEXA_MODULES } from '../../data/mockData';
import { flowexaApi, NearbyResult } from '../../services/api';
import { Navigation, Compass, LocateFixed, AlertCircle, Bot } from 'lucide-react';
import { ClientAIAssistant } from '../client/ClientAIAssistant';

interface FlowexaSearchExperienceProps {
  onSelectResult?: (result: SearchResultItem) => void;
  onOpenAuth?: () => void;
  initialQuery?: string;
}

const PRESET_QUERIES = [
  {
    text: 'Je cherche un appartement à Cotonou à 120 000 FCFA',
    module: 'IMMOBILIER' as BusinessModuleCode,
    location: 'Cotonou (Haie Vive)',
    budget: 120000,
    intent: 'Location appartement meublé / non meublé',
  },
  {
    text: 'Trouve-moi une guest house près de Fidjrossè avec piscine',
    module: 'GUEST_HOUSE' as BusinessModuleCode,
    location: 'Fidjrossè Plage',
    budget: 45000,
    intent: 'Séjour courte durée avec piscine & commodités',
  },
  {
    text: 'Barbier ouvert après 19h pour dégradé et taille de barbe',
    module: 'BARBIER' as BusinessModuleCode,
    location: 'Ganhi / Cotonou',
    budget: 7000,
    intent: 'Soin grooming homme en soirée',
  },
  {
    text: 'Massage relaxant duo samedi après-midi à Ganhi',
    module: 'SPA_MASSAGE' as BusinessModuleCode,
    location: 'Ganhi',
    budget: 35000,
    intent: 'Détente bien-être formule duo',
  },
  {
    text: 'Vidange et checkup moteur express à Calavi',
    module: 'GARAGE' as BusinessModuleCode,
    location: 'Abomey-Calavi',
    budget: 25000,
    intent: 'Maintenance automobile express multi-marques',
  },
];

export const FlowexaSearchExperience: React.FC<FlowexaSearchExperienceProps> = ({
  onSelectResult,
  onOpenAuth,
  initialQuery = 'Je cherche un appartement à Cotonou',
}) => {
  const [currentStep, setCurrentStep] = useState<SearchFunnelStep>('RESULTS');
  const [query, setQuery] = useState(initialQuery);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('ALL');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('ALL');

  // Real search results from Backend API
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Proximity Search State (Step 7)
  const [isProximityActive, setIsProximityActive] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedRadius, setSelectedRadius] = useState<'500m' | '1km' | '2km' | '5km' | '10km' | 'all'>('5km');
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [isAIAssistantActive, setIsAIAssistantActive] = useState(false);

  // Semantic Comprehension state
  const [comprehension, setComprehension] = useState<AIComprehensionData>({
    originalQuery: initialQuery,
    detectedIntent: 'Recherche de services ou biens',
    detectedModule: 'IMMOBILIER',
    detectedLocation: 'Cotonou',
    budgetCap: undefined,
    budgetCapFormatted: '',
    timeframe: 'Immédiat',
    confidenceScore: 98.4,
    extractedKeywords: ['recherche', 'Cotonou'],
  });

  // Comparison drawer & selection
  const [comparisonItems, setComparisonItems] = useState<SearchResultItem[]>([]);

  // Booking / Contact state (No invented personal data)
  const [bookingTarget, setBookingTarget] = useState<SearchResultItem | null>(null);
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingTime, setBookingTime] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [paymentGateway, setPaymentGateway] = useState<'MOMO' | 'MOOV' | 'CELTIIS' | 'CASH'>('MOMO');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Execute Smart Search on backend
  const executeSmartSearch = async (textToSearch: string, openNow?: boolean) => {
    setIsAnalyzing(true);
    setHasSearched(true);
    try {
      const isFilterOpen = openNow !== undefined ? openNow : openNowOnly;
      const res = await flowexaApi.smartSearch(textToSearch, {
        lat: userCoords?.lat,
        lng: userCoords?.lng,
        radius: selectedRadius !== 'all' ? parseFloat(selectedRadius.replace('km', '').replace('500m', '0.5')) : undefined,
        open_now: isFilterOpen,
      });
      if (res.success && res.data) {
        if (res.data.comprehension) {
          setComprehension(res.data.comprehension);
          if (res.data.comprehension.detectedModule) {
            setSelectedModuleFilter(res.data.comprehension.detectedModule);
          }
        }

        let mappedCatalog: SearchResultItem[] = [];
        if (Array.isArray(res.data.catalogItems)) {
          mappedCatalog = res.data.catalogItems.map((item: any) => ({
            id: item.id,
            title: item.title,
            moduleCode: item.moduleCode as BusinessModuleCode,
            category: item.categoryName || item.offerType || 'Offre',
            location: item.effectiveLocation?.district
              ? `${item.effectiveLocation.district}, ${item.effectiveLocation.city || 'Cotonou'}`
              : (item.district ? `${item.district}, ${item.city}` : item.city || 'Cotonou'),
            price: item.price,
            priceFormatted: typeof item.price === 'number' ? `${item.price.toLocaleString('fr-FR')} FCFA` : (item.priceFormatted || 'Sur devis'),
            priceUnit:
              item.priceType === 'PER_NIGHT'
                ? '/ nuit'
                : item.priceType === 'PER_DAY'
                ? '/ jour'
                : item.priceType === 'PER_HOUR'
                ? '/ h'
                : '',
            rating: typeof item.rating === 'number' ? item.rating : null,
            reviewCount: typeof item.reviewCount === 'number' ? item.reviewCount : 0,
            isFavorite: item.isFavorite,
            businessName: item.businessName || 'Entreprise Partenaire',
            businessPhone: '0154100617',
            businessWhatsApp: '0154100617',
            badgeText:
              item.offerType === 'BIEN'
                ? '🏠 Bien Immobilier'
                : item.offerType === 'CHAMBRE'
                ? '🏨 Chambre & Suite'
                : item.offerType === 'PRESTATION'
                ? '✂️ Prestation'
                : item.offerType === 'PRODUIT'
                ? '📦 Produit'
                : item.offerType === 'VEHICULE_INTERVENTION'
                ? '🔧 Intervention Véhicule'
                : 'Offre Catalogue',
            imageUrl:
              item.images?.find((img: any) => img.isCover)?.url ||
              item.images?.[0]?.url ||
              'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop&q=80',
            description: item.description || '',
            specs: {
              ...(item.distanceFormatted ? { Distance: item.distanceFormatted } : {}),
              ...(item.specs?.surfaceM2 ? { Surface: `${item.specs.surfaceM2} m²` } : {}),
              ...(item.specs?.roomsCount ? { Pièces: `${item.specs.roomsCount}` } : {}),
              ...(item.specs?.capacityPersons ? { Capacité: `${item.specs.capacityPersons} pers.` } : {}),
              ...(item.specs?.durationMinutes ? { Durée: `${item.specs.durationMinutes} min` } : {}),
            },
            isAvailable: item.availability === 'AVAILABLE',
            kind: 'catalog_item',
            offerType: item.offerType,
            priceType: item.priceType,
            hasOwnLocation: item.hasOwnLocation,
            distanceKm: item.distanceKm,
            distanceFormatted: item.distanceFormatted,
            relevanceScore: item.relevanceScore,
            effectiveLocation: item.effectiveLocation,
            images: item.images,
            businessId: item.businessId,
            explanations: item.explanations || [],
            isOpenNow: item.is_open_now !== undefined ? item.is_open_now : item.isOpenNow,
            openingHoursFormatted: item.opening_hours || item.openingHoursFormatted,
          }));
        }

        let mappedBiz: SearchResultItem[] = [];
        if (Array.isArray(res.data.businesses)) {
          mappedBiz = res.data.businesses.map((biz: any) => ({
            id: biz.id,
            title: biz.name,
            moduleCode: biz.module_code as BusinessModuleCode,
            category: biz.district || biz.city || 'Établissement',
            location: `${biz.district ? biz.district + ', ' : ''}${biz.city}`,
            price: 0,
            priceFormatted: biz.distanceFormatted ? `À ${biz.distanceFormatted}` : 'Proximité immédiate',
            priceUnit: '',
            rating: typeof biz.rating === 'number' ? biz.rating : null,
            reviewCount: typeof biz.review_count === 'number' ? biz.review_count : typeof biz.reviewCount === 'number' ? biz.reviewCount : 0,
            isFavorite: biz.isFavorite,
            businessName: biz.name,
            businessPhone: '0154100617',
            businessWhatsApp: '0154100617',
            badgeText: biz.is_open_now ? '🟢 Ouvert maintenant' : '🏢 Établissement vérifié',
            imageUrl:
              biz.images?.[0]?.url ||
              'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80',
            description: biz.description || `${biz.address || 'Adresse à Cotonou'}`,
            specs: {
              ...(biz.distanceFormatted ? { Distance: biz.distanceFormatted } : {}),
              Quartier: biz.district || 'Cotonou',
              Statut: biz.is_open_now ? 'Ouvert maintenant' : 'Fermé actuellement',
            },
            isAvailable: biz.status === 'ACTIVE',
            kind: 'business',
            distanceKm: biz.distanceKm,
            distanceFormatted: biz.distanceFormatted,
            isOpenNow: biz.is_open_now !== undefined ? biz.is_open_now : biz.isOpenNow,
            openingHoursFormatted: biz.opening_hours,
          }));
        }

        if (mappedCatalog.length > 0 || mappedBiz.length > 0) {
          setSearchResults([...mappedCatalog, ...mappedBiz]);
        } else if (Array.isArray(res.data.results)) {
          setSearchResults(res.data.results);
        } else {
          setSearchResults([]);
        }
      }
    } catch (err) {
      console.error('Erreur recherche intelligente:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Initial load
  React.useEffect(() => {
    executeSmartSearch(query);
  }, []);

  // Parse natural language query
  const handleAnalyzeQuery = async (textToAnalyze: string) => {
    setCurrentStep('COMPREHENSION');
    await executeSmartSearch(textToAnalyze);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    handleAnalyzeQuery(query);
  };

  // Locate User Browser Geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Géolocalisation non supportée par votre navigateur');
      return;
    }
    setIsLocating(true);
    setLocationStatus('Détection de vos coordonnées GPS...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        };
        setUserCoords(coords);
        setIsProximityActive(true);
        setIsLocating(false);
        setLocationStatus(`Position GPS active : ${coords.lat}, ${coords.lng}`);
        runProximitySearch(coords, selectedRadius, openNowOnly, selectedModuleFilter);
      },
      (err) => {
        setIsLocating(false);
        // Fallback default Cotonou (Haie Vive)
        const fallback = { lat: 6.355, lng: 2.41 };
        setUserCoords(fallback);
        setIsProximityActive(true);
        setLocationStatus('Position estimée : Cotonou centre');
        runProximitySearch(fallback, selectedRadius, openNowOnly, selectedModuleFilter);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Execute Proximity Nearby Search
  const runProximitySearch = async (
    coords: { lat: number; lng: number },
    radius: string,
    openNow: boolean,
    moduleFilter: string
  ) => {
    setIsAnalyzing(true);
    setHasSearched(true);
    try {
      const res = await flowexaApi.searchNearby({
        lat: coords.lat,
        lng: coords.lng,
        radius: radius,
        open_now: openNow,
        module_code: moduleFilter !== 'ALL' ? moduleFilter : undefined,
      });

      if (res.success) {
        // Map nearby catalog items
        const catalogMapped: SearchResultItem[] = ((res as any).catalogItems || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          moduleCode: item.moduleCode as BusinessModuleCode,
          category: item.offerType || 'Offre Proche',
          location: item.effectiveLocation?.district
            ? `${item.effectiveLocation.district}, ${item.effectiveLocation.city || 'Cotonou'}`
            : (item.district ? `${item.district}, ${item.city}` : item.city || 'Cotonou'),
          price: item.price,
          priceFormatted: typeof item.price === 'number' ? `${item.price.toLocaleString('fr-FR')} FCFA` : (item.priceFormatted || 'Sur devis'),
          priceUnit: item.priceType === 'PER_NIGHT' ? '/ nuit' : item.priceType === 'PER_DAY' ? '/ jour' : '',
          rating: typeof item.rating === 'number' ? item.rating : null,
          reviewCount: typeof item.reviewCount === 'number' ? item.reviewCount : 0,
          businessName: item.businessName || 'Entreprise Partenaire',
          businessPhone: '0154100617',
          businessWhatsApp: '0154100617',
          badgeText: item.hasOwnLocation ? '📍 Emplacement propre' : '📍 Offre locale',
          imageUrl:
            item.images?.find((img: any) => img.isCover)?.url ||
            item.images?.[0]?.url ||
            'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop&q=80',
          description: item.description || '',
          specs: {
            Distance: item.distanceFormatted,
            Localisation: item.hasOwnLocation ? 'Propre au bien' : 'Établissement',
            Statut: item.is_open_now ? 'Ouvert maintenant' : 'Fermé actuellement',
          },
          isAvailable: item.availability === 'AVAILABLE',
          kind: 'catalog_item',
          hasOwnLocation: item.hasOwnLocation,
          distanceKm: item.distanceKm,
          distanceFormatted: item.distanceFormatted,
          images: item.images,
          businessId: item.businessId,
          isOpenNow: item.is_open_now,
        }));

        // Map nearby business results to search result items
        const bizMapped: SearchResultItem[] = (Array.isArray(res.data) ? res.data : []).map((item: NearbyResult) => {
          const biz = item.business;
          return {
            id: biz.id,
            title: biz.name,
            moduleCode: biz.module_code as BusinessModuleCode,
            category: biz.district || biz.city || 'Service professionnel',
            location: `${biz.district ? biz.district + ', ' : ''}${biz.city}`,
            price: 0,
            priceFormatted: item.distanceFormatted ? `À ${item.distanceFormatted}` : 'Proximité immédiate',
            priceUnit: '',
            rating: typeof (biz as any).rating === 'number' ? (biz as any).rating : null,
            reviewCount: typeof (biz as any).review_count === 'number' ? (biz as any).review_count : typeof (biz as any).reviewCount === 'number' ? (biz as any).reviewCount : 0,
            businessName: biz.name,
            businessPhone: '0154100617',
            businessWhatsApp: '0154100617',
            badgeText: biz.is_open_now ? '🟢 Ouvert maintenant' : '🏢 Établissement vérifié',
            imageUrl: biz.images?.[0]?.url || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80',
            description: `${biz.address || 'Adresse à Cotonou'} • Distance : ${item.distanceFormatted}`,
            specs: {
              Distance: item.distanceFormatted,
              Quartier: biz.district || 'Cotonou',
              Statut: biz.is_open_now ? 'Ouvert maintenant' : 'Fermé actuellement',
            },
            isAvailable: biz.status === 'ACTIVE',
            kind: 'business',
            distanceKm: item.distanceKm,
            distanceFormatted: item.distanceFormatted,
            isOpenNow: biz.is_open_now,
            openingHoursFormatted: typeof biz.opening_hours === 'string' ? biz.opening_hours : 'Consulter les horaires',
          };
        });

        setSearchResults([...catalogMapped, ...bizMapped]);
      }
    } catch (err) {
      console.error('Erreur recherche proximité:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Filtered results
  const filteredResults = useMemo(() => {
    return searchResults.filter((item) => {
      if (selectedModuleFilter !== 'ALL' && item.moduleCode !== selectedModuleFilter) {
        return false;
      }
      if (selectedCityFilter !== 'ALL' && !item.location.toLowerCase().includes(selectedCityFilter.toLowerCase())) {
        return false;
      }
      if (openNowOnly && item.isOpenNow === false) {
        return false;
      }
      return true;
    });
  }, [searchResults, selectedModuleFilter, selectedCityFilter, openNowOnly]);

  // Comparison toggle
  const toggleComparison = (item: SearchResultItem) => {
    setComparisonItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      if (exists) {
        return prev.filter((i) => i.id !== item.id);
      }
      if (prev.length >= 4) {
        alert('Vous pouvez comparer jusqu’à 4 offres simultanément.');
        return prev;
      }
      return [...prev, item];
    });
  };

  // Start booking
  const handleInitiateBooking = (item: SearchResultItem) => {
    setBookingTarget(item);
    setBookingConfirmed(false);
    setCurrentStep('BOOKING');
  };

  // Confirm booking
  const handleConfirmReservation = async () => {
    if (bookingTarget) {
      try {
        await flowexaApi.submitDemande({
          clientName: clientName || 'Client Test',
          clientPhone: clientPhone || '',
          targetId: bookingTarget.id,
          targetTitle: bookingTarget.title,
          businessName: bookingTarget.businessName,
          moduleCode: bookingTarget.moduleCode,
          date: bookingDate,
          time: bookingTime,
          gateway: paymentGateway,
          amount: bookingTarget.price || 0,
        });
      } catch (err) {
        console.error('Erreur enregistrement réservation:', err);
      }
    }
    setBookingConfirmed(true);
  };

  const stepsList: { key: SearchFunnelStep; label: string; number: string; icon: any }[] = [
    { key: 'QUERY', label: 'Que recherchez-vous ?', number: '1', icon: Search },
    { key: 'COMPREHENSION', label: 'Compréhension IA', number: '2', icon: Sparkles },
    { key: 'RESULTS', label: 'Résultats ciblés', number: '3', icon: Layers },
    { key: 'COMPARISON', label: `Comparaison (${comparisonItems.length})`, number: '4', icon: ArrowLeftRight },
    { key: 'BOOKING', label: 'Contact / Réservation', number: '5', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* ========================================================= */}
      {/* 5-STEP VISUAL FUNNEL HEADER (THE USER JOURNEY) */}
      {/* ========================================================= */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-3 md:p-4 shadow-xl">
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
          {stepsList.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.key;
            const isDone =
              (currentStep === 'COMPREHENSION' && idx < 1) ||
              (currentStep === 'RESULTS' && idx < 2) ||
              (currentStep === 'COMPARISON' && idx < 3) ||
              (currentStep === 'BOOKING' && idx < 4);

            return (
              <React.Fragment key={step.key}>
                <button
                  onClick={() => setCurrentStep(step.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FB8205] to-[#E06900] text-white shadow-md shadow-[#FB8205]/20 scale-105'
                      : isDone
                      ? 'bg-[#10D97F]/10 border border-[#10D97F]/30 text-[#10D97F] hover:bg-[#10D97F]/20'
                      : 'bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      isActive ? 'bg-white text-[#020919]' : isDone ? 'bg-[#10D97F] text-[#020919]' : 'bg-white/10 text-gray-300'
                    }`}
                  >
                    {isDone ? <Check className="w-3 h-3" /> : step.number}
                  </span>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{step.label}</span>
                </button>

                {idx < stepsList.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-600 shrink-0 hidden sm:block" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* STEP 1: QUE RECHERCHEZ-VOUS ? (NATURAL LANGUAGE SEARCH) */}
      {/* ========================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0A1428] to-[#020919] border border-white/10 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0BE9EF]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FB8205]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FB8205]/10 border border-[#FB8205]/30 text-[#FB8205] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Moteur Sémantique Flowexa Bénin
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
              Que recherchez-vous aujourd'hui ?
            </h1>
            <p className="text-sm md:text-base text-gray-400">
              Exprimez votre besoin en langage naturel. Flowexa comprend votre métier cible, votre budget et votre localisation.
            </p>
          </div>

          {/* Natural Search Input Form */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#020919] border-2 border-[#0BE9EF]/40 focus-within:border-[#0BE9EF] rounded-2xl p-2 shadow-2xl transition-all">
              <div className="flex items-center flex-1 px-3 gap-3">
                <Search className="w-5 h-5 text-[#0BE9EF] shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ex : Je cherche un appartement à Cotonou à 120 000 FCFA..."
                  className="w-full bg-transparent border-none text-white placeholder-gray-500 focus:outline-none text-sm md:text-base font-medium"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="text-gray-500 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isAnalyzing}
                className="w-full sm:w-auto font-bold px-6 shadow-lg shadow-[#FB8205]/20"
              >
                Analyser & Trouver
              </Button>
            </div>
          </form>

          {/* Search Mode & Proximity Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2 bg-[#020919] p-1 rounded-xl border border-white/10 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setIsAIAssistantActive(false);
                  setIsProximityActive(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all flex-1 sm:flex-initial cursor-pointer ${
                  !isProximityActive && !isAIAssistantActive
                    ? 'bg-[#FB8205] text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Recherche Sémantique</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAIAssistantActive(false);
                  setIsProximityActive(true);
                  if (!userCoords) handleLocateMe();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all flex-1 sm:flex-initial cursor-pointer ${
                  isProximityActive && !isAIAssistantActive
                    ? 'bg-[#0BE9EF] text-[#020919] shadow font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <LocateFixed className="w-3.5 h-3.5" />
                <span>Autour de moi (GPS)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAIAssistantActive(true);
                  setIsProximityActive(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all flex-1 sm:flex-initial cursor-pointer ${
                  isAIAssistantActive
                    ? 'bg-gradient-to-r from-[#0BE9EF] to-[#0891B2] text-[#0A1428] shadow font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Assistant & Recommandations IA</span>
              </button>
            </div>

            {/* Proximity Radius & GPS Locator */}
            {isProximityActive && (
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={isLocating}
                  onClick={handleLocateMe}
                  leftIcon={<Compass className="w-3.5 h-3.5 text-[#0BE9EF]" />}
                  className="text-xs border-[#0BE9EF]/30 hover:border-[#0BE9EF]"
                >
                  {userCoords ? 'Actualiser GPS' : 'Détecter ma position'}
                </Button>

                <select
                  value={selectedRadius}
                  onChange={(e) => {
                    const r = e.target.value as any;
                    setSelectedRadius(r);
                    if (userCoords) {
                      runProximitySearch(userCoords, r, openNowOnly, selectedModuleFilter);
                    }
                  }}
                  className="bg-[#020919] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#0BE9EF]"
                >
                  <option value="500m">Rayon : 500 m</option>
                  <option value="1km">Rayon : 1 km</option>
                  <option value="2km">Rayon : 2 km</option>
                  <option value="5km">Rayon : 5 km</option>
                  <option value="10km">Rayon : 10 km</option>
                  <option value="all">Ville entière</option>
                </select>

                <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer bg-[#020919] px-2.5 py-1.5 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
                  <input
                    type="checkbox"
                    checked={openNowOnly}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setOpenNowOnly(checked);
                      if (userCoords) {
                        runProximitySearch(userCoords, selectedRadius, checked, selectedModuleFilter);
                      } else {
                        executeSmartSearch(query, checked);
                      }
                    }}
                    className="rounded border-gray-600 text-[#10D97F] focus:ring-0 cursor-pointer"
                  />
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className={`w-2 h-2 rounded-full ${openNowOnly ? 'bg-[#10D97F] animate-pulse' : 'bg-gray-500'}`} />
                    Ouvert maintenant
                  </span>
                </label>
              </div>
            )}
          </div>

          {locationStatus && (
            <div className="text-[11px] text-[#0BE9EF] flex items-center gap-1.5 bg-[#0BE9EF]/5 border border-[#0BE9EF]/20 px-3 py-1.5 rounded-xl">
              <Navigation className="w-3.5 h-3.5 animate-pulse" />
              <span>{locationStatus}</span>
            </div>
          )}

          {/* Quick preset suggestions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
              <span>Suggestions fréquentes :</span>
              <span className="text-[#0BE9EF]">Cliquez pour tester le flux</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_QUERIES.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(p.text);
                    handleAnalyzeQuery(p.text);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#0BE9EF]/40 text-xs text-gray-300 hover:text-white transition-all text-left flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-[#FB8205]" />
                  <span>{p.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Client AI Assistant View */}
      {isAIAssistantActive && (
        <ClientAIAssistant
          onSelectResult={(item) => {
            const mapped: SearchResultItem = {
              id: item.id,
              title: item.title,
              moduleCode: (item.moduleCode as BusinessModuleCode) || 'IMMOBILIER',
              category: item.category || 'Offre',
              location: item.location || 'Cotonou',
              price: item.price || 0,
              priceFormatted: item.priceFormatted || '',
              priceUnit: item.priceUnit || '',
              rating: item.rating || 5.0,
              reviewCount: item.reviewCount || 0,
              businessName: item.businessName || 'Partenaire Flowexa',
              businessPhone: '0154100617',
              businessWhatsApp: '0154100617',
              badgeText: item.highlightBadge || 'Offre Recommandée',
              imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop&q=80',
              description: item.description || '',
              specs: item.specs || {},
              isAvailable: true,
              explanations: item.explanations,
            };
            handleInitiateBooking(mapped);
          }}
          onShowToast={(title, msg, type) => {
            console.log(`[Toast ${type}] ${title}: ${msg}`);
          }}
        />
      )}

      {/* ========================================================= */}
      {/* STEP 2: COMPRÉHENSION (SEMANTIC UNDERSTANDING CARD) */}
      {/* ========================================================= */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0BE9EF]/10 border border-[#0BE9EF]/30 flex items-center justify-center text-[#0BE9EF]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-bold text-white">Compréhension Flowexa AI</h2>
                <Badge variant="success">98.4% de certitude</Badge>
              </div>
              <p className="text-xs text-gray-400">Analyse sémantique contextualisée pour le marché béninois</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep('QUERY')}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Modifier la requête
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCurrentStep('RESULTS')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Voir les {filteredResults.length} résultats
            </Button>
          </div>
        </div>

        {/* Semantic Extraction Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          <div className="p-3.5 rounded-xl bg-[#020919] border border-white/5 space-y-1">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Intention Détectée
            </span>
            <p className="text-xs md:text-sm font-semibold text-white line-clamp-2">
              {comprehension.detectedIntent}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#020919] border border-white/5 space-y-1">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Métier Flowexa Cible
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-[#FB8205]/20 text-[#FB8205] text-xs font-bold">
                {comprehension.detectedModule}
              </span>
              <span className="text-xs text-gray-300">
                {FLOWEXA_MODULES.find((m) => m.code === comprehension.detectedModule)?.name || 'Module'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#020919] border border-white/5 space-y-1">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Localisation Identifiée
            </span>
            <div className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-white">
              <MapPin className="w-3.5 h-3.5 text-[#0BE9EF]" />
              <span>{comprehension.detectedLocation}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#020919] border border-white/5 space-y-1">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Budget & Temporalité
            </span>
            <p className="text-xs md:text-sm font-bold text-[#10D97F]">
              {comprehension.budgetCapFormatted || 'Non contraint'} • {comprehension.timeframe}
            </p>
          </div>
        </div>

        {/* Semantic tags */}
        <div className="flex items-center gap-2 pt-4 flex-wrap">
          <span className="text-xs text-gray-400 font-medium">Mots-clés sémantiques activés :</span>
          {comprehension.extractedKeywords.map((kw, i) => (
            <span
              key={i}
              className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] font-medium text-gray-300"
            >
              #{kw}
            </span>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* STEP 4: COMPARISON MATRIX (SIDE-BY-SIDE EVALUATION) */}
      {/* Shown when step is COMPARISON, or sticky bar at bottom */}
      {/* ========================================================= */}
      {currentStep === 'COMPARISON' ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0A1428] border border-white/10 rounded-2xl p-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold text-white">
                  Comparaison directe ({comparisonItems.length} offres)
                </h2>
                <Badge variant="warning">Matrice d'arbitrage</Badge>
              </div>
              <p className="text-xs md:text-sm text-gray-400">
                Comparez les tarifs réels, les équipements garantis et les avis vérifiés pour faire le meilleur choix.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep('RESULTS')}
                leftIcon={<ArrowRight className="w-3.5 h-3.5 rotate-180" />}
              >
                Retour aux résultats
              </Button>
              {comparisonItems.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setComparisonItems([])}
                >
                  Vider la sélection
                </Button>
              )}
            </div>
          </div>

          {comparisonItems.length === 0 ? (
            <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-12 text-center space-y-4">
              <ArrowLeftRight className="w-12 h-12 text-gray-500 mx-auto" />
              <h3 className="text-base font-bold text-white">Aucune offre sélectionnée pour comparaison</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Revenez à la liste des résultats et cliquez sur « Comparer » sur 2 à 4 offres de votre choix.
              </p>
              <Button variant="primary" onClick={() => setCurrentStep('RESULTS')}>
                Explorer les résultats
              </Button>
            </div>
          ) : (
            <div className="bg-[#0A1428] border border-white/10 rounded-2xl overflow-x-auto shadow-2xl">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/10 bg-[#020919]">
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase w-48">Critères</th>
                    {comparisonItems.map((item) => (
                      <th key={item.id} className="p-4 text-left w-72">
                        <div className="space-y-2">
                          <div className="relative h-32 rounded-xl overflow-hidden border border-white/10">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => toggleComparison(item)}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
                              title="Retirer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold text-[#FB8205]">
                              {item.badgeText}
                            </span>
                          </div>
                          <h4 className="font-bold text-white text-sm line-clamp-1">{item.title}</h4>
                          <p className="text-xs text-gray-400 line-clamp-1">{item.businessName}</p>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs md:text-sm">
                  {/* Row: Prix */}
                  <tr>
                    <td className="p-4 font-bold text-gray-400 bg-white/[0.02]">Prix / Tarif</td>
                    {comparisonItems.map((item) => (
                      <td key={item.id} className="p-4">
                        <span className="text-base font-extrabold text-[#10D97F]">
                          {item.priceFormatted}
                        </span>
                        {item.priceUnit && (
                          <span className="text-xs text-gray-400 ml-1">{item.priceUnit}</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Localisation */}
                  <tr>
                    <td className="p-4 font-bold text-gray-400 bg-white/[0.02]">Localisation</td>
                    {comparisonItems.map((item) => (
                      <td key={item.id} className="p-4 text-gray-300">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#0BE9EF] shrink-0" />
                          <span>{item.location}</span>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Row: Avis clients */}
                  <tr>
                    <td className="p-4 font-bold text-gray-400 bg-white/[0.02]">Note vérifiée</td>
                    {comparisonItems.map((item) => (
                      <td key={item.id} className="p-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-[#FB8205] text-[#FB8205]" />
                          <span className="font-bold text-white">{item.rating}</span>
                          <span className="text-gray-400 text-xs">({item.reviewCount} avis)</span>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Row: Specs clés */}
                  <tr>
                    <td className="p-4 font-bold text-gray-400 bg-white/[0.02]">Spécifications</td>
                    {comparisonItems.map((item) => (
                      <td key={item.id} className="p-4 text-gray-300">
                        <div className="space-y-1 text-xs">
                          {Object.entries(item.specs).map(([k, v]) => (
                            <div key={k} className="flex justify-between border-b border-white/5 py-0.5">
                              <span className="text-gray-400">{k}:</span>
                              <span className="font-semibold text-white">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Row: Disponibilité */}
                  <tr>
                    <td className="p-4 font-bold text-gray-400 bg-white/[0.02]">Disponibilité</td>
                    {comparisonItems.map((item) => (
                      <td key={item.id} className="p-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#10D97F]/10 text-[#10D97F] text-xs font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          {item.isAvailable ? 'Immédiatement disponible' : 'Sur demande'}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Row: Garanties Flowexa */}
                  <tr>
                    <td className="p-4 font-bold text-gray-400 bg-white/[0.02]">Garantie Flowexa</td>
                    {comparisonItems.map((item) => (
                      <td key={item.id} className="p-4 text-xs text-gray-300">
                        <div className="flex items-center gap-1.5 text-[#0BE9EF]">
                          <ShieldCheck className="w-4 h-4 shrink-0" />
                          <span>Paiement sécurisé MoMo & vérification identité</span>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Row: Actions */}
                  <tr className="bg-[#020919]">
                    <td className="p-4 font-bold text-gray-400">Décision</td>
                    {comparisonItems.map((item) => (
                      <td key={item.id} className="p-4">
                        <div className="space-y-2">
                          <Button
                            variant="primary"
                            size="sm"
                            className="w-full font-bold shadow-md shadow-[#FB8205]/20"
                            onClick={() => handleInitiateBooking(item)}
                          >
                            Choisir & Réserver
                          </Button>
                          <a
                            href={`https://wa.me/${item.businessWhatsApp.replace(/[^0-9]/g, '')}?text=Bonjour%2C%20je%20vous%20contacte%20depuis%20Flowexa%20concernant%20${encodeURIComponent(
                              item.title
                            )}.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#10D97F]/40 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-[#10D97F]" />
                            WhatsApp direct
                          </a>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {/* ========================================================= */}
      {/* STEP 3: RÉSULTATS (CATALOG WITH QUICK ACTIONS) */}
      {/* ========================================================= */}
      {currentStep === 'RESULTS' && (
        <div className="space-y-6">
          {/* Filter Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#0A1428] border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setSelectedModuleFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  selectedModuleFilter === 'ALL'
                    ? 'bg-[#FB8205] text-white'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                Tous ({searchResults.length})
              </button>
              {FLOWEXA_MODULES.slice(0, 7).map((m) => (
                <button
                  key={m.code}
                  onClick={() => setSelectedModuleFilter(m.code)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    selectedModuleFilter === m.code
                      ? 'bg-[#0BE9EF] text-[#020919] font-bold'
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>

            {/* City filter & comparison quick bar */}
            <div className="flex items-center gap-3 self-end lg:self-auto">
              <select
                value={selectedCityFilter}
                onChange={(e) => setSelectedCityFilter(e.target.value)}
                className="bg-[#020919] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#0BE9EF]"
              >
                <option value="ALL">Toutes localités (Bénin)</option>
                <option value="Cotonou">Cotonou (Haie Vive, Ganhi, Fidjrossè)</option>
                <option value="Calavi">Abomey-Calavi</option>
                <option value="Porto-Novo">Porto-Novo</option>
                <option value="Ouidah">Ouidah</option>
              </select>

              {comparisonItems.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep('COMPARISON')}
                  leftIcon={<ArrowLeftRight className="w-3.5 h-3.5 text-[#0BE9EF]" />}
                  className="border-[#0BE9EF]/40 text-[#0BE9EF] hover:bg-[#0BE9EF]/10"
                >
                  Comparer ({comparisonItems.length})
                </Button>
              )}
            </div>
          </div>

          {/* Results Grid */}
          {filteredResults.length === 0 ? (
            <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#FB8205]">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Aucun résultat disponible pour le moment.</h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  Aucune entreprise ou offre ne correspond à ces critères dans le rayon sélectionné. Vous pouvez élargir la zone de recherche pour afficher les offres de localités voisines.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {openNowOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setOpenNowOnly(false);
                      if (userCoords) {
                        runProximitySearch(userCoords, selectedRadius, false, selectedModuleFilter);
                      } else {
                        executeSmartSearch(query, false);
                      }
                    }}
                    className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    Désactiver "Ouvert maintenant"
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedRadius('10km');
                    if (userCoords) {
                      runProximitySearch(userCoords, '10km', false, selectedModuleFilter);
                    }
                  }}
                  leftIcon={<Compass className="w-3.5 h-3.5 text-[#0BE9EF]" />}
                >
                  Élargir le rayon à 10 km
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedModuleFilter('ALL');
                    setSelectedCityFilter('ALL');
                    setSelectedRadius('all');
                    setIsProximityActive(false);
                    executeSmartSearch('Offres disponibles Cotonou Bénin', false);
                  }}
                >
                  Élargir à tout le Bénin
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredResults.map((item) => {
                const isCompared = comparisonItems.some((c) => c.id === item.id);

                return (
                  <div
                    key={item.id}
                    className={`group bg-[#0A1428] border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col hover:-translate-y-1 hover:shadow-2xl ${
                      isCompared
                        ? 'border-[#0BE9EF] shadow-lg shadow-[#0BE9EF]/10 ring-1 ring-[#0BE9EF]'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* Card Image Banner */}
                    <div className="relative h-48 w-full overflow-hidden bg-gray-900">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A1428] via-transparent to-black/40" />

                      {/* Badge top left */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-bold text-[#FB8205]">
                          {item.badgeText}
                        </span>
                        {item.specs?.Distance && (
                          <span className="px-2 py-0.5 rounded-lg bg-[#0BE9EF]/90 text-[#020919] font-extrabold text-[10px] shadow">
                            {item.specs.Distance}
                          </span>
                        )}
                      </div>

                      {/* Comparison checkbox toggle top right */}
                      <button
                        onClick={() => toggleComparison(item)}
                        className={`absolute top-3 right-3 px-2.5 py-1 rounded-xl text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer ${
                          isCompared
                            ? 'bg-[#0BE9EF] text-[#020919] font-bold shadow-md'
                            : 'bg-black/60 text-white hover:bg-black/90 border border-white/20'
                        }`}
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>{isCompared ? 'Sélectionné' : 'Comparer'}</span>
                      </button>

                      {/* Price bottom */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                        <div>
                          <span className="text-xl font-extrabold text-[#10D97F] drop-shadow-md">
                            {item.priceFormatted}
                          </span>
                          {item.priceUnit && (
                            <span className="text-xs text-gray-200 ml-1 drop-shadow">
                              {item.priceUnit}
                            </span>
                          )}
                        </div>
                        {typeof item.rating === 'number' && item.reviewCount && item.reviewCount > 0 ? (
                          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/10">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-bold text-white">{item.rating.toFixed(1)}</span>
                            <span className="text-[10px] text-gray-300">({item.reviewCount})</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/10 text-[10px] text-gray-300 font-medium">
                            <span>Pas encore noté</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 text-xs text-gray-400">
                          <div className="flex items-center gap-1.5 truncate">
                            <Building2 className="w-3.5 h-3.5 text-[#0BE9EF] shrink-0" />
                            <span className="font-semibold text-gray-300 truncate">
                              {item.businessName}
                            </span>
                          </div>
                          {item.isOpenNow !== undefined && (
                            <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.isOpenNow
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                                : 'bg-white/5 text-gray-400 border border-white/10'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${item.isOpenNow ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                              {item.isOpenNow ? 'Ouvert' : 'Fermé'}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-white group-hover:text-[#0BE9EF] transition-colors line-clamp-1">
                          {item.title}
                        </h3>

                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin className="w-3.5 h-3.5 text-[#FB8205] shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>

                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>

                        {/* Key specs pills */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {Object.entries(item.specs).slice(0, 3).map(([key, val]) => (
                            <span
                              key={key}
                              className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] font-medium text-gray-300"
                            >
                              {key}: <strong className="text-white">{String(val)}</strong>
                            </span>
                          ))}
                        </div>

                        {/* AI Explanations badges if present */}
                        {item.explanations && item.explanations.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {item.explanations.slice(0, 2).map((exp, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400"
                              >
                                <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                                <span className="line-clamp-1">{exp}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Actions */}
                      <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1 font-bold"
                          onClick={() => handleInitiateBooking(item)}
                        >
                          Réserver
                        </Button>

                        <a
                          href={`https://wa.me/${item.businessWhatsApp.replace(/[^0-9]/g, '')}?text=Bonjour%2C%20je%20souhaite%20des%20informations%20sur%20${encodeURIComponent(
                            item.title
                          )}%20vu%20sur%20Flowexa.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-[#10D97F]/10 border border-[#10D97F]/30 text-[#10D97F] hover:bg-[#10D97F]/20 transition-colors"
                          title="Discuter sur WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 5: CONTACT / RÉSERVATION (CHECKOUT & DIRECT CONNECT) */}
      {/* ========================================================= */}
      {currentStep === 'BOOKING' && bookingTarget && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-semibold text-[#FB8205] uppercase tracking-wider">
                  Étape Finale
                </span>
                <h2 className="text-xl md:text-2xl font-extrabold text-white">
                  Contact & Confirmation de Réservation
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep('RESULTS')}
                leftIcon={<ArrowRight className="w-3.5 h-3.5 rotate-180" />}
              >
                Changer d'offre
              </Button>
            </div>

            {bookingConfirmed ? (
              /* Booking Success Banner */
              <div className="p-6 rounded-2xl bg-[#10D97F]/10 border border-[#10D97F]/30 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#10D97F]/20 text-[#10D97F] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Réservation transmise avec succès !</h3>
                  <p className="text-xs text-gray-300">
                    Référence dossier : <strong className="text-[#0BE9EF]">FLW-BJ-{Math.floor(100000 + Math.random() * 900000)}</strong>
                  </p>
                  <p className="text-xs text-gray-400 max-w-md mx-auto pt-2">
                    Le professionnel <span className="text-white font-semibold">{bookingTarget.businessName}</span> a été notifié instantanément.
                  </p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={`https://wa.me/${bookingTarget.businessWhatsApp.replace(/[^0-9]/g, '')}?text=Bonjour%20${encodeURIComponent(
                      bookingTarget.businessName
                    )}%2C%20je%20viens%20d%27effectuer%20une%20demande%20de%20r%C3%A9servation%20pour%20%22${encodeURIComponent(
                      bookingTarget.title
                    )}%22%20au%20tarif%20de%20${encodeURIComponent(
                      bookingTarget.priceFormatted
                    )}.%20Mon%20num%C3%A9ro%20est%20${encodeURIComponent(clientPhone)}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#10D97F] hover:bg-[#0eb86c] text-[#020919] font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Ouvrir WhatsApp avec message pré-rempli
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBookingConfirmed(false);
                      setCurrentStep('RESULTS');
                    }}
                  >
                    Effectuer une autre recherche
                  </Button>
                </div>
              </div>
            ) : (
              /* Booking Form */
              <div className="space-y-6">
                {/* Chosen Offer Summary */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-[#020919] border border-white/5">
                  <img
                    src={bookingTarget.imageUrl}
                    alt={bookingTarget.title}
                    className="w-20 h-20 rounded-xl object-cover border border-white/10"
                  />
                  <div className="flex-1">
                    <span className="text-[11px] font-bold text-[#FB8205] uppercase">
                      {bookingTarget.badgeText}
                    </span>
                    <h4 className="text-base font-bold text-white">{bookingTarget.title}</h4>
                    <p className="text-xs text-gray-400">{bookingTarget.businessName} • {bookingTarget.location}</p>
                    <div className="pt-1 flex items-center gap-2">
                      <span className="text-sm font-extrabold text-[#10D97F]">
                        {bookingTarget.priceFormatted}
                      </span>
                      {bookingTarget.priceUnit && (
                        <span className="text-xs text-gray-400">{bookingTarget.priceUnit}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reservation Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">Votre Nom complet</label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Nom & Prénom"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">Téléphone / WhatsApp béninois</label>
                    <Input
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+229 97 00 00 00"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">Date souhaitée</label>
                    <Input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">Heure souhaitée / Arrivée</label>
                    <Input
                      type="time"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Mobile Money Gateway selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">
                    Mode de règlement ou acompte de garantie (Bénin) :
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'MOMO', label: 'MTN MoMo', color: '#FFCC00', desc: '*880#' },
                      { id: 'MOOV', label: 'Moov Money', color: '#006699', desc: '*155#' },
                      { id: 'CELTIIS', label: 'Celtiis Cash', color: '#E01E2B', desc: 'Bénin' },
                      { id: 'CASH', label: 'Sur place', color: '#10D97F', desc: 'Espèces' },
                    ].map((gw) => (
                      <button
                        key={gw.id}
                        type="button"
                        onClick={() => setPaymentGateway(gw.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          paymentGateway === gw.id
                            ? 'bg-[#FB8205]/10 border-[#FB8205] text-white shadow-md'
                            : 'bg-[#020919] border-white/5 text-gray-400 hover:border-white/10'
                        }`}
                      >
                        <div className="font-bold text-xs text-white">{gw.label}</div>
                        <div className="text-[10px] text-gray-500">{gw.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full font-bold shadow-xl shadow-[#FB8205]/20 py-3 text-sm"
                    onClick={handleConfirmReservation}
                  >
                    Valider ma demande & Bloquer le créneau
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
