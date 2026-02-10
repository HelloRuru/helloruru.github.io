/**
 * Task Queue Manager — 簡易任務佇列
 * 使用 in-memory 儲存，適合單一實例部署
 */

const { v4: uuidv4 } = require('uuid');
const { scan } = require('./scanner');

class TaskQueue {
  constructor() {
    this.tasks = new Map(); // taskId -> task object
    this.isProcessing = false;
  }

  /**
   * 建立新任務
   * @param {Array} queries - 搜尋語句陣列
   * @param {string} domain - 要監測的網域
   * @param {number} delay - 搜尋間隔（秒）
   * @returns {string} taskId
   */
  createTask(queries, domain, delay = 150) {
    const taskId = uuidv4();

    const task = {
      id: taskId,
      status: 'pending', // pending, running, completed, failed
      queries,
      domain,
      delay,
      progress: {
        completed: 0,
        total: queries.length,
        percentage: 0,
        current: null
      },
      results: [],
      error: null,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null
    };

    this.tasks.set(taskId, task);

    // 如果目前沒有正在執行的任務，立即開始
    if (!this.isProcessing) {
      this.processQueue();
    }

    return taskId;
  }

  /**
   * 取得任務狀態
   * @param {string} taskId
   * @returns {Object|null}
   */
  getTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    // 只回傳必要資訊，避免傳輸過大
    return {
      id: task.id,
      status: task.status,
      domain: task.domain,
      progress: task.progress,
      createdAt: task.createdAt,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      error: task.error,
      // 只在完成時才傳遞結果
      results: task.status === 'completed' ? task.results : undefined
    };
  }

  /**
   * 處理佇列（依序執行任務）
   */
  async processQueue() {
    if (this.isProcessing) return;

    // 找到第一個待處理的任務
    const pendingTask = Array.from(this.tasks.values())
      .find(task => task.status === 'pending');

    if (!pendingTask) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    pendingTask.status = 'running';
    pendingTask.startedAt = new Date().toISOString();

    console.log(`開始處理任務 ${pendingTask.id}`);

    try {
      // 執行掃描，傳入進度回調
      const results = await scan(
        pendingTask.queries,
        pendingTask.domain,
        (progress) => {
          // 更新任務進度
          pendingTask.progress = progress;
        },
        pendingTask.delay
      );

      // 任務完成
      pendingTask.status = 'completed';
      pendingTask.results = results;
      pendingTask.completedAt = new Date().toISOString();

      console.log(`任務 ${pendingTask.id} 完成，掃描 ${results.length} 個語句`);

    } catch (error) {
      // 任務失敗
      pendingTask.status = 'failed';
      pendingTask.error = error.message;
      pendingTask.completedAt = new Date().toISOString();

      console.error(`任務 ${pendingTask.id} 失敗：${error.message}`);
    }

    this.isProcessing = false;

    // 繼續處理下一個任務
    this.processQueue();
  }

  /**
   * 取得佇列中所有任務的概覽
   * @returns {Array}
   */
  getAllTasks() {
    return Array.from(this.tasks.values()).map(task => ({
      id: task.id,
      status: task.status,
      domain: task.domain,
      progress: task.progress,
      createdAt: task.createdAt
    }));
  }

  /**
   * 刪除任務（僅限已完成或失敗的任務）
   * @param {string} taskId
   * @returns {boolean}
   */
  deleteTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    // 不允許刪除正在執行的任務
    if (task.status === 'running' || task.status === 'pending') {
      return false;
    }

    this.tasks.delete(taskId);
    return true;
  }

  /**
   * 清理超過 24 小時的已完成任務
   */
  cleanup() {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    for (const [taskId, task] of this.tasks.entries()) {
      if (
        (task.status === 'completed' || task.status === 'failed') &&
        new Date(task.completedAt).getTime() < oneDayAgo
      ) {
        this.tasks.delete(taskId);
        console.log(`清理過期任務 ${taskId}`);
      }
    }
  }
}

// 單例模式
const queue = new TaskQueue();

// 每小時清理一次過期任務
setInterval(() => {
  queue.cleanup();
}, 60 * 60 * 1000);

module.exports = queue;
