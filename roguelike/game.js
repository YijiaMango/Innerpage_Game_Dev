/** 最小 Roguelike — 格子地圖、簡易 FOV、撞怪、樓梯換層 */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const el = {
  hp: document.getElementById("hp"),
  floor: document.getElementById("floor"),
  gold: document.getElementById("gold"),
  status: document.getElementById("status"),
  btnRestart: document.getElementById("btn-restart"),
};

const W = 36;
const H = 36;
const TILE = 20;
const WALL = 1;
const FLOOR = 0;

const state = {
  map: [],
  visible: [],
  seen: [],
  px: 1,
  py: 1,
  hp: 30,
  gold: 0,
  floor: 1,
  monsters: [],
  stair: { x: 1, y: 1 },
  dead: false,
};

function sync(msg) {
  el.hp.textContent = String(state.hp);
  el.floor.textContent = String(state.floor);
  el.gold.textContent = String(state.gold);
  if (msg != null) el.status.textContent = msg;
}

function carveRoom(map, x, y, w, h) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (xx > 0 && yy > 0 && xx < W - 1 && yy < H - 1) map[yy][xx] = FLOOR;
    }
  }
}

function carveCorridor(map, x1, y1, x2, y2) {
  let x = x1;
  let y = y1;
  while (x !== x2) {
    map[y][x] = FLOOR;
    x += x < x2 ? 1 : -1;
  }
  while (y !== y2) {
    map[y][x] = FLOOR;
    y += y < y2 ? 1 : -1;
  }
  map[y][x] = FLOOR;
}

function genMap() {
  const map = Array.from({ length: H }, () => Array(W).fill(WALL));
  const rooms = [];
  for (let i = 0; i < 8; i++) {
    const rw = 4 + Math.floor(Math.random() * 5);
    const rh = 4 + Math.floor(Math.random() * 5);
    const rx = 1 + Math.floor(Math.random() * (W - rw - 2));
    const ry = 1 + Math.floor(Math.random() * (H - rh - 2));
    carveRoom(map, rx, ry, rw, rh);
    const cx = rx + (rw >> 1);
    const cy = ry + (rh >> 1);
    if (rooms.length) {
      const prev = rooms[rooms.length - 1];
      carveCorridor(map, prev.cx, prev.cy, cx, cy);
    }
    rooms.push({ cx, cy, rx, ry, rw, rh });
  }
  return { map, rooms };
}

function rebuildFloor(keepStats) {
  const { map, rooms } = genMap();
  state.map = map;
  state.seen = Array.from({ length: H }, () => Array(W).fill(false));
  state.visible = Array.from({ length: H }, () => Array(W).fill(false));
  const start = rooms[0];
  const end = rooms[rooms.length - 1];
  state.px = start.cx;
  state.py = start.cy;
  state.stair = { x: end.cx, y: end.cy };
  state.monsters = [];
  for (let i = 1; i < rooms.length - 1; i++) {
    const r = rooms[i];
    state.monsters.push({
      x: r.cx,
      y: r.cy,
      hp: 6 + state.floor * 2,
      atk: 2 + state.floor,
    });
  }
  if (!keepStats) {
    state.hp = 30;
    state.gold = 0;
    state.floor = 1;
    state.dead = false;
  }
  computeFov();
  sync(keepStats ? `到達第 ${state.floor} 層` : "探索並找 > 下樓");
}

function los(x0, y0, x1, y1) {
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  let sx = x0 < x1 ? 1 : -1;
  let sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;
  while (true) {
    if (x === x1 && y === y1) return true;
    if (!(x === x0 && y === y0) && state.map[y][x] === WALL) return false;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

function computeFov() {
  const R = 7;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) state.visible[y][x] = false;
  }
  for (let y = state.py - R; y <= state.py + R; y++) {
    for (let x = state.px - R; x <= state.px + R; x++) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      if ((x - state.px) ** 2 + (y - state.py) ** 2 > R * R) continue;
      if (los(state.px, state.py, x, y)) {
        state.visible[y][x] = true;
        state.seen[y][x] = true;
      }
    }
  }
}

function monsterAt(x, y) {
  return state.monsters.find((m) => m.x === x && m.y === y && m.hp > 0);
}

