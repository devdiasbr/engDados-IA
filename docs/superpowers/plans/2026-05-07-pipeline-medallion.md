# Pipeline Medallion — Lakeflow Declarative Pipelines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar os 4 pipelines Lakeflow Declarative (raw, bronze, silver, gold) e o Databricks Asset Bundle (`databricks.yml`) que os orquestra como um Job sequencial partindo do generator.

**Architecture:** Cada camada tem um `pipeline.py` independente usando a `dlt` API. O generator (em `generator/`) é a fonte raw — produz JSONL em `data/landing/`. O pipeline raw lê via Auto Loader, bronze lê da tabela raw via Delta streaming, silver e gold fazem batch reads das camadas anteriores. Um `databricks.yml` na raiz orquestra tudo como Databricks Job com 5 tasks dependentes.

**Tech Stack:** Python 3.12, `dlt` (Databricks Lakeflow Declarative Pipelines), PySpark, Databricks Asset Bundles (DAB), Unity Catalog.

**Nota sobre testes:** Pipelines DLT não têm framework de test local — validação é via `python -c "import ast; ..."` para sintaxe e `databricks bundle validate` para o bundle. Execução real ocorre no Databricks Free Edition.

---

## File Structure

```
generator/                                ← mover de pipeline/raw/generator/ para cá
├── faker_lakehouse/
├── pyproject.toml
└── requirements.txt

pipeline/
├── raw/
│   └── pipeline.py                       ← CRIAR
├── bronze/
│   └── pipeline.py                       ← CRIAR
├── silver/
│   └── pipeline.py                       ← CRIAR
└── gold/
    └── pipeline.py                       ← CRIAR

databricks.yml                            ← CRIAR (raiz do projeto)
.gitignore                                ← atualizar paths do generator
README.md                                 ← atualizar instruções
lakehouse.yaml                            ← atualizar comentário de path
```

---

## Task 1: Mover generator de volta para a raiz

**Files:**
- Move: `pipeline/raw/generator/` → `generator/`
- Modify: `.gitignore`
- Modify: `lakehouse.yaml`
- Modify: `README.md`

- [ ] **Step 1: Mover o diretório via PowerShell**

```powershell
Move-Item -Path "pipeline\raw\generator" -Destination "generator" -Force
```

Verificar:
```powershell
ls generator
```
Expected: `README.md  faker_lakehouse  pyproject.toml  requirements.txt  tests`

- [ ] **Step 2: Verificar que pipeline/raw/ está vazio**

```powershell
ls pipeline\raw
```
Expected: vazio (só `.gitkeep` se existir).

- [ ] **Step 3: Atualizar `.gitignore`**

Substituir as linhas do generator:
```
# generator
pipeline/raw/generator/.venv/
pipeline/raw/generator/.pytest_cache/
pipeline/raw/generator/**/__pycache__/
pipeline/raw/generator/*.egg-info/
pipeline/raw/generator/.coverage
```

Por:
```
# generator
generator/.venv/
generator/.pytest_cache/
generator/**/__pycache__/
generator/*.egg-info/
generator/.coverage
```

- [ ] **Step 4: Atualizar comentário em `lakehouse.yaml`**

Linha 4, substituir:
```yaml
#   cd pipeline\raw\generator && faker-lakehouse seed && faker-lakehouse run
```
Por:
```yaml
#   cd generator && faker-lakehouse seed && faker-lakehouse run
```

- [ ] **Step 5: Atualizar `README.md`**

Na seção "Como gerar dados de exemplo", substituir todas as referências a `pipeline\raw\generator` por `generator`:
- `cd pipeline\raw\generator` → `cd generator`
- `[pipeline/raw/generator/](./pipeline/raw/generator/)` → `[generator/](./generator/)`
- `[pipeline/raw/generator/README.md](./pipeline/raw/generator/README.md)` → `[generator/README.md](./generator/README.md)`

- [ ] **Step 6: Atualizar `generator/README.md`**

O arquivo já existe em `generator/README.md` com o conteúdo correto — sem mudanças necessárias.

- [ ] **Step 7: Registrar no git**

```bash
git rm -r --cached pipeline/raw/generator
git add generator/ .gitignore lakehouse.yaml README.md
git status --short
```

