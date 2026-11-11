/** 最小 Asteroids — 轉向推進射擊、隕石分裂 */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const el = { score: document.getElementById("score"), lives: document.getElementById("lives"), status: document.getElementById("status") };
const KEYS = new Set();
function pressed(...codes) {
  if (window.Pad && window.Pad.pressed) return window.Pad.pressed(...codes);
  return codes.some((c) => KEYS.has(c));
}


const state = {
  x: 270, y: 480, ang: -Math.PI / 2, vx: 0, vy: 0, fireCd: 0,
  bullets: [], rocks: [], score: 0, lives: 3, inv: 0, dead: false,
};

function spawnRock(x, y, r) {
  const a = Math.random() * Math.PI * 2;
  const sp = 40 + Math.random() * 60;
  state.rocks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r });
}
function reset() {
  Object.assign(state, {
    x: 270, y: 480, ang: -Math.PI / 2, vx: 0, vy: 0, fireCd: 0,
    bullets: [], rocks: [], score: 0, lives: 3, inv: 0, dead: false,
  });
  for (let i = 0; i < 5; i++) spawnRock(Math.random() * canvas.width, Math.random() * canvas.height, 40);
  sync("起飛");
}
function wrap(v, max) { return ((v % max) + max) % max; }
function sync(msg) {
  el.score.textContent = String(state.score);
  el.lives.textContent = String(state.lives);
  if (msg != null) el.status.textContent = msg;
}
function update(dt) {
  if (state.dead) return;
  if (pressed("ArrowLeft", "KeyA")) state.ang -= 3.2 * dt;
  if (pressed("ArrowRight", "KeyD")) state.ang += 3.2 * dt;
  if (pressed("ArrowUp", "KeyW")) {
    state.vx += Math.cos(state.ang) * 220 * dt;
    state.vy += Math.sin(state.ang) * 220 * dt;
  }
  state.vx *= 0.995; state.vy *= 0.995;
  state.x = wrap(state.x + state.vx * dt, canvas.width);
  state.y = wrap(state.y + state.vy * dt, canvas.height);
  state.fireCd -= dt; state.inv -= dt;
  if ((pressed("Space", "KeyJ")) && state.fireCd <= 0) {
    state.bullets.push({
      x: state.x + Math.cos(state.ang) * 16,
      y: state.y + Math.sin(state.ang) * 16,
      vx: Math.cos(state.ang) * 420 + state.vx,
      vy: Math.sin(state.ang) * 420 + state.vy,
      life: 0.9,
    });
    state.fireCd = 0.18;
  }
  for (const b of state.bullets) { b.x = wrap(b.x + b.vx * dt, canvas.width); b.y = wrap(b.y + b.vy * dt, canvas.height); b.life -= dt; }
  state.bullets = state.bullets.filter((b) => b.life > 0);

  for (const r of state.rocks) {
    r.x = wrap(r.x + r.vx * dt, canvas.width);
    r.y = wrap(r.y + r.vy * dt, canvas.height);
    for (const b of state.bullets) {
      if (b.life > 0 && Math.hypot(b.x - r.x, b.y - r.y) < r.r) {
        b.life = 0; r.hit = true; state.score += Math.floor(50 / (r.r / 20)); if (window.Feel) Feel.boom(canvas, r.x, r.y);
      }
    }
    if (state.inv <= 0 && Math.hypot(state.x - r.x, state.y - r.y) < r.r + 10) {
      state.lives -= 1; state.inv = 2;
      state.x = 450; state.y = 270; state.vx = 0; state.vy = 0;
      if (window.Feel) Feel.hurt();
      if (state.lives <= 0) { state.dead = true; sync("全滅"); }
      else sync("被撞了");
    }
  }
  const kept = [];
  for (const r of state.rocks) {
    if (!r.hit) kept.push(r);
    else if (r.r > 18) {
      const a1 = Math.random() * Math.PI * 2;
      const a2 = a1 + Math.PI;
      kept.push({ x: r.x, y: r.y, vx: Math.cos(a1) * 80, vy: Math.sin(a1) * 80, r: r.r * 0.55 });
      kept.push({ x: r.x, y: r.y, vx: Math.cos(a2) * 80, vy: Math.sin(a2) * 80, r: r.r * 0.55 });
    }
  }
  state.rocks = kept;
  if (!state.rocks.length) {
    for (let i = 0; i < 5; i++) spawnRock(Math.random() * canvas.width, Math.random() * canvas.height, 40);
    sync("下一波");
  }
  sync(null);
}
function render() {
  ctx.fillStyle = "#0b1014"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#8aa396";
  for (const r of state.rocks) {
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = "#fff3c4";
  for (const b of state.bullets) { ctx.beginPath(); ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2); ctx.fill(); }
  ctx.save();
  ctx.translate(state.x, state.y); ctx.rotate(state.ang);
  ctx.globalAlpha = state.inv > 0 ? 0.4 : 1;
  ctx.strokeStyle = "#3cb371"; ctx.beginPath();
  ctx.moveTo(14, 0); ctx.lineTo(-10, 10); ctx.lineTo(-6, 0); ctx.lineTo(-10, -10); ctx.closePath(); ctx.stroke();
  ctx.restore();
  if (state.dead) {
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#e4572e"; ctx.font = "800 36px Segoe UI"; ctx.textAlign = "center";
    ctx.fillText("DESTROYED", canvas.width / 2, canvas.height / 2); ctx.textAlign = "start";
  }
}
window.addEventListener("keydown", (e) => { KEYS.add(e.code); if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault(); });
window.addEventListener("keyup", (e) => KEYS.delete(e.code));
document.getElementById("btn-restart").onclick = reset;
let last = performance.now();
function frame(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; update(dt); render(); requestAnimationFrame(frame); }
reset(); requestAnimationFrame(frame);
