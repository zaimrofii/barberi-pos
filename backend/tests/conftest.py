import os
import django
import pytest
from decimal import Decimal
from uuid import uuid4
from unittest.mock import Mock, MagicMock


# Setup Django BEFORE importing any Django models
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from src.modules.sales.use_cases.checkout import CheckoutUseCase
from src.modules.sales.use_cases.commission_report import CommissionReportUseCase
from src.modules.sales.repositories.transaction_repository import AbstractTransactionRepository
from src.modules.inventory.repositories.stock_repository import AbstractStockRepository
from src.modules.catalog.repositories.item_repository import AbstractItemRepository
from src.modules.staff.repositories.barber_repository import AbstractBarberRepository


@pytest.fixture
def sample_barber():
    barber = MagicMock()
    barber.id = uuid4()
    barber.name = "John Doe"
    return barber


@pytest.fixture
def sample_service():
    item = MagicMock()
    item.id = uuid4()
    item.type = "SERVICE"
    item.name = "Haircut"
    item.price = Decimal("50000.00")
    item.stock = 0
    item.commission_rate = Decimal("0.1000")
    return item


@pytest.fixture
def sample_product():
    item = MagicMock()
    item.id = uuid4()
    item.type = "PRODUCT"
    item.name = "Shampoo"
    item.price = Decimal("25000.00")
    item.stock = 100
    item.commission_rate = Decimal("0.0500")
    return item


@pytest.fixture
def mock_repositories(mocker):
    """Return a dict of mocked repository objects."""
    transaction_repo = mocker.create_autospec(AbstractTransactionRepository)
    stock_repo = mocker.create_autospec(AbstractStockRepository)
    item_repo = mocker.create_autospec(AbstractItemRepository)
    barber_repo = mocker.create_autospec(AbstractBarberRepository)
    return {
        "transaction_repo": transaction_repo,
        "stock_repo": stock_repo,
        "item_repo": item_repo,
        "barber_repo": barber_repo,
    }


@pytest.fixture
def checkout_use_case(mock_repositories):
    return CheckoutUseCase(
        transaction_repo=mock_repositories["transaction_repo"],
        stock_repo=mock_repositories["stock_repo"],
        item_repo=mock_repositories["item_repo"],
        barber_repo=mock_repositories["barber_repo"],
    )


@pytest.fixture
def commission_use_case(mock_repositories):
    return CommissionReportUseCase(
        barber_repo=mock_repositories["barber_repo"],
    )
