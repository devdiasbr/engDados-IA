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


def _build_config(seed, orders_per_day, late_pct, late_h, dup_pct, corrupt_pct, out_dir):
    kwargs = dict(out_dir=Path(out_dir))
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
@click.option("--out-dir", type=click.Path(), default="data")
def seed(seed, out_dir):
    """Gera dimensoes iniciais em <out-dir>/seed/."""
    cfg = _build_config(seed, None, None, None, None, None, out_dir)
    cats = generate_categories(cfg)
    prods = generate_products(cfg, cats)
    custs = generate_customers(cfg)
    write_seed(cfg.out_dir, "categories", cats)
    write_seed(cfg.out_dir, "products", prods)
    write_seed(cfg.out_dir, "customers", custs)
    click.echo(f"Seed escrita em {cfg.out_dir}/seed/")


@main.command()
@click.option("--start", type=click.DateTime(formats=["%Y-%m-%d"]), required=True)
@click.option("--days", type=int, default=1)
@click.option("--seed", type=int, default=None)
@click.option("--orders-per-day", type=int, default=None)
@click.option("--late-data-pct", type=float, default=None)
@click.option("--late-data-window-h", type=int, default=None)
@click.option("--duplicate-pct", type=float, default=None)
@click.option("--corrupt-pct", type=float, default=None)
@click.option("--out-dir", type=click.Path(), default="data")
def run(start, days, seed, orders_per_day, late_data_pct, late_data_window_h,
        duplicate_pct, corrupt_pct, out_dir):
    """Gera <days> dias de eventos a partir de <start>."""
    cfg = _build_config(
        seed, orders_per_day, late_data_pct, late_data_window_h,
        duplicate_pct, corrupt_pct, out_dir,
    )
    cats = generate_categories(cfg)
    prods = generate_products(cfg, cats)
    custs = generate_customers(cfg)

    start_date = start.date() if hasattr(start, "date") else start

    for i in range(days):
        day = start_date + timedelta(days=i)
        streams = generate_day_events(cfg, day, prods, custs)
        for entity, events in streams.items():
            events = inject_faults(events, cfg)
            write_partitioned(cfg.out_dir, entity, day, events, part_index=0)

        dim = generate_dim_changes(cfg, day, prods, custs)
        if dim:
            write_partitioned(cfg.out_dir, "dim_changes", day, dim, part_index=0)

    click.echo(f"Executado: {days} dias a partir de {start_date.isoformat()}")
