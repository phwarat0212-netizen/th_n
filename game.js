// --- Web Audio API Synth Sound Effects ---
const Sound = {
    ctx: null,
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    playCoin() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now); // B5 note
        osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08); // E6 note
        
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        
        osc.start(now);
        osc.stop(now + 0.25);
    },
    playCard() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        
        osc.start(now);
        osc.stop(now + 0.15);
    },
    playChallenge() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        osc1.frequency.setValueAtTime(150, now);
        osc2.frequency.setValueAtTime(153, now);
        
        osc1.frequency.linearRampToValueAtTime(80, now + 0.6);
        osc2.frequency.linearRampToValueAtTime(83, now + 0.6);
        
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.6);
        osc2.stop(now + 0.6);
    },
    playBlock() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.35);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        
        osc.start(now);
        osc.stop(now + 0.35);
    },
    playCoup() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.5);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        
        osc.start(now);
        osc.stop(now + 0.5);
    },
    playWin() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.1);
            gain.gain.setValueAtTime(0.08, now + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.3);
            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 0.3);
        });
    }
};

// --- Game Constants & Config ---
const ROLES = ['duke', 'assassin', 'captain', 'ambassador', 'contessa'];

const CHARACTER_DETAILS = {
    duke: { name: 'ดยุก', icon: '👑', action: 'tax', block: 'foreign-aid', label: 'Duke' },
    assassin: { name: 'นักฆ่า', icon: '🗡️', action: 'assassinate', block: '', label: 'Assassin' },
    captain: { name: 'กัปตัน', icon: '⚔️', action: 'steal', block: 'steal', label: 'Captain' },
    ambassador: { name: 'ทูต', icon: '📜', action: 'exchange', block: 'steal', label: 'Ambassador' },
    contessa: { name: 'คอนเตสซา', icon: '🛡️', action: '', block: 'assassinate', label: 'Contessa' }
};

const ACTION_LABELS = {
    'income': 'รายได้ปกติ',
    'foreign-aid': 'ความช่วยเหลือจากต่างชาติ',
    'coup': 'รัฐประหาร',
    'tax': 'เก็บภาษี (ดยุก)',
    'steal': 'ปล้น (กัปตัน)',
    'assassinate': 'ลอบสังหาร (นักฆ่า)',
    'exchange': 'เปลี่ยนการ์ด (ทูต)'
};

// --- State Variables ---
let deck = [];
let players = [];
let turnIndex = 0;
let treasury = 30;
let gameId = 0;

// Multiplayer Variables
let isMultiplayer = false;
let isHost = false;
let socket = null;
let roomCode = '';
let myPlayerId = 0; // Host is 0, peers are 1..5
let mpClients = [];
let lobbyPlayersCount = 4;
let activePrompts = {};

// Promise resolvers for human inputs
let humanActionResolver = null;
let humanTargetResolver = null;
let humanReactionResolver = null;
let humanCardSelectResolver = null;

// Temporary parameters for choice logic
let currentSelectionTarget = null;
let selectedExchangeCards = [];

// Delay Helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Animation Helpers ---
function animateCoinsBetweenElements(fromEl, toEl, amount) {
    if (!fromEl || !toEl || amount <= 0) return;
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    
    // Draw max 8 coins for performance
    const visualCoinsCount = Math.min(amount, 8);
    
    for (let i = 0; i < visualCoinsCount; i++) {
        setTimeout(() => {
            const coin = document.createElement('div');
            coin.className = 'flying-coin';
            coin.innerText = '🪙';
            coin.style.position = 'fixed';
            coin.style.left = `${fromRect.left + fromRect.width / 2 - 12}px`;
            coin.style.top = `${fromRect.top + fromRect.height / 2 - 12}px`;
            
            document.body.appendChild(coin);
            
            // Force reflow
            coin.offsetWidth;
            
            coin.style.left = `${toRect.left + toRect.width / 2 - 12}px`;
            coin.style.top = `${toRect.top + toRect.height / 2 - 12}px`;
            coin.style.transform = `scale(1.4) rotate(${360 + Math.random() * 360}deg)`;
            coin.style.opacity = '0';
            
            setTimeout(() => {
                coin.remove();
            }, 650);
        }, i * 100);
    }
}

function triggerScreenShake() {
    const container = document.querySelector('.game-container');
    if (container) {
        container.classList.add('shake-screen');
        setTimeout(() => {
            container.classList.remove('shake-screen');
        }, 400);
    }
}

async function showCardRevealAnimation(playerName, cardRole, messageText, isDead = false) {
    const banner = document.getElementById('card-reveal-display');
    const container = document.getElementById('reveal-card-container');
    const message = document.getElementById('reveal-card-message');
    
    if (!banner || !container || !message) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Create large card
    const details = CHARACTER_DETAILS[cardRole];
    const cardEl = document.createElement('div');
    cardEl.className = `card reveal-card-large ${details.colorClass}`;
    if (isDead) cardEl.classList.add('dead');
    cardEl.innerHTML = `
        <div class="card-inner" style="transform: rotateY(180deg)">
            <div class="card-front" style="padding: 15px 10px;">
                <span class="card-role" style="font-size: 13px; letter-spacing: 1.5px;">${details.name}</span>
                <span class="card-icon" style="font-size: 40px; margin: 15px 0;">${details.icon}</span>
                <span class="card-status-label" style="font-size: 10px; padding: 3px 8px;">${isDead ? 'เสียชีวิต (DEAD)' : 'แสดงตัวละคร'}</span>
            </div>
        </div>
    `;
    
    container.appendChild(cardEl);
    message.innerHTML = `<strong>${playerName}</strong><br>${messageText}`;
    
    // Open banner
    banner.classList.add('active');
    Sound.playCard();
    
    // Wait for display
    await delay(2200);
    
    // Close banner
    banner.classList.remove('active');
    await delay(400);
}

