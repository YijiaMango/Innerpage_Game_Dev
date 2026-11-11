/** 最小可運行 Tower Defense — 純 Canvas，無依賴 */

const COLS = 16;
const ROWS = 9;
const TILE = 60;
const TOWER_COST = 40;
const MAX_WAVES = 10;
const START_GOLD = 100;
const START_LIVES = 20;

/** 路徑：格子座標 (c,r)，敵人依序走 */
const PATH = [
  [0, 4],
  [3, 4],
  [3, 1],
  [7, 1],
  [7, 6],
  [11, 6],
  [11, 2],
  [14, 2],
  [14, 7],
  [15, 7],
];

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const el = {
  gold: document.getElementById("gold"),
  lives: document.getElementById("lives"),
  wave: document.getElementById("wave"),
  waveMax: document.getElementById("wave-max"),
  hint: document.getElementById("hint"),
  status: document.getElementById("status"),
  btnWave: document.getElementById("btn-wave"),
  btnSell: document.getElementById("btn-sell"),
  btnRestart: document.getElementById("btn-restart"),
};

el.waveMax.textContent = String(MAX_WAVES);

const pathSet = new Set(PATH.map(([c, r]) => key(c, r)));
const pathPixels = PATH.map(([c, r]) => ({
  x: c * TILE + TILE / 2,
  y: r * TILE + TILE / 2,
}));

function key(c, r) {
  return `${c},${r}`;
}

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function cellFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * sx;
  const y = (e.clientY - rect.top) * sy;
  return { c: Math.floor(x / TILE), r: Math.floor(y / TILE), x, y };
}

const state = {
  gold: START_GOLD,
  lives: START_LIVES,
  wave: 0,
  running: false,
  gameOver: false,
  won: false,
  selected: null,
  towers: [],
  enemies: [],
  shots: [],
  spawnQueue: 0,
  spawnTimer: 0,
  hover: null,
};

function reset() {
  state.gold = START_GOLD;
  state.lives = START_LIVES;
  state.wave = 0;
  state.running = false;
  state.gameOver = false;
  state.won = false;
  state.selected = null;
  state.towers = [];
  state.enemies = [];
  state.shots = [];
  state.spawnQueue = 0;
  state.spawnTimer = 0;
  syncHud("放幾座塔，再按開始波次");
}

function syncHud(msg) {
  el.gold.textContent = String(state.gold);
  el.lives.textContent = String(state.lives);
  el.wave.textContent = String(state.wave);
  el.btnWave.disabled = state.running || state.gameOver || state.won;
  el.btnSell.disabled = state.selected == null || state.gameOver;
  if (msg != null) el.status.textContent = msg;
}

function canBuild(c, r) {
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return false;
  if (pathSet.has(key(c, r))) return false;
  return !state.towers.some((t) => t.c === c && t.r === r);
}

function placeTower(c, r) {
  if (state.gameOver || state.won) return;
  if (!canBuild(c, r)) return;
  if (state.gold < TOWER_COST) {
    syncHud("金幣不夠");
    return;
  }
  state.gold -= TOWER_COST;
  state.towers.push({
    c,
    r,
    x: c * TILE + TILE / 2,
    y: r * TILE + TILE / 2,
    range: 130,
    fireCd: 0,
    fireRate: 0.55,
    damage: 18,
  });
  state.selected = state.towers.length - 1;
  syncHud(`建塔 @ (${c},${r})`);
}

function sellSelected() {
  if (state.selected == null) return;
  const t = state.towers[state.selected];
  state.gold += Math.floor(TOWER_COST / 2);
  state.towers.splice(state.selected, 1);
  state.selected = null;
  syncHud("已賣掉塔");
}

function waveStats(n) {
  return {
    count: 6 + n * 2,
    hp: 40 + n * 22,
    speed: 55 + n * 4,
    reward: 8 + Math.floor(n * 1.5),
  };
}

function startWave() {
  if (state.running || state.gameOver || state.won) return;
  if (state.wave >= MAX_WAVES) return;
  state.wave += 1;
  const w = waveStats(state.wave);
  state.spawnQueue = w.count;
  state.spawnTimer = 0;
  state.running = true;
  syncHud(`第 ${state.wave} 波來了`);
}

function spawnEnemy() {
  const w = waveStats(state.wave);
  const start = pathPixels[0];
  state.enemies.push({
    x: start.x,
    y: start.y,
    hp: w.hp,
    maxHp: w.hp,
    speed: w.speed,
    reward: w.reward,
    waypoint: 1,
    alive: true,
  });
}

function updateEnemy(e, dt) {
  if (!e.alive) return;
  if (e.waypoint >= pathPixels.length) {
    e.alive = false;
    state.lives -= 1;
    if (window.Feel) Feel.hurt();
    if (state.lives <= 0) {
      state.lives = 0;
      state.gameOver = true;
      state.running = false;
      syncHud("基地被打穿了 — 按重來");
    }
    return;
  }
  const target = pathPixels[e.waypoint];
  const d = dist(e, target);
  const step = e.speed * dt;
  if (d <= step) {
    e.x = target.x;
    e.y = target.y;
    e.waypoint += 1;
  } else {
    e.x += ((target.x - e.x) / d) * step;
    e.y += ((target.y - e.y) / d) * step;
  }
}

function updateTower(t, dt) {
  t.fireCd -= dt;
  if (t.fireCd > 0) return;
  let best = null;
  let bestD = Infinity;
  for (const e of state.enemies) {
    if (!e.alive) continue;
    const d = dist(t, e);
    if (d <= t.range && d < bestD) {
      best = e;
      bestD = d;
    }
  }
  if (!best) return;
  t.fireCd = t.fireRate;
  state.shots.push({
    x: t.x,
    y: t.y,
    tx: best.x,
    ty: best.y,
    target: best,
    speed: 420,
    damage: t.damage,
    life: 0.6,
  });
}

