from abc import ABC, abstractmethod
from typing import List
from uuid import UUID


class AbstractItemRepository(ABC):

    @abstractmethod
    def get_by_ids_for_update(self, item_ids: List[UUID]) -> List:
        """
        Fetch items WHERE id IN (item_ids) WITH pessimistic lock (SELECT FOR UPDATE).
        Must be called inside an active DB transaction.
        Returns list of item domain objects (or ORM models).
        """
        pass

    @abstractmethod
    def get_by_id(self, item_id: UUID):
        """
        Fetch single item by id. No lock.
        Raises ItemNotFound if not exists.
        """
        pass

    @abstractmethod
    def save(self, item) -> None:
        """
        Persist changes to an item (e.g. after stock deduction).
        """
        pass

    @abstractmethod
    def bulk_save(self, items: List) -> None:
        """
        Persist multiple items at once (used after stock deduction in checkout).
        """
        pass
