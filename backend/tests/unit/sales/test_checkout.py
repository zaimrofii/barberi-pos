import pytest
from decimal import Decimal
from uuid import uuid4
from unittest.mock import MagicMock

from src.modules.sales.use_cases.checkout import CheckoutUseCase
from src.modules.sales.exceptions import DuplicateLocalIdError
from src.modules.staff.exceptions import BarberNotFoundError
from src.modules.catalog.exceptions import ItemNotFoundError, OutOfStockError


@pytest.mark.unit
class TestCheckoutUseCase:
    # FUNGSI TEST: Memastikan proses checkout berhasil dengan campuran item (jasa dan produk)
    def test_successful_checkout_mixed_items(
        self, db, checkout_use_case, mock_repositories, sample_barber, sample_service, sample_product
    ):
        """Test untuk checkout sukses dengan kombinasi item jasa dan produk"""
        local_id = "tx-001"
        barber_id = sample_barber.id
        discount = Decimal("5000.00")
        items = [
            {"item_id": sample_service.id, "quantity": 1},
            {"item_id": sample_product.id, "quantity": 2},
        ]

        # Mock pengecekan idempotency (memastikan tidak ada transaksi duplikat)
        mock_repositories["transaction_repo"].get_by_local_id.return_value = None
        # Mock pengecekan keberadaan barber
        mock_repositories["barber_repo"].get_by_id.return_value = sample_barber
        # Mock pengambilan item yang terkunci untuk mencegah perubahan bersamaan
        mock_repositories["item_repo"].get_by_ids_for_update.return_value = [
            sample_service,
            sample_product,
        ]
        # Mock penyimpanan transaksi
        created_transaction = MagicMock()
        created_transaction.id = uuid4()
        mock_repositories["transaction_repo"].save.return_value = created_transaction

        result = checkout_use_case.execute(local_id, barber_id, discount, items)

        # Memastikan status transaksi adalah COMPLETED
        assert result["status"] == "COMPLETED"
        # total = (50000*1 + 25000*2) - 5000 = (50000+50000)-5000 = 95000
        assert result["total"] == Decimal("95000.00")
        assert result["transaction_id"] == created_transaction.id

        # Memastikan pengurangan stock hanya dipanggil untuk PRODUK (bukan jasa)
        mock_repositories["stock_repo"].bulk_deduct.assert_called_once_with(
            [{"item_id": sample_product.id, "quantity": 2}]
        )

        # Memastikan transaksi disimpan dengan data yang benar
        mock_repositories["transaction_repo"].save.assert_called_once()
        save_call_kwargs = mock_repositories["transaction_repo"].save.call_args[0][0]
        assert save_call_kwargs["local_id"] == local_id
        assert save_call_kwargs["barber_id"] == barber_id
        assert save_call_kwargs["status"] == "COMPLETED"
        assert save_call_kwargs["discount"] == discount

        # Memastikan item transaksi disimpan dengan snapshot harga (data tidak berubah nanti)
        mock_repositories["transaction_repo"].save_items.assert_called_once()
        save_items_call = mock_repositories["transaction_repo"].save_items.call_args[1]
        assert save_items_call["transaction_id"] == created_transaction.id
        items_saved = save_items_call["items"]
        assert len(items_saved) == 2
        # Memastikan snapshot nilai jasa tersimpan dengan benar
        service_snapshot = next(i for i in items_saved if i["item_id"] == sample_service.id)
        assert service_snapshot["price_at_sale"] == sample_service.price
        assert service_snapshot["commission_rate"] == sample_service.commission_rate
        # Memastikan snapshot nilai produk tersimpan dengan benar
        product_snapshot = next(i for i in items_saved if i["item_id"] == sample_product.id)
        assert product_snapshot["price_at_sale"] == sample_product.price
        assert product_snapshot["commission_rate"] == sample_product.commission_rate

    # FUNGSI TEST: Memastikan error muncul saat local_id sudah pernah dipakai
    def test_duplicate_local_id_raises_error(self, checkout_use_case, mock_repositories):
        """Test untuk kasus local_id yang sudah ada/duplikat - seharusnya raise error"""
        local_id = "tx-dup"
        existing_transaction = MagicMock()
        existing_transaction.id = uuid4()
        mock_repositories["transaction_repo"].get_by_local_id.return_value = existing_transaction

        # Memastikan exception DuplicateLocalIdError muncul
        with pytest.raises(DuplicateLocalIdError):
            checkout_use_case.execute(
                local_id=local_id,
                barber_id=uuid4(),
                discount=Decimal("0.00"),
                items=[{"item_id": uuid4(), "quantity": 1}],
            )

    # FUNGSI TEST: Memastikan error muncul jika barber tidak ditemukan
    def test_barber_not_found_raises_error(self, checkout_use_case, mock_repositories):
        """Test untuk kasus barber tidak ditemukan di database - seharusnya raise error"""
        mock_repositories["transaction_repo"].get_by_local_id.return_value = None
        mock_repositories["barber_repo"].get_by_id.return_value = None

        # Memastikan exception BarberNotFoundError muncul
        with pytest.raises(BarberNotFoundError):
            checkout_use_case.execute(
                local_id="tx-002",
                barber_id=uuid4(),
                discount=Decimal("0.00"),
                items=[{"item_id": uuid4(), "quantity": 1}],
            )

    # FUNGSI TEST: Memastikan error muncul jika item tidak ditemukan
    def test_item_not_found_raises_error(self, db, checkout_use_case, mock_repositories, sample_barber):
        """Test untuk kasus item (jasa/produk) tidak ditemukan - seharusnya raise error"""
        mock_repositories["transaction_repo"].get_by_local_id.return_value = None
        mock_repositories["barber_repo"].get_by_id.return_value = sample_barber
        # Mengembalikan item lebih sedikit dari yang diminta
        mock_repositories["item_repo"].get_by_ids_for_update.return_value = []

        # Memastikan exception ItemNotFoundError muncul
        with pytest.raises(ItemNotFoundError):
            checkout_use_case.execute(
                local_id="tx-003",
                barber_id=sample_barber.id,
                discount=Decimal("0.00"),
                items=[{"item_id": uuid4(), "quantity": 1}],
            )

    # FUNGSI TEST: Memastikan error muncul jika stok produk tidak mencukupi
    def test_insufficient_stock_raises_error(
        self, db, checkout_use_case, mock_repositories, sample_barber, sample_product
    ):
        """Test untuk kasus stok produk kurang dari yang diminta - seharusnya raise error"""
        mock_repositories["transaction_repo"].get_by_local_id.return_value = None
        mock_repositories["barber_repo"].get_by_id.return_value = sample_barber
        # Mengatur stok lebih rendah dari yang diminta
        sample_product.stock = 1
        mock_repositories["item_repo"].get_by_ids_for_update.return_value = [sample_product]

        # Memastikan exception OutOfStockError muncul
        with pytest.raises(OutOfStockError):
            checkout_use_case.execute(
                local_id="tx-004",
                barber_id=sample_barber.id,
                discount=Decimal("0.00"),
                items=[{"item_id": sample_product.id, "quantity": 5}],
            )

    # FUNGSI TEST: Memastikan pengurangan stok HANYA untuk produk (bukan jasa)
    def test_stock_deduction_only_for_product(
        self, db, checkout_use_case, mock_repositories, sample_barber, sample_service, sample_product
    ):
        """Test untuk memastikan bahwa hanya produk yang stoknya dikurangi, jasa tidak"""
        mock_repositories["transaction_repo"].get_by_local_id.return_value = None
        mock_repositories["barber_repo"].get_by_id.return_value = sample_barber
        mock_repositories["item_repo"].get_by_ids_for_update.return_value = [
            sample_service,
            sample_product,
        ]
        created_transaction = MagicMock()
        created_transaction.id = uuid4()
        mock_repositories["transaction_repo"].save.return_value = created_transaction

        checkout_use_case.execute(
            local_id="tx-005",
            barber_id=sample_barber.id,
            discount=Decimal("0.00"),
            items=[
                {"item_id": sample_service.id, "quantity": 1},
                {"item_id": sample_product.id, "quantity": 3},
            ],
        )

        # Hanya produk yang seharusnya dikurangi stoknya
        mock_repositories["stock_repo"].bulk_deduct.assert_called_once_with(
            [{"item_id": sample_product.id, "quantity": 3}]
        )

    # FUNGSI TEST: Memastikan transaksi tersimpan dengan status COMPLETED
    def test_transaction_saved_with_completed_status(
        self, db, checkout_use_case, mock_repositories, sample_barber, sample_service
    ):
        """Test untuk memastikan status transaksi yang sukses adalah COMPLETED"""
        mock_repositories["transaction_repo"].get_by_local_id.return_value = None
        mock_repositories["barber_repo"].get_by_id.return_value = sample_barber
        mock_repositories["item_repo"].get_by_ids_for_update.return_value = [sample_service]
        created_transaction = MagicMock()
        created_transaction.id = uuid4()
        mock_repositories["transaction_repo"].save.return_value = created_transaction

        result = checkout_use_case.execute(
            local_id="tx-006",
            barber_id=sample_barber.id,
            discount=Decimal("0.00"),
            items=[{"item_id": sample_service.id, "quantity": 1}],
        )

        # Memastikan status yang dikembalikan adalah COMPLETED
        assert result["status"] == "COMPLETED"
        save_data = mock_repositories["transaction_repo"].save.call_args[0][0]
        assert save_data["status"] == "COMPLETED"

    # FUNGSI TEST: Memastikan diskon dihitung dengan benar
    def test_discount_applied_correctly(
        self, db, checkout_use_case, mock_repositories, sample_barber, sample_service
    ):
        """Test untuk memastikan perhitungan diskon mengurangi total dengan benar"""
        mock_repositories["transaction_repo"].get_by_local_id.return_value = None
        mock_repositories["barber_repo"].get_by_id.return_value = sample_barber
        mock_repositories["item_repo"].get_by_ids_for_update.return_value = [sample_service]
        created_transaction = MagicMock()
        created_transaction.id = uuid4()
        mock_repositories["transaction_repo"].save.return_value = created_transaction

        discount = Decimal("10000.00")
        result = checkout_use_case.execute(
            local_id="tx-007",
            barber_id=sample_barber.id,
            discount=discount,
            items=[{"item_id": sample_service.id, "quantity": 1}],
        )

        # harga 50000 - diskon 10000 = 40000
        assert result["total"] == Decimal("40000.00")
