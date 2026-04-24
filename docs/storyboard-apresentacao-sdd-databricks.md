# Storyboard: Apresentação SDD com Claude para Engenharia de Dados no Databricks

Data: 24 de abril de 2026
Total de slides: 39

---

## Slide 01 — Capa
**Kicker:** ENGENHARIA DE DADOS + IA
**Título:** SDD com Claude para Engenharia de Dados no Databricks
**Subtítulo:** Reunião de alinhamento em 24 de abril de 2026. Como transformar pedidos vagos em especificações executáveis, com mais padrão, qualidade e velocidade.
**Momento:** Spec primeiro. Código depois.
**Mensagem:** Abertura da proposta. Não é IA sem controle — é um jeito mais disciplinado de especificar, implementar e operar mudanças de dados.

---

## Slide 02 — Agenda
**Kicker:** AGENDA
**Título:** O que vamos cobrir hoje
**Subtítulo:** Uma proposta de como trabalhar melhor — não mais rápido — com IA em engenharia de dados.
**Cards:**
- Parte 1 — Contexto e método: por que mudar o fluxo, SDD, spec e prompting ancorado em artefatos
- Parte 2 — Ferramentas e agentes: CLAUDE.md, rules, memory e agentes especializados
- Parte 3 — Casos, adoção e piloto: ganho real, como medir, como começar pequeno
**Mensagem:** Orientar o time antes de entrar nas sessões. A reunião tem três blocos e termina com piloto concreto.

---

## Slide 03 — Separador Sessão 1
**Kicker:** SESSÃO 1
**Título:** Contexto e tese
**Subtítulo:** Produtividade com IA não vem de pedir código mais rápido. Vem de reduzir ambiguidade, retrabalho e falha operacional.
**Tópicos:** Dor atual no fluxo / Onde a IA gera ganho real / Spec primeiro, código depois

---

## Slide 04 — Por que mudar
**Kicker:** POR QUE MUDAR
**Título:** Hoje a maior perda não está na escrita do código
**Subtítulo:** Ela aparece na ambiguidade do pedido, no retrabalho entre times e na validação tardia do impacto downstream.
**Cards:**
- Pedidos vagos: sem contrato de fonte, destino, grain e regras, o trabalho começa na suposição
- Entrega não padronizada: cada pipeline vira exceção, testes e rollback entram tarde
- Validação no fim: schema drift e duplicidade aparecem quando a mudança já está em execução
**Mensagem:** O custo principal é cognitivo e operacional, não de digitação.

---

## Slide 05 — Alavancas de produtividade
**Kicker:** ALAVANCAS DE PRODUTIVIDADE
**Título:** Onde a IA realmente economiza tempo na engenharia de dados
**Subtítulo:** O maior ganho não é escrever SQL mais rápido. É reduzir fricção ao longo do ciclo inteiro.
**Quad cards:**
- Refino da demanda: transforma pedido vago em spec, perguntas e lacunas antes de mexer no código
- Scaffolding técnico: acelera bundles, jobs, pipelines, APIs, testes e documentação inicial
- Review e qualidade: revisa risco, impacto downstream, checks, rollback e pontos cegos
- Operação e suporte: ajuda em runbooks, troubleshooting, tuning e padronização de incidentes
**Mensagem:** Produtividade com IA em dados é multifase — não é apenas geração de código.

---

## Slide 06 — Separador Sessão 2
**Kicker:** SESSÃO 2
**Título:** SDD, spec e prompting
**Subtítulo:** O coração da proposta: transformar demanda vaga em contrato executável antes de escrever qualquer pipeline ou API.
**Tópicos:** Fluxo SDD no dia a dia / Spec curta, mas acionável / Prompt ancorado em artefatos

---

## Slide 07 — Do problema à entrega
**Kicker:** DO PROBLEMA À ENTREGA
**Título:** A spec é o elo que faltava entre análise e implementação
**Subtítulo:** Análise de requisitos entende o problema. Spec traduz em contrato executável. Sem esse elo, a ambiguidade vai para o código.
**Steps:**
1. Demanda: stakeholder define o problema e o impacto esperado no negócio
2. Análise: entende escopo, fontes, regras de negócio e restrições operacionais
3. Spec: traduz a análise em contrato técnico — grain, checks, incremental e aceite
4. Implementação: Claude ou engenheiro executa com precisão, sem adivinhar intenção
5. Validação: checks, reconciliação e critério de aceite fecham o ciclo
**Mensagem:** A spec não substitui a análise de requisitos — ela é o next step dela. O SDD formaliza esse segundo passo que hoje quase sempre é pulado.

