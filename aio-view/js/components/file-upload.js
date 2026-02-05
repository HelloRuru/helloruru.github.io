/* ================================================
   AIO View — File Upload Component
   檔案上傳區域
   ================================================ */

const FileUpload = {
  /** DOM 元素 */
  elements: {
    zone: null,
    input: null
  },

  /** 回呼函數 */
  onUpload: null,

  /**
   * 初始化
   * @param {Function} callback - 上傳成功後的回呼
   */
  init(callback) {
    this.onUpload = callback;

    this.elements.zone = document.getElementById('upload-zone');
    this.elements.input = document.getElementById('file-input');

    this.bindEvents();
  },

  /**
   * 綁定事件
   */
  bindEvents() {
    const { zone, input } = this.elements;

    if (!zone || !input) return;

    // 點擊上傳
    zone.addEventListener('click', () => input.click());

    // 拖曳進入
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });

    // 拖曳離開
    zone.addEventListener('dragleave', () => {
      zone.classList.remove('dragover');
    });

    // 放下檔案
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      this.handleFile(e.dataTransfer.files[0]);
    });

    // 選擇檔案
    input.addEventListener('change', (e) => {
      this.handleFile(e.target.files[0]);
    });
  },

  /**
   * 處理上傳的檔案
   * @param {File} file - 檔案物件
   */
  handleFile(file) {
    if (!file) return;

    // 驗證檔案類型
    if (!file.name.endsWith('.json')) {
      Toast.error('請上傳 JSON 檔案');
      return;
    }

    // 讀取檔案
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        // 驗證格式
        if (!this.validateResults(data)) {
          throw new Error('檔案格式不正確');
        }

        // 執行回呼
        if (this.onUpload) {
          this.onUpload(data);
        }

        Toast.success('結果已載入');

      } catch (error) {
        Toast.error(error.message || '檔案解析失敗');
        console.error('File parse error:', error);
      }
    };

    reader.onerror = () => {
      Toast.error('檔案讀取失敗');
    };

    reader.readAsText(file);
  },

  /**
   * 驗證結果格式
   * @param {Object} data - 資料
   * @returns {boolean} 是否有效
   */
  validateResults(data) {
    return data && Array.isArray(data.results);
  }
};
