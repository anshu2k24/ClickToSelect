# DJANGO — FULL-SPECTRUM RAG KNOWLEDGE BASE

> Structured for AI Interviewer · Three-Level Contextual Model · Junior → Mid → Senior  
> Topics: Project Structure · Models · ORM · Views · URLs · Templates · Forms · DRF · Authentication · Middleware · Signals · Celery · Caching · Testing · Performance · Security · Deployment · Async Django

---

# SECTION 1 · PROJECT STRUCTURE & SETUP

> `[JUNIOR]` Project layout, settings, manage.py  
> `[MID]` App design, settings split, environment config  
> `[SENIOR]` Reusable apps, twelve-factor config, monorepo patterns

---

## 1.1 Project Layout

```
myproject/
├── manage.py                    # CLI entry point
├── pyproject.toml               # dependencies (Poetry/pip)
├── requirements/
│   ├── base.txt                 # shared deps
│   ├── local.txt                # dev-only (debug-toolbar, etc.)
│   └── production.txt           # prod-only (gunicorn, sentry-sdk)
├── config/                      # project config (rename from myproject/)
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py          # imports from base
│   │   ├── base.py              # shared settings
│   │   ├── local.py             # dev overrides
│   │   └── production.py        # prod overrides
│   ├── urls.py                  # root URL conf
│   ├── wsgi.py                  # WSGI entrypoint
│   └── asgi.py                  # ASGI entrypoint (async)
├── apps/
│   ├── users/
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py              # AppConfig
│   │   ├── migrations/
│   │   ├── models.py
│   │   ├── serializers.py       # DRF
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── signals.py
│   │   ├── tasks.py             # Celery
│   │   ├── tests/
│   │   │   ├── __init__.py
│   │   │   ├── test_models.py
│   │   │   ├── test_views.py
│   │   │   └── factories.py     # factory_boy
│   │   └── managers.py
│   └── orders/
├── static/
├── media/
├── templates/
└── docs/

# manage.py commands
python manage.py runserver            # dev server
python manage.py runserver 0.0.0.0:8000
python manage.py makemigrations       # generate migration files
python manage.py migrate              # apply migrations
python manage.py createsuperuser
python manage.py shell                # interactive shell
python manage.py shell_plus           # django-extensions: auto-imports models
python manage.py collectstatic        # gather static files
python manage.py check                # system check framework
python manage.py showmigrations
python manage.py sqlmigrate users 0001  # show SQL for migration
python manage.py dbshell              # database CLI
python manage.py test                 # run tests
python manage.py startapp myapp       # create new app
```

---

## 1.2 Settings

```python
# config/settings/base.py
from pathlib import Path
import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# django-environ — 12-factor app configuration
env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, []),
)
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("SECRET_KEY")
DEBUG       = env("DEBUG")
ALLOWED_HOSTS = env("ALLOWED_HOSTS")

INSTALLED_APPS = [
    # Django built-ins
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "corsheaders",
    "django_filters",
    "celery",
    # Local apps
    "apps.users",
    "apps.orders",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",      # static files in prod
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",           # MUST be before CommonMiddleware
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION  = "config.asgi.application"

# Database
DATABASES = {
    "default": env.db("DATABASE_URL", default="postgres://localhost/mydb"),
}
# DATABASE_URL=postgres://user:pass@host:5432/dbname

# Caching
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": env("REDIS_URL", default="redis://localhost:6379/0"),
    }
}

# Auth
AUTH_USER_MODEL = "users.User"   # custom user model — set BEFORE first migration

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE     = "UTC"
USE_I18N      = True
USE_TZ        = True             # ALWAYS use timezone-aware datetimes

# Static / Media
STATIC_URL  = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL   = "/media/"
MEDIA_ROOT  = BASE_DIR / "media"

# Default primary key
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Email
EMAIL_BACKEND = env("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")

# config/settings/production.py
from .base import *

DEBUG = False
SECURE_SSL_REDIRECT          = True
SECURE_HSTS_SECONDS          = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD          = True
SESSION_COOKIE_SECURE        = True
CSRF_COOKIE_SECURE           = True
SECURE_BROWSER_XSS_FILTER    = True
SECURE_CONTENT_TYPE_NOSNIFF  = True
X_FRAME_OPTIONS              = "DENY"
```

---

# SECTION 2 · MODELS & ORM

> `[JUNIOR]` Field types, relationships, basic queries  
> `[MID]` Managers, querysets, select_related, prefetch_related, annotations  
> `[SENIOR]` Custom managers, query optimization, F/Q expressions, database functions, indexes

---

## 2.1 Model Definition

```python
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator


class TimestampedModel(models.Model):
    """Abstract base model — adds created_at and updated_at to every model."""
    created_at = models.DateTimeField(auto_now_add=True)  # set on create only
    updated_at = models.DateTimeField(auto_now=True)       # updated on every save

    class Meta:
        abstract = True  # no database table — only used for inheritance


class User(AbstractBaseUser, PermissionsMixin, TimestampedModel):
    """Custom user model — always define before first migration."""
    email      = models.EmailField(unique=True)
    name       = models.CharField(max_length=255)
    is_active  = models.BooleanField(default=True)
    is_staff   = models.BooleanField(default=False)
    avatar     = models.ImageField(upload_to="avatars/%Y/%m/", blank=True)

    USERNAME_FIELD  = "email"        # used for authentication
    REQUIRED_FIELDS = ["name"]       # prompted by createsuperuser

    objects = UserManager()          # custom manager (see below)

    class Meta:
        db_table    = "users"
        ordering    = ["-created_at"]
        indexes     = [models.Index(fields=["email"], name="idx_users_email")]
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return self.email

    def get_full_name(self):
        return self.name


class Category(TimestampedModel):
    name   = models.CharField(max_length=100)
    slug   = models.SlugField(unique=True)
    parent = models.ForeignKey(
        "self",                           # self-referential FK
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="children",
    )

    class Meta:
        verbose_name_plural = "categories"


class Product(TimestampedModel):
    name        = models.CharField(max_length=255, db_index=True)
    slug        = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    price       = models.DecimalField(max_digits=10, decimal_places=2,
                                       validators=[MinValueValidator(0)])
    stock       = models.PositiveIntegerField(default=0)
    is_active   = models.BooleanField(default=True)
    category    = models.ForeignKey(Category, on_delete=models.PROTECT,
                                     related_name="products")
    tags        = models.ManyToManyField("Tag", blank=True, related_name="products")
    metadata    = models.JSONField(default=dict, blank=True)   # Django 3.1+
    uuid        = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    # Field options summary:
    # null=True      → NULL in database (use for non-string fields)
    # blank=True     → empty value allowed in forms/validation
    # default=       → Python default (not DB default)
    # db_default=    → database-level default (Django 5.0+)
    # editable=False → excluded from ModelForm
    # db_index=True  → creates single-column index
    # unique=True    → UNIQUE constraint + index

    class Meta:
        ordering = ["name"]
        indexes  = [
            models.Index(fields=["category", "is_active"]),
            models.Index(fields=["price"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(price__gte=0),
                name="product_price_non_negative",
            ),
            models.UniqueConstraint(
                fields=["category", "slug"],
                name="unique_slug_per_category",
            ),
        ]

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        from django.urls import reverse
        return reverse("products:detail", kwargs={"slug": self.slug})

    @property
    def is_in_stock(self):
        return self.stock > 0

    def save(self, *args, **kwargs):
        # Always call full_clean() for model-level validation on save
        self.full_clean()
        super().save(*args, **kwargs)


class Order(TimestampedModel):
    class Status(models.TextChoices):
        PENDING   = "pending",   "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        SHIPPED   = "shipped",   "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    user       = models.ForeignKey(User, on_delete=models.PROTECT, related_name="orders")
    status     = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    total      = models.DecimalField(max_digits=12, decimal_places=2)
    shipped_at = models.DateTimeField(null=True, blank=True)

    def confirm(self):
        if self.status != self.Status.PENDING:
            raise ValueError(f"Cannot confirm order in {self.status} state")
        self.status = self.Status.CONFIRMED
        self.save(update_fields=["status", "updated_at"])

    def __str__(self):
        return f"Order #{self.pk} ({self.status})"


class OrderItem(TimestampedModel):
    order    = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product  = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    price    = models.DecimalField(max_digits=10, decimal_places=2)  # snapshot at order time

    class Meta:
        unique_together = [["order", "product"]]   # or UniqueConstraint

    @property
    def subtotal(self):
        return self.price * self.quantity
```

---

## 2.2 Field Types Reference