---

## Slide 08 — SDD na prática
**Kicker:** SDD NA PRÁTICA
**Título:** Um pedido vira contrato antes de virar código
**Subtítulo:** Menos suposição, menos ida e volta, mais padrão na entrega.
**Steps:**
1. Pedido: ex.: consolidar pedidos pagos em analytics.silver.orders
2. Spec: objetivo, fonte, alvo, grain, incrementalidade e checks
3. Build: Claude gera SQL ou PySpark, bundle, job ou pipeline
4. Validate: testes, reconciliação e impacto downstream
5. Run: backfill, rollback, monitoramento e custo
**Mensagem:** SDD não elimina conversa — faz a conversa produzir um artefato reutilizável e executável.

---

## Slide 09 — Exemplo de spec
**Kicker:** EXEMPLO DE SPEC
**Título:** Spec curta para uma silver table no Databricks
**Subtítulo:** Sem isso, Claude precisa adivinhar. Com isso, ele executa com muito mais precisão.
**Esquerda (SPEC):**
- Objetivo, fonte, destino, grain, incremental, late data, qualidade e critério de aceite da silver.orders
**Direita (SAÍDA ESPERADA DO CLAUDE):**
- Estrutura de bundle/pipeline, SQL/PySpark com MERGE, regras de qualidade, backfill e rollback
**Mensagem:** A spec é simples, mas suficiente para eliminar ambiguidade.

---

## Slide 10 — Antes x depois
**Kicker:** ANTES X DEPOIS
**Título:** O jeito de pedir muda a qualidade da entrega
**Subtítulo:** A mesma demanda pode gerar retrabalho ou uma entrega muito mais previsível.
**Esquerda (PEDIDO VAGO):** "Cria uma pipeline para pedidos pagos no Databricks" — sem fonte, alvo, grain, incremental, checks ou aceite
**Direita (PEDIDO COM SPEC):** demanda estruturada com grain, MERGE, late data, checks e saída esperada com bundle e rollback
**Mensagem:** SDD é mudança de processo, não apenas de ferramenta.

---

## Slide 11 — Prompting operacional
**Kicker:** PROMPTING OPERACIONAL
**Título:** A melhor forma de usar IA é ancorar em artefatos
**Subtítulo:** Prompt bom em engenharia de dados quase sempre referencia spec, regras e formato de saída.
**Esquerda (PROMPT FRACO):** "Gera o código para essa pipeline no Databricks" — Claude adivinha contexto, saída varia demais
**Direita (PROMPT BOM):** "Implemente a spec abaixo. Se houver lacunas, liste antes de codar. Entregue bundle, SQL, validação, riscos, backfill e rollback."
**Mensagem:** A spec é o artefato que estabiliza a conversa com a IA.

---

## Slide 12 — Separador Sessão 3
**Kicker:** SESSÃO 3
**Título:** CLAUDE.md, rules e memory
**Subtítulo:** O segundo ganho vem do contexto persistente: regras do projeto, memória do time e organização do repositório.
**Tópicos:** Separar arquivo, regra e mecanismo / Modularizar contexto com imports / Padrão reutilizável por repositório

---

## Slide 13 — CLAUDE.md, rules, memory
**Kicker:** CLAUDE.MD, RULES, MEMORY
**Título:** Esses termos se conectam, mas não significam a mesma coisa
**Subtítulo:** Quando separam bem arquivo, conteúdo e mecanismo de carga, o uso do Claude deixa de ser improvisado.
**Cards:**
- CLAUDE.md: arquivo onde ficam as instruções persistentes do projeto ou do usuário
- Rules: regras operacionais — podem ficar no CLAUDE.md ou em rules.md importado com @imports
- Memory: mecanismo de carga por escopo — memory.md guarda decisões do time e é importado no CLAUDE.md
**Mensagem:** /init cria o CLAUDE.md, # grava memória rápida e @imports modularizam o arquivo.

---

