from uuid import UUID
from decimal import Decimal
from django.db import transaction as db_transaction
from django.db.models import Sum, F, ExpressionWrapper, DecimalField
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from src.modules.sales.use_cases.checkout import CheckoutUseCase
from src.modules.sales.adapters.serializers import (
    CheckoutRequestSerializer,
    VoidRequestSerializer,
    CommissionQuerySerializer,
)
from src.infrastructure.database.repositories import (
    DjangoTransactionRepository,
    DjangoStockRepository,
    DjangoItemRepository,
    DjangoBarberRepository,
)
from src.infrastructure.database.models import TransactionItem
from src.modules.catalog.exceptions import ItemNotFoundError, OutOfStockError
from src.modules.staff.exceptions import BarberNotFoundError
from src.modules.sales.exceptions import (
    TransactionNotFoundError,
    CannotVoidTransactionError,
    DuplicateLocalIdError,
)
from src.modules.inventory.exceptions import StockNotFoundError, InsufficientStockError
from src.shared.base_exception import DomainException


class CheckoutView(APIView):
    def post(self, request):
        serializer = CheckoutRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        transaction_repo = DjangoTransactionRepository()
        stock_repo = DjangoStockRepository()
        item_repo = DjangoItemRepository()
        barber_repo = DjangoBarberRepository()
        use_case = CheckoutUseCase(transaction_repo, stock_repo, item_repo, barber_repo)

        try:
            result = use_case.execute(
                local_id=data["local_id"],
                barber_id=data["barber_id"],
                discount=data["discount"],
                items=data["items"],
            )
        except DuplicateLocalIdError as e:
            # e.args[0] contains the existing transaction id
            existing_id = str(e.args[0]) if e.args else ""
            return Response(
                {
                    "error": "DUPLICATE_LOCAL_ID",
                    "transaction_id": existing_id,
                    "detail": str(e),
                },
                status=status.HTTP_409_CONFLICT,
            )
        except OutOfStockError as e:
            return Response(
                {"error": "OUT_OF_STOCK", "detail": str(e)},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )
        except ItemNotFoundError as e:
            return Response(
                {"error": "ITEM_NOT_FOUND", "detail": str(e)},
                status=status.HTTP_404_NOT_FOUND,
            )
        except BarberNotFoundError as e:
            return Response(
                {"error": "BARBER_NOT_FOUND", "detail": str(e)},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                "transaction_id": str(result["transaction_id"]),
                "status": result["status"],
                "total": float(result["total"]),
            },
            status=status.HTTP_200_OK,
        )


class VoidTransactionView(APIView):
    def patch(self, request, transaction_id):
        serializer = VoidRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        void_reason = serializer.validated_data.get("void_reason", "")

        transaction_repo = DjangoTransactionRepository()
        stock_repo = DjangoStockRepository()

        try:
            with db_transaction.atomic():
                # 1. Fetch transaction
                transaction = transaction_repo.get_by_id(transaction_id)

                # 2. Validate status
                if transaction.status != "COMPLETED":
                    return Response(
                        {
                            "error": "CANNOT_VOID",
                            "detail": "Only COMPLETED transactions can be voided",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # 3. Fetch transaction_items
                transaction_items = TransactionItem.objects.filter(
                    transaction_id=transaction_id
                ).select_related("item")

                # 4. Build restorations for PRODUCT items only
                restorations = []
                for ti in transaction_items:
                    if ti.item.type == "PRODUCT":
                        restorations.append(
                            {"item_id": ti.item_id, "quantity": ti.quantity}
                        )

                # 5. Restore stock
                if restorations:
                    stock_repo.bulk_restore(restorations)

                # 6. Update status
                transaction_repo.update_status(
                    transaction_id, "VOIDED", void_reason
                )

        except TransactionNotFoundError as e:
            return Response(
                {"error": "TRANSACTION_NOT_FOUND", "detail": str(e)},
                status=status.HTTP_404_NOT_FOUND,
            )
        except CannotVoidTransactionError as e:
            return Response(
                {"error": "CANNOT_VOID", "detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "transaction_id": str(transaction_id),
                "status": "VOIDED",
            },
            status=status.HTTP_200_OK,
        )


class CommissionReportView(APIView):
    def get(self, request):
        serializer = CommissionQuerySerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        barber_id = data["barber_id"]
        start_date = data["start_date"]
        end_date = data["end_date"]
        page = data["page"]
        per_page = data["per_page"]

        # Build base queryset
        qs = TransactionItem.objects.filter(
            barber_id=barber_id,
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
            transaction__status="COMPLETED",
        ).select_related("transaction").annotate(
            commission_amount=ExpressionWrapper(
                F("price_at_sale") * F("quantity") * F("commission_rate"),
                output_field=DecimalField(max_digits=10, decimal_places=2),
            )
        ).order_by("created_at")

        # Total commission (before pagination)
        total_commission = qs.aggregate(
            total=Sum("commission_amount")
        )["total"] or Decimal("0.00")

        # Paginate
        offset = (page - 1) * per_page
        page_qs = qs[offset : offset + per_page]

        items = []
        for ti in page_qs:
            items.append(
                {
                    "transaction_id": str(ti.transaction_id),
                    "item_id": str(ti.item_id),
                    "quantity": ti.quantity,
                    "price_at_sale": float(ti.price_at_sale),
                    "commission_rate": float(ti.commission_rate),
                    "commission_amount": float(ti.commission_amount),
                    "created_at": ti.created_at.isoformat(),
                }
            )

        return Response(
            {
                "barber_id": str(barber_id),
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "total_commission": float(total_commission),
                "page": page,
                "per_page": per_page,
                "items": items,
            },
            status=status.HTTP_200_OK,
        )
