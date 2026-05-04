# Faker Lakehouse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o gerador `faker-lakehouse` (pacote Python) e revisar 6 specs (raw, bronze, silver, gold) refletindo o novo modelo de e-commerce, conforme [design 2026-05-04](../specs/2026-05-04-faker-lakehouse-design.md).

**Architecture:** Pacote Python `faker-lakehouse` em `generator/` produz arquivos JSONL (dimensões em `data/seed/`, eventos em `data/landing/<entity>/_partition_date=YYYY-MM-DD/`). Construído via TDD com `pytest`. Specs são arquivos markdown em `artefatos/specs/` seguindo `spec-template.md`.

**Tech Stack:** Python 3.12, Faker, pytest, click (CLI). Sem dependência de Spark/Databricks neste plano — pipelines reais são escopo futuro.

**Não-objetivos:** Implementação dos pipelines Databricks (Auto Loader, MERGE, SCD2). Este plano só entrega o gerador e os specs (markdown).

---

## File Structure

### Novos arquivos

```
generator/
├── pyproject.toml                          # deps: faker, click; dev: pytest
├── README.md                               # uso rápido do CLI
├── faker_lakehouse/
│   ├── __init__.py                         # exporta versão
│   ├── config.py                           # GeneratorConfig dataclass
│   ├── dimensions.py                       # gera categories/products/customers
│   ├── events.py                           # lifecycle de orders/items/payments
│   ├── faults.py                           # late_data, duplicate, corrupt
│   ├── cdc.py                              # CDC events para dimensões
│   ├── writer.py                           # escrita JSONL particionada
│   └── cli.py                              # entrypoint (click)
└── tests/
    ├── __init__.py
    ├── test_config.py
    ├── test_dimensions.py
    ├── test_events.py
    ├── test_faults.py
    ├── test_cdc.py
    ├── test_writer.py
    ├── test_cli.py
    └── test_integration.py                 # run end-to-end + idempotência

data/
├── .gitignore                              # ignora landing/, mantém seed/sample/
├── seed/                                   # dimensões iniciais (versionadas)
│   └── .gitkeep
└── landing/
    └── .gitkeep

artefatos/specs/
├── spec-exemplo-raw-commerce-events.md     # NOVO — substitui raw-orders
├── spec-exemplo-raw-dim-changes.md         # NOVO
├── spec-exemplo-bronze-commerce-events.md  # NOVO — substitui bronze-orders
├── spec-exemplo-bronze-dimensions.md       # NOVO — SCD2 das 3 dimensões
└── spec-exemplo-silver-orders.md           # REESCRITO
└── spec-exemplo-gold-orders.md             # REESCRITO
```

### Arquivos removidos

```
artefatos/specs/spec-exemplo-raw-orders.md         # removido
artefatos/specs/spec-exemplo-bronze-orders.md      # removido
```

### Arquivos modificados

```
.gitignore                                  # adiciona data/landing/
README.md                                   # tabela de specs + seção "Como gerar dados"
```

---

## Phase 1 — Scaffold do gerador

### Task 1: Estrutura inicial do pacote `faker-lakehouse`

**Files:**
- Create: `generator/pyproject.toml`
- Create: `generator/faker_lakehouse/__init__.py`
- Create: `generator/tests/__init__.py`
- Create: `generator/README.md`

- [ ] **Step 1: Criar `generator/pyproject.toml`**

```toml
[project]
name = "faker-lakehouse"
version = "0.1.0"
description = "Gerador de dados de e-commerce para SDD com Claude no Databricks"
requires-python = ">=3.12"
dependencies = [
    "faker>=30.0.0",
    "click>=8.1.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-cov>=5.0.0",
]

[project.scripts]
faker-lakehouse = "faker_lakehouse.cli:main"

[build-system]
requires = ["setuptools>=68.0"]
build-backend = "setuptools.build_meta"

[tool.setuptools.packages.find]
where = ["."]
include = ["faker_lakehouse*"]

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --tb=short"
```

- [ ] **Step 2: Criar `generator/faker_lakehouse/__init__.py`**

```python
__version__ = "0.1.0"
```

- [ ] **Step 3: Criar `generator/tests/__init__.py` (arquivo vazio)**

```python
```

- [ ] **Step 4: Criar `generator/README.md`**

```markdown
# faker-lakehouse

Gerador de dados de e-commerce (dimensões + stream de eventos) para servir como
fonte concreta dos pipelines de exemplo do repositório.

## Instalação

```bash
cd generator
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -e ".[dev]"
```

## Uso

```bash
faker-lakehouse seed                                    # popula data/seed/
faker-lakehouse run --start 2026-04-01 --days 7         # 7 dias de eventos
```

Veja `faker-lakehouse --help` para todas as opções.
```

- [ ] **Step 5: Instalar e validar**

```bash
cd generator
python -m venv .venv
.venv\Scripts\activate
pip install -e ".[dev]"
pytest --collect-only
```
Expected: `collected 0 items` (sem erros de importação).

- [ ] **Step 6: Commit**

```bash
git add generator/pyproject.toml generator/faker_lakehouse/__init__.py generator/tests/__init__.py generator/README.md
git commit -m "feat(generator): scaffold inicial do pacote faker-lakehouse"
git push
```

---

### Task 2: `config.py` — configuração com defaults

**Files:**
- Create: `generator/faker_lakehouse/config.py`
- Test: `generator/tests/test_config.py`

- [ ] **Step 1: Escrever teste falho**

`generator/tests/test_config.py`:
```python
from pathlib import Path
from faker_lakehouse.config import GeneratorConfig


def test_default_config():
    cfg = GeneratorConfig()
    assert cfg.seed == 42
    assert cfg.num_categories == 10
    assert cfg.num_products == 80
    assert cfg.num_customers == 500
    assert cfg.orders_per_day == 500
    assert cfg.late_data_pct == 0.05
    assert cfg.late_data_window_h == 72
    assert cfg.duplicate_pct == 0.01
    assert cfg.corrupt_pct == 0.02
    assert cfg.out_dir == Path("data")


def test_custom_config():
    cfg = GeneratorConfig(seed=99, orders_per_day=1000, out_dir=Path("/tmp/x"))
    assert cfg.seed == 99
    assert cfg.orders_per_day == 1000
    assert cfg.out_dir == Path("/tmp/x")
```

- [ ] **Step 2: Rodar teste e ver falhar**

```bash
cd generator
pytest tests/test_config.py -v
```
Expected: FAIL — `ModuleNotFoundError: No module named 'faker_lakehouse.config'`.

- [ ] **Step 3: Implementar `config.py`**

```python
"""Configuração do gerador faker-lakehouse."""
from dataclasses import dataclass, field
from pathlib import Path


@dataclass(frozen=True)
class GeneratorConfig:
    """Parâmetros do gerador. Imutável — clone via dataclasses.replace."""

    seed: int = 42
    num_categories: int = 10
    num_products: int = 80
    num_customers: int = 500
    orders_per_day: int = 500
    avg_items_per_order: float = 2.5
    avg_payments_per_order: float = 1.1

    late_data_pct: float = 0.05
    late_data_window_h: int = 72
    duplicate_pct: float = 0.01
    corrupt_pct: float = 0.02

    out_dir: Path = field(default_factory=lambda: Path("data"))
```

- [ ] **Step 4: Rodar teste e ver passar**

```bash
pytest tests/test_config.py -v
```
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add generator/faker_lakehouse/config.py generator/tests/test_config.py
git commit -m "feat(generator): adiciona GeneratorConfig com defaults"
git push
```

---

### Task 3: `writer.py` — escrita JSONL particionada

**Files:**
- Create: `generator/faker_lakehouse/writer.py`
- Test: `generator/tests/test_writer.py`

- [ ] **Step 1: Escrever testes falhos**

`generator/tests/test_writer.py`:
```python
import json
from datetime import date
from pathlib import Path
from faker_lakehouse.writer import write_seed, write_partitioned


