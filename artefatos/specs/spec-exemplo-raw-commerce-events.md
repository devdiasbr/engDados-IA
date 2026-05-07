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
