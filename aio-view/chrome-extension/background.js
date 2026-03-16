const TARGET_URLS = [
  'https://lab.helloruru.com/aio-view/*',
  'https://helloruru.github.io/aio-view/*'
];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !['r', 'dbg'].includes(message.t)) {
    return false;
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
