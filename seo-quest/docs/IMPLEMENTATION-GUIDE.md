# SEO Quest — 實作指南

> 整合所有優化建議的完整實作規範
> 更新日期：2026-02-12

---

## 📋 目錄

- [建議總覽](#建議總覽)
- [開發者體驗強化（新增）](#開發者體驗強化新增)
- [優先級分類](#優先級分類)
- [技術實作規範](#技術實作規範)
- [UI/UX 增強](#uiux-增強)
- [瀏覽器相容性](#瀏覽器相容性)

---

## 📊 建議總覽

### A. 架構層級建議

| # | 類別 | 建議項目 | 來源 | 優先級 |
|---|------|---------|------|--------|
| 1 | 安全性 | 公式字串化改為 Calculator ID 系統 | Gemini (Variation B) | 🔴 P0 必須 |
| 2 | 型別安全 | 使用 Zod 進行 JSON Schema 驗證 | Gemini (Variation B) | 🔴 P0 必須 |
| 3 | 狀態管理 | 分離持久化數據與計算數據 | Gemini (Variation B) | 🔴 P0 必須 |
| 4 | 階段系統 | 改用 Array 結構支援彈性順序 | Gemini (Variation A) | 🟠 P1 重要 |
| 5 | 狀態機 | 使用 FSM 管理階段流轉 | Gemini (Variation B) | 🟠 P1 重要 |

### B. 功能層級建議

| # | 類別 | 建議項目 | 來源 | 優先級 |
|---|------|---------|------|--------|
| 6 | 對話系統 | 增加 emotion、delay、action 欄位 | User Request | 🟠 P1 重要 |
| 7 | 資產管理 | 統一 Asset 配置檔（Emoji ⇄ 圖片） | User Request | 🟠 P1 重要 |
| 8 | 成就系統 | Event Listener + 煙火特效 | User Request | 🟡 P2 建議 |
| 9 | 評分引擎 | 模組化為獨立的純函數 | Gemini (Variation B) | 🟠 P1 重要 |
| 10 | 資料同步 | StorageManager 版本遷移機制 | Gemini (Variation B) | 🟠 P1 重要 |

### C. UI/UX 層級建議

| # | 類別 | 建議項目 | 來源 | 優先級 |
|---|------|---------|------|--------|
| 11 | 轉場動畫 | 階段間全螢幕轉場（捲軸、地圖移動） | Gemini (寶寶吉伊) | 🟡 P2 建議 |
| 12 | 評分視覺化 | 動態儀表板、數字跳動、慶祝特效 | Gemini (寶寶吉伊) | 🟡 P2 建議 |
| 13 | 互動地圖 | 彩色/灰色關卡、懸停預覽 | Gemini (寶寶吉伊) | 🟡 P2 建議 |
| 14 | 提示系統 | 卡關時的漸進式提示 | Gemini (Variation A) | 🟢 P3 優化 |
| 15 | 情感回饋 | NPC 反應文字（reaction_text） | Gemini (Variation A) | 🟢 P3 優化 |

### D. 技術文件建議

| # | 類別 | 建議項目 | 來源 | 優先級 |
|---|------|---------|------|--------|
| 16 | 相容性說明 | 瀏覽器最低版本需求 | Gemini (探員兔兔) | 🟠 P1 重要 |
| 17 | JSON 載入 | CORS 與路徑參照說明 | Gemini (探員兔兔) | 🟠 P1 重要 |
| 18 | CSS 變數 | 雙層變數架構（Primitive + Semantic） | Gemini (Variation B) | 🟡 P2 建議 |
| 19 | 響應式 | 整合到元件內而非獨立檔案 | Gemini (Variation B) | 🟢 P3 優化 |

---

## 🔧 開發者體驗強化（新增）

> **來源**：Gemini 第二輪架構建議（透過嚕嚕主人傳達）
> **更新日期**：2026-02-12

### E. 全域配置與錯誤處理

| # | 類別 | 建議項目 | 優先級 |
|---|------|---------|--------|
| 20 | 配置管理 | GameConfig 集中管理靜態變數與遊戲參數 | 🔴 P0 必須 |
| 21 | 錯誤處理 | ErrorBoundary 全域錯誤攔截 | 🔴 P0 必須 |
| 22 | 效能優化 | ResourceLoader 資源預載入 | 🟠 P1 重要 |

### F. 程式碼品質與架構

| # | 類別 | 建議項目 | 優先級 |
|---|------|---------|--------|
| 23 | 事件系統 | EventBus 嚴謹的 Pub/Sub 架構 | 🔴 P0 必須 |
| 24 | 型別文件 | JSDoc 完整型別註釋 | 🟠 P1 重要 |
| 25 | 效能優化 | Dynamic Import 動態載入模組 | 🟠 P1 重要 |
| 26 | 狀態管理 | Store Pattern (Redux-like) | 🔴 P0 必須 |
| 27 | CSS 架構 | Palette + Semantic 雙層變數 | 🟠 P1 重要 |

---

## 🎯 優先級分類

### 🔴 P0 - 必須實作（架構基礎）

#### 1. Calculator ID 系統
```typescript
// ✅ 已設計完成
enum ScoringAlgorithmId {
  KEYWORD_DENSITY = 'KEYWORD_DENSITY_CALC',
  FLESCH_READING_EASE = 'FLESCH_READING_EASE_CALC',
  // ...
}

class ScoringCalculator {
  calculate(algorithmId, content, params): AlgorithmResult
}
```

**實作檔案**：
- `js/types/scoring-algorithms.ts`
- `js/modules/scoring-calculator.ts`
- 參考：`TECHNICAL-OPTIMIZATION.md`

---

#### 2. Zod Schema 驗證
```typescript
// ✅ 已設計完成
import { z } from 'zod';

const LevelDataSchema = z.object({
  id: z.string(),
  version: z.string(),
  phases: z.array(PhaseSchema),
  // ...
});
```

**實作檔案**：
- `js/schemas/level-schema.ts`
- 參考：`TECHNICAL-OPTIMIZATION.md`

---

#### 3. 狀態正規化
```typescript
// ✅ 已設計完成
interface UserPersistedData {
  level: number;
  exp: number;
  // 只存必要數據
}

interface UserComputedData {
  nextLevelExp: number;  // 計算而來
  expProgress: number;
  // ...
}
```

**實作檔案**：
- `js/types/user-state.ts`
- `js/core/user-state-manager.ts`
- 參考：`TECHNICAL-OPTIMIZATION.md`

---

### 🟠 P1 - 重要功能（核心體驗）

#### 4. 有限狀態機（FSM）

**需求**：管理階段流轉，防止跳關或逆向操作

```typescript
// js/core/phase-state-machine.ts

enum PhaseState {
  TUTORIAL = 'tutorial',
  DEMO = 'demo',
  PRACTICE = 'practice',
  SCORE = 'score',
  LEVELUP = 'levelup'
}

enum PhaseEvent {
  NEXT = 'NEXT',
  PREVIOUS = 'PREVIOUS',
  JUMP = 'JUMP',
  RESET = 'RESET'
}

interface StateTransition {
  from: PhaseState;
  event: PhaseEvent;
  to: PhaseState;
  guard?: () => boolean;  // 條件檢查
}

class PhaseStateMachine {
  private currentState: PhaseState;
  private transitions: StateTransition[];
  private stateHistory: PhaseState[] = [];

  constructor(initialState: PhaseState) {
    this.currentState = initialState;
    this.transitions = this.defineTransitions();
  }

  /**
   * 定義狀態轉換規則
   */
  private defineTransitions(): StateTransition[] {
    return [
      // Tutorial → Demo（下一步）
      {
        from: PhaseState.TUTORIAL,
        event: PhaseEvent.NEXT,
        to: PhaseState.DEMO
      },

      // Demo → Practice（下一步）
      {
        from: PhaseState.DEMO,
        event: PhaseEvent.NEXT,
        to: PhaseState.PRACTICE
      },

      // Practice → Score（下一步，需完成作答）
      {
        from: PhaseState.PRACTICE,
        event: PhaseEvent.NEXT,
        to: PhaseState.SCORE,
        guard: () => this.hasCompletedPractice()
      },

      // Score → Levelup（下一步）
      {
        from: PhaseState.SCORE,
        event: PhaseEvent.NEXT,
        to: PhaseState.LEVELUP
      },

      // 允許返回上一步（但不能跳關）
      {
        from: PhaseState.DEMO,
        event: PhaseEvent.PREVIOUS,
        to: PhaseState.TUTORIAL
      },

      {
        from: PhaseState.PRACTICE,
        event: PhaseEvent.PREVIOUS,
        to: PhaseState.DEMO
      }

      // 注意：不允許從 Score 返回 Practice（防止重複刷分）
      // 注意：不允許跳關（防止破壞學習流程）
    ];
  }

  /**
   * 嘗試轉換狀態
   */
  transition(event: PhaseEvent): boolean {
    const transition = this.transitions.find(t =>
      t.from === this.currentState && t.event === event
    );

    if (!transition) {
      console.warn(`Invalid transition: ${this.currentState} + ${event}`);
      return false;
    }

    // 檢查 guard 條件
    if (transition.guard && !transition.guard()) {
      console.warn(`Guard failed for: ${this.currentState} → ${transition.to}`);
      return false;
    }

    // 記錄歷史
    this.stateHistory.push(this.currentState);

    // 執行轉換
    this.currentState = transition.to;

    // 觸發事件
    this.onStateChange(transition.to);

    return true;
  }

  /**
   * 狀態變更回調
   */
  private onStateChange(newState: PhaseState): void {
    console.log(`Phase transition: → ${newState}`);
    EventBus.emit('phase:changed', newState);
  }

  /**
   * 獲取當前狀態
   */
  getState(): PhaseState {
    return this.currentState;
  }

  /**
   * 檢查是否可以執行某個事件
   */
  canTransition(event: PhaseEvent): boolean {
    const transition = this.transitions.find(t =>
      t.from === this.currentState && t.event === event
    );

    if (!transition) return false;
    if (transition.guard) return transition.guard();

    return true;
  }

  /**
   * 重置狀態
   */
  reset(initialState: PhaseState = PhaseState.TUTORIAL): void {
    this.currentState = initialState;
    this.stateHistory = [];
  }

  // Guard 函數
  private hasCompletedPractice(): boolean {
    // 檢查是否已提交作品
    return State.current.practiceCompleted === true;
  }
}

// 使用範例
const fsm = new PhaseStateMachine(PhaseState.TUTORIAL);

// 嘗試下一步
if (fsm.canTransition(PhaseEvent.NEXT)) {
  fsm.transition(PhaseEvent.NEXT);
} else {
  Toast.show('請先完成當前階段', 'warning');
}
```

**實作檔案**：
- `js/core/phase-state-machine.ts`
- `js/types/phase-states.ts`

**整合到**：
- `js/core/router.js` - 使用 FSM 管理階段切換

---

#### 5. 評分引擎模組化

```typescript
// js/services/scoring-service.ts

/**
 * 純函數：關鍵字密度計算
 */
export function calculateKeywordDensity(
  content: string,
  keyword: string
): number {
  const totalWords = content.split(/\s+/).length;
  const regex = new RegExp(keyword, 'gi');
  const keywordCount = (content.match(regex) || []).length;

  return (keywordCount / totalWords) * 100;
}

/**
 * 純函數：可讀性計算（Flesch）
 */
export function calculateFleschReadingEase(content: string): number {
  const sentences = content.split(/[。！？.!?]+/).filter(s => s.trim()).length;
  const words = content.split(/\s+/).length;
  const syllables = content.replace(/\s+/g, '').length;

  const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  return Math.max(0, Math.min(100, score));
}

/**
 * 純函數：平均句長計算
 */
export function calculateAverageSentenceLength(content: string): number {
  const sentences = content.split(/[。！？.!?]+/).filter(s => s.trim());
  const totalWords = content.split(/\s+/).length;

  return totalWords / sentences.length;
}

/**
 * 評分服務類別
 */
export class ScoringService {
  /**
   * 執行完整評分
   */
  score(content: string, criteria: ScoringCriteria): ScoringResult {
    const scores: Record<string, number> = {};

    // 關鍵字優化
    if (criteria.keywordOptimization) {
      scores.keywordOptimization = this.scoreKeywordOptimization(
        content,
        criteria.keywordOptimization
      );
    }

    // 可讀性
    if (criteria.readability) {
      scores.readability = this.scoreReadability(content);
    }

    // 結構清晰度
    if (criteria.structure) {
      scores.structure = this.scoreStructure(content);
    }

    // 加權計算總分
    const totalScore = this.calculateWeightedScore(scores, criteria.weights);

    return {
      totalScore,
      breakdown: scores,
      grade: this.getGrade(totalScore),
      suggestions: this.generateSuggestions(scores, content)
    };
  }

  /**
   * 關鍵字優化評分
   */
  private scoreKeywordOptimization(
    content: string,
    config: KeywordConfig
  ): number {
    const density = calculateKeywordDensity(content, config.primaryKeyword);

    // 理想密度：1.5-2.5%
    if (density >= 1.5 && density <= 2.5) {
      return 100;
    } else if (density < 1.5) {
      return Math.max(0, 100 - (1.5 - density) * 30);
    } else {
      return Math.max(0, 100 - (density - 2.5) * 40);
    }
  }

  /**
   * 可讀性評分
   */
  private scoreReadability(content: string): number {
    const fleschScore = calculateFleschReadingEase(content);
    const avgLength = calculateAverageSentenceLength(content);

    // 可讀性分數
    let score = fleschScore * 0.6;

    // 句長懲罰/獎勵
    if (avgLength >= 12 && avgLength <= 20) {
      score += 40;  // 理想句長
    } else if (avgLength < 12) {
      score += 40 - (12 - avgLength) * 5;
    } else {
      score += 40 - (avgLength - 20) * 3;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 結構評分
   */
  private scoreStructure(content: string): number {
    let score = 0;

    // 是否有標題
    if (content.match(/^【.+】/)) {
      score += 30;
    }

    // 段落分明（檢查換行）
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    if (paragraphs.length >= 2) {
      score += 40;
    }

    // 使用列點或數字
    if (content.match(/^[0-9]\.|\n[0-9]\./m) || content.match(/^[-•]\s/m)) {
      score += 30;
    }

    return score;
  }

  /**
   * 加權計算
   */
  private calculateWeightedScore(
    scores: Record<string, number>,
    weights: Record<string, number>
  ): number {
    let totalScore = 0;
    let totalWeight = 0;

    Object.keys(scores).forEach(key => {
      const weight = weights[key] || 0;
      totalScore += scores[key] * (weight / 100);
      totalWeight += weight;
    });

    return Math.round(totalScore / (totalWeight / 100));
  }

  /**
   * 評級
   */
  private getGrade(score: number): string {
    if (score >= 95) return 'excellent';
    if (score >= 85) return 'good';
    if (score >= 75) return 'pass';
    if (score >= 65) return 'need_improve';
    return 'fail';
  }

  /**
   * 生成建議
   */
  private generateSuggestions(
    scores: Record<string, number>,
    content: string
  ): string[] {
    const suggestions: string[] = [];

    if (scores.keywordOptimization < 80) {
      const density = calculateKeywordDensity(content, '主關鍵字');
      if (density < 1.5) {
        suggestions.push('關鍵字密度偏低，建議增加 1-2 次主關鍵字');
      } else {
        suggestions.push('關鍵字密度過高，建議降低使用次數');
      }
    }

    if (scores.readability < 70) {
      suggestions.push('句子偏長，建議拆分為較短的句子');
    }

    if (scores.structure < 60) {
      suggestions.push('建議使用標題、列點或數字來組織內容');
    }

    return suggestions;
  }
}
```

**實作檔案**：
- `js/services/scoring-service.ts`
- `js/utils/text-analysis.ts`（純函數）

---

#### 6. StorageManager 版本遷移

```typescript
// js/core/storage-manager.ts

interface StorageSchema {
  version: string;
  data: any;
}

interface Migration {
  from: string;
  to: string;
  migrate: (oldData: any) => any;
}

class StorageManager {
  private readonly STORAGE_KEY = 'seo_quest_user';
  private readonly CURRENT_VERSION = '1.2';
  private migrations: Migration[] = [];

  constructor() {
    this.registerMigrations();
  }

  /**
   * 註冊所有遷移規則
   */
  private registerMigrations(): void {
    // v1.0 → v1.1：新增 settings 欄位
    this.addMigration('1.0', '1.1', (oldData) => {
      return {
        ...oldData,
        settings: {
          mode: 'tutorial',
          soundEnabled: true,
          animationEnabled: true,
          hintsEnabled: true
        }
      };
    });

    // v1.1 → v1.2：completedLevels 結構改變
    this.addMigration('1.1', '1.2', (oldData) => {
      return {
        ...oldData,
        completedLevels: oldData.completedLevels.map((level: any) => ({
          id: level.levelId || level.id,
          completedAt: level.completedAt,
          score: level.score,
          grade: this.getGradeFromScore(level.score),
          attempts: level.attempts || 1,
          expGained: level.exp || 0
        }))
      };
    });
  }

  /**
   * 新增遷移規則
   */
  private addMigration(from: string, to: string, migrateFn: (data: any) => any): void {
    this.migrations.push({ from, to, migrate: migrateFn });
  }

  /**
   * 載入資料（自動遷移）
   */
  load(): UserPersistedData {
    const rawData = localStorage.getItem(this.STORAGE_KEY);

    if (!rawData) {
      return this.createDefaultData();
    }

    try {
      const schema: StorageSchema = JSON.parse(rawData);

      // 檢查版本
      if (schema.version === this.CURRENT_VERSION) {
        return schema.data;
      }

      // 需要遷移
      console.log(`Migrating data from ${schema.version} to ${this.CURRENT_VERSION}`);
      const migratedData = this.migrate(schema.data, schema.version);

      // 儲存遷移後的資料
      this.save(migratedData);

      return migratedData;
    } catch (error) {
      console.error('Failed to load data:', error);
      return this.createDefaultData();
    }
  }

  /**
   * 儲存資料
   */
  save(data: UserPersistedData): void {
    const schema: StorageSchema = {
      version: this.CURRENT_VERSION,
      data
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(schema));
  }

  /**
   * 執行遷移
   */
  private migrate(data: any, fromVersion: string): UserPersistedData {
    let currentData = data;
    let currentVersion = fromVersion;

    // 找出需要執行的遷移路徑
    const path = this.findMigrationPath(fromVersion, this.CURRENT_VERSION);

    if (!path) {
      throw new Error(`No migration path from ${fromVersion} to ${this.CURRENT_VERSION}`);
    }

    // 依序執行遷移
    path.forEach(migration => {
      console.log(`  Applying migration ${migration.from} → ${migration.to}`);
      currentData = migration.migrate(currentData);
      currentVersion = migration.to;
    });

    return currentData;
  }

  /**
   * 找出遷移路徑
   */
  private findMigrationPath(from: string, to: string): Migration[] | null {
    const path: Migration[] = [];
    let current = from;

    while (current !== to) {
      const migration = this.migrations.find(m => m.from === current);

      if (!migration) {
        return null;  // 找不到路徑
      }

      path.push(migration);
      current = migration.to;

      // 防止無限迴圈
      if (path.length > 10) {
        console.error('Migration path too long');
        return null;
      }
    }

    return path;
  }

  /**
   * 建立預設資料
   */
  private createDefaultData(): UserPersistedData {
    return {
      level: 1,
      exp: 0,
      title: 'SEO 新手',
      currentWorld: 1,
      currentLevel: '1-1',
      currentPhase: 'tutorial',
      completedLevels: [],
      unlockedAchievements: [],
      unlockedTools: [],
      unlockedNotes: [],
      totalAttempts: 0,
      totalCompleted: 0,
      scoreHistory: [],
      settings: {
        mode: 'tutorial',
        soundEnabled: true,
        animationEnabled: true,
        hintsEnabled: true,
        difficulty: 'normal'
      },
      createdAt: new Date().toISOString(),
      lastPlayedAt: new Date().toISOString()
    };
  }

  /**
   * 清除資料
   */
  clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * 匯出資料（備份）
   */
  export(): string {
    const data = this.load();
    return JSON.stringify(data, null, 2);
  }

  /**
   * 匯入資料（還原）
   */
  import(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      this.save(data);
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  private getGradeFromScore(score: number): string {
    if (score >= 95) return 'excellent';
    if (score >= 85) return 'good';
    if (score >= 75) return 'pass';
    return 'need_improve';
  }
}

// 全域單例
export const Storage = new StorageManager();
```

**實作檔案**：
- `js/core/storage-manager.ts`

---

## 🌐 瀏覽器相容性

### 最低需求

```markdown
**瀏覽器相容性需求**：

本專案使用 ES6+ 與 ES Modules，需要支援以下特性的現代瀏覽器：

- ✅ Chrome 90+ (2021)
- ✅ Edge 90+ (2021)
- ✅ Safari 14+ (2020)
- ✅ Firefox 90+ (2021)

**不支援**：
- ❌ Internet Explorer (任何版本)
- ❌ Chrome < 90
- ❌ Safari < 14

**檢測方式**：

```javascript
// js/utils/browser-check.js

function checkBrowserCompatibility(): boolean {
  // 檢查 ES Modules 支援
  if (!('noModule' in document.createElement('script'))) {
    return false;
  }

  // 檢查其他必要特性
  const requiredFeatures = [
    'Promise',
    'fetch',
    'Map',
    'Set',
    'Array.prototype.find',
    'Object.assign'
  ];

  return requiredFeatures.every(feature => {
    return typeof eval(feature) !== 'undefined';
  });
}

// 在載入時檢查
if (!checkBrowserCompatibility()) {
  document.body.innerHTML = `
    <div style="padding: 40px; text-align: center;">
      <h1>⚠️ 瀏覽器版本過舊</h1>
      <p>本網站需要現代瀏覽器才能正常運作。</p>
      <p>請更新至以下版本：</p>
      <ul style="list-style: none;">
        <li>Chrome 90+</li>
        <li>Edge 90+</li>
        <li>Safari 14+</li>
        <li>Firefox 90+</li>
      </ul>
    </div>
  `;
}
```

---

## 📦 JSON 載入處理

### CORS 與路徑處理

```typescript
// js/core/json-loader.ts

class JSONLoader {
  private baseURL: string;

  constructor() {
    // 自動偵測環境
    this.baseURL = this.detectBaseURL();
  }

  /**
   * 偵測基礎 URL
   */
  private detectBaseURL(): string {
    // 檢查是否為 file:// 協定
    if (window.location.protocol === 'file:') {
      console.warn('Running on file:// protocol. Some features may not work.');
      // 使用相對路徑
      return '.';
    }

    // 檢查是否為本地伺服器
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return window.location.origin;
    }

    // 生產環境
    return 'https://lab.helloruru.com/seo-quest';
  }

  /**
   * 載入 JSON
   */
  async load<T>(path: string): Promise<T> {
    const url = `${this.baseURL}/${path}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Failed to load JSON from ${url}:`, error);

      // 提供友善的錯誤訊息
      if (window.location.protocol === 'file:') {
        throw new Error(
          'JSON 載入失敗：請使用 HTTP Server 開啟本專案，不支援 file:// 協定。' +
          '\n建議：執行 "python -m http.server 8000" 或 "npx serve"'
        );
      }

      throw error;
    }
  }

  /**
   * 批次載入
   */
  async loadBatch<T>(paths: string[]): Promise<T[]> {
    const promises = paths.map(path => this.load<T>(path));
    return Promise.all(promises);
  }

  /**
   * 載入關卡
   */
  async loadLevel(levelId: string): Promise<LevelData> {
    const [world, level] = levelId.split('-');
    const path = `data/levels/world-${world}/${levelId}.json`;

    return this.load<LevelData>(path);
  }

  /**
   * 載入配置
   */
  async loadConfig(configName: string): Promise<any> {
    return this.load(`data/${configName}.json`);
  }
}

// 全域單例
export const JSONLoader = new JSONLoader();
```

**使用方式**：

```typescript
// 載入關卡
const levelData = await JSONLoader.loadLevel('1-1');

// 載入配置
const assetsConfig = await JSONLoader.loadConfig('assets-config');
const achievementsData = await JSONLoader.loadConfig('achievements');
```

---

## 🚀 開發者體驗強化實作

> 以下為 Gemini 第二輪建議的完整實作規範

---

### 🎮 建議 #20：GameConfig 集中管理

**目的**：將所有靜態變數與遊戲參數集中管理，避免散落在各處

```typescript
// js/config/game-config.js

/**
 * SEO Quest 遊戲配置
 *
 * 此檔案包含：
 * 1. 靜態常數（不會改變）
 * 2. 遊戲參數（可調整但不需修改邏輯）
 */

export const GameConfig = {
  // ==================== 專案資訊 ====================
  meta: {
    name: 'SEO Quest',
    version: '1.0.0',
    author: 'Kaoru Tsai (Hello Ruru)',
    deployURL: 'https://lab.helloruru.com/seo-quest/',
    repository: 'https://github.com/helloruru/seo-quest'
  },

  // ==================== 儲存配置 ====================
  storage: {
    key: 'seo_quest_user',
    version: '1.2',
    autoSaveInterval: 30000  // 30 秒自動儲存
  },

  // ==================== 等級系統 ====================
  level: {
    maxLevel: 10,
    expFormula: (level: number) => Math.floor(500 * Math.pow(1.5, level - 1)),
    titles: {
      1: 'SEO 新手',
      2: 'SEO 見習生',
      3: 'SEO 實習生',
      5: 'SEO 專員',
      8: 'SEO 專家',
      10: 'SEO 大師'
    }
  },

  // ==================== 評分系統 ====================
  scoring: {
    weights: {
      keywordOptimization: 30,  // 關鍵字優化
      keywordUsage: 30,          // 關鍵字使用
      contentQuality: 40         // 內容品質
    },
    grades: {
      excellent: { min: 95, stars: 5, color: '#FFD700' },
      good: { min: 85, stars: 4, color: '#4CAF50' },
      pass: { min: 75, stars: 3, color: '#2196F3' },
      needImprove: { min: 65, stars: 2, color: '#FF9800' },
      fail: { min: 0, stars: 1, color: '#F44336' }
    },
    idealKeywordDensity: { min: 1.5, max: 2.5 },  // %
    idealSentenceLength: { min: 12, max: 20 }     // 字數
  },

  // ==================== UI/UX 參數 ====================
  ui: {
    // 打字機效果速度（毫秒/字）
    typewriterSpeed: {
      slow: 100,
      normal: 50,
      fast: 20,
      instant: 0
    },

    // 動畫持續時間（毫秒）
    animation: {
      phaseTransition: 1000,    // 階段轉場
      levelUpCelebration: 2000, // 升級慶祝
      scoreCountUp: 1500,       // 分數數字跳動
      toastDuration: 3000,      // Toast 顯示時間
      dialoguePause: 800        // 對話間隔
    },

    // 轉場效果開關
    transitions: {
      scrollUnroll: true,       // Tutorial → Demo
      mapMovement: true,        // Demo → Practice
      cardFlip: true,           // Practice → Score
      spotlight: true,          // Score → Levelup
      particles: true           // 煙火特效
    },

    // 音效開關（未來擴充）
    sound: {
      enabled: true,
      volume: 0.7,
      effects: {
        click: true,
        typewriter: true,
        achievement: true,
        levelup: true
      }
    },

    // 提示系統
    hints: {
      enabled: true,
      showAfterAttempts: 2,     // 失敗 2 次後顯示提示
      progressiveReveal: true   // 漸進式揭露
    }
  },

  // ==================== 資源預載入 ====================
  preload: {
    critical: [
      'data/levels/world-1/1-1.json',
      'data/assets-config.json',
      'data/characters.json'
    ],
    images: {
      enabled: false,  // 預設使用 Emoji
      lazyLoad: true
    },
    showProgressBar: true
  },

  // ==================== 效能參數 ====================
  performance: {
    debounceDelay: 300,         // 搜尋防抖（毫秒）
    throttleDelay: 100,         // 滾動節流（毫秒）
    maxHistoryLength: 50,       // 最大歷史記錄
    cacheExpiration: 3600000    // 快取過期時間（1 小時）
  },

  // ==================== 開發模式 ====================
  dev: {
    debug: false,               // 開啟 console.log
    skipTransitions: false,     // 跳過動畫（測試用）
    unlockAllLevels: false,     // 解鎖所有關卡
    mockScoring: false,         // 模擬評分（固定 85 分）
    showStateInUI: false        // 在 UI 顯示狀態（debug）
  },

  // ==================== API 端點（未來擴充）====================
  api: {
    baseURL: '',                // 目前純前端，無 API
    timeout: 5000,              // 請求超時
    retryAttempts: 3            // 重試次數
  }
};

// ==================== 輔助函數 ====================

/**
 * 獲取下一等級所需經驗值
 */
export function getNextLevelExp(currentLevel: number): number {
  return GameConfig.level.expFormula(currentLevel + 1);
}

/**
 * 獲取當前等級稱號
 */
export function getLevelTitle(level: number): string {
  const titles = GameConfig.level.titles;

  // 找到最接近的稱號
  const availableLevels = Object.keys(titles)
    .map(Number)
    .sort((a, b) => a - b);

  for (let i = availableLevels.length - 1; i >= 0; i--) {
    if (level >= availableLevels[i]) {
      return titles[availableLevels[i]];
    }
  }

  return titles[1];  // 預設新手
}

/**
 * 獲取評級資訊
 */
export function getGradeInfo(score: number): GradeInfo {
  const grades = GameConfig.scoring.grades;

  if (score >= grades.excellent.min) return { ...grades.excellent, name: 'excellent' };
  if (score >= grades.good.min) return { ...grades.good, name: 'good' };
  if (score >= grades.pass.min) return { ...grades.pass, name: 'pass' };
  if (score >= grades.needImprove.min) return { ...grades.needImprove, name: 'needImprove' };
  return { ...grades.fail, name: 'fail' };
}

/**
 * 檢查關鍵字密度是否理想
 */
export function isIdealKeywordDensity(density: number): boolean {
  const { min, max } = GameConfig.scoring.idealKeywordDensity;
  return density >= min && density <= max;
}

// ==================== 型別定義 ====================

interface GradeInfo {
  name: string;
  min: number;
  stars: number;
  color: string;
}
```

**使用範例**：

```typescript
// 其他模組中使用
import { GameConfig, getNextLevelExp, getLevelTitle } from './config/game-config.js';

// 獲取打字機速度
const speed = GameConfig.ui.typewriterSpeed.normal;

// 獲取下一等級經驗值
const nextExp = getNextLevelExp(player.level);

// 獲取稱號
const title = getLevelTitle(player.level);

// 檢查是否開啟 debug 模式
if (GameConfig.dev.debug) {
  console.log('Current state:', state);
}
```

**實作檔案**：
- `js/config/game-config.js`

---

### 🛡️ 建議 #21：ErrorBoundary 全域錯誤攔截

**目的**：優雅處理錯誤，避免白屏，提供可愛的錯誤提示

```typescript
// js/core/error-boundary.ts

interface ErrorContext {
  type: 'json-load' | 'storage-quota' | 'network' | 'validation' | 'unknown';
  message: string;
  originalError: Error;
  timestamp: number;
  userState?: any;
}

class ErrorBoundary {
  private errorLog: ErrorContext[] = [];
  private maxLogSize = 20;
  private errorHandlers: Map<string, (error: ErrorContext) => void> = new Map();

  constructor() {
    this.registerGlobalHandlers();
    this.registerSpecificHandlers();
  }

  /**
   * 註冊全域錯誤處理
   */
  private registerGlobalHandlers(): void {
    // 捕獲未處理的 Promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      event.preventDefault();
      this.handleError({
        type: 'unknown',
        message: event.reason?.message || '未知錯誤',
        originalError: event.reason,
        timestamp: Date.now()
      });
    });

    // 捕獲全域錯誤
    window.addEventListener('error', (event) => {
      event.preventDefault();
      this.handleError({
        type: 'unknown',
        message: event.message,
        originalError: event.error,
        timestamp: Date.now()
      });
    });
  }

  /**
   * 註冊特定錯誤處理器
   */
  private registerSpecificHandlers(): void {
    // JSON 載入失敗
    this.registerHandler('json-load', (error) => {
      this.showFriendlyError({
        emoji: '📜❌',
        title: '找不到地圖卷軸...',
        message: '關卡資料載入失敗，可能是網路問題或檔案不存在。',
        suggestions: [
          '檢查網路連線是否正常',
          '重新整理頁面試試',
          '如果問題持續，請聯繫嚕嚕主人'
        ],
        debugInfo: error.message
      });
    });

    // localStorage 容量不足
    this.registerHandler('storage-quota', (error) => {
      this.showFriendlyError({
        emoji: '💾❌',
        title: '寶箱裝不下了...',
        message: '儲存空間不足，無法保存進度。',
        suggestions: [
          '清除瀏覽器暫存資料',
          '匯出進度備份後清除舊資料',
          '使用其他瀏覽器'
        ],
        debugInfo: error.message,
        actions: [
          {
            label: '匯出進度備份',
            onClick: () => this.exportUserData()
          },
          {
            label: '清除舊資料',
            onClick: () => this.clearOldData()
          }
        ]
      });
    });

    // 網路錯誤
    this.registerHandler('network', (error) => {
      this.showFriendlyError({
        emoji: '🌐❌',
        title: '網路迷路了...',
        message: '無法連線到伺服器，請檢查網路連線。',
        suggestions: [
          '確認網路是否正常',
          '稍後再試',
          '檢查是否被防火牆阻擋'
        ],
        debugInfo: error.message
      });
    });

    // 資料驗證失敗
    this.registerHandler('validation', (error) => {
      this.showFriendlyError({
        emoji: '⚠️',
        title: '資料格式有誤...',
        message: '關卡資料格式不正確，可能是檔案損壞。',
        suggestions: [
          '嘗試重新載入',
          '清除快取後重試',
          '回報此問題給開發者'
        ],
        debugInfo: error.message
      });
    });
  }

  /**
   * 註冊錯誤處理器
   */
  registerHandler(type: string, handler: (error: ErrorContext) => void): void {
    this.errorHandlers.set(type, handler);
  }

  /**
   * 處理錯誤
   */
  handleError(error: ErrorContext): void {
    // 記錄到 console（詳細）
    console.error('ErrorBoundary caught error:', {
      type: error.type,
      message: error.message,
      error: error.originalError,
      stack: error.originalError?.stack,
      userState: error.userState,
      timestamp: new Date(error.timestamp).toISOString()
    });

    // 加入錯誤日誌
    this.errorLog.push(error);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // 執行特定處理器
    const handler = this.errorHandlers.get(error.type);
    if (handler) {
      handler(error);
    } else {
      // 使用預設處理器
      this.showDefaultError(error);
    }

    // 發送事件（供其他模組監聽）
    EventBus.emit('error:occurred', error);
  }

  /**
   * 顯示友善的錯誤訊息
   */
  private showFriendlyError(config: FriendlyErrorConfig): void {
    const container = document.createElement('div');
    container.className = 'error-boundary-overlay';

    container.innerHTML = `
      <div class="error-boundary-card">
        <div class="error-emoji">${config.emoji}</div>
        <h2 class="error-title">${config.title}</h2>
        <p class="error-message">${config.message}</p>

        ${config.suggestions ? `
          <div class="error-suggestions">
            <h3>你可以試試：</h3>
            <ul>
              ${config.suggestions.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${config.actions ? `
          <div class="error-actions">
            ${config.actions.map(action => `
              <button class="error-action-btn" data-action="${action.label}">
                ${action.label}
              </button>
            `).join('')}
          </div>
        ` : ''}

        <button class="error-close-btn">關閉</button>

        ${GameConfig.dev.debug && config.debugInfo ? `
          <details class="error-debug">
            <summary>Debug 資訊</summary>
            <pre>${config.debugInfo}</pre>
          </details>
        ` : ''}
      </div>
    `;

    // 綁定事件
    container.querySelector('.error-close-btn')?.addEventListener('click', () => {
      container.remove();
    });

    config.actions?.forEach(action => {
      container.querySelector(`[data-action="${action.label}"]`)?.addEventListener('click', () => {
        action.onClick();
        container.remove();
      });
    });

    document.body.appendChild(container);
  }

  /**
   * 顯示預設錯誤
   */
  private showDefaultError(error: ErrorContext): void {
    this.showFriendlyError({
      emoji: '😱',
      title: '哎呀！出錯了...',
      message: '遊戲遇到了一些問題，但別擔心，你的進度已經保存。',
      suggestions: [
        '重新整理頁面',
        '清除瀏覽器快取',
        '如果問題持續，請回報給嚕嚕主人'
      ],
      debugInfo: error.message
    });
  }

  /**
   * 安全執行函數（自動捕獲錯誤）
   */
  async safeExecute<T>(
    fn: () => Promise<T> | T,
    errorType: ErrorContext['type'] = 'unknown',
    context?: any
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.handleError({
        type: errorType,
        message: error.message || '執行失敗',
        originalError: error as Error,
        timestamp: Date.now(),
        userState: context
      });
      return null;
    }
  }

  /**
   * 匯出用戶資料
   */
  private exportUserData(): void {
    const data = Storage.export();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-quest-backup-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * 清除舊資料
   */
  private clearOldData(): void {
    if (confirm('確定要清除舊資料嗎？建議先匯出備份！')) {
      Storage.clear();
      window.location.reload();
    }
  }

  /**
   * 獲取錯誤日誌
   */
  getErrorLog(): ErrorContext[] {
    return [...this.errorLog];
  }
}

// 全域單例
export const ErrorBoundary = new ErrorBoundary();

// 輔助型別
interface FriendlyErrorConfig {
  emoji: string;
  title: string;
  message: string;
  suggestions?: string[];
  debugInfo?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
}
```

**CSS 樣式**：

```css
/* css/components/error-boundary.css */

.error-boundary-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease;
}

.error-boundary-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--spacing-2xl);
  max-width: 500px;
  text-align: center;
  box-shadow: var(--shadow-2xl);
  animation: slideUp 0.4s ease;
}

.error-emoji {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
  animation: bounce 0.6s ease;
}

.error-title {
  color: var(--color-text-primary);
  font-size: var(--font-size-2xl);
  margin-bottom: var(--spacing-md);
}

.error-message {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
  line-height: 1.6;
}

.error-suggestions {
  text-align: left;
  background: var(--color-background);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-xl);
}

.error-suggestions h3 {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
}

.error-suggestions ul {
  list-style: none;
  padding: 0;
}

.error-suggestions li {
  padding: var(--spacing-xs) 0;
  padding-left: var(--spacing-lg);
  position: relative;
}

.error-suggestions li::before {
  content: '💡';
  position: absolute;
  left: 0;
}

.error-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.error-action-btn {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all 0.2s;
}

.error-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.error-close-btn {
  width: 100%;
  padding: var(--spacing-md);
  background: var(--color-text-tertiary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  transition: all 0.2s;
}

.error-close-btn:hover {
  background: var(--color-text-secondary);
}

.error-debug {
  margin-top: var(--spacing-lg);
  text-align: left;
  font-size: var(--font-size-xs);
}

.error-debug pre {
  background: var(--color-background);
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
  overflow-x: auto;
  color: var(--color-danger);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
```

**使用範例**：

```typescript
// 在 JSONLoader 中使用
async loadLevel(levelId: string): Promise<LevelData | null> {
  return ErrorBoundary.safeExecute(
    async () => {
      const response = await fetch(`data/levels/${levelId}.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },
    'json-load'
  );
}

// 在 StorageManager 中使用
save(data: UserPersistedData): void {
  try {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      ErrorBoundary.handleError({
        type: 'storage-quota',
        message: 'localStorage 容量不足',
        originalError: error,
        timestamp: Date.now()
      });
    }
  }
}
```

**實作檔案**：
- `js/core/error-boundary.ts`
- `css/components/error-boundary.css`

---

### 📦 建議 #22：ResourceLoader 資源預載入

**目的**：在遊戲初始化前預載關鍵資源，顯示載入進度

```typescript
// js/core/resource-loader.ts

