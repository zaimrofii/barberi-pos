from abc import ABC, abstractmethod
from uuid import UUID
from typing import List


class AbstractBarberRepository(ABC):

    @abstractmethod
    def get_by_id(self, barber_id: UUID):
        """
        Fetch barber by id.
        Raises BarberNotFound if not exists.
        """
        pass

    @abstractmethod
    def get_all(self) -> List:
        """
        Return all active barbers.
        """
        pass
