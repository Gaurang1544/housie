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
    // Locally the client uses its own location.host (see connectWS in index.html),
    // so we only inject the meta tag when a PUBLIC_DOMAIN is configured.
    let injected = html;
    if (PUBLIC_DOMAIN) {
      const wsUrl = `wss://${PUBLIC_DOMAIN}`;
      injected = html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n  <meta name="ws-url" content="${wsUrl}" />`
      );
    }

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

// Track pending join requests with timeout
const pendingJoinsByRoom = {}; // roomCode → Map(playerId → { playerId, name, ws, timestamp })

function broadcast(roomCode, msg, excludeWs = null) {
  const room = rooms[roomCode];
  if (!room) return;
  const data = JSON.stringify(msg);
  room.clients.forEach(ws => {
    if (ws !== excludeWs && ws.readyState === 1) ws.send(data);
  });
}

// Clean up stale connections from clientsByPlayerId
function cleanStaleConnections() {
  for (const [playerId, ws] of clientsByPlayerId.entries()) {
    if (ws.readyState !== 1) {
      clientsByPlayerId.delete(playerId);
    }
  }
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
      
      const playerId = msg.playerId;
      const playerName = msg.name;
      
      // Initialize pending joins map for this room if needed
      if (!pendingJoinsByRoom[code]) {
        pendingJoinsByRoom[code] = new Map();
      }
      
      // Check if this player is already pending or already in the game
      const pendingMap = pendingJoinsByRoom[code];
      const gameState = rooms[code].state;
      
      if (gameState.players && gameState.players[playerId]) {
        // Player already in game — reject duplicate join
        ws.send(JSON.stringify({ type: 'error', message: 'You are already in this game' }));
        return;
      }
      
      if (pendingMap.has(playerId)) {
        // Clean up old pending entry if it has a dead connection
        const oldPending = pendingMap.get(playerId);
        if (oldPending.ws && oldPending.ws.readyState === 1) {
          // Old connection still alive — reject new join attempt
          ws.send(JSON.stringify({ type: 'error', message: 'Join request already pending' }));
          return;
        }
        // Old connection dead — replace it
        pendingMap.delete(playerId);
      }
      
      // Store the player's websocket and pending request
      const timestamp = Date.now();
      pendingMap.set(playerId, { playerId, name: playerName, ws, timestamp });
      
      // Store in clientsByPlayerId for quick lookup
      clientsByPlayerId.set(playerId, ws);
      ws.tempRoomCode = code;
      ws.tempPlayerId = playerId;
      
      // Forward join request to host only
      const host = [...rooms[code].clients].find(c => c.roomCode === code && c === rooms[code].clients.values().next().value);
      broadcast(code, { type: 'join', playerId: playerId, name: playerName });
      console.log(`${playerName} (${playerId}) requested to join room ${code} - awaiting host approval`);
      
      // Auto-expire this pending request after 60 seconds
      setTimeout(() => {
        if (pendingMap.has(playerId)) {
          const pending = pendingMap.get(playerId);
          // Only expire if it's the same websocket (hasn't been replaced)
          if (pending.ws === ws) {
            pendingMap.delete(playerId);
            if (ws.readyState === 1) {
              ws.send(JSON.stringify({ type: 'error', message: 'Join request timed out. Host did not respond.' }));
            }
            console.log(`Join request from ${playerId} expired (room ${code})`);
          }
        }
      }, 60000);
      
      return;
    }

    // ── host approves join ──
    if (type === 'join_approved') {
      const code = msg.room;
      const playerId = msg.playerId;
      
      // Clean up stale connections first
      cleanStaleConnections();
      
      // Find the waiting player websocket
      const playerWs = clientsByPlayerId.get(playerId);
      const pendingMap = pendingJoinsByRoom[code];
      
      if (!playerWs || playerWs.readyState !== 1) {
        console.log(`Cannot approve: player ${playerId} WebSocket not available or dead`);
        return;
      }
      
      if (!pendingMap || !pendingMap.has(playerId)) {
        console.log(`Cannot approve: player ${playerId} not in pending joins for room ${code}`);
        return;
      }
      
      // Remove from pending
      pendingMap.delete(playerId);
      
      // Now officially add them to the room
      playerWs.roomCode = code;
      playerWs.tempRoomCode = null;
      playerWs.tempPlayerId = null;
      rooms[code].clients.add(playerWs);
      
      // Send state sync to the newly approved player
      playerWs.send(JSON.stringify({ type: 'state_sync', state: msg.state }));
      console.log(`Player ${playerId} approved and added to room ${code}`);
      
      // Broadcast to all OTHER players that someone joined (excluding the newly joined player)
      broadcast(code, { type: 'state_update', state: msg.state }, playerWs);
      
      return;
    }

    // ── host denies join ──
    if (type === 'join_denied') {
      const code = msg.room;
      const playerId = msg.playerId;
      
      // Find and notify the denied player
      const playerWs = clientsByPlayerId.get(playerId);
      
      if (playerWs && playerWs.readyState === 1) {
        playerWs.send(JSON.stringify({ type: 'join_denied', message: 'Host denied your join request' }));
        console.log(`Player ${playerId} denied by host`);
      }
      
      // Clean up the pending join request
      const pendingMap = pendingJoinsByRoom[code];
      if (pendingMap && pendingMap.has(playerId)) {
        pendingMap.delete(playerId);
      }
      
      // Clean up client reference
      clientsByPlayerId.delete(playerId);
      
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
    
    // Remove from active room
    if (code && rooms[code]) {
      rooms[code].clients.delete(ws);
      
      // If player in game, update state to reflect departure
      if (ws.tempPlayerId) {
        const gameState = rooms[code].state;
        if (gameState && gameState.players && gameState.players[ws.tempPlayerId]) {
          // Remove them from gameState
          delete gameState.players[ws.tempPlayerId];
          
          // Notify remaining players
          const disconnectMsg = {
            type: 'player_disconnected',
            playerId: ws.tempPlayerId,
            state: gameState
          };
          broadcast(code, disconnectMsg);
          console.log(`Player ${ws.tempPlayerId} disconnected from room ${code}`);
        }
      }
      
      // Clean up empty rooms
      if (rooms[code].clients.size === 0) {
        delete rooms[code];
        // Also clean up pending joins for this room
        delete pendingJoinsByRoom[code];
        console.log(`Room ${code} closed (empty)`);
      }
    }
    
    // Clean up from pending joins if waiting
    if (ws.tempPlayerId) {
      clientsByPlayerId.delete(ws.tempPlayerId);
      
      // Also remove from pending joins map for any room
      for (const roomCode in pendingJoinsByRoom) {
        if (pendingJoinsByRoom[roomCode].has(ws.tempPlayerId)) {
          pendingJoinsByRoom[roomCode].delete(ws.tempPlayerId);
        }
      }
    }
    
    // Periodic cleanup of stale connections
    cleanStaleConnections();
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