## Slide 14 — Exemplo de CLAUDE.md
**Kicker:** EXEMPLO DE CLAUDE.MD
**Título:** Um CLAUDE.md bom é curto, específico e acionável
**Subtítulo:** O objetivo não é um manifesto enorme — é orientar consistentemente o comportamento do Claude.
**Esquerda (CLAUDE.MD DE EXEMPLO):** working mode (spec first, não assumir schema, listar lacunas), Databricks defaults (bundle, Unity Catalog, bronze/silver/gold), response format (spec summary, implementation, validation, rollback)
**Direita (EFEITO PRÁTICO):** padroniza resposta, reduz esquecimentos, acelera review, facilita onboarding, permite evoluir por repositório
**Mensagem:** Mostrar o arquivo real disponível em /artefatos.

---

## Slide 15 — Arquitetura de arquivos
**Kicker:** ARQUITETURA DE ARQUIVOS
**Título:** Como organizar CLAUDE.md, rules.md e memory.md no repo
**Subtítulo:** rules.md e memory.md são convenções do time importadas pelo CLAUDE.md para manter o contexto modular.
**Esquerda (ESTRUTURA):** CLAUDE.md na raiz, docs/rules.md, docs/memory.md, .claude/agents/ com os agentes do projeto
**Direita (CLAUDE.MD COM IMPORTS):** instruções base + @docs/rules.md + @docs/memory.md + referência a /agents
**Mensagem:** rules.md e memory.md não são obrigatórios do produto — são convenções úteis para modularizar contexto.

---

## Slide 16 — Separador Sessão 4
**Kicker:** SESSÃO 4
**Título:** Agentes e especialização
**Subtítulo:** Agentes resolvem a próxima etapa de escala: distribuir responsabilidades sem perder o contrato central da entrega.
**Tópicos:** Como criar agentes / Como definir skills na prática / Uso explícito e delegação automática

---

## Slide 17 — Criação e uso de agentes
**Kicker:** CRIAÇÃO E USO DE AGENTES
**Título:** Passo a passo para criar e usar agentes específicos
**Subtítulo:** Em vez de improvisar prompts longos, padronize agentes por responsabilidade e ferramenta.
**Steps:**
1. Mapear tarefa: ex.: tuning Spark, API backend, review de qualidade de dados
2. Criar agente: usar /agents e definir nome, descrição, prompt e escopo
3. Restringir tools: liberar apenas o necessário — Read, Grep, Bash ou full quando fizer sentido
4. Testar uso: invocar em tarefa real e revisar se a saída segue o contrato esperado
5. Evoluir: ajustar prompt e limites com base em incidentes, retrabalho e qualidade
**Mensagem:** Agentes reduzem ruído de contexto quando são bem focados.

---

## Slide 18 — Exemplo de criação
**Kicker:** EXEMPLO DE CRIAÇÃO
**Título:** Exemplo concreto de criação de um agente
**Subtítulo:** O time pode criar agentes pela interface ou diretamente por arquivo Markdown com frontmatter.
**Esquerda (CRIAÇÃO VIA /AGENTS):** passo a passo: /agents → Create New Agent → project-level → name, description, tools → salvar e testar
**Direita (CRIAÇÃO VIA ARQUIVO):** .claude/agents/spark-tuning.md com frontmatter (name, description, tools) e prompt do agente
**Mensagem:** Mostrar literalmente como o agente nasce — via interface ou via arquivo.

---

## Slide 19 — Implementação via API
**Kicker:** IMPLEMENTAÇÃO VIA API
**Título:** Para quem constrói produtos: agentes via Anthropic API
**Subtítulo:** Além do Claude Code, é possível criar e orquestrar agentes diretamente pela API — para pipelines automatizados e produtos internos.
**Esquerda (CRIAR AGENTE — UMA VEZ):** client.beta.agents.create() com name, model, system e tools — guardar agent.id
**Direita (INICIAR SESSÃO — CADA EXECUÇÃO):** client.beta.sessions.create() referenciando agent.id + events.send() com a mensagem
**Mensagem:** Claude Code serve o engenheiro no dia a dia; a API serve pipelines automatizados e produtos internos. O agente é persistente e versionado — criar uma vez, reutilizar sempre.

---

