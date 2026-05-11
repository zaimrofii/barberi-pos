import pytest
from decimal import Decimal
from datetime import date, datetime
from django.utils import timezone
from src.infrastructure.database.models import Barber, Item, Transaction, TransactionItem
from src.modules.sales.use_cases.commission_report import CommissionReportUseCase
from src.infrastructure.database.repositories.barber_repository import DjangoBarberRepository


@pytest.mark.django_db
class TestCommissionReportUseCase:
    
    @pytest.fixture
    def barber(self):
        return Barber.objects.create(name="Test Barber")
    
    @pytest.fixture
    def service_item(self):
        return Item.objects.create(
            type="SERVICE",
            name="Haircut",
            price=Decimal("50000.00"),
            stock=0,
            commission_rate=Decimal("0.1000"),
        )
    
    @pytest.fixture
    def product_item(self):
        return Item.objects.create(
            type="PRODUCT",
            name="Shampoo",
            price=Decimal("25000.00"),
            stock=100,
            commission_rate=Decimal("0.0500"),
        )
    
    def test_single_item_commission(self, barber, service_item):
        transaction = Transaction.objects.create(
            local_id="tx-001",
            barber=barber,
            status="COMPLETED",
            discount=Decimal("0.00"),
        )
        TransactionItem.objects.create(
            transaction=transaction,
            item=service_item,
            barber=barber,
            quantity=2,
            price_at_sale=Decimal("50000.00"),
            commission_rate=Decimal("0.1000"),
            created_at=timezone.make_aware(datetime(2025, 6, 15, 10, 0, 0)),
        )
        
        use_case = CommissionReportUseCase(barber_repo=DjangoBarberRepository())
        result = use_case.execute(
            barber_id=barber.id,
            start_date=date(2025, 1, 1),
            end_date=date(2025, 12, 31),
            page=1,
            per_page=10,
        )
        
        assert result["barber_id"] == barber.id
        assert result["total_commission"] == Decimal("10000.00")
        assert len(result["items"]) == 1
    
    def test_multiple_items_total_commission(self, barber, service_item, product_item):
        transaction = Transaction.objects.create(
            local_id="tx-002",
            barber=barber,
            status="COMPLETED",
            discount=Decimal("0.00"),
        )
        TransactionItem.objects.create(
            transaction=transaction,
            item=service_item,
            barber=barber,
            quantity=1,
            price_at_sale=Decimal("100000.00"),
            commission_rate=Decimal("0.0500"),
            created_at=timezone.make_aware(datetime(2025, 6, 15, 10, 0, 0)),
        )
        TransactionItem.objects.create(
            transaction=transaction,
            item=product_item,
            barber=barber,
            quantity=3,
            price_at_sale=Decimal("50000.00"),
            commission_rate=Decimal("0.1000"),
            created_at=timezone.make_aware(datetime(2025, 6, 15, 10, 0, 0)),
        )
        
        use_case = CommissionReportUseCase(barber_repo=DjangoBarberRepository())
        result = use_case.execute(
            barber_id=barber.id,
            start_date=date(2025, 1, 1),
            end_date=date(2025, 12, 31),
            page=1,
            per_page=10,
        )
        
        assert result["total_commission"] == Decimal("20000.00")
        assert len(result["items"]) == 2
    
    def test_pagination(self, barber, service_item):
        # Create 5 items dengan tanggal berbeda (urutan created_at)
        dates = [
            datetime(2025, 6, 15, 10, 0, 0),
            datetime(2025, 6, 16, 10, 0, 0),
            datetime(2025, 6, 17, 10, 0, 0),
            datetime(2025, 6, 18, 10, 0, 0),
            datetime(2025, 6, 19, 10, 0, 0),
        ]
        
        for i, dt in enumerate(dates):
            transaction = Transaction.objects.create(
                local_id=f"tx-pagination-{i}",
                barber=barber,
                status="COMPLETED",
                discount=Decimal("0.00"),
            )
            TransactionItem.objects.create(
                transaction=transaction,
                item=service_item,
                barber=barber,
                quantity=1,
                price_at_sale=Decimal("100.00"),
                commission_rate=Decimal("0.1000"),
                created_at=timezone.make_aware(dt),
            )
        
        use_case = CommissionReportUseCase(barber_repo=DjangoBarberRepository())
        result = use_case.execute(
            barber_id=barber.id,
            start_date=date(2025, 1, 1),
            end_date=date(2025, 12, 31),
            page=2,
            per_page=2,
        )
        
        assert result["page"] == 2
        assert result["per_page"] == 2
        # Page 2 dari 5 items dengan per_page=2: items ke-3 dan ke-4 = 2 items
        assert len(result["items"]) == 2
    
    def test_date_range_filtering(self, barber, service_item):
        # Create transaction OUTSIDE date range
        transaction = Transaction.objects.create(
            local_id="tx-date",
            barber=barber,
            status="COMPLETED",
            discount=Decimal("0.00"),
        )
        TransactionItem.objects.create(
            transaction=transaction,
            item=service_item,
            barber=barber,
            quantity=1,
            price_at_sale=Decimal("50000.00"),
            commission_rate=Decimal("0.1000"),
            created_at=timezone.make_aware(datetime(2026, 6, 15, 10, 0, 0)),
        )
        
        use_case = CommissionReportUseCase(barber_repo=DjangoBarberRepository())
        result = use_case.execute(
            barber_id=barber.id,
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            page=1,
            per_page=10,
        )
        
        assert result["total_commission"] == Decimal("0.00")
        assert len(result["items"]) == 0
        