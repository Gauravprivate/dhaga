from rest_framework import filters, generics

from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    pagination_class = None


class ProductListView(generics.ListAPIView):
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = (
            Product.objects.filter(is_active=True)
            .select_related('category')
            .prefetch_related('sizes')
        )
        params = self.request.query_params

        category = params.get('category')
        if category:
            queryset = queryset.filter(category__slug=category)

        size = params.get('size')
        if size:
            queryset = queryset.filter(sizes__size=size, sizes__stock__gt=0)

        min_price = params.get('min_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)

        max_price = params.get('max_price')
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        return queryset.distinct()


class ProductDetailView(generics.RetrieveAPIView):
    queryset = (
        Product.objects.filter(is_active=True)
        .select_related('category')
        .prefetch_related('sizes')
    )
    serializer_class = ProductSerializer
    lookup_field = 'slug'