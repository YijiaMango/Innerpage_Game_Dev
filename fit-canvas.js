/** 直式畫布 9:16：塞滿 stage，等比 contain、不變形 */
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
    // 直式優先：先撐滿高度
    let h = sh;
    let w = h * ar;
    if (w > sw) {
      w = sw;
      h = w / ar;
    }
    canvas.style.width = Math.floor(w) + "px";
    canvas.style.height = Math.floor(h) + "px";
  }

  fit();
  window.addEventListener("resize", fit);
  window.addEventListener("orientationchange", () => setTimeout(fit, 80));
  if (window.ResizeObserver) new ResizeObserver(fit).observe(stage);
})();
