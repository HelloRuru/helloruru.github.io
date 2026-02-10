/**
 * SGE 文案助手 - 支語小警察詞彙資料庫
 * @module data/zhiyu-words
 *
 * 大陸用語 → 台灣用語對照表
 * severity: 'high'（明確大陸用語）/ 'medium'（兩岸皆用但台灣有更常用說法）
 */

export const ZHIYU_DATABASE = {
  // ─── 科技類 ───────────────────────────
  tech: [
    { mainland: '軟件', taiwan: ['軟體'], severity: 'high' },
    { mainland: '硬件', taiwan: ['硬體'], severity: 'high' },
    { mainland: '服務器', taiwan: ['伺服器'], severity: 'high' },
    { mainland: '鏈接', taiwan: ['連結', '鏈結'], severity: 'high' },
    { mainland: '程序', taiwan: ['程式'], severity: 'high' },
    { mainland: '視頻', taiwan: ['影片', '視訊'], severity: 'high' },
    { mainland: '網絡', taiwan: ['網路'], severity: 'high' },
    { mainland: '在線', taiwan: ['線上'], severity: 'high' },
    { mainland: '默認', taiwan: ['預設'], severity: 'high' },
    { mainland: '文檔', taiwan: ['文件', '檔案'], severity: 'high' },
    { mainland: '接口', taiwan: ['介面'], severity: 'high' },
    { mainland: '內存', taiwan: ['記憶體'], severity: 'high' },
    { mainland: '帶寬', taiwan: ['頻寬'], severity: 'high' },
    { mainland: '寬帶', taiwan: ['寬頻'], severity: 'high' },
    { mainland: '博客', taiwan: ['部落格'], severity: 'high' },
    { mainland: '優盤', taiwan: ['隨身碟'], severity: 'high' },
    { mainland: '激光', taiwan: ['雷射'], severity: 'high' },
    { mainland: '打印', taiwan: ['列印'], severity: 'high' },
    { mainland: '光盤', taiwan: ['光碟'], severity: 'high' },
    { mainland: '殺毒', taiwan: ['防毒', '掃毒'], severity: 'high' },
    { mainland: '下載', taiwan: ['下載'], severity: 'low' }, // 兩岸皆用，不報
    { mainland: '移動端', taiwan: ['行動裝置', '手機版'], severity: 'high' },
    { mainland: '客戶端', taiwan: ['用戶端', '客戶端程式'], severity: 'medium' },
    { mainland: '數據庫', taiwan: ['資料庫'], severity: 'high' },
    { mainland: '操作系統', taiwan: ['作業系統'], severity: 'high' },
  ],

  // ─── 商業 / 行銷類 ───────────────────────
  business: [
    { mainland: '優化', taiwan: ['改善', '最佳化'], severity: 'medium' },
    { mainland: '迭代', taiwan: ['反覆調整', '版本更新'], severity: 'medium' },
    { mainland: '賦能', taiwan: ['幫助', '賦予能力', '支持'], severity: 'high' },
    { mainland: '落地', taiwan: ['執行', '實施', '實現'], severity: 'high' },
    { mainland: '閉環', taiwan: ['完整流程', '封閉循環'], severity: 'high' },
    { mainland: '鏈路', taiwan: ['路徑', '流程'], severity: 'high' },
    { mainland: '抓手', taiwan: ['切入點', '著力點'], severity: 'high' },
    { mainland: '拉通', taiwan: ['串聯', '整合'], severity: 'high' },
    { mainland: '對齊', taiwan: ['對焦', '一致'], severity: 'medium' },
    { mainland: '沉澱', taiwan: ['累積', '沉澱'], severity: 'medium' },
    { mainland: '觸達', taiwan: ['接觸到', '觸及'], severity: 'high' },
    { mainland: '心智', taiwan: ['認知', '心理'], severity: 'medium' },
    { mainland: '賽道', taiwan: ['領域', '市場區隔'], severity: 'high' },
    { mainland: '打造', taiwan: ['建立', '創造'], severity: 'medium' },
    { mainland: '極致', taiwan: ['極致'], severity: 'low' },
  ],

  // ─── 一般用語 ───────────────────────────
  daily: [
    { mainland: '質量', taiwan: ['品質'], severity: 'high' },
    { mainland: '信息', taiwan: ['資訊'], severity: 'high' },
    { mainland: '屏幕', taiwan: ['螢幕'], severity: 'high' },
    { mainland: '數據', taiwan: ['資料', '數據'], severity: 'medium' },
    { mainland: '反饋', taiwan: ['回饋', '回應'], severity: 'high' },
    { mainland: '用戶', taiwan: ['使用者', '用戶'], severity: 'medium' },
    { mainland: '登錄', taiwan: ['登入'], severity: 'high' },
    { mainland: '註冊', taiwan: ['註冊'], severity: 'low' },
    { mainland: '頭像', taiwan: ['大頭貼', '頭像'], severity: 'medium' },
    { mainland: '土豆', taiwan: ['馬鈴薯'], severity: 'high' },
    { mainland: '地鐵', taiwan: ['捷運', 'MRT'], severity: 'high' },
    { mainland: '公交', taiwan: ['公車'], severity: 'high' },
    { mainland: '出租車', taiwan: ['計程車'], severity: 'high' },
    { mainland: '方便麵', taiwan: ['泡麵'], severity: 'high' },
    { mainland: '酸奶', taiwan: ['優格', '優酪乳'], severity: 'high' },
    { mainland: '菠蘿', taiwan: ['鳳梨'], severity: 'high' },
    { mainland: '獼猴桃', taiwan: ['奇異果'], severity: 'high' },
    { mainland: '三文魚', taiwan: ['鮭魚'], severity: 'high' },
  ],

  // ─── 學術 / 正式用語 ───────────────────────
  academic: [
    { mainland: '綜上所述', taiwan: ['總結來說'], severity: 'medium' },
    { mainland: '據悉', taiwan: ['據了解'], severity: 'medium' },
    { mainland: '眾所周知', taiwan: ['大家都知道'], severity: 'medium' },
    { mainland: '毋庸置疑', taiwan: ['無庸置疑', '不用懷疑'], severity: 'medium' },
    { mainland: '值得注意的是', taiwan: ['要注意的是'], severity: 'medium' },
    { mainland: '需要指出的是', taiwan: ['要說的是'], severity: 'medium' },
    { mainland: '在當今社會', taiwan: ['現在', '目前'], severity: 'medium' },
    { mainland: '隨著科技發展', taiwan: ['科技進步之下'], severity: 'medium' },
  ],

  // ─── 網路 / 社群用語 ─────────────────────
  internet: [
    { mainland: '點贊', taiwan: ['按讚'], severity: 'high' },
    { mainland: '刷屏', taiwan: ['洗版'], severity: 'high' },
    { mainland: '給力', taiwan: ['很讚', '很棒'], severity: 'high' },
    { mainland: '吐槽', taiwan: ['吐槽'], severity: 'low' },
    { mainland: '靠譜', taiwan: ['可靠', '靠得住'], severity: 'high' },
    { mainland: '攻略', taiwan: ['攻略'], severity: 'low' },
    { mainland: '上線', taiwan: ['上線'], severity: 'low' },
    { mainland: '小夥伴', taiwan: ['小伙伴', '朋友', '夥伴'], severity: 'medium' },
    { mainland: '牛逼', taiwan: ['厲害', '超強'], severity: 'high' },
    { mainland: '菜鳥', taiwan: ['新手'], severity: 'medium' },
    { mainland: '奧利給', taiwan: ['加油'], severity: 'high' },
  ],
};

/**
 * 扁平化詞彙 Map（用於快速查找）
 * key: 大陸用語, value: { taiwan, severity, category }
 */
export const ZHIYU_LOOKUP = new Map();

for (const [category, words] of Object.entries(ZHIYU_DATABASE)) {
  for (const entry of words) {
    // 只收錄 severity 為 high 或 medium 的詞彙
    if (entry.severity === 'low') continue;
    ZHIYU_LOOKUP.set(entry.mainland, {
      taiwan: entry.taiwan,
      severity: entry.severity,
      category
    });
  }
}

/** 所有需要檢測的大陸用語列表 */
export const ZHIYU_TERMS = [...ZHIYU_LOOKUP.keys()];
