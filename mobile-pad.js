/** @deprecated 已併入 controls.js — 保留此檔避免舊快取載入舊方向鍵邏輯 */
(function () {
  document.querySelectorAll("#mobile-pad, .dpad, .pad-btn, .pad-actions").forEach((n) => n.remove());
  document.body.classList.remove("has-mobile-pad", "pad-tall", "pad-lanes");
  if (!window.Controls) {
    console.warn("[deprecated] mobile-pad.js → 請改載 controls.js");
  }
})();
