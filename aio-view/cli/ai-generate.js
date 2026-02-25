#!/usr/bin/env node
/* ================================================
   AIO View — AI 搜尋語句產生器
   用 OpenAI / Anthropic API 自動產生搜尋語句
   ================================================ */

const fs = require('fs');
const path = require('path');

/* ---- 參數解析 ---- */

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    input: 'queries.json',
    output: null, // 預設覆寫 input
    provider: 'openai',
    model: null,
    key: null,
    batchSize: 15,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input': case '-i': opts.input = args[++i]; break;
      case '--output': case '-o': opts.output = args[++i]; break;
      case '--provider': case '-p': opts.provider = args[++i]; break;
      case '--model': case '-m': opts.model = args[++i]; break;
      case '--key': case '-k': opts.key = args[++i]; break;
      case '--batch-size': opts.batchSize = parseInt(args[++i], 10); break;
      case '--help': case '-h': opts.help = true; break;
    }
  }

  // 預設模型
  if (!opts.model) {
    opts.model = opts.provider === 'anthropic'
      ? 'claude-haiku-4-5-20251001'
      : 'gpt-4o-mini';
  }

  // API Key 來源：參數 > 環境變數
  if (!opts.key) {
    opts.key = opts.provider === 'anthropic'
      ? process.env.ANTHROPIC_API_KEY
      : process.env.OPENAI_API_KEY;
  }

  // 預設 output = input（覆寫）
  if (!opts.output) opts.output = opts.input;

  return opts;
}

function showHelp() {
  console.log(`
AIO View — AI 搜尋語句產生器

用法：
  node ai-generate.js [選項]

選項：
  -i, --input <file>      輸入檔案（預設：queries.json）
  -o, --output <file>     輸出檔案（預設：覆寫輸入檔）
  -p, --provider <name>   API 提供者：openai | anthropic（預設：openai）
  -m, --model <model>     模型名稱（預設：gpt-4o-mini / claude-haiku-4-5-20251001）
  -k, --key <key>         API Key（也可用環境變數 OPENAI_API_KEY / ANTHROPIC_API_KEY）
  --batch-size <n>        每批文章數量（預設：15）
  -h, --help              顯示說明

範例：
  # 用 OpenAI GPT-4o-mini（最便宜）
  node ai-generate.js -i queries.json -p openai -k sk-xxx

  # 用 Claude Haiku（最快）
  node ai-generate.js -i queries.json -p anthropic -k sk-ant-xxx

  # 用環境變數
  export OPENAI_API_KEY=sk-xxx
  node ai-generate.js -i queries.json

費用參考（50 篇文章）：
  - GPT-4o-mini：約 NT$1-3
  - Claude Haiku：約 NT$0.5
`);
}

/* ---- API 呼叫 ---- */

const SYSTEM_PROMPT = `你是 SEO 搜尋語句專家。為每篇文章產生 1 條最可能觸發 Google AI Overview 的繁體中文搜尋語句。

規則：
- 搜尋語句用繁體中文
- 模擬一般使用者的搜尋習慣（口語化、5-8 個字）
- 不要加引號、site: 等搜尋指令
- 回覆格式：每行一條「文章標題 | 搜尋語句」
- 不要加序號或其他格式`;

function buildUserPrompt(articles) {
  const list = articles.map((a, i) =>
    `${i + 1}. ${a.title} (${a.url})`
  ).join('\n');

  return `請為以下 ${articles.length} 篇文章產生搜尋語句：\n\n${list}`;
}

