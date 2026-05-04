import json
from datetime import date
from pathlib import Path
from faker_lakehouse.writer import write_seed, write_partitioned


def test_write_seed_creates_file(tmp_path: Path):
    records = [{"id": "a", "name": "x"}, {"id": "b", "name": "y"}]
    out = write_seed(tmp_path, "categories", records)
    assert out == tmp_path / "seed" / "categories.jsonl"
    assert out.exists()
    lines = out.read_text(encoding="utf-8").strip().split("\n")
    assert len(lines) == 2
    assert json.loads(lines[0]) == {"id": "a", "name": "x"}


def test_write_seed_overwrites(tmp_path: Path):
    write_seed(tmp_path, "categories", [{"id": "a"}])
    out = write_seed(tmp_path, "categories", [{"id": "b"}])
    assert out.read_text(encoding="utf-8").strip() == '{"id": "b"}'


def test_write_partitioned_creates_partition(tmp_path: Path):
    records = [{"event_id": "1"}, {"event_id": "2"}]
    out = write_partitioned(
        tmp_path, "orders", date(2026, 4, 1), records, part_index=0
    )
    expected = (
        tmp_path
        / "landing"
        / "orders"
        / "_partition_date=2026-04-01"
        / "part-00000.jsonl"
    )
    assert out == expected
    assert out.exists()


def test_write_partitioned_empty_returns_none(tmp_path: Path):
    out = write_partitioned(tmp_path, "orders", date(2026, 4, 1), [], part_index=0)
    assert out is None
