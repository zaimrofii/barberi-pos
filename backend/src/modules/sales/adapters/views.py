from uuid import UUID
from decimal import Decimal
from django.db import transaction as db_transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from src.modules.sales.use_cases.checkout import CheckoutUseCase
from src.modules.sales.use_cases.commission_report import CommissionReportUseCase
from src.modules.sales.adapters.serializers import (
    CheckoutRequestSerializer,
    CheckoutResponseSerializer,
    VoidRequestSerializer,
    VoidResponseSerializer,
    ErrorResponseSerializer,
    CommissionQuerySerializer,
    CommissionResponseSerializer,
)
from src.infrastructure.database.repositories import (
    DjangoTransactionRepository,
    DjangoStockRepository,
    DjangoItemRepository,
    DjangoBarberRepository,
)
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
        except DomainException as e:
            return self._handle_domain_exception(e)

        response_serializer = CheckoutResponseSerializer(data=result)
        response_serializer.is_valid(raise_exception=True)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    def _handle_domain_exception(self, e: DomainException) -> Response:
        error_mapping = {
            "DuplicateLocalIdError": (status.HTTP_409_CONFLICT, "DUPLICATE_LOCAL_ID"),
            "OutOfStockError": (status.HTTP_422_UNPROCESSABLE_ENTITY, "OUT_OF_STOCK"),
            "ItemNotFoundError": (status.HTTP_404_NOT_FOUND, "ITEM_NOT_FOUND"),
            "BarberNotFoundError": (status.HTTP_404_NOT_FOUND, "BARBER_NOT_FOUND"),
            "TransactionNotFoundError": (status.HTTP_404_NOT_FOUND, "TRANSACTION_NOT_FOUND"),
            "CannotVoidTransactionError": (status.HTTP_400_BAD_REQUEST, "CANNOT_VOID"),
        }
        error_code = e.__class__.__name__
        status_code, api_error = error_mapping.get(
            error_code, (status.HTTP_400_BAD_REQUEST, "DOMAIN_ERROR")
        )

        data = {"error": api_error, "detail": str(e)}
        if error_code == "DuplicateLocalIdError":
            data["transaction_id"] = str(e.args[0]) if e.args else ""

        response_serializer = ErrorResponseSerializer(data=data)
        response_serializer.is_valid(raise_exception=True)
        return Response(response_serializer.data, status=status_code)


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
                from src.infrastructure.database.models import TransactionItem

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

        except DomainException as e:
            return self._handle_domain_exception(e)

        response_serializer = VoidResponseSerializer(
            data={"transaction_id": transaction_id, "status": "VOIDED"}
        )
        response_serializer.is_valid(raise_exception=True)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    def _handle_domain_exception(self, e: DomainException) -> Response:
        error_mapping = {
            "DuplicateLocalIdError": (status.HTTP_409_CONFLICT, "DUPLICATE_LOCAL_ID"),
            "OutOfStockError": (status.HTTP_422_UNPROCESSABLE_ENTITY, "OUT_OF_STOCK"),
            "ItemNotFoundError": (status.HTTP_404_NOT_FOUND, "ITEM_NOT_FOUND"),
            "BarberNotFoundError": (status.HTTP_404_NOT_FOUND, "BARBER_NOT_FOUND"),
            "TransactionNotFoundError": (status.HTTP_404_NOT_FOUND, "TRANSACTION_NOT_FOUND"),
            "CannotVoidTransactionError": (status.HTTP_400_BAD_REQUEST, "CANNOT_VOID"),
        }
        error_code = e.__class__.__name__
        status_code, api_error = error_mapping.get(
            error_code, (status.HTTP_400_BAD_REQUEST, "DOMAIN_ERROR")
        )

        data = {"error": api_error, "detail": str(e)}
        if error_code == "DuplicateLocalIdError":
            data["transaction_id"] = str(e.args[0]) if e.args else ""

        response_serializer = ErrorResponseSerializer(data=data)
        response_serializer.is_valid(raise_exception=True)
        return Response(response_serializer.data, status=status_code)


class CommissionReportView(APIView):
    def get(self, request):
        serializer = CommissionQuerySerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        barber_repo = DjangoBarberRepository()
        use_case = CommissionReportUseCase(barber_repo)

        try:
            result = use_case.execute(
                barber_id=data["barber_id"],
                start_date=data["start_date"],
                end_date=data["end_date"],
                page=data["page"],
                per_page=data["per_page"],
            )
        except DomainException as e:
            return self._handle_domain_exception(e)

        response_serializer = CommissionResponseSerializer(data=result)
        response_serializer.is_valid(raise_exception=True)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    def _handle_domain_exception(self, e: DomainException) -> Response:
        error_mapping = {
            "DuplicateLocalIdError": (status.HTTP_409_CONFLICT, "DUPLICATE_LOCAL_ID"),
            "OutOfStockError": (status.HTTP_422_UNPROCESSABLE_ENTITY, "OUT_OF_STOCK"),
            "ItemNotFoundError": (status.HTTP_404_NOT_FOUND, "ITEM_NOT_FOUND"),
            "BarberNotFoundError": (status.HTTP_404_NOT_FOUND, "BARBER_NOT_FOUND"),
            "TransactionNotFoundError": (status.HTTP_404_NOT_FOUND, "TRANSACTION_NOT_FOUND"),
            "CannotVoidTransactionError": (status.HTTP_400_BAD_REQUEST, "CANNOT_VOID"),
        }
        error_code = e.__class__.__name__
        status_code, api_error = error_mapping.get(
            error_code, (status.HTTP_400_BAD_REQUEST, "DOMAIN_ERROR")
        )

        data = {"error": api_error, "detail": str(e)}
        if error_code == "DuplicateLocalIdError":
            data["transaction_id"] = str(e.args[0]) if e.args else ""

        response_serializer = ErrorResponseSerializer(data=data)
        response_serializer.is_valid(raise_exception=True)
        return Response(response_serializer.data, status=status_code)
