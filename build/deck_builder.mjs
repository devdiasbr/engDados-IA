// Node-oriented editable pro deck builder.
// Run this after editing SLIDES, SOURCES, and layout functions.
// The init script installs a sibling node_modules/@oai/artifact-tool package link
// and package.json with type=module for shell-run eval builders. Run with the
// Node executable from Codex workspace dependencies or the platform-appropriate
// command emitted by the init script.
// Do not use pnpm exec from the repo root or any Node binary whose module
// lookup cannot resolve the builder's sibling node_modules/@oai/artifact-tool.

const fs = await import("node:fs/promises");
const path = await import("node:path");
const { Presentation, PresentationFile } = await import("@oai/artifact-tool");

const W = 1280;
const H = 720;

const DECK_ID = "sdd-databricks";
const OUT_DIR = "C:\\Users\\boliveid\\OneDrive - NTT DATA EMEAL\\Área de Trabalho\\EntendimentoIAEngDados\\out";
const REF_DIR = "C:\\Users\\boliveid\\OneDrive - NTT DATA EMEAL\\Área de Trabalho\\EntendimentoIAEngDados\\references";
const SCRATCH_DIR = path.resolve(process.env.PPTX_SCRATCH_DIR || path.join("tmp", "slides", DECK_ID));
const PREVIEW_DIR = path.join(SCRATCH_DIR, "preview");
const VERIFICATION_DIR = path.join(SCRATCH_DIR, "verification");
const INSPECT_PATH = path.join(SCRATCH_DIR, "inspect.ndjson");
const MAX_RENDER_VERIFY_LOOPS = 3;

const INK = "#101828";
const GRAPHITE = "#334155";
const MUTED = "#64748B";
const PAPER = "#F5EFE6";
const PAPER_96 = "#F5EFE6F2";
const WHITE = "#FFFFFF";
const ACCENT = "#F45B35";
const ACCENT_DARK = "#A3381E";
const GOLD = "#D8A138";
const CORAL = "#E97858";
const TEAL = "#118D7B";
const NAVY = "#14283F";
const NAVY_SOFT = "#203A59";
const TRANSPARENT = "#00000000";

const TITLE_FACE = "Caladea";
const BODY_FACE = "Lato";
const MONO_FACE = "Aptos Mono";

const FALLBACK_PLATE_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";

const SOURCES = {
  claude_memory: "Anthropic Claude Code memory: https://docs.anthropic.com/en/docs/claude-code/memory",
  claude_settings: "Anthropic Claude Code settings: https://docs.anthropic.com/en/docs/claude-code/settings",
  claude_subagents: "Anthropic Claude Code subagents: https://docs.anthropic.com/en/docs/claude-code/sub-agents",
  claude_slash: "Anthropic Claude Code slash commands: https://docs.anthropic.com/en/docs/claude-code/slash-commands",
  bundles: "Databricks Declarative Automation Bundles: https://docs.databricks.com/aws/en/dev-tools/bundles/",
  lakeflow_jobs: "Databricks Lakeflow Jobs: https://docs.databricks.com/data-engineering/jobs/index.html",
  lakeflow_sdp: "Databricks Lakeflow Spark Declarative Pipelines: https://docs.databricks.com/aws/en/ldp/",
  lakeflow_best_practices: "Databricks Lakeflow Spark Declarative Pipelines best practices: https://docs.databricks.com/aws/en/ldp/best-practices",
  unity_catalog: "Databricks Unity Catalog lineage: https://docs.databricks.com/aws/en/data-governance/unity-catalog/data-lineage",
};

