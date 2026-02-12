# SEO Quest — 視覺資產策略

**最後更新**：2026-02-12
**決策方向**：場景圖為主（CG 風格），最小化視覺干擾，聚焦教學內容

---

## 🎯 核心原則

### 為什麼選擇場景圖而非角色立繪？

1. **教學優先**：場景圖不會搶走文字教學的焦點
2. **氛圍營造**：每個階段配對應場景（航行/解密/營火），強化隱喻
3. **輕量實作**：5 個關卡 × 5 個階段 = 最多 25 張圖，成本可控
4. **文字主導**：SEO Quest 本質是文字冒險遊戲，視覺輔助即可

### 對比 SGE 文案助手

| 項目 | SGE 文案助手 | SEO Quest |
|------|-------------|-----------|
| 角色立繪 | ✅ 87 張（伊歐/BLUE/哈皮 全表情） | ❌ 不使用 |
| 場景圖 | ❌ 無 | ✅ 每階段一張 CG |
| UI Icon | Emoji + SVG | Emoji（過渡） → SVG Icon |
| 視覺重心 | 角色互動 | 場景氛圍 + 文字教學 |

---

## 📁 檔案結構設計

```
seo-quest/
├── assets/
│   ├── icons/
│   │   ├── compass.svg         # 🧭 替代 emoji
│   │   ├── book.svg            # 📚 教學模式
│   │   ├── tool.svg            # 🛠️ 工具模式
│   │   ├── star.svg            # ⭐ 等級徽章
│   │   └── ...                 # 其他 UI icon
│   │
│   └── scenes/                 # 場景 CG 圖
│       ├── world-1/
│       │   ├── 1-1-tutorial.jpg    # 1-1 教學階段場景
│       │   ├── 1-1-demo.jpg        # 1-1 示範階段場景
│       │   ├── 1-1-practice.jpg    # 1-1 實作階段場景
│       │   ├── 1-2-tutorial.jpg
│       │   └── ...
│       │
│       └── common/             # 通用場景（可選）
│           ├── ocean-voyage.jpg    # 伊歐的航行海洋
│           ├── map-decode.jpg      # BLUE 的解密地圖
│           └── campfire-warmth.jpg # 哈皮的營火溫度
```

---

## 🎨 場景圖設計規範

### 尺寸與格式

| 項目 | 規範 | 說明 |
|------|------|------|
| 尺寸 | 1200×675 | 16:9 橫幅（網頁適用） |
| 格式 | JPG / WebP | WebP 優先（更小更清晰） |
| 檔案大小 | < 150KB | 背景用，適度壓縮 |
| 色調 | 粉紫漸層主調 | 符合 Design System v1.7 |
| 風格 | 柔和插畫/水彩風 | 避免高對比寫實風格 |
| 透明度使用 | CSS 控制 | 圖片本身不透明，CSS 設 opacity: 0.15 |

### 場景主題對應（World 1）

#### 初相遇場景（3 張 — 角色登場專用）

| 場景名稱 | 初相遇情境 | 視覺元素 | 對應角色 |
|---------|----------|---------|---------|
| **破曉的海洋** | 伊歐在船頭迎接你，指南針閃光 | 遼闊海面、晨光破雲、船帆初升、指南針特寫 | 伊歐 (io) |
| **解密的書桌** | BLUE 在地圖桌前等你，座標已標記 | 木質桌面、攤開的地圖、發光座標、測量工具 | BLUE |
| **溫暖的營火** | 哈皮在營火旁向你招手，筆記本打開 | 跳動的火焰、溫馨光暈、攤開的筆記本、柔和陰影 | 哈皮 (happi) |

#### 關卡專屬場景（可選 — 進階版）

如果要為每一關設計獨特場景，可按主題差異化：

| 關卡 | 主題 | 場景特色 |
|------|------|---------|
| 1-1 | 搜尋意圖與標題 | 破曉的海洋，船帆初升 |
| 1-2 | 關鍵字與內文結構 | 海圖上的航線標記 |
| 1-3 | 比較表格與數據呈現 | 解密桌上的數據符號 |
| 1-4 | FAQ 與收尾策略 | 漆黑海域，遠方燈塔微光 |
| 1-5 | SOP 全整合實戰 | 三人協奏，船隻抵達彼岸 |

---

## 🖼️ 場景圖使用方式

### HTML 結構

