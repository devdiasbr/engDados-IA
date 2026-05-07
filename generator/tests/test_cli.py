from pathlib import Path
from click.testing import CliRunner
from faker_lakehouse.cli import main


def test_seed_creates_three_files(tmp_path: Path):
    runner = CliRunner()
    result = runner.invoke(main, ["seed", "--out-dir", str(tmp_path)])
    assert result.exit_code == 0, result.output
    assert (tmp_path / "seed" / "categories.jsonl").exists()
    assert (tmp_path / "seed" / "products.jsonl").exists()
    assert (tmp_path / "seed" / "customers.jsonl").exists()


def test_run_creates_partitioned_files(tmp_path: Path):
    runner = CliRunner()
    runner.invoke(main, ["seed", "--out-dir", str(tmp_path)])
    result = runner.invoke(main, [
        "run",
        "--start", "2026-04-01",
        "--days", "2",
        "--orders-per-day", "20",
        "--out-dir", str(tmp_path),
    ])
    assert result.exit_code == 0, result.output
    landing = tmp_path / "landing"
    for entity in ("orders", "order_items", "payments"):
        for d in ("2026-04-01", "2026-04-02"):
            partition = landing / entity / f"_partition_date={d}"
            assert partition.exists(), f"{entity} {d} missing"
            files = list(partition.glob("part-*.jsonl"))
            assert files, f"No part files in {partition}"


def test_run_is_deterministic(tmp_path: Path):
    runner = CliRunner()
    out_a = tmp_path / "a"
    out_b = tmp_path / "b"
    for out in (out_a, out_b):
        runner.invoke(main, ["seed", "--out-dir", str(out), "--seed", "99"])
        runner.invoke(main, [
            "run", "--start", "2026-04-01", "--days", "1",
            "--orders-per-day", "10", "--seed", "99",
            "--late-data-pct", "0", "--duplicate-pct", "0", "--corrupt-pct", "0",
            "--out-dir", str(out),
        ])
    file_a = out_a / "landing" / "orders" / "_partition_date=2026-04-01" / "part-00000.jsonl"
    file_b = out_b / "landing" / "orders" / "_partition_date=2026-04-01" / "part-00000.jsonl"
    assert file_a.read_text() == file_b.read_text()
