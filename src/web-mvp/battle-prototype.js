const DATA_PATH = './data/';

const els = {
  enemyUnits: document.querySelector('#enemy-units'),
  partyUnits: document.querySelector('#party-units'),
  bloodPips: document.querySelector('#blood-pips'),
  bloodCount: document.querySelector('#blood-count'),
  turnInfo: document.querySelector('#turn-info'),
  actionPanel: document.querySelector('#action-panel'),
  endTurn: document.querySelector('#end-turn'),
  restart: document.querySelector('#restart'),
  autoToggle: document.querySelector('#auto-toggle'),
  log: document.querySelector('#log')
};

const AUTO_DELAY = 600;

let setup = null;
let state = null;

// ---- 파생 스탯 공식 (card-stat-schema.json derivedCombatStats와 동일) ----
function derive(p) {
  return {
    HP: Math.round(p.VIT * 8 + p.STR * 2),
    PATK: p.STR * 2 + p.DEX * 0.5,
    MATK: p.INT * 2 + p.ACC * 0.5,
    DEF: p.VIT * 1.5 + p.STR * 0.5,
    SPD: p.DEX * 2,
    HIT: p.ACC * 1.5 + p.DEX * 0.5,
    EVA: p.DEX * 1.2,
    CRIT: p.ACC * 0.7 + p.LUK * 0.8,
    PERSUADE: p.CHA * 1.5 + p.INT * 0.5,
    RESIST: p.WIL * 1.5 + p.VIT * 0.5
  };
}

function makeUnit(raw, sideKey) {
  const d = derive(raw.primary);
  return {
    id: raw.id,
    name: raw.name,
    job: raw.job,
    race: raw.race,
    side: sideKey,
    derived: d,
    maxHp: d.HP,
    hp: d.HP,
    shield: 0,
    atkDebuff: 0,
    attack: raw.attack || null,
    alive: true
  };
}

async function loadSetup() {
  const res = await fetch(`${DATA_PATH}battle-prototype.json`);
  if (!res.ok) throw new Error('battle-prototype.json 로딩 실패');
  return res.json();
}

function initState() {
  const keepAuto = state ? state.auto : false;
  state = {
    blood: setup.blood.start,
    turn: 1,
    phase: 'player',
    party: setup.party.map((p) => makeUnit(p, 'party')),
    enemies: setup.enemies.map((e) => makeUnit(e, 'enemy')),
    pendingAction: null,
    pendingActor: null,
    auto: keepAuto,
    over: false
  };
  els.log.innerHTML = '';
  addLog(`전투 시작! 파티 ${state.party.length}명 vs 적 ${state.enemies.length}명.`, 'sys');
  render();
  if (state.auto) scheduleAuto();
}

function addLog(text, cls = '') {
  const div = document.createElement('div');
  div.className = `line ${cls}`;
  div.textContent = text;
  els.log.appendChild(div);
}

function rng(variance = 0.1) { return 1 + (Math.random() * 2 - 1) * variance; }

function allUnits() { return [...state.party, ...state.enemies]; }
function livingParty() { return state.party.filter((u) => u.alive); }
function livingEnemies() { return state.enemies.filter((u) => u.alive); }

function hitRoll(attacker, target) {
  let chance = 0.9 + (attacker.derived.HIT - target.derived.EVA) / 200;
  chance = Math.max(0.5, Math.min(0.99, chance));
  return Math.random() < chance;
}
function critRoll(attacker) {
  const chance = Math.min(0.6, attacker.derived.CRIT / 300);
  return Math.random() < chance;
}

