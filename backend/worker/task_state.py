from __future__ import annotations

from copy import deepcopy
from threading import Lock
from typing import Any


class TaskStateStore:
    def __init__(self) -> None:
        self._states: dict[str, dict[str, Any]] = {}
        self._lock = Lock()

    def set(self, task_id: str, payload: dict[str, Any]) -> None:
        with self._lock:
            current = deepcopy(self._states.get(task_id, {}))
            current.update(payload)
            self._states[task_id] = current

    def get(self, task_id: str) -> dict[str, Any] | None:
        with self._lock:
            state = self._states.get(task_id)
            return deepcopy(state) if state else None


task_state_store = TaskStateStore()
