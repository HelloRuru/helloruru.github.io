/**
 * API 連接模組
 * 自動偵測本機 API 或使用 CLI 模式
 */

const API = {
  baseURL: '',
  mode: 'cli', // 'local' or 'cli'
  currentTaskId: null,

  /**
   * 初始化：偵測本機 API 是否可用
   */
  async init() {
    try {
      // 嘗試連接本機 API
      const response = await fetch('http://localhost:3000/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        this.mode = 'local';
        this.baseURL = 'http://localhost:3000';
        console.log('[API] 本機 API 已連接');
        return true;
      }
    } catch (error) {
      // 本機 API 不可用，使用 CLI 模式
      this.mode = 'cli';
      console.log('[API] 使用 CLI 模式');
    }

    return false;
  },

  /**
   * 取得當前模式
   */
  getMode() {
    return this.mode;
  },

  /**
   * 開始掃描（僅限本機模式）
   * @param {Array} queries - 搜尋語句陣列
   * @param {string} domain - 網域
   * @param {number} delay - 間隔（秒）
   * @returns {Promise<string>} taskId
   */
  async startScan(queries, domain, delay = 150) {
    if (this.mode !== 'local') {
      throw new Error('本機 API 未啟動，請使用 CLI 模式');
    }

    const response = await fetch(`${this.baseURL}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries, domain, delay })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '掃描失敗');
    }

    const data = await response.json();
    this.currentTaskId = data.taskId;
    return data.taskId;
  },

  /**
   * 取得任務狀態
   * @param {string} taskId
   * @returns {Promise<Object>}
   */
  async getTaskStatus(taskId) {
    if (this.mode !== 'local') {
      throw new Error('本機 API 未啟動');
    }

    const response = await fetch(`${this.baseURL}/api/task/${taskId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '取得任務狀態失敗');
    }

    return await response.json();
  },

  /**
   * 輪詢任務進度
   * @param {string} taskId
   * @param {Function} onProgress - 進度回調
   * @param {Function} onComplete - 完成回調
   * @param {Function} onError - 錯誤回調
   */
  async pollTaskStatus(taskId, onProgress, onComplete, onError) {
    const poll = async () => {
      try {
        const task = await this.getTaskStatus(taskId);

        if (task.status === 'running' || task.status === 'pending') {
          // 任務進行中，回報進度
          if (onProgress) {
            onProgress(task.progress);
          }

          // 繼續輪詢
          setTimeout(poll, 2000); // 每 2 秒檢查一次

        } else if (task.status === 'completed') {
          // 任務完成
          if (onComplete) {
            onComplete(task.results);
          }

        } else if (task.status === 'failed') {
          // 任務失敗
          if (onError) {
            onError(new Error(task.error || '掃描失敗'));
          }
        }

      } catch (error) {
        if (onError) {
          onError(error);
        }
      }
    };

    // 開始輪詢
    poll();
  }
};

// 頁面載入時初始化
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    API.init();
  });
}
