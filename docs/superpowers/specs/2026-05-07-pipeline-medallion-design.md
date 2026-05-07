# Design — Pipeline Medallion End-to-End com Lakeflow Declarative Pipelines

**Data:** 2026-05-07
**Autor:** Bruno Dias (com brainstorming via Claude)
**Status:** Aprovado para implementação

---

## 1. Contexto e Objetivo

O projeto já possui:
- `generator/` — pacote `faker-lakehouse` que gera dados de e-commerce em JSONL (`data/landing/`, `data/seed/`)
- `artefatos/specs/` — specs das 4 camadas (raw, bronze, silver, gold)
- `pipeline/` — estrutura de pastas criada, ainda vazia

Este design entrega os **4 pipelines Lakeflow Declarative** (um por camada) e o **Databricks Asset Bundle** (`databricks.yml`) que os orquestra como um Job sequencial. O generator é a fonte raw — não existe uma raw Delta table intermediária entre o generator e o pipeline raw; o pipeline raw lê diretamente dos arquivos JSONL via Auto Loader.

**Não-objetivos:**
- Testes unitários dos pipelines (sem framework local simples para DLT)
- Validação no Databricks Free Edition (próxima sessão após implementação local)
- Pipelines das dimensões SCD2 (bronze.dim_*) — escopo futuro

---

## 2. Arquitetura

### 2.1 Estrutura de pastas

```
generator/                          ← faker-lakehouse (fonte de dados raw)
├── faker_lakehouse/
├── pyproject.toml
└── requirements.txt

pipeline/
├── raw/
│   └── pipeline.py                 ← Lakeflow: data/landing/ → raw.commerce_events
├── bronze/
│   └── pipeline.py                 ← Lakeflow: raw → bronze.commerce_events + quarantine
├── silver/
│   └── pipeline.py                 ← Lakeflow: bronze → silver.orders
└── gold/
    └── pipeline.py                 ← Lakeflow: silver → gold.orders_summary

databricks.yml                      ← Asset Bundle: orquestra 5 tasks em sequência
lakehouse.yaml                      ← config do generator
data/
├── seed/
└── landing/
```

### 2.2 Fluxo de dados

```
faker-lakehouse run
       ↓
data/landing/{orders,order_items,payments}/_partition_date=*/
       ↓ Auto Loader (cloudFiles)
raw.commerce_events          (Delta, streaming)
       ↓ dlt.read_stream
bronze.commerce_events       (Delta, MERGE por event_id)
bronze.commerce_events_quarantine
       ↓ dlt.read
silver.orders                (Delta, MERGE por order_id)
       ↓ dlt.read
gold.orders_summary          (Delta, MERGE por customer_id×currency×date)
```

### 2.3 Orquestração (Databricks Job)

```
Task 1: generate   → Python wheel task: faker-lakehouse run
Task 2: raw        → Lakeflow Pipeline task  (depends_on: generate)
Task 3: bronze     → Lakeflow Pipeline task  (depends_on: raw)
Task 4: silver     → Lakeflow Pipeline task  (depends_on: bronze)
Task 5: gold       → Lakeflow Pipeline task  (depends_on: silver)
```

---

## 3. Cada `pipeline.py` — Padrões e Conteúdo

### 3.1 `pipeline/raw/pipeline.py`

Lê JSONL de `data/landing/` via Auto Loader (`cloudFiles`) e publica `raw.commerce_events`.

```python
import dlt
from pyspark.sql import functions as F

@dlt.table(
    name="commerce_events",
    comment="Eventos brutos da landing zone — append-only, sem transformação",
    partition_cols=["_partition_date", "_entity"],
)
@dlt.expect("event_id not null", "event_id IS NOT NULL")
@dlt.expect("received_at not null", "received_at IS NOT NULL")
@dlt.expect_or_drop("entity valid", "_entity IN ('orders', 'order_items', 'payments')")
def raw_commerce_events():
    return (
        spark.readStream.format("cloudFiles")
            .option("cloudFiles.format", "json")
            .option("cloudFiles.schemaLocation", spark.conf.get(
                "pipeline.schema_location", "/tmp/schema/raw"
            ))
            .load(spark.conf.get("pipeline.landing_path", "data/landing/*/*/*.jsonl"))
            .withColumn("_entity",
                F.regexp_extract(F.input_file_name(), r"landing/(\w+)/", 1))
            .withColumn("_ingested_at", F.current_timestamp())
            .withColumn("_partition_date", F.to_date("received_at"))
            .withColumn("_source_file", F.input_file_name())
    )
```