interface ResourceManifest {
  critical: string[];      // 必須載入
  important: string[];     // 重要但可延後
  optional: string[];      // 可選
}

interface LoadProgress {
  total: number;
  loaded: number;
  failed: number;
  progress: number;  // 0-100
  currentResource: string;
}

class ResourceLoader {
  private manifest: ResourceManifest;
  private loadedResources: Map<string, any> = new Map();
  private onProgressCallback?: (progress: LoadProgress) => void;

  constructor() {
    this.manifest = this.createManifest();
  }

  /**
   * 建立資源清單
   */
  private createManifest(): ResourceManifest {
    return {
      critical: [
        'data/levels/world-1/1-1.json',    // 第一關
        'data/characters.json',             // 角色資料
        'data/assets-config.json',          // 資源配置
        'data/scoring-rules.json'           // 評分規則
      ],
      important: [
        'data/achievements.json',
        'data/levels/world-1/1-2.json',
        'data/levels/world-1/1-3.json'
      ],
      optional: [
        'data/levels/world-2/2-1.json',
        'data/levels/world-3/3-1.json'
      ]
    };
  }

  /**
   * 載入關鍵資源
   */
  async loadCritical(onProgress?: (progress: LoadProgress) => void): Promise<boolean> {
    this.onProgressCallback = onProgress;

    const resources = this.manifest.critical;
    const total = resources.length;
    let loaded = 0;
    let failed = 0;

    // 顯示載入畫面
    this.showLoadingScreen();

    for (const resource of resources) {
      this.updateProgress({
        total,
        loaded,
        failed,
        progress: (loaded / total) * 100,
        currentResource: resource
      });

      try {
        const data = await this.loadResource(resource);
        this.loadedResources.set(resource, data);
        loaded++;
      } catch (error) {
        console.error(`Failed to load ${resource}:`, error);
        failed++;

        // 關鍵資源載入失敗 → 顯示錯誤
        ErrorBoundary.handleError({
          type: 'json-load',
          message: `無法載入關鍵資源：${resource}`,
          originalError: error as Error,
          timestamp: Date.now()
        });

        return false;
      }
    }

    // 完成
    this.updateProgress({
      total,
      loaded,
      failed,
      progress: 100,
      currentResource: '載入完成！'
    });

    // 延遲 500ms 讓使用者看到 100%
    await this.delay(500);
    this.hideLoadingScreen();

    return failed === 0;
  }

