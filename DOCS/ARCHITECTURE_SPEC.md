# Architecture Specification

## 1. Core Mission

This document serves as the single source of truth for the Barbershop Point‑of‑Sale backend.  
It defines a **Domain‑Driven‑Design** modular monolith, **immutable snapshotting** for audit‑proof financial data, **offline‑first** synchronisation via UUID identifiers, **idempotency** guarantees, **pessimistic concurrency control** for stock operations, and a **status‑based invalidation** pattern (VOIDED) in place of hard deletes.

---

## 2. Database Schema (PostgreSQL)

### 2.1 Table `barbers`

| Column          | Type                     | Constraints                              |
|-----------------|--------------------------|------------------------------------------|
| id              | UUID                     | PRIMARY KEY DEFAULT uuid_generate_v4()   |
| name            | VARCHAR(255)             | NOT NULL                                 |
| created_at      | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW()                   |
| updated_at      | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW()                   |

### 2.2 Table `items`

| Column          | Type                     | Constraints                              |
|-----------------|--------------------------|------------------------------------------|
| id              | UUID                     | PRIMARY KEY DEFAULT uuid_generate_v4()   |
| type            | VARCHAR(20)              | NOT NULL CHECK (type IN ('SERVICE','PRODUCT')) |
| name            | VARCHAR(255)             | NOT NULL                                 |
| price           | DECIMAL(10,2)            | NOT NULL CHECK (price >= 0)              |
| stock           | INTEGER                  | DEFAULT 0 CHECK (stock >= 0)             |
| commission_rate | DECIMAL(5,4)             | NOT NULL DEFAULT 0.0000                  |
| created_at      | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW()                   |
| updated_at      | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW()                   |

### 2.3 Table `transactions`

| Column      | Type                     | Constraints                              |
|-------------|--------------------------|------------------------------------------|
| id          | UUID                     | PRIMARY KEY DEFAULT uuid_generate_v4()   |
| local_id    | VARCHAR(36)              | UNIQUE NOT NULL                         |
| barber_id   | UUID                     | NOT NULL REFERENCES barbers(id)          |
| status      | VARCHAR(20)              | NOT NULL CHECK (status IN ('COMPLETED','VOIDED')) |
| discount    | DECIMAL(10,2)            | NOT NULL DEFAULT 0.00 CHECK (discount >= 0) |
| void_reason | TEXT                     |                                          |
| created_at  | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW()                   |
| updated_at  | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW()                   |

* `local_id` ensures idempotency: the client generates it once.

### 2.4 Table `transaction_items`

| Column          | Type                     | Constraints                              |
|-----------------|--------------------------|------------------------------------------|
| id              | UUID                     | PRIMARY KEY DEFAULT uuid_generate_v4()   |
| transaction_id  | UUID                     | NOT NULL REFERENCES transactions(id)      |
| item_id         | UUID                     | NOT NULL REFERENCES items(id)            |
| barber_id       | UUID                     | NOT NULL REFERENCES barbers(id)          |
| quantity        | INTEGER                  | NOT NULL CHECK (quantity > 0)            |
| price_at_sale   | DECIMAL(10,2)            | NOT NULL CHECK (price_at_sale >= 0)      |
| commission_rate | DECIMAL(5,4)             | NOT NULL                                 |
| created_at      | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT NOW()                   |

### 2.5 Indexes

```sql
-- Composite index for fast per‑barber commission reports
CREATE INDEX idx_tx_items_barber_created
    ON transaction_items (barber_id, created_at);

-- Index for finding transactions by status
CREATE INDEX idx_transactions_status
    ON transactions (status);

-- Index for local_id uniqueness (already covered by UNIQUE constraint)
```

---

## 3. Folder Structure (Django / Python)

