/** 將 #game 等比塞進 .stage，不變形、不溢出 */
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
    let w = sw;
    let h = w / ar;
    if (h > sh) {
      h = sh;
      w = h * ar;
    }
    canvas.style.width = Math.floor(w) + "px";
    canvas.style.height = Math.floor(h) + "px";
  }

  fit();
  window.addEventListener("resize", fit);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(stage);
})();
