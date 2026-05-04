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
- Filtrar `silver.orders` por `status ∈ {paid, shipped, delivered}` (excluir `refunded`)
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
- reprocessamento de janela é idempotente

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