def test_write_seed_creates_file(tmp_path: Path):
    records = [{"id": "a", "name": "x"}, {"id": "b", "name": "y"}]
    out = write_seed(tmp_path, "categories", records)
    assert out == tmp_path / "seed" / "categories.jsonl"
    assert out.exists()
    lines = out.read_text(encoding="utf-8").strip().split("\n")
    assert len(lines) == 2
    assert json.loads(lines[0]) == {"id": "a", "name": "x"}


def test_write_seed_overwrites(tmp_path: Path):
    write_seed(tmp_path, "categories", [{"id": "a"}])
    out = write_seed(tmp_path, "categories", [{"id": "b"}])
    assert out.read_text(encoding="utf-8").strip() == '{"id": "b"}'


def test_write_partitioned_creates_partition(tmp_path: Path):
    records = [{"event_id": "1"}, {"event_id": "2"}]
    out = write_partitioned(
        tmp_path, "orders", date(2026, 4, 1), records, part_index=0
    )
    expected = (
        tmp_path
        / "landing"
        / "orders"
        / "_partition_date=2026-04-01"
        / "part-00000.jsonl"
    )
    assert out == expected
    assert out.exists()


def test_write_partitioned_empty_returns_none(tmp_path: Path):
    out = write_partitioned(tmp_path, "orders", date(2026, 4, 1), [], part_index=0)
    assert out is None
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
pytest tests/test_writer.py -v
```
Expected: FAIL — `ModuleNotFoundError`.

- [ ] **Step 3: Implementar `writer.py`**

```python
"""Escrita JSONL: seed (sobrescreve) e landing particionado."""
import json
from datetime import date
from pathlib import Path
from typing import Iterable, Optional