const SLIDES = [
  {
    layout: "cover",
    kicker: "ENGENHARIA DE DADOS + IA",
    title: "SDD com Claude para Engenharia de Dados no Databricks",
    subtitle:
      "Reunião de alinhamento em 24 de abril de 2026. Como transformar pedidos vagos em especificações executáveis, com mais padrão, qualidade e velocidade.",
    expectedVisual: "Capa executiva com mensagem principal e quadro-resumo dos pilares.",
    moment: "Spec primeiro. Código depois.",
    notes:
      "Abrir com a mensagem central: não estamos propondo IA sem controle. Estamos propondo um jeito mais disciplinado de especificar, implementar e operar mudanças de dados.",
    sources: ["claude_memory", "claude_settings", "bundles", "lakeflow_sdp"],
  },
  {
    layout: "cards",
    kicker: "AGENDA",
    title: "O que vamos cobrir hoje",
    subtitle:
      "Uma proposta de como trabalhar melhor — não mais rápido — com IA em engenharia de dados.",
    cards: [
      [
        "Parte 1 — Contexto e método",
        "Por que mudar o fluxo. O que é SDD, spec e prompting ancorado em artefatos.",
      ],
      [
        "Parte 2 — Ferramentas e agentes",
        "CLAUDE.md, rules, memory e agentes especializados por responsabilidade.",
      ],
      [
        "Parte 3 — Casos, adoção e piloto",
        "Onde a IA gera ganho real. Como medir. Como começar pequeno e crescer por evidências.",
      ],
    ],
    notes:
      "Slide de abertura para orientar o time antes de entrar nas sessões. Deixar claro que a reunião tem três grandes blocos e vai terminar com uma proposta concreta de piloto.",
    sources: ["claude_memory", "bundles", "lakeflow_best_practices"],
  },
  {
    layout: "section",
    kicker: "SESSAO 1",
    sectionNumber: "01",
    title: "Contexto e tese",
    subtitle:
      "Produtividade com IA não vem de pedir código mais rápido. Vem de reduzir ambiguidade, retrabalho e falha operacional.",
    topics: [
      "Dor atual no fluxo",
      "Onde a IA gera ganho real",
      "Spec primeiro, código depois",
    ],
    notes:
      "Usar este slide como transição entre a capa e o bloco de enquadramento. A ideia é mostrar que a conversa será separada por sessões bem definidas.",
    sources: ["claude_memory", "bundles"],
  },
  {
    layout: "cards",
    kicker: "POR QUE MUDAR",
    title: "Hoje a maior perda não está na escrita do código",
    subtitle:
      "Ela aparece na ambiguidade do pedido, no retrabalho entre times e na validação tardia do impacto downstream.",
    cards: [
      [
        "Pedidos vagos",
        "Sem contrato de fonte, destino, grain e regras, o trabalho começa na suposição.",
      ],
      [
        "Entrega não padronizada",
        "Cada pipeline vira uma exceção. Testes, backfill e rollback entram tarde ou não entram.",
      ],
      [
        "Validação no fim",
        "Schema drift, duplicidade e quebra downstream aparecem quando a mudança já está em execução.",
      ],
    ],
    notes:
      "Conectar com a dor real do time. O custo principal é cognitivo e operacional, não de digitação.",
    sources: ["lakeflow_best_practices", "unity_catalog"],
  },
  {
    layout: "quad",
    kicker: "ALAVANCAS DE PRODUTIVIDADE",
    title: "Onde a IA realmente economiza tempo na engenharia de dados",
    subtitle:
      "O maior ganho não é escrever SQL mais rápido. É reduzir fricção ao longo do ciclo inteiro.",
    quadCards: [
      [
        "Refino da demanda",
        "Transforma pedido vago em spec, perguntas e lacunas antes de mexer no código.",
      ],
      [
        "Scaffolding técnico",
        "Acelera bundles, jobs, pipelines, APIs, testes e documentação inicial.",
      ],
      [
        "Review e qualidade",
        "Revisa risco, impacto downstream, checks, rollback e pontos cegos de operação.",
      ],
      [
        "Operação e suporte",
        "Ajuda em runbooks, troubleshooting, tuning e padronização de resposta a incidentes.",
      ],
    ],
    notes:
      "Deixar claro que produtividade com IA em dados é multifase. Não é apenas geração de código.",
    sources: ["claude_memory", "bundles", "lakeflow_best_practices"],
  },
  {
    layout: "section",
    kicker: "SESSAO 2",
    sectionNumber: "02",
    title: "SDD, spec e prompting",
    subtitle:
      "Aqui entra o coração da proposta: transformar demanda vaga em contrato executável antes de escrever qualquer pipeline ou API.",
    topics: [
      "Fluxo SDD no dia a dia",
      "Spec curta, mas acionável",
      "Prompt ancorado em artefatos",
    ],
    notes:
      "Abrir o bloco explicando que SDD é o mecanismo que estabiliza a conversa com a IA.",
    sources: ["claude_memory", "bundles", "lakeflow_best_practices"],
  },
  {
    layout: "flow",
    kicker: "DO PROBLEMA A ENTREGA",
    title: "A spec é o elo que faltava entre análise e implementação",
    subtitle:
      "Análise de requisitos entende o problema. Spec traduz em contrato executável. Sem esse elo, a ambiguidade vai para o código.",
    steps: [
      ["Demanda", "Stakeholder define o problema e o impacto esperado no negócio"],
      ["Análise", "Entende escopo, fontes, regras de negócio e restrições operacionais"],
      ["Spec", "Traduz a análise em contrato técnico: grain, checks, incremental e aceite"],
      ["Implementação", "Claude ou engenheiro executa com precisão — sem adivinhar intenção"],
      ["Validação", "Checks, reconciliação e critério de aceite fecham o ciclo"],
    ],
    notes:
      "Esse slide ancora o conceito antes de entrar no fluxo técnico. A spec não substitui a análise de requisitos — ela é o next step dela. O que o SDD propõe é formalizar esse segundo passo, que hoje quase sempre é pulado: o engenheiro recebe o resultado da análise (às vezes só uma conversa no Teams) e vai direto para o código, carregando toda a ambiguidade.",
    sources: ["claude_memory", "bundles", "lakeflow_best_practices"],
  },
  {
    layout: "flow",
    kicker: "SDD NA PRATICA",
    title: "Um pedido vira contrato antes de virar código",
    subtitle:
      "Esse é o ponto central do ganho: menos suposição, menos ida e volta, mais padrão na entrega.",
    steps: [
      ["Pedido", "Ex.: consolidar pedidos pagos em analytics.silver.orders"],
      ["Spec", "Objetivo, fonte, alvo, grain, incrementalidade e checks"],
      ["Build", "Claude gera SQL ou PySpark, bundle, job ou pipeline"],
      ["Validate", "Testes, reconciliação e impacto downstream"],
      ["Run", "Backfill, rollback, monitoramento e custo"],
    ],
    notes:
      "Explicar que SDD não elimina conversa. Ele faz a conversa produzir um artefato reutilizável e executável.",
    sources: ["bundles", "lakeflow_best_practices", "lakeflow_sdp"],
  },
  {
    layout: "example",
    kicker: "EXEMPLO DE SPEC",
    title: "Spec curta para uma silver table no Databricks",
    subtitle:
      "Sem isso, Claude precisa adivinhar. Com isso, ele executa com muito mais precisão.",
    leftLabel: "SPEC",
    leftText:
      "Objetivo: consolidar pedidos pagos\nFonte: bronze.orders_events\nDestino: analytics.silver.orders\nGrain: 1 linha por order_id\nIncremental: MERGE por order_id\nLate data: reprocessar 7 dias\nQualidade:\n- order_id único\n- paid_at não nulo\n- total_amount >= 0\nAceite: divergência diária < 0,5%",
    rightLabel: "SAÍDA ESPERADA DO CLAUDE",
    rightText:
      "1. Estrutura de bundle, job ou pipeline\n2. SQL ou PySpark com MERGE e chaves corretas\n3. Regras de qualidade e reconciliação\n4. Backfill, rollback e riscos downstream",
    notes:
      "Mostrar que a spec é simples, mas suficiente para reduzir ambiguidade.",
    sources: ["bundles", "lakeflow_sdp", "lakeflow_best_practices"],
  },
  {
    layout: "example",
    kicker: "ANTES X DEPOIS",
    title: "O jeito de pedir muda a qualidade da entrega",
    subtitle:
      "A mesma demanda pode gerar retrabalho ou gerar uma entrega muito mais previsível.",
    leftLabel: "PEDIDO VAGO",
    leftText:
      "Cria uma pipeline para pedidos pagos no Databricks.\n\nProblemas:\n- não diz fonte\n- não diz alvo\n- não diz grain\n- não diz incremental\n- não diz checks\n- não diz aceite",
    rightLabel: "PEDIDO COM SPEC",
    rightText:
      "Criar analytics.silver.orders a partir de bronze.orders_events.\n\n1 linha por order_id\nMERGE por order_id\nLate data de 7 dias\nChecks: unicidade, not null, total >= 0\nSaída com bundle, validação e rollback",
    notes:
      "Esse slide ajuda a vender SDD como mudança de processo, não apenas de ferramenta.",
    sources: ["bundles", "lakeflow_best_practices"],
  },
  {
    layout: "example",
    kicker: "PROMPTING OPERACIONAL",
    title: "A melhor forma de usar IA é ancorar em artefatos",
    subtitle:
      "Prompt bom em engenharia de dados quase sempre referencia spec, regras e formato de saída.",
    leftLabel: "PROMPT FRACO",
    leftText:
      "Gera o código para essa pipeline no Databricks.\n\nProblema:\n- o Claude precisa adivinhar a maior parte do contexto\n- a saída varia demais\n- review fica mais caro",
    rightLabel: "PROMPT BOM",
    rightText:
      "Implemente a spec abaixo.\nSe houver lacunas, liste antes de codar.\nDepois entregue:\n1. bundle ou pipeline\n2. SQL ou PySpark\n3. validação\n4. riscos\n5. backfill e rollback",
    notes:
      "Fazer a ligação entre SDD e prompting. A spec é o artefato que estabiliza a conversa.",
    sources: ["claude_memory", "bundles"],
  },
  {
    layout: "section",
    kicker: "SESSAO 3",
    sectionNumber: "03",
    title: "CLAUDE.md, rules e memory",
    subtitle:
      "Depois do spec, o segundo ganho vem do contexto persistente: regras do projeto, memória do time e organização do repositório.",
    topics: [
      "Separar arquivo, regra e mecanismo",
      "Modularizar contexto com imports",
      "Padrão reutilizável por repositório",
    ],
    notes:
      "Esse separador prepara o público para a parte mais conceitual sobre memória persistente e organização do contexto.",
    sources: ["claude_memory", "claude_settings", "claude_slash"],
  },
  {
    layout: "cards",
    kicker: "CLAUDE.MD, RULES, MEMORY",
    title: "Esses termos se conectam, mas não significam a mesma coisa",
    subtitle:
      "Quando separam bem arquivo, conteúdo e mecanismo de carga, o uso do Claude deixa de ser improvisado.",
    cards: [
      [
        "CLAUDE.md",
        "É o arquivo onde ficam as instruções persistentes do projeto ou do usuário.",
      ],
      [
        "Rules",
        "São as regras operacionais. Podem ficar no próprio CLAUDE.md ou em rules.md importado com @imports.",
      ],
      [
        "Memory",
        "É o mecanismo de carga por escopo. memory.md pode guardar decisões do time e ser importado no CLAUDE.md.",
      ],
    ],
    notes:
      "Explicar também que /init ajuda a criar o CLAUDE.md do projeto, # grava memória rápida e @imports modularizam o arquivo.",
    sources: ["claude_memory", "claude_settings", "claude_slash"],
  },
  {
    layout: "example",
    kicker: "EXEMPLO DE CLAUDE.MD",
    title: "Um CLAUDE.md bom é curto, específico e acionável",
    subtitle:
      "O objetivo não é ter um manifesto enorme. É orientar consistentemente o comportamento do Claude.",
    leftLabel: "CLAUDE.MD DE EXEMPLO",
    leftText:
      "## Working mode\n- spec first\n- não assumir schema\n- listar lacunas antes de codar\n\n## Databricks defaults\n- preferir bundle\n- usar Unity Catalog\n- separar bronze, silver e gold\n\n## Response\n1. spec summary\n2. implementation\n3. validation\n4. rollback",
    rightLabel: "EFEITO PRÁTICO",
    rightText:
      "Padroniza a resposta do Claude\nReduz esquecimentos em toda mudança\nAcelera review técnico\nFacilita onboarding do time\nPermite evoluir o padrão por repositório",
    notes:
      "Aqui vale mostrar o arquivo real que ficou nos artefatos de apoio.",
    sources: ["claude_memory", "bundles", "unity_catalog"],
  },
  {
    layout: "example",
    kicker: "ARQUITETURA DE ARQUIVOS",
    title: "Como organizar CLAUDE.md, rules.md e memory.md no repo",
    subtitle:
      "rules.md e memory.md podem ser convenções do time importadas pelo CLAUDE.md para manter o contexto modular.",
    leftLabel: "ESTRUTURA DE EXEMPLO",
    leftText:
      ".\n|- CLAUDE.md\n|- docs/\n|  |- rules.md\n|  |- memory.md\n|- .claude/\n|  |- agents/\n|     |- databricks-platform.md\n|     |- api-backend.md\n|     |- spark-tuning.md",
    rightLabel: "CLAUDE.MD (USANDO IMPORTS)",
    rightText:
      "# Instruções base\n- spec first\n- responder com validação e rollback\n\n# Importar contexto modular\n@docs/rules.md\n@docs/memory.md\n\n# Agentes do projeto\n- usar /agents para criar e manter",
    notes:
      "Mensagem chave: rules.md e memory.md não são obrigatórios do produto; são convenções úteis quando o time quer modularizar contexto.",
    sources: ["claude_memory", "claude_slash", "claude_subagents"],
  },
  {
    layout: "section",
    kicker: "SESSAO 4",
    sectionNumber: "04",
    title: "Agentes e especialização",
    subtitle:
      "Agentes resolvem a próxima etapa de escala: distribuir responsabilidades sem perder o contrato central da entrega.",
    topics: [
      "Como criar agentes",
      "Como definir skills na prática",
      "Uso explícito e delegação automática",
    ],
    notes:
      "Entrar nesta sessão reforçando que agente não é um prompt gigante; é uma unidade reutilizável de especialização.",
    sources: ["claude_subagents", "claude_slash", "claude_settings"],
  },
  {
    layout: "flow",
    kicker: "CRIACAO E USO DE AGENTES",
    title: "Passo a passo para criar e usar agentes específicos",
    subtitle:
      "Em vez de improvisar prompts longos, padronize agentes por responsabilidade e ferramenta.",
    steps: [
      ["Mapear tarefa", "Ex.: tuning Spark, API backend, review de qualidade de dados"],
      ["Criar agente", "Usar /agents e definir nome, descrição, prompt e escopo"],
      ["Restringir tools", "Liberar apenas o necessário: Read, Grep, Bash ou full quando fizer sentido"],
      ["Testar uso", "Invocar em tarefa real e revisar se a saída segue o contrato esperado"],
      ["Evoluir", "Ajustar prompt e limites com base em incidentes, retrabalho e qualidade"],
    ],
    notes:
      "Referenciar /agents e reforçar que agentes reduzem ruído de contexto quando são bem focados.",
    sources: ["claude_subagents", "claude_slash"],
  },
  {
    layout: "example",
    kicker: "EXEMPLO DE CRIACAO",
    title: "Exemplo concreto de criação de um agente",
    subtitle:
      "O time pode criar agentes pela interface ou diretamente por arquivo Markdown com frontmatter.",
    leftLabel: "CRIAÇÃO VIA /AGENTS",
    leftText:
      "1. Rodar /agents\n2. Escolher Create New Agent\n3. Selecionar project-level\n4. Name: spark-tuning\n5. Description: Use proactively para tuning Spark\n6. Tools: Read, Grep, Bash\n7. Salvar e testar",
    rightLabel: "CRIAÇÃO VIA ARQUIVO",
    rightText:
      ".claude/agents/spark-tuning.md\n\n---\nname: spark-tuning\ndescription: Use proactively para tuning Spark\ntools: Read, Grep, Bash\n---\n\nVocê revisa shuffle, skew, merge, explain plan e custo.",
    notes:
      "Esse slide resolve a lacuna principal: mostrar literalmente como o agente nasce.",
    sources: ["claude_subagents", "claude_slash"],
  },
  {
    layout: "example",
    kicker: "IMPLEMENTACAO VIA API",
    title: "Para quem constrói produtos: agentes via Anthropic API",
    subtitle:
      "Além do Claude Code, é possível criar e orquestrar agentes diretamente pela API — para pipelines automatizados e produtos internos.",
    leftLabel: "CRIAR AGENTE (UMA VEZ)",
    leftText:
      "agent = client.beta.agents.create(\n  name='data-quality-reviewer',\n  model='claude-opus-4-7',\n  system='Você revisa checks, '\n         'reconciliação e rollback.',\n  tools=[{\n    'type': 'agent_toolset_20260401'\n  }]\n)\n# Guardar agent.id para reutilizar",
    rightLabel: "INICIAR SESSÃO (CADA EXECUÇÃO)",
    rightText:
      "session = client.beta.sessions.create(\n  agent=agent.id,\n  environment_id=env.id\n)\n\nclient.beta.sessions.events.send(\n  session.id,\n  events=[{\n    'type': 'user.message',\n    'content': [{\n      'type': 'text',\n      'text': spec_texto\n    }]\n  }]\n)",
    notes:
      "Diferenciar os dois contextos para o time técnico: Claude Code serve o engenheiro no dia a dia; a API serve quem quer embutir agentes em pipelines, produtos internos ou automações recorrentes. O objeto agent é persistente e versionado — criar uma vez, reutilizar sempre.",
    sources: ["claude_subagents", "claude_settings"],
  },
  {
    layout: "example",
    kicker: "ANATOMIA DO AGENTE",
    title: "A skill do agente nasce de três elementos combinados",
    subtitle:
      "Não existe campo formal chamado skill. A especialização vem da combinação de gatilho, escopo de ferramenta e prompt.",
    leftLabel: "ARQUIVO DE AGENTE",
    leftText:
      "---\nname: spark-tuning\ndescription: Use proactively para analisar\ncusto e performance em Spark\ntools: Read, Grep, Bash\n---\n\nVocê é especialista em Spark no Databricks.\nSempre revise partitions, shuffle, skew,\nmerge strategy, explain plan e custo.",
    rightLabel: "OS TRÊS ELEMENTOS",
    rightText:
      "DESCRIPTION\nDefine quando o agente é acionado.\nUma boa descrição melhora a delegação automática.\n\nTOOLS\nDefinem o alcance. Tuning não precisa\nescrever — apenas Read, Grep e Bash.\n\nPROMPT\nDefine o que ele sabe, como raciocina\ne o formato da resposta esperada.",
    notes:
      "Slide unificado: anatomia do agente com o arquivo real e os três elementos que definem a skill. Reforçar que agente não é super prompt — é especialização reutilizável com contexto próprio.",
    sources: ["claude_subagents", "claude_settings"],
  },
  {
    layout: "example",
    kicker: "EXEMPLO DE USO",
    title: "Exemplo concreto de uso explícito e uso automático",
    subtitle:
      "Depois de criado, o agente pode ser chamado diretamente ou acionado pelo Claude quando a tarefa combina com a descrição.",
    leftLabel: "USO EXPLÍCITO",
    leftText:
      "> Use the spark-tuning subagent to inspect the MERGE in analytics.silver.orders and point out shuffle, skew and partition risks.\n\nSaída esperada:\n- hipóteses\n- checks\n- recomendações\n- risco das mudanças",
    rightLabel: "USO AUTOMÁTICO",
    rightText:
      "Pedido principal:\n> Implemente a spec abaixo no Databricks e faça review de qualidade antes do merge.\n\nSe a descrição dos agentes estiver boa, Claude pode delegar para:\n- databricks-platform\n- data-quality-reviewer",
    notes:
      "Mensagem importante: agente pode ser invocado explicitamente ou usado automaticamente conforme a tarefa.",
    sources: ["claude_subagents"],
  },
  {
    layout: "quad",
    kicker: "CATALOGO DE AGENTES",
    title: "Um conjunto inicial de agentes faz sentido para o seu stack",
    subtitle:
      "Não crie um agente generalista para tudo. Crie agentes com responsabilidade clara.",
    quadCards: [
      [
        "databricks-platform",
        "Cuida de bundles, Lakeflow Jobs, declarative pipelines, UC paths e deploy por ambiente.",
      ],
      [
        "api-backend",
        "Implementa APIs para consulta, serviço de metadados, autenticação, contratos e documentação.",
      ],
      [
        "spark-tuning",
        "Analisa shuffle, skew, partições, merge, storage layout e custo de execução.",
      ],
      [
        "data-quality-reviewer",
        "Revisa checks, impacto downstream, reconciliação, rollback e sinais de falha silenciosa.",
      ],
    ],
    notes:
      "Conectar com a fala do usuário: Databricks, desenvolvimento de API e tuning.",
    sources: ["claude_subagents", "claude_slash", "bundles", "lakeflow_jobs", "lakeflow_sdp"],
  },
  {
    layout: "section",
    kicker: "SESSAO 5",
    sectionNumber: "05",
    title: "Casos de ganho e produtividade",
    subtitle:
      "Com contexto e agentes definidos, a conversa muda de teoria para ganho concreto em Databricks, APIs, tuning e qualidade.",
    topics: [
      "Databricks e padrão de plataforma",
      "API backend como acelerador de consumo",
      "Tuning, review e documentação",
    ],
    notes:
      "Esta sessão responde diretamente onde a IA aumenta produtividade no trabalho cotidiano.",
    sources: ["bundles", "lakeflow_jobs", "lakeflow_best_practices"],
  },
  {
    layout: "quad",
    kicker: "DATABRICKS COM IA",
    title: "No Databricks, a IA ajuda mais onde a plataforma exige padrão",
    subtitle:
      "Quanto mais repetitivo e estruturado o trabalho, maior tende a ser o ganho de produtividade.",
    quadCards: [
      [
        "Bundles e deploy",
        "Cria targets, estrutura de projeto, jobs e parâmetros com muito menos trabalho manual.",
      ],
      [
        "Lakeflow e pipelines",
        "Acelera criação de pipeline, ingestão incremental, contratos e validações.",
      ],
      [
        "Unity Catalog e nomenclatura",
        "Ajuda a padronizar paths, objetos e impacto entre ambientes e camadas.",
      ],
      [
        "Troubleshooting",
        "Resume logs, levanta hipóteses e guia a investigação de falhas com mais rapidez.",
      ],
    ],
    notes:
      "Conectar IA com disciplina de plataforma. Onde existe padrão, existe mais oportunidade de automação segura.",
    sources: ["bundles", "lakeflow_jobs", "lakeflow_sdp", "unity_catalog"],
  },
  {
    layout: "cards",
    kicker: "API BACKEND COM IA",
    title: "Desenvolvimento de API também fica mais rápido e mais consistente",
    subtitle:
      "IA ajuda tanto no scaffold quanto no contrato, no teste e na documentação do serviço.",
    cards: [
      [
        "Contrato e endpoint",
        "Acelera definição de request, response, filtros, erros, autenticação e documentação.",
      ],
      [
        "Implementação",
        "Ajuda a gerar handlers, serviços, validadores, testes e exemplos de uso mais rapidamente.",
      ],
      [
        "Review técnico",
        "Revisa breaking changes, casos de erro, observabilidade e impacto em consumidores.",
      ],
    ],
    notes:
      "Amarrar com o agente api-backend e com o stack do time quando houver serviços de apoio ao dado.",
    sources: ["claude_subagents", "claude_memory"],
  },
  {
    layout: "cards",
    kicker: "SPARK TUNING COM IA",
    title: "Tuning não vira automático, mas a IA reduz o tempo de análise",
    subtitle:
      "Ela ajuda a organizar hipóteses, interpretar sinais e sugerir verificações com muito mais velocidade.",
    cards: [
      [
        "Hipóteses mais rápidas",
        "Aponta suspeitas em shuffle, skew, joins, merge, partições e storage layout.",
      ],
      [
        "Checklist técnico",
        "Lembra explain plan, tamanho de arquivo, cardinalidade, repartition e estratégia incremental.",
      ],
      [
        "Comparação de opções",
        "Ajuda a pesar ganho esperado, custo e risco antes de mexer em pipeline crítica.",
      ],
    ],
    notes:
      "Mensagem importante: IA não substitui conhecimento de Spark, mas acelera a investigação e o raciocínio.",
    sources: ["claude_subagents", "lakeflow_best_practices"],
  },
  {
    layout: "cards",
    kicker: "CUSTO, RISCO E CONTROLE",
    title: "Ganho real exige entender também o custo e o risco",
    subtitle:
      "Usar IA sem clareza sobre custo operacional e pontos de falha é trocar um problema por outro.",
    cards: [
      [
        "Custo de uso",
        "Claude cobra por token. Contexto longo, agentes em loop e reprocessamento aumentam o custo. Medir desde o piloto.",
      ],
      [
        "Risco de erro",
        "Claude pode gerar código plausível mas incorreto. Review humano continua obrigatório, especialmente em schemas novos.",
      ],
      [
        "Controle e rastreabilidade",
        "Toda saída do Claude deve passar por PR, checklist e review antes de merge. IA acelera; o engenheiro decide.",
      ],
    ],
    notes:
      "Esse slide antecipa a objeção mais comum de times técnicos: quanto custa e o que acontece quando erra? Responder antes de perguntarem aumenta credibilidade da proposta. Enfatizar que o controle não é opcional — é parte do modelo.",
    sources: ["claude_memory", "lakeflow_best_practices"],
  },
  {
    layout: "cards",
    kicker: "REVIEW, QUALIDADE E DOCS",
    title: "Boa parte do ganho vem do que normalmente fica para depois",
    subtitle:
      "IA reduz o custo de fazer o que o time sabe que deveria fazer, mas muitas vezes posterga.",
    cards: [
      [
        "Qualidade e validação",
        "Acelera escrita de checks, reconciliação, cenários de teste e critério de aceite.",
      ],
      [
        "Documentação",
        "Ajuda a manter runbooks, notas de deploy, README e contexto técnico atualizados.",
      ],
      [
        "Code review",
        "Funciona como revisor inicial para risco operacional, regressão e impacto downstream.",
      ],
    ],
    notes:
      "Esse slide sustenta a tese de produtividade total, não apenas de implementação.",
    sources: ["claude_memory", "lakeflow_best_practices", "unity_catalog"],
  },
  {
    layout: "section",
    kicker: "SESSAO 6",
    sectionNumber: "06",
    title: "Adocao, guardrails e piloto",
    subtitle:
      "Fechamos com a parte operacional: como usar vários agentes, medir ganho real e fazer um rollout seguro no time.",
    topics: [
      "Fluxo multiagente controlado",
      "Antipadrões e métricas certas",
      "Rollout pequeno, medido e reversível",
    ],
    notes:
      "Separador do bloco final, voltado a governança, medição e próxima etapa prática.",
    sources: ["claude_memory", "claude_subagents", "lakeflow_best_practices"],
  },
  {
    layout: "flow",
    kicker: "FLUXO MULTIAGENTE",
    title: "Exemplo de entrega quebrada por especialidade",
    subtitle:
      "Uma demanda real pode passar por vários agentes sem perder o contrato central da spec.",
    steps: [
      ["Engenheiro + Claude", "Fecha ambiguidades e produz a spec com grain, checks e aceite"],
      ["databricks-platform", "Cria bundle, pipeline, SQL ou PySpark no padrão do repo"],
      ["api-backend", "Expõe endpoints ou serviços quando a entrega precisa consumo online"],
      ["spark-tuning", "Revisa custo e performance antes de promover para produção"],
      ["data-quality-reviewer", "Valida checks, backfill e rollback antes do merge"],
    ],
    notes:
      "Mensagem importante: a spec continua sendo a fonte de verdade entre os agentes.",
    sources: ["claude_subagents", "bundles", "lakeflow_best_practices"],
  },
  {
    layout: "cards",
    kicker: "REGRAS PRATICAS",
    title: "Não transforme agentes em bagunça automatizada",
    subtitle:
      "Produtividade com IA em dados exige recorte claro de responsabilidade e guardrails simples.",
    cards: [
      [
        "Um agente, um foco",
        "Evite agentes enciclopédicos. O ganho vem de responsabilidade nítida e descrição específica.",
      ],
      [
        "Ferramentas mínimas",
        "Dê ao agente apenas o que ele precisa. Isso melhora segurança, foco e previsibilidade.",
      ],
      [
        "Tudo volta para a spec",
        "Mesmo com vários agentes, validação, riscos, backfill e rollback continuam obrigatórios.",
      ],
    ],
    notes:
      "Esse slide responde à objeção natural: isso não vai virar bagunça?",
    sources: ["claude_subagents", "claude_memory", "lakeflow_best_practices"],
  },
  {
    layout: "cards",
    kicker: "ANTIPADROES",
    title: "Os erros mais comuns quando um time começa a usar IA",
    subtitle:
      "Quase todos os fracassos iniciais vêm de falta de processo, não de falta de modelo.",
    cards: [
      [
        "Pedir código sem contexto",
        "Sem spec, o time recebe uma resposta aparentemente boa, mas com risco alto escondido.",
      ],
      [
        "Delegar tudo para um agente",
        "Generalismo demais polui contexto e reduz a qualidade técnica da saída.",
      ],
      [
        "Não medir",
        "Sem baseline, qualquer sensação de ganho ou perda vira opinião em vez de evidência.",
      ],
    ],
    notes:
      "Esse slide ajuda a antecipar resistência e mostrar maturidade na proposta.",
    sources: ["claude_memory", "claude_subagents"],
  },
  {
    layout: "metrics",
    kicker: "COMO MEDIR",
    title: "Produtividade precisa ser medida em fluxo, qualidade e operação",
    subtitle:
      "Baseline via GitLab ou Jira antes do piloto. Medir as mesmas entregas com e sem IA por pelo menos 2 semanas.",
    metrics: [
      ["Lead time", "Demanda ao merge — coletar via GitLab MR open/close date", "baseline: média das últimas 10 entregas similares"],
      ["Retrabalho", "MRs reabertos ou com mais de 2 rounds de review", "baseline: % de MRs com comentários de correção obrigatórios"],
      ["Incidentes", "Falhas pós-deploy: rollback, alerta ou quebra downstream", "baseline: incidentes por sprint nas últimas 4 sprints"],
    ],
    notes:
      "A diferença deste slide é mostrar COMO medir, não apenas O QUE medir. Baseline via GitLab ou Jira é obrigatório antes de rodar o piloto. Sem baseline, qualquer resultado vira opinião.",
    sources: ["lakeflow_best_practices", "claude_memory"],
  },
  {
    layout: "cards",
    kicker: "LIMITACOES DO CLAUDE",
    title: "IA erra. Saber onde evita surpresa em produção",
    subtitle:
      "Reconhecer os limites não enfraquece a proposta — mostra que a adoção está sendo pensada com seriedade.",
    cards: [
      [
        "Schemas desconhecidos",
        "Sem CLAUDE.md ou spec, Claude inventa campos, tipos e nomes plausíveis mas incorretos. Contexto é obrigatório.",
      ],
      [
        "Lógica de negócio complexa",
        "Regras de reconciliação, late data e SLA dependem de decisão humana. Claude sugere; o engenheiro valida.",
      ],
      [
        "Contexto muito longo",
        "Acima de certo volume de contexto, a qualidade da resposta cai. Agentes especializados existem exatamente para isso.",
      ],
    ],
    notes:
      "Esse slide aumenta a credibilidade da proposta com o time técnico. Quem propõe IA sem mencionar limitações perde confiança. Mostrar que o processo SDD + review + checklist existe justamente para cobrir esses pontos cegos.",
    sources: ["claude_memory", "claude_subagents", "lakeflow_best_practices"],
  },
  {
    layout: "flow",
    kicker: "ROLL OUT",
    title: "Um rollout bom começa pequeno e cresce por evidências",
    subtitle:
      "A pior forma de adotar IA é tentar mudar o time inteiro ao mesmo tempo e sem guardrails.",
    steps: [
      ["Escolher caso", "Selecionar uma entrega com dor real e escopo controlado"],
      ["Fixar artefatos", "CLAUDE.md, spec, checklist e agentes mínimos"],
      ["Executar piloto", "Rodar uma janela curta com comparação de fluxo anterior"],
      ["Medir resultado", "Lead time, retrabalho, incidentes e satisfação do time"],
      ["Padronizar", "Expandir apenas o que realmente melhorou com segurança"],
    ],
    notes:
      "Mensagem executiva: adoção boa é incremental, mensurada e reversível.",
    sources: ["claude_memory", "claude_subagents", "lakeflow_best_practices"],
  },
  {
    layout: "metrics",
    kicker: "PILOTO PROPOSTO",
    title: "Próxima etapa: um piloto pequeno, medido e reversível",
    subtitle:
      "A melhor forma de convencer o time é provar em um fluxo real, com critérios objetivos.",
    metrics: [
      ["1", "Caso piloto", "preferir uma silver ou gold com dor real"],
      ["4", "Artefatos base", "CLAUDE.md, spec, checklist e agentes"],
      ["2 sem.", "Janela inicial", "medir lead time, retrabalho e incidentes"],
    ],
    notes:
      "Fechar com algo prático: um caso, poucos artefatos, janela curta e métricas de comparação.",
    sources: ["bundles", "lakeflow_best_practices", "claude_subagents"],
  },
  {
    layout: "section",
    kicker: "FECHAMENTO",
    sectionNumber: "→",
    title: "Qual caso real faz mais sentido para começar?",
    subtitle:
      "Não estamos propondo IA sem controle. Estamos propondo um jeito melhor de transformar demanda em entrega.",
    topics: [
      "Artefatos disponíveis em /artefatos",
      "CLAUDE.md, spec-template, checklist-pr",
      "Agentes prontos em .claude/agents/",
    ],
    notes:
      "Abrir a conversa com a pergunta central: qual caso real do nosso contexto faz mais sentido para provar ganho de produtividade sem elevar risco operacional? Não fechar com slide — fechar com pergunta e silêncio para o time responder.",
    sources: ["claude_memory", "claude_subagents", "bundles"],
  },
  {
    layout: "cover",
    kicker: "OBRIGADO",
    title: "Perguntas e próximos passos",
    subtitle:
      "Artefatos disponíveis em /artefatos: CLAUDE.md, spec-template, checklist-pr e agentes prontos para uso.",
    moment: "Spec primeiro. Código depois.",
    notes:
      "Slide de encerramento. Deixar no ar enquanto a conversa acontece. Reforçar que todos os artefatos apresentados estão disponíveis e prontos para uso no piloto.",
    sources: ["claude_memory", "claude_subagents", "bundles", "lakeflow_best_practices"],
  },
];