function dealDamage(attacker, target, kind, scaleStat, power) {
  if (!hitRoll(attacker, target)) {
    addLog(`${attacker.name}의 ${kind} → ${target.name} 빗나감!`);
    return;
  }
  let raw = (power + attacker.derived[scaleStat]) * rng();
  if (attacker.atkDebuff > 0) { raw *= 0.65; }
  let crit = critRoll(attacker);
  if (crit) raw *= 1.8;
  let dmg = Math.max(1, Math.round(raw - target.derived.DEF * 0.35));
  // 보호막 우선 차감
  if (target.shield > 0) {
    const absorbed = Math.min(target.shield, dmg);
    target.shield -= absorbed;
    dmg -= absorbed;
  }
  target.hp = Math.max(0, target.hp - dmg);
  addLog(`${attacker.name} → ${target.name} ${dmg} 피해${crit ? ' (치명타!)' : ''}`, 'dmg');
  if (target.hp <= 0) { target.alive = false; addLog(`${target.name} 전투 불능!`, 'sys'); }
}

function heal(actor, target, scaleStat, power) {
  const amount = Math.round((power + actor.derived[scaleStat]) * rng());
  target.hp = Math.min(target.maxHp, target.hp + amount);
  addLog(`${actor.name} → ${target.name} ${amount} 회복`, 'heal');
}

function shield(actor, target, scaleStat, power) {
  const amount = Math.round((power + actor.derived[scaleStat] * 0.5) * rng());
  target.shield += amount;
  addLog(`${actor.name} → ${target.name} 보호막 +${amount}`, 'heal');
}

// ---- 플레이어 행동 흐름: 행동 선택 → 행위자 선택 → 대상 선택 ----
function selectAction(action) {
  if (state.over || state.phase !== 'player') return;
  if (action.bloodCost > state.blood) return;
  state.pendingAction = action;
  state.pendingActor = null;
  const who = action.kind === 'heal' || action.kind === 'shield' ? '시전할 아군' : '시전할 아군(행위자)';
  els.turnInfo.textContent = `[${action.name}] — ${who}을(를) 먼저 선택`;
  render();
}

function pickActor(unit) {
  if (!state.pendingAction || !unit.alive || unit.side !== 'party') return;
  state.pendingActor = unit;
  const a = state.pendingAction;
  if (a.target === 'self') { resolvePlayerAction(unit); return; }
  els.turnInfo.textContent = `[${a.name}] 행위자: ${unit.name} → 대상 선택`;
  render();
}

function pickTarget(unit) {
  const a = state.pendingAction;
  if (!a || !state.pendingActor) return;
  if (a.target === 'enemy' && (unit.side !== 'enemy' || !unit.alive)) return;
  if (a.target === 'ally' && (unit.side !== 'party' || !unit.alive)) return;
  resolvePlayerAction(unit);
}

function resolvePlayerAction(target) {
  const a = state.pendingAction;
  const actor = state.pendingActor;
  state.blood -= a.bloodCost;
  if (a.kind === 'damage') dealDamage(actor, target, a.name, a.scale, a.power);
  else if (a.kind === 'heal') heal(actor, target, a.scale, a.power);
  else if (a.kind === 'shield') shield(actor, target, a.scale, a.power);
  else if (a.kind === 'debuff') { target.atkDebuff = 1; addLog(`${actor.name} → ${target.name} 다음 공격 약화(봉쇄)`, 'sys'); }
  state.pendingAction = null;
  state.pendingActor = null;
  els.turnInfo.textContent = '';
  if (checkEnd()) return;
  render();
}

function enemyTurn() {
  state.phase = 'enemy';
  render();
  let i = 0;
  const enemies = livingEnemies();
  const step = () => {
    if (i >= enemies.length || state.over) { startPlayerTurn(); return; }
    const e = enemies[i++];
    const targets = livingParty();
    if (targets.length) {
      // 가장 HP 낮은 아군 우선
      const target = targets.slice().sort((a, b) => a.hp - b.hp)[0];
      const atk = e.attack || { name: '공격', kind: 'damage', scale: 'PATK', power: 10 };
      dealDamage(e, target, atk.name, atk.scale, atk.power);
      e.atkDebuff = 0; // 디버프는 1회 공격 후 해제
    }
    if (checkEnd()) return;
    render();
    setTimeout(step, 650);
  };
  setTimeout(step, 500);
}

