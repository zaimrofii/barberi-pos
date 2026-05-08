import pytest
from decimal import Decimal

from src.shared.utils.pricing import calculate_total


class TestPricingEdgeCases:
    def test_large_decimal_numbers(self):
        items = [{"price_at_sale": Decimal("9999999.99"), "quantity": 1}]
        discount = Decimal("0.00")
        total = calculate_total(items, discount)
        assert total == Decimal("9999999.99")

    def test_high_quantities(self):
        items = [{"price_at_sale": Decimal("100.00"), "quantity": 9999}]
        discount = Decimal("0.00")
        total = calculate_total(items, discount)
        assert total == Decimal("999900.00")

    def test_negative_discount(self):
        items = [{"price_at_sale": Decimal("50000.00"), "quantity": 1}]
        discount = Decimal("-10000.00")
        total = calculate_total(items, discount)
        # subtotal - (-10000) = 50000 + 10000 = 60000
        assert total == Decimal("60000.00")

    def test_zero_items_list(self):
        items = []
        discount = Decimal("100.00")
        total = calculate_total(items, discount)
        # 0 - 100 = -100
        assert total == Decimal("-100.00")

    def test_multiple_items_large_values(self):
        items = [
            {"price_at_sale": Decimal("999999.99"), "quantity": 10},
            {"price_at_sale": Decimal("0.01"), "quantity": 1000},
        ]
        discount = Decimal("500000.00")
        total = calculate_total(items, discount)
        # (999999.99*10 + 0.01*1000) - 500000 = (9999999.90 + 10.00) - 500000 = 9500009.90
        assert total == Decimal("9500009.90")

    def test_rounding_with_three_decimal_places(self):
        items = [{"price_at_sale": Decimal("10.005"), "quantity": 1}]
        discount = Decimal("0.00")
        total = calculate_total(items, discount)
        assert total == Decimal("10.01")

    def test_rounding_with_five_decimal_places(self):
        items = [{"price_at_sale": Decimal("10.0055"), "quantity": 1}]
        discount = Decimal("0.00")
        total = calculate_total(items, discount)
        # 10.0055 rounds to 10.01 (ROUND_HALF_UP)
        assert total == Decimal("10.01")

    def test_very_small_price(self):
        items = [{"price_at_sale": Decimal("0.01"), "quantity": 1}]
        discount = Decimal("0.00")
        total = calculate_total(items, discount)
        assert total == Decimal("0.01")

    def test_very_small_discount(self):
        items = [{"price_at_sale": Decimal("100.00"), "quantity": 1}]
        discount = Decimal("0.01")
        total = calculate_total(items, discount)
        assert total == Decimal("99.99")
