/**
 * SGE 文案助手 - 角色資料模組
 * @module data/characters
 *
 * 三角色完整設定：伊歐（領航員）、BLUE（見習生）、哈皮（吟遊詩人）
 */

/** 角色立繪基礎路徑 */
const PORTRAIT_BASE = 'icons/characters/';

export const CHARACTERS = {
  guide: {
    id: 'guide',
    name: '伊歐',
    englishName: 'S‧EO',
    role: '領航員',
    color: '#D4A5A5',
    colorName: 'Rose',
    motto: '別擔心，讓我帶你找到演算法的最短路徑。',
    tags: ['#全域路徑規劃', '#數據觀測分析', '#白帽文案生成'],
    personality: {
      traits: ['冷靜', '溫柔', '有條理'],
      style: 'calm_navigator',
      description: '彷彿在數位迷宮中總能找到出口的引路人'
    },
    portraits: {
      default: PORTRAIT_BASE + 'guide-default-1.png',
      joy: PORTRAIT_BASE + 'guide-joy-1.png',
      happy: PORTRAIT_BASE + 'guide-happy-1.png',
      angry: PORTRAIT_BASE + 'guide-angry-1.png',
      sad: PORTRAIT_BASE + 'guide-sad-1.png',
    }
  },

  player: {
    id: 'player',
    name: 'BLUE',
    englishName: 'BLUE',
    role: '見習生',
    color: '#2C3E50',
    colorName: 'Navy Blue',
    motto: '瞭解使用者的需求，自然懂得演算法。',
    tags: ['#使用者意圖', '#語意搜尋', '#演算法解密'],
    personality: {
      traits: ['安靜', '觀察', '知性'],
      style: 'thoughtful_learner',
      description: '在數位浪潮中尋找出口的少女，總是安靜地觀察著 SERP 的波動'
    },
    portraits: {
      default: PORTRAIT_BASE + 'player-default-1.png',
      joy: PORTRAIT_BASE + 'player-joy-1.png',
      happy: PORTRAIT_BASE + 'player-happy-1.png',
      angry: PORTRAIT_BASE + 'player-angry-1.png',
      sad: PORTRAIT_BASE + 'player-sad-1.png',
    }
  },

  writer: {
    id: 'writer',
    name: '哈皮',
    englishName: 'Happi',
    role: '吟遊詩人',
    color: '#B8A9C9',
    colorName: 'Lavender',
    motto: '文案中，最重要的是靈魂的溫度！',
    tags: ['#人本敘事', '#語感工程', '#靈感共振'],
    personality: {
      traits: ['活潑', '感性', '元氣'],
      style: 'joyful_bard',
      description: '用鋼筆寫故事、用豎琴唱世界的元氣虎牙小詩人'
    },
    portraits: {
      default: PORTRAIT_BASE + 'writer-default-1.png',
      joy: PORTRAIT_BASE + 'writer-joy-1.png',
      angry: PORTRAIT_BASE + 'writer-angry-1.png',
      sad: PORTRAIT_BASE + 'writer-sad-1.png',
    }
  }
};

/**
 * 角色關係網
 * BLUE (學習者)：伊歐最牽掛的學生，負責引導她從「看見數據」到「理解意圖」。
 * Happi (文案)：伊歐的創作搭檔，當伊歐規劃好航線後，Happi 負責用文字的溫度填滿這趟旅程。
 * 伊歐 (SEO)：站在至高點的導航員。她不只是強，她是為了讓大家不迷路而存在的強大。
 */
export const RELATIONSHIPS = {
  guide: {
    toPlayer: '最牽掛的學生，引導她從「看見數據」到「理解意圖」',
    toWriter: '創作搭檔，規劃好航線後由哈皮用文字的溫度填滿旅程',
    selfRole: '站在至高點的導航員，為了讓大家不迷路而存在的強大'
  },
  player: {
    toGuide: '最敬佩的前輩，跟著伊歐學會從數據中讀出意圖',
    toWriter: '欣賞哈皮的感性，學習用溫度取代冰冷的分析',
    selfRole: '在數位浪潮中尋找出口的學習者'
  },
  writer: {
    toGuide: '最信賴的搭檔，有伊歐的航線才能自信地書寫',
    toPlayer: '最想保護的後輩，用故事帶她認識文案的世界',
    selfRole: '用鋼筆寫故事、用豎琴唱世界的元氣詩人'
  }
};

/** 角色 ID 列表 */
export const CHARACTER_IDS = ['guide', 'player', 'writer'];

/** 根據 ID 取得角色 */
export function getCharacter(id) {
  return CHARACTERS[id] || null;
}
