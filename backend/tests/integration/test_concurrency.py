import threading
import time
from decimal import Decimal
from uuid import uuid4

import pytest
from django.db import connections

from src.infrastructure.database.models import Barber, Item, Transaction
from src.modules.sales.use_cases.checkout import CheckoutUseCase 
from src.modules.sales.exceptions import DuplicateLocalIdError
from src.modules.catalog.exceptions import OutOfStockError
from src.infrastructure.database.repositories.transaction_repository import (
    DjangoTransactionRepository,
)
from src.infrastructure.database.repositories.stock_repository import (
    DjangoStockRepository,
)
from src.infrastructure.database.repositories.item_repository import (
    DjangoItemRepository,
)
from src.infrastructure.database.repositories.barber_repository import (
    DjangoBarberRepository,
)


@pytest.mark.django_db(transaction=True)
class TestConcurrency:

    # ------------------------------------------------------------------
    # Helper methods
    # ------------------------------------------------------------------
    def _make_barber(self) -> Barber:
        return Barber.objects.create(name="Test Barber")

    def _make_product(self, stock: int, price: Decimal = Decimal("10000.00")) -> Item:
        return Item.objects.create(
            type="PRODUCT",
            name="Test Product",
            price=price,
            stock=stock,
            commission_rate=Decimal("0.0500"),
        )

    def _execute_checkout(
        self,
        barber_id,
        local_id: str,
        items: list,
    ) -> dict:
        """Run the real CheckoutUseCase with real Django repositories."""
        # Ensure each thread gets its own DB connection
        connections.close_all()

        use_case = CheckoutUseCase(
            transaction_repo=DjangoTransactionRepository(),
            stock_repo=DjangoStockRepository(),
            item_repo=DjangoItemRepository(),
            barber_repo=DjangoBarberRepository(),
        )
        return use_case.execute(
            local_id=local_id,
            barber_id=barber_id,
            discount=Decimal("0.00"),
            items=items,
        )

    def _run_concurrent_checkouts(
        self,
        barber_id,
        items_list,  # list of (local_id, items) tuples
        num_threads: int,
        expected_success: int,
        timeout_seconds: int = 30,
    ):
        """
        Launch `num_threads` threads, each calling _execute_checkout.
        `items_list` must have length == num_threads.
        Returns (success_results, exception_list).
        """
        assert len(items_list) == num_threads

        results = []
        errors = []
        barrier = threading.Barrier(num_threads)

        def worker(local_id, items):
            try:
                barrier.wait(timeout=10)
                result = self._execute_checkout(barber_id, local_id, items)
                results.append(result)
            except Exception as exc:
                errors.append(exc)
            finally:
                # Clean up connection for this thread
                connections.close_all()

        threads = []
        for i in range(num_threads):
            local_id, items = items_list[i]
            t = threading.Thread(target=worker, args=(local_id, items))
            t.daemon = True
            threads.append(t)

        # Start all threads
        for t in threads:
            t.start()

        # Wait for all threads to finish
        for t in threads:
            t.join(timeout=timeout_seconds)

        # If any thread is still alive after timeout, something went wrong
        alive = [t for t in threads if t.is_alive()]
        if alive:
            raise RuntimeError(f"{len(alive)} thread(s) did not finish within {timeout_seconds}s")

        return results, errors

    # ------------------------------------------------------------------
    # Test 1: Same product – limited stock (stock=1, 2 concurrent requests)
    # ------------------------------------------------------------------
    def test_same_product_limited_stock(self):
        barber = self._make_barber()
        product = self._make_product(stock=1)

        items = [{"item_id": str(product.id), "quantity": 1}]
        local_id_1 = str(uuid4())
        local_id_2 = str(uuid4())

        items_list = [
            (local_id_1, items),
            (local_id_2, items),
        ]

        results, errors = self._run_concurrent_checkouts(
            barber_id=barber.id,
            items_list=items_list,
            num_threads=2,
            expected_success=1,
        )

        # Exactly one success
        assert len(results) == 1, f"Expected 1 success, got {len(results)}"
        # Exactly one failure (OutOfStockError)
        assert len(errors) == 1, f"Expected 1 error, got {len(errors)}"
        assert isinstance(errors[0], OutOfStockError), (
            f"Expected OutOfStockError, got {type(errors[0]).__name__}: {errors[0]}"
        )

        # Final stock = 0
        product.refresh_from_db()
        assert product.stock == 0

        # Only one Transaction record
        assert Transaction.objects.count() == 1

    # ------------------------------------------------------------------
    # Test 2: Different products – all should succeed
    # ------------------------------------------------------------------
    def test_different_products_all_succeed(self):
        barber = self._make_barber()
        product_a = self._make_product(stock=5)
        product_b = self._make_product(stock=5)

        # 5 checkouts for product A, 5 for product B
        items_list = []
        for i in range(5):
            items_list.append(
                (str(uuid4()), [{"item_id": str(product_a.id), "quantity": 1}])
            )
        for i in range(5):
            items_list.append(
                (str(uuid4()), [{"item_id": str(product_b.id), "quantity": 1}])
            )

        results, errors = self._run_concurrent_checkouts(
            barber_id=barber.id,
            items_list=items_list,
            num_threads=10,
            expected_success=10,
        )

        # All 10 succeed
        assert len(results) == 10, f"Expected 10 successes, got {len(results)}"
        assert len(errors) == 0, f"Expected 0 errors, got {len(errors)}: {errors}"

        # Final stock = 0 for both
        product_a.refresh_from_db()
        product_b.refresh_from_db()
        assert product_a.stock == 0
        assert product_b.stock == 0

        # 10 transactions
        assert Transaction.objects.count() == 10

    # ------------------------------------------------------------------
    # Test 3: Partial stock availability (stock=3, 5 concurrent requests)
    # ------------------------------------------------------------------
    def test_partial_stock_availability(self):
        barber = self._make_barber()
        product = self._make_product(stock=3)

        items = [{"item_id": str(product.id), "quantity": 1}]
        items_list = [(str(uuid4()), items) for _ in range(5)]

        results, errors = self._run_concurrent_checkouts(
            barber_id=barber.id,
            items_list=items_list,
            num_threads=5,
            expected_success=3,
        )

        # Exactly 3 succeed
        assert len(results) == 3, f"Expected 3 successes, got {len(results)}"
        # Exactly 2 fail
        assert len(errors) == 2, f"Expected 2 errors, got {len(errors)}"
        for err in errors:
            assert isinstance(err, OutOfStockError), (
                f"Expected OutOfStockError, got {type(err).__name__}: {err}"
            )

        # Final stock = 0
        product.refresh_from_db()
        assert product.stock == 0

        # 3 transactions
        assert Transaction.objects.count() == 3

    # ------------------------------------------------------------------
    # Test 4: Idempotency with concurrency (same local_id)
    # ------------------------------------------------------------------
    def test_idempotency_with_concurrency(self, barber, service_item):
        """Test multiple concurrent requests with same local_id"""
        from django.db import IntegrityError
        from src.modules.sales.exceptions import DuplicateLocalIdError
        
        local_id = f"same-id-{uuid4()}"
        num_threads = 3
        
        results = []
        errors = []
        error_lock = threading.Lock()
        barrier = threading.Barrier(num_threads)
        
        def worker(thread_id):
            from django.db import connection
            connection.close()
            
            try:
                barrier.wait(timeout=5)
                use_case = CheckoutUseCase(
                    DjangoTransactionRepository(),
                    DjangoStockRepository(),
                    DjangoItemRepository(),
                    DjangoBarberRepository()
                )
                result = use_case.execute(
                    local_id=local_id,
                    barber_id=barber.id,
                    discount=Decimal("0"),
                    items=[{"item_id": service_item.id, "quantity": 1}]
                )
                with error_lock:
                    results.append(result)
            except (DuplicateLocalIdError, IntegrityError) as e:
                with error_lock:
                    errors.append(e)
            except Exception as e:
                with error_lock:
                    errors.append(e)
            finally:
                connection.close()
        
        threads = []
        for i in range(num_threads):
            t = threading.Thread(target=worker, args=(i,))
            threads.append(t)
            t.start()
        
        for t in threads:
            t.join()
        
        # Hanya 1 yang sukses
        assert len(results) == 1, f"Expected 1 success, got {len(results)}"
        assert results[0]["status"] == "COMPLETED"
        
        # Sisanya dapat error (DuplicateLocalIdError atau IntegrityError)
        assert len(errors) == num_threads - 1
        
        # Cek database: hanya 1 transaksi
        from src.infrastructure.database.models import Transaction
        tx_count = Transaction.objects.filter(local_id=local_id).count()
        assert tx_count == 1, f"Expected 1 transaction, got {tx_count}"