import pytest
from decimal import Decimal
from uuid import uuid4
from datetime import date
from unittest.mock import MagicMock, PropertyMock

from src.modules.staff.exceptions import BarberNotFoundError


@pytest.mark.unit
class TestCommissionReportUseCase:
    def test_single_item_commission(self, commission_use_case, mock_repositories, sample_barber):
        barber_id = sample_barber.id
        mock_repositories["barber_repo"].get_by_id.return_value = sample_barber

        # Mock TransactionItem queryset
        mock_qs = MagicMock()
        mock_qs.__iter__.return_value = iter([
            MagicMock(
                transaction_id=uuid4(),
                item_id=uuid4(),
                quantity=2,
                price_at_sale=Decimal("50000.00"),
                commission_rate=Decimal("0.1000"),
                commission_amount=Decimal("10000.00"),
                created_at="2025-01-15T10:00:00Z",
            )
        ])
        mock_qs.count.return_value = 1
        mock_qs.__getitem__.return_value = mock_qs
        mock_qs.aggregate.return_value = {"total": Decimal("10000.00")}

        # Patch TransactionItem.objects.filter
        import src.modules.sales.use_cases.commission_report as cr_module
        cr_module.TransactionItem = MagicMock()
        cr_module.TransactionItem.objects.filter.return_value = mock_qs

        result = commission_use_case.execute(
            barber_id=barber_id,
            start_date=date(2025, 1, 1),
            end_date=date(2025, 1, 31),
            page=1,
            per_page=10,
        )

        assert result["barber_id"] == barber_id
        assert result["total_commission"] == Decimal("10000.00")
        assert len(result["items"]) == 1
        assert result["items"][0]["commission_amount"] == Decimal("10000.00")

    def test_multiple_items_total_commission(self, commission_use_case, mock_repositories, sample_barber):
        barber_id = sample_barber.id
        mock_repositories["barber_repo"].get_by_id.return_value = sample_barber

        mock_qs = MagicMock()
        mock_qs.__iter__.return_value = iter([
            MagicMock(
                transaction_id=uuid4(),
                item_id=uuid4(),
                quantity=1,
                price_at_sale=Decimal("100000.00"),
                commission_rate=Decimal("0.0500"),
                commission_amount=Decimal("5000.00"),
                created_at="2025-02-10T08:00:00Z",
            ),
            MagicMock(
                transaction_id=uuid4(),
                item_id=uuid4(),
                quantity=3,
                price_at_sale=Decimal("50000.00"),
                commission_rate=Decimal("0.1000"),
                commission_amount=Decimal("15000.00"),
                created_at="2025-02-15T12:00:00Z",
            ),
        ])
        mock_qs.count.return_value = 2
        mock_qs.__getitem__.return_value = mock_qs
        mock_qs.aggregate.return_value = {"total": Decimal("20000.00")}

        import src.modules.sales.use_cases.commission_report as cr_module
        cr_module.TransactionItem = MagicMock()
        cr_module.TransactionItem.objects.filter.return_value = mock_qs

        result = commission_use_case.execute(
            barber_id=barber_id,
            start_date=date(2025, 2, 1),
            end_date=date(2025, 2, 28),
            page=1,
            per_page=10,
        )

        assert result["total_commission"] == Decimal("20000.00")
        assert len(result["items"]) == 2

    def test_pagination(self, commission_use_case, mock_repositories, sample_barber):
        barber_id = sample_barber.id
        mock_repositories["barber_repo"].get_by_id.return_value = sample_barber

        mock_qs = MagicMock()
        mock_qs.__iter__.return_value = iter([
            MagicMock(
                transaction_id=uuid4(),
                item_id=uuid4(),
                quantity=1,
                price_at_sale=Decimal("100.00"),
                commission_rate=Decimal("0.1000"),
                commission_amount=Decimal("10.00"),
                created_at="2025-03-01T00:00:00Z",
            )
        ])
        mock_qs.count.return_value = 5
        mock_qs.__getitem__.return_value = mock_qs
        mock_qs.aggregate.return_value = {"total": Decimal("10.00")}

        import src.modules.sales.use_cases.commission_report as cr_module
        cr_module.TransactionItem = MagicMock()
        cr_module.TransactionItem.objects.filter.return_value = mock_qs

        result = commission_use_case.execute(
            barber_id=barber_id,
            start_date=date(2025, 3, 1),
            end_date=date(2025, 3, 31),
            page=2,
            per_page=2,
        )

        assert result["page"] == 2
        assert result["per_page"] == 2
        assert len(result["items"]) == 1

    def test_date_range_filtering(self, commission_use_case, mock_repositories, sample_barber):
        barber_id = sample_barber.id
        mock_repositories["barber_repo"].get_by_id.return_value = sample_barber

        mock_qs = MagicMock()
        mock_qs.__iter__.return_value = iter([])
        mock_qs.count.return_value = 0
        mock_qs.__getitem__.return_value = mock_qs
        mock_qs.aggregate.return_value = {"total": Decimal("0.00")}

        import src.modules.sales.use_cases.commission_report as cr_module
        cr_module.TransactionItem = MagicMock()
        cr_module.TransactionItem.objects.filter.return_value = mock_qs

        result = commission_use_case.execute(
            barber_id=barber_id,
            start_date=date(2025, 4, 1),
            end_date=date(2025, 4, 30),
            page=1,
            per_page=10,
        )

        assert result["total_commission"] == Decimal("0.00")
        assert len(result["items"]) == 0

    def test_only_completed_transactions_included(self, commission_use_case, mock_repositories, sample_barber):
        barber_id = sample_barber.id
        mock_repositories["barber_repo"].get_by_id.return_value = sample_barber

        mock_qs = MagicMock()
        mock_qs.__iter__.return_value = iter([])
        mock_qs.count.return_value = 0
        mock_qs.__getitem__.return_value = mock_qs
        mock_qs.aggregate.return_value = {"total": Decimal("0.00")}

        import src.modules.sales.use_cases.commission_report as cr_module
        cr_module.TransactionItem = MagicMock()
        cr_module.TransactionItem.objects.filter.return_value = mock_qs

        result = commission_use_case.execute(
            barber_id=barber_id,
            start_date=date(2025, 5, 1),
            end_date=date(2025, 5, 31),
            page=1,
            per_page=10,
        )

        # Verify filter includes transaction__status='COMPLETED'
        filter_kwargs = cr_module.TransactionItem.objects.filter.call_args[1]
        assert "transaction__status" in filter_kwargs
        assert filter_kwargs["transaction__status"] == "COMPLETED"

    def test_barber_not_found_raises_error(self, commission_use_case, mock_repositories):
        mock_repositories["barber_repo"].get_by_id.return_value = None

        with pytest.raises(BarberNotFoundError):
            commission_use_case.execute(
                barber_id=uuid4(),
                start_date=date(2025, 1, 1),
                end_date=date(2025, 1, 31),
                page=1,
                per_page=10,
            )

    def test_empty_results(self, commission_use_case, mock_repositories, sample_barber):
        barber_id = sample_barber.id
        mock_repositories["barber_repo"].get_by_id.return_value = sample_barber

        mock_qs = MagicMock()
        mock_qs.__iter__.return_value = iter([])
        mock_qs.count.return_value = 0
        mock_qs.__getitem__.return_value = mock_qs
        mock_qs.aggregate.return_value = {"total": Decimal("0.00")}

        import src.modules.sales.use_cases.commission_report as cr_module
        cr_module.TransactionItem = MagicMock()
        cr_module.TransactionItem.objects.filter.return_value = mock_qs

        result = commission_use_case.execute(
            barber_id=barber_id,
            start_date=date(2025, 6, 1),
            end_date=date(2025, 6, 30),
            page=1,
            per_page=10,
        )

        assert result["total_commission"] == Decimal("0.00")
        assert len(result["items"]) == 0