def write_seed(out_dir: Path, entity: str, records: Iterable[dict]) -> Path:
    """Escreve dimensão seed em data/seed/<entity>.jsonl. Sobrescreve se existir."""
    target_dir = out_dir / "seed"
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / f"{entity}.jsonl"
    with target.open("w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec, ensure_ascii=False, default=str) + "\n")
    return target


def write_partitioned(
    out_dir: Path,
    entity: str,
    partition_date: date,
    records: Iterable[dict],
    part_index: int,
) -> Optional[Path]:
    """Escreve eventos em data/landing/<entity>/_partition_date=YYYY-MM-DD/part-NNNNN.jsonl.

    Retorna None se não há registros (não cria arquivo vazio).
    """
    records = list(records)
    if not records:
        return None
    target_dir = (
        out_dir
        / "landing"
        / entity
        / f"_partition_date={partition_date.isoformat()}"
    )
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / f"part-{part_index:05d}.jsonl"
    with target.open("w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec, ensure_ascii=False, default=str) + "\n")
    return target
```

- [ ] **Step 4: Rodar e ver passar**

```bash
pytest tests/test_writer.py -v
```
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add generator/faker_lakehouse/writer.py generator/tests/test_writer.py
git commit -m "feat(generator): adiciona writer JSONL com particionamento por data"
git push
```

---

### Task 4: `dimensions.py` — geração de categories/products/customers

**Files:**
- Create: `generator/faker_lakehouse/dimensions.py`
- Test: `generator/tests/test_dimensions.py`

- [ ] **Step 1: Escrever testes falhos**

`generator/tests/test_dimensions.py`:
```python
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
    # Pelo menos 1 categoria deve ter parent (subcategoria)
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
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
pytest tests/test_dimensions.py -v
```
Expected: FAIL — `ModuleNotFoundError`.

- [ ] **Step 3: Implementar `dimensions.py`**

```python
"""Geração de dimensões: categories, products, customers."""
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
```

- [ ] **Step 4: Rodar e ver passar**

```bash
pytest tests/test_dimensions.py -v
```
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add generator/faker_lakehouse/dimensions.py generator/tests/test_dimensions.py
git commit -m "feat(generator): adiciona geracao de dimensoes (categories/products/customers)"
git push
```

---

### Task 5: `events.py` — lifecycle de pedidos

**Files:**
- Create: `generator/faker_lakehouse/events.py`
- Test: `generator/tests/test_events.py`

- [ ] **Step 1: Escrever testes falhos**

`generator/tests/test_events.py`:
```python
from datetime import date, datetime, timedelta, timezone

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
    assert 0 < paid < created  # entre 50% e 90% pagam
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
pytest tests/test_events.py -v
```
Expected: FAIL — `ModuleNotFoundError`.

- [ ] **Step 3: Implementar `events.py`**

```python
"""Geração de eventos transacionais com lifecycle de pedido."""
import random
import uuid
from datetime import date, datetime, time, timedelta, timezone

from faker_lakehouse.config import GeneratorConfig

PAID_PROB = 0.70
SHIPPED_PROB = 0.60          # condicional a paid
DELIVERED_PROB = 0.90        # condicional a shipped
CANCELLED_PROB = 0.05        # pode ocorrer em qualquer estado pre-shipped
REFUNDED_PROB = 0.03         # condicional a paid


def _envelope(event_type: str, occurred_at: datetime, payload: dict) -> dict:
    return {
        "event_id": str(uuid.uuid4()),
        "event_type": event_type,
        "occurred_at": occurred_at.isoformat(),
        "received_at": occurred_at.isoformat(),  # ajustado depois pelos faults
        "source": "faker-lakehouse",
        "payload": payload,
    }


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
    """Gera todos os eventos transacionais de um dia.

    Retorna {"orders": [...], "order_items": [...], "payments": [...]}.
    UUIDs e Faker são determinísticos por seed; a função usa random.Random local.
    """
    rng = random.Random(cfg.seed * 1000 + day.toordinal())
    uuid_rng = random.Random(cfg.seed * 1000 + day.toordinal() + 1)

    # Para determinismo do uuid4 dentro deste escopo, monkey-patch local
    def _uuid4_det() -> str:
        return str(uuid.UUID(int=uuid_rng.getrandbits(128), version=4))

    orders: list[dict] = []
    items: list[dict] = []
    payments: list[dict] = []

    for i in range(cfg.orders_per_day):
        order_id = f"ord_{day.isoformat()}_{i:05d}"
        customer = rng.choice(customers)
        currency = rng.choice(["BRL", "USD", "EUR"])
        created_at = _random_time_on(day, rng)

        # itens (1..5)
        n_items = max(1, int(rng.gauss(cfg.avg_items_per_order, 1.2)))
        n_items = min(max(n_items, 1), 5)
        order_total = 0.0
        for j in range(n_items):
            prod = rng.choice(products)
            qty = rng.randint(1, 3)
            line_total = round(prod["unit_price"] * qty, 2)
            order_total += line_total
            items.append({
                "event_id": _uuid4_det(),
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

        # order.created
        orders.append({
            "event_id": _uuid4_det(),
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

        # cancelamento antes de paid
        if rng.random() < CANCELLED_PROB:
            cancel_at = created_at + timedelta(minutes=rng.randint(5, 240))
            orders.append({
                "event_id": _uuid4_det(),
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
            "event_id": _uuid4_det(),
            "event_type": "order.paid",
            "occurred_at": paid_at.isoformat(),
            "received_at": paid_at.isoformat(),
            "source": "faker-lakehouse",
            "payload": {"order_id": order_id, "status": "paid"},
        })

        # pagamento (~1.1 por pedido em média — chance de 2 capturas)
        n_pays = 2 if rng.random() < 0.10 else 1
        remaining = order_total
        for k in range(n_pays):
            amount = round(remaining if k == n_pays - 1 else remaining / 2, 2)
            remaining -= amount
            payments.append({
                "event_id": _uuid4_det(),
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

        # estorno
        if rng.random() < REFUNDED_PROB:
            refund_at = paid_at + timedelta(hours=rng.randint(1, 48))
            orders.append({
                "event_id": _uuid4_det(),
                "event_type": "order.refunded",
                "occurred_at": refund_at.isoformat(),
                "received_at": refund_at.isoformat(),
                "source": "faker-lakehouse",
                "payload": {"order_id": order_id, "status": "refunded"},
            })
            continue

        # shipped/delivered
        if rng.random() >= SHIPPED_PROB:
            continue
        shipped_at = paid_at + timedelta(hours=rng.randint(2, 72))
        orders.append({
            "event_id": _uuid4_det(),
            "event_type": "order.shipped",
            "occurred_at": shipped_at.isoformat(),
            "received_at": shipped_at.isoformat(),
            "source": "faker-lakehouse",
            "payload": {"order_id": order_id, "status": "shipped"},
        })

        if rng.random() < DELIVERED_PROB:
            delivered_at = shipped_at + timedelta(hours=rng.randint(12, 240))
            orders.append({
                "event_id": _uuid4_det(),
                "event_type": "order.delivered",
                "occurred_at": delivered_at.isoformat(),
                "received_at": delivered_at.isoformat(),
                "source": "faker-lakehouse",
                "payload": {"order_id": order_id, "status": "delivered"},
            })

    return {"orders": orders, "order_items": items, "payments": payments}
```

- [ ] **Step 4: Rodar e ver passar**

```bash
pytest tests/test_events.py -v
```
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add generator/faker_lakehouse/events.py generator/tests/test_events.py
git commit -m "feat(generator): adiciona lifecycle de eventos transacionais"
git push
```

---

### Task 6: `faults.py` — late data, duplicatas, payload corrompido

**Files:**
- Create: `generator/faker_lakehouse/faults.py`
- Test: `generator/tests/test_faults.py`

- [ ] **Step 1: Escrever testes falhos**

`generator/tests/test_faults.py`:
```python
import json
from datetime import datetime, timezone

from faker_lakehouse.config import GeneratorConfig
from faker_lakehouse.faults import inject_faults


def _make_event(occurred: str = "2026-04-01T10:00:00+00:00") -> dict:
    return {
        "event_id": "id-1",
        "event_type": "order.created",
        "occurred_at": occurred,
        "received_at": occurred,
        "source": "faker-lakehouse",
        "payload": {"order_id": "o1"},
    }


def test_inject_faults_preserves_count_minus_drops():
    events = [_make_event() for _ in range(1000)]
    cfg = GeneratorConfig(
        seed=42, late_data_pct=0.05, duplicate_pct=0.01, corrupt_pct=0.02
    )
    out = inject_faults(events, cfg)
    # adiciona duplicatas, então saída é >= entrada
    assert len(out) >= len(events)


def test_duplicates_share_event_id():
    events = [_make_event() for _ in range(1000)]
    cfg = GeneratorConfig(seed=42, late_data_pct=0, duplicate_pct=0.05, corrupt_pct=0)
    out = inject_faults(events, cfg)
    ids = [e["event_id"] for e in out if isinstance(e, dict)]
    assert len(ids) > len(set(ids))


def test_late_data_shifts_received_at():
    events = [_make_event() for _ in range(200)]
    cfg = GeneratorConfig(seed=42, late_data_pct=1.0, duplicate_pct=0, corrupt_pct=0,
                          late_data_window_h=72)
    out = inject_faults(events, cfg)
    shifted = [
        e for e in out
        if isinstance(e, dict) and e["received_at"] != e["occurred_at"]
    ]
    assert len(shifted) == len(events)
    for e in shifted:
        assert e["received_at"] > e["occurred_at"]


def test_corrupt_produces_invalid_records():
    events = [_make_event() for _ in range(500)]
    cfg = GeneratorConfig(seed=42, late_data_pct=0, duplicate_pct=0, corrupt_pct=1.0)
    out = inject_faults(events, cfg)
    # Todos devem estar corrompidos
    corrupt = [e for e in out if e.get("_corrupt")]
    assert len(corrupt) == len(events)


def test_zero_rates_returns_unchanged():
    events = [_make_event() for _ in range(50)]
    cfg = GeneratorConfig(seed=42, late_data_pct=0, duplicate_pct=0, corrupt_pct=0)
    out = inject_faults(events, cfg)
    assert out == events
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
pytest tests/test_faults.py -v
```
Expected: FAIL — `ModuleNotFoundError`.

- [ ] **Step 3: Implementar `faults.py`**

```python
"""Injeção de falhas realistas: late data, duplicatas, payloads corrompidos."""
import copy
import random
from datetime import datetime, timedelta

from faker_lakehouse.config import GeneratorConfig

CORRUPTION_MODES = ["broken_json", "missing_field", "wrong_type"]


def inject_faults(events: list[dict], cfg: GeneratorConfig) -> list[dict]:
    """Aplica faults em ordem: corrupt → late → duplicate.

    Late data ajusta `received_at`. Duplicatas reaparecem com mesmo `event_id`.
    Eventos corrompidos recebem flag `_corrupt` e payload mutado.
    """
    if cfg.late_data_pct == 0 and cfg.duplicate_pct == 0 and cfg.corrupt_pct == 0:
        return events

    rng = random.Random(cfg.seed + 7777)
    result: list[dict] = []

    for event in events:
        e = copy.deepcopy(event)

        if rng.random() < cfg.corrupt_pct:
            e = _corrupt(e, rng)

        if rng.random() < cfg.late_data_pct:
            e = _delay(e, rng, cfg.late_data_window_h)

        result.append(e)

        if rng.random() < cfg.duplicate_pct:
            result.append(copy.deepcopy(e))

    return result


def _delay(event: dict, rng: random.Random, window_h: int) -> dict:
    occurred = datetime.fromisoformat(event["occurred_at"])
    delay_seconds = rng.randint(60, window_h * 3600)
    event["received_at"] = (occurred + timedelta(seconds=delay_seconds)).isoformat()
    return event


def _corrupt(event: dict, rng: random.Random) -> dict:
    mode = rng.choice(CORRUPTION_MODES)
    event["_corrupt"] = mode
    if mode == "broken_json":
        event["payload"] = "{not-json"
    elif mode == "missing_field":
        if isinstance(event.get("payload"), dict):
            keys = list(event["payload"].keys())
            if keys:
                event["payload"].pop(rng.choice(keys))
    elif mode == "wrong_type":
        if isinstance(event.get("payload"), dict) and event["payload"]:
            k = next(iter(event["payload"]))
            event["payload"][k] = ["unexpected", "list"]
    return event
```

- [ ] **Step 4: Rodar e ver passar**

```bash
pytest tests/test_faults.py -v
```
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add generator/faker_lakehouse/faults.py generator/tests/test_faults.py
git commit -m "feat(generator): adiciona injecao de falhas (late, dup, corrupt)"
git push
```

---

### Task 7: `cdc.py` — eventos de mudança de dimensão

**Files:**
- Create: `generator/faker_lakehouse/cdc.py`
- Test: `generator/tests/test_cdc.py`

- [ ] **Step 1: Escrever testes falhos**

`generator/tests/test_cdc.py`:
```python
from datetime import date

from faker_lakehouse.config import GeneratorConfig
from faker_lakehouse.dimensions import (
    generate_categories,
    generate_products,
    generate_customers,
)
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
    # ~1% produtos e ~0,5% customers (margem ampla)
    assert 5 <= prod_updates <= 30
    assert 30 <= cust_updates <= 100
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
pytest tests/test_cdc.py -v
```
Expected: FAIL — `ModuleNotFoundError`.

- [ ] **Step 3: Implementar `cdc.py`**

```python
"""Geração de eventos CDC para dimensões."""
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
    """Emite eventos product.updated e customer.updated para um dia."""
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
```

- [ ] **Step 4: Rodar e ver passar**

```bash
pytest tests/test_cdc.py -v
```
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add generator/faker_lakehouse/cdc.py generator/tests/test_cdc.py
git commit -m "feat(generator): adiciona CDC de dimensoes (product/customer updates)"
git push
```

---

### Task 8: `cli.py` — entrypoints `seed` e `run`

**Files:**
- Create: `generator/faker_lakehouse/cli.py`
- Test: `generator/tests/test_cli.py`

- [ ] **Step 1: Escrever testes falhos**

`generator/tests/test_cli.py`:
```python
import json
from pathlib import Path
from click.testing import CliRunner

from faker_lakehouse.cli import main


def test_seed_creates_three_files(tmp_path: Path):
    runner = CliRunner()
    result = runner.invoke(main, ["seed", "--out-dir", str(tmp_path)])
    assert result.exit_code == 0, result.output
    assert (tmp_path / "seed" / "categories.jsonl").exists()
    assert (tmp_path / "seed" / "products.jsonl").exists()
    assert (tmp_path / "seed" / "customers.jsonl").exists()


def test_run_creates_partitioned_files(tmp_path: Path):
    runner = CliRunner()
    runner.invoke(main, ["seed", "--out-dir", str(tmp_path)])
    result = runner.invoke(
        main,
        [
            "run",
            "--start", "2026-04-01",
            "--days", "2",
            "--orders-per-day", "20",
            "--out-dir", str(tmp_path),
        ],
    )
    assert result.exit_code == 0, result.output
    landing = tmp_path / "landing"
    for entity in ("orders", "order_items", "payments"):
        for d in ("2026-04-01", "2026-04-02"):
            partition = landing / entity / f"_partition_date={d}"
            assert partition.exists(), f"{entity} {d} missing"
            files = list(partition.glob("part-*.jsonl"))
            assert files, f"No part files in {partition}"


def test_run_is_deterministic(tmp_path: Path):
    runner = CliRunner()
    out_a = tmp_path / "a"
    out_b = tmp_path / "b"
    for out in (out_a, out_b):
        runner.invoke(main, ["seed", "--out-dir", str(out), "--seed", "99"])
        runner.invoke(main, [
            "run", "--start", "2026-04-01", "--days", "1",
            "--orders-per-day", "10", "--seed", "99",
            "--late-data-pct", "0", "--duplicate-pct", "0", "--corrupt-pct", "0",
            "--out-dir", str(out),
        ])
    file_a = out_a / "landing" / "orders" / "_partition_date=2026-04-01" / "part-00000.jsonl"
    file_b = out_b / "landing" / "orders" / "_partition_date=2026-04-01" / "part-00000.jsonl"
    assert file_a.read_text() == file_b.read_text()
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
pytest tests/test_cli.py -v
```
Expected: FAIL — `ModuleNotFoundError`.

- [ ] **Step 3: Implementar `cli.py`**

```python
"""CLI do faker-lakehouse."""
from datetime import date, timedelta
from pathlib import Path

import click

from faker_lakehouse.cdc import generate_dim_changes
from faker_lakehouse.config import GeneratorConfig
from faker_lakehouse.dimensions import (
    generate_categories,
    generate_customers,
    generate_products,
)
from faker_lakehouse.events import generate_day_events
from faker_lakehouse.faults import inject_faults
from faker_lakehouse.writer import write_partitioned, write_seed


def _build_config(seed, orders_per_day, late_pct, late_h, dup_pct, corrupt_pct, out_dir):
    kwargs = dict(out_dir=Path(out_dir))
    if seed is not None:
        kwargs["seed"] = seed
    if orders_per_day is not None:
        kwargs["orders_per_day"] = orders_per_day
    if late_pct is not None:
        kwargs["late_data_pct"] = late_pct
    if late_h is not None:
        kwargs["late_data_window_h"] = late_h
    if dup_pct is not None:
        kwargs["duplicate_pct"] = dup_pct
    if corrupt_pct is not None:
        kwargs["corrupt_pct"] = corrupt_pct
    return GeneratorConfig(**kwargs)


@click.group()
def main():
    """Gerador de dados de e-commerce para SDD com Claude."""


@main.command()
@click.option("--seed", type=int, default=None)
@click.option("--out-dir", type=click.Path(), default="data")
def seed(seed, out_dir):
    """Gera dimensões iniciais em <out-dir>/seed/."""
    cfg = _build_config(seed, None, None, None, None, None, out_dir)
    cats = generate_categories(cfg)
    prods = generate_products(cfg, cats)
    custs = generate_customers(cfg)
    write_seed(cfg.out_dir, "categories", cats)
    write_seed(cfg.out_dir, "products", prods)
    write_seed(cfg.out_dir, "customers", custs)
    click.echo(f"Seed escrita em {cfg.out_dir}/seed/")


@main.command()
@click.option("--start", type=click.DateTime(formats=["%Y-%m-%d"]), required=True)
@click.option("--days", type=int, default=1)
@click.option("--seed", type=int, default=None)
@click.option("--orders-per-day", type=int, default=None)
@click.option("--late-data-pct", type=float, default=None)
@click.option("--late-data-window-h", type=int, default=None)
@click.option("--duplicate-pct", type=float, default=None)
@click.option("--corrupt-pct", type=float, default=None)
@click.option("--out-dir", type=click.Path(), default="data")
def run(start, days, seed, orders_per_day, late_data_pct, late_data_window_h,
        duplicate_pct, corrupt_pct, out_dir):
    """Gera <days> dias de eventos a partir de <start>."""
    cfg = _build_config(
        seed, orders_per_day, late_data_pct, late_data_window_h,
        duplicate_pct, corrupt_pct, out_dir,
    )
    # carrega dimensões da seed
    cats = generate_categories(cfg)
    prods = generate_products(cfg, cats)
    custs = generate_customers(cfg)

    start_date = start.date() if hasattr(start, "date") else start

    for i in range(days):
        day = start_date + timedelta(days=i)
        streams = generate_day_events(cfg, day, prods, custs)
        for entity, events in streams.items():
            events = inject_faults(events, cfg)
            write_partitioned(cfg.out_dir, entity, day, events, part_index=0)

        dim = generate_dim_changes(cfg, day, prods, custs)
        if dim:
            write_partitioned(cfg.out_dir, "dim_changes", day, dim, part_index=0)

    click.echo(f"Executado: {days} dias a partir de {start_date.isoformat()}")
```

- [ ] **Step 4: Rodar e ver passar**

```bash
pytest tests/test_cli.py -v
```
Expected: 3 passed.

- [ ] **Step 5: Rodar suite completa**

```bash
pytest -v
```
Expected: todos passam.

- [ ] **Step 6: Commit**

```bash
git add generator/faker_lakehouse/cli.py generator/tests/test_cli.py
git commit -m "feat(generator): adiciona CLI seed/run com idempotencia por seed"
git push
```

---

### Task 9: Integration test e amostra commitada

**Files:**
- Create: `generator/tests/test_integration.py`
- Create: `data/.gitignore`
- Create: `data/seed/.gitkeep`
- Create: `data/landing/.gitkeep`
- Modify: `.gitignore` (raiz)

- [ ] **Step 1: Escrever teste de integração**

`generator/tests/test_integration.py`:
```python
import json
from pathlib import Path
from click.testing import CliRunner

from faker_lakehouse.cli import main


def test_full_run_produces_expected_volumes(tmp_path: Path):
    runner = CliRunner()
    runner.invoke(main, ["seed", "--out-dir", str(tmp_path), "--seed", "42"])
    result = runner.invoke(main, [
        "run", "--start", "2026-04-01", "--days", "3",
        "--orders-per-day", "100", "--seed", "42",
        "--out-dir", str(tmp_path),
    ])
    assert result.exit_code == 0, result.output

    # 3 dias × 4 entidades (orders, order_items, payments, dim_changes opcional)
    landing = tmp_path / "landing"
    orders_partitions = list((landing / "orders").glob("_partition_date=*"))
    assert len(orders_partitions) == 3

    # cada partição orders deve ter ≥ 100 eventos (created + lifecycle subsequente)
    for p in orders_partitions:
        files = list(p.glob("part-*.jsonl"))
        assert files
        lines = files[0].read_text(encoding="utf-8").strip().split("\n")
        assert len(lines) >= 100


def test_envelope_contract_in_output(tmp_path: Path):
    runner = CliRunner()
    runner.invoke(main, ["seed", "--out-dir", str(tmp_path)])
    runner.invoke(main, [
        "run", "--start", "2026-04-01", "--days", "1",
        "--orders-per-day", "10", "--out-dir", str(tmp_path),
    ])
    file = next(
        (tmp_path / "landing" / "orders" / "_partition_date=2026-04-01").glob("part-*.jsonl")
    )
    for line in file.read_text(encoding="utf-8").strip().split("\n"):
        rec = json.loads(line)
        assert "event_id" in rec and "event_type" in rec
        assert "occurred_at" in rec and "received_at" in rec
        assert rec["source"] == "faker-lakehouse"
```

- [ ] **Step 2: Rodar integration**

```bash
pytest tests/test_integration.py -v
```
Expected: 2 passed.

- [ ] **Step 3: Criar `data/.gitignore`**

```gitignore
# Ignora todos os arquivos gerados em landing exceto os explicitamente versionados
landing/*
!landing/.gitkeep
!landing/_sample/
```

- [ ] **Step 4: Criar `data/seed/.gitkeep` e `data/landing/.gitkeep` (arquivos vazios)**

- [ ] **Step 5: Atualizar `.gitignore` da raiz**

`/​.gitignore` — adicionar ao final:
```gitignore
# generator
generator/.venv/
generator/.pytest_cache/
generator/**/__pycache__/
generator/*.egg-info/
generator/.coverage
```

- [ ] **Step 6: Gerar e commitar amostra pequena**

```bash
cd generator
faker-lakehouse seed --out-dir ../data/_sample --seed 42
faker-lakehouse run --start 2026-04-01 --days 1 --orders-per-day 20 --seed 42 --out-dir ../data/_sample
cd ..
git add data/_sample
```

Em `data/.gitignore`, garantir que `_sample/` é versionado (ajuste se necessário).

- [ ] **Step 7: Commit**

```bash
git add data/.gitignore data/seed/.gitkeep data/landing/.gitkeep .gitignore generator/tests/test_integration.py
git commit -m "feat(generator): adiciona testes de integracao e amostra versionada"
git push
```

---

## Phase 2 — Specs revisadas (markdown)

### Task 10: `spec-exemplo-raw-commerce-events.md`

**Files:**
- Create: `artefatos/specs/spec-exemplo-raw-commerce-events.md`
- Delete: `artefatos/specs/spec-exemplo-raw-orders.md`

- [ ] **Step 1: Criar `spec-exemplo-raw-commerce-events.md` com o conteúdo abaixo**

```markdown
# Spec Example: raw.commerce_events

## Objective
Ingerir eventos brutos de comércio (`orders`, `order_items`, `payments`) sem transformação, preservando fidelidade total para rastreabilidade e reprocessamento. Fonte concreta: gerador `faker-lakehouse`.

## Databricks object type
Lakeflow Spark Declarative Pipeline com Auto Loader (`cloudFiles`) sobre `data/landing/{orders,order_items,payments}/_partition_date=*/`.

## Layer
Raw

## Sources
- `data/landing/orders/_partition_date=YYYY-MM-DD/part-*.jsonl`
- `data/landing/order_items/_partition_date=YYYY-MM-DD/part-*.jsonl`
- `data/landing/payments/_partition_date=YYYY-MM-DD/part-*.jsonl`

## Targets
- `raw.commerce_events`

## Grain and keys
- 1 linha por evento recebido (sem deduplicação)
- chave natural: `event_id` (UUID gerado pela fonte)
- discriminador de origem: coluna `_entity ∈ {orders, order_items, payments}` derivada do path do arquivo

## Transformation rules
- Nenhuma transformação aplicada ao envelope ou payload
- Adicionar metadados de ingestão: `_ingested_at`, `_source_file`, `_partition_date`, `_entity`
- `payload` permanece como string JSON crua (parsing fica na bronze)

## Incremental strategy
- Append-only via Auto Loader com checkpoint
- Particionamento físico por `_partition_date` e `_entity`

## Late data or CDC behavior
- Não aplicável na raw — todos eventos aceitos independentemente do timestamp ou conteúdo

## Schema contract
- `event_id`: string, not null
- `event_type`: string, not null
- `occurred_at`: timestamp
- `received_at`: timestamp, not null
- `source`: string
- `payload`: string (JSON raw), not null
- `_entity`: string, not null
- `_ingested_at`: timestamp, not null
- `_source_file`: string
- `_partition_date`: date, not null

## Data quality rules
- `event_id` não nulo
- `received_at` não nulo
- `_entity` ∈ {`orders`, `order_items`, `payments`}
- volume diário dentro de banda histórica (alerta para queda > 20%)

## Observability
- métricas de arquivos/linhas/bytes processados por execução, segregadas por `_entity`
- alerta para ausência de dados > 2h em horário comercial
- taxa de erro de leitura = 0 (parsing real fica em bronze)

## Performance and cost constraints
- Auto Loader incremental — sem full scan do landing
- compactação semanal (`OPTIMIZE`) para mitigar small files
- evitar shuffle (raw é puro append)

## Environment impact
- dev
- staging
- prod

## Backfill plan
- reprocessar `data/landing/` para janela ≤ 90 dias
- reexecução do `faker-lakehouse run` com mesma `--seed` é idempotente (mesmos `event_id`)

## Rollback plan
- raw é append-only: descartar partição com problema (`DELETE WHERE _partition_date = ...`) e reprocessar a partir do landing

## Acceptance criteria
- todos os eventos do gerador presentes em `raw.commerce_events` com `_entity` correto
- contagem por `_entity` por dia bate com contador do gerador (tolerância 0%)
- nenhum evento descartado sem registro de erro
```

- [ ] **Step 2: Remover spec antiga**

```bash
git rm artefatos/specs/spec-exemplo-raw-orders.md
```

- [ ] **Step 3: Commit**

```bash
git add artefatos/specs/spec-exemplo-raw-commerce-events.md
git commit -m "docs(spec): substitui spec-exemplo-raw-orders por raw-commerce-events"
git push
```

---

### Task 11: `spec-exemplo-raw-dim-changes.md`

**Files:**
- Create: `artefatos/specs/spec-exemplo-raw-dim-changes.md`

- [ ] **Step 1: Criar arquivo**

```markdown
# Spec Example: raw.commerce_dim_changes

## Objective
Ingerir eventos de mudança de dimensões (CDC de `products` e `customers`) emitidos pelo gerador, isolando-os de eventos transacionais para simplificar consumo SCD2 na bronze.

## Databricks object type
Lakeflow Spark Declarative Pipeline com Auto Loader (`cloudFiles`) sobre `data/landing/dim_changes/_partition_date=*/`.

## Layer
Raw

## Sources
- `data/landing/dim_changes/_partition_date=YYYY-MM-DD/part-*.jsonl`
- Snapshots iniciais: `data/seed/{categories,products,customers}.jsonl` (ingeridos uma vez)

## Targets
- `raw.commerce_dim_changes`
- `raw.commerce_dim_seed_categories`
- `raw.commerce_dim_seed_products`
- `raw.commerce_dim_seed_customers`

## Grain and keys
- CDC: 1 linha por evento; chave natural `event_id`
- Seed: 1 linha por entidade; chave natural `entity_id` (uma única ingestão)

## Transformation rules
- Nenhuma transformação no envelope ou payload
- Adicionar metadados `_ingested_at`, `_source_file`, `_partition_date`
- `payload` permanece como string JSON

## Incremental strategy
- CDC: Auto Loader append-only com checkpoint
- Seed: ingestão one-shot no go-live; reexecutável (sobrescreve)

## Late data or CDC behavior
- não aplicável na raw (CDC ordering tratado na bronze SCD2)

## Schema contract (raw.commerce_dim_changes)
- `event_id`: string, not null
- `event_type`: string, not null (`product.updated` | `customer.updated`)
- `occurred_at`: timestamp
- `received_at`: timestamp, not null
- `source`: string
- `payload`: string (JSON raw), not null
- `_ingested_at`: timestamp, not null
- `_source_file`: string
- `_partition_date`: date, not null

## Data quality rules
- `event_id` não nulo
- `event_type` ∈ {`product.updated`, `customer.updated`}
- volume diário > 0 em ambientes com fonte ativa

## Observability
- métricas de eventos por `event_type` e por dia
- alerta para ausência de eventos por mais de 7 dias (silenciamento da fonte)

## Performance and cost constraints
- Auto Loader incremental
- volume baixo — não requer otimização específica

## Environment impact
- dev
- staging
- prod

## Backfill plan
- reprocessar `data/landing/dim_changes/` na janela necessária
- reingerir seed em caso de inconsistência da dimensão atual

## Rollback plan
- append-only: descartar partição problemática e reprocessar

## Acceptance criteria
- contagem de eventos por `event_type` bate com contador do gerador
- seed populada com 10 categories, 80 products, 500 customers (default)
```

- [ ] **Step 2: Commit**

```bash
git add artefatos/specs/spec-exemplo-raw-dim-changes.md
git commit -m "docs(spec): adiciona spec raw-dim-changes para CDC de dimensoes"
git push
```

---

### Task 12: `spec-exemplo-bronze-commerce-events.md`

**Files:**
- Create: `artefatos/specs/spec-exemplo-bronze-commerce-events.md`
- Delete: `artefatos/specs/spec-exemplo-bronze-orders.md`

- [ ] **Step 1: Criar arquivo**

```markdown
# Spec Example: bronze.commerce_events

## Objective
Estruturar e validar eventos brutos de comércio, aplicando parsing tipado por `_entity` e deduplicação por `event_id`, mantendo histórico completo para auditoria. Registros corrompidos vão para quarentena, não para a bronze principal.

## Databricks object type
Lakeflow Spark Declarative Pipeline ou job PySpark versionado em bundle.

## Layer
Bronze

## Sources
- `raw.commerce_events`

## Targets
- `bronze.commerce_events`
- `bronze.commerce_events_quarantine`

## Grain and keys
- 1 linha por `event_id` único
- chave primária lógica: `event_id`

## Transformation rules
- Parse de `payload` (JSON) em colunas tipadas por `_entity`:
  - `orders`: `order_id`, `customer_id`, `currency`, `total_amount`, `status`
  - `order_items`: `order_item_id`, `order_id`, `product_id`, `quantity`, `unit_price`, `line_total`
  - `payments`: `payment_id`, `order_id`, `method`, `amount`, `currency`, `status`
- Deduplicação por `event_id` mantendo o registro com maior `received_at`
- Rejeição para quarentena se: `event_id` nulo, `received_at` nulo, payload com JSON quebrado, ou campo obrigatório ausente conforme `_entity`
- Preservar coluna `_raw_payload` para auditoria

## Incremental strategy
- `MERGE INTO bronze.commerce_events USING staging ON event_id = event_id`
- particionamento por `event_date` (derivado de `received_at::date`) e `_entity`

## Late data or CDC behavior
- aceitar eventos atrasados até 7 dias (`received_at >= current_timestamp - INTERVAL 7 DAY`)
- evento mais recente para mesmo `event_id` substitui versão anterior

## Schema contract
- `event_id`: string, not null (único)
- `event_type`: string, not null
- `_entity`: string, not null
- `order_id`: string (nullable conforme entidade)
- `customer_id`: string
- `product_id`: string
- `payment_id`: string
- `currency`: string
- `total_amount`: decimal(18,2)
- `quantity`: int
- `unit_price`: decimal(18,2)
- `amount`: decimal(18,2)
- `method`: string
- `status`: string
- `occurred_at`: timestamp
- `received_at`: timestamp, not null
- `event_date`: date, not null
- `_raw_payload`: string
- `_ingested_at`: timestamp, not null

## Data quality rules
- unicidade de `event_id`
- `_entity` ∈ {`orders`, `order_items`, `payments`}
- `event_type` válido por entidade (whitelist `order.created`, `order.paid`, `order.shipped`, `order.delivered`, `order.cancelled`, `order.refunded`, `order_item.created`, `payment.captured`)
- referencial fraco: `order_id` em `order_items` e `payments` deve existir em `bronze.commerce_events` onde `_entity = orders` (alerta, não bloqueio)
- registros rejeitados enviados para `bronze.commerce_events_quarantine` com motivo

## Observability
- métricas por execução: parsed, deduplicados, rejeitados (por motivo), por `_entity`
- alerta para taxa de rejeição > 1%
- alerta para ausência de eventos `order.paid` por mais de 1 hora em horário comercial

## Performance and cost constraints
- evitar full scan da raw — usar watermark por `_partition_date`
- compactação periódica via `OPTIMIZE` + Z-ORDER em `event_id`

## Environment impact
- dev
- staging
- prod

## Backfill plan
- reprocessar a partir da raw para janela de 90 dias antes do go-live
- idempotente: reexecução com mesma raw produz mesma bronze

## Rollback plan
- restaurar versão anterior do bundle
- reprocessar bronze a partir da raw após correção
- partições problemáticas podem ser descartadas e reprocessadas isoladamente

## Acceptance criteria
- tabela publicada em `bronze.commerce_events`
- taxa de rejeição < 1% no piloto
- schema validado e sem quebras de contrato
- reconciliação com raw: `count(distinct event_id)` na bronze + quarentena = `count(distinct event_id)` na raw
```

- [ ] **Step 2: Remover spec antiga**

```bash
git rm artefatos/specs/spec-exemplo-bronze-orders.md
```

- [ ] **Step 3: Commit**

```bash
git add artefatos/specs/spec-exemplo-bronze-commerce-events.md
git commit -m "docs(spec): substitui spec-exemplo-bronze-orders por bronze-commerce-events"
git push
```

---

### Task 13: `spec-exemplo-bronze-dimensions.md`

**Files:**
- Create: `artefatos/specs/spec-exemplo-bronze-dimensions.md`

- [ ] **Step 1: Criar arquivo**

```markdown
# Spec Example: bronze.dim_customers / bronze.dim_products / bronze.dim_categories

## Objective
Materializar dimensões em SCD Tipo 2 a partir do snapshot inicial e dos eventos CDC, permitindo reconstrução histórica de qualquer estado de `customer`, `product` ou `category` em qualquer ponto no tempo.

## Databricks object type
Lakeflow Spark Declarative Pipeline ou job PySpark versionado em bundle. Uma pipeline por dimensão (3 alvos) ou pipeline única com 3 outputs.

## Layer
Bronze

## Sources
- `raw.commerce_dim_seed_customers` (snapshot inicial)
- `raw.commerce_dim_seed_products` (snapshot inicial)
- `raw.commerce_dim_seed_categories` (snapshot inicial)
- `raw.commerce_dim_changes` (CDC contínuo, filtrado por `event_type`)

## Targets
- `bronze.dim_customers`
- `bronze.dim_products`
- `bronze.dim_categories`

## Grain and keys
- 1 linha por (`entity_id`, `_valid_from`)
- chave natural: `entity_id` (`customer_id`, `product_id`, `category_id`)
- chave do registro: `entity_id` + `_valid_from`

## Transformation rules
- **Carga inicial**: 1 linha por `entity_id` da seed com `_valid_from = signup_date` (ou `current_timestamp` se ausente), `_valid_to = NULL`, `_is_current = true`
- **CDC subsequente**: para cada evento aplicável, fechar a linha atual (`_valid_to = occurred_at`, `_is_current = false`) e inserir nova linha com os atributos atualizados (`_valid_from = occurred_at`, `_valid_to = NULL`, `_is_current = true`)
- Aplicar mudanças em ordem cronológica de `occurred_at` (resolver out-of-order com janela 7 dias)
- Para `categories`, sem CDC ativa hoje: tabela é apenas snapshot

## Incremental strategy
- `MERGE` por `entity_id` com `WHEN MATCHED AND _is_current` para fechar linha atual
- particionamento por `_is_current` (boolean) ou por mês de `_valid_from`

## Late data or CDC behavior
- aceitar eventos com `occurred_at` até 7 dias atrás
- eventos fora dessa janela: log + quarentena (`bronze.dim_changes_quarantine`)
- reordenação por `occurred_at` antes do MERGE

## Schema contract (bronze.dim_customers)
- `customer_id`: string, not null
- `email`: string
- `country`: string
- `signup_date`: date
- `segment`: string
- `_valid_from`: timestamp, not null
- `_valid_to`: timestamp (nullable; null para versão atual)
- `_is_current`: boolean, not null
- `_source_event_id`: string (event_id que originou a versão; null para seed)

## Schema contract (bronze.dim_products)
- `product_id`: string, not null
- `category_id`: string
- `name`: string
- `unit_price`: decimal(18,2)
- `currency`: string
- `active`: boolean
- `_valid_from`, `_valid_to`, `_is_current`, `_source_event_id` (idem)

## Schema contract (bronze.dim_categories)
- `category_id`: string, not null
- `name`: string
- `parent_category_id`: string
- `_valid_from`, `_valid_to`, `_is_current`, `_source_event_id` (idem)

## Data quality rules
- exatamente 1 linha com `_is_current = true` por `entity_id`
- `_valid_to >= _valid_from` quando `_valid_to is not null`
- não pode haver gap temporal entre versões consecutivas do mesmo `entity_id`
- `entity_id` não nulo em todas as 3 tabelas
- contagem de `entity_id` distintos com `_is_current = true` deve bater com seed inicial + novos cadastros (alertar se divergir)

## Observability
- métricas por execução: linhas SCD2 fechadas, abertas, rejeitadas
- alerta para múltiplas linhas `_is_current = true` para mesmo `entity_id` (quebra de invariante)
- alerta para queda > 30% no número de `_is_current = true` (possível corrupção)

## Performance and cost constraints
- evitar shuffle global — particionar staging por `entity_id` antes do MERGE
- Z-ORDER em `entity_id` para acelerar lookups históricos

## Environment impact
- dev
- staging
- prod

## Backfill plan
- recriar a partir do snapshot inicial + replay completo de `raw.commerce_dim_changes` em ordem cronológica de `occurred_at`
- janela: desde o início do CDC

## Rollback plan
- restaurar versão anterior do bundle
- restaurar snapshot da dimensão a partir de Delta Time Travel (`VERSION AS OF`)
- reaplicar CDC após correção

## Acceptance criteria
- tabelas publicadas em `bronze.dim_customers`, `bronze.dim_products`, `bronze.dim_categories`
- invariante "exatamente 1 `_is_current = true` por `entity_id`" verde para 100% das chaves
- contagem de `entity_id` ativos bate com seed (default: 500 customers, 80 products, 10 categories)
- replay determinístico: mesmo input produz mesmas versões
```

- [ ] **Step 2: Commit**

```bash
git add artefatos/specs/spec-exemplo-bronze-dimensions.md
git commit -m "docs(spec): adiciona spec bronze-dimensions com SCD2 para 3 dimensoes"
git push
```

---

### Task 14: `spec-exemplo-silver-orders.md` (reescrita)

**Files:**
- Modify: `artefatos/specs/spec-exemplo-silver-orders.md`

- [ ] **Step 1: Sobrescrever conteúdo**

```markdown
# Spec Example: analytics.silver.orders

## Objective
Consolidar eventos de pedidos em uma tabela silver com 1 linha por `order_id`, refletindo o último estado válido do pedido enriquecido com dados de cliente e total de itens. Fonte para analytics e consumo operacional.

## Databricks object type
Lakeflow Spark Declarative Pipeline ou job PySpark versionado em bundle.

## Layer
Silver

## Sources
- `bronze.commerce_events` (filtrado por `_entity = orders` e `_entity = order_items`)
- `bronze.dim_customers` (lookup por `_is_current = true`)

## Targets
- `analytics.silver.orders`

## Grain and keys
- 1 linha por `order_id`
- chave primária lógica: `order_id`

## Transformation rules
- Para cada `order_id`, computar último estado válido a partir da sequência de eventos:
  - status final em ordem de prioridade: `delivered` > `shipped` > `paid` > `cancelled` > `refunded` > `created`
  - `paid_at`: `received_at` do primeiro evento `order.paid` por `order_id`
  - `created_at`: `received_at` do evento `order.created`
- Agregar itens da bronze: `total_items_qty`, `total_items_amount` por `order_id`
- Enriquecer com `customer_country`, `customer_segment`, `customer_email_hash` (não expor email cru) via join com `bronze.dim_customers` onde `_is_current = true`
- Filtrar pedidos com `status` final ∈ {`paid`, `shipped`, `delivered`, `refunded`} (excluir `created` puro e `cancelled`)

## Incremental strategy
- `MERGE` por `order_id`
- janela móvel de 7 dias para reprocessamento (absorver atualizações de bronze por late data)

## Late data or CDC behavior
- aceitar eventos atrasados até 7 dias
- evento mais recente para mesmo `order_id` atualiza registro silver

## Schema contract
- `order_id`: string, not null
- `customer_id`: string, not null
- `customer_country`: string
- `customer_segment`: string
- `customer_email_hash`: string (SHA-256 do email)
- `currency`: string, not null
- `total_amount`: decimal(18,2), not null
- `total_items_qty`: int, not null
- `total_items_amount`: decimal(18,2), not null
- `status`: string, not null (`paid` | `shipped` | `delivered` | `refunded`)
- `created_at`: timestamp, not null
- `paid_at`: timestamp (nullable se `status = refunded` parcial)
- `last_event_at`: timestamp, not null
- `_updated_at`: timestamp, not null

## Data quality rules
- unicidade de `order_id`
- `created_at` não nulo
- `total_amount >= 0`
- `total_items_amount >= 0` e dentro de 1% de `total_amount` (alerta divergência > 1%)
- `status` ∈ valores permitidos
- reconciliação diária: contagem de `order_id` com `status = paid` na silver = contagem na bronze (tolerância 0,5%)

## Observability
- métricas: linhas lidas, inseridas, atualizadas, divergência total_amount × total_items_amount
- alerta para divergência de reconciliação > 0,5%
- alerta para queda de volume diário > 20%

## Performance and cost constraints
- evitar shuffle desnecessário — particionar bronze por `order_id` antes do agregado
- Z-ORDER em `order_id`
- particionar silver por `created_at::date` (mês ou dia conforme volume)

## Environment impact
- dev
- staging
- prod

## Backfill plan
- executar backfill de 90 dias antes do go-live
- reexecução incremental por janela de 7 dias deve ser idempotente

## Rollback plan
- restaurar versão anterior do bundle
- reverter silver a versão anterior via Delta Time Travel
- reprocessar a partir da bronze após correção

## Acceptance criteria
- tabela publicada em `analytics.silver.orders`
- checks de qualidade verdes
- divergência diária < 0,5% na reconciliação com bronze
- ausência de PII cru (email aparece apenas como hash)
```

- [ ] **Step 2: Commit**

```bash
git add artefatos/specs/spec-exemplo-silver-orders.md
git commit -m "docs(spec): reescreve silver-orders com enriquecimento de dimensao e itens"
git push
```

---

### Task 15: `spec-exemplo-gold-orders.md` (reescrita)

**Files:**
- Modify: `artefatos/specs/spec-exemplo-gold-orders.md`

- [ ] **Step 1: Sobrescrever conteúdo**

```markdown
# Spec Example: analytics.gold.orders_summary

## Objective
Prover agregações confiáveis de pedidos pagos por cliente, moeda e data, para consumo por dashboards executivos, relatórios e APIs de produto.

## Databricks object type
Lakeflow Spark Declarative Pipeline ou job PySpark versionado em bundle.

## Layer
Gold

## Sources
- `analytics.silver.orders`

## Targets
- `analytics.gold.orders_summary`

## Grain and keys
- 1 linha por (`customer_id`, `currency`, `summary_date`)
- chave primária lógica: (`customer_id`, `currency`, `summary_date`)
- `summary_date` = `paid_at::date` (ou `created_at::date` para pedidos sem `paid_at`)

## Transformation rules
- Filtrar `silver.orders` por `status ∈ {paid, shipped, delivered}` (excluir `refunded` puro)
- Agrupar por (`customer_id`, `currency`, `summary_date`) e calcular:
  - `total_orders` = `count(distinct order_id)`
  - `total_revenue` = `sum(total_amount)`
  - `avg_order_value` = `total_revenue / total_orders`
  - `customer_segment` = último valor observado de `customer_segment` por (`customer_id`, `summary_date`)
- Não expor PII além de `customer_id`

## Incremental strategy
- `MERGE` por (`customer_id`, `currency`, `summary_date`)
- janela móvel de 7 dias para absorver atualizações da silver

## Late data or CDC behavior
- herda comportamento da silver; janela de 7 dias cobre eventos atrasados propagados
- reprocessamento de janela é idempotente (resultados sobrescritos)

## Schema contract
- `customer_id`: string, not null
- `currency`: string, not null
- `summary_date`: date, not null
- `customer_segment`: string
- `total_orders`: bigint, not null
- `total_revenue`: decimal(18,2), not null
- `avg_order_value`: decimal(18,2), not null
- `_updated_at`: timestamp, not null

## Data quality rules
- unicidade de (`customer_id`, `currency`, `summary_date`)
- `total_orders >= 1`
- `total_revenue >= 0`
- `avg_order_value >= 0` e `= total_revenue / total_orders` (tolerância 0,01)
- reconciliação diária: `SUM(total_orders)` na gold = `count(distinct order_id)` na silver para o dia (tolerância 0%)

## Observability
- métricas por execução: linhas inseridas, atualizadas, divergência de reconciliação
- alerta para divergência > 0%
- alerta para ausência de atualização > 25 horas

## Performance and cost constraints
- evitar shuffle global — agregar sobre partições da silver
- particionar gold por `summary_date`
- Z-ORDER em `customer_id`
- materializar como Delta table

## Environment impact
- dev
- staging
- prod

## Backfill plan
- executar backfill de 30 dias após go-live da silver
- validar reconciliação antes de liberar para consumo

## Rollback plan
- restaurar versão anterior do bundle
- reprocessar gold a partir da silver após correção
- partições gold podem ser sobrescritas (idempotente)

## Acceptance criteria
- tabela publicada em `analytics.gold.orders_summary`
- reconciliação com silver com divergência zero
- dashboards consumindo sem erros de schema
- ausência de PII (apenas `customer_id`)
```

- [ ] **Step 2: Commit**

```bash
git add artefatos/specs/spec-exemplo-gold-orders.md
git commit -m "docs(spec): reescreve gold-orders alinhado ao novo modelo silver"
git push
```

---

### Task 16: Atualizar `README.md`

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Atualizar tabela de specs**

Localizar a seção "## Specs de Exemplo" no `README.md` (linhas ~95-105) e substituir a tabela por:

```markdown
| Spec | Camada | Descrição |
| :--- | :--- | :--- |
| [spec-template](./artefatos/specs/spec-template.md) | — | Template em branco para novas specs |
| [spec-exemplo-raw-commerce-events](./artefatos/specs/spec-exemplo-raw-commerce-events.md) | Raw | Ingestão append-only de eventos transacionais (orders/items/payments) |
| [spec-exemplo-raw-dim-changes](./artefatos/specs/spec-exemplo-raw-dim-changes.md) | Raw | Ingestão de CDC de dimensões + snapshots seed |
| [spec-exemplo-bronze-commerce-events](./artefatos/specs/spec-exemplo-bronze-commerce-events.md) | Bronze | Parsing tipado, dedup por event_id e quarentena |
| [spec-exemplo-bronze-dimensions](./artefatos/specs/spec-exemplo-bronze-dimensions.md) | Bronze | SCD2 de customers/products/categories |
| [spec-exemplo-silver-orders](./artefatos/specs/spec-exemplo-silver-orders.md) | Silver | Pedidos consolidados por order_id, enriched com dimensão |
| [spec-exemplo-gold-orders](./artefatos/specs/spec-exemplo-gold-orders.md) | Gold | Agregações por cliente × moeda × data |
```

- [ ] **Step 2: Adicionar seção "Como gerar dados de exemplo"**

Inserir nova seção após "## Specs de Exemplo" e antes de "## Estrutura do Projeto":

```markdown
---

## Como gerar dados de exemplo

O pacote `faker-lakehouse` em [generator/](./generator/) produz dados realistas das 6 entidades do modelo. Saída em JSONL particionado, pronta para Auto Loader.

```bash
cd generator
python -m venv .venv
.venv\Scripts\activate
pip install -e ".[dev]"

# popula dimensões em data/seed/
faker-lakehouse seed --seed 42

# gera 7 dias de eventos em data/landing/
faker-lakehouse run --start 2026-04-01 --days 7 --seed 42
```

Falhas realistas (late data, duplicatas, payloads corrompidos) são injetadas por padrão para justificar regras de DQ e quarentena dos specs bronze. Ver [generator/README.md](./generator/README.md) para todas as opções.

Pequena amostra versionada disponível em [data/_sample/](./data/_sample/) para demos rápidas sem rodar o gerador.

---
```

- [ ] **Step 3: Atualizar `## Estrutura do Projeto`**

Atualizar o bloco `text` para incluir os diretórios novos:

```text
.
├── README.md                                        # Este arquivo
├── SUMMARY.md                                       # Sumário completo com links
├── docs/                                            # Documentação da apresentação
│   ├── narrative_plan.md
│   ├── roteiro_apresentacao.md
│   ├── spec-apresentacao-sdd-databricks.md
│   ├── storyboard-apresentacao-sdd-databricks.md
│   └── superpowers/                                 # Designs e planos de implementação
│       ├── specs/
│       └── plans/
├── artefatos/                                       # Prontos para uso no piloto
│   ├── agentes/                                     # Agentes Claude especializados
│   ├── specs/                                       # Templates e exemplos de spec
│   │   ├── spec-template.md
│   │   ├── spec-exemplo-raw-commerce-events.md
│   │   ├── spec-exemplo-raw-dim-changes.md
│   │   ├── spec-exemplo-bronze-commerce-events.md
│   │   ├── spec-exemplo-bronze-dimensions.md
│   │   ├── spec-exemplo-silver-orders.md
│   │   └── spec-exemplo-gold-orders.md
│   ├── memory/, exemplos/, guias/
│   ├── checklist-pr.md
│   └── metricas-piloto.md
├── generator/                                       # Gerador faker-lakehouse
│   ├── pyproject.toml
│   ├── faker_lakehouse/
│   └── tests/
├── data/                                            # Saída do gerador
│   ├── seed/                                        # Dimensões iniciais
│   ├── landing/                                     # Stream de eventos (gitignored)
│   └── _sample/                                     # Amostra versionada
├── references/
├── build/
└── out/
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs(readme): atualiza tabela de specs e adiciona secao de geracao de dados"
git push
```

---

## Self-Review

**Spec coverage check:**

| Item do design | Task |
|---|---|
| Modelagem conceitual (6 entidades) | Tasks 4 (dimensões) + 5 (eventos) — atributos viram código + specs 12-15 documentam |
| Gerador `faker-lakehouse` (config, dimensions, events, faults, cdc, writer, cli) | Tasks 2-8 |
| `data/seed/` e `data/landing/` | Task 9 |
| Idempotência por seed | Task 8 (test_run_is_deterministic) |
| Injeção de falhas (late, dup, corrupt) | Task 6 |
| spec-exemplo-raw-commerce-events.md | Task 10 |
| spec-exemplo-raw-dim-changes.md | Task 11 |
| spec-exemplo-bronze-commerce-events.md | Task 12 |
| spec-exemplo-bronze-dimensions.md | Task 13 (adicionado vs design seção 5; necessário para coerência da silver que usa SCD2) |
| spec-exemplo-silver-orders.md | Task 14 |
| spec-exemplo-gold-orders.md | Task 15 |
| Remover spec-exemplo-raw-orders.md, spec-exemplo-bronze-orders.md | Tasks 10, 12 |
| README.md atualizado | Task 16 |

**Decisão registrada:** o design seção 5 não listava bronze.dim_* como entregável; este plano adiciona `spec-exemplo-bronze-dimensions.md` (single multi-target spec) porque a silver depende explicitamente de `bronze.dim_customers _is_current = true`. Sem essa spec, a coerência arquitetural quebra.

**Placeholder scan:** nenhum "TBD" / "TODO" / "implementar depois" no plano. ✓

**Type consistency:**
- `GeneratorConfig` campos consistentes entre Tasks 2, 4, 5, 6, 7, 8 ✓
- `event_id`, `event_type`, `occurred_at`, `received_at`, `source`, `payload` consistentes em todos os envelopes (Tasks 5, 7) ✓
- `_entity ∈ {orders, order_items, payments}` consistente entre Task 10 (raw spec) e Task 12 (bronze spec) ✓
- `bronze.commerce_events` (não `bronze.orders_events`) consistente em Tasks 12, 14 ✓
