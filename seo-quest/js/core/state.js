/**
 * SEO Quest — 全域狀態管理
 */

import { Storage } from './storage.js';
import { Events } from './events.js';
import { Config } from '../config.js';

const saved = Storage.load();

export const State = {
  // 持久化資料（存進 localStorage）
  user: saved.user,
  completedLevels: saved.completedLevels,
  unlockedTools: saved.unlockedTools,
  achievements: saved.achievements,
  settings: saved.settings,

  // 運行時資料（不存檔）
  currentView: 'mode-select',   // mode-select | level-map | phase | tool
  currentLevel: null,            // 當前關卡 JSON 資料
  currentLevelId: null,          // '1-1'
  currentPhase: null,            // tutorial | demo | practice | score | levelup
  characters: null,              // 角色資料

  // 更新狀態並通知
  update(key, value) {
    this[key] = value;
    Events.emit('state:change', { key, value });
    Events.emit(`state:${key}`, value);
  },

  // 持久化儲存
  persist() {
    Storage.save({
      version: '1.0',
      user: this.user,
      completedLevels: this.completedLevels,
      unlockedTools: this.unlockedTools,
      achievements: this.achievements,
      settings: this.settings,
    });
  },

  // 增加經驗值，自動升級
  addExp(amount) {
    try {
      this.user.exp += amount;
      const table = Config.levels.expTable;
      while (this.user.level < Config.levels.maxLevel && this.user.exp >= table[this.user.level]) {
        this.user.exp -= table[this.user.level];
        this.user.level++;
      }
    } finally {
      this.persist();
    }
    Events.emit('state:user', this.user);
  },

  // 取得當前等級稱號
  get title() {
    return Config.levels.titles[this.user.level - 1] || 'SEO 新手';
  },

  // 取得升級所需經驗值
  get expToNext() {
    return Config.levels.expTable[this.user.level] || 9999;
  },
};
