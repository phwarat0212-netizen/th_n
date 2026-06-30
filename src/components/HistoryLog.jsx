import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

export default function HistoryLog() {
  const { logs } = useGame();
  const logEndRef = useRef(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <aside className="sidebar-panel">
      <div className="sidebar-title">
        <span>บันทึกการเล่น (LOG)</span>
        <span>📋</span>
      </div>
      <div className="history-log" id="game-log">
        {logs.map((log, idx) => (
          <div
            key={idx}
            className={`log-entry log-${log.type}`}
            dangerouslySetInnerHTML={{ __html: log.text }}
          />
        ))}
        <div ref={logEndRef} />
      </div>
    </aside>
  );
}