## Slide 20 — Anatomia do agente
**Kicker:** ANATOMIA DO AGENTE
**Título:** A skill do agente nasce de três elementos combinados
**Subtítulo:** Não existe campo formal chamado skill. A especialização vem da combinação de gatilho, escopo de ferramenta e prompt.
**Esquerda (ARQUIVO DE AGENTE):** frontmatter com name, description e tools + prompt do spark-tuning
**Direita (OS TRÊS ELEMENTOS):**
- Description: define quando o agente é acionado — boa descrição melhora delegação automática
- Tools: definem o alcance — tuning não precisa escrever, apenas Read, Grep e Bash
- Prompt: define o que ele sabe, como raciocina e o formato da resposta esperada
**Mensagem:** Agente não é super prompt — é especialização reutilizável com contexto próprio.

---

## Slide 21 — Exemplo de uso
**Kicker:** EXEMPLO DE USO
**Título:** Exemplo concreto de uso explícito e uso automático
**Subtítulo:** Depois de criado, o agente pode ser chamado diretamente ou acionado automaticamente quando a tarefa combina com a descrição.
**Esquerda (USO EXPLÍCITO):** "Use the spark-tuning subagent to inspect the MERGE in analytics.silver.orders and point out shuffle, skew and partition risks." — saída: hipóteses, checks, recomendações, risco
**Direita (USO AUTOMÁTICO):** pedido principal com spec → Claude delega automaticamente para databricks-platform e data-quality-reviewer se a descrição estiver boa
**Mensagem:** Agente pode ser invocado explicitamente ou usado automaticamente conforme a tarefa.

---

## Slide 22 — Catálogo de agentes
**Kicker:** CATÁLOGO DE AGENTES
**Título:** Um conjunto inicial de agentes faz sentido para o seu stack
**Subtítulo:** Não crie um agente generalista para tudo. Crie agentes com responsabilidade clara.
**Quad cards:**
- databricks-platform: bundles, Lakeflow Jobs, declarative pipelines, UC paths e deploy por ambiente
- api-backend: APIs para consulta, metadados, autenticação, contratos e documentação
- spark-tuning: shuffle, skew, partições, merge, storage layout e custo de execução
- data-quality-reviewer: checks, impacto downstream, reconciliação, rollback e falhas silenciosas
**Mensagem:** Catálogo inicial alinhado com o stack do time — Databricks, API e tuning.

---

## Slide 23 — Separador Sessão 5
**Kicker:** SESSÃO 5
**Título:** Casos de ganho e produtividade
**Subtítulo:** Com contexto e agentes definidos, a conversa muda de teoria para ganho concreto em Databricks, APIs, tuning e qualidade.
**Tópicos:** Databricks e padrão de plataforma / API backend como acelerador de consumo / Tuning, review e documentação

---

## Slide 24 — Databricks com IA
**Kicker:** DATABRICKS COM IA
**Título:** No Databricks, a IA ajuda mais onde a plataforma exige padrão
**Subtítulo:** Quanto mais repetitivo e estruturado o trabalho, maior tende a ser o ganho de produtividade.
**Quad cards:**
- Bundles e deploy: cria targets, estrutura de projeto, jobs e parâmetros com menos trabalho manual
- Lakeflow e pipelines: acelera criação de pipeline, ingestão incremental, contratos e validações
- Unity Catalog e nomenclatura: padroniza paths, objetos e impacto entre ambientes e camadas
- Troubleshooting: resume logs, levanta hipóteses e guia investigação de falhas com mais rapidez
**Mensagem:** Onde existe padrão, existe mais oportunidade de automação segura.

---

## Slide 25 — API backend com IA
**Kicker:** API BACKEND COM IA
**Título:** Desenvolvimento de API também fica mais rápido e mais consistente
**Subtítulo:** IA ajuda tanto no scaffold quanto no contrato, no teste e na documentação do serviço.
**Cards:**
- Contrato e endpoint: acelera definição de request, response, filtros, erros, autenticação e docs
- Implementação: gera handlers, serviços, validadores, testes e exemplos de uso mais rapidamente
- Review técnico: revisa breaking changes, casos de erro, observabilidade e impacto em consumidores
**Mensagem:** Conectar com o agente api-backend do catálogo.

---