**Schema contract:** `event_id`, `event_type`, `occurred_at`, `received_at`, `source`, `payload` (string JSON), `_entity`, `_ingested_at`, `_source_file`, `_partition_date`.

### 3.2 `pipeline/bronze/pipeline.py`

Lê de `raw.commerce_events`, parseia `payload` por `_entity`, deduplica por `event_id`, envia rejeições para quarentena.

```python
import dlt
import json
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, ...

VALID_EVENT_TYPES = {
    "order.created", "order.paid", "order.shipped", "order.delivered",
    "order.cancelled", "order.refunded", "order_item.created", "payment.captured"
}

def _parse_payload(df):
    """Extrai colunas tipadas do payload JSON por _entity."""
    return (
        df.withColumn("payload_parsed", F.from_json("payload", PAYLOAD_SCHEMA))
          .withColumn("order_id",
              F.when(F.col("_entity").isin("orders","order_items","payments"),
                     F.col("payload_parsed.order_id")))
          # ... demais colunas por entidade
          .withColumn("_raw_payload", F.col("payload"))
          .withColumn("event_date", F.to_date("received_at"))
          .drop("payload_parsed")
    )

@dlt.view(name="raw_events_parsed")
def parsed():
    return _parse_payload(
        dlt.read_stream("raw.commerce_events")
    )

@dlt.table(
    name="commerce_events",
    comment="Eventos de comércio estruturados e deduplicados",
    partition_cols=["event_date", "_entity"],
)
@dlt.expect_or_drop("event_id not null", "event_id IS NOT NULL")
@dlt.expect_or_drop("received_at not null", "received_at IS NOT NULL")
@dlt.expect("event_type valid",
    "event_type IN ('order.created','order.paid','order.shipped',"
    "'order.delivered','order.cancelled','order.refunded',"
    "'order_item.created','payment.captured')")
def bronze_commerce_events():
    return dlt.read_stream("raw_events_parsed")
```

**Padrão de quarentena no Lakeflow:** uma `@dlt.view` lê a raw uma única vez; dois `@dlt.table` filtram sobre ela — um aceita registros válidos (`bronze.commerce_events`), o outro captura os inválidos (`bronze.commerce_events_quarantine`). Não existe sufixo automático.

```python
@dlt.view(name="events_raw")
def events_raw():
    return dlt.read_stream("raw.commerce_events")

@dlt.table(name="commerce_events")
def valid():
    return dlt.read_stream("events_raw").filter("event_id IS NOT NULL AND ...")

@dlt.table(name="commerce_events_quarantine")
def quarantine():
    return dlt.read_stream("events_raw").filter("event_id IS NULL OR ...")
```

MERGE/dedup é gerenciado pelo Lakeflow via `dlt.apply_changes()` com `keys=["event_id"]` e `sequence_by="received_at"`.

### 3.3 `pipeline/silver/pipeline.py`

Consolida estado final por `order_id`, enriquece com dimensão customer.

```python
import dlt
from pyspark.sql import functions as F
from pyspark.sql.window import Window

@dlt.table(
    name="orders",
    comment="Pedidos consolidados — 1 linha por order_id, último estado válido",
)
def silver_orders():
    orders = dlt.read("bronze.commerce_events").filter(F.col("_entity") == "orders")
    items  = dlt.read("bronze.commerce_events").filter(F.col("_entity") == "order_items")

    w = Window.partitionBy("order_id").orderBy(F.desc("received_at"))

    final_status = (
        orders
        .withColumn("rn", F.row_number().over(w))
        .filter(F.col("rn") == 1)
        .filter(F.col("status").isin("paid","shipped","delivered","refunded"))
        .drop("rn")
    )
    items_agg = (
        items.groupBy("order_id")
            .agg(
                F.sum("quantity").alias("total_items_qty"),
                F.sum("line_total").alias("total_items_amount"),
            )
    )
    return final_status.join(items_agg, "order_id", "left")
```

### 3.4 `pipeline/gold/pipeline.py`

Agrega por `customer_id × currency × summary_date`.

