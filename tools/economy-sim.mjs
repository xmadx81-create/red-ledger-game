// 경제 시뮬레이터: 데이터(fusion-recipe-tree + card-acquisition) 기준으로
// "전설 1장까지 며칠"을 플레이 강도별로 추정한다. 모든 수치는 데이터에서 읽는다.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, '../src/web-mvp/data');
const J = async (f) => JSON.parse(await readFile(path.join(DATA, f), 'utf8'));

const tree = await J('fusion-recipe-tree.json');
const acq = await J('card-acquisition.json');
const jumps = tree.jumps;           // N->R->SR->EP->L
const order = tree.tierOrder;

function avg(range) { return (range[0] + range[1]) / 2; }

// 하루 카드 수급(기대값)
function dailyIncome(battlesPerDay, winRate) {
  const att = acq.attendanceRewards;
  const q = acq.questRewards;
  const hd = acq.huntDrops;
  let N = 0, R = 0, SR = 0, EP = 0, L = 0;
  // 출석(amortized)
  N += att.daily.reward[0].count;                 // 1/day
  N += att.weeklyStreak7.reward[0].count / 7;      // +5/7
  N += att.monthlyCumulative.reward[0].count / 30; // +20/30
  R += (att.monthlyCumulative.guaranteedBonus?.[0]?.count || 0) / 30;
  // 퀘스트
  N += q.dailyQuest.reward[0].count;               // 2/day
  N += q.weeklyQuest.reward[0].count / 7;          // 10/7
  N += q.storyQuest.reward[0].count / 7;           // 대략
  // 사냥 드랍
  const wins = battlesPerDay * winRate;
  N += wins * hd.baseDrop.dropChance * avg(hd.baseDrop.countRange);
  R += wins * hd.midDrop.dropChance * hd.midDrop.count;
  const jp = wins * hd.jackpotDrop.dropChance;     // 잭팟 횟수/일
  const w = hd.rarityWeightWhenJackpot || { SR: 1 };
  SR += jp * (w.SR || 0); EP += jp * (w.EP || 0); L += jp * (w.L || 0);
  return { N, R, SR, EP, L };
}

// 그리디 합성: 가장 높은 가능한 도약부터 시도해 L로 밀어올림
function fuseGreedy(counts, pity) {
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (let i = jumps.length - 1; i >= 0; i--) {
      const j = jumps[i];
      const from = j.from;
      while (counts[from] >= 1 + j.fodderPerAttempt) {
        counts[from] -= j.fodderPerAttempt;          // 재료 소모
        const f = pity[from] || 0;
        const rate = (f + 1 >= j.pityCap) ? 1 : j.baseSuccessRate;
        if (Math.random() < rate) { counts[from] -= 1; counts[j.to] += 1; pity[from] = 0; progressed = true; }
        else pity[from] = f + 1;
      }
    }
  }
}

function simDaysToLegend(battlesPerDay, winRate = 0.8, maxDays = 100000) {
  const counts = { N: 0, R: 0, SR: 0, EP: 0, L: 0 };
  const pity = {};
  const inc = dailyIncome(battlesPerDay, winRate);
  for (let day = 1; day <= maxDays; day++) {
    // 기대 수급을 누적(소수 → 확률적 반올림)
    for (const g of order) {
      const whole = Math.floor(inc[g]);
      const frac = inc[g] - whole;
      counts[g] += whole + (Math.random() < frac ? 1 : 0);
    }
    fuseGreedy(counts, pity);
    if (counts.L >= 1) return { day, counts };
  }
  return { day: Infinity, counts };
}

function median(arr) { const s = arr.slice().sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; }

console.log('=== 전설 1장 도달 시뮬 (현재 데이터 기준, 일일 기대 수급 + 그리디 합성) ===');
for (const [label, bpd] of [['캐주얼(10전투/일)', 10], ['보통(25전투/일)', 25], ['하드코어(60전투/일)', 60]]) {
  const runs = [];
  for (let k = 0; k < 40; k++) { const r = simDaysToLegend(bpd); runs.push(r.day); }
  const inc = dailyIncome(bpd, 0.8);
  console.log(`${label}: 중앙값 ${median(runs)}일 (일일 N기대 ${inc.N.toFixed(1)}, R ${inc.R.toFixed(2)})`);
}
