/** 最小 Sokoban — 牆／箱／目標 */

const TILE = 40;
const LEVELS = [
  [
    "########",
    "#@  .  #",
    "# $$   #",
    "#  .$  #",
    "#   .  #",
    "########",
  ],
  [
    "##########",
    "#@       #",
    "# $$ ..  #",
    "#  #$#   #",
    "#   .    #",
    "##########",
  ],
  [
    "#########",
    "#   .   #",
    "# @$ $  #",
    "#  ###  #",
    "#  . .  #",
    "#   $   #",
    "#########",
  ],
];

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const el = { level: document.getElementById("level"), steps: document.getElementById("steps"), status: document.getElementById("status") };

let levelIdx = 0, walls, goals, boxes, px, py, steps, won;

function load(idx) {
  levelIdx = idx;
  const rows = LEVELS[idx];
  walls = new Set(); goals = new Set(); boxes = new Set();
  steps = 0; won = false;
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      const k = `${x},${y}`;
      if (ch === "#") walls.add(k);
      if (ch === "." || ch === "*" || ch === "+") goals.add(k);
      if (ch === "$" || ch === "*") boxes.add(k);
      if (ch === "@" || ch === "+") { px = x; py = y; }
    }
  }
  sync(`關卡 ${idx + 1}`);
  render();
}
function sync(msg) {
  el.level.textContent = String(levelIdx + 1);
  el.steps.textContent = String(steps);
  if (msg != null) el.status.textContent = msg;
}
function key(x, y) { return `${x},${y}`; }
function tryMove(dx, dy) {
  if (won) return;
  const nx = px + dx; const ny = py + dy;
  const nk = key(nx, ny);
  if (walls.has(nk)) return;
  if (boxes.has(nk)) {
    const bx = nx + dx; const by = ny + dy; const bk = key(bx, by);
    if (walls.has(bk) || boxes.has(bk)) return;
    boxes.delete(nk); boxes.add(bk);
    if (window.Feel) Feel.shake(3, 50);
  }
  px = nx; py = ny; steps += 1;
  if ([...goals].every((g) => boxes.has(g))) {
    won = true;
    if (window.Feel) { Feel.flash('#d4a017', 100); Feel.shake(6, 120); }
    if (levelIdx < LEVELS.length - 1) sync("過關！按重來進下一關會重置；方向鍵可繼續本關");
    else sync("全部通關");
    // auto advance on next reset if won mid-run - better: advance immediately after short beat
    setTimeout(() => { if (won && levelIdx < LEVELS.length - 1) load(levelIdx + 1); }, 600);
  } else sync(null);
  render();
}
function render() {
  const rows = LEVELS[levelIdx];
  const W = rows[0].length; const H = rows.length;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#121a17"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const ox = (canvas.width - W * TILE) / 2; const oy = (canvas.height - H * TILE) / 2;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const k = key(x, y);
      const X = ox + x * TILE; const Y = oy + y * TILE;
      ctx.fillStyle = walls.has(k) ? "#3d5248" : "#1a2420";
      ctx.fillRect(X, Y, TILE - 1, TILE - 1);
      if (goals.has(k)) {
        ctx.fillStyle = "#d4a017";
        ctx.beginPath(); ctx.arc(X + TILE / 2, Y + TILE / 2, 6, 0, Math.PI * 2); ctx.fill();
      }
      if (boxes.has(k)) {
        ctx.fillStyle = goals.has(k) ? "#3cb371" : "#c45c48";
        ctx.fillRect(X + 6, Y + 6, TILE - 12, TILE - 12);
      }
    }
  }
  ctx.fillStyle = "#6ec8ff";
  ctx.beginPath();
  ctx.arc(ox + px * TILE + TILE / 2, oy + py * TILE + TILE / 2, 12, 0, Math.PI * 2);
  ctx.fill();
}
window.addEventListener("keydown", (e) => {
  const map = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] };
  const d = map[e.code]; if (!d) return; e.preventDefault(); tryMove(d[0], d[1]);
});
document.getElementById("btn-restart").onclick = () => load(levelIdx);
load(0);
