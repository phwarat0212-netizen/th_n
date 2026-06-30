import React from 'react';
import { useGame } from '../context/GameContext';
import Card from './Card';

export default function PlayerPod({ player }) {
  const { players, myPlayerId, turnIndex, shakingCard, getPodId } = useGame();

  if (!player) return null;

  const isMe = player.id === myPlayerId;
  const isActiveTurn = players[turnIndex]?.id === player.id;
  const isEliminated = player.isEliminated;

  const podId = getPodId(player.id);
  const podPositionClass = isMe ? 'pod-human' : 
                         podId === 'player-1' ? 'pod-left' :
                         podId === 'player-2' ? 'pod-top' :
                         podId === 'player-3' ? 'pod-right' : 'pod-bot';

  const podClass = [
    'player-pod',
    podPositionClass,
    isActiveTurn ? 'active-turn' : '',
    isEliminated ? 'eliminated' : ''
  ].filter(Boolean).join(' ');

  // Calculate circular styling inside the poker table
  const getPodStyle = () => {
    if (players.length === 0) return { display: 'none' };
    const idx = players.findIndex(p => p.id === player.id);
    const myIdx = players.findIndex(p => p.id === myPlayerId);
    if (idx === -1 || myIdx === -1) return { display: 'none' };
    
    // Relative index to the human player (who is always at the bottom, relative index 0)
    const diff = (idx - myIdx + players.length) % players.length;
    
    const centerX = 50; // percent
    const centerY = 50; // percent
    const radiusX = 40; // percent
    const radiusY = 40; // percent
    
    // Angle. Relative index 0 (human) is at Math.PI / 2 (bottom)
    const angle = (2 * Math.PI / players.length) * diff + (Math.PI / 2);
    
    const x = centerX + radiusX * Math.cos(angle);
    const y = centerY + radiusY * Math.sin(angle);
    
    return {
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      transform: 'translate(-50%, -50%)',
      display: 'block'
    };
  };

  return (
    <div id={podId} className={podClass} style={getPodStyle()}>
      <div className="player-header">
        <div className="player-name">{player.name}</div>
        <div className="player-badges">
          <div id={`${podId}-coins`} className="coins-badge">
            <span className="coins-count">{player.coins}</span>
          </div>
          {player.shieldCount > 0 && (
            <div className="shield-badge badge-tooltip" title={`โล่ป้องกันคงเหลือ: ${player.shieldCount}`}>
              🛡️ <span className="shield-count">{player.shieldCount}</span>
            </div>
          )}
          {player.allianceWith && (
            <div className="alliance-badge badge-tooltip" title={`เป็นพันธมิตรกับ ${players.find(p => p.id === player.allianceWith)?.name}`}>
              🤝
            </div>
          )}
        </div>
      </div>
      <div className="player-cards">
        {player.cards.map((card, idx) => {
          const isShaking = shakingCard && shakingCard.playerId === player.id && shakingCard.cardIdx === idx;
          return (
            <Card
              key={idx}
              card={card}
              isMe={isMe}
              isShaking={isShaking}
            />
          );
        })}
      </div>
    </div>
  );
}