function tryMove(dx, dy) {
  if (state.dead) return;
  const nx = state.px + dx;
  const ny = state.py + dy;
  if (nx < 0 || ny < 0 || nx >= W || ny >= H) return;
  if (state.map[ny][nx] === WALL) return;

  const m = monsterAt(nx, ny);
  if (m) {
    m.hp -= 5;
    if (m.hp <= 0) {
      state.gold += 3 + state.floor;
      sync("擊殺怪物"); if (window.Feel) Feel.hit(7);
    } else {
      state.hp -= m.atk;
      sync(`互砍：怪剩 ${m.hp} HP`); if (window.Feel) Feel.shake(5, 80);
      if (state.hp <= 0) {
        state.hp = 0;
        state.dead = true;
        sync("你死了"); if (window.Feel) Feel.hurt();
      }
    }
  } else {
    state.px = nx;
    state.py = ny;
    if (state.px === state.stair.x && state.py === state.stair.y) {
      state.floor += 1;
      state.hp = Math.min(30, state.hp + 8);
      rebuildFloor(true);
      return;
    }
  }

  for (const mon of state.monsters) {
    if (mon.hp <= 0) continue;
    if (!state.visible[mon.y][mon.x]) continue;
    const dist = Math.abs(mon.x - state.px) + Math.abs(mon.y - state.py);
    if (dist === 1) {
      state.hp -= mon.atk;
      if (state.hp <= 0) {
        state.hp = 0;
        state.dead = true;
        sync("被咬死了");
        if (window.Feel) Feel.hurt();
      }
    } else if (dist < 8) {
      const sx = Math.sign(state.px - mon.x);
      const sy = Math.sign(state.py - mon.y);
      const ox = mon.x + (Math.random() < 0.5 ? sx : 0);
      const oy = mon.y + (ox === mon.x ? sy : 0);
      if (state.map[oy]?.[ox] === FLOOR && !monsterAt(ox, oy) && !(ox === state.px && oy === state.py)) {
        mon.x = ox;
        mon.y = oy;
      }
    }
  }
  state.monsters = state.monsters.filter((m) => m.hp > 0);
  computeFov();
  sync(null);
  render();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!state.seen[y][x]) continue;
      const vis = state.visible[y][x];
      if (state.map[y][x] === WALL) {
        ctx.fillStyle = vis ? "#3d5248" : "#1a2420";
      } else {
        ctx.fillStyle = vis ? "#1e2e28" : "#121a17";
      }
      ctx.fillRect(x * TILE, y * TILE, TILE - 1, TILE - 1);
    }
  }

  const s = state.stair;
  if (state.seen[s.y][s.x]) {
    ctx.fillStyle = state.visible[s.y][s.x] ? "#d4a017" : "#6a5510";
    ctx.font = "bold 16px monospace";
    ctx.fillText(">", s.x * TILE + 4, s.y * TILE + 16);
  }

  for (const m of state.monsters) {
    if (!state.visible[m.y][m.x]) continue;
    ctx.fillStyle = "#c45c48";
    ctx.fillRect(m.x * TILE + 4, m.y * TILE + 4, TILE - 8, TILE - 8);
  }

  ctx.fillStyle = "#3cb371";
  ctx.fillRect(state.px * TILE + 3, state.py * TILE + 3, TILE - 6, TILE - 6);

  if (state.dead) {
    ctx.fillStyle = "rgba(8,12,10,0.55)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#e4572e";
    ctx.font = "800 42px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("DEAD", canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "start";
  }
}

function handleCode(code) {
  const map = {
    ArrowUp: [0, -1],
    KeyW: [0, -1],
    ArrowDown: [0, 1],
    KeyS: [0, 1],
    ArrowLeft: [-1, 0],
    KeyA: [-1, 0],
    ArrowRight: [1, 0],
    KeyD: [1, 0],
  };
  const d = map[code];
  if (!d) return;
  tryMove(d[0], d[1]);
}
window.addEventListener("pad-key", (e) => {
  if (e.detail && e.detail.type === "down") handleCode(e.detail.code);
});
window.addEventListener("keydown", (e) => {
  if (!{ ArrowUp: 1, KeyW: 1, ArrowDown: 1, KeyS: 1, ArrowLeft: 1, KeyA: 1, ArrowRight: 1, KeyD: 1 }[e.code]) return;
  e.preventDefault();
  handleCode(e.code);
});

el.btnRestart.addEventListener("click", () => rebuildFloor(false));
rebuildFloor(false);
render();
