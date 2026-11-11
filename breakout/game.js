/** 最小 Breakout — 底板、球、磚牆 */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const el = { score: document.getElementById("score"), lives: document.getElementById("lives"), status: document.getElementById("status") };
const KEYS = new Set();
const COLS = 10; const ROWS = 5; const BW = 64; const BH = 22;

const state = {
  px: 310, pw: 100, ball: null, bricks: [], score: 0, lives: 3, running: false, won: false,
};

function resetBall() {
  state.ball = { x: state.px + state.pw / 2, y: 430, vx: 180, vy: -260, r: 7 };
  state.running = false;
}
function buildBricks() {
  state.bricks = [];
  const colors = ["#c45c48", "#d4a017", "#3cb371", "#6ec8ff", "#b388ff"];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      state.bricks.push({ x: 30 + c * (BW + 6), y: 40 + r * (BH + 6), w: BW, h: BH, hp: 1, color: colors[r] });
    }
  }
}
function reset() {
  state.score = 0; state.lives = 3; state.won = false; state.px = 310;
  buildBricks(); resetBall(); sync("Space 發球");
}
function sync(msg) {
  el.score.textContent = String(state.score);
  el.lives.textContent = String(state.lives);
  if (msg != null) el.status.textContent = msg;
}
function update(dt) {
  if (state.won || state.lives <= 0) return;
  let dx = 0;
  if (KEYS.has("ArrowLeft") || KEYS.has("KeyA")) dx -= 1;
  if (KEYS.has("ArrowRight") || KEYS.has("KeyD")) dx += 1;
  state.px = Math.max(0, Math.min(canvas.width - state.pw, state.px + dx * 420 * dt));
  if (!state.running) {
    state.ball.x = state.px + state.pw / 2;
    state.ball.y = 430;
    return;
  }
  const b = state.ball;
  b.x += b.vx * dt; b.y += b.vy * dt;
  if (b.x < b.r || b.x > canvas.width - b.r) b.vx *= -1;
  if (b.y < b.r) b.vy *= -1;
  if (b.y > canvas.height) {
    state.lives -= 1;
    if (window.Feel) Feel.hurt();
    if (state.lives <= 0) sync("失敗");
    else { resetBall(); sync("再發一球"); }
    return;
  }
  if (b.y + b.r >= 440 && b.y < 455 && b.x > state.px && b.x < state.px + state.pw && b.vy > 0) {
    b.vy *= -1;
    b.vx = ((b.x - (state.px + state.pw / 2)) / (state.pw / 2)) * 260;
    if (window.Feel) Feel.shake(3, 60);
  }
  for (const br of state.bricks) {
    if (br.hp <= 0) continue;
    if (b.x > br.x && b.x < br.x + br.w && b.y > br.y && b.y < br.y + br.h) {
      br.hp = 0; b.vy *= -1; state.score += 10; if (window.Feel) Feel.boom(canvas, br.x + br.w / 2, br.y + br.h / 2);
    }
  }
  if (state.bricks.every((br) => br.hp <= 0)) { state.won = true; sync("清台！"); }
  sync(null);
}
function render() {
  ctx.fillStyle = "#121a17"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const br of state.bricks) {
    if (br.hp <= 0) continue;
    ctx.fillStyle = br.color; ctx.fillRect(br.x, br.y, br.w, br.h);
  }
  ctx.fillStyle = "#3cb371"; ctx.fillRect(state.px, 440, state.pw, 12);
  ctx.fillStyle = "#e7f0ea";
  ctx.beginPath(); ctx.arc(state.ball.x, state.ball.y, state.ball.r, 0, Math.PI * 2); ctx.fill();
  if (state.won || state.lives <= 0) {
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = state.won ? "#3cb371" : "#e4572e";
    ctx.font = "800 36px Segoe UI"; ctx.textAlign = "center";
    ctx.fillText(state.won ? "CLEAR" : "FAIL", canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "start";
  }
}
window.addEventListener("keydown", (e) => {
  KEYS.add(e.code);
  if (e.code === "Space") { e.preventDefault(); if (!state.running && state.lives > 0 && !state.won) state.running = true; }
  if (e.code.startsWith("Arrow")) e.preventDefault();
});
window.addEventListener("keyup", (e) => KEYS.delete(e.code));
document.getElementById("btn-restart").onclick = reset;
let last = performance.now();
function frame(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; update(dt); render(); requestAnimationFrame(frame); }
reset(); requestAnimationFrame(frame);
