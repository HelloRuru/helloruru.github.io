/**
 * AIO View API Server
 * 提供 Google AI Overview 監測服務
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const queue = require('./queue');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// API 資訊
app.get('/api', (req, res) => {
  res.json({
    name: 'AIO View API',
    version: '1.0.0',
    mode: 'local',
    endpoints: {
      POST: {
        '/api/scan': '建立掃描任務'
      },
      GET: {
        '/api/task/:taskId': '取得任務狀態與結果',
        '/api/tasks': '取得所有任務概覽',
        '/health': '健康檢查'
      }
    }
  });
});

/**
 * POST /api/scan
 * 建立掃描任務
 *
 * Body:
 * {
 *   "queries": [
 *     { "url": "...", "title": "...", "query": "..." },
 *     ...
 *   ],
 *   "domain": "example.com",
 *   "delay": 150  // 選填，預設 150 秒
 * }
 *
 * Response:
 * {
 *   "taskId": "uuid",
 *   "message": "任務已建立"
 * }
 */
app.post('/api/scan', (req, res) => {
  try {
    const { queries, domain, delay = 150 } = req.body;

    // 驗證
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({
        error: 'queries 必須是非空陣列'
      });
    }

    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({
        error: 'domain 為必填欄位'
      });
    }

    // 限制最多 100 個語句（避免濫用）
    if (queries.length > 100) {
      return res.status(400).json({
        error: '單次最多掃描 100 個語句'
      });
    }

    // 建立任務
    const taskId = queue.createTask(queries, domain, delay);

    res.json({
      taskId,
      message: '任務已建立，正在佇列中'
    });

  } catch (error) {
    console.error('建立任務失敗：', error);
    res.status(500).json({
      error: '伺服器錯誤'
    });
  }
});

/**
 * GET /api/task/:taskId
 * 取得任務狀態與結果
 *
 * Response:
 * {
 *   "id": "uuid",
 *   "status": "pending|running|completed|failed",
 *   "domain": "example.com",
 *   "progress": {
 *     "completed": 10,
 *     "total": 50,
 *     "percentage": 20,
 *     "current": "搜尋語句"
 *   },
 *   "results": [...],  // 僅在 completed 時回傳
 *   "error": "...",     // 僅在 failed 時回傳
 *   "createdAt": "...",
 *   "startedAt": "...",
 *   "completedAt": "..."
 * }
 */
app.get('/api/task/:taskId', (req, res) => {
  const { taskId } = req.params;

  const task = queue.getTask(taskId);

  if (!task) {
    return res.status(404).json({
      error: '任務不存在'
    });
  }

  res.json(task);
});

/**
 * GET /api/tasks
 * 取得所有任務概覽（不含結果）
 *
 * Response:
 * {
 *   "tasks": [...]
 * }
 */
app.get('/api/tasks', (req, res) => {
  const tasks = queue.getAllTasks();

  res.json({
    tasks,
    total: tasks.length
  });
});

/**
 * DELETE /api/task/:taskId
 * 刪除已完成或失敗的任務
 */
app.delete('/api/task/:taskId', (req, res) => {
  const { taskId } = req.params;

  const success = queue.deleteTask(taskId);

  if (!success) {
    return res.status(400).json({
      error: '無法刪除任務（可能正在執行或不存在）'
    });
  }

  res.json({
    message: '任務已刪除'
  });
});

// 提供前端靜態檔案
// 指向上層目錄（aio-view/），包含 index.html, style.css, js/ 等
app.use(express.static(path.join(__dirname, '../../')));

// 所有非 API 路徑都返回 index.html（SPA fallback）
app.get('*', (req, res) => {
  // 如果是 API 路徑但沒有匹配到，返回 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: '找不到此 API 路徑'
    });
  }

  // 否則返回 index.html
  res.sendFile(path.join(__dirname, '../../index.html'));
});

// 錯誤處理
app.use((err, req, res, next) => {
  console.error('伺服器錯誤：', err);
  res.status(500).json({
    error: '伺服器內部錯誤'
  });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║           AIO View API Server 已啟動                ║
╚════════════════════════════════════════════════════╝

監聽端口：${PORT}
API 文件：http://localhost:${PORT}/

準備接收掃描任務...
  `);
});

// 優雅關閉
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信號，正在關閉伺服器...');
  process.exit(0);
});