```python
# String fields
models.CharField(max_length=255)         # VARCHAR — always requires max_length
models.TextField()                        # TEXT — no max_length
models.EmailField()                       # CharField with email validator
models.URLField()                         # CharField with URL validator
models.SlugField()                        # CharField [a-z0-9-_]
models.UUIDField()                        # UUID — stored as uuid in Postgres
models.FilePathField(path="/uploads")

# Numeric fields
models.IntegerField()                     # 32-bit signed integer
models.BigIntegerField()                  # 64-bit signed integer
models.SmallIntegerField()                # 16-bit signed integer
models.PositiveIntegerField()             # 0 to 2147483647
models.PositiveBigIntegerField()          # 0 to 9223372036854775807
models.FloatField()                       # Python float — imprecise
models.DecimalField(max_digits=10, decimal_places=2)  # Decimal — use for money

# Boolean
models.BooleanField(default=False)
models.NullBooleanField()                 # deprecated — use BooleanField(null=True)

# Date/Time
models.DateField(auto_now_add=True)       # date only
models.TimeField()
models.DateTimeField(auto_now=True)       # timestamp
models.DurationField()                    # timedelta

# Binary / JSON
models.BinaryField()
models.JSONField(default=dict)            # Django 3.1+ — Postgres jsonb, others json

# Relationships
models.ForeignKey(Model, on_delete=models.CASCADE)    # Many-to-one
models.OneToOneField(Model, on_delete=models.CASCADE) # One-to-one
models.ManyToManyField(Model)                          # Many-to-many

# on_delete options
models.CASCADE    # delete related objects
models.PROTECT    # raise ProtectedError — prevents deletion
models.SET_NULL   # set FK to NULL (requires null=True)
models.SET_DEFAULT# set FK to default value
models.SET(value) # set to callable/value
models.DO_NOTHING # do nothing — may break referential integrity

# File fields
models.FileField(upload_to="uploads/")
models.ImageField(upload_to="images/%Y/%m/%d/")
```

---

## 2.3 QuerySet API

```python
from django.db.models import Q, F, Value, Count, Sum, Avg, Max, Min, Subquery, OuterRef
from django.db.models.functions import Coalesce, Now, TruncDate, Upper

# ─── Basic CRUD ──────────────────────────────────────────────────────────────

# Create
user = User.objects.create(email="alice@example.com", name="Alice")
user = User(email="alice@example.com"); user.save()

# Read
user = User.objects.get(pk=1)              # raises DoesNotExist if not found
user = User.objects.get(email="a@b.com")  # raises MultipleObjectsReturned if >1

user = User.objects.filter(is_active=True).first()  # None if not found
users = User.objects.all()                 # lazy — no DB hit yet
users = User.objects.filter(is_active=True)
user = User.objects.filter(pk=1).first()

# Update
User.objects.filter(pk=1).update(name="Bob")   # no signal, no save()
user.name = "Bob"; user.save()                  # triggers signals, full save
user.save(update_fields=["name", "updated_at"]) # only update specified fields

# Delete
User.objects.filter(is_active=False).delete()  # bulk delete
user.delete()                                   # single delete

# ─── Filtering ────────────────────────────────────────────────────────────────

User.objects.filter(
    name="Alice",                         # exact match
    name__iexact="alice",                 # case-insensitive exact
    name__contains="lic",                 # LIKE '%lic%'
    name__icontains="LIC",                # case-insensitive LIKE
    name__startswith="Al",
    name__endswith="ce",
    created_at__date=date.today(),        # date part only
    created_at__year=2024,
    created_at__gte=timezone.now() - timedelta(days=7),
    age__range=(18, 65),                  # BETWEEN
    status__in=["active", "pending"],     # IN
    profile__isnull=True,                 # IS NULL (via FK)
)

# Q objects — complex AND/OR/NOT queries
Product.objects.filter(
    Q(price__lt=100) | Q(is_featured=True),     # OR
    Q(is_active=True) & ~Q(category__name="Draft"),  # AND NOT
)

# Exclude — WHERE NOT
User.objects.exclude(is_active=False)
User.objects.exclude(status__in=["banned", "deleted"])

# ─── Chaining (lazy evaluation) ───────────────────────────────────────────────
qs = (
    User.objects
    .filter(is_active=True)
    .exclude(is_staff=True)
    .select_related("profile")        # JOIN for FK/OneToOne — single query
    .prefetch_related("orders__items")# separate optimized queries for M2M/reverse FK
    .annotate(
        order_count=Count("orders"),
        total_spent=Coalesce(Sum("orders__total"), Value(0)),
    )
    .order_by("-created_at", "name")
    .distinct()
    .values("id", "email", "order_count")  # SELECT only these columns → dict
    # .values_list("id", "email", flat=False) → list of tuples
    # .values_list("id", flat=True)           → list of IDs
    [:20]                              # LIMIT 20 — triggers evaluation
)

# ─── F expressions — reference field in database (no Python roundtrip) ────────
# Atomic increment — safe for concurrent updates
Product.objects.filter(pk=product_id).update(stock=F("stock") - quantity)

# Compare two fields
Order.objects.filter(total__gt=F("discount"))

# ─── Aggregation ──────────────────────────────────────────────────────────────
from django.db.models import Count, Sum, Avg

stats = Order.objects.aggregate(
    total_orders=Count("id"),
    revenue=Sum("total"),
    avg_order=Avg("total"),
)
# → {"total_orders": 150, "revenue": Decimal("12345.67"), "avg_order": ...}

# GroupBy equivalent — values() + annotate()
order_counts = (
    Order.objects
    .values("status")
    .annotate(count=Count("id"), total=Sum("total"))
    .order_by("status")
)
# → [{"status": "pending", "count": 5, "total": 500}, ...]

# ─── Subqueries ───────────────────────────────────────────────────────────────
latest_order = Order.objects.filter(
    user=OuterRef("pk")
).order_by("-created_at").values("total")[:1]

users_with_latest = User.objects.annotate(
    latest_order_total=Subquery(latest_order)
)

# ─── Exists / Count ───────────────────────────────────────────────────────────
User.objects.filter(is_active=True).exists()     # efficient EXISTS check
User.objects.filter(is_active=True).count()      # COUNT(*)

# ─── Bulk operations ──────────────────────────────────────────────────────────
# bulk_create — single INSERT for many objects
User.objects.bulk_create([
    User(email="a@x.com", name="A"),
    User(email="b@x.com", name="B"),
], batch_size=500)

# bulk_update — single query to update multiple objects
users = list(User.objects.filter(is_active=False))
for u in users:
    u.name = u.name.upper()
User.objects.bulk_update(users, fields=["name"], batch_size=500)

# ─── Raw SQL ─────────────────────────────────────────────────────────────────
users = User.objects.raw(
    "SELECT * FROM users WHERE LOWER(email) = %s",
    [email.lower()]
)

# When raw SQL is unavoidable
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute("SELECT pg_size_pretty(pg_database_size(%s))", ["mydb"])
    row = cursor.fetchone()
```

---

## 2.4 Custom Managers and QuerySets

```python
class UserQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

    def staff(self):
        return self.filter(is_staff=True)

    def with_order_stats(self):
        return self.annotate(
            order_count=Count("orders"),
            total_spent=Coalesce(Sum("orders__total"), Value(Decimal("0"))),
        )


class UserManager(BaseUserManager):
    def get_queryset(self):
        return UserQuerySet(self.model, using=self._db)

    def active(self):
        return self.get_queryset().active()

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)      # hashes password
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


# Usage — chainable
User.objects.active().with_order_stats().order_by("-total_spent")[:10]
```

---

## 2.5 Migrations

```bash
# Workflow
python manage.py makemigrations          # detect model changes, create migration files
python manage.py makemigrations users    # only for a specific app
python manage.py makemigrations --name add_avatar_to_user  # named migration
python manage.py migrate                 # apply all pending migrations
python manage.py migrate users 0005     # migrate to specific migration
python manage.py migrate users zero     # rollback all migrations in app
python manage.py showmigrations         # show migration status
python manage.py sqlmigrate users 0001  # show SQL without applying
```

```python
# Custom data migration
from django.db import migrations

def populate_slugs(apps, schema_editor):
    """Forward migration — populate slugs from name."""
    from django.utils.text import slugify
    Product = apps.get_model("products", "Product")
    for product in Product.objects.all():
        product.slug = slugify(product.name)
        product.save(update_fields=["slug"])

def clear_slugs(apps, schema_editor):
    """Reverse migration."""
    Product = apps.get_model("products", "Product")
    Product.objects.all().update(slug="")

class Migration(migrations.Migration):
    dependencies = [("products", "0003_product_slug")]

    operations = [
        migrations.RunPython(populate_slugs, reverse_code=clear_slugs),
    ]

# Safe migration practices for production:
# 1. Adding nullable column — safe (no lock)
# 2. Adding column with default — Django 4.1+ uses DB default; older versions need data migration
# 3. Removing column — safe after code no longer references it
# 4. Renaming column — use SeparateDatabaseAndState to avoid full table rewrite
# 5. Adding index — use concurrently: migrations.AddIndex with PostgresqlDatabaseSchemaEditor
# 6. Never rename model or field in single migration on large tables — data migration + alias
```

---

# SECTION 3 · VIEWS

> `[JUNIOR]` Function-based views, class-based views  
> `[MID]` Generic CBVs, mixins, permissions  
> `[SENIOR]` View architecture, Django REST Framework ViewSets, custom base views

---

## 3.1 Function-Based Views

```python
from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse, JsonResponse, Http404
from django.contrib.auth.decorators import login_required, permission_required
from django.views.decorators.http import require_http_methods, require_POST
from django.views.decorators.csrf import csrf_exempt
from django.core.paginator import Paginator

def product_list(request):
    """List view with filtering and pagination."""
    qs = Product.objects.filter(is_active=True).select_related("category")

    # Filtering from query params
    category = request.GET.get("category")
    if category:
        qs = qs.filter(category__slug=category)

    search = request.GET.get("q")
    if search:
        qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))

    # Pagination
    paginator = Paginator(qs, per_page=20)
    page = paginator.get_page(request.GET.get("page", 1))

    return render(request, "products/list.html", {
        "page": page,
        "search": search,
        "category": category,
    })


def product_detail(request, slug):
    product = get_object_or_404(Product, slug=slug, is_active=True)
    return render(request, "products/detail.html", {"product": product})


@login_required
@require_POST
def add_to_cart(request, product_id):
    product = get_object_or_404(Product, pk=product_id)
    # ... add to cart logic
    return JsonResponse({"status": "added", "cart_count": request.user.cart.count()})


@require_http_methods(["GET", "POST"])
def contact(request):
    if request.method == "POST":
        form = ContactForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect("contact_success")
    else:
        form = ContactForm()
    return render(request, "contact.html", {"form": form})


# JSON API view (without DRF)
def api_products(request):
    products = list(
        Product.objects.filter(is_active=True).values("id", "name", "price")
    )
    return JsonResponse({"results": products, "count": len(products)})
```

