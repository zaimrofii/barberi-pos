class DomainException(Exception):
    """Base class for all domain exceptions."""
    pass

class OutOfStockError(DomainException):
    pass

class DuplicateLocalIdError(DomainException):
    pass

class CannotVoidError(DomainException):
    pass

class ItemNotFoundError(DomainException):
    pass

class BarberNotFoundError(DomainException):
    pass

class TransactionNotFoundError(DomainException):
    pass
