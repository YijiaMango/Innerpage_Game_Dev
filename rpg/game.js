/** 最小 RPG — 俯視移動、NPC 對話、回合戰鬥 */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const el = {
  hp: document.getElementById("hp"),
  gold: document.getElementById("gold"),
  status: document.getElementById("status"),
  panel: document.getElementById("panel"),
  panelBody: document.getElementById("panel-body"),
  panelActions: document.getElementById("panel-actions"),
  btnRestart: document.getElementById("btn-restart"),
};

const KEYS = new Set();
function pressed(...codes) {
  if (window.Pad && window.Pad.pressed) return window.Pad.pressed(...codes);
  return codes.some((c) => KEYS.has(c));
}
let stick = null;
let stickOx = 0;
let stickOy = 0;
let stickMoved = false;

const TILE = 40;
const MAP_W = 13;
const MAP_H = 24;

const NPCS = [
  { id: "villager", x: 6, y: 8, color: "#d4a017", kind: "talk", name: "村民" },
  { id: "slime", x: 9, y: 14, color: "#6ec8ff", kind: "battle", name: "史萊姆", hp: 18, atk: 4, reward: 8 },
  { id: "slime2", x: 4, y: 18, color: "#6ec8ff", kind: "battle", name: "史萊姆", hp: 18, atk: 4, gold: 8 },
];

const state = {
  x: 3,
  y: 3,
  hp: 40,
  maxHp: 40,
  gold: 0,
  mode: "world",
  battle: null,
  npcs: [],
};

function sync(msg) {
  el.hp.textContent = String(state.hp);
  el.gold.textContent = String(state.gold);
  if (msg != null) el.status.textContent = msg;
}

function reset() {
  state.x = 3;
  state.y = 3;
  state.hp = 40;
  state.gold = 0;
  state.mode = "world";
  state.battle = null;
  state.npcs = NPCS.map((n) => ({ ...n }));
  hidePanel();
  sync("找村民對話，打史萊姆練等");
}

function hidePanel() {
  el.panel.classList.add("hidden");
  el.panelActions.innerHTML = "";
}

function showPanel(html, actions) {
  el.panel.classList.remove("hidden");
  el.panelBody.innerHTML = html;
  el.panelActions.innerHTML = "";
  for (const a of actions) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = a.label;
    if (a.primary) b.className = "primary";
    b.addEventListener("click", a.fn);
    el.panelActions.appendChild(b);
  }
}

function npcNear() {
  return state.npcs.find((n) => Math.abs(n.x - state.x) + Math.abs(n.y - state.y) <= 1);
}

function interact() {
  if (state.mode !== "world") return;
  const n = npcNear();
  if (!n) {
    sync("附近沒人");
    return;
  }
  if (n.kind === "talk") {
    showPanel(`<strong>${n.name}</strong><p>西邊有史萊姆。靠近按 E 開戰。打贏有金幣。</p>`, [
      { label: "謝謝", primary: true, fn: hidePanel },
    ]);
    sync("對話中");
    return;
  }
  startBattle(n);
}

function startBattle(n) {
  state.mode = "battle";
  state.battle = { npc: n, ehp: n.hp, log: `遭遇 ${n.name}！` };
  renderBattle();
}

function renderBattle() {
  const b = state.battle;
  showPanel(
    `<strong>戰鬥 · ${b.npc.name}</strong><p>敵 HP ${b.ehp}　你 HP ${state.hp}</p><p>${b.log}</p>`,
    [
      { label: "攻擊", primary: true, fn: () => battleAct("atk") },
      { label: "藥水 (+12)", fn: () => battleAct("heal") },
      { label: "逃跑", fn: () => battleAct("run") },
    ]
  );
  sync("戰鬥中");
}

