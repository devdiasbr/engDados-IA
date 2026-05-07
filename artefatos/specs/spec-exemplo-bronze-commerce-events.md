# Spec Example: bronze.commerce_events

## Objective
Estruturar e validar eventos brutos de comércio, aplicando parsing tipado por `_entity` e deduplicação por `event_id`, mantendo histórico completo para auditoria. Registros corrompidos vão para quarentena.

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
- `order_id`: string
- `order_item_id`: string
- `customer_id`: string
- `product_id`: string
- `payment_id`: string
- `currency`: string
- `total_amount`: decimal(18,2)
- `quantity`: int
- `unit_price`: decimal(18,2)
- `line_total`: decimal(18,2)
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
