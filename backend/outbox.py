"""
Deep module: domain event outbox writer.
Single public function for emitting a domain event into the outbox table.
"""

import json
from typing import Any


async def emit_event(conn, event_type: str, event_data: Any) -> None:
    payload = event_data if isinstance(event_data, str) else json.dumps(event_data)
    await conn.execute(
        "INSERT INTO outbox (event_type, event_data) VALUES ($1, $2)",
        event_type,
        payload,
    )
