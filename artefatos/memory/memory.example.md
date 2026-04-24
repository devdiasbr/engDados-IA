# memory.md (convencao de time)

## Objetivo
Registrar decisoes recorrentes para reduzir repeticao e retrabalho.

## Decisoes ativas
- Prefixo de catalogo por ambiente:
  - dev: `dev_analytics`
  - prod: `analytics`
- Formato padrao de resposta do Claude:
  1. Spec summary
  2. Implementacao
  3. Validacao
  4. Riscos
  5. Rollback
- Para pipelines criticas, exigir plano de backfill antes de merge.

## Aprendizados recentes
- Erros de duplicate key ocorreram em cargas sem chave tecnica.
- Reprocessamento completo aumentou custo; priorizar incremental por janela movel.

## Como usar
- Importar este arquivo no `CLAUDE.md` com `@docs/memory.md` (ou caminho equivalente).
- Atualizar somente quando uma decisao for realmente recorrente.
