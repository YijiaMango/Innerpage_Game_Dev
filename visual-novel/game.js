/** 最小 Visual Novel — 腳本節點、對話、分支 */

const SCRIPT = {
  start: {
    bg: "",
    speaker: "旁白",
    text: "實驗室的燈還亮著。你推開門，裡面站著一個熟悉的身影。",
    next: "meet",
  },
  meet: {
    bg: "lab",
    speaker: "芒果",
    text: "終於來了。今天只做一件事：選一條路，然後把模板跑起來。",
    next: "ask",
  },
  ask: {
    bg: "lab",
    speaker: "芒果",
    text: "你想先試哪一種？",
    choices: [
      { label: "A. 先做能玩的系統殼", next: "path_sys" },
      { label: "B. 先寫劇情與分支", next: "path_story" },
      { label: "C. 什麼都不選，喝茶", next: "path_tea" },
    ],
  },
  path_sys: {
    bg: "",
    speaker: "芒果",
    text: "好。系統優先——移動、碰撞、數值表。美術之後再換皮。",
    next: "end_sys",
  },
  end_sys: {
    bg: "",
    speaker: "旁白",
    text: "（結局：工程師路線）你把最小可玩版本推上 Hub。",
    next: null,
  },
  path_story: {
    bg: "night",
    speaker: "芒果",
    text: "劇情殼也行。記住：文本與選項資料驅動，畫面只是舞台。",
    next: "end_story",
  },
  end_story: {
    bg: "night",
    speaker: "旁白",
    text: "（結局：編劇路線）你留下三個分支，足夠示範。",
    next: null,
  },
  path_tea: {
    bg: "night",
    speaker: "芒果",
    text: "……也不是不行。茶涼了再寫 code。",
    next: "end_tea",
  },
  end_tea: {
    bg: "night",
    speaker: "旁白",
    text: "（結局：摸魚路線）你獲得了暫時的平靜，以及一個還能重來的按鈕。",
    next: null,
  },
};

const el = {
  bg: document.getElementById("bg"),
  speaker: document.getElementById("speaker"),
  line: document.getElementById("line"),
  choices: document.getElementById("choices"),
  hint: document.getElementById("hint"),
  textbox: document.getElementById("textbox"),
  status: document.getElementById("status"),
  btnRestart: document.getElementById("btn-restart"),
};

let nodeId = "start";

function show(id) {
  nodeId = id;
  const n = SCRIPT[id];
  if (!n) return;
  el.bg.className = "bg" + (n.bg ? " " + n.bg : "");
  el.speaker.textContent = n.speaker || "";
  el.line.textContent = n.text;
  el.choices.innerHTML = "";
  if (n.choices) {
    el.choices.classList.remove("hidden");
    el.hint.classList.add("hidden");
    for (const c of n.choices) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = c.label;
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        show(c.next);
      });
      el.choices.appendChild(b);
    }
    el.status.textContent = "選擇分支";
  } else {
    el.choices.classList.add("hidden");
    el.hint.classList.toggle("hidden", !n.next);
    el.hint.textContent = n.next ? "點擊／空白鍵繼續" : "劇終 — 可按從頭";
    el.status.textContent = n.next ? "繼續" : "結束";
  }
}

function advance() {
  if (window.Feel) Feel.tap(el.textbox);
  const n = SCRIPT[nodeId];
  if (!n || n.choices || !n.next) return;
  show(n.next);
}

el.textbox.addEventListener("click", advance);
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "Enter") {
    e.preventDefault();
    advance();
  }
});
el.btnRestart.addEventListener("click", () => show("start"));
show("start");
