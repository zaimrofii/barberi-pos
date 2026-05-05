from django.urls import path
from .views import CheckoutView, VoidTransactionView, CommissionReportView

urlpatterns = [
    path('checkout', CheckoutView.as_view(), name='checkout'),
    path('transactions/<uuid:transaction_id>/void', VoidTransactionView.as_view(), name='void-transaction'),
    path('reports/commissions', CommissionReportView.as_view(), name='commission-report'),
]
