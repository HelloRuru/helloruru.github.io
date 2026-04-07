/* ================================================
   AEO Consultant — AI Crawler Bot List & robots.txt Parser
   AI 搜尋引擎爬蟲清單 + robots.txt 解析
   ================================================ */

const AiCrawlers = {
  /** AI 搜尋引擎爬蟲清單 */
  BOTS: [
    { name: 'GPTBot',          platform: 'ChatGPT',           critical: true,  desc: 'OpenAI 主要爬蟲，用於 ChatGPT 搜尋和訓練' },
    { name: 'ChatGPT-User',    platform: 'ChatGPT',           critical: true,  desc: 'ChatGPT 使用者發起的即時搜尋' },
    { name: 'OAI-SearchBot',   platform: 'OpenAI Search',     critical: false, desc: 'OpenAI 搜尋專用爬蟲' },
    { name: 'PerplexityBot',   platform: 'Perplexity',        critical: true,  desc: 'Perplexity AI 搜尋引擎爬蟲' },
    { name: 'ClaudeBot',       platform: 'Claude',            critical: true,  desc: 'Anthropic Claude 搜尋爬蟲' },
    { name: 'anthropic-ai',    platform: 'Claude',            critical: false, desc: 'Anthropic 通用爬蟲' },
    { name: 'Google-Extended', platform: 'Google AI / Gemini', critical: true,  desc: 'Google AI 功能專用（Gemini、AI Overview）' },
    { name: 'Googlebot',       platform: 'Google Search',     critical: true,  desc: 'Google 搜尋主爬蟲（擋了等於不被索引）' },
    { name: 'Bingbot',         platform: 'Bing / Copilot',    critical: true,  desc: 'Bing 搜尋 + Microsoft Copilot 共用爬蟲' },
    { name: 'CCBot',           platform: 'Common Crawl',      critical: false, desc: '開放語料庫爬蟲（多個 AI 訓練資料來源）' }
  ],

  /**
   * 解析 robots.txt
   * @param {string} text - robots.txt 內容
   * @returns {Object} { rules: [{agent, directives}], sitemaps: [] }
   */
  parseRobotsTxt(text) {
    if (!text) return { rules: [], sitemaps: [] };

    const lines = text.split('\n').map(l => l.trim());
    const rules = [];
    const sitemaps = [];
    let currentAgent = null;
    let currentDirectives = [];

    for (const line of lines) {
      // 忽略註解和空行
      if (line.startsWith('#') || !line) {
        // 如果有未結束的 agent 區塊且遇到空行，結束它
        if (!line && currentAgent !== null) {
          rules.push({ agent: currentAgent, directives: currentDirectives });
          currentAgent = null;
          currentDirectives = [];
        }
        continue;
      }

      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;

      const key = line.substring(0, colonIdx).trim().toLowerCase();
      const value = line.substring(colonIdx + 1).trim();

      if (key === 'user-agent') {
        // 儲存前一個 agent 的規則
        if (currentAgent !== null) {
          rules.push({ agent: currentAgent, directives: currentDirectives });
        }
        currentAgent = value;
        currentDirectives = [];
      } else if (key === 'sitemap') {
        sitemaps.push(value);
      } else if (currentAgent !== null) {
        currentDirectives.push({ type: key, path: value });
      }
    }

    // 最後一個 agent
    if (currentAgent !== null) {
      rules.push({ agent: currentAgent, directives: currentDirectives });
    }

    return { rules, sitemaps };
  },

  /**
   * 檢查各 bot 的存取權限
   * @param {string} robotsTxt - robots.txt 內容
   * @returns {Array<Object>} 各 bot 的存取狀態
   */
  checkBotAccess(robotsTxt) {
    const parsed = this.parseRobotsTxt(robotsTxt);

    return this.BOTS.map(bot => {
      const status = this._getBotStatus(bot.name, parsed.rules);
      return {
        ...bot,
        ...status
      };
    });
  },

  /**
   * 取得單一 bot 的存取狀態
   * @param {string} botName - bot 名稱
   * @param {Array} rules - 解析後的規則
   * @returns {Object} { allowed, blocked, reason }
   */
  _getBotStatus(botName, rules) {
    // 先找指定 bot 的規則
    let matchedRule = rules.find(r =>
      r.agent.toLowerCase() === botName.toLowerCase()
    );

    // 如果沒有指定規則，套用 * 規則
    if (!matchedRule) {
      matchedRule = rules.find(r => r.agent === '*');
    }

    // 沒有任何規則 = 預設允許
    if (!matchedRule) {
      return { allowed: true, blocked: false, reason: '沒有限制（預設允許）' };
    }

    // 檢查是否有 Disallow: /
    const hasDisallowAll = matchedRule.directives.some(
      d => d.type === 'disallow' && d.path === '/'
    );

    // 檢查是否有 Allow: /
    const hasAllowAll = matchedRule.directives.some(
      d => d.type === 'allow' && d.path === '/'
    );

    // 檢查是否有 Disallow:（空值 = 允許所有）
    const hasEmptyDisallow = matchedRule.directives.some(
      d => d.type === 'disallow' && d.path === ''
    );

    if (hasDisallowAll && !hasAllowAll) {
      const isSpecific = rules.some(r => r.agent.toLowerCase() === botName.toLowerCase());
      return {
        allowed: false,
        blocked: true,
        reason: isSpecific
          ? `已被指名封鎖（User-agent: ${botName}）`
          : '被萬用規則封鎖（User-agent: *）'
      };
    }

    if (hasEmptyDisallow || hasAllowAll) {
      return { allowed: true, blocked: false, reason: '明確允許' };
    }

    // 有部分封鎖
    const disallowed = matchedRule.directives
      .filter(d => d.type === 'disallow' && d.path)
      .map(d => d.path);

    if (disallowed.length > 0) {
      return {
        allowed: true,
        blocked: false,
        partial: true,
        reason: `部分路徑被封鎖：${disallowed.join(', ')}`,
        blockedPaths: disallowed
      };
    }

    return { allowed: true, blocked: false, reason: '允許存取' };
  },

  /**
   * 產生修正建議
   * @param {Array} botResults - checkBotAccess 的結果
   * @returns {Array} 修正建議清單
   */
  generateFixes(botResults) {
    const fixes = [];

    const blockedCritical = botResults.filter(b => b.blocked && b.critical);
    const blockedNonCritical = botResults.filter(b => b.blocked && !b.critical);

    if (blockedCritical.length > 0) {
      const lines = blockedCritical.map(b =>
        `User-agent: ${b.name}\nAllow: /`
      ).join('\n\n');

      fixes.push({
        priority: 1,
        title: `${blockedCritical.length} 個重要 AI 爬蟲被封鎖`,
        desc: `${blockedCritical.map(b => b.platform).join('、')} 的爬蟲無法存取你的網站。這代表這些 AI 搜尋引擎不會引用你的內容。`,
        action: '在 robots.txt 加入以下規則：',
        code: lines,
        affectedBots: blockedCritical
      });
    }

    if (blockedNonCritical.length > 0) {
      fixes.push({
        priority: 3,
        title: `${blockedNonCritical.length} 個次要 AI 爬蟲被封鎖`,
        desc: `${blockedNonCritical.map(b => b.name).join('、')} 被封鎖。影響較低，但解除封鎖可以增加 AI 訓練資料涵蓋。`,
        action: '選擇性加入以下規則：',
        code: blockedNonCritical.map(b => `User-agent: ${b.name}\nAllow: /`).join('\n\n'),
        affectedBots: blockedNonCritical
      });
    }

    return fixes;
  }
};
