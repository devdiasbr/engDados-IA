# Spec Example: analytics.silver.orders

## Objective
Consolidar eventos de pedidos pagos em uma tabela silver confiavel para analytics e consumo operacional.

## Databricks object type
Lakeflow Spark Declarative Pipeline ou job PySpark versionado em bundle.

## Layer
Silver

## Sources
- `bronze.orders_events`

## Targets
- `analytics.silver.orders`

## Grain and keys
- 1 linha por `order_id`
- chave primaria logica: `order_id`

## Transformation rules
- Considerar apenas eventos com status final `paid`
- Manter o ultimo estado valido por `order_id`
- Propagar `customer_id`, `paid_at`, `currency`, `total_amount`

## Incremental strategy
- `MERGE` por `order_id`
- reprocessamento de janela movel de 7 dias

## Late data or CDC behavior
- aceitar eventos atrasados ate 7 dias
- se chegar evento mais recente para o mesmo `order_id`, atualizar registro

## Schema contract
- `order_id`: string, not null
- `customer_id`: string, not null
- `paid_at`: timestamp, not null
- `currency`: string, not null
- `total_amount`: decimal(18,2), not null

## Data quality rules
- unicidade de `order_id`
- `paid_at` nao nulo
- `total_amount >= 0`
- reconciliacao diaria com contagem de pedidos pagos na bronze

## Observability
- metricas de linhas lidas, inseridas e atualizadas
- alerta para divergencia diaria acima de 0,5%

## Performance and cost constraints
- evitar shuffle desnecessario
- revisar particionamento por data de pagamento

## Environment impact
- dev
- staging
- prod

## Backfill plan
- executar backfill de 30 dias antes do go-live

## Rollback plan
- restaurar versao anterior do bundle
- reverter para tabela silver anterior se reconciliacao falhar

## Acceptance criteria
- tabela publicada em `analytics.silver.orders`
- checks de qualidade verdes
- divergencia diaria menor que 0,5%