---

## 3.2 Class-Based Views

```python
from django.views import View
from django.views.generic import (
    ListView, DetailView, CreateView, UpdateView, DeleteView, TemplateView
)
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.urls import reverse_lazy


class ProductListView(ListView):
    model = Product
    template_name = "products/list.html"
    context_object_name = "products"   # template variable name (default: object_list)
    paginate_by = 20
    ordering = ["name"]

    def get_queryset(self):
        qs = super().get_queryset().filter(is_active=True).select_related("category")
        if q := self.request.GET.get("q"):
            qs = qs.filter(name__icontains=q)
        return qs

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["search_query"] = self.request.GET.get("q", "")
        ctx["categories"]   = Category.objects.all()
        return ctx


class ProductDetailView(DetailView):
    model = Product
    template_name = "products/detail.html"
    slug_field = "slug"           # lookup field on model
    slug_url_kwarg = "slug"       # URL kwarg name

    def get_queryset(self):
        return Product.objects.filter(is_active=True)


class ProductCreateView(LoginRequiredMixin, PermissionRequiredMixin, CreateView):
    model = Product
    form_class = ProductForm
    template_name = "products/form.html"
    success_url = reverse_lazy("products:list")
    permission_required = "products.add_product"

    def form_valid(self, form):
        form.instance.created_by = self.request.user
        return super().form_valid(form)


class ProductUpdateView(LoginRequiredMixin, UpdateView):
    model = Product
    form_class = ProductForm
    template_name = "products/form.html"

    def get_success_url(self):
        return self.object.get_absolute_url()

    def get_queryset(self):
        # Users can only update their own products
        return super().get_queryset().filter(created_by=self.request.user)


class ProductDeleteView(LoginRequiredMixin, DeleteView):
    model = Product
    template_name = "products/confirm_delete.html"
    success_url = reverse_lazy("products:list")


# Custom mixin
class OwnerRequiredMixin:
    """Mixin to restrict access to object owner."""
    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)


# Multi-mixin composition (order matters — left to right MRO)
class UserOrderUpdateView(
    LoginRequiredMixin,
    OwnerRequiredMixin,
    UpdateView,
):
    model = Order
    fields = ["shipping_address"]
```

---

# SECTION 4 · URLs

> `[JUNIOR]` URL patterns, path converters  
> `[MID]` Namespaces, include, reverse  
> `[SENIOR]` Custom converters, i18n URLs

---

## 4.1 URL Configuration

```python
# config/urls.py
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/",    admin.site.urls),
    path("api/v1/",   include("apps.api.urls", namespace="api-v1")),
    path("users/",    include("apps.users.urls", namespace="users")),
    path("products/", include("apps.products.urls", namespace="products")),
    path("",          include("apps.pages.urls")),
]

# Serve media in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += [path("__debug__/", include("debug_toolbar.urls"))]


# apps/products/urls.py
from django.urls import path
from . import views

app_name = "products"   # namespace

urlpatterns = [
    path("",                    views.ProductListView.as_view(),   name="list"),
    path("<slug:slug>/",        views.ProductDetailView.as_view(), name="detail"),
    path("create/",             views.ProductCreateView.as_view(), name="create"),
    path("<slug:slug>/edit/",   views.ProductUpdateView.as_view(), name="update"),
    path("<slug:slug>/delete/", views.ProductDeleteView.as_view(), name="delete"),
]

# Path converters
# str  — matches any non-empty string (default)
# int  — matches zero or positive integer
# slug — matches slug (letters, digits, hyphens, underscores)
# uuid — matches UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
# path — matches any non-empty string including slashes

# Custom path converter
class FourDigitYearConverter:
    regex = r"[0-9]{4}"
    def to_python(self, value): return int(value)
    def to_url(self, value):    return "%04d" % value

from django.urls import register_converter
register_converter(FourDigitYearConverter, "yyyy")
path("archive/<yyyy:year>/", views.archive)

# URL reversing
from django.urls import reverse
reverse("products:detail", kwargs={"slug": "my-product"})
# → "/products/my-product/"

# In templates
# {% url "products:detail" slug=product.slug %}
# {% url "products:list" %}
```

---

# SECTION 5 · DJANGO REST FRAMEWORK

> `[MID]` Serializers, APIView, generics, ViewSets  
> `[SENIOR]` Custom serializers, routers, throttling, versioning, pagination, filters

---

## 5.1 Serializers

```python
from rest_framework import serializers
from .models import Product, Order, OrderItem


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = ["id", "name", "slug"]


class ProductSerializer(serializers.ModelSerializer):
    category      = CategorySerializer(read_only=True)
    category_id   = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True
    )
    is_in_stock   = serializers.BooleanField(read_only=True)  # @property
    price_display = serializers.SerializerMethodField()

    class Meta:
        model  = Product
        fields = ["id", "name", "slug", "price", "price_display",
                  "stock", "is_in_stock", "category", "category_id",
                  "is_active", "created_at"]
        read_only_fields = ["id", "slug", "created_at"]

    def get_price_display(self, obj):
        return f"${obj.price:.2f}"

    def validate_price(self, value):
        """Field-level validation."""
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value

    def validate(self, data):
        """Object-level validation."""
        if data.get("stock", 0) > 0 and not data.get("is_active", True):
            raise serializers.ValidationError(
                "Products with stock must be active."
            )
        return data

    def create(self, validated_data):
        from django.utils.text import slugify
        validated_data["slug"] = slugify(validated_data["name"])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Custom update logic
        return super().update(instance, validated_data)


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    subtotal     = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model  = OrderItem
        fields = ["id", "product", "product_name", "quantity", "price", "subtotal"]


class OrderSerializer(serializers.ModelSerializer):
    items  = OrderItemSerializer(many=True, read_only=True)
    user   = serializers.HiddenField(default=serializers.CurrentUserDefault())
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model  = Order
        fields = ["id", "user", "status", "status_display", "total", "items", "created_at"]
        read_only_fields = ["id", "status", "total", "created_at"]


# Nested writable serializer
class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model  = Order
        fields = ["items"]

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        order = Order.objects.create(
            user=self.context["request"].user,
            total=sum(i["price"] * i["quantity"] for i in items_data),
        )
        OrderItem.objects.bulk_create([
            OrderItem(order=order, **item_data) for item_data in items_data
        ])
        return order
```

---

## 5.2 Views and ViewSets

```python
from rest_framework import viewsets, generics, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action, api_view
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend


# APIView — low-level, full control
class ProductAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        if pk:
            product = get_object_or_404(Product, pk=pk)
            serializer = ProductSerializer(product)
        else:
            products = Product.objects.filter(is_active=True)
            serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ProductSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)   # auto 400 on invalid
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# Generic views — common patterns with less code
class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.filter(is_active=True).select_related("category")
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields  = ["category", "is_active"]
    search_fields     = ["name", "description"]
    ordering_fields   = ["price", "name", "created_at"]
    ordering          = ["-created_at"]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdminUser()]
        return [AllowAny()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ProductRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset         = Product.objects.all()
    serializer_class = ProductSerializer
    lookup_field     = "slug"           # use slug instead of pk


# ViewSet — combines list, create, retrieve, update, destroy
class ProductViewSet(viewsets.ModelViewSet):
    queryset         = Product.objects.all().select_related("category")
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["category", "is_active"]
    search_fields    = ["name"]

    def get_serializer_class(self):
        if self.action == "list":
            return ProductListSerializer  # lighter serializer for lists
        return ProductSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdminUser()]
        return [AllowAny()]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == "list":
            qs = qs.filter(is_active=True)
        return qs

    # Custom action — /api/products/{pk}/activate/
    @action(detail=True, methods=["post"], permission_classes=[IsAdminUser])
    def activate(self, request, pk=None):
        product = self.get_object()
        product.is_active = True
        product.save(update_fields=["is_active"])
        return Response({"status": "activated"})

    # List-level custom action — /api/products/featured/
    @action(detail=False, methods=["get"])
    def featured(self, request):
        featured = Product.objects.filter(is_featured=True, is_active=True)[:10]
        serializer = self.get_serializer(featured, many=True)
        return Response(serializer.data)

    def perform_destroy(self, instance):
        # Soft delete instead of hard delete
        instance.is_active = False
        instance.save(update_fields=["is_active"])


# Router registration
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"products", ProductViewSet, basename="product")
router.register(r"orders",   OrderViewSet,   basename="order")

urlpatterns = [path("", include(router.urls))]
# Generates:
# GET    /products/          → list
# POST   /products/          → create
# GET    /products/{pk}/     → retrieve
# PUT    /products/{pk}/     → update
# PATCH  /products/{pk}/     → partial_update
# DELETE /products/{pk}/     → destroy
# POST   /products/{pk}/activate/ → activate (custom)
# GET    /products/featured/      → featured (custom)
```

