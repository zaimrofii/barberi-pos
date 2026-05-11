import pytest
from decimal import Decimal

from src.shared.utils.pricing import calculate_total


class TestCalculateTotal:
    # Menghitung total satu item tanpa diskon
    def test_single_item_no_discount(self):
        """Test untuk satu item tanpa diskon - seharusnya harga item = total"""
        items = [{"price_at_sale": Decimal("50000.00"), "quantity": 1}]
        discount = Decimal("0.00")
        total = calculate_total(items, discount)
        assert total == Decimal("50000.00")

    # Menghitung total beberapa item tanpa diskon (subtotal)
    def test_multiple_items_subtotal(self):
        """Test untuk beberapa item tanpa diskon - seharusnya menjumlah semua harga item"""
        items = [
            {"price_at_sale": Decimal("25000.00"), "quantity": 2},
            {"price_at_sale": Decimal("10000.00"), "quantity": 3},
        ]
        discount = Decimal("0.00")
        total = calculate_total(items, discount)
        # 25000*2 + 10000*3 = 50000 + 30000 = 80000
        assert total == Decimal("80000.00")

    # Diskon penuh (100%) - total menjadi 0
    def test_full_discount(self):
        """Test untuk diskon penuh dimana diskon = harga item - seharusnya total = 0"""
        items = [{"price_at_sale": Decimal("50000.00"), "quantity": 1}]
        discount = Decimal("50000.00")
        total = calculate_total(items, discount)
        assert total == Decimal("0.00")

    # Diskon sebagian (tidak penuh)
    def test_partial_discount(self):
        """Test untuk diskon sebagian - seharusnya harga item dikurangi diskon"""
        items = [{"price_at_sale": Decimal("100000.00"), "quantity": 1}]
        discount = Decimal("25000.00")
        total = calculate_total(items, discount)
        assert total == Decimal("75000.00")

    # Diskon nol (tidak ada diskon)
    def test_zero_discount(self):
        """Test untuk diskon 0 - seharusnya total = harga item"""
        items = [{"price_at_sale": Decimal("100.00"), "quantity": 1}]
        discount = Decimal("0.00")
        total = calculate_total(items, discount)
        assert total == Decimal("100.00")

    # Diskon melebihi harga total (negatif)
    def test_large_discount(self):
        """Test untuk diskon lebih besar dari subtotal - seharusnya total negatif"""
        items = [{"price_at_sale": Decimal("50000.00"), "quantity": 1}]
        discount = Decimal("100000.00")
        total = calculate_total(items, discount)
        # subtotal - discount = 50000 - 100000 = -50000
        assert total == Decimal("-50000.00")

    # Presisi desimal 2 angka di belakang koma
    def test_decimal_precision_two_places(self):
        """Test untuk memastikan perhitungan desimal tetap presisi 2 angka"""
        items = [{"price_at_sale": Decimal("100.50"), "quantity": 3}]
        discount = Decimal("0.00")
        total = calculate_total(items, discount)
        # 100.50 * 3 = 301.50
        assert total == Decimal("301.50")

    # Pembulatan ke atas (ROUND_HALF_UP)
    def test_rounding_up(self):
        """Test untuk pembulatan ke atas pada angka 5 ke atas - contoh: 10.005 → 10.01"""
        items = [{"price_at_sale": Decimal("10.005"), "quantity": 1}]
        discount = Decimal("0.00")
        total = calculate_total(items, discount)
        # 10.005 rounds to 10.01 (ROUND_HALF_UP)
        assert total == Decimal("10.01")

    # Pembulatan ke bawah (tetap)
    def test_rounding_down(self):
        """Test untuk pembulatan ke bawah pada angka di bawah 5 - contoh: 10.004 → 10.00"""
        items = [{"price_at_sale": Decimal("10.004"), "quantity": 1}]
        discount = Decimal("0.00")
        total = calculate_total(items, discount)
        # 10.004 rounds to 10.00
        assert total == Decimal("10.00")

    # Daftar item kosong
    def test_empty_items_list(self):
        """Test untuk kasus tidak ada item yang dibeli - seharusnya total = 0"""
        items = []
        discount = Decimal("0.00")
        total = calculate_total(items, discount)
        assert total == Decimal("0.00")

    # Diskon lebih besar dari subtotal (hasil negatif)
    def test_discount_greater_than_subtotal(self):
        """Test untuk diskon melebihi subtotal - seharusnya menghasilkan nilai negatif"""
        items = [{"price_at_sale": Decimal("100.00"), "quantity": 1}]
        discount = Decimal("150.00")
        total = calculate_total(items, discount)
        assert total == Decimal("-50.00")