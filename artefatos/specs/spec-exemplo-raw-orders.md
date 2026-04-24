# Spec Example: raw.orders_events

## Objective
Ingerir eventos brutos de pedidos da fonte de origem sem transformação, preservando fidelidade total dos dados para rastreabilidade e reprocessamento.

## Databricks object type
Lakeflow Spark Declarative Pipeline ou job PySpark versionado em bundle.

## Layer
Raw

## Sources
- Kafka topic `orders.events` ou arquivos JSON/Parquet no landing zone (S3/ADLS)

## Targets
- `raw.orders_events`

## Grain and keys
- 1 linha por evento recebido (sem deduplicação)
- chave natural: `event_id` (gerado pela fonte ou pela ingestão)

## Transformation rules
- Nenhuma transformação aplicada
- Dados ingeridos as-is da fonte
- Adicionar metadados de ingestão: `_ingested_at`, `_source_file`, `_partition_date`

## Incremental strategy
- Append-only
- particionamento por `_partition_date` (data de ingestão)

## Late data or CDC behavior
- Não aplicável — todos os eventos recebidos são aceitos independentemente do conteúdo

## Schema contract
- `event_id`: string, not null
- `payload`: string (JSON raw), not null
- `event_type`: string
- `received_at`: timestamp, not null
- `_ingested_at`: timestamp, not null
- `_source_file`: string
- `_partition_date`: date, not null

## Data quality rules
- `event_id` não nulo
- `received_at` não nulo
- volume diário dentro de limites históricos (alerta se queda > 20%)

## Observability
- métricas de arquivos/mensagens processadas por execução
- alerta para ausência de dados nas últimas 2 horas em horário comercial

## Performance and cost constraints
- evitar leitura completa do landing zone a cada execução
- usar checkpoint ou watermark para ingestão incremental

## Environment impact
- dev
- staging
- prod

## Backfill plan
- reprocessar arquivos do landing zone para janela histórica necessária (máx 90 dias)

## Rollback plan
- dados raw são append-only; basta ignorar partições com problema
- reprocessar a partir do landing zone original

## Acceptance criteria
- eventos chegando em `raw.orders_events` dentro de SLA definido
- nenhum evento descartado sem registro de erro
- volume diário consistente com fonte
