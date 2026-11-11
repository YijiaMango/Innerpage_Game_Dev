/**
 * 手機優先操作層 → window.Pad（可靠）
 * data-pad: move | move-jump | move-fire | move-act | lr | lr-serve | tetris | ship | lanes | swipe | jump
 */
(function () {
  const kind = (document.body && document.body.dataset.pad) || "";
  if (!kind || kind === "none") return;
  if (!window.Pad) {
    console.warn("[mobile-pad] pad-input.js missing");
    return;
  }

  const { down, up, pulse } = window.Pad;
  const repeats = new Map();

  function spark(btn) {
    if (!window.Feel || !btn) return;
    const r = btn.getBoundingClientRect();
    Feel.burst(r.left + r.width / 2, r.top + r.height / 2, {
      n: 5,
      speed: 2,
      colors: ["#3cb371", "#d4a017"],
      life: 0.22,
    });
  }

  function bindHold(btn, code, { repeat } = {}) {
    const clear = () => {
      const t = repeats.get(code);
      if (t) clearInterval(t);
      repeats.delete(code);
    };
    const start = (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.add("is-down");
      try {
        btn.setPointerCapture(e.pointerId);
      } catch (_) {}
      down(code);
      spark(btn);
      if (repeat) {
        clear();
        repeats.set(
          code,
          setInterval(() => {
            // 給只聽 keydown 的遊戲補脈衝
            window.dispatchEvent(new CustomEvent("pad-key", { detail: { type: "down", code, repeat: true } }));
          }, 110)
        );
      }
    };
    const end = (e) => {
      if (e) e.preventDefault();
      btn.classList.remove("is-down");
      clear();
      up(code);
    };
    btn.addEventListener("pointerdown", start);
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((t) => btn.addEventListener(t, end));
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function makeBtn(label, code, opt) {
    const b = el("button", "pad-btn", label);
    b.type = "button";
    b.setAttribute("aria-label", label);
    bindHold(b, code, opt || {});
    return b;
  }
  function dpad(withDown, repeat) {
    const box = el("div", "dpad");
    box.appendChild(el("div", "spacer"));
    box.appendChild(makeBtn("↑", "ArrowUp", { repeat }));
    box.appendChild(el("div", "spacer"));
    box.appendChild(makeBtn("←", "ArrowLeft", { repeat }));
    box.appendChild(withDown ? makeBtn("↓", "ArrowDown", { repeat }) : el("div", "spacer"));
    box.appendChild(makeBtn("→", "ArrowRight", { repeat }));
    return box;
  }

  /** 畫布虛擬搖桿：按住拖曳改方向 */
  function attachStick(mode) {
    const canvas = document.getElementById("game");
    if (!canvas) return;
    let active = false;
    let ox = 0;
    let oy = 0;
    const codes = [];

    function clearDirs() {
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].forEach((c) => {
        if (codes.includes(c)) up(c);
      });
      codes.length = 0;
    }
    function apply(dx, dy) {
      clearDirs();
      const dead = 18;
      if (Math.hypot(dx, dy) < dead) return;
      if (mode === "lr") {
        if (dx < -dead) {
          down("ArrowLeft");
          codes.push("ArrowLeft");
        }
        if (dx > dead) {
          down("ArrowRight");
          codes.push("ArrowRight");
        }
        return;
      }
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      if (ax > dead || ay > dead) {
        if (ax >= ay * 0.7) {
          if (dx < 0) {
            down("ArrowLeft");
            codes.push("ArrowLeft");
          } else {
            down("ArrowRight");
            codes.push("ArrowRight");
          }
        }
        if (ay >= ax * 0.7) {
          if (dy < 0) {
            down("ArrowUp");
            codes.push("ArrowUp");
          } else {
            down("ArrowDown");
            codes.push("ArrowDown");
          }
        }
      }
    }

    canvas.addEventListener(
      "pointerdown",
      (e) => {
        // 右半留給射擊／點擊的遊戲不搶（move-fire 左側當搖桿）
        const rect = canvas.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        if (mode === "move-fire" && relX > rect.width * 0.55) return;
        active = true;
        ox = e.clientX;
        oy = e.clientY;
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (_) {}
      },
      { passive: true }
    );
    canvas.addEventListener(
      "pointermove",
      (e) => {
        if (!active) return;
        apply(e.clientX - ox, e.clientY - oy);
      },
      { passive: true }
    );
    const end = () => {
      active = false;
      clearDirs();
    };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
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
        if (Math.hypot(dx, dy) < 20) return;
        const code =
          Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "ArrowRight" : "ArrowLeft") : dy > 0 ? "ArrowDown" : "ArrowUp";
        pulse(code, 60);
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
      canvas.addEventListener("pointerdown", () => pulse("Space", 80));
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook);
    else hook();
    return;
  }

  document.body.classList.add("pad-tall");
  const left = el("div", "pad-side");
  const right = el("div", "pad-side actions");

  if (kind === "lr" || kind === "lr-serve") {
    const row = el("div");
    row.style.display = "flex";
    row.style.gap = "8px";
    row.appendChild(makeBtn("←", "ArrowLeft", { repeat: true }));
    row.appendChild(makeBtn("→", "ArrowRight", { repeat: true }));
    left.appendChild(row);
    if (kind === "lr-serve") right.appendChild(makeBtn("發", "Space"));
    attachStick("lr");
  } else if (kind === "tetris") {
    left.appendChild(dpad(true, true));
    right.appendChild(makeBtn("硬降", "Space"));
  } else if (kind === "ship") {
    left.appendChild(dpad(false, false));
    right.appendChild(makeBtn("射", "Space"));
  } else {
    left.appendChild(dpad(true, false));
    if (kind === "move-jump") right.appendChild(makeBtn("跳", "Space"));
    if (kind === "move-fire") right.appendChild(makeBtn("射", "Space"));
    if (kind === "move-act") right.appendChild(makeBtn("互動", "KeyE"));
    attachStick(kind);
  }

  pad.appendChild(left);
  if (right.childNodes.length) pad.appendChild(right);
  document.body.appendChild(pad);
})();
