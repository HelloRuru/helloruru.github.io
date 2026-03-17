(() => {
  const CHANNEL_NAME = 'aio-check';

  function forwardToPage(message) {
    try {
      window.postMessage(message, location.origin);
    } catch {
      // ignore
    }

    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage(message);
      channel.close();
    } catch {
      // ignore
    }
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || !['r', 'dbg'].includes(message.t)) {
      return false;
    }

    forwardToPage(message);
    sendResponse({ ok: true });
    return false;
  });

  // 反向：頁面 → 擴充功能（用於關閉 Google 分頁）
  window.addEventListener('message', (event) => {
    if (event.origin !== location.origin) return;
    if (event.data?.t === 'close-popup') {
      chrome.runtime.sendMessage(event.data, () => {
        void chrome.runtime.lastError;
      });
    }
  });

  forwardToPage({
    t: 'dbg',
    stage: 'bridge-ready',
    note: location.href
  });
})();
