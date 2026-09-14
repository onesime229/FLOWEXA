from rest_framework import serializers


class SearchQuerySerializer(serializers.Serializer):
    q = serializers.CharField(
        required=True,
        help_text="Phrase de recherche en langage naturel. Ex: 'Je cherche un studio à Cotonou pour 100 000 FCFA.'"
    )
    save_as_crm_demande = serializers.BooleanField(
        required=False,
        default=False,
        help_text="Enregistrer automatiquement la requête comme une Demande dans le CRM"
    )
    contact_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        help_text="ID du contact CRM associé si save_as_crm_demande est activé"
    )


class SearchCriteriaSerializer(serializers.Serializer):
    raw_query = serializers.CharField()
    module = serializers.CharField()
    module_display = serializers.CharField()
    type = serializers.CharField()
    location = serializers.CharField()
    budget_min = serializers.IntegerField(allow_null=True)
    budget_max = serializers.IntegerField(allow_null=True)
    currency = serializers.CharField()
    action = serializers.CharField()
    features = serializers.ListField(child=serializers.CharField())
    confidence = serializers.FloatField()
