const http = require('http');
const fs   = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;

// Railway provides RAILWAY_PUBLIC_DOMAIN for the public URL
// e.g. housie-production.up.railway.app
const PUBLIC_DOMAIN = process.env.RAILWAY_PUBLIC_DOMAIN || null;

// ── Static file server ──────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, 'utf8', (err, html) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }

    // Inject <meta name="ws-url"> so the client knows where to connect.
    // On Railway this will be wss://housie-production.up.railway.app
    // Locally it falls back to ws://localhost:PORT
    let wsUrl;
    if (PUBLIC_DOMAIN) {
      wsUrl = `wss://${PUBLIC_DOMAIN}`;
    } else {
      wsUrl = `ws://localhost:${PORT}`;
    }

    const injected = html.replace(
      '<meta charset="UTF-8" />',
      `<meta charset="UTF-8" />\n  <meta name="ws-url" content="${wsUrl}" />`
    );

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(injected);
  });
});

// ── WebSocket server ────────────────────────────────────────────────
const wss = new WebSocketServer({ server });

// rooms[roomCode] = { state: {...}, clients: Set<ws> }
const rooms = {};

// pendingJoins[playerId] = { ws, roomCode, name }
const pendingJoins = {};

// Track all client connections by playerId
const clientsByPlayerId = new Map();

function broadcast(roomCode, msg, excludeWs = null) {
  const room = rooms[roomCode];
  if (!room) return;
  const data = JSON.stringify(msg);
  room.clients.forEach(ws => {
    if (ws !== excludeWs && ws.readyState === 1) ws.send(data);
  });
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
      // Store the player's websocket for later approval
      const playerId = msg.playerId;
      clientsByPlayerId.set(playerId, ws);
      ws.tempRoomCode = code;
      ws.tempPlayerId = playerId;
      
      // Forward join request to host only
      broadcast(code, { type: 'join', playerId: playerId, name: msg.name });
      console.log(`${msg.name} (${playerId}) requested to join room ${code} - awaiting host approval`);
      return;
    }

    // ── host approves join ──
    if (type === 'join_approved') {
      const code = msg.room;
      const playerId = msg.playerId;
      // Find the waiting player websocket across all connections
      wss.clients.forEach(client => {
        if (client.tempPlayerId === playerId && client.readyState === 1) {
          // Now officially add them to the room
          client.roomCode = code;
          rooms[code].clients.add(client);
          // Send state sync to the newly approved player
          client.send(JSON.stringify({ type: 'state_sync', state: msg.state }));
          console.log(`Player ${playerId} approved and added to room ${code}`);
        }
      });
      // Broadcast to all OTHER players that someone joined
      broadcast(code, { type: 'state_update', state: msg.state });
      return;
    }

    // ── host denies join ──
    if (type === 'join_denied') {
      const playerId = msg.playerId;
      // Find and notify the denied player
      wss.clients.forEach(client => {
        if (client.tempPlayerId === playerId && client.readyState === 1) {
          client.send(JSON.stringify({ type: 'join_denied', message: 'Host denied your join request' }));
          console.log(`Player ${playerId} denied by host`);
        }
      });
      return;
    }

    // ── all other messages: relay to room ──
    if (!room || !rooms[room]) return;

    // Persist state updates
    if ((type === 'state_update' || type === 'number_called') && msg.state) {
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
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  console.log('\n🎱  Housie server running!\n');
  if (PUBLIC_DOMAIN) {
    console.log(`   Public:  https://${PUBLIC_DOMAIN}  ← share this link`);
  } else {
    console.log(`   Local:   http://localhost:${PORT}`);
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          console.log(`   Network: http://${net.address}:${PORT}  ← share with other devices`);
        }
      }
    }
  }
  console.log('\nPress Ctrl+C to stop.\n');
});