Expected: arquivos do generator aparecem como `R pipeline/raw/generator/... -> generator/...`.

- [ ] **Step 8: Commit**

```bash
git commit -m "refactor: move generator de volta para a raiz do projeto"
git push
```

---

## Task 2: `pipeline/raw/pipeline.py` — Auto Loader → raw.commerce_events

**Files:**
- Create: `pipeline/raw/pipeline.py`

- [ ] **Step 1: Criar `pipeline/raw/pipeline.py`** com o conteúdo completo:

```python
"""
pipeline/raw/pipeline.py
Lakeflow Declarative Pipeline — camada Raw

Lê eventos JSONL da landing zone via Auto Loader e publica
raw.commerce_events como streaming table append-only.

Configuração via pipeline config (databricks.yml):
  pipeline.landing_path    — caminho dos arquivos JSONL (default: data/landing)
  pipeline.schema_location — onde o Auto Loader persiste o schema inferido
"""
import dlt
from pyspark.sql import functions as F


@dlt.table(
    name="commerce_events",
    comment="Eventos brutos da landing zone — append-only, sem transformação",
    partition_cols=["_partition_date", "_entity"],
)
@dlt.expect("event_id not null", "event_id IS NOT NULL")
@dlt.expect("received_at not null", "received_at IS NOT NULL")
def raw_commerce_events():
    landing_path = spark.conf.get("pipeline.landing_path", "data/landing")
    schema_location = spark.conf.get(
        "pipeline.schema_location", "/tmp/schema/raw_commerce"
    )

    return (
        spark.readStream.format("cloudFiles")
            .option("cloudFiles.format", "json")
            .option("cloudFiles.schemaLocation", schema_location)
            .option("cloudFiles.inferColumnTypes", "true")
            .load(f"{landing_path}/*/*/*.jsonl")
            .withColumn(
                "_entity",
                F.regexp_extract(F.input_file_name(), r"/landing/(\w+)/", 1),
            )
            .withColumn("_ingested_at", F.current_timestamp())
            .withColumn("_partition_date", F.to_date("received_at"))
            .withColumn("_source_file", F.input_file_name())
    )
```

- [ ] **Step 2: Verificar sintaxe**

```bash
python -c "import ast; ast.parse(open('pipeline/raw/pipeline.py').read()); print('Syntax OK')"
```
Expected: `Syntax OK`

- [ ] **Step 3: Commit**

```bash
git add pipeline/raw/pipeline.py
git commit -m "feat(pipeline): adiciona raw pipeline com Auto Loader para commerce_events"
git push
```

---

## Task 3: `pipeline/bronze/pipeline.py` — Parse + Dedup + Quarantine

**Files:**
- Create: `pipeline/bronze/pipeline.py`

- [ ] **Step 1: Criar `pipeline/bronze/pipeline.py`** com o conteúdo completo:

```python
"""
pipeline/bronze/pipeline.py
Lakeflow Declarative Pipeline — camada Bronze

Lê raw.commerce_events, parseia payload JSON por _entity,
deduplica por event_id via APPLY CHANGES, envia rejeições para quarentena.

Configuração via pipeline config (databricks.yml):
  pipeline.catalog     — Unity Catalog catalog (default: main)
  pipeline.raw_schema  — schema da camada raw (default: raw)
"""
import dlt
from pyspark.sql import functions as F
from pyspark.sql.types import (
    DecimalType,
    IntegerType,
    StringType,
    StructField,
    StructType,
)

# Schema do payload JSON — colunas possíveis para todas as entidades
PAYLOAD_SCHEMA = StructType([
    StructField("order_id", StringType()),
    StructField("order_item_id", StringType()),
    StructField("customer_id", StringType()),
    StructField("product_id", StringType()),
    StructField("payment_id", StringType()),
    StructField("currency", StringType()),
    StructField("total_amount", DecimalType(18, 2)),
    StructField("quantity", IntegerType()),
    StructField("unit_price", DecimalType(18, 2)),
    StructField("line_total", DecimalType(18, 2)),
    StructField("amount", DecimalType(18, 2)),
    StructField("method", StringType()),
    StructField("status", StringType()),
])

# Condição SQL que define um registro válido
VALID_CONDITION = (
    "event_id IS NOT NULL"
    " AND received_at IS NOT NULL"
    " AND _entity IN ('orders', 'order_items', 'payments')"
    " AND event_type IN ("
    "  'order.created', 'order.paid', 'order.shipped', 'order.delivered',"
    "  'order.cancelled', 'order.refunded', 'order_item.created', 'payment.captured'"
    ")"
)


def _parse_payload(df):
    """Expande o campo payload (string JSON) em colunas tipadas."""
    p = F.from_json(F.col("payload"), PAYLOAD_SCHEMA)
    return (
        df
        .withColumn("_p", p)
        .withColumn("order_id",      F.col("_p.order_id"))
        .withColumn("order_item_id", F.col("_p.order_item_id"))
        .withColumn("customer_id",   F.col("_p.customer_id"))
        .withColumn("product_id",    F.col("_p.product_id"))
        .withColumn("payment_id",    F.col("_p.payment_id"))
        .withColumn("currency",      F.col("_p.currency"))
        .withColumn("total_amount",  F.col("_p.total_amount"))
        .withColumn("quantity",      F.col("_p.quantity"))
        .withColumn("unit_price",    F.col("_p.unit_price"))
        .withColumn("line_total",    F.col("_p.line_total"))
        .withColumn("amount",        F.col("_p.amount"))
        .withColumn("method",        F.col("_p.method"))
        .withColumn("status",        F.col("_p.status"))
        .withColumn("_raw_payload",  F.col("payload"))
        .withColumn("event_date",    F.to_date("received_at"))
        .drop("_p", "payload")
    )


@dlt.view(name="raw_events_parsed")
def raw_events_parsed():
    """Lê raw.commerce_events de fora desta pipeline e parseia o payload."""
    catalog = spark.conf.get("pipeline.catalog", "main")
    raw_schema = spark.conf.get("pipeline.raw_schema", "raw")
    raw = spark.readStream.format("delta").table(
        f"{catalog}.{raw_schema}.commerce_events"
    )
    return _parse_payload(raw)


@dlt.view(name="events_valid")
def events_valid():
    """Registros que passam todas as DQ rules."""
    return dlt.read_stream("raw_events_parsed").filter(VALID_CONDITION)


@dlt.table(
    name="commerce_events_quarantine",
    comment="Registros rejeitados por falha de DQ — preservados para auditoria",
)
def quarantine():
    """Registros que falham em qualquer DQ rule."""
    return dlt.read_stream("raw_events_parsed").filter(f"NOT ({VALID_CONDITION})")


# Target da deduplicação — criado via apply_changes (não usa @dlt.table)
dlt.create_streaming_table(
    name="commerce_events",
    comment="Eventos de comércio estruturados e deduplicados — 1 linha por event_id",
    partition_cols=["event_date", "_entity"],
)

# MERGE por event_id, mantendo o registro com maior received_at
dlt.apply_changes(
    target="commerce_events",
    source="events_valid",
    keys=["event_id"],
    sequence_by=F.col("received_at"),
    stored_as_scd_type=1,  # SCD Tipo 1 = sobrescreve versão anterior
)
```

- [ ] **Step 2: Verificar sintaxe**

```bash
python -c "import ast; ast.parse(open('pipeline/bronze/pipeline.py').read()); print('Syntax OK')"
```
Expected: `Syntax OK`

- [ ] **Step 3: Commit**

```bash
git add pipeline/bronze/pipeline.py
git commit -m "feat(pipeline): adiciona bronze pipeline com parse, dedup e quarantine"
git push
```

---

## Task 4: `pipeline/silver/pipeline.py` — Consolidação por order_id

**Files:**
- Create: `pipeline/silver/pipeline.py`

- [ ] **Step 1: Criar `pipeline/silver/pipeline.py`**:

```python
"""
pipeline/silver/pipeline.py
Lakeflow Declarative Pipeline — camada Silver

Lê bronze.commerce_events, consolida 1 linha por order_id com
último estado válido, agrega itens e deriva paid_at/last_event_at.

Configuração via pipeline config (databricks.yml):
  pipeline.catalog       — Unity Catalog catalog (default: main)
  pipeline.bronze_schema — schema da camada bronze (default: bronze)
"""
import dlt
from pyspark.sql import functions as F
from pyspark.sql.window import Window

# Status finais aceitos na silver (exclui 'created' puro e 'cancelled')
VALID_FINAL_STATUSES = ["paid", "shipped", "delivered", "refunded"]


@dlt.table(
    name="orders",
    comment="Pedidos consolidados — 1 linha por order_id, último estado válido",
)
def silver_orders():
    catalog = spark.conf.get("pipeline.catalog", "main")
    bronze_schema = spark.conf.get("pipeline.bronze_schema", "bronze")
    bronze = spark.read.table(f"{catalog}.{bronze_schema}.commerce_events")

    orders = bronze.filter(F.col("_entity") == "orders")
    items  = bronze.filter(F.col("_entity") == "order_items")

    # Janela para pegar o evento mais recente por order_id
    w_last = Window.partitionBy("order_id").orderBy(F.desc("received_at"))

    # Estado mais recente por order_id (filtra apenas status finais válidos)
    last_event = (
        orders
        .withColumn("rn", F.row_number().over(w_last))
        .filter(F.col("rn") == 1)
        .filter(F.col("status").isin(VALID_FINAL_STATUSES))
        .drop("rn")
        .withColumnRenamed("received_at", "last_event_at")
        .withColumnRenamed("occurred_at", "created_at")
    )

    # paid_at = occurred_at do primeiro evento order.paid
    w_paid = Window.partitionBy("order_id").orderBy("occurred_at")
    paid_at = (
        orders
        .filter(F.col("event_type") == "order.paid")
        .withColumn("rn", F.row_number().over(w_paid))
        .filter(F.col("rn") == 1)
        .select(
            F.col("order_id"),
            F.col("occurred_at").alias("paid_at"),
        )
    )

    # Agregação de itens por order_id
    items_agg = (
        items
        .groupBy("order_id")
        .agg(
            F.sum("quantity").alias("total_items_qty"),
            F.sum("line_total").alias("total_items_amount"),
        )
    )

    return (
        last_event
        .join(paid_at,   "order_id", "left")
        .join(items_agg, "order_id", "left")
        .withColumn("_updated_at", F.current_timestamp())
    )
```

- [ ] **Step 2: Verificar sintaxe**

```bash
python -c "import ast; ast.parse(open('pipeline/silver/pipeline.py').read()); print('Syntax OK')"
```
Expected: `Syntax OK`

- [ ] **Step 3: Commit**

```bash
git add pipeline/silver/pipeline.py
git commit -m "feat(pipeline): adiciona silver pipeline com consolidacao por order_id"
git push
```

---

## Task 5: `pipeline/gold/pipeline.py` — Agregações por customer × currency × date

**Files:**
- Create: `pipeline/gold/pipeline.py`

- [ ] **Step 1: Criar `pipeline/gold/pipeline.py`**:

```python
"""
pipeline/gold/pipeline.py
Lakeflow Declarative Pipeline — camada Gold

Lê silver.orders e agrega por (customer_id, currency, summary_date)
para consumo por dashboards e APIs.

Configuração via pipeline config (databricks.yml):
  pipeline.catalog        — Unity Catalog catalog (default: main)
  pipeline.silver_schema  — schema da camada silver (default: silver)
"""
import dlt
from pyspark.sql import functions as F


@dlt.table(
    name="orders_summary",
    comment="Resumo de pedidos pagos por cliente, moeda e data",
    partition_cols=["summary_date"],
)
def gold_orders_summary():
    catalog = spark.conf.get("pipeline.catalog", "main")
    silver_schema = spark.conf.get("pipeline.silver_schema", "silver")
    silver = spark.read.table(f"{catalog}.{silver_schema}.orders")

    return (
        silver
        .filter(F.col("status").isin("paid", "shipped", "delivered"))
        .withColumn("summary_date", F.to_date("paid_at"))
        .filter(F.col("summary_date").isNotNull())
        .groupBy("customer_id", "currency", "summary_date")
        .agg(
            F.countDistinct("order_id").alias("total_orders"),
            F.sum("total_amount").alias("total_revenue"),
            (F.sum("total_amount") / F.countDistinct("order_id"))
                .cast("decimal(18,2)")
                .alias("avg_order_value"),
            F.current_timestamp().alias("_updated_at"),
        )
    )
```

