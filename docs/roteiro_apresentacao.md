# Roteiro de Apresentacao

## Data
24 de abril de 2026

## Abertura
Mensagem principal:
"Nao estou propondo IA sem controle. Estou propondo um jeito melhor de transformar demanda em entrega."

## Slide de abertura — Agenda
Slide 2
- Apresentar os tres blocos da reuniao
- Deixar claro que termina com uma proposta concreta de piloto

## Sessao 1: contexto e tese
Slides 3-6
- Abrir o tema
- Introduzir o separador de sessao
- Mostrar a dor atual
- Explicar onde a IA realmente gera produtividade

## Sessao 2: SDD, spec e prompting
Slides 7-13
- Mostrar a progressao: demanda → analise → spec → implementacao → validacao
- Posicionar a spec como next step da analise de requisitos, nao substituto
- Mostrar o fluxo SDD na pratica
- Apresentar uma spec real (silver.orders)
- Comparar pedido vago x pedido com spec
- Mostrar como prompting melhora quando ancorado em artefatos

## Sessao 3: CLAUDE.md, rules e memory
Slides 14-17
- Separar `CLAUDE.md`, `rules` e `memory`
- Mostrar um `CLAUDE.md` enxuto
- Mostrar estrutura de arquivos com `rules.md`, `memory.md` e `.claude/agents/`

## Sessao 4: agentes e especializacao
Slides 18-25
- Passo a passo para criar e usar agentes
- Mostrar criacao via /agents e via arquivo .md
- Mostrar implementacao via Anthropic API para pipelines automatizados
- Explicar anatomia do agente: description, tools e prompt
- Mostrar exemplo de uso explicito e automatico
- Fechar com catalogo inicial de agentes

## Sessao 5: casos de ganho e produtividade
Slides 26-32
- Mostrar ganho no Databricks
- Mostrar ganho em API backend
- Mostrar ganho em tuning
- Abordar custo, risco e controle — antecipar objecoes do time tecnico
- Mostrar ganho em review, qualidade e documentacao

## Sessao 6: adocao, guardrails e piloto
Slides 33-39
- Mostrar um fluxo multiagente com agentes ja apresentados
- Explicar regras praticas
- Antecipar antipadroes
- Mostrar limitacoes do Claude — aumenta credibilidade
- Mostrar como medir com baseline concreto via GitLab/Jira
- Explicar rollout gradual
- Fechar com o piloto sugerido

## Fechamento
Slides 40-41
- Pergunta para abrir a conversa:
  "Qual caso real do nosso contexto faz mais sentido para provar ganho de produtividade sem elevar risco operacional?"
- Slide de agradecimento com referencia aos artefatos disponiveis
