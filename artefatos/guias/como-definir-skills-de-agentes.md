# Como definir skills de agentes

## Ponto importante
No Claude Code, `skill` nao e um campo separado do arquivo do agente.

A especializacao do agente e definida por 3 coisas:
- `description`
- `tools`
- prompt do agente

## 1. Description
Serve para dizer quando o agente deve ser usado.

Exemplo ruim:
- `ajuda com Spark`

Exemplo bom:
- `Use proactively para analisar custo e performance em Spark, especialmente em shuffle, skew, merges e explain plan`

## 2. Tools
Servem para limitar ou ampliar o alcance da skill.

Exemplo:
- `Read, Grep, Bash` para tuning e review
- incluir ferramentas de escrita apenas quando o agente realmente precisar editar

## 3. Prompt do agente
E onde a skill fica mais clara.

Exemplo:
- o que o agente sempre revisa
- quais sinais procura
- como estrutura a resposta
- quais riscos deve apontar

## Exemplo completo

```md
---
name: spark-tuning
description: Use proactively para analisar custo e performance em Spark, especialmente em shuffle, skew, merges e explain plan
tools: Read, Grep, Bash
---

Voce e especialista em Spark no Databricks.

Sempre revise:
- shuffle e skew
- joins e merges
- explain plan
- cardinalidade
- particoes e tamanho de arquivos

Responda com:
1. gargalo principal
2. hipoteses
3. recomendacoes por impacto
4. risco de cada mudanca
```

## Regra pratica
Se o agente nao tiver:
- gatilho claro
- escopo de ferramenta claro
- criterio de resposta claro

ele nao tem uma skill bem definida.
