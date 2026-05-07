from typing import List
from uuid import UUID

from src.modules.staff.repositories.barber_repository import AbstractBarberRepository
from src.modules.staff.exceptions import BarberNotFoundError
from src.infrastructure.database.models import Barber


class DjangoBarberRepository(AbstractBarberRepository):

    def get_by_id(self, barber_id: UUID) -> Barber:
        try:
            return Barber.objects.get(id=barber_id)
        except Barber.DoesNotExist:
            raise BarberNotFound(f"Barber {barber_id} not found")

    def get_all(self) -> List[Barber]:
        return list(Barber.objects.all().order_by('name'))
