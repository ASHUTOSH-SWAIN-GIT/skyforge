// Standalone Yjs collaboration WebSocket hub.
// Direct port of internal/api/websocket.go: rooms keyed by URL path,
// echoing every message back to all clients (Yjs needs the echo).

import { createServer } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";

const PORT = Number(process.env.WS_PORT ?? process.env.PORT ?? 8080);
const PATH_PREFIX = "/ws/collaboration/";
const PING_PERIOD_MS = 54_000; // ~ pongWait * 9/10
const PONG_WAIT_MS = 60_000;

const rooms = new Map<string, Set<WebSocket>>();

function getOrCreateRoom(key: string): Set<WebSocket> {
  let room = rooms.get(key);
  if (!room) {
    room = new Set();
    rooms.set(key, room);
  }
  return room;
}

const server = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  const url = req.url ?? "";
  if (!url.startsWith(PATH_PREFIX)) {
    socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
    socket.destroy();
    return;
  }
  const roomKey = url.slice(PATH_PREFIX.length);
  if (!roomKey) {
    socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => attach(ws, roomKey));
});

function attach(ws: WebSocket, roomKey: string) {
  const room = getOrCreateRoom(roomKey);
  room.add(ws);
  console.log(`client connected → ${roomKey} (total ${room.size})`);

  let isAlive = true;
  ws.on("pong", () => {
    isAlive = true;
  });

  const interval = setInterval(() => {
    if (!isAlive) {
      ws.terminate();
      return;
    }
    isAlive = false;
    try {
      ws.ping();
    } catch {
      ws.terminate();
    }
  }, PING_PERIOD_MS);

  // Hard stop if no pong within window — mirrors Go's read deadline.
  const stallTimer = setInterval(() => {
    if (!isAlive) ws.terminate();
  }, PONG_WAIT_MS);

  ws.on("message", (data, isBinary) => {
    for (const client of room) {
      if (client.readyState !== ws.OPEN) continue;
      try {
        client.send(data, { binary: isBinary });
      } catch (err) {
        console.error("broadcast error:", err);
        client.terminate();
        room.delete(client);
      }
    }
  });

  ws.on("close", () => {
    clearInterval(interval);
    clearInterval(stallTimer);
    room.delete(ws);
    if (room.size === 0) {
      rooms.delete(roomKey);
      console.log(`room ${roomKey} removed (empty)`);
    } else {
      console.log(`client disconnected ← ${roomKey} (remaining ${room.size})`);
    }
  });
}

server.listen(PORT, () => {
  console.log(`Skyforge collaboration WS listening on :${PORT}`);
});