const inspectRecords = [];

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readImageBlob(imagePath) {
  const bytes = await fs.readFile(imagePath);
  if (!bytes.byteLength) {
    throw new Error(`Image file is empty: ${imagePath}`);
  }
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

async function normalizeImageConfig(config) {
  if (!config.path) {
    return config;
  }
  const { path: imagePath, ...rest } = config;
  return {
    ...rest,
    blob: await readImageBlob(imagePath),
  };
}

async function ensureDirs() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const obsoleteFinalArtifacts = [
    "preview",
    "verification",
    "inspect.ndjson",
    ["presentation", "proto.json"].join("_"),
    ["quality", "report.json"].join("_"),
  ];
  for (const obsolete of obsoleteFinalArtifacts) {
    await fs.rm(path.join(OUT_DIR, obsolete), { recursive: true, force: true });
  }
  await fs.mkdir(SCRATCH_DIR, { recursive: true });
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  await fs.mkdir(VERIFICATION_DIR, { recursive: true });
}

function lineConfig(fill = TRANSPARENT, width = 0) {
  return { style: "solid", fill, width };
}

function recordShape(slideNo, shape, role, shapeType, x, y, w, h) {
  if (!slideNo) return;
  inspectRecords.push({
    kind: "shape",
    slide: slideNo,
    id: shape?.id || `slide-${slideNo}-${role}-${inspectRecords.length + 1}`,
    role,
    shapeType,
    bbox: [x, y, w, h],
  });
}