function battleAct(act) {
  const b = state.battle;
  if (!b) return;
  if (act === "run") {
    state.mode = "world";
    state.battle = null;
    hidePanel();
    sync("逃走了");
    return;
  }
  if (act === "heal") {
    state.hp = Math.min(state.maxHp, state.hp + 12);
    b.log = "你喝了藥水。";
  } else {
    const dmg = 6 + Math.floor(Math.random() * 5);
    b.ehp -= dmg;
    b.log = `你造成 ${dmg} 傷害。`;
    if (window.Feel) Feel.hit(6);
    if (b.ehp <= 0) {
      state.gold += b.npc.gold;
      state.npcs = state.npcs.filter((x) => x.id !== b.npc.id);
      state.mode = "world";
      state.battle = null;
      hidePanel();
      sync(`勝利！+${b.npc.gold} 金`);
      if (window.Feel) { Feel.flash('#3cb371', 100); Feel.shake(5, 100); }
      return;
    }
  }
  const edmg = b.npc.atk + Math.floor(Math.random() * 3);
  state.hp -= edmg;
  b.log += ` 敵人反擊 ${edmg}。`;
  if (window.Feel) Feel.hurt();
  if (state.hp <= 0) {
    state.hp = 0;
    state.mode = "dead";
    showPanel(`<strong>倒下了</strong><p>按重來再試。</p>`, [{ label: "重來", primary: true, fn: reset }]);
    sync("戰敗");
    return;
  }
  renderBattle();
  sync(null);
}

function update(dt) {
  if (state.mode !== "world") return;
  let dx = 0;
  let dy = 0;
  if (stick && Math.hypot(stick.dx, stick.dy) > 14) {
    dx = stick.dx;
    dy = stick.dy;
  } else {
    if (pressed("KeyW", "ArrowUp")) dy -= 1;
    if (pressed("KeyS", "ArrowDown")) dy += 1;
    if (pressed("KeyA", "ArrowLeft")) dx -= 1;
    if (pressed("KeyD", "ArrowRight")) dx += 1;
  }
  if (!dx && !dy) return;
  const len = Math.hypot(dx, dy) || 1;
  const speed = 3.2;
  let nx = state.x + (dx / len) * speed * dt;
  let ny = state.y + (dy / len) * speed * dt;
  nx = Math.max(1, Math.min(MAP_W - 2, nx));
  ny = Math.max(1, Math.min(MAP_H - 2, ny));
  const blocked = state.npcs.some((n) => Math.hypot(n.x - nx, n.y - ny) < 0.7);
  if (!blocked) {
    state.x = nx;
    state.y = ny;
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      ctx.fillStyle = (x + y) % 2 ? "#1a2822" : "#15201c";
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }
  for (const n of state.npcs) {
    ctx.fillStyle = n.color;
    ctx.beginPath();
    ctx.arc(n.x * TILE + TILE / 2, n.y * TILE + TILE / 2, 14, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#3cb371";
  ctx.fillRect(state.x * TILE + 8, state.y * TILE + 6, 24, 28);
  const near = npcNear();
  if (near && state.mode === "world") {
    ctx.fillStyle = "#e7f0ea";
    ctx.font = "12px Segoe UI";
    ctx.fillText("E", near.x * TILE + 14, near.y * TILE - 4);
  }
}

window.addEventListener("pad-key", (e) => {
  if (e.detail && e.detail.type === "down" && e.detail.code === "KeyE") interact();
});
window.addEventListener("keydown", (e) => {
  KEYS.add(e.code);
  if (e.code === "KeyE") interact();
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
});
window.addEventListener("keyup", (e) => KEYS.delete(e.code));
canvas.addEventListener("pointerdown", (e) => {
  if (state.mode !== "world") return;
  stickOx = e.clientX;
  stickOy = e.clientY;
  stickMoved = false;
  stick = { dx: 0, dy: 0 };
  try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
});
canvas.addEventListener("pointermove", (e) => {
  if (!stick) return;
  if (e.pointerType === "mouse" && e.buttons === 0) return;
  stick.dx = e.clientX - stickOx;
  stick.dy = e.clientY - stickOy;
  if (Math.hypot(stick.dx, stick.dy) > 14) stickMoved = true;
});
canvas.addEventListener("pointerup", () => {
  const tap = stick && !stickMoved;
  stick = null;
  if (tap && state.mode === "world") interact();
});
canvas.addEventListener("pointercancel", () => { stick = null; });
el.btnRestart.addEventListener("click", reset);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}
reset();
requestAnimationFrame(frame);