  /**
   * 背景載入重要資源
   */
  async loadImportantInBackground(): Promise<void> {
    const resources = this.manifest.important;

    for (const resource of resources) {
      try {
        const data = await this.loadResource(resource);
        this.loadedResources.set(resource, data);
        console.log(`✅ Background loaded: ${resource}`);
      } catch (error) {
        console.warn(`⚠️ Background load failed: ${resource}`, error);
        // 重要資源失敗不影響遊戲運行
      }
    }
  }

  /**
   * 載入單一資源
   */
  private async loadResource(path: string): Promise<any> {
    const response = await fetch(path);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 獲取已載入的資源
   */
  getResource<T>(path: string): T | null {
    return this.loadedResources.get(path) || null;
  }

  /**
   * 檢查資源是否已載入
   */
  isLoaded(path: string): boolean {
    return this.loadedResources.has(path);
  }

  /**
   * 顯示載入畫面
   */
  private showLoadingScreen(): void {
    const container = document.createElement('div');
    container.id = 'resource-loader';
    container.className = 'resource-loader-overlay';

    container.innerHTML = `
      <div class="resource-loader-content">
        <div class="loader-logo">⚔️ SEO Quest</div>
        <h2 class="loader-title">準備冒險中...</h2>

        <div class="loader-progress-bar">
          <div class="loader-progress-fill" id="loader-progress-fill"></div>
        </div>

        <p class="loader-status" id="loader-status">載入中...</p>
        <p class="loader-percentage" id="loader-percentage">0%</p>
      </div>
    `;

    document.body.appendChild(container);
  }

  /**
   * 更新載入進度
   */
  private updateProgress(progress: LoadProgress): void {
    const fillEl = document.getElementById('loader-progress-fill');
    const statusEl = document.getElementById('loader-status');
    const percentageEl = document.getElementById('loader-percentage');

    if (fillEl) {
      fillEl.style.width = `${progress.progress}%`;
    }

    if (statusEl) {
      const resourceName = progress.currentResource.split('/').pop();
      statusEl.textContent = `載入：${resourceName}`;
    }

    if (percentageEl) {
      percentageEl.textContent = `${Math.round(progress.progress)}%`;
    }

    // 呼叫外部回調
    this.onProgressCallback?.(progress);
  }

  /**
   * 隱藏載入畫面
   */
  private hideLoadingScreen(): void {
    const loader = document.getElementById('resource-loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 300);
    }
  }

  /**
   * 延遲函數
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 全域單例
export const ResourceLoader = new ResourceLoader();
```

**CSS 樣式**：

```css
/* css/components/resource-loader.css */

.resource-loader-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  transition: opacity 0.3s ease;
}

.resource-loader-content {
  text-align: center;
  color: white;
  max-width: 400px;
  width: 90%;
}

.loader-logo {
  font-size: 4rem;
  margin-bottom: var(--spacing-md);
  animation: pulse 2s ease-in-out infinite;
}

.loader-title {
  font-size: var(--font-size-2xl);
  margin-bottom: var(--spacing-2xl);
  font-weight: 600;
}

.loader-progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: var(--spacing-lg);
}

