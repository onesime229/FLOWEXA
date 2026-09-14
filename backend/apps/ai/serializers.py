from rest_framework import serializers


class AIRecommendationRequestSerializer(serializers.Serializer):
    contact_id = serializers.UUIDField(required=True)
    business_id = serializers.UUIDField(required=False, allow_null=True)


class AIMatchingRequestSerializer(serializers.Serializer):
    demande_id = serializers.UUIDField(required=False, allow_null=True)
    query = serializers.CharField(required=False, allow_blank=True, default="")
    business_id = serializers.UUIDField(required=False, allow_null=True)


class AIAnalysisRequestSerializer(serializers.Serializer):
    contact_id = serializers.UUIDField(required=True)
    business_id = serializers.UUIDField(required=False, allow_null=True)


class AIPredictionRequestSerializer(serializers.Serializer):
    business_id = serializers.UUIDField(required=True)


class AIAssistantRequestSerializer(serializers.Serializer):
    prompt = serializers.CharField(required=True)
    business_id = serializers.UUIDField(required=False, allow_null=True)
    contact_id = serializers.UUIDField(required=False, allow_null=True)
    context = serializers.DictField(required=False, default=dict)
