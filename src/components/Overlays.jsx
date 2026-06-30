import React, { useState, useEffect } from 'react';
import { useGame, ACTION_LABELS, CHARACTER_DETAILS } from '../context/GameContext';

export default function Overlays() {
  const {
    activeOverlay,
    actionOverlayButtonsDisabled,
    selectAction,
    peekTable,
    
    targetPrompt,
    selectTarget,
    cancelTargetSelection,
    
    reactionPrompt,
    selectReaction,
    
    cardSelectPrompt,
    confirmCardSelection,
    
    gameOverPrompt,
    startGameWithPlayers,
    
    cardReveal,
    
    peekPreviousOverlay,
    stopPeeking,
    
    players,
    lobbyPlayersCount
  } = useGame();

  // Rules Overlay state (can be opened independently)
  const [showRules, setShowRules] = useState(false);

  // Local card selection state (for Ambassador exchange or discard)
  const [selectedCards, setSelectedCards] = useState([]);

  // Sync selected cards count
  useEffect(() => {
    setSelectedCards([]);
  }, [cardSelectPrompt]);

  const handleCardClick = (idx) => {
    const limit = cardSelectPrompt.count;
    if (limit === 1) {
      setSelectedCards([idx]);
    } else {
      setSelectedCards(prev => {
        if (prev.includes(idx)) {
          return prev.filter(i => i !== idx);
        } else {
          if (prev.length < limit) {
            return [...prev, idx];
          }
          return prev;
        }
      });
    }
  };

  // Expose rules trigger to window so header buttons can call it
  useEffect(() => {
    window.openRules = () => setShowRules(true);
    return () => {
      delete window.openRules;
    };
  }, []);

  return (
    <>
      {/* 1. Action Selection Overlay */}
      {activeOverlay === 'action' && (
        <div id="action-overlay" className="overlay active">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <h2 className="modal-title">เลือกการกระทำของคุณ</h2>
            <div className="actions-grid">
              {/* Income */}
              <button
                className="action-btn"
                onClick={() => selectAction('income')}
                disabled={actionOverlayButtonsDisabled.income}
              >
                <span className="btn-icon">🪙</span>
                <span className="btn-name">รายได้ปกติ</span>
                <span className="btn-desc">+1 เหรียญ (บล็อกไม่ได้)</span>
              </button>
              
              {/* Coup */}
              <button
                className="action-btn"
                id="btn-coup"
                onClick={() => selectAction('coup')}
                disabled={actionOverlayButtonsDisabled.coup}
              >
                <span className="btn-icon">💥</span>
                <span className="btn-name">รัฐประหาร (Coup)</span>
                <span className="btn-desc">-7 เหรียญ (กำจัดอิทธิพล 1 ใบ)</span>
              </button>

              {/* Shield */}
              <button
                className="action-btn"
                onClick={() => selectAction('shield')}
                disabled={actionOverlayButtonsDisabled.shield}
              >
                <span className="btn-icon">🛡️</span>
                <span className="btn-name">ป้องกัน (Shield)</span>
                <span className="btn-desc">-1 เหรียญ สร้างโล่ป้องกันการโจมตี</span>
              </button>

              {/* Alliance */}
              <button
                className="action-btn"
                onClick={() => selectAction('alliance')}
                disabled={actionOverlayButtonsDisabled.alliance}
              >
                <span className="btn-icon">🤝</span>
                <span className="btn-name">ผูกพันธมิตร</span>
                <span className="btn-desc">ผูกมิตรกับเป้าหมาย ห้ามโจมตีกัน</span>
              </button>

              {/* Change */}
              <button
                className="action-btn"
                onClick={() => selectAction('change')}
                disabled={actionOverlayButtonsDisabled.change}
              >
                <span className="btn-icon">🔄</span>
                <span className="btn-name">เปลี่ยนโรล (Change)</span>
                <span className="btn-desc">คืนการ์ดที่มีทั้งหมดสับจั่วใหม่</span>
              </button>

              {/* Check */}
              <button
                className="action-btn"
                onClick={() => selectAction('check')}
                disabled={actionOverlayButtonsDisabled.check}
              >
                <span className="btn-icon">🔍</span>
                <span className="btn-name">เช็คโรล (Check)</span>
                <span className="btn-desc">สลับการ์ด 1 ใบจากกองและเป้าหมาย</span>
              </button>

              {/* Grab2 */}
              <button
                className="action-btn"
                onClick={() => selectAction('grab2')}
                disabled={actionOverlayButtonsDisabled.grab2}
              >
                <span className="btn-icon">🤲</span>
                <span className="btn-name">จก2 (Grab 2)</span>
                <span className="btn-desc">+2 เหรียญจากกองกลาง</span>
              </button>

              {/* CEO */}
              <button
                className="action-btn"
                onClick={() => selectAction('ceo')}
                disabled={actionOverlayButtonsDisabled.ceo}
              >
                <span className="btn-icon">👔</span>
                <span className="btn-name">ประธานบริษัท (CEO)</span>
                <span className="btn-desc">+4 เหรียญ (ประธานร่วมรับ +1)</span>
              </button>

              {/* Murderer */}
              <button
                className="action-btn"
                onClick={() => selectAction('murderer')}
                disabled={actionOverlayButtonsDisabled.murderer}
              >
                <span className="btn-icon">🔪</span>
                <span className="btn-name">ฆาตกร (Murderer)</span>
                <span className="btn-desc">จ่าย 3 เหรียญให้เป้าหมายเพื่อสั่งฆ่า</span>
              </button>

              {/* Sniper */}
              <button
                className="action-btn"
                onClick={() => selectAction('sniper')}
                disabled={actionOverlayButtonsDisabled.sniper}
              >
                <span className="btn-icon">🎯</span>
                <span className="btn-name">สไนเปอร์ (Sniper)</span>
                <span className="btn-desc">-4 เหรียญ เล็งและยิงเมื่อจบรอบ</span>
              </button>

              {/* Instigator */}
              <button
                className="action-btn"
                onClick={() => selectAction('instigator')}
                disabled={actionOverlayButtonsDisabled.instigator}
              >
                <span className="btn-icon">🗣️</span>
                <span className="btn-name">นักปั่น (Instigator)</span>
                <span className="btn-desc">-3 เหรียญ ยุยงระดมทุนช่วยยิง</span>
              </button>
            </div>
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <button
                className="choice-btn secondary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => peekTable('action')}
              >
                👁️ ดูรอบโต๊ะ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Target Selection Overlay */}
      {activeOverlay === 'target' && (
        <div id="target-overlay" className="overlay active">
          <div className="modal-content">
            <h2 className="modal-title">{targetPrompt.title}</h2>
            <div className="targets-list" id="targets-container">
              {targetPrompt.options.map((player) => (
                <button
                  key={player.id}
                  className="target-btn"
                  onClick={() => selectTarget(player)}
                >
                  <span>{player.name}</span>
                  <span>
                    🪙 {player.coins} เหรียญ | 🎴 การ์ดที่เหลือ: {player.cards.filter((c) => !c.dead).length} ใบ
                  </span>
                </button>
              ))}
            </div>
            <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="choice-btn secondary" onClick={cancelTargetSelection}>
                ย้อนกลับ
              </button>
              <button className="choice-btn secondary" onClick={() => peekTable('target')}>
                👁️ ดูรอบโต๊ะ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Reaction Overlay */}
      {activeOverlay === 'reaction' && (
        <div id="reaction-overlay" className="overlay active">
          <div className="modal-content">
            <h2 className="modal-title">ปฏิกิริยาต่อการกระทำ</h2>
            <p
              id="reaction-prompt-text"
              style={{ fontSize: '15px', marginBottom: '15px', lineHeight: 1.5, color: '#ccd6f6' }}
              dangerouslySetInnerHTML={{ __html: reactionPrompt.text }}
            />
            <div className="choices-flex" id="reaction-buttons-container">
              {reactionPrompt.buttons.map((btn, idx) => (
                <button
                  key={idx}
                  className={`choice-btn ${btn.class || 'secondary'}`}
                  onClick={() => selectReaction(btn.value)}
                >
                  {btn.text}
                </button>
              ))}
            </div>
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <button
                className="choice-btn secondary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => peekTable('reaction')}
              >
                👁️ ดูรอบโต๊ะ
              </button>
            </div>
            <div className="timer-bar-container">
              <div className="timer-bar" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      )}

      {/* 4. Card Selection Overlay */}
      {activeOverlay === 'card-select' && (
        <div id="card-select-overlay" className="overlay active">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <h2 className="modal-title">{cardSelectPrompt.title}</h2>
            <p id="card-select-desc" style={{ fontSize: '14px', marginBottom: '15px', color: '#8892b0' }}>
              {cardSelectPrompt.desc}
            </p>
            <div className="card-select-list">
              {cardSelectPrompt.cards.map((card, idx) => {
                const details = CHARACTER_DETAILS[card.role];
                const isSelected = selectedCards.includes(idx);
                return (
                  <div
                    key={idx}
                    className={`card card-select-item ${details?.colorClass || ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleCardClick(idx)}
                  >
                    <div className="card-inner" style={{ transform: 'rotateY(180deg)' }}>
                      <div className="card-front" style={{ position: 'relative' }}>
                        <span className="card-role">{details?.name || card.role}</span>
                        <span className="card-icon" style={{ fontSize: '26px', margin: '8px 0' }}>
                          {details?.icon || '❓'}
                        </span>
                        <span className="card-status-label">{card.origin || 'ในมือ'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                className="choice-btn primary"
                onClick={() => confirmCardSelection(selectedCards)}
                disabled={selectedCards.length !== cardSelectPrompt.count}
              >
                ยืนยัน
              </button>
              <button className="choice-btn secondary" onClick={() => peekTable('card-select')}>
                👁️ ดูรอบโต๊ะ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Rules Overlay */}
      {showRules && (
        <div id="rules-overlay" className="overlay active" onClick={() => setShowRules(false)}>
          <div className="modal-content" style={{ maxWidth: '680px', textAlign: 'left' }} onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title" style={{ textAlign: 'center' }}>ตารางช่วยเหลือ & กฎเกม (10 Roles Coup)</h2>
            <div className="rules-grid">
              <div className="rules-row" style={{ borderLeft: '4px solid #38bdf8' }}>
                <div className="rules-char" style={{ color: '#38bdf8' }}>🛡️ กลุ่มสีฟ้า (ป้องกัน & แลกเปลี่ยน)</div>
                <div className="rules-char-desc">
                  - <strong>โล่ (Shield):</strong> จ่าย 1 เหรียญ วางโล่ไว้เพื่อป้องกันการโจมตี (การลอบสังหาร/การยิงสไนเปอร์/การยุยง)
                  <br />
                  - <strong>พันธมิตร (Alliance):</strong> บังคับผูกพันธมิตรกับผู้เล่นเป้าหมาย ห้ามโจมตีกันโดยตรง
                  <br />
                  - <strong>เปลี่ยนโรล (Change):</strong> นำการ์ดทั้งหมดในมือสับคืนเข้ากองการ์ดและจั่วการ์ดใหม่ตามจำนวนเดิม
                  <br />
                  - <strong>เช็คโรล (Check):</strong> หยิบการ์ด 1 ใบจากกองและ 1 ใบจากเพื่อนเพื่อดูการ์ดทั้งหมด เลือกเก็บไว้เองและมอบคืนให้เพื่อน
                </div>
              </div>
              <div className="rules-row" style={{ borderLeft: '4px solid #34d399' }}>
                <div className="rules-char" style={{ color: '#34d399' }}>💰 กลุ่มสีเขียว (เศรษฐกิจ & คลัง)</div>
                <div className="rules-char-desc">
                  - <strong>จก2 (Grab 2):</strong> ขอรับ 2 เหรียญจากกองกลาง
                  <br />
                  - <strong>ประธานบริษัท (CEO):</strong> ขอรับ 4 เหรียญจากกองกลาง (ผู้เล่นอื่นที่ร่วมอ้างสิทธิ์ประธานบริษัทจะได้รับ +1 เหรียญด้วย)
                  <br />
                  - <strong>สัปเหร่อ (Undertaker):</strong> เมื่อผู้เล่นคนอื่นเสียชีวิต สามารถอ้างสิทธิ์แบ่งปันเงินจากคนที่เสียชีวิตได้
                </div>
              </div>
              <div className="rules-row" style={{ borderLeft: '4px solid #f87171' }}>
                <div className="rules-char" style={{ color: '#f87171' }}>⚔️ กลุ่มสีแดง (ทหาร & ลอบโจมตี)</div>
                <div className="rules-char-desc">
                  - <strong>ฆาตกร (Murderer):</strong> จ่าย 3 เหรียญโดยตรงให้เป้าหมายเพื่อลอบสังหารการ์ดของเขา 1 ใบ
                  <br />
                  - <strong>สไนเปอร์ (Sniper):</strong> จ่าย 4 เหรียญ ล็อคเป้าหมายไว้ และลั่นไกยิงสังหารอิทธิพลเมื่อถึงต้นเทิร์นถัดไป
                  <br />
                  - <strong>นักปั่น (Instigator):</strong> จ่าย 3 เหรียญ ยุยงให้ช่วยระดมทุน หากระดมทุนรวมได้ครบ 4 เหรียญ เป้าหมายสูญเสียอิทธิพล 1 ใบ
                </div>
              </div>
              <div className="rules-row" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                <div className="rules-char" style={{ color: 'var(--gold)' }}>⚡ การกระทำทั่วไป (ไม่ต้องอ้างบทบาท)</div>
                <div className="rules-char-desc">
                  - <strong>รายได้ปกติ (Income):</strong> หยิบ 1 เหรียญจากกองกลาง (บล็อกไม่ได้/ท้าทายไม่ได้)
                  <br />
                  - <strong>รัฐประหาร (Coup):</strong> จ่าย 7 เหรียญ บังคับให้เป้าหมายสูญเสียอิทธิพล 1 ใบ (บล็อกไม่ได้/ท้าทายไม่ได้)
                  <br />
                  *หากผู้เล่นมีเหรียญ 10 เหรียญขึ้นไป บังคับต้องใช้รัฐประหาร (Coup) เท่านั้น!
                </div>
              </div>
            </div>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button className="choice-btn primary" onClick={() => setShowRules(false)}>
                ตกลง เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Game Over Overlay */}
      {activeOverlay === 'gameover' && (
        <div id="gameover-overlay" className="overlay active">
          <div className="modal-content">
            <h2 className="modal-title" style={{ color: gameOverPrompt.title.includes('ชัยชนะ') ? 'var(--gold)' : 'var(--card-dead)' }}>
              {gameOverPrompt.title}
            </h2>
            <p
              id="gameover-message"
              style={{ fontSize: '16px', marginBottom: '20px', color: '#ccd6f6', lineHeight: 1.5 }}
              dangerouslySetInnerHTML={{ __html: gameOverPrompt.message }}
            />
            <div>
              <button className="choice-btn primary" onClick={() => startGameWithPlayers(lobbyPlayersCount || 4)}>
                เล่นใหม่อีกครั้ง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Central Card Reveal Overlay */}
      <div id="card-reveal-display" className={`card-reveal-banner ${cardReveal.active ? 'active' : ''}`}>
        {cardReveal.active && (
          <>
            <div id="reveal-card-container">
              <div className={`card reveal-card-large ${CHARACTER_DETAILS[cardReveal.cardRole]?.colorClass || ''} ${cardReveal.isDead ? 'dead' : ''}`}>
                <div className="card-inner" style={{ transform: 'rotateY(180deg)' }}>
                  <div className="card-front" style={{ padding: '15px 10px' }}>
                    <span className="card-role" style={{ fontSize: '13px', letterSpacing: '1.5px' }}>
                      {CHARACTER_DETAILS[cardReveal.cardRole]?.name || cardReveal.cardRole}
                    </span>
                    <span className="card-icon" style={{ fontSize: '40px', margin: '15px 0' }}>
                      {CHARACTER_DETAILS[cardReveal.cardRole]?.icon || '❓'}
                    </span>
                    <span className="card-status-label" style={{ fontSize: '10px', padding: '3px 8px' }}>
                      {cardReveal.isDead ? 'เสียชีวิต (DEAD)' : 'แสดงตัวละคร'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div id="reveal-card-message" dangerouslySetInnerHTML={{ __html: `<strong>${cardReveal.playerName}</strong><br/>${cardReveal.messageText}` }} />
          </>
        )}
      </div>

      {/* Floating Return to Actions button when peeking */}
      {peekPreviousOverlay && (
        <button
          id="return-action-btn"
          className="choice-btn primary"
          onClick={stopPeeking}
          style={{
            position: 'fixed',
            bottom: '85px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1500,
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
          }}
        >
          🎯 กลับไปหน้าหลัก
        </button>
      )}
    </>
  );
}
