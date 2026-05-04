import uuid

from django.db import models

from .barber import Barber


class Transaction(models.Model):
    class StatusChoices(models.TextChoices):
        COMPLETED = 'COMPLETED', 'Completed'
        VOIDED = 'VOIDED', 'Voided'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    local_id = models.CharField(max_length=36, unique=True)
    barber = models.ForeignKey(Barber, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=StatusChoices.choices)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    void_reason = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transactions'
        app_label = 'infrastructure'
        indexes = [
            models.Index(fields=['status'], name='transactions_status_idx'),
        ]
        constraints = [
            models.CheckConstraint(check=models.Q(discount__gte=0), name='transactions_discount_gte_0'),
        ]

    def __str__(self):
        return f'{self.local_id} ({self.status})'
