import React from 'react';
import { useGame } from '../context/GameContext';
import PlayerPod from './PlayerPod';

export default function PokerTable() {
  const { players, deckCount, treasury, phaseLabel, statusDesc } = useGame();

  return (
    <main className="table-area">
      <div className="poker-table">
        {/* Render all players pods in circular layout */}
        {players.map(p => (
          <PlayerPod key={p.id} player={p} />
        ))}

        {/* Center Table Display (Deck and Action Status) */}
        <div className="table-center">
          <div className="central-deck">
            <div className="deck-pile active-pile">
              <span>การ์ดจั่ว</span>
              <span style={{ fontSize: '20px', margin: '4px 0' }}>🎴</span>
              <span id="deck-count">{deckCount}</span>
            </div>
            <div id="treasury-pile" className="deck-pile">
              <span>กองกลาง</span>
              <span style={{ fontSize: '20px', margin: '4px 0' }}>🪙</span>
              <span id="treasury-count">{treasury}</span>
            </div>
          </div>
          
          <div className="central-state-display">
            <div className="game-phase-indicator" id="phase-label">
              {phaseLabel}
            </div>
            <div className="action-status-text" id="status-desc" dangerouslySetInnerHTML={{ __html: statusDesc }} />
          </div>
        </div>
      </div>
    </main>
  );
}
