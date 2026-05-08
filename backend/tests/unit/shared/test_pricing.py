import pytest
from decimal import Decimal

from src.shared.utils.pricing import calculate_total


class TestCalculateTotal:
    def test_single_item_no_discount(self):
        items = [{"price_at_sale": Decimal("50000.00"), "quantity": 1}]
        discount = Decimal("0.00")
        total = calculate_total(items, discount)
        assert total == Decimal("50000.00")

    def test_multiple_items_subtotal(self):
        items = [
            {"price_at_sale": Decimal("25000.00"), "quantity": 2},
            {"price_at_sale": Decimal("10000.00"), "quantity": 3},
        ]
        discount = Decimal("0.00")
        total = calculate_total(items, discount)
        # 25000*2 + 10000*3 = 50000 + 30000 = 80000
        assert total == Decimal("80000.00")

    def test_full_discount(self):
        items = [{"price_at_sale": Decimal("50000.00"), "quantity": 1}]
        discount = Decimal("50000.00")
        total = calculate_total(items, discount)
        assert total == Decimal("0.00")

    def test_partial_discount(self):
        items = [{"price_at_sale": Decimal("100000.00"), "quantity": 1}]
        discount = Decimal("25000.00")
        total = calculate_total(items, discount)
        assert total == Decimal("75000.00")

    def test_zero_discount(self):
        items = [{"price_at_sale": Decimal("100.00"), "quantity": 1}]
        discount = Decimal("0.00")
        total = calculate_total(items, discount)
        assert total == Decimal("100.00")

    def test_large_discount(self):
        items = [{"price_at_sale": Decimal("50000.00"), "quantity": 1}]
        discount = Decimal("100000.00")
        total = calculate_total(items, discount)
        # subtotal - discount = 50000 - 100000 = -50000
        assert total == Decimal("-50000.00")

    def test_decimal_precision_two_places(self):
        items = [{"price_at_sale": Decimal("100.50"), "quantity": 3}]
        discount = Decimal("0.00")
        total = calculate_total(items, discount)
        # 100.50 * 3 = 301.50
        assert total == Decimal("301.50")

    def test_rounding_up(self):
        items = [{"price_at_sale": Decimal("10.005"), "quantity": 1}]
        discount = Decimal("0.00")
        total = calculate_total(items, discount)
        # 10.005 rounds to 10.01 (ROUND_HALF_UP)
        assert total == Decimal("10.01")

    def test_rounding_down(self):
        items = [{"price_at_sale": Decimal("10.004"), "quantity": 1}]
        discount = Decimal("0.00")
        total = calculate_total(items, discount)
        # 10.004 rounds to 10.00
        assert total == Decimal("10.00")

    def test_empty_items_list(self):
        items = []
        discount = Decimal("0.00")
        total = calculate_total(items, discount)
        assert total == Decimal("0.00")

    def test_discount_greater_than_subtotal(self):
        items = [{"price_at_sale": Decimal("100.00"), "quantity": 1}]
        discount = Decimal("150.00")
        total = calculate_total(items, discount)
        assert total == Decimal("-50.00")
