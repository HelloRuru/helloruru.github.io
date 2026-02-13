/**
 * SEO Quest — 全域配置
 */

export const Config = {
  version: '1.0.0',
  debug: localStorage.getItem('seo_quest_debug') === 'true',

  // 資料路徑
  paths: {
    levels: './data/levels',
    characters: './data/characters.json',
    // achievements: './data/achievements.json',  // World 2+ 再啟用
  },

  // 等級系統
  levels: {
    maxLevel: 10,
    expTable: [0, 150, 350, 600, 1000, 1500, 2200, 3000, 4000, 5500],
    titles: [
      'SEO 新手',       // Lv.1
      'SEO 見習生',     // Lv.2
      'SEO 學徒',       // Lv.3
      '文案專員',       // Lv.4
      '關鍵字獵人',     // Lv.5
      'SEO 策略師',     // Lv.6
      '內容建築師',     // Lv.7
      '流量指揮官',     // Lv.8
      'SEO 專家',       // Lv.9
      'SEO 大師',       // Lv.10
    ],
  },

  // 世界配置
  worlds: [
    { id: 1, title: '世界 1：SEO 基礎', levels: ['1-1', '1-2', '1-3', '1-4', '1-5'] },
    { id: 2, title: '世界 2：進階技巧', levels: ['2-1', '2-2', '2-3', '2-4', '2-5'] },
    { id: 3, title: '世界 3：實戰應用', levels: ['3-1', '3-2', '3-3', '3-4', '3-5'] },
  ],

  // 五階段名稱
  phases: ['tutorial', 'demo', 'practice', 'score', 'levelup'],
  phaseNames: {
    tutorial: '教學',
    demo: '示範',
    practice: '實作',
    score: '評分',
    levelup: '升級',
  },
};
