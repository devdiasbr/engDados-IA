from faker_lakehouse.config import GeneratorConfig
from faker_lakehouse.dimensions import (
    generate_categories,
    generate_products,
    generate_customers,
)


def test_generate_categories_count():
    cfg = GeneratorConfig(num_categories=10)
    cats = generate_categories(cfg)
    assert len(cats) == 10
    assert all("category_id" in c and "name" in c for c in cats)


def test_generate_categories_has_hierarchy():
    cfg = GeneratorConfig(num_categories=10)
    cats = generate_categories(cfg)
    assert any(c.get("parent_category_id") for c in cats)


def test_generate_products_count_and_fk():
    cfg = GeneratorConfig(num_categories=10, num_products=80)
    cats = generate_categories(cfg)
    prods = generate_products(cfg, cats)
    assert len(prods) == 80
    cat_ids = {c["category_id"] for c in cats}
    assert all(p["category_id"] in cat_ids for p in prods)
    assert all(p["unit_price"] > 0 for p in prods)
    assert all(p["currency"] in {"BRL", "USD", "EUR"} for p in prods)


def test_generate_customers_count():
    cfg = GeneratorConfig(num_customers=500)
    custs = generate_customers(cfg)
    assert len(custs) == 500
    assert all("@" in c["email"] for c in custs)
    assert all(c["segment"] in {"bronze", "silver", "gold", "platinum"} for c in custs)


def test_generation_is_deterministic():
    cfg = GeneratorConfig(seed=42, num_customers=10)
    a = generate_customers(cfg)
    b = generate_customers(cfg)
    assert a == b
