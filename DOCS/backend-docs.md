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

## 7. Exception Handling Convention

### 7.1 Domain‑Owned Exceptions

Each domain module owns its own exceptions, defined in `src/modules/<domain>/exceptions.py`.  
All domain exceptions inherit from `src.shared.base_exception.DomainException`.

| Module       | File                          | Exceptions                                                                 |
|--------------|-------------------------------|----------------------------------------------------------------------------|
| catalog      | `src/modules/catalog/exceptions.py` | `ItemNotFoundError`, `OutOfStockError`                                     |
| inventory    | `src/modules/inventory/exceptions.py` | `StockNotFoundError`, `InsufficientStockError`                             |
| sales        | `src/modules/sales/exceptions.py` | `TransactionNotFoundError`, `CannotVoidTransactionError`, `DuplicateLocalIdError` |
| staff        | `src/modules/staff/exceptions.py` | `BarberNotFoundError`                                                      |

### 7.2 Naming Convention

All exception classes **must** end with the suffix `Error` (e.g., `BarberNotFoundError`, not `BarberNotFound`).  
This ensures consistency across the codebase and makes it easy to distinguish exceptions from other classes.

### 7.3 Base Exception

The single base class `DomainException` lives in `src/shared/base_exception.py`.  
It is re‑exported from `src/shared/exceptions.py` for backward compatibility, but new code should import directly from `src/shared.base_exception`.

### 7.4 No Exception Duplication

- Exceptions are **never** defined in `repositories/exceptions.py` anymore.
- The old `repositories/exceptions.py` files have been deleted.
- All imports must reference the domain‑level `exceptions.py` files listed above.

## 📝 Tambahan untuk `ARCHITECTURE_SPEC.md`

Tambahkan section berikut di akhir file (sebelum penutup):

---

## 8. Testing Strategy

### 8.1 Testing Pyramid

| Level                 | Tools                     | Coverage                             | Target |
|-----------------------|---------------------------|--------------------------------------|--------|
| **Unit Tests**        | `pytest`, `pytest-mock`   | Business logic (pricing, use cases)  | 80%+ |
| **Integration Tests** | `pytest`, `pytest-django` | Repositories, database operations    | 60%+ |
| **Concurrency Tests** | `threading`, `pytest`     | Race conditions, `select_for_update` | Critical paths |
| **Load Tests**        | `locust`                  | API endpoints, RPS limits            | 50+ concurrent users |
| **Smoke Tests**       | `.http` (REST Client)     | Critical APIs sanity                 | 100% before deploy |

### 8.2 Test Commands

```bash
# Run all tests
pytest tests/ -v --tb=short

# Run by level
pytest tests/unit/ -v          # Unit tests only
pytest tests/integration/ -v   # Integration tests only

# Run with coverage
pytest --cov=src --cov-report=term --cov-report=html

# Load test
locust -f locustfile.py --host=http://localhost:8000
```

### 8.3 CI/CD Pipeline (GitHub Actions)

```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: barberi_pos
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: pytest tests/ -v --tb=short
```

---

## 9. Docker Deployment

### 9.1 Container Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Docker Host                         │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │   PostgreSQL    │    │       Django App            │ │
│  │   (pg-barberi)  │◄───│  (barberi-backend:latest)   │ │
│  │   Port: 5432    │    │       Port: 8000            │ │
│  └─────────────────┘    └─────────────────────────────┘ │
│         │                           │                    │
│         ▼                           ▼                    │
│  ┌─────────────────────────────────────────────────────┐│
│  │           Docker Network (barberi-network)          ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### 9.2 Dockerfile (Multi-stage)

```dockerfile
# Builder stage
FROM python:3.11-slim-bookworm AS builder
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y gcc libpq-dev
WORKDIR /install
COPY requirements.txt .
RUN pip install --prefix=/install -r requirements.txt

# Runtime stage
FROM python:3.11-slim-bookworm
RUN apt-get update && apt-get install -y libpq-dev curl \
    && adduser --disabled-password --no-create-home appuser
COPY --from=builder /install /usr/local
WORKDIR /app
COPY --chown=appuser:appuser . .
USER appuser
EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "config.wsgi:application"]
```

### 9.3 Docker Compose (Production)

```yaml
version: '3.8'
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
  app:
    build: .
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
    env_file:
      - .env
volumes:
  postgres_data:
```

### 9.4 Build & Run Commands

```bash
# Build image
docker build -t barberi-backend:latest .

# Run with existing PostgreSQL container
docker run -d --name barberi-app -p 8000:8000 \
  --network barberi-network \
  -e DB_HOST=pg-barberi \
  barberi-backend:latest

# Or use docker-compose
docker-compose up -d
```

---

## 10. Environment Variables

### 10.1 Required Variables (`.env` file)

| Variable      | Description              | Example        | Required |
|------------------------------------------------------------------------|
| `DB_NAME`     | PostgreSQL database name | `barberi_pos` | ✅ |
| `DB_USER`     | PostgreSQL username      | `zaimrofii`   | ✅ |
| `DB_PASSWORD` | PostgreSQL password      | `561561`      | ✅ |
| `DB_HOST`     | PostgreSQL host          | `localhost` or `pg-barberi` | ✅ |
| `DB_PORT`     | PostgreSQL port          | `5432`        | ✅ |
| `SECRET_KEY`  | Django secret key        | `django-insecure-...` | ✅ |
| `DEBUG`       | Debug mode (True/False)  | `False` for production | ✅ |

### 10.2 Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ALLOWED_HOSTS` | Comma-separated hosts | `localhost,127.0.0.1` |
| `STATIC_URL` | Static files URL | `/static/` |
| `MEDIA_URL` | Media files URL | `/media/` |

### 10.3 Example `.env` File

```bash
# Database
DB_NAME=barberi_pos
DB_USER=zaimrofii
DB_PASSWORD=561561
DB_HOST=localhost
DB_PORT=5432

# Django
SECRET_KEY=your-super-secret-key-change-in-production
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,api.yourdomain.com
```

### 10.4 Security Notes

- ⚠️ **NEVER** commit `.env` file to Git
- ⚠️ Use different passwords for development/production
- ⚠️ Generate new `SECRET_KEY` for production:
  ```bash
  python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
  ```

---

## 📋 Document Update Summary

| Section | Status | Content |
|---------|--------|---------|
| 8. Testing Strategy | ✅ Added | Pyramid, commands, CI/CD |
| 9. Docker Deployment | ✅ Added | Dockerfile, compose, commands |
| 10. Environment Variables | ✅ Added | Required vars, security notes |

**Architecture spec sekarang lebih lengkap untuk DevOps & testing!** 🚀
---

*This document is the authoritative source for every architectural decision during development. All code changes must align with the schema, folder structure, and service logic described here.*
