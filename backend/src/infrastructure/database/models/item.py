import uuid

from django.db import models


class Item(models.Model):
    class TypeChoices(models.TextChoices):
        SERVICE = 'SERVICE', 'Service'
        PRODUCT = 'PRODUCT', 'Product'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=20, choices=TypeChoices.choices)
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=4, default=0.0000)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'items'
        app_label = 'infrastructure'
        constraints = [
            models.CheckConstraint(check=models.Q(price__gte=0), name='items_price_gte_0'),
            models.CheckConstraint(check=models.Q(stock__gte=0), name='items_stock_gte_0'),
            models.CheckConstraint(check=models.Q(commission_rate__gte=0), name='items_commission_rate_gte_0'),
        ]

    def __str__(self):
        return self.name
