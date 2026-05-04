from abc import ABC, abstractmethod
from uuid import UUID


class AbstractTransactionRepository(ABC):

    @abstractmethod
    def get_by_local_id(self, local_id: str):
        """
        Idempotency check: find existing transaction by local_id.
        Returns transaction or None if not found.
        """
        pass

    @abstractmethod
    def get_by_id(self, transaction_id: UUID):
        """
        Fetch transaction by server-side UUID.
        Raises TransactionNotFound if not exists.
        """
        pass

    @abstractmethod
    def save(self, transaction) -> None:
        """
        Persist a new transaction (INSERT).
        """
        pass

    @abstractmethod
    def save_items(self, transaction_items: list) -> None:
        """
        Bulk insert transaction_items (immutable snapshot rows).
        Use bulk_create for performance.
        """
        pass

    @abstractmethod
    def update_status(self, transaction_id: UUID, status: str, void_reason: str = None) -> None:
        """
        Update transaction status to VOIDED.
        Only valid transition: COMPLETED → VOIDED.
        """
        pass