function startPlayerTurn() {
  if (state.over) return;
  state.turn += 1;
  state.phase = 'player';
  state.blood = Math.min(setup.blood.max, state.blood + setup.blood.perTurn);
  // 파티 공격 디버프 해제
  state.party.forEach((u) => (u.atkDebuff = 0));
  addLog(`— ${state.turn}턴 시작 (혈액 ${state.blood}) —`, 'sys');
  render();
  scheduleAuto();
}

function endTurnClicked() {
  if (state.over || state.phase !== 'player') return;
  state.pendingAction = null;
  state.pendingActor = null;
  enemyTurn();
}

// ---- 오토 배틀 (하이브리드: node 시뮬에서 검증한 휴리스틱 이식) ----
function getAction(id) { return setup.actions.find((a) => a.actionId === id); }

function autoChoose() {
  const allies = livingParty();
  const foes = livingEnemies();
  if (!foes.length || !allies.length) return null;
  const lowFoe = foes.slice().sort((a, b) => a.hp - b.hp)[0];
  // 1) 위급 아군 회복
  const healAct = getAction('ACT-FIRST-AID');
  const healer = allies.find((u) => u.job === '힐러');
  const hurt = allies.filter((u) => u.hp / u.maxHp < 0.45).sort((a, b) => a.hp - b.hp)[0];
  if (hurt && healer && healAct && state.blood >= healAct.bloodCost) {
    return { action: healAct, actor: healer, target: hurt };
  }
  // 2) 마법사 기술 일격
  const magic = getAction('ACT-MAGIC');
  const mage = allies.find((u) => u.job === '마법사');
  if (mage && magic && state.blood >= magic.bloodCost) {
    return { action: magic, actor: mage, target: lowFoe };
  }
  // 3) 전사/그 외 제압
  const subdue = getAction('ACT-SUBDUE');
  const striker = allies.find((u) => u.job === '전사') || allies[0];
  if (subdue && state.blood >= subdue.bloodCost) {
    return { action: subdue, actor: striker, target: lowFoe };
  }
  return null;
}

function scheduleAuto() {
  if (state.auto && !state.over && state.phase === 'player') setTimeout(autoStep, AUTO_DELAY);
}

function autoStep() {
  if (!state.auto || state.over || state.phase !== 'player') return;
  state.pendingAction = null;
  state.pendingActor = null;
  const choice = autoChoose();
  if (!choice) { endTurnClicked(); return; }
  const { action, actor, target } = choice;
  state.blood -= action.bloodCost;
  if (action.kind === 'damage') dealDamage(actor, target, action.name, action.scale, action.power);
  else if (action.kind === 'heal') heal(actor, target, action.scale, action.power);
  else if (action.kind === 'shield') shield(actor, target, action.scale, action.power);
  else if (action.kind === 'debuff') { target.atkDebuff = 1; addLog(`${actor.name} → ${target.name} 다음 공격 약화(봉쇄)`, 'sys'); }
  if (checkEnd()) return;
  render();
  scheduleAuto();
}

function checkEnd() {
  if (livingEnemies().length === 0) {
    state.over = true; addLog('승리! 모든 적을 제압했습니다.', 'win'); render(); return true;
  }
  if (livingParty().length === 0) {
    state.over = true; addLog('패배... 파티가 전멸했습니다.', 'lose'); render(); return true;
  }
  return false;
}

