from src.shared.base_exception import DomainException


class BarberNotFoundError(DomainException):
    """Raised when a barber is not found."""
    pass
