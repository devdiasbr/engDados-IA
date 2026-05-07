import json
from faker_lakehouse.config import GeneratorConfig
from faker_lakehouse.faults import inject_faults


def _make_event(occurred: str = "2026-04-01T10:00:00+00:00") -> dict:
    return {
        "event_id": "id-1",
        "event_type": "order.created",
        "occurred_at": occurred,
        "received_at": occurred,
        "source": "faker-lakehouse",
        "payload": {"order_id": "o1"},
    }


def test_inject_faults_preserves_count_minus_drops():
    events = [_make_event() for _ in range(1000)]
    cfg = GeneratorConfig(seed=42, late_data_pct=0.05, duplicate_pct=0.01, corrupt_pct=0.02)
    out = inject_faults(events, cfg)
    assert len(out) >= len(events)


def test_duplicates_share_event_id():
    events = [_make_event() for _ in range(1000)]
    cfg = GeneratorConfig(seed=42, late_data_pct=0, duplicate_pct=0.05, corrupt_pct=0)
    out = inject_faults(events, cfg)
    ids = [e["event_id"] for e in out if isinstance(e, dict)]
    assert len(ids) > len(set(ids))


def test_late_data_shifts_received_at():
    events = [_make_event() for _ in range(200)]
    cfg = GeneratorConfig(seed=42, late_data_pct=1.0, duplicate_pct=0, corrupt_pct=0, late_data_window_h=72)
    out = inject_faults(events, cfg)
    shifted = [e for e in out if isinstance(e, dict) and e["received_at"] != e["occurred_at"]]
    assert len(shifted) == len(events)
    for e in shifted:
        assert e["received_at"] > e["occurred_at"]


def test_corrupt_produces_invalid_records():
    events = [_make_event() for _ in range(500)]
    cfg = GeneratorConfig(seed=42, late_data_pct=0, duplicate_pct=0, corrupt_pct=1.0)
    out = inject_faults(events, cfg)
    corrupt = [e for e in out if e.get("_corrupt")]
    assert len(corrupt) == len(events)


def test_zero_rates_returns_unchanged():
    events = [_make_event() for _ in range(50)]
    cfg = GeneratorConfig(seed=42, late_data_pct=0, duplicate_pct=0, corrupt_pct=0)
    out = inject_faults(events, cfg)
    assert out == events
