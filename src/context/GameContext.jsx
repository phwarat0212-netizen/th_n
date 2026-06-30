import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import Sound from '../utils/sound';

const GameContext = createContext();

// --- Constants & Config ---
export const ROLES = [
  'shield', 'alliance', 'change', 'check',
  'undertaker', 'grab2', 'ceo',
  'murderer', 'sniper', 'instigator'
];

export const CHARACTER_DETAILS = {
  shield: { name: 'ป้องกัน', icon: '🛡️', action: 'shield', block: '', label: 'Shield', colorClass: 'card-shield', color: 'blue' },
  alliance: { name: 'ผูกพันธมิตร', icon: '🤝', action: 'alliance', block: '', label: 'Alliance', colorClass: 'card-alliance', color: 'blue' },
  change: { name: 'เปลี่ยนโรล', icon: '🔄', action: 'change', block: '', label: 'Change', colorClass: 'card-change', color: 'blue' },
  check: { name: 'เช็คโรล', icon: '🔍', action: 'check', block: '', label: 'Check', colorClass: 'card-check', color: 'blue' },
  
  undertaker: { name: 'สัปเหร่อ', icon: '⚰️', action: 'undertaker', block: '', label: 'Undertaker', colorClass: 'card-undertaker', color: 'green' },
  grab2: { name: 'จก2', icon: '🤲', action: 'grab2', block: '', label: 'Grab2', colorClass: 'card-grab2', color: 'green' },
  ceo: { name: 'ประธานบริษัท', icon: '👔', action: 'ceo', block: '', label: 'CEO', colorClass: 'card-ceo', color: 'green' },
  
  murderer: { name: 'ฆาตกร', icon: '🔪', action: 'murderer', block: '', label: 'Murderer', colorClass: 'card-murderer', color: 'red' },
  sniper: { name: 'สไนเปอร์', icon: '🎯', action: 'sniper', block: '', label: 'Sniper', colorClass: 'card-sniper', color: 'red' },
  instigator: { name: 'นักปั่น', icon: '🗣️', action: 'instigator', block: '', label: 'Instigator', colorClass: 'card-instigator', color: 'red' }
};

