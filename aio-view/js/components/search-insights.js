/* ================================================
   AIO View — Search Insights
   單篇使用者搜尋偏好 + 面向覆蓋驗證
   ================================================ */

const SearchInsights = {
  elements: {
    card: null,
    summary: null,
    chips: null,
    tree: null,
    suggestions: null
  },

  FACET_RULES: [
    { key: 'recommend', label: '推薦 / 評價', regex: /(推薦|評價|口碑|高評價|人氣|名單|精選|必吃|必買|必去|必訪)/ },
    { key: 'price', label: '價格 / CP 值', regex: /(價格|費用|價錢|便宜|平價|cp值|CP值|划算|預算|省錢|收費|行情)/ },
    { key: 'decision', label: '決策 / 選擇', regex: /(哪家好|哪家|找哪家|怎麼選|如何選|值得|適合|推嗎|好嗎|該不該)/ },
    { key: 'compare', label: '比較 / 排名', regex: /(比較|排行|排名|差異|對比|vs|VS|top|TOP|懶人包)/ },
    { key: 'guide', label: '教學 / 入門', regex: /(入門|新手|教學|課程|方法|流程|指南|怎麼|必讀|攻略|須知)/ },
    { key: 'location', label: '地點 / 交通', regex: /(附近|近|怎麼去|交通|停車|地址|地點|位置|捷運)/ },
    { key: 'experience', label: '體驗 / 心得', regex: /(心得|體驗|開箱|試用|實測|分享|感想|遊記|食記)/ },
    { key: 'aftercare', label: '售後 / 保固', regex: /(售後|保固|維修|保養|回購|耐用|壽命|換|修)/ },
    { key: 'community', label: '社群討論', regex: /(ptt|dcard|PTT|Dcard|mobile01|01|討論|網友)/ }
  ],

  /** 產業偵測規則 */
  INDUSTRY_RULES: [
    { key: 'beauty', label: '美業', regex: /(美甲|美睫|美髮|染髮|燙髮|剪髮|護髮|接髮|髮型|沙龍|髮廊|髮型設計師|造型師)/ },
    { key: 'food', label: '餐飲', regex: /(餐廳|美食|小吃|火鍋|燒烤|咖啡|甜點|早午餐|下午茶|居酒屋|吃到飽|宵夜|外帶|外送)/ },
    { key: 'massage', label: '按摩 / 整復', regex: /(按摩|推拿|整復|整骨|SPA|spa|腳底|指壓|泰式|經絡|刮痧|拔罐)/ },
    { key: 'auto', label: '汽車', regex: /(汽車|車行|二手車|中古車|保養|鈑金|烤漆|輪胎|洗車|包膜|改裝|驗車|隔熱紙)/ },
    { key: 'hvac', label: '冷氣 / 家電', regex: /(冷氣|空調|洗冷氣|裝冷氣|移機|家電|清潔|除蟲|水電)/ },
    { key: 'medical', label: '醫療 / 治療', regex: /(診所|牙醫|中醫|物理治療|復健|皮膚科|眼科|助聽器|矯正|植牙|洗牙)/ },
    { key: 'fitness', label: '運動 / 健身', regex: /(健身|瑜珈|皮拉提斯|游泳|拳擊|重訓|運動|教練|私人教練|團課)/ },
    { key: 'education', label: '教育 / 補習', regex: /(補習|家教|英文|日文|語言|才藝|安親班|幼兒園|托嬰|課輔)/ },
    { key: 'home', label: '居家 / 裝潢', regex: /(裝潢|室內設計|系統櫃|油漆|搬家|清潔|收納|窗簾|地板|家具)/ },
    { key: 'travel', label: '旅遊 / 住宿', regex: /(住宿|民宿|飯店|旅館|露營|包棟|訂房|旅遊|景點|觀光)/ },
    { key: 'pet', label: '寵物', regex: /(寵物|狗|貓|獸醫|動物醫院|美容|洗澡|寄宿|飼料|貓咪)/ },
    { key: 'eyewear', label: '眼鏡 / 配鏡', regex: /(眼鏡|配鏡|鏡框|鏡片|隱形|驗光|太陽眼鏡)/ }
  ],

  init() {
    this.elements.card = document.getElementById('search-insights-card');
    this.elements.summary = document.getElementById('search-insights-summary');
    this.elements.chips = document.getElementById('search-insights-chips');
    this.elements.tree = document.getElementById('search-insights-tree');
    this.elements.suggestions = document.getElementById('search-insights-suggestions');
  },

  render(results) {
    const items = results?.results || [];
    this._lastItems = items; // 給 renderSuggestions 用
    if (items.length === 0) {
      this.reset();
      return;
    }

    const analysis = this.analyze(items);
    if (analysis.articles.length === 0) {
      this.reset();
      return;
    }

    this.renderSummary(analysis);
    this.renderChips(analysis);
    this.renderTree(analysis);
    this.renderSuggestions(analysis);
    this.show();
  },

  analyze(items) {
    const groups = new Map();

    items.forEach((item) => {
      const key = item.articleKey || item.url || item.title || item.query;
      if (!key) return;

      if (!groups.has(key)) {
        groups.set(key, {
          articleKey: key,
          title: item.title || item.url || item.query,
          url: item.url || '',
          baseQuery: item.baseQuery || item.query || '',
          items: []
        });
      }

      const entry = groups.get(key);
      entry.items.push(item);
      if (!entry.baseQuery && item.query) entry.baseQuery = item.query;
    });

    const articles = Array.from(groups.values())
      .map(group => this.analyzeArticle(group))
      .sort((a, b) => (
        this.scoreVerdict(b.verdict) - this.scoreVerdict(a.verdict)
        || b.citedCount - a.citedCount
        || b.aioCount - a.aioCount
        || b.verifiedFacets.length - a.verifiedFacets.length
        || a.title.length - b.title.length
      ));

    const validated = articles.filter(article => article.verdict === 'validated').length;
    const partial = articles.filter(article => article.verdict === 'partial').length;
    const pending = articles.filter(article => article.verdict === 'pending').length;
    const suggestions = Array.from(new Set(
      articles.flatMap(article => article.suggestions)
    )).slice(0, 8);

    return {
      articles,
      validated,
      partial,
      pending,
      suggestions
    };
  },

  analyzeArticle(group) {
    const baseQuery = String(group.baseQuery || group.title || '').trim();
    const variantPlan = QueryEngine.generateVariants({
      title: group.title,
      url: group.url,
      query: baseQuery
    }, '');
    const expectedFacets = variantPlan
      .filter(item => item.facetKey !== 'base')
      .map(item => ({
        key: item.facetKey,
        label: item.facetLabel,
        query: item.query
      }));

    const facetMap = new Map();
    expectedFacets.forEach((facet) => {
      facetMap.set(facet.key, {
        ...facet,
        scanned: false,
        aio: 0,
        cited: 0,
        queries: []
      });
    });

    group.items.forEach((item) => {
      const query = String(item.query || '').trim();
      const facetKeys = this.resolveFacetKeys(item, baseQuery);

      facetKeys.forEach((facetKey) => {
        if (!facetMap.has(facetKey)) {
          const label = this.getFacetLabel(facetKey);
          facetMap.set(facetKey, {
            key: facetKey,
            label,
            query,
            scanned: false,
            aio: 0,
            cited: 0,
            queries: []
          });
        }

        const facet = facetMap.get(facetKey);
        facet.scanned = true;
        if (query) facet.queries.push(query);
        if (item.hasAIO === true) facet.aio += 1;
        if (item.isCited) facet.cited += 1;
      });
    });

    const facets = Array.from(facetMap.values()).map((facet) => ({
      ...facet,
      queries: Array.from(new Set(facet.queries)).slice(0, 3)
    }));

    const verifiedFacets = this.sortFacets(facets.filter(facet => facet.aio > 0));
    const citedFacets = this.sortFacets(facets.filter(facet => facet.cited > 0));
    const attemptedFacets = this.sortFacets(facets.filter(facet => facet.scanned && facet.aio === 0));
    const missingFacets = this.sortFacets(facets.filter(facet => !facet.scanned));

    const aioCount = group.items.filter(item => item.hasAIO === true).length;
    const citedCount = group.items.filter(item => item.isCited).length;
    const verdict = this.resolveVerdict(verifiedFacets.length, group.items.length, missingFacets.length);
    const locations = this.extractLocations(baseQuery || group.title);
    const totalFacets = new Set([
      ...verifiedFacets.map(f => f.key),
      ...attemptedFacets.map(f => f.key),
      ...missingFacets.map(f => f.key)
    ]).size;

    return {
      articleKey: group.articleKey,
      title: group.title,
      url: group.url,
      baseQuery,
      verdict,
      verdictLabel: this.getVerdictLabel(verdict),
      aioCount,
      citedCount,
      totalQueries: group.items.length,
      totalFacets,
      verifiedFacets,
      citedFacets,
      attemptedFacets,
      missingFacets,
      representativeQueries: Array.from(new Set(
        group.items
          .filter(item => item.hasAIO === true || item.isCited)
          .map(item => item.query)
          .filter(q => q && q.length <= 25)
      )).slice(0, 3),
      locations,
      summary: this.buildArticleSummary({
        title: group.title,
        verifiedFacets,
        attemptedFacets,
        missingFacets,
        citedFacets,
        totalQueries: group.items.length
      }),
      suggestions: this.buildArticleSuggestions(missingFacets, attemptedFacets)
    };
  },

  resolveFacetKeys(item, baseQuery) {
    const keys = [];

    if (item.facetKey && item.facetKey !== 'base') {
      keys.push(item.facetKey);
    }

    this.FACET_RULES.forEach((rule) => {
      if (rule.regex.test(item.query || '')) {
        keys.push(rule.key);
      }
    });

    if (keys.length === 0 && baseQuery && String(item.query || '').trim() === String(baseQuery).trim()) {
      keys.push('recommend');
    }

    return Array.from(new Set(keys));
  },

  resolveVerdict(verifiedCount, queryCount, missingCount) {
    if (queryCount === 0) return 'pending';
    if (verifiedCount >= 2) return 'validated';
    if (verifiedCount >= 1 || queryCount >= 2 || missingCount === 0) return 'partial';
    return 'pending';
  },

  scoreVerdict(verdict) {
    if (verdict === 'validated') return 3;
    if (verdict === 'partial') return 2;
    return 1;
  },

  getVerdictLabel(verdict) {
    if (verdict === 'validated') return 'VERIFIED';
    if (verdict === 'partial') return 'PARTIAL';
    return 'PENDING';
  },

  getFacetLabel(key) {
    return this.FACET_RULES.find(rule => rule.key === key)?.label || key;
  },

  sortFacets(items) {
    return [...items].sort((a, b) => {
      // 數字大的排前面
      const aCount = (a.cited || 0) + (a.aio || 0);
      const bCount = (b.cited || 0) + (b.aio || 0);
      if (bCount !== aCount) return bCount - aCount;
      // 同分按 FACET_RULES 順序
      const aIndex = this.FACET_RULES.findIndex(rule => rule.key === a.key);
      const bIndex = this.FACET_RULES.findIndex(rule => rule.key === b.key);
      return aIndex - bIndex;
    });
  },

  buildArticleSummary({ verifiedFacets, attemptedFacets, missingFacets, citedFacets, totalQueries }) {
    if (totalQueries <= 1) {
      return '<span class="status-dim">INSUFFICIENT DATA</span> — 僅 1 筆查詢，需補充掃描';
    }

    if (verifiedFacets.length === 0) {
      return `<span class="status-dim">NULL RESULT</span> — ${totalQueries} 筆查詢均未觸發 AIO，建議調整搜尋語句`;
    }

    const lines = [];
    const top = verifiedFacets.slice(0, 3).map(f => f.label).join(' / ');
    lines.push(`AIO 觸發面向：${top}`);

    if (citedFacets.length > 0) {
      const cited = citedFacets.slice(0, 3).map(f => f.label).join(' / ');
      lines.push(`被引用面向：${cited}`);
    }

    if (missingFacets.length > 0) {
      const missing = missingFacets.slice(0, 3).map(f => f.label).join(' / ');
      lines.push(`未掃描：${missing}`);
    } else if (attemptedFacets.length > 0) {
      const miss = attemptedFacets.slice(0, 3).map(f => f.label).join(' / ');
      lines.push(`未命中：${miss}`);
    } else {
      lines.push('<span class="status-good">ALL SCANNED</span>');
    }

    return lines.join('<br>');
  },

  buildArticleSuggestions(missingFacets, attemptedFacets) {
    if (missingFacets.length > 0) {
      return missingFacets.map(f => f.query).filter(Boolean).slice(0, 4);
    }
    if (attemptedFacets.length > 0) {
      return attemptedFacets.map(f => f.query).filter(Boolean).slice(0, 4);
    }
    // 空陣列 → renderTree 會用 Google Suggest 補
    return [];
  },

  /** 簡體轉繁體（常見字） */
  s2t(text) {
    const map = '区區|饭飯|里裡|买買|卖賣|会會|学學|车車|东東|书書|长長|门門|问問|间間|关關|开開|见見|觉覺|说說|认認|让讓|请請|该該|诉訴|话話|语語|读讀|谁誰|论論|议議|设設|许許|评評|试試|课課|调調|谢謝|证證|识識|词詞|记記|讲講|订訂|谈談|护護|变變|术術|导導|寻尋|对對|专專|节節|办辦|动動|务務|劳勞|势勢|历歷|压壓|发發|号號|叶葉|听聽|员員|园園|围圍|图圖|团團|国國|场場|块塊|处處|备備|头頭|奖獎|实實|宝寶|岁歲|师師|带帶|广廣|应應|张張|录錄|径徑|总總|战戰|户戶|护護|报報|择擇|损損|换換|据據|挡擋|拿拿|择擇|损損|换換|据據|挡擋|挥揮|搜搜|术術|机機|权權|条條|来來|样樣|标標|栏欄|检檢|楼樓|业業|极極|构構|体體|价價|优優|传傳|伤傷|众眾|备備|复復|够夠|头頭|奋奮|妇婦|嫩嫩|宫宮|层層|岛島|币幣|帅帥|师師|庆慶|库庫|弯彎|强強|归歸|当當|录錄|心心|忆憶|怀懷|态態|惊驚|惯慣|愿願|恼惱|悬懸|情情|惭慚|戏戲|战戰|扩擴|扫掃|执執|护護|担擔|拥擁|择擇|拨撥|拟擬|挂掛|挤擠|挥揮|挺挺|捡撿|掌掌|排排|搅攪|摄攝|撑撐|撤撤|播播|摆擺|操操|支支|数數|整整|斗鬥|断斷|旧舊|无無|时時|显顯|晓曉|暂暫|术術|权權|杂雜|条條|松鬆|极極|构構|柜櫃|标標|栏欄|档檔|桥橋|梦夢|检檢|楼樓|档檔|橡橡|欢歡|款款|歌歌|残殘|殡殯|毕畢|汇匯|汉漢|沟溝|没沒|沿沿|泪淚|测測|济濟|浅淺|浇澆|浓濃|浪浪|涂塗|涛濤|涨漲|温溫|渐漸|渡渡|渠渠|游遊|湿濕|溃潰|满滿|滚滾|滨濱|漏漏|潜潛|热熱|灯燈|灵靈|灶竈|炉爐|烟煙|烦煩|烧燒|热熱|爱愛|牵牽|犹猶|独獨|献獻|猎獵|玩玩|环環|现現|珍珍|琴琴|瑶瑤|画畫|异異|疗療|痴癡|盐鹽|盘盤|监監|盖蓋|目目|睁睜|码碼|确確|础礎|礼禮|祝祝|神神|离離|种種|秘祕|积積|称稱|移移|税稅|竞競|笔筆|筑築|简簡|类類|粮糧|精精|紧緊|红紅|纯純|纲綱|练練|组組|细細|终終|绍紹|经經|结結|给給|统統|继繼|绩績|续續|缓緩|编編|缝縫|网網|罗羅|罚罰|置置|群群|义義|习習|乡鄉|书書|买買|乱亂|争爭|亏虧|云雲|亲親|亿億|仅僅|从從|仓倉|仪儀|们們|件件|优優|众眾|伙夥|会會|伟偉|传傳|伤傷|伪偽|似似|佣傭|余餘|体體|佩佩|供供|使使|侠俠|侣侶|侧側|侨僑|俩倆|俭儉|借借|倡倡|债債|假假|偿償|储儲|催催|傲傲|像像|儿兒|允允|党黨|兰蘭|关關|兴興|兹茲|养養|内內|冈岡|写寫|军軍|农農|冲沖|净淨|凉涼|减減|凤鳳|凭憑|击擊|凯凱|创創|划劃|则則|刚剛|别別|刮刮|制製|刷刷|券券|刹剎|前前|剑劍|剧劇|剩剩|劝勸|办辦|功功|加加|务務|劣劣|动動|助助|劲勁|劳勞|势勢|勤勤|包包|匀勻|化化|北北|匹匹|区區|医醫|华華|协協|单單|南南|卖賣|占佔|危危|厅廳|历歷|厉厲|压壓|厌厭|厨廚|原原|县縣|参參|双雙|反反|发發|叔叔|取取|受受|变變|叠疊|口口|另另|只隻|叫叫|召召|台臺|叹嘆|合合|吓嚇|吕呂|同同|后後|向向|吗嗎|否否|吧吧|含含|听聽|启啟|吹吹|呀呀|呢呢|周週|味味|呼呼|命命|咨諮|品品|响響|哦哦|哪哪|哭哭|唤喚|唯唯|商商|啊啊|善善|喜喜|喝喝|喷噴|嘛嘛|嘴嘴|嘻嘻|器器|四四|回回|因因|团團|园園|围圍|固固|图圖|圆圓|圈圈|土土|在在|地地|场場|坏壞|坚堅|坛壇|坡坡|坤坤|垃垃|城城|培培|基基|堂堂|堆堆|堵堵|塑塑|塔塔|塞塞|填填|境境|增增|壁壁|壮壯|声聲|壳殼|处處|复複|夏夏|外外|多多|夜夜|够夠|大大|天天|太太|夫夫|失失|头頭|夹夾|夺奪|奇奇|奋奮|奏奏|套套|奥奧|女女|她她|好好|如如|妇婦|妈媽|妙妙|姐姐|姑姑|姓姓|委委|姿姿|威威|娃娃|娘娘|婆婆|婚婚|媒媒|嫁嫁|嫩嫩|子子|孔孔|字字|存存|孙孫|孝孝|季季|孤孤|学學|宁寧|它它|宅宅|安安|宋宋|完完|宗宗|官官|定定|宜宜|宝寶|实實|客客|宣宣|室室|宫宮|害害|家家|容容|宽寬|宿宿|密密|富富|寒寒|察察|寝寢|对對|寺寺|导導|寿壽|封封|射射|将將|尊尊|小小|少少|尔爾|尘塵|尚尚|尝嘗|尤尤|就就|尸屍|尺尺|尾尾|居居|届屆|屋屋|屏屏|展展|属屬|屡屢|层層|屿嶼|岁歲|岛島|岸岸|崇崇|崩崩|工工|左左|巧巧|巨巨|巩鞏|差差|已已|巴巴|币幣|市市|布布|帅帥|师師|希希|帐帳|帝帝|带帶|帮幫|常常|帽帽|幅幅|幕幕|干乾|平平|年年|幸幸|幻幻|幼幼|广廣|庄莊|庆慶|庙廟|废廢|度度|座座|庭庭|康康|庸庸|廉廉|廊廊|延延|建建|开開|异異|弃棄|式式|引引|弟弟|张張|弥彌|弦弦|弯彎|弱弱|弹彈|强強|归歸|当當|录錄|形形|彩彩|彻徹|径徑|往往|征徵|待待|律律|後後|得得|循循|微微|德德|心心|必必|忆憶|志誌|忍忍|忘忘|忙忙|快快|念念|忽忽|怀懷|态態|怎怎|怒怒|思思|怠怠|急急|性性|怨怨|怪怪|总總|恋戀|恐恐|恢恢|息息|恰恰|恶惡|悄悄|悉悉|悔悔|患患|您您|悲悲|情情|惊驚|惜惜|惠惠|惧懼|惨慘|惯慣|想想|惹惹|愁愁|意意|愚愚|感感|愿願|慈慈|慌慌|慎慎|慕慕|慢慢|慧慧|慰慰|憾憾|懂懂|懒懶|懷懷|成成|我我|戒戒|或或|战戰|截截|戲戲|户戶|房房|所所|扁扁|手手|才才|打打|扑撲|托托|扛扛|扣扣|执執|扩擴|扫掃|扬揚|扭扭|扮扮|扰擾|批批|找找|承承|技技|抄抄|把把|抑抑|投投|抗抗|折折|抛拋|抢搶|护護|报報|披披|抬抬|抱抱|抵抵|押押|抽抽|担擔|拆拆|拉拉|拍拍|拒拒|拔拔|拖拖|拘拘|招招|拜拜|拟擬|拥擁|拦攔|拨撥|择擇|括括|拳拳|拾拾|持持|指指|按按|挑挑|挖挖|挡擋|挣掙|挤擠|挥揮|振振|挺挺|捉捉|捐捐|捕捕|捞撈|损損|捡撿|换換|捧捧|据據|掀掀|掉掉|掌掌|排排|掘掘|掠掠|探探|掲揭|接接|控控|推推|掩掩|措措|描描|提提|插插|握握|揭揭|搅攪|搜搜|搞搞|搬搬|搭搭|摄攝|摆擺|摇搖|摊攤|摔摔|摘摘|摧摧|摸摸|撑撐|撒撒|撞撞|撤撤|播播|撮撮|操操|擅擅|擋擋|擠擠|擦擦|攀攀|支支|收收|改改|攻攻|放放|政政|故故|效效|敌敵|教教|救救|敢敢|散散|敬敬|数數|敲敲|整整|文文|斗鬥|料料|斜斜|断斷|新新|方方|施施|旅旅|旋旋|族族|旗旗|无無|既既|日日|旧舊|早早|时時|明明|易易|昔昔|星星|映映|春春|昨昨|是是|晃晃|晒曬|晚晚|晨晨|普普|景景|晴晴|智智|暂暫|暑暑|暗暗|暮暮|暴暴|曝曝|更更|替替|最最|月月|有有|朋朋|服服|望望|朝朝|期期|术術|本本|机機|朽朽|杂雜|权權|杆桿|李李|材材|村村|杜杜|束束|条條|来來|杨楊|杯杯|松鬆|板板|极極|构構|析析|林林|果果|枝枝|架架|柏柏|某某|染染|柜櫃|查查|柳柳|标標|栅柵|栈棧|栋棟|栏欄|栖棲|校校|株株|样樣|核核|根根|格格|桂桂|桃桃|案案|桌桌|桑桑|档檔|桥橋|梁梁|梅梅|梦夢|梨梨|检檢|棉棉|棋棋|棒棒|棚棚|森森|棵棵|椅椅|植植|椒椒|楚楚|楼樓|概概|榜榜|模模|横橫|樱櫻|橡橡|橱櫥|次次|欢歡|欣欣|欧歐|歇歇|歉歉|止止|正正|此此|步步|武武|歧歧|死死|殊殊|残殘|段段|殿殿|毁毀|母母|每每|毒毒|比比|毕畢|毛毛|氏氏|民民|气氣|氛氛|水水|永永|求求|汇匯|汉漢|汗汗|江江|池池|污污|汤湯|沃沃|沈沈|沉沉|没沒|沙沙|沟溝|沿沿|泄洩|泊泊|法法|泡泡|波波|泥泥|注注|泪淚|泰泰|洁潔|洋洋|洗洗|洛洛|洞洞|活活|洽洽|派派|流流|浅淺|浆漿|浇澆|浊濁|测測|济濟|浏瀏|浓濃|浪浪|海海|涂塗|消消|涉涉|涛濤|润潤|涨漲|涵涵|液液|涼涼|淘淘|淡淡|淮淮|深深|混混|淺淺|清清|渐漸|渡渡|渠渠|温溫|港港|游遊|湖湖|湾灣|湿濕|源源|準準|溃潰|溜溜|溪溪|滑滑|滚滾|滨濱|满滿|漂漂|漏漏|演演|漠漠|漫漫|潜潛|潮潮|澄澄|激激|濒瀕|瀑瀑|灌灌|火火|灭滅|灯燈|灰灰|灵靈|灶竈|灾災|炉爐|炒炒|炮炮|炸炸|点點|炼煉|烂爛|烟煙|烤烤|烦煩|烧燒|烫燙|热熱|焦焦|然然|煮煮|照照|熊熊|熟熟|熬熬|燃燃|爆爆|爪爪|爬爬|爱愛|爽爽|片片|版版|牌牌|牙牙|牛牛|牧牧|物物|牵牽|特特|犯犯|状狀|犹猶|独獨|狂狂|狗狗|狠狠|狼狼|猛猛|猜猜|猪豬|猫貓|猴猴|献獻|猎獵|率率|玉玉|王王|玩玩|环環|现現|玻玻|珍珍|珠珠|班班|球球|理理|琴琴|瑜瑜|瑞瑞|瑶瑤|璃璃|瓜瓜|瓶瓶|生生|用用|田田|由由|电電|画畫|畅暢|界界|留留|略略|番番|疆疆|疏疏|疑疑|疗療|疯瘋|疲疲|疾疾|病病|症症|痛痛|痴癡|痹痺|瘦瘦|登登|白白|百百|的的|皇皇|皮皮|盆盆|盈盈|益益|盐鹽|监監|盒盒|盖蓋|盘盤|目目|盲盲|直直|相相|盼盼|看看|真真|眠眠|眼眼|着著|睁睜|睡睡|督督|瞧瞧|瞬瞬|矛矛|矢矢|知知|短短|石石|矿礦|码碼|砖磚|研研|破破|硬硬|确確|碎碎|碗碗|碧碧|碰碰|磁磁|磨磨|礼禮|社社|祖祖|祝祝|神神|祥祥|票票|禁禁|福福|离離|私私|秀秀|秃禿|秋秋|种種|秘祕|秤秤|秩秩|积積|称稱|移移|稀稀|程程|稍稍|税稅|稳穩|稻稻|穆穆|穗穗|穴穴|究究|穷窮|空空|穿穿|窄窄|窗窗|窝窩|立立|竞競|竹竹|笑笑|笔筆|笨笨|符符|笼籠|筑築|筒筒|筛篩|签簽|简簡|算算|管管|箭箭|箱箱|篇篇|篮籃|簿簿|籍籍|粉粉|粒粒|粗粗|粘黏|粮糧|精精|糊糊|糕糕|糖糖|糟糟|系系|紧緊|紫紫|累累|繁繁|纠糾|红紅|纤纖|约約|级級|纪紀|纯純|纱紗|纲綱|纳納|纵縱|纷紛|纸紙|纹紋|线線|练練|组組|细細|织織|终終|绍紹|经經|绑綁|结結|绕繞|绘繪|给給|络絡|绝絕|统統|绣繡|绪緒|续續|绩績|绪緒|绰綽|绳繩|维維|绵綿|综綜|绿綠|缓緩|编編|缘緣|缝縫|缩縮|缴繳|网網|罗羅|罚罰|罢罷|置置|署署|羊羊|美美|羞羞|群群|翅翅|翔翔|翘翹|翼翼|耀耀|老老|考考|耐耐|耗耗|耳耳|聊聊|聘聘|联聯|聪聰|肃肅|肉肉|肌肌|肖肖|肚肚|肝肝|肠腸|股股|肥肥|肩肩|肯肯|育育|胁脅|胃胃|背背|胎胎|胖胖|胜勝|胞胞|胡胡|胸胸|能能|脂脂|脉脈|脑腦|脚腳|脱脫|腐腐|腔腔|腰腰|腹腹|腻膩|腾騰|膀膀|膊膊|膝膝|膜膜|膨膨|臂臂|臣臣|自自|臭臭|至至|致致|舆輿|舌舌|舍捨|舒舒|舞舞|航航|般般|船船|艇艇|良良|色色|艺藝|芒芒|芙芙|花花|芽芽|苍蒼|苗苗|苛苛|若若|苦苦|英英|茂茂|范範|茶茶|荐薦|荒荒|荣榮|荷荷|莫莫|莲蓮|获獲|菜菜|萄萄|萌萌|萝蘿|营營|萧蕭|落落|著著|葛葛|葡葡|蒋蔣|蒙蒙|蒸蒸|蓄蓄|蓝藍|蔑蔑|蔡蔡|薄薄|薪薪|藏藏|藤藤|藩藩|虎虎|虑慮|虚虛|虫蟲|蛇蛇|蛋蛋|蛮蠻|蜂蜂|蜜蜜|蝶蝶|融融|血血|行行|衍衍|街街|衡衡|衣衣|补補|表表|衫衫|被被|裁裁|装裝|裂裂|裕裕|裤褲|西西|要要|覆覆|观觀|觉覺|览覽|角角|解解|触觸|言言|誉譽|警警|计計|订訂|认認|议議|记記|讲講|许許|论論|设設|访訪|证證|评評|识識|诉訴|词詞|译譯|试試|诗詩|话話|该該|详詳|语語|误誤|说說|请請|诸諸|诺諾|读讀|课課|谁誰|调調|谈談|谊誼|谋謀|谓謂|谜謎|谢謝|谣謠|谦謙|谱譜|豆豆|象象|豪豪|豫豫|貌貌|负負|贡貢|财財|责責|贤賢|败敗|货貨|质質|贩販|贪貪|购購|贯貫|贱賤|贴貼|贵貴|贷貸|贸貿|费費|贺賀|贼賊|赁賃|赂賂|资資|赊賒|赋賦|赌賭|赏賞|赐賜|赔賠|赖賴|赚賺|赛賽|赞贊|赠贈|走走|赶趕|起起|超超|越越|趋趨|趣趣|足足|跃躍|跌跌|跑跑|距距|跟跟|路路|跳跳|踏踏|踢踢|踩踩|踪蹤|蹈蹈|蹲蹲|身身|躲躲|车車|轨軌|轩軒|转轉|轮輪|软軟|轰轟|轻輕|辅輔|辆輛|辈輩|辉輝|辑輯|输輸|辛辛|辞辭|辨辨|辩辯|达達|迁遷|过過|迈邁|运運|近近|返返|还還|这這|进進|远遠|违違|连連|迟遲|迫迫|述述|迷迷|追追|退退|送送|适適|逃逃|逆逆|选選|逊遜|透透|逐逐|递遞|通通|逛逛|造造|逻邏|遇遇|遍遍|道道|遗遺|遥遙|遣遣|遭遭|避避|那那|邀邀|邮郵|邻鄰|郁鬱|部部|都都|鄙鄙|配配|酒酒|酱醬|酸酸|醉醉|醒醒|采採|释釋|里裡|重重|野野|量量|金金|针針|钓釣|钙鈣|钢鋼|钥鑰|钦欽|钱錢|钻鑽|铁鐵|铃鈴|铅鉛|银銀|铜銅|铝鋁|铸鑄|铺鋪|链鏈|锁鎖|锅鍋|锋鋒|锐銳|错錯|锡錫|锦錦|键鍵|锻鍛|镇鎮|镜鏡|镶鑲|长長|门門|闪閃|闭閉|问問|闲閒|间間|闷悶|闹鬧|闻聞|阀閥|阁閣|阅閱|队隊|阳陽|阴陰|阵陣|阶階|阻阻|附附|际際|陆陸|陈陳|陕陝|降降|限限|陪陪|陵陵|院院|除除|险險|陶陶|随隨|隐隱|隔隔|障障|难難|雄雄|雅雅|集集|雇僱|雕雕|雷雷|零零|雾霧|需需|震震|霸霸|露露|青青|静靜|非非|靠靠|面面|革革|靴靴|鞋鞋|鞭鞭|韩韓|音音|韵韻|响響|页頁|顶頂|项項|顺順|须須|顾顧|领領|颇頗|频頻|颗顆|题題|额額|颜顏|风風|飘飄|飞飛|食食|饥飢|饭飯|饮飲|饰飾|饱飽|馆館|馅餡|首首|香香|驱驅|驶駛|驻駐|驾駕|骄驕|骗騙|骚騷|骤驟|骨骨|高高|鬼鬼|魂魂|魅魅|魔魔|鱼魚|鲜鮮|鸟鳥|鸡雞|鸣鳴|鸭鴨|鹅鵝|鹤鶴|鹰鷹|麦麥|麻麻|黄黃|黑黑|默默|鼓鼓|鼠鼠|齐齊|龄齡|龙龍|龟龜';
    if (!this._s2tMap) {
      this._s2tMap = new Map();
      map.split('|').forEach(pair => {
        if (pair.length >= 2) this._s2tMap.set(pair[0], pair[1]);
      });
    }
    return [...text].map(c => this._s2tMap.get(c) || c).join('');
  },

  /**
   * 從 Google Autocomplete 取得延伸建議（JSONP）
   * @param {string} query - 搜尋詞
   * @param {string[]} exclude - 已搜過的 query，要過濾掉
   * @returns {Promise<string[]>}
   */
  fetchGoogleSuggestions(query, exclude = []) {
    return new Promise((resolve) => {
      const q = String(query || '').trim();
      if (!q) { resolve([]); return; }

      const callbackName = '_gsc_' + Math.random().toString(36).slice(2, 8);
      const timeout = setTimeout(() => {
        cleanup();
        resolve([]);
      }, 4000);

      const cleanup = () => {
        clearTimeout(timeout);
        delete window[callbackName];
        script.remove();
      };

      window[callbackName] = (data) => {
        cleanup();
        try {
          const raw = Array.isArray(data[1]) ? data[1] : [];
          const excludeSet = new Set(exclude.map(s => s.toLowerCase()));
          excludeSet.add(q.toLowerCase());
          const seenLower = new Set();
          const filtered = raw
            .map(s => this.s2t((Array.isArray(s) ? s[0] : String(s)).trim()))
            .filter(s => {
              if (!s || excludeSet.has(s.toLowerCase())) return false;
              if (seenLower.has(s.toLowerCase())) return false;
              seenLower.add(s.toLowerCase());
              if (s.length > 20) return false;
              // 過濾含完整地址或店名的語句（路/街/巷/弄/號 + 區）
              if (/[路街巷弄號]/.test(s)) return false;
              // 過濾含太多英文（可能是店名堆疊）
              const engRatio = (s.match(/[a-zA-Z]/g) || []).length / s.length;
              if (engRatio > 0.4) return false;
              return true;
            })
            .slice(0, 6);
          resolve(filtered);
        } catch { resolve([]); }
      };

      const script = document.createElement('script');
      script.src = `https://clients1.google.com/complete/search?client=hp&hl=zh-TW&gl=tw&q=${encodeURIComponent(q)}&callback=${callbackName}`;
      document.head.appendChild(script);
    });
  },

  extractLocations(query) {
    const text = String(query || '');
    const candidates = (QueryEngine?.LOCATIONS || [])
      .filter(location => text.includes(location))
      .sort((a, b) => b.length - a.length);

    const unique = [];
    candidates.forEach((location) => {
      if (unique.some(saved => saved.includes(location) || location.includes(saved))) return;
      unique.push(location);
    });

    return unique.slice(0, 2);
  },

  renderSummary(analysis) {
    if (!this.elements.summary) return;

    const total = analysis.articles.length;
    const parts = [];

    if (analysis.validated > 0) {
      parts.push(`${analysis.validated} 篇已驗證（至少 2 個面向有 AIO）`);
    }
    if (analysis.partial > 0) {
      parts.push(`${analysis.partial} 篇部分驗證`);
    }
    if (analysis.pending > 0) {
      parts.push(`${analysis.pending} 篇資料還不夠，建議補搜`);
    }

    const statusLine = parts.length > 0
      ? `共 ${total} 篇文章：${parts.join('、')}。`
      : `共 ${total} 篇文章，目前還沒有驗證結果。`;

    const tipLine = analysis.pending > 0
      ? '展開下方各篇可以看「還沒補驗證」的面向，補搜後再回來看結果會更完整。'
      : (analysis.validated === total
        ? '所有文章都已驗證到足夠面向，可以參考各篇的偏好判讀。'
        : '部分文章的面向還沒補齊，補搜後判讀會更準。');

    this.elements.summary.innerHTML = `
      <p>${Utils.escapeHtml(statusLine)}</p>
      <p>${Utils.escapeHtml(tipLine)}</p>
    `;
  },

  renderChips(analysis) {
    if (!this.elements.chips) return;

    this.elements.chips.innerHTML = `
      <span class="insight-chip">
        <span class="insight-chip-label">已驗證文章</span>
        <span class="insight-chip-count">${analysis.validated}</span>
      </span>
      <span class="insight-chip">
        <span class="insight-chip-label">部分驗證</span>
        <span class="insight-chip-count">${analysis.partial}</span>
      </span>
      <span class="insight-chip">
        <span class="insight-chip-label">待補驗證</span>
        <span class="insight-chip-count">${analysis.pending}</span>
      </span>
    `;
  },

  renderTree(analysis) {
    if (!this.elements.tree) return;

    if (analysis.articles.length === 0) {
      this.elements.tree.innerHTML = '<div class="chart-empty">目前還沒有足夠的單篇資料</div>';
      return;
    }

    this.elements.tree.innerHTML = analysis.articles.map((article, index) => `
      <details class="topic-node"${index < 2 ? ' open' : ''}>
        <summary class="topic-node-summary">
          <span class="topic-node-title">${Utils.escapeHtml(article.title)}</span>
          <span class="topic-node-meta">${Utils.escapeHtml(article.verdictLabel)} // ${article.verifiedFacets.length}/${article.totalFacets} SCANNED</span>
        </summary>
        <div class="topic-node-body">
          <div class="topic-branch">
            <span class="topic-branch-label">// DIAGNOSIS — 這篇的 AIO 表現如何</span>
            <span class="topic-branch-value">${article.summary}</span>
          </div>
          <div class="topic-branch">
            <span class="topic-branch-label">// TARGET ZONE — 地區與核心關鍵字</span>
            <span class="topic-branch-value">${Utils.escapeHtml(
              article.locations.length > 0
                ? `${article.locations.join('、')} / ${article.baseQuery || article.title}`
                : (article.baseQuery || article.title)
            )}</span>
          </div>
          <div class="topic-branch">
            <span class="topic-branch-label">// USER INTENT — 使用者真的在搜什麼（來自 Google）</span>
            <div class="topic-query-list" data-google-suggest="${Utils.escapeHtml(article.baseQuery || article.title)}">
              <span class="topic-branch-value suggest-loading">LOADING SIGNAL...</span>
            </div>
          </div>
          <div class="topic-branch">
            <span class="topic-branch-label">// VERIFIED — 已確認出現 AIO 的面向</span>
            <div class="topic-query-list">
              ${this.renderFacetChips(article.verifiedFacets, 'facet-chip-success', '<span class="status-dim">NO DATA YET</span>')}
            </div>
          </div>
          <div class="topic-branch">
            <span class="topic-branch-label">// MISS — 已搜尋但未觸發 AIO</span>
            <div class="topic-query-list">
              ${this.renderFacetChips(article.attemptedFacets, 'facet-chip-warning', '<span class="status-dim">NONE</span>')}
            </div>
          </div>
          <div class="topic-branch">
            <span class="topic-branch-label">// PENDING — 尚未掃描的面向</span>
            <div class="topic-query-list">
              ${this.renderFacetChips(article.missingFacets, 'facet-chip-muted', '<span class="status-good">ALL CLEAR</span>')}</div>
          </div>
          <div class="topic-branch">
            <span class="topic-branch-label">// HIT QUERIES — 命中 AIO 的搜尋語句</span>
            <div class="topic-query-list">
              ${article.representativeQueries.length > 0
                ? article.representativeQueries.map(query => `
                    <code class="topic-query-item">${Utils.escapeHtml(query)}</code>
                  `).join('')
                : '<span class="topic-branch-value status-dim">AWAITING SIGNAL</span>'}
            </div>
          </div>
          <div class="topic-branch">
            <span class="topic-branch-label">// RESCAN — 建議補充掃描的面向</span>
            <div class="suggestion-chip-row">
              ${article.suggestions.length > 0
                ? article.suggestions.map(query => `
                    <span class="suggestion-chip">${Utils.escapeHtml(query)}</span>
                  `).join('')
                : '<span class="status-good">SCAN COMPLETE</span>'}
            </div>
          </div>
          <div class="topic-branch">
            <span class="topic-branch-label">// EXPAND — 延伸寫作方向</span>
            <div class="suggestion-chip-row" data-extend-target="${Utils.escapeHtml(article.baseQuery || article.title)}">
              <span class="topic-branch-value suggest-loading">LOADING SIGNAL...</span>
            </div>
          </div>
        </div>
      </details>
    `).join('');

    // 異步載入 Google Suggest
    this.loadGoogleSuggestions(analysis);
  },

  /**
   * 異步載入每篇文章的 Google 搜尋建議
   */
  async loadGoogleSuggestions(analysis) {
    // 收集所有文章標題（用來比對延伸方向是否已寫過）
    const allTitles = analysis.articles.map(a =>
      (a.title || '').toLowerCase()
    );

    for (const article of analysis.articles) {
      const baseQuery = article.baseQuery || article.title;
      const escapedQuery = Utils.escapeHtml(baseQuery);

      try {
        const suggestions = await this.fetchGoogleSuggestions(baseQuery, []);

        // 「使用者在意的」— 顯示所有 Google 建議
        const suggestEl = this.elements.tree?.querySelector(
          `[data-google-suggest="${escapedQuery}"]`
        );
        if (suggestEl && suggestions.length > 0) {
          // 每個建議用 FACET_RULES 比對標籤
          suggestEl.innerHTML = suggestions.map(s => {
            const facet = this.matchFacet(s);
            const tagHtml = facet
              ? `<span class="suggest-tag" data-facet="${facet.key}">${Utils.escapeHtml(facet.label)}</span>`
              : '';
            return `<span class="suggestion-chip suggestion-chip-google">${tagHtml}${Utils.escapeHtml(s)}</span>`;
          }).join('');
        } else if (suggestEl) {
          suggestEl.innerHTML = '<span class="status-dim">NO SIGNAL</span> — Google Autocomplete 未回傳資料';
        }

        // 「延伸寫作方向」— 過濾掉跟已有文章標題重疊的，只留新方向
        const extendEl = this.elements.tree?.querySelector(
          `[data-extend-target="${escapedQuery}"]`
        );
        if (extendEl && suggestions.length > 0) {
          const newTopics = suggestions.filter(s => {
            const lower = s.toLowerCase();
            return !allTitles.some(t =>
              t.includes(lower) || lower.includes(t)
            );
          }).slice(0, 5);

          if (newTopics.length > 0) {
            // 每個關鍵字獨立產分析，避免同 facet 共用描述導致文不對題
            extendEl.innerHTML = newTopics.map(s => {
              const facet = this.matchFacet(s);
              const analysis = this.buildExtendAnalysis(s, facet, baseQuery);
              const tagHtml = facet
                ? `<span class="suggest-tag" data-facet="${facet.key}">${Utils.escapeHtml(facet.label)}</span>`
                : '';
              const chip = `<span class="suggestion-chip suggestion-chip-new">${Utils.escapeHtml(s)}</span>`;
              return `<div class="extend-item">
                <div class="extend-keyword">${tagHtml}${chip}</div>
                <div class="extend-analysis">${Utils.escapeHtml(analysis)}</div>
              </div>`;
            }).join('');
          } else {
            extendEl.innerHTML = '<span class="status-good">COVERED — Google 熱搜方向皆已有對應內容</span>';
          }
        } else if (extendEl) {
          extendEl.innerHTML = '<span class="status-dim">NO SIGNAL</span> — Google Autocomplete 未回傳資料';
        }
      } catch {
        // 失敗就靜默跳過
      }
    }
  },

  /**
   * 用 FACET_RULES 比對 Google 建議的標籤
   */
  /**
   * 根據面向類型 + 關鍵字，產生延伸寫作建議
   */
  /** 寬鬆版 Google Autocomplete（產業探索用，只過濾長度） */
  fetchGoogleSuggestionsRaw(query) {
    return new Promise((resolve) => {
      const q = String(query || '').trim();
      if (!q) { resolve([]); return; }

      const callbackName = '_gsr_' + Math.random().toString(36).slice(2, 8);
      const timeout = setTimeout(() => { cleanup(); resolve([]); }, 4000);

      const cleanup = () => {
        clearTimeout(timeout);
        delete window[callbackName];
        script.remove();
      };

      window[callbackName] = (data) => {
        cleanup();
        try {
          const raw = Array.isArray(data[1]) ? data[1] : [];
          const seen = new Set([q.toLowerCase()]);
          const filtered = raw
            .map(s => this.s2t((Array.isArray(s) ? s[0] : String(s)).trim()))
            .filter(s => {
              if (!s || s.length > 30 || seen.has(s.toLowerCase())) return false;
              seen.add(s.toLowerCase());
              return true;
            })
            .slice(0, 6);
          resolve(filtered);
        } catch { resolve([]); }
      };

      const script = document.createElement('script');
      script.src = `https://clients1.google.com/complete/search?client=hp&hl=zh-TW&gl=tw&q=${encodeURIComponent(q)}&callback=${callbackName}`;
      document.head.appendChild(script);
    });
  },

  /** 偵測文章所屬產業 */
  detectIndustry(text) {
    for (const rule of this.INDUSTRY_RULES) {
      if (rule.regex.test(text)) return rule;
    }
    return null;
  },

  buildExtendAnalysis(keyword, facet, baseQuery) {
    const short = (baseQuery || keyword).replace(/\s+(推薦|價格|比較|入門|怎麼選|哪家好).*/i, '').trim();
    const industry = this.detectIndustry(`${keyword} ${baseQuery}`);

    if (!facet) {
      if (industry) {
        return `「${keyword}」有人在搜，但你的${industry.label}內容還沒接住這題。補上去，就多一個被 AIO 引用的入口。`;
      }
      return `「${keyword}」有人在搜，但你沒有對應的內容。光是把這題接住，就多一個被 AIO 引用的入口。`;
    }

    // 基礎建議（不分產業）
    const baseTips = {
      recommend: `搜推薦的人還在挑，誰先給他一份整理好的清單，他就信誰。從你現有的${short}文章內連過來，讀者不用跳出去找。`,
      price: `搜價格的人已經快掏錢了，差一篇幫他算清楚的。把費用拆開講、列方案比較，從推薦文連過來，轉換率直接拉高。`,
      decision: `會搜「怎麼選」的人就是選擇障礙——他需要你幫他下結論。條件比較表 + 一句「如果你是 X 情況，選這個」，AIO 最愛引用有結論的文章。`,
      compare: `比較型的搜尋量通常不低，而且搜的人目的很明確。一篇 A vs B 對比文（表格 + 你的觀點），Google 會優先抓有結構的內容。`,
      guide: `搜教學的是新手，他要的是「講人話」的入門指南。步驟不用多，講清楚就好。AIO 偏好好懂的內容，這種文章一寫就有長尾流量。`,
      location: `搜地點的人已經準備出門了，差一篇告訴他「怎麼到、好不好停車」的。地址 + 地圖 + 捷運出口講清楚，在地搜尋的 AIO 很吃這種。`,
      experience: `搜心得的人想看真實感受，不是官方話術。寫一篇有細節的體驗文（環境、流程、感受），AIO 抓真實內容的機率比廣告文高得多。`,
      aftercare: `搜售後的人已經買了或快買了，他擔心的是「之後怎麼辦」。把保固、維修、保養講清楚，這種文章留客率很高，AIO 也愛引。`,
      community: `會搜社群討論的人想看「大家怎麼說」。整理 PTT/Dcard 上的真實評價，加上你的分析觀點，比起單一心得更有公信力。`
    };

    // 產業特化建議（覆蓋基礎建議）
    const industryTips = {
      beauty: {
        recommend: `搜美髮推薦的人通常已經對現在的髮廊不滿意了。一篇「設計師擅長什麼 + 作品照」的整理文，比什麼都有說服力。`,
        price: `染燙價格差距大，搜的人最怕踩雷。把價位帶、含不含護髮、加購項目列清楚，他看完就不用再問了。`,
        experience: `美髮體驗文的重點是「溝通過程」——設計師有沒有聽懂需求、成品跟溝通的落差。這種細節 AIO 特別喜歡引用。`
      },
      food: {
        recommend: `搜美食推薦的人通常正在餓。菜單重點 + 招牌必點 + 一句話評價，簡單暴力，AIO 就是要這種有結論的。`,
        price: `吃飯最怕到了才發現超預算。人均消費 + 套餐內容 + 加點建議，寫清楚就是在幫讀者省時間。`,
        location: `搜餐廳地點的人可能正在附近走來走去。門口照 + 最近的捷運站 + 停車資訊，寫一次就持續帶流量。`
      },
      auto: {
        recommend: `搜車行推薦的人怕被坑，信任感是第一位。店家資歷 + 透明報價 + 真實維修案例，幫他建立信心。`,
        price: `車主最在意的就是「合不合理」。常見項目的行情價列出來，他自己就能判斷了。這種內容 AIO 引用率很高。`,
        aftercare: `車子是長期消費，搜保養的人想知道「多久保養一次、要花多少」。保養週期表 + 費用參考，寫一篇管好幾年。`
      },
      hvac: {
        guide: `第一次洗冷氣的人什麼都不懂，他連「分離式跟窗型差在哪」都不確定。用最白話的方式講流程和注意事項就贏了。`,
        price: `冷氣清洗的價差很大，搜價格的人最怕被當盤子。列出分離式、窗型、吊隱式的行情，一張表就夠。`,
        aftercare: `洗完冷氣之後呢？多久要再洗、平常怎麼維護、濾網怎麼清——這種「洗完之後」的內容很少人寫，寫了就是藍海。`
      },
      medical: {
        recommend: `搜診所推薦的人通常很焦慮。醫師專長 + 看診風格 + 環境描述，幫他降低「第一次去」的不安感。`,
        price: `醫療費用搜的人想知道「要準備多少錢」。健保自費項目分開列，加上各方案的差異比較，專業又貼心。`,
        guide: `搜醫療教學的是想先做功課的人。療程步驟 + 術前準備 + 恢復期注意事項，寫清楚就能建立信任感。`
      },
      fitness: {
        recommend: `搜健身房推薦的人在比較環境跟教練。器材清單 + 課表特色 + 適合什麼程度的人，幫他少走冤枉路。`,
        price: `健身的人最在意 CP 值。月費、入會費、教練課費用拆開講，再加上「什麼方案適合什麼目標」，搜的人看完就能決定。`
      },
      home: {
        recommend: `裝潢找誰做是大事，搜推薦的人想看案例。施工前後對比 + 預算範圍 + 溝通過程，比一百句推銷都有用。`,
        price: `裝潢費用是大坑，搜的人怕被報天價。坪數 x 單價的參考區間 + 哪些是必做哪些可省，這種拆解文最實用。`
      },
      travel: {
        recommend: `搜住宿推薦的人已經訂好行程了，差住的地方。房型 + 周邊機能 + 適合誰（親子/情侶/背包客），幫他秒選。`,
        location: `旅遊搜地點的人在規劃路線。景點之間的距離 + 交通方式 + 建議停留時間，一篇搞定他的行程規劃。`
      },
      eyewear: {
        recommend: `搜眼鏡推薦的人通常度數又跑了。品牌風格 + 價位帶 + 驗光師專業度，幫他找到適合的不用一家一家逛。`,
        price: `鏡框加鏡片的價差可以差十倍，搜的人想搞清楚「錢花在哪」。拆解鏡片等級、鍍膜差異，讓他花得明白。`
      }
    };

    // 先看有沒有產業特化建議
    if (industry && industryTips[industry.key]?.[facet.key]) {
      return industryTips[industry.key][facet.key];
    }

    return baseTips[facet.key] || `「${keyword}」有搜尋量，你還沒有對應內容。接住這題，就多一個 AIO 曝光的機會。`;
  },

  matchFacet(text) {
    for (const rule of this.FACET_RULES) {
      if (rule.regex.test(text)) return { key: rule.key, label: rule.label };
    }
    return null;
  },

  renderFacetChips(items, modifierClass, emptyText) {
    if (!items || items.length === 0) {
      return emptyText;
    }

    return items.map((item) => `
      <span class="insight-chip ${modifierClass}">
        <span class="insight-chip-label">${Utils.escapeHtml(item.label)}</span>
        <span class="insight-chip-count">${item.cited > 0 ? item.cited : item.aio}</span>
      </span>
    `).join('');
  },

  renderSuggestions(analysis) {
    if (!this.elements.suggestions) return;

    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    // 產業探索推薦（查 Google 即時熱搜）
    this.loadIndustryExplore();

    if (analysis.suggestions.length > 0) {
      this.elements.suggestions.innerHTML = `
        <div class="suggestion-timestamp">資料時間：${timestamp}</div>
        ${analysis.suggestions.map(s => `<span class="suggestion-chip">${Utils.escapeHtml(s)}</span>`).join('')}
      `;
      return;
    }

    // 沒有補搜題目時，收集掃描中的 Google 相關搜尋
    const allRelated = [];
    const seen = new Set();
    (this._lastItems || []).forEach(item => {
      (item.relatedSearches || []).forEach(r => {
        const lower = r.toLowerCase();
        if (!seen.has(lower) && r.length <= 20) {
          seen.add(lower);
          allRelated.push(r);
        }
      });
    });

    if (allRelated.length > 0) {
      const sample = allRelated.sort(() => Math.random() - 0.5).slice(0, 6);
      this.elements.suggestions.innerHTML = `
        <div class="suggestion-timestamp">資料時間：${timestamp}｜來源：Google 搜尋相關推薦</div>
        ${sample.map(s => {
          const facet = this.matchFacet(s);
          const tag = facet ? `<span class="suggest-tag" data-facet="${facet.key}">${Utils.escapeHtml(facet.label)}</span>` : '';
          return `<span class="suggestion-chip suggestion-chip-google">${tag}${Utils.escapeHtml(s)}</span>`;
        }).join('')}
      `;
      return;
    }

    // 連相關搜尋都沒有，直接顯示產業探索
    this.elements.suggestions.innerHTML = `
      <div class="suggestion-timestamp">資料時間：${timestamp}</div>
      <div id="industry-explore-slot"></div>
    `;
  },

  /** 查 Google 即時熱搜，隨機 3 個產業各顯示真實搜尋建議 */
  async loadIndustryExplore() {
    // 等 DOM 渲染完
    await new Promise(r => setTimeout(r, 100));

    const slot = document.getElementById('industry-explore-slot');
    if (!slot) return;

    const industries = [...this.INDUSTRY_RULES].sort(() => Math.random() - 0.5).slice(0, 3);
    const queries = industries.map(ind => {
      // 用產業 regex 的第一個關鍵字作為搜尋種子
      const match = ind.regex.source.match(/\(([^|)]+)/);
      return { industry: ind, seed: match ? match[1] : ind.label };
    });

    slot.innerHTML = '<div class="suggestion-timestamp">正在查詢 Google 即時熱搜...</div>';

    const results = [];
    for (const q of queries) {
      try {
        // 用寬鬆版抓（不過濾地址和英文比例），確保拿到足夠結果
        const suggestions = await this.fetchGoogleSuggestionsRaw(q.seed);
        results.push({ label: q.industry.label, suggestions: suggestions.slice(0, 3) });
      } catch {
        results.push({ label: q.industry.label, suggestions: [] });
      }
    }

    let html = '<div class="suggestion-timestamp">來自 Google Autocomplete・每次重新整理會換</div>';
    html += '<div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">';

    results.forEach(r => {
      if (r.suggestions.length === 0) return;
      const chips = r.suggestions.map(s =>
        `<span class="suggest-tag">${Utils.escapeHtml(s)}</span>`
      ).join(' ');
      html += `<div class="industry-explore-row"><span class="suggest-tag" data-facet="recommend" style="flex-shrink:0;">${Utils.escapeHtml(r.label)}</span>${chips}</div>`;
    });

    html += '</div>';
    slot.innerHTML = html;
  },

  show() {
    this.elements.card?.classList.remove('hidden');
  },

  reset() {
    if (this.elements.summary) this.elements.summary.innerHTML = '';
    if (this.elements.chips) this.elements.chips.innerHTML = '';
    if (this.elements.tree) this.elements.tree.innerHTML = '';
    if (this.elements.suggestions) this.elements.suggestions.innerHTML = '';
    this.elements.card?.classList.add('hidden');
  }
};
