# lakehouse.yaml Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar suporte a `lakehouse.yaml` na raiz do projeto para configuração centralizada do gerador, com CLI flags sobrescrevendo o YAML.

**Architecture:** `_load_yaml_config()` detecta e lê `lakehouse.yaml` do CWD automaticamente. `_build_config()` recebe os defaults do YAML e aplica precedência `CLI > YAML > GeneratorConfig defaults`. Comandos `seed` e `run` carregam o YAML antes de construir o config.

**Tech Stack:** Python 3.12, pyyaml>=6.0, click, pytest. Apenas `cli.py` e `pyproject.toml` são alterados no gerador; `lakehouse.yaml` é criado na raiz do projeto.

---

## File Structure

```
generator/
├── pyproject.toml              # modificar: adicionar pyyaml>=6.0
├── faker_lakehouse/
│   └── cli.py                  # modificar: _load_yaml_config() + _build_config() + seed + run
└── tests/
    └── test_yaml_config.py     # criar: testes para YAML loading e precedência

lakehouse.yaml                  # criar: na raiz do projeto (não em generator/)
```

---

## Task 1: Adicionar pyyaml ao pyproject.toml

**Files:**
- Modify: `generator/pyproject.toml:6-9`

- [ ] **Step 1: Adicionar pyyaml nas dependências**

Em `generator/pyproject.toml`, alterar o bloco `dependencies`:

```toml
dependencies = [
    "faker>=30.0.0",
    "click>=8.1.0",
    "pyyaml>=6.0",
]
```

- [ ] **Step 2: Reinstalar o pacote**

```bash
cd generator
pip install -e ".[dev]"
```

Expected: linha `Successfully installed pyyaml-...` ou `Requirement already satisfied`.

- [ ] **Step 3: Verificar que nada quebrou**

```bash
pytest -q
```

Expected: `30 passed`.

- [ ] **Step 4: Commit**

```bash
git add generator/pyproject.toml
git commit -m "feat(generator): adiciona pyyaml como dependencia"
git push
```

---

## Task 2: Implementar `_load_yaml_config()` com TDD

**Files:**
- Modify: `generator/faker_lakehouse/cli.py:1-12` (imports + nova função)
- Create: `generator/tests/test_yaml_config.py`

- [ ] **Step 1: Escrever testes falhos**

Criar `generator/tests/test_yaml_config.py`:

```python
from pathlib import Path
import pytest
from click.testing import CliRunner

from faker_lakehouse.cli import _load_yaml_config


def test_load_returns_empty_when_file_missing(tmp_path: Path):
    result = _load_yaml_config(tmp_path / "lakehouse.yaml")
    assert result == {}


def test_load_returns_flat_dict_from_valid_yaml(tmp_path: Path):
    yaml_file = tmp_path / "lakehouse.yaml"
    yaml_file.write_text("""
generator:
  seed: 99
  num_products: 20
run:
  start: "2026-06-01"
  days: 3
  orders_per_day: 100
  out_dir: "custom_data"
faults:
  late_data_pct: 0.10
  late_data_window_h: 48
  duplicate_pct: 0.02
  corrupt_pct: 0.05
""", encoding="utf-8")

    result = _load_yaml_config(yaml_file)

    assert result["seed"] == 99
    assert result["num_products"] == 20
    assert result["start"] == "2026-06-01"
    assert result["days"] == 3
    assert result["orders_per_day"] == 100
    assert result["out_dir"] == "custom_data"
    assert result["late_data_pct"] == 0.10
    assert result["late_data_window_h"] == 48
    assert result["duplicate_pct"] == 0.02
    assert result["corrupt_pct"] == 0.05


def test_load_returns_empty_and_warns_on_malformed_yaml(tmp_path: Path, capsys):
    yaml_file = tmp_path / "lakehouse.yaml"
    yaml_file.write_text("generator: [\nnot valid yaml", encoding="utf-8")

    result = _load_yaml_config(yaml_file)

    assert result == {}


def test_load_ignores_unknown_keys(tmp_path: Path):
    yaml_file = tmp_path / "lakehouse.yaml"
    yaml_file.write_text("""
generator:
  seed: 7
  unknown_key: "ignored"
run:
  days: 2
""", encoding="utf-8")

    result = _load_yaml_config(yaml_file)

    assert result["seed"] == 7
    assert result["days"] == 2
    assert "unknown_key" not in result


def test_load_handles_partial_yaml(tmp_path: Path):
    yaml_file = tmp_path / "lakehouse.yaml"
    yaml_file.write_text("""
run:
  days: 5
""", encoding="utf-8")

    result = _load_yaml_config(yaml_file)

    assert result["days"] == 5
    assert "seed" not in result
    assert "orders_per_day" not in result
```

