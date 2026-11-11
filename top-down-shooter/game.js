/** 最小 Top-down Shooter — WASD + 滑鼠瞄準射擊 */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const el = { hp: document.getElementById("hp"), kills: document.getElementById("kills"), status: document.getElementById("status") };
const KEYS = new Set();
let mouse = { x: 480, y: 270, down: false };

const state = {
  x: 480, y: 270, hp: 100, kills: 0, fireCd: 0, spawnT: 0, bullets: [], enemies: [], dead: false,
};

function reset() {
  Object.assign(state, { x: 480, y: 270, hp: 100, kills: 0, fireCd: 0, spawnT: 0, bullets: [], enemies: [], dead: false });
  sync("開打");
}
function sync(msg) {
  el.hp.textContent = String(Math.max(0, Math.ceil(state.hp)));
  el.kills.textContent = String(state.kills);
  if (msg != null) el.status.textContent = msg;
}
function pointer(e) {
  const r = canvas.getBoundingClientRect();
  mouse.x = ((e.clientX - r.left) * canvas.width) / r.width;
  mouse.y = ((e.clientY - r.top) * canvas.height) / r.height;
}
function update(dt) {
  if (state.dead) return;
  let mx = 0; let my = 0;
  if (KEYS.has("KeyW") || KEYS.has("ArrowUp")) my -= 1;
  if (KEYS.has("KeyS") || KEYS.has("ArrowDown")) my += 1;
  if (KEYS.has("KeyA") || KEYS.has("ArrowLeft")) mx -= 1;
  if (KEYS.has("KeyD") || KEYS.has("ArrowRight")) mx += 1;
  if (mx || my) {
    const len = Math.hypot(mx, my) || 1;
    state.x = Math.max(16, Math.min(canvas.width - 16, state.x + (mx / len) * 200 * dt));
    state.y = Math.max(16, Math.min(canvas.height - 16, state.y + (my / len) * 200 * dt));
  }
  state.fireCd -= dt;
  if ((mouse.down || KEYS.has("Space")) && state.fireCd <= 0) {
    const ang = Math.atan2(mouse.y - state.y, mouse.x - state.x);
    state.bullets.push({ x: state.x, y: state.y, vx: Math.cos(ang) * 520, vy: Math.sin(ang) * 520, life: 0.9 });
    state.fireCd = 0.12;
  }
  state.spawnT -= dt;
  if (state.spawnT <= 0) {
    const a = Math.random() * Math.PI * 2;
    state.enemies.push({ x: state.x + Math.cos(a) * 380, y: state.y + Math.sin(a) * 260, hp: 20 });
    state.spawnT = 0.7;
  }
  for (const b of state.bullets) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; }
  for (const e of state.enemies) {
    const ang = Math.atan2(state.y - e.y, state.x - e.x);
    e.x += Math.cos(ang) * 90 * dt; e.y += Math.sin(ang) * 90 * dt;
    for (const b of state.bullets) {
      if (b.life > 0 && Math.hypot(b.x - e.x, b.y - e.y) < 14) { e.hp -= 10; b.life = 0; if (window.Feel && e.hp <= 0) Feel.boom(canvas, e.x, e.y); else if (window.Feel) Feel.burstCanvas(canvas, e.x, e.y, { n: 3, color: '#fff3c4', speed: 2 }); }
    }
    if (e.hp <= 0) { e.dead = true; state.kills += 1; }
    if (Math.hypot(e.x - state.x, e.y - state.y) < 20) {
      state.hp -= 20 * dt;
      if (state.hp <= 0) { state.hp = 0; state.dead = true; sync("陣亡"); if (window.Feel) Feel.hurt(); }
    }
  }
  state.bullets = state.bullets.filter((b) => b.life > 0);
  state.enemies = state.enemies.filter((e) => !e.dead);
  sync(null);
}
function render() {
  ctx.fillStyle = "#15201c"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(212,160,23,0.35)";
  ctx.beginPath(); ctx.moveTo(state.x, state.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
  ctx.fillStyle = "#fff3c4";
  for (const b of state.bullets) { ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = "#c45c48";
  for (const e of state.enemies) { ctx.beginPath(); ctx.arc(e.x, e.y, 12, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = "#3cb371";
  ctx.beginPath(); ctx.arc(state.x, state.y, 14, 0, Math.PI * 2); ctx.fill();
  if (state.dead) {
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#e4572e"; ctx.font = "800 36px Segoe UI"; ctx.textAlign = "center";
    ctx.fillText("DOWN", canvas.width / 2, canvas.height / 2); ctx.textAlign = "start";
  }
}
canvas.addEventListener("pointermove", pointer);
canvas.addEventListener("pointerdown", (e) => { pointer(e); mouse.down = true; });
window.addEventListener("pointerup", () => { mouse.down = false; });
window.addEventListener("keydown", (e) => { KEYS.add(e.code); if (e.code.startsWith("Arrow")) e.preventDefault(); });
window.addEventListener("keyup", (e) => KEYS.delete(e.code));
document.getElementById("btn-restart").onclick = reset;
let last = performance.now();
function frame(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; update(dt); render(); requestAnimationFrame(frame); }
reset(); requestAnimationFrame(frame);
