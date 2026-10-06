from django.urls import path

from .views import CategoryListView, ProductDetailView, ProductListView

urlpatterns = [
    path('categories/', CategoryListView.as_view()),
    path('products/', ProductListView.as_view()),
    path('products/<slug:slug>/', ProductDetailView.as_view()),
]