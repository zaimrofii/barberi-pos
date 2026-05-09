"""
Management command to seed test data for load testing.

Usage:
    python manage.py seed_load_test_data

Creates (if not already present):
    - 1 Barber
    - 1 SERVICE Item
    - 1 PRODUCT Item with large stock (100,000)
"""

from decimal import Decimal

from django.core.management.base import BaseCommand

from src.infrastructure.database.models import Barber, Item


class Command(BaseCommand):
    help = "Seed test data for load testing (Barber, SERVICE item, PRODUCT item)"

    def handle(self, *args, **options):
        # ------------------------------------------------------------------
        # Barber
        # ------------------------------------------------------------------
        barber, created = Barber.objects.get_or_create(
            name="Load Test Barber",
            defaults={},
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created barber: {barber.id}"))
        else:
            self.stdout.write(f"Barber already exists: {barber.id}")

        # ------------------------------------------------------------------
        # SERVICE item
        # ------------------------------------------------------------------
        service_item, created = Item.objects.get_or_create(
            type="SERVICE",
            name="Load Test Service",
            defaults={
                "price": Decimal("50000.00"),
                "stock": 0,
                "commission_rate": Decimal("0.0500"),
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created SERVICE item: {service_item.id}"))
        else:
            self.stdout.write(f"SERVICE item already exists: {service_item.id}")

        # ------------------------------------------------------------------
        # PRODUCT item with large stock
        # ------------------------------------------------------------------
        product_item, created = Item.objects.get_or_create(
            type="PRODUCT",
            name="Load Test Product",
            defaults={
                "price": Decimal("15000.00"),
                "stock": 100_000,
                "commission_rate": Decimal("0.0500"),
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created PRODUCT item: {product_item.id}"))
        else:
            self.stdout.write(f"PRODUCT item already exists: {product_item.id}")

        self.stdout.write(self.style.SUCCESS("Seed data ready for load testing."))
