# Guia rapido: criacao e uso de agentes especificos

## Quando criar um agente
- Quando a tarefa se repete com o mesmo tipo de contexto.
- Quando voce quer isolar ruido do fluxo principal.
- Quando precisa limitar ferramentas por seguranca e foco.

## Criacao via /agents
1. Rodar `/agents`
2. Escolher `Create New Agent`
3. Definir escopo:
   - projeto: `.claude/agents/`
   - usuario: `~/.claude/agents/`
4. Preencher:
   - `name`
   - `description`
   - `tools`
   - prompt do agente
5. Salvar

## Criacao manual via arquivo
Exemplo:

```md
---
name: spark-tuning
description: Use proactively para analisar custo e performance em Spark
tools: Read, Grep, Bash
---

Voce e especialista em Spark no Databricks.
Sempre revise:
- partitions
- shuffle e skew
- merge strategy
- explain plan
- custo operacional
```

## Exemplo de uso explicito

```text
Use the spark-tuning subagent to inspect the MERGE in analytics.silver.orders and point out shuffle, skew and partition risks.
```

## Exemplo de uso automatico
Se a descricao do agente estiver boa, Claude pode delegar sozinho quando a tarefa combinar com ela.

Exemplo de pedido principal:

```text
Implemente a spec abaixo no Databricks e faca review de qualidade antes do merge.
```

Nesse caso, Claude pode delegar para:
- `databricks-platform`
- `data-quality-reviewer`

## Exemplo de agentes para seu caso
- `databricks-platform`: bundle, jobs, pipelines e Unity Catalog
- `api-backend`: contratos e servicos de API
- `spark-tuning`: performance e custo
- `data-quality-reviewer`: checks, reconciliacao e rollback

## Regra de ouro
- Agente nao substitui spec.
- Agente bem usado acelera execucao.
- Agente mal definido acelera erro.
