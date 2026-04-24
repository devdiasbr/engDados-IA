# Spec Example: bronze.orders_events

## Objective
Estruturar e validar eventos brutos de pedidos, aplicando tipagem e deduplicação básica, mantendo histórico completo para auditoria.

## Databricks object type
Lakeflow Spark Declarative Pipeline ou job PySpark versionado em bundle.

## Layer
Bronze

## Sources
- `raw.orders_events`

## Targets
- `bronze.orders_events`

## Grain and keys
- 1 linha por `event_id` único
- chave primária lógica: `event_id`

## Transformation rules
- Parse do campo `payload` (JSON) para colunas tipadas
- Deduplicação por `event_id` mantendo o registro mais recente por `received_at`
- Rejeitar registros com `event_id` ou `received_at` nulos (quarentena)
- Manter coluna `_raw_payload` para auditoria

## Incremental strategy
- `MERGE` por `event_id`
- particionamento por `event_date` (derivado de `received_at`)

## Late data or CDC behavior
- aceitar eventos atrasados até 7 dias
- eventos mais recentes sobrescrevem versões anteriores do mesmo `event_id`

## Schema contract
- `event_id`: string, not null
- `order_id`: string, not null
- `status`: string, not null
- `customer_id`: string
- `currency`: string
- `total_amount`: decimal(18,2)
- `received_at`: timestamp, not null
- `event_date`: date, not null
- `_raw_payload`: string
- `_ingested_at`: timestamp, not null

## Data quality rules
- unicidade de `event_id`
- `order_id` não nulo
- `status` dentro de valores conhecidos (`pending`, `paid`, `cancelled`, `refunded`)
- registros rejeitados enviados para tabela de quarentena `bronze.orders_events_quarantine`

## Observability
- métricas de registros parsed, deduplicados e rejeitados por execução
- alerta para taxa de rejeição acima de 1%
- alerta para ausência de status `paid` por mais de 1 hora

## Performance and cost constraints
- evitar full scan da raw a cada execução
- usar watermark baseado em `_partition_date` da raw

## Environment impact
- dev
- staging
- prod

## Backfill plan
- reprocessar a partir da raw para janela de 90 dias antes do go-live

## Rollback plan
- restaurar versão anterior do bundle
- reprocessar bronze a partir da raw após correção

## Acceptance criteria
- tabela publicada em `bronze.orders_events`
- taxa de rejeição abaixo de 1%
- schema validado e sem quebras de contrato
