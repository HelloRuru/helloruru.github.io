const TARGET_URLS = [
  'https://lab.helloruru.com/aio-view/*',
  'https://helloruru.github.io/aio-view/*'
];

/** 追蹤 Google 搜尋分頁，以便關閉 */
const googleTabIds = new Set();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message) return false;

  // 關閉 Google 搜尋分頁
  if (message.t === 'close-popup') {
    googleTabIds.forEach(tabId => {
      chrome.tabs.remove(tabId, () => void chrome.runtime.lastError);
    });
    googleTabIds.clear();
    sendResponse({ ok: true, closed: googleTabIds.size });
    return false;
  }

  if (!['r', 'dbg'].includes(message.t)) {
    return false;
  }

  // 記錄 Google 搜尋分頁 ID
  if (sender.tab?.id) {
    googleTabIds.add(sender.tab.id);
  }

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
