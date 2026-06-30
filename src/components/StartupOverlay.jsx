import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

export default function StartupOverlay() {
  const {
    activeOverlay,
    startupScreen,
    setStartupScreen,
    startGameWithPlayers,
    playerName,
    setPlayerName,
    serverIp,
    setServerIp,
    roomCode,
    mpClients,
    lobbyPlayersCount,
    setLobbyPlayersCount,
    isHost,
    connectAndCreateRoom,
    connectAndJoinRoom,
    hostStartMultiplayer,
    disconnectMultiplayer
  } = useGame();

  const [roomCodeInput, setRoomCodeInput] = useState('');

  if (activeOverlay !== 'startup') return null;

  return (
    <div id="startup-overlay" className="overlay active">
      {/* Screen 1: Mode Selection */}
      {startupScreen === 'mode' && (
        <div id="startup-mode-screen" className="modal-content" style={{ maxWidth: '450px' }}>
          <h1 style={{ fontFamily: 'var(--font-royal)', color: 'var(--gold)', marginBottom: '5px', fontSize: '28px', fontWeight: 800 }}>COUP</h1>
          <p style={{ fontSize: '9px', color: '#8892b0', marginBottom: '25px', textTransform: 'uppercase', letterSpacing: '3px' }}>เกมนักโค่นอำนาจสภาสมาคม</p>
          <h2 className="modal-title" style={{ fontSize: '15px', marginBottom: '20px' }}>กรุณาเลือกโหมดการเล่น</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', width: '100%' }}>
            <button className="choice-btn primary" onClick={() => setStartupScreen('single')} style={{ padding: '14px 20px' }}>🎮 เล่นคนเดียว (vs AI Bots)</button>
            <button className="choice-btn secondary" onClick={() => setStartupScreen('multi')} style={{ padding: '14px 20px' }}>🌐 เล่นออนไลน์ (Multiplayer)</button>
          </div>
        </div>
      )}

      {/* Screen 2: Single Player Config */}
      {startupScreen === 'single' && (
        <div id="startup-single-screen" className="modal-content" style={{ maxWidth: '450px' }}>
          <h1 style={{ fontFamily: 'var(--font-royal)', color: 'var(--gold)', marginBottom: '5px', fontSize: '28px', fontWeight: 800 }}>COUP</h1>
          <p style={{ fontSize: '9px', color: '#8892b0', marginBottom: '25px', textTransform: 'uppercase', letterSpacing: '3px' }}>โหมดเล่นคนเดียว (vs AI)</p>
          <h2 className="modal-title" style={{ fontSize: '14px', marginBottom: '15px' }}>กรุณาเลือกจำนวนผู้เล่น (3 - 6 คน)</h2>
          <div className="choices-flex" style={{ flexWrap: 'wrap', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
            <button className="choice-btn secondary" onClick={() => startGameWithPlayers(3)}>3 คน</button>
            <button className="choice-btn primary" onClick={() => startGameWithPlayers(4)}>4 คน (แนะนำ)</button>
            <button className="choice-btn secondary" onClick={() => startGameWithPlayers(5)}>5 คน</button>
            <button className="choice-btn secondary" onClick={() => startGameWithPlayers(6)}>6 คน</button>
          </div>
          <div style={{ marginTop: '15px' }}>
            <button className="choice-btn secondary" onClick={() => setStartupScreen('mode')} style={{ padding: '8px 16px', fontSize: '12px' }}>ย้อนกลับ</button>
          </div>
        </div>
      )}

      {/* Screen 3: Multiplayer Join/Create Config */}
      {startupScreen === 'multi' && (
        <div id="startup-multi-screen" className="modal-content" style={{ maxWidth: '450px' }}>
          <h1 style={{ fontFamily: 'var(--font-royal)', color: 'var(--gold)', marginBottom: '5px', fontSize: '28px', fontWeight: 800 }}>COUP</h1>
          <p style={{ fontSize: '9px', color: '#8892b0', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '3px' }}>โหมดออนไลน์ (Multiplayer)</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left', width: '100%', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#8892b0', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>ชื่อผู้เล่นของคุณ</label>
              <input
                type="text"
                placeholder="กรอกชื่อผู้เล่น..."
                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '14px' }}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#8892b0', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>ที่อยู่เซิร์ฟเวอร์ (Server Address)</label>
              <input
                type="text"
                placeholder="เช่น localhost:8080 หรือ 192.168.1.50:8080"
                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '14px' }}
                value={serverIp}
                onChange={(e) => setServerIp(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#8892b0', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>รหัสห้อง (สำหรับเข้าร่วม)</label>
              <input
                type="text"
                placeholder="เช่น AE4F (กรอกเมื่อจะเข้าห้องอื่น)..."
                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '14px', textTransform: 'uppercase' }}
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <button className="choice-btn primary" onClick={connectAndCreateRoom} style={{ flex: 1, padding: '12px 10px', fontSize: '13px' }}>🆕 สร้างห้องใหม่</button>
            <button className="choice-btn secondary" onClick={() => connectAndJoinRoom(roomCodeInput)} style={{ flex: 1, padding: '12px 10px', fontSize: '13px', borderColor: 'var(--gold)', color: 'var(--gold-text)' }}>🚪 เข้าร่วมห้อง</button>
          </div>
          <div style={{ marginTop: '20px' }}>
            <button className="choice-btn secondary" onClick={() => setStartupScreen('mode')} style={{ padding: '8px 16px', fontSize: '12px' }}>ย้อนกลับ</button>
          </div>
        </div>
      )}

      {/* Screen 4: Multiplayer Lobby Screen */}
      {startupScreen === 'lobby' && (
        <div id="startup-lobby-screen" className="modal-content" style={{ maxWidth: '450px' }}>
          <h1 style={{ fontFamily: 'var(--font-royal)', color: 'var(--gold)', marginBottom: '5px', fontSize: '28px', fontWeight: 800 }}>LOBBY</h1>
          <p style={{ fontSize: '12px', color: 'var(--gold-text)', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>
            รหัสห้อง: <span style={{ fontSize: '18px', color: '#fff', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px' }}>{roomCode || '----'}</span>
          </p>
          
          <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '11px', color: '#8892b0', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '5px' }}>
              ผู้เล่นในห้อง ({mpClients.length}/6)
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              {mpClients.map((client, idx) => (
                <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{client.name} {client.id === 0 ? '(หัวหน้าห้อง)' : ''}</span>
                  {client.id === 0 && <span style={{ fontSize: '10px', background: 'rgba(212,175,55,0.15)', color: 'var(--gold-text)', padding: '2px 6px', borderRadius: '4px' }}>HOST</span>}
                </li>
              ))}
            </ul>
          </div>

          {/* Host controls */}
          {isHost ? (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '11px', color: '#8892b0', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>เลือกจำนวนคนเล่นรวม AI บอท</label>
              <div className="choices-flex" style={{ flexWrap: 'wrap', justifyContent: 'center', gap: '10px', marginTop: '5px' }}>
                {[3, 4, 5, 6].map(num => (
                  <button
                    key={num}
                    className={`choice-btn ${lobbyPlayersCount === num ? 'primary' : 'secondary'}`}
                    onClick={() => setLobbyPlayersCount(num)}
                    style={{ padding: '8px 14px', fontSize: '12px' }}
                  >
                    {num} คน
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '20px', fontSize: '13px', color: '#8892b0' }}>
              ⏳ รอหัวหน้าห้องเริ่มการแข่งขัน...
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <button className="choice-btn secondary" onClick={disconnectMultiplayer} style={{ flex: 1, padding: '12px', fontSize: '13px' }}>🚪 ออกจากห้อง</button>
            {isHost && (
              <button className="choice-btn primary" onClick={hostStartMultiplayer} style={{ flex: 1, padding: '12px', fontSize: '13px' }}>🚀 เริ่มเกมการเล่น</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
