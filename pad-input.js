/** 觸控／鍵盤共用按鍵狀態（手機可靠，不靠合成 KeyboardEvent） */
(function (global) {
  const keys = new Set();

  function pressed(...codes) {
    for (let i = 0; i < codes.length; i++) {
      if (keys.has(codes[i])) return true;
    }
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

  // 實體鍵盤同步進同一套
  global.addEventListener("keydown", (e) => {
    keys.add(e.code);
  });
  global.addEventListener("keyup", (e) => {
    keys.delete(e.code);
  });
  global.addEventListener("blur", () => keys.clear());

  global.Pad = { keys, pressed, down, up, pulse };
  global.pressed = pressed;
})(window);
