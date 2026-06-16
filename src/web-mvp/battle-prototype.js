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
  partySource: document.querySelector('#party-source'),
  modeBattle: document.querySelector('#mode-battle'),
  modeNegotiate: document.querySelector('#mode-negotiate'),
  objective: document.querySelector('#objective'),
  log: document.querySelector('#log')
};
let mode = 'battle'; // 'battle' | 'negotiate'

const AUTO_DELAY = 600;
const PARTY_KEY = 'hbh.party.v1';
const INV_KEY = 'hbh.inventory.v1';
let acquisition = null;

function loadInv() {
  try { const v = JSON.parse(localStorage.getItem(INV_KEY)); if (v && v.counts) return v; } catch (e) { /* noop */ }
  return { counts: { N: 30, R: 4, SR: 3, EP: 0, L: 0 }, pity: {}, attempts: 0, success: 0, madeL: 0 };
}
function saveInv(v) { localStorage.setItem(INV_KEY, JSON.stringify(v)); }

function grantRewards() {
  if (state.rewardsGranted) return;
  state.rewardsGranted = true;
  if (!acquisition || !acquisition.huntDrops) return;
  const hd = acquisition.huntDrops;
  const inv = loadInv();
  const got = [];
  let jackpot = false;
  if (Math.random() < hd.baseDrop.dropChance) {
    const [a, b] = hd.baseDrop.countRange;
    const n = a + Math.floor(Math.random() * (b - a + 1));
    inv.counts.N = (inv.counts.N || 0) + n; got.push(`N ×${n}`);
  }
  if (Math.random() < hd.midDrop.dropChance) {
    inv.counts.R = (inv.counts.R || 0) + hd.midDrop.count; got.push(`R ×${hd.midDrop.count}`);
  }
  if (Math.random() < hd.jackpotDrop.dropChance) {
    const w = hd.rarityWeightWhenJackpot || { SR: 1 };
    const r = Math.random(); let g = 'SR', acc = 0;
    for (const k of Object.keys(w)) { acc += w[k]; if (r < acc) { g = k; break; } }
    inv.counts[g] = (inv.counts[g] || 0) + 1; got.push(`★잭팟 ${g} ×1`); jackpot = true;
  }
  saveInv(inv);
  if (got.length) addLog(`전투 보상: ${got.join(', ')} → 인벤토리 적립`, jackpot ? 'win' : 'heal');
  else addLog('전투 보상: 이번엔 카드 드랍 없음.', 'sys');
}

function loadLabParty() {
  try { return JSON.parse(localStorage.getItem(PARTY_KEY)) || []; } catch (e) { return []; }
}
let labParty = [];
let useLab = false;
function activePartyData() {
  return (useLab && labParty.length) ? labParty : setup.party;
}

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
  const skill = sideKey === 'party' && setup.jobSkills ? setup.jobSkills[raw.job] || null : null;
  return {
    id: raw.id,
    name: raw.name,
    job: raw.job,
    race: raw.race,
    side: sideKey,
    primary: raw.primary,
    derived: d,
    maxHp: d.HP,
    hp: d.HP,
    shield: 0,
    atkDebuff: 0,
    attack: raw.attack || null,
    skill,
    skillCd: 0,
    alive: true
  };
}

function computeSynergy(party) {
  const active = [];
  const mult = { dmgMult: 1, healMult: 1, defMult: 1 };
  const jobs = new Set(party.map((u) => u.job));
  const humanCount = party.filter((u) => u.race === '인간').length;
  for (const syn of setup.synergies || []) {
    let ok = false;
    if (syn.id === 'ROLE-TRINITY') ok = jobs.has('전사') && jobs.has('마법사') && jobs.has('힐러');
    else if (syn.id === 'HUMAN-PACT') ok = humanCount >= 2;
    if (ok) {
      active.push(syn);
      mult.dmgMult *= syn.effect.dmgMult;
      mult.healMult *= syn.effect.healMult;
      mult.defMult *= syn.effect.defMult;
    }
  }
  return { active, mult };
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
    party: activePartyData().map((p) => makeUnit(p, 'party')),
    enemies: setup.enemies.map((e) => makeUnit(e, 'enemy')),
    pendingAction: null,
    pendingActor: null,
    auto: keepAuto,
    mode,
    empathy: 0,
    panic: mode === 'negotiate' ? setup.negotiation.panicStart : 0,
    rewardsGranted: false,
    over: false
  };
  state.synergy = computeSynergy(state.party);
  els.log.innerHTML = '';
  if (state.synergy.active.length) {
    addLog(`시너지 발동: ${state.synergy.active.map((s) => s.name).join(', ')}`, 'sys');
  }
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
  if (attacker.side === 'party') raw *= state.synergy.mult.dmgMult;
  let crit = critRoll(attacker);
  if (crit) raw *= 1.8;
  const defMult = target.side === 'party' ? state.synergy.mult.defMult : 1;
  let dmg = Math.max(1, Math.round(raw - target.derived.DEF * 0.35 * defMult));
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
  let amount = (power + actor.derived[scaleStat]) * rng();
  if (actor.side === 'party') amount *= state.synergy.mult.healMult;
  amount = Math.round(amount);
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
  if (a.isSkill) { castSkill(state.pendingActor, unit); return; }
  resolvePlayerAction(unit);
}

