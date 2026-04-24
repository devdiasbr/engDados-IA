# Spec Example: analytics.gold.orders_summary

## Objective
Prover agregações confiáveis de pedidos pagos para consumo por dashboards, relatórios executivos e APIs de produto.

## Databricks object type
Lakeflow Spark Declarative Pipeline ou job PySpark versionado em bundle.

## Layer
Gold

## Sources
- `analytics.silver.orders`

## Targets
- `analytics.gold.orders_summary`

## Grain and keys
- 1 linha por `customer_id` + `currency` + `summary_date`
- chave primária lógica: `customer_id`, `currency`, `summary_date`

## Transformation rules
- Agregar por `customer_id`, `currency` e data de pagamento (`paid_at::date`)
- Calcular: `total_orders`, `total_revenue`, `avg_order_value`
- Filtrar apenas registros com `paid_at` não nulo
- Não expor dados de clientes além do `customer_id`

## Incremental strategy
- `MERGE` por (`customer_id`, `currency`, `summary_date`)
- reprocessamento de janela móvel de 7 dias para absorver atualizações da silver

## Late data or CDC behavior
- herda comportamento da silver; janela de 7 dias cobre eventos atrasados propagados

## Schema contract
- `customer_id`: string, not null
- `currency`: string, not null
- `summary_date`: date, not null
- `total_orders`: bigint, not null
- `total_revenue`: decimal(18,2), not null
- `avg_order_value`: decimal(18,2), not null
- `_updated_at`: timestamp, not null

## Data quality rules
- unicidade de (`customer_id`, `currency`, `summary_date`)
- `total_orders >= 1`
- `total_revenue >= 0`
- `avg_order_value >= 0`
- reconciliação diária: `SUM(total_orders)` na gold deve bater com contagem de pedidos pagos na silver (tolerância 0%)

## Observability
- métricas de linhas inseridas, atualizadas e lidas por execução
- alerta para divergência de reconciliação acima de 0%
- alerta para ausência de atualização por mais de 25 horas

## Performance and cost constraints
- evitar shuffle desnecessário — agregar sobre partições da silver
- particionar por `summary_date`
- materializar como Delta table com Z-ORDER em `customer_id`

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

## Acceptance criteria
- tabela publicada em `analytics.gold.orders_summary`
- reconciliação com silver com divergência zero
- dashboards consumindo sem erros de schema
