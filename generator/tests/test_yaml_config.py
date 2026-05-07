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


from faker_lakehouse.cli import main


def test_seed_uses_yaml_out_dir(tmp_path: Path):
    runner = CliRunner()
    with runner.isolated_filesystem(temp_dir=tmp_path):
        Path("lakehouse.yaml").write_text("""
generator:
  seed: 42
run:
  out_dir: my_output
""")
        result = runner.invoke(main, ["seed"])
        assert result.exit_code == 0, result.output
        assert Path("my_output/seed/categories.jsonl").exists()


def test_run_uses_yaml_start_and_days(tmp_path: Path):
    runner = CliRunner()
    with runner.isolated_filesystem(temp_dir=tmp_path):
        Path("lakehouse.yaml").write_text("""
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
""")
        result = runner.invoke(main, ["run"])
        assert result.exit_code == 0, result.output
        assert (Path("my_data") / "landing" / "orders" / "_partition_date=2026-04-01").exists()


def test_cli_flag_overrides_yaml(tmp_path: Path):
    runner = CliRunner()
    with runner.isolated_filesystem(temp_dir=tmp_path):
        Path("lakehouse.yaml").write_text("""
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
""")
        result = runner.invoke(main, ["run", "--orders-per-day", "5", "--out-dir", "cli_output"])
        assert result.exit_code == 0, result.output
        assert (Path("cli_output") / "landing" / "orders" / "_partition_date=2026-04-01").exists()
        assert not Path("yaml_output").exists()


def test_run_errors_without_start_and_no_yaml(tmp_path: Path):
    runner = CliRunner()
    with runner.isolated_filesystem(temp_dir=tmp_path):
        result = runner.invoke(main, ["run"])
        assert result.exit_code != 0
        assert "start" in result.output.lower() or "obrigat" in result.output.lower()
