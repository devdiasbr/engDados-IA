# Prompt Template Operacional

Use este formato quando quiser pedir implementacao ao Claude sem cair em ambiguidade.

## Prompt base

```text
Implemente a spec abaixo para Databricks.

Se houver lacunas, liste primeiro e nao escreva codigo antes de fechar a spec.

Depois entregue:
1. bundle, pipeline, job ou API necessaria
2. SQL ou PySpark
3. validacao e checks
4. riscos e impacto downstream
5. plano de backfill
6. plano de rollback

Spec:
<colar aqui>
```

## Quando usar
- Pipeline ou tabela nova
- Mudanca em job existente
- API de apoio ao dado
- Tuning com criterios claros

## O que evitar
- "faz uma pipeline para mim"
- "gera o codigo"
- "otimiza isso" sem contexto