function addShape(slide, geometry, x, y, w, h, fill = TRANSPARENT, line = TRANSPARENT, lineWidth = 0, meta = {}) {
  const shape = slide.shapes.add({
    geometry,
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: lineConfig(line, lineWidth),
  });
  recordShape(meta.slideNo, shape, meta.role || geometry, geometry, x, y, w, h);
  return shape;
}

function normalizeText(text) {
  if (Array.isArray(text)) {
    return text.map((item) => String(item ?? "")).join("\n");
  }
  return String(text ?? "");
}

function textLineCount(text) {
  const value = normalizeText(text);
  if (!value.trim()) {
    return 0;
  }
  return Math.max(1, value.split(/\n/).length);
}

function requiredTextHeight(text, fontSize, lineHeight = 1.18, minHeight = 8) {
  const lines = textLineCount(text);
  if (lines === 0) {
    return minHeight;
  }
  return Math.max(minHeight, lines * fontSize * lineHeight);
}

function assertTextFits(text, boxHeight, fontSize, role = "text") {
  const required = requiredTextHeight(text, fontSize);
  const tolerance = Math.max(2, fontSize * 0.08);
  if (normalizeText(text).trim() && boxHeight + tolerance < required) {
    throw new Error(
      `${role} text box is too short: height=${boxHeight.toFixed(1)}, required>=${required.toFixed(1)}, ` +
        `lines=${textLineCount(text)}, fontSize=${fontSize}, text=${JSON.stringify(normalizeText(text).slice(0, 90))}`,
    );
  }
}