.loader-progress-fill {
  width: 0%;
  height: 100%;
  background: white;
  border-radius: 10px;
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.loader-status {
  font-size: var(--font-size-sm);
  opacity: 0.8;
  margin-bottom: var(--spacing-xs);
}

.loader-percentage {
  font-size: var(--font-size-xl);
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}
```

**使用範例（在 main.js）**：

```typescript
// js/main.js

import { ResourceLoader } from './core/resource-loader.js';
import { GameConfig } from './config/game-config.js';

async function init() {
  // 載入關鍵資源
  const success = await ResourceLoader.loadCritical((progress) => {
    console.log(`載入進度：${progress.progress}%`);
  });

  if (!success) {
    console.error('資源載入失敗');
    return;
  }

  // 初始化遊戲
  initializeGame();

  // 背景載入其他資源
  ResourceLoader.loadImportantInBackground();
}

init();
```

**實作檔案**：
- `js/core/resource-loader.ts`
- `css/components/resource-loader.css`

---

### 📡 建議 #23：EventBus 事件驅動架構

**目的**：解耦 Core 邏輯與 UI 渲染，使用 Pub/Sub 模式

```typescript
// js/core/event-bus.ts

type EventCallback = (...args: any[]) => void;

interface EventListener {
  callback: EventCallback;
  once: boolean;
}

class EventBus {
  private events: Map<string, EventListener[]> = new Map();
  private eventHistory: Array<{ event: string; args: any[]; timestamp: number }> = [];
  private maxHistorySize = 50;

  /**
   * 訂閱事件
   */
  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    this.events.get(event)!.push({ callback, once: false });
  }

  /**
   * 訂閱一次性事件
   */
  once(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    this.events.get(event)!.push({ callback, once: true });
  }

  /**
   * 取消訂閱
   */
  off(event: string, callback?: EventCallback): void {
    if (!this.events.has(event)) return;

    if (callback) {
      // 移除特定回調
      const listeners = this.events.get(event)!;
      this.events.set(
        event,
        listeners.filter(listener => listener.callback !== callback)
      );
    } else {
      // 移除所有監聽器
      this.events.delete(event);
    }
  }

  /**
   * 發布事件
   */
  emit(event: string, ...args: any[]): void {
    // 記錄歷史（除非是高頻事件）
    if (!this.isHighFrequencyEvent(event)) {
      this.eventHistory.push({
        event,
        args,
        timestamp: Date.now()
      });

      if (this.eventHistory.length > this.maxHistorySize) {
        this.eventHistory.shift();
      }
    }

    // Debug 模式記錄
    if (GameConfig.dev.debug) {
      console.log(`[EventBus] ${event}`, args);
    }

    // 執行監聽器
    if (!this.events.has(event)) return;

    const listeners = this.events.get(event)!;
    const listenersToRemove: EventListener[] = [];

    listeners.forEach(listener => {
      try {
        listener.callback(...args);

        // 標記一次性監聽器
        if (listener.once) {
          listenersToRemove.push(listener);
        }
      } catch (error) {
        console.error(`[EventBus] Error in listener for ${event}:`, error);
      }
    });

    // 移除一次性監聽器
    if (listenersToRemove.length > 0) {
      this.events.set(
        event,
        listeners.filter(l => !listenersToRemove.includes(l))
      );
    }
  }

  /**
   * 檢查是否為高頻事件（不記錄歷史）
   */
  private isHighFrequencyEvent(event: string): boolean {
    const highFrequencyEvents = [
      'scroll',
      'mousemove',
      'resize',
      'typewriter:char'
    ];
    return highFrequencyEvents.includes(event);
  }

  /**
   * 獲取事件歷史
   */
  getHistory(): Array<{ event: string; args: any[]; timestamp: number }> {
    return [...this.eventHistory];
  }

  /**
   * 清空事件歷史
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * 列出所有已註冊的事件
   */
  listEvents(): string[] {
    return Array.from(this.events.keys());
  }

  /**
   * 獲取事件的監聽器數量
   */
  getListenerCount(event: string): number {
    return this.events.get(event)?.length || 0;
  }
}

