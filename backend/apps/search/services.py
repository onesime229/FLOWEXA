import re
import os
from typing import Dict, Any, Optional, List
from django.db.models import Q
from apps.businesses.models import Business, BusinessModule
from apps.crm.models import Demande, Contact


class SmartSearchParser:
    """
    Analyseur sémantique de requêtes en langage naturel pour Flowexa.
    Exemple: « Je cherche un studio à Cotonou pour 100 000 FCFA. »
    Transforme la phrase en critères structurés :
    - module: 'IMMOBILIER'
    - type: 'studio'
    - location: 'Cotonou'
    - budget_max: 100000
    - action: 'location'
    """

    CITIES_AND_DISTRICTS = [
        'cotonou', 'abomey-calavi', 'calavi', 'porto-novo', 'ouidah', 'parakou',
        'haie vive', 'cadjehoun', 'akpakpa', 'fidjrosse', 'gbegamey', 'agla',
        'menontin', 'zogbo', 'kouhounou', 'sainte rita', 'cocotomey', 'arconville',
        'tankpe', 'godomey', 'maro-militaire', 'patte d\'oie', 'placodji'
    ]

    MODULE_KEYWORDS = {
        BusinessModule.IMMOBILIER: [
            'studio', 'appartement', 'villa', 'maison', 'immeuble', 'terrain', 'parcelle',
            'bureau', 'magasin', 'boutique', 'chambre salon', '2 pièces', '3 pièces',
            '4 pièces', 'duplex', 'meublé', 'bailleur', 'loyer', 'louer', 'location',
            'acheter', 'vente', 'colocation'
        ],
        BusinessModule.GUEST_HOUSE: [
            'guest house', 'guesthouse', 'chambre d\'hôte', 'nuitée', 'court séjour',
            'hôtel', 'chambre climatisée', 'suite', 'hébergement', 'bungalow',
            'séjour', 'nuit'
        ],
        BusinessModule.SPA_MASSAGE: [
            'spa', 'massage', 'hammam', 'sauna', 'gommage', 'détente', 'relaxation',
            'corps', 'huiles', 'visage', 'soin visage'
        ],
        BusinessModule.COIFFURE: [
            'coiffure', 'tresses', 'perruque', 'shampoing', 'brushing', 'tissage',
            'nattes', 'locks', 'salon de coiffure'
        ],
        BusinessModule.BARBIER: [
            'barbier', 'barbe', 'dégradé', 'tondeuse', 'coupe homme', 'rasage'
        ],
        BusinessModule.INSTITUT_COSMETIQUE: [
            'onglerie', 'manucure', 'pédicure', 'vernis', 'maquillage', 'makeup',
            'cils', 'sourcils', 'épilation', 'teint'
        ],
        BusinessModule.PHOTOGRAPHE: [
            'photo', 'photographe', 'shooting', 'studio photo', 'mariage photo',
            'portrait', 'vidéaste'
        ],
        BusinessModule.GARAGE: [
            'garage', 'mécanicien', 'vidange', 'pneus', 'freins', 'climatisation auto',
            'moteur', 'révision'
        ],
        BusinessModule.PHARMACIE: [
            'pharmacie', 'médicament', 'ordonnance', 'parapharmacie', 'santé'
        ],
    }

    PROPERTY_TYPES = [
        'studio', 'appartement', 'villa', 'maison', 'chambre salon', 'chambre',
        'terrain', 'parcelle', 'bureau', 'duplex', 'loft', 'suite'
    ]

    SERVICE_TYPES = [
        'massage', 'soin du visage', 'gommage', 'manucure', 'pédicure', 'coupe',
        'tresses', 'barbe', 'shooting photo', 'vidange', 'révision'
    ]

    @classmethod
    def parse_query(cls, text: str) -> Dict[str, Any]:
        cleaned = text.strip()
        lower_text = cleaned.lower()

        # 1. Detect module
        detected_module = None
        max_matches = 0
        for mod, keywords in cls.MODULE_KEYWORDS.items():
            matches = sum(1 for kw in keywords if kw in lower_text)
            if matches > max_matches:
                max_matches = matches
                detected_module = mod

        # Default module if unspecified but "studio/villa" present
        if not detected_module:
            if any(pt in lower_text for pt in cls.PROPERTY_TYPES):
                detected_module = BusinessModule.IMMOBILIER

        # 2. Detect item type
        detected_type = None
        for pt in cls.PROPERTY_TYPES + cls.SERVICE_TYPES:
            if pt in lower_text:
                detected_type = pt
                break

        # 3. Detect location
        detected_location = None
        for loc in cls.CITIES_AND_DISTRICTS:
            if re.search(rf'\b{re.escape(loc)}\b', lower_text):
                # Title case for location
                detected_location = loc.title()
                break

        # 4. Detect budget
        budget_min, budget_max = cls._extract_budgets(lower_text)

        # 5. Detect action
        action = 'information'
        if any(w in lower_text for w in ['louer', 'location', 'cherche location']):
            action = 'location'
        elif any(w in lower_text for w in ['acheter', 'achat', 'vente']):
            action = 'achat'
        elif any(w in lower_text for w in ['réserver', 'reservation', 'réservation', 'nuitée']):
            action = 'reservation'
        elif any(w in lower_text for w in ['rendez-vous', 'rdv', 'soin']):
            action = 'rendez-vous'

        # 6. Extract features / attributes
        features = []
        for feat in ['climatisé', 'meublé', 'piscine', 'wifi', 'balcon', 'garage', 'gardien', 'sécurisé']:
            if feat in lower_text:
                features.append(feat)

        return {
            'raw_query': cleaned,
            'module': detected_module or BusinessModule.IMMOBILIER,
            'module_display': dict(BusinessModule.choices).get(detected_module, 'Immobilier') if detected_module else 'Immobilier',
            'type': detected_type or 'général',
            'location': detected_location or 'Cotonou',
            'budget_min': budget_min,
            'budget_max': budget_max,
            'currency': 'XOF',
            'action': action,
            'features': features,
            'confidence': 0.95 if (detected_module and detected_location and budget_max) else 0.80,
        }

    @classmethod
    def _extract_budgets(cls, text: str) -> tuple[Optional[int], Optional[int]]:
        """Extrait budget_min et budget_max à partir du texte."""
        budget_min = None
        budget_max = None

        # Pattern: entre X et Y
        between_match = re.search(r'entre\s+([0-9\s]+k?)\s+et\s+([0-9\s]+k?)', text)
        if between_match:
            budget_min = cls._parse_number(between_match.group(1))
            budget_max = cls._parse_number(between_match.group(2))
            return budget_min, budget_max

        # Pattern: pour X FCFA / moins de X / max X
        max_patterns = [
            r'pour\s+([0-9\s]+(?:k|milles?|fcfa|xof|f)?)',
            r'moins\s+de\s+([0-9\s]+(?:k|milles?|fcfa|xof|f)?)',
            r'max(?:imum)?\s+([0-9\s]+(?:k|milles?|fcfa|xof|f)?)',
            r'budget\s*(?:de)?\s*([0-9\s]+(?:k|milles?|fcfa|xof|f)?)',
            r'à\s+([0-9\s]+)\s*(?:fcfa|xof|f)\b',
        ]
        for pat in max_patterns:
            m = re.search(pat, text)
            if m:
                val = cls._parse_number(m.group(1))
                if val and val > 100:
                    budget_max = val
                    break

        # Fallback: find any number followed by fcfa/xof/f or > 1000
        if not budget_max:
            currency_match = re.search(r'([0-9\s]{3,})\s*(?:fcfa|xof|f\b)', text)
            if currency_match:
                budget_max = cls._parse_number(currency_match.group(1))

        return budget_min, budget_max

    @classmethod
    def _parse_number(cls, num_str: str) -> Optional[int]:
        s = num_str.lower().strip()
        # Remove currency words
        s = re.sub(r'(fcfa|xof|f|frs|francs)', '', s).strip()
        multiplier = 1
        if 'k' in s:
            multiplier = 1000
            s = s.replace('k', '')
        if 'mille' in s:
            multiplier = 1000
            s = s.replace('mille', '').replace('s', '')

        s = re.sub(r'[\s\.,]', '', s)
        try:
            return int(s) * multiplier
        except ValueError:
            return None


