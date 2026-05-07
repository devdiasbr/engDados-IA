from pathlib import Path
from faker_lakehouse.config import GeneratorConfig


def test_default_config():
    cfg = GeneratorConfig()
    assert cfg.seed == 42
    assert cfg.num_categories == 10
    assert cfg.num_products == 80
    assert cfg.num_customers == 500
    assert cfg.orders_per_day == 500
    assert cfg.late_data_pct == 0.05
    assert cfg.late_data_window_h == 72
    assert cfg.duplicate_pct == 0.01
    assert cfg.corrupt_pct == 0.02
    assert cfg.out_dir == Path("data")


def test_custom_config():
    cfg = GeneratorConfig(seed=99, orders_per_day=1000, out_dir=Path("/tmp/x"))
    assert cfg.seed == 99
    assert cfg.orders_per_day == 1000
    assert cfg.out_dir == Path("/tmp/x")
