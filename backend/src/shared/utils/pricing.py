from decimal import Decimal, ROUND_HALF_UP
from typing import List


def calculate_total(items: List[dict], discount: Decimal) -> Decimal:
    """
    Single authoritative pricing formula.

    items: [{"price_at_sale": Decimal, "quantity": int}, ...]
    discount: Decimal

    Returns total rounded to 2 decimal places.
    Never use float — always Decimal.
    """
    subtotal = sum(
        Decimal(str(item["price_at_sale"])) * item["quantity"]
        for item in items
    )
    total = subtotal - Decimal(str(discount))
    return total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
