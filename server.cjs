const http = require('http');
const WebSocket = require('ws');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('COUP Multiplayer Server is running\n');
});

const wss = new WebSocket.Server({ server });

const rooms = {};

// Helper to generate room code
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}

wss.on('connection', (ws) => {
    let currentRoom = null;
    let clientId = null;
    let playerName = '';

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            const { type, payload } = data;

            if (type === 'create_room') {
                const code = generateRoomCode();
                clientId = 0; // Host is always index 0
                playerName = payload.playerName;
                currentRoom = code;

                rooms[code] = {
                    code: code,
                    host: ws,
                    clients: [{ id: 0, name: playerName, isHost: true }],
                    sockets: { 0: ws },
                    isStarted: false,
                    nextClientId: 1
                };

                ws.send(JSON.stringify({
                    type: 'room_created',
                    payload: { roomCode: code, clientId: 0 }
                }));
                
                broadcastRoomState(code);
            }
            
            else if (type === 'join_room') {
                const code = payload.roomCode.toUpperCase();
                playerName = payload.playerName;
                
                if (!rooms[code]) {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'ไม่พบห้องนี้ในระบบ' } }));
                    return;
                }
                
                const room = rooms[code];
                if (room.isStarted) {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'เกมได้เริ่มเล่นไปแล้ว' } }));
                    return;
                }
                if (room.clients.length >= 6) {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'ห้องเต็มแล้ว (สูงสุด 6 คน)' } }));
                    return;
                }

                clientId = room.nextClientId++;
                currentRoom = code;
                room.clients.push({ id: clientId, name: playerName, isHost: false });
                room.sockets[clientId] = ws;

                ws.send(JSON.stringify({
                    type: 'room_joined',
                    payload: { roomCode: code, clientId: clientId }
                }));

                broadcastRoomState(code);
            }

            else if (type === 'start_game') {
                const room = rooms[currentRoom];
                if (room && room.host === ws) {
                    room.isStarted = true;
                    // Forward start_game to all clients
                    broadcastToRoom(currentRoom, {
                        type: 'game_started',
                        payload: { aiCount: payload.aiCount }
                    });
                }
            }

            else if (type === 'sync_state') {
                const room = rooms[currentRoom];
                if (room && room.host === ws) {
                    // Forward game state to all peers
                    broadcastToPeers(currentRoom, {
                        type: 'sync_state',
                        payload: payload
                    });
                }
            }

            else if (type === 'prompt_request') {
                const room = rooms[currentRoom];
                if (room && room.host === ws) {
                    const targetSocket = room.sockets[payload.targetPlayerId];
                    if (targetSocket) {
                        targetSocket.send(JSON.stringify({
                            type: 'prompt_request',
                            payload: payload
                        }));
                    }
                }
            }

            else if (type === 'prompt_response') {
                const room = rooms[currentRoom];
                if (room && room.host) {
                    // Forward response back to host
                    room.host.send(JSON.stringify({
                        type: 'prompt_response',
                        payload: {
                            playerId: clientId,
                            value: payload.value
                        }
                    }));
                }
            }
        } catch (err) {
            console.error('Error processing socket message:', err);
        }
    });

    ws.on('close', () => {
        if (currentRoom && rooms[currentRoom]) {
            const room = rooms[currentRoom];
            if (room.host === ws) {
                // Host disconnected, close room
                broadcastToRoom(currentRoom, { type: 'error', payload: { message: 'หัวหน้าห้องออกจากระบบ ห้องปิดแล้ว' } });
                delete rooms[currentRoom];
            } else {
                // Peer disconnected, remove them
                room.clients = room.clients.filter(c => room.sockets[c.id] !== ws);
                broadcastRoomState(currentRoom);
            }
        }
    });
});

function broadcastToRoom(roomCode, msg) {
    const room = rooms[roomCode];
    if (room) {
        Object.values(room.sockets).forEach(socket => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify(msg));
            }
        });
    }
}

function broadcastToPeers(roomCode, msg) {
    const room = rooms[roomCode];
    if (room) {
        Object.keys(room.sockets).forEach(id => {
            if (id !== '0') { // 0 is host
                const socket = room.sockets[id];
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify(msg));
                }
            }
        });
    }
}

function broadcastRoomState(roomCode) {
    const room = rooms[roomCode];
    if (room) {
        broadcastToRoom(roomCode, {
            type: 'room_state',
            payload: {
                roomCode: room.code,
                clients: room.clients,
                isStarted: room.isStarted
            }
        });
    }
}

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`COUP Multiplayer Server is running on port ${PORT}`);
});
