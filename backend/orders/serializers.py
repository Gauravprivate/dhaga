from rest_framework import serializers

from .models import Cart, CartItem


def unit_price(product):
    return product.discount_price or product.price


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_slug = serializers.CharField(source='product.slug', read_only=True)
    image = serializers.SerializerMethodField()
    unit_price = serializers.SerializerMethodField()
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'product_name', 'product_slug', 'image',
            'size', 'quantity', 'unit_price', 'line_total',
        ]

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.product.image and request:
            return request.build_absolute_uri(obj.product.image.url)
        return None

    def get_unit_price(self, obj):
        return unit_price(obj.product)

    def get_line_total(self, obj):
        return unit_price(obj.product) * obj.quantity


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'item_count', 'total']

    def get_total(self, obj):
        return sum(unit_price(i.product) * i.quantity for i in obj.items.all())

    def get_item_count(self, obj):
        return sum(i.quantity for i in obj.items.all())


class AddToCartSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    size = serializers.CharField(max_length=3)
    quantity = serializers.IntegerField(min_value=1, default=1)


class UpdateQuantitySerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)