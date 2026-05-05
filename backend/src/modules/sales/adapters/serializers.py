from rest_framework import serializers

class CheckoutItemSerializer(serializers.Serializer):
    item_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)

class CheckoutRequestSerializer(serializers.Serializer):
    local_id = serializers.CharField(max_length=36)
    barber_id = serializers.UUIDField()
    discount = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=0, default=0
    )
    items = CheckoutItemSerializer(many=True, min_length=1)

class VoidRequestSerializer(serializers.Serializer):
    void_reason = serializers.CharField(required=False, allow_blank=True, default="")

class CommissionQuerySerializer(serializers.Serializer):
    barber_id = serializers.UUIDField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    page = serializers.IntegerField(min_value=1, default=1)
    per_page = serializers.IntegerField(min_value=1, max_value=100, default=50)
