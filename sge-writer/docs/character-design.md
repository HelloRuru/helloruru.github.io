# SGE 文案助手 — 角色立繪設計需求

> 設計師參考文件 + SD Prompt
> 最後更新：2026-02-07

---

## 技術規格

| 項目 | 規格 |
|------|------|
| 尺寸 | **512×512 px** |
| 格式 | PNG（**透明背景**） |
| 風格 | 日系動漫立繪（非 Q 版） |
| 總數量 | **12 張**（3 角色 × 4 表情） |

---

## 色彩參考

| 角色 | 主色 | 色碼 | 用途 |
|------|------|------|------|
| 文案小C | Rose 玫瑰粉 | `#D4A5A5` | 服裝、配件主色 |
| 哈皮 | Lavender 薰衣草紫 | `#B8A9C9` | 服裝、配件主色 |
| BLUE | Sage 鼠尾草綠 | `#A8B5A0` | 服裝、配件主色 |

---

## 角色 1：文案小C（もんあん しょうしー）

### 基本資料

| 項目 | 設定 |
|------|------|
| 職業 | 領航員（Navigator） |
| 類型 | **姊姊系** |
| 年齡感 | 20-25 歲，成熟可靠 |
| 身高感 | 中等偏高，7 頭身 |

### 個性
- 謹慎、條理分明、溫柔但認真
- 像是經驗豐富的前輩，會照顧新人
- 說話有條理，偶爾有點嘮叨但出於關心

### SD Prompt — Base

```
masterpiece, best quality, 1girl, solo, (standing on white background:1.2), centered, full body, young adult anime girl, slender body, average to slightly tall stature, 7 heads tall proportion, mature reliable personality, warm gentle smile, amber brown eyes, oval face, medium length dark chestnut brown hair, natural slight wave, side-swept bangs, hair reaching just past shoulders, round gold-rimmed glasses on nose, important character trait, wearing white dress shirt with rose pink vest over it, rose pink short cape with subtle map pattern embroidery over shoulders, dark navy long skirt, brown leather belt, navigator badge pinned on left chest, holding a small leather-bound notebook in left hand, brown leather ankle boots, RPG character design, looking at viewer
```

### 表情 Prompt（4 張）

#### C-1 樂（Joy）— 一般引導
- **場景**：歡迎使用者、日常對話
- **台詞感**：「嗨！讓我來幫你確認任務細節～」

```
, warm gentle smile, eyes softly curved, one hand holding notebook, other hand giving a small friendly wave, calm welcoming pose, approachable and kind expression
```

#### C-2 喜（Happy）— 查核通過
- **場景**：事實查核完成、資料確認 OK
- **台詞感**：「太棒了！資料確認完成！」

```
, bright happy expression, eyes sparkling behind glasses, big smile showing teeth, giving OK hand sign with right hand, notebook tucked under left arm, confident satisfied pose, pleased expression
```

#### C-3 怒（Angry）— 發現問題
- **場景**：發現違規詞、格式錯誤
- **台詞感**：「等等，這裡有問題需要修正！」

```
, serious stern expression, slight frown, lips pressed together in disapproval, pushing glasses up with one finger, other hand pointing forward at something, leaning forward slightly, strict but not scary, concerned mentor expression
```

#### C-4 哀（Sad）— 資料不足
- **場景**：缺少必要資訊、無法繼續
- **台詞感**：「嗯...還缺少一些資料呢...」

```
, worried troubled expression, eyebrows furrowed with concern, hand on chin thinking, head tilted slightly, holding notebook close, uncertain pose, gentle worry on face, thinking deeply
```

---

## 角色 2：哈皮（ハッピー）

### 基本資料

| 項目 | 設定 |
|------|------|
| 職業 | 吟遊詩人（Bard） |
| 類型 | **元氣少女** |
| 年齡感 | 17-20 歲，活潑開朗 |
| 身高感 | 嬌小，6-7 頭身 |

### 個性
- 溫暖、活潑、超有創意、天生樂觀
- 說話會用很多語助詞，有感染力
- 對文字和創作有熱情，常常靈感爆發

### SD Prompt — Base