export const ACTION_LABELS = {
  'income': 'รายได้ปกติ (+1)',
  'coup': 'รัฐประหาร (-7)',
  'shield': 'ป้องกัน (จ่าย 1)',
  'alliance': 'ผูกพันธมิตร',
  'change': 'เปลี่ยนโรล',
  'check': 'เช็คโรล',
  'undertaker': 'สัปเหร่อ (สิทธิ์รับเงินคนตาย)',
  'grab2': 'จก2 (+2)',
  'ceo': 'ประธานบริษัท (+4)',
  'murderer': 'ฆาตกร (จ่าย 3 โจมตี)',
  'sniper': 'สไนเปอร์ (จ่าย 4 เล็งเป้า)',
  'instigator': 'นักปั่น (จ่าย 3 ยุยง)'
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export function GameProvider({ children }) {
  // --- React State for rendering ---
  const [players, setPlayers] = useState([]);
  const [deckCount, setDeckCount] = useState(0);
  const [treasury, setTreasury] = useState(30);
  const [turnIndex, setTurnIndex] = useState(0);
  const [phaseLabel, setPhaseLabel] = useState('กำลังเริ่มเกม...');
  const [statusDesc, setStatusDesc] = useState('กำลังแจกการ์ดและเหรียญ...');
  const [logs, setLogs] = useState([]);
  
  // Overlay Visibility State
  const [activeOverlay, setActiveOverlay] = useState('startup'); // 'startup', 'action', 'target', 'reaction', 'card-select', 'rules', 'gameover', null
  const [startupScreen, setStartupScreen] = useState('mode'); // 'mode', 'single', 'multi', 'lobby'
  
  // Overlay Config Prompt States
  const [actionOverlayButtonsDisabled, setActionOverlayButtonsDisabled] = useState({ coup: true, assassinate: true });
  const [targetPrompt, setTargetPrompt] = useState({ title: '', options: [] });
  const [reactionPrompt, setReactionPrompt] = useState({ text: '', buttons: [] });
  const [cardSelectPrompt, setCardSelectPrompt] = useState({ title: '', desc: '', cards: [], count: 1 });
  const [gameOverPrompt, setGameOverPrompt] = useState({ title: '', message: '' });
  
  // Animation / Visual Effects State
  const [isShaking, setIsShaking] = useState(false);
  const [shakingCard, setShakingCard] = useState(null); // { playerId, cardIdx }
  const [cardReveal, setCardReveal] = useState({ active: false, playerName: '', cardRole: '', messageText: '', isDead: false });
  const [peekPreviousOverlay, setPeekPreviousOverlay] = useState(null);

  // Multiplayer Room State
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [myPlayerId, setMyPlayerId] = useState(0);
  const [mpClients, setMpClients] = useState([]);
  const [lobbyPlayersCount, setLobbyPlayersCount] = useState(4);
  const [serverIp, setServerIp] = useState('localhost:8080');
  const [playerName, setPlayerName] = useState('ผู้เล่น');
  
  // --- Refs for game loop to avoid stale closure values ---
  const gameIdRef = useRef(0);
  const playersRef = useRef([]);
  const deckRef = useRef([]);
  const treasuryRef = useRef(30);
  const turnIndexRef = useRef(0);
  const isMultiplayerRef = useRef(false);
  const isHostRef = useRef(false);
  const myPlayerIdRef = useRef(0);
  const roomCodeRef = useRef('');
  const socketRef = useRef(null);
  const sniperAimsRef = useRef([]);
  const activePromptsRef = useRef({});

  // Human Input Resolvers Refs
  const humanActionResolverRef = useRef(null);
  const humanTargetResolverRef = useRef(null);
  const humanReactionResolverRef = useRef(null);
  const humanCardSelectResolverRef = useRef(null);

  // --- Animation Helpers ---
  const triggerScreenShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  const animateCoinsBetweenElements = (fromId, toId, amount) => {
    if (amount <= 0) return;
    const fromEl = document.getElementById(fromId);
    const toEl = document.getElementById(toId);
    if (!fromEl || !toEl) return;
    
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    const visualCoinsCount = Math.min(amount, 8);
    
    for (let i = 0; i < visualCoinsCount; i++) {
      setTimeout(() => {
        const coin = document.createElement('div');
        coin.className = 'flying-coin';
        coin.innerText = '🪙';
        coin.style.position = 'fixed';
        coin.style.left = `${fromRect.left + fromRect.width / 2 - 12}px`;
        coin.style.top = `${fromRect.top + fromRect.height / 2 - 12}px`;
        coin.style.zIndex = '9999';
        
        document.body.appendChild(coin);
        coin.offsetWidth; // force reflow
        
        coin.style.left = `${toRect.left + toRect.width / 2 - 12}px`;
        coin.style.top = `${toRect.top + toRect.height / 2 - 12}px`;
        coin.style.transform = `scale(1.4) rotate(${360 + Math.random() * 360}deg)`;
        coin.style.opacity = '0';
        
        setTimeout(() => coin.remove(), 650);
      }, i * 100);
    }
  };

  const showCardRevealAnimation = async (playerName, cardRole, messageText, isDead = false) => {
    setCardReveal({ active: true, playerName, cardRole, messageText, isDead });
    Sound.playCard();
    await delay(2200);
    setCardReveal(prev => ({ ...prev, active: false }));
    await delay(400);
  };

  // --- UI State Syncing helper ---
  const updateUI = () => {
    setPlayers([...playersRef.current]);
    setTreasury(treasuryRef.current);
    setDeckCount(deckRef.current.length);
    setTurnIndex(turnIndexRef.current);
    
    // Disable overlays and check player coins
    const me = playersRef.current.find(p => p.id === myPlayerIdRef.current);
    if (me) {
      const mustCoup = me.coins >= 10;
      setActionOverlayButtonsDisabled({
        income: mustCoup,
        shield: mustCoup || me.coins < 1,
        alliance: mustCoup,
        change: mustCoup,
        check: mustCoup,
        grab2: mustCoup,
        ceo: mustCoup,
        murderer: mustCoup || me.coins < 3,
        sniper: mustCoup || me.coins < 4,
        instigator: mustCoup || me.coins < 3,
        coup: me.coins < 7
      });
    }

    // Broadcast state if multiplayer and host
    broadcastGameState();
  };

  const logGame = (text, type = 'system') => {
    setLogs(prev => [...prev, { text, type }]);
  };

  const getPodId = (playerId) => {
    if (!isMultiplayerRef.current) return `player-${playerId}`;
    const idx = playersRef.current.findIndex(p => p.id === playerId);
    const myIdx = playersRef.current.findIndex(p => p.id === myPlayerIdRef.current);
    if (idx === -1 || myIdx === -1) return `player-0`;
    const diff = (idx - myIdx + playersRef.current.length) % playersRef.current.length;
    return `player-${diff}`;
  };

  // --- Game Flow Methods ---
  const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };

  const createCard = (role) => ({ role, dead: false });

  const showStartupScreen = () => {
    setActiveOverlay('startup');
    setStartupScreen('mode');
    setLogs([]);
    gameIdRef.current++;
    
    // Disconnect multiplayer if connected
    disconnectMultiplayer();
  };

  const initGame = (playerCount = 4) => {
    Sound.init();
    gameIdRef.current++; // invalidate previous loop

    setLogs([]);
    logGame(`... เริ่มเกมใหม่สำหรับผู้เล่น ${playerCount} คน! แจกการ์ดคนละ 3 ใบ และเหรียญคนละ 2 เหรียญ`, 'system');

    treasuryRef.current = 50 - (playerCount * 2);
    sniperAimsRef.current = [];
    
    deckRef.current = [];
    ROLES.forEach(role => {
      deckRef.current.push(createCard(role));
      deckRef.current.push(createCard(role));
      deckRef.current.push(createCard(role));
    });
    shuffle(deckRef.current);

    if (isMultiplayerRef.current && isHostRef.current) {
      const tempPlayers = mpClients.map(c => ({
        id: c.id,
        name: c.id === 0 ? 'คุณ (คุณ)' : c.name,
        coins: 2,
        cards: [],
        isAI: false,
        isEliminated: false
      }));

      const botsNeeded = playerCount - mpClients.length;
      const botPool = [
        { id: 10, name: 'AI 1 (ดุดัน)', coins: 2, cards: [], isAI: true, isEliminated: false, aiStyle: 'aggressive' },
        { id: 11, name: 'AI 2 (รอบคอบ)', coins: 2, cards: [], isAI: true, isEliminated: false, aiStyle: 'cautious' },
        { id: 12, name: 'AI 3 (เจ้าเล่ห์)', coins: 2, cards: [], isAI: true, isEliminated: false, aiStyle: 'opportunistic' },
        { id: 13, name: 'AI 4 (ชอบป่วน)', coins: 2, cards: [], isAI: true, isEliminated: false, aiStyle: 'chaos' },
        { id: 14, name: 'AI 5 (สายจับผิด)', coins: 2, cards: [], isAI: true, isEliminated: false, aiStyle: 'arbitrator' }
      ];

      for (let i = 0; i < botsNeeded; i++) {
        tempPlayers.push(botPool[i]);
      }
      playersRef.current = tempPlayers;
    } else {
      const botPool = [
        { id: 1, name: 'AI 1 (ดุดัน)', coins: 2, cards: [], isAI: true, isEliminated: false, aiStyle: 'aggressive' },
        { id: 2, name: 'AI 2 (รอบคอบ)', coins: 2, cards: [], isAI: true, isEliminated: false, aiStyle: 'cautious' },
        { id: 3, name: 'AI 3 (เจ้าเล่ห์)', coins: 2, cards: [], isAI: true, isEliminated: false, aiStyle: 'opportunistic' },
        { id: 4, name: 'AI 4 (ชอบป่วน)', coins: 2, cards: [], isAI: true, isEliminated: false, aiStyle: 'chaos' },
        { id: 5, name: 'AI 5 (สายจับผิด)', coins: 2, cards: [], isAI: true, isEliminated: false, aiStyle: 'arbitrator' }
      ];

      playersRef.current = [{ id: 0, name: 'คุณ (คุณ)', coins: 2, cards: [], isAI: false, isEliminated: false }];
      for (let i = 0; i < playerCount - 1; i++) {
        playersRef.current.push(botPool[i]);
      }
    }

    playersRef.current.forEach(p => {
      p.isEliminated = false;
      p.coins = 2;
      p.cards = [deckRef.current.pop(), deckRef.current.pop(), deckRef.current.pop()];
    });

    setActiveOverlay(null);
    turnIndexRef.current = Math.floor(Math.random() * playersRef.current.length);

    updateUI();
    Sound.playCard();

    if (!isMultiplayerRef.current || isHostRef.current) {
      startGameLoop(gameIdRef.current);
    }
  };

  // --- Main Game Loop Async State Machine ---
  const startGameLoop = async (localGameId) => {
    while (localGameId === gameIdRef.current) {
      const activePlayer = playersRef.current[turnIndexRef.current];
      
      const activePlayersCount = playersRef.current.filter(p => !p.isEliminated).length;
      if (activePlayersCount <= 1) {
        break;
      }
      
      if (activePlayer.isEliminated) {
        nextTurnIndex();
        continue;
      }

      setTurnIndex(turnIndexRef.current);
      setPhaseLabel(`รอบของ ${activePlayer.name}`);
      setStatusDesc(`รอ ${activePlayer.name} ดำเนินการ...`);
      
      await delay(1200);
      if (localGameId !== gameIdRef.current) return;

      // Check Sniper Aim
      const sniperAimIdx = sniperAimsRef.current.findIndex(aim => aim.actorId === activePlayer.id);
      if (sniperAimIdx !== -1) {
        const aim = sniperAimsRef.current[sniperAimIdx];
        sniperAimsRef.current.splice(sniperAimIdx, 1); // Consume the aim
        
        const targetPlayer = playersRef.current.find(p => p.id === aim.targetId);
        if (targetPlayer && !targetPlayer.isEliminated) {
          logGame(`🎯 สไนเปอร์ของ <strong>${activePlayer.name}</strong> ลั่นไกใส่ <strong>${targetPlayer.name}</strong>!`, 'sniper');
          await delay(1000);
          if (localGameId !== gameIdRef.current) return;
          
          if (targetPlayer.allianceWith === activePlayer.id) {
            logGame(`🛡️ การโจมตีไร้ผลเนื่องจาก <strong>${targetPlayer.name}</strong> เป็นพันธมิตรกับ <strong>${activePlayer.name}</strong>!`, 'system');
          } else if (targetPlayer.shieldCount > 0) {
            targetPlayer.shieldCount--;
            logGame(`🛡️ กระสุนสไนเปอร์ถูกป้องกันไว้ได้ด้วยโล่ของ <strong>${targetPlayer.name}</strong>! (โล่คงเหลือ ${targetPlayer.shieldCount || 0} ชิ้น)`, 'system');
          } else {
            logGame(`☠️ <strong>${targetPlayer.name}</strong> เสียเลือด 1 จากการถูกสไนเปอร์ยิง!`, 'sniper');
            await forceCardDiscard(targetPlayer, 'sniper-shot', localGameId);
            if (localGameId !== gameIdRef.current) return;
          }
          updateUI();
          await delay(1000);
        }
      }
      
      let action = '';
      let target = null;
      
      // 10 Coins constraint
      if (activePlayer.coins >= 10) {
        logGame(`⚠️ <strong>${activePlayer.name}</strong> มีเหรียญตั้งแต่ 10 เหรียญขึ้นไป บังคับทำการรัฐประหาร (Coup)!`, 'system');
        action = 'coup';
        if (activePlayer.isAI) {
          target = chooseAITarget(activePlayer);
        } else {
          target = await getHumanTarget('coup');
          if (localGameId !== gameIdRef.current) return;
        }
      } else {
        if (activePlayer.isAI) {
          const decision = getAIDecision(activePlayer);
          action = decision.action;
          target = decision.target;
        } else {
          action = await getHumanAction();
          if (localGameId !== gameIdRef.current) return;
          if (needsTarget(action)) {
            target = await getHumanTarget(action);
            if (localGameId !== gameIdRef.current) return;
          }
        }
      }
      
      await resolveActionSequence(activePlayer, action, target, localGameId);
      if (localGameId !== gameIdRef.current) return;
      
      updateUI();
      await delay(1000);
      if (localGameId !== gameIdRef.current) return;
      nextTurnIndex();
    }
    
    if (localGameId === gameIdRef.current) {
      declareWinner();
    }
  };

  const nextTurnIndex = () => {
    turnIndexRef.current = (turnIndexRef.current + 1) % playersRef.current.length;
  };

  const needsTarget = (action) => {
    return ['coup', 'alliance', 'check', 'murderer', 'sniper', 'instigator'].includes(action);
  };

  // --- Action Resolvers ---
  const resolveActionSequence = async (actor, action, target, localGameId) => {
    setPhaseLabel(`การดำเนินการ: ${ACTION_LABELS[action]}`);
    
    const actorPodId = getPodId(actor.id);
    
    if (action === 'coup') {
      animateCoinsBetweenElements(`${actorPodId}-coins`, 'treasury-pile', 7);
      actor.coins -= 7;
      treasuryRef.current += 7;
      Sound.playCoup();
      logGame(`💥 <strong>${actor.name}</strong> จ่าย 7 เหรียญทำการรัฐประหาร (Coup) ใส่ <strong>${target.name}</strong>!`, 'coup');
      await delay(800);
      if (localGameId !== gameIdRef.current) return;
      updateUI();
      await forceCardDiscard(target, 'coup', localGameId);
      return;
    }
    
    if (action === 'income') {
      animateCoinsBetweenElements('treasury-pile', `${actorPodId}-coins`, 1);
      actor.coins += 1;
      treasuryRef.current -= 1;
      Sound.playCoin();
      logGame(`🪙 <strong>${actor.name}</strong> ขอรับรายได้ปกติ (Income) ได้รับ 1 เหรียญ`, 'income');
      await delay(600);
      if (localGameId !== gameIdRef.current) return;
      updateUI();
      return;
    }

    if (action === 'shield') {
      animateCoinsBetweenElements(`${actorPodId}-coins`, 'treasury-pile', 1);
      actor.coins -= 1;
      treasuryRef.current += 1;
      Sound.playCoin();
      logGame(`🛡️ <strong>${actor.name}</strong> จ่าย 1 เหรียญเพื่อสร้างโล่ป้องกัน (อ้างสิทธิ์เป็นป้องกัน)`, 'shield');
      await delay(600);
      if (localGameId !== gameIdRef.current) return;
      updateUI();
    } else if (action === 'alliance') {
      logGame(`🤝 <strong>${actor.name}</strong> ขอผูกพันธมิตรกับ <strong>${target.name}</strong> (อ้างสิทธิ์เป็นผู้ผูกพันธมิตร)`, 'alliance');
    } else if (action === 'change') {
      logGame(`🔄 <strong>${actor.name}</strong> ขอเปลี่ยนการ์ดในมือใหม่ (อ้างสิทธิ์เป็นเปลี่ยนโรล)`, 'change');
    } else if (action === 'check') {
      logGame(`🔍 <strong>${actor.name}</strong> ขอตรวจสอบโรลของ <strong>${target.name}</strong> (อ้างสิทธิ์เป็นเช็คโรล)`, 'check');
    } else if (action === 'grab2') {
      logGame(`🤲 <strong>${actor.name}</strong> ขอรับ 2 เหรียญจากกองกลาง (อ้างสิทธิ์เป็นจก2)`, 'grab2');
    } else if (action === 'ceo') {
      logGame(`👔 <strong>${actor.name}</strong> ขอรับ 4 เหรียญจากกองกลาง (อ้างสิทธิ์เป็นประธานบริษัท)`, 'ceo');
    } else if (action === 'murderer') {
      animateCoinsBetweenElements(`${actorPodId}-coins`, `${getPodId(target.id)}-coins`, 3);
      actor.coins -= 3;
      target.coins += 3;
      Sound.playCard();
      logGame(`🔪 <strong>${actor.name}</strong> จ่าย 3 เหรียญโดยตรงให้ <strong>${target.name}</strong> และสั่งลอบฆ่า! (อ้างสิทธิ์เป็นฆาตกร)`, 'murderer');
      await delay(800);
      if (localGameId !== gameIdRef.current) return;
      updateUI();
    } else if (action === 'sniper') {
      animateCoinsBetweenElements(`${actorPodId}-coins`, 'treasury-pile', 4);
      actor.coins -= 4;
      treasuryRef.current += 4;
      Sound.playCard();
      logGame(`🎯 <strong>${actor.name}</strong> จ่าย 4 เหรียญและใช้สไนเปอร์เล็งเป้า <strong>${target.name}</strong>! (อ้างสิทธิ์เป็นสไนเปอร์)`, 'sniper');
      await delay(800);
      if (localGameId !== gameIdRef.current) return;
      updateUI();
    } else if (action === 'instigator') {
      animateCoinsBetweenElements(`${actorPodId}-coins`, 'treasury-pile', 3);
      actor.coins -= 3;
      treasuryRef.current += 3;
      Sound.playCard();
      logGame(`🗣️ <strong>${actor.name}</strong> จ่าย 3 เหรียญปั่นหัววงวงยุยงโจมตี <strong>${target.name}</strong>! (อ้างสิทธิ์เป็นนักปั่น)`, 'instigator');
      await delay(800);
      if (localGameId !== gameIdRef.current) return;
      updateUI();
    }
    
    await delay(1200);
    if (localGameId !== gameIdRef.current) return;
    
    // --- Step 1: Challenge Window ---
    let challengeResult = null;
    const claimedChar = CHARACTER_DETAILS[action] ? action : '';
    
    if (claimedChar) {
      const challenger = await getChallenger(actor, claimedChar, `อ้างสิทธิ์เป็น ${CHARACTER_DETAILS[action].name} เพื่อทำ ${ACTION_LABELS[action]}`, localGameId);
      if (localGameId !== gameIdRef.current) return;
      if (challenger) {
        challengeResult = await resolveChallenge(actor, challenger, action, localGameId);
        if (localGameId !== gameIdRef.current) return;
        if (challengeResult.bluffed) {
          // Actor bluffed, action fails
          return;
        }
      }
    }
    
    // --- Step 3: Resolve the Action ---
    if (action === 'shield') {
      actor.shieldCount = (actor.shieldCount || 0) + 1;
      logGame(`✅ <strong>${actor.name}</strong> กางโล่ป้องกันสำเร็จ! (มีโล่คงเหลือ ${actor.shieldCount} ชั้น)`, 'shield');
    } 
    else if (action === 'alliance') {
      playersRef.current.forEach(p => {
        if (p.allianceWith === actor.id) p.allianceWith = null;
        if (p.allianceWith === target.id) p.allianceWith = null;
      });
      actor.allianceWith = target.id;
      target.allianceWith = actor.id;
      logGame(`✅ <strong>${actor.name}</strong> และ <strong>${target.name}</strong> ได้ผูกพันธมิตรสำเร็จ! ทั้งคู่ห้ามโจมตีกัน`, 'alliance');
    }
    else if (action === 'change') {
      const aliveCards = actor.cards.filter(c => !c.dead);
      aliveCards.forEach(c => deckRef.current.push(createCard(c.role)));
      shuffle(deckRef.current);
      
      actor.cards = actor.cards.map(c => {
        if (!c.dead) {
          return deckRef.current.pop();
        }
        return c;
      });
      logGame(`✅ <strong>${actor.name}</strong> เปลี่ยนการ์ดสำเร็จและจั่วได้การ์ดใบใหม่ทดแทน`, 'change');
      Sound.playCard();
    }
    else if (action === 'check') {
      await resolveCheckRole(actor, target, localGameId);
    }
    else if (action === 'grab2') {
      animateCoinsBetweenElements('treasury-pile', `${actorPodId}-coins`, 2);
      actor.coins += 2;
      treasuryRef.current -= 2;
      Sound.playCoin();
      logGame(`✅ <strong>${actor.name}</strong> ได้รับ 2 เหรียญสำเร็จ`, 'grab2');
    }
    else if (action === 'ceo') {
      animateCoinsBetweenElements('treasury-pile', `${actorPodId}-coins`, 4);
      actor.coins += 4;
      treasuryRef.current -= 4;
      Sound.playCoin();
      logGame(`✅ <strong>${actor.name}</strong> ได้รับ 4 เหรียญสำเร็จ`, 'ceo');
      updateUI();
      await delay(800);
      if (localGameId !== gameIdRef.current) return;
      
      await resolveCEOCompensation(actor, localGameId);
    }
    else if (action === 'murderer') {
      if (target.allianceWith === actor.id) {
        logGame(`🛡️ การโจมตีไร้ผลเนื่องจาก <strong>${target.name}</strong> เป็นพันธมิตรกับ <strong>${actor.name}</strong>!`, 'system');
      } else if (target.shieldCount > 0) {
        target.shieldCount--;
        logGame(`🛡️ <strong>${target.name}</strong> ใช้โล่ป้องกันการลอบฆ่าได้สำเร็จ! (โล่คงเหลือ ${target.shieldCount || 0} ชิ้น)`, 'system');
      } else {
        logGame(`☠️ <strong>${target.name}</strong> ถูกลอบสังหารโดยฆาตกร!`, 'murderer');
        await forceCardDiscard(target, 'murdered', localGameId);
      }
    }
    else if (action === 'sniper') {
      const existingAimIdx = sniperAimsRef.current.findIndex(aim => aim.actorId === actor.id);
      if (existingAimIdx !== -1) {
        sniperAimsRef.current[existingAimIdx].targetId = target.id;
      } else {
        sniperAimsRef.current.push({ actorId: actor.id, targetId: target.id });
      }
      logGame(`✅ <strong>${actor.name}</strong> ล็อคเป้าหมาย <strong>${target.name}</strong> สำเร็จ!`, 'sniper');
    }
    else if (action === 'instigator') {
      await resolveInstigatorRound(actor, target, localGameId);
    }
  };

  const resolveCheckRole = async (actor, target, localGameId) => {
    const targetActiveCards = target.cards.filter(c => !c.dead);
    if (targetActiveCards.length === 0) return;
    const targetCard = targetActiveCards[0];
    const targetIdx = target.cards.indexOf(targetCard);
    target.cards.splice(targetIdx, 1);
    
    const deckCard = deckRef.current.pop();
    const actorActiveCards = actor.cards.filter(c => !c.dead);
    const K = actorActiveCards.length;
    const actorDeadCards = actor.cards.filter(c => c.dead);
    
    if (!actor.isAI) {
      // Human player
      const pool = [
        ...actorActiveCards.map(c => ({ role: c.role, origin: 'การ์ดในมือคุณ' })),
        { role: deckCard.role, origin: 'การ์ดจากกองกลาง' },
        { role: targetCard.role, origin: `การ์ดจากคุณ ${target.name}` }
      ];
      
      setCardSelectPrompt({
        title: `เช็คโรล: เลือก ${K} ใบเพื่อเก็บไว้สำหรับตัวคุณ`,
        desc: `เลือกการ์ดที่คุณจะเก็บไว้เป็นอิทธิพลใหม่ของคุณเอง`,
        cards: pool,
        count: K
      });
      setActiveOverlay('card-select');
      const firstSelectionIndices = await new Promise(resolve => {
        humanCardSelectResolverRef.current = resolve;
      });
      setActiveOverlay(null);
      
      const keptCards = firstSelectionIndices.map(idx => pool[idx]);
      const remainingPool = pool.filter((_, idx) => !firstSelectionIndices.includes(idx));
      
      setCardSelectPrompt({
        title: `เช็คโรล: เลือก 1 ใบที่จะมอบให้ ${target.name}`,
        desc: `เลือกการ์ดที่จะคืนให้ผู้เล่นเป้าหมายเป็นอิทธิพลของเขา`,
        cards: remainingPool,
        count: 1
      });
      setActiveOverlay('card-select');
      const secondSelectionIndices = await new Promise(resolve => {
        humanCardSelectResolverRef.current = resolve;
      });
      setActiveOverlay(null);
      
      const cardForTarget = remainingPool[secondSelectionIndices[0]];
      const lastCard = remainingPool.find((_, idx) => idx !== secondSelectionIndices[0]);
      
      actor.cards = [...actorDeadCards, ...keptCards.map(c => createCard(c.role))];
      target.cards.push(createCard(cardForTarget.role));
      deckRef.current.push(createCard(lastCard.role));
      shuffle(deckRef.current);
    } else {
      // AI player
      const pool = [...actorActiveCards, deckCard, targetCard];
      const prefOrder = ['ceo', 'grab2', 'murderer', 'sniper', 'shield', 'check', 'change', 'alliance', 'instigator', 'undertaker'];
      pool.sort((a, b) => prefOrder.indexOf(a.role) - prefOrder.indexOf(b.role));
      
      const keptCards = pool.slice(0, K);
      const cardForTarget = pool[K];
      const lastCard = pool[K + 1];
      
      actor.cards = [...actorDeadCards, ...keptCards.map(c => createCard(c.role))];
      target.cards.push(createCard(cardForTarget.role));
      deckRef.current.push(createCard(lastCard.role));
      shuffle(deckRef.current);
    }
    logGame(`✅ <strong>${actor.name}</strong> ทำการเช็คโรล เรียบร้อยแล้ว!`, 'check');
  };

  const resolveCEOCompensation = async (actor, localGameId) => {
    const otherPlayers = playersRef.current.filter(p => p.id !== actor.id && !p.isEliminated);
    for (let p of otherPlayers) {
      let claimed = false;
      if (!p.isAI) {
        const response = await promptHumanReaction(
          p,
          `<strong>${actor.name}</strong> อ้างสิทธิ์เป็นประธานบริษัทและได้รับ 4 เหรียญ<br>คุณต้องการอ้างสิทธิ์เป็นประธานบริษัทเช่นกันเพื่อรับเงิน 1 เหรียญหรือไม่?`,
          [
            { text: '👔 อ้างสิทธิ์เป็นประธาน (CEO)', value: 'claim', class: 'primary' },
            { text: 'ผ่าน', value: 'pass', class: 'secondary' }
          ]
        );
        if (localGameId !== gameIdRef.current) return;
        if (response === 'claim') claimed = true;
      } else {
        const hasCEO = p.cards.some(c => !c.dead && c.role === 'ceo');
        const rand = Math.random();
        if (hasCEO && rand < 0.7) claimed = true;
        else if (p.aiStyle === 'aggressive' && rand < 0.2) claimed = true;
      }
      
      if (claimed) {
        logGame(`👔 <strong>${p.name}</strong> อ้างสิทธิ์เป็นประธานบริษัทเช่นกันเพื่อรับ 1 เหรียญ!`, 'ceo');
        await delay(1000);
        if (localGameId !== gameIdRef.current) return;
        
        const challenger = await getChallenger(p, 'ceo', `อ้างสิทธิ์เป็นประธานบริษัทร่วมเพื่อรับ 1 เหรียญ`, localGameId);
        if (localGameId !== gameIdRef.current) return;
        
        let success = true;
        if (challenger) {
          const challengeResult = await resolveChallenge(p, challenger, 'ceo', localGameId);
          if (localGameId !== gameIdRef.current) return;
          if (challengeResult.bluffed) {
            success = false;
          }
        }
        
        if (success) {
          animateCoinsBetweenElements('treasury-pile', `${getPodId(p.id)}-coins`, 1);
          p.coins += 1;
          treasuryRef.current -= 1;
          logGame(`✅ <strong>${p.name}</strong> ได้รับเงินส่วนต่าง 1 เหรียญสำเร็จ`, 'ceo');
          Sound.playCoin();
          updateUI();
          await delay(800);
          if (localGameId !== gameIdRef.current) return;
        }
      }
    }
  };

  const resolveInstigatorRound = async (actor, target, localGameId) => {
    const contributors = playersRef.current.filter(p => p.id !== actor.id && p.id !== target.id && !p.isEliminated);
    const contributions = {};
    let totalContribution = 0;
    
    for (let p of contributors) {
      let amt = 0;
      if (!p.isAI) {
        const maxContribution = Math.min(p.coins, 4);
        const buttons = [{ text: 'ไม่จ่าย (0 เหรียญ)', value: 0 }];
        for (let i = 1; i <= maxContribution; i++) {
          buttons.push({ text: `จ่าย ${i} เหรียญ`, value: i });
        }
        
        const response = await promptHumanReaction(
          p,
          `🚨 <strong>${actor.name}</strong> ยุยงให้โจมตี <strong>${target.name}</strong>!<br>คุณต้องการสมทบทุนกี่เหรียญเพื่อให้ยอดรวมครบ 4 เหรียญหรือไม่?<br>(ยอดสะสมปัจจุบัน: ${totalContribution} เหรียญ)`,
          buttons
        );
        if (localGameId !== gameIdRef.current) return;
        amt = Number(response);
      } else {
        const targetStrength = target.cards.filter(c => !c.dead).length;
        if (p.aiStyle === 'aggressive' && targetStrength >= 2 && p.coins >= 2) {
          amt = 1;
        } else if (p.aiStyle === 'chaos' && p.coins >= 1) {
          amt = Math.random() < 0.5 ? 1 : 0;
        }
      }
      
      if (amt > 0) {
        contributions[p.id] = amt;
        totalContribution += amt;
        logGame(`🗣️ <strong>${p.name}</strong> สมทบทุนจ่าย ${amt} เหรียญ`, 'instigator');
      }
    }
    
    await delay(1000);
    if (localGameId !== gameIdRef.current) return;
    
    if (totalContribution >= 4) {
      logGame(`✅ ยอดสมทบทุนครบ ${totalContribution} เหรียญ! การยุยงสำเร็จ!`, 'instigator');
      for (let pid in contributions) {
        const amt = contributions[pid];
        const p = playersRef.current.find(pl => pl.id === Number(pid));
        if (p) {
          p.coins -= amt;
          treasuryRef.current += amt;
          animateCoinsBetweenElements(`${getPodId(p.id)}-coins`, 'treasury-pile', amt);
        }
      }
      updateUI();
      await delay(800);
      if (localGameId !== gameIdRef.current) return;
      
      if (target.allianceWith === actor.id) {
        logGame(`🛡️ การโจมตีไร้ผลเนื่องจาก <strong>${target.name}</strong> เป็นพันธมิตรกับ <strong>${actor.name}</strong>!`, 'system');
      } else if (target.shieldCount > 0) {
        target.shieldCount--;
        logGame(`🛡️ <strong>${target.name}</strong> ใช้โล่ป้องกันการโจมตียุยงได้สำเร็จ! (โล่คงเหลือ ${target.shieldCount || 0} ชิ้น)`, 'system');
      } else {
        logGame(`☠️ <strong>${target.name}</strong> สูญเสียการ์ดอิทธิพล 1 ใบจากการยุยง!`, 'instigator');
        await forceCardDiscard(target, 'instigated', localGameId);
      }
    } else {
      logGame(`❌ ยอดสมทบทุนรวมมีเพียง ${totalContribution} เหรียญ (ไม่ถึง 4 เหรียญ) การยุยงล้มเหลว!`, 'instigator');
    }
  };

  const resolveUndertakerRound = async (deceasedPlayer, localGameId) => {
    const alivePlayers = playersRef.current.filter(p => !p.isEliminated);
    const claimants = [];
    
    logGame(`⚰️ <strong>${deceasedPlayer.name}</strong> เสียชีวิตพร้อมกับเงิน <strong>${deceasedPlayer.coins}</strong> เหรียญ! มีใครอ้างสิทธิ์เป็นสัปเหร่อหรือไม่?`, 'undertaker');
    await delay(1200);
    if (localGameId !== gameIdRef.current) return;
    
    for (let p of alivePlayers) {
      let claimed = false;
      if (!p.isAI) {
        const response = await promptHumanReaction(
          p,
          `<strong>${deceasedPlayer.name}</strong> เสียชีวิตพร้อมเงิน ${deceasedPlayer.coins} เหรียญ!<br>คุณต้องการอ้างสิทธิ์เป็นสัปเหร่อ (Undertaker) เพื่อส่วนแบ่งเงินหรือไม่?`,
          [
            { text: '⚰️ อ้างสิทธิ์เป็นสัปเหร่อ', value: 'claim', class: 'primary' },
            { text: 'ผ่าน', value: 'pass', class: 'secondary' }
          ]
        );
        if (localGameId !== gameIdRef.current) return;
        if (response === 'claim') claimed = true;
      } else {
        const hasUndertaker = p.cards.some(c => !c.dead && c.role === 'undertaker');
        const rand = Math.random();
        if (hasUndertaker && rand < 0.8) claimed = true;
        else if (p.aiStyle === 'aggressive' && rand < 0.25) claimed = true;
        else if (p.aiStyle === 'opportunistic' && rand < 0.3) claimed = true;
      }
      
      if (claimed) {
        logGame(`⚰️ <strong>${p.name}</strong> อ้างสิทธิ์เป็นสัปเหร่อ!`, 'undertaker');
        await delay(1000);
        if (localGameId !== gameIdRef.current) return;
        
        const challenger = await getChallenger(p, 'undertaker', `อ้างสิทธิ์เป็นสัปเหร่อเพื่อแบ่งเงินคนตาย`, localGameId);
        if (localGameId !== gameIdRef.current) return;
        
        let success = true;
        if (challenger) {
          const challengeResult = await resolveChallenge(p, challenger, 'undertaker', localGameId);
          if (localGameId !== gameIdRef.current) return;
          if (challengeResult.bluffed) {
            success = false;
          }
        }
        
        if (success) {
          claimants.push(p);
        }
      }
    }
    
    if (claimants.length > 0) {
      const share = Math.floor(deceasedPlayer.coins / claimants.length);
      const remainder = deceasedPlayer.coins % claimants.length;
      
      logGame(`✅ สัปเหร่อที่รอดชีวิต (${claimants.length} คน) แบ่งเงินกันคนละ ${share} เหรียญ!`, 'undertaker');
      
      for (let p of claimants) {
        animateCoinsBetweenElements(`${getPodId(deceasedPlayer.id)}-coins`, `${getPodId(p.id)}-coins`, share);
        p.coins += share;
      }
      
      if (remainder > 0) {
        animateCoinsBetweenElements(`${getPodId(deceasedPlayer.id)}-coins`, 'treasury-pile', remainder);
        treasuryRef.current += remainder;
      }
      
      deceasedPlayer.coins = 0;
      updateUI();
    } else {
      logGame(`🏦 ไม่มีใครอ้างสิทธิ์เป็นสัปเหร่อ เงินทั้งหมดของ <strong>${deceasedPlayer.name}</strong> (${deceasedPlayer.coins} เหรียญ) ถูกส่งคืนกองกลาง`, 'undertaker');
      animateCoinsBetweenElements(`${getPodId(deceasedPlayer.id)}-coins`, 'treasury-pile', deceasedPlayer.coins);
      treasuryRef.current += deceasedPlayer.coins;
      deceasedPlayer.coins = 0;
      updateUI();
    }
    await delay(1000);
  };

  const resolveChallenge = async (actor, challenger, claimedCharacter, localGameId) => {
    logGame(`⚡ <strong>${challenger.name}</strong> ประกาศท้าทาย (Challenge) การอ้างสิทธิ์ของ <strong>${actor.name}</strong>!`, 'challenge');
    Sound.playChallenge();
    triggerScreenShake();
    await delay(1200);
    if (localGameId !== gameIdRef.current) return { bluffed: true };
    
    const roleNeeded = claimedCharacter;
    const matchingCardIndex = actor.cards.findIndex(c => !c.dead && c.role === roleNeeded);
    
    if (matchingCardIndex !== -1) {
      logGame(`🟢 <strong>${actor.name}</strong> มีการ์ดจริง! แสดงการ์ด <strong>${CHARACTER_DETAILS[roleNeeded].name}</strong> ต่อผู้เล่นทุกคน`, 'challenge');
      Sound.playCard();
      
      await showCardRevealAnimation(actor.name, roleNeeded, `แสดงการ์ด <strong>${CHARACTER_DETAILS[roleNeeded].name}</strong> เพื่อพิสูจน์สิทธิ์!`, false);
      if (localGameId !== gameIdRef.current) return { bluffed: true };
      
      const oldCard = actor.cards[matchingCardIndex];
      deckRef.current.push(createCard(oldCard.role));
      shuffle(deckRef.current);
      actor.cards[matchingCardIndex] = deckRef.current.pop();
      
      logGame(`🔄 <strong>${actor.name}</strong> นำการ์ดใบเดิมสับกลับเข้ากองกลาง และจั่วได้การ์ดใบใหม่`, 'system');
      updateUI();
      await delay(1000);
      if (localGameId !== gameIdRef.current) return { bluffed: true };
      
      logGame(`💀 <strong>${challenger.name}</strong> ท้าทายไม่สำเร็จและต้องสูญเสียอิทธิพล 1 ใบ!`, 'challenge');
      await forceCardDiscard(challenger, 'challenge-failed', localGameId);
      
      return { bluffed: false };
    } else {
      logGame(`🔴 <strong>${actor.name}</strong> โกหก! ไม่มีแผนการการ์ด <strong>${CHARACTER_DETAILS[roleNeeded].name}</strong> ในมือ`, 'challenge');
      
      logGame(`💀 <strong>${actor.name}</strong> สูญเสียอิทธิพล 1 ใบจากการถูกจับโกหก!`, 'challenge');
      await forceCardDiscard(actor, 'challenge-lost', localGameId);
      
      return { bluffed: true };
    }
  };

  const forceCardDiscard = async (player, reason, localGameId) => {
    let cardIdxToLose = -1;
    const activeCards = player.cards.filter(c => !c.dead);
    
    if (activeCards.length === 0) return;
    
    if (activeCards.length === 1) {
      cardIdxToLose = player.cards.findIndex(c => !c.dead);
    } else {
      if (player.isAI) {
        cardIdxToLose = chooseAICardToLose(player, reason);
      } else {
        setStatusDesc('กรุณาเลือกการ์ดใบที่คุณต้องการทิ้ง (หงายการ์ดขึ้นเพื่อสละสิทธิ์)...');
        const userCardOptions = player.cards.map((c, i) => ({ ...c, idx: i, origin: `ตำแหน่งที่ ${i+1}` })).filter(c => !c.dead);
        
        const selectedIndices = await promptHumanCardDiscard(
          player,
          'สละสิทธิ์การ์ดอิทธิพล',
          `คุณต้องเลือกการ์ด 1 ใบให้เสียชีวิตจากสาเหตุ: ${reason === 'assassinate' ? 'ถูกลอบสังหาร' : reason === 'coup' ? 'ถูกทำรัฐประหาร' : 'การท้าทายล้มเหลว'}`,
          userCardOptions,
          1
        );
        if (localGameId !== gameIdRef.current) return;
        cardIdxToLose = userCardOptions[selectedIndices[0]].idx;
      }
    }
    
    // Card shake animation
    setShakingCard({ playerId: player.id, cardIdx: cardIdxToLose });
    await delay(600);
    if (localGameId !== gameIdRef.current) return;
    setShakingCard(null);
    
    triggerScreenShake();
    player.cards[cardIdxToLose].dead = true;
    const lostCardRole = player.cards[cardIdxToLose].role;
    
    await showCardRevealAnimation(player.name, lostCardRole, `สูญเสียการ์ดอิทธิพล: <strong>${CHARACTER_DETAILS[lostCardRole].name}</strong> (ตาย) 💀`, true);
    if (localGameId !== gameIdRef.current) return;
    
    logGame(`💀 <strong>${player.name}</strong> หงายการ์ดสูญเสียอิทธิพล: <strong>${CHARACTER_DETAILS[lostCardRole].name}</strong>!`, 'eliminated');
    Sound.playCoup();
    
    if (player.cards.every(c => c.dead)) {
      player.isEliminated = true;
      logGame(`🚫 🚫 <strong>${player.name}</strong> การ์ดในมือตายหมดแล้ว! ถูกคัดออกจากการแข่งขัน 🚫 🚫`, 'eliminated');
      
      if (player.coins > 0) {
        await resolveUndertakerRound(player, localGameId);
        if (localGameId !== gameIdRef.current) return;
      }
    }
    
    updateUI();
    await delay(1200);
  };

  const getChallenger = async (actor, claimedChar, reasonDesc, localGameId) => {
    const checkedOrder = playersRef.current.filter(p => p.id !== actor.id && !p.isEliminated);
    
    const humanIdx = checkedOrder.findIndex(p => p.id === myPlayerIdRef.current);
    if (humanIdx !== -1) {
      const human = checkedOrder.splice(humanIdx, 1)[0];
      checkedOrder.unshift(human);
    }
    
    for (let p of checkedOrder) {
      if (!p.isAI) {
        const response = await promptHumanReaction(
          p,
          `<strong>${actor.name}</strong> ประกาศ <em>${reasonDesc}</em><br>คุณต้องการขัดขวางโดยทำการท้าทาย (Challenge) หรือไม่?`,
          [
            { text: '⚡ ท้าทายเลย (Challenge)', value: 'challenge', class: 'danger' },
            { text: 'ยอมให้กระทำ (Pass)', value: 'pass', class: 'primary' }
          ]
        );
        if (localGameId !== gameIdRef.current) return null;
        if (response === 'challenge') {
          return p;
        }
      } else {
        const wantsToChallenge = shouldAIChallenge(p, actor, claimedChar);
        if (wantsToChallenge) {
          return p;
        }
      }
    }
    return null;
  };

  const getBlocker = async (actor, action, target, localGameId) => {
    if (action === 'foreign-aid') {
      const checkedOrder = playersRef.current.filter(p => p.id !== actor.id && !p.isEliminated);
      
      const humanIdx = checkedOrder.findIndex(p => p.id === myPlayerIdRef.current);
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
          if (localGameId !== gameIdRef.current) return null;
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
    } else if (action === 'steal' || action === 'assassinate') {
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
          if (localGameId !== gameIdRef.current) return null;
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
          if (localGameId !== gameIdRef.current) return null;
          if (response === 'block') return { blocker: target, character: 'contessa' };
        }
      } else {
        const wantsToBlock = shouldAIBlockTargeted(target, actor, action);
        if (wantsToBlock) {
          return { blocker: target, character: wantsToBlock };
        }
      }
    }
    return null;
  };

  // --- AI Decisional Logic Port ---
  const getAIDecision = (aiPlayer) => {
    const weights = {};
    const aliveCards = aiPlayer.cards.filter(c => !c.dead);
    const handRoles = aliveCards.map(c => c.role);
    
    // Basic income weight
    weights['income'] = 8;
    
    // Shield weight: higher if they don't have shield
    const currentShields = aiPlayer.shieldCount || 0;
    if (currentShields === 0 && aiPlayer.coins >= 1) {
      weights['shield'] = handRoles.includes('shield') ? 35 : 12;
    }
    
    // Alliance weight: higher if they don't have an ally
    if (!aiPlayer.allianceWith) {
      weights['alliance'] = handRoles.includes('alliance') ? 25 : 8;
    }
    
    // Change card weight: higher if they have bad cards
    weights['change'] = handRoles.includes('change') ? 22 : 4;
    
    // Check role weight
    weights['check'] = handRoles.includes('check') ? 28 : 6;
    
    // Grab2 weight
    weights['grab2'] = handRoles.includes('grab2') ? 45 : 15;
    
    // CEO weight
    weights['ceo'] = handRoles.includes('ceo') ? 55 : 18;
    
    // Murderer weight (needs 3 coins)
    if (aiPlayer.coins >= 3) {
      weights['murderer'] = handRoles.includes('murderer') ? 60 : 20;
    }
    
    // Sniper weight (needs 4 coins)
    if (aiPlayer.coins >= 4) {
      weights['sniper'] = handRoles.includes('sniper') ? 65 : 25;
    }
    
    // Instigator weight (needs 3 coins)
    if (aiPlayer.coins >= 3) {
      weights['instigator'] = handRoles.includes('instigator') ? 40 : 12;
    }
    
    // Coup weight (needs 7 coins)
    if (aiPlayer.coins >= 7) {
      weights['coup'] = 85;
    }
    
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
    
    let target = null;
    if (needsTarget(chosenAction)) {
      target = chooseAITarget(aiPlayer);
    }
    
    return { action: chosenAction, target };
  };

  const chooseAITarget = (aiPlayer) => {
    let opponents = playersRef.current.filter(p => p.id !== aiPlayer.id && !p.isEliminated);
    if (opponents.length === 0) return null;
    
    // Exclude alliance if possible
    const nonAllies = opponents.filter(p => p.id !== aiPlayer.allianceWith);
    if (nonAllies.length > 0) {
      opponents = nonAllies;
    }
    
    if (aiPlayer.aiStyle === 'chaos') {
      return opponents[Math.floor(Math.random() * opponents.length)];
    }
    
    opponents.sort((a, b) => {
      const aScore = a.cards.filter(c => !c.dead).length * 10 + a.coins;
      const bScore = b.cards.filter(c => !c.dead).length * 10 + b.coins;
      return bScore - aScore;
    });
    
    if (Math.random() < 0.7) {
      return opponents[0];
    } else {
      return opponents[Math.floor(Math.random() * opponents.length)];
    }
  };

  const shouldAIChallenge = (aiPlayer, actor, claimedChar) => {
    const knownOnTable = playersRef.current.flatMap(p => p.cards).filter(c => c.dead && c.role === claimedChar).length;
    const knownInHand = aiPlayer.cards.filter(c => !c.dead && c.role === claimedChar).length;
    const totalKnown = knownOnTable + knownInHand;
    
    if (totalKnown >= 3) return true;
    
    let challengeChance = 0.05;
    if (aiPlayer.aiStyle === 'aggressive') challengeChance = 0.18;
    if (aiPlayer.aiStyle === 'opportunistic') challengeChance = 0.12;
    if (aiPlayer.aiStyle === 'chaos') challengeChance = 0.28;
    if (aiPlayer.aiStyle === 'arbitrator') challengeChance = 0.25;
    
    if (actor.coins >= 6) challengeChance += 0.15;
    
    const aliveCardsCount = aiPlayer.cards.filter(c => !c.dead).length;
    if (aliveCardsCount === 1) {
      challengeChance -= 0.12;
    }
    
    return Math.random() < challengeChance;
  };

  const chooseAICardToLose = (aiPlayer) => {
    const activeIndices = [];
    aiPlayer.cards.forEach((c, idx) => {
      if (!c.dead) activeIndices.push(idx);
    });
    
    if (activeIndices.length <= 1) return activeIndices[0] !== undefined ? activeIndices[0] : 0;
    
    const priority = ['change', 'alliance', 'instigator', 'undertaker', 'shield', 'check', 'grab2', 'murderer', 'sniper', 'ceo'];
    
    activeIndices.sort((idxA, idxB) => {
      const roleA = aiPlayer.cards[idxA].role;
      const roleB = aiPlayer.cards[idxB].role;
      return priority.indexOf(roleA) - priority.indexOf(roleB);
    });
    
    return activeIndices[0];
  };

  // --- End Game Handlers ---
  const declareWinner = () => {
    const winner = playersRef.current.find(p => !p.isEliminated);
    if (winner) {
      let titleText = '';
      let messageText = '';
      if (winner.id === myPlayerIdRef.current) {
        titleText = '🏆 ชัยชนะเป็นของคุณ!';
        messageText = `ยินดีด้วย! คุณสามารถโค่นล้มอิทธิพลสภาสมาคม และกุมอำนาจรัฐสภา COUP ได้อย่างสมบูรณ์แบบ!<br><br>เหรียญที่เหลือ: 🪙 ${winner.coins} เหรียญ`;
        Sound.playWin();
        logGame(`🏆 🏆 <strong>${winner.name}</strong> ชนะการแข่งขัน ยึดครองอำนาจรัฐ COUP สำเร็จ! 🏆 🏆`, 'win');
      } else {
        titleText = '💀 คุณพ่ายแพ้!';
        messageText = `ผู้ชนะคือ <strong>${winner.name}</strong>! <br>อิทธิพลของคุณถูกกำจัดจนหมดสิ้น ลองใหม่อีกครั้งเพื่อกู้คืนเกียรติยศของคุณ!`;
        logGame(`🏆 🏆 <strong>${winner.name}</strong> ชนะการแข่งขัน และสามารถควบรวมอำนาจไว้ในมือได้! 🏆 🏆`, 'win');
      }
      setGameOverPrompt({ title: titleText, message: messageText });
      setActiveOverlay('gameover');
    }
  };

  // --- Human Input Interface Methods (Resolvers) ---
  const getHumanAction = () => {
    if (isMultiplayerRef.current && myPlayerIdRef.current !== 0) {
      setStatusDesc(`รอ ${playersRef.current.find(p => p.id === myPlayerIdRef.current)?.name} เลือกการกระทำ...`);
      return requestRemotePrompt(myPlayerIdRef.current, 'action', {});
    }
    
    setActiveOverlay('action');
    return new Promise(resolve => {
      humanActionResolverRef.current = resolve;
    });
  };

  const selectAction = (action) => {
    setActiveOverlay(null);
    if (isMultiplayerRef.current && !isHostRef.current) {
      socketRef.current.send(JSON.stringify({
        type: 'prompt_response',
        payload: { value: action }
      }));
      return;
    }
    if (humanActionResolverRef.current) {
      humanActionResolverRef.current(action);
      humanActionResolverRef.current = null;
    }
  };

  const getHumanTarget = (action) => {
    if (isMultiplayerRef.current && myPlayerIdRef.current !== 0) {
      setStatusDesc(`รอ ${playersRef.current.find(p => p.id === myPlayerIdRef.current)?.name} เลือกเป้าหมาย...`);
      
      const options = playersRef.current.filter(p => p.id !== myPlayerIdRef.current && !p.isEliminated).map(p => ({
        id: p.id,
        name: p.name,
        coins: p.coins,
        cardsCount: p.cards.filter(c => !c.dead).length
      }));
      
      return requestRemotePrompt(myPlayerIdRef.current, 'target', { action, options }).then(response => {
        return playersRef.current.find(p => p.id === parseInt(response));
      });
    }
    
    const options = playersRef.current.filter(p => p.id !== 0 && !p.isEliminated);
    setTargetPrompt({
      title: action === 'coup' ? 'เลือกผู้เล่นที่จะทำรัฐประหาร' : 
             action === 'assassinate' ? 'เลือกผู้เล่นที่จะลอบสังหาร' : 'เลือกผู้เล่นที่จะปล้น',
      options
    });
    
    setActiveOverlay('target');
    return new Promise(resolve => {
      humanTargetResolverRef.current = resolve;
    });
  };

  const selectTarget = (targetPlayer) => {
    setActiveOverlay(null);
    if (isMultiplayerRef.current && !isHostRef.current) {
      socketRef.current.send(JSON.stringify({
        type: 'prompt_response',
        payload: { value: targetPlayer.id }
      }));
      return;
    }
    if (humanTargetResolverRef.current) {
      humanTargetResolverRef.current(targetPlayer);
      humanTargetResolverRef.current = null;
    }
  };

  const cancelTargetSelection = () => {
    setActiveOverlay(null);
    getHumanAction().then(act => {
      if (humanActionResolverRef.current) {
        humanActionResolverRef.current(act);
        humanActionResolverRef.current = null;
      }
    });
  };

  const promptHumanReaction = (player, promptText, buttons) => {
    if (isMultiplayerRef.current && player.id !== 0) {
      setStatusDesc(`รอ ${player.name} ตัดสินใจตอบโต้...`);
      return requestRemotePrompt(player.id, 'reaction', { promptText, buttons });
    }
    
    setReactionPrompt({ text: promptText, buttons });
    setActiveOverlay('reaction');
    
    return new Promise(resolve => {
      humanReactionResolverRef.current = resolve;
    });
  };

  const selectReaction = (value) => {
    setActiveOverlay(null);
    if (isMultiplayerRef.current && !isHostRef.current) {
      socketRef.current.send(JSON.stringify({
        type: 'prompt_response',
        payload: { value }
      }));
      return;
    }
    if (humanReactionResolverRef.current) {
      humanReactionResolverRef.current(value);
      humanReactionResolverRef.current = null;
    }
  };

  const promptHumanCardDiscard = (player, promptTitle, promptDesc, cardsToSelectFrom, selectCount = 1) => {
    if (isMultiplayerRef.current && player.id !== 0) {
      setStatusDesc(`รอ ${player.name} เลือกสละสิทธิ์หรือสลับการ์ด...`);
      return requestRemotePrompt(player.id, 'card', { promptTitle, promptDesc, cardsToSelectFrom, selectCount });
    }
    
    setCardSelectPrompt({ title: promptTitle, desc: promptDesc, cards: cardsToSelectFrom, count: selectCount });
    setActiveOverlay('card-select');
    
    return new Promise(resolve => {
      humanCardSelectResolverRef.current = resolve;
    });
  };

  const confirmCardSelection = (selectedIndices) => {
    setActiveOverlay(null);
    if (isMultiplayerRef.current && !isHostRef.current) {
      socketRef.current.send(JSON.stringify({
        type: 'prompt_response',
        payload: { value: selectedIndices }
      }));
      return;
    }
    if (humanCardSelectResolverRef.current) {
      humanCardSelectResolverRef.current(selectedIndices);
      humanCardSelectResolverRef.current = null;
    }
  };

  const peekTable = (overlayId) => {
    setPeekPreviousOverlay(overlayId);
    setActiveOverlay(null);
  };

  const stopPeeking = () => {
    if (peekPreviousOverlay) {
      setActiveOverlay(peekPreviousOverlay);
      setPeekPreviousOverlay(null);
    }
  };

  // --- Multiplayer Logic Port ---
  const connectAndCreateRoom = () => {
    setIsMultiplayer(true);
    isMultiplayerRef.current = true;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let cleanIp = serverIp.replace(/^(ws:\/\/|wss:\/\/|http:\/\/|https:\/\/)/, '');
    
    const ws = new WebSocket(`${protocol}//${cleanIp}`);
    socketRef.current = ws;
    
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'create_room',
        payload: { playerName }
      }));
    };
    
    ws.onmessage = handleSocketMessage;
    
    ws.onclose = () => {
      logGame('🔴 การเชื่อมต่อเซิร์ฟเวอร์หลุด หรือเซิร์ฟเวอร์ปิดลง', 'system');
      disconnectMultiplayer();
    };
    
    ws.onerror = (err) => {
      console.error('Socket error:', err);
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่าเซิร์ฟเวอร์เปิดใช้งานอยู่ และระบุ IP ถูกต้อง');
      disconnectMultiplayer();
    };
  };

  const connectAndJoinRoom = (roomCodeInput) => {
    if (!roomCodeInput) {
      alert('กรุณากรอกรหัสห้องที่จะเข้าร่วม');
      return;
    }
    setIsMultiplayer(true);
    isMultiplayerRef.current = true;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let cleanIp = serverIp.replace(/^(ws:\/\/|wss:\/\/|http:\/\/|https:\/\/)/, '');
    
    const ws = new WebSocket(`${protocol}//${cleanIp}`);
    socketRef.current = ws;
    
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'join_room',
        payload: { roomCode: roomCodeInput.toUpperCase(), playerName }
      }));
    };
    
    ws.onmessage = handleSocketMessage;
    
    ws.onclose = () => {
      logGame('🔴 การเชื่อมต่อเซิร์ฟเวอร์หลุด หรือเซิร์ฟเวอร์ปิดลง', 'system');
      disconnectMultiplayer();
    };
    
    ws.onerror = (err) => {
      console.error('Socket error:', err);
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่าเซิร์ฟเวอร์เปิดใช้งานอยู่ และระบุ IP ถูกต้อง');
      disconnectMultiplayer();
    };
  };

  const hostStartMultiplayer = () => {
    if (lobbyPlayersCount < mpClients.length) {
      alert(`จำนวนที่นั่งที่เลือก (${lobbyPlayersCount} คน) น้อยกว่าจำนวนผู้เล่นที่เป็นคนจริงในห้องขณะนี้ (${mpClients.length} คน) กรุณาเพิ่มจำนวนผู้เล่น`);
      return;
    }
    
    const aiCount = lobbyPlayersCount - mpClients.length;
    socketRef.current.send(JSON.stringify({
      type: 'start_game',
      payload: { aiCount }
    }));
  };

  const disconnectMultiplayer = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsMultiplayer(false);
    isMultiplayerRef.current = false;
    setIsHost(false);
    isHostRef.current = false;
    setMyPlayerId(0);
    myPlayerIdRef.current = 0;
    setRoomCode('');
    roomCodeRef.current = '';
    setMpClients([]);
    activePromptsRef.current = {};
    setStartupScreen('mode');
    setActiveOverlay('startup');
  };

  const requestRemotePrompt = (playerId, type, data) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'prompt_request',
        payload: {
          targetPlayerId: playerId,
          promptType: type,
          promptData: data
        }
      }));
      
      return new Promise((resolve) => {
        activePromptsRef.current[playerId] = (value) => {
          resolve(value);
        };
      });
    }
    return Promise.resolve(null);
  };

  const broadcastGameState = () => {
    if (isMultiplayerRef.current && isHostRef.current && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const state = {
        players: playersRef.current.map(p => ({
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
        deckCount: deckRef.current.length,
        treasury: treasuryRef.current,
        turnIndex: turnIndexRef.current,
        phaseLabel: document.getElementById('phase-label')?.innerText || '',
        statusDesc: document.getElementById('status-desc')?.innerText || '',
        logsHtml: '' // not strictly needed for engine state
      };
      
      socketRef.current.send(JSON.stringify({
        type: 'sync_state',
        payload: state
      }));
    }
  };

  const handleSocketMessage = (event) => {
    const data = JSON.parse(event.data);
    const { type, payload } = data;
    
    if (type === 'room_created') {
      setIsHost(true);
      isHostRef.current = true;
      setMyPlayerId(0);
      myPlayerIdRef.current = 0;
      setRoomCode(payload.roomCode);
      roomCodeRef.current = payload.roomCode;
      setStartupScreen('lobby');
    }
    
    else if (type === 'room_joined') {
      setIsHost(false);
      isHostRef.current = false;
      setMyPlayerId(payload.clientId);
      myPlayerIdRef.current = payload.clientId;
      setRoomCode(payload.roomCode);
      roomCodeRef.current = payload.roomCode;
      setStartupScreen('lobby');
    }
    
    else if (type === 'room_state') {
      setMpClients(payload.clients);
    }
    
    else if (type === 'game_started') {
      setActiveOverlay(null);
      setIsMultiplayer(true);
      isMultiplayerRef.current = true;
      
      if (!isHostRef.current) {
        logGame(`🎮 เริ่มเกมเล่นออนไลน์ห้อง ${roomCodeRef.current}! รอข้อมูลการแจกการ์ดจากห้องหลัก...`, 'system');
      } else {
        const playerCount = mpClients.length + payload.aiCount;
        initGame(playerCount);
      }
    }
    
    else if (type === 'sync_state') {
      if (!isHostRef.current) {
        const state = payload;
        
        playersRef.current = state.players;
        deckRef.current = { length: state.deckCount };
        treasuryRef.current = state.treasury;
        turnIndexRef.current = state.turnIndex;
        
        setPlayers([...state.players]);
        setTreasury(state.treasury);
        setDeckCount(state.deckCount);
        setTurnIndex(state.turnIndex);
        
        setPhaseLabel(state.phaseLabel);
        setStatusDesc(state.statusDesc);
      }
    }
    
    else if (type === 'prompt_request') {
      handlePeerPromptRequest(payload);
    }
    
    else if (type === 'prompt_response') {
      const { playerId, value } = payload;
      if (activePromptsRef.current[playerId]) {
        activePromptsRef.current[playerId](value);
        delete activePromptsRef.current[playerId];
      }
    }
    
    else if (type === 'error') {
      alert(payload.message);
      disconnectMultiplayer();
    }
  };

  const handlePeerPromptRequest = async (payload) => {
    const { promptType, promptData } = payload;
    
    if (promptType === 'action') {
      setActiveOverlay('action');
    }
    
    else if (promptType === 'target') {
      const { action, options } = promptData;
      setTargetPrompt({
        title: action === 'coup' ? 'เลือกผู้เล่นที่จะทำรัฐประหาร' : 
               action === 'assassinate' ? 'เลือกผู้เล่นที่จะลอบสังหาร' : 'เลือกผู้เล่นที่จะปล้น',
        options: options.map(o => ({ ...o, id: o.id, name: o.name, cards: Array(o.cardsCount).fill({ dead: false }) }))
      });
      setActiveOverlay('target');
    }
    
    else if (promptType === 'reaction') {
      const { promptText, buttons } = promptData;
      setReactionPrompt({ text: promptText, buttons });
      setActiveOverlay('reaction');
    }
    
    else if (promptType === 'card') {
      const { promptTitle, promptDesc, cardsToSelectFrom, selectCount } = promptData;
      setCardSelectPrompt({ title: promptTitle, desc: promptDesc, cards: cardsToSelectFrom, count: selectCount });
      setActiveOverlay('card-select');
    }
  };

  return (
    <GameContext.Provider value={{
      players,
      deckCount,
      treasury,
      turnIndex,
      phaseLabel,
      statusDesc,
      logs,
      
      activeOverlay,
      startupScreen,
      setStartupScreen,
      
      actionOverlayButtonsDisabled,
      targetPrompt,
      reactionPrompt,
      cardSelectPrompt,
      gameOverPrompt,
      
      isShaking,
      shakingCard,
      cardReveal,
      peekPreviousOverlay,
      
      isMultiplayer,
      isHost,
      roomCode,
      myPlayerId,
      mpClients,
      lobbyPlayersCount,
      setLobbyPlayersCount,
      serverIp,
      setServerIp,
      playerName,
      setPlayerName,
      
      // Methods
      showStartupScreen,
      startGameWithPlayers: initGame,
      selectAction,
      selectTarget,
      cancelTargetSelection,
      selectReaction,
      confirmCardSelection,
      peekTable,
      stopPeeking,
      
      connectAndCreateRoom,
      connectAndJoinRoom,
      hostStartMultiplayer,
      disconnectMultiplayer,
      getPodId
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
