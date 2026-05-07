from src.shared.base_exception import DomainException


class TransactionNotFoundError(DomainException):
    """Raised when a transaction is not found."""
    pass


class CannotVoidTransactionError(DomainException):
    """Raised when a transaction cannot be voided."""
    pass


class DuplicateLocalIdError(DomainException):
    """Raised when a local_id already exists (idempotency)."""
    pass