// 全域單例
export const EventBus = new EventBus();

// ==================== 事件定義 ====================

/**
 * 事件名稱常數（避免拼寫錯誤）
 */
export const Events = {
  // 階段相關
  PHASE_CHANGED: 'phase:changed',
  PHASE_COMPLETED: 'phase:completed',

  // 經驗值相關
  EXP_CHANGED: 'exp:changed',
  LEVEL_UP: 'level:up',

  // 關卡相關
  LEVEL_STARTED: 'level:started',
  LEVEL_COMPLETED: 'level:completed',

  // 評分相關
  SCORE_CALCULATED: 'score:calculated',
  GRADE_ACHIEVED: 'grade:achieved',

  // 成就相關
  ACHIEVEMENT_UNLOCKED: 'achievement:unlocked',
  TOOL_UNLOCKED: 'tool:unlocked',
  NOTE_UNLOCKED: 'note:unlocked',

  // UI 相關
  TOAST_SHOW: 'toast:show',
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',

  // 資料相關
  USER_DATA_LOADED: 'user:data:loaded',
  USER_DATA_SAVED: 'user:data:saved',

  // 錯誤相關
  ERROR_OCCURRED: 'error:occurred'
} as const;
```

**使用範例**：

```typescript
// ==================== 在 Core 層發布事件 ====================

