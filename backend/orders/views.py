from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from products.models import Product, ProductSize

from .models import Cart, CartItem
from .serializers import (
    AddToCartSerializer,
    CartSerializer,
    UpdateQuantitySerializer,
)


def cart_response(request, code=status.HTTP_200_OK):
    cart, _ = Cart.objects.get_or_create(user=request.user)
    data = CartSerializer(cart, context={'request': request}).data
    return Response(data, status=code)


class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return cart_response(request)


class CartItemAddView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        product = get_object_or_404(Product, id=data['product_id'], is_active=True)
        size_obj = ProductSize.objects.filter(
            product=product, size=data['size']
        ).first()
        if not size_obj:
            return Response(
                {'detail': 'This size is not available for this product.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart, _ = Cart.objects.get_or_create(user=request.user)
        existing = CartItem.objects.filter(
            cart=cart, product=product, size=data['size']
        ).first()
        new_quantity = (existing.quantity if existing else 0) + data['quantity']

        if new_quantity > size_obj.stock:
            return Response(
                {'detail': f'Only {size_obj.stock} left in stock for this size.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        CartItem.objects.update_or_create(
            cart=cart, product=product, size=data['size'],
            defaults={'quantity': new_quantity},
        )
        return cart_response(request, status.HTTP_201_CREATED)


class CartItemDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_item(self, request, pk):
        # cart__user=request.user: a user can only touch their own cart items
        return get_object_or_404(CartItem, pk=pk, cart__user=request.user)

    def patch(self, request, pk):
        item = self.get_item(request, pk)
        serializer = UpdateQuantitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quantity = serializer.validated_data['quantity']

        size_obj = ProductSize.objects.filter(
            product=item.product, size=item.size
        ).first()
        if not size_obj or quantity > size_obj.stock:
            stock = size_obj.stock if size_obj else 0
            return Response(
                {'detail': f'Only {stock} left in stock for this size.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        item.quantity = quantity
        item.save()
        return cart_response(request)

    def delete(self, request, pk):
        self.get_item(request, pk).delete()
        return cart_response(request)