async function callOpenAI(prompt, opts) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${opts.key}`
    },
    body: JSON.stringify({
      model: opts.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API 錯誤：${err.error?.message || response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropic(prompt, opts) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': opts.key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Anthropic API 錯誤：${err.error?.message || response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callAPI(prompt, opts) {
  if (opts.provider === 'anthropic') {
    return callAnthropic(prompt, opts);
  }
  return callOpenAI(prompt, opts);
}

/* ---- 解析 AI 回覆 ---- */

function parseResponse(text, articles) {
  const pairs = new Map();

  text.split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.replace(/^\d+[\.\)]\s*/, '').replace(/^[-*]\s*/, ''))
    .forEach(line => {
      const separators = ['|', '\uFF5C', ' \u2192 ', ' -> ', '\uFF1A', ': '];
      for (const sep of separators) {
        const idx = line.indexOf(sep);
        if (idx > 0) {
          const title = line.substring(0, idx).trim();
          const query = line.substring(idx + sep.length).trim();
          if (title && query) {
            pairs.set(title.toLowerCase(), query);
            break;
          }
        }
      }
    });

  // Fuzzy match
  let matched = 0;
  articles.forEach(article => {
    const titleLower = article.title.toLowerCase();

    // 完全匹配
    if (pairs.has(titleLower)) {
      article.query = pairs.get(titleLower);
      matched++;
      return;
    }

    // 包含匹配
    for (const [key, query] of pairs) {
      if (titleLower.includes(key) || key.includes(titleLower)) {
        article.query = query;
        matched++;
        return;
      }
    }
  });

  return matched;
}

/* ---- 主流程 ---- */

async function main() {
  const opts = parseArgs();

  if (opts.help) {
    showHelp();
    process.exit(0);
  }

  if (!opts.key) {
    console.error('\u274C \u8ACB\u63D0\u4F9B API Key\uFF08--key \u6216\u74B0\u5883\u8B8A\u6578\uFF09');
    console.error(`   ${opts.provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY'}=xxx node ai-generate.js`);
    process.exit(1);
  }

  // 讀取輸入
  const inputPath = path.resolve(opts.input);
  if (!fs.existsSync(inputPath)) {
    console.error(`\u274C \u627E\u4E0D\u5230\u6A94\u6848\uFF1A${inputPath}`);
    process.exit(1);
  }

  const articles = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  console.log(`\u2705 \u8B80\u53D6 ${articles.length} \u7BC7\u6587\u7AE0`);
  console.log(`   \u63D0\u4F9B\u8005\uFF1A${opts.provider}  \u6A21\u578B\uFF1A${opts.model}`);

  // 過濾已有語句的（跳過已填的）
  const needQuery = articles.filter(a => !a.query || !a.query.trim());
  console.log(`   \u9700\u8981\u7522\u751F\u8A9E\u53E5\uFF1A${needQuery.length} \u7BC7`);

  if (needQuery.length === 0) {
    console.log('\u2705 \u6240\u6709\u6587\u7AE0\u90FD\u5DF2\u6709\u8A9E\u53E5\uFF0C\u4E0D\u9700\u8655\u7406');
    process.exit(0);
  }

  // 分批
  const batches = [];
  for (let i = 0; i < needQuery.length; i += opts.batchSize) {
    batches.push(needQuery.slice(i, i + opts.batchSize));
  }

  console.log(`   \u5206 ${batches.length} \u6279\u8655\u7406\u2026\n`);

  let totalMatched = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const prompt = buildUserPrompt(batch);

    process.stdout.write(`   \u6279\u6B21 ${i + 1}/${batches.length}\uFF08${batch.length} \u7BC7\uFF09\u2026 `);

    try {
      const response = await callAPI(prompt, opts);
      const matched = parseResponse(response, batch);
      totalMatched += matched;
      console.log(`\u2705 \u914D\u5C0D ${matched}/${batch.length}`);
    } catch (err) {
      console.log(`\u274C ${err.message}`);
    }

    // 批次間等 1 秒避免 rate limit
    if (i < batches.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // 寫出結果
  const outputPath = path.resolve(opts.output);
  fs.writeFileSync(outputPath, JSON.stringify(articles, null, 2), 'utf-8');

  console.log(`\n\u2705 \u5B8C\u6210\uFF01\u5DF2\u7522\u751F ${totalMatched}/${needQuery.length} \u7BC7\u8A9E\u53E5`);
  console.log(`   \u8F38\u51FA\uFF1A${outputPath}`);
}

main().catch(err => {
  console.error('\u274C \u57F7\u884C\u5931\u6557\uFF1A', err.message);
  process.exit(1);
});
