/** 手機優先：直向視窗先塞滿高度，再等比縮放不變形 */
(function () {
  const canvas = document.getElementById("game");
  if (!canvas) return;
  const stage = canvas.closest(".stage") || canvas.parentElement;
  if (!stage) return;

  function fit() {
    const sw = stage.clientWidth;
    const sh = stage.clientHeight;
    if (sw < 2 || sh < 2) return;
    const ar = (canvas.width || 1) / (canvas.height || 1);
    const portraitUI = window.innerHeight >= window.innerWidth;
    let w;
    let h;
    if (portraitUI) {
      // 手機：優先吃滿可用高度
      h = sh;
      w = h * ar;
      if (w > sw) {
        w = sw;
        h = w / ar;
      }
    } else {
      w = sw;
      h = w / ar;
      if (h > sh) {
        h = sh;
        w = h * ar;
      }
    }
    canvas.style.width = Math.floor(w) + "px";
    canvas.style.height = Math.floor(h) + "px";
  }

  fit();
  window.addEventListener("resize", fit);
  window.addEventListener("orientationchange", () => setTimeout(fit, 80));
  if (window.ResizeObserver) new ResizeObserver(fit).observe(stage);
})();
