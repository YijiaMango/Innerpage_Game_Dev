/** 最小 Rhythm — 四軌下落音符、鍵盤判定 */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const el = { score: document.getElementById("score"), combo: document.getElementById("combo"), status: document.getElementById("status") };
const LANES = 4;
const KEYMAP = { KeyD: 0, KeyF: 1, KeyJ: 2, KeyK: 3 };
const HIT_Y = 560;

const state = { notes: [], score: 0, combo: 0, t: 0, spawnI: 0, chart: [], over: false };

function makeChart() {
  const c = [];
  for (let i = 0; i < 40; i++) {
    c.push({ t: 1.2 + i * 0.45 + (i % 5 === 0 ? 0.15 : 0), lane: i % 4 });
    if (i % 7 === 0) c.push({ t: 1.2 + i * 0.45 + 0.22, lane: (i + 2) % 4 });
  }
  return c;
}
function reset() {
  Object.assign(state, { notes: [], score: 0, combo: 0, t: 0, spawnI: 0, chart: makeChart(), over: false });
  sync("預備");
}
function sync(msg) {
  el.score.textContent = String(state.score);
  el.combo.textContent = String(state.combo);
  if (msg != null) el.status.textContent = msg;
}
function update(dt) {
  if (state.over) return;
  state.t += dt;
  while (state.spawnI < state.chart.length && state.chart[state.spawnI].t <= state.t + 1.6) {
    const n = state.chart[state.spawnI++];
    state.notes.push({ lane: n.lane, y: -20, hitT: n.t, alive: true });
  }
  for (const n of state.notes) {
    if (!n.alive) continue;
    // travel so that at hitT, y ~= HIT_Y
    const travel = 1.6;
    n.y = HIT_Y - ((n.hitT - state.t) / travel) * (HIT_Y + 40);
    if (state.t - n.hitT > 0.18) {
      n.alive = false; state.combo = 0; sync("Miss"); if (window.Feel) Feel.shake(5, 80);
    }
  }
  state.notes = state.notes.filter((n) => n.alive);
  if (state.spawnI >= state.chart.length && state.notes.length === 0) {
    state.over = true; sync(`結束 · ${state.score}`);
  }
}
function hit(lane) {
  if (state.over) return;
  let best = null; let bestAbs = 999;
  for (const n of state.notes) {
    if (!n.alive || n.lane !== lane) continue;
    const d = Math.abs(state.t - n.hitT);
    if (d < bestAbs) { bestAbs = d; best = n; }
  }
  if (!best || bestAbs > 0.18) { state.combo = 0; sync("空拍"); if (window.Feel) Feel.shake(4, 60); return; }
  best.alive = false;
  const perfect = bestAbs < 0.06;
  state.combo += 1;
  state.score += (perfect ? 300 : 100) + state.combo * 5;
  sync(perfect ? "Perfect" : "Good");
  if (window.Feel) { if (perfect) { Feel.flash('#d4a017', 50); Feel.shake(3, 50); } else Feel.shake(2, 40); }
}
function render() {
  ctx.fillStyle = "#101816"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const w = canvas.width / LANES;
  for (let i = 0; i < LANES; i++) {
    ctx.fillStyle = i % 2 ? "#15201c" : "#121a17";
    ctx.fillRect(i * w, 0, w, canvas.height);
    ctx.fillStyle = "#8aa396";
    ctx.font = "700 18px Segoe UI";
    ctx.fillText(["D", "F", "J", "K"][i], i * w + w / 2 - 6, HIT_Y + 36);
  }
  ctx.strokeStyle = "#d4a017"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, HIT_Y); ctx.lineTo(canvas.width, HIT_Y); ctx.stroke();
  for (const n of state.notes) {
    ctx.fillStyle = "#3cb371";
    ctx.beginPath();
    ctx.roundRect(n.lane * w + 10, n.y - 12, w - 20, 24, 8);
    ctx.fill();
  }
  if (state.over) {
    ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#3cb371"; ctx.font = "800 32px Segoe UI"; ctx.textAlign = "center";
    ctx.fillText("CLEAR", canvas.width / 2, canvas.height / 2); ctx.textAlign = "start";
  }
}
window.addEventListener("pad-key", (e) => {
  if (e.detail && e.detail.type === "down" && e.detail.code in KEYMAP) hit(KEYMAP[e.detail.code]);
});
window.addEventListener("keydown", (e) => {
  if (e.code in KEYMAP) { e.preventDefault(); hit(KEYMAP[e.code]); }
});
document.getElementById("btn-restart").onclick = reset;
let last = performance.now();
function frame(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; update(dt); render(); requestAnimationFrame(frame); }
reset(); requestAnimationFrame(frame);