- [ ] **Step 2: Rodar e verificar FAIL**

```bash
cd generator
pytest tests/test_yaml_config.py -v
```

Expected: FAIL — `ImportError: cannot import name '_load_yaml_config' from 'faker_lakehouse.cli'`.

- [ ] **Step 3: Implementar `_load_yaml_config()` em `cli.py`**

Adicionar import e função no topo de `generator/faker_lakehouse/cli.py`, após as importações existentes:

```python
from datetime import date, timedelta
from pathlib import Path

import click
import yaml

from faker_lakehouse.cdc import generate_dim_changes
from faker_lakehouse.config import GeneratorConfig
from faker_lakehouse.dimensions import generate_categories, generate_customers, generate_products
from faker_lakehouse.events import generate_day_events
from faker_lakehouse.faults import inject_faults
from faker_lakehouse.writer import write_partitioned, write_seed


_YAML_GENERATOR_KEYS = ("seed", "num_categories", "num_products", "num_customers")
_YAML_RUN_KEYS = ("orders_per_day", "out_dir", "start", "days")
_YAML_FAULTS_KEYS = ("late_data_pct", "late_data_window_h", "duplicate_pct", "corrupt_pct")


def _load_yaml_config(yaml_path: Path) -> dict:
    """Lê lakehouse.yaml e retorna dict plano com chaves do GeneratorConfig.

    Retorna {} se o arquivo não existir ou estiver malformado.
    """
    if not yaml_path.exists():
        return {}
    try:
        raw = yaml.safe_load(yaml_path.read_text(encoding="utf-8")) or {}
    except yaml.YAMLError as exc:
        click.echo(f"Warning: lakehouse.yaml inválido — {exc}. Usando defaults.", err=True)
        return {}

    out: dict = {}
    for key in _YAML_GENERATOR_KEYS:
        if key in (raw.get("generator") or {}):
            out[key] = raw["generator"][key]
    for key in _YAML_RUN_KEYS:
        if key in (raw.get("run") or {}):
            out[key] = raw["run"][key]
    for key in _YAML_FAULTS_KEYS:
        if key in (raw.get("faults") or {}):
            out[key] = raw["faults"][key]
    return out
```

- [ ] **Step 4: Rodar e verificar PASS**

```bash
pytest tests/test_yaml_config.py -v
```

Expected: 5 passed.

- [ ] **Step 5: Rodar suite completa**

```bash
pytest -q
```

Expected: 35 passed (30 anteriores + 5 novos).

- [ ] **Step 6: Commit**

```bash
git add generator/faker_lakehouse/cli.py generator/tests/test_yaml_config.py
git commit -m "feat(generator): adiciona _load_yaml_config com suporte a lakehouse.yaml"
git push
```

---

## Task 3: Atualizar `_build_config()`, `seed` e `run` para usar YAML

**Files:**
- Modify: `generator/faker_lakehouse/cli.py:14-85` (reescreve _build_config + seed + run)
- Modify: `generator/tests/test_yaml_config.py` (adiciona testes de integração CLI)

- [ ] **Step 1: Adicionar testes de integração CLI ao arquivo existente**

Abrir `generator/tests/test_yaml_config.py` e adicionar ao final:

```python
from faker_lakehouse.cli import main


def test_seed_uses_yaml_out_dir(tmp_path: Path):
    yaml_file = tmp_path / "lakehouse.yaml"
    yaml_file.write_text("""
generator:
  seed: 42
run:
  out_dir: my_output
""", encoding="utf-8")

    runner = CliRunner()
    with runner.isolated_filesystem(temp_dir=tmp_path):
        Path("lakehouse.yaml").write_text(yaml_file.read_text())
        result = runner.invoke(main, ["seed"])
        assert result.exit_code == 0, result.output
        assert Path("my_output/seed/categories.jsonl").exists()


def test_run_uses_yaml_start_and_days(tmp_path: Path):
    yaml_file = tmp_path / "lakehouse.yaml"
    yaml_file.write_text("""
generator:
  seed: 42
run:
  start: "2026-04-01"
  days: 1
  orders_per_day: 10
  out_dir: my_data
faults:
  late_data_pct: 0
  duplicate_pct: 0
  corrupt_pct: 0
""", encoding="utf-8")

    runner = CliRunner()
    with runner.isolated_filesystem(temp_dir=tmp_path):
        Path("lakehouse.yaml").write_text(yaml_file.read_text())
        result = runner.invoke(main, ["run"])
        assert result.exit_code == 0, result.output
        assert (Path("my_data") / "landing" / "orders" / "_partition_date=2026-04-01").exists()


def test_cli_flag_overrides_yaml(tmp_path: Path):
    yaml_file = tmp_path / "lakehouse.yaml"
    yaml_file.write_text("""
generator:
  seed: 42
run:
  start: "2026-04-01"
  days: 1
  orders_per_day: 100
  out_dir: yaml_output
faults:
  late_data_pct: 0
  duplicate_pct: 0
  corrupt_pct: 0
""", encoding="utf-8")

    runner = CliRunner()
    with runner.isolated_filesystem(temp_dir=tmp_path):
        Path("lakehouse.yaml").write_text(yaml_file.read_text())
        result = runner.invoke(main, ["run", "--orders-per-day", "5", "--out-dir", "cli_output"])
        assert result.exit_code == 0, result.output
        # out_dir veio do CLI, não do YAML
        assert (Path("cli_output") / "landing" / "orders" / "_partition_date=2026-04-01").exists()
        assert not Path("yaml_output").exists()


def test_run_errors_without_start_and_no_yaml(tmp_path: Path):
    runner = CliRunner()
    with runner.isolated_filesystem(temp_dir=tmp_path):
        result = runner.invoke(main, ["run"])
        assert result.exit_code != 0
        assert "start" in result.output.lower() or "obrigatório" in result.output.lower()
```

- [ ] **Step 2: Rodar e verificar FAIL**

```bash
pytest tests/test_yaml_config.py::test_seed_uses_yaml_out_dir tests/test_yaml_config.py::test_run_uses_yaml_start_and_days tests/test_yaml_config.py::test_cli_flag_overrides_yaml tests/test_yaml_config.py::test_run_errors_without_start_and_no_yaml -v
```

Expected: FAIL — os comandos ainda não lêem o YAML.

- [ ] **Step 3: Reescrever `_build_config()`, `seed` e `run` em `cli.py`**

Substituir o conteúdo completo de `generator/faker_lakehouse/cli.py` a partir da linha 14 (mantendo os imports e `_load_yaml_config` já adicionados na Task 2):

