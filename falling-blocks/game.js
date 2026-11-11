/** 最小 Falling Blocks（Tetris-like） */

const COLS = 10; const ROWS = 20; const TILE = 30;
const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  L: [[1, 0], [1, 0], [1, 1]],
  J: [[0, 1], [0, 1], [1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
};
const COLORS = { I: "#6ec8ff", O: "#d4a017", T: "#b388ff", L: "#e4572e", J: "#3cb371", S: "#8fd694", Z: "#c45c48" };
const KEYS = Object.keys(SHAPES);
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const el = { score: document.getElementById("score"), lines: document.getElementById("lines"), status: document.getElementById("status") };

let board, piece, score, lines, dead, dropAcc;

function empty() { return Array.from({ length: ROWS }, () => Array(COLS).fill(null)); }
function spawn() {
  const type = KEYS[Math.floor(Math.random() * KEYS.length)];
  piece = { type, rot: SHAPES[type].map((r) => r.slice()), x: 3, y: 0 };
  if (collide(piece.x, piece.y, piece.rot)) { dead = true; sync("堆滿了"); if (window.Feel) Feel.hurt(); }
}
function collide(x, y, rot) {
  for (let r = 0; r < rot.length; r++) {
    for (let c = 0; c < rot[r].length; c++) {
      if (!rot[r][c]) continue;
      const nx = x + c; const ny = y + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}
function rotate(m) {
  const h = m.length; const w = m[0].length;
  const out = Array.from({ length: w }, () => Array(h).fill(0));
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) out[c][h - 1 - r] = m[r][c];
  return out;
}
function merge() {
  for (let r = 0; r < piece.rot.length; r++) {
    for (let c = 0; c < piece.rot[r].length; c++) {
      if (!piece.rot[r][c]) continue;
      const ny = piece.y + r; const nx = piece.x + c;
      if (ny >= 0) board[ny][nx] = piece.type;
    }
  }
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(Boolean)) { board.splice(r, 1); board.unshift(Array(COLS).fill(null)); cleared++; r++; }
  }
  if (cleared) {
    lines += cleared;
    score += [0, 100, 300, 500, 800][cleared];
    sync(`消 ${cleared} 行`);
    if (window.Feel) {
      Feel.shake(4 + cleared * 2, 100);
      Feel.flash("#3cb371", 60);
    }
  }
  spawn();
}
function hardDrop() {
  while (!collide(piece.x, piece.y + 1, piece.rot)) piece.y++;
  merge();
  if (window.Feel) Feel.shake(2, 40);
}
function reset() {
  board = empty(); score = 0; lines = 0; dead = false; dropAcc = 0; spawn(); sync("新局");
}
function sync(msg) {
  el.score.textContent = String(score); el.lines.textContent = String(lines);
  if (msg != null) el.status.textContent = msg;
}
function update(dt) {
  if (dead) return;
  dropAcc += dt;
  const speed = Math.max(0.12, 0.7 - lines * 0.02);
  while (dropAcc >= speed) {
    dropAcc -= speed;
    if (!collide(piece.x, piece.y + 1, piece.rot)) piece.y++;
    else merge();
  }
  sync(null);
}
function drawCell(x, y, color) {
  ctx.fillStyle = color; ctx.fillRect(x * TILE + 1, y * TILE + 1, TILE - 2, TILE - 2);
}
function render() {
  ctx.fillStyle = "#0e1512"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (board[r][c]) drawCell(c, r, COLORS[board[r][c]]);
  if (piece) {
    for (let r = 0; r < piece.rot.length; r++) for (let c = 0; c < piece.rot[r].length; c++) {
      if (piece.rot[r][c]) drawCell(piece.x + c, piece.y + r, COLORS[piece.type]);
    }
  }
  if (dead) {
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#e4572e"; ctx.font = "800 28px Segoe UI"; ctx.textAlign = "center";
    ctx.fillText("TOP OUT", canvas.width / 2, canvas.height / 2); ctx.textAlign = "start";
  }
}
window.addEventListener("keydown", (e) => {
  if (dead) return;
  if (e.code === "ArrowLeft" || e.code === "KeyA") { if (!collide(piece.x - 1, piece.y, piece.rot)) piece.x--; }
  if (e.code === "ArrowRight" || e.code === "KeyD") { if (!collide(piece.x + 1, piece.y, piece.rot)) piece.x++; }
  if (e.code === "ArrowDown" || e.code === "KeyS") { if (!collide(piece.x, piece.y + 1, piece.rot)) piece.y++; }
  if (e.code === "ArrowUp" || e.code === "KeyW") {
    const rot = rotate(piece.rot);
    if (!collide(piece.x, piece.y, rot)) piece.rot = rot;
  }
  if (e.code === "Space") { e.preventDefault(); hardDrop(); }
  if (e.code.startsWith("Arrow") || e.code === "Space") e.preventDefault();
});
document.getElementById("btn-restart").onclick = reset;
let last = performance.now();
function frame(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; update(dt); render(); requestAnimationFrame(frame); }
reset(); requestAnimationFrame(frame);
