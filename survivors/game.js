/** 最小 Survivors — 移動、自動攻擊、刷怪、XP 升級三選一 */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const el = {
  hp: document.getElementById("hp"),
  lv: document.getElementById("lv"),
  xp: document.getElementById("xp"),
  xpNeed: document.getElementById("xp-need"),
  kills: document.getElementById("kills"),
  status: document.getElementById("status"),
  pick: document.getElementById("pick"),
  pickRow: document.getElementById("pick-row"),
  btnRestart: document.getElementById("btn-restart"),
};

const KEYS = new Set();
const UPGRADES = [
  { id: "dmg", label: "傷害 +4", apply: (s) => (s.damage += 4) },
  { id: "spd", label: "移速 +20", apply: (s) => (s.speed += 20) },
  { id: "rate", label: "射速更快", apply: (s) => (s.fireRate = Math.max(0.12, s.fireRate - 0.05)) },
  { id: "range", label: "射程 +30", apply: (s) => (s.range += 30) },
  { id: "hp", label: "回復 30 HP", apply: (s) => (s.hp = Math.min(s.maxHp, s.hp + 30)) },
];

const state = {
  hp: 100,
  maxHp: 100,
  lv: 1,
  xp: 0,
  xpNeed: 20,
  kills: 0,
  x: 480,
  y: 270,
  speed: 160,
  damage: 10,
  fireRate: 0.35,
  fireCd: 0,
  range: 220,
  enemies: [],
  gems: [],
  shots: [],
  spawnT: 0,
  elapsed: 0,
  paused: false,
  dead: false,
};

function reset() {
  Object.assign(state, {
    hp: 100,
    maxHp: 100,
    lv: 1,
    xp: 0,
    xpNeed: 20,
    kills: 0,
    x: 480,
    y: 270,
    speed: 160,
    damage: 10,
    fireRate: 0.35,
    fireCd: 0,
    range: 220,
    enemies: [],
    gems: [],
    shots: [],
    spawnT: 0,
    elapsed: 0,
    paused: false,
    dead: false,
  });
  el.pick.classList.add("hidden");
  el.pickRow.innerHTML = "";
  sync("開打 — 自動鎖定最近怪");
}

function sync(msg) {
  el.hp.textContent = String(Math.max(0, Math.ceil(state.hp)));
  el.lv.textContent = String(state.lv);
  el.xp.textContent = String(state.xp);
  el.xpNeed.textContent = String(state.xpNeed);
  el.kills.textContent = String(state.kills);
  if (msg != null) el.status.textContent = msg;
}

function xpNeedFor(lv) {
  return 16 + lv * 8;
}

function spawnEnemy() {
  const edge = Math.floor(Math.random() * 4);
  let x = 0;
  let y = 0;
  if (edge === 0) {
    x = Math.random() * canvas.width;
    y = -20;
  } else if (edge === 1) {
    x = canvas.width + 20;
    y = Math.random() * canvas.height;
  } else if (edge === 2) {
    x = Math.random() * canvas.width;
    y = canvas.height + 20;
  } else {
    x = -20;
    y = Math.random() * canvas.height;
  }
  const t = 1 + state.elapsed / 40;
  state.enemies.push({
    x,
    y,
    hp: 18 * t,
    maxHp: 18 * t,
    speed: 55 + Math.min(40, state.elapsed * 0.4),
    dmg: 8 + state.elapsed * 0.08,
    r: 12,
  });
}

function nearestEnemy() {
  let best = null;
  let bestD = state.range;
  for (const e of state.enemies) {
    const d = Math.hypot(e.x - state.x, e.y - state.y);
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  return best;
}

function levelUp() {
  state.paused = true;
  el.pick.classList.remove("hidden");
  el.pickRow.innerHTML = "";
  const pool = UPGRADES.slice().sort(() => Math.random() - 0.5).slice(0, 3);
  for (const u of pool) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = u.label;
    b.addEventListener("click", () => {
      u.apply(state);
      state.paused = false;
      el.pick.classList.add("hidden");
      sync(`升級：${u.label}`);
    });
    el.pickRow.appendChild(b);
  }
}

function gainXp(n) {
  state.xp += n;
  while (state.xp >= state.xpNeed) {
    state.xp -= state.xpNeed;
    state.lv += 1;
    state.xpNeed = xpNeedFor(state.lv);
    levelUp();
    if (window.Feel) { Feel.flash('#d4a017', 90); Feel.shake(5, 100); }
  }
}

