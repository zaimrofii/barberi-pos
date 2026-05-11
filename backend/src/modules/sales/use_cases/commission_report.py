from decimal import Decimal, ROUND_HALF_UP  
from uuid import UUID
from datetime import datetime, date
from django.db.models import Sum, F, ExpressionWrapper, DecimalField
from django.utils import timezone
from src.infrastructure.database.models import TransactionItem
from src.modules.staff.exceptions import BarberNotFoundError
from src.modules.staff.repositories.barber_repository import AbstractBarberRepository


class CommissionReportUseCase:
    def __init__(self, barber_repo: AbstractBarberRepository):
        self.barber_repo = barber_repo

    def execute(
        self,
        barber_id: UUID,
        start_date: date,
        end_date: date,
        page: int,
        per_page: int,
    ) -> dict:
        barber = self.barber_repo.get_by_id(barber_id)
        if barber is None:
            raise BarberNotFoundError(f"Barber {barber_id} not found")

        start_datetime = timezone.make_aware(datetime.combine(start_date, datetime.min.time()))
        end_datetime = timezone.make_aware(datetime.combine(end_date, datetime.max.time()))

        qs = (
            TransactionItem.objects.filter(
                barber_id=barber_id,
                created_at__gte=start_datetime,
                created_at__lte=end_datetime,
                transaction__status="COMPLETED",
            )
            .select_related("transaction")
            .annotate(
                commission_amount=ExpressionWrapper(
                    F("price_at_sale") * F("quantity") * F("commission_rate"),
                    output_field=DecimalField(max_digits=15, decimal_places=6),
                )
            )
            .order_by("created_at")
        )

        total_commission = qs.aggregate(total=Sum("commission_amount"))["total"] or Decimal("0.00")

        offset = (page - 1) * per_page
        page_qs = qs[offset : offset + per_page]

        items = []
        for ti in page_qs:
            items.append(
                {
                    "transaction_id": ti.transaction_id,
                    "item_id": ti.item_id,
                    "quantity": ti.quantity,
                    "price_at_sale": ti.price_at_sale,
                    "commission_rate": ti.commission_rate,
                    "commission_amount":  ti.commission_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
                    "created_at": ti.created_at,
                }
            )

        return {
            "barber_id": barber_id,
            "start_date": start_date,
            "end_date": end_date,
            "total_commission": total_commission,
            "page": page,
            "per_page": per_page,
            "items": items,
        }