- [ ] **Step 2: Verificar sintaxe**

```bash
python -c "import ast; ast.parse(open('pipeline/gold/pipeline.py').read()); print('Syntax OK')"
```
Expected: `Syntax OK`

- [ ] **Step 3: Commit**

```bash
git add pipeline/gold/pipeline.py
git commit -m "feat(pipeline): adiciona gold pipeline com agregacoes por customer×currency×date"
git push
```

---

## Task 6: `databricks.yml` — Databricks Asset Bundle

**Files:**
- Create: `databricks.yml` (raiz do projeto)

- [ ] **Step 1: Criar `databricks.yml`** com o conteúdo completo:

```yaml
# databricks.yml
# Databricks Asset Bundle — Pipeline Medallion Lakehouse
#
# Uso:
#   databricks bundle validate          # valida sem deploiar
#   databricks bundle deploy            # deploia no workspace
#   databricks bundle run medallion-job # executa o job completo
#
# Preencha workspace.host com a URL do seu Databricks Free Edition.
# Ex: https://adb-1234567890123456.7.azuredatabricks.net

bundle:
  name: medallion-lakehouse

variables:
  catalog:
    description: "Unity Catalog catalog"
    default: main
  raw_schema:
    description: "Schema da camada raw"
    default: raw
  bronze_schema:
    description: "Schema da camada bronze"
    default: bronze
  silver_schema:
    description: "Schema da camada silver"
    default: silver
  gold_schema:
    description: "Schema da camada gold"
    default: gold
  landing_path:
    description: "Caminho dos arquivos JSONL gerados (Volume ou DBFS)"
    default: /Volumes/main/raw/landing
  schema_location:
    description: "Onde o Auto Loader persiste o schema inferido"
    default: /Volumes/main/raw/schema_location

targets:
  dev:
    mode: development
    default: true

workspace:
  host: https://PREENCHA-SUA-URL.azuredatabricks.net  # <- altere aqui

resources:
  pipelines:
    raw:
      name: "[${bundle.target}] raw-commerce-events"
      catalog: ${var.catalog}
      schema: ${var.raw_schema}
      development: true
      configuration:
        pipeline.landing_path: ${var.landing_path}
        pipeline.schema_location: ${var.schema_location}
      libraries:
        - file:
            path: ./pipeline/raw/pipeline.py

    bronze:
      name: "[${bundle.target}] bronze-commerce-events"
      catalog: ${var.catalog}
      schema: ${var.bronze_schema}
      development: true
      configuration:
        pipeline.catalog: ${var.catalog}
        pipeline.raw_schema: ${var.raw_schema}
      libraries:
        - file:
            path: ./pipeline/bronze/pipeline.py

    silver:
      name: "[${bundle.target}] silver-orders"
      catalog: ${var.catalog}
      schema: ${var.silver_schema}
      development: true
      configuration:
        pipeline.catalog: ${var.catalog}
        pipeline.bronze_schema: ${var.bronze_schema}
      libraries:
        - file:
            path: ./pipeline/silver/pipeline.py

    gold:
      name: "[${bundle.target}] gold-orders-summary"
      catalog: ${var.catalog}
      schema: ${var.gold_schema}
      development: true
      configuration:
        pipeline.catalog: ${var.catalog}
        pipeline.silver_schema: ${var.silver_schema}
      libraries:
        - file:
            path: ./pipeline/gold/pipeline.py

  jobs:
    medallion-job:
      name: "[${bundle.target}] medallion-lakehouse-job"
      tasks:
        - task_key: generate
          description: "Executa o gerador faker-lakehouse para popular data/landing/"
          python_wheel_task:
            package_name: faker-lakehouse
            entry_point: main
            parameters: ["run"]

        - task_key: raw
          description: "Auto Loader: data/landing/ → raw.commerce_events"
          depends_on:
            - task_key: generate
          pipeline_task:
            pipeline_id: ${resources.pipelines.raw.id}

        - task_key: bronze
          description: "Parse + dedup + quarantine: raw → bronze.commerce_events"
          depends_on:
            - task_key: raw
          pipeline_task:
            pipeline_id: ${resources.pipelines.bronze.id}

        - task_key: silver
          description: "Consolidação por order_id: bronze → silver.orders"
          depends_on:
            - task_key: bronze
          pipeline_task:
            pipeline_id: ${resources.pipelines.silver.id}

        - task_key: gold
          description: "Agregações: silver → gold.orders_summary"
          depends_on:
            - task_key: silver
          pipeline_task:
            pipeline_id: ${resources.pipelines.gold.id}
```

