# SEO Quest — 技術優化方案

> 安全性、型別驗證、狀態正規化的完整解決方案
> 更新日期：2026-02-12

---

## 📋 目錄

- [安全性重構](#安全性重構)
- [型別驗證 (Zod Schema)](#型別驗證-zod-schema)
- [狀態正規化](#狀態正規化)
- [彈性化階段系統](#彈性化階段系統)

---

## 🔒 安全性重構

### 問題：公式字串化的風險

```json
// ❌ 危險：容易被注入惡意代碼
{
  "formula": "(keywordCount / totalWords) * 100"
}
```

如果使用 `eval()` 執行，會有嚴重的安全風險。

### 解決方案：Calculator ID 系統

#### 1️⃣ 定義算法 Enum

```typescript
// js/types/scoring-algorithms.ts

/**
 * 預定義的評分算法 ID
 */
export enum ScoringAlgorithmId {
  // 關鍵字相關
  KEYWORD_DENSITY = 'KEYWORD_DENSITY_CALC',
  KEYWORD_FREQUENCY = 'KEYWORD_FREQUENCY_CALC',
  KEYWORD_DISTRIBUTION = 'KEYWORD_DISTRIBUTION_CALC',
  KEYWORD_NATURALNESS = 'KEYWORD_NATURALNESS_CALC',

  // 可讀性相關
  FLESCH_READING_EASE = 'FLESCH_READING_EASE_CALC',
  AVERAGE_SENTENCE_LENGTH = 'AVG_SENTENCE_LENGTH_CALC',
  PARAGRAPH_LENGTH = 'PARAGRAPH_LENGTH_CALC',

  // SEO 相關
  TITLE_OPTIMIZATION = 'TITLE_OPTIMIZATION_CALC',
  META_DESCRIPTION = 'META_DESCRIPTION_CALC',
  HEADING_STRUCTURE = 'HEADING_STRUCTURE_CALC',

  // 語意相關
  SEMANTIC_SIMILARITY = 'SEMANTIC_SIMILARITY_CALC',
  TOPIC_RELEVANCE = 'TOPIC_RELEVANCE_CALC'
}

/**
 * 算法參數定義
 */
export interface AlgorithmParams {
  [key: string]: number | string | boolean | number[];
}

/**
 * 算法執行結果
 */
export interface AlgorithmResult {
  score: number;           // 0-100 分數
  passed: boolean;         // 是否通過
  details?: any;           // 詳細資訊
  suggestions?: string[];  // 改進建議
}
```

#### 2️⃣ Calculator Map 實作

```typescript
// js/modules/scoring-calculator.ts

type CalculatorFunction = (
  content: string,
  params: AlgorithmParams
) => AlgorithmResult;

/**
 * 評分計算器註冊表
 */
class ScoringCalculator {
  private calculators: Map<ScoringAlgorithmId, CalculatorFunction> = new Map();

  constructor() {
    this.registerAllCalculators();
  }

  /**
   * 註冊所有計算器
   */
  private registerAllCalculators(): void {
    // 關鍵字密度計算器
    this.register(
      ScoringAlgorithmId.KEYWORD_DENSITY,
      this.calculateKeywordDensity
    );

    // Flesch 可讀性計算器
    this.register(
      ScoringAlgorithmId.FLESCH_READING_EASE,
      this.calculateFleschReadingEase
    );

    // 平均句長計算器
    this.register(
      ScoringAlgorithmId.AVERAGE_SENTENCE_LENGTH,
      this.calculateAverageSentenceLength
    );

    // ... 註冊其他計算器
  }

  /**
   * 註冊單個計算器
   */
  private register(
    id: ScoringAlgorithmId,
    calculator: CalculatorFunction
  ): void {
    this.calculators.set(id, calculator);
  }

  /**
   * 執行計算
   */
  calculate(
    algorithmId: ScoringAlgorithmId,
    content: string,
    params: AlgorithmParams
  ): AlgorithmResult {
    const calculator = this.calculators.get(algorithmId);

    if (!calculator) {
      throw new Error(`Unknown algorithm: ${algorithmId}`);
    }

    try {
      return calculator(content, params);
    } catch (error) {
      console.error(`Calculator error [${algorithmId}]:`, error);
      return {
        score: 0,
        passed: false,
        details: { error: error.message }
      };
    }
  }

  // ============================================
  // 計算器實作
  // ============================================

  /**
   * 關鍵字密度計算器
   */
  private calculateKeywordDensity(
    content: string,
    params: AlgorithmParams
  ): AlgorithmResult {
    const { keyword, min = 1.5, max = 2.5 } = params;

    // 計算總字數
    const totalWords = content.split(/\s+/).length;

    // 計算關鍵字出現次數
    const regex = new RegExp(keyword as string, 'gi');
    const keywordCount = (content.match(regex) || []).length;

    // 計算密度
    const density = (keywordCount / totalWords) * 100;

    // 判斷是否通過
    const passed = density >= (min as number) && density <= (max as number);

    // 生成建議
    const suggestions: string[] = [];
    if (density < (min as number)) {
      suggestions.push(`關鍵字密度偏低（${density.toFixed(2)}%），建議增加到 ${min}% 以上`);
    } else if (density > (max as number)) {
      suggestions.push(`關鍵字密度過高（${density.toFixed(2)}%），建議降低到 ${max}% 以下`);
    }

    return {
      score: this.calculateDensityScore(density, min as number, max as number),
      passed,
      details: {
        density: density.toFixed(2),
        keywordCount,
        totalWords,
        optimal: [min, max]
      },
      suggestions
    };
  }

  /**
   * Flesch 可讀性計算器
   */
  private calculateFleschReadingEase(
    content: string,
    params: AlgorithmParams
  ): AlgorithmResult {
    // 計算句子數
    const sentences = content.split(/[。！？.!?]+/).filter(s => s.trim()).length;

    // 計算總字數
    const words = content.split(/\s+/).length;

    // 計算總音節數（簡化版：中文按字計算）
    const syllables = content.replace(/\s+/g, '').length;

    // Flesch Reading Ease 公式
    const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);

    // 標準化到 0-100
    const normalizedScore = Math.max(0, Math.min(100, score));

    return {
      score: normalizedScore,
      passed: normalizedScore >= (params.minScore as number || 50),
      details: {
        sentences,
        words,
        syllables,
        avgWordsPerSentence: (words / sentences).toFixed(1),
        avgSyllablesPerWord: (syllables / words).toFixed(1)
      }
    };
  }

  /**
   * 平均句長計算器
   */
  private calculateAverageSentenceLength(
    content: string,
    params: AlgorithmParams
  ): AlgorithmResult {
    const { ideal = 15, tolerance = 5 } = params;

    const sentences = content.split(/[。！？.!?]+/).filter(s => s.trim());
    const totalWords = content.split(/\s+/).length;
    const avgLength = totalWords / sentences.length;

    const passed = Math.abs(avgLength - (ideal as number)) <= (tolerance as number);

    const suggestions: string[] = [];
    if (avgLength > (ideal as number) + (tolerance as number)) {
      suggestions.push('句子偏長，建議拆分為較短的句子以提升可讀性');
    } else if (avgLength < (ideal as number) - (tolerance as number)) {
      suggestions.push('句子偏短，建議適度合併以提升流暢度');
    }

    return {
      score: this.calculateLengthScore(avgLength, ideal as number, tolerance as number),
      passed,
      details: {
        avgLength: avgLength.toFixed(1),
        ideal,
        tolerance
      },
      suggestions
    };
  }

  // ============================================
  // 輔助函數
  // ============================================

  private calculateDensityScore(
    actual: number,
    min: number,
    max: number
  ): number {
    const optimal = (min + max) / 2;
    const deviation = Math.abs(actual - optimal);
    const maxDeviation = Math.max(optimal - min, max - optimal);

    return Math.max(0, 100 - (deviation / maxDeviation) * 100);
  }

  private calculateLengthScore(
    actual: number,
    ideal: number,
    tolerance: number
  ): number {
    const deviation = Math.abs(actual - ideal);
    if (deviation <= tolerance) {
      return 100 - (deviation / tolerance) * 20;
    } else {
      return Math.max(0, 80 - ((deviation - tolerance) / tolerance) * 80);
    }
  }
}

// 全域單例
export const Calculator = new ScoringCalculator();
```

#### 3️⃣ JSON 結構改進

```json
// ✅ 安全：使用預定義的算法 ID
{
  "scoring": {
    "criteria": {
      "keywordUsage": {
        "weight": 30,
        "checks": [
          {
            "id": "density_check",
            "name": "關鍵字密度",
            "algorithmId": "KEYWORD_DENSITY_CALC",  // ← Enum ID
            "params": {                              // ← 只傳參數
              "keyword": "primaryKeyword",
              "min": 1.5,
              "max": 2.5
            },
            "weight": 40
          },
          {
            "id": "readability_check",
            "name": "可讀性",
            "algorithmId": "FLESCH_READING_EASE_CALC",
            "params": {
              "minScore": 50
            },
            "weight": 30
          }
        ]
      }
    }
  }
}
```

#### 4️⃣ 使用範例

```typescript
// 執行評分
const result = Calculator.calculate(
  ScoringAlgorithmId.KEYWORD_DENSITY,
  userContent,
  {
    keyword: '單品咖啡豆',
    min: 1.5,
    max: 2.5
  }
);

console.log(`分數：${result.score}`);
console.log(`通過：${result.passed}`);
console.log(`建議：${result.suggestions}`);
```

---

## ✅ 型別驗證 (Zod Schema)

### 安裝 Zod

```bash
npm install zod
```

### 完整 Schema 定義

```typescript
// js/schemas/level-schema.ts

import { z } from 'zod';

/**
 * 階段類型 Enum
 */
export const PhaseTypeSchema = z.enum([
  'tutorial',
  'demo',
  'practice',
  'score',
  'levelup',
  'custom'
]);

/**
 * 對話訊息 Schema
 */
export const DialogueMessageSchema = z.object({
  speaker: z.string(),
  text: z.string(),
  emotion: z.string().optional(),
  delay: z.number().min(0).max(200).optional(),
  pause: z.number().min(0).max(5000).optional(),
  action: z.string().optional(),
  highlight: z.array(z.string()).optional(),
  sfx: z.string().optional()
});

/**
 * Tutorial 階段 Schema
 */
export const TutorialPhaseSchema = z.object({
  type: z.literal('tutorial'),
  title: z.string(),
  content: z.array(z.object({
    type: z.enum(['text', 'heading', 'list', 'highlight', 'code']),
    content: z.string().optional(),
    level: z.number().optional(),
    style: z.string().optional(),
    items: z.array(z.string()).optional(),
    language: z.string().optional()
  }))
});

/**
 * Demo 階段 Schema
 */
export const DemoPhaseSchema = z.object({
  type: z.literal('demo'),
  title: z.string(),
  characters: z.array(z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    avatar: z.string()
  })),
  dialogue: z.array(DialogueMessageSchema),
  example: z.object({
    topic: z.string(),
    primaryKeywords: z.array(z.string()),
    secondaryKeywords: z.array(z.string()),
    content: z.string(),
    analysis: z.object({
      wordCount: z.number(),
      keywordDensity: z.number(),
      keywordCount: z.record(z.number())
    }).optional()
  }).optional(),
  presentation: z.object({
    autoPlay: z.boolean().optional(),
    skipable: z.boolean().optional(),
    bgMusic: z.string().optional()
  }).optional()
});

/**
 * Practice 階段 Schema
 */
export const PracticePhaseSchema = z.object({
  type: z.literal('practice'),
  title: z.string(),
  mission: z.object({
    scenario: z.string().optional(),
    client: z.string(),
    topic: z.string(),
    target: z.string(),
    tone: z.string().optional()
  }),
  requirements: z.record(z.any()),
  hints: z.array(z.object({
    trigger: z.string(),
    text: z.string(),
    cooldown: z.number().optional(),
    action: z.string().optional()
  })).optional(),
  validationRules: z.array(z.object({
    type: z.string(),
    algorithmId: z.string().optional(),
    params: z.record(z.any()).optional(),
    errorMsg: z.string()
  })).optional()
});

/**
 * Score 階段 Schema
 */
export const ScorePhaseSchema = z.object({
  type: z.literal('score'),
  title: z.string().optional(),
  criteria: z.record(z.object({
    name: z.string().optional(),
    weight: z.number().min(0).max(100),
    checks: z.array(z.object({
      id: z.string(),
      name: z.string(),
      algorithmId: z.string(),
      params: z.record(z.any()).optional(),
      weight: z.number().optional()
    }))
  })),
  feedback: z.object({
    ranges: z.array(z.object({
      min: z.number(),
      max: z.number(),
      grade: z.string(),
      stars: z.number().min(1).max(5),
      message: z.string(),
      reactionText: z.string().optional(),
      npcEmotion: z.string().optional()
    }))
  })
});

/**
 * Levelup 階段 Schema
 */
export const LevelupPhaseSchema = z.object({
  type: z.literal('levelup'),
  title: z.string().optional(),
  expGain: z.number().min(0),
  unlocks: z.array(z.object({
    type: z.enum(['tool', 'note', 'feature']),
    id: z.string(),
    name: z.string(),
    description: z.string(),
    icon: z.string().optional()
  })).optional(),
  achievements: z.array(z.object({
    id: z.string(),
    condition: z.string()
  })).optional(),
  nextLevel: z.object({
    id: z.string(),
    title: z.string(),
    preview: z.string().optional()
  }).optional()
});

/**
 * 階段 Union Schema（彈性支援）
 */
export const PhaseSchema = z.discriminatedUnion('type', [
  TutorialPhaseSchema,
  DemoPhaseSchema,
  PracticePhaseSchema,
  ScorePhaseSchema,
  LevelupPhaseSchema
]);

/**
 * 關卡配置 Schema
 */
export const LevelConfigSchema = z.object({
  timeLimit: z.number().nullable().optional(),
  allowRetry: z.boolean().default(true),
  maxAttempts: z.number().nullable().optional()
});

/**
 * 完整關卡 Schema
 */
export const LevelDataSchema = z.object({
  id: z.string(),
  version: z.string().default('1.0'),
  world: z.number().min(1),
  title: z.string(),
  description: z.string().optional(),
  requiredLevel: z.number().min(1),
  expReward: z.number().min(0),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),

  config: LevelConfigSchema.optional(),

  assets: z.array(z.object({
    type: z.string(),
    ids: z.array(z.string()).optional(),
    url: z.string().optional()
  })).optional(),

  // ⭐ 彈性階段陣列（支援任意順序）
  phases: z.array(PhaseSchema)
});

// 導出型別
export type LevelData = z.infer<typeof LevelDataSchema>;
export type Phase = z.infer<typeof PhaseSchema>;
export type DialogueMessage = z.infer<typeof DialogueMessageSchema>;
```

### 使用 Zod 驗證

```typescript
// js/core/level-loader.ts

import { LevelDataSchema } from './schemas/level-schema';

class LevelLoader {
  /**
   * 載入並驗證關卡資料
   */
  async loadLevel(levelId: string): Promise<LevelData> {
    const response = await fetch(`/data/levels/${this.getLevelPath(levelId)}`);
    const rawData = await response.json();

    try {
      // ✅ Zod 驗證
      const validatedData = LevelDataSchema.parse(rawData);
      return validatedData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Level data validation failed:', error.errors);
        this.showValidationError(error.errors);
      }
      throw new Error(`Failed to load level: ${levelId}`);
    }
  }

  private showValidationError(errors: z.ZodIssue[]): void {
    console.group('❌ 關卡資料驗證失敗');
    errors.forEach(err => {
      console.error(`• ${err.path.join('.')}: ${err.message}`);
    });
    console.groupEnd();
  }

  private getLevelPath(levelId: string): string {
    const [world, level] = levelId.split('-');
    return `world-${world}/${levelId}.json`;
  }
}
```

---

## 🗂️ 狀態正規化

### 問題：混雜的狀態資料

```typescript
// ❌ 問題：計算數據和持久化數據混在一起
{
  level: 3,
  exp: 450,
  totalExp: 1450,
  nextLevelExp: 500,    // ← 這是計算出來的，不該存
  averageScore: 78      // ← 這也是計算出來的
}
```

### 解決方案：分離介面

```typescript
// js/types/user-state.ts

/**
 * 用戶持久化數據（儲存到 localStorage）
 */
export interface UserPersistedData {
  // 等級系統
  level: number;
  exp: number;
  title: string;

  // 關卡進度
  currentWorld: number;
  currentLevel: string;
  currentPhase: string;
  completedLevels: CompletedLevel[];

  // 成就
  unlockedAchievements: string[];
  unlockedTools: string[];
  unlockedNotes: string[];

  // 統計（原始數據）
  totalAttempts: number;
  totalCompleted: number;
  scoreHistory: number[];  // 所有得分記錄

  // 設定
  settings: UserSettings;

  // 元資料
  createdAt: string;
  lastPlayedAt: string;
}

/**
 * 用戶計算數據（不儲存，每次計算）
 */
export interface UserComputedData {
  // 等級相關
  nextLevelExp: number;        // 根據等級計算
  expProgress: number;         // exp / nextLevelExp
  expToNextLevel: number;      // nextLevelExp - exp

  // 統計相關
  totalExp: number;            // sum(completedLevels.expGained)
  averageScore: number;        // avg(scoreHistory)
  completionRate: number;      // totalCompleted / totalLevels
  highestScore: number;        // max(scoreHistory)
  perfectScores: number;       // count(score >= 95)

  // 成就相關
  achievementCount: {
    total: number;
    common: number;
    rare: number;
    epic: number;
    legendary: number;
  };

  // 進度相關
  worldProgress: WorldProgress[];  // 每個世界的完成度
}

/**
 * 完整用戶狀態（UI 使用）
 */
export interface UserState extends UserPersistedData, UserComputedData {}

/**
 * 世界進度
 */
export interface WorldProgress {
  worldId: number;
  totalLevels: number;
  completedLevels: number;
  progress: number;  // completedLevels / totalLevels
}

/**
 * 完成的關卡記錄
 */
export interface CompletedLevel {
  id: string;
  completedAt: string;
  score: number;
  grade: string;
  attempts: number;
  expGained: number;
}

/**
 * 用戶設定
 */
export interface UserSettings {
  mode: 'tutorial' | 'tool';
  soundEnabled: boolean;
  animationEnabled: boolean;
  hintsEnabled: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
}
```

### 狀態管理器實作

```typescript
// js/core/user-state-manager.ts

class UserStateManager {
  private persistedData: UserPersistedData;
  private computedDataCache: UserComputedData | null = null;

  constructor() {
    this.persistedData = this.loadPersistedData();
  }

  /**
   * 獲取完整狀態（包含計算數據）
   */
  getState(): UserState {
    // 如果 cache 失效，重新計算
    if (!this.computedDataCache) {
      this.computedDataCache = this.computeData();
    }

    return {
      ...this.persistedData,
      ...this.computedDataCache
    };
  }

  /**
   * 更新持久化數據
   */
  update(updates: Partial<UserPersistedData>): void {
    this.persistedData = {
      ...this.persistedData,
      ...updates,
      lastPlayedAt: new Date().toISOString()
    };

    // 清除 cache，下次 getState 時會重新計算
    this.computedDataCache = null;

    // 儲存到 localStorage
    this.savePersistedData();
  }

  /**
   * 計算衍生數據
   */
  private computeData(): UserComputedData {
    const { level, exp, completedLevels, scoreHistory, unlockedAchievements } = this.persistedData;

    // 等級相關計算
    const nextLevelExp = this.calculateNextLevelExp(level);
    const expProgress = exp / nextLevelExp;
    const expToNextLevel = nextLevelExp - exp;

    // 統計相關計算
    const totalExp = completedLevels.reduce((sum, l) => sum + l.expGained, 0);
    const averageScore = scoreHistory.length > 0
      ? scoreHistory.reduce((a, b) => a + b, 0) / scoreHistory.length
      : 0;
    const highestScore = scoreHistory.length > 0
      ? Math.max(...scoreHistory)
      : 0;
    const perfectScores = scoreHistory.filter(s => s >= 95).length;

    // 完成度計算
    const totalLevels = this.getTotalLevelsCount();
    const completionRate = completedLevels.length / totalLevels;

    // 成就統計
    const achievementCount = this.countAchievements(unlockedAchievements);

    // 世界進度
    const worldProgress = this.calculateWorldProgress();

    return {
      nextLevelExp,
      expProgress,
      expToNextLevel,
      totalExp,
      averageScore,
      completionRate,
      highestScore,
      perfectScores,
      achievementCount,
      worldProgress
    };
  }

  /**
   * 計算下一級所需經驗值（固定公式）
   */
  private calculateNextLevelExp(currentLevel: number): number {
    // 等級曲線：500 * (level ^ 1.5)
    return Math.floor(500 * Math.pow(currentLevel, 1.5));
  }

  /**
   * 計算世界進度
   */
  private calculateWorldProgress(): WorldProgress[] {
    const worlds = [1, 2, 3];
    return worlds.map(worldId => {
      const worldLevels = this.getLevelsInWorld(worldId);
      const completedInWorld = this.persistedData.completedLevels.filter(l =>
        l.id.startsWith(`${worldId}-`)
      );

      return {
        worldId,
        totalLevels: worldLevels.length,
        completedLevels: completedInWorld.length,
        progress: completedInWorld.length / worldLevels.length
      };
    });
  }

  /**
   * 統計成就數量
   */
  private countAchievements(achievementIds: string[]): any {
    const achievements = AchievementsData.filter(a =>
      achievementIds.includes(a.id)
    );

    return {
      total: achievements.length,
      common: achievements.filter(a => a.rarity === 'common').length,
      rare: achievements.filter(a => a.rarity === 'rare').length,
      epic: achievements.filter(a => a.rarity === 'epic').length,
      legendary: achievements.filter(a => a.rarity === 'legendary').length
    };
  }

  /**
   * 載入持久化數據
   */
  private loadPersistedData(): UserPersistedData {
    const saved = localStorage.getItem('seo_quest_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }

    // 預設數據
    return this.createDefaultData();
  }

  /**
   * 儲存持久化數據
   */
  private savePersistedData(): void {
    localStorage.setItem(
      'seo_quest_user',
      JSON.stringify(this.persistedData)
    );
  }

  /**
   * 建立預設數據
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

  private getTotalLevelsCount(): number {
    // 從關卡資料中取得總數
    return 15; // 假設共 15 關
  }

  private getLevelsInWorld(worldId: number): string[] {
    // 返回該世界的所有關卡 ID
    return [`${worldId}-1`, `${worldId}-2`, `${worldId}-3`];
  }
}

// 全域單例
export const UserState = new UserStateManager();
```

---

## 🔄 彈性化階段系統

### 改進：Array 結構支援任意順序

```json
// ✅ 彈性：可以任意排列階段
{
  "id": "1-1",
  "phases": [
    {
      "type": "tutorial",
      "title": "教學：什麼是關鍵字？",
      "content": [...]
    },
    {
      "type": "demo",
      "title": "劇情示範",
      "dialogue": [...]
    },
    {
      "type": "practice",
      "title": "實戰挑戰",
      "mission": {...}
    },
    {
      "type": "score",
      "criteria": {...}
    },
    {
      "type": "levelup",
      "expGain": 150
    }
  ]
}
```

```json
// ✅ 也可以先實戰再教學！
{
  "id": "2-1",
  "phases": [
    {
      "type": "practice",
      "title": "挑戰題",
      "mission": {...}
    },
    {
      "type": "tutorial",
      "title": "原來如此！",
      "content": [...]
    },
    {
      "type": "score",
      "criteria": {...}
    },
    {
      "type": "levelup",
      "expGain": 200
    }
  ]
}
```

### 階段路由器支援動態順序

```typescript
// js/core/phase-router.ts

class PhaseRouter {
  private phases: Phase[];
  private currentIndex: number = 0;

  constructor(levelData: LevelData) {
    this.phases = levelData.phases;
  }

  /**
   * 前往下一階段
   */
  nextPhase(): void {
    if (this.currentIndex < this.phases.length - 1) {
      this.currentIndex++;
      this.loadPhase(this.phases[this.currentIndex]);
    } else {
      this.completeLevel();
    }
  }

  /**
   * 前往上一階段
   */
  previousPhase(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.loadPhase(this.phases[this.currentIndex]);
    }
  }

  /**
   * 載入階段（根據 type 動態載入）
   */
  private async loadPhase(phase: Phase): Promise<void> {
    // 根據 phase.type 動態載入對應模組
    const module = await import(`./phases/phase-${phase.type}.js`);
    const PhaseRenderer = module.default;

    const renderer = new PhaseRenderer(phase);
    renderer.render();
  }

  /**
   * 跳到指定階段
   */
  jumpToPhase(phaseType: string): void {
    const index = this.phases.findIndex(p => p.type === phaseType);
    if (index !== -1) {
      this.currentIndex = index;
      this.loadPhase(this.phases[index]);
    }
  }

  getCurrentPhase(): Phase {
    return this.phases[this.currentIndex];
  }

  getProgress(): { current: number; total: number; percentage: number } {
    return {
      current: this.currentIndex + 1,
      total: this.phases.length,
      percentage: ((this.currentIndex + 1) / this.phases.length) * 100
    };
  }
}
```

---

## 📚 完整整合範例

### 關卡 JSON 最終優化版

```json
{
  "id": "1-1",
  "version": "1.0",
  "world": 1,
  "title": "關鍵字優化基礎",
  "requiredLevel": 1,
  "expReward": 150,

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

  "phases": [
    {
      "type": "tutorial",
      "title": "教學：什麼是關鍵字？",
      "content": [...]
    },
    {
      "type": "demo",
      "title": "劇情示範：咖啡店老闆的煩惱",
      "characters": [...],
      "dialogue": [...],
      "presentation": {
        "autoPlay": true,
        "skipable": true
      }
    },
    {
      "type": "practice",
      "title": "實戰挑戰",
      "mission": {...},
      "hints": [...],
      "validationRules": [
        {
          "type": "keyword_density",
          "algorithmId": "KEYWORD_DENSITY_CALC",
          "params": {
            "keyword": "primaryKeyword",
            "min": 1.5,
            "max": 2.5
          },
          "errorMsg": "關鍵字密度應在 1.5-2.5% 之間"
        }
      ]
    },
    {
      "type": "score",
      "criteria": {
        "keywordUsage": {
          "weight": 30,
          "checks": [
            {
              "id": "density_check",
              "name": "關鍵字密度",
              "algorithmId": "KEYWORD_DENSITY_CALC",
              "params": {
                "keyword": "primaryKeyword",
                "min": 1.5,
                "max": 2.5
              },
              "weight": 40
            }
          ]
        }
      },
      "feedback": {
        "ranges": [...]
      }
    },
    {
      "type": "levelup",
      "expGain": 150,
      "unlocks": [...],
      "achievements": [...]
    }
  ]
}
```

---

**最後更新**：2026-02-12
**作者**：Claude + 小玫瑰 + Gemini 建議
