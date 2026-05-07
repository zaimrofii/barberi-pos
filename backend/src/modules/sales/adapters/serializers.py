from rest_framework import serializers
from src.infrastructure.database.models import Barber, Item


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


class CheckoutResponseSerializer(serializers.Serializer):
    transaction_id = serializers.UUIDField()
    status = serializers.CharField()
    total = serializers.DecimalField(max_digits=10, decimal_places=2)


class VoidRequestSerializer(serializers.Serializer):
    void_reason = serializers.CharField(required=False, allow_blank=True, default="")


class VoidResponseSerializer(serializers.Serializer):
    transaction_id = serializers.UUIDField()
    status = serializers.CharField()


class ErrorResponseSerializer(serializers.Serializer):
    error = serializers.CharField()
    detail = serializers.CharField(required=False, allow_blank=True)
    transaction_id = serializers.UUIDField(required=False)


class CommissionQuerySerializer(serializers.Serializer):
    barber_id = serializers.UUIDField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    page = serializers.IntegerField(min_value=1, default=1)
    per_page = serializers.IntegerField(min_value=1, max_value=100, default=50)


class CommissionItemSerializer(serializers.Serializer):
    transaction_id = serializers.UUIDField()
    item_id = serializers.UUIDField()
    quantity = serializers.IntegerField()
    price_at_sale = serializers.DecimalField(max_digits=10, decimal_places=2)
    commission_rate = serializers.DecimalField(max_digits=5, decimal_places=4)
    commission_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    created_at = serializers.DateTimeField()


class CommissionResponseSerializer(serializers.Serializer):
    barber_id = serializers.UUIDField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    total_commission = serializers.DecimalField(max_digits=10, decimal_places=2)
    page = serializers.IntegerField()
    per_page = serializers.IntegerField()
    items = CommissionItemSerializer(many=True)


class BarberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Barber
        fields = ['id', 'name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ['id', 'type', 'name', 'price', 'stock', 'commission_rate', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
