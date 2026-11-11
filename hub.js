(async function () {
  const grid = document.getElementById("apps");
  const status = document.getElementById("status");
  try {
    const res = await fetch("./catalog.json", { cache: "no-store" });
    if (!res.ok) throw new Error("catalog HTTP " + res.status);
    const apps = await res.json();
    if (!Array.isArray(apps) || apps.length === 0) {
      status.textContent = "尚無子遊戲。在 catalog.json 加一筆即可。";
      status.className = "empty";
      return;
    }
    status.remove();
    const frag = document.createDocumentFragment();
    apps.forEach((app) => {
      const a = document.createElement("a");
      a.className = "app";
      a.href = "./" + (app.path || app.id + "/");
      a.innerHTML =
        '<div class="title">' +
        escapeHtml(app.title || app.id || "untitled") +
        "</div>" +
        '<p class="desc">' +
        escapeHtml(app.description || "遊戲模板實驗") +
        "</p>" +
        '<div class="meta">' +
        escapeHtml(app.version ? "v." + app.version : app.path || app.id) +
        "</div>";
      frag.appendChild(a);
    });
    grid.appendChild(frag);
  } catch (e) {
    status.textContent = "無法載入遊戲目錄（catalog.json）。";
    status.className = "err";
    console.error(e);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
