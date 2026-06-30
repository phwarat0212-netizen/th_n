import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import StartupOverlay from './components/StartupOverlay';
import PokerTable from './components/PokerTable';
import HistoryLog from './components/HistoryLog';
import Overlays from './components/Overlays';

function GameContent() {
  const { showStartupScreen, isShaking } = useGame();

  return (
    <div className={isShaking ? 'shake-screen' : ''} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header>
        <div className="brand">
          <h1>COUP</h1>
          <span>Intrigue & Deception</span>
        </div>
        <div className="header-controls">
          <button id="rules-btn" className="btn-secondary" onClick={() => window.openRules?.()}>
            📖 วิธีเล่น / กฎเกม
          </button>
          <button id="restart-btn" className="btn-secondary" onClick={showStartupScreen}>
            🔄 เริ่มเกมใหม่
          </button>
        </div>
      </header>

      <div className="game-container">
        <PokerTable />
        <HistoryLog />
      </div>

      <StartupOverlay />
      <Overlays />
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}