```
masterpiece, best quality, 1girl, solo, (standing on white background:1.2), centered, full body, small young adult anime girl, petite small body, slightly short stature, 6-7 heads tall proportion, flat chest, purple eyes, round face, short lavender purple hair, many small tight curls, fluffy curly bob, bouncy ringlet curls all over, low twin tails tied with dark purple ribbon bows, crossed gold hair clips on right side of bangs, gold music note hair ornament on left side, dark indigo purple beret hat with gold music note ornament on right and gold button on left, holding a golden ornate pen in right hand with sleeve pushed up to elbow, pen reaching her chest height, gold pointed nib, holding a small golden wooden lyre harp in left hand, left sleeve has white cuff with gold trim, wearing pale grayish lavender off-shoulder dress, bare shoulders, wide white ruffled collar with gold edge hanging on upper arms, purple ribbon bow with gold heart ornament at collar center, dark purple buttons down center front four buttons, puffy balloon sleeves ending above elbow, brown leather strap crossing from right shoulder to left waist, brown leather double belt at waist with square gold buckle and gold bell charm on right side, layered puffy skirt, outer layer pale grayish lavender with gold horizontal line detail and dark purple ribbon bows along hem, middle layer pale blue-gray ruffle peeking below, inner layer white cutout lace trim at bottom, long dark purple ribbon tails hanging from back of skirt with star charms on ends, brown leather short boots with dark purple ribbon bows on front, white ankle socks peeking out, RPG character design, looking at viewer
```

### 表情 Prompt（4 張）

#### H-1 樂（Joy）— 開始撰寫
- **場景**：接到任務、準備開始創作
- **台詞感**：「交給我吧～讓資料變成動人故事！」

```
, genki energetic personality, big confident smile with fang tooth visible, eyes sparkling with determination, raising golden pen high in right hand, dynamic cheerful pose, one leg slightly raised, ready to create
```

#### H-2 喜（Happy）— 文案完成
- **場景**：成功完成文案、獲得高分
- **台詞感**：「耶～完成了！這篇超棒的！」

```
, overjoyed expression, huge open mouth smile with fang tooth, eyes closed happily like curved lines, both arms raised in celebration, hugging lyre to chest with left hand, pen held up triumphantly in right hand, jumping pose, sparkle effects around, pure happiness
```

#### H-3 怒（Angry）— 違規詞警告
- **場景**：偵測到違規詞彙
- **台詞感**：「不行不行！這個詞不能用喔！」

```
, surprised disapproving expression, mouth open in O shape, one eyebrow raised, wagging index finger of right hand while holding pen, lyre held protectively in left hand, leaning forward slightly, scolding pose but still cute, puffed cheek on one side
```

#### H-4 哀（Sad）— 需要重寫
- **場景**：文案不通過、需要修改
- **台詞感**：「唔...再試一次吧...」

```
, dejected expression, wry bitter smile, eyes half-lidded looking down, shoulders slumped, pen drooping down in right hand, lyre hanging loosely in left hand, slight slouch pose, still standing but low energy, not giving up
```

---

## 角色 3：BLUE（ブルー）

### 基本資料

| 項目 | 設定 |
|------|------|
| 職業 | 文案見習生（Apprentice） |
| 類型 | **小蘿莉** |
| 年齡感 | 12-15 歲，青澀可愛 |
| 身高感 | 嬌小，5.5-6 頭身 |

### 個性
- 好奇心旺盛、努力學習、有點呆萌
- 會犯傻但很認真，失敗了也不放棄
- 是使用者的化身，代表正在學習的新手

### SD Prompt — Base

```
masterpiece, best quality, 1girl, solo, (standing on white background:1.2), centered, full body, young teen anime girl, small petite body, short stature, 5.5-6 heads tall proportion, flat chest, curious innocent personality, big round sparkling green eyes, round baby face, light honey brown hair, high twin tails with slight curl at ends, ahoge cowlick on top, sage green ribbons tying twin tails, wearing cream white adventurer vest with sage green trim and piping, small apprentice badge pinned on chest, simple white short sleeve shirt underneath, brown shorts, knee-high white socks, slightly oversized brown leather short boots with sage green laces, brown leather fingerless gloves, carrying an oversized brown leather backpack with buckle straps, RPG character design, looking at viewer
```

### 表情 Prompt（4 張）

#### L-1 樂（Joy）— 小隊卡片 / 開始
- **場景**：小隊成員展示、準備冒險
- **台詞感**：「出發吧！我會努力的！」

```
, energetic excited expression, eyes wide and sparkling with anticipation, big open smile, clenching fist raised up with determination, standing tall trying to look brave, one foot forward ready to go, genki pose
```

#### L-2 喜（Happy）— 升級
- **場景**：獲得 EXP、等級提升
- **台詞感**：「哇！我升級了！！」