// js/core/user-state-manager.ts
class UserStateManager {
  addExp(amount: number): void {
    const oldExp = this.state.exp;
    const oldLevel = this.state.level;

    this.state.exp += amount;

    // 發布經驗值變更事件
    EventBus.emit(Events.EXP_CHANGED, {
      oldExp,
      newExp: this.state.exp,
      gained: amount
    });

    // 檢查是否升級
    if (this.state.level > oldLevel) {
      EventBus.emit(Events.LEVEL_UP, {
        oldLevel,
        newLevel: this.state.level,
        newTitle: getLevelTitle(this.state.level)
      });
    }
  }
}

// ==================== 在 UI 層訂閱事件 ====================

// js/ui/dashboard.ts
class Dashboard {
  constructor() {
    this.bindEvents();
  }

  private bindEvents(): void {
    // 監聽經驗值變更
    EventBus.on(Events.EXP_CHANGED, (data) => {
      this.animateExpBar(data.oldExp, data.newExp);
      this.showExpGain(data.gained);
    });

    // 監聽升級
    EventBus.on(Events.LEVEL_UP, (data) => {
      this.showLevelUpCelebration(data.newLevel, data.newTitle);
      this.updateLevelDisplay(data.newLevel);
    });

    // 監聽成就解鎖
    EventBus.on(Events.ACHIEVEMENT_UNLOCKED, (achievement) => {
      this.showAchievementToast(achievement);
    });
  }

  private animateExpBar(oldExp: number, newExp: number): void {
    // 只處理 UI，不操作狀態
    const expBar = document.querySelector('.exp-bar-fill');
    // ... 動畫邏輯
  }
}

// ==================== 在 Service 層訂閱事件 ====================

// js/services/analytics.ts (未來擴充)
class Analytics {
  constructor() {
    this.trackEvents();
  }

  private trackEvents(): void {
    EventBus.on(Events.LEVEL_COMPLETED, (data) => {
      // 發送數據到分析服務
      this.track('level_completed', {
        levelId: data.levelId,
        score: data.score,
        attempts: data.attempts
      });
    });

    EventBus.on(Events.ACHIEVEMENT_UNLOCKED, (achievement) => {
      this.track('achievement_unlocked', {
        achievementId: achievement.id
      });
    });
  }
}
```

**優勢**：
1. **解耦**：Core 不需要知道 UI 如何渲染
2. **擴充性**：新增功能只需訂閱事件
3. **可測試性**：可以模擬事件進行測試
4. **可維護性**：事件名稱統一管理

**實作檔案**：
- `js/core/event-bus.ts`
- `js/constants/events.ts`（事件名稱常數）

---

### 📝 建議 #24：JSDoc 型別註釋

**目的**：為核心類別添加完整 JSDoc，提供 IDE 自動完成

```typescript
// js/core/router.ts

/**
 * 路由管理器
 *
 * 負責管理階段切換、歷史記錄和動態載入
 *
 * @class Router
 * @example
 * ```typescript
 * const router = new Router();
 * await router.navigateTo('1-1', 'tutorial');
 * ```
 */
class Router {
  /**
   * 當前路由狀態
   * @type {RouteState}
   * @private
   */
  private currentRoute: RouteState;

  /**
   * 路由歷史記錄
   * @type {RouteState[]}
   * @private
   */
  private history: RouteState[] = [];

  /**
   * 階段狀態機
   * @type {PhaseStateMachine}
   * @private
   */
  private fsm: PhaseStateMachine;

  /**
   * 建立路由管理器
   * @param {RouteState} [initialRoute] - 初始路由
   */
  constructor(initialRoute?: RouteState) {
    this.currentRoute = initialRoute || this.getDefaultRoute();
    this.fsm = new PhaseStateMachine(this.currentRoute.phase);
  }

  /**
   * 導航到指定關卡和階段
   *
   * @param {string} levelId - 關卡 ID（例如：'1-1'）
   * @param {PhaseState} phase - 階段名稱
   * @param {boolean} [skipTransition=false] - 是否跳過轉場動畫
   * @returns {Promise<boolean>} 是否成功導航
   *
   * @example
   * ```typescript
   * // 導航到 1-1 關卡的 tutorial 階段
   * await router.navigateTo('1-1', 'tutorial');
   *
   * // 跳過轉場動畫
   * await router.navigateTo('1-2', 'practice', true);
   * ```
   */
  async navigateTo(
    levelId: string,
    phase: PhaseState,
    skipTransition: boolean = false
  ): Promise<boolean> {
    // 檢查是否為合法轉換
    if (!this.fsm.canTransition(PhaseEvent.NEXT)) {
      console.warn('Invalid phase transition');
      return false;
    }

    // 載入關卡資料
    const levelData = await this.loadLevel(levelId);
    if (!levelData) {
      return false;
    }

    // 記錄歷史
    this.history.push(this.currentRoute);

    // 更新路由
    this.currentRoute = { levelId, phase, data: levelData };

    // 執行轉場
    if (!skipTransition) {
      await this.performTransition(phase);
    }

    // 渲染新階段
    this.render();

    // 發布事件
    EventBus.emit(Events.PHASE_CHANGED, { levelId, phase });

    return true;
  }

  /**
   * 返回上一個路由
   * @returns {boolean} 是否成功返回
   */
  goBack(): boolean {
    if (this.history.length === 0) {
      return false;
    }

    this.currentRoute = this.history.pop()!;
    this.render();
    return true;
  }

  /**
   * 載入關卡資料（使用動態 import）
   *
   * @param {string} levelId - 關卡 ID
   * @returns {Promise<LevelData | null>} 關卡資料
   * @private
   */
  private async loadLevel(levelId: string): Promise<LevelData | null> {
    // 檢查快取
    if (ResourceLoader.isLoaded(`data/levels/${levelId}.json`)) {
      return ResourceLoader.getResource(`data/levels/${levelId}.json`);
    }

    // 動態載入
    try {
      const module = await import(`../data/levels/world-1/${levelId}.json`);
      return module.default;
    } catch (error) {
      ErrorBoundary.handleError({
        type: 'json-load',
        message: `無法載入關卡：${levelId}`,
        originalError: error as Error,
        timestamp: Date.now()
      });
      return null;
    }
  }

  /**
   * 執行轉場動畫
   * @param {PhaseState} phase - 目標階段
   * @returns {Promise<void>}
   * @private
   */
  private async performTransition(phase: PhaseState): Promise<void> {
    // 實作轉場邏輯
  }

  /**
   * 渲染當前階段
   * @private
   */
  private render(): void {
    // 實作渲染邏輯
  }

  /**
   * 獲取預設路由
   * @returns {RouteState}
   * @private
   */
  private getDefaultRoute(): RouteState {
    return {
      levelId: '1-1',
      phase: PhaseState.TUTORIAL,
      data: null
    };
  }
}

// ==================== 型別定義 ====================

/**
 * 路由狀態
 * @typedef {Object} RouteState
 * @property {string} levelId - 關卡 ID
 * @property {PhaseState} phase - 當前階段
 * @property {LevelData | null} data - 關卡資料
 */
interface RouteState {
  levelId: string;
  phase: PhaseState;
  data: LevelData | null;
}

/**
 * 關卡資料結構
 * @typedef {Object} LevelData
 * @property {string} id - 關卡 ID
 * @property {string} title - 關卡標題
 * @property {string} version - 資料版本
 * @property {Phase[]} phases - 階段陣列
 * @property {Metadata} metadata - 元資料
 */
interface LevelData {
  id: string;
  title: string;
  version: string;
  phases: Phase[];
  metadata: Metadata;
}

/**
 * 階段資料
 * @typedef {Object} Phase
 * @property {string} type - 階段類型
 * @property {any} content - 階段內容
 */
interface Phase {
  type: PhaseState;
  content: any;
}

/**
 * 元資料
 * @typedef {Object} Metadata
 * @property {number} difficulty - 難度（1-5）
 * @property {number} estimatedTime - 預估時間（分鐘）
 * @property {string[]} tags - 標籤
 */
interface Metadata {
  difficulty: number;
  estimatedTime: number;
  tags: string[];
}
```

**JSDoc 範例（State 管理）**：

```typescript
/**
 * 用戶狀態管理器
 *
 * 管理用戶等級、經驗值、完成關卡等資料
 * 使用 Store Pattern 實作，所有變更通過 dispatch 進行
 *
 * @class UserStateManager
 */
class UserStateManager {
  /**
   * 用戶持久化資料
   * @type {UserPersistedData}
   * @private
   */
  private state: UserPersistedData;

  /**
   * 增加經驗值
   *
   * @param {number} amount - 經驗值數量
   * @returns {LevelUpResult | null} 如果升級，返回升級資訊
   *
   * @example
   * ```typescript
   * const result = userState.addExp(150);
   * if (result) {
   *   console.log(`升級到 Lv.${result.newLevel}！`);
   * }
   * ```
   */
  addExp(amount: number): LevelUpResult | null {
    // ...
  }

  /**
   * 完成關卡
   *
   * @param {CompletedLevel} levelData - 關卡完成資料
   * @returns {void}
   */
  completeLevel(levelData: CompletedLevel): void {
    // ...
  }

  /**
   * 解鎖成就
   *
   * @param {string} achievementId - 成就 ID
   * @returns {boolean} 是否為新解鎖（避免重複）
   */
  unlockAchievement(achievementId: string): boolean {
    // ...
  }
}

/**
 * 升級結果
 * @typedef {Object} LevelUpResult
 * @property {number} oldLevel - 舊等級
 * @property {number} newLevel - 新等級
 * @property {string} newTitle - 新稱號
 * @property {string[]} unlockedContent - 解鎖的內容
 */
