# Databricks SDD Rules

## Working mode
- Nao implemente mudancas antes de resumir a spec.
- Se a spec estiver incompleta, liste as lacunas primeiro.
- Prefira mudancas pequenas, testaveis e reversiveis.

## For every change, define first
- objetivo de negocio
- datasets de origem e seus owners
- alvo em `catalog.schema.table`
- grain e chave primaria ou estrategia de deduplicacao
- modo batch ou streaming
- politica para late arriving data
- semantica de CDC ou merge
- contrato de schema e impacto de compatibilidade
- regras de qualidade
- SLA ou SLO
- plano de backfill
- plano de rollback
- impacto downstream

## Databricks defaults
- Prefira artefatos versionados em bundle.
- Prefira Unity Catalog para objetos de dados.
- Para orquestracao, use Lakeflow Jobs quando o caso for workflow.
- Para pipeline declarativo, use Lakeflow Spark Declarative Pipelines quando fizer sentido.

## Subagents
- Use agentes especializados para tarefas focadas.
- Nao use um agente generalista para tudo.
- Bons candidatos: databricks-platform, api-backend, spark-tuning e data-quality-reviewer.

## Quality and operations
- Toda mudanca deve vir com validacao proporcional ao risco.
- Sempre considerar observabilidade, custo, backfill e rollback.
- Nao assumir tipos de coluna ou contratos sem verificar a spec existente.

## Response format
1. Spec summary
2. Proposed implementation
3. Risks and downstream impact
4. Validation plan
5. Backfill plan
6. Rollback plan
