/** 最小 Platformer — 跑跳、平台碰撞、硬幣、旗幟通關 */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const el = {
  coins: document.getElementById("coins"),
  status: document.getElementById("status"),
  btnRestart: document.getElementById("btn-restart"),
};

function pressed(...codes) {
  return window.Controls
    ? Controls.pressed(...codes)
    : codes.some((c) => false);
}
function axis() {
  return window.Controls ? Controls.axis() : { x: 0, y: 0 };
}

const GRAVITY = 1800;
const MOVE = 260;
const JUMP = 620;

const PLATFORMS = [
  { x: 0, y: 900, w: 540, h: 60 },
  { x: 40, y: 760, w: 180, h: 18 },
  { x: 280, y: 660, w: 180, h: 18 },
  { x: 60, y: 540, w: 160, h: 18 },
  { x: 280, y: 420, w: 180, h: 18 },
  { x: 40, y: 300, w: 180, h: 18 },
  { x: 260, y: 190, w: 200, h: 18 },
  { x: 120, y: 90, w: 180, h: 18 },
];

const COIN_SPOTS = [
  [100, 720],
  [340, 620],
  [120, 500],
  [340, 380],
  [100, 260],
  [340, 150],
];

const FLAG = { x: 260, y: 20, w: 16, h: 70 };

const state = {
  x: 40,
  y: 840,
  vx: 0,
  vy: 0,
  w: 28,
  h: 36,
  onGround: false,
  coins: 0,
  coinFlags: COIN_SPOTS.map(() => true),
  won: false,
  dead: false,
};

function reset() {
  Object.assign(state, {
    x: 40,
    y: 840,
    vx: 0,
    vy: 0,
    onGround: false,
    coins: 0,
    coinFlags: COIN_SPOTS.map(() => true),
    won: false,
    dead: false,
  });
  sync("到達右側旗幟");
}

function sync(msg) {
  el.coins.textContent = String(state.coins);
  if (msg != null) el.status.textContent = msg;
}

function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function update(dt) {
  if (state.won || state.dead) return;

  const a = axis();
  state.vx = a.x * MOVE;
  if (pressed("Space", "ArrowUp", "KeyW") && state.onGround) {
    state.vy = -JUMP;
    state.onGround = false;
    if (window.Feel) Feel.shake(2, 40);
  }

  state.vy += GRAVITY * dt;
  state.x += state.vx * dt;
  state.y += state.vy * dt;

  state.onGround = false;
  for (const p of PLATFORMS) {
    if (!aabb(state.x, state.y, state.w, state.h, p.x, p.y, p.w, p.h)) continue;
    const prevBottom = state.y - state.vy * dt + state.h;
    if (state.vy >= 0 && prevBottom <= p.y + 4) {
      state.y = p.y - state.h;
      state.vy = 0;
      state.onGround = true;
    } else if (state.vy < 0 && state.y < p.y + p.h && state.y + state.h > p.y + p.h) {
      state.y = p.y + p.h;
      state.vy = 0;
    } else if (state.vx > 0) {
      state.x = p.x - state.w;
    } else if (state.vx < 0) {
      state.x = p.x + p.w;
    }
  }

  state.x = Math.max(0, Math.min(canvas.width - state.w, state.x));
  if (state.y > canvas.height + 40) {
    state.dead = true;
    sync("掉下去了 — 重來");
    if (window.Feel) Feel.hurt();
  }

  COIN_SPOTS.forEach(([cx, cy], i) => {
    if (!state.coinFlags[i]) return;
    if (aabb(state.x, state.y, state.w, state.h, cx - 10, cy - 10, 20, 20)) {
      state.coinFlags[i] = false;
      state.coins += 1;
      sync(`硬幣 ${state.coins}`);
      if (window.Feel) Feel.score(canvas, cx, cy);
    }
  });

  if (aabb(state.x, state.y, state.w, state.h, FLAG.x - 8, FLAG.y, FLAG.w + 16, FLAG.h)) {
    state.won = true;
    sync("通關！");
    if (window.Feel) { Feel.flash('#3cb371', 120); Feel.shake(6, 120); }
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#1c2a34");
  g.addColorStop(1, "#121a17");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#2f4a3c";
  for (const p of PLATFORMS) ctx.fillRect(p.x, p.y, p.w, p.h);

  COIN_SPOTS.forEach(([cx, cy], i) => {
    if (!state.coinFlags[i]) return;
    ctx.fillStyle = "#d4a017";
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#8aa396";
  ctx.fillRect(FLAG.x, FLAG.y, 4, FLAG.h);
  ctx.fillStyle = "#e4572e";
  ctx.beginPath();
  ctx.moveTo(FLAG.x + 4, FLAG.y);
  ctx.lineTo(FLAG.x + 36, FLAG.y + 14);
  ctx.lineTo(FLAG.x + 4, FLAG.y + 28);
  ctx.fill();

  ctx.fillStyle = "#3cb371";
  ctx.fillRect(state.x, state.y, state.w, state.h);
  ctx.fillStyle = "#0f1412";
  ctx.fillRect(state.x + 6, state.y + 10, 6, 6);
  ctx.fillRect(state.x + 16, state.y + 10, 6, 6);

  if (state.won || state.dead) {
    ctx.fillStyle = "rgba(8,12,10,0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = state.won ? "#3cb371" : "#e4572e";
    ctx.font = "800 42px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(state.won ? "CLEAR" : "FALL", canvas.width / 2, canvas.height / 2);
  }
}

window.addEventListener("keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
});
el.btnRestart.addEventListener("click", reset);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}
reset();
requestAnimationFrame(frame);