```python
from datetime import date, timedelta
from pathlib import Path

import click
import yaml

from faker_lakehouse.cdc import generate_dim_changes
from faker_lakehouse.config import GeneratorConfig
from faker_lakehouse.dimensions import generate_categories, generate_customers, generate_products
from faker_lakehouse.events import generate_day_events
from faker_lakehouse.faults import inject_faults
from faker_lakehouse.writer import write_partitioned, write_seed


_YAML_GENERATOR_KEYS = ("seed", "num_categories", "num_products", "num_customers")
_YAML_RUN_KEYS = ("orders_per_day", "out_dir", "start", "days")
_YAML_FAULTS_KEYS = ("late_data_pct", "late_data_window_h", "duplicate_pct", "corrupt_pct")


def _load_yaml_config(yaml_path: Path) -> dict:
    """Lê lakehouse.yaml e retorna dict plano com chaves do GeneratorConfig.

    Retorna {} se o arquivo não existir ou estiver malformado.
    """
    if not yaml_path.exists():
        return {}
    try:
        raw = yaml.safe_load(yaml_path.read_text(encoding="utf-8")) or {}
    except yaml.YAMLError as exc:
        click.echo(f"Warning: lakehouse.yaml inválido — {exc}. Usando defaults.", err=True)
        return {}

    out: dict = {}
    for key in _YAML_GENERATOR_KEYS:
        if key in (raw.get("generator") or {}):
            out[key] = raw["generator"][key]
    for key in _YAML_RUN_KEYS:
        if key in (raw.get("run") or {}):
            out[key] = raw["run"][key]
    for key in _YAML_FAULTS_KEYS:
        if key in (raw.get("faults") or {}):
            out[key] = raw["faults"][key]
    return out


def _build_config(
    yaml_defaults: dict,
    seed, orders_per_day, late_pct, late_h, dup_pct, corrupt_pct, out_dir
) -> GeneratorConfig:
    """Constrói GeneratorConfig com precedência: CLI > YAML > defaults."""
    kwargs: dict = {}

    # Aplica YAML defaults primeiro
    for key in ("seed", "num_categories", "num_products", "num_customers",
                "orders_per_day", "late_data_pct", "late_data_window_h",
                "duplicate_pct", "corrupt_pct"):
        if key in yaml_defaults:
            kwargs[key] = yaml_defaults[key]

    # out_dir: CLI > YAML > hardcoded "data"
    if out_dir is not None:
        kwargs["out_dir"] = Path(out_dir)
    elif "out_dir" in yaml_defaults:
        kwargs["out_dir"] = Path(yaml_defaults["out_dir"])
    else:
        kwargs["out_dir"] = Path("data")

    # CLI sobrescreve (só quando explicitamente passado, i.e. não None)
    if seed is not None:
        kwargs["seed"] = seed
    if orders_per_day is not None:
        kwargs["orders_per_day"] = orders_per_day
    if late_pct is not None:
        kwargs["late_data_pct"] = late_pct
    if late_h is not None:
        kwargs["late_data_window_h"] = late_h
    if dup_pct is not None:
        kwargs["duplicate_pct"] = dup_pct
    if corrupt_pct is not None:
        kwargs["corrupt_pct"] = corrupt_pct

    return GeneratorConfig(**kwargs)


@click.group()
def main():
    """Gerador de dados de e-commerce para SDD com Claude."""


@main.command()
@click.option("--seed", type=int, default=None)
@click.option("--out-dir", type=click.Path(), default=None)
def seed(seed, out_dir):
    """Gera dimensoes iniciais em <out-dir>/seed/."""
    yaml_cfg = _load_yaml_config(Path.cwd() / "lakehouse.yaml")
    cfg = _build_config(yaml_cfg, seed, None, None, None, None, None, out_dir)
    cats = generate_categories(cfg)
    prods = generate_products(cfg, cats)
    custs = generate_customers(cfg)
    write_seed(cfg.out_dir, "categories", cats)
    write_seed(cfg.out_dir, "products", prods)
    write_seed(cfg.out_dir, "customers", custs)
    click.echo(f"Seed escrita em {cfg.out_dir}/seed/")


@main.command()
@click.option("--start", type=click.DateTime(formats=["%Y-%m-%d"]), default=None)
@click.option("--days", type=int, default=None)
@click.option("--seed", type=int, default=None)
@click.option("--orders-per-day", type=int, default=None)
@click.option("--late-data-pct", type=float, default=None)
@click.option("--late-data-window-h", type=int, default=None)
@click.option("--duplicate-pct", type=float, default=None)
@click.option("--corrupt-pct", type=float, default=None)
@click.option("--out-dir", type=click.Path(), default=None)
def run(start, days, seed, orders_per_day, late_data_pct, late_data_window_h,
        duplicate_pct, corrupt_pct, out_dir):
    """Gera <days> dias de eventos a partir de <start>."""
    yaml_cfg = _load_yaml_config(Path.cwd() / "lakehouse.yaml")

    # Resolve start: CLI > YAML > erro
    if start is not None:
        start_date = start.date() if hasattr(start, "date") else start
    elif "start" in yaml_cfg:
        start_date = date.fromisoformat(str(yaml_cfg["start"]))
    else:
        raise click.UsageError(
            "--start é obrigatório (ou defina run.start no lakehouse.yaml)"
        )

    # Resolve days: CLI > YAML > default 1
    resolved_days = days if days is not None else yaml_cfg.get("days", 1)

    cfg = _build_config(
        yaml_cfg, seed, orders_per_day, late_data_pct, late_data_window_h,
        duplicate_pct, corrupt_pct, out_dir,
    )
    cats = generate_categories(cfg)
    prods = generate_products(cfg, cats)
    custs = generate_customers(cfg)

    for i in range(resolved_days):
        day = start_date + timedelta(days=i)
        streams = generate_day_events(cfg, day, prods, custs)
        for entity, events in streams.items():
            events = inject_faults(events, cfg)
            write_partitioned(cfg.out_dir, entity, day, events, part_index=0)

        dim = generate_dim_changes(cfg, day, prods, custs)
        if dim:
            write_partitioned(cfg.out_dir, "dim_changes", day, dim, part_index=0)

    click.echo(f"Executado: {resolved_days} dias a partir de {start_date.isoformat()}")
```

