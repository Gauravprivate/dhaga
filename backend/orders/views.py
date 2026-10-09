import logging

import razorpay
from django.conf import settings
from django.db.models import F


from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from products.models import Product, ProductSize

from .models import Cart, CartItem, Order, OrderItem
from .serializers import (
    AddToCartSerializer,
    CartSerializer,
    CheckoutSerializer,
    OrderSerializer,
    UpdateQuantitySerializer,
    unit_price,
)
logger = logging.getLogger(__name__)


def get_razorpay_client():
    return razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
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

class OrderListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        orders = (
            Order.objects.filter(user=request.user)
            .prefetch_related('items')
            .order_by('-created_at')
        )
        return Response(OrderSerializer(orders, many=True).data)

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            cart = Cart.objects.filter(user=request.user).first()
            items = list(cart.items.select_related('product')) if cart else []
            if not items:
                return Response(
                    {'detail': 'Your cart is empty.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Pass 1: lock the stock rows and check everything. No writes yet.
            locked = []
            for item in items:
                size_obj = (
                    ProductSize.objects.select_for_update()
                    .filter(product=item.product, size=item.size)
                    .first()
                )
                if (
                    not item.product.is_active
                    or not size_obj
                    or item.quantity > size_obj.stock
                ):
                    return Response(
                        {'detail': f'{item.product.name} ({item.size}) is out of stock or unavailable.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                locked.append((item, size_obj))

            # Pass 2: everything is fine, so write.
            total = sum(unit_price(i.product) * i.quantity for i in items)
            order = Order.objects.create(
                user=request.user, total=total, **serializer.validated_data
            )
            for item, size_obj in locked:
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    product_name=item.product.name,
                    size=item.size,
                    quantity=item.quantity,
                    price=unit_price(item.product),
                )
                size_obj.stock -= item.quantity
                size_obj.save()
            cart.items.all().delete()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items')


class CreatePaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk, user=request.user)
        if order.status != 'pending':
            return Response(
                {'detail': 'This order cannot be paid.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        amount = int(order.total * 100)  # Razorpay wants paise, not rupees
        try:
            rp_order = get_razorpay_client().order.create({
                'amount': amount,
                'currency': 'INR',
                'receipt': f'dhaga_order_{order.id}',
            })
        except Exception:
            logger.exception('Razorpay order creation failed')
            return Response(
                {'detail': 'Could not start the payment. Please try again.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        order.razorpay_order_id = rp_order['id']
        order.save(update_fields=['razorpay_order_id'])

        return Response({
            'key': settings.RAZORPAY_KEY_ID,
            'razorpay_order_id': rp_order['id'],
            'amount': amount,
            'currency': 'INR',
        })


class VerifyPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk, user=request.user)

        if order.status == 'paid':
            return Response(OrderSerializer(order).data)
        if order.status != 'pending':
            return Response(
                {'detail': 'This order cannot be paid.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        params = {
            'razorpay_order_id': request.data.get('razorpay_order_id', ''),
            'razorpay_payment_id': request.data.get('razorpay_payment_id', ''),
            'razorpay_signature': request.data.get('razorpay_signature', ''),
        }
        if not order.razorpay_order_id or params['razorpay_order_id'] != order.razorpay_order_id:
            return Response(
                {'detail': 'Payment does not match this order.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            get_razorpay_client().utility.verify_payment_signature(params)
        except razorpay.errors.SignatureVerificationError:
            return Response(
                {'detail': 'Payment verification failed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.status = 'paid'
        order.razorpay_payment_id = params['razorpay_payment_id']
        order.save(update_fields=['status', 'razorpay_payment_id'])
        return Response(OrderSerializer(order).data)


class CancelOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        with transaction.atomic():
            order = get_object_or_404(
                Order.objects.select_for_update(), pk=pk, user=request.user
            )
            if order.status != 'pending':
                return Response(
                    {'detail': 'Only pending orders can be cancelled.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            for item in order.items.all():
                if item.product_id:
                    ProductSize.objects.select_for_update().filter(
                        product_id=item.product_id, size=item.size
                    ).update(stock=F('stock') + item.quantity)

            order.status = 'cancelled'
            order.save(update_fields=['status'])

        return Response(OrderSerializer(order).data)