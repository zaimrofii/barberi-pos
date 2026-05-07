from src.shared.base_exception import DomainException


class StockNotFoundError(DomainException):
    """Raised when a stock record is not found."""
    pass


class InsufficientStockError(DomainException):
    """Raised when there is not enough stock."""
    pass
