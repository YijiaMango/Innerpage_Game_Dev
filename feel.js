/** 最簡物理回饋：晃動、閃光、粒子、震動 */
(function (global) {
  const root = () => document.getElementById("app") || document.body;
  let shakeT = 0;
  let shakeMag = 0;
  let flashEl = null;
  let fxCanvas = null;
  let fxCtx = null;
  const particles = [];

  function ensureFlash() {
    if (flashEl) return flashEl;
    flashEl = document.createElement("div");
    flashEl.setAttribute("aria-hidden", "true");
    Object.assign(flashEl.style, {
      position: "fixed",
      inset: "0",
      pointerEvents: "none",
      zIndex: "9998",
      opacity: "0",
      transition: "opacity 60ms linear",
      background: "#fff",
    });
    document.body.appendChild(flashEl);
    return flashEl;
  }

  function ensureFx() {
    if (fxCanvas) return fxCtx;
    fxCanvas = document.createElement("canvas");
    fxCanvas.width = window.innerWidth * devicePixelRatio;
    fxCanvas.height = window.innerHeight * devicePixelRatio;
    Object.assign(fxCanvas.style, {
      position: "fixed",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: "9997",
    });
    document.body.appendChild(fxCanvas);
    fxCtx = fxCanvas.getContext("2d");
    window.addEventListener("resize", () => {
      fxCanvas.width = window.innerWidth * devicePixelRatio;
      fxCanvas.height = window.innerHeight * devicePixelRatio;
    });
    requestAnimationFrame(tickFx);
    return fxCtx;
  }

  function tickFx(now) {
    if (!fxCtx) return;
    const ctx = fxCtx;
    const dpr = devicePixelRatio || 1;
    ctx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= 0.016;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g || 0;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x * dpr, p.y * dpr, (p.r || 2) * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (shakeT > 0) {
      shakeT -= 16;
      const el = root();
      const a = (shakeT / 100) * shakeMag;
      const x = (Math.random() - 0.5) * a;
      const y = (Math.random() - 0.5) * a;
      el.style.transform = `translate(${x}px, ${y}px)`;
      if (shakeT <= 0) el.style.transform = "";
    }
    requestAnimationFrame(tickFx);
  }

  function vibrate(ms) {
    try {
      if (navigator.vibrate) navigator.vibrate(ms);
    } catch (_) {}
  }

  const Feel = {
    /** 畫面晃動 */
    shake(mag = 8, ms = 120) {
      shakeMag = mag;
      shakeT = Math.max(shakeT, ms);
      ensureFx();
    },
    /** 全螢幕閃一下 */
    flash(color = "#fff", ms = 70) {
      const el = ensureFlash();
      el.style.background = color;
      el.style.opacity = "0.35";
      setTimeout(() => {
        el.style.opacity = "0";
      }, ms);
    },
    /** 粒子爆开（client 座標） */
    burst(x, y, opts = {}) {
      ensureFx();
      const n = opts.n || 10;
      const color = opts.color || "#d4a017";
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (opts.speed || 3) * (0.4 + Math.random());
        particles.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          g: opts.g ?? 0.08,
          life: 0.35 + Math.random() * 0.35,
          r: opts.r || 2 + Math.random() * 2,
          color,
        });
      }
    },
    /** canvas 內座標 → 爆开 */
    burstCanvas(canvas, x, y, opts) {
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      const sx = r.width / canvas.width;
      const sy = r.height / canvas.height;
      Feel.burst(r.left + x * sx, r.top + y * sy, opts);
    },
    hit(mag = 6) {
      Feel.shake(mag, 100);
      Feel.flash("rgba(255,255,255,0.9)", 50);
      vibrate(12);
    },
    hurt() {
      Feel.shake(10, 140);
      Feel.flash("rgba(228,87,46,0.95)", 80);
      vibrate([20, 30, 20]);
    },
    score(canvas, x, y) {
      Feel.burstCanvas(canvas, x, y, { color: "#3cb371", n: 8, speed: 2.5 });
      vibrate(8);
    },
    boom(canvas, x, y) {
      Feel.burstCanvas(canvas, x, y, { color: "#d4a017", n: 14, speed: 4 });
      Feel.shake(7, 110);
      vibrate(18);
    },
    tap(el) {
      if (!el || !el.animate) return;
      el.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(0.94)" },
          { transform: "scale(1)" },
        ],
        { duration: 120, easing: "ease-out" }
      );
      vibrate(6);
    },
  };

  // Auto-bind buttons
  document.addEventListener(
    "pointerdown",
    (e) => {
      const b = e.target && e.target.closest && e.target.closest("button");
      if (b && window.Feel) Feel.tap(b);
    },
    true
  );

  global.Feel = Feel;
})(window);
