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
