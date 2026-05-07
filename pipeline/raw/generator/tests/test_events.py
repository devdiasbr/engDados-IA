from datetime import date

from faker_lakehouse.config import GeneratorConfig
from faker_lakehouse.dimensions import (
    generate_categories,
    generate_products,
    generate_customers,
)
from faker_lakehouse.events import generate_day_events


def _seed(cfg: GeneratorConfig):
    cats = generate_categories(cfg)
    prods = generate_products(cfg, cats)
    custs = generate_customers(cfg)
    return cats, prods, custs


def test_generate_day_produces_three_streams():
    cfg = GeneratorConfig(orders_per_day=20)
    _, prods, custs = _seed(cfg)
    streams = generate_day_events(cfg, date(2026, 4, 1), prods, custs)
    assert set(streams.keys()) == {"orders", "order_items", "payments"}


def test_orders_count_matches_config():
    cfg = GeneratorConfig(orders_per_day=20)
    _, prods, custs = _seed(cfg)
    streams = generate_day_events(cfg, date(2026, 4, 1), prods, custs)
    created = [e for e in streams["orders"] if e["event_type"] == "order.created"]
    assert len(created) == 20


def test_lifecycle_event_types_are_valid():
    cfg = GeneratorConfig(orders_per_day=200)
    _, prods, custs = _seed(cfg)
    streams = generate_day_events(cfg, date(2026, 4, 1), prods, custs)
    valid_orders = {
        "order.created", "order.paid", "order.shipped",
        "order.delivered", "order.cancelled", "order.refunded",
    }
    types = {e["event_type"] for e in streams["orders"]}
    assert types.issubset(valid_orders)
    assert "order.created" in types


def test_envelope_has_required_fields():
    cfg = GeneratorConfig(orders_per_day=5)
    _, prods, custs = _seed(cfg)
    streams = generate_day_events(cfg, date(2026, 4, 1), prods, custs)
    sample = streams["orders"][0]
    for f in ("event_id", "event_type", "occurred_at", "received_at", "source", "payload"):
        assert f in sample
    assert sample["source"] == "faker-lakehouse"


def test_order_items_reference_existing_orders():
    cfg = GeneratorConfig(orders_per_day=10)
    _, prods, custs = _seed(cfg)
    streams = generate_day_events(cfg, date(2026, 4, 1), prods, custs)
    order_ids = {
        e["payload"]["order_id"]
        for e in streams["orders"]
        if e["event_type"] == "order.created"
    }
    for item_event in streams["order_items"]:
        assert item_event["payload"]["order_id"] in order_ids


def test_paid_only_for_subset_of_orders():
    cfg = GeneratorConfig(orders_per_day=200, seed=42)
    _, prods, custs = _seed(cfg)
    streams = generate_day_events(cfg, date(2026, 4, 1), prods, custs)
    created = sum(1 for e in streams["orders"] if e["event_type"] == "order.created")
    paid = sum(1 for e in streams["orders"] if e["event_type"] == "order.paid")
    assert 0 < paid < created
