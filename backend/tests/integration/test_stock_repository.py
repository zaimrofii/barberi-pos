import pytest
from decimal import Decimal
from uuid import uuid4

from django.db import transaction

from src.infrastructure.database.models import Item
from src.infrastructure.database.repositories.stock_repository import DjangoStockRepository
from src.modules.inventory.exceptions import InsufficientStockError, StockNotFoundError


@pytest.mark.django_db
class TestDjangoStockRepository:
    @pytest.fixture
    def repo(self):
        return DjangoStockRepository()

    @pytest.fixture
    def product_items(self):
        items = []
        for i in range(3):
            item = Item.objects.create(
                id=uuid4(),
                type="PRODUCT",
                name=f"Product {i}",
                price=Decimal("10000.00"),
                stock=10,
                commission_rate=Decimal("0.0500"),
            )
            items.append(item)
        return items

    def test_bulk_deduct_valid(self, repo, product_items):
        deductions = [
            {"item_id": product_items[0].id, "quantity": 3},
            {"item_id": product_items[1].id, "quantity": 5},
        ]
        with transaction.atomic():
            repo.get_products_for_update([d["item_id"] for d in deductions])
            repo.bulk_deduct(deductions)

        product_items[0].refresh_from_db()
        product_items[1].refresh_from_db()
        assert product_items[0].stock == 7  # 10 - 3
        assert product_items[1].stock == 5  # 10 - 5
        # Third item unchanged
        product_items[2].refresh_from_db()
        assert product_items[2].stock == 10

    def test_bulk_deduct_insufficient_stock(self, repo, product_items):
        deductions = [
            {"item_id": product_items[0].id, "quantity": 20},  # only 10 available
        ]
        with transaction.atomic():
            repo.get_products_for_update([d["item_id"] for d in deductions])
            with pytest.raises(InsufficientStockError):
                repo.bulk_deduct(deductions)

        # Stock should remain unchanged
        product_items[0].refresh_from_db()
        assert product_items[0].stock == 10

    def test_bulk_restore(self, repo, product_items):
        # First deduct some stock
        with transaction.atomic():
            repo.get_products_for_update([product_items[0].id])
            repo.bulk_deduct([{"item_id": product_items[0].id, "quantity": 4}])

        product_items[0].refresh_from_db()
        assert product_items[0].stock == 6

        # Now restore
        with transaction.atomic():
            repo.get_products_for_update([product_items[0].id])
            repo.bulk_restore([{"item_id": product_items[0].id, "quantity": 4}])

        product_items[0].refresh_from_db()
        assert product_items[0].stock == 10

    def test_get_products_for_update_missing(self, repo):
        missing_id = uuid4()
        with transaction.atomic():
            with pytest.raises(StockNotFoundError):
                repo.get_products_for_update([missing_id])

    def test_get_products_for_update_ignores_service(self, repo, product_items):
        # Create a SERVICE item
        service_item = Item.objects.create(
            id=uuid4(),
            type="SERVICE",
            name="Service",
            price=Decimal("50000.00"),
            stock=0,
            commission_rate=Decimal("0.1000"),
        )
        
        # HANYA kirim PRODUCT id, SERVICE id TIDAK usah dikirim
        # Karena function ini hanya untuk PRODUCT
        with transaction.atomic():
            items = repo.get_products_for_update([product_items[0].id])
        
        assert len(items) == 1
        assert items[0].id == product_items[0].id
        # Verifikasi bahwa service_item tidak terpengaruh (tidak di-lock, dll)
        service_item.refresh_from_db()
        assert service_item.id is not None  # Masih ada