```html
<!-- 教學階段 (Tutorial) -->
<section id="view-tutorial" class="game-view" data-phase="tutorial">
  <div class="phase-scene" style="background-image: url('assets/scenes/common/ocean-voyage.jpg');"></div>
  <div class="phase-content">
    <!-- 對話文字區域 -->
  </div>
</section>

<!-- 示範階段 (Demo) -->
<section id="view-demo" class="game-view" data-phase="demo">
  <div class="phase-scene" style="background-image: url('assets/scenes/common/map-decode.jpg');"></div>
  <div class="phase-content">
    <!-- 示範文章 -->
  </div>
</section>
```

### CSS 樣式參考

```css
/* 場景背景層 */
.phase-scene {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0.15;  /* 半透明避免干擾文字 */
  filter: blur(2px);  /* 輕微模糊製造景深 */
  pointer-events: none;
  z-index: 0;
}

/* 內容層（文字）始終在上方 */
.phase-content {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.95);  /* 半透明白底保證可讀性 */
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
}
```

---

## 🎯 實作優先順序

### Phase 1：最小可行方案（MVP）

**目標**：3 張通用場景圖 + Emoji → SVG Icon 替換

**工作清單**：
- [ ] 設計/委託 3 張通用場景圖
  - [ ] 航行海洋（伊歐 — Tutorial）
  - [ ] 解密地圖（BLUE — Demo）
  - [ ] 營火溫暖（哈皮 — Practice）
- [ ] 圖片壓縮優化（< 200KB/張）
- [ ] 替換 Emoji 為 SVG Icon
  - [ ] 🧭 → compass.svg
  - [ ] 📚 → book.svg
  - [ ] 🛠️ → tool.svg
  - [ ] ⭐ → star.svg
- [ ] CSS 整合場景背景層
- [ ] 測試可讀性（文字是否清晰）

**預估時間**：2-3 小時（不含圖片製作）

### Phase 2：進階優化（可選）

**目標**：關卡專屬場景 + 動態轉場

**工作清單**：
- [ ] 為每一關設計專屬場景（5 關 × 3 階段 = 15 張）
- [ ] 實作場景切換動畫（fade-in/fade-out）
- [ ] 加入視差滾動效果（parallax）
- [ ] Loading 階段顯示場景預覽

**預估時間**：8-10 小時

---

## 📝 場景圖製作指引

### 給設計師 / AI 生成器的 Prompt

```
創作一張 1920×1080 的柔和插畫風場景圖：
- 主題：[航行海洋/解密地圖/營火溫暖]
- 色調：粉紫漸層 (Rose #D4A5A5 + Lavender #B8A9C9)
- 風格：水彩插畫、柔和光線、低飽和度
- 元素：[指南針與海洋/地圖與座標/營火與筆記本]
- 氛圍：寧靜、教學感、溫暖
- 重點：畫面需留白 60% 以上，供文字疊加
```

### 色彩參考（Design System v1.7）

| 名稱 | HEX | 用途 |
|------|-----|------|
| Rose（主色） | #D4A5A5 | 天空/海面漸層 |
| Lavender（次色） | #B8A9C9 | 暮光/陰影 |
| Soft White | #F8F6F7 | 雲朵/高光 |
| Charcoal | #333333 | 輪廓線/深色細節 |

---

## ✅ 檢查清單

在部署場景圖前確認：

- [ ] 每張圖片 < 200KB（載入速度）
- [ ] 圖片色調符合 Design System（粉紫主調）
- [ ] 背景不搶文字焦點（opacity + blur）
- [ ] 3 張通用場景圖已準備完成
- [ ] Emoji 已全部替換為 SVG Icon
- [ ] 手機版測試通過（場景不影響可讀性）

---

## 🎨 參考資源

- **視覺風格參考**：Gris、Florence、Sky 光·遇（柔和色調 + 教學導向）
- **插畫風格參考**：Kurzgesagt、Headspace（扁平化插畫 + 大量留白）
- **色彩靈感**：Design System v1.7（粉紫漸層系統）

---

## 📌 總結

**SEO Quest 視覺策略**：場景圖為主，角色靠文字呈現

- ✅ **3 張通用場景**即可覆蓋所有關卡（MVP）
- ✅ **半透明背景**不干擾教學文字
- ✅ **粉紫色調**符合品牌設計系統
- ✅ **輕量實作**（< 600KB 總容量）
- ❌ **不使用角色立繪**（避免視覺過載）

**下一步**：製作 3 張通用場景圖 → 整合 CSS → 替換 Emoji 為 SVG Icon