---

## 5.3 Authentication and Permissions

```python
# settings.py — DRF configuration
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",  # for browsable API
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "apps.api.pagination.StandardResultsSetPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "1000/hour",
        "login": "10/minute",  # custom scope
    },
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "EXCEPTION_HANDLER": "apps.api.exceptions.custom_exception_handler",
}

# Custom permission
from rest_framework.permissions import BasePermission

class IsOwnerOrReadOnly(BasePermission):
    """Allow read to anyone; write only to owner."""
    def has_permission(self, request, view):
        return True  # allow all to reach has_object_permission

    def has_object_permission(self, request, view, obj):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return obj.user == request.user


class IsVerifiedUser(BasePermission):
    message = "Email verification required."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_email_verified
        )


# JWT setup with SimpleJWT
from datetime import timedelta
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME":  timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS":  True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES":      ("Bearer",),
    "USER_ID_FIELD":          "id",
    "USER_ID_CLAIM":          "user_id",
}


# Custom pagination
class StandardResultsSetPagination(PageNumberPagination):
    page_size             = 20
    page_size_query_param = "page_size"
    max_page_size         = 100

    def get_paginated_response(self, data):
        return Response({
            "count":    self.page.paginator.count,
            "next":     self.get_next_link(),
            "previous": self.get_previous_link(),
            "results":  data,
        })


# Custom exception handler
from rest_framework.views import exception_handler
from rest_framework.exceptions import ValidationError

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            "status":  response.status_code,
            "message": "Request failed",
            "errors":  response.data,
        }
        if isinstance(exc, ValidationError):
            error_data["message"] = "Validation error"
        response.data = error_data

    return response
```

---

# SECTION 6 · FORMS

> `[JUNIOR]` ModelForm basics  
> `[MID]` Custom validation, formsets  
> `[SENIOR]` Dynamic forms, form wizards, file handling

---

## 6.1 Forms and ModelForms

```python
from django import forms
from django.core.exceptions import ValidationError
from .models import Product, Order


class ProductForm(forms.ModelForm):
    class Meta:
        model  = Product
        fields = ["name", "description", "price", "stock", "category", "is_active"]
        widgets = {
            "description": forms.Textarea(attrs={"rows": 4}),
            "price":       forms.NumberInput(attrs={"step": "0.01", "min": "0"}),
        }
        labels = {"is_active": "Available for sale"}
        help_texts = {"slug": "URL-friendly identifier, auto-generated from name."}

    def clean_name(self):
        """Field-level validation."""
        name = self.cleaned_data["name"].strip()
        if len(name) < 3:
            raise ValidationError("Product name must be at least 3 characters.")
        return name

    def clean_price(self):
        price = self.cleaned_data["price"]
        if price <= 0:
            raise ValidationError("Price must be greater than zero.")
        return price

    def clean(self):
        """Object-level validation — access multiple fields."""
        cleaned = super().clean()
        price = cleaned.get("price")
        stock = cleaned.get("stock")
        is_active = cleaned.get("is_active")

        if is_active and stock == 0 and price:
            self.add_error("stock", "Active products must have stock > 0.")
        return cleaned

    def save(self, commit=True):
        product = super().save(commit=False)
        from django.utils.text import slugify
        if not product.slug:
            product.slug = slugify(product.name)
        if commit:
            product.save()
            self.save_m2m()
        return product


# Standalone form (no model)
class ContactForm(forms.Form):
    name    = forms.CharField(max_length=100, strip=True)
    email   = forms.EmailField()
    subject = forms.CharField(max_length=200)
    message = forms.CharField(widget=forms.Textarea, min_length=20)
    # Honeypot anti-spam
    website = forms.CharField(required=False, widget=forms.HiddenInput)

    def clean_website(self):
        if self.cleaned_data.get("website"):
            raise ValidationError("Bot detected.")
        return self.cleaned_data["website"]

    def send_email(self):
        from django.core.mail import send_mail
        send_mail(
            subject=f"Contact: {self.cleaned_data['subject']}",
            message=self.cleaned_data["message"],
            from_email=self.cleaned_data["email"],
            recipient_list=["support@example.com"],
        )


# Formsets — multiple instances of same form
from django.forms import inlineformset_factory

OrderItemFormSet = inlineformset_factory(
    Order, OrderItem,
    fields=["product", "quantity"],
    extra=3,           # show 3 empty forms
    can_delete=True,
    min_num=1,         # at least 1 filled form
    validate_min=True,
)

def order_create(request):
    if request.method == "POST":
        order_form = OrderForm(request.POST)
        formset    = OrderItemFormSet(request.POST)
        if order_form.is_valid() and formset.is_valid():
            order = order_form.save(commit=False)
            order.user = request.user
            order.save()
            formset.instance = order
            formset.save()
            return redirect(order.get_absolute_url())
    else:
        order_form = OrderForm()
        formset    = OrderItemFormSet()
    return render(request, "orders/create.html", {
        "order_form": order_form,
        "formset": formset,
    })
```

---

# SECTION 7 · AUTHENTICATION & AUTHORIZATION

> `[MID]` Django auth, custom user model, permissions  
> `[SENIOR]` OAuth2 (django-allauth), RBAC, row-level security

---

## 7.1 Authentication System

```python
# Custom User model — define BEFORE first migration or you'll have a bad time
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        email = self.normalize_email(email)
        user  = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email      = models.EmailField(unique=True)
    name       = models.CharField(max_length=255)
    is_active  = models.BooleanField(default=True)
    is_staff   = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD  = "email"
    REQUIRED_FIELDS = ["name"]
    objects = UserManager()

# settings.py
AUTH_USER_MODEL = "users.User"

# Authentication views (without allauth)
from django.contrib.auth import authenticate, login, logout

def login_view(request):
    if request.method == "POST":
        email    = request.POST["email"]
        password = request.POST["password"]
        user = authenticate(request, username=email, password=password)
        if user:
            login(request, user)    # creates session
            next_url = request.GET.get("next", "/dashboard/")
            return redirect(next_url)
        messages.error(request, "Invalid credentials")
    return render(request, "auth/login.html")

def logout_view(request):
    logout(request)    # destroys session
    return redirect("home")

# Decorators and mixins for access control
from django.contrib.auth.decorators import login_required, permission_required
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin

@login_required(login_url="/auth/login/")
def dashboard(request): ...

@permission_required("products.add_product", raise_exception=True)
def create_product(request): ...

# Django permissions — auto-created for each model: add, change, delete, view
user.has_perm("products.add_product")
user.has_perm("products.change_product")
user.has_perms(["products.add_product", "products.change_product"])

# Custom permission
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType

content_type = ContentType.objects.get_for_model(Product)
permission   = Permission.objects.create(
    codename="can_feature_product",
    name="Can feature product",
    content_type=content_type,
)
user.user_permissions.add(permission)

# Groups — bundle permissions
from django.contrib.auth.models import Group
editors = Group.objects.get(name="Editors")
user.groups.add(editors)

# django-allauth — social auth + email verification
INSTALLED_APPS += ["allauth", "allauth.account", "allauth.socialaccount",
                   "allauth.socialaccount.providers.google",
                   "allauth.socialaccount.providers.github"]
AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]
ACCOUNT_EMAIL_REQUIRED      = True
ACCOUNT_USERNAME_REQUIRED   = False
ACCOUNT_AUTHENTICATION_METHOD = "email"
ACCOUNT_EMAIL_VERIFICATION  = "mandatory"
```

---

# SECTION 8 · MIDDLEWARE & SIGNALS

> `[MID]` Built-in middleware, custom middleware, signal handlers  
> `[SENIOR]` Middleware ordering, signal performance, avoiding signal pitfalls

---

## 8.1 Custom Middleware

```python
# Functional middleware (Django 1.10+ style)
def request_id_middleware(get_response):
    """Add a unique request ID to every request and response."""
    import uuid

    def middleware(request):
        request.id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        response = get_response(request)
        response["X-Request-ID"] = request.id
        return response

    return middleware


# Class-based middleware
class TimingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        import time
        start = time.perf_counter()
        response = self.get_response(request)
        duration = time.perf_counter() - start
        response["X-Response-Time"] = f"{duration * 1000:.2f}ms"
        return response

    def process_exception(self, request, exception):
        """Called if view raises an exception — return response to handle, None to propagate."""
        import logging
        logging.error("Unhandled exception", exc_info=exception, extra={"request": request})
        return None  # let Django's default exception handling take over


# Async-compatible middleware (Django 3.1+)
import asyncio

class AsyncMiddleware:
    async_capable = True
    sync_capable  = False

    def __init__(self, get_response):
        self.get_response = get_response

    async def __call__(self, request):
        # process request
        response = await self.get_response(request)
        # process response
        return response


# Maintenance mode middleware
class MaintenanceModeMiddleware:
    EXCLUDED_PATHS = ["/health/", "/admin/"]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        from django.conf import settings
        from django.http import HttpResponse

        if getattr(settings, "MAINTENANCE_MODE", False):
            if not any(request.path.startswith(p) for p in self.EXCLUDED_PATHS):
                return HttpResponse("Service unavailable", status=503)

        return self.get_response(request)
```

---

## 8.2 Signals