// Game log helpers
function logGame(text, type = 'system') {
    const logContainer = document.getElementById('game-log');
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.innerHTML = text;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// UI Overlay utilities
function openOverlay(id) {
    document.getElementById(id).classList.add('active');
}

function closeOverlay(id) {
    document.getElementById(id).classList.remove('active');
}

let activeOverlayBeforePeek = null;

function peekTable(overlayId) {
    activeOverlayBeforePeek = overlayId;
    closeOverlay(overlayId);
    
    const returnBtn = document.getElementById('return-action-btn');
    if (returnBtn) {
        returnBtn.style.display = 'block';
    }
}

function stopPeeking() {
    const returnBtn = document.getElementById('return-action-btn');
    if (returnBtn) {
        returnBtn.style.display = 'none';
    }
    if (activeOverlayBeforePeek) {
        openOverlay(activeOverlayBeforePeek);
        activeOverlayBeforePeek = null;
    }
}

function getPodId(playerId) {
    if (!isMultiplayer) return `player-${playerId}`;
    const idx = players.findIndex(p => p.id === playerId);
    const myIdx = players.findIndex(p => p.id === myPlayerId);
    if (idx === -1 || myIdx === -1) return `player-0`;
    const diff = (idx - myIdx + players.length) % players.length;
    return `player-${diff}`;
}

// --- Card Object Creator ---
function createCard(role) {
    return {
        role: role,
        dead: false
    };
}

// --- Start / Setup Screen Helpers ---
function showStartupScreen() {
    closeOverlay('action-overlay');
    closeOverlay('target-overlay');
    closeOverlay('reaction-overlay');
    closeOverlay('card-select-overlay');
    closeOverlay('gameover-overlay');
    
    // Hide return action button if visible
    const returnBtn = document.getElementById('return-action-btn');
    if (returnBtn) returnBtn.style.display = 'none';
    activeOverlayBeforePeek = null;
    
    // Invalidate currently running loops
    gameId++;
    
    openOverlay('startup-overlay');
}

function startGameWithPlayers(num) {
    closeOverlay('startup-overlay');
    initGame(num);
}

function positionPlayerPods(numPlayers) {
    const centerX = 50; // percent
    const centerY = 50; // percent
    
    const radiusX = 40; // percent
    const radiusY = 40; // percent
    
    for (let i = 0; i < 6; i++) {
        const pod = document.getElementById(`player-${i}`);
        if (!pod) continue;
        
        if (i < numPlayers) {
            // Show active pods
            pod.style.display = 'block';
            
            // Calculate angle. Player 0 (human) is always at the bottom (Math.PI / 2)
            const angle = (2 * Math.PI / numPlayers) * i + (Math.PI / 2);
            
            const x = centerX + radiusX * Math.cos(angle);
            const y = centerY + radiusY * Math.sin(angle);
            
            pod.style.left = `${x}%`;
            pod.style.top = `${y}%`;
        } else {
            // Hide inactive pods
            pod.style.display = 'none';
        }
    }
}

// --- Initialize Game ---
function initGame(playerCount = 4) {
    Sound.init();
    gameId++; // Invalidate previous loops
    
    // Clear log
    document.getElementById('game-log').innerHTML = '';
    logGame(`... เริ่มเกมใหม่สำหรับผู้เล่น ${playerCount} คน! แจกการ์ดคนละ 2 ใบ และเหรียญคนละ 2 เหรียญ`, 'system');
    
    // Reset Treasury
    treasury = 50 - (playerCount * 2);
    document.getElementById('treasury-count').innerText = treasury;
    
    // 1. Build and Shuffle Deck (3 of each character = 15 cards)
    deck = [];
    ROLES.forEach(role => {
        deck.push(createCard(role));
        deck.push(createCard(role));
        deck.push(createCard(role));
    });
    shuffle(deck);
    
    // 2. Setup players
    if (isMultiplayer && isHost) {
        players = [];
        mpClients.forEach(c => {
            players.push({
                id: c.id,
                name: c.id === 0 ? 'คุณ (คุณ)' : c.name,
                coins: 2,
                cards: [],
                isAI: false,
                isEliminated: false
            });
        });
        
        const botsNeeded = playerCount - mpClients.length;
        const botPool = [
            { id: 10, name: 'AI 1 (ดุดัน)', coins: 2, cards: [], isAI: true, isEliminated: false, aiStyle: 'aggressive' },
            { id: 11, name: 'AI 2 (รอบคอบ)', coins: 2, cards: [], isAI: true, isEliminated: false, aiStyle: 'cautious' },
            { id: 12, name: 'AI 3 (เจ้าเล่ห์)', coins: 2, cards: [], isAI: true, isEliminated: false, aiStyle: 'opportunistic' },
            { id: 13, name: 'AI 4 (ชอบป่วน)', coins: 2, cards: [], isAI: true, isEliminated: false, aiStyle: 'chaos' },
            { id: 14, name: 'AI 5 (สายจับผิด)', coins: 2, cards: [], isAI: true, isEliminated: false, aiStyle: 'arbitrator' }
        ];
        
        for (let i = 0; i < botsNeeded; i++) {
            players.push(botPool[i]);
        }
    } else {
        const botPool = [
            { id: 1, name: 'AI 1 (ดุดัน)', coins: 2, cards: [], isAI: true, isEliminated: false, aiStyle: 'aggressive' },
            { id: 2, name: 'AI 2 (รอบคอบ)', coins: 2, cards: [], isAI: true, isEliminated: false, aiStyle: 'cautious' },
            { id: 3, name: 'AI 3 (เจ้าเล่ห์)', coins: 2, cards: [], isAI: true, isEliminated: false, aiStyle: 'opportunistic' },
            { id: 4, name: 'AI 4 (ชอบป่วน)', coins: 2, cards: [], isAI: true, isEliminated: false, aiStyle: 'chaos' },
            { id: 5, name: 'AI 5 (สายจับผิด)', coins: 2, cards: [], isAI: true, isEliminated: false, aiStyle: 'arbitrator' }
        ];
        
        players = [{ id: 0, name: 'คุณ (คุณ)', coins: 2, cards: [], isAI: false, isEliminated: false }];
        for (let i = 0; i < playerCount - 1; i++) {
            players.push(botPool[i]);
        }
    }
    
    // Position pods dynamically
    positionPlayerPods(playerCount);
    
    // Deal 2 cards to each active player
    players.forEach(p => {
        p.isEliminated = false;
        p.coins = 2;
        p.cards = [deck.pop(), deck.pop()];
    });
    
    // Update deck pile UI
    document.getElementById('deck-count').innerText = deck.length;
    
    // Close overlays
    closeOverlay('action-overlay');
    closeOverlay('target-overlay');
    closeOverlay('reaction-overlay');
    closeOverlay('card-select-overlay');
    closeOverlay('gameover-overlay');
    closeOverlay('startup-overlay');
    
    // Hide return action button if visible
    const returnBtn = document.getElementById('return-action-btn');
    if (returnBtn) returnBtn.style.display = 'none';
    activeOverlayBeforePeek = null;
    
    // Randomize first turn
    turnIndex = Math.floor(Math.random() * players.length);
    
    updateUI();
    Sound.playCard();
    
    // Start game loop
    if (!isMultiplayer || isHost) {
        startGameLoop(gameId);
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// --- DOM Rendering / UI Sync ---
function updateUI() {
    players.forEach(p => {
        const pod = document.getElementById(getPodId(p.id));
        if (!pod) return;
        
        // Update coins
        pod.querySelector('.coins-count').innerText = p.coins;
        
        // Update pod elimination state
        if (p.isEliminated) {
            pod.classList.add('eliminated');
        } else {
            pod.classList.remove('eliminated');
        }
        
        // Update card faces
        p.cards.forEach((card, idx) => {
            const podId = getPodId(p.id);
            const podNum = podId.split('-')[1];
            const cardEl = document.getElementById(`p${podNum}-card${idx}`);
            if (!cardEl) return;
            const cardRoleLabel = cardEl.querySelector('.card-role');
            const cardIcon = cardEl.querySelector('.card-icon');
            const cardStatus = cardEl.querySelector('.card-status-label');
            
            // Set character specifics
            cardEl.className = 'card';
            cardEl.classList.add(card.dead ? 'dead' : 'alive');
            
            if (card.dead) {
                const details = CHARACTER_DETAILS[card.role];
                cardRoleLabel.innerText = details.name;
                cardIcon.innerText = details.icon;
                cardEl.classList.add(details.colorClass);
                cardStatus.innerText = 'เปิดเผย (ตาย)';
                cardEl.classList.add('revealed');
            } else {
                // If it's the local human player, show their cards. Otherwise, hide them.
                if (p.id === myPlayerId) {
                    const details = CHARACTER_DETAILS[card.role];
                    cardRoleLabel.innerText = details.name;
                    cardIcon.innerText = details.icon;
                    cardEl.classList.add(details.colorClass);
                    cardStatus.innerText = 'อยู่ในมือ';
                    cardEl.classList.add('revealed');
                } else {
                    cardRoleLabel.innerText = '???';
                    cardIcon.innerText = '❓';
                    cardStatus.innerText = 'คว่ำ';
                    cardEl.classList.remove('revealed');
                }
            }
        });
    });
    
    // Update deck & treasury labels
    document.getElementById('deck-count').innerText = deck.length;
    document.getElementById('treasury-count').innerText = treasury;
    
    // Broadcast state to remote players
    broadcastGameState();
}

// Highlights who is currently taking their turn
function highlightActivePlayer(id) {
    players.forEach(p => {
        const pod = document.getElementById(getPodId(p.id));
        if (!pod) return;
        if (p.id === id) {
            pod.classList.add('active-turn');
        } else {
            pod.classList.remove('active-turn');
        }
    });
}

function setPhaseLabel(text) {
    document.getElementById('phase-label').innerText = text;
}

function setStatusDesc(text) {
    document.getElementById('status-desc').innerText = text;
}

// --- Main Game Loop ---
async function startGameLoop(localGameId) {
    while (localGameId === gameId) {
        const activePlayer = players[turnIndex];
        
        // Check if game is over
        const activePlayersCount = players.filter(p => !p.isEliminated).length;
        if (activePlayersCount <= 1) {
            break;
        }
        
        if (activePlayer.isEliminated) {
            nextTurnIndex();
            continue;
        }
        
        highlightActivePlayer(activePlayer.id);
        setPhaseLabel(`รอบของ ${activePlayer.name}`);
        setStatusDesc(`รอ ${activePlayer.name} ดำเนินการ...`);
        
        await delay(1200);
        if (localGameId !== gameId) return;
        
        let action = '';
        let target = null;
        
        // 10 Coins constraint: must declare Coup
        if (activePlayer.coins >= 10) {
            logGame(`⚠️ <strong>${activePlayer.name}</strong> มีเหรียญตั้งแต่ 10 เหรียญขึ้นไป บังคับทำการรัฐประหาร (Coup)!`, 'system');
            action = 'coup';
            if (activePlayer.isAI) {
                target = chooseAITarget(activePlayer);
            } else {
                target = await getHumanTarget('coup');
                if (localGameId !== gameId) return;
            }
        } else {
            // Normal decision
            if (activePlayer.isAI) {
                const decision = getAIDecision(activePlayer);
                action = decision.action;
                target = decision.target;
            } else {
                action = await getHumanAction();
                if (localGameId !== gameId) return;
                if (needsTarget(action)) {
                    target = await getHumanTarget(action);
                    if (localGameId !== gameId) return;
                }
            }
        }
        
        // 3. Resolve the action sequence
        await resolveActionSequence(activePlayer, action, target, localGameId);
        if (localGameId !== gameId) return;
        
        updateUI();
        await delay(1000);
        if (localGameId !== gameId) return;
        nextTurnIndex();
    }
    
    if (localGameId === gameId) {
        declareWinner();
    }
}

function nextTurnIndex() {
    turnIndex = (turnIndex + 1) % players.length;
}

function needsTarget(action) {
    return action === 'steal' || action === 'assassinate' || action === 'coup';
}

// --- Human Inputs Resolvers ---
async function getHumanAction() {
    const activePlayer = players[turnIndex];
    if (isMultiplayer && activePlayer.id !== 0) {
        setStatusDesc(`รอ ${activePlayer.name} เลือกการกระทำ...`);
        broadcastGameState();
        const action = await requestRemotePrompt(activePlayer.id, 'action', {});
        return action;
    }
    
    // Disable coup if not enough coins
    document.getElementById('btn-coup').disabled = (players[0].coins < 7);
    // Disable assassinate if not enough coins
    document.getElementById('btn-assassinate').disabled = (players[0].coins < 3);
    
    openOverlay('action-overlay');
    return new Promise(resolve => {
        humanActionResolver = resolve;
    });
}

function selectAction(action) {
    closeOverlay('action-overlay');
    if (isMultiplayer && !isHost) {
        socket.send(JSON.stringify({
            type: 'prompt_response',
            payload: { value: action }
        }));
        return;
    }
    if (humanActionResolver) {
        humanActionResolver(action);
        humanActionResolver = null;
    }
}

async function getHumanTarget(action) {
    const activePlayer = players[turnIndex];
    if (isMultiplayer && activePlayer.id !== 0) {
        setStatusDesc(`รอ ${activePlayer.name} เลือกเป้าหมาย...`);
        broadcastGameState();
        
        const options = players.filter(p => p.id !== activePlayer.id && !p.isEliminated).map(p => ({
            id: p.id,
            name: p.name,
            coins: p.coins,
            cardsCount: p.cards.filter(c => !c.dead).length
        }));
        
        const response = await requestRemotePrompt(activePlayer.id, 'target', { action, options });
        return players.find(p => p.id === parseInt(response));
    }
    
    const container = document.getElementById('targets-container');
    container.innerHTML = '';
    
    const title = document.getElementById('target-modal-title');
    title.innerText = action === 'coup' ? 'เลือกผู้เล่นที่จะทำรัฐประหาร' : 
                      action === 'assassinate' ? 'เลือกผู้เล่นที่จะลอบสังหาร' : 'เลือกผู้เล่นที่จะปล้น';
                      
    players.forEach(p => {
        if (p.id !== 0 && !p.isEliminated) {
            const btn = document.createElement('button');
            btn.className = 'target-btn';
            btn.innerHTML = `<span>${p.name}</span> <span>🪙 ${p.coins} เหรียญ | 🎴 การ์ดที่เหลือ: ${p.cards.filter(c => !c.dead).length} ใบ</span>`;
            btn.onclick = () => {
                closeOverlay('target-overlay');
                if (humanTargetResolver) {
                    humanTargetResolver(p);
                    humanTargetResolver = null;
                }
            };
            container.appendChild(btn);
        }
    });
    
    openOverlay('target-overlay');
    return new Promise(resolve => {
        humanTargetResolver = resolve;
    });
}

function cancelTargetSelection() {
    closeOverlay('target-overlay');
    getHumanAction().then(act => {
        if (humanActionResolver) {
            humanActionResolver(act);
            humanActionResolver = null;
        }
    });
}

// Prompt for Reaction (Challenge / Block)
async function promptHumanReaction(player, promptText, buttons) {
    if (isMultiplayer && player.id !== 0) {
        setStatusDesc(`รอ ${player.name} ตัดสินใจตอบโต้...`);
        broadcastGameState();
        const response = await requestRemotePrompt(player.id, 'reaction', { promptText, buttons });
        return response;
    }
    
    document.getElementById('reaction-prompt-text').innerHTML = promptText;
    const container = document.getElementById('reaction-buttons-container');
    container.innerHTML = '';
    
    buttons.forEach(btnInfo => {
        const btn = document.createElement('button');
        btn.className = `choice-btn ${btnInfo.class || 'secondary'}`;
        btn.innerText = btnInfo.text;
        btn.onclick = () => {
            closeOverlay('reaction-overlay');
            if (isMultiplayer && !isHost) {
                socket.send(JSON.stringify({
                    type: 'prompt_response',
                    payload: { value: btnInfo.value }
                }));
                return;
            }
            if (humanReactionResolver) {
                humanReactionResolver(btnInfo.value);
                humanReactionResolver = null;
            }
        };
        container.appendChild(btn);
    });
    
    openOverlay('reaction-overlay');
    
    const bar = document.getElementById('reaction-timer-bar');
    if (bar) bar.style.width = '100%';
    
    return new Promise(resolve => {
        humanReactionResolver = resolve;
    });
}

// Discard card prompt
async function promptHumanCardDiscard(player, promptTitle, promptDesc, cardsToSelectFrom, selectCount = 1) {
    if (isMultiplayer && player.id !== 0) {
        setStatusDesc(`รอ ${player.name} เลือกสละสิทธิ์หรือสลับการ์ด...`);
        broadcastGameState();
        const response = await requestRemotePrompt(player.id, 'card', { promptTitle, promptDesc, cardsToSelectFrom, selectCount });
        return response;
    }
    
    const title = document.getElementById('card-select-title');
    title.innerText = promptTitle;
    
    const desc = document.getElementById('card-select-desc');
    desc.innerText = promptDesc;
    
    const container = document.getElementById('card-select-container');
    container.innerHTML = '';
    
    selectedExchangeCards = [];
    const confirmBtn = document.getElementById('card-select-confirm-btn');
    confirmBtn.disabled = true;
    
    cardsToSelectFrom.forEach((card, idx) => {
        const details = CHARACTER_DETAILS[card.role];
        const cardItem = document.createElement('div');
        cardItem.className = `card card-select-item ${details.colorClass}`;
        cardItem.innerHTML = `
            <div class="card-inner" style="transform: rotateY(180deg)">
                <div class="card-front">
                    <span class="card-role">${details.name}</span>
                    <span class="card-icon">${details.icon}</span>
                    <span class="card-status-label">${card.origin || 'ในมือ'}</span>
                </div>
            </div>
        `;
        
        cardItem.onclick = () => {
            Sound.playCard();
            if (selectCount === 1) {
                container.querySelectorAll('.card-select-item').forEach(c => c.classList.remove('selected'));
                cardItem.classList.add('selected');
                selectedExchangeCards = [idx];
                confirmBtn.disabled = false;
            } else {
                if (cardItem.classList.contains('selected')) {
                    cardItem.classList.remove('selected');
                    selectedExchangeCards = selectedExchangeCards.filter(i => i !== idx);
                } else {
                    if (selectedExchangeCards.length < selectCount) {
                        cardItem.classList.add('selected');
                        selectedExchangeCards.push(idx);
                    }
                }
                confirmBtn.disabled = (selectedExchangeCards.length !== selectCount);
            }
        };
        container.appendChild(cardItem);
    });
    
    openOverlay('card-select-overlay');
    return new Promise(resolve => {
        humanCardSelectResolver = resolve;
    });
}

function confirmCardSelection() {
    closeOverlay('card-select-overlay');
    if (isMultiplayer && !isHost) {
        socket.send(JSON.stringify({
            type: 'prompt_response',
            payload: { value: selectedExchangeCards }
        }));
        return;
    }
    if (humanCardSelectResolver) {
        humanCardSelectResolver(selectedExchangeCards);
        humanCardSelectResolver = null;
    }
}

// Open rules overlay
function openRules() {
    openOverlay('rules-overlay');
}

function closeRules() {
    closeOverlay('rules-overlay');
}

// --- Action Sequence Resolution (State Machine) ---
async function resolveActionSequence(actor, action, target, localGameId) {
    setPhaseLabel(`การดำเนินการ: ${ACTION_LABELS[action]}`);
    
    // Cost deductions
    if (action === 'coup') {
        const actorBadge = document.querySelector(`#${getPodId(actor.id)} .coins-badge`);
        const treasuryEl = document.getElementById('treasury-pile');
        animateCoinsBetweenElements(actorBadge, treasuryEl, 7);
        actor.coins -= 7;
        treasury += 7;
        Sound.playCoup();
        logGame(`💥 <strong>${actor.name}</strong> จ่าย 7 เหรียญทำการรัฐประหาร (Coup) ใส่ <strong>${target.name}</strong>!`, 'coup');
        await delay(800);
        if (localGameId !== gameId) return;
        updateUI();
        await forceCardDiscard(target, 'coup', localGameId);
        return;
    }
    
    if (action === 'assassinate') {
        const actorBadge = document.querySelector(`#${getPodId(actor.id)} .coins-badge`);
        const treasuryEl = document.getElementById('treasury-pile');
        animateCoinsBetweenElements(actorBadge, treasuryEl, 3);
        actor.coins -= 3;
        treasury += 3;
        Sound.playCard();
        logGame(`🗡️ <strong>${actor.name}</strong> จ่าย 3 เหรียญประกาศลอบสังหาร <strong>${target.name}</strong> (อ้างสิทธิ์เป็นนักฆ่า)`, 'assassinate');
        await delay(600);
        if (localGameId !== gameId) return;
        updateUI();
    } else if (action === 'income') {
        const actorBadge = document.querySelector(`#${getPodId(actor.id)} .coins-badge`);
        const treasuryEl = document.getElementById('treasury-pile');
        animateCoinsBetweenElements(treasuryEl, actorBadge, 1);
        actor.coins += 1;
        treasury -= 1;
        Sound.playCoin();
        logGame(`🪙 <strong>${actor.name}</strong> ขอรับรายได้ปกติ (Income) ได้รับ 1 เหรียญ`, 'income');
        await delay(600);
        if (localGameId !== gameId) return;
        updateUI();
        return;
    } else if (action === 'foreign-aid') {
        logGame(`🏦 <strong>${actor.name}</strong> ขอรับความช่วยเหลือจากต่างชาติ (Foreign Aid) ได้รับ 2 เหรียญ`, 'aid');
    } else if (action === 'tax') {
        logGame(`👑 <strong>${actor.name}</strong> ขอเก็บภาษี (Tax) ได้รับ 3 เหรียญ (อ้างสิทธิ์เป็นดยุก)`, 'tax');
    } else if (action === 'steal') {
        logGame(`⚔️ <strong>${actor.name}</strong> ขอปล้นเหรียญจาก <strong>${target.name}</strong> (อ้างสิทธิ์เป็นกัปตัน)`, 'steal');
    } else if (action === 'exchange') {
        logGame(`📜 <strong>${actor.name}</strong> ขอเปลี่ยนการ์ดเจรจา (Exchange) (อ้างสิทธิ์เป็นทูต)`, 'exchange');
    }
    
    await delay(1200);
    if (localGameId !== gameId) return;
    
    // --- Step 1: Challenge Window ---
    let challengeResult = null; // true if challenged and resolved
    const claimedChar = CHARACTER_DETAILS[action] ? CHARACTER_DETAILS[action].label : '';
    
    if (claimedChar) {
        // Find if someone wants to challenge
        const challenger = await getChallenger(actor, claimedChar, `อ้างสิทธิ์เป็น ${CHARACTER_DETAILS[action].name} เพื่อทำ ${ACTION_LABELS[action]}`, localGameId);
        if (localGameId !== gameId) return;
        if (challenger) {
            challengeResult = await resolveChallenge(actor, challenger, action, localGameId);
            if (localGameId !== gameId) return;
            if (challengeResult.bluffed) {
                // Actor bluffed, action fails
                return;
            }
        }
    }
    
    // --- Step 2: Block Window (if not failed challenge and is blockable) ---
    let isBlocked = false;
    let blockCharacter = '';
    let blocker = null;
    
    const blockableActions = {
        'foreign-aid': 'duke',
        'steal': 'captain/ambassador',
        'assassinate': 'contessa'
    };
    
    if (blockableActions[action]) {
        // Find if someone wants to block
        const blockDecision = await getBlocker(actor, action, target, localGameId);
        if (localGameId !== gameId) return;
        if (blockDecision) {
            blocker = blockDecision.blocker;
            blockCharacter = blockDecision.character; // 'duke', 'captain', 'ambassador', 'contessa'
            isBlocked = true;
            
            logGame(`🛡️ <strong>${blocker.name}</strong> ประกาศบล็อกการกระทำโดยอ้างสิทธิ์เป็น <strong>${CHARACTER_DETAILS[blockCharacter].name}</strong>!`, 'block');
            Sound.playBlock();
            await delay(1200);
            if (localGameId !== gameId) return;
            
            // Allow challenge to the block
            const blockChallenger = await getChallenger(blocker, CHARACTER_DETAILS[blockCharacter].label, `อ้างสิทธิ์เป็น ${CHARACTER_DETAILS[blockCharacter].name} เพื่อทำการป้องกัน (Block)`, localGameId);
            if (localGameId !== gameId) return;
            if (blockChallenger) {
                const blockChallengeResult = await resolveChallenge(blocker, blockChallenger, blockCharacter, localGameId);
                if (localGameId !== gameId) return;
                if (blockChallengeResult.bluffed) {
                    // Blocker was bluffing, block fails, action succeeds!
                    isBlocked = false;
                } else {
                    // Blocker told truth, block succeeds, action fails.
                    isBlocked = true;
                }
            }
        }
    }
    
    // --- Step 3: Resolve the Action ---
    if (!isBlocked) {
        const actorBadge = document.querySelector(`#${getPodId(actor.id)} .coins-badge`);
        const treasuryEl = document.getElementById('treasury-pile');
        
        if (action === 'foreign-aid') {
            animateCoinsBetweenElements(treasuryEl, actorBadge, 2);
            actor.coins += 2;
            treasury -= 2;
            Sound.playCoin();
            logGame(`✅ <strong>${actor.name}</strong> ได้รับความช่วยเหลือ 2 เหรียญสำเร็จ`, 'aid');
            await delay(600);
            if (localGameId !== gameId) return;
            updateUI();
        } else if (action === 'tax') {
            animateCoinsBetweenElements(treasuryEl, actorBadge, 3);
            actor.coins += 3;
            treasury -= 3;
            Sound.playCoin();
            logGame(`✅ <strong>${actor.name}</strong> เก็บภาษี 3 เหรียญสำเร็จ`, 'tax');
            await delay(700);
            if (localGameId !== gameId) return;
            updateUI();
        } else if (action === 'steal') {
            const targetBadge = document.querySelector(`#${getPodId(target.id)} .coins-badge`);
            const stealAmount = Math.min(target.coins, 2);
            animateCoinsBetweenElements(targetBadge, actorBadge, stealAmount);
            target.coins -= stealAmount;
            actor.coins += stealAmount;
            Sound.playCoin();
            logGame(`✅ <strong>${actor.name}</strong> ปล้นสำเร็จ ได้รับ ${stealAmount} เหรียญจาก <strong>${target.name}</strong>`, 'steal');
            await delay(600);
            if (localGameId !== gameId) return;
            updateUI();
        } else if (action === 'assassinate') {
            logGame(`☠️ <strong>${actor.name}</strong> ลอบสังหาร <strong>${target.name}</strong> สำเร็จ!`, 'assassinate');
            await forceCardDiscard(target, 'assassinate', localGameId);
        } else if (action === 'exchange') {
            logGame(`✅ <strong>${actor.name}</strong> แลกเปลี่ยนการ์ดเรียบร้อย`, 'exchange');
            await resolveExchange(actor, localGameId);
        }
    } else {
        logGame(`❌ การกระทำของ <strong>${actor.name}</strong> ถูกขัดขวางสำเร็จโดย <strong>${blocker.name}</strong>`, 'block');
    }
}

// --- Challenge Resolver ---
async function resolveChallenge(actor, challenger, claimedCharacter, localGameId) {
    logGame(`⚡ <strong>${challenger.name}</strong> ประกาศท้าทาย (Challenge) การอ้างสิทธิ์ของ <strong>${actor.name}</strong>!`, 'challenge');
    Sound.playChallenge();
    triggerScreenShake();
    await delay(1200);
    if (localGameId !== gameId) return { bluffed: true };
    
    const roleNeeded = CHARACTER_DETAILS[claimedCharacter] ? claimedCharacter : claimedCharacter; // normal character code
    const matchingCardIndex = actor.cards.findIndex(c => !c.dead && c.role === roleNeeded);
    
    if (matchingCardIndex !== -1) {
        // ACTOR HAS THE CARD (Told truth)
        logGame(`🟢 <strong>${actor.name}</strong> มีการ์ดจริง! แสดงการ์ด <strong>${CHARACTER_DETAILS[roleNeeded].name}</strong> ต่อผู้เล่นทุกคน`, 'challenge');
        Sound.playCard();
        
        // Show card in center
        await showCardRevealAnimation(actor.name, roleNeeded, `แสดงการ์ด <strong>${CHARACTER_DETAILS[roleNeeded].name}</strong> เพื่อพิสูจน์สิทธิ์!`, false);
        if (localGameId !== gameId) return { bluffed: true };
        
        // Shuffle this card back into deck and draw a new one
        const oldCard = actor.cards[matchingCardIndex];
        deck.push(createCard(oldCard.role));
        shuffle(deck);
        actor.cards[matchingCardIndex] = deck.pop();
        
        logGame(`🔄 <strong>${actor.name}</strong> นำการ์ดใบเดิมสับกลับเข้ากองกลาง และจั่วได้การ์ดใบใหม่`, 'system');
        updateUI();
        await delay(1000);
        if (localGameId !== gameId) return { bluffed: true };
        
        // Challenger loses 1 card
        logGame(`💀 <strong>${challenger.name}</strong> ท้าทายไม่สำเร็จและต้องสูญเสียอิทธิพล 1 ใบ!`, 'challenge');
        await forceCardDiscard(challenger, 'challenge-failed', localGameId);
        
        return { bluffed: false };
    } else {
        // ACTOR BLUFFED (Caught lying)
        logGame(`🔴 <strong>${actor.name}</strong> โกหก! ไม่มีแผนการการ์ด <strong>${CHARACTER_DETAILS[roleNeeded].name}</strong> ในมือ`, 'challenge');
        
        // Actor loses 1 card
        logGame(`💀 <strong>${actor.name}</strong> สูญเสียอิทธิพล 1 ใบจากการถูกจับโกหก!`, 'challenge');
        await forceCardDiscard(actor, 'challenge-lost', localGameId);
        
        return { bluffed: true };
    }
}

// Forces a player to choose an active card to turn dead
async function forceCardDiscard(player, reason, localGameId) {
    let cardIdxToLose = -1;
    const activeCards = player.cards.filter(c => !c.dead);
    
    if (activeCards.length === 0) return;
    
    if (activeCards.length === 1) {
        // Only one card left, it dies automatically
        cardIdxToLose = player.cards.findIndex(c => !c.dead);
    } else {
        // 2 active cards, must choose one
        if (player.isAI) {
            // AI chooses card to lose
            cardIdxToLose = chooseAICardToLose(player, reason);
        } else {
            // Human chooses card to lose
            setStatusDesc('กรุณาเลือกการ์ดใบที่คุณต้องการทิ้ง (หงายการ์ดขึ้นเพื่อสละสิทธิ์)...');
            const userCardOptions = player.cards.map((c, i) => ({ ...c, idx: i, origin: `ตำแหน่งที่ ${i+1}` })).filter(c => !c.dead);
            
            const selectedIndices = await promptHumanCardDiscard(
                player,
                'สละสิทธิ์การ์ดอิทธิพล',
                `คุณต้องเลือกการ์ด 1 ใบให้เสียชีวิตจากสาเหตุ: ${reason === 'assassinate' ? 'ถูกลอบสังหาร' : reason === 'coup' ? 'ถูกทำรัฐประหาร' : 'การท้าทายล้มเหลว'}`,
                userCardOptions,
                1
            );
            if (localGameId !== gameId) return;
            cardIdxToLose = userCardOptions[selectedIndices[0]].idx;
        }
    }
    
    // Add Card Shake animation before dying!
    const podId = getPodId(player.id);
    const podNum = podId.split('-')[1];
    const cardEl = document.getElementById(`p${podNum}-card${cardIdxToLose}`);
    if (cardEl) {
        cardEl.classList.add('shake-card');
        await delay(600); // let card shake
        if (localGameId !== gameId) return;
        cardEl.classList.remove('shake-card');
    }
    
    // Mark card as dead and trigger screen shake!
    triggerScreenShake();
    player.cards[cardIdxToLose].dead = true;
    const lostCardRole = player.cards[cardIdxToLose].role;
    
    // Show dead card in center
    await showCardRevealAnimation(player.name, lostCardRole, `สูญเสียการ์ดอิทธิพล: <strong>${CHARACTER_DETAILS[lostCardRole].name}</strong> (ตาย) 💀`, true);
    if (localGameId !== gameId) return;
    
    logGame(`💀 <strong>${player.name}</strong> หงายการ์ดสูญเสียอิทธิพล: <strong>${CHARACTER_DETAILS[lostCardRole].name}</strong>!`, 'eliminated');
    Sound.playCoup();
    
    // Check if player is eliminated
    if (player.cards.every(c => c.dead)) {
        player.isEliminated = true;
        logGame(`🚫 🚫 <strong>${player.name}</strong> การ์ดในมือตายหมดแล้ว! ถูกคัดออกจากการแข่งขัน 🚫 🚫`, 'eliminated');
    }
    
    updateUI();
    await delay(1200);
}

// Exchange resolver for Ambassador action
async function resolveExchange(actor, localGameId) {
    // Ambassador Exchange flow
    if (actor.isAI) {
        // AI: draws 2 cards, looks at all active cards, keeps the best, returns others to deck
        const drawnCards = [deck.pop(), deck.pop()];
        const activeCards = actor.cards.filter(c => !c.dead);
        const originalCardsCount = activeCards.length;
        
        // Pool of available cards
        const pool = [...activeCards, ...drawnCards];
        
        // Sort pool by character value/AI preference
        const orderPref = actor.aiStyle === 'aggressive' ? ['captain', 'assassin', 'duke', 'ambassador', 'contessa'] :
                          actor.aiStyle === 'cautious' ? ['duke', 'contessa', 'ambassador', 'captain', 'assassin'] :
                          ['duke', 'captain', 'assassin', 'contessa', 'ambassador'];
                          
        pool.sort((a, b) => orderPref.indexOf(a.role) - orderPref.indexOf(b.role));
        
        // Take the top originalCardsCount cards
        const keptCards = pool.slice(0, originalCardsCount);
        const returnedCards = pool.slice(originalCardsCount);
        
        // Put returned cards back in deck
        returnedCards.forEach(c => deck.push(c));
        shuffle(deck);
        
        // Re-construct actor's hand
        let keptIdx = 0;
        actor.cards.forEach(c => {
            if (!c.dead) {
                c.role = keptCards[keptIdx].role;
                keptIdx++;
            }
        });
        
    } else {
        // Human: draws 2 cards, selects which to keep
        const drawn1 = deck.pop();
        const drawn2 = deck.pop();
        
        const activeCardsWithIdx = actor.cards.map((c, i) => ({ ...c, originalIndex: i })).filter(c => !c.dead);
        const pool = [
            ...activeCardsWithIdx.map(c => ({ role: c.role, idx: c.originalIndex, origin: 'การ์ดปัจจุบันของคุณ' })),
            { role: drawn1.role, idx: -1, isDrawn: true, origin: 'การ์ดที่จั่วได้ใหม่ (ใบที่ 1)' },
            { role: drawn2.role, idx: -2, isDrawn: true, origin: 'การ์ดที่จั่วได้ใหม่ (ใบที่ 2)' }
        ];
        
        const keepCount = activeCardsWithIdx.length;
        setStatusDesc(`กรุณาเลือกการ์ดที่คุณต้องการเก็บไว้จำนวน ${keepCount} ใบ...`);
        
        const selectedIndices = await promptHumanCardDiscard(
            actor,
            `เจรจาแลกเปลี่ยนการ์ด (เก็บ ${keepCount} ใบ)`,
            `กรุณาเลือกการ์ดที่คุณต้องการจะถือครองต่อไป จำนวน ${keepCount} ใบ การ์ดที่เหลือจะถูกส่งคืนเข้ากองกลาง`,
            pool,
            keepCount
        );
        if (localGameId !== gameId) return;
        
        // Kept list
        const chosenCards = selectedIndices.map(idx => pool[idx]);
        
        // Returned list
        const unchosenCards = pool.filter((_, idx) => !selectedIndices.includes(idx));
        
        // Update player active cards
        let currentActiveIdx = 0;
        actor.cards.forEach((c, idx) => {
            if (!c.dead) {
                c.role = chosenCards[currentActiveIdx].role;
                currentActiveIdx++;
            }
        });
        
        // Return others to deck
        unchosenCards.forEach(item => {
            if (item.isDrawn) {
                if (item.idx === -1) deck.push(drawn1);
                if (item.idx === -2) deck.push(drawn2);
            } else {
                deck.push(createCard(item.role));
            }
        });
        shuffle(deck);
    }
    
    updateUI();
    Sound.playCard();
    logGame(`🔄 <strong>${actor.name}</strong> แลกการ์ดสำเร็จและสับการ์ดที่ไม่เลือกกลับเข้ากองกลาง`, 'system');
}

// --- Challenge & Block Queries ---
// --- Challenge & Block Queries ---
async function getChallenger(actor, claimedChar, reasonDesc, localGameId) {
    // 1. Loop through all players (other than actor) to see if they want to challenge
    // We prioritize checking the human player first so they don't lose the chance
    const checkedOrder = players.filter(p => p.id !== actor.id && !p.isEliminated);
    
    // Put human first in check
    const humanIdx = checkedOrder.findIndex(p => p.id === myPlayerId);
    if (humanIdx !== -1) {
        const human = checkedOrder.splice(humanIdx, 1)[0];
        checkedOrder.unshift(human);
    }
    
    for (let p of checkedOrder) {
        if (!p.isAI) {
            // Prompt human player
            const response = await promptHumanReaction(
                p,
                `<strong>${actor.name}</strong> ประกาศ <em>${reasonDesc}</em><br>คุณต้องการขัดขวางโดยทำการท้าทาย (Challenge) หรือไม่?`,
                [
                    { text: '⚡ ท้าทายเลย (Challenge)', value: 'challenge', class: 'danger' },
                    { text: 'ยอมให้กระทำ (Pass)', value: 'pass', class: 'primary' }
                ]
            );
            if (localGameId !== gameId) return null;
            if (response === 'challenge') {
                return p;
            }
        } else {
            // AI logic to challenge
            const wantsToChallenge = shouldAIChallenge(p, actor, claimedChar);
            if (wantsToChallenge) {
                return p;
            }
        }
    }
    return null;
}

async function getBlocker(actor, action, target, localGameId) {
    // Foreign Aid: Anyone can block
    if (action === 'foreign-aid') {
        const checkedOrder = players.filter(p => p.id !== actor.id && !p.isEliminated);
        
        // Put human first in check
        const humanIdx = checkedOrder.findIndex(p => p.id === myPlayerId);
        if (humanIdx !== -1) {
            const human = checkedOrder.splice(humanIdx, 1)[0];
            checkedOrder.unshift(human);
        }
        
        for (let p of checkedOrder) {
            if (!p.isAI) {
                const response = await promptHumanReaction(
                    p,
                    `<strong>${actor.name}</strong> กำลังขอรับ <em>ความช่วยเหลือจากต่างชาติ</em> (+2 เหรียญ)<br>คุณต้องการบล็อกการกระทำนี้โดยอ้างเป็น <strong>ดยุก (Duke)</strong> หรือไม่?`,
                    [
                        { text: '🛡️ บล็อก (อ้างเป็นดยุก)', value: 'block', class: 'danger' },
                        { text: 'ปล่อยผ่าน', value: 'pass', class: 'primary' }
                    ]
                );
                if (localGameId !== gameId) return null;
                if (response === 'block') {
                    return { blocker: p, character: 'duke' };
                }
            } else {
                const wantsToBlock = shouldAIBlockForeignAid(p);
                if (wantsToBlock) {
                    return { blocker: p, character: 'duke' };
                }
            }
        }
    } 
    // Steal & Assassinate: Only the target can block
    else if (action === 'steal' || action === 'assassinate') {
        if (!target.isAI) {
            if (action === 'steal') {
                const response = await promptHumanReaction(
                    target,
                    `⚠️ <strong>${actor.name}</strong> กำลังจะทำการปล้นเหรียญของคุณ!<br>คุณต้องการบล็อกด้วยตัวละครใด หรือยอมจำนน?`,
                    [
                        { text: '🛡️ บล็อกด้วย กัปตัน (Captain)', value: 'block-captain', class: 'secondary' },
                        { text: '🛡️ บล็อกด้วย ทูต (Ambassador)', value: 'block-ambassador', class: 'secondary' },
                        { text: 'ยอมให้ปล้น', value: 'pass', class: 'primary' }
                    ]
                );
                if (localGameId !== gameId) return null;
                if (response === 'block-captain') return { blocker: target, character: 'captain' };
                if (response === 'block-ambassador') return { blocker: target, character: 'ambassador' };
            } else if (action === 'assassinate') {
                const response = await promptHumanReaction(
                    target,
                    `🚨 💥 <strong>${actor.name}</strong> สั่งนักฆ่ามาลอบสังหารคุณ!<br>คุณต้องตัดสินใจว่าจะป้องกันหรือยอมจำนน?`,
                    [
                        { text: '🛡️ ป้องกันด้วย คอนเตสซา (Contessa)', value: 'block', class: 'danger' },
                        { text: 'ยอมรับความตาย', value: 'pass', class: 'primary' }
                    ]
                );
                if (localGameId !== gameId) return null;
                if (response === 'block') return { blocker: target, character: 'contessa' };
            }
        } else {
            // AI block checks
            const wantsToBlock = shouldAIBlockTargeted(target, actor, action);
            if (wantsToBlock) {
                return { blocker: target, character: wantsToBlock }; // returns character role string
            }
        }
    }
    return null;
}

// --- AI Decisional Heuristics ---

// Weighted random selection of action
function getAIDecision(aiPlayer) {
    const weights = {};
    const aliveCards = aiPlayer.cards.filter(c => !c.dead);
    const handRoles = aliveCards.map(c => c.role);
    
    // Basic moves
    weights['income'] = 12;
    weights['foreign-aid'] = 18;
    
    // Duke Tax
    if (handRoles.includes('duke')) {
        weights['tax'] = 50;
    } else {
        // Bluff duke tax
        weights['tax'] = aiPlayer.aiStyle === 'aggressive' ? 25 : 
                         aiPlayer.aiStyle === 'opportunistic' ? 20 : 
                         aiPlayer.aiStyle === 'chaos' ? 40 : 
                         aiPlayer.aiStyle === 'arbitrator' ? 4 : 6;
    }
    
    // Captain Steal
    const potentialStealTargets = players.filter(p => p.id !== aiPlayer.id && !p.isEliminated && p.coins > 0);
    if (potentialStealTargets.length > 0) {
        if (handRoles.includes('captain')) {
            weights['steal'] = 45;
        } else {
            // Bluff steal
            weights['steal'] = aiPlayer.aiStyle === 'aggressive' ? 30 : 
                               aiPlayer.aiStyle === 'opportunistic' ? 15 : 
                               aiPlayer.aiStyle === 'chaos' ? 35 : 
                               aiPlayer.aiStyle === 'arbitrator' ? 2 : 0;
        }
    }
    
    // Ambassador Exchange
    if (handRoles.includes('ambassador')) {
        weights['exchange'] = 25;
    } else {
        // exchange is rarely bluffed by bots
        weights['exchange'] = aiPlayer.aiStyle === 'chaos' ? 12 : 4;
    }
    
    // Assassin Assassinate
    if (aiPlayer.coins >= 3) {
        const potentialAssassinateTargets = players.filter(p => p.id !== aiPlayer.id && !p.isEliminated);
        if (potentialAssassinateTargets.length > 0) {
            if (handRoles.includes('assassin')) {
                weights['assassinate'] = 65;
            } else {
                weights['assassinate'] = aiPlayer.aiStyle === 'aggressive' ? 35 : 
                                         aiPlayer.aiStyle === 'opportunistic' ? 20 : 
                                         aiPlayer.aiStyle === 'chaos' ? 45 : 
                                         aiPlayer.aiStyle === 'arbitrator' ? 1 : 0;
            }
        }
    }
    
    // Coup
    if (aiPlayer.coins >= 7) {
        weights['coup'] = 75;
    }
    
    // Select action via weighted choice
    let chosenAction = 'income';
    let pool = [];
    
    Object.keys(weights).forEach(act => {
        const weight = weights[act];
        for (let w = 0; w < weight; w++) {
            pool.push(act);
        }
    });
    
    if (pool.length > 0) {
        chosenAction = pool[Math.floor(Math.random() * pool.length)];
    }
    
    // Select Target if needed
    let target = null;
    if (needsTarget(chosenAction)) {
        target = chooseAITarget(aiPlayer);
    }
    
    return { action: chosenAction, target: target };
}

function chooseAITarget(aiPlayer) {
    const opponents = players.filter(p => p.id !== aiPlayer.id && !p.isEliminated);
    if (opponents.length === 0) return null;
    
    // Chaos AI targets 100% randomly
    if (aiPlayer.aiStyle === 'chaos') {
        return opponents[Math.floor(Math.random() * opponents.length)];
    }
    
    // Aggressive & Opportunistic target the lead player (human or AI with most cards/coins)
    // Cautious targets randomly or the human player
    opponents.sort((a, b) => {
        const aScore = a.cards.filter(c => !c.dead).length * 10 + a.coins;
        const bScore = b.cards.filter(c => !c.dead).length * 10 + b.coins;
        return bScore - aScore; // highest score first
    });
    
    // 70% chance to target the strongest opponent
    if (Math.random() < 0.7) {
        return opponents[0];
    } else {
        return opponents[Math.floor(Math.random() * opponents.length)];
    }
}

// AI logic for challenges
function shouldAIChallenge(aiPlayer, actor, claimedChar) {
    // If the challenger is also the target of a theft/assassination, they are more eager
    // Counting known cards
    const knownOnTable = players.flatMap(p => p.cards).filter(c => c.dead && c.role === claimedChar).length;
    const knownInHand = aiPlayer.cards.filter(c => !c.dead && c.role === claimedChar).length;
    const totalKnown = knownOnTable + knownInHand;
    
    // Impossible bluff check: 3 already accounted for
    if (totalKnown >= 3) {
        return true; 
    }
    
    // Probability based heuristics
    let challengeChance = 0.05; // base level
    
    if (aiPlayer.aiStyle === 'aggressive') challengeChance = 0.18;
    if (aiPlayer.aiStyle === 'opportunistic') challengeChance = 0.12;
    if (aiPlayer.aiStyle === 'chaos') challengeChance = 0.28; // challenges very frequently!
    if (aiPlayer.aiStyle === 'arbitrator') challengeChance = 0.25; // loves to catch bluffs!
    
    // If actor is doing exceptionally well (lots of coins)
    if (actor.coins >= 6) challengeChance += 0.15;
    
    // Deduct chance if AI has only 1 card (survival risk)
    const aliveCardsCount = aiPlayer.cards.filter(c => !c.dead).length;
    if (aliveCardsCount === 1) {
        challengeChance -= 0.12;
    }
    
    return Math.random() < challengeChance;
}

// AI checks if they should block Foreign Aid (Must claim Duke)
function shouldAIBlockForeignAid(aiPlayer) {
    const hasDuke = aiPlayer.cards.some(c => !c.dead && c.role === 'duke');
    
    if (hasDuke) {
        // Cautious and Arbitrator always block foreign aid if they have Duke
        return Math.random() < (aiPlayer.aiStyle === 'cautious' || aiPlayer.aiStyle === 'arbitrator' ? 0.9 : 0.6);
    } else {
        // Bluff block Duke
        if (aiPlayer.aiStyle === 'aggressive') {
            return Math.random() < 0.2; // 20% bluff rate
        }
        if (aiPlayer.aiStyle === 'chaos') {
            return Math.random() < 0.35; // 35% bluff rate
        }
        return false;
    }
}

// AI checks if they should block targeted Steal/Assassination
function shouldAIBlockTargeted(aiPlayer, actor, action) {
    const aliveRoles = aiPlayer.cards.filter(c => !c.dead).map(c => c.role);
    
    if (action === 'steal') {
        const hasCaptain = aliveRoles.includes('captain');
        const hasAmbassador = aliveRoles.includes('ambassador');
        
        if (hasCaptain) return 'captain';
        if (hasAmbassador) return 'ambassador';
        
        // Bluff block
        const bluffRate = aiPlayer.aiStyle === 'aggressive' ? 0.6 : 
                          aiPlayer.aiStyle === 'chaos' ? 0.75 :
                          aiPlayer.aiStyle === 'opportunistic' ? 0.4 : 
                          aiPlayer.aiStyle === 'arbitrator' ? 0.15 : 0.1;
        if (Math.random() < bluffRate) {
            return Math.random() < 0.5 ? 'captain' : 'ambassador';
        }
    } 
    else if (action === 'assassinate') {
        const hasContessa = aliveRoles.includes('contessa');
        if (hasContessa) return 'contessa';
        
        // Survival instinct: If AI doesn't block Contessa, they will lose 1 card for sure.
        const bluffRate = aiPlayer.aiStyle === 'chaos' ? 0.9 : 0.75;
        if (Math.random() < bluffRate) {
            return 'contessa';
        }
    }
    return null;
}

// AI chooses card to lose
function chooseAICardToLose(aiPlayer, reason) {
    const activeIndices = [];
    aiPlayer.cards.forEach((c, idx) => {
        if (!c.dead) activeIndices.push(idx);
    });
    
    if (activeIndices.length <= 1) return activeIndices[0];
    
    // Choose which one to discard
    const card0 = aiPlayer.cards[activeIndices[0]];
    const card1 = aiPlayer.cards[activeIndices[1]];
    
    // Value characters:
    const priority = ['ambassador', 'contessa', 'duke', 'assassin', 'captain'];
    
    const val0 = priority.indexOf(card0.role);
    const val1 = priority.indexOf(card1.role);
    
    // Discard the lower priority card
    return val0 < val1 ? activeIndices[0] : activeIndices[1];
}

// --- End Game Screen ---
function declareWinner() {
    const winner = players.find(p => !p.isEliminated);
    const title = document.getElementById('gameover-title');
    const msg = document.getElementById('gameover-message');
    
    if (winner) {
        if (winner.id === myPlayerId) {
            title.innerText = '🏆 ชัยชนะเป็นของคุณ!';
            title.style.color = 'var(--gold)';
            msg.innerHTML = `ยินดีด้วย! คุณสามารถโค่นล้มอิทธิพลสภาสมาคม และกุมอำนาจรัฐสภา COUP ได้อย่างสมบูรณ์แบบ!<br><br>เหรียญที่เหลือ: 🪙 ${winner.coins} เหรียญ`;
            Sound.playWin();
            logGame(`🏆 🏆 <strong>${winner.name}</strong> ชนะการแข่งขัน ยึดครองอำนาจรัฐ COUP สำเร็จ! 🏆 🏆`, 'win');
        } else {
            title.innerText = '💀 คุณพ่ายแพ้!';
            title.style.color = 'var(--card-dead)';
            msg.innerHTML = `ผู้ชนะคือ <strong>${winner.name}</strong>! <br>อิทธิพลของคุณถูกกำจัดจนหมดสิ้น ลองใหม่อีกครั้งเพื่อกู้คืนเกียรติยศของคุณ!`;
            logGame(`🏆 🏆 <strong>${winner.name}</strong> ชนะการแข่งขัน และสามารถควบรวมอำนาจไว้ในมือได้! 🏆 🏆`, 'win');
        }
    }
    openOverlay('gameover-overlay');
}

// Trigger initial start
window.onload = () => {
    showStartupScreen();
};

// --- Multiplayer Connection & Event Handling ---
function showScreen(screenId) {
    document.getElementById('startup-mode-screen').style.display = 'none';
    document.getElementById('startup-single-screen').style.display = 'none';
    document.getElementById('startup-multi-screen').style.display = 'none';
    document.getElementById('startup-lobby-screen').style.display = 'none';
    document.getElementById(screenId).style.display = 'block';
}

function showModeSelection() {
    showScreen('startup-mode-screen');
}

function showSinglePlayerConfig() {
    showScreen('startup-single-screen');
}

function showMultiplayerConfig() {
    showScreen('startup-multi-screen');
}

function connectAndCreateRoom() {
    const nameInput = document.getElementById('multi-player-name');
    const serverIpInput = document.getElementById('multi-server-ip');
    
    const name = nameInput.value.trim() || 'ผู้เล่น 0';
    const serverIp = serverIpInput.value.trim() || 'localhost:8080';
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let cleanIp = serverIp.replace(/^(ws:\/\/|wss:\/\/|http:\/\/|https:\/\/)/, '');
    
    socket = new WebSocket(`${protocol}//${cleanIp}`);
    
    socket.onopen = () => {
        socket.send(JSON.stringify({
            type: 'create_room',
            payload: { playerName: name }
        }));
    };
    
    socket.onmessage = handleSocketMessage;
    
    socket.onclose = () => {
        logGame('🔴 การเชื่อมต่อเซิร์ฟเวอร์หลุด หรือเซิร์ฟเวอร์ปิดลง', 'system');
        disconnectMultiplayer();
    };
    
    socket.onerror = (err) => {
        console.error('Socket error:', err);
        alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่าเซิร์ฟเวอร์เปิดใช้งานอยู่ และระบุ IP ถูกต้อง');
        disconnectMultiplayer();
    };
}

function connectAndJoinRoom() {
    const nameInput = document.getElementById('multi-player-name');
    const roomCodeInput = document.getElementById('multi-room-code');
    const serverIpInput = document.getElementById('multi-server-ip');
    
    const name = nameInput.value.trim() || 'ผู้เล่น';
    const roomCode = roomCodeInput.value.trim().toUpperCase();
    const serverIp = serverIpInput.value.trim() || 'localhost:8080';
    
    if (!roomCode) {
        alert('กรุณากรอกรหัสห้องที่จะเข้าร่วม');
        return;
    }
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let cleanIp = serverIp.replace(/^(ws:\/\/|wss:\/\/|http:\/\/|https:\/\/)/, '');
    
    socket = new WebSocket(`${protocol}//${cleanIp}`);
    
    socket.onopen = () => {
        socket.send(JSON.stringify({
            type: 'join_room',
            payload: { roomCode: roomCode, playerName: name }
        }));
    };
    
    socket.onmessage = handleSocketMessage;
    
    socket.onclose = () => {
        logGame('🔴 การเชื่อมต่อเซิร์ฟเวอร์หลุด หรือเซิร์ฟเวอร์ปิดลง', 'system');
        disconnectMultiplayer();
    };
    
    socket.onerror = (err) => {
        console.error('Socket error:', err);
        alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่าเซิร์ฟเวอร์เปิดใช้งานอยู่ และระบุ IP ถูกต้อง');
        disconnectMultiplayer();
    };
}

function selectLobbyPlayersCount(num) {
    lobbyPlayersCount = num;
    for (let i = 3; i <= 6; i++) {
        const btn = document.getElementById(`lobby-btn-${i}`);
        if (btn) {
            if (i === num) {
                btn.className = 'choice-btn primary';
            } else {
                btn.className = 'choice-btn secondary';
            }
        }
    }
}

function hostStartMultiplayer() {
    if (lobbyPlayersCount < mpClients.length) {
        alert(`จำนวนที่นั่งที่เลือก (${lobbyPlayersCount} คน) น้อยกว่าจำนวนผู้เล่นที่เป็นคนจริงในห้องขณะนี้ (${mpClients.length} คน) กรุณาเพิ่มจำนวนผู้เล่น`);
        return;
    }
    
    const aiCount = lobbyPlayersCount - mpClients.length;
    
    socket.send(JSON.stringify({
        type: 'start_game',
        payload: { aiCount: aiCount }
    }));
}

function disconnectMultiplayer() {
    if (socket) {
        socket.close();
        socket = null;
    }
    isMultiplayer = false;
    isHost = false;
    myPlayerId = 0;
    activeOverlayBeforePeek = null;
    
    showStartupScreen();
}

function handleSocketMessage(event) {
    const data = JSON.parse(event.data);
    const { type, payload } = data;
    
    if (type === 'room_created') {
        isHost = true;
        myPlayerId = 0;
        roomCode = payload.roomCode;
        document.getElementById('lobby-code-display').innerText = roomCode;
        
        showScreen('startup-lobby-screen');
        document.getElementById('lobby-host-controls').style.display = 'block';
        document.getElementById('lobby-peer-status').style.display = 'none';
        document.getElementById('lobby-start-game-btn').style.display = 'block';
        
        selectLobbyPlayersCount(4);
    }
    
    else if (type === 'room_joined') {
        isHost = false;
        myPlayerId = payload.clientId;
        roomCode = payload.roomCode;
        document.getElementById('lobby-code-display').innerText = roomCode;
        
        showScreen('startup-lobby-screen');
        document.getElementById('lobby-host-controls').style.display = 'none';
        document.getElementById('lobby-peer-status').style.display = 'block';
        document.getElementById('lobby-start-game-btn').style.display = 'none';
    }
    
    else if (type === 'room_state') {
        mpClients = payload.clients;
        document.getElementById('lobby-count-display').innerText = mpClients.length;
        
        const listEl = document.getElementById('lobby-players-list');
        listEl.innerHTML = '';
        mpClients.forEach(c => {
            const li = document.createElement('li');
            li.style.padding = '8px 12px';
            li.style.background = 'rgba(255,255,255,0.03)';
            li.style.border = '1px solid rgba(255,255,255,0.05)';
            li.style.borderRadius = '6px';
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            
            li.innerHTML = `
                <span>👤 ${c.name} ${c.id === myPlayerId ? '<strong>(คุณ)</strong>' : ''}</span>
                <span style="font-size: 10px; color: ${c.isHost ? 'var(--gold-text)' : '#8892b0'}; border: 1px solid ${c.isHost ? 'var(--gold)' : 'rgba(255,255,255,0.1)'}; padding: 1px 6px; border-radius: 4px;">
                    ${c.isHost ? 'หัวหน้าห้อง (HOST)' : 'ผู้เข้าร่วม'}
                </span>
            `;
            listEl.appendChild(li);
        });
    }
    
    else if (type === 'game_started') {
        closeOverlay('startup-overlay');
        isMultiplayer = true;
        
        if (!isHost) {
            logGame(`🎮 เริ่มเกมเล่นออนไลน์ห้อง ${roomCode}! รอข้อมูลการแจกการ์ดจากห้องหลัก...`, 'system');
        } else {
            const playerCount = mpClients.length + payload.aiCount;
            initGame(playerCount);
        }
    }
    
    else if (type === 'sync_state') {
        if (!isHost) {
            const state = payload;
            
            players = state.players;
            deck = { length: state.deckCount };
            treasury = state.treasury;
            turnIndex = state.turnIndex;
            
            updateUI();
            
            setPhaseLabel(state.phaseLabel);
            setStatusDesc(state.statusDesc);
            
            highlightActivePlayer(players[turnIndex].id);
            
            const logContainer = document.getElementById('game-log');
            if (state.logsHtml && logContainer) {
                logContainer.innerHTML = state.logsHtml;
                logContainer.scrollTop = logContainer.scrollHeight;
            }
        }
    }
    
    else if (type === 'prompt_request') {
        handlePeerPromptRequest(payload);
    }
    
    else if (type === 'prompt_response') {
        const { playerId, value } = payload;
        if (activePrompts[playerId]) {
            activePrompts[playerId](value);
            delete activePrompts[playerId];
        }
    }
    
    else if (type === 'error') {
        alert(payload.message);
        disconnectMultiplayer();
    }
}

async function requestRemotePrompt(playerId, type, data) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'prompt_request',
            payload: {
                targetPlayerId: playerId,
                promptType: type,
                promptData: data
            }
        }));
        
        return new Promise((resolve) => {
            activePrompts[playerId] = (value) => {
                resolve(value);
            };
        });
    }
}

