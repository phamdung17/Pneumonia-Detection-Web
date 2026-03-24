from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, task_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections[task_id].append(websocket)

    def disconnect(self, task_id: str, websocket: WebSocket) -> None:
        if websocket in self.active_connections.get(task_id, []):
            self.active_connections[task_id].remove(websocket)
        if not self.active_connections.get(task_id):
            self.active_connections.pop(task_id, None)

    async def broadcast(self, task_id: str, payload: dict) -> None:
        for socket in list(self.active_connections.get(task_id, [])):
            try:
                await socket.send_json(payload)
            except Exception:
                self.disconnect(task_id, socket)


manager = ConnectionManager()