```
, overjoyed ecstatic expression, eyes turned into stars, mouth wide open in amazement, both fists pumped up high in the air, slight jumping pose, feet barely touching ground, pure childlike excitement, sparkle effects
```

#### L-3 怒（Angry）— 遇到魔獸（問題）
- **場景**：遇到 SEO 問題、違規詞攻擊
- **台詞感**：「哼！我才不會輸！」

```
, defiant pouting expression, puffed up cheeks, eyebrows furrowed in determination, clenching both fists in front of chest, legs apart in fighting stance, cute battle ready pose, not scary at all, refusing to give up
```

#### L-4 哀（Sad）— 任務失敗
- **場景**：分數太低、需要重來
- **台詞感**：「嗚...我會再加油的...」

```
, sad dejected expression, eyes watery and glistening but not crying, lips trembling slightly pressed together, head drooped down, both hands gripping backpack straps tightly, slumped shoulders, small figure looking even smaller, still standing not giving up
```

---

## BLUE — NovaAnimeXL 版本（替代風格）

> 使用 NovaAnimeXL (Illustrious 架構) 的 Danbooru 標籤風格，畫風更精緻。
> 推薦設定：Steps 25 / CFG 5 / DPM++ 2M Karras / 832x1216 / Clip Skip 2

### SD Prompt — Base (NovaAnimeXL)

```
masterpiece, best quality, absurdres, highres, 1girl, solo, (white background:1.3), (full body:1.2), standing, young girl, loli, petite, short height, green eyes, big round eyes, light brown hair, twin tails, ahoge, hair ribbon, green ribbon, adventurer, white vest, green trim, short sleeves, white shirt, brown shorts, knee-high socks, brown boots, oversized boots, fingerless gloves, brown gloves, backpack, large backpack, leather backpack, badge, simple background, character sheet, looking at viewer
```

### 表情 Prompt（4 張）

#### L-1 樂 Joy (Nova)
```
, :d, open mouth, smile, sparkling eyes, clenched hand, fist pump, excited, one leg forward, energetic pose
```

#### L-2 喜 Happy (Nova)
```
, :d, >_<, xd, open mouth, arms up, jumping, starry eyes, star-shaped pupils, clenched hands, joy, sparkle, motion lines
```

#### L-3 怒 Angry (Nova)
```
, >:( , puffed cheeks, furrowed brows, clenched fists, fighting stance, determined, legs apart, cute anger, v-shaped eyebrows
```

#### L-4 哀 Sad (Nova)
```
, :(, watery eyes, teary eyes, no tears, frown, hunched shoulders, gripping backpack straps, head down, looking down, lonely, small figure
```

### 檔案命名（NovaAnimeXL 版）
```
player-joy-nova.png
player-happy-nova.png
player-angry-nova.png
player-sad-nova.png
```

---

## 檔案命名規則

```
sge-writer/icons/characters/
├── guide-joy.png       # C-1 小C 樂
├── guide-happy.png     # C-2 小C 喜
├── guide-angry.png     # C-3 小C 怒
├── guide-sad.png       # C-4 小C 哀
├── writer-joy.png      # H-1 哈皮 樂
├── writer-happy.png    # H-2 哈皮 喜
├── writer-angry.png    # H-3 哈皮 怒
├── writer-sad.png      # H-4 哈皮 哀
├── player-joy.png      # L-1 BLUE 樂
├── player-happy.png    # L-2 BLUE 喜
├── player-angry.png    # L-3 BLUE 怒
└── player-sad.png      # L-4 BLUE 哀
```

---

## 角色關係圖

```
┌─────────────────────────────────────────┐
│            冒險小隊 Party               │
│                                         │
│   [小C]          [哈皮]        [BLUE]   │
│   姊姊系         元氣系        蘿莉系   │
│   ↓              ↓             ↓       │
│   領導者         創作者        學習者   │
│   引導任務       撰寫文案      代表玩家 │
│                                         │
│   Rose粉        Lavender紫    Sage綠   │
└─────────────────────────────────────────┘
```

---

## 補充說明

1. **透明背景**很重要，會疊加在對話泡泡旁
2. 表情要**明確清楚**，方便在小尺寸下辨識
3. 每個角色的**主色調**要明顯，方便識別
4. 可以加入小特效（如星星、音符、汗滴等）增加表現力
5. SD Prompt 的 Base 和表情 Prompt 接在一起即為完整 prompt
