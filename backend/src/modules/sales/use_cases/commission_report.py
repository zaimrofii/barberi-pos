from decimal import Decimal
from uuid import UUID
from datetime import date
from django.db.models import Sum, F, ExpressionWrapper, DecimalField
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
        # Validate barber exists
        barber = self.barber_repo.get_by_id(barber_id)
        if barber is None:
            raise BarberNotFoundError(f"Barber {barber_id} not found")

        # Build base queryset
        qs = (
            TransactionItem.objects.filter(
                barber_id=barber_id,
                created_at__date__gte=start_date,
                created_at__date__lte=end_date,
                transaction__status="COMPLETED",
            )
            .select_related("transaction")
            .annotate(
                commission_amount=ExpressionWrapper(
                    F("price_at_sale") * F("quantity") * F("commission_rate"),
                    output_field=DecimalField(max_digits=10, decimal_places=2),
                )
            )
            .order_by("created_at")
        )

        # Total commission (before pagination)
        total_commission = qs.aggregate(total=Sum("commission_amount"))["total"] or Decimal("0.00")

        # Paginate
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
                    "commission_amount": ti.commission_amount,
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
