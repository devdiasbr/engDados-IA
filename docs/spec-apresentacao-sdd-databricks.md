# Spec: Apresentação SDD com Claude para Engenharia de Dados no Databricks

## Objective
Produzir um deck executivo em PPTX para reunião de alinhamento com time técnico de engenharia de dados em 24 de abril de 2026, cobrindo a proposta de adoção de SDD (Spec-Driven Development) com Claude no contexto Databricks. O deck deve ser autoexplicativo, concreto e fechar com uma proposta de piloto acionável.

## Databricks object type
Não aplicável — artefato de apresentação gerado via Node.js com `@oai/artifact-tool`.

## Layer
Não aplicável.

## Sources
- `narrative_plan.md` — audiência, objetivo, arco de slides e ênfases da narrativa
- `roteiro_apresentacao.md` — estrutura por sessão e notas do apresentador
- `artefatos/specs/spec-exemplo-silver-orders.md` — spec de exemplo usada no slide "EXEMPLO DE SPEC"
- `artefatos/agentes/` — agentes de referência (databricks-platform, api-backend, spark-tuning, data-quality-reviewer)
- `artefatos/exemplos/CLAUDE.example.md` — base para o slide de exemplo de CLAUDE.md
- `references/claude-references.md` — referências oficiais Anthropic usadas nas speaker notes

## Targets
- `out/Apresentacao_SDD_Claude_Databricks.pptx`

## Grain and keys
- 1 slide por unidade de mensagem
- 6 sessões temáticas + capa + agenda + fechamento + agradecimento
- Total: 39 slides

## Transformation rules
- Cada slide segue um layout fixo: `cover`, `section`, `cards`, `quad`, `flow`, `example`, `metrics`
- Todos os slides compartilham paleta, tipografia e rodapé padronizados
- Rodapé de todos os slides referencia artefatos disponíveis em `/artefatos`
- Speaker notes incluem orientação de apresentação e fontes
- Slide de abertura (agenda) orienta o time antes das sessões
- Slide de fechamento termina com pergunta de abertura de conversa
- Slide de agradecimento fica no ar durante a conversa final

## Incremental strategy
- Deck gerado via `build/deck_builder.mjs` com array `SLIDES` editável
- Cada slide é um objeto JS com `layout`, `kicker`, `title`, `subtitle`, conteúdo específico do layout, `notes` e `sources`
- Para adicionar ou editar slides: modificar o array `SLIDES` e rodar `node deck_builder.mjs`
- Limpar `build/tmp` antes de rodar se o limite de 3 renders for atingido

## Late data or CDC behavior
Não aplicável.

## Schema contract

### Estrutura de cada slide no array SLIDES
- `layout`: string — `cover | section | cards | quad | flow | example | metrics`
- `kicker`: string — label superior em maiúsculas
- `title`: string — título principal do slide
- `subtitle`: string — subtítulo ou mensagem de apoio
- `notes`: string — speaker notes com orientação de apresentação
- `sources`: string[] — chaves do objeto `SOURCES` para rodapé de fontes

### Campos por layout
| Layout | Campos adicionais obrigatórios |
|---|---|
| `cover` | `moment` |
| `section` | `sectionNumber`, `topics: string[]` |
| `cards` | `cards: [label, body][]` (max 3) |
| `quad` | `quadCards: [label, body][]` (max 4) |
| `flow` | `steps: [title, body][]` (max 5) |
| `example` | `leftLabel`, `leftText`, `rightLabel`, `rightText` |
| `metrics` | `metrics: [value, label, note][]` (max 3) |

## Data quality rules
- Cada slide deve ter `kicker`, `title`, `subtitle`, `notes` e `sources` preenchidos
- `cards` e `quadCards`: máximo de 3 e 4 itens respectivamente
- `steps`: máximo de 5 itens
- `metrics`: máximo de 3 itens
- Textos longos em `leftText`/`rightText` devem usar `\n` para quebras de linha
- Fontes referenciadas em `sources` devem existir no objeto `SOURCES`

## Observability
- Preview PNG de cada slide gerado em `tmp/slides/sdd-databricks/preview/`
- Registro de renders em `tmp/slides/sdd-databricks/verification/render_verify_loops.ndjson`
- Inspeção de shapes e textboxes em `tmp/slides/sdd-databricks/inspect.ndjson`
- Máximo de 3 loops de render/verify/fix por execução — limpar `build/tmp` para resetar

## Performance and cost constraints
- Geração completa em menos de 60 segundos
- Sem dependências externas além de `@oai/artifact-tool` (já em `build/node_modules`)
- Paleta, fontes e layouts definidos como constantes no topo do arquivo

## Environment impact
- Local (execução via `node deck_builder.mjs` na pasta `build/`)
- Sem impacto em ambientes dev/staging/prod

## Backfill plan
- Para regenerar do zero: limpar `build/tmp` e rodar `node deck_builder.mjs` com o arquivo fechado no PowerPoint
- Para reverter um slide: restaurar o objeto correspondente no array `SLIDES`

## Rollback plan
- O array `SLIDES` é a fonte de verdade — qualquer versão anterior pode ser restaurada via edição manual
- O PPTX é um artefato gerado — nunca editar o PPTX diretamente; sempre editar o `deck_builder.mjs`

## Acceptance criteria
- PPTX gerado em `out/Apresentacao_SDD_Claude_Databricks.pptx` com 39 slides
- Data da capa: 24 de abril de 2026
- Slide de agenda (slide 2) com os três blocos da reunião
- Slide "Do problema à entrega" posicionando spec como next step da análise de requisitos
- Slide de implementação via Anthropic API na Sessão 4
- Slides de custo/risco e limitações do Claude nas Sessões 5 e 6
- Slide de métricas com baseline concreto via GitLab/Jira
- Fluxo multiagente usando apenas agentes já apresentados no deck
- Slide de fechamento com pergunta de abertura de conversa
- Slide de agradecimento com referência aos artefatos
- Rodapé de todos os slides referenciando `/artefatos`
- Speaker notes preenchidas em todos os slides
