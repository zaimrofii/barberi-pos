import pytest
from decimal import Decimal
from uuid import uuid4

from django.db import transaction

from src.infrastructure.database.models import Barber, Item, Transaction, TransactionItem
from src.infrastructure.database.repositories.transaction_repository import DjangoTransactionRepository
from src.modules.sales.exceptions import TransactionNotFoundError, CannotVoidTransactionError


@pytest.mark.django_db
class TestDjangoTransactionRepository:
    @pytest.fixture
    def repo(self):
        return DjangoTransactionRepository()

    @pytest.fixture
    def barber(self):
        return Barber.objects.create(id=uuid4(), name="Test Barber")

    @pytest.fixture
    def service_item(self):
        return Item.objects.create(
            id=uuid4(),
            type="SERVICE",
            name="Haircut",
            price=Decimal("50000.00"),
            stock=0,
            commission_rate=Decimal("0.1000"),
        )

    def test_save_creates_transaction(self, repo, barber):
        data = {
            "local_id": "tx-test-001",
            "barber_id": barber.id,
            "status": "COMPLETED",
            "discount": Decimal("5000.00"),
            "void_reason": None,
        }
        transaction_obj = repo.save(data)
        assert transaction_obj.local_id == "tx-test-001"
        assert transaction_obj.barber_id == barber.id
        assert transaction_obj.status == "COMPLETED"
        assert transaction_obj.discount == Decimal("5000.00")
        assert transaction_obj.void_reason is None
        assert transaction_obj.id is not None

    def test_save_items_bulk_creates(self, repo, barber, service_item):
        # Create transaction first
        data = {
            "local_id": "tx-test-002",
            "barber_id": barber.id,
            "status": "COMPLETED",
            "discount": Decimal("0.00"),
            "void_reason": None,
        }
        transaction_obj = repo.save(data)

        items_data = [
            {
                "item_id": service_item.id,
                "barber_id": barber.id,
                "quantity": 2,
                "price_at_sale": Decimal("50000.00"),
                "commission_rate": Decimal("0.1000"),
            }
        ]
        repo.save_items(transaction_obj.id, items_data)

        saved_items = TransactionItem.objects.filter(transaction_id=transaction_obj.id)
        assert saved_items.count() == 1
        saved = saved_items.first()
        assert saved.item_id == service_item.id
        assert saved.quantity == 2
        assert saved.price_at_sale == Decimal("50000.00")
        assert saved.commission_rate == Decimal("0.1000")

    def test_get_by_local_id_returns_existing(self, repo, barber):
        data = {
            "local_id": "tx-test-003",
            "barber_id": barber.id,
            "status": "COMPLETED",
            "discount": Decimal("0.00"),
            "void_reason": None,
        }
        repo.save(data)

        found = repo.get_by_local_id("tx-test-003")
        assert found is not None
        assert found.local_id == "tx-test-003"

    def test_get_by_local_id_returns_none(self, repo):
        found = repo.get_by_local_id("nonexistent")
        assert found is None

    def test_update_status_completed_to_voided(self, repo, barber):
        data = {
            "local_id": "tx-test-004",
            "barber_id": barber.id,
            "status": "COMPLETED",
            "discount": Decimal("0.00"),
            "void_reason": None,
        }
        transaction_obj = repo.save(data)

        repo.update_status(transaction_obj.id, "VOIDED", void_reason="Test void")

        transaction_obj.refresh_from_db()
        assert transaction_obj.status == "VOIDED"
        assert transaction_obj.void_reason == "Test void"

    def test_update_status_already_voided_raises_error(self, repo, barber):
        data = {
            "local_id": "tx-test-005",
            "barber_id": barber.id,
            "status": "VOIDED",
            "discount": Decimal("0.00"),
            "void_reason": "Already voided",
        }
        transaction_obj = repo.save(data)

        with pytest.raises(CannotVoidTransactionError):
            repo.update_status(transaction_obj.id, "VOIDED", void_reason="Try again")

    def test_update_status_non_completed_raises_error(self, repo, barber):
        # Create transaction with status other than COMPLETED (e.g., PENDING)
        # But our model only has COMPLETED/VOIDED choices, so we simulate by creating
        # a transaction with COMPLETED then manually changing status via ORM
        data = {
            "local_id": "tx-test-006",
            "barber_id": barber.id,
            "status": "COMPLETED",
            "discount": Decimal("0.00"),
            "void_reason": None,
        }
        transaction_obj = repo.save(data)
        # Manually set to a non-standard status (bypass model validation)
        Transaction.objects.filter(id=transaction_obj.id).update(status="PENDING")
        transaction_obj.refresh_from_db()

        with pytest.raises(CannotVoidTransactionError):
            repo.update_status(transaction_obj.id, "VOIDED", void_reason="Test")

    def test_get_by_id_raises_not_found(self, repo):
        with pytest.raises(TransactionNotFoundError):
            repo.get_by_id(uuid4())
