from decimal import Decimal
from uuid import UUID
from django.db import transaction as db_transaction

from src.modules.sales.repositories.transaction_repository import AbstractTransactionRepository
from src.modules.inventory.repositories.stock_repository import AbstractStockRepository
from src.modules.catalog.repositories.item_repository import AbstractItemRepository
from src.modules.staff.repositories.barber_repository import AbstractBarberRepository
from src.shared.utils.pricing import calculate_total
from src.shared.exceptions import (
    DuplicateLocalIdError,
    OutOfStockError,
    ItemNotFoundError,
    BarberNotFoundError,
)


class CheckoutUseCase:
    def __init__(
        self,
        transaction_repo: AbstractTransactionRepository,
        stock_repo: AbstractStockRepository,
        item_repo: AbstractItemRepository,
        barber_repo: AbstractBarberRepository,
    ):
        self.transaction_repo = transaction_repo
        self.stock_repo = stock_repo
        self.item_repo = item_repo
        self.barber_repo = barber_repo

    def execute(self, local_id: str, barber_id: UUID, discount: Decimal, items: list) -> dict:
        """
        Execute checkout flow. Returns {"transaction_id": UUID, "status": str, "total": Decimal}.

        items: [{"item_id": UUID, "quantity": int}, ...]

        Raises:
            DuplicateLocalIdError  — if local_id already exists (idempotency)
            BarberNotFoundError    — if barber_id does not exist
            ItemNotFoundError      — if any item_id does not exist
            OutOfStockError        — if any PRODUCT item has insufficient stock
        """

        # STEP 1 — IDEMPOTENCY CHECK (outside DB transaction, fast path)
        existing = self.transaction_repo.get_by_local_id(local_id)
        if existing is not None:
            raise DuplicateLocalIdError(existing.id)

        # STEP 2 — VALIDATE BARBER EXISTS
        barber = self.barber_repo.get_by_id(barber_id)
        if barber is None:
            raise BarberNotFoundError(f"Barber {barber_id} not found")

        item_ids = [UUID(str(i["item_id"])) for i in items]
        quantity_map = {UUID(str(i["item_id"])): i["quantity"] for i in items}

        with db_transaction.atomic():

            # STEP 3 — PESSIMISTIC LOCK: fetch all items with SELECT FOR UPDATE
            locked_items = self.item_repo.get_by_ids_for_update(item_ids)

            if len(locked_items) != len(item_ids):
                raise ItemNotFoundError("One or more items not found")

            # STEP 4 — STOCK VERIFICATION (PRODUCT type only)
            for item in locked_items:
                if item.type == "PRODUCT":
                    qty = quantity_map[item.id]
                    if item.stock < qty:
                        raise OutOfStockError(
                            f"Insufficient stock for item {item.id}: "
                            f"requested {qty}, available {item.stock}"
                        )

            # STEP 5 — BUILD IMMUTABLE SNAPSHOT + CALCULATE TOTAL
            snapshot_items = []
            for item in locked_items:
                qty = quantity_map[item.id]
                snapshot_items.append({
                    "item_id": item.id,
                    "barber_id": barber_id,
                    "quantity": qty,
                    "price_at_sale": item.price,       # snapshot harga saat ini
                    "commission_rate": item.commission_rate,  # snapshot komisi saat ini
                })

            total = calculate_total(
                [{"price_at_sale": s["price_at_sale"], "quantity": s["quantity"]} for s in snapshot_items],
                discount,
            )

            # STEP 6 — STOCK DEDUCTION (only PRODUCT items)
            deductions = [
                {"item_id": s["item_id"], "quantity": s["quantity"]}
                for s in snapshot_items
                if any(item.id == s["item_id"] and item.type == "PRODUCT" for item in locked_items)
            ]
            if deductions:
                self.stock_repo.bulk_deduct(deductions)

            # STEP 7 — PERSIST TRANSACTION + TRANSACTION ITEMS
            transaction = self.transaction_repo.save({
                "local_id": local_id,
                "barber_id": barber_id,
                "status": "COMPLETED",
                "discount": discount,
                "void_reason": None,
            })

            self.transaction_repo.save_items(
                transaction_id=transaction.id,
                items=snapshot_items,
            )

            # STEP 8 — COMMIT happens automatically at end of atomic() block

        # STEP 9 — DOMAIN EVENT (placeholder, to be implemented later)
        # event_bus.emit(TransactionCompletedEvent(transaction.id, total, barber_id, snapshot_items))

        # STEP 10 — RETURN
        return {
            "transaction_id": transaction.id,
            "status": "COMPLETED",
            "total": total,
        }