```python
from django.db.models.signals import (
    pre_save, post_save, pre_delete, post_delete,
    m2m_changed,
)
from django.dispatch import receiver, Signal
from django.contrib.auth.signals import (
    user_logged_in, user_logged_out, user_login_failed,
)

# Receiver decorator — preferred style
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create profile when user is created."""
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    if created:
        from .tasks import send_welcome_email_task
        send_welcome_email_task.delay(instance.pk)  # async via Celery

@receiver(pre_save, sender=Product)
def auto_slug(sender, instance, **kwargs):
    if not instance.slug:
        from django.utils.text import slugify
        instance.slug = slugify(instance.name)

@receiver(post_delete, sender=Product)
def delete_product_image(sender, instance, **kwargs):
    """Clean up image files when product is deleted."""
    if instance.image:
        instance.image.delete(save=False)

# Connect signals in AppConfig.ready() — avoid signal duplication
class UsersConfig(AppConfig):
    name = "apps.users"

    def ready(self):
        import apps.users.signals  # noqa: F401 — registers signal handlers

# Custom signals
order_confirmed = Signal()   # custom signal definition

class Order(models.Model):
    def confirm(self):
        self.status = "confirmed"
        self.save()
        order_confirmed.send(sender=self.__class__, order=self)

@receiver(order_confirmed)
def handle_order_confirmed(sender, order, **kwargs):
    notify_warehouse(order)
    send_confirmation_email(order)

# Signal pitfalls:
# 1. Signals are synchronous — heavy work should go to Celery
# 2. post_save fires on bulk_create too — bulk_create has update_fields=None
# 3. Multiple handler registrations (import signals multiple times) — use AppConfig.ready()
# 4. Signals couple your apps — consider service layer instead for complex logic
# 5. update() and bulk operations do NOT trigger post_save
```

---

# SECTION 9 · CACHING

> `[MID]` Cache backends, per-view caching, template caching  
> `[SENIOR]` Cache patterns, cache invalidation, Redis Cluster

---

## 9.1 Caching Strategies

```python
# settings.py — cache backend
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "COMPRESSOR":   "django_redis.compressor.zlib.ZlibCompressor",
            "SERIALIZER":   "django_redis.serializers.json.JSONSerializer",
            "MAX_ENTRIES":  10000,
        },
        "KEY_PREFIX": "myapp",
        "TIMEOUT": 300,       # default timeout in seconds
    }
}

# Low-level cache API
from django.core.cache import cache

# Set / get / delete
cache.set("user:123", {"name": "Alice"}, timeout=3600)
user = cache.get("user:123")           # None if missing or expired
user = cache.get("user:123", default={"name": "Guest"})

cache.set_many({"key1": "val1", "key2": "val2"}, timeout=60)
cache.get_many(["key1", "key2"])       # → {"key1": "val1", "key2": "val2"}

cache.delete("user:123")
cache.delete_many(["key1", "key2"])
cache.clear()                          # DANGEROUS — clears entire cache

# Atomic increment / decrement
cache.set("view_count", 0)
cache.incr("view_count")               # thread-safe atomic increment
cache.decr("view_count", delta=5)

# get_or_set — atomic: get if exists, else compute and set
user = cache.get_or_set(
    f"user:{user_id}",
    lambda: User.objects.get(pk=user_id),
    timeout=300,
)

# Cache-aside pattern
def get_product(product_id):
    cache_key = f"product:{product_id}"
    product   = cache.get(cache_key)
    if product is None:
        product = Product.objects.select_related("category").get(pk=product_id)
        cache.set(cache_key, product, timeout=600)
    return product

# Cache invalidation on save
@receiver(post_save, sender=Product)
def invalidate_product_cache(sender, instance, **kwargs):
    cache.delete(f"product:{instance.pk}")
    cache.delete_many(cache.keys("product_list:*"))  # django-redis specific

# Per-view caching
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers, vary_on_cookie

@cache_page(60 * 15)     # cache for 15 minutes
def product_list(request):
    ...

@cache_page(300)
@vary_on_headers("Accept-Language")  # separate cache per language
def homepage(request):
    ...

# Template fragment caching
# {% load cache %}
# {% cache 300 sidebar request.user.id %}   {# per-user sidebar #}
#     ... expensive sidebar rendering ...
# {% endcache %}

# Cache versioning — invalidate all keys atomically
cache.set("data", value, version=2)
cache.get("data", version=2)
cache.incr_version("data")    # bump version — old version becomes unreachable

# Session caching — store sessions in Redis
SESSION_ENGINE  = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"
```

---

# SECTION 10 · CELERY (ASYNC TASKS)

> `[MID]` Task definition, beat scheduler, result backends  
> `[SENIOR]` Task routing, chord/chain/group, retry strategies, monitoring

---

## 10.1 Celery Setup and Tasks

```python
# config/celery.py
import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")

app = Celery("myproject")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()  # finds tasks.py in each INSTALLED_APP

# settings.py
CELERY_BROKER_URL         = env("REDIS_URL", default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND     = env("REDIS_URL", default="redis://localhost:6379/0")
CELERY_ACCEPT_CONTENT     = ["json"]
CELERY_TASK_SERIALIZER    = "json"
CELERY_RESULT_SERIALIZER  = "json"
CELERY_TIMEZONE           = "UTC"
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT    = 30 * 60       # hard limit: 30 min
CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60    # soft limit: sends SoftTimeLimitExceeded

# Task routing — different queues for different task types
CELERY_TASK_ROUTES = {
    "apps.emails.tasks.*":  {"queue": "emails"},
    "apps.reports.tasks.*": {"queue": "reports"},
    "apps.*.tasks.*":       {"queue": "default"},
}
CELERY_TASK_DEFAULT_QUEUE = "default"


# apps/orders/tasks.py
from celery import shared_task
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)


@shared_task(
    bind=True,                          # access self (task instance)
    max_retries=3,
    default_retry_delay=60,             # 60 seconds between retries
    autoretry_for=(Exception,),         # auto-retry on any exception
    retry_backoff=True,                 # exponential backoff
    retry_jitter=True,                  # add random jitter
    queue="emails",
    acks_late=True,                     # ack only after successful execution
    reject_on_worker_lost=True,         # requeue if worker crashes
)
def send_order_confirmation(self, order_id: int):
    logger.info(f"Sending confirmation for order {order_id}")
    try:
        order = Order.objects.select_related("user").get(pk=order_id)
        send_email(
            to=order.user.email,
            subject=f"Order #{order_id} confirmed",
            template="emails/order_confirmation.html",
            context={"order": order},
        )
        logger.info(f"Confirmation sent for order {order_id}")
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found — not retrying")
        raise   # won't retry because DoesNotExist not in autoretry_for
    except Exception as exc:
        logger.warning(f"Failed to send confirmation: {exc}, retrying...")
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task
def generate_monthly_report(year: int, month: int):
    """Long-running report — update progress."""
    from celery import current_task

    data = get_report_data(year, month)
    total = len(data)

    for i, row in enumerate(data):
        process_row(row)
        if i % 100 == 0:
            current_task.update_state(
                state="PROGRESS",
                meta={"current": i, "total": total, "percent": int(i/total*100)},
            )

    return {"status": "complete", "rows": total}


# Task primitives — canvas
from celery import chain, group, chord, signature

# Chain — sequential, output of each is input of next
result = chain(
    fetch_data.s(url),
    process_data.s(),
    save_results.s(),
)()

# Group — parallel execution
result = group(
    send_email.s(user_id) for user_id in user_ids
)()

# Chord — group + callback when all done
result = chord(
    group(process_chunk.s(chunk) for chunk in chunks),
    aggregate_results.s(),
)()

# Calling tasks
send_order_confirmation.delay(order_id)           # async
send_order_confirmation.apply_async(
    args=[order_id],
    countdown=60,                                  # delay 60 seconds
    eta=datetime(2024, 1, 1, 9, 0),               # run at specific time
    expires=3600,                                  # expire if not started within 1h
    queue="emails",
)

# Celery Beat — periodic tasks
CELERY_BEAT_SCHEDULE = {
    "send-daily-digest": {
        "task":     "apps.emails.tasks.send_daily_digest",
        "schedule": crontab(hour=9, minute=0),       # 9am daily
        "args":     (),
    },
    "cleanup-expired-sessions": {
        "task":     "apps.users.tasks.cleanup_sessions",
        "schedule": 3600,                            # every hour (seconds)
    },
}
```

---

# SECTION 11 · TESTING

> `[MID]` Django TestCase, APIClient, factories  
> `[SENIOR]` Test architecture, mocking, fixtures, coverage

---

## 11.1 Testing Patterns

