# SEO Quest — 前端邏輯設計

> 劇情演出與回饋感的完整實作方案
> 更新日期：2026-02-12

---

## 📋 目錄

- [動態演出系統](#動態演出系統)
- [資產管理系統](#資產管理系統)
- [成就事件系統](#成就事件系統)
- [TypeScript 介面定義](#typescript-介面定義)

---

## 🎭 動態演出系統

### 強化的 Dialogue 結構

```json
{
  "demo": {
    "title": "劇情示範：咖啡店老闆的煩惱",
    "characters": [
      {
        "id": "mia",
        "name": "Mia",
        "role": "咖啡店老闆",
        "avatar": "☕",
        "voiceTone": "curious"
      },
      {
        "id": "aria",
        "name": "Aria",
        "role": "SEO 導師",
        "avatar": "🧙",
        "voiceTone": "wise"
      }
    ],
    "dialogue": [
      {
        "speaker": "mia",
        "text": "我的咖啡店剛開幕，想寫一篇部落格介紹我們的『單品咖啡豆』...",
        "emotion": "confused",           // ⭐ 新增：表情狀態
        "delay": 50,                     // ⭐ 新增：打字速度 (ms/字)
        "pause": 500,                    // ⭐ 新增：說完後停頓時間
        "action": "think",               // ⭐ 新增：動作提示
        "sfx": "thinking_sound"          // ⭐ 新增：音效
      },
      {
        "speaker": "aria",
        "text": "讓我示範給你看！",
        "emotion": "confident",
        "delay": 40,
        "pause": 300,
        "action": "point",
        "sfx": "magic_sparkle"
      },
      {
        "speaker": "aria",
        "text": "首先，我們要思考：目標客群會搜尋什麼？",
        "emotion": "teaching",
        "delay": 45,
        "pause": 800,
        "highlight": ["目標客群", "搜尋"],  // ⭐ 新增：關鍵字高亮
        "action": "gesture"
      }
    ],
    "presentation": {
      "autoPlay": true,                  // ⭐ 自動播放
      "skipable": true,                  // ⭐ 可跳過
      "bgMusic": "calm_teaching",        // ⭐ 背景音樂
      "sceneTransition": "fade"          // ⭐ 場景轉場
    }
  }
}
```

### 表情狀態定義

```typescript
// 表情差分系統
enum CharacterEmotion {
  NEUTRAL = 'neutral',       // 中性
  HAPPY = 'happy',           // 開心
  EXCITED = 'excited',       // 興奮
  CONFUSED = 'confused',     // 困惑
  THINKING = 'thinking',     // 思考中
  CONFIDENT = 'confident',   // 自信
  TEACHING = 'teaching',     // 教學模式
  SURPRISED = 'surprised',   // 驚訝
  WORRIED = 'worried',       // 擔心
  PROUD = 'proud'            // 驕傲
}

// 表情對應的視覺效果
const EmotionEffects = {
  confused: {
    emoji: '❓',
    textColor: '#7F8C8D',
    bubbleColor: '#ECF0F1',
    animation: 'shake'
  },
  confident: {
    emoji: '✨',
    textColor: '#2C3E50',
    bubbleColor: '#E8F5E9',
    animation: 'bounce'
  },
  teaching: {
    emoji: '💡',
    textColor: '#34495E',
    bubbleColor: '#FFF9C4',
    animation: 'glow'
  }
};
```

### 前端渲染邏輯

```typescript
// js/modules/dialogue-engine.js

class DialogueEngine {
  private currentDialogue: DialogueMessage[];
  private currentIndex: number = 0;
  private isPlaying: boolean = false;

  /**
   * 渲染單句對話
   */
  async renderMessage(message: DialogueMessage): Promise<void> {
    const { speaker, text, emotion, delay, pause, action, highlight, sfx } = message;

    // 1. 顯示角色頭像與表情
    this.updateCharacterEmotion(speaker, emotion);

    // 2. 播放音效
    if (sfx) {
      AudioManager.play(sfx);
    }

    // 3. 打字機效果
    await this.typewriterEffect(text, delay, highlight);

    // 4. 顯示動作提示
    if (action) {
      this.showActionHint(speaker, action);
    }

    // 5. 停頓
    await this.wait(pause);
  }

  /**
   * 打字機效果（支援關鍵字高亮）
   */
  private async typewriterEffect(
    text: string,
    delay: number,
    highlight?: string[]
  ): Promise<void> {
    const container = document.querySelector('.dialogue-text');
    container.innerHTML = '';

    // 將文字分段處理高亮
    const segments = this.segmentTextWithHighlight(text, highlight);

    for (const segment of segments) {
      const span = document.createElement('span');

      if (segment.isHighlight) {
        span.className = 'highlight-keyword';
        span.style.animation = 'highlight-fade-in 0.3s ease';
      }

      // 逐字顯示
      for (const char of segment.text) {
        span.textContent += char;
        await this.wait(delay);
      }

      container.appendChild(span);
    }
  }

  /**
   * 更新角色表情
   */
  private updateCharacterEmotion(
    characterId: string,
    emotion: CharacterEmotion
  ): void {
    const avatar = document.querySelector(`[data-character="${characterId}"]`);
    const effect = EmotionEffects[emotion];

    // 更新表情符號
    const emotionIndicator = avatar.querySelector('.emotion-indicator');
    emotionIndicator.textContent = effect.emoji;
    emotionIndicator.style.animation = `${effect.animation} 0.6s ease`;

    // 更新對話泡泡樣式
    const bubble = avatar.querySelector('.dialogue-bubble');
    bubble.style.backgroundColor = effect.bubbleColor;
    bubble.style.color = effect.textColor;
  }

  /**
   * 顯示動作提示
   */
  private showActionHint(characterId: string, action: string): void {
    const actionMap = {
      think: '🤔 (思考中...)',
      point: '👉',
      gesture: '🙌',
      nod: '👍',
      celebrate: '🎉'
    };

    const avatar = document.querySelector(`[data-character="${characterId}"]`);
    const actionHint = document.createElement('div');
    actionHint.className = 'action-hint';
    actionHint.textContent = actionMap[action];

    avatar.appendChild(actionHint);

    setTimeout(() => {
      actionHint.remove();
    }, 2000);
  }

  /**
   * 關鍵字高亮分段
   */
  private segmentTextWithHighlight(
    text: string,
    keywords?: string[]
  ): TextSegment[] {
    if (!keywords || keywords.length === 0) {
      return [{ text, isHighlight: false }];
    }

    const segments: TextSegment[] = [];
    let remainingText = text;

    // 將關鍵字按出現順序分段
    keywords.forEach(keyword => {
      const index = remainingText.indexOf(keyword);
      if (index !== -1) {
        // 關鍵字前的普通文字
        if (index > 0) {
          segments.push({
            text: remainingText.substring(0, index),
            isHighlight: false
          });
        }
        // 關鍵字本身
        segments.push({
          text: keyword,
          isHighlight: true
        });
        remainingText = remainingText.substring(index + keyword.length);
      }
    });

    // 剩餘文字
    if (remainingText) {
      segments.push({ text: remainingText, isHighlight: false });
    }

    return segments;
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 🎨 資產管理系統

### 統一資產配置檔

```json
// data/assets-config.json

{
  "version": "1.0",
  "assetMode": "emoji",  // "emoji" | "image" | "svg"

  "characters": {
    "aria": {
      "name": "Aria",
      "avatar": {
        "emoji": "🧙",
        "imageUrl": "/assets/characters/aria.png",
        "svgId": "character-aria"
      },
      "emotions": {
        "neutral": {
          "emoji": "🧙",
          "imageUrl": "/assets/characters/aria-neutral.png"
        },
        "confident": {
          "emoji": "🧙✨",
          "imageUrl": "/assets/characters/aria-confident.png"
        },
        "teaching": {
          "emoji": "🧙💡",
          "imageUrl": "/assets/characters/aria-teaching.png"
        }
      }
    },
    "mia": {
      "name": "Mia",
      "avatar": {
        "emoji": "☕",
        "imageUrl": "/assets/characters/mia.png"
      },
      "emotions": {
        "neutral": {
          "emoji": "☕",
          "imageUrl": "/assets/characters/mia-neutral.png"
        },
        "confused": {
          "emoji": "☕❓",
          "imageUrl": "/assets/characters/mia-confused.png"
        },
        "happy": {
          "emoji": "☕😊",
          "imageUrl": "/assets/characters/mia-happy.png"
        }
      }
    }
  },

  "ui": {
    "badges": {
      "first_quest": {
        "emoji": "🏆",
        "imageUrl": "/assets/badges/first-quest.png"
      }
    },
    "icons": {
      "star": {
        "emoji": "⭐",
        "imageUrl": "/assets/icons/star.png"
      }
    }
  }
}
```

### 資產管理器

```typescript
// js/core/asset-manager.ts

class AssetManager {
  private config: AssetsConfig;
  private mode: 'emoji' | 'image' | 'svg';
  private cache: Map<string, string> = new Map();

  async loadConfig(): Promise<void> {
    const response = await fetch('/data/assets-config.json');
    this.config = await response.json();
    this.mode = this.config.assetMode;
  }

  /**
   * 獲取角色頭像
   */
  getCharacterAvatar(characterId: string, emotion?: string): string {
    const character = this.config.characters[characterId];
    if (!character) return '👤'; // 預設頭像

    if (emotion && character.emotions[emotion]) {
      return this.resolveAsset(character.emotions[emotion]);
    }

    return this.resolveAsset(character.avatar);
  }

  /**
   * 獲取徽章圖示
   */
  getBadgeIcon(badgeId: string): string {
    const badge = this.config.ui.badges[badgeId];
    return badge ? this.resolveAsset(badge) : '🏆';
  }

  /**
   * 根據當前模式解析資產
   */
  private resolveAsset(asset: AssetDefinition): string {
    switch (this.mode) {
      case 'emoji':
        return asset.emoji;

      case 'image':
        // 預載圖片
        if (asset.imageUrl && !this.cache.has(asset.imageUrl)) {
          this.preloadImage(asset.imageUrl);
        }
        return asset.imageUrl || asset.emoji;

      case 'svg':
        return asset.svgId
          ? `<use href="#${asset.svgId}"></use>`
          : asset.emoji;

      default:
        return asset.emoji;
    }
  }

  /**
   * 預載圖片
   */
  private preloadImage(url: string): void {
    const img = new Image();
    img.onload = () => {
      this.cache.set(url, 'loaded');
    };
    img.src = url;
  }

  /**
   * 切換資產模式（Emoji ⇄ 圖片）
   */
  switchMode(mode: 'emoji' | 'image' | 'svg'): void {
    this.mode = mode;
    // 觸發全域重新渲染
    EventBus.emit('assets:mode-changed', mode);
  }

  /**
   * 批次預載資產
   */
  async preloadAssets(assetIds: string[]): Promise<void> {
    const promises = assetIds.map(id => {
      const asset = this.getAssetById(id);
      if (asset.imageUrl) {
        return this.preloadImage(asset.imageUrl);
      }
    });

    await Promise.all(promises);
  }
}

// 全域單例
export const Assets = new AssetManager();
```

### 在 JSON 中的使用方式

```json
{
  "dialogue": [
    {
      "speaker": "aria",  // ← 只需要 ID，頭像由 asset-manager 處理
      "text": "讓我示範給你看！",
      "emotion": "confident"  // ← 表情也自動對應資產
    }
  ]
}
```

---

## 🏆 成就事件系統

### 成就解鎖事件定義

```typescript
// js/types/achievement-events.ts

/**
 * 成就事件介面
 */
interface AchievementEvent {
  id: string;              // 成就 ID
  title: string;           // 成就名稱
  description: string;     // 成就描述
  icon: string;            // 圖示
  rarity: AchievementRarity;  // 稀有度
  reward: AchievementReward;  // 獎勵
  timestamp: number;       // 解鎖時間戳
}

/**
 * 成就稀有度
 */
enum AchievementRarity {
  COMMON = 'common',       // 普通 (白)
  RARE = 'rare',           // 稀有 (藍)
  EPIC = 'epic',           // 史詩 (紫)
  LEGENDARY = 'legendary'  // 傳說 (金)
}

/**
 * 成就獎勵
 */
interface AchievementReward {
  exp?: number;            // 經驗值
  title?: string;          // 稱號
  tool?: string;           // 解鎖工具
  badge?: string;          // 徽章
  certificate?: boolean;   // 證書
}

/**
 * 成就監聽器介面
 */
interface AchievementListener {
  onAchievementUnlock(event: AchievementEvent): void;
  onAchievementProgress?(achievementId: string, progress: number): void;
}
```

### 成就事件管理器

```typescript
// js/modules/achievement-manager.ts

class AchievementManager {
  private listeners: AchievementListener[] = [];
  private unlockedAchievements: Set<string> = new Set();
  private progressTrackers: Map<string, number> = new Map();

  /**
   * 註冊成就監聽器
   */
  addListener(listener: AchievementListener): void {
    this.listeners.push(listener);
  }

  /**
   * 移除監聽器
   */
  removeListener(listener: AchievementListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 解鎖成就
   */
  unlock(achievementId: string): void {
    // 防止重複解鎖
    if (this.unlockedAchievements.has(achievementId)) {
      return;
    }

    // 獲取成就資料
    const achievement = this.getAchievementData(achievementId);
    if (!achievement) {
      console.error(`Achievement not found: ${achievementId}`);
      return;
    }

    // 標記為已解鎖
    this.unlockedAchievements.add(achievementId);

    // 建立事件
    const event: AchievementEvent = {
      id: achievementId,
      title: achievement.title,
      description: achievement.description,
      icon: Assets.getBadgeIcon(achievementId),
      rarity: achievement.rarity,
      reward: achievement.reward,
      timestamp: Date.now()
    };

    // 儲存到 localStorage
    this.saveUnlockedAchievement(event);

    // 觸發所有監聽器
    this.notifyListeners(event);

    // 應用獎勵
    this.applyReward(event.reward);
  }

  /**
   * 通知所有監聽器
   */
  private notifyListeners(event: AchievementEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener.onAchievementUnlock(event);
      } catch (error) {
        console.error('Achievement listener error:', error);
      }
    });
  }

  /**
   * 檢查成就條件
   */
  checkCondition(achievementId: string, context: any): void {
    const achievement = this.getAchievementData(achievementId);
    if (!achievement) return;

    const condition = achievement.condition;

    // 根據不同條件類型檢查
    switch (condition.type) {
      case 'complete_level':
        if (context.levelId === condition.levelId) {
          this.unlock(achievementId);
        }
        break;

      case 'score_threshold':
        if (context.score >= condition.minScore) {
          this.unlock(achievementId);
        }
        break;

      case 'consecutive_scores':
        this.trackConsecutiveScores(achievementId, context.score, condition);
        break;

      case 'complete_world':
        if (context.worldId === condition.worldId && context.allComplete) {
          this.unlock(achievementId);
        }
        break;
    }
  }

  /**
   * 追蹤連續得分
   */
  private trackConsecutiveScores(
    achievementId: string,
    score: number,
    condition: any
  ): void {
    const current = this.progressTrackers.get(achievementId) || 0;

    if (score >= condition.minScore) {
      const newProgress = current + 1;
      this.progressTrackers.set(achievementId, newProgress);

      // 通知進度更新
      this.notifyProgress(achievementId, newProgress, condition.count);

      // 達成條件
      if (newProgress >= condition.count) {
        this.unlock(achievementId);
        this.progressTrackers.delete(achievementId);
      }
    } else {
      // 中斷連勝
      this.progressTrackers.set(achievementId, 0);
    }
  }

  /**
   * 通知進度更新
   */
  private notifyProgress(
    achievementId: string,
    current: number,
    total: number
  ): void {
    const progress = current / total;
    this.listeners.forEach(listener => {
      if (listener.onAchievementProgress) {
        listener.onAchievementProgress(achievementId, progress);
      }
    });
  }

  /**
   * 應用獎勵
   */
  private applyReward(reward: AchievementReward): void {
    if (reward.exp) {
      State.update('user.exp', State.current.user.exp + reward.exp);
    }

    if (reward.title) {
      State.update('user.title', reward.title);
    }

    if (reward.tool) {
      State.current.unlockedTools.push(reward.tool);
    }
  }

  private getAchievementData(id: string): any {
    // 從 data/achievements.json 載入
    return AchievementsData.find(a => a.id === id);
  }

  private saveUnlockedAchievement(event: AchievementEvent): void {
    const progress = Storage.loadProgress();
    progress.achievements.unlocked.push({
      id: event.id,
      unlockedAt: new Date(event.timestamp).toISOString()
    });
    Storage.saveProgress(progress);
  }
}

// 全域單例
export const Achievements = new AchievementManager();
```

### 煙火特效監聽器

```typescript
// js/modules/achievement-celebration.ts

class AchievementCelebration implements AchievementListener {
  private fireworksContainer: HTMLElement;

  constructor() {
    this.fireworksContainer = document.createElement('div');
    this.fireworksContainer.id = 'achievement-fireworks';
    document.body.appendChild(this.fireworksContainer);
  }

  /**
   * 成就解鎖回調
   */
  onAchievementUnlock(event: AchievementEvent): void {
    // 1. 播放音效
    this.playUnlockSound(event.rarity);

    // 2. 顯示成就卡片
    this.showAchievementCard(event);

    // 3. 觸發煙火特效
    this.launchFireworks(event.rarity);

    // 4. 儲存到成就牆
    this.addToAchievementWall(event);
  }

  /**
   * 進度更新回調
   */
  onAchievementProgress(achievementId: string, progress: number): void {
    // 顯示進度提示
    Toast.show(`成就進度：${Math.round(progress * 100)}%`, 'info');
  }

  /**
   * 播放解鎖音效
   */
  private playUnlockSound(rarity: AchievementRarity): void {
    const soundMap = {
      common: 'achievement_unlock',
      rare: 'achievement_rare',
      epic: 'achievement_epic',
      legendary: 'achievement_legendary'
    };

    AudioManager.play(soundMap[rarity]);
  }

  /**
   * 顯示成就卡片（模態）
   */
  private showAchievementCard(event: AchievementEvent): void {
    const modal = document.createElement('div');
    modal.className = `achievement-modal rarity-${event.rarity}`;
    modal.innerHTML = `
      <div class="achievement-card">
        <div class="achievement-glow"></div>
        <div class="achievement-icon">${event.icon}</div>
        <h2 class="achievement-title">${event.title}</h2>
        <p class="achievement-description">${event.description}</p>
        <div class="achievement-reward">
          ${this.formatReward(event.reward)}
        </div>
        <button class="achievement-close">太棒了！</button>
      </div>
    `;

    document.body.appendChild(modal);

    // 動畫進場
    setTimeout(() => modal.classList.add('show'), 10);

    // 關閉按鈕
    modal.querySelector('.achievement-close').addEventListener('click', () => {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
    });
  }

  /**
   * 煙火特效
   */
  private launchFireworks(rarity: AchievementRarity): void {
    const count = this.getFireworkCount(rarity);
    const colors = this.getRarityColors(rarity);

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this.createFirework(colors);
      }, i * 200);
    }
  }

  /**
   * 建立單個煙火
   */
  private createFirework(colors: string[]): void {
    const firework = document.createElement('div');
    firework.className = 'firework';

    // 隨機位置
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * (window.innerHeight * 0.6);

    firework.style.left = `${x}px`;
    firework.style.top = `${y}px`;

    // 隨機顏色
    const color = colors[Math.floor(Math.random() * colors.length)];
    firework.style.setProperty('--firework-color', color);

    this.fireworksContainer.appendChild(firework);

    // 2 秒後移除
    setTimeout(() => firework.remove(), 2000);
  }

  /**
   * 根據稀有度決定煙火數量
   */
  private getFireworkCount(rarity: AchievementRarity): number {
    const countMap = {
      common: 3,
      rare: 5,
      epic: 8,
      legendary: 12
    };
    return countMap[rarity];
  }

  /**
   * 稀有度顏色
   */
  private getRarityColors(rarity: AchievementRarity): string[] {
    const colorMap = {
      common: ['#BDC3C7', '#ECF0F1'],
      rare: ['#3498DB', '#5DADE2'],
      epic: ['#9B59B6', '#BB8FCE'],
      legendary: ['#F1C40F', '#F39C12', '#E74C3C']
    };
    return colorMap[rarity];
  }

  private formatReward(reward: AchievementReward): string {
    const parts = [];
    if (reward.exp) parts.push(`✨ ${reward.exp} EXP`);
    if (reward.title) parts.push(`🏅 稱號：${reward.title}`);
    if (reward.tool) parts.push(`🛠️ 解鎖工具`);
    return parts.join(' | ');
  }

  private addToAchievementWall(event: AchievementEvent): void {
    // 將成就加到成就牆展示區
    EventBus.emit('achievement:unlocked', event);
  }
}

