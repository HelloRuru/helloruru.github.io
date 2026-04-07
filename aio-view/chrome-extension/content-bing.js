(() => {
  const ATTEMPTS_MS = [1000, 2500, 5000];
  let lastSentSignature = '';

  function getQuery() {
    const input = document.querySelector('#sb_form_q') ||
                  document.querySelector('input[name="q"]') ||
                  document.querySelector('textarea[name="q"]');
    if (input?.value) return input.value.trim();

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
   * 偵測 Bing Copilot AI 回答的引用來源
   */
  function detectCopilotCitations() {
    const sources = [];
    const seen = new Set();

    // Bing Copilot 的 AI 回答區（多種選擇器因為 Bing 常改版）
    const copilotSelectors = [
      '#b_results .b_ans',           // AI 回答區塊
      '.rai_message',                 // Copilot 訊息
      '[data-tag="answer"]',          // AI 回答標記
      '.b_expansion',                 // 展開式回答
      '#sydneyGroup',                 // Sydney (Copilot) 容器
      '[class*="copilot"]',           // Copilot 相關
      '[class*="chat-answer"]'        // 聊天回答
    ];

    let answerArea = null;
    for (const sel of copilotSelectors) {
      answerArea = document.querySelector(sel);
      if (answerArea) break;
    }

    if (answerArea) {
      // 抓回答區內的外部連結
      answerArea.querySelectorAll('a[href]').forEach(a => {
        const host = extractHostname(a.href);
        if (!host || host.includes('bing.com') || host.includes('microsoft.com') || seen.has(host)) return;
        seen.add(host);
        sources.push(host);
      });
    }

    // 也抓「了解更多」/ 「Learn more」區塊
    document.querySelectorAll('.b_attribution a, .b_factrow a, [class*="learn-more"] a').forEach(a => {
      const host = extractHostname(a.href);
      if (host && !host.includes('bing.com') && !host.includes('microsoft.com') && !seen.has(host)) {
        seen.add(host);
        sources.push(host);
      }
    });

    return sources;
  }

  /**
   * 偵測 Bing 傳統搜尋的自然排名
   */
  function detectOrganicResults() {
    const results = [];
    const seen = new Set();
    let rank = 0;

    document.querySelectorAll('#b_results .b_algo h2 a').forEach(a => {
      if (rank >= 20) return;
      const host = extractHostname(a.href);
      if (!host || host.includes('bing.com') || seen.has(host + '|' + a.href)) return;
      seen.add(host + '|' + a.href);
      rank++;
      results.push({ rank, host, url: a.href });
    });

    return results;
  }

  function sendResult(isFinal) {
    const query = getQuery();
    if (!query) return;

    const sources = detectCopilotCitations();
    const organic = detectOrganicResults();

    if (sources.length === 0 && !isFinal) return;

    const payload = {
      t: 'r',
      platform: 'bing-copilot',
      q: query,
      aio: sources.length > 0,
      src: sources,
      organic: organic,
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