```python
import dlt
from pyspark.sql import functions as F

@dlt.table(
    name="orders_summary",
    comment="Resumo de pedidos pagos por cliente, moeda e data",
    partition_cols=["summary_date"],
)
def gold_orders_summary():
    return (
        dlt.read("silver.orders")
            .filter(F.col("status").isin("paid","shipped","delivered"))
            .withColumn("summary_date", F.to_date("paid_at"))
            .groupBy("customer_id", "currency", "summary_date", "customer_segment")
            .agg(
                F.countDistinct("order_id").alias("total_orders"),
                F.sum("total_amount").alias("total_revenue"),
                (F.sum("total_amount") / F.countDistinct("order_id"))
                    .alias("avg_order_value"),
                F.current_timestamp().alias("_updated_at"),
            )
    )
```

---

## 4. `databricks.yml` — Asset Bundle

```yaml
bundle:
  name: medallion-lakehouse

variables:
  catalog:
    default: main
  schema:
    default: lakehouse
  landing_path:
    default: data/landing
  schema_location:
    default: /tmp/schema/raw

targets:
  dev:
    mode: development
    default: true
    variables:
      catalog: main
      schema: lakehouse_dev

resources:
  pipelines:
    raw:
      name: "[${bundle.target}] raw-commerce-events"
      catalog: ${var.catalog}
      schema: ${var.schema}
      configuration:
        pipeline.landing_path: ${var.landing_path}
        pipeline.schema_location: ${var.schema_location}
      libraries:
        - notebook:
            path: ./pipeline/raw/pipeline.py

    bronze:
      name: "[${bundle.target}] bronze-commerce-events"
      catalog: ${var.catalog}
      schema: ${var.schema}
      libraries:
        - notebook:
            path: ./pipeline/bronze/pipeline.py

    silver:
      name: "[${bundle.target}] silver-orders"
      catalog: ${var.catalog}
      schema: ${var.schema}
      libraries:
        - notebook:
            path: ./pipeline/silver/pipeline.py

    gold:
      name: "[${bundle.target}] gold-orders-summary"
      catalog: ${var.catalog}
      schema: ${var.schema}
      libraries:
        - notebook:
            path: ./pipeline/gold/pipeline.py

  jobs:
    medallion-job:
      name: "[${bundle.target}] medallion-lakehouse-job"
      tasks:
        - task_key: generate
          python_wheel_task:
            package_name: faker-lakehouse
            entry_point: main
            parameters: ["run"]

        - task_key: raw
          depends_on: [{task_key: generate}]
          pipeline_task:
            pipeline_id: ${resources.pipelines.raw.id}

        - task_key: bronze
          depends_on: [{task_key: raw}]
          pipeline_task:
            pipeline_id: ${resources.pipelines.bronze.id}

        - task_key: silver
          depends_on: [{task_key: bronze}]
          pipeline_task:
            pipeline_id: ${resources.pipelines.silver.id}

        - task_key: gold
          depends_on: [{task_key: silver}]
          pipeline_task:
            pipeline_id: ${resources.pipelines.gold.id}
```

---

## 5. Entregáveis

| Artefato | Ação |
|---|---|
| `generator/` | Mover de volta de `pipeline/raw/generator/` para raiz |
| `.gitignore` | Atualizar paths do generator |
| `README.md` | Atualizar paths |
| `pipeline/raw/pipeline.py` | Criar |
| `pipeline/bronze/pipeline.py` | Criar |
| `pipeline/silver/pipeline.py` | Criar |
| `pipeline/gold/pipeline.py` | Criar |
| `databricks.yml` | Criar na raiz |

---

## 6. Ordem de Implementação

1. **Move do generator** — de volta para `generator/` + ajustes de referência
2. **`pipeline/raw/pipeline.py`** — Auto Loader + raw.commerce_events
3. **`pipeline/bronze/pipeline.py`** — parse + dedup + quarantena
4. **`pipeline/silver/pipeline.py`** — consolidação por order_id
5. **`pipeline/gold/pipeline.py`** — agregações
6. **`databricks.yml`** — Asset Bundle completo
7. **README** — atualizar instruções

---

## 7. Critérios de Aceite

- Cada `pipeline.py` é Python válido que importa `dlt` e usa apenas decorators/funções oficiais do Lakeflow
- `databricks.yml` valida com `databricks bundle validate` sem erros
- Fluxo generator → raw → bronze → silver → gold está mapeado como tasks dependentes no Job
- README explica como rodar localmente e como fazer deploy no Free Edition