```python
from django.test import TestCase, TransactionTestCase, Client
from django.test import RequestFactory
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
import pytest
from factory_boy import factory

User = get_user_model()


# factory_boy — test object factories
class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email   = factory.Sequence(lambda n: f"user{n}@example.com")
    name    = factory.Faker("name")
    is_active = True

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        manager = cls._get_manager(model_class)
        return manager.create_user(*args, **kwargs)


class ProductFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Product

    name     = factory.Sequence(lambda n: f"Product {n}")
    slug     = factory.LazyAttribute(lambda o: slugify(o.name))
    price    = factory.Faker("pydecimal", left_digits=3, right_digits=2, positive=True)
    stock    = factory.Faker("random_int", min=0, max=100)
    is_active = True
    category = factory.SubFactory(CategoryFactory)


class AdminUserFactory(UserFactory):
    is_staff = True
    is_superuser = True


# Django TestCase
class ProductModelTest(TestCase):
    def setUp(self):
        self.category = CategoryFactory()
        self.product  = ProductFactory(category=self.category)

    def test_str(self):
        self.assertEqual(str(self.product), self.product.name)

    def test_is_in_stock_true_when_stock_positive(self):
        self.product.stock = 5
        self.assertTrue(self.product.is_in_stock)

    def test_is_in_stock_false_when_zero(self):
        self.product.stock = 0
        self.assertFalse(self.product.is_in_stock)

    def test_price_must_be_non_negative(self):
        product = ProductFactory.build(price=-1)
        with self.assertRaises(ValidationError):
            product.full_clean()


# DRF APITestCase
class ProductAPITest(APITestCase):
    def setUp(self):
        self.user    = UserFactory()
        self.admin   = AdminUserFactory()
        self.product = ProductFactory()
        self.client  = APIClient()

    def test_list_products_unauthenticated(self):
        res = self.client.get("/api/v1/products/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_create_product_requires_admin(self):
        self.client.force_authenticate(user=self.user)
        data = {"name": "New Product", "price": "9.99", "category_id": self.product.category.pk}
        res  = self.client.post("/api/v1/products/", data)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_product_as_admin(self):
        self.client.force_authenticate(user=self.admin)
        data = {
            "name":        "New Product",
            "price":       "9.99",
            "stock":       10,
            "category_id": self.product.category.pk,
        }
        res = self.client.post("/api/v1/products/", data, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["name"], "New Product")
        self.assertTrue(Product.objects.filter(name="New Product").exists())

    def test_retrieve_product(self):
        res = self.client.get(f"/api/v1/products/{self.product.pk}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["id"], self.product.pk)

    def test_update_product_as_owner(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.patch(
            f"/api/v1/products/{self.product.pk}/",
            {"price": "19.99"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.price, Decimal("19.99"))


# pytest-django style
@pytest.mark.django_db
def test_create_user(user_factory):
    user = user_factory(email="test@example.com")
    assert user.pk is not None
    assert user.email == "test@example.com"

@pytest.mark.django_db
def test_product_api(api_client, admin_user, category):
    api_client.force_authenticate(user=admin_user)
    response = api_client.post("/api/v1/products/", {
        "name": "Test", "price": "5.00", "category_id": category.pk
    })
    assert response.status_code == 201

# conftest.py — shared fixtures
@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def admin_user(db):
    return AdminUserFactory()


# Mocking
from unittest.mock import patch, MagicMock

class OrderServiceTest(TestCase):
    @patch("apps.orders.services.send_email")
    @patch("apps.orders.services.stripe.charge")
    def test_process_order(self, mock_charge, mock_email):
        mock_charge.return_value = MagicMock(id="ch_123", status="succeeded")

        order = OrderFactory()
        result = process_order(order.pk, payment_method="pm_test")

        mock_charge.assert_called_once_with(
            amount=int(order.total * 100),
            currency="usd",
            payment_method="pm_test",
        )
        mock_email.assert_called_once()
        self.assertEqual(result["status"], "success")
```

---

# SECTION 12 · PERFORMANCE OPTIMIZATION

> `[MID]` Query optimization, select_related, database indexes  
> `[SENIOR]` Query analysis, connection pooling, async views, profiling

---

## 12.1 Query Optimization

```python
# N+1 query problem — the most common Django performance bug
# BAD: 1 query for orders + 1 query per order for user = N+1
orders = Order.objects.all()
for order in orders:
    print(order.user.email)   # queries DB each time!

# GOOD: select_related — single JOIN query for FK / OneToOne
orders = Order.objects.select_related("user", "user__profile").all()

# GOOD: prefetch_related — separate optimized query for M2M / reverse FK
orders = Order.objects.prefetch_related(
    "items",            # all items in one query
    "items__product",   # all products in one query
)

# Prefetch with custom queryset
from django.db.models import Prefetch

orders = Order.objects.prefetch_related(
    Prefetch(
        "items",
        queryset=OrderItem.objects.select_related("product").filter(quantity__gt=0),
        to_attr="active_items",   # store as list on instance
    )
)
for order in orders:
    for item in order.active_items:   # no DB query here
        print(item.product.name)

# only() / defer() — fetch subset of fields
User.objects.only("id", "email", "name")    # fetch only these (+ pk)
User.objects.defer("bio", "avatar")          # fetch all except these

# values() / values_list() — return dicts/tuples (no model instantiation overhead)
emails = User.objects.filter(is_active=True).values_list("email", flat=True)
# returns QuerySet of strings — very fast, no Python object overhead

# iterator() — fetch in chunks to reduce memory for large querysets
for product in Product.objects.filter(is_active=True).iterator(chunk_size=500):
    process(product)

# Explain — see query plan
print(Product.objects.filter(is_active=True).explain(verbose=True, analyze=True))

# Database indexes — add for frequently filtered/sorted fields
class Product(models.Model):
    class Meta:
        indexes = [
            models.Index(fields=["is_active", "category"]),   # composite
            models.Index(fields=["price"]),
            models.Index(fields=["name"], name="idx_product_name_gin",
                         opclasses=["gin_trgm_ops"]),          # Postgres GIN for LIKE
        ]

# django-debug-toolbar — visualize queries in development
INSTALLED_APPS += ["debug_toolbar"]
MIDDLEWARE.insert(0, "debug_toolbar.middleware.DebugToolbarMiddleware")
INTERNAL_IPS = ["127.0.0.1"]

# Connection pooling — pgBouncer or django-db-pool
DATABASES = {
    "default": {
        "ENGINE":   "django.db.backends.postgresql",
        "CONN_MAX_AGE": 60,   # reuse connections for 60 seconds (simple pooling)
        # For production: use pgBouncer in front of PostgreSQL
    }
}

# Async views (Django 3.1+)
from django.http import JsonResponse
import asyncio

async def async_product_list(request):
    """Truly async view — use with async ORM (Django 4.1+)."""
    products = [p async for p in Product.objects.filter(is_active=True)[:20]]
    # Django 4.1+: async ORM support
    user = await request.auser()   # async equivalent of request.user
    return JsonResponse({"products": list(products)})

# Async ORM (Django 4.1+)
user   = await User.objects.aget(pk=pk)
exists = await User.objects.filter(email=email).aexists()
count  = await User.objects.acount()
await User.objects.filter(is_active=False).adelete()
async for user in User.objects.filter(is_active=True):
    await process(user)
```

---

# SECTION 13 · SECURITY

> `[MID]` CSRF, XSS, SQL injection, settings hardening  
> `[SENIOR]` Content Security Policy, rate limiting, OWASP Django

---

## 13.1 Security Patterns

```python
# Django's built-in protections:
# ✓ CSRF protection (CsrfViewMiddleware)
# ✓ SQL injection — ORM uses parameterized queries
# ✓ XSS — template auto-escaping
# ✓ Clickjacking — XFrameOptionsMiddleware
# ✓ Host header injection — ALLOWED_HOSTS
# ✓ Secure cookies — SESSION_COOKIE_SECURE, CSRF_COOKIE_SECURE

# CSRF — exemption for APIs (use token auth instead)
from django.views.decorators.csrf import csrf_exempt
# Or: use DRF which handles auth via tokens, not sessions

# XSS — auto-escaping in templates; mark safe only when necessary
from django.utils.safestring import mark_safe
# ONLY use mark_safe on content you have sanitized yourself
import bleach
safe_html = mark_safe(bleach.clean(user_html, tags=["b", "i", "a"], strip=True))

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
     "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Secret key management
SECRET_KEY = env("SECRET_KEY")   # never hardcode; never commit

# Security settings for production
SECURE_SSL_REDIRECT            = True   # redirect HTTP → HTTPS
SECURE_HSTS_SECONDS            = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD            = True
SESSION_COOKIE_SECURE          = True   # cookies only over HTTPS
CSRF_COOKIE_SECURE             = True
SECURE_BROWSER_XSS_FILTER      = True
SECURE_CONTENT_TYPE_NOSNIFF    = True
X_FRAME_OPTIONS                = "DENY"
SECURE_REFERRER_POLICY         = "same-origin"

# File upload security
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
MAX_UPLOAD_SIZE     = 5 * 1024 * 1024  # 5MB

def validate_file_upload(file):
    import magic  # python-magic — checks actual file content, not extension
    mime = magic.from_buffer(file.read(1024), mime=True)
    file.seek(0)
    if mime not in ALLOWED_IMAGE_TYPES:
        raise ValidationError(f"File type {mime} not allowed.")
    if file.size > MAX_UPLOAD_SIZE:
        raise ValidationError("File too large (max 5MB).")

# Rate limiting with django-ratelimit
from django_ratelimit.decorators import ratelimit

@ratelimit(key="ip", rate="10/m", method="POST", block=True)
def login_view(request):
    ...

@ratelimit(key="user", rate="100/h", block=True)
def api_view(request):
    ...

# Content Security Policy (django-csp)
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC  = ("'self'",)
CSP_STYLE_SRC   = ("'self'", "'unsafe-inline'")
CSP_IMG_SRC     = ("'self'", "data:", "https:")
CSP_FONT_SRC    = ("'self'", "https://fonts.gstatic.com")
CSP_REPORT_URI  = "/csp-report/"

# Sensitive data handling
LOGGING = {
    "filters": {
        "require_debug_false": {"()": "django.utils.log.RequireDebugFalse"},
    },
    # Ensure no request body (which may contain passwords) is logged
}
# Never log: passwords, tokens, credit cards, SSNs, PII
```

