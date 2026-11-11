/** 最小多人 Survivors — 單機玩法 + mock 隊友位置／射擊同步 */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const el = {
  hp: document.getElementById("hp"),
  ally: document.getElementById("ally"),
  kills: document.getElementById("kills"),
  status: document.getElementById("status"),
  btnRestart: document.getElementById("btn-restart"),
};

const KEYS = new Set();
const state = {
  you: { x: 400, y: 270, hp: 100, fireCd: 0 },
  ally: { x: 520, y: 270, hp: 100, fireCd: 0 },
  enemies: [],
  shots: [],
  kills: 0,
  spawnT: 0,
  elapsed: 0,
  dead: false,
};

function reset() {
  Object.assign(state, {
    you: { x: 400, y: 270, hp: 100, fireCd: 0 },
    ally: { x: 520, y: 270, hp: 100, fireCd: 0 },
    enemies: [],
    shots: [],
    kills: 0,
    spawnT: 0,
    elapsed: 0,
    dead: false,
  });
  sync("開打 — 假隊友會跟你並自動開火");
}

function sync(msg) {
  el.hp.textContent = String(Math.max(0, Math.ceil(state.you.hp)));
  el.ally.textContent = String(Math.max(0, Math.ceil(state.ally.hp)));
  el.kills.textContent = String(state.kills);
  if (msg != null) el.status.textContent = msg;
}

function spawn() {
  const a = Math.random() * Math.PI * 2;
  state.enemies.push({
    x: canvas.width / 2 + Math.cos(a) * 420,
    y: canvas.height / 2 + Math.sin(a) * 280,
    hp: 22,
    speed: 70,
  });
}

function shootFrom(p, dmg) {
  let best = null;
  let bestD = 260;
  for (const e of state.enemies) {
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  if (!best) return;
  const ang = Math.atan2(best.y - p.y, best.x - p.x);
  state.shots.push({
    x: p.x,
    y: p.y,
    vx: Math.cos(ang) * 400,
    vy: Math.sin(ang) * 400,
    life: 0.8,
    dmg,
  });
}

function update(dt) {
  if (state.dead) return;
  state.elapsed += dt;

  let mx = 0;
  let my = 0;
  if (KEYS.has("KeyW") || KEYS.has("ArrowUp")) my -= 1;
  if (KEYS.has("KeyS") || KEYS.has("ArrowDown")) my += 1;
  if (KEYS.has("KeyA") || KEYS.has("ArrowLeft")) mx -= 1;
  if (KEYS.has("KeyD") || KEYS.has("ArrowRight")) mx += 1;
  if (mx || my) {
    const len = Math.hypot(mx, my) || 1;
    state.you.x = Math.max(20, Math.min(canvas.width - 20, state.you.x + (mx / len) * 170 * dt));
    state.you.y = Math.max(20, Math.min(canvas.height - 20, state.you.y + (my / len) * 170 * dt));
  }

  // mock 同步：隊友追你的延遲目標
  state.ally.x += (state.you.x + 70 - state.ally.x) * Math.min(1, dt * 3);
  state.ally.y += (state.you.y - 20 - state.ally.y) * Math.min(1, dt * 3);

  state.spawnT -= dt;
  if (state.spawnT <= 0) {
    spawn();
    if (state.elapsed > 15) spawn();
    state.spawnT = Math.max(0.4, 1 - state.elapsed * 0.012);
  }

  state.you.fireCd -= dt;
  state.ally.fireCd -= dt;
  if (state.you.fireCd <= 0) {
    shootFrom(state.you, 10);
    state.you.fireCd = 0.32;
  }
  if (state.ally.fireCd <= 0) {
    shootFrom(state.ally, 8);
    state.ally.fireCd = 0.4;
  }

  for (const s of state.shots) {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.life -= dt;
    for (const e of state.enemies) {
      if (Math.hypot(e.x - s.x, e.y - s.y) < 14) {
        e.hp -= s.dmg;
        s.life = 0;
        break;
      }
    }
  }
  state.shots = state.shots.filter((s) => s.life > 0);

  for (const e of state.enemies) {
    // 追最近玩家
    const t =
      Math.hypot(e.x - state.you.x, e.y - state.you.y) <= Math.hypot(e.x - state.ally.x, e.y - state.ally.y)
        ? state.you
        : state.ally;
    const ang = Math.atan2(t.y - e.y, t.x - e.x);
    e.x += Math.cos(ang) * e.speed * dt;
    e.y += Math.sin(ang) * e.speed * dt;
    for (const p of [state.you, state.ally]) {
      if (Math.hypot(e.x - p.x, e.y - p.y) < 20) p.hp -= 12 * dt;
    }
  }

  for (const e of state.enemies) {
    if (e.hp <= 0) {
      e.dead = true;
      state.kills += 1;
    }
  }
  state.enemies = state.enemies.filter((e) => !e.dead);

  if (state.you.hp <= 0) {
    state.you.hp = 0;
    state.dead = true;
    sync("你掛了（隊友還在 mock 裡）");
  } else {
    sync(null);
  }
}

function drawPlayer(p, color, label) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e7f0ea";
  ctx.font = "12px Segoe UI";
  ctx.fillText(label, p.x - 10, p.y - 20);
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#15201c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const e of state.enemies) {
    ctx.fillStyle = "#c45c48";
    ctx.beginPath();
    ctx.arc(e.x, e.y, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#fff3c4";
  for (const s of state.shots) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  drawPlayer(state.you, "#3cb371", "YOU");
  drawPlayer(state.ally, "#d4a017", "ALLY");

  if (state.dead) {
    ctx.fillStyle = "rgba(8,12,10,0.55)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#e4572e";
    ctx.font = "800 42px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("DEFEAT", canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "start";
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