```
src/
├─ modules/                              # Domain modules
│  ├─ sales/                             # Checkout & Void use‑cases
│  │  ├─ domain/                         # Aggregates, Domain Events
│  │  ├─ use_cases/                      # CheckoutUseCase, VoidUseCase
│  │  ├─ adapters/                       # Controllers (REST), DTOs
│  │  └─ repositories/                   # (interfaces)
│  ├─ inventory/                         # Stock deduction/restoration
│  │  ├─ domain/                         # Value Objects
│  │  ├─ services/                       # StockService
│  │  └─ repositories/
│  ├─ staff/                             # Commission calculation
│  │  ├─ domain/                         # CommissionRate value object
│  │  ├─ use_cases/                      # CommissionReportUseCase
│  │  └─ repositories/
│  └─ catalog/                           # Items CRUD (services/products)
│      ├─ domain/
│      └─ use_cases/
├─ shared/                               # Shared Kernel
│  ├─ domain/                            # Base Entity, Identifier
│  ├─ utils/                             # Pricing formula, tax/discount helpers
│  └─ events/                            # Domain Event Bus (in‑memory, async)
└─ infrastructure/                       # Frameworks & infrastructure
   ├─ database/
   │  ├─ models/                         # Django ORM models (implementation)
   │  ├─ repositories/                   # Concrete repository implementations
   │  └─ migrations/
   └─ adapters/                          # External integrations (e.g., SMS, payment)
```

* Domain Services reside in `src/modules/*/services/`.
* Use‑Cases (interactors) reside in `src/modules/*/use_cases/`.
* Repository interfaces are defined in the domain layer; implementations are in `infrastructure/database/repositories/`.

---

## 4. API Definitions

All endpoints are prefixed with `/api/v1`.

### 4.1 `POST /checkout`

**Request:**
```json
{
  "local_id": "550e8400-e29b-41d4-a716-446655440000",
  "barber_id": "b1a2c3d4-...-...",
  "discount": 5000.00,
  "items": [
    {
      "item_id": "item-uuid",
      "quantity": 1
    }
  ]
}
```

**Response 200 (success):**
```json
{
  "transaction_id": "tx-uuid",
  "status": "COMPLETED",
  "total": 150000.00
}
```

**Response 409 (duplicate `local_id`):**
```json
{
  "error": "DUPLICATE_LOCAL_ID",
  "transaction_id": "existing-tx-uuid",
  "detail": "A transaction with this local_id already exists"
}
```

### 4.2 `PATCH /transactions/{id}/void`

**Request:**
```json
{
  "void_reason": "Customer cancelled order"
}
```

**Response 200:**
```json
{
  "transaction_id": "...",
  "status": "VOIDED"
}
```

**Response 400 (already voided or completed):**
```json
{
  "error": "CANNOT_VOID",
  "detail": "Only COMPLETED transactions can be voided"
}
```

### 4.3 `GET /reports/commissions?barber_id=<uuid>&start_date=<ISO>&end_date=<ISO>&page=1&per_page=50`

**Response 200:**
```json
{
  "barber_id": "...",
  "from": "2026-01-01",
  "to": "2026-12-31",
  "commissions": [
    {
      "transaction_id": "...",
      "commission_amount": 15000.00,
      "created_at": "2026-05-04T10:30:00Z"
    }
  ],
  "total_commission": 450000.00,
  "page": 1,
  "per_page": 50
}
```

---

## 5. Service Logic & Sequence – `CheckoutUseCase`