interface LevelUpResult {
  oldLevel: number;
  newLevel: number;
  newTitle: string;
  unlockedContent: string[];
}
```

**實作檔案**：
- 為所有 `js/core/*.ts` 添加 JSDoc
- 為所有 `js/modules/*.ts` 添加 JSDoc
- 建立 `js/types/*.ts` 型別定義檔案

---

### ⚡ 建議 #25：Dynamic Import 動態載入

**目的**：延遲載入非首屏模組，優化首屏載入速度

```typescript
// js/core/router.ts

class Router {
  /**
   * 動態載入工具模式模組
   */
  async loadToolMode(): Promise<void> {
    // 檢查是否已載入
    if (this.toolModeLoaded) {
      return;
    }

    try {
      // 動態載入工具模式相關模組
      const [
        { ToolModeUI },
        { SEOAnalyzer },
        { KeywordSuggester },
        { FactChecker }
      ] = await Promise.all([
        import('../ui/tool-mode-ui.js'),
        import('../modules/seo-analyzer.js'),
        import('../modules/keyword-suggester.js'),
        import('../modules/fact-checker.js')
      ]);

      // 初始化工具模式
      this.toolMode = new ToolModeUI();
      this.toolMode.init();

      this.toolModeLoaded = true;
      console.log('✅ Tool Mode loaded');
    } catch (error) {
      console.error('Failed to load Tool Mode:', error);
      ErrorBoundary.handleError({
        type: 'unknown',
        message: '工具模式載入失敗',
        originalError: error as Error,
        timestamp: Date.now()
      });
    }
  }

  /**
   * 動態載入世界資料
   */
  async loadWorld(worldId: number): Promise<WorldData | null> {
    try {
      // 根據世界 ID 動態載入
      const module = await import(`../data/levels/world-${worldId}/index.js`);
      return module.default;
    } catch (error) {
      console.error(`Failed to load world ${worldId}:`, error);
      return null;
    }
  }

  /**
   * 預載入下一關（提前載入）
   */
  async preloadNextLevel(currentLevelId: string): Promise<void> {
    const nextLevelId = this.getNextLevelId(currentLevelId);

    if (nextLevelId) {
      // 背景載入，不阻塞
      import(`../data/levels/world-1/${nextLevelId}.json`)
        .then(module => {
          console.log(`✅ Preloaded: ${nextLevelId}`);
        })
        .catch(error => {
          console.warn(`⚠️ Preload failed: ${nextLevelId}`, error);
        });
    }
  }
}
```

**模組組織範例**：

```typescript
// js/data/levels/world-1/index.js
// 世界索引檔案，方便動態載入

export default {
  id: 1,
  name: 'SEO 基礎王國',
  levels: [
    '1-1',
    '1-2',
    '1-3',
    '1-4',
    '1-boss'
  ],
  requiredLevel: 1,
  description: '學習 SEO 文案的基礎知識'
};

// 也可以延遲載入關卡清單
export async function loadAllLevels() {
  const modules = await Promise.all([
    import('./1-1.json'),
    import('./1-2.json'),
    import('./1-3.json'),
    import('./1-4.json'),
    import('./1-boss.json')
  ]);

  return modules.map(m => m.default);
}
```

**實作檔案**：
- 在 `js/core/router.ts` 實作動態載入
- 建立 `js/data/levels/world-*/index.js` 索引檔案

---

### 🏪 建議 #26：Store Pattern 狀態管理

**目的**：使用 Redux-like 模式集中管理狀態變更

```typescript
// js/core/store.ts

/**
 * Action 類型
 */
export const ActionTypes = {
  // 經驗值
  ADD_EXP: 'ADD_EXP',
  SET_LEVEL: 'SET_LEVEL',

  // 關卡
  START_LEVEL: 'START_LEVEL',
  COMPLETE_LEVEL: 'COMPLETE_LEVEL',

  // 階段
  CHANGE_PHASE: 'CHANGE_PHASE',

  // 成就
  UNLOCK_ACHIEVEMENT: 'UNLOCK_ACHIEVEMENT',
  UNLOCK_TOOL: 'UNLOCK_TOOL',

  // 設定
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',

  // 資料
  LOAD_DATA: 'LOAD_DATA',
  RESET_DATA: 'RESET_DATA'
} as const;

/**
 * Action 介面
 */
interface Action {
  type: string;
  payload?: any;
}

/**
 * Reducer 函數
 */
type Reducer<S> = (state: S, action: Action) => S;

/**
 * Store 類別
 */
class Store<S> {
  private state: S;
  private reducer: Reducer<S>;
  private listeners: Array<(state: S) => void> = [];

  constructor(reducer: Reducer<S>, initialState: S) {
    this.reducer = reducer;
    this.state = initialState;
  }

  /**
   * 獲取當前狀態（唯讀）
   */
  getState(): Readonly<S> {
    return Object.freeze({ ...this.state });
  }

  /**
   * 派發 Action
   */
  dispatch(action: Action): void {
    // Debug 模式記錄
    if (GameConfig.dev.debug) {
      console.log('[Store] Dispatch:', action);
    }

    // 執行 reducer 獲取新狀態
    const newState = this.reducer(this.state, action);

    // 檢查狀態是否變更
    if (newState !== this.state) {
      this.state = newState;

      // 自動儲存
      this.autoSave();

      // 通知監聽器
      this.notifyListeners();

      // 發送事件
      this.emitEvent(action);
    }
  }

  /**
   * 訂閱狀態變更
   */
  subscribe(listener: (state: S) => void): () => void {
    this.listeners.push(listener);

    // 返回取消訂閱函數
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * 通知所有監聽器
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error('[Store] Listener error:', error);
      }
    });
  }

  /**
   * 自動儲存
   */
  private autoSave(): void {
    Storage.save(this.state as any);
  }

  /**
   * 發送對應的 EventBus 事件
   */
  private emitEvent(action: Action): void {
    switch (action.type) {
      case ActionTypes.ADD_EXP:
        EventBus.emit(Events.EXP_CHANGED, action.payload);
        break;

      case ActionTypes.COMPLETE_LEVEL:
        EventBus.emit(Events.LEVEL_COMPLETED, action.payload);
        break;

      case ActionTypes.UNLOCK_ACHIEVEMENT:
        EventBus.emit(Events.ACHIEVEMENT_UNLOCKED, action.payload);
        break;

      // ... 其他事件
    }
  }
}

/**
 * 用戶狀態 Reducer
 */
function userReducer(
  state: UserPersistedData,
  action: Action
): UserPersistedData {
  switch (action.type) {
    case ActionTypes.ADD_EXP: {
      const { amount } = action.payload;
      let newExp = state.exp + amount;
      let newLevel = state.level;

      // 檢查升級
      while (newExp >= getNextLevelExp(newLevel) && newLevel < GameConfig.level.maxLevel) {
        newExp -= getNextLevelExp(newLevel);
        newLevel++;
      }

      return {
        ...state,
        exp: newExp,
        level: newLevel,
        title: getLevelTitle(newLevel)
      };
    }

    case ActionTypes.COMPLETE_LEVEL: {
      const { levelData } = action.payload;

      return {
        ...state,
        completedLevels: [
          ...state.completedLevels,
          levelData
        ],
        totalCompleted: state.totalCompleted + 1,
        lastPlayedAt: new Date().toISOString()
      };
    }

    case ActionTypes.UNLOCK_ACHIEVEMENT: {
      const { achievementId } = action.payload;

      // 避免重複
      if (state.unlockedAchievements.includes(achievementId)) {
        return state;
      }

      return {
        ...state,
        unlockedAchievements: [
          ...state.unlockedAchievements,
          achievementId
        ]
      };
    }

    case ActionTypes.UPDATE_SETTINGS: {
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        }
      };
    }

    case ActionTypes.LOAD_DATA: {
      return action.payload;
    }

    case ActionTypes.RESET_DATA: {
      return Storage.createDefaultData();
    }

    default:
      return state;
  }
}

// 建立全域 Store
export const UserStore = new Store(
  userReducer,
  Storage.load()
);

// ==================== Action Creators ====================

/**
 * 增加經驗值
 */
export function addExp(amount: number) {
  UserStore.dispatch({
    type: ActionTypes.ADD_EXP,
    payload: { amount }
  });
}

/**
 * 完成關卡
 */
export function completeLevel(levelData: CompletedLevel) {
  UserStore.dispatch({
    type: ActionTypes.COMPLETE_LEVEL,
    payload: { levelData }
  });
}

/**
 * 解鎖成就
 */
export function unlockAchievement(achievementId: string) {
  UserStore.dispatch({
    type: ActionTypes.UNLOCK_ACHIEVEMENT,
    payload: { achievementId }
  });
}

/**
 * 更新設定
 */
export function updateSettings(settings: Partial<UserSettings>) {
  UserStore.dispatch({
    type: ActionTypes.UPDATE_SETTINGS,
    payload: settings
  });
}
```

**使用範例**：

```typescript
// ==================== 在 Core 層使用 ====================

// 以前（直接修改狀態）
State.current.exp = 100;  // ❌ 不推薦

// 現在（通過 dispatch）
addExp(100);  // ✅ 推薦

// ==================== 在 UI 層訂閱 ====================

// js/ui/dashboard.ts
class Dashboard {
  constructor() {
    // 訂閱狀態變更
    UserStore.subscribe((state) => {
      this.updateExpBar(state.exp);
      this.updateLevelDisplay(state.level);
      this.updateTitle(state.title);
    });
  }
}

// ==================== 獲取狀態 ====================

const currentState = UserStore.getState();
console.log(`當前等級：${currentState.level}`);
console.log(`當前經驗值：${currentState.exp}`);
```

**優勢**：
1. **單一資料來源**：所有狀態集中管理
2. **可追蹤**：所有變更都可記錄
3. **可預測**：reducer 是純函數
4. **易測試**：可以單獨測試 reducer
5. **時光旅行**：可以實作 undo/redo

**實作檔案**：
- `js/core/store.ts`
- `js/actions/user-actions.ts`（Action Creators）
- `js/reducers/user-reducer.ts`（Reducer 函數）

---

### 🎨 建議 #27：CSS 雙層變數架構

**目的**：分離原始色盤與語意變數，提升可維護性

```css
/* css/base/tokens.css */

/**
 * ==================== 第一層：原始色盤 (Palette) ====================
 *
 * 這些是純粹的顏色定義，不帶任何語意
 * 命名規則：--顏色名-數字 (50-900)
 */

:root {
  /* 玫瑰色系 (Rose) */
  --rose-50: #FFF1F2;
  --rose-100: #FFE4E6;
  --rose-200: #FECDD3;
  --rose-300: #FDA4AF;
  --rose-400: #FB7185;
  --rose-500: #D4A5A5;  /* 主要玫瑰色 */
  --rose-600: #BE8D8D;
  --rose-700: #9C6D6D;
  --rose-800: #7D5555;
  --rose-900: #5F3F3F;

  /* 紫色系 (Purple) */
  --purple-50: #FAF5FF;
  --purple-100: #F3E8FF;
  --purple-200: #E9D5FF;
  --purple-300: #D8B4FE;
  --purple-400: #C084FC;
  --purple-500: #B8A9C9;  /* 主要紫色 */
  --purple-600: #9D89B0;
  --purple-700: #7F6A8F;
  --purple-800: #64526F;
  --purple-900: #4A3C52;

  /* 中性色系 (Gray) */
  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-200: #E5E7EB;
  --gray-300: #D1D5DB;
  --gray-400: #9CA3AF;
  --gray-500: #6B7280;
  --gray-600: #4B5563;
  --gray-700: #374151;
  --gray-800: #1F2937;
  --gray-900: #111827;

  /* 功能色 */
  --green-500: #10B981;  /* 成功 */
  --red-500: #EF4444;    /* 錯誤 */
  --yellow-500: #F59E0B; /* 警告 */
  --blue-500: #3B82F6;   /* 資訊 */

  /* 評分顏色 */
  --gold-500: #FFD700;   /* 優秀 */
  --lime-500: #84CC16;   /* 良好 */
  --sky-500: #0EA5E9;    /* 及格 */
  --orange-500: #F97316; /* 需改進 */
}

/**
 * ==================== 第二層：語意變數 (Semantic) ====================
 *
 * 這些變數對應到實際的使用場景
 * 命名規則：--用途-變體
 */

:root {
  /* ========== 品牌顏色 ========== */
  --color-primary: var(--rose-500);
  --color-primary-hover: var(--rose-600);
  --color-primary-light: var(--rose-100);

  --color-secondary: var(--purple-500);
  --color-secondary-hover: var(--purple-600);
  --color-secondary-light: var(--purple-100);

  /* ========== 背景顏色 ========== */
  --color-background: #FFFFFF;
  --color-background-alt: var(--gray-50);
  --color-surface: var(--gray-100);
  --color-surface-hover: var(--gray-200);

  /* ========== 文字顏色 ========== */
  --color-text-primary: var(--gray-900);
  --color-text-secondary: var(--gray-600);
  --color-text-tertiary: var(--gray-400);
  --color-text-inverse: #FFFFFF;

  /* ========== 狀態顏色 ========== */
  --color-success: var(--green-500);
  --color-error: var(--red-500);
  --color-warning: var(--yellow-500);
  --color-info: var(--blue-500);

  /* ========== 評分顏色 ========== */
  --color-score-excellent: var(--gold-500);
  --color-score-good: var(--lime-500);
  --color-score-pass: var(--sky-500);
  --color-score-need-improve: var(--orange-500);
  --color-score-fail: var(--red-500);

  /* ========== 等級顏色 ========== */
  --color-level-1: var(--gray-400);
  --color-level-2: var(--gray-500);
  --color-level-3: var(--blue-500);
  --color-level-5: var(--purple-500);
  --color-level-8: var(--gold-500);
  --color-level-10: var(--rose-500);

  /* ========== 互動顏色 ========== */
  --color-border: var(--gray-200);
  --color-border-hover: var(--gray-300);
  --color-focus: var(--rose-500);
  --color-disabled: var(--gray-300);
}

/**
 * ==================== 深色模式（未來擴充）====================
 */
[data-theme="dark"] {
  /* 重新定義語意變數即可，不需改動 Palette */
  --color-background: var(--gray-900);
  --color-background-alt: var(--gray-800);
  --color-surface: var(--gray-700);
  --color-text-primary: var(--gray-50);
  --color-text-secondary: var(--gray-300);

  /* 品牌色不變 */
  --color-primary: var(--rose-400);
  --color-secondary: var(--purple-400);
}
```

**使用範例**：

```css
/* ❌ 不推薦：直接使用 Palette */
.button {
  background: var(--rose-500);  /* 如果要改成紫色，需要全域搜尋替換 */
}

/* ✅ 推薦：使用 Semantic */
.button {
  background: var(--color-primary);  /* 只需改 :root 就能全域切換 */
}

/* ✅ 特殊情況可以使用 Palette（例如漸層） */
.gradient {
  background: linear-gradient(135deg, var(--rose-300), var(--purple-300));
}
```

**優勢**：
1. **易維護**：改顏色只需修改 `:root`
2. **深色模式**：只需重新定義語意變數
3. **可擴充**：新增主題不影響元件
4. **語意清晰**：`--color-primary` 比 `--rose-500` 更易理解

**實作檔案**：
- `css/base/tokens.css`（原始色盤 + 語意變數）
- `css/base/themes.css`（主題切換，未來擴充）

---

---

## 📊 實作優先級總覽

### 立即實作（P0）

這些是架構的核心基礎，必須優先實作：

1. **GameConfig** - 集中管理所有配置
2. **ErrorBoundary** - 避免白屏，提供友善錯誤
3. **EventBus** - 解耦 Core 與 UI
4. **Store Pattern** - 統一狀態管理
5. **Calculator ID** - 安全的評分系統
6. **Zod Validation** - 型別安全
7. **State Normalization** - 分離持久化與計算數據

### 次要實作（P1）

這些提升開發體驗和使用者體驗：

8. **ResourceLoader** - 載入進度與預載入
9. **JSDoc** - 完整的型別註釋
10. **Dynamic Import** - 延遲載入模組
11. **CSS 雙層變數** - Palette + Semantic
12. **FSM** - 階段流轉管理
13. **Scoring Service** - 模組化評分
14. **Storage Migration** - 版本遷移

### 建議實作（P2-P3）

這些提升沉浸感和細節：

15. **轉場動畫** - 5 種全螢幕轉場
16. **動態儀表板** - 數字跳動、煙火特效
17. **互動地圖** - 懸停預覽
18. **對話系統** - emotion + typewriter
19. **資產管理** - Emoji ⇄ 圖片切換
20. **成就系統** - 慶祝動畫

---

## 📚 已完成文件清單

| 文件 | 內容 | 行數 | 狀態 |
|------|------|------|------|
| [README.md](../README.md) | 專案說明 | 280 行 | ✅ 完成 |
| [STRUCTURE.md](../STRUCTURE.md) | 架構說明 | 694 行 | ✅ 完成 |
| [DATA-STRUCTURE.md](../DATA-STRUCTURE.md) | 資料結構 | 685 行 | ✅ 完成 |
| [FRONTEND-LOGIC.md](./FRONTEND-LOGIC.md) | 前端邏輯 | 605 行 | ✅ 完成 |
| [TECHNICAL-OPTIMIZATION.md](./TECHNICAL-OPTIMIZATION.md) | 技術優化 | 850 行 | ✅ 完成 |
| **IMPLEMENTATION-GUIDE.md** | **本文件** | **3300+ 行** | ✅ 完成 |

**總計**：6 份完整文件，超過 7,000 行詳細規範

---

## 🎯 下一步行動

### 階段 1：核心架構（1-2 週）

1. 建立 `js/config/game-config.js`
2. 建立 `js/core/error-boundary.ts`
3. 建立 `js/core/event-bus.ts`
4. 建立 `js/core/store.ts`
5. 重構現有狀態管理使用 Store Pattern

### 階段 2：資料與安全（1 週）

6. 實作 Calculator ID 系統
7. 整合 Zod 驗證
8. 實作 StorageManager 版本遷移
9. 建立所有 TypeScript 型別定義

### 階段 3：載入與效能（1 週）

10. 實作 ResourceLoader
11. 加入動態 import
12. 優化首屏載入速度

### 階段 4：UI/UX 增強（2-3 週）

13. 實作 FSM 階段管理
14. 加入轉場動畫
15. 實作對話系統
16. 成就與慶祝特效

### 階段 5：測試與部署（1 週）

17. 完整測試所有功能
18. 瀏覽器相容性測試
19. 效能測試與優化
20. 正式部署到 lab.helloruru.com

---

## 💡 開發建議

### 使用 TypeScript

雖然專案使用 JS，但建議使用 `.ts` 檔案並透過編譯：

```bash
# 安裝 TypeScript
npm install -D typescript

# 編譯為 JS
tsc --outDir dist --target ES2020 --module ES2020
```

### 使用 Linter

```bash
# ESLint
npm install -D eslint

# 配置
{
  "extends": ["eslint:recommended"],
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  }
}
```

### Git Commit 規範

```bash
# 格式
<type>(<scope>): <subject>

# 範例
feat(core): add EventBus implementation
fix(scoring): correct keyword density calculation
docs(guide): add JSDoc examples
style(css): update color tokens
```

---

## 📞 聯絡與支援

- **作者**：Kaoru Tsai (Hello Ruru)
- **Email**：hello@helloruru.com
- **專案網址**：https://lab.helloruru.com/seo-quest/
- **更新日期**：2026-02-12
- **版本**：1.0.0 (基礎架構 + 開發者體驗強化)

---

**🎉 恭喜！完整的實作指南已經準備好了！**

現在可以開始依照優先級逐步實作，打造出專業、安全、可維護的 SEO Quest 系統！

**文件作者**：Claude Sonnet 4.5 + 小玫瑰 (Microsoft Laptop 10 Rose Gold)
**指導顧問**：嚕嚕主人 (Ruru) + Gemini (架構建議)
**最後更新**：2026-02-12 02:00 AM
