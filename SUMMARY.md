[Home](./README.md) | [Narrativa](./docs/narrative_plan.md) | [Roteiro](./docs/roteiro_apresentacao.md) | [Spec](./docs/spec-apresentacao-sdd-databricks.md) | [Storyboard](./docs/storyboard-apresentacao-sdd-databricks.md) | [Artefatos](./artefatos/) | [Referências](./references/claude-references.md) | **Sumário**


# SUMÁRIO

Bem-vindo ao repositório da apresentação **SDD com Claude para Engenharia de Dados no Databricks**. Navegue pelos tópicos abaixo para acessar toda a documentação e os artefatos prontos para uso no piloto.

---

### **1. [DOCUMENTAÇÃO DA APRESENTAÇÃO](./docs/)**

*   **1.1. [Narrativa e Objetivo](./docs/narrative_plan.md)**
    *   1.1.1. [Audiência](./docs/narrative_plan.md#audience)
    *   1.1.2. [Objetivo](./docs/narrative_plan.md#objective)
    *   1.1.3. [Mensagem Central](./docs/narrative_plan.md#core-message)
    *   1.1.4. [Arco de Slides](./docs/narrative_plan.md#slide-arc)
    *   1.1.5. [O que Enfatizar](./docs/narrative_plan.md#what-to-emphasize)
    *   1.1.6. [Resultado Esperado](./docs/narrative_plan.md#desired-outcome)

*   **1.2. [Roteiro por Sessão](./docs/roteiro_apresentacao.md)**
    *   1.2.1. [Abertura](./docs/roteiro_apresentacao.md#slide-de-abertura--agenda)
    *   1.2.2. [Sessão 1 — Contexto e tese](./docs/roteiro_apresentacao.md#sessao-1-contexto-e-tese)
    *   1.2.3. [Sessão 2 — SDD, spec e prompting](./docs/roteiro_apresentacao.md#sessao-2-sdd-spec-e-prompting)
    *   1.2.4. [Sessão 3 — CLAUDE.md, rules e memory](./docs/roteiro_apresentacao.md#sessao-3-claudemd-rules-e-memory)
    *   1.2.5. [Sessão 4 — Agentes e especialização](./docs/roteiro_apresentacao.md#sessao-4-agentes-e-especializacao)
    *   1.2.6. [Sessão 5 — Casos de ganho e produtividade](./docs/roteiro_apresentacao.md#sessao-5-casos-de-ganho-e-produtividade)
    *   1.2.7. [Sessão 6 — Adoção, guardrails e piloto](./docs/roteiro_apresentacao.md#sessao-6-adocao-guardrails-e-piloto)
    *   1.2.8. [Fechamento](./docs/roteiro_apresentacao.md#fechamento)

*   **1.3. [Spec Técnica do Deck](./docs/spec-apresentacao-sdd-databricks.md)**
    *   1.3.1. [Objetivo e Fontes](./docs/spec-apresentacao-sdd-databricks.md#objective)
    *   1.3.2. [Schema de Slides](./docs/spec-apresentacao-sdd-databricks.md#schema-contract)
    *   1.3.3. [Como Gerar e Editar](./docs/spec-apresentacao-sdd-databricks.md#incremental-strategy)
    *   1.3.4. [Critérios de Aceite](./docs/spec-apresentacao-sdd-databricks.md#acceptance-criteria)

*   **1.4. [Storyboard — Conteúdo Slide a Slide](./docs/storyboard-apresentacao-sdd-databricks.md)**
    *   1.4.1. [Slides 01–02 — Capa e Agenda](./docs/storyboard-apresentacao-sdd-databricks.md#slide-01--capa)
    *   1.4.2. [Slides 03–05 — Sessão 1: Contexto e tese](./docs/storyboard-apresentacao-sdd-databricks.md#slide-03--separador-sessão-1)
    *   1.4.3. [Slides 06–11 — Sessão 2: SDD, spec e prompting](./docs/storyboard-apresentacao-sdd-databricks.md#slide-06--separador-sessão-2)
    *   1.4.4. [Slides 12–15 — Sessão 3: CLAUDE.md, rules e memory](./docs/storyboard-apresentacao-sdd-databricks.md#slide-12--separador-sessão-3)
    *   1.4.5. [Slides 16–22 — Sessão 4: Agentes e especialização](./docs/storyboard-apresentacao-sdd-databricks.md#slide-16--separador-sessão-4)
    *   1.4.6. [Slides 23–28 — Sessão 5: Casos de ganho](./docs/storyboard-apresentacao-sdd-databricks.md#slide-23--separador-sessão-5)
    *   1.4.7. [Slides 29–36 — Sessão 6: Adoção, guardrails e piloto](./docs/storyboard-apresentacao-sdd-databricks.md#slide-29--separador-sessão-6)
    *   1.4.8. [Slides 37–39 — Fechamento e agradecimento](./docs/storyboard-apresentacao-sdd-databricks.md#slide-37--fechamento)

---

### **2. [ARTEFATOS PRONTOS PARA O PILOTO](./artefatos/)**

*   **2.1. [Agentes Claude](./artefatos/agentes/)**
    *   2.1.1. [databricks-platform](./artefatos/agentes/databricks-platform.md) — bundles, pipelines, UC paths e deploy
    *   2.1.2. [api-backend](./artefatos/agentes/api-backend.md) — APIs, contratos, autenticação e documentação
    *   2.1.3. [spark-tuning](./artefatos/agentes/spark-tuning.md) — shuffle, skew, partições, merge e custo
    *   2.1.4. [data-quality-reviewer](./artefatos/agentes/data-quality-reviewer.md) — checks, reconciliação e rollback

*   **2.2. [Specs de Exemplo](./artefatos/specs/)**
    *   2.2.1. [spec-template](./artefatos/specs/spec-template.md) — template em branco para novas specs
    *   2.2.2. [spec-exemplo-raw-orders](./artefatos/specs/spec-exemplo-raw-orders.md) — camada raw (ingestão append-only)
    *   2.2.3. [spec-exemplo-bronze-orders](./artefatos/specs/spec-exemplo-bronze-orders.md) — camada bronze (tipagem e deduplicação)
    *   2.2.4. [spec-exemplo-silver-orders](./artefatos/specs/spec-exemplo-silver-orders.md) — camada silver (MERGE por order_id)
    *   2.2.5. [spec-exemplo-gold-orders](./artefatos/specs/spec-exemplo-gold-orders.md) — camada gold (agregações por cliente)

*   **2.3. [Configuração do Claude](./artefatos/exemplos/)**
    *   2.3.1. [CLAUDE.example](./artefatos/exemplos/CLAUDE.example.md) — exemplo de CLAUDE.md para projetos Databricks
    *   2.3.2. [rules.example](./artefatos/exemplos/rules.example.md) — exemplo de rules.md com convenções operacionais

*   **2.4. [Memory](./artefatos/memory/)**
    *   2.4.1. [claude-memory-rules](./artefatos/memory/claude-memory-rules.md) — regras de uso de memória
    *   2.4.2. [memory.example](./artefatos/memory/memory.example.md) — exemplo de memory.md

*   **2.5. [Guias Operacionais](./artefatos/guias/)**
    *   2.5.1. [guia-criacao-uso-agentes](./artefatos/guias/guia-criacao-uso-agentes.md) — como criar e usar agentes no Claude Code
    *   2.5.2. [como-definir-skills-de-agentes](./artefatos/guias/como-definir-skills-de-agentes.md) — description, tools e prompt
    *   2.5.3. [prompt-template-operacional](./artefatos/guias/prompt-template-operacional.md) — templates de prompt ancorado em artefatos

*   **2.6. [Checklist e Métricas](./artefatos/)**
    *   2.6.1. [checklist-pr](./artefatos/checklist-pr.md) — checklist de PR com IA antes do merge
    *   2.6.2. [metricas-piloto](./artefatos/metricas-piloto.md) — métricas de lead time, retrabalho e incidentes

---

### **3. [REFERÊNCIAS OFICIAIS](./references/)**

*   **3.1. [Claude Code](./references/claude-references.md#claude-code)** — settings, hooks, sub-agents, MCP, slash commands
*   **3.2. [Claude API](./references/claude-references.md#claude-api-anthropic-sdk)** — modelos, tool use, prompt caching, batch, files
*   **3.3. [Modelos Claude](./references/claude-references.md#modelos-claude-referência-rápida)** — tabela rápida com IDs e casos de uso
*   **3.4. [Agent SDK](./references/claude-references.md#agent-sdk)** — construção e orquestração de agentes
*   **3.5. [Model Context Protocol](./references/claude-references.md#model-context-protocol-mcp)** — especificação e servidores MCP
*   **3.6. [Engenharia de Prompt](./references/claude-references.md#boas-práticas-e-engenharia-de-prompt)** — guias e exemplos oficiais Anthropic

---

### **4. [GERAÇÃO DO PPTX](./build/)**

*   **4.1. [Como Gerar](./README.md#como-gerar-o-pptx)** — comando e reset do contador de renders
*   **4.2. [Como Editar](./README.md#como-editar-o-deck)** — array SLIDES e layouts disponíveis
*   **4.3. [Builder](./build/deck_builder.mjs)** — código fonte do gerador de slides

---

*Documentação gerada em 2026-04-23. Apresentação: 24 de abril de 2026.*
