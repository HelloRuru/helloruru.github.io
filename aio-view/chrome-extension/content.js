(() => {
  const CHANNEL_NAME = 'aio-check';
  const ATTEMPTS_MS = [500, 1400, 2600, 4200];
  const headingPattern = /^(ai overview|ai 摘要)$/i;
  let lastSentSignature = '';

  function normalizeText(value = '') {
    return value.replace(/\s+/g, ' ').trim();
  }

  function extractHostname(rawUrl) {
    try {
      const parsed = new URL(rawUrl, location.origin);
      let target = parsed;

      if (/^google\./i.test(parsed.hostname) || /\.google\./i.test(parsed.hostname)) {
        const redirected =
          parsed.searchParams.get('q') ||
          parsed.searchParams.get('url') ||
          parsed.searchParams.get('imgurl');

        if (redirected) {
          try {
            target = new URL(redirected);
          } catch {
            target = parsed;
          }
        }
      }

      return target.hostname.replace(/^www\./i, '').toLowerCase();
    } catch {
      return null;
    }
  }

  function isGoogleHost(hostname) {
    return /^google\./i.test(hostname) || /\.google\./i.test(hostname);
  }

  function scoreCandidate(element, distance = 0) {
    if (!element) return -Infinity;
    if (element.tagName === 'BODY' || element.tagName === 'HTML') return -Infinity;

    const text = normalizeText(element.textContent || '');
    const links = element.querySelectorAll('a[href]').length;
    const uniqueSources = Array.from(
      new Set(
        Array.from(element.querySelectorAll('a[href]'))
          .map((anchor) => extractHostname(anchor.href))
          .filter(Boolean)
      )
    );
    const externalSourceCount = uniqueSources.filter((host) => !isGoogleHost(host)).length;
    const hasHeading = Array.from(
      element.querySelectorAll('[role="heading"], h1, h2, h3, h4')
    ).some((node) => headingPattern.test(normalizeText(node.textContent || '')));

    let score = 0;

    if (element.matches('div[data-rl]')) score += 2;
    if (hasHeading) score += 5;
    if (headingPattern.test(text)) score += 3;
    if (links >= 1) score += 2;
    if (links >= 5) score += 1;
    if (externalSourceCount >= 1) score += 3;
    if (externalSourceCount >= 2) score += 2;
    if (text.length >= 80) score += 2;
    if (text.length >= 300) score += 1;
    if (text.length > 6000) score -= 6;
    if (links > 120) score -= 4;

    score -= distance;
    return score;
  }

  function detectAIO() {
    const candidates = [];
    const seen = new Set();

    function addCandidate(element, distance = 0) {
      if (!element || seen.has(element)) return;
      seen.add(element);

      const score = scoreCandidate(element, distance);
      if (score > 0) {
        candidates.push({ element, score });
      }
    }

    const headings = Array.from(
      document.querySelectorAll('[role="heading"], h1, h2, h3, h4')
    ).filter((node) => headingPattern.test(normalizeText(node.textContent || '')));

    for (const heading of headings) {
      let current = heading.parentElement;
      let distance = 0;

      while (current && current !== document.body && distance < 8) {
        addCandidate(current, distance);
        current = current.parentElement;
        distance += 1;
      }
    }

    if (candidates.length === 0) {
      const selectors = [
        'div[data-rl]',
        '[data-attrid="wa:/description"]',
        '.ILfuVd',
        '[data-async-type="editableDirectAnswer"]',
        '.wDYxhc[data-md]',
        '[jsname="N760b"]',
        '.kp-wholepage-osrp'
      ];

      for (const selector of selectors) {
        try {
          document.querySelectorAll(selector).forEach((element) => addCandidate(element));
        } catch {
          // ignore selector errors
        }
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    const winner = candidates[0];

    if (!winner) {
      return {
        hasAIO: false,
        aioSources: []
      };
    }

    const aioSources = Array.from(
      new Set(
        Array.from(winner.element.querySelectorAll('a[href]'))
          .map((anchor) => extractHostname(anchor.href))
          .filter(Boolean)
      )
    );

    return {
      hasAIO: true,
      aioSources
    };
  }

  function getQuery() {
    return (
      document.querySelector('textarea[name="q"], input[name="q"]')?.value ||
      new URLSearchParams(location.search).get('q') ||
      ''
    ).trim();
  }

  function showBadge(hasAIO) {
    const badgeId = 'aio-view-extension-badge';
    document.getElementById(badgeId)?.remove();

    const badge = document.createElement('div');
    badge.id = badgeId;
    badge.style.cssText = [
      'position:fixed',
      'right:16px',
      'bottom:16px',
      'z-index:2147483647',
      'padding:8px 12px',
      'border-radius:12px',
      'font:600 12px/1.2 "Segoe UI",sans-serif',
      'color:#fff',
      `background:${hasAIO ? '#B8A9C9' : '#8a7f86'}`,
      'box-shadow:0 10px 24px rgba(0,0,0,.18)',
      'pointer-events:none'
    ].join(';');
    badge.textContent = hasAIO ? 'AIO 已回傳' : '沒有 AIO';

    document.body.appendChild(badge);
    window.setTimeout(() => badge.remove(), 2200);
  }

  function sendResult(result, isFinalAttempt) {
    const query = getQuery();
    if (!query) return;
    if (!result.hasAIO && !isFinalAttempt) return;

    const payload = {
      t: 'r',
      q: query,
      aio: !!result.hasAIO,
      src: result.aioSources || []
    };

    const signature = JSON.stringify(payload);
    if (lastSentSignature === signature) return;
    lastSentSignature = signature;

    try {
      if (window.opener) {
        window.opener.postMessage(payload, '*');
      }
    } catch {
      // ignore
    }

    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage(payload);
      channel.close();
    } catch {
      // ignore
    }

    showBadge(result.hasAIO);
  }

  ATTEMPTS_MS.forEach((delay, index) => {
    window.setTimeout(() => {
      sendResult(detectAIO(), index === ATTEMPTS_MS.length - 1);
    }, delay);
  });
})();
