# Design — lakehouse.yaml: Configuração Centralizada do Gerador

**Data:** 2026-05-07
**Autor:** Bruno Dias (com brainstorming via Claude)
**Status:** Aprovado para implementação

---

## 1. Contexto e Objetivo

O gerador `faker-lakehouse` expõe todos os parâmetros via CLI flags. Para uso cotidiano (demos, iterações, piloto), editar flags na linha de comando toda vez é inconveniente e propenso a erro.

Este design entrega um arquivo `lakehouse.yaml` na raiz do projeto onde o usuário configura todos os parâmetros de geração em um único lugar. O CLI lê o arquivo automaticamente se presente no diretório atual, sem mudança no fluxo de uso.

**Não-objetivos:**
- Suporte a múltiplos perfis de config (dev/prod) — YAGNI, pode ser adicionado depois
- Flag explícita `--config` — auto-detecção é suficiente para o caso de uso atual
- Mudanças em qualquer módulo além de `cli.py` e `pyproject.toml`

---

## 2. Arquivo `lakehouse.yaml`

Localização: raiz do projeto (`EntendimentoIAEngDados/lakehouse.yaml`).

```yaml
# Configurações do gerador faker-lakehouse
# Edite aqui e rode:
#   cd generator && pip install -e ".[dev]"
#   faker-lakehouse seed
#   faker-lakehouse run

generator:
  seed: 42
  num_categories: 10
  num_products: 80
  num_customers: 500

run:
  start: "2026-04-01"
  days: 7
  orders_per_day: 500
  out_dir: "data"

faults:
  late_data_pct: 0.05
  late_data_window_h: 72
  duplicate_pct: 0.01
  corrupt_pct: 0.02
```

### Mapeamento YAML → GeneratorConfig

| Seção YAML | Chave YAML | Param CLI / GeneratorConfig |
|---|---|---|
| `generator` | `seed` | `--seed` / `cfg.seed` |
| `generator` | `num_categories` | `cfg.num_categories` |
| `generator` | `num_products` | `cfg.num_products` |
| `generator` | `num_customers` | `cfg.num_customers` |
| `run` | `start` | `--start` |
| `run` | `days` | `--days` |
| `run` | `orders_per_day` | `--orders-per-day` / `cfg.orders_per_day` |
| `run` | `out_dir` | `--out-dir` / `cfg.out_dir` |
| `faults` | `late_data_pct` | `--late-data-pct` / `cfg.late_data_pct` |
| `faults` | `late_data_window_h` | `--late-data-window-h` / `cfg.late_data_window_h` |
| `faults` | `duplicate_pct` | `--duplicate-pct` / `cfg.duplicate_pct` |
| `faults` | `corrupt_pct` | `--corrupt-pct` / `cfg.corrupt_pct` |

---

## 3. Comportamento do CLI

### Ordem de precedência (maior prioridade primeiro)

```
CLI flags explícitas > lakehouse.yaml > defaults do GeneratorConfig
```

**Exemplos:**

```bash
# Usa tudo do lakehouse.yaml
faker-lakehouse run

# Override pontual: usa yaml mas sobrescreve orders_per_day
faker-lakehouse run --orders-per-day 50

# Sem yaml: usa defaults do GeneratorConfig
faker-lakehouse run  # (quando lakehouse.yaml não existe)
```

### Auto-detecção

O CLI procura `lakehouse.yaml` no CWD (`Path.cwd() / "lakehouse.yaml"`). Se não existir, comportamento atual é preservado (nenhuma breaking change).

O comando `seed` também lê as seções `generator` e `run.out_dir` do YAML.

---

## 4. Alterações no Código

### `generator/pyproject.toml`

Adicionar `pyyaml>=6.0` às dependências de produção.

### `generator/faker_lakehouse/cli.py`

Adicionar função `_load_yaml_config(yaml_path: Path) -> dict` que:
1. Retorna `{}` se o arquivo não existir (silent fallback)
2. Lê o YAML e achata as seções em um dict plano com as chaves do `GeneratorConfig` + `start` e `days`
3. Erros de parse → `click.echo` com warning + retorna `{}`

Atualizar `_build_config()` para aceitar um `yaml_defaults: dict` e aplicar a precedência correta.

Atualizar os comandos `seed` e `run` para carregar o YAML antes de chamar `_build_config()`.

### `lakehouse.yaml` (novo, raiz do projeto)

Criado com os defaults atuais do `GeneratorConfig`. Commitado ao repositório como ponto de partida.

---

## 5. Tratamento de Erros

| Situação | Comportamento |
|---|---|
| `lakehouse.yaml` não existe | Silencioso — usa defaults do GeneratorConfig |
| YAML malformado | Warning no terminal + usa defaults |
| Chave desconhecida no YAML | Ignorada silenciosamente |
| Tipo inválido (ex: `seed: "abc"`) | Click valida na construção do config — erro claro |

---

## 6. Critérios de Aceite

- `faker-lakehouse run` sem flags lê `lakehouse.yaml` do CWD e usa seus valores
- CLI flag explícita sobrescreve o valor do YAML para aquele parâmetro
- Se `lakehouse.yaml` não existir, comportamento é idêntico ao atual
- YAML malformado não quebra a execução — apenas exibe warning
- `lakehouse.yaml` commitado na raiz com os defaults do GeneratorConfig
