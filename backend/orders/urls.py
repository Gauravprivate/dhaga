from django.urls import path

from .views import (
    CancelOrderView,
    CartItemAddView,
    CartItemDetailView,
    CartView,
    CreatePaymentView,
    OrderDetailView,
    OrderListCreateView,
    VerifyPaymentView,
)

urlpatterns = [
    path('cart/', CartView.as_view()),
    path('cart/items/', CartItemAddView.as_view()),
    path('cart/items/<int:pk>/', CartItemDetailView.as_view()),
    path('orders/', OrderListCreateView.as_view()),
    path('orders/<int:pk>/', OrderDetailView.as_view()),
    path('orders/<int:pk>/pay/', CreatePaymentView.as_view()),
    path('orders/<int:pk>/verify/', VerifyPaymentView.as_view()),
    path('orders/<int:pk>/cancel/', CancelOrderView.as_view()),
]