function update(dt) {
  if (state.paused || state.dead) return;
  state.elapsed += dt;

  let mx = 0;
  let my = 0;
  if (KEYS.has("KeyW") || KEYS.has("ArrowUp")) my -= 1;
  if (KEYS.has("KeyS") || KEYS.has("ArrowDown")) my += 1;
  if (KEYS.has("KeyA") || KEYS.has("ArrowLeft")) mx -= 1;
  if (KEYS.has("KeyD") || KEYS.has("ArrowRight")) mx += 1;
  if (mx || my) {
    const len = Math.hypot(mx, my) || 1;
    state.x = Math.max(16, Math.min(canvas.width - 16, state.x + (mx / len) * state.speed * dt));
    state.y = Math.max(16, Math.min(canvas.height - 16, state.y + (my / len) * state.speed * dt));
  }

  state.spawnT -= dt;
  const interval = Math.max(0.35, 1.1 - state.elapsed * 0.015);
  if (state.spawnT <= 0) {
    spawnEnemy();
    if (state.elapsed > 20) spawnEnemy();
    state.spawnT = interval;
  }

  state.fireCd -= dt;
  if (state.fireCd <= 0) {
    const target = nearestEnemy();
    if (target) {
      state.fireCd = state.fireRate;
      const ang = Math.atan2(target.y - state.y, target.x - state.x);
      state.shots.push({
        x: state.x,
        y: state.y,
        vx: Math.cos(ang) * 420,
        vy: Math.sin(ang) * 420,
        life: 0.9,
        dmg: state.damage,
      });
    }
  }

  for (const s of state.shots) {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.life -= dt;
    for (const e of state.enemies) {
      if (Math.hypot(e.x - s.x, e.y - s.y) < e.r + 4) {
        e.hp -= s.dmg;
        s.life = 0;
        if (window.Feel) Feel.burstCanvas(canvas, e.x, e.y, { n: 4, color: '#fff3c4', speed: 2 });
        break;
      }
    }
  }
  state.shots = state.shots.filter((s) => s.life > 0);

  for (const e of state.enemies) {
    const ang = Math.atan2(state.y - e.y, state.x - e.x);
    e.x += Math.cos(ang) * e.speed * dt;
    e.y += Math.sin(ang) * e.speed * dt;
    if (Math.hypot(e.x - state.x, e.y - state.y) < e.r + 14) {
      state.hp -= e.dmg * dt;
      if (state.hp <= 0) {
        state.hp = 0;
        state.dead = true;
        sync("你掛了 — 按重來");
        if (window.Feel) Feel.hurt();
      }
    }
  }

  for (const e of state.enemies) {
    if (e.hp <= 0) {
      state.kills += 1;
      state.gems.push
      if (window.Feel) Feel.score(canvas, e.x, e.y);({ x: e.x, y: e.y, v: 4 + Math.floor(Math.random() * 3) });
      e.dead = true;
    }
  }
  state.enemies = state.enemies.filter((e) => !e.dead);

  for (const g of state.gems) {
    const d = Math.hypot(g.x - state.x, g.y - state.y);
    if (d < 80) {
      const pull = Math.min(280, 120 + (80 - d) * 4);
      g.x += ((state.x - g.x) / (d || 1)) * pull * dt;
      g.y += ((state.y - g.y) / (d || 1)) * pull * dt;
    }
    if (Math.hypot(g.x - state.x, g.y - state.y) < 18) {
      gainXp(g.v);
      g.got = true;
    }
  }
  state.gems = state.gems.filter((g) => !g.got);
  sync(null);
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#15201c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = "rgba(70,100,85,0.15)";
    ctx.fillRect((i * 97) % canvas.width, (i * 53) % canvas.height, 3, 3);
  }

  for (const g of state.gems) {
    ctx.fillStyle = "#6ec8ff";
    ctx.beginPath();
    ctx.arc(g.x, g.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(212,160,23,0.2)";
  ctx.beginPath();
  ctx.arc(state.x, state.y, state.range, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#3cb371";
  ctx.beginPath();
  ctx.arc(state.x, state.y, 14, 0, Math.PI * 2);
  ctx.fill();

  for (const e of state.enemies) {
    ctx.fillStyle = "#c45c48";
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#fff3c4";
  for (const s of state.shots) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  if (state.dead) {
    ctx.fillStyle = "rgba(8,12,10,0.55)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#e4572e";
    ctx.font = "800 42px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("DEFEAT", canvas.width / 2, canvas.height / 2);
  }
}

window.addEventListener("keydown", (e) => {
  KEYS.add(e.code);
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
});
window.addEventListener("keyup", (e) => KEYS.delete(e.code));
el.btnRestart.addEventListener("click", reset);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}
reset();
requestAnimationFrame(frame);
