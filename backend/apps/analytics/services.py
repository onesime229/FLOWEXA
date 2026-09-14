from typing import Dict, Any, Optional
from django.db.models import Sum, Count, Avg, Q
from apps.businesses.models import Business, BusinessModule
from apps.crm.models import (
    Contact,
    BusinessRelation,
    Interaction,
    Demande,
    RelationType,
    PipelineStage,
    DemandeStatus,
)


class AnalyticsService:
    """
    Moteur de calcul et d'agrégation d'analytics pour le CRM et l'écosystème Flowexa.
    """

    @classmethod
    def get_overview(cls, tenant_id: Optional[str] = None, business_id: Optional[str] = None) -> Dict[str, Any]:
        contacts_qs = Contact.objects.filter(is_active=True)
        relations_qs = BusinessRelation.objects.filter(is_active=True)
        demandes_qs = Demande.objects.filter(is_active=True)
        interactions_qs = Interaction.objects.filter(is_active=True)

        if tenant_id:
            contacts_qs = contacts_qs.filter(tenant_id=tenant_id)
            relations_qs = relations_qs.filter(business__tenant_id=tenant_id)
            demandes_qs = demandes_qs.filter(tenant_id=tenant_id)
            interactions_qs = interactions_qs.filter(business__tenant_id=tenant_id)

        if business_id:
            relations_qs = relations_qs.filter(business_id=business_id)
            demandes_qs = demandes_qs.filter(business_id=business_id)
            interactions_qs = interactions_qs.filter(business_id=business_id)

        # 1. Clients & Prospects
        total_contacts = contacts_qs.count()
        total_relations = relations_qs.count()
        clients_count = relations_qs.filter(relation_type__in=[RelationType.CLIENT, RelationType.VIP]).count()
        prospects_count = relations_qs.filter(relation_type=RelationType.PROSPECT).count()
        vip_count = relations_qs.filter(relation_type=RelationType.VIP).count()

        # 2. Revenus
        total_revenue = float(relations_qs.aggregate(Sum('lifetime_value'))['lifetime_value__sum'] or 0)
        avg_ltv = (total_revenue / clients_count) if clients_count > 0 else 0

        # 3. Demandes & Réservations
        total_demandes = demandes_qs.count()
        fulfilled_demandes = demandes_qs.filter(status=DemandeStatus.FULFILLED).count()
        open_demandes = demandes_qs.filter(status__in=[DemandeStatus.OPEN, DemandeStatus.IN_PROGRESS]).count()

        # 4. Taux de conversion global
        conversion_rate = (clients_count / total_relations * 100) if total_relations > 0 else 0

        # 5. Répartition par étape de pipeline
        pipeline_breakdown = {}
        for st in PipelineStage:
            pipeline_breakdown[st.value] = relations_qs.filter(stage=st.value).count()

        # 6. Répartition des demandes par module
        module_breakdown = list(
            demandes_qs.values('module_code')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        return {
            'clients_prospects': {
                'total_contacts': total_contacts,
                'total_relations': total_relations,
                'active_clients': clients_count,
                'prospects': prospects_count,
                'vip_clients': vip_count,
                'conversion_rate_percentage': round(conversion_rate, 1),
            },
            'revenue': {
                'total_revenue_xof': total_revenue,
                'average_client_ltv_xof': round(avg_ltv, 2),
                'currency': 'XOF'
            },
            'demandes_reservations': {
                'total_demandes': total_demandes,
                'open_in_progress': open_demandes,
                'fulfilled_count': fulfilled_demandes,
                'success_rate_percentage': round((fulfilled_demandes / total_demandes * 100) if total_demandes > 0 else 0, 1),
                'by_module': module_breakdown,
            },
            'pipeline_funnel': pipeline_breakdown,
            'interactions_count': interactions_qs.count(),
        }

    @classmethod
    def get_conversions(cls, tenant_id: Optional[str] = None, business_id: Optional[str] = None) -> Dict[str, Any]:
        relations_qs = BusinessRelation.objects.filter(is_active=True)
        if tenant_id:
            relations_qs = relations_qs.filter(business__tenant_id=tenant_id)
        if business_id:
            relations_qs = relations_qs.filter(business_id=business_id)

        total = relations_qs.count()
        new_leads = relations_qs.filter(stage=PipelineStage.NEW).count()
        contacted = relations_qs.filter(stage=PipelineStage.CONTACTED).count()
        qualified = relations_qs.filter(stage=PipelineStage.QUALIFIED).count()
        proposals = relations_qs.filter(stage=PipelineStage.PROPOSAL).count()
        in_progress = relations_qs.filter(stage=PipelineStage.IN_PROGRESS).count()
        won = relations_qs.filter(stage=PipelineStage.WON).count()
        lost = relations_qs.filter(stage=PipelineStage.LOST).count()

        funnel = [
            {'stage': 'Nouveau Lead', 'code': 'NEW', 'count': new_leads, 'percentage': round((new_leads / total * 100) if total else 0, 1)},
            {'stage': 'Contacté', 'code': 'CONTACTED', 'count': contacted, 'percentage': round((contacted / total * 100) if total else 0, 1)},
            {'stage': 'Besoin Qualifié', 'code': 'QUALIFIED', 'count': qualified, 'percentage': round((qualified / total * 100) if total else 0, 1)},
            {'stage': 'Proposition / Devis', 'code': 'PROPOSAL', 'count': proposals, 'percentage': round((proposals / total * 100) if total else 0, 1)},
            {'stage': 'Prestation / Visite', 'code': 'IN_PROGRESS', 'count': in_progress, 'percentage': round((in_progress / total * 100) if total else 0, 1)},
            {'stage': 'Gagné (Client Converti)', 'code': 'WON', 'count': won, 'percentage': round((won / total * 100) if total else 0, 1)},
        ]

        return {
            'total_opportunities': total,
            'won_count': won,
            'lost_count': lost,
            'win_rate_percentage': round((won / (won + lost) * 100) if (won + lost) > 0 else 0, 1),
            'funnel': funnel
        }

    @classmethod
    def get_business_performances(cls, tenant_id: Optional[str] = None) -> Dict[str, Any]:
        businesses_qs = Business.objects.filter(is_active=True)
        if tenant_id:
            businesses_qs = businesses_qs.filter(tenant_id=tenant_id)

        performances = []
        for biz in businesses_qs:
            relations = BusinessRelation.objects.filter(business=biz, is_active=True)
            total_rel = relations.count()
            won_rel = relations.filter(stage=PipelineStage.WON).count()
            revenue = float(relations.aggregate(Sum('lifetime_value'))['lifetime_value__sum'] or 0)
            demandes_count = Demande.objects.filter(business=biz, is_active=True).count()
            interactions_count = Interaction.objects.filter(business=biz, is_active=True).count()

            performances.append({
                'business_id': str(biz.id),
                'business_name': biz.name,
                'module_code': biz.module_code,
                'module_display': biz.get_module_code_display(),
                'city': biz.city,
                'total_clients_prospects': total_rel,
                'won_clients': won_rel,
                'conversion_rate': round((won_rel / total_rel * 100) if total_rel > 0 else 0, 1),
                'total_revenue_xof': revenue,
                'demandes_count': demandes_count,
                'interactions_count': interactions_count
            })

        performances.sort(key=lambda x: x['total_revenue_xof'], reverse=True)

        return {
            'businesses_count': len(performances),
            'performances': performances
        }
