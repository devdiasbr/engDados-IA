from datetime import date, timedelta
from faker import Faker

from faker_lakehouse.config import GeneratorConfig

CURRENCIES = ["BRL", "USD", "EUR"]
SEGMENTS = ["bronze", "silver", "gold", "platinum"]


def generate_categories(cfg: GeneratorConfig) -> list[dict]:
    fake = Faker("pt_BR")
    Faker.seed(cfg.seed)

    n_root = max(1, cfg.num_categories // 3)
    cats: list[dict] = []
    for i in range(n_root):
        cats.append({
            "category_id": f"cat_{i:04d}",
            "name": fake.unique.word().title() + " " + fake.word().title(),
            "parent_category_id": None,
        })
    for i in range(n_root, cfg.num_categories):
        parent = cats[i % n_root]["category_id"]
        cats.append({
            "category_id": f"cat_{i:04d}",
            "name": fake.unique.word().title(),
            "parent_category_id": parent,
        })
    return cats


def generate_products(cfg: GeneratorConfig, categories: list[dict]) -> list[dict]:
    fake = Faker("pt_BR")
    Faker.seed(cfg.seed + 1)

    products: list[dict] = []
    for i in range(cfg.num_products):
        cat = categories[i % len(categories)]
        products.append({
            "product_id": f"prod_{i:05d}",
            "category_id": cat["category_id"],
            "name": fake.unique.catch_phrase(),
            "unit_price": round(fake.pyfloat(min_value=5.0, max_value=2500.0), 2),
            "currency": CURRENCIES[i % len(CURRENCIES)],
            "active": fake.pybool(truth_probability=95),
        })
    return products


def generate_customers(cfg: GeneratorConfig) -> list[dict]:
    fake = Faker("pt_BR")
    Faker.seed(cfg.seed + 2)

    today = date.today()
    customers: list[dict] = []
    for i in range(cfg.num_customers):
        signup = today - timedelta(days=fake.pyint(min_value=0, max_value=730))
        customers.append({
            "customer_id": f"cust_{i:06d}",
            "email": fake.unique.email(),
            "country": fake.country_code(),
            "signup_date": signup.isoformat(),
            "segment": SEGMENTS[i % len(SEGMENTS)],
        })
    return customers
