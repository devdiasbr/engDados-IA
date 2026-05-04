import random
import uuid
from datetime import date, datetime, time, timedelta, timezone

from faker_lakehouse.config import GeneratorConfig

PRODUCT_CHANGE_RATE = 0.01
CUSTOMER_CHANGE_RATE = 0.005


def generate_dim_changes(
    cfg: GeneratorConfig,
    day: date,
    products: list[dict],
    customers: list[dict],
) -> list[dict]:
    rng = random.Random(cfg.seed * 2000 + day.toordinal())
    uuid_rng = random.Random(cfg.seed * 2000 + day.toordinal() + 1)

    def _uid() -> str:
        return str(uuid.UUID(int=uuid_rng.getrandbits(128), version=4))

    def _ts() -> str:
        sec = rng.randint(0, 86399)
        return (
            datetime.combine(day, time.min, tzinfo=timezone.utc)
            + timedelta(seconds=sec)
        ).isoformat()

    out: list[dict] = []

    for prod in products:
        if rng.random() < PRODUCT_CHANGE_RATE:
            old_price = prod["unit_price"]
            new_price = round(old_price * rng.uniform(0.85, 1.20), 2)
            ts = _ts()
            out.append({
                "event_id": _uid(),
                "event_type": "product.updated",
                "occurred_at": ts,
                "received_at": ts,
                "source": "faker-lakehouse",
                "payload": {
                    "entity": "products",
                    "entity_id": prod["product_id"],
                    "changes": {"unit_price": {"from": old_price, "to": new_price}},
                },
            })

    segments = ["bronze", "silver", "gold", "platinum"]
    for cust in customers:
        if rng.random() < CUSTOMER_CHANGE_RATE:
            old_seg = cust["segment"]
            new_seg = rng.choice([s for s in segments if s != old_seg])
            ts = _ts()
            out.append({
                "event_id": _uid(),
                "event_type": "customer.updated",
                "occurred_at": ts,
                "received_at": ts,
                "source": "faker-lakehouse",
                "payload": {
                    "entity": "customers",
                    "entity_id": cust["customer_id"],
                    "changes": {"segment": {"from": old_seg, "to": new_seg}},
                },
            })

    return out