function updateShot(s, dt) {
  if (!s.target.alive) {
    s.life = 0;
    return;
  }
  s.tx = s.target.x;
  s.ty = s.target.y;
  const d = dist(s, { x: s.tx, y: s.ty });
  const step = s.speed * dt;
  if (d <= step || d < 8) {
    s.target.hp -= s.damage;
    s.life = 0;
    if (s.target.hp <= 0) {
      s.target.alive = false;
      state.gold += s.target.reward;
      if (window.Feel) Feel.boom(canvas, s.target.x, s.target.y);
      syncHud(null);
    }
    return;
  }
  s.x += ((s.tx - s.x) / d) * step;
  s.y += ((s.ty - s.y) / d) * step;
  s.life -= dt;
}

function checkWaveClear() {
  if (!state.running) return;
  if (state.spawnQueue > 0) return;
  if (state.enemies.some((e) => e.alive)) return;
  state.running = false;
  state.enemies = [];
  state.shots = [];
  if (state.wave >= MAX_WAVES) {
    state.won = true;
    syncHud("通關 — 10 波清完");
  } else {
    syncHud(`第 ${state.wave} 波結束，準備下一波`);
  }
  el.btnWave.disabled = state.won || state.gameOver;
}

function update(dt) {
  if (state.gameOver || state.won) return;

  if (state.running && state.spawnQueue > 0) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnEnemy();
      state.spawnQueue -= 1;
      state.spawnTimer = Math.max(0.35, 0.85 - state.wave * 0.04);
    }
  }

  for (const e of state.enemies) updateEnemy(e, dt);
  for (const t of state.towers) updateTower(t, dt);
  for (const s of state.shots) updateShot(s, dt);
  state.enemies = state.enemies.filter((e) => e.alive);
  state.shots = state.shots.filter((s) => s.life > 0);
  checkWaveClear();
  syncHud(null);
}

function drawGrid() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = c * TILE;
      const y = r * TILE;
      const onPath = pathSet.has(key(c, r));
      ctx.fillStyle = onPath ? "#24332d" : "#17211d";
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = "rgba(70, 95, 82, 0.35)";
      ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
    }
  }

  ctx.strokeStyle = "#3d6b52";
  ctx.lineWidth = 18;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  pathPixels.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  // spawn / base markers
  const a = pathPixels[0];
  const b = pathPixels[pathPixels.length - 1];
  ctx.fillStyle = "#3cb371";
  ctx.beginPath();
  ctx.arc(a.x, a.y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e4572e";
  ctx.fillRect(b.x - 12, b.y - 12, 24, 24);
}

function drawHover() {
  const h = state.hover;
  if (!h) return;
  const { c, r } = h;
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return;
  const ok = canBuild(c, r) && state.gold >= TOWER_COST;
  ctx.fillStyle = ok ? "rgba(60, 179, 113, 0.28)" : "rgba(228, 87, 46, 0.28)";
  ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
  if (ok) {
    ctx.strokeStyle = "rgba(212, 160, 23, 0.45)";
    ctx.beginPath();
    ctx.arc(c * TILE + TILE / 2, r * TILE + TILE / 2, 130, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawTowers() {
  state.towers.forEach((t, i) => {
    if (i === state.selected) {
      ctx.strokeStyle = "rgba(212, 160, 23, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = i === state.selected ? "#d4a017" : "#4aa572";
    ctx.beginPath();
    ctx.moveTo(t.x, t.y - 16);
    ctx.lineTo(t.x + 14, t.y + 12);
    ctx.lineTo(t.x - 14, t.y + 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#0f1412";
    ctx.beginPath();
    ctx.arc(t.x, t.y + 2, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawEnemies() {
  for (const e of state.enemies) {
    ctx.fillStyle = "#c45c48";
    ctx.beginPath();
    ctx.arc(e.x, e.y, 12, 0, Math.PI * 2);
    ctx.fill();
    const ratio = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = "#1a2420";
    ctx.fillRect(e.x - 14, e.y - 22, 28, 4);
    ctx.fillStyle = ratio > 0.35 ? "#3cb371" : "#e4572e";
    ctx.fillRect(e.x - 14, e.y - 22, 28 * ratio, 4);
  }
}

function drawShots() {
  ctx.strokeStyle = "#f0d78c";
  ctx.lineWidth = 2;
  for (const s of state.shots) {
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.tx, s.ty);
    ctx.stroke();
    ctx.fillStyle = "#fff3c4";
    ctx.beginPath();
    ctx.arc(s.x, s.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawOverlay() {
  if (!state.gameOver && !state.won) return;
  ctx.fillStyle = "rgba(8, 12, 10, 0.55)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = state.won ? "#3cb371" : "#e4572e";
  ctx.font = "800 42px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(state.won ? "VICTORY" : "DEFEAT", canvas.width / 2, canvas.height / 2);
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawHover();
  drawTowers();
  drawEnemies();
  drawShots();
  drawOverlay();
}

canvas.addEventListener("pointermove", (e) => {
  const { c, r } = cellFromEvent(e);
  state.hover = { c, r };
});

canvas.addEventListener("pointerleave", () => {
  state.hover = null;
});

canvas.addEventListener("pointerdown", (e) => {
  const { c, r } = cellFromEvent(e);
  const idx = state.towers.findIndex((t) => t.c === c && t.r === r);
  if (idx >= 0) {
    state.selected = idx;
    syncHud(`選中塔 (${c},${r})`);
    return;
  }
  placeTower(c, r);
});

el.btnWave.addEventListener("click", startWave);
el.btnSell.addEventListener("click", sellSelected);
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
