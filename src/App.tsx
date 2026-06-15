import { useEffect, useMemo, useState } from 'react';
import { characters, resources } from './data';
import { chooseOption, createInitialState, formatDelta, getCurrentEvent, isFinalDayComplete, pickEnding } from './gameEngine';
import { clearGameState, loadGameState, saveGameState } from './storage';
import type { CharacterDefinition, GameState } from './types';

function getGradeClass(grade: string): string {
  switch (grade) {
    case '전설':
      return 'grade-legendary';
    case '희귀':
      return 'grade-rare';
    case '고급':
      return 'grade-advanced';
    case '일반':
    default:
      return 'grade-normal';
  }
}

function CharacterCodexCard({ character }: { character: CharacterDefinition }) {
  const gradeClass = getGradeClass(character.grade);

  return (
    <article className={`codex-card ${gradeClass}`}>
      <div className="card-aura" aria-hidden="true" />
      <div className="card-frame">
        <div className="card-topline">
          <span className="card-grade">{character.grade}</span>
          <span className="card-id">{character.id}</span>
        </div>
        <div className="portrait-slot">
          <span>{character.name.slice(0, 1)}</span>
        </div>
        <h3>{character.name}</h3>
        <p>{character.role}</p>
        <dl className="stat-list">
          <div>
            <dt>충성</dt>
            <dd>{character.loyalty}</dd>
          </div>
          <div>
            <dt>위험</dt>
            <dd>{character.risk}</dd>
          </div>
        </dl>
        <div className="skill-box">
          <strong>스킬</strong>
          <span>{character.skill}</span>
        </div>
      </div>
    </article>
  );
}

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
      <section className="hero-card candidate-e-card">
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
          <article key={resource.id} className="resource-card candidate-e-card">
            <span>{resource.name}</span>
            <strong>{state.resources[resource.id]}</strong>
            <small>{resource.ui}</small>
          </article>
        ))}
      </section>

      {ending ? (
        <section className="event-panel ending-panel candidate-e-card grade-legendary">
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
        <section className="event-panel candidate-e-card grade-rare">
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
                <button key={option} className="choice-card candidate-e-card" type="button" onClick={() => handleChoice(option)}>
                  <span className="choice-label">선택 {option}</span>
                  <strong>{choice.label}</strong>
                  <small>{choice.effects.map(formatDelta).join(' / ')}</small>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="control-panel candidate-e-card" aria-label="저장 관리">
        <button className="secondary-button" type="button" onClick={resetGame}>
          새 운영 시작
        </button>
        <p>선택할 때마다 진행 상태가 이 브라우저에 자동 저장됩니다.</p>
      </section>

      <section className="codex-section candidate-e-card">
        <div className="section-heading">
          <p className="eyebrow">CHARACTER CODEX</p>
          <h2>인물 도감</h2>
          <p>등급별 테두리와 아우라 규칙을 적용한 카드형 UI 초안입니다.</p>
        </div>
        <div className="codex-grid">
          {characters.map((character) => (
            <CharacterCodexCard key={character.id} character={character} />
          ))}
        </div>
      </section>

      <section className="lower-grid">
        <article className="list-panel candidate-e-card">
          <h3>주요 인물</h3>
          <div className="character-list">
            {characters.map((character) => (
              <div key={character.id} className={`character-row ${getGradeClass(character.grade)}`}>
                <div>
                  <strong>{character.name}</strong>
                  <span>{character.role}</span>
                </div>
                <em>{character.grade}</em>
              </div>
            ))}
          </div>
        </article>

        <article className="list-panel candidate-e-card">
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
