/**
 * 系統層輸入（根目錄統一管理）
 * — 鍵盤 + 觸控相對拖曳搖桿 + 手勢
 * — 各遊戲只讀 Controls，不要自己綁 pointer / 自管 KEYS
 *
 * body[data-pad]:
 *   none | move | move-jump | move-fire | move-act |
 *   lr | lr-serve | swipe | jump | tetris | ship | lanes
 *
 * API:
 *   Controls.pressed(...codes) -> bool
 *   Controls.axis() -> { x, y }  // -1..1，搖桿優先，否則鍵盤
 *   Controls.pointer -> { x, y, down }  // 畫布邏輯座標
 *   Controls.kind -> data-pad 字串
 */
(function (global) {
  const keys = new Set();
  const stick = { active: false, dx: 0, dy: 0 };
  const pointer = { x: 0, y: 0, down: false };
  const DEAD = 14;
  const kind = (document.body && document.body.dataset.pad) || "none";

  function pressed(...codes) {
    for (let i = 0; i < codes.length; i++) if (keys.has(codes[i])) return true;
    return false;
  }

  function down(code) {
    if (!code) return;
    keys.add(code);
    global.dispatchEvent(new CustomEvent("pad-key", { detail: { type: "down", code } }));
  }

  function up(code) {
    if (!code) return;
    keys.delete(code);
    global.dispatchEvent(new CustomEvent("pad-key", { detail: { type: "up", code } }));
  }

  function pulse(code, ms) {
    down(code);
    setTimeout(() => up(code), ms || 50);
  }

  function clearMove() {
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].forEach(up);
  }

  function setDigitalFromStick(dx, dy, mode) {
    clearMove();
    if (mode === "lr") {
      if (dx < -DEAD) down("ArrowLeft");
      if (dx > DEAD) down("ArrowRight");
      return;
    }
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (ax < DEAD && ay < DEAD) return;
    if (ax >= ay * 0.65) {
      if (dx < 0) down("ArrowLeft");
      else down("ArrowRight");
    }
    if (mode !== "lr" && ay >= ax * 0.65) {
      if (dy < 0) down("ArrowUp");
      else down("ArrowDown");
    }
  }

  function axis() {
    if (stick.active) {
      const mag = Math.hypot(stick.dx, stick.dy);
      if (mag > DEAD) {
        return { x: stick.dx / mag, y: stick.dy / mag };
      }
    }
    let x = 0;
    let y = 0;
    if (pressed("ArrowLeft", "KeyA")) x -= 1;
    if (pressed("ArrowRight", "KeyD")) x += 1;
    if (pressed("ArrowUp", "KeyW")) y -= 1;
    if (pressed("ArrowDown", "KeyS")) y += 1;
    const mag = Math.hypot(x, y) || 1;
    if (!x && !y) return { x: 0, y: 0 };
    return { x: x / mag, y: y / mag };
  }

  global.addEventListener("keydown", (e) => {
    keys.add(e.code);
  });
  global.addEventListener("keyup", (e) => {
    keys.delete(e.code);
  });
  global.addEventListener("blur", () => {
    keys.clear();
    stick.active = false;
    stick.dx = 0;
    stick.dy = 0;
    pointer.down = false;
    clearMove();
  });

  const Controls = {
    kind,
    keys,
    pressed,
    down,
    up,
    pulse,
    axis,
    pointer,
    stick,
  };
  global.Controls = Controls;
  /** @deprecated 相容舊名 */
  global.Pad = Controls;
  global.pressed = pressed;

  function canvasEl() {
    return document.getElementById("game");
  }

  function localXY(canvas, e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * canvas.width,
      y: ((e.clientY - r.top) / r.height) * canvas.height,
      rx: e.clientX - r.left,
      ry: e.clientY - r.top,
      rw: r.width,
      rh: r.height,
    };
  }

  function syncPointer(canvas, e) {
    const p = localXY(canvas, e);
    pointer.x = p.x;
    pointer.y = p.y;
  }

  function spark(x, y) {
    if (global.Feel) Feel.burst(x, y, { n: 5, speed: 2, colors: ["#3cb371", "#d4a017"], life: 0.2 });
  }

  function onReady(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  function killLegacyPadUI() {
    document.querySelectorAll("#mobile-pad, .dpad, .pad-btn, .pad-actions, .pad-fire, .pad-jump").forEach((n) => n.remove());
    document.body.classList.remove("has-mobile-pad", "pad-tall", "pad-lanes");
  }

  function bindPointerTrack(canvas) {
    const track = (e) => syncPointer(canvas, e);
    canvas.addEventListener("pointerdown", (e) => {
      pointer.down = true;
      track(e);
    });
    canvas.addEventListener("pointermove", track);
    canvas.addEventListener("pointerup", () => {
      pointer.down = false;
    });
    canvas.addEventListener("pointercancel", () => {
      pointer.down = false;
    });
  }

  /** 相對拖曳搖桿（系統核心移動手勢） */
  function bindRelStick(opts) {
    const mode = opts.mode || "move";
    const fireZone = !!opts.fireZone;
    const tapCode = opts.tapCode || null;
    onReady(() => {
      const canvas = canvasEl();
      if (!canvas) return;
      bindPointerTrack(canvas);
      let ox = 0;
      let oy = 0;
      let moved = false;
      let pid = null;

      canvas.addEventListener("pointerdown", (e) => {
        const p = localXY(canvas, e);
        if (fireZone && p.rx > p.rw * 0.58) {
          down("Space");
          spark(e.clientX, e.clientY);
          const endFire = () => up("Space");
          canvas.addEventListener("pointerup", endFire, { once: true });
          canvas.addEventListener("pointercancel", endFire, { once: true });
          return;
        }
        stick.active = true;
        stick.dx = 0;
        stick.dy = 0;
        moved = false;
        ox = e.clientX;
        oy = e.clientY;
        pid = e.pointerId;
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (_) {}
      });

      canvas.addEventListener("pointermove", (e) => {
        if (!stick.active || (pid != null && e.pointerId !== pid)) return;
        stick.dx = e.clientX - ox;
        stick.dy = e.clientY - oy;
        if (Math.hypot(stick.dx, stick.dy) > DEAD) moved = true;
        setDigitalFromStick(stick.dx, stick.dy, mode === "lr" ? "lr" : "move");
      });

      const end = () => {
        const wasTap = stick.active && !moved && tapCode;
        stick.active = false;
        stick.dx = 0;
        stick.dy = 0;
        pid = null;
        clearMove();
        if (wasTap) {
          pulse(tapCode, 70);
          spark(ox, oy);
        }
      };
      canvas.addEventListener("pointerup", end);
      canvas.addEventListener("pointercancel", end);
    });
  }

  function bindSwipe() {
    onReady(() => {
      const canvas = canvasEl();
      if (!canvas) return;
      bindPointerTrack(canvas);
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
          Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "ArrowRight" : "ArrowLeft") : dy > 0 ? "ArrowDown" : "ArrowUp";
        pulse(code, 55);
        spark(e.clientX, e.clientY);
      });
    });
  }

  function bindTap(code) {
    onReady(() => {
      const canvas = canvasEl();
      if (!canvas) return;
      bindPointerTrack(canvas);
      let sx = 0;
      let sy = 0;
      let moved = false;
      canvas.addEventListener("pointerdown", (e) => {
        sx = e.clientX;
        sy = e.clientY;
        moved = false;
      });
      canvas.addEventListener("pointermove", (e) => {
        if (Math.hypot(e.clientX - sx, e.clientY - sy) > 14) moved = true;
      });
      canvas.addEventListener("pointerup", (e) => {
        if (moved) return;
        pulse(code, 70);
        spark(e.clientX, e.clientY);
      });
    });
  }

  function bindTetris() {
    onReady(() => {
      const canvas = canvasEl();
      if (!canvas) return;
      bindPointerTrack(canvas);
      let sx = 0;
      let sy = 0;
      let moved = false;
      canvas.addEventListener("pointerdown", (e) => {
        sx = e.clientX;
        sy = e.clientY;
        moved = false;
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (_) {}
      });
      canvas.addEventListener("pointermove", (e) => {
        if (Math.hypot(e.clientX - sx, e.clientY - sy) > 12) moved = true;
      });
      canvas.addEventListener("pointerup", (e) => {
        const dx = e.clientX - sx;
        const dy = e.clientY - sy;
        const dist = Math.hypot(dx, dy);
        if (!moved || dist < 18) {
          pulse("ArrowUp", 40);
          spark(e.clientX, e.clientY);
          return;
        }
        if (Math.abs(dx) > Math.abs(dy)) pulse(dx > 0 ? "ArrowRight" : "ArrowLeft", 40);
        else if (dy > 80) pulse("Space", 40);
        else if (dy > 0) pulse("ArrowDown", 40);
        else pulse("ArrowUp", 40);
        spark(e.clientX, e.clientY);
      });
    });
  }

  function bindLanes() {
    onReady(() => {
      const canvas = canvasEl();
      if (!canvas) return;
      bindPointerTrack(canvas);
      const codes = ["KeyD", "KeyF", "KeyJ", "KeyK"];
      canvas.addEventListener("pointerdown", (e) => {
        const p = localXY(canvas, e);
        const lane = Math.min(3, Math.max(0, Math.floor((p.rx / p.rw) * 4)));
        pulse(codes[lane], 40);
        spark(e.clientX, e.clientY);
      });
    });
  }

  function bindShip() {
    onReady(() => {
      const canvas = canvasEl();
      if (!canvas) return;
      bindPointerTrack(canvas);
      let active = false;
      let ox = 0;
      canvas.addEventListener("pointerdown", (e) => {
        active = true;
        ox = e.clientX;
        down("ArrowUp");
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (_) {}
      });
      canvas.addEventListener("pointermove", (e) => {
        if (!active) return;
        const dx = e.clientX - ox;
        up("ArrowLeft");
        up("ArrowRight");
        if (dx < -12) down("ArrowLeft");
        if (dx > 12) down("ArrowRight");
      });
      const end = (e) => {
        const dx = e ? Math.abs(e.clientX - ox) : 99;
        active = false;
        clearMove();
        up("ArrowUp");
        if (dx < 14) {
          pulse("Space", 60);
          if (e) spark(e.clientX, e.clientY);
        }
      };
      canvas.addEventListener("pointerup", end);
      canvas.addEventListener("pointercancel", () => end(null));
    });
  }

  function bindFollowX(serveOnTap) {
    onReady(() => {
      const canvas = canvasEl();
      if (!canvas) return;
      bindPointerTrack(canvas);
      const move = (e) => {
        const p = localXY(canvas, e);
        clearMove();
        stick.active = true;
        stick.dx = p.x - canvas.width / 2;
        stick.dy = 0;
        const mid = canvas.width / 2;
        if (p.x < mid - 20) down("ArrowLeft");
        else if (p.x > mid + 20) down("ArrowRight");
      };
      canvas.addEventListener("pointerdown", (e) => {
        move(e);
        if (serveOnTap) pulse("Space", 50);
      });
      canvas.addEventListener("pointermove", (e) => {
        if (e.pointerType === "mouse" && e.buttons === 0) return;
        move(e);
      });
      canvas.addEventListener("pointerup", () => {
        stick.active = false;
        stick.dx = 0;
        clearMove();
      });
      canvas.addEventListener("pointercancel", () => {
        stick.active = false;
        stick.dx = 0;
        clearMove();
      });
    });
  }

  // —— boot ——
  document.body.classList.add("has-touch-controls");
  killLegacyPadUI();
  onReady(killLegacyPadUI);

  if (kind && kind !== "none") {
    if (kind === "swipe") bindSwipe();
    else if (kind === "jump") bindTap("Space");
    else if (kind === "lanes") bindLanes();
    else if (kind === "tetris") bindTetris();
    else if (kind === "ship") bindShip();
    else if (kind === "lr") bindFollowX(false);
    else if (kind === "lr-serve") bindFollowX(true);
    else if (kind === "move-jump") bindRelStick({ tapCode: "Space" });
    else if (kind === "move-act") bindRelStick({ tapCode: "KeyE" });
    else if (kind === "move-fire") bindRelStick({ fireZone: true });
    else if (kind === "move") bindRelStick({});
  } else {
    onReady(() => {
      const canvas = canvasEl();
      if (canvas) bindPointerTrack(canvas);
    });
  }
})(window);
