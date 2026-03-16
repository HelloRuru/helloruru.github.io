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

  forwardToPage({
    t: 'dbg',
    stage: 'bridge-ready',
    note: location.href
  });
})();