## Slide 26 — Spark tuning com IA
**Kicker:** SPARK TUNING COM IA
**Título:** Tuning não vira automático, mas a IA reduz o tempo de análise
**Subtítulo:** Ela ajuda a organizar hipóteses, interpretar sinais e sugerir verificações com muito mais velocidade.
**Cards:**
- Hipóteses mais rápidas: aponta suspeitas em shuffle, skew, joins, merge, partições e storage layout
- Checklist técnico: lembra explain plan, tamanho de arquivo, cardinalidade, repartition e incremental
- Comparação de opções: pesa ganho esperado, custo e risco antes de mexer em pipeline crítica
**Mensagem:** IA não substitui conhecimento de Spark — acelera a investigação e o raciocínio.

---

## Slide 27 — Custo, risco e controle
**Kicker:** CUSTO, RISCO E CONTROLE
**Título:** Ganho real exige entender também o custo e o risco
**Subtítulo:** Usar IA sem clareza sobre custo operacional e pontos de falha é trocar um problema por outro.
**Cards:**
- Custo de uso: Claude cobra por token — contexto longo, agentes em loop e reprocessamento aumentam custo. Medir desde o piloto.
- Risco de erro: Claude pode gerar código plausível mas incorreto. Review humano continua obrigatório.
- Controle e rastreabilidade: toda saída do Claude deve passar por PR, checklist e review. IA acelera; o engenheiro decide.
**Mensagem:** Antecipar a objeção mais comum do time técnico — quanto custa e o que acontece quando erra.

---

## Slide 28 — Review, qualidade e docs
**Kicker:** REVIEW, QUALIDADE E DOCS
**Título:** Boa parte do ganho vem do que normalmente fica para depois
**Subtítulo:** IA reduz o custo de fazer o que o time sabe que deveria fazer, mas muitas vezes posterga.
**Cards:**
- Qualidade e validação: acelera escrita de checks, reconciliação, cenários de teste e critério de aceite
- Documentação: mantém runbooks, notas de deploy, README e contexto técnico atualizados
- Code review: funciona como revisor inicial para risco operacional, regressão e impacto downstream
**Mensagem:** Sustenta a tese de produtividade total — não apenas implementação.

---

## Slide 29 — Separador Sessão 6
**Kicker:** SESSÃO 6
**Título:** Adoção, guardrails e piloto
**Subtítulo:** Como usar vários agentes, medir ganho real e fazer um rollout seguro no time.
**Tópicos:** Fluxo multiagente controlado / Antipadrões e métricas certas / Rollout pequeno, medido e reversível

---

## Slide 30 — Fluxo multiagente
**Kicker:** FLUXO MULTIAGENTE
**Título:** Exemplo de entrega quebrada por especialidade
**Subtítulo:** Uma demanda real pode passar por vários agentes sem perder o contrato central da spec.
**Steps:**
1. Engenheiro + Claude: fecha ambiguidades e produz a spec com grain, checks e aceite
2. databricks-platform: cria bundle, pipeline, SQL ou PySpark no padrão do repo
3. api-backend: expõe endpoints ou serviços quando a entrega precisa de consumo online
4. spark-tuning: revisa custo e performance antes de promover para produção
5. data-quality-reviewer: valida checks, backfill e rollback antes do merge
**Mensagem:** A spec continua sendo a fonte de verdade entre os agentes.

---

## Slide 31 — Regras práticas
**Kicker:** REGRAS PRÁTICAS
**Título:** Não transforme agentes em bagunça automatizada
**Subtítulo:** Produtividade com IA em dados exige recorte claro de responsabilidade e guardrails simples.
**Cards:**
- Um agente, um foco: evite agentes enciclopédicos — responsabilidade nítida e descrição específica
- Ferramentas mínimas: dar ao agente apenas o que ele precisa melhora segurança, foco e previsibilidade
- Tudo volta para a spec: mesmo com vários agentes, validação, riscos, backfill e rollback continuam obrigatórios
**Mensagem:** Responde à objeção natural: isso não vai virar bagunça?

---

## Slide 32 — Antipadrões
**Kicker:** ANTIPADRÕES
**Título:** Os erros mais comuns quando um time começa a usar IA
**Subtítulo:** Quase todos os fracassos iniciais vêm de falta de processo, não de falta de modelo.
**Cards:**
- Pedir código sem contexto: sem spec, o time recebe resposta aparentemente boa mas com risco alto escondido
- Delegar tudo para um agente: generalismo demais polui contexto e reduz qualidade técnica da saída
- Não medir: sem baseline, qualquer sensação de ganho ou perda vira opinião em vez de evidência
**Mensagem:** Antecipar resistência e mostrar maturidade na proposta.

