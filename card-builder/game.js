/** 最小 Card Builder — 手牌、能量、敵人意圖、勝利選牌入組 */

const CARDS = {
  strike: { id: "strike", name: "打擊", cost: 1, desc: "造成 6 傷害", play: (s) => dmgEnemy(s, 6) },
  bash: { id: "bash", name: "重擊", cost: 2, desc: "造成 12 傷害", play: (s) => dmgEnemy(s, 12) },
  defend: { id: "defend", name: "防禦", cost: 1, desc: "獲得 5 護甲", play: (s) => (s.block += 5) },
  heal: { id: "heal", name: "繃帶", cost: 1, desc: "回復 5 HP", play: (s) => (s.php = Math.min(30, s.php + 5)) },
  rage: { id: "rage", name: "狂怒", cost: 0, desc: "本回合攻擊 +3", play: (s) => (s.buff += 3) },
  double: { id: "double", name: "連擊", cost: 1, desc: "造成 4×2 傷害", play: (s) => { dmgEnemy(s, 4); dmgEnemy(s, 4); } },
};

const STARTER = ["strike", "strike", "strike", "defend", "defend", "bash"];

const el = {
  php: document.getElementById("php"),
  energy: document.getElementById("energy"),
  energyMax: document.getElementById("energy-max"),
  ehp: document.getElementById("ehp"),
  intent: document.getElementById("intent"),
  log: document.getElementById("log"),
  hand: document.getElementById("hand"),
  status: document.getElementById("status"),
  reward: document.getElementById("reward"),
  rewardRow: document.getElementById("reward-row"),
  btnEnd: document.getElementById("btn-end"),
  btnRestart: document.getElementById("btn-restart"),
};

const state = {
  php: 30,
  ehp: 40,
  energy: 3,
  energyMax: 3,
  block: 0,
  buff: 0,
  deck: [],
  discard: [],
  hand: [],
  intentDmg: 8,
  over: false,
  won: false,
};

function dmgEnemy(s, n) {
  s.ehp -= n + s.buff;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function draw(n) {
  for (let i = 0; i < n; i++) {
    if (!state.deck.length) {
      state.deck = shuffle(state.discard.splice(0));
    }
    if (!state.deck.length) break;
    state.hand.push(state.deck.pop());
  }
}

function reset() {
  Object.assign(state, {
    php: 30,
    ehp: 40,
    energy: 3,
    energyMax: 3,
    block: 0,
    buff: 0,
    deck: shuffle(STARTER.slice()),
    discard: [],
    hand: [],
    intentDmg: 8,
    over: false,
    won: false,
  });
  el.reward.classList.add("hidden");
  draw(5);
  sync("你的回合");
  renderHand();
}

function sync(msg) {
  el.php.textContent = String(state.php);
  el.energy.textContent = String(state.energy);
  el.energyMax.textContent = String(state.energyMax);
  el.ehp.textContent = String(Math.max(0, state.ehp));
  el.intent.textContent = `意圖：攻擊 ${state.intentDmg}` + (state.block ? ` · 你護甲 ${state.block}` : "");
  if (msg != null) {
    el.status.textContent = msg;
    el.log.textContent = msg;
  }
}

function renderHand() {
  el.hand.innerHTML = "";
  state.hand.forEach((id, idx) => {
    const c = CARDS[id];
    const b = document.createElement("button");
    b.className = "card";
    b.disabled = state.over || state.energy < c.cost;
    b.innerHTML = `<div class="cost">${c.cost}</div><div class="title">${c.name}</div><div class="desc">${c.desc}</div>`;
    b.addEventListener("click", () => playCard(idx));
    el.hand.appendChild(b);
  });
}

function playCard(idx) {
  if (state.over) return;
  const id = state.hand[idx];
  const c = CARDS[id];
  if (state.energy < c.cost) return;
  state.energy -= c.cost;
  c.play(state);
  state.hand.splice(idx, 1);
  state.discard.push(id);
  if (state.ehp <= 0) {
    state.ehp = 0;
    state.over = true;
    state.won = true;
    sync("勝利！");
    if (window.Feel) { Feel.flash('#3cb371', 120); Feel.shake(8, 140); }
    showReward();
  } else {
    sync(`打出 ${c.name}`);
    if (window.Feel) Feel.hit(4);
  }
  renderHand();
  sync(null);
}

function endTurn() {
  if (state.over) return;
  state.discard.push(...state.hand.splice(0));
  let dmg = state.intentDmg;
  const absorbed = Math.min(state.block, dmg);
  dmg -= absorbed;
  state.block = 0;
  state.buff = 0;
  state.php -= dmg;
  if (dmg > 0 && window.Feel) Feel.hurt();
  if (state.php <= 0) {
    state.php = 0;
    state.over = true;
    sync("敗北");
    if (window.Feel) Feel.hurt();
    renderHand();
    return;
  }
  state.intentDmg = 6 + Math.floor(Math.random() * 7);
  state.energy = state.energyMax;
  draw(5);
  sync(`敵人打了你 ${dmg}（吸收 ${absorbed}）`);
  renderHand();
}

function showReward() {
  el.reward.classList.remove("hidden");
  el.rewardRow.innerHTML = "";
  const pool = ["heal", "rage", "double", "bash"].sort(() => Math.random() - 0.5).slice(0, 3);
  for (const id of pool) {
    const c = CARDS[id];
    const b = document.createElement("button");
    b.className = "card";
    b.innerHTML = `<div class="cost">${c.cost}</div><div class="title">${c.name}</div><div class="desc">${c.desc}</div>`;
    b.addEventListener("click", () => {
      STARTER.push(id);
      el.reward.classList.add("hidden");
      reset();
      sync(`加入牌組：${c.name}`);
    });
    el.rewardRow.appendChild(b);
  }
}

el.btnEnd.addEventListener("click", endTurn);
el.btnRestart.addEventListener("click", () => {
  STARTER.length = 0;
  STARTER.push("strike", "strike", "strike", "defend", "defend", "bash");
  reset();
});

reset();
