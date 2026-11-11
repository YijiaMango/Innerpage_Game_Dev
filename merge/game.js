/** 最小 Merge — 點格子放下，同階相鄰合成升級 */

const N = 5; const TILE = 96;
const COLORS = ["#3cb371", "#6ec8ff", "#d4a017", "#b388ff", "#c45c48", "#e7f0ea", "#8fd694", "#f0a090"];
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const el = { max: document.getElementById("max"), score: document.getElementById("score"), next: document.getElementById("next"), status: document.getElementById("status") };

let grid, next, score, maxLv, busy;

function reset() {
  grid = Array.from({ length: N }, () => Array(N).fill(0));
  next = 1; score = 0; maxLv = 1; busy = false;
  // seed a few
  grid[2][2] = 1; grid[1][3] = 1;
  sync("點空位放下");
  render();
}
function sync(msg) {
  el.max.textContent = String(maxLv);
  el.score.textContent = String(score);
  el.next.textContent = String(next);
  if (msg != null) el.status.innerHTML = `下一顆：<b id="next">${next}</b>` + (msg ? ` · ${msg}` : "");
}
function neighbors(c, r) {
  return [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]].filter(([x, y]) => x >= 0 && y >= 0 && x < N && y < N);
}
function mergeFrom(c, r) {
  const lv = grid[r][c];
  if (!lv) return false;
  const group = [];
  const seen = new Set();
  const q = [[c, r]];
  seen.add(`${c},${r}`);
  while (q.length) {
    const [x, y] = q.pop();
    group.push([x, y]);
    for (const [nx, ny] of neighbors(x, y)) {
      const k = `${nx},${ny}`;
      if (seen.has(k) || grid[ny][nx] !== lv) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  if (group.length < 2) return false;
  for (const [x, y] of group) grid[y][x] = 0;
  grid[r][c] = lv + 1;
  maxLv = Math.max(maxLv, lv + 1);
  score += group.length * lv * 10;
  mergeFrom(c, r);
  return true;
}
function place(c, r) {
  if (busy || grid[r][c]) return;
  grid[r][c] = next;
  maxLv = Math.max(maxLv, next);
  next = 1 + Math.floor(Math.random() * Math.min(3, maxLv));
  mergeFrom(c, r);
  if (grid.every((row) => row.every(Boolean))) sync("滿了 — 重來");
  else sync("合成中");
  render();
}
function render() {
  ctx.fillStyle = "#121a17"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const x = c * TILE; const y = r * TILE;
      ctx.strokeStyle = "#3d5248"; ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
      const v = grid[r][c];
      if (!v) continue;
      ctx.fillStyle = COLORS[(v - 1) % COLORS.length];
      ctx.beginPath(); ctx.arc(x + TILE / 2, y + TILE / 2, 28, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#0f1412"; ctx.font = "800 22px Segoe UI"; ctx.textAlign = "center";
      ctx.fillText(String(v), x + TILE / 2, y + TILE / 2 + 8);
    }
  }
  ctx.textAlign = "start";
}
canvas.addEventListener("pointerdown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) * canvas.width) / rect.width;
  const y = ((e.clientY - rect.top) * canvas.height) / rect.height;
  place(Math.floor(x / TILE), Math.floor(y / TILE));
});
document.getElementById("btn-restart").onclick = reset;
reset();
