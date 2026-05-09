import uuid

from django.db import models
from django.utils import timezone

from .barber import Barber
from .item import Item
from .transaction import Transaction


class TransactionItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE)
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    barber = models.ForeignKey(Barber, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    price_at_sale = models.DecimalField(max_digits=10, decimal_places=2)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=4)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'transaction_items'
        app_label = 'infrastructure'
        indexes = [
            models.Index(fields=['barber', 'created_at'], name='tx_items_barber_created_idx'),
        ]
        constraints = [
            models.CheckConstraint(check=models.Q(quantity__gt=0), name='tx_items_quantity_gt_0'),
            models.CheckConstraint(check=models.Q(price_at_sale__gte=0), name='tx_items_price_at_sale_gte_0'),
        ]

    def __str__(self):
        return f'{self.transaction.local_id} - {self.item.name}'
