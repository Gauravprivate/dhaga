from django.urls import path

from .views import (
    CartItemAddView,
    CartItemDetailView,
    CartView,
    OrderDetailView,
    OrderListCreateView,
)

urlpatterns = [
    path('cart/', CartView.as_view()),
    path('cart/items/', CartItemAddView.as_view()),
    path('cart/items/<int:pk>/', CartItemDetailView.as_view()),
    path('orders/', OrderListCreateView.as_view()),
    path('orders/<int:pk>/', OrderDetailView.as_view()),
]