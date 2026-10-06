from django.contrib import admin
from .models import Category, Product, ProductSize


class ProductSizeInline(admin.TabularInline):
    model = ProductSize
    extra = 5


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'is_new', 'is_active')
    list_filter = ('category', 'is_new', 'is_active')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductSizeInline]