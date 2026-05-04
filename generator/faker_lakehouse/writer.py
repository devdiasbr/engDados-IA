import json
from datetime import date
from pathlib import Path
from typing import Iterable, Optional


def write_seed(out_dir: Path, entity: str, records: Iterable[dict]) -> Path:
    target_dir = out_dir / "seed"
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / f"{entity}.jsonl"
    with target.open("w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec, ensure_ascii=False, default=str) + "\n")
    return target


def write_partitioned(
    out_dir: Path,
    entity: str,
    partition_date: date,
    records: Iterable[dict],
    part_index: int,
) -> Optional[Path]:
    records = list(records)
    if not records:
        return None
    target_dir = (
        out_dir
        / "landing"
        / entity
        / f"_partition_date={partition_date.isoformat()}"
    )
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / f"part-{part_index:05d}.jsonl"
    with target.open("w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec, ensure_ascii=False, default=str) + "\n")
    return target
