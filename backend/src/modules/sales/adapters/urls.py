from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CheckoutView,
    VoidTransactionView,
    CommissionReportView,
    BarberViewSet,
    ItemViewSet,
)

router = DefaultRouter()
router.register(r'barbers', BarberViewSet, basename='barber')
router.register(r'items', ItemViewSet, basename='item')

urlpatterns = [
    path('checkout', CheckoutView.as_view(), name='checkout'),
    path('transactions/<uuid:transaction_id>/void', VoidTransactionView.as_view(), name='void-transaction'),
    path('reports/commissions', CommissionReportView.as_view(), name='commission-report'),
    path('', include(router.urls)),
]
