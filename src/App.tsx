import { useEffect, useMemo, useState } from 'react';
import { characters, resources } from './data';
import { chooseOption, createInitialState, formatDelta, getCurrentEvent, isFinalDayComplete, pickEnding } from './gameEngine';
import { clearGameState, loadGameState, saveGameState } from './storage';
import type { GameState } from './types';

export function App() {
  const [state, setState] = useState<GameState>(() => loadGameState());
  const currentEvent = getCurrentEvent(state);
  const isComplete = isFinalDayComplete(state);
  const ending = useMemo(() => (isComplete ? pickEnding(state) : null), [isComplete, state]);

  useEffect(() => {
    saveGameState(state);
  }, [state]);

  function handleChoice(option: 'A' | 'B') {
    if (isComplete) return;
    setState((previous) => chooseOption(previous, option));
  }

  function resetGame() {
    clearGameState();
    setState(createInitialState());
  }

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">RED LEDGER MVP</p>
          <h1>적혈의 장부</h1>
          <p className="hero-copy">
            표면 조직의 신뢰와 가문 요구 사이에서 7일 동안 운영망을 유지하십시오.
          </p>
        </div>
        <div className="save-status" aria-label="저장 상태">
          <span>자동 저장</span>
          <strong>localStorage</strong>
        </div>
      </section>

      <section className="resource-grid" aria-label="핵심 자원">
        {resources.map((resource) => (
          <article key={resource.id} className="resource-card">
            <span>{resource.name}</span>
            <strong>{state.resources[resource.id]}</strong>
            <small>{resource.ui}</small>
          </article>
        ))}
      </section>

      {ending ? (
        <section className="event-panel ending-panel">
          <p className="eyebrow">ENDING</p>
          <h2>{ending.name}</h2>
          <p>{ending.summary}</p>
          <div className="ending-meta">
            <span>타입: {ending.type}</span>
            <span>후속: {ending.unlock}</span>
          </div>
          <button className="primary-button" type="button" onClick={resetGame}>
            다시 운영하기
          </button>
        </section>
      ) : (
        <section className="event-panel">
          <div className="event-header">
            <div>
              <p className="eyebrow">DAY {currentEvent.day}</p>
              <h2>{currentEvent.name}</h2>
            </div>
            <span className="risk-badge">위험도 {currentEvent.risk}</span>
          </div>

          <p className="event-copy">조건: {currentEvent.condition}</p>
          <p className="event-copy">연결 인물: {currentEvent.character}</p>

          <div className="choice-grid">
            {(['A', 'B'] as const).map((option) => {
              const choice = currentEvent.choices[option];
              return (
                <button key={option} className="choice-card" type="button" onClick={() => handleChoice(option)}>
                  <span className="choice-label">선택 {option}</span>
                  <strong>{choice.label}</strong>
                  <small>{choice.effects.map(formatDelta).join(' / ')}</small>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="control-panel" aria-label="저장 관리">
        <button className="secondary-button" type="button" onClick={resetGame}>
          새 운영 시작
        </button>
        <p>선택할 때마다 진행 상태가 이 브라우저에 자동 저장됩니다.</p>
      </section>

      <section className="lower-grid">
        <article className="list-panel">
          <h3>주요 인물</h3>
          <div className="character-list">
            {characters.map((character) => (
              <div key={character.id} className="character-row">
                <div>
                  <strong>{character.name}</strong>
                  <span>{character.role}</span>
                </div>
                <em>{character.grade}</em>
              </div>
            ))}
          </div>
        </article>

        <article className="list-panel">
          <h3>작업 기록</h3>
          <ol className="history-list">
            {state.history.map((entry, index) => (
              <li key={`${entry}-${index}`}>{entry}</li>
            ))}
          </ol>
        </article>
      </section>
    </main>
  );
}
