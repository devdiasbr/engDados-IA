import copy
import random
from datetime import datetime, timedelta

from faker_lakehouse.config import GeneratorConfig

CORRUPTION_MODES = ["broken_json", "missing_field", "wrong_type"]


def inject_faults(events: list[dict], cfg: GeneratorConfig) -> list[dict]:
    if cfg.late_data_pct == 0 and cfg.duplicate_pct == 0 and cfg.corrupt_pct == 0:
        return events

    rng = random.Random(cfg.seed + 7777)
    result: list[dict] = []

    for event in events:
        e = copy.deepcopy(event)

        if rng.random() < cfg.corrupt_pct:
            e = _corrupt(e, rng)

        if rng.random() < cfg.late_data_pct:
            e = _delay(e, rng, cfg.late_data_window_h)

        result.append(e)

        if rng.random() < cfg.duplicate_pct:
            result.append(copy.deepcopy(e))

    return result


def _delay(event: dict, rng: random.Random, window_h: int) -> dict:
    occurred = datetime.fromisoformat(event["occurred_at"])
    delay_seconds = rng.randint(60, window_h * 3600)
    event["received_at"] = (occurred + timedelta(seconds=delay_seconds)).isoformat()
    return event


def _corrupt(event: dict, rng: random.Random) -> dict:
    mode = rng.choice(CORRUPTION_MODES)
    event["_corrupt"] = mode
    if mode == "broken_json":
        event["payload"] = "{not-json"
    elif mode == "missing_field":
        if isinstance(event.get("payload"), dict):
            keys = list(event["payload"].keys())
            if keys:
                event["payload"].pop(rng.choice(keys))
    elif mode == "wrong_type":
        if isinstance(event.get("payload"), dict) and event["payload"]:
            k = next(iter(event["payload"]))
            event["payload"][k] = ["unexpected", "list"]
    return event
