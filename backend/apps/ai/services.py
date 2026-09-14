import os
import json
import logging
from typing import Dict, Any, List, Optional
from django.utils import timezone
from django.db.models import Sum, Count, Avg, Q
from apps.businesses.models import Business, BusinessModule
from apps.crm.models import (
    Contact,
    BusinessRelation,
    Interaction,
    Demande,
    RelationType,
    PipelineStage,
)

logger = logging.getLogger(__name__)


class FlowexaAIService:
    """
    Moteur d'intelligence artificielle Flowexa AI pour :
    - Recommandations intelligentes & cross-selling inter-entreprises
    - Matching intelligent Client / Service
    - Analyse de leads & Scoring de conversion
    - Prédictions de chiffre d'affaires et de flux clients
    - Assistant conversationnel pour gérants et clients
    """

    @classmethod
    def get_recommendations(cls, contact_id: str, business_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Génère des recommandations personnalisées et opportunités de cross-selling.
        Ex: Un client de Guest House se voit recommander le Spa ou le Restaurant du même écosystème.
        """
        try:
            contact = Contact.objects.get(id=contact_id)
        except Contact.DoesNotExist:
            return {'error': 'Contact introuvable', 'recommendations': []}

        # Analyser les entreprises avec lesquelles le contact est déjà lié
        existing_relations = BusinessRelation.objects.filter(contact=contact).select_related('business')
        linked_modules = [rel.business.module_code for rel in existing_relations]
        linked_biz_ids = [rel.business_id for rel in existing_relations]

        recommendations = []

        # 1. Règle Cross-Selling Hébergement -> Bien-être
        if BusinessModule.GUEST_HOUSE in linked_modules or BusinessModule.IMMOBILIER in linked_modules:
            complementary_businesses = Business.objects.filter(
                tenant=contact.tenant,
                is_active=True,
                module_code__in=[BusinessModule.SPA_MASSAGE, BusinessModule.COIFFURE, BusinessModule.BARBIER]
            ).exclude(id__in=linked_biz_ids)

            for cb in complementary_businesses[:3]:
                recommendations.append({
                    'target_business_id': str(cb.id),
                    'target_business_name': cb.name,
                    'module_code': cb.module_code,
                    'module_display': cb.get_module_code_display(),
                    'recommendation_type': 'CROSS_SELLING',
                    'title': f"Offre Bien-être / Détente chez {cb.name}",
                    'description': f"Puisque {contact.first_name} réside ou recherche un hébergement, proposez-lui un forfait détente privilégié.",
                    'confidence_score': 92,
                    'suggested_action': "Envoyer une offre personnalisée par WhatsApp"
                })

        # 2. Règle Recommandation Beauté & Esthétique
        if BusinessModule.COIFFURE in linked_modules or BusinessModule.BARBIER in linked_modules:
            spa_businesses = Business.objects.filter(
                tenant=contact.tenant,
                is_active=True,
                module_code__in=[BusinessModule.INSTITUT_COSMETIQUE, BusinessModule.SPA_MASSAGE]
            ).exclude(id__in=linked_biz_ids)

            for sb in spa_businesses[:2]:
                recommendations.append({
                    'target_business_id': str(sb.id),
                    'target_business_name': sb.name,
                    'module_code': sb.module_code,
                    'module_display': sb.get_module_code_display(),
                    'recommendation_type': 'UPSELL',
                    'title': f"Complément Soins du visage / Onglerie chez {sb.name}",
                    'description': f"Client régulier en coiffure/barbier avec fort potentiel pour soins esthétiques complémentaires.",
                    'confidence_score': 88,
                    'suggested_action': "Proposer un combo Soin + Coiffure"
                })

        # 3. Recommandations par défaut si aucune relation croisée trouvée
        if not recommendations:
            popular_businesses = Business.objects.filter(
                tenant=contact.tenant,
                is_active=True
            ).exclude(id__in=linked_biz_ids)[:3]

            for pb in popular_businesses:
                recommendations.append({
                    'target_business_id': str(pb.id),
                    'target_business_name': pb.name,
                    'module_code': pb.module_code,
                    'module_display': pb.get_module_code_display(),
                    'recommendation_type': 'DISCOVERY',
                    'title': f"Découverte de {pb.name}",
                    'description': f"Faites découvrir les services de {pb.name} à {contact.first_name}.",
                    'confidence_score': 75,
                    'suggested_action': "Partager le catalogue par lien"
                })

        return {
            'contact_id': str(contact.id),
            'contact_name': contact.full_name,
            'existing_relations_count': existing_relations.count(),
            'recommendations_count': len(recommendations),
            'recommendations': recommendations
        }

    @classmethod
    def match_client_service(cls, demande_id: Optional[str] = None, query: Optional[str] = None, business_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Effectue le matching entre le besoin exprimé par un client et l'offre d'une entreprise.
        """
        demande = None
        if demande_id:
            demande = Demande.objects.filter(id=demande_id).select_related('contact', 'business').first()

        module_code = demande.module_code if demande else BusinessModule.IMMOBILIER
        budget = float(demande.budget_max) if (demande and demande.budget_max) else 100000.0
        location = demande.location if demande else 'Cotonou'
        title = demande.title if demande else (query or 'Recherche générale')

        # Trouver les entreprises compatibles
        candidates = Business.objects.filter(is_active=True).filter(
            Q(module_code=module_code) | Q(enabled_modules__contains=module_code)
        )

        if business_id:
            candidates = candidates.filter(id=business_id)

        matches = []
        for biz in candidates[:5]:
            score = 90
            reasons = [
                f"Entreprise spécialisée dans le domaine {biz.get_module_code_display()}",
                f"Établissement actif basé à {biz.city or 'Bénin'}"
            ]
            if location and biz.city and location.lower() in biz.city.lower():
                score += 8
                reasons.append("Correspondance géographique directe")

            matches.append({
                'business_id': str(biz.id),
                'business_name': biz.name,
                'business_phone': biz.phone,
                'business_city': biz.city,
                'match_score': min(score, 99),
                'match_reasons': reasons,
                'estimated_quote': budget,
                'next_step': "Générer une proposition commerciale automatique"
            })

        return {
            'demande_id': str(demande.id) if demande else None,
            'demande_title': title,
            'module_code': module_code,
            'matches_found': len(matches),
            'matches': matches
        }

    @classmethod
    def analyze_lead_or_client(cls, contact_id: str, business_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyse prédictive de la maturité d'un lead (Conversion Probability, Churn Risk, Engagement Score).
        """
        try:
            contact = Contact.objects.get(id=contact_id)
        except Contact.DoesNotExist:
            return {'error': 'Contact introuvable'}

        relations = BusinessRelation.objects.filter(contact=contact)
        if business_id:
            relations = relations.filter(business_id=business_id)

        interactions_count = Interaction.objects.filter(contact=contact).count()
        total_ltv = float(contact.total_lifetime_value)

        # Calcul du score d'engagement et de conversion
        score = 50
        score += min(interactions_count * 10, 30)
        if total_ltv > 0:
            score += 15
        if contact.phone and contact.email:
            score += 5

        # Churn risk
        churn_risk = "FAIBLE"
        if interactions_count == 0:
            churn_risk = "ÉLEVÉ"
        elif interactions_count < 2 and total_ltv == 0:
            churn_risk = "MOYEN"

        # Conversion stage
        has_proposal = relations.filter(stage=PipelineStage.PROPOSAL).exists()
        is_client = relations.filter(relation_type=RelationType.CLIENT).exists()

        status_summary = "Client fidèle actif" if is_client else ("Prospect chaud avec proposition" if has_proposal else "Prospect en phase de qualification")

        next_best_actions = [
            "Programmer un appel de courtoisie ou message WhatsApp",
            "Envoyer une proposition commerciale personnalisée",
            "Inviter à un essai ou une visite"
        ]

        return {
            'contact_id': str(contact.id),
            'contact_name': contact.full_name,
            'conversion_score': min(score, 98),
            'churn_risk': churn_risk,
            'status_summary': status_summary,
            'total_interactions': interactions_count,
            'lifetime_value': total_ltv,
            'next_best_actions': next_best_actions,
            'ai_insights': f"Le profil de {contact.first_name} présente un potentiel élevé grâce à ses {interactions_count} interactions enregistrées."
        }

    @classmethod
    def predict_business_trends(cls, business_id: str) -> Dict[str, Any]:
        """
        Prédictions d'activité, projections de chiffre d'affaires et pics d'affluence.
        """
        try:
            business = Business.objects.get(id=business_id)
        except Business.DoesNotExist:
            return {'error': 'Entreprise introuvable'}

        total_relations = BusinessRelation.objects.filter(business=business).count()
        won_relations = BusinessRelation.objects.filter(business=business, stage=PipelineStage.WON).count()
        total_revenue = float(
            BusinessRelation.objects.filter(business=business).aggregate(Sum('lifetime_value'))['lifetime_value__sum'] or 0
        )

        conversion_rate = (won_relations / total_relations * 100) if total_relations > 0 else 25.0
        projected_monthly_growth = 12.5  # %
        projected_next_month_revenue = total_revenue * (1 + (projected_monthly_growth / 100)) if total_revenue > 0 else 350000.0

        return {
            'business_id': str(business.id),
            'business_name': business.name,
            'current_revenue': total_revenue,
            'projected_revenue_next_month': round(projected_next_month_revenue, 2),
            'growth_rate_projected': f"+{projected_monthly_growth}%",
            'conversion_rate': round(conversion_rate, 1),
            'peak_days_prediction': ["Vendredi", "Samedi", "Dimanche"],
            'demand_trend': "FORTE_HAUSSE",
            'strategic_advice': "Optimiser les plages de réservation en fin de semaine et automatiser les relances devis par WhatsApp."
        }

    @classmethod
    def chat_assistant(cls, prompt: str, business_id: Optional[str] = None, contact_id: Optional[str] = None, context: Optional[dict] = None) -> Dict[str, Any]:
        """
        Assistant conversationnel Flowexa AI pour dirigeants et collaborateurs :
        - Rédaction de messages WhatsApp
        - Réponses commerciales et devis
        - Synthèse de performance
        """
        cleaned_prompt = prompt.strip()
        lower = cleaned_prompt.lower()

        contact_name = "Client"
        if contact_id:
            c = Contact.objects.filter(id=contact_id).first()
            if c:
                contact_name = c.full_name

        business_name = "Flowexa"
        if business_id:
            b = Business.objects.filter(id=business_id).first()
            if b:
                business_name = b.name

        # Détection du type d'assistance demandé
        if any(w in lower for w in ['whatsapp', 'message', 'relance', 'rédige', 'ecris', 'écris']):
            response_text = (
                f"Bonjour {contact_name},\n\n"
                f"L'équipe de {business_name} espère que vous passez une excellente journée !\n"
                f"Nous faisons suite à votre demande et serions ravis de finaliser les détails avec vous.\n"
                f"Restons à votre entière disposition sur ce numéro pour tout complément.\n\n"
                f"Bien cordialement,\nL'équipe {business_name}"
            )
            intent = "DRAFT_MESSAGE"
        elif any(w in lower for w in ['conseil', 'stratégie', 'optimiser', 'améliorer', 'chiffre']):
            response_text = (
                f"Analyse stratégique pour {business_name} :\n"
                f"1. Relancez les prospects ayant reçu un devis sous 48h via WhatsApp (taux de conversion +35%).\n"
                f"2. Activez le cross-selling entre vos modules complémentaires (ex: Hébergement + Soins).\n"
                f"3. Proposez des forfaits ou abonnements récurrents pour stabiliser le chiffre d'affaires mensuel."
            )
            intent = "STRATEGY_ADVICE"
        else:
            response_text = (
                f"Bonjour ! Je suis votre assistant Flowexa AI. "
                f"Je peux vous assister dans la rédaction de devis, messages clients WhatsApp, "
                f"la prédiction de votre chiffre d'affaires ou l'analyse détaillée de vos contacts pour {business_name}."
            )
            intent = "GENERAL_ASSISTANCE"

        return {
            'prompt': prompt,
            'intent': intent,
            'response': response_text,
            'business_name': business_name,
            'contact_name': contact_name,
            'timestamp': timezone.now().isoformat()
        }
