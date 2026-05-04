import random
import uuid
from datetime import date, datetime, time, timedelta, timezone

from faker_lakehouse.config import GeneratorConfig

PAID_PROB = 0.70
SHIPPED_PROB = 0.60
DELIVERED_PROB = 0.90
CANCELLED_PROB = 0.05
REFUNDED_PROB = 0.03


def _random_time_on(d: date, rng: random.Random) -> datetime:
    return datetime.combine(d, time.min, tzinfo=timezone.utc) + timedelta(
        seconds=rng.randint(0, 86399)
    )


def generate_day_events(
    cfg: GeneratorConfig,
    day: date,
    products: list[dict],
    customers: list[dict],
) -> dict[str, list[dict]]:
    rng = random.Random(cfg.seed * 1000 + day.toordinal())
    uuid_rng = random.Random(cfg.seed * 1000 + day.toordinal() + 1)

    def _uid() -> str:
        return str(uuid.UUID(int=uuid_rng.getrandbits(128), version=4))

    orders: list[dict] = []
    items: list[dict] = []
    payments: list[dict] = []

    for i in range(cfg.orders_per_day):
        order_id = f"ord_{day.isoformat()}_{i:05d}"
        customer = rng.choice(customers)
        currency = rng.choice(["BRL", "USD", "EUR"])
        created_at = _random_time_on(day, rng)

        n_items = max(1, int(rng.gauss(cfg.avg_items_per_order, 1.2)))
        n_items = min(max(n_items, 1), 5)
        order_total = 0.0
        for j in range(n_items):
            prod = rng.choice(products)
            qty = rng.randint(1, 3)
            line_total = round(prod["unit_price"] * qty, 2)
            order_total += line_total
            items.append({
                "event_id": _uid(),
                "event_type": "order_item.created",
                "occurred_at": created_at.isoformat(),
                "received_at": created_at.isoformat(),
                "source": "faker-lakehouse",
                "payload": {
                    "order_item_id": f"oi_{order_id}_{j:02d}",
                    "order_id": order_id,
                    "product_id": prod["product_id"],
                    "quantity": qty,
                    "unit_price": prod["unit_price"],
                    "line_total": line_total,
                },
            })

        orders.append({
            "event_id": _uid(),
            "event_type": "order.created",
            "occurred_at": created_at.isoformat(),
            "received_at": created_at.isoformat(),
            "source": "faker-lakehouse",
            "payload": {
                "order_id": order_id,
                "customer_id": customer["customer_id"],
                "currency": currency,
                "total_amount": round(order_total, 2),
                "status": "created",
            },
        })

        if rng.random() < CANCELLED_PROB:
            cancel_at = created_at + timedelta(minutes=rng.randint(5, 240))
            orders.append({
                "event_id": _uid(),
                "event_type": "order.cancelled",
                "occurred_at": cancel_at.isoformat(),
                "received_at": cancel_at.isoformat(),
                "source": "faker-lakehouse",
                "payload": {"order_id": order_id, "status": "cancelled"},
            })
            continue

        if rng.random() >= PAID_PROB:
            continue

        paid_at = created_at + timedelta(minutes=rng.randint(2, 360))
        orders.append({
            "event_id": _uid(),
            "event_type": "order.paid",
            "occurred_at": paid_at.isoformat(),
            "received_at": paid_at.isoformat(),
            "source": "faker-lakehouse",
            "payload": {"order_id": order_id, "status": "paid"},
        })

        n_pays = 2 if rng.random() < 0.10 else 1
        remaining = order_total
        for k in range(n_pays):
            amount = round(remaining if k == n_pays - 1 else remaining / 2, 2)
            remaining -= amount
            payments.append({
                "event_id": _uid(),
                "event_type": "payment.captured",
                "occurred_at": paid_at.isoformat(),
                "received_at": paid_at.isoformat(),
                "source": "faker-lakehouse",
                "payload": {
                    "payment_id": f"pay_{order_id}_{k:02d}",
                    "order_id": order_id,
                    "method": rng.choice(["credit_card", "pix", "boleto"]),
                    "amount": amount,
                    "currency": currency,
                    "status": "captured",
                },
            })

        if rng.random() < REFUNDED_PROB:
            refund_at = paid_at + timedelta(hours=rng.randint(1, 48))
            orders.append({
                "event_id": _uid(),
                "event_type": "order.refunded",
                "occurred_at": refund_at.isoformat(),
                "received_at": refund_at.isoformat(),
                "source": "faker-lakehouse",
                "payload": {"order_id": order_id, "status": "refunded"},
            })
            continue

        if rng.random() >= SHIPPED_PROB:
            continue
        shipped_at = paid_at + timedelta(hours=rng.randint(2, 72))
        orders.append({
            "event_id": _uid(),
            "event_type": "order.shipped",
            "occurred_at": shipped_at.isoformat(),
            "received_at": shipped_at.isoformat(),
            "source": "faker-lakehouse",
            "payload": {"order_id": order_id, "status": "shipped"},
        })

        if rng.random() < DELIVERED_PROB:
            delivered_at = shipped_at + timedelta(hours=rng.randint(12, 240))
            orders.append({
                "event_id": _uid(),
                "event_type": "order.delivered",
                "occurred_at": delivered_at.isoformat(),
                "received_at": delivered_at.isoformat(),
                "source": "faker-lakehouse",
                "payload": {"order_id": order_id, "status": "delivered"},
            })

    return {"orders": orders, "order_items": items, "payments": payments}