function broadcastGameState() {
    if (isMultiplayer && isHost && socket && socket.readyState === WebSocket.OPEN) {
        const logContainer = document.getElementById('game-log');
        const state = {
            players: players.map(p => ({
                id: p.id,
                name: p.name,
                coins: p.coins,
                cards: p.cards.map(c => ({
                    role: c.role,
                    dead: c.dead
                })),
                isAI: p.isAI,
                isEliminated: p.isEliminated
            })),
            deckCount: deck.length,
            treasury: treasury,
            turnIndex: turnIndex,
            phaseLabel: document.getElementById('phase-label').innerText,
            statusDesc: document.getElementById('status-desc').innerText,
            logsHtml: logContainer ? logContainer.innerHTML : ''
        };
        
        socket.send(JSON.stringify({
            type: 'sync_state',
            payload: state
        }));
    }
}

async function handlePeerPromptRequest(payload) {
    const { promptType, promptData } = payload;
    
    if (promptType === 'action') {
        const me = players.find(p => p.id === myPlayerId);
        document.getElementById('btn-coup').disabled = me.coins < 7;
        document.getElementById('btn-assassinate').disabled = me.coins < 3;
        openOverlay('action-overlay');
    }
    
    else if (promptType === 'target') {
        const { action, options } = promptData;
        const container = document.getElementById('targets-container');
        container.innerHTML = '';
        
        const title = document.getElementById('target-modal-title');
        title.innerText = action === 'coup' ? 'เลือกผู้เล่นที่จะทำรัฐประหาร' : 
                          action === 'assassinate' ? 'เลือกผู้เล่นที่จะลอบสังหาร' : 'เลือกผู้เล่นที่จะปล้น';
        
        options.forEach(pOpt => {
            const btn = document.createElement('button');
            btn.className = 'target-btn';
            btn.innerHTML = `<span>${pOpt.name}</span> <span>🪙 ${pOpt.coins} เหรียญ | 🎴 การ์ดที่เหลือ: ${pOpt.cardsCount} ใบ</span>`;
            btn.onclick = () => {
                closeOverlay('target-overlay');
                socket.send(JSON.stringify({
                    type: 'prompt_response',
                    payload: { value: pOpt.id }
                }));
            };
            container.appendChild(btn);
        });
        
        openOverlay('target-overlay');
    }
    
    else if (promptType === 'reaction') {
        const { promptText, buttons } = promptData;
        
        document.getElementById('reaction-prompt-text').innerHTML = promptText;
        const container = document.getElementById('reaction-buttons-container');
        container.innerHTML = '';
        
        buttons.forEach(btnInfo => {
            const btn = document.createElement('button');
            btn.className = `choice-btn ${btnInfo.class || 'secondary'}`;
            btn.innerText = btnInfo.text;
            btn.onclick = () => {
                closeOverlay('reaction-overlay');
                socket.send(JSON.stringify({
                    type: 'prompt_response',
                    payload: { value: btnInfo.value }
                }));
            };
            container.appendChild(btn);
        });
        
        openOverlay('reaction-overlay');
        
        const bar = document.getElementById('reaction-timer-bar');
        if (bar) bar.style.width = '100%';
    }
    
    else if (promptType === 'card') {
        const { promptTitle, promptDesc, cardsToSelectFrom, selectCount } = promptData;
        
        const title = document.getElementById('card-select-title');
        title.innerText = promptTitle;
        
        const desc = document.getElementById('card-select-desc');
        desc.innerText = promptDesc;
        
        const container = document.getElementById('card-select-container');
        container.innerHTML = '';
        
        selectedExchangeCards = [];
        const confirmBtn = document.getElementById('card-select-confirm-btn');
        confirmBtn.disabled = true;
        
        cardsToSelectFrom.forEach((card, idx) => {
            const details = CHARACTER_DETAILS[card.role];
            const cardItem = document.createElement('div');
            cardItem.className = `card card-select-item ${details.colorClass}`;
            cardItem.innerHTML = `
                <div class="card-inner" style="transform: rotateY(180deg)">
                    <div class="card-front">
                        <span class="card-role">${details.name}</span>
                        <span class="card-icon">${details.icon}</span>
                        <span class="card-status-label">${card.origin || 'ในมือ'}</span>
                    </div>
                </div>
            `;
            
            cardItem.onclick = () => {
                Sound.playCard();
                if (selectCount === 1) {
                    container.querySelectorAll('.card-select-item').forEach(c => c.classList.remove('selected'));
                    cardItem.classList.add('selected');
                    selectedExchangeCards = [idx];
                    confirmBtn.disabled = false;
                } else {
                    if (cardItem.classList.contains('selected')) {
                        cardItem.classList.remove('selected');
                        selectedExchangeCards = selectedExchangeCards.filter(i => i !== idx);
                    } else {
                        if (selectedExchangeCards.length < selectCount) {
                            cardItem.classList.add('selected');
                            selectedExchangeCards.push(idx);
                        }
                    }
                    confirmBtn.disabled = (selectedExchangeCards.length !== selectCount);
                }
            };
            container.appendChild(cardItem);
        });
        
        openOverlay('card-select-overlay');
    }
}
