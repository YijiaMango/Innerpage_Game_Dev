/** 最小 Tactics — 格子移動、相鄰攻擊、敵方簡單 AI */

const COLS = 8; const ROWS = 6; const TILE = 80;
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const el = { turn: document.getElementById("turn"), status: document.getElementById("status") };

let units, selected, side, over;

function reset() {
  units = [
    { id: "p1", side: "you", x: 1, y: 2, hp: 20, atk: 7, moved: false },
    { id: "p2", side: "you", x: 1, y: 4, hp: 20, atk: 7, moved: false },
    { id: "e1", side: "enemy", x: 6, y: 1, hp: 16, atk: 5, moved: false },
    { id: "e2", side: "enemy", x: 6, y: 3, hp: 16, atk: 5, moved: false },
    { id: "e3", side: "enemy", x: 5, y: 4, hp: 16, atk: 5, moved: false },
  ];
  selected = null; side = "you"; over = false;
  sync("你的回合");
  render();
}
function sync(msg) {
  el.turn.textContent = side === "you" ? "你" : "敵";
  if (msg != null) el.status.textContent = msg;
}
function at(x, y) { return units.find((u) => u.hp > 0 && u.x === x && u.y === y); }
function neighbors(x, y) {
  return [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < COLS && b < ROWS);
}
function checkOver() {
  const you = units.some((u) => u.side === "you" && u.hp > 0);
  const en = units.some((u) => u.side === "enemy" && u.hp > 0);
  if (!you) { over = true; sync("敗北"); return true; }
  if (!en) { over = true; sync("勝利"); return true; }
  return false;
}
function endTurn() {
  if (over || side !== "you") return;
  side = "enemy";
  units.forEach((u) => { if (u.side === "enemy") u.moved = false; });
  sync("敵方行動");
  render();
  setTimeout(enemyTurn, 350);
}
function enemyTurn() {
  if (over) return;
  const enemies = units.filter((u) => u.side === "enemy" && u.hp > 0);
  for (const e of enemies) {
    const foes = units.filter((u) => u.side === "you" && u.hp > 0);
    if (!foes.length) break;
    foes.sort((a, b) => Math.abs(a.x - e.x) + Math.abs(a.y - e.y) - (Math.abs(b.x - e.x) + Math.abs(b.y - e.y)));
    const t = foes[0];
    if (Math.abs(t.x - e.x) + Math.abs(t.y - e.y) === 1) {
      t.hp -= e.atk; sync(`敵攻擊 ${e.atk}`);
    } else {
      const opts = neighbors(e.x, e.y)
        .filter(([x, y]) => !at(x, y))
        .map(([x, y]) => ({ x, y, d: Math.abs(t.x - x) + Math.abs(t.y - y) }))
        .sort((a, b) => a.d - b.d);
      if (opts[0]) { e.x = opts[0].x; e.y = opts[0].y; }
    }
  }
  if (checkOver()) { render(); return; }
  side = "you";
  units.forEach((u) => { if (u.side === "you") u.moved = false; });
  selected = null;
  sync("你的回合");
  render();
}
function click(e) {
  if (over || side !== "you") return;
  const rect = canvas.getBoundingClientRect();
  const c = Math.floor((((e.clientX - rect.left) * canvas.width) / rect.width) / TILE);
  const r = Math.floor((((e.clientY - rect.top) * canvas.height) / rect.height) / TILE);
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return;
  const u = at(c, r);
  if (!selected) {
    if (u && u.side === "you" && !u.moved) { selected = u; sync(`選中 ${u.id}`); render(); }
    return;
  }
  if (u === selected) { selected = null; render(); return; }
  if (u && u.side === "enemy" && Math.abs(u.x - selected.x) + Math.abs(u.y - selected.y) === 1) {
    u.hp -= selected.atk;
    selected.moved = true;
    selected = null;
    sync("攻擊！");
    if (!checkOver()) render();
    else render();
    return;
  }
  if (!u && Math.abs(c - selected.x) + Math.abs(r - selected.y) === 1) {
    selected.x = c; selected.y = r; selected.moved = true; selected = null; sync("移動完畢"); render();
    return;
  }
  if (u && u.side === "you" && !u.moved) { selected = u; render(); }
}
function render() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      ctx.fillStyle = (x + y) % 2 ? "#1a2822" : "#15201c";
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }
  if (selected) {
    for (const [x, y] of neighbors(selected.x, selected.y)) {
      ctx.fillStyle = "rgba(60,179,113,0.25)";
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }
  for (const u of units) {
    if (u.hp <= 0) continue;
    ctx.fillStyle = u.side === "you" ? "#3cb371" : "#c45c48";
    ctx.beginPath(); ctx.arc(u.x * TILE + TILE / 2, u.y * TILE + TILE / 2, 22, 0, Math.PI * 2); ctx.fill();
    if (selected === u) { ctx.strokeStyle = "#d4a017"; ctx.lineWidth = 3; ctx.stroke(); }
    ctx.fillStyle = "#0f1412"; ctx.font = "700 14px Segoe UI"; ctx.textAlign = "center";
    ctx.fillText(String(u.hp), u.x * TILE + TILE / 2, u.y * TILE + TILE / 2 + 5);
  }
  ctx.textAlign = "start";
  if (over) {
    ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = el.status.textContent.includes("勝") ? "#3cb371" : "#e4572e";
    ctx.font = "800 36px Segoe UI"; ctx.textAlign = "center";
    ctx.fillText(el.status.textContent, canvas.width / 2, canvas.height / 2); ctx.textAlign = "start";
  }
}
canvas.addEventListener("pointerdown", click);
document.getElementById("btn-end").onclick = endTurn;
document.getElementById("btn-restart").onclick = reset;
reset();
