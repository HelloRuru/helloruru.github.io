# SEO Quest — 資料結構說明

> 完整的 JSON 資料結構定義與範例
> 更新日期：2026-02-12

---

## 📋 目錄

- [關卡資料結構](#關卡資料結構)
- [角色資料結構](#角色資料結構)
- [成就資料結構](#成就資料結構)
- [評分規則結構](#評分規則結構)
- [使用者進度結構](#使用者進度結構)

---

## 🎮 關卡資料結構

### 檔案位置
`data/levels/world-{N}/{N}-{M}.json`

### 完整範例

```json
{
  "id": "1-1",
  "world": 1,
  "title": "關鍵字優化基礎",
  "description": "學習如何選擇並使用有效的 SEO 關鍵字",
  "requiredLevel": 1,
  "expReward": 150,
  "difficulty": "beginner",

  "phases": {

    "tutorial": {
      "title": "教學：什麼是關鍵字？",
      "content": [
        {
          "type": "text",
          "content": "關鍵字是用戶在搜尋引擎輸入的字詞，好的關鍵字能讓你的文章被更多人看見。"
        },
        {
          "type": "heading",
          "level": 3,
          "content": "三大關鍵字類型"
        },
        {
          "type": "list",
          "style": "numbered",
          "items": [
            "主要關鍵字：文章核心主題 (1-2個)",
            "次要關鍵字：相關延伸主題 (3-5個)",
            "長尾關鍵字：具體問題型關鍵字"
          ]
        },
        {
          "type": "highlight",
          "content": "💡 關鍵字密度建議：1.5-2.5%"
        },
        {
          "type": "code",
          "language": "text",
          "content": "範例：「咖啡豆推薦」是主要關鍵字\n「單品咖啡豆」、「淺焙咖啡」是次要關鍵字"
        }
      ]
    },

    "demo": {
      "title": "劇情示範：咖啡店老闆的煩惱",
      "characters": [
        {
          "id": "mia",
          "name": "Mia",
          "role": "咖啡店老闆",
          "avatar": "☕"
        },
        {
          "id": "aria",
          "name": "Aria",
          "role": "SEO 導師",
          "avatar": "🧙"
        }
      ],
      "dialogue": [
        {
          "speaker": "mia",
          "text": "我的咖啡店剛開幕，想寫一篇部落格介紹我們的『單品咖啡豆』，但不知道要用什麼關鍵字才能讓客人找到我..."
        },
        {
          "speaker": "aria",
          "text": "讓我示範給你看！首先，我們要思考：目標客群會搜尋什麼？"
        },
        {
          "speaker": "aria",
          "text": "對於咖啡新手來說，他們可能會搜尋『咖啡豆推薦』、『單品咖啡豆』或『精品咖啡』。"
        }
      ],
      "example": {
        "topic": "單品咖啡豆介紹",
        "primaryKeywords": ["單品咖啡豆", "精品咖啡"],
        "secondaryKeywords": [
          "咖啡豆推薦",
          "咖啡豆選購",
          "淺焙咖啡",
          "手沖咖啡豆",
          "咖啡風味"
        ],
        "content": "【單品咖啡豆入門指南】精品咖啡新手必看\n\n想品嚐一杯好咖啡，選對咖啡豆是關鍵。本文將介紹單品咖啡豆的選購技巧，幫助你找到最適合的精品咖啡。無論你偏好淺焙咖啡的花果香，還是深焙的巧克力風味，都能在這裡找到咖啡豆推薦。\n\n什麼是單品咖啡豆？\n單品咖啡豆指的是來自單一產區、單一莊園的咖啡豆。相較於混豆，單品咖啡更能展現產地的獨特風味...",
        "analysis": {
          "wordCount": 156,
          "keywordDensity": 2.1,
          "keywordCount": {
            "單品咖啡豆": 3,
            "精品咖啡": 2,
            "咖啡豆": 5,
            "淺焙咖啡": 1,
            "咖啡豆推薦": 1
          }
        },
        "comments": [
          {
            "speaker": "aria",
            "text": "看到了嗎？我在開頭就使用了『單品咖啡豆』和『精品咖啡』，並且自然地融入次要關鍵字。"
          },
          {
            "speaker": "mia",
            "text": "原來如此！我懂了！"
          }
        ]
      }
    },

    "practice": {
      "title": "實戰挑戰：撰寫你的 SEO 文案",
      "mission": {
        "scenario": "你是一位 SEO 文案師，客戶委託你撰寫部落格文章。",
        "client": "手工皂工作室『純淨生活』",
        "topic": "天然手工皂製作介紹",
        "target": "吸引對天然保養品有興趣的 25-40 歲女性消費者",
        "tone": "溫暖、專業、易懂"
      },
      "requirements": {
        "primaryKeywords": {
          "count": 2,
          "hint": "想想目標客群會搜尋什麼？",
          "examples": ["天然手工皂", "手工皂製作"]
        },
        "secondaryKeywords": {
          "count": 5,
          "hint": "列出相關主題，擴大搜尋觸及",
          "examples": ["手工皂推薦", "天然保養品", "冷製皂"]
        },
        "content": {
          "minLength": 100,
          "maxLength": 150,
          "hint": "撰寫文章開頭段落，吸引讀者並自然融入關鍵字",
          "structure": "標題 + 引言段落"
        }
      },
      "hints": [
        {
          "trigger": "density_low",
          "message": "💡 提示：關鍵字密度偏低，試著在第 2-3 句自然加入次要關鍵字"
        },
        {
          "trigger": "keyword_stuffing",
          "message": "⚠️ 注意：關鍵字太密集了！記得要『自然』融入，不要刻意堆砌"
        }
      ],
      "realTimeChecks": [
        "wordCount",
        "keywordDensity",
        "keywordUsage",
        "readability"
      ]
    },

    "scoring": {
      "criteria": {
        "keywordSelection": {
          "weight": 30,
          "checks": [
            {
              "id": "primary_keywords_relevant",
              "name": "主要關鍵字相關性",
              "points": 10,
              "description": "主要關鍵字與主題高度相關"
            },
            {
              "id": "secondary_keywords_diverse",
              "name": "次要關鍵字多樣性",
              "points": 10,
              "description": "次要關鍵字涵蓋不同面向"
            },
            {
              "id": "long_tail_included",
              "name": "長尾關鍵字使用",
              "points": 10,
              "description": "包含具體問題型關鍵字"
            }
          ]
        },
        "keywordUsage": {
          "weight": 30,
          "checks": [
            {
              "id": "density_optimal",
              "name": "關鍵字密度適中",
              "points": 12,
              "description": "密度在 1.5-2.5% 之間",
              "formula": "(keywordCount / totalWords) * 100"
            },
            {
              "id": "natural_placement",
              "name": "自然融入",
              "points": 10,
              "description": "關鍵字出現位置自然流暢"
            },
            {
              "id": "primary_frequency",
              "name": "主關鍵字頻率",
              "points": 8,
              "description": "主要關鍵字出現 2-4 次"
            }
          ]
        },
        "contentQuality": {
          "weight": 40,
          "checks": [
            {
              "id": "engaging_opening",
              "name": "吸引人的開頭",
              "points": 15,
              "description": "開頭能引起讀者興趣"
            },
            {
              "id": "clear_structure",
              "name": "結構清晰",
              "points": 15,
              "description": "段落分明，邏輯順暢"
            },
            {
              "id": "target_audience_fit",
              "name": "符合目標受眾",
              "points": 10,
              "description": "語氣和內容適合目標讀者"
            }
          ]
        }
      },
      "feedback": {
        "ranges": [
          {
            "min": 95,
            "max": 100,
            "grade": "excellent",
            "stars": 5,
            "message": "完美！你已經完全掌握關鍵字優化的精髓！這篇文案不僅 SEO 友好，而且內容品質極佳。"
          },
          {
            "min": 85,
            "max": 94,
            "grade": "good",
            "stars": 4,
            "message": "不錯的開始！你已經掌握關鍵字的基本概念，但還有進步空間。注意關鍵字的自然度，避免過度優化。"
          },
          {
            "min": 75,
            "max": 84,
            "grade": "pass",
            "stars": 3,
            "message": "及格了，但還有進步空間。試著讓關鍵字更自然地融入內容，同時提升文案的吸引力。"
          },
          {
            "min": 65,
            "max": 74,
            "grade": "need_improve",
            "stars": 2,
            "message": "還需要加強。回顧一下教學內容，特別注意關鍵字的選擇和使用方式。"
          },
          {
            "min": 0,
            "max": 64,
            "grade": "fail",
            "stars": 1,
            "message": "別灰心！讓我們再複習一次關鍵字的概念。SEO 需要練習，多嘗試幾次就會進步。"
          }
        ]
      },
      "bossComment": {
        "character": "aria",
        "messages": {
          "excellent": "太棒了！你已經是關鍵字優化的高手了！",
          "good": "很好的嘗試！繼續保持這個學習態度。",
          "pass": "不錯，但記得要讓關鍵字『自然』出現。",
          "need_improve": "再多練習幾次，你會越來越好的！",
          "fail": "沒關係，我們一起再看一次示範吧！"
        }
      }
    },

    "levelup": {
      "expGain": 150,
      "unlocks": [
        {
          "type": "tool",
          "id": "ai_keyword_suggest",
          "name": "AI 關鍵字建議",
          "description": "AI 幫你分析並建議相關關鍵字",
          "icon": "🤖"
        },
        {
          "type": "tool",
          "id": "keyword_density_checker",
          "name": "關鍵字密度檢測器",
          "description": "即時顯示關鍵字密度和分布",
          "icon": "📊"
        },
        {
          "type": "note",
          "id": "keyword_tips",
          "title": "關鍵字自然融入的 5 個技巧",
          "content": [
            "1. 在標題中使用主要關鍵字",
            "2. 在開頭段落自然提及",
            "3. 使用同義詞和相關詞",
            "4. 避免在同一句中重複",
            "5. 讓內容優先，SEO 其次"
          ],
          "icon": "📚"
        }
      ],
      "achievements": [
        {
          "id": "first_quest_complete",
          "condition": "complete_first_level",
          "message": "恭喜完成第一個關卡！"
        }
      ],
      "nextLevel": {
        "id": "1-2",
        "title": "標題優化技巧",
        "preview": "學習如何撰寫吸引人又 SEO 友好的標題..."
      }
    }
  }
}
```

---

## 👥 角色資料結構

### 檔案位置
`data/characters.json`

### 範例

```json
{
  "characters": [
    {
      "id": "aria",
      "name": "Aria",
      "title": "SEO 導師",
      "avatar": "🧙",
      "description": "經驗豐富的 SEO 專家，擅長用簡單的方式解釋複雜概念。",
      "personality": "親切、專業、鼓勵",
      "voiceTone": "溫暖而有耐心"
    },
    {
      "id": "mia",
      "name": "Mia",
      "title": "咖啡店老闆",
      "avatar": "☕",
      "description": "剛開始經營咖啡店，想學習如何用 SEO 吸引客人。",
      "personality": "好學、謙虛、積極"
    },
    {
      "id": "leo",
      "name": "Leo",
      "title": "手工皂創業者",
      "avatar": "🧼",
      "description": "經營手工皂工作室，希望透過部落格行銷產品。"
    }
  ]
}
```

---

## 🏆 成就資料結構

### 檔案位置
`data/achievements.json`

### 範例

```json
{
  "achievements": [
    {
      "id": "first_quest",
      "title": "關鍵字新手",
      "description": "完成第一個關卡",
      "icon": "🏆",
      "rarity": "common",
      "condition": {
        "type": "complete_level",
        "levelId": "1-1"
      },
      "reward": {
        "exp": 50,
        "title": "關鍵字見習生"
      }
    },
    {
      "id": "perfect_score",
      "title": "完美主義者",
      "description": "在任意關卡獲得 95 分以上",
      "icon": "⭐",
      "rarity": "rare",
      "condition": {
        "type": "score_threshold",
        "minScore": 95
      },
      "reward": {
        "exp": 100
      }
    },
    {
      "id": "win_streak_3",
      "title": "連勝三場",
      "description": "連續三個關卡獲得 80 分以上",
      "icon": "🔥",
      "rarity": "rare",
      "condition": {
        "type": "consecutive_scores",
        "count": 3,
        "minScore": 80
      },
      "reward": {
        "exp": 150
      }
    },
    {
      "id": "world_1_complete",
      "title": "世界征服者 I",
      "description": "完成世界 1 的所有關卡",
      "icon": "👑",
      "rarity": "epic",
      "condition": {
        "type": "complete_world",
        "worldId": 1
      },
      "reward": {
        "exp": 500,
        "title": "SEO 實習生"
      }
    },
    {
      "id": "seo_master",
      "title": "SEO 大師",
      "description": "完成所有關卡並達到 Lv.10",
      "icon": "🌟",
      "rarity": "legendary",
      "condition": {
        "type": "all_complete_and_level",
        "minLevel": 10
      },
      "reward": {
        "exp": 1000,
        "title": "SEO 大師",
        "certificate": true
      }
    }
  ]
}
```

---

## 📊 評分規則結構

### 檔案位置
`data/scoring-rules.json`

### 範例

```json
{
  "version": "1.0",
  "totalWeight": 100,

  "criteria": {
    "keywordSelection": {
      "name": "關鍵字選擇",
      "weight": 30,
      "description": "主要和次要關鍵字的選擇是否恰當",
      "checks": [
        {
          "id": "primary_relevance",
          "name": "主關鍵字相關性",
          "weight": 40,
          "algorithm": "semantic_similarity"
        },
        {
          "id": "secondary_diversity",
          "name": "次要關鍵字多樣性",
          "weight": 30,
          "algorithm": "diversity_score"
        },
        {
          "id": "long_tail_usage",
          "name": "長尾關鍵字",
          "weight": 30,
          "algorithm": "long_tail_detection"
        }
      ]
    },

    "keywordUsage": {
      "name": "關鍵字使用",
      "weight": 30,
      "description": "關鍵字的密度和分布是否適當",
      "checks": [
        {
          "id": "density",
          "name": "關鍵字密度",
          "weight": 40,
          "optimal": [1.5, 2.5],
          "algorithm": "density_calculation"
        },
        {
          "id": "distribution",
          "name": "關鍵字分布",
          "weight": 30,
          "algorithm": "distribution_analysis"
        },
        {
          "id": "naturalness",
          "name": "自然度",
          "weight": 30,
          "algorithm": "naturalness_check"
        }
      ]
    },

    "contentQuality": {
      "name": "內容品質",
      "weight": 40,
      "description": "文案的整體品質和可讀性",
      "checks": [
        {
          "id": "engagement",
          "name": "吸引力",
          "weight": 35,
          "algorithm": "engagement_score"
        },
        {
          "id": "structure",
          "name": "結構清晰度",
          "weight": 35,
          "algorithm": "structure_analysis"
        },
        {
          "id": "readability",
          "name": "可讀性",
          "weight": 30,
          "algorithm": "readability_index"
        }
      ]
    }
  },

  "algorithms": {
    "density_calculation": {
      "formula": "(keywordCount / totalWords) * 100",
      "optimal": [1.5, 2.5],
      "scoring": {
        "perfect": [1.8, 2.2],
        "good": [1.5, 2.5],
        "acceptable": [1.0, 3.0],
        "poor": "outside_range"
      }
    },

    "readability_index": {
      "formula": "flesch_reading_ease",
      "factors": [
        "averageSentenceLength",
        "averageSyllablesPerWord"
      ],
      "scoring": {
        "excellent": [60, 100],
        "good": [50, 60],
        "acceptable": [30, 50],
        "poor": [0, 30]
      }
    }
  }
}
```

---

## 💾 使用者進度結構

### 儲存位置
`localStorage: 'seo_quest_progress'`

### 範例

```json
{
  "version": "1.0",
  "lastUpdated": "2026-02-12T10:30:00Z",

  "user": {
    "level": 3,
    "exp": 450,
    "totalExp": 1450,
    "nextLevelExp": 500,
    "title": "SEO 見習生",
    "totalScore": 2340,
    "averageScore": 78
  },

  "progress": {
    "currentWorld": 1,
    "currentLevel": "1-3",
    "currentPhase": "practice",

    "completedLevels": [
      {
        "id": "1-1",
        "completedAt": "2026-02-11T14:20:00Z",
        "score": 85,
        "grade": "good",
        "attempts": 1
      },
      {
        "id": "1-2",
        "completedAt": "2026-02-11T15:45:00Z",
        "score": 78,
        "grade": "pass",
        "attempts": 2
      }
    ],

    "inProgress": {
      "levelId": "1-3",
      "phase": "practice",
      "startedAt": "2026-02-12T10:00:00Z",
      "draft": {
        "primaryKeywords": ["天然手工皂", "手工皂製作"],
        "secondaryKeywords": ["手工皂推薦", "天然保養品"],
        "content": "..."
      }
    }
  },

  "achievements": {
    "unlocked": [
      {
        "id": "first_quest",
        "unlockedAt": "2026-02-11T14:20:00Z"
      },
      {
        "id": "perfect_score",
        "unlockedAt": "2026-02-11T14:20:00Z"
      }
    ],
    "total": 2,
    "rare": 1
  },

  "unlockedTools": [
    "ai_keyword_suggest",
    "keyword_density_checker"
  ],

  "notes": [
    {
      "id": "keyword_tips",
      "title": "關鍵字自然融入的 5 個技巧",
      "unlockedAt": "2026-02-11T14:20:00Z"
    }
  ],

  "stats": {
    "totalPlayTime": 3600,
    "totalAttempts": 5,
    "totalCompleted": 2,
    "completionRate": 0.4,
    "highestScore": 85,
    "perfectScores": 1
  },

  "settings": {
    "mode": "tutorial",
    "soundEnabled": true,
    "animationEnabled": true,
    "hintsEnabled": true
  }
}
```

---

## 📝 資料驗證

### 必填欄位檢查

每個關卡 JSON 必須包含：
- `id` (string)
- `world` (number)
- `title` (string)
- `requiredLevel` (number)
- `expReward` (number)
- `phases` (object with 5 keys)

### 權重總和檢查

評分規則的權重必須滿足：
```javascript
sum(criteria.*.weight) === 100
```

### 資料型別檢查

使用 JSON Schema 驗證：
```bash
npm run validate-data
```

---

**最後更新**：2026-02-12