- [ ] **Step 2: Verificar YAML (sintaxe básica)**

```bash
python -c "import yaml; yaml.safe_load(open('databricks.yml')); print('YAML OK')"
```
Expected: `YAML OK`

- [ ] **Step 3: Validar com Databricks CLI (se instalado)**

```bash
databricks bundle validate
```
Expected: `Validation OK` ou JSON de configuração sem erros.

Se o CLI não estiver instalado, pular este step — a validação acontece no Free Edition.

- [ ] **Step 4: Commit**

```bash
git add databricks.yml
git commit -m "feat: adiciona databricks.yml com Asset Bundle medallion completo"
git push
```

---

## Task 7: Atualizar README com instruções de deploy

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Adicionar seção "Deploy no Databricks" ao `README.md`**

Inserir após a seção "Como gerar dados de exemplo" e antes de "Estrutura do Projeto":

```markdown
---

## Deploy no Databricks (Free Edition)

### Pré-requisitos

1. Instalar o [Databricks CLI](https://docs.databricks.com/en/dev-tools/cli/install.html):
   ```cmd
   pip install databricks-cli
   ```
2. Autenticar no workspace:
   ```cmd
   databricks configure --token
   ```
3. Preencher `workspace.host` em `databricks.yml` com a URL do seu workspace.

### Subir o bundle

```cmd
databricks bundle validate    # verifica a configuração
databricks bundle deploy      # deploia pipelines e job no workspace
```

### Executar o pipeline completo

```cmd
databricks bundle run medallion-job
```

Isso executa em sequência: **generator → raw → bronze → silver → gold**.

### Verificar resultados

No Databricks workspace:
- **Workflows** → `[dev] medallion-lakehouse-job` — acompanhar execução
- **Catalog Explorer** → `main.raw`, `main.bronze`, `main.silver`, `main.gold` — ver tabelas geradas

---
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs(readme): adiciona instrucoes de deploy no Databricks Free Edition"
git push
```

---

## Self-Review

**Spec coverage:**

| Requisito do design | Task |
|---|---|
| Move generator para raiz | Task 1 |
| `pipeline/raw/pipeline.py` — Auto Loader + raw.commerce_events | Task 2 |
| `pipeline/bronze/pipeline.py` — parse por `_entity`, dedup `apply_changes`, quarantine | Task 3 |
| `pipeline/silver/pipeline.py` — consolidação order_id, paid_at, items_agg | Task 4 |
| `pipeline/gold/pipeline.py` — agregações customer×currency×date | Task 5 |
| `databricks.yml` — Asset Bundle com 5 tasks dependentes | Task 6 |
| README com instruções de deploy | Task 7 |

**Placeholder scan:** nenhum TBD/TODO. ✓

**Type consistency:**
- `spark.conf.get("pipeline.catalog", "main")` — usada em Tasks 3, 4, 5 com mesmo nome de chave ✓
- `pipeline.raw_schema` / `pipeline.bronze_schema` / `pipeline.silver_schema` — nomes consistentes entre pipeline.py e databricks.yml ✓
- `dlt.read_stream("raw_events_parsed")` em bronze — `raw_events_parsed` é definida como `@dlt.view` no mesmo arquivo ✓
- `dlt.read_stream("events_valid")` em `dlt.apply_changes(source="events_valid")` — `events_valid` é definida como `@dlt.view` no mesmo arquivo ✓
- `spark.read.table(f"{catalog}.{bronze_schema}.commerce_events")` em silver — referencia corretamente a tabela criada pela bronze pipeline ✓
- `spark.read.table(f"{catalog}.{silver_schema}.orders")` em gold — referencia a tabela criada pela silver pipeline ✓
