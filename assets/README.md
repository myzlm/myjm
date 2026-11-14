# assets/

游戏用到的静态资源。所有路径都是相对 `index.html` 的相对路径。

```
assets/
├── characters/   人物图
│   ├── ai.png      艾（掌柜，柜台后面那个人）
│   └── doll.png    纸人 / 突脸 / 娃娃
├── scenes/       场景与主视觉
│   └── cover.png   封面主视觉（1024×1536）
└── ui/           界面资源（图标、纹理、印章）
```

## 使用约定

1. **放进来就能用**：新增立绘按 `characters/<角色名>.png` 命名，场景图按 `scenes/<场景名>.png` 命名，
   代码里用 `<img src="assets/characters/xxx.png">` 或 CSS `url(../assets/scenes/xxx.png)` 引用。
2. **缺图不会坏**：柜台、门、抽屉、器物、纸人、卷轴全部由 DOM + CSS 绘制，
   图片只是"锦上添花"。删掉任意一张 png，界面仍然完整。
3. **透明底优先**：人物图用 PNG 透明背景，尺寸建议 ≥ 800px 高，游戏内会按容器缩放。
4. **不要放音频**：音效全部由 `js/audio.js` 用 Web Audio 实时合成，没有外部音频文件。
5. **体积**：单张控制在 2MB 以内，双击 `index.html` 打开时是本地读取，不走网络。

## 当前引用位置

| 文件 | 用在哪 |
|---|---|
| `characters/ai.png` | 柜台场景的艾（`#oldman-img`） |
| `characters/doll.png` | 突脸（`#doll-img`）、第四章墙后那张脸、第五章覆盖记录时的闪现、故障画面 |
| `scenes/cover.png` | 封面主视觉（可放到 README / 发布页，游戏内暂未强制引用） |
