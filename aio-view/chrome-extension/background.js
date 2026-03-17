const TARGET_URLS = [
  'https://lab.helloruru.com/aio-view/*',
  'https://helloruru.github.io/aio-view/*'
];

const GOOGLE_SEARCH_URLS = [
  '*://www.google.com/search*',
  '*://www.google.com.tw/search*',
  '*://www.google.co.jp/search*',
  '*://www.google.co.uk/search*',
  '*://www.google.com.hk/search*',
  '*://www.google.com.sg/search*'
];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message) return false;

  // 關閉 Google 搜尋分頁（直接查詢，不靠記憶）
  if (message.t === 'close-popup') {
    chrome.tabs.query({ url: GOOGLE_SEARCH_URLS }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.remove(tab.id, () => void chrome.runtime.lastError);
      });
      sendResponse({ ok: true, closed: tabs.length });
    });
    return true; // 非同步 sendResponse
  }

  if (!['r', 'dbg'].includes(message.t)) {
    return false;
  }

  // 轉發偵測結果到 AIO View 分頁
  chrome.tabs.query({ url: TARGET_URLS }, (tabs) => {
    tabs.forEach((tab) => {
      if (!tab.id) return;
      chrome.tabs.sendMessage(tab.id, message, () => {
        void chrome.runtime.lastError;
      });
    });
  });

  sendResponse({ ok: true, fromTabId: sender.tab?.id || null });
  return false;
});
