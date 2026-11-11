/** 系統層手感／粒子（根目錄）— 粒子為主，晃動／閃光／震動為輔；各遊戲只呼叫 Feel.* */
(function (global) {
  const root = () => document.getElementById("app") || document.body;
  let shakeT = 0;
  let shakeMag = 0;
  let flashEl = null;
  let fxCanvas = null;
  let fxCtx = null;
  let started = false;
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
    const dpr = devicePixelRatio || 1;
    fxCanvas.width = Math.floor(window.innerWidth * dpr);
    fxCanvas.height = Math.floor(window.innerHeight * dpr);
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
      const r = devicePixelRatio || 1;
      fxCanvas.width = Math.floor(window.innerWidth * r);
      fxCanvas.height = Math.floor(window.innerHeight * r);
    });
    if (!started) {
      started = true;
      requestAnimationFrame(tickFx);
    }
    return fxCtx;
  }

  function tickFx() {
    if (!fxCtx) {
      requestAnimationFrame(tickFx);
      return;
    }
    const ctx = fxCtx;
    const dpr = devicePixelRatio || 1;
    ctx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= 0.016;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g || 0;
      p.vx *= 0.99;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x * dpr, p.y * dpr, Math.max(0.5, (p.r || 2) * dpr * (0.6 + p.life)), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (shakeT > 0) {
      shakeT -= 16;
      const el = root();
      const a = (shakeT / 100) * shakeMag;
      el.style.transform = `translate(${(Math.random() - 0.5) * a}px, ${(Math.random() - 0.5) * a}px)`;
      if (shakeT <= 0) el.style.transform = "";
    }
    requestAnimationFrame(tickFx);
  }

  function vibrate(ms) {
    try {
      if (navigator.vibrate) navigator.vibrate(ms);
    } catch (_) {}
  }

  function centerBurst(opts) {
    Feel.burst(window.innerWidth / 2, window.innerHeight * 0.45, opts);
  }

  const Feel = {
    shake(mag = 8, ms = 120) {
      shakeMag = mag;
      shakeT = Math.max(shakeT, ms);
      ensureFx();
    },
    flash(color = "#fff", ms = 70) {
      const el = ensureFlash();
      el.style.background = color;
      el.style.opacity = "0.28";
      setTimeout(() => {
        el.style.opacity = "0";
      }, ms);
    },
    burst(x, y, opts = {}) {
      ensureFx();
      const n = opts.n || 12;
      const color = opts.color || "#d4a017";
      const colors = opts.colors || [color];
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (opts.speed || 3.2) * (0.35 + Math.random());
        particles.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          g: opts.g ?? 0.07,
          life: opts.life || 0.4 + Math.random() * 0.45,
          r: opts.r || 2 + Math.random() * 2.5,
          color: colors[(Math.random() * colors.length) | 0],
        });
      }
    },
    burstCanvas(canvas, x, y, opts) {
      if (!canvas) {
        centerBurst(opts);
        return;
      }
      const r = canvas.getBoundingClientRect();
      Feel.burst(r.left + x * (r.width / canvas.width), r.top + y * (r.height / canvas.height), opts);
    },
    ring(x, y, color = "#3cb371") {
      ensureFx();
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        particles.push({
          x,
          y,
          vx: Math.cos(a) * 4.2,
          vy: Math.sin(a) * 4.2,
          g: 0,
          life: 0.45,
          r: 2.2,
          color,
        });
      }
    },
    /** 命中：粒子為主 + 輕晃／閃 */
    hit(mag = 6) {
      centerBurst({
        n: 14 + mag,
        speed: 2.8 + mag * 0.15,
        colors: ["#fff3c4", "#d4a017", "#e7f0ea"],
      });
      Feel.shake(Math.max(3, mag * 0.55), 90);
      Feel.flash("rgba(255,243,196,0.85)", 45);
      vibrate(10);
    },
    /** 受傷：紅粒子為主 + 晃／閃 */
    hurt() {
      centerBurst({
        n: 22,
        speed: 4.5,
        colors: ["#e4572e", "#c45c48", "#f0a090", "#fff"],
        g: 0.12,
      });
      Feel.shake(9, 130);
      Feel.flash("rgba(228,87,46,0.9)", 75);
      vibrate([18, 28, 18]);
    },
    score(canvas, x, y) {
      Feel.burstCanvas(canvas, x, y, {
        n: 12,
        speed: 2.8,
        colors: ["#3cb371", "#8fd694", "#fff3c4"],
      });
      Feel.shake(2, 50);
      vibrate(8);
    },
    boom(canvas, x, y) {
      Feel.burstCanvas(canvas, x, y, {
        n: 20,
        speed: 4.4,
        colors: ["#d4a017", "#e4572e", "#fff3c4", "#e7f0ea"],
      });
      if (canvas) {
        const r = canvas.getBoundingClientRect();
        Feel.ring(r.left + x * (r.width / canvas.width), r.top + y * (r.height / canvas.height), "#d4a017");
      }
      Feel.shake(6, 110);
      Feel.flash("rgba(212,160,23,0.55)", 55);
      vibrate(16);
    },
    tap(el) {
      const r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
      if (r) {
        Feel.burst(r.left + r.width / 2, r.top + r.height / 2, {
          n: 8,
          speed: 2.2,
          colors: ["#3cb371", "#d4a017"],
          g: 0.05,
          life: 0.3,
        });
      } else {
        centerBurst({ n: 8, speed: 2.2, colors: ["#3cb371", "#d4a017"] });
      }
      if (el && el.animate) {
        el.animate(
          [{ transform: "scale(1)" }, { transform: "scale(0.94)" }, { transform: "scale(1)" }],
          { duration: 120, easing: "ease-out" }
        );
      }
      vibrate(6);
    },
  };

  document.addEventListener(
    "pointerdown",
    (e) => {
      const b = e.target && e.target.closest && e.target.closest("button");
      if (b && !b.closest("#mobile-pad") && window.Feel) Feel.tap(b);
    },
    true
  );

  global.Feel = Feel;
})(window);
