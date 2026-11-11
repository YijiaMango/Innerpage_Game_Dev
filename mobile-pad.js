/**
 * 觸控直接操作（無虛擬方向鍵 UI）
 * data-pad 只決定手勢語意：move | move-jump | move-fire | move-act | lr | lr-serve | tetris | ship | lanes | swipe | jump
 */
(function () {
  const kind = (document.body && document.body.dataset.pad) || "";
  if (!kind || kind === "none") return;
  if (!window.Pad) {
    console.warn("[touch] pad-input.js missing");
    return;
  }

  const { down, up, pulse } = window.Pad;
  document.body.classList.add("has-touch-controls");
  document.body.classList.remove("has-mobile-pad", "pad-tall", "pad-lanes");

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

  function clearMove() {
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].forEach(up);
  }

  function setDirs(dx, dy, mode) {
    clearMove();
    const dead = 16;
    if (mode === "lr") {
      if (dx < -dead) down("ArrowLeft");
      if (dx > dead) down("ArrowRight");
      return;
    }
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (ax < dead && ay < dead) return;
    if (ax >= ay * 0.65) {
      if (dx < 0) down("ArrowLeft");
      else down("ArrowRight");
    }
    if (ay >= ax * 0.65 && mode !== "lr") {
      if (dy < 0) down("ArrowUp");
      else down("ArrowDown");
    }
  }

  function spark(x, y) {
    if (window.Feel) Feel.burst(x, y, { n: 5, speed: 2, colors: ["#3cb371", "#d4a017"], life: 0.2 });
  }

  function onReady(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  /** 隱形搖桿：按住拖曳 */
  function bindStick(mode) {
    onReady(() => {
      const canvas = canvasEl();
      if (!canvas) return;
      let active = false;
      let ox = 0;
      let oy = 0;
      let pid = null;

      canvas.addEventListener("pointerdown", (e) => {
        const p = localXY(canvas, e);
        if (mode === "move-fire" && p.rx > p.rw * 0.58) {
          // 右側點射：朝觸點方向開火
          down("Space");
          spark(e.clientX, e.clientY);
          const upFire = () => up("Space");
          canvas.addEventListener("pointerup", upFire, { once: true });
          canvas.addEventListener("pointercancel", upFire, { once: true });
          // 同步滑鼠瞄準點（給 top-down-shooter）
          canvas.dispatchEvent(
            new PointerEvent("pointermove", {
              clientX: e.clientX,
              clientY: e.clientY,
              bubbles: true,
            })
          );
          return;
        }
        active = true;
        pid = e.pointerId;
        ox = e.clientX;
        oy = e.clientY;
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (_) {}
        setDirs(0, 0, mode);
      });

      canvas.addEventListener("pointermove", (e) => {
        if (!active || (pid != null && e.pointerId !== pid)) return;
        setDirs(e.clientX - ox, e.clientY - oy, mode);
      });

      const end = (e) => {
        if (pid != null && e.pointerId !== pid) return;
        active = false;
        pid = null;
        clearMove();
      };
      canvas.addEventListener("pointerup", end);
      canvas.addEventListener("pointercancel", end);
    });
  }

  /** 點一下跳／互動 */
  function bindTapCode(code, filter) {
    onReady(() => {
      const canvas = canvasEl();
      if (!canvas) return;
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
        if (filter && !filter(localXY(canvas, e))) return;
        pulse(code, 70);
        spark(e.clientX, e.clientY);
      });
    });
  }

  /** 滑動改方向（格子遊戲） */
  function bindSwipe() {
    onReady(() => {
      const canvas = canvasEl();
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
          Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "ArrowRight" : "ArrowLeft") : dy > 0 ? "ArrowDown" : "ArrowUp";
        pulse(code, 55);
        spark(e.clientX, e.clientY);
      });
    });
  }

  /** 俄羅斯方塊手勢 */
  function bindTetris() {
    onReady(() => {
      const canvas = canvasEl();
      if (!canvas) return;
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
          pulse("ArrowUp", 40); // 點一下旋轉
          spark(e.clientX, e.clientY);
          return;
        }
        if (Math.abs(dx) > Math.abs(dy)) {
          pulse(dx > 0 ? "ArrowRight" : "ArrowLeft", 40);
        } else if (dy > 80) {
          pulse("Space", 40); // 長下滑硬降
        } else if (dy > 0) {
          pulse("ArrowDown", 40);
        } else {
          pulse("ArrowUp", 40);
        }
        spark(e.clientX, e.clientY);
      });
    });
  }

  /** 節奏：點擊對應軌道 */
  function bindLanes() {
    onReady(() => {
      const canvas = canvasEl();
      if (!canvas) return;
      const codes = ["KeyD", "KeyF", "KeyJ", "KeyK"];
      canvas.addEventListener("pointerdown", (e) => {
        const p = localXY(canvas, e);
        const lane = Math.min(3, Math.max(0, Math.floor((p.rx / p.rw) * 4)));
        pulse(codes[lane], 40);
        spark(e.clientX, e.clientY);
      });
    });
  }

  /** 飛船：拖曳轉向＋推進，點第二下／點按射擊簡化為拖曳中自動推進、點空白射 */
  function bindShip() {
    onReady(() => {
      const canvas = canvasEl();
      if (!canvas) return;
      let active = false;
      let ox = 0;
      canvas.addEventListener("pointerdown", (e) => {
        active = true;
        ox = e.clientX;
        down("ArrowUp"); // 推進
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
      const end = () => {
        active = false;
        clearMove();
        up("ArrowUp");
      };
      canvas.addEventListener("pointerup", (e) => {
        // 短點射擊
        const dx = Math.abs(e.clientX - ox);
        end();
        if (dx < 14) {
          pulse("Space", 60);
          spark(e.clientX, e.clientY);
        }
      });
      canvas.addEventListener("pointercancel", end);
    });
  }

  /** 左右跟隨：給 shmup／breakout 補強（遊戲本身也有 pointer） */
  function bindFollowX(serveOnTap) {
    onReady(() => {
      const canvas = canvasEl();
      if (!canvas) return;
      const move = (e) => {
        // 仍寫入 Pad，讓 KEY 方案也能動；座標跟隨由 game.js pointer 處理
        const p = localXY(canvas, e);
        clearMove();
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
      canvas.addEventListener("pointerup", clearMove);
      canvas.addEventListener("pointercancel", clearMove);
    });
  }

  // —— 依類型掛手勢 ——
  if (kind === "swipe") bindSwipe();
  else if (kind === "jump") bindTapCode("Space");
  else if (kind === "lanes") bindLanes();
  else if (kind === "tetris") bindTetris();
  else if (kind === "ship") bindShip();
  else if (kind === "lr") bindFollowX(false);
  else if (kind === "lr-serve") bindFollowX(true);
  else if (kind === "move-jump") {
    onReady(() => {
      const canvas = canvasEl();
      if (!canvas) return;
      let ox = 0;
      let oy = 0;
      let moved = false;
      let active = false;
      canvas.addEventListener("pointerdown", (e) => {
        active = true;
        moved = false;
        ox = e.clientX;
        oy = e.clientY;
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (_) {}
      });
      canvas.addEventListener("pointermove", (e) => {
        if (!active) return;
        const dx = e.clientX - ox;
        const dy = e.clientY - oy;
        if (Math.hypot(dx, dy) > 12) moved = true;
        setDirs(dx, dy, "move");
      });
      const end = (e) => {
        if (!active) return;
        active = false;
        clearMove();
        if (!moved) {
          pulse("Space", 70);
          spark(e.clientX, e.clientY);
        }
      };
      canvas.addEventListener("pointerup", end);
      canvas.addEventListener("pointercancel", end);
    });
  } else if (kind === "move-act") {
    onReady(() => {
      const canvas = canvasEl();
      if (!canvas) return;
      let ox = 0;
      let oy = 0;
      let moved = false;
      let active = false;
      canvas.addEventListener("pointerdown", (e) => {
        active = true;
        moved = false;
        ox = e.clientX;
        oy = e.clientY;
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (_) {}
      });
      canvas.addEventListener("pointermove", (e) => {
        if (!active) return;
        const dx = e.clientX - ox;
        const dy = e.clientY - oy;
        if (Math.hypot(dx, dy) > 12) moved = true;
        setDirs(dx, dy, "move");
      });
      const end = (e) => {
        if (!active) return;
        active = false;
        clearMove();
        if (!moved) {
          pulse("KeyE", 70);
          spark(e.clientX, e.clientY);
        }
      };
      canvas.addEventListener("pointerup", end);
      canvas.addEventListener("pointercancel", end);
    });
  } else if (kind === "move-fire") bindStick("move-fire");
  else bindStick("move");
})();
