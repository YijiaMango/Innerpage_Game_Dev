<p align="center">
  <img src="./YijiaMango.png" alt="Yijia Mango" width="420" />
</p>

<p align="center"><strong>Innerpage_Game_Dev</strong> — 遊戲模板實驗場</p>

<p align="center">
  <strong>Hub</strong><br />
  <a href="https://yijiamango.github.io/Innerpage_Game_Dev/">https://yijiamango.github.io/Innerpage_Game_Dev/</a>
</p>

<p align="center">
  <strong>最小塔防</strong><br />
  <a href="https://yijiamango.github.io/Innerpage_Game_Dev/tower-defense/">https://yijiamango.github.io/Innerpage_Game_Dev/tower-defense/</a>
</p>

## 結構

```
Innerpage_Game_Dev/
├── index.html / hub.* / catalog.json   ← 入口目錄
├── tower-defense/                      ← 子遊戲 #1
├── 遊戲模板說明書.md
└── README.md
```

## 加新子遊戲

1. 新建資料夾，例如 `survivors/`，內放可開的 `index.html`
2. 在 `catalog.json` 加一筆：

```json
{
  "id": "survivors",
  "title": "Survivors 殼",
  "description": "說明",
  "version": "0.1.0",
  "path": "survivors/"
}
```

3. Push 後網址即為：  
   `https://yijiamango.github.io/Innerpage_Game_Dev/survivors/`

## 本機

```bash
cd Innerpage_Game_Dev
python -m http.server 8765
```

開 http://127.0.0.1:8765/
