# Spec Example: bronze.dim_customers / bronze.dim_products / bronze.dim_categories

## Objective
Materializar dimensões em SCD Tipo 2 a partir do snapshot inicial e dos eventos CDC, permitindo reconstrução histórica de qualquer estado de `customer`, `product` ou `category` em qualquer ponto no tempo.

## Databricks object type
Lakeflow Spark Declarative Pipeline ou job PySpark versionado em bundle. Uma pipeline por dimensão (3 alvos) ou pipeline única com 3 outputs.

## Layer
Bronze

## Sources
- `raw.commerce_dim_seed_customers` (snapshot inicial)
- `raw.commerce_dim_seed_products` (snapshot inicial)
- `raw.commerce_dim_seed_categories` (snapshot inicial)
- `raw.commerce_dim_changes` (CDC contínuo, filtrado por `event_type`)

## Targets
- `bronze.dim_customers`
- `bronze.dim_products`
- `bronze.dim_categories`

## Grain and keys
- 1 linha por (`entity_id`, `_valid_from`)
- chave natural: `entity_id` (`customer_id`, `product_id`, `category_id`)
- chave do registro: `entity_id` + `_valid_from`

## Transformation rules
- **Carga inicial**: 1 linha por `entity_id` da seed com `_valid_from = signup_date` (ou `current_timestamp` se ausente), `_valid_to = NULL`, `_is_current = true`
- **CDC subsequente**: para cada evento aplicável, fechar a linha atual (`_valid_to = occurred_at`, `_is_current = false`) e inserir nova linha com os atributos atualizados (`_valid_from = occurred_at`, `_valid_to = NULL`, `_is_current = true`)
- Aplicar mudanças em ordem cronológica de `occurred_at` (resolver out-of-order com janela 7 dias)
- Para `categories`, sem CDC ativa hoje: tabela é apenas snapshot

## Incremental strategy
- `MERGE` por `entity_id` com `WHEN MATCHED AND _is_current` para fechar linha atual
- particionamento por `_is_current` (boolean) ou por mês de `_valid_from`

## Late data or CDC behavior
- aceitar eventos com `occurred_at` até 7 dias atrás
- eventos fora dessa janela: log + quarentena (`bronze.dim_changes_quarantine`)
- reordenação por `occurred_at` antes do MERGE

## Schema contract (bronze.dim_customers)
- `customer_id`: string, not null
- `email`: string
- `country`: string
- `signup_date`: date
- `segment`: string
- `_valid_from`: timestamp, not null
- `_valid_to`: timestamp (nullable; null para versão atual)
- `_is_current`: boolean, not null
- `_source_event_id`: string (event_id que originou a versão; null para seed)

## Schema contract (bronze.dim_products)
- `product_id`: string, not null
- `category_id`: string
- `name`: string
- `unit_price`: decimal(18,2)
- `currency`: string
- `active`: boolean
- `_valid_from`, `_valid_to`, `_is_current`, `_source_event_id` (idem)

## Schema contract (bronze.dim_categories)
- `category_id`: string, not null
- `name`: string
- `parent_category_id`: string
- `_valid_from`, `_valid_to`, `_is_current`, `_source_event_id` (idem)

## Data quality rules
- exatamente 1 linha com `_is_current = true` por `entity_id`
- `_valid_to >= _valid_from` quando `_valid_to is not null`
- não pode haver gap temporal entre versões consecutivas do mesmo `entity_id`
- `entity_id` não nulo em todas as 3 tabelas
- contagem de `entity_id` distintos com `_is_current = true` deve bater com seed inicial + novos cadastros

## Observability
- métricas por execução: linhas SCD2 fechadas, abertas, rejeitadas
- alerta para múltiplas linhas `_is_current = true` para mesmo `entity_id`
- alerta para queda > 30% no número de `_is_current = true`

## Performance and cost constraints
- evitar shuffle global — particionar staging por `entity_id` antes do MERGE
- Z-ORDER em `entity_id` para acelerar lookups históricos

## Environment impact
- dev
- staging
- prod

## Backfill plan
- recriar a partir do snapshot inicial + replay completo de `raw.commerce_dim_changes` em ordem cronológica de `occurred_at`
- janela: desde o início do CDC

## Rollback plan
- restaurar versão anterior do bundle
- restaurar snapshot da dimensão a partir de Delta Time Travel (`VERSION AS OF`)
- reaplicar CDC após correção

## Acceptance criteria
- tabelas publicadas em `bronze.dim_customers`, `bronze.dim_products`, `bronze.dim_categories`
- invariante "exatamente 1 `_is_current = true` por `entity_id`" verde para 100% das chaves
- contagem de `entity_id` ativos bate com seed (default: 500 customers, 80 products, 10 categories)
- replay determinístico: mesmo input produz mesmas versões
