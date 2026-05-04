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
- Enriquecer com `customer_country`, `customer_segment`, `customer_email_hash` (SHA-256 do email — não expor email cru) via join com `bronze.dim_customers` onde `_is_current = true`
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
- `status`: string, not null
- `created_at`: timestamp, not null
- `paid_at`: timestamp
- `last_event_at`: timestamp, not null
- `_updated_at`: timestamp, not null

## Data quality rules
- unicidade de `order_id`
- `created_at` não nulo
- `total_amount >= 0`
- `total_items_amount >= 0` e dentro de 1% de `total_amount` (alerta divergência > 1%)
- `status` ∈ {`paid`, `shipped`, `delivered`, `refunded`}
- reconciliação diária: contagem de `order_id` com `status = paid` na silver = contagem na bronze (tolerância 0,5%)

## Observability
- métricas: linhas lidas, inseridas, atualizadas, divergência total_amount × total_items_amount
- alerta para divergência de reconciliação > 0,5%
- alerta para queda de volume diário > 20%

## Performance and cost constraints
- evitar shuffle desnecessário — particionar bronze por `order_id` antes do agregado
- Z-ORDER em `order_id`
- particionar silver por `created_at::date`

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