---

# SECTION 14 · DEPLOYMENT

> `[MID]` Gunicorn, static files, environment config  
> `[SENIOR]` Docker, health checks, zero-downtime deploys, Kubernetes

---

## 14.1 Production Setup

```python
# Gunicorn — WSGI server
# gunicorn config.wsgi:application \
#   --workers 4 \           # CPU cores * 2 + 1
#   --worker-class gthread \# threads for I/O bound
#   --threads 4 \
#   --bind 0.0.0.0:8000 \
#   --timeout 30 \
#   --keepalive 5 \
#   --log-level info \
#   --access-logfile - \
#   --error-logfile -

# Uvicorn — ASGI server (for async Django)
# uvicorn config.asgi:application \
#   --host 0.0.0.0 \
#   --port 8000 \
#   --workers 4 \
#   --log-level info

# gunicorn.conf.py
import multiprocessing
workers     = multiprocessing.cpu_count() * 2 + 1
worker_class = "gthread"
threads     = 4
timeout     = 30
keepalive   = 5
bind        = "0.0.0.0:8000"
accesslog   = "-"
errorlog    = "-"
loglevel    = "info"
preload_app = True    # load app before forking — saves memory (copy-on-write)
```

```dockerfile
# Dockerfile — multi-stage
FROM python:3.12-slim AS base
WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

FROM base AS builder
RUN pip install poetry
COPY pyproject.toml poetry.lock ./
RUN poetry export -f requirements.txt --output requirements.txt --without-hashes

FROM base AS runner
COPY --from=builder /app/requirements.txt .
RUN pip install -r requirements.txt

RUN addgroup --system app && adduser --system --group app
COPY --chown=app:app . .

USER app
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health/')"

CMD ["gunicorn", "config.wsgi:application", "--config", "gunicorn.conf.py"]
```

```yaml
# docker-compose.yml
version: "3.9"
services:
  web:
    build: .
    environment:
      - DATABASE_URL=postgres://postgres:secret@db:5432/mydb
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
      - DEBUG=false
    depends_on:
      db:    { condition: service_healthy }
      redis: { condition: service_healthy }
    volumes:
      - static_files:/app/staticfiles
      - media_files:/app/media
    command: >
      sh -c "python manage.py migrate &&
             python manage.py collectstatic --noinput &&
             gunicorn config.wsgi:application --config gunicorn.conf.py"

  celery:
    build: .
    command: celery -A config worker -l info -Q default,emails
    environment:
      - DATABASE_URL=postgres://postgres:secret@db:5432/mydb
      - REDIS_URL=redis://redis:6379/0
    depends_on: [web, redis, db]

  celery-beat:
    build: .
    command: celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
    depends_on: [celery]

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: mydb
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
    volumes: [postgres_data:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - static_files:/static
      - media_files:/media
    ports: ["80:80", "443:443"]

volumes:
  postgres_data:
  static_files:
  media_files:
```

```python
# Health check view
from django.db import connection
from django.core.cache import cache

def health_check(request):
    from django.http import JsonResponse
    checks = {}

    # Database
    try:
        connection.ensure_connection()
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = str(e)

    # Cache
    try:
        cache.set("health_check", "ok", 10)
        checks["cache"] = "ok" if cache.get("health_check") == "ok" else "fail"
    except Exception as e:
        checks["cache"] = str(e)

    healthy = all(v == "ok" for v in checks.values())
    return JsonResponse(
        {"status": "ok" if healthy else "degraded", "checks": checks},
        status=200 if healthy else 503,
    )
```

---

# APPENDIX A — QUICK REFERENCE: TALENT SIGNALS BY LEVEL

---

## Junior-Level Signals

```
POSITIVE SIGNALS (Junior):
✓ Knows the difference between null=True and blank=True on model fields
✓ Uses get_object_or_404 instead of bare .get()
✓ Understands the MTV pattern (Model-Template-View vs MVC)
✓ Runs makemigrations and migrate separately — knows what each does
✓ Uses the ORM for queries — no raw SQL for simple lookups
✓ Knows INSTALLED_APPS and why apps need to be registered
✓ Understands that DEBUG=True must be False in production
✓ Uses Django's built-in User model or knows to extend AbstractBaseUser
✓ Knows login_required decorator and its equivalent mixin

RED FLAGS (Junior):
✗ Uses null=True on CharField/TextField (use blank=True instead)
✗ Puts all code in views.py — no separation into services/managers
✗ Hardcodes SECRET_KEY in settings.py
✗ Forgets to run migrate after makemigrations
✗ Does not set ALLOWED_HOSTS in production
✗ Queries inside templates or loops (N+1 problem)
✗ Does not understand what a migration is — deletes and recreates DB instead
✗ Uses the default User model without planning for customization
✗ Catches all exceptions and silently swallows them
```

---

## Mid-Level Signals

```
POSITIVE SIGNALS (Mid):
✓ Recognizes and fixes N+1 queries with select_related/prefetch_related
✓ Uses F() expressions for atomic field updates (avoid race conditions)
✓ Knows the difference between .save() and .update() — signals, validation
✓ Writes custom managers and QuerySet methods for reusable queries
✓ Designs custom permissions (has_permission, has_object_permission in DRF)
✓ Configures Celery for async tasks — knows acks_late and retry patterns
✓ Writes tests with factory_boy — no fixtures, no hardcoded PKs
✓ Understands Django's middleware order and why it matters
✓ Uses signals appropriately — and knows when NOT to use them
✓ Implements caching with proper invalidation strategy

RED FLAGS (Mid):
✗ Uses Django's default User model in a real project
✗ Does not use select_related / prefetch_related (N+1 everywhere)
✗ Stores business logic in views instead of model methods / service layer
✗ Uses .all() without pagination on large tables
✗ Calls tasks synchronously in tests without mocking
✗ Cannot explain what happens if you don't call .delay() on a Celery task
✗ Does not understand Django's transaction.atomic() and when to use it
✗ Ignores Django's system check framework warnings
✗ Uses update_fields=[] (empty list) — this actually does nothing
```

---

## Senior-Level Signals

```
POSITIVE SIGNALS (Senior):
✓ Explains Django's request/response lifecycle — WSGI, middleware stack, URL dispatch
✓ Designs zero-downtime migrations — knows which operations lock tables
✓ Implements row-level security via custom QuerySet manager filtering
✓ Understands Django's ORM query evaluation — lazy vs eager, when SQL is hit
✓ Uses database-level constraints (CheckConstraint, UniqueConstraint)
✓ Knows Celery chord/chain/group — composes complex async workflows
✓ Implements proper connection pooling strategy (PgBouncer + CONN_MAX_AGE)
✓ Writes async views with Django 4.1+ async ORM
✓ Implements proper CSP, HSTS, and security headers in production
✓ Designs reusable Django apps — minimal coupling, clear public API
✓ Uses django.test.override_settings for environment-specific test config
✓ Knows Django's content types framework — generic relations
✓ Understands how Django's auth permission system works at DB level

RED FLAGS (Senior):
✗ Cannot explain the difference between pre_save and post_save signals
✗ Relies on signal ordering — signals are not guaranteed to fire in order
✗ Does not know about django.db.transaction.on_commit() for post-commit hooks
✗ Uses time.sleep() in tests instead of mocking time
✗ No strategy for long-running migrations on large tables in production
✗ Uses celery.task decorator instead of shared_task (breaks reusability)
✗ Cannot explain Django's ORM query caching (QuerySet caching vs DB query)
✗ Does not know about CONN_MAX_AGE — creates new DB connections per request
✗ Uses SECRET_KEY rotation without understanding session/CSRF implications
✗ Designs anemic models — all logic in views or "fat views, thin models"
```

---

# APPENDIX B — DJANGO VERSION FEATURE MATRIX

| Version | Key Features |
|---------|-------------|
| **Django 2.2** | `Meta.constraints` (CheckConstraint, UniqueConstraint), `Enum` choices, `BulkUpdate`, `JSONField` (Postgres only), `HttpRequest.headers` dict (LTS) |
| **Django 3.0** | ASGI support, `MariaDB` support, `django.db.models.enums`, path `re_path` consolidation, `settings.DEFAULT_AUTO_FIELD` |
| **Django 3.1** | Async views/middleware/tests, `JSONField` for all backends, `aiohttp` optional, `django.test.AsyncClient` |
| **Django 3.2** | `AppConfig.default_auto_field`, `db_default` (coming), `JSONField` operators, `cached_property` on model (LTS) |
| **Django 4.0** | `CSRF_TRUSTED_ORIGINS`, `zoneinfo` timezone support, `ManifestStaticFilesStorage` improvements, Python 3.8+ required |
| **Django 4.1** | Async ORM (`aget`, `acreate`, `acount`, etc.), async class-based views, `LoginRequiredMiddleware`, per-field constraint validation |
| **Django 4.2** | Composite primary keys (experimental), `db_default` field option, facet filters in admin, `GeneratedField`, `psycopg3` support (LTS) |
| **Django 5.0** | `db_default` stable, field groups, `GeneratedField` stable, `LoginRequiredMiddleware`, Python 3.10+ required |
| **Django 5.1** | `{% query_string %}` template tag, `Model.full_clean()` on save improvements, async signal support |

---

