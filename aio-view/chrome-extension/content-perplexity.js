(() => {
  const ATTEMPTS_MS = [2000, 5000, 8000, 11000];
  let lastSentSignature = '';

  function getQuery() {
    // Perplexity 的搜尋框
    const input = document.querySelector('textarea[placeholder]') ||
                  document.querySelector('input[type="text"]');
    if (input?.value) return input.value.trim();

    // 從 URL 取
    const params = new URLSearchParams(location.search);
    return params.get('q') || '';
  }

  function extractHostname(rawUrl) {
    try {
      return new URL(rawUrl).hostname.replace(/^www\./i, '').toLowerCase();
    } catch {
      return null;
    }
  }

  /**
   * 偵測 Perplexity 的引用來源
   * Perplexity 的回答區會列出引用來源（帶數字標記 [1] [2] 等）
   */
  function detectCitations() {
    const sources = [];
    const seen = new Set();

    // 策略 1：引用來源區塊（側邊欄或底部）
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.href;
      if (!href || href.startsWith('javascript:') || href.includes('perplexity.ai')) return;

      const host = extractHostname(href);
      if (!host || seen.has(host)) return;

      // Perplexity 引用來源通常在特定容器內
      const parent = a.closest('[class*="citation"], [class*="source"], [class*="reference"], [data-testid*="source"]');
      if (parent) {
        seen.add(host);
        sources.push(host);
        return;
      }

      // 帶數字標記的連結 [1] [2]
      const text = a.textContent.trim();
      if (/^\[\d+\]$/.test(text) || /^\d+$/.test(text)) {
        seen.add(host);
        sources.push(host);
      }
    });

    // 策略 2：如果策略 1 沒抓到，掃描所有外部連結
    if (sources.length === 0) {
      const answerArea = document.querySelector('[class*="answer"], [class*="prose"], main, article');
      if (answerArea) {
        answerArea.querySelectorAll('a[href]').forEach(a => {
          const host = extractHostname(a.href);
          if (host && !host.includes('perplexity') && !seen.has(host)) {
            seen.add(host);
            sources.push(host);
          }
        });
      }
    }

    return sources;
  }

  function sendResult(isFinal) {
    const query = getQuery();
    if (!query) return;

    const sources = detectCitations();
    if (sources.length === 0 && !isFinal) return;

    const payload = {
      t: 'r',
      platform: 'perplexity',
      q: query,
      aio: sources.length > 0,
      src: sources,
      organic: [],
      related: []
    };

    const signature = JSON.stringify(payload);
    if (lastSentSignature === signature) return;
    lastSentSignature = signature;

    chrome.runtime.sendMessage(payload, () => {
      void chrome.runtime.lastError;
    });
  }

  ATTEMPTS_MS.forEach((delay, index) => {
    setTimeout(() => {
      sendResult(index === ATTEMPTS_MS.length - 1);
    }, delay);
  });
})();
