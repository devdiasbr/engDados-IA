import json
from pathlib import Path
from click.testing import CliRunner

from faker_lakehouse.cli import main


def test_full_run_produces_expected_volumes(tmp_path: Path):
    runner = CliRunner()
    runner.invoke(main, ["seed", "--out-dir", str(tmp_path), "--seed", "42"])
    result = runner.invoke(main, [
        "run", "--start", "2026-04-01", "--days", "3",
        "--orders-per-day", "100", "--seed", "42",
        "--out-dir", str(tmp_path),
    ])
    assert result.exit_code == 0, result.output

    landing = tmp_path / "landing"
    orders_partitions = list((landing / "orders").glob("_partition_date=*"))
    assert len(orders_partitions) == 3

    for p in orders_partitions:
        files = list(p.glob("part-*.jsonl"))
        assert files
        lines = files[0].read_text(encoding="utf-8").strip().split("\n")
        assert len(lines) >= 100


def test_envelope_contract_in_output(tmp_path: Path):
    runner = CliRunner()
    runner.invoke(main, ["seed", "--out-dir", str(tmp_path)])
    runner.invoke(main, [
        "run", "--start", "2026-04-01", "--days", "1",
        "--orders-per-day", "10", "--out-dir", str(tmp_path),
    ])
    file = next(
        (tmp_path / "landing" / "orders" / "_partition_date=2026-04-01").glob("part-*.jsonl")
    )
    for line in file.read_text(encoding="utf-8").strip().split("\n"):
        rec = json.loads(line)
        assert "event_id" in rec and "event_type" in rec
        assert "occurred_at" in rec and "received_at" in rec
        assert rec["source"] == "faker-lakehouse"
