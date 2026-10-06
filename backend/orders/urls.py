from django.urls import path

from .views import CartItemAddView, CartItemDetailView, CartView

urlpatterns = [
    path('cart/', CartView.as_view()),
    path('cart/items/', CartItemAddView.as_view()),
    path('cart/items/<int:pk>/', CartItemDetailView.as_view()),
]