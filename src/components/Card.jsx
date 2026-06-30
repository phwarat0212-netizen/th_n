import React from 'react';
import { CHARACTER_DETAILS } from '../context/GameContext';

export default function Card({ card, isMe, isShaking }) {
  if (!card) return null;
  const { role, dead } = card;
  const details = CHARACTER_DETAILS[role];

  // A card is revealed if:
  // 1. It is dead (everyone sees it)
  // 2. It belongs to me (I see it in my hand)
  const isRevealed = dead || isMe;
  
  const cardClass = [
    'card',
    isRevealed ? 'revealed' : '',
    dead ? 'dead' : 'alive',
    isRevealed && details ? details.colorClass : '',
    isShaking ? 'shake-card' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClass}>
      <div className="card-inner">
        {/* Card Back */}
        <div className="card-back">
          <div className="card-back-pattern" />
        </div>

        {/* Card Front */}
        <div className="card-front">
          {details ? (
            <>
              <span className="card-role">{details.name}</span>
              <span className="card-icon">{details.icon}</span>
              <span className="card-status-label">
                {dead ? 'เปิดเผย (ตาย)' : 'อยู่ในมือ'}
              </span>
            </>
          ) : (
            <>
              <span className="card-role">???</span>
              <span className="card-icon">❓</span>
              <span className="card-status-label">คว่ำ</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
