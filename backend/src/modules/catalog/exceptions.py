from src.shared.base_exception import DomainException


class ItemNotFoundError(DomainException):
    """Raised when an item is not found."""
    pass


class OutOfStockError(DomainException):
    """Raised when stock is insufficient."""
    pass
