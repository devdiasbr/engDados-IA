from datetime import date
from faker_lakehouse.config import GeneratorConfig
from faker_lakehouse.dimensions import generate_categories, generate_products, generate_customers
from faker_lakehouse.cdc import generate_dim_changes


def test_dim_changes_returns_envelopes():
    cfg = GeneratorConfig(num_products=80, num_customers=500)
    cats = generate_categories(cfg)
    prods = generate_products(cfg, cats)
    custs = generate_customers(cfg)
    out = generate_dim_changes(cfg, date(2026, 4, 1), prods, custs)
    for e in out:
        assert e["event_type"] in {"product.updated", "customer.updated"}
        assert "entity" in e["payload"]
        assert "entity_id" in e["payload"]
        assert "changes" in e["payload"]


def test_product_update_changes_price():
    cfg = GeneratorConfig(seed=42, num_products=80, num_customers=500)
    cats = generate_categories(cfg)
    prods = generate_products(cfg, cats)
    custs = generate_customers(cfg)
    out = generate_dim_changes(cfg, date(2026, 4, 1), prods, custs)
    prod_updates = [e for e in out if e["event_type"] == "product.updated"]
    if prod_updates:
        c = prod_updates[0]["payload"]["changes"]
        assert "unit_price" in c
        assert "from" in c["unit_price"] and "to" in c["unit_price"]


def test_volumes_match_expected_rates():
    cfg = GeneratorConfig(seed=42, num_products=1000, num_customers=10000)
    cats = generate_categories(cfg)
    prods = generate_products(cfg, cats)
    custs = generate_customers(cfg)
    out = generate_dim_changes(cfg, date(2026, 4, 1), prods, custs)
    prod_updates = sum(1 for e in out if e["event_type"] == "product.updated")
    cust_updates = sum(1 for e in out if e["event_type"] == "customer.updated")
    assert 5 <= prod_updates <= 30
    assert 30 <= cust_updates <= 100
