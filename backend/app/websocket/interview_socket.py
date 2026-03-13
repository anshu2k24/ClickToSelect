from fastapi import WebSocket


class ConnectionManager:

    def __init__(self):

        self.active_connections = {}


    async def connect(self, interview_id, websocket: WebSocket):

        await websocket.accept()

        if interview_id not in self.active_connections:
            self.active_connections[interview_id] = []

        self.active_connections[interview_id].append(websocket)


    def disconnect(self, interview_id, websocket):

        self.active_connections[interview_id].remove(websocket)


    async def broadcast(self, interview_id, message):

        for connection in self.active_connections.get(interview_id, []):
            await connection.send_json(message)


manager = ConnectionManager()