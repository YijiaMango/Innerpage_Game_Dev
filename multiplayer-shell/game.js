/**
 * 最小多人薄殼 — 房間狀態機 + 延遲佇列 mock
 * 之後可把 MockTransport 換成 Colyseus / PartyKit / Socket.io
 */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const el = {
  room: document.getElementById("room"),
  lag: document.getElementById("lag"),
  status: document.getElementById("status"),
  btnJoin: document.getElementById("btn-join"),
  lagRange: document.getElementById("lag-range"),
};

class MockTransport {
  constructor() {
    this.lagMs = 80;
    this.handlers = new Map();
    this.queue = [];
  }
  on(type, fn) {
    this.handlers.set(type, fn);
  }
  emit(type, payload) {
    const deliverAt = performance.now() + this.lagMs;
    this.queue.push({ deliverAt, type, payload });
  }
  tick(now) {
    while (this.queue.length && this.queue[0].deliverAt <= now) {
      const msg = this.queue.shift();
      const fn = this.handlers.get(msg.type);
      if (fn) fn(msg.payload);
    }
  }
}

const net = new MockTransport();
const KEYS = new Set();

const local = { id: "you", x: 200, y: 210, color: "#3cb371" };
const remote = { id: "bot", x: 700, y: 210, color: "#d4a017" };
let roomState = { players: {} };

function join() {
  roomState = { players: {} };
  net.emit("join", { id: local.id, x: local.x, y: local.y });
  // 假遠端玩家：伺服器側 echo 後延遲出現
  setTimeout(() => {
    net.emit("join", { id: remote.id, x: remote.x, y: remote.y });
  }, 120);
  el.status.textContent = "已進房（mock）";
}

net.on("join", (p) => {
  roomState.players[p.id] = { ...p };
});

net.on("move", (p) => {
  if (!roomState.players[p.id]) roomState.players[p.id] = { ...p };
  roomState.players[p.id].x = p.x;
  roomState.players[p.id].y = p.y;
});

function update(dt) {
  let dx = 0;
  let dy = 0;
  if (KEYS.has("KeyW") || KEYS.has("ArrowUp")) dy -= 1;
  if (KEYS.has("KeyS") || KEYS.has("ArrowDown")) dy += 1;
  if (KEYS.has("KeyA") || KEYS.has("ArrowLeft")) dx -= 1;
  if (KEYS.has("KeyD") || KEYS.has("ArrowRight")) dx += 1;
  if (dx || dy) {
    const len = Math.hypot(dx, dy) || 1;
    local.x = Math.max(20, Math.min(canvas.width - 20, local.x + (dx / len) * 220 * dt));
    local.y = Math.max(20, Math.min(canvas.height - 20, local.y + (dy / len) * 220 * dt));
    net.emit("move", { id: local.id, x: local.x, y: local.y });
  }

  // 假遠端：緩慢追你的「已同步位置」
  const youSynced = roomState.players[local.id];
  if (youSynced) {
    remote.x += (youSynced.x + 80 - remote.x) * Math.min(1, dt * 2.2);
    remote.y += (youSynced.y - remote.y) * Math.min(1, dt * 2.2);
    net.emit("move", { id: remote.id, x: remote.x, y: remote.y });
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#15201c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(70,95,82,0.35)";
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // 預測本機（無延遲）
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = local.color;
  ctx.beginPath();
  ctx.arc(local.x, local.y, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  for (const p of Object.values(roomState.players)) {
    ctx.fillStyle = p.id === local.id ? local.color : remote.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e7f0ea";
    ctx.font = "12px Segoe UI";
    ctx.fillText(p.id, p.x - 10, p.y - 20);
  }
}

window.addEventListener("keydown", (e) => {
  KEYS.add(e.code);
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
});
window.addEventListener("keyup", (e) => KEYS.delete(e.code));
el.btnJoin.addEventListener("click", join);
el.lagRange.addEventListener("input", () => {
  net.lagMs = Number(el.lagRange.value);
  el.lag.textContent = String(net.lagMs);
});

join();
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  net.tick(now);
  update(dt);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
