# Narrative Plan

## Audience
- Lideranca tecnica
- Time de engenharia de dados
- Pessoas interessadas em produtividade com IA sem perder governanca

## Objective
- Mostrar que SDD muda o jeito de trabalhar, nao apenas o jeito de pedir codigo
- Posicionar a spec como next step da analise de requisitos — o elo que falta entre analise e implementacao
- Conectar Claude, agentes, regras e specs com a stack Databricks
- Demonstrar onde a IA realmente gera produtividade, incluindo custo e limitacoes
- Fechar com um piloto pequeno e mensuravel

## Core Message
- O ganho nao vem de "usar IA para escrever codigo".
- O ganho vem de transformar demanda vaga em artefatos executaveis, padronizar o fluxo e reduzir retrabalho.
- A spec nao substitui a analise de requisitos — ela e o next step dela.

## Slide Arc
1. Capa (24 de abril de 2026)
2. Agenda — os tres blocos da reuniao
3. Sessao 1: contexto e tese
4. Dor atual
5. Alavancas de produtividade
6. Sessao 2: SDD, spec e prompting
7. Do problema a entrega — demanda → analise → spec → implementacao → validacao
8. Fluxo SDD na pratica
9. Spec de exemplo (silver.orders)
10. Antes x depois no jeito de pedir
11. Prompting ancorado em artefatos
12. Sessao 3: CLAUDE.md, rules e memory
13. CLAUDE.md, rules e memory
14. Exemplo de CLAUDE.md
15. Arquitetura de arquivos
16. Sessao 4: agentes e especializacao
17. Criacao e uso de agentes
18. Exemplo concreto de criacao de agente (Claude Code)
19. Implementacao via Anthropic API
20. Anatomia do agente — description, tools e prompt
21. Exemplo de uso explicito e automatico
22. Catalogo inicial de agentes
23. Sessao 5: casos de ganho e produtividade
24. Databricks com IA
25. API backend com IA
26. Spark tuning com IA
27. Custo, risco e controle
28. Review, qualidade e documentacao
29. Sessao 6: adocao, guardrails e piloto
30. Fluxo multiagente
31. Regras praticas
32. Antipadroes
33. Limitacoes do Claude
34. Como medir — baseline concreto via GitLab/Jira
35. Modelo de rollout
36. Piloto proposto
37. Fechamento — pergunta de abertura de conversa
38. Agradecimento e proximos passos

## What To Emphasize
- SDD aumenta controle — a spec e o elo entre analise e codigo
- IA e mais valiosa quando acoplada a padrao, contrato e review
- Agentes especializados reduzem ruido e aceleram tarefas recorrentes
- Produtividade precisa ser medida em fluxo, retrabalho e incidentes
- Reconhecer custo e limitacoes aumenta credibilidade da proposta com time tecnico

## Desired Outcome
- Acordo para rodar um piloto real
- Aceite de um pacote minimo:
  - `CLAUDE.md`
  - `rules.md`
  - `memory.md`
  - `spec-template.md`
  - `checklist-pr.md`
  - agentes especializados em `.claude/agents/`
