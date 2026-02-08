# 哈皮（吟遊詩人）場景版 Prompt 補充 v1

> **適用模型：** Nova Anime XL (NORA)  
> **基於設定集：** Happi-哈皮-角色設定集-v1.2  
> **用途：** 場景圖生成用，記錄 NORA 模型的調校經驗與確定可用的 Prompt

---

## 📋 確定版 — 半身場景圖（RPG 遺跡相遇）

### 🟢 Positive Prompt

```
masterpiece, best quality, 1girl, solo, upper body, small young adult anime girl, petite small body, flat chest, genki energetic personality, big open smile with fang tooth visible, looking at viewer, one hand waving hello, purple eyes, round face, short very pale lavender hair, almost white with faint purple tint, pastel lavender white hair, chin length hair, very curly hair, many small tight curls, fluffy curly bob, bouncy ringlet curls all over, spiral curls, corkscrew curls, dark purple ribbon bows in hair, ear length twin tails, short low twin tails tied with dark purple ribbon bows, crossed gold hair clips on right side of bangs, gold music note hair ornament on left side, dark indigo purple beret hat with gold music note ornament on right and gold button on left, fair skin, pale skin, holding a small golden wooden lyre harp in left hand, left sleeve has white cuff with gold trim, wearing very pale almost white lavender off-shoulder dress, white dress with faint purple tint, bare shoulders, wide white ruffled collar with gold edge hanging on upper arms, purple ribbon bow with gold heart ornament at collar center, dark purple buttons down center front four buttons, puffy balloon sleeves ending above elbow, brown leather strap crossing from right shoulder to left waist, ancient stone ruins background, crumbling stone archway, magical summoning circle glow from below, bright blue sky, white clouds, green grass meadow, flower petals falling in the air, pink and purple petals scattered, colorful wildflowers blooming around, BREAK, depth of field, soft natural lighting, bright daylight, fantasy RPG atmosphere, cinematic composition
```

### 🔴 Negative Prompt

```
modern, recent, old, oldest, cartoon, graphic, text, painting, crayon, graphite, abstract, glitch, deformed, mutated, ugly, disfigured, lowres, bad anatomy, bad hands, missing fingers, extra digits, fewer digits, cropped, very displeasing, worst quality, bad quality, sketch, jpeg artifacts, signature, watermark, username, conjoined, bad ai-generated, realistic, photorealistic, 3D render, multiple characters, blurry, mature body, adult proportions, tall, sexy pose, revealing clothing, extra fingers, extra limbs, deformed hands, large breasts, medium breasts, fountain, water, water fountain, multiple views, portrait background, duplicate, character sheet, split view, two girls, background character, avatar background, mirrored image, collage, long hair, medium hair, long twin tails, flowing hair, hair past shoulders, waist length hair, wind, speech bubble, comic panel, chibi inset, straight hair, full body, legs, feet, elf ears, pointed ears, long ears, white hair, silver hair, grey hair, gray hair, dark purple hair, dark hair, black hair, dark skin, tan skin, sunset, golden hour, orange sky, warm tint, dark clothing, all black outfit, all purple outfit, backlight, backlighting, silhouette, contre jour, saturated purple hair, vivid purple hair, deep purple hair
```

### ⚙️ 參數

```
Model: Nova Anime XL
Sampler: Euler a
Steps: 25
CFG Scale: 5
Width: 1216
Height: 832
Seed: 20260206
```

---

## 🔧 NORA 模型調校筆記

### 髮長控制

| 問題 | 原因 | 解法 |
|------|------|------|
| 馬尾變長 | `wind blowing` 描述讓模型拉長頭髮 | 完全不用風吹描述 |
| 馬尾變長 | 原設的 `short` 不夠強 | 加 `chin length hair` + `ear length twin tails` + `short low twin tails` 三重約束 |
| 馬尾變長 | Negative 不足 | 加 `long hair, medium hair, long twin tails, flowing hair, hair past shoulders, waist length hair` |

### 髮色控制

| 問題 | 原因 | 解法 |
|------|------|------|
| 髮色太深（深紫/暗紫） | 黃昏光 + 半身特寫放大紫色描述 | 改白天場景，拿掉 golden hour |
| 髮色太深 | `lavender, lilac, light violet` 對 NORA 偏深 | 改用 `very pale lavender, almost white with faint purple tint, pastel lavender white` |
| 髮色偏銀白 | 日光太強洗掉紫調 | Negative 加 `white hair, silver hair, grey hair` |
| 髮色偏深 | — | Negative 加 `dark purple hair, saturated purple hair, vivid purple hair, deep purple hair` |

### 捲度控制

| 問題 | 原因 | 解法 |
|------|------|------|
| 捲度不足 | 場景版服裝細節分散注意力 | 堆疊 `very curly hair, many small tight curls, fluffy curly bob, bouncy ringlet curls all over, spiral curls, corkscrew curls` |
| 變直髮 | — | Negative 加 `straight hair` |

### 緞帶蝴蝶結

| 問題 | 原因 | 解法 |
|------|------|------|
| 緞帶消失 | 描述被其他元素搶走 | 加 `dark purple ribbon bows in hair` 做雙重描述 |

### 其他 NORA 傾向

| 現象 | 處理方式 |
|------|---------|
| 左上角跑出企鵝 chibi 小圖 | Negative 加 `speech bubble, comic panel, chibi inset` |
| 精靈耳朵 | Negative 加 `elf ears, pointed ears, long ears` |
| 服裝偏白＋深紫（非淡灰紫） | NORA 的固定詮釋傾向，接受或用 `very pale almost white lavender` 引導 |
| 帽子變軟巫師帽 | NORA 傾向，設定圖與場景圖均有此現象 |
| 全身場景版品質下降 | 改用半身 `upper body` 提升細節清晰度 |
| 背光導致膚色/髮色偏暗 | Negative 加 `backlight, backlighting, silhouette, contre jour` |

---

## 🏞️ 場景模板擴充（待測試）

| 編號 | 場景 | 狀態 |
|------|------|------|
| S1 | RPG 遺跡相遇（白天・花瓣） | ✅ 確定版 |
| S2 | 冒險第二幕（森林小路・回頭笑） | 🔜 待製作 |
| S3 | 營火休息（夜晚・彈豎琴） | 🔜 待製作 |
| S4 | 戰鬥場景 | 🔜 待製作 |

---

**© 2026 Kaoru Tsai. All Rights Reserved. | Contact: hello@helloruru.com**
