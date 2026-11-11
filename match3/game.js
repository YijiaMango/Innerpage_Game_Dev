/** 最小 Match-3 — 相鄰交換、三連消、重力補珠 */

const N = 8;
const TILE = 67.5;
const COLORS = ["#3cb371", "#d4a017", "#6ec8ff", "#c45c48", "#b388ff", "#e7f0ea"];
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const el = { score: document.getElementById("score"), moves: document.getElementById("moves"), status: document.getElementById("status") };

let grid = [];
let selected = null;
let score = 0;
let moves = 30;
let busy = false;

function rand() { return Math.floor(Math.random() * COLORS.length); }
function sync(msg) {
  el.score.textContent = String(score);
  el.moves.textContent = String(moves);
  if (msg != null) el.status.textContent = msg;
}
function makeGrid() {
  grid = Array.from({ length: N }, () => Array.from({ length: N }, rand));
  while (findMatches().length) collapse(findMatches(), false);
}
function cellAt(e) {
  const r = canvas.getBoundingClientRect();
  const x = ((e.clientX - r.left) * canvas.width) / r.width;
  const y = ((e.clientY - r.top) * canvas.height) / r.height;
  return { c: Math.floor(x / TILE), r: Math.floor(y / TILE) };
}
function findMatches() {
  const m = new Set();
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N - 2; c++) {
      const v = grid[r][c];
      if (v === grid[r][c + 1] && v === grid[r][c + 2]) {
        let k = c;
        while (k < N && grid[r][k] === v) { m.add(`${k},${r}`); k++; }
      }
    }
  }
  for (let c = 0; c < N; c++) {
    for (let r = 0; r < N - 2; r++) {
      const v = grid[r][c];
      if (v === grid[r + 1][c] && v === grid[r + 2][c]) {
        let k = r;
        while (k < N && grid[k][c] === v) { m.add(`${c},${k}`); k++; }
      }
    }
  }
  return [...m].map((s) => { const [c, r] = s.split(",").map(Number); return { c, r }; });
}
function collapse(matches, award) {
  if (!matches.length) return 0;
  if (award) score += matches.length * 10;
  for (const { c, r } of matches) grid[r][c] = -1;
  for (let c = 0; c < N; c++) {
    let write = N - 1;
    for (let r = N - 1; r >= 0; r--) {
      if (grid[r][c] >= 0) { grid[write][c] = grid[r][c]; write--; }
    }
    while (write >= 0) { grid[write][c] = rand(); write--; }
  }
  return matches.length;
}
async function resolve() {
  busy = true;
  let gained = 0;
  for (;;) {
    const m = findMatches();
    if (!m.length) break;
    gained += collapse(m, true);
    if (window.Feel) Feel.hit(4);
    render();
    await new Promise((r) => setTimeout(r, 120));
  }
  busy = false;
  if (moves <= 0) sync(score >= 500 ? "過關分數！" : "步數用完");
  else sync(gained ? `消除 +${gained * 10}` : null);
}
function swap(a, b) {
  const t = grid[a.r][a.c];
  grid[a.r][a.c] = grid[b.r][b.c];
  grid[b.r][b.c] = t;
}
function trySwap(a, b) {
  if (busy || moves <= 0) return;
  if (Math.abs(a.c - b.c) + Math.abs(a.r - b.r) !== 1) return;
  swap(a, b);
  if (!findMatches().length) {
    swap(a, b);
    sync("無消除，退回"); if (window.Feel) Feel.shake(4, 80);
    render();
    return;
  }
  moves -= 1;
  selected = null;
  resolve();
}
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const x = c * TILE; const y = r * TILE;
      ctx.fillStyle = "#1a2420";
      ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
      ctx.fillStyle = COLORS[grid[r][c]];
      ctx.beginPath();
      ctx.roundRect(x + 8, y + 8, TILE - 16, TILE - 16, 10);
      ctx.fill();
      if (selected && selected.c === c && selected.r === r) {
        ctx.strokeStyle = "#d4a017";
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);
      }
    }
  }
}
canvas.addEventListener("pointerdown", (e) => {
  const p = cellAt(e);
  if (p.c < 0 || p.r < 0 || p.c >= N || p.r >= N) return;
  if (!selected) { selected = p; render(); return; }
  if (selected.c === p.c && selected.r === p.r) { selected = null; render(); return; }
  trySwap(selected, p);
  render();
});
document.getElementById("btn-restart").onclick = () => {
  score = 0; moves = 30; selected = null; makeGrid(); sync("新局"); render();
};
makeGrid(); sync("點兩格相鄰交換"); render();