---

## Slide 33 — Limitações do Claude
**Kicker:** LIMITAÇÕES DO CLAUDE
**Título:** IA erra. Saber onde evita surpresa em produção
**Subtítulo:** Reconhecer os limites não enfraquece a proposta — mostra que a adoção está sendo pensada com seriedade.
**Cards:**
- Schemas desconhecidos: sem CLAUDE.md ou spec, Claude inventa campos e tipos plausíveis mas incorretos — contexto é obrigatório
- Lógica de negócio complexa: regras de reconciliação, late data e SLA dependem de decisão humana — Claude sugere, engenheiro valida
- Contexto muito longo: acima de certo volume, a qualidade da resposta cai — agentes especializados existem exatamente para isso
**Mensagem:** Quem propõe IA sem mencionar limitações perde confiança. SDD + review + checklist cobrem esses pontos cegos.

---

## Slide 34 — Como medir
**Kicker:** COMO MEDIR
**Título:** Produtividade precisa ser medida em fluxo, qualidade e operação
**Subtítulo:** Baseline via GitLab ou Jira antes do piloto. Medir as mesmas entregas com e sem IA por pelo menos 2 semanas.
**Métricas:**
- Lead time: demanda ao merge via GitLab MR open/close date — baseline: média das últimas 10 entregas similares
- Retrabalho: MRs reabertos ou com mais de 2 rounds de review — baseline: % de MRs com comentários de correção obrigatórios
- Incidentes: falhas pós-deploy (rollback, alerta ou quebra downstream) — baseline: incidentes por sprint nas últimas 4 sprints
**Mensagem:** Mostrar COMO medir, não apenas O QUE medir. Sem baseline, qualquer resultado vira opinião.

---

## Slide 35 — Modelo de rollout
**Kicker:** ROLL OUT
**Título:** Um rollout bom começa pequeno e cresce por evidências
**Subtítulo:** A pior forma de adotar IA é tentar mudar o time inteiro ao mesmo tempo e sem guardrails.
**Steps:**
1. Escolher caso: selecionar uma entrega com dor real e escopo controlado
2. Fixar artefatos: CLAUDE.md, spec, checklist e agentes mínimos
3. Executar piloto: rodar uma janela curta com comparação do fluxo anterior
4. Medir resultado: lead time, retrabalho, incidentes e satisfação do time
5. Padronizar: expandir apenas o que realmente melhorou com segurança
**Mensagem:** Adoção boa é incremental, mensurada e reversível.

---

## Slide 36 — Piloto proposto
**Kicker:** PILOTO PROPOSTO
**Título:** Próxima etapa: um piloto pequeno, medido e reversível
**Subtítulo:** A melhor forma de convencer o time é provar em um fluxo real, com critérios objetivos.
**Métricas:**
- 1: caso piloto — preferir uma silver ou gold com dor real
- 4: artefatos base — CLAUDE.md, spec, checklist e agentes
- 2 sem.: janela inicial — medir lead time, retrabalho e incidentes
**Mensagem:** Fechar com algo prático: um caso, poucos artefatos, janela curta e métricas de comparação.

---

## Slide 37 — Fechamento
**Kicker:** FECHAMENTO
**Título:** Qual caso real faz mais sentido para começar?
**Subtítulo:** Não estamos propondo IA sem controle. Estamos propondo um jeito melhor de transformar demanda em entrega.
**Tópicos:**
- Artefatos disponíveis em /artefatos
- CLAUDE.md, spec-template, checklist-pr
- Agentes prontos em .claude/agents/
**Mensagem:** Abrir a conversa com a pergunta central. Não fechar com slide — fechar com pergunta e silêncio para o time responder.

---

## Slide 38 — Agradecimento
**Kicker:** OBRIGADO
**Título:** Perguntas e próximos passos
**Subtítulo:** Artefatos disponíveis em /artefatos: CLAUDE.md, spec-template, checklist-pr e agentes prontos para uso.
**Momento:** Spec primeiro. Código depois.
**Mensagem:** Slide de encerramento — deixar no ar enquanto a conversa acontece. Reforçar que todos os artefatos estão disponíveis e prontos para uso no piloto.
