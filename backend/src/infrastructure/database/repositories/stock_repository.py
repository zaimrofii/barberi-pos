from typing import List
from uuid import UUID

from src.modules.inventory.repositories.stock_repository import AbstractStockRepository
from src.modules.inventory.exceptions import InsufficientStockError, StockNotFoundError
from src.shared.constants import ItemType
from src.infrastructure.database.models import Item


class DjangoStockRepository(AbstractStockRepository):

    def get_products_for_update(self, item_ids: List[UUID]) -> List[Item]:
        """
        Fetch PRODUCT-type items only WITH SELECT FOR UPDATE.
        Must be inside atomic() block.
        """
        items = list(
            Item.objects.select_for_update()
            .filter(id__in=item_ids, type=ItemType.PRODUCT)
        )
        found_ids = {item.id for item in items}
        missing = set(item_ids) - found_ids
        if missing:
            raise StockNotFound(f"Products not found: {missing}")
        return items

    def bulk_deduct(self, deductions: List[dict]) -> None:
        """
        deductions: [{"item_id": UUID, "quantity": int}, ...]
        Items must already be locked via get_products_for_update or get_by_ids_for_update.
        """
        item_ids = [d["item_id"] for d in deductions]
        items = {item.id: item for item in Item.objects.filter(id__in=item_ids)}
        
        for deduction in deductions:
            item = items.get(deduction["item_id"])
            if item is None:
                raise StockNotFound(f"Item {deduction['item_id']} not found")
            if item.stock < deduction["quantity"]:
                raise InsufficientStockError(
                    f"Insufficient stock for {item.id}: "
                    f"have {item.stock}, need {deduction['quantity']}"
                )
            item.stock -= deduction["quantity"]
        
        Item.objects.bulk_update(list(items.values()), fields=['stock'])

    def bulk_restore(self, restorations: List[dict]) -> None:
        """
        restorations: [{"item_id": UUID, "quantity": int}, ...]
        Must be called inside atomic() with SELECT FOR UPDATE already acquired.
        """
        item_ids = [r["item_id"] for r in restorations]
        items = {item.id: item for item in Item.objects.select_for_update().filter(id__in=item_ids)}
        
        for restoration in restorations:
            item = items.get(restoration["item_id"])
            if item is None:
                raise StockNotFound(f"Item {restoration['item_id']} not found")
            item.stock += restoration["quantity"]
        
        Item.objects.bulk_update(list(items.values()), fields=['stock'])