function wrapText(text, widthChars) {
  const words = normalizeText(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > widthChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines.join("\n");
}

function recordText(slideNo, shape, role, text, x, y, w, h) {
  const value = normalizeText(text);
  inspectRecords.push({
    kind: "textbox",
    slide: slideNo,
    id: shape?.id || `slide-${slideNo}-${role}-${inspectRecords.length + 1}`,
    role,
    text: value,
    textPreview: value.replace(/\n/g, " | ").slice(0, 180),
    textChars: value.length,
    textLines: textLineCount(value),
    bbox: [x, y, w, h],
  });
}

function recordImage(slideNo, image, role, imagePath, x, y, w, h) {
  inspectRecords.push({
    kind: "image",
    slide: slideNo,
    id: image?.id || `slide-${slideNo}-${role}-${inspectRecords.length + 1}`,
    role,
    path: imagePath,
    bbox: [x, y, w, h],
  });
}

function applyTextStyle(box, text, size, color, bold, face, align, valign, autoFit, listStyle) {
  box.text = text;
  box.text.fontSize = size;
  box.text.color = color;
  box.text.bold = Boolean(bold);
  box.text.alignment = align;
  box.text.verticalAlignment = valign;
  box.text.typeface = face;
  box.text.insets = { left: 0, right: 0, top: 0, bottom: 0 };
  if (autoFit) {
    box.text.autoFit = autoFit;
  }
  if (listStyle) {
    box.text.style = "list";
  }
}

function addText(
  slide,
  slideNo,
  text,
  x,
  y,
  w,
  h,
  {
    size = 22,
    color = INK,
    bold = false,
    face = BODY_FACE,
    align = "left",
    valign = "top",
    fill = TRANSPARENT,
    line = TRANSPARENT,
    lineWidth = 0,
    autoFit = null,
    listStyle = false,
    checkFit = true,
    role = "text",
  } = {},
) {
  if (!checkFit && textLineCount(text) > 1) {
    throw new Error("checkFit=false is only allowed for single-line headers, footers, and captions.");
  }
  if (checkFit) {
    assertTextFits(text, h, size, role);
  }
  const box = addShape(slide, "rect", x, y, w, h, fill, line, lineWidth);
  applyTextStyle(box, text, size, color, bold, face, align, valign, autoFit, listStyle);
  recordText(slideNo, box, role, text, x, y, w, h);
  return box;
}

async function addImage(slide, slideNo, config, position, role, sourcePath = null) {
  const image = slide.images.add(await normalizeImageConfig(config));
  image.position = position;
  recordImage(slideNo, image, role, sourcePath || config.path || config.uri || "inline-data-url", position.left, position.top, position.width, position.height);
  return image;
}

function addAmbientBackground(slide, slideNo) {
  slide.background.fill = PAPER;
  addShape(slide, "rect", 0, 0, W, H, PAPER, TRANSPARENT, 0, { slideNo, role: "background base" });
  addShape(slide, "rect", 930, 0, 350, H, NAVY, TRANSPARENT, 0, { slideNo, role: "background rail" });
  addShape(slide, "ellipse", 875, 66, 300, 300, "#F45B3526", TRANSPARENT, 0, { slideNo, role: "background glow orange" });
  addShape(slide, "ellipse", 1018, 414, 212, 212, "#118D7B36", TRANSPARENT, 0, { slideNo, role: "background glow teal" });
  addShape(slide, "roundRect", 846, 158, 276, 356, NAVY_SOFT, TRANSPARENT, 0, { slideNo, role: "background panel" });

  const stripeY = 170 + (slideNo % 3) * 26;
  addShape(slide, "rect", 886, stripeY, 210, 10, ACCENT, TRANSPARENT, 0, { slideNo, role: "background stripe primary" });
  addShape(slide, "rect", 920, stripeY + 28, 176, 10, GOLD, TRANSPARENT, 0, { slideNo, role: "background stripe secondary" });
  addShape(slide, "rect", 954, stripeY + 56, 142, 10, TEAL, TRANSPARENT, 0, { slideNo, role: "background stripe tertiary" });

  for (let idx = 0; idx < 4; idx += 1) {
    addShape(slide, "ellipse", 1058, 110 + idx * 34, 10, 10, WHITE, TRANSPARENT, 0, { slideNo, role: "background dot" });
  }
}

async function addPlate(slide, slideNo, opacityPanel = false) {
  addAmbientBackground(slide, slideNo);
  const platePath = path.join(REF_DIR, `slide-${String(slideNo).padStart(2, "0")}.png`);
  if (await pathExists(platePath)) {
    await addImage(
      slide,
      slideNo,
      { path: platePath, fit: "cover", alt: `Text-free art-direction plate for slide ${slideNo}` },
      { left: 0, top: 0, width: W, height: H },
      "art plate",
      platePath,
    );
  } else {
    await addImage(
      slide,
      slideNo,
      { dataUrl: FALLBACK_PLATE_DATA_URL, fit: "cover", alt: `Fallback blank art plate for slide ${slideNo}` },
      { left: 0, top: 0, width: W, height: H },
      "fallback art plate",
      "fallback-data-url",
    );
  }
  if (opacityPanel) {
    addShape(slide, "rect", 0, 0, W, H, "#FFFFFFB8", TRANSPARENT, 0, { slideNo, role: "plate readability overlay" });
  }
}

function addHeader(slide, slideNo, kicker, idx, total) {
  addText(slide, slideNo, String(kicker || "").toUpperCase(), 64, 34, 430, 24, {
    size: 13,
    color: ACCENT_DARK,
    bold: true,
    face: MONO_FACE,
    checkFit: false,
    role: "header",
  });
  addText(slide, slideNo, `${String(idx).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, 1114, 34, 104, 24, {
    size: 13,
    color: ACCENT_DARK,
    bold: true,
    face: MONO_FACE,
    align: "right",
    checkFit: false,
    role: "header",
  });
  addShape(slide, "rect", 64, 64, 1152, 2, INK, TRANSPARENT, 0, { slideNo, role: "header rule" });
  addShape(slide, "ellipse", 57, 57, 16, 16, ACCENT, INK, 2, { slideNo, role: "header marker" });
}

function addTitleBlock(slide, slideNo, title, subtitle = null, x = 64, y = 86, w = 780, dark = false) {
  const titleColor = dark ? PAPER : INK;
  const bodyColor = dark ? PAPER : GRAPHITE;
  addText(slide, slideNo, title, x, y, w, 142, {
    size: 40,
    color: titleColor,
    bold: true,
    face: TITLE_FACE,
    role: "title",
  });
  if (subtitle) {
    addText(slide, slideNo, subtitle, x + 2, y + 148, Math.min(w, 720), 70, {
      size: 19,
      color: bodyColor,
      face: BODY_FACE,
      role: "subtitle",
    });
  }
}

function addIconBadge(slide, slideNo, x, y, accent = ACCENT, kind = "signal") {
  addShape(slide, "ellipse", x, y, 54, 54, PAPER_96, INK, 1.2, { slideNo, role: "icon badge" });
  if (kind === "flow") {
    addShape(slide, "ellipse", x + 13, y + 18, 10, 10, accent, INK, 1, { slideNo, role: "icon glyph" });
    addShape(slide, "ellipse", x + 31, y + 27, 10, 10, accent, INK, 1, { slideNo, role: "icon glyph" });
    addShape(slide, "rect", x + 22, y + 25, 19, 3, INK, TRANSPARENT, 0, { slideNo, role: "icon glyph" });
  } else if (kind === "layers") {
    addShape(slide, "roundRect", x + 13, y + 15, 26, 13, accent, INK, 1, { slideNo, role: "icon glyph" });
    addShape(slide, "roundRect", x + 18, y + 24, 26, 13, GOLD, INK, 1, { slideNo, role: "icon glyph" });
    addShape(slide, "roundRect", x + 23, y + 33, 20, 10, CORAL, INK, 1, { slideNo, role: "icon glyph" });
  } else {
    addShape(slide, "rect", x + 16, y + 29, 6, 12, accent, TRANSPARENT, 0, { slideNo, role: "icon glyph" });
    addShape(slide, "rect", x + 25, y + 21, 6, 20, accent, TRANSPARENT, 0, { slideNo, role: "icon glyph" });
    addShape(slide, "rect", x + 34, y + 14, 6, 27, accent, TRANSPARENT, 0, { slideNo, role: "icon glyph" });
  }
}

function addCard(slide, slideNo, x, y, w, h, label, body, { accent = ACCENT, fill = PAPER_96, line = INK, iconKind = "signal" } = {}) {
  if (h < 156) {
    throw new Error(`Card is too short for editable pro-deck copy: height=${h.toFixed(1)}, minimum=156.`);
  }
  addShape(slide, "roundRect", x, y, w, h, fill, line, 1.2, { slideNo, role: `card panel: ${label}` });
  addShape(slide, "rect", x, y, 8, h, accent, TRANSPARENT, 0, { slideNo, role: `card accent: ${label}` });
  addIconBadge(slide, slideNo, x + 22, y + 24, accent, iconKind);
  addText(slide, slideNo, label, x + 88, y + 22, w - 108, 28, {
    size: 15,
    color: ACCENT_DARK,
    bold: true,
    face: MONO_FACE,
    role: "card label",
  });
  const wrapped = wrapText(body, Math.max(28, Math.floor(w / 13)));
  const bodyY = y + 86;
  const bodyH = h - (bodyY - y) - 22;
  if (bodyH < 54) {
    throw new Error(`Card body area is too short: height=${bodyH.toFixed(1)}, cardHeight=${h.toFixed(1)}, label=${JSON.stringify(label)}.`);
  }
  addText(slide, slideNo, wrapped, x + 24, bodyY, w - 48, bodyH, {
    size: 17,
    color: INK,
    face: BODY_FACE,
    role: `card body: ${label}`,
  });
}

function addMetricCard(slide, slideNo, x, y, w, h, metric, label, note = null, accent = ACCENT) {
  if (h < 132) {
    throw new Error(`Metric card is too short for editable pro-deck copy: height=${h.toFixed(1)}, minimum=132.`);
  }
  addShape(slide, "roundRect", x, y, w, h, PAPER_96, INK, 1.2, { slideNo, role: `metric panel: ${label}` });
  addShape(slide, "rect", x, y, w, 7, accent, TRANSPARENT, 0, { slideNo, role: `metric accent: ${label}` });
  addText(slide, slideNo, metric, x + 22, y + 24, w - 44, 54, {
    size: 34,
    color: INK,
    bold: true,
    face: TITLE_FACE,
    role: "metric value",
  });
  addText(slide, slideNo, label, x + 24, y + 82, w - 48, 48, {
    size: 16,
    color: GRAPHITE,
    face: BODY_FACE,
    role: "metric label",
  });
  if (note) {
    addText(slide, slideNo, note, x + 24, y + h - 42, w - 48, 24, {
      size: 10,
      color: MUTED,
      face: BODY_FACE,
      role: "metric note",
    });
  }
}

function addCodePanel(slide, slideNo, x, y, w, h, label, text, { dark = false, accent = ACCENT } = {}) {
  const fill = dark ? NAVY : WHITE;
  const border = dark ? WHITE : INK;
  const labelColor = dark ? GOLD : ACCENT_DARK;
  const textColor = dark ? WHITE : INK;

  addShape(slide, "roundRect", x, y, w, h, fill, border, 1.2, { slideNo, role: `code panel: ${label}` });
  addShape(slide, "rect", x, y, w, 8, accent, TRANSPARENT, 0, { slideNo, role: `code panel accent: ${label}` });
  addText(slide, slideNo, label, x + 20, y + 18, w - 40, 24, {
    size: 13,
    color: labelColor,
    bold: true,
    face: MONO_FACE,
    role: `code panel label: ${label}`,
  });
  addText(slide, slideNo, text, x + 20, y + 58, w - 40, h - 78, {
    size: 13,
    color: textColor,
    face: MONO_FACE,
    role: `code panel text: ${label}`,
  });
}

function addCompactCard(slide, slideNo, x, y, w, h, label, body, accent = ACCENT, iconKind = "signal") {
  addShape(slide, "roundRect", x, y, w, h, PAPER_96, INK, 1.2, { slideNo, role: `compact card: ${label}` });
  addShape(slide, "rect", x, y, 8, h, accent, TRANSPARENT, 0, { slideNo, role: `compact card accent: ${label}` });
  addIconBadge(slide, slideNo, x + 18, y + 18, accent, iconKind);
  addText(slide, slideNo, label, x + 82, y + 18, w - 100, 26, {
    size: 14,
    color: ACCENT_DARK,
    bold: true,
    face: MONO_FACE,
    role: `compact card label: ${label}`,
  });
  addText(slide, slideNo, wrapText(body, Math.max(28, Math.floor(w / 13))), x + 20, y + 74, w - 40, h - 92, {
    size: 15,
    color: INK,
    face: BODY_FACE,
    role: `compact card body: ${label}`,
  });
}

function addStepTile(slide, slideNo, x, y, w, h, stepNumber, title, body, accent = ACCENT) {
  addShape(slide, "roundRect", x, y, w, h, WHITE, INK, 1.2, { slideNo, role: `step tile: ${title}` });
  addShape(slide, "ellipse", x + 18, y + 18, 36, 36, accent, INK, 1, { slideNo, role: `step badge: ${title}` });
  addText(slide, slideNo, String(stepNumber), x + 28, y + 26, 16, 16, {
    size: 14,
    color: WHITE,
    bold: true,
    face: MONO_FACE,
    role: `step number: ${title}`,
  });
  addText(slide, slideNo, title, x + 68, y + 18, w - 86, 28, {
    size: 15,
    color: ACCENT_DARK,
    bold: true,
    face: MONO_FACE,
    role: `step title: ${title}`,
  });
  addText(slide, slideNo, wrapText(body, Math.max(20, Math.floor(w / 13))), x + 20, y + 70, w - 40, h - 92, {
    size: 15,
    color: INK,
    face: BODY_FACE,
    role: `step body: ${title}`,
  });
}

function addNotes(slide, body, sourceKeys) {
  const sourceLines = (sourceKeys || []).map((key) => `- ${SOURCES[key] || key}`).join("\n");
  slide.speakerNotes.setText(`${body || ""}\n\n[Sources]\n${sourceLines}`);
}

function addReferenceCaption(slide, slideNo) {
  addText(
    slide,
    slideNo,
    "SDD para dados: especificação, implementação, validação e operação no mesmo fluxo. Artefatos: /artefatos — CLAUDE.md, spec-template, checklist-pr, agentes.",
    64,
    674,
    980,
    22,
    {
      size: 10,
      color: MUTED,
      face: BODY_FACE,
      checkFit: false,
      role: "caption",
    },
  );
}

async function slideCover(presentation) {
  const slideNo = 1;
  const data = SLIDES[0];
  const slide = presentation.slides.add();
  await addPlate(slide, slideNo);
  addShape(slide, "rect", 0, 0, 902, H, "#F5EFE6E4", TRANSPARENT, 0, { slideNo, role: "cover contrast overlay" });
  addShape(slide, "rect", 64, 86, 7, 455, ACCENT, TRANSPARENT, 0, { slideNo, role: "cover accent rule" });
  addText(slide, slideNo, data.kicker, 86, 88, 520, 26, {
    size: 13,
    color: ACCENT_DARK,
    bold: true,
    face: MONO_FACE,
    role: "kicker",
  });
  addText(slide, slideNo, data.title, 82, 130, 785, 184, {
    size: 48,
    color: INK,
    bold: true,
    face: TITLE_FACE,
    role: "cover title",
  });
  addText(slide, slideNo, data.subtitle, 86, 326, 610, 86, {
    size: 20,
    color: GRAPHITE,
    face: BODY_FACE,
    role: "cover subtitle",
  });
  addShape(slide, "roundRect", 86, 456, 390, 92, WHITE, INK, 1.2, { slideNo, role: "cover moment panel" });
  addText(slide, slideNo, data.moment || "Replace with core idea", 112, 478, 336, 40, {
    size: 23,
    color: INK,
    bold: true,
    face: TITLE_FACE,
    role: "cover moment",
  });
  addShape(slide, "roundRect", 954, 116, 220, 398, NAVY, WHITE, 1.2, { slideNo, role: "cover summary panel" });
  addText(slide, slideNo, "PILARES", 982, 148, 160, 24, {
    size: 13,
    color: GOLD,
    bold: true,
    face: MONO_FACE,
    role: "cover panel label",
  });
  addText(slide, slideNo, "1", 982, 198, 34, 42, {
    size: 32,
    color: WHITE,
    bold: true,
    face: TITLE_FACE,
    role: "cover panel number",
  });
  addText(slide, slideNo, "Spec clara", 1020, 204, 120, 32, {
    size: 18,
    color: WHITE,
    bold: true,
    face: BODY_FACE,
    role: "cover panel text",
  });
  addText(slide, slideNo, "2", 982, 278, 34, 42, {
    size: 32,
    color: WHITE,
    bold: true,
    face: TITLE_FACE,
    role: "cover panel number",
  });
  addText(slide, slideNo, "Código guiado", 1020, 284, 126, 32, {
    size: 18,
    color: WHITE,
    bold: true,
    face: BODY_FACE,
    role: "cover panel text",
  });
  addText(slide, slideNo, "3", 982, 358, 34, 42, {
    size: 32,
    color: WHITE,
    bold: true,
    face: TITLE_FACE,
    role: "cover panel number",
  });
  addText(slide, slideNo, "Operação prevista", 1020, 364, 138, 32, {
    size: 18,
    color: WHITE,
    bold: true,
    face: BODY_FACE,
    role: "cover panel text",
  });
  addReferenceCaption(slide, slideNo);
  addNotes(slide, data.notes, data.sources);
}

async function slideSection(presentation, idx) {
  const data = SLIDES[idx - 1];
  const slide = presentation.slides.add();
  await addPlate(slide, idx);
  addShape(slide, "rect", 0, 0, W, H, "#F5EFE6D8", TRANSPARENT, 0, { slideNo: idx, role: "section contrast overlay" });
  addShape(slide, "rect", 914, 88, 302, 544, NAVY_SOFT, TRANSPARENT, 0, { slideNo: idx, role: "section rail panel" });
  addHeader(slide, idx, data.kicker || "SESSAO", idx, SLIDES.length);
  addShape(slide, "rect", 64, 118, 8, 430, ACCENT, TRANSPARENT, 0, { slideNo: idx, role: "section accent rule" });
  addText(slide, idx, data.title, 92, 128, 706, 128, {
    size: 48,
    color: INK,
    bold: true,
    face: TITLE_FACE,
    role: "section title",
  });
  addText(slide, idx, data.subtitle || "", 94, 274, 682, 88, {
    size: 21,
    color: GRAPHITE,
    face: BODY_FACE,
    role: "section subtitle",
  });
  addText(slide, idx, data.sectionNumber || "", 958, 128, 190, 126, {
    size: 104,
    color: "#F5EFE68C",
    bold: true,
    face: TITLE_FACE,
    align: "right",
    checkFit: false,
    role: "section number",
  });
  addText(slide, idx, "NESTA SESSÃO", 954, 284, 196, 20, {
    size: 13,
    color: GOLD,
    bold: true,
    face: MONO_FACE,
    align: "right",
    checkFit: false,
    role: "section rail label",
  });
  const topics = data.topics || [];
  topics.forEach((topic, topicIdx) => {
    const baseY = 328 + topicIdx * 92;
    addShape(slide, "rect", 982, baseY - 12, 168, 2, GOLD, TRANSPARENT, 0, {
      slideNo: idx,
      role: "section topic rule",
    });
    addText(slide, idx, topic, 954, baseY, 196, 54, {
      size: 18,
      color: WHITE,
      face: BODY_FACE,
      align: "right",
      role: "section topic",
    });
  });
  addReferenceCaption(slide, idx);
  addNotes(slide, data.notes, data.sources);
}

async function slideCards(presentation, idx) {
  const data = SLIDES[idx - 1];
  const slide = presentation.slides.add();
  await addPlate(slide, idx);
  addShape(slide, "rect", 0, 0, 910, H, "#F5EFE6D8", TRANSPARENT, 0, { slideNo: idx, role: "content contrast overlay" });
  addHeader(slide, idx, data.kicker, idx, SLIDES.length);
  addTitleBlock(slide, idx, data.title, data.subtitle, 64, 86, 760);
  const cards = data.cards?.length
    ? data.cards
    : [
        ["Replace", "Add a specific, sourced point for this slide."],
        ["Author", "Use native PowerPoint chart objects for charts; use deterministic geometry for cards and callouts."],
        ["Verify", "Render previews, inspect them at readable size, and fix actionable layout issues within 3 total render loops."],
      ];
  const cols = Math.min(3, cards.length);
  const cardW = (1114 - (cols - 1) * 24) / cols;
  const iconKinds = ["signal", "flow", "layers"];
  for (let cardIdx = 0; cardIdx < cols; cardIdx += 1) {
    const [label, body] = cards[cardIdx];
    const x = 84 + cardIdx * (cardW + 24);
    addCard(slide, idx, x, 390, cardW, 214, label, body, { iconKind: iconKinds[cardIdx % iconKinds.length] });
  }
  addReferenceCaption(slide, idx);
  addNotes(slide, data.notes, data.sources);
}

async function slideMetrics(presentation, idx) {
  const data = SLIDES[idx - 1];
  const slide = presentation.slides.add();
  await addPlate(slide, idx);
  addShape(slide, "rect", 0, 0, 910, H, "#F5EFE6D8", TRANSPARENT, 0, { slideNo: idx, role: "metrics contrast overlay" });
  addHeader(slide, idx, data.kicker, idx, SLIDES.length);
  addTitleBlock(slide, idx, data.title, data.subtitle, 64, 86, 700);
  const metrics = data.metrics || [
    ["00", "Replace metric", "Source"],
    ["00", "Replace metric", "Source"],
    ["00", "Replace metric", "Source"],
  ];
  const accents = [ACCENT, GOLD, CORAL];
  for (let metricIdx = 0; metricIdx < Math.min(3, metrics.length); metricIdx += 1) {
    const [metric, label, note] = metrics[metricIdx];
    addMetricCard(slide, idx, 92 + metricIdx * 370, 390, 330, 198, metric, label, note, accents[metricIdx % accents.length]);
  }
  addReferenceCaption(slide, idx);
  addNotes(slide, data.notes, data.sources);
}

async function slideExample(presentation, idx) {
  const data = SLIDES[idx - 1];
  const slide = presentation.slides.add();
  await addPlate(slide, idx);
  addShape(slide, "rect", 0, 0, 910, H, "#F5EFE6D8", TRANSPARENT, 0, { slideNo: idx, role: "example contrast overlay" });
  addHeader(slide, idx, data.kicker, idx, SLIDES.length);
  addTitleBlock(slide, idx, data.title, data.subtitle, 64, 86, 760);
  addCodePanel(slide, idx, 82, 318, 492, 308, data.leftLabel || "EXEMPLO", data.leftText || "");
  addCodePanel(slide, idx, 602, 318, 596, 308, data.rightLabel || "RESULTADO", data.rightText || "", {
    dark: true,
    accent: GOLD,
  });
  addReferenceCaption(slide, idx);
  addNotes(slide, data.notes, data.sources);
}

async function slideFlow(presentation, idx) {
  const data = SLIDES[idx - 1];
  const slide = presentation.slides.add();
  await addPlate(slide, idx);
  addShape(slide, "rect", 0, 0, 910, H, "#F5EFE6D8", TRANSPARENT, 0, { slideNo: idx, role: "flow contrast overlay" });
  addHeader(slide, idx, data.kicker, idx, SLIDES.length);
  addTitleBlock(slide, idx, data.title, data.subtitle, 64, 86, 820);
  const steps = data.steps || [];
  const count = Math.max(1, Math.min(5, steps.length));
  const gap = 18;
  const tileW = Math.floor((1120 - gap * (count - 1)) / count);
  const startX = 80;
  const accents = [ACCENT, GOLD, TEAL, CORAL, ACCENT];
  for (let stepIdx = 0; stepIdx < count; stepIdx += 1) {
    const [title, body] = steps[stepIdx];
    const x = startX + stepIdx * (tileW + gap);
    addStepTile(slide, idx, x, 392, tileW, 190, stepIdx + 1, title, body, accents[stepIdx % accents.length]);
    if (stepIdx < count - 1) {
      addShape(slide, "rect", x + tileW + 6, 484, 12, 4, INK, TRANSPARENT, 0, { slideNo: idx, role: "flow connector" });
    }
  }
  addReferenceCaption(slide, idx);
  addNotes(slide, data.notes, data.sources);
}

async function slideQuad(presentation, idx) {
  const data = SLIDES[idx - 1];
  const slide = presentation.slides.add();
  await addPlate(slide, idx);
  addShape(slide, "rect", 0, 0, 910, H, "#F5EFE6D8", TRANSPARENT, 0, { slideNo: idx, role: "quad contrast overlay" });
  addHeader(slide, idx, data.kicker, idx, SLIDES.length);
  addTitleBlock(slide, idx, data.title, data.subtitle, 64, 86, 800);
  const cards = data.quadCards || [];
  const positions = [
    [84, 314],
    [650, 314],
    [84, 476],
    [650, 476],
  ];
  const iconKinds = ["signal", "flow", "layers", "signal"];
  const accents = [ACCENT, GOLD, TEAL, CORAL];
  for (let cardIdx = 0; cardIdx < Math.min(4, cards.length); cardIdx += 1) {
    const [label, body] = cards[cardIdx];
    const [x, y] = positions[cardIdx];
    addCompactCard(slide, idx, x, y, 548, 148, label, body, accents[cardIdx % accents.length], iconKinds[cardIdx % iconKinds.length]);
  }
  addReferenceCaption(slide, idx);
  addNotes(slide, data.notes, data.sources);
}

async function createDeck() {
  await ensureDirs();
  if (!SLIDES.length) {
    throw new Error("SLIDES must contain at least one slide.");
  }
  const presentation = Presentation.create({ slideSize: { width: W, height: H } });
  for (let idx = 1; idx <= SLIDES.length; idx += 1) {
    const data = SLIDES[idx - 1];
    if (idx === 1 || data.layout === "cover") {
      await slideCover(presentation);
    } else if (data.layout === "section") {
      await slideSection(presentation, idx);
    } else if (data.layout === "example") {
      await slideExample(presentation, idx);
    } else if (data.layout === "flow") {
      await slideFlow(presentation, idx);
    } else if (data.layout === "quad") {
      await slideQuad(presentation, idx);
    } else if (data.layout === "metrics" || data.metrics) {
      await slideMetrics(presentation, idx);
    } else {
      await slideCards(presentation, idx);
    }
  }
  return presentation;
}

async function saveBlobToFile(blob, filePath) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  await fs.writeFile(filePath, bytes);
}

async function writeInspectArtifact(presentation) {
  inspectRecords.unshift({
    kind: "deck",
    id: DECK_ID,
    slideCount: presentation.slides.count,
    slideSize: { width: W, height: H },
  });
  presentation.slides.items.forEach((slide, index) => {
    inspectRecords.splice(index + 1, 0, {
      kind: "slide",
      slide: index + 1,
      id: slide?.id || `slide-${index + 1}`,
    });
  });
  const lines = inspectRecords.map((record) => JSON.stringify(record)).join("\n") + "\n";
  await fs.writeFile(INSPECT_PATH, lines, "utf8");
}

async function currentRenderLoopCount() {
  const logPath = path.join(VERIFICATION_DIR, "render_verify_loops.ndjson");
  if (!(await pathExists(logPath))) return 0;
  const previous = await fs.readFile(logPath, "utf8");
  return previous.split(/\r?\n/).filter((line) => line.trim()).length;
}

async function nextRenderLoopNumber() {
  return (await currentRenderLoopCount()) + 1;
}

async function appendRenderVerifyLoop(presentation, previewPaths, pptxPath) {
  const logPath = path.join(VERIFICATION_DIR, "render_verify_loops.ndjson");
  const priorCount = await currentRenderLoopCount();
  const record = {
    kind: "render_verify_loop",
    deckId: DECK_ID,
    loop: priorCount + 1,
    maxLoops: MAX_RENDER_VERIFY_LOOPS,
    capReached: priorCount + 1 >= MAX_RENDER_VERIFY_LOOPS,
    timestamp: new Date().toISOString(),
    slideCount: presentation.slides.count,
    previewCount: previewPaths.length,
    previewDir: PREVIEW_DIR,
    inspectPath: INSPECT_PATH,
    pptxPath,
  };
  await fs.appendFile(logPath, JSON.stringify(record) + "\n", "utf8");
  return record;
}

async function verifyAndExport(presentation) {
  await ensureDirs();
  const nextLoop = await nextRenderLoopNumber();
  if (nextLoop > MAX_RENDER_VERIFY_LOOPS) {
    throw new Error(
      `Render/verify/fix loop cap reached: ${MAX_RENDER_VERIFY_LOOPS} total renders are allowed. ` +
        "Do not rerender; note any remaining visual issues in the final response.",
    );
  }
  await writeInspectArtifact(presentation);
  const previewPaths = [];
  for (let idx = 0; idx < presentation.slides.items.length; idx += 1) {
    const slide = presentation.slides.items[idx];
    const preview = await presentation.export({ slide, format: "png", scale: 1 });
    const previewPath = path.join(PREVIEW_DIR, `slide-${String(idx + 1).padStart(2, "0")}.png`);
    await saveBlobToFile(preview, previewPath);
    previewPaths.push(previewPath);
  }
  const pptxBlob = await PresentationFile.exportPptx(presentation);
  const pptxPath = path.join(OUT_DIR, "Apresentacao_SDD_Claude_Databricks.pptx");
  await pptxBlob.save(pptxPath);
  const loopRecord = await appendRenderVerifyLoop(presentation, previewPaths, pptxPath);
  return { pptxPath, loopRecord };
}

const presentation = await createDeck();
const result = await verifyAndExport(presentation);
console.log(result.pptxPath);
