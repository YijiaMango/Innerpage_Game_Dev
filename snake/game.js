/** 最小 Snake */

const N = 20; const TILE = 30;
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const el = { len: document.getElementById("len"), status: document.getElementById("status") };

let snake, dir, nextDir, food, dead, acc;

function reset() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  dir = { x: 1, y: 0 }; nextDir = { ...dir };
  placeFood(); dead = false; acc = 0;
  sync("開始移動");
}
function placeFood() {
  do {
    food = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) };
  } while (snake.some((s) => s.x === food.x && s.y === food.y));
}
function sync(msg) {
  el.len.textContent = String(snake.length);
  if (msg != null) el.status.textContent = msg;
}
function step() {
  if (dead) return;
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  if (head.x < 0 || head.y < 0 || head.x >= N || head.y >= N || snake.some((s) => s.x === head.x && s.y === head.y)) {
    dead = true; sync("撞死了"); if (window.Feel) Feel.hurt(); return;
  }
  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) { placeFood(); sync(`長度 ${snake.length}`); if (window.Feel) Feel.score(canvas, head.x * TILE + 15, head.y * TILE + 15); }
  else snake.pop();
  sync(null);
}
function render() {
  ctx.fillStyle = "#121a17"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i <= N; i++) {
    ctx.strokeStyle = "rgba(70,95,82,0.25)";
    ctx.beginPath(); ctx.moveTo(i * TILE, 0); ctx.lineTo(i * TILE, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * TILE); ctx.lineTo(canvas.width, i * TILE); ctx.stroke();
  }
  ctx.fillStyle = "#d4a017";
  ctx.beginPath(); ctx.arc(food.x * TILE + 15, food.y * TILE + 15, 10, 0, Math.PI * 2); ctx.fill();
  snake.forEach((s, i) => {
    ctx.fillStyle = i === 0 ? "#3cb371" : "#2f6b49";
    ctx.fillRect(s.x * TILE + 2, s.y * TILE + 2, TILE - 4, TILE - 4);
  });
  if (dead) {
    ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#e4572e"; ctx.font = "800 36px Segoe UI"; ctx.textAlign = "center";
    ctx.fillText("DEAD", canvas.width / 2, canvas.height / 2); ctx.textAlign = "start";
  }
}
function handleCode(code) {
  const map = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] };
  const d = map[code];
  if (!d) return;
  if (d[0] === -dir.x && d[1] === -dir.y) return;
  nextDir = { x: d[0], y: d[1] };
}
window.addEventListener("pad-key", (e) => {
  if (e.detail && e.detail.type === "down") handleCode(e.detail.code);
});
window.addEventListener("keydown", (e) => {
  if (!{ ArrowUp: 1, KeyW: 1, ArrowDown: 1, KeyS: 1, ArrowLeft: 1, KeyA: 1, ArrowRight: 1, KeyD: 1 }[e.code]) return;
  e.preventDefault();
  handleCode(e.code);
});
document.getElementById("btn-restart").onclick = reset;
let last = performance.now();
function frame(now) {
  const dt = (now - last) / 1000; last = now;
  acc += dt;
  while (acc > 0.12) { step(); acc -= 0.12; }
  render(); requestAnimationFrame(frame);
}
reset(); requestAnimationFrame(frame);