# APPENDIX C — ORM QUERYSET METHODS CHEAT SHEET

| Method | Description | Notes |
|--------|-------------|-------|
| `filter(**kwargs)` | WHERE clause | Returns QuerySet |
| `exclude(**kwargs)` | WHERE NOT clause | Returns QuerySet |
| `get(**kwargs)` | Single object | Raises `DoesNotExist` / `MultipleObjectsReturned` |
| `first()` / `last()` | First/last object | Returns `None` if empty |
| `all()` | All objects | Lazy — no DB hit |
| `none()` | Empty QuerySet | Useful for short-circuit |
| `values(*fields)` | Dicts | No model instantiation |
| `values_list(*fields)` | Tuples / flat list | `flat=True` for single column |
| `only(*fields)` | Partial fetch | Deferred fields fetched on access |
| `defer(*fields)` | Exclude fields | Deferred fields fetched on access |
| `select_related(*fields)` | JOIN FK/OneToOne | One SQL query |
| `prefetch_related(*fields)` | Separate query M2M/reverse FK | N+1 → 2 queries |
| `annotate(**kwargs)` | Per-row aggregation | GROUP BY per row |
| `aggregate(**kwargs)` | Single-row aggregation | Returns dict |
| `order_by(*fields)` | ORDER BY | `-field` for DESC |
| `distinct()` | SELECT DISTINCT | Use with order_by carefully |
| `count()` | COUNT(*) | Hits DB |
| `exists()` | EXISTS check | More efficient than count() > 0 |
| `iterator(chunk_size)` | Streaming fetch | Bypasses QuerySet cache |
| `update(**kwargs)` | Bulk UPDATE | No signals, no save() |
| `delete()` | Bulk DELETE | Returns count |
| `bulk_create(objs)` | Batch INSERT | No signals (by default) |
| `bulk_update(objs, fields)` | Batch UPDATE | No signals |
| `select_for_update()` | SELECT ... FOR UPDATE | Row-level locking |
| `explain()` | Query plan | `analyze=True` executes it |
| `raw(sql, params)` | Raw SQL | Returns RawQuerySet |
| `using(db_alias)` | Use specific database | Multi-database |

---

# APPENDIX D — COMMON PATTERNS AND RECIPES

```python
# ─── Service layer pattern — keep views thin ─────────────────────────────────
# apps/orders/services.py
from django.db import transaction
from django.utils import timezone

class OrderService:
    @staticmethod
    @transaction.atomic
    def create_order(user, cart_items: list[dict]) -> Order:
        """Create order from cart items."""
        if not cart_items:
            raise ValueError("Cannot create empty order")

        # Validate stock (with row-level lock)
        products = Product.objects.select_for_update().filter(
            pk__in=[i["product_id"] for i in cart_items]
        )
        product_map = {p.pk: p for p in products}

        for item in cart_items:
            product = product_map.get(item["product_id"])
            if not product:
                raise ValueError(f"Product {item['product_id']} not found")
            if product.stock < item["quantity"]:
                raise ValueError(f"Insufficient stock for {product.name}")

        total = sum(
            product_map[i["product_id"]].price * i["quantity"]
            for i in cart_items
        )

        order = Order.objects.create(user=user, total=total)

        OrderItem.objects.bulk_create([
            OrderItem(
                order=order,
                product=product_map[i["product_id"]],
                quantity=i["quantity"],
                price=product_map[i["product_id"]].price,
            )
            for i in cart_items
        ])

        # Decrement stock atomically
        for item in cart_items:
            Product.objects.filter(pk=item["product_id"]).update(
                stock=F("stock") - item["quantity"]
            )

        # Post-commit: send confirmation (don't send if transaction rolls back)
        transaction.on_commit(
            lambda: send_order_confirmation.delay(order.pk)
        )

        return order


# ─── transaction.atomic and on_commit ────────────────────────────────────────
from django.db import transaction

with transaction.atomic():
    order = Order.objects.create(...)
    # If anything below raises, both Order and OrderItem are rolled back
    OrderItem.objects.create(order=order, ...)

    # on_commit: runs AFTER successful commit (not if rolled back)
    transaction.on_commit(lambda: notify_user.delay(order.pk))

# Savepoints — nested transactions
with transaction.atomic():           # outer transaction
    create_header()
    with transaction.atomic():      # savepoint
        try:
            create_detail()
        except Exception:
            pass                    # savepoint rolls back; outer continues
    finalize_header()


# ─── Generic relations (content types) ────────────────────────────────────────
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType

class Comment(models.Model):
    content_type   = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id      = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")
    body           = models.TextField()

class Product(models.Model):
    comments = GenericRelation(Comment)   # reverse relation

# Usage
product = Product.objects.first()
Comment.objects.create(content_object=product, body="Great product!")
product.comments.all()   # all comments for this product


# ─── Soft delete pattern ──────────────────────────────────────────────────────
class SoftDeleteQuerySet(models.QuerySet):
    def delete(self):
        return self.update(deleted_at=timezone.now())

    def hard_delete(self):
        return super().delete()

    def alive(self):
        return self.filter(deleted_at__isnull=True)

    def dead(self):
        return self.exclude(deleted_at__isnull=True)


class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model).filter(deleted_at__isnull=True)


class SoftDeleteModel(models.Model):
    deleted_at = models.DateTimeField(null=True, blank=True)
    objects    = SoftDeleteManager()
    all_objects = models.Manager()   # includes deleted

    def delete(self, *args, **kwargs):
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at"])

    def restore(self):
        self.deleted_at = None
        self.save(update_fields=["deleted_at"])

    class Meta:
        abstract = True


# ─── Optimistic locking ───────────────────────────────────────────────────────
class VersionedModel(models.Model):
    version = models.PositiveIntegerField(default=0)

    def save_with_optimistic_lock(self, *args, **kwargs):
        current_version = self.version
        self.version += 1
        updated = type(self).objects.filter(
            pk=self.pk, version=current_version
        ).update(version=self.version)
        if not updated:
            raise ConcurrentUpdateError("Object was modified by another process")

    class Meta:
        abstract = True
```

---

# APPENDIX E — SECURITY CHECKLIST

```
SETTINGS:
□ SECRET_KEY in environment variable — never committed to git
□ DEBUG=False in production
□ ALLOWED_HOSTS explicitly set (not ['*'])
□ SECURE_SSL_REDIRECT=True
□ SECURE_HSTS_SECONDS set (31536000 minimum)
□ SESSION_COOKIE_SECURE=True
□ CSRF_COOKIE_SECURE=True
□ X_FRAME_OPTIONS="DENY"

AUTHENTICATION:
□ Custom User model defined before first migration
□ Passwords hashed with bcrypt/argon2 (update PASSWORD_HASHERS if needed)
□ Password validation configured (AUTH_PASSWORD_VALIDATORS)
□ Account lockout after failed attempts (django-axes or similar)
□ Email verification for new accounts

DATA:
□ All user input goes through forms or serializers with validation
□ FileField/ImageField uploads validated by type and size
□ Sensitive fields excluded from __str__, logging, and serialization
□ No raw SQL string concatenation — always parameterized
□ PII stored only where necessary; GDPR compliance considered

API:
□ Authentication required by default (DEFAULT_PERMISSION_CLASSES)
□ Rate limiting configured (django-ratelimit or DRF throttling)
□ CORS configured with explicit allow list (not *)
□ Pagination on all list endpoints
□ Sensitive endpoints use HTTPS-only

DEPENDENCIES:
□ pip-audit or safety check run in CI
□ requirements pinned with hashes (pip install --require-hashes)
□ Dependabot configured for automated security updates

DEPLOYMENT:
□ Running as non-root user
□ collectstatic run during deploy — never whitenoise debug mode
□ Database user has minimum required permissions
□ Celery workers run as separate users
□ Logs do not contain passwords, tokens, or PII
```

---

# APPENDIX F — DJANGO REQUEST/RESPONSE LIFECYCLE

```
HTTP Request → Django

1. WSGI/ASGI server (Gunicorn/Uvicorn) receives raw HTTP request
2. Django creates HttpRequest object

3. Middleware stack (top → bottom) — process_request
   SecurityMiddleware → SessionMiddleware → CommonMiddleware →
   CsrfViewMiddleware → AuthenticationMiddleware → MessageMiddleware

4. URL Dispatcher
   ROOT_URLCONF → include() chains → match path → find view function/class

5. View Middleware — process_view (called before view)

6. View execution
   Function-based: view(request, *args, **kwargs)
   Class-based:    View.dispatch() → get/post/put/etc.

7. Template rendering (if render() called)
   Template loader → Context → Template engine → String output

8. Middleware stack (bottom → top) — process_response
   MessageMiddleware → AuthenticationMiddleware → CsrfViewMiddleware →
   CommonMiddleware → SessionMiddleware → SecurityMiddleware

9. WSGI/ASGI server sends HTTP response

Exception during steps 4-8:
   → process_exception() called on each middleware (bottom → top)
   → If unhandled: Django's default error views (404, 500, etc.)

Key points:
• Middleware runs in order for request, REVERSE order for response
• AuthenticationMiddleware populates request.user from session
• SessionMiddleware reads/writes session cookie
• CsrfViewMiddleware validates CSRF token on unsafe methods (POST/PUT/PATCH/DELETE)
• Caching middleware (if used) must be FIRST and LAST
```

---

*END OF DJANGO RAG KNOWLEDGE BASE DOCUMENT*