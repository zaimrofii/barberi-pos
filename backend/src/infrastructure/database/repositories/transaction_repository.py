from uuid import UUID
from typing import Optional

from src.modules.sales.repositories.transaction_repository import AbstractTransactionRepository
from src.modules.sales.repositories.exceptions import TransactionNotFound, CannotVoidTransaction
from src.infrastructure.database.models import Transaction, TransactionItem


class DjangoTransactionRepository(AbstractTransactionRepository):

    def get_by_local_id(self, local_id: str) -> Optional[Transaction]:
        try:
            return Transaction.objects.get(local_id=local_id)
        except Transaction.DoesNotExist:
            return None

    def get_by_id(self, transaction_id: UUID) -> Transaction:
        try:
            return Transaction.objects.get(id=transaction_id)
        except Transaction.DoesNotExist:
            raise TransactionNotFound(f"Transaction {transaction_id} not found")

    def save(self, data: dict) -> Transaction:
        """
        data: {
            "local_id": str,
            "barber_id": UUID,
            "status": str,
            "discount": Decimal,
            "void_reason": None
        }
        Returns the created Transaction ORM object.
        """
        transaction = Transaction.objects.create(
            local_id=data["local_id"],
            barber_id=data["barber_id"],
            status=data["status"],
            discount=data["discount"],
            void_reason=data.get("void_reason"),
        )
        return transaction

    def save_items(self, transaction_id: UUID, items: list) -> None:
        """
        Bulk insert transaction_items (immutable snapshot).
        items: [
            {
                "item_id": UUID,
                "barber_id": UUID,
                "quantity": int,
                "price_at_sale": Decimal,
                "commission_rate": Decimal,
            },
            ...
        ]
        """
        transaction_items = [
            TransactionItem(
                transaction_id=transaction_id,
                item_id=item["item_id"],
                barber_id=item["barber_id"],
                quantity=item["quantity"],
                price_at_sale=item["price_at_sale"],
                commission_rate=item["commission_rate"],
            )
            for item in items
        ]
        TransactionItem.objects.bulk_create(transaction_items)

    def update_status(self, transaction_id: UUID, status: str, void_reason: str = None) -> None:
        """
        Only valid transition: COMPLETED → VOIDED.
        Raises CannotVoidTransaction if already VOIDED.
        """
        try:
            transaction = Transaction.objects.get(id=transaction_id)
        except Transaction.DoesNotExist:
            raise TransactionNotFound(f"Transaction {transaction_id} not found")
        
        if transaction.status == 'VOIDED':
            raise CannotVoidTransaction(
                f"Transaction {transaction_id} is already VOIDED"
            )
        if transaction.status != 'COMPLETED':
            raise CannotVoidTransaction(
                f"Only COMPLETED transactions can be voided, got: {transaction.status}"
            )
        
        transaction.status = status
        transaction.void_reason = void_reason
        transaction.save(update_fields=['status', 'void_reason', 'updated_at'])