class NaturalLanguageSearchService:
    """
    Exécute la recherche intelligente multi-modules et multi-entreprises.
    """

    @classmethod
    def search(cls, query: str, user=None, save_as_crm_demande=False, contact_id=None) -> Dict[str, Any]:
        criteria = SmartSearchParser.parse_query(query)

        module = criteria['module']
        location = criteria['location']
        budget_max = criteria['budget_max']
        item_type = criteria['type']

        # 1. Matching Businesses
        business_qs = Business.objects.filter(
            is_active=True
        ).filter(
            Q(module_code=module) | Q(enabled_modules__contains=module)
        )
        if location:
            business_qs = business_qs.filter(
                Q(city__icontains=location) |
                Q(address__icontains=location) |
                Q(name__icontains=location)
            )

        matched_businesses = [
            {
                'id': str(b.id),
                'name': b.name,
                'module_code': b.module_code,
                'city': b.city,
                'address': b.address,
                'phone': b.phone,
                'email': b.email,
                'rating': 4.8,
                'match_reason': f"Établissement situé à {b.city} avec module {b.get_module_code_display()}"
            }
            for b in business_qs[:10]
        ]

        # 2. Matching Demandes in CRM (for cross-matching / agents)
        demandes_qs = Demande.objects.filter(is_active=True, module_code=module)
        if location:
            demandes_qs = demandes_qs.filter(Q(location__icontains=location) | Q(title__icontains=location))
        if budget_max:
            demandes_qs = demandes_qs.filter(budget_max__lte=budget_max * 1.3)

        matched_demandes = [
            {
                'id': str(d.id),
                'title': d.title,
                'contact_name': d.contact.full_name,
                'location': d.location,
                'budget_max': d.budget_max,
                'status': d.status
            }
            for d in demandes_qs[:5]
        ]

        # 3. Optional: Automatically record query as a Demande in CRM
        created_demande = None
        if save_as_crm_demande and contact_id:
            try:
                contact = Contact.objects.get(id=contact_id)
                first_biz = business_qs.first()
                demande = Demande.objects.create(
                    contact=contact,
                    business=first_biz,
                    tenant=contact.tenant,
                    module_code=module,
                    title=f"Recherche: {item_type} à {location}",
                    description=query,
                    budget_max=budget_max,
                    location=location,
                    criteria=criteria
                )
                created_demande = {
                    'id': str(demande.id),
                    'title': demande.title,
                    'status': demande.status
                }
            except Contact.DoesNotExist:
                pass

        return {
            'query': query,
            'criteria': criteria,
            'results': {
                'businesses_count': len(matched_businesses),
                'businesses': matched_businesses,
                'similar_demandes': matched_demandes,
            },
            'saved_demande': created_demande
        }
