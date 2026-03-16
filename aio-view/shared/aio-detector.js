/**
 * AIO Detector
 * 共用 Google AI Overview 偵測邏輯，供 CLI / API 使用
 */

function normalizeHostname(hostname = '') {
  return hostname.replace(/^www\./i, '').toLowerCase();
}

function isDomainMatch(source, domain) {
  if (!source || !domain) return false;
  return source === domain || source.endsWith(`.${domain}`);
}

async function detectAIO(page, domain = '') {
  try {
    const result = await page.evaluate(() => {
      const headingPattern = /^(ai overview|ai 摘要)$/i;
      const knownSelectors = [
        'div[data-rl]',
        '[data-attrid="wa:/description"]',
        '.ILfuVd',
        '[data-async-type="editableDirectAnswer"]',
        '.wDYxhc[data-md]',
        '[jsname="N760b"]',
        '.kp-wholepage-osrp'
      ];

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

        const tagName = element.tagName;
        if (tagName === 'BODY' || tagName === 'HTML') return -Infinity;

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
        for (const selector of knownSelectors) {
          try {
            document.querySelectorAll(selector).forEach((element) => addCandidate(element));
          } catch {
            // ignore invalid selector / transient DOM issue
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
    });

    const normalizedDomain = normalizeHostname(domain);
    const isCited = normalizedDomain
      ? result.aioSources.some((source) => isDomainMatch(normalizeHostname(source), normalizedDomain))
      : false;

    return {
      hasAIO: result.hasAIO,
      isCited,
      aioSources: result.aioSources
    };
  } catch (error) {
    console.error('偵測 AIO 時發生錯誤:', error.message);
    return {
      hasAIO: false,
      isCited: false,
      aioSources: [],
      error: error.message
    };
  }
}

module.exports = {
  detectAIO
};
