<p align="center">
  <img src="./YijiaMango.png" alt="Yijia Mango" width="420" />
</p>

<p align="center"><strong>Innerpage_Game_Dev</strong> — 遊戲模板實驗場</p>

<p align="center">
  <a href="https://yijiamango.github.io/Innerpage_Game_Dev/">https://yijiamango.github.io/Innerpage_Game_Dev/</a>
</p>

## 系統層（根目錄，勿散落到各遊戲）

| 檔案 | 職責 |
|---|---|
| `controls.js` / `controls.css` | 輸入：鍵盤 + 相對拖曳搖桿 + `data-pad` 手勢；遊戲只讀 `Controls.axis()` / `pressed()` |
| `feel.js` | 手感／粒子／震動 |
| `fit-canvas.js` | 直式畫布等比適配 |

## 最小模板

| 類型 | 說明 | 路徑 |
|---|---|---|
| 塔防 | 建塔、波次、金幣／生命 | [`tower-defense/`](https://yijiamango.github.io/Innerpage_Game_Dev/tower-defense/) |
| Survivors | 移動、自動攻擊、刷怪、XP 升級三選一 | [`survivors/`](https://yijiamango.github.io/Innerpage_Game_Dev/survivors/) |
| Idle | 點擊／放置產金、資料驅動升級、存檔 | [`idle/`](https://yijiamango.github.io/Innerpage_Game_Dev/idle/) |
| Platformer | 跑跳、平台碰撞、硬幣、旗幟通關 | [`platformer/`](https://yijiamango.github.io/Innerpage_Game_Dev/platformer/) |
| Roguelike | 程序地城、簡易 FOV、撞怪、下樓 | [`roguelike/`](https://yijiamango.github.io/Innerpage_Game_Dev/roguelike/) |
| Card | 手牌能量、敵人意圖、勝利選牌入組 | [`card-builder/`](https://yijiamango.github.io/Innerpage_Game_Dev/card-builder/) |
| Visual Novel | 腳本對話與分支結局 | [`visual-novel/`](https://yijiamango.github.io/Innerpage_Game_Dev/visual-novel/) |
| RPG | 俯視移動、NPC 對話、回合戰鬥 | [`rpg/`](https://yijiamango.github.io/Innerpage_Game_Dev/rpg/) |
| Match-3 | 相鄰交換、三連消除、重力補珠 | [`match3/`](https://yijiamango.github.io/Innerpage_Game_Dev/match3/) |
| Shmup | 縱向射擊、敵機波次與子彈 | [`shmup/`](https://yijiamango.github.io/Innerpage_Game_Dev/shmup/) |
| Breakout | 底板、球、打磚塊 | [`breakout/`](https://yijiamango.github.io/Innerpage_Game_Dev/breakout/) |
| Snake | 移動、吃點變長、撞牆／自撞 | [`snake/`](https://yijiamango.github.io/Innerpage_Game_Dev/snake/) |
| Falling Blocks | 方塊下落、旋轉、消行 | [`falling-blocks/`](https://yijiamango.github.io/Innerpage_Game_Dev/falling-blocks/) |
| Endless Runner | 無盡跑酷、跳躍躲障礙 | [`endless-runner/`](https://yijiamango.github.io/Innerpage_Game_Dev/endless-runner/) |
| Sokoban | 推箱子解謎、多關卡 | [`sokoban/`](https://yijiamango.github.io/Innerpage_Game_Dev/sokoban/) |
| Top-down Shooter | WASD + 滑鼠瞄準手動射擊 | [`top-down-shooter/`](https://yijiamango.github.io/Innerpage_Game_Dev/top-down-shooter/) |
| Rhythm | 四軌節奏、DFJK 判定 | [`rhythm/`](https://yijiamango.github.io/Innerpage_Game_Dev/rhythm/) |
| Merge | 點格放下、同階相鄰合成 | [`merge/`](https://yijiamango.github.io/Innerpage_Game_Dev/merge/) |
| Asteroids | 轉向推進射擊、隕石分裂 | [`asteroids/`](https://yijiamango.github.io/Innerpage_Game_Dev/asteroids/) |
| Tactics | 戰棋移動／攻擊、敵方簡易 AI | [`tactics/`](https://yijiamango.github.io/Innerpage_Game_Dev/tactics/) |