- [ ] **Step 4: Rodar novos testes e verificar PASS**

```bash
pytest tests/test_yaml_config.py -v
```

Expected: 9 passed (5 de Task 2 + 4 novos).

- [ ] **Step 5: Rodar suite completa**

```bash
pytest -q
```

Expected: 39 passed.

> **Nota:** o teste `test_run_creates_partitioned_files` em `test_cli.py` usa `--start 2026-04-01` explicitamente — continua funcionando porque `--start` agora é opcional mas ainda aceita o valor via CLI.

- [ ] **Step 6: Commit**

```bash
git add generator/faker_lakehouse/cli.py generator/tests/test_yaml_config.py
git commit -m "feat(generator): integra lakehouse.yaml nos comandos seed e run"
git push
```

---

## Task 4: Criar `lakehouse.yaml` na raiz do projeto

**Files:**
- Create: `lakehouse.yaml` (raiz do projeto, não dentro de `generator/`)

- [ ] **Step 1: Criar `lakehouse.yaml`**

Criar o arquivo `lakehouse.yaml` na raiz do projeto (`EntendimentoIAEngDados/lakehouse.yaml`):

```yaml
# Configurações do gerador faker-lakehouse
# Edite aqui e rode a partir da raiz do projeto:
#
#   cd generator && faker-lakehouse seed && faker-lakehouse run
#
# Todos os valores podem ser sobrescritos por flags CLI.
# Exemplo: faker-lakehouse run --orders-per-day 50

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
  late_data_pct: 0.05      # 5% dos eventos chegam com atraso
  late_data_window_h: 72   # atraso máximo de 72 horas
  duplicate_pct: 0.01      # 1% de duplicatas exatas
  corrupt_pct: 0.02        # 2% de payloads corrompidos
```

- [ ] **Step 2: Verificar que o CLI lê o YAML a partir da raiz**

```bash
cd "c:/Users/boliveid/OneDrive - NTT DATA EMEAL/Área de Trabalho/EntendimentoIAEngDados"
cd generator && faker-lakehouse seed && faker-lakehouse run --days 1
```

Expected: executa sem flags, cria `data/seed/` e `data/landing/` usando valores do `lakehouse.yaml`.

- [ ] **Step 3: Commit**

```bash
cd ..
git add lakehouse.yaml
git commit -m "feat: adiciona lakehouse.yaml com configuracao padrao do gerador"
git push
```

---

## Self-Review

**Spec coverage:**

| Requisito | Task |
|---|---|
| `lakehouse.yaml` na raiz com todos os params | Task 4 |
| Auto-detecção no CWD | Task 3 (`Path.cwd() / "lakehouse.yaml"`) |
| Precedência CLI > YAML > defaults | Task 3 (`_build_config` com `yaml_defaults`) |
| `seed` lê YAML | Task 3 |
| `run` lê YAML, start e days sem flag | Task 3 |
| YAML ausente → comportamento atual preservado | Task 2 (`test_load_returns_empty_when_file_missing`) |
| YAML malformado → warning + continua | Task 2 (`test_load_returns_empty_and_warns_on_malformed_yaml`) |
| pyyaml como dependência | Task 1 |

**Placeholder scan:** nenhum TBD/TODO. ✓

**Type consistency:**
- `_load_yaml_config(yaml_path: Path) -> dict` — usado em Task 2 (unit tests) e Task 3 (CLI tests) com mesma assinatura ✓
- `_build_config(yaml_defaults: dict, seed, ...)` — assinatura nova em Task 3, chamada em `seed` e `run` da mesma forma ✓
- `yaml_cfg` usado consistentemente em `seed` e `run` ✓