function currentActions() {
  return state.mode === 'negotiate' ? setup.negotiation.actions : setup.actions;
}

function applyAction(a, actor, target) {
  if (a.kind === 'damage') dealDamage(actor, target, a.name, a.scale, a.power);
  else if (a.kind === 'heal') heal(actor, target, a.scale, a.power);
  else if (a.kind === 'shield') shield(actor, target, a.scale, a.power);
  else if (a.kind === 'debuff') { target.atkDebuff = 1; addLog(`${actor.name} → ${target.name} 다음 공격 약화(봉쇄)`, 'sys'); }
  else if (a.kind === 'empathy') {
    const g = Math.round((a.power + actor.derived.PERSUADE * 0.35) * state.synergy.mult.healMult);
    state.empathy = Math.min(setup.negotiation.empathyTarget, state.empathy + g);
    addLog(`${actor.name}의 설득 → 공감 +${g}`, 'heal');
  } else if (a.kind === 'calm') {
    const r = Math.round(a.power + (actor.primary ? actor.primary.CHA : 0) * 0.8);
    state.panic = Math.max(0, state.panic - r);
    addLog(`${actor.name}의 진정 안내 → 패닉 -${r}`, 'heal');
  }
}

function resolvePlayerAction(target) {
  const a = state.pendingAction;
  const actor = state.pendingActor;
  state.blood -= a.bloodCost;
  applyAction(a, actor, target);
  state.pendingAction = null;
  state.pendingActor = null;
  els.turnInfo.textContent = '';
  if (checkEnd()) return;
  render();
}

// ---- 직업 고유 스킬 ----
function canUseSkill(unit) {
  return unit.alive && unit.skill && unit.skillCd === 0 && state.blood >= unit.skill.bloodCost;
}

function useSkill(unit) {
  if (state.over || state.phase !== 'player' || !canUseSkill(unit)) return;
  const sk = unit.skill;
  if (sk.scope === 'all') {
    castSkill(unit, null);
  } else {
    // 단일 대상: 적 선택 대기 (pendingAction에 스킬 표식)
    state.pendingAction = { isSkill: true, skill: sk, target: sk.kind === 'heal' ? 'ally' : 'enemy', name: sk.name };
    state.pendingActor = unit;
    els.turnInfo.textContent = `[${sk.name}] 대상 선택`;
    render();
  }
}

