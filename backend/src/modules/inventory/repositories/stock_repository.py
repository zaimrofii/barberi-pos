from abc import ABC, abstractmethod
from typing import List
from uuid import UUID


class AbstractStockRepository(ABC):

    @abstractmethod
    def get_products_for_update(self, item_ids: List[UUID]) -> List:
        """
        Fetch PRODUCT-type items only WHERE id IN (item_ids)
        WITH pessimistic lock (SELECT FOR UPDATE).
        Must be called inside an active DB transaction.
        Raises StockNotFound if any item_id does not exist.
        """
        pass

    @abstractmethod
    def bulk_deduct(self, deductions: List[dict]) -> None:
        """
        Deduct stock for multiple items atomically.
        deductions: [{"item_id": UUID, "quantity": int}, ...]
        Must be called inside an active DB transaction (already locked).
        """
        pass

    @abstractmethod
    def bulk_restore(self, restorations: List[dict]) -> None:
        """
        Restore stock for multiple items (used on void).
        restorations: [{"item_id": UUID, "quantity": int}, ...]
        Must be called inside an active DB transaction WITH pessimistic lock.
        """
        pass
