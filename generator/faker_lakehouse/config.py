from dataclasses import dataclass, field
from pathlib import Path


@dataclass(frozen=True)
class GeneratorConfig:
    """Parâmetros do gerador. Imutável — clone via dataclasses.replace."""

    seed: int = 42
    num_categories: int = 10
    num_products: int = 80
    num_customers: int = 500
    orders_per_day: int = 500
    avg_items_per_order: float = 2.5
    avg_payments_per_order: float = 1.1

    late_data_pct: float = 0.05
    late_data_window_h: int = 72
    duplicate_pct: float = 0.01
    corrupt_pct: float = 0.02

    out_dir: Path = field(default_factory=lambda: Path("data"))
