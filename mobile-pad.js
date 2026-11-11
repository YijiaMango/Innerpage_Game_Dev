/**
 * 手機優先虛擬操作：觸控 → keydown/keyup
 * data-pad: move | move-jump | move-fire | move-act | lr | lr-serve | tetris | ship | lanes | swipe | jump
 */
(function () {
  const kind = (document.body && document.body.dataset.pad) || "";
  if (!kind || kind === "none") return;

  const held = new Set();

  function fireKey(type, code) {
    window.dispatchEvent(new KeyboardEvent(type, { code, key: code, bubbles: true, cancelable: true }));
  }
  function down(code) {
    if (held.has(code)) return;
    held.add(code);
    fireKey("keydown", code);
  }
  function up(code) {
    if (!held.has(code)) return;
    held.delete(code);
    fireKey("keyup", code);
  }
  function pulse(code, ms) {
    down(code);
    setTimeout(() => up(code), ms || 50);
  }
  function spark(btn) {
    if (!window.Feel || !btn) return;
    const r = btn.getBoundingClientRect();
    Feel.burst(r.left + r.width / 2, r.top + r.height / 2, {
      n: 6,
      speed: 2,
      colors: ["#3cb371", "#d4a017"],
      life: 0.25,
    });
  }
  function bindHold(btn, code) {
    let repeat = null;
    const start = (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.add("is-down");
      try {
        btn.setPointerCapture(e.pointerId);
      } catch (_) {}
      down(code);
      spark(btn);
      // 長按重複（方塊軟降／移動）
      if (!["Space", "KeyE", "KeyJ", "KeyD", "KeyF", "KeyK"].includes(code)) {
        clearInterval(repeat);
        repeat = setInterval(() => fireKey("keydown", code), 120);
      }
    };
    const end = (e) => {
      if (e) e.preventDefault();
      btn.classList.remove("is-down");
      clearInterval(repeat);
      repeat = null;
      up(code);
    };
    btn.addEventListener("pointerdown", start);
    ["pointerup", "pointercancel", "pointerleave", "lostpointercapture"].forEach((t) =>
      btn.addEventListener(t, end)
    );
  }
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function makeBtn(label, code) {
    const b = el("button", "pad-btn", label);
    b.type = "button";
    b.setAttribute("aria-label", label);
    bindHold(b, code);
    return b;
  }
  function dpad(includeDown) {
    const box = el("div", "dpad");
    box.appendChild(el("div", "spacer"));
    box.appendChild(makeBtn("↑", "ArrowUp"));
    box.appendChild(el("div", "spacer"));
    box.appendChild(makeBtn("←", "ArrowLeft"));
    box.appendChild(includeDown ? makeBtn("↓", "ArrowDown") : el("div", "spacer"));
    box.appendChild(makeBtn("→", "ArrowRight"));
    return box;
  }

  const pad = el("div");
  pad.id = "mobile-pad";
  document.body.classList.add("has-mobile-pad");

  if (kind === "lanes") {
    document.body.classList.add("pad-lanes");
    const row = el("div", "lane-row");
    [
      ["D", "KeyD"],
      ["F", "KeyF"],
      ["J", "KeyJ"],
      ["K", "KeyK"],
    ].forEach(([a, b]) => row.appendChild(makeBtn(a, b)));
    pad.appendChild(row);
    document.body.appendChild(pad);
    return;
  }

  if (kind === "swipe") {
    document.body.classList.add("pad-tall");
    document.body.appendChild(pad);
    const hook = () => {
      const canvas = document.getElementById("game");
      if (!canvas) return;
      let sx = 0;
      let sy = 0;
      canvas.addEventListener("pointerdown", (e) => {
        sx = e.clientX;
        sy = e.clientY;
      });
      canvas.addEventListener("pointerup", (e) => {
        const dx = e.clientX - sx;
        const dy = e.clientY - sy;
        if (Math.hypot(dx, dy) < 22) return;
        const code =
          Math.abs(dx) > Math.abs(dy)
            ? dx > 0
              ? "ArrowRight"
              : "ArrowLeft"
            : dy > 0
              ? "ArrowDown"
              : "ArrowUp";
        pulse(code, 45);
        if (window.Feel) Feel.burst(e.clientX, e.clientY, { n: 7, speed: 2.4, colors: ["#6ec8ff", "#3cb371"] });
      });
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook);
    else hook();
    return;
  }

  if (kind === "jump") {
    document.body.classList.add("pad-tall");
    const right = el("div", "pad-side actions");
    right.appendChild(makeBtn("跳", "Space"));
    pad.appendChild(el("div", "pad-side"));
    pad.appendChild(right);
    document.body.appendChild(pad);
    const hook = () => {
      const canvas = document.getElementById("game");
      if (!canvas) return;
      canvas.addEventListener("pointerdown", () => pulse("Space", 70));
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook);
    else hook();
    window.addEventListener("blur", () => [...held].forEach(up));
    return;
  }

  document.body.classList.add("pad-tall");
  const left = el("div", "pad-side");
  const right = el("div", "pad-side actions");

  if (kind === "lr" || kind === "lr-serve") {
    const row = el("div");
    row.style.display = "flex";
    row.style.gap = "8px";
    row.appendChild(makeBtn("←", "ArrowLeft"));
    row.appendChild(makeBtn("→", "ArrowRight"));
    left.appendChild(row);
    if (kind === "lr-serve") right.appendChild(makeBtn("發", "Space"));
  } else if (kind === "tetris") {
    left.appendChild(dpad(true));
    right.appendChild(makeBtn("硬降", "Space"));
  } else if (kind === "ship") {
    left.appendChild(dpad(false));
    right.appendChild(makeBtn("射", "Space"));
  } else {
    left.appendChild(dpad(true));
    if (kind === "move-jump") right.appendChild(makeBtn("跳", "Space"));
    if (kind === "move-fire") right.appendChild(makeBtn("射", "Space"));
    if (kind === "move-act") right.appendChild(makeBtn("互動", "KeyE"));
  }

  pad.appendChild(left);
  if (right.childNodes.length) pad.appendChild(right);
  document.body.appendChild(pad);
  window.addEventListener("blur", () => [...held].forEach(up));
})();
