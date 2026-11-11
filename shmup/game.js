/** 最小 Shmup — 縱向移動、自動射、敵機波次與子彈 */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const el = { score: document.getElementById("score"), hp: document.getElementById("hp"), status: document.getElementById("status") };
const KEYS = new Set();
function pressed(...codes) {
  if (window.Pad && window.Pad.pressed) return window.Pad.pressed(...codes);
  return codes.some((c) => KEYS.has(c));
}


const state = {
  x: 270, y: 860, hp: 5, score: 0, fireCd: 0, spawnT: 0, elapsed: 0,
  bullets: [], enemies: [], eBullets: [], dead: false,
};

function reset() {
  Object.assign(state, { x: 270, y: 860, hp: 5, score: 0, fireCd: 0, spawnT: 0, elapsed: 0, bullets: [], enemies: [], eBullets: [], dead: false });
  sync("開戰");
}
function sync(msg) {
  el.score.textContent = String(state.score);
  el.hp.textContent = String(state.hp);
  if (msg != null) el.status.textContent = msg;
}
function update(dt) {
  if (state.dead) return;
  state.elapsed += dt;
  let dx = 0;
  if (pressed("ArrowLeft", "KeyA")) dx -= 1;
  if (pressed("ArrowRight", "KeyD")) dx += 1;
  state.x = Math.max(16, Math.min(canvas.width - 16, state.x + dx * 280 * dt));

  state.fireCd -= dt;
  if (state.fireCd <= 0) {
    state.bullets.push({ x: state.x, y: state.y - 12, vy: -520 });
    state.fireCd = 0.18;
  }
  state.spawnT -= dt;
  if (state.spawnT <= 0) {
    state.enemies.push({ x: 40 + Math.random() * (canvas.width - 80), y: -20, hp: 2 + Math.floor(state.elapsed / 20), fireCd: 0.6 + Math.random() });
    state.spawnT = Math.max(0.35, 1.1 - state.elapsed * 0.02);
  }

  for (const b of state.bullets) b.y += b.vy * dt;
  state.bullets = state.bullets.filter((b) => b.y > -10);

  for (const e of state.enemies) {
    e.y += (60 + state.elapsed) * dt * 0.35;
    e.fireCd -= dt;
    if (e.fireCd <= 0) {
      state.eBullets.push({ x: e.x, y: e.y + 10, vy: 220 });
      e.fireCd = 1.2;
    }
    for (const b of state.bullets) {
      if (Math.hypot(b.x - e.x, b.y - e.y) < 16) { e.hp -= 1; b.y = -99; }
    }
    if (e.hp <= 0) { e.dead = true; state.score += 100; if (window.Feel) Feel.boom(canvas, e.x, e.y); }
    if (e.y > canvas.height + 30) e.dead = true;
  }
  state.enemies = state.enemies.filter((e) => !e.dead);

  for (const b of state.eBullets) {
    b.y += b.vy * dt;
    if (Math.hypot(b.x - state.x, b.y - state.y) < 14) {
      b.y = 9999;
      state.hp -= 1;
      if (window.Feel) Feel.hit(5);
      if (state.hp <= 0) { state.hp = 0; state.dead = true; sync("墜機"); if (window.Feel) Feel.hurt(); }
    }
  }
  state.eBullets = state.eBullets.filter((b) => b.y < canvas.height + 20);
  sync(null);
}
function render() {
  ctx.fillStyle = "#0c1218";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = "rgba(180,220,255,0.25)";
    ctx.fillRect((i * 97 + state.elapsed * 40) % canvas.width, (i * 53 + state.elapsed * 120) % canvas.height, 2, 2);
  }
  ctx.fillStyle = "#fff3c4";
  for (const b of state.bullets) { ctx.fillRect(b.x - 2, b.y - 8, 4, 12); }
  ctx.fillStyle = "#f0a090";
  for (const b of state.eBullets) { ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = "#c45c48";
  for (const e of state.enemies) {
    ctx.beginPath();
    ctx.moveTo(e.x, e.y + 12); ctx.lineTo(e.x - 14, e.y - 10); ctx.lineTo(e.x + 14, e.y - 10);
    ctx.fill();
  }
  ctx.fillStyle = "#3cb371";
  ctx.beginPath();
  ctx.moveTo(state.x, state.y - 16); ctx.lineTo(state.x - 14, state.y + 12); ctx.lineTo(state.x + 14, state.y + 12);
  ctx.fill();
  if (state.dead) {
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#e4572e"; ctx.font = "800 36px Segoe UI"; ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2); ctx.textAlign = "start";
  }
}
window.addEventListener("keydown", (e) => { KEYS.add(e.code); if (e.code.startsWith("Arrow")) e.preventDefault(); });
window.addEventListener("keyup", (e) => KEYS.delete(e.code));
canvas.addEventListener("pointermove", (e) => {
  if (e.pointerType === "mouse" && e.buttons === 0) return;
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
  state.x = Math.max(16, Math.min(canvas.width - 16, x));
});
canvas.addEventListener("pointerdown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
  state.x = Math.max(16, Math.min(canvas.width - 16, x));
});
document.getElementById("btn-restart").onclick = reset;
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  update(dt); render(); requestAnimationFrame(frame);
}
reset(); requestAnimationFrame(frame);