// ---- 렌더 ----
function unitCard(u) {
  const pct = Math.round((u.hp / u.maxHp) * 100);
  const d = u.derived;
  const isPendingActorPick = state.pendingAction && !state.pendingActor &&
    (state.pendingAction.target === 'self' || state.pendingAction.target === 'ally' || state.pendingAction.target === 'enemy') && u.side === 'party';
  const isTargetPick = state.pendingAction && state.pendingActor &&
    ((state.pendingAction.target === 'enemy' && u.side === 'enemy') || (state.pendingAction.target === 'ally' && u.side === 'party'));
  const targetable = u.alive && !state.over && state.phase === 'player' && (isPendingActorPick || isTargetPick);
  const selected = state.pendingActor && state.pendingActor.id === u.id && u.side === 'party';
  const div = document.createElement('div');
  div.className = `unit${u.alive ? '' : ' dead'}${targetable ? ' targetable' : ''}${selected ? ' selected' : ''}`;
  div.innerHTML = `
    ${u.shield > 0 ? `<span class="shieldtag">🛡 ${u.shield}</span>` : ''}
    ${u.atkDebuff > 0 ? `<span class="debufftag">약화</span>` : ''}
    <div class="unit-top"><span class="unit-name">${u.name}</span><span class="unit-job">${u.race}·${u.job}</span></div>
    <div class="unit-sub">SPD ${Math.round(d.SPD)} · HIT ${Math.round(d.HIT)} · DEF ${Math.round(d.DEF)}</div>
    <div class="hpbar"><div class="hpfill" style="width:${pct}%"></div></div>
    <div class="hptext">HP ${u.hp} / ${u.maxHp}</div>
    <div class="statline"><span>물공 ${Math.round(d.PATK)}</span><span>기공 ${Math.round(d.MATK)}</span><span>치명 ${Math.round(d.CRIT)}</span><span>회피 ${Math.round(d.EVA)}</span></div>
  `;
  if (targetable) {
    div.addEventListener('click', () => {
      if (isPendingActorPick && !state.pendingActor) pickActor(u);
      else pickTarget(u);
    });
  }
  return div;
}

function render() {
  els.enemyUnits.innerHTML = '';
  state.enemies.forEach((u) => els.enemyUnits.appendChild(unitCard(u)));
  els.partyUnits.innerHTML = '';
  state.party.forEach((u) => els.partyUnits.appendChild(unitCard(u)));

  // 혈액
  els.bloodPips.innerHTML = '';
  for (let i = 0; i < setup.blood.max; i++) {
    const pip = document.createElement('span');
    pip.className = `pip${i < state.blood ? ' full' : ''}`;
    els.bloodPips.appendChild(pip);
  }
  els.bloodCount.textContent = `${state.blood} / ${setup.blood.max}`;

  // 행동 패널
  els.actionPanel.innerHTML = '';
  if (!state.over && state.phase === 'player') {
    setup.actions.forEach((a) => {
      const btn = document.createElement('button');
      const disabled = a.bloodCost > state.blood || state.auto;
      btn.className = `action-btn${state.pendingAction && state.pendingAction.actionId === a.actionId ? ' selected' : ''}`;
      btn.disabled = disabled;
      btn.innerHTML = `<span>${a.name} <span class="cost">혈 ${a.bloodCost}</span></span><small>${a.desc}</small>`;
      btn.addEventListener('click', () => selectAction(a));
      els.actionPanel.appendChild(btn);
    });
    if (state.auto) {
      els.turnInfo.textContent = `${state.turn}턴 · 오토 진행 중 (수동 전환하려면 오토를 끄세요)`;
    } else if (!els.turnInfo.textContent && !state.pendingAction) {
      els.turnInfo.textContent = `${state.turn}턴 · 행동 카드를 선택하세요 (혈액으로 여러 번 행동, 끝나면 턴 종료)`;
    }
  } else if (state.phase === 'enemy') {
    els.turnInfo.textContent = '적 턴 진행 중...';
  } else if (state.over) {
    els.turnInfo.textContent = '전투 종료 — 다시 시작을 눌러 재도전';
  }

  els.endTurn.disabled = state.over || state.phase !== 'player' || state.auto;
  els.autoToggle.textContent = `오토: ${state.auto ? '켜짐' : '꺼짐'}`;
  els.autoToggle.classList.toggle('on', state.auto);
}

els.endTurn.addEventListener('click', endTurnClicked);
els.restart.addEventListener('click', initState);
els.autoToggle.addEventListener('click', () => {
  state.auto = !state.auto;
  render();
  if (state.auto) scheduleAuto();
});

loadSetup()
  .then((data) => { setup = data; initState(); })
  .catch((err) => { els.turnInfo.textContent = err.message; });