function castSkill(actor, singleTarget) {
  const sk = actor.skill;
  state.blood -= sk.bloodCost;
  actor.skillCd = sk.cooldown;
  let targets;
  if (sk.scope === 'all') targets = sk.kind === 'heal' ? livingParty() : livingEnemies();
  else targets = [singleTarget];
  addLog(`✦ ${actor.name}의 [${sk.name}]`, 'sys');
  for (const t of targets) {
    if (sk.kind === 'damage') dealDamage(actor, t, sk.name, sk.scale, sk.power);
    else if (sk.kind === 'heal') heal(actor, t, sk.scale, sk.power);
  }
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
  let panicAdded = false;
  const step = () => {
    if (state.over) return;
    if (state.mode === 'negotiate' && !panicAdded) {
      panicAdded = true;
      state.panic = Math.min(setup.negotiation.panicMax, state.panic + setup.negotiation.panicPerEnemyTurn);
      addLog(`군중 동요 → 패닉 +${setup.negotiation.panicPerEnemyTurn}`, 'sys');
      if (checkEnd()) return;
    }
    if (i >= enemies.length) { startPlayerTurn(); return; }
    const e = enemies[i++];
    const targets = livingParty();
    if (targets.length) {
      const target = targets.slice().sort((a, b) => a.hp - b.hp)[0];
      const atk = e.attack || { name: '공격', kind: 'damage', scale: 'PATK', power: 10 };
      dealDamage(e, target, atk.name, atk.scale, atk.power);
      e.atkDebuff = 0;
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
  // 파티 공격 디버프 해제 + 스킬 쿨다운 감소
  state.party.forEach((u) => {
    u.atkDebuff = 0;
    if (u.skillCd > 0) u.skillCd -= 1;
  });
  addLog(`— ${state.turn}턴 시작 (혈액 ${state.blood}) —`, 'sys');
  if (checkEnd()) return; // 설득전 턴 제한
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

function autoChooseSkill() {
  const allies = livingParty();
  const foes = livingEnemies();
  if (!foes.length || !allies.length) return null;
  const mage = allies.find((u) => u.job === '마법사');
  if (mage && canUseSkill(mage) && foes.length >= 2) return { actor: mage, target: null };
  const healer = allies.find((u) => u.job === '힐러');
  const hurtCount = allies.filter((u) => u.hp / u.maxHp < 0.6).length;
  if (healer && canUseSkill(healer) && hurtCount >= 2) return { actor: healer, target: null };
  const striker = allies.find((u) => u.job === '전사');
  if (striker && canUseSkill(striker)) return { actor: striker, target: foes.slice().sort((a, b) => a.hp - b.hp)[0] };
  return null;
}

function autoChooseNegotiate() {
  const allies = livingParty();
  if (!allies.length) return null;
  const acts = setup.negotiation.actions;
  const calm = acts.find((a) => a.kind === 'calm');
  const persuade = acts.find((a) => a.kind === 'empathy');
  const aid = acts.find((a) => a.kind === 'heal');
  const neg = setup.negotiation;
  const bestP = allies.slice().sort((a, b) => b.derived.PERSUADE - a.derived.PERSUADE)[0];
  if (state.panic > neg.panicMax * 0.55 && state.blood >= calm.bloodCost) {
    const bestC = allies.slice().sort((a, b) => ((b.primary ? b.primary.CHA : 0) - (a.primary ? a.primary.CHA : 0)))[0];
    return { action: calm, actor: bestC, target: bestC };
  }
  const hurt = allies.filter((u) => u.hp / u.maxHp < 0.45).sort((a, b) => a.hp - b.hp)[0];
  if (hurt && state.blood >= aid.bloodCost) return { action: aid, actor: bestP, target: hurt };
  if (state.blood >= persuade.bloodCost) return { action: persuade, actor: bestP, target: bestP };
  return null;
}

function scheduleAuto() {
  if (state.auto && !state.over && state.phase === 'player') setTimeout(autoStep, AUTO_DELAY);
}

function autoStep() {
  if (!state.auto || state.over || state.phase !== 'player') return;
  state.pendingAction = null;
  state.pendingActor = null;
  if (state.mode === 'negotiate') {
    const c = autoChooseNegotiate();
    if (!c) { endTurnClicked(); return; }
    state.blood -= c.action.bloodCost;
    applyAction(c.action, c.actor, c.target);
    if (checkEnd()) return;
    render();
    scheduleAuto();
    return;
  }
  const skillChoice = autoChooseSkill();
  if (skillChoice) {
    castSkill(skillChoice.actor, skillChoice.target);
    if (!state.over) scheduleAuto();
    return;
  }
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
  if (state.mode === 'negotiate') {
    const neg = setup.negotiation;
    if (state.empathy >= neg.empathyTarget) { state.over = true; addLog('설득 성공! 공감을 모두 얻었습니다.', 'win'); grantRewards(); render(); return true; }
    if (state.panic >= neg.panicMax) { state.over = true; addLog('설득 실패... 군중이 패닉에 빠졌습니다.', 'lose'); render(); return true; }
    if (livingParty().length === 0) { state.over = true; addLog('패배... 파티가 전멸했습니다.', 'lose'); render(); return true; }
    if (state.turn > neg.turnLimit) { state.over = true; addLog('설득 실패... 시간이 초과되었습니다.', 'lose'); render(); return true; }
    return false;
  }
  if (livingEnemies().length === 0) {
    state.over = true; addLog('승리! 모든 적을 제압했습니다.', 'win'); grantRewards(); render(); return true;
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
  // 모드 버튼
  els.modeBattle.classList.toggle('on', state.mode === 'battle');
  els.modeNegotiate.classList.toggle('on', state.mode === 'negotiate');

  // 목표 바 (설득전)
  if (state.mode === 'negotiate') {
    const neg = setup.negotiation;
    const ep = Math.round((state.empathy / neg.empathyTarget) * 100);
    const pa = Math.round((state.panic / neg.panicMax) * 100);
    els.objective.className = 'objective show';
    els.objective.innerHTML = `
      <div class="obj-title">🕊 ${neg.title} · ${state.turn}/${neg.turnLimit}턴</div>
      <div class="obj-bar-row"><div class="obj-label"><span>공감(목표 ${neg.empathyTarget})</span><span>${state.empathy}/${neg.empathyTarget}</span></div><div class="obj-bar"><div class="obj-fill-empathy" style="width:${ep}%"></div></div></div>
      <div class="obj-bar-row"><div class="obj-label"><span>패닉(한계 ${neg.panicMax})</span><span>${state.panic}/${neg.panicMax}</span></div><div class="obj-bar"><div class="obj-fill-panic" style="width:${pa}%"></div></div></div>`;
  } else {
    els.objective.className = 'objective';
    els.objective.innerHTML = '';
  }

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
    if (state.synergy.active.length) {
      const syn = document.createElement('div');
      syn.className = 'synergy-chip';
      syn.textContent = `시너지: ${state.synergy.active.map((s) => s.name).join(' · ')}`;
      els.actionPanel.appendChild(syn);
    }
    currentActions().forEach((a) => {
      const btn = document.createElement('button');
      const disabled = a.bloodCost > state.blood || state.auto;
      btn.className = `action-btn${state.pendingAction && !state.pendingAction.isSkill && state.pendingAction.actionId === a.actionId ? ' selected' : ''}`;
      btn.disabled = disabled;
      btn.innerHTML = `<span>${a.name} <span class="cost">혈 ${a.bloodCost}</span></span><small>${a.desc}</small>`;
      btn.addEventListener('click', () => selectAction(a));
      els.actionPanel.appendChild(btn);
    });
    if (state.mode === 'battle') state.party.filter((u) => u.alive && u.skill).forEach((u) => {
      const sk = u.skill;
      const btn = document.createElement('button');
      const onCd = u.skillCd > 0;
      btn.className = `action-btn skill-btn${state.pendingActor === u && state.pendingAction && state.pendingAction.isSkill ? ' selected' : ''}`;
      btn.disabled = state.auto || onCd || sk.bloodCost > state.blood;
      btn.innerHTML = `<span>✦ ${u.name}: ${sk.name} <span class="cost">혈 ${sk.bloodCost}</span></span><small>${onCd ? `재사용까지 ${u.skillCd}턴` : sk.desc}</small>`;
      btn.addEventListener('click', () => useSkill(u));
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
els.modeBattle.addEventListener('click', () => { if (mode !== 'battle') { mode = 'battle'; initState(); } });
els.modeNegotiate.addEventListener('click', () => { if (mode !== 'negotiate') { mode = 'negotiate'; initState(); } });

function renderPartySource() {
  if (!labParty.length) {
    els.partySource.innerHTML = '<span>기본 샘플 파티로 전투 중 — 🧪 배치 육성소에서 키운 카드를 데려올 수 있어요.</span>';
    return;
  }
  els.partySource.innerHTML = `<span>현재 파티: ${useLab ? `🧪 육성소 파티 (${labParty.length}명)` : '기본 샘플 파티'}</span>`;
  const btn = document.createElement('button');
  btn.textContent = useLab ? '기본 파티로 전환' : '육성 파티로 전환';
  btn.addEventListener('click', () => { useLab = !useLab; renderPartySource(); initState(); });
  els.partySource.appendChild(btn);
}

function loadAcquisition() {
  return fetch(`${DATA_PATH}card-acquisition.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
}

Promise.all([loadSetup(), loadAcquisition()])
  .then(([data, acq]) => {
    setup = data;
    acquisition = acq;
    labParty = loadLabParty();
    useLab = labParty.length > 0;
    renderPartySource();
    initState();
  })
  .catch((err) => { els.turnInfo.textContent = err.message; });
