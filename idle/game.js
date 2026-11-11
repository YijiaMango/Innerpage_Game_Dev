/** 最小 Idle — 點擊、自動產金、JSON 表升級、localStorage */

const SAVE_KEY = "min-idle-v1";

const UPGRADES = [
  { id: "click", name: "大力點擊", desc: "每次點擊 +1", base: 15, growth: 1.35, effect: "clickPower" },
  { id: "auto1", name: "小幫手", desc: "+0.5 金/秒", base: 40, growth: 1.4, effect: "rate", amount: 0.5 },
  { id: "auto2", name: "產金機", desc: "+3 金/秒", base: 220, growth: 1.45, effect: "rate", amount: 3 },
  { id: "auto3", name: "礦場", desc: "+12 金/秒", base: 1200, growth: 1.5, effect: "rate", amount: 12 },
];

const el = {
  gold: document.getElementById("gold"),
  rate: document.getElementById("rate"),
  shop: document.getElementById("shop"),
  status: document.getElementById("status"),
  btnTap: document.getElementById("btn-tap"),
  btnReset: document.getElementById("btn-reset"),
};

const state = {
  gold: 0,
  clickPower: 1,
  rate: 0,
  owned: Object.fromEntries(UPGRADES.map((u) => [u.id, 0])),
};

function costOf(u) {
  const n = state.owned[u.id] || 0;
  return Math.floor(u.base * Math.pow(u.growth, n));
}

function format(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n < 10 ? n.toFixed(1) : String(Math.floor(n));
}

function recalc() {
  state.clickPower = 1 + (state.owned.click || 0);
  state.rate = UPGRADES.filter((u) => u.effect === "rate").reduce(
    (sum, u) => sum + (state.owned[u.id] || 0) * (u.amount || 0),
    0
  );
}

function save() {
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({ gold: state.gold, owned: state.owned, t: Date.now() })
  );
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    state.gold = Number(data.gold) || 0;
    state.owned = { ...state.owned, ...(data.owned || {}) };
    const dt = Math.min(3600, (Date.now() - (data.t || Date.now())) / 1000);
    recalc();
    state.gold += state.rate * dt;
    el.status.textContent = dt > 2 ? `離線收益約 ${format(state.rate * dt)}` : "進度已載入";
  } catch {
    /* ignore */
  }
}

function sync() {
  recalc();
  el.gold.textContent = format(state.gold);
  el.rate.textContent = format(state.rate);
  for (const u of UPGRADES) {
    const row = el.shop.querySelector(`[data-id="${u.id}"]`);
    if (!row) continue;
    const c = costOf(u);
    row.querySelector(".meta").textContent = `${u.desc} · 持有 ${state.owned[u.id]} · $${format(c)}`;
    row.querySelector("button").disabled = state.gold < c;
  }
}

function buildShop() {
  el.shop.innerHTML = "";
  for (const u of UPGRADES) {
    const row = document.createElement("div");
    row.className = "item";
    row.dataset.id = u.id;
    row.innerHTML = `<div><div class="name">${u.name}</div><div class="meta"></div></div><button type="button" class="buy">購買</button>`;
    row.querySelector("button").addEventListener("click", () => buy(u.id));
    el.shop.appendChild(row);
  }
}

function buy(id) {
  const u = UPGRADES.find((x) => x.id === id);
  if (!u) return;
  const c = costOf(u);
  if (state.gold < c) return;
  state.gold -= c;
  state.owned[id] += 1;
  save();
  sync();
  el.status.textContent = `買了 ${u.name}`;
  if (window.Feel) Feel.hit(3);
}

el.btnTap.addEventListener("click", () => {
  state.gold += state.clickPower;
  save();
  sync();
  if (window.Feel) Feel.tap(el.btnTap);
});

el.btnReset.addEventListener("click", () => {
  localStorage.removeItem(SAVE_KEY);
  state.gold = 0;
  state.owned = Object.fromEntries(UPGRADES.map((u) => [u.id, 0]));
  sync();
  el.status.textContent = "已清檔";
});

buildShop();
load();
sync();

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.2, (now - last) / 1000);
  last = now;
  if (state.rate > 0) {
    state.gold += state.rate * dt;
    sync();
  }
  if (Math.floor(now / 2000) !== Math.floor(last / 2000)) save();
  requestAnimationFrame(frame);
}
setInterval(save, 2000);
requestAnimationFrame(frame);
