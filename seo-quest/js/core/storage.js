/**
 * SEO Quest — localStorage 持久化
 */

const STORAGE_KEY = 'seo_quest_progress';

const defaultProgress = {
  version: '1.0',
  user: { level: 1, exp: 0, totalScore: 0 },
  completedLevels: {},
  unlockedTools: [],
  achievements: [],
  settings: { mode: null, hintsEnabled: true },
};

export const Storage = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...defaultProgress };
      const data = JSON.parse(raw);
      return { ...defaultProgress, ...data };
    } catch {
      return { ...defaultProgress };
    }
  },

  save(data) {
    try {
      data.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('[Storage] Quota exceeded, clearing old data');
        this.reset();
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
        catch { console.error('[Storage] Save failed even after reset'); }
      } else {
        console.warn('[Storage] Save failed:', e);
      }
    }
  },

  reset() {
    localStorage.removeItem(STORAGE_KEY);
  },
};
