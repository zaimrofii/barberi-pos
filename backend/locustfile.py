import random
from uuid import uuid4

from locust import HttpUser, between, task


class BarbershopUser(HttpUser):
    """
    Simulates a real Barbershop POS user performing various API operations.
    """

    wait_time = between(1, 3)

    def on_start(self):
        """
        Fetch existing barber and product IDs from the API so we can use them
        in subsequent tasks.  The data must have been seeded beforehand via
        `python manage.py seed_load_test_data`.
        """
        # Fetch barbers
        with self.client.get(
            "/api/v1/barbers/",
            catch_response=True,
            name="on_start_barbers",
        ) as resp:
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list) and len(data) > 0:
                    self.barber_id = data[0]["id"]
                else:
                    self.barber_id = None
            else:
                self.barber_id = None

        # Fetch PRODUCT items
        with self.client.get(
            "/api/v1/items/?type=PRODUCT",
            catch_response=True,
            name="on_start_items",
        ) as resp:
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list) and len(data) > 0:
                    self.product_id = data[0]["id"]
                else:
                    self.product_id = None
            else:
                self.product_id = None

        # Fetch SERVICE items
        with self.client.get(
            "/api/v1/items/?type=SERVICE",
            catch_response=True,
            name="on_start_services",
        ) as resp:
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list) and len(data) > 0:
                    self.service_id = data[0]["id"]
                else:
                    self.service_id = None
            else:
                self.service_id = None

    # ------------------------------------------------------------------
    # Tasks
    # ------------------------------------------------------------------

    @task(3)
    def checkout_mixed_items(self):
        """
        Checkout containing one SERVICE item and one PRODUCT item.
        """
        if not self.barber_id or not self.service_id or not self.product_id:
            # Data not available, skip this task
            return

        local_id = str(uuid4())
        payload = {
            "local_id": local_id,
            "barber_id": self.barber_id,
            "discount": "0.00",
            "items": [
                {"item_id": self.service_id, "quantity": 1},
                {"item_id": self.product_id, "quantity": 1},
            ],
        }

        with self.client.post(
            "/api/v1/checkout/",
            json=payload,
            catch_response=True,
            name="checkout_mixed_items",
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            elif resp.status_code in (409, 422, 404):
                # Expected failures (duplicate local_id, out of stock, not found)
                resp.success()
            else:
                resp.failure(f"Unexpected status {resp.status_code}: {resp.text}")

    @task(2)
    def checkout_only_product(self):
        """
        Checkout containing only a PRODUCT item.
        """
        if not self.barber_id or not self.product_id:
            return

        local_id = str(uuid4())
        payload = {
            "local_id": local_id,
            "barber_id": self.barber_id,
            "discount": "0.00",
            "items": [
                {"item_id": self.product_id, "quantity": 1},
            ],
        }

        with self.client.post(
            "/api/v1/checkout/",
            json=payload,
            catch_response=True,
            name="checkout_only_product",
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            elif resp.status_code in (409, 422, 404):
                resp.success()
            else:
                resp.failure(f"Unexpected status {resp.status_code}: {resp.text}")

    @task(1)
    def get_barbers(self):
        """
        List all barbers.
        """
        with self.client.get(
            "/api/v1/barbers/",
            catch_response=True,
            name="get_barbers",
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Unexpected status {resp.status_code}: {resp.text}")

    @task(1)
    def get_items(self):
        """
        List items filtered by type (randomly choose PRODUCT or SERVICE).
        """
        item_type = random.choice(["PRODUCT", "SERVICE"])
        with self.client.get(
            f"/api/v1/items/?type={item_type}",
            catch_response=True,
            name="get_items",
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Unexpected status {resp.status_code}: {resp.text}")

    @task(1)
    def get_commission_report(self):
        """
        Get commission report for the current barber.
        """
        if not self.barber_id:
            return

        params = {
            "barber_id": self.barber_id,
            "start_date": "2020-01-01",
            "end_date": "2030-12-31",
            "page": 1,
            "per_page": 10,
        }
        with self.client.get(
            "/api/v1/commission-report/",
            params=params,
            catch_response=True,
            name="get_commission_report",
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            elif resp.status_code == 404:
                # Barber may not have any transactions yet
                resp.success()
            else:
                resp.failure(f"Unexpected status {resp.status_code}: {resp.text}")
