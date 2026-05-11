from typing import List
from uuid import UUID
from django.core.exceptions import ObjectDoesNotExist

from src.modules.catalog.repositories.item_repository import AbstractItemRepository
from src.modules.catalog.exceptions import ItemNotFoundError
from src.infrastructure.database.models import Item


class DjangoItemRepository(AbstractItemRepository):

    def get_by_ids_for_update(self, item_ids: List[UUID]) -> List[Item]:
        """
        SELECT * FROM items WHERE id IN (...) FOR UPDATE
        Must be called inside atomic() block.
        """
        items = list(
            Item.objects.select_for_update().filter(id__in=item_ids)
        )
        return items

    def get_by_id(self, item_id: UUID) -> Item:
        try:
            return Item.objects.get(id=item_id)
        except Item.DoesNotExist:
            raise ItemNotFoundError(f"Item {item_id} not found")

    def save(self, item: Item) -> None:
        item.save()

    def bulk_save(self, items: List[Item]) -> None:
        Item.objects.bulk_update(items, fields=['stock', 'updated_at'])