// 註冊監聽器
Achievements.addListener(new AchievementCelebration());
```

### 使用範例

```typescript
// 在關卡完成時檢查成就
function onLevelComplete(levelId: string, score: number) {
  // 檢查「完成第一關」成就
  Achievements.checkCondition('first_quest', { levelId });

  // 檢查「完美分數」成就
  Achievements.checkCondition('perfect_score', { score });

  // 檢查「連勝」成就
  Achievements.checkCondition('win_streak_3', { score });
}

// 在世界完成時檢查
function onWorldComplete(worldId: number) {
  Achievements.checkCondition('world_1_complete', {
    worldId,
    allComplete: true
  });
}
```

---

## 🎯 完整整合範例

### 關卡 JSON 最終版本

```json
{
  "id": "1-1",
  "version": "1.0",
  "title": "關鍵字優化基礎",

  "config": {
    "timeLimit": null,
    "allowRetry": true,
    "maxAttempts": null
  },

  "assets": [
    {
      "type": "character",
      "ids": ["aria", "mia"]
    }
  ],

  "phases": {
    "demo": {
      "presentation": {
        "autoPlay": true,
        "skipable": true,
        "bgMusic": "calm_teaching"
      },
      "dialogue": [
        {
          "speaker": "mia",
          "text": "我不知道要用什麼關鍵字...",
          "emotion": "confused",
          "delay": 50,
          "pause": 500,
          "action": "think"
        },
        {
          "speaker": "aria",
          "text": "讓我示範給你看！",
          "emotion": "confident",
          "delay": 40,
          "pause": 300,
          "action": "point",
          "sfx": "magic_sparkle"
        }
      ]
    },

    "practice": {
      "hints": [
        {
          "trigger": "stuck_for_2_minutes",
          "text": "💡 試試在開頭使用主要關鍵字",
          "cooldown": 60
        }
      ],
      "validationRules": [
        {
          "type": "keyword_density",
          "keyword": "primaryKeyword",
          "min": 1.5,
          "max": 2.5,
          "errorMsg": "關鍵字密度應在 1.5-2.5% 之間"
        }
      ]
    },

    "scoring": {
      "feedback": {
        "ranges": [
          {
            "min": 95,
            "grade": "excellent",
            "reactionText": "太神了！你已經掌握精髓了！🌟",
            "npcEmotion": "excited"
          }
        ]
      }
    },

    "levelup": {
      "achievements": [
        {
          "id": "first_quest_complete",
          "condition": "complete_first_level"
        }
      ]
    }
  }
}
```

---

## 📚 相關檔案

- [DATA-STRUCTURE.md](../DATA-STRUCTURE.md) - 基礎資料結構
- [STRUCTURE.md](../STRUCTURE.md) - 整體架構說明

---

**最後更新**：2026-02-12
**作者**：Claude + 小玫瑰
