const http = require('http');
const fs   = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = 3000;

// ── Static file server ──────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

// ── WebSocket server ────────────────────────────────────────────────
const wss = new WebSocketServer({ server });

// rooms[roomCode] = { state: {...}, clients: Set<ws> }
const rooms = {};

function broadcast(roomCode, msg, excludeWs = null) {
  const room = rooms[roomCode];
  if (!room) return;
  const data = JSON.stringify(msg);
  room.clients.forEach(ws => {
    if (ws !== excludeWs && ws.readyState === 1) ws.send(data);
  });
}

function broadcastAll(roomCode, msg) {
  broadcast(roomCode, msg, null);
}

wss.on('connection', ws => {
  ws.roomCode = null;

  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    const { type, room } = msg;

    // ── host creates room ──
    if (type === 'create_room') {
      const code = msg.code;
      rooms[code] = { state: msg.state, clients: new Set([ws]) };
      ws.roomCode = code;
      ws.send(JSON.stringify({ type: 'room_created', code }));
      console.log(`Room created: ${code}`);
      return;
    }

    // ── player joins room ──
    if (type === 'join_room') {
      const code = msg.code;
      if (!rooms[code]) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
        return;
      }
      rooms[code].clients.add(ws);
      ws.roomCode = code;
      // Forward join to host (all other clients, essentially the host)
      broadcast(code, { type: 'join', playerId: msg.playerId, name: msg.name }, ws);
      // Send current state back to joining player
      ws.send(JSON.stringify({ type: 'state_sync', state: rooms[code].state }));
      console.log(`${msg.name} joined room ${code}`);
      return;
    }

    // ── all other messages: relay to room ──
    if (!room) return;
    if (!rooms[room]) return;

    // If host is updating state, persist it
    if (type === 'state_update' && msg.state) {
      rooms[room].state = msg.state;
    }
    if (type === 'number_called' && msg.state) {
      rooms[room].state = msg.state;
    }

    // Relay to everyone else in the room
    broadcast(room, msg, ws);
  });

  ws.on('close', () => {
    const code = ws.roomCode;
    if (code && rooms[code]) {
      rooms[code].clients.delete(ws);
      if (rooms[code].clients.size === 0) {
        delete rooms[code];
        console.log(`Room ${code} closed (empty)`);
      }
    }
  });
});

// ── Start ────────────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  // Print all local IPs so the user knows what to share
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  console.log('\n🎱  Housie server running!\n');
  console.log(`   Local:   http://localhost:${PORT}`);
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`   Network: http://${net.address}:${PORT}  ← share this with other devices`);
      }
    }
  }
  console.log('\nPress Ctrl+C to stop.\n');
});
