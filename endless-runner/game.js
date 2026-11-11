/** 最小 Endless Runner */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const el = { dist: document.getElementById("dist"), status: document.getElementById("status") };
const GROUND = 300;

const state = {
  y: GROUND - 40, vy: 0, onGround: true, speed: 260, dist: 0, spawnT: 0, obstacles: [], dead: false,
};

function reset() {
  Object.assign(state, { y: GROUND - 40, vy: 0, onGround: true, speed: 260, dist: 0, spawnT: 0, obstacles: [], dead: false });
  sync("Space 跳");
}
function sync(msg) {
  el.dist.textContent = String(Math.floor(state.dist));
  if (msg != null) el.status.textContent = msg;
}
function jump() {
  if (state.dead || !state.onGround) return;
  state.vy = -520; state.onGround = false; if (window.Feel) Feel.shake(2, 40);
}
function update(dt) {
  if (state.dead) return;
  state.dist += state.speed * dt * 0.1;
  state.speed = 260 + state.dist * 0.8;
  state.vy += 1600 * dt;
  state.y += state.vy * dt;
  if (state.y >= GROUND - 40) { state.y = GROUND - 40; state.vy = 0; state.onGround = true; }

  state.spawnT -= dt;
  if (state.spawnT <= 0) {
    const h = 28 + Math.random() * 36;
    state.obstacles.push({ x: canvas.width + 20, w: 24 + Math.random() * 30, h, y: GROUND - h });
    state.spawnT = 0.9 + Math.random() * 0.8;
  }
  for (const o of state.obstacles) o.x -= state.speed * dt;
  state.obstacles = state.obstacles.filter((o) => o.x + o.w > -10);

  const px = 120; const pw = 28; const ph = 40;
  for (const o of state.obstacles) {
    if (px < o.x + o.w && px + pw > o.x && state.y < o.y + o.h && state.y + ph > o.y) {
      state.dead = true; sync(`撞到了 · ${Math.floor(state.dist)}m`); if (window.Feel) Feel.hurt();
    }
  }
  sync(null);
}
function render() {
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#1c2a34"); g.addColorStop(1, "#121a17");
  ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#2f4a3c"; ctx.fillRect(0, GROUND, canvas.width, canvas.height - GROUND);
  ctx.fillStyle = "#c45c48";
  for (const o of state.obstacles) ctx.fillRect(o.x, o.y, o.w, o.h);
  ctx.fillStyle = "#3cb371"; ctx.fillRect(120, state.y, 28, 40);
  if (state.dead) {
    ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#e4572e"; ctx.font = "800 36px Segoe UI"; ctx.textAlign = "center";
    ctx.fillText("TRIP", canvas.width / 2, canvas.height / 2); ctx.textAlign = "start";
  }
}
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") { e.preventDefault(); jump(); }
});
canvas.addEventListener("pointerdown", jump);
document.getElementById("btn-restart").onclick = reset;
let last = performance.now();
function frame(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; update(dt); render(); requestAnimationFrame(frame); }
reset(); requestAnimationFrame(frame);