```
1. IDEMPOTENCY CHECK
   - Query transactions WHERE local_id = request.local_id
   - If found → return existing transaction (409) without side effects

2. CONCURRENCY LOCK (Pessimistic Locking)
   - BEGIN DB transaction
   - SELECT id, stock, price, commission_rate FROM items
     WHERE id IN (request.item_ids)
     FOR UPDATE
   - (Acquires row‑level locks; other checkout processes wait)

3. STOCK VERIFICATION
   - For each item of type 'PRODUCT':
     - Ensure item.stock >= requested quantity
     - If insufficient → ROLLBACK & return 422 (OUT_OF_STOCK)

4. IMMUTABLE SNAPSHOT
   - For each item, record current price and commission_rate
     into transaction_items (price_at_sale, commission_rate)

5. CALCULATE TOTAL (Single Shared Utility)
   - total = Σ (price_at_sale × quantity) - discount
   - (Discount is stored in transactions table)

6. STOCK DEDUCTION
   - UPDATE items SET stock = stock - quantity
     WHERE id IN (product_ids)
     (already locked, safe)

7. PERSIST TRANSACTION
   - CREATE transactions local_id, barber_id, status='COMPLETED',
     discount, void_reason=NULL
   - Bulk CREATE transaction_items rows

8. COMMIT DB TRANSACTION
   - (locks released)

9. EMIT DOMAIN EVENT
   - TransactionCompletedEvent { transaction_id, total, barber_id, items }
   - (Future: notify external systems, trigger tax reports)

10. RETURN transaction_id & total to client
```

**Void flow reverses step 6:**  
`UPDATE items SET stock = stock + quantity WHERE id IN (product_ids)`  
(Happens inside a new pessimistic lock, ensuring no race condition.)

---

## 6. Architectural Risks & Mitigations

### 6.1 Rapid Growth of `transaction_items` (Snapshot Table)
- **Risk:** Row count grows linearly with each transaction item. Queries that scan the table without proper indexes become expensive.
- **Mitigation:**
  - Composite index `(barber_id, created_at)` as defined above.
  - Partition the table by month (native PostgreSQL partitioning) once the table exceeds 5 million rows.
  - Retain only aggregated commission records in the same table; older granular data can be archived after 2–3 years.

### 6.2 Index Overhead on `transaction_items`
- **Risk:** Frequent inserts (`transaction_items` per checkout) update multiple B‑tree indexes, slowing write throughput.
- **Mitigation:**
  - Use a single composite index (barber_id, created_at) that also covers the most common query pattern (per‑barber reports). Avoid extra per‑column indexes.
  - Consider using `fillfactor = 90` on the index during “off‑peak” windows to reduce page splits.

### 6.3 Offline‑Sync Conflicts (local_id)
- **Risk:** Two devices generate the same UUID? Probability is astronomically low but still exists.
- **Mitigation:**
  - Enforce `local_id` as UNIQUE in the DB. Collisions during sync return 409; the client re‑queries existing transaction.
  - The client must **never** reuse a `local_id`; use UUID v4 with sufficient randomness.

### 6.4 Pessimistic Locking Contention
- **Risk:** Under high concurrency (many checkouts for the same product), `SELECT ... FOR UPDATE` blocks waiting clients, increasing latency.
- **Mitigation:**
  - Shorten the locked section to the absolute minimum (fetch stock, check, update).
  - Introduce distributed locking (e.g., Redis) only after physical scaling requires it.
  - For extremely hot items, consider an asynchronous stock reservation pattern with eventual consistency.

### 6.5 Multi‑row Inventory Reversal on Void
- **Risk:** A race condition where another transaction creates or reduces stock between the void command and the restoration `UPDATE`.
- **Mitigation:**
  - Perform void within its own pessimistic lock (`SELECT ... FOR UPDATE`) on the items being restored.
  - Use optimistic locking (`updated_at` timestamp) as an extra guard; the `UPDATE` statement checks that `stock` and `updated_at` match expectations, otherwise retry.

### 6.6 Decimal Precision
- **Risk:** Accumulated rounding errors due to discount/commission calculations (DECIMAL in DB, float in business logic).
- **Mitigation:**
  - Keep all monetary values as `DECIMAL(10,2)` in the database.
  - In Python use `Decimal` from the `decimal` module, not `float`.
  - The shared pricing formula must be the single point of translation between DB and view level.

---

*This document is the authoritative source for every architectural decision during development. All code changes must align with the schema, folder structure, and service logic described here.*
