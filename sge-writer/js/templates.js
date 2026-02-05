/**
 * SGE 文案助手 - 快速插入模板
 * @module templates
 */

const TEMPLATES = {
  // 3×3 比較表
  table3x3: `
<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
  <thead>
    <tr style="background: linear-gradient(135deg, #D4A5A5, #B8A9C9); color: white;">
      <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">比較項目</th>
      <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">方案 A</th>
      <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">方案 B</th>
      <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">方案 C</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 12px; border: 1px solid #ddd; font-weight: 500;">規格</td>
      <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">基本款</td>
      <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">進階款</td>
      <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">旗艦款</td>
    </tr>
    <tr style="background: #fafafa;">
      <td style="padding: 12px; border: 1px solid #ddd; font-weight: 500;">價格區間</td>
      <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">$XXX - $XXX</td>
      <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">$XXX - $XXX</td>
      <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">$XXX - $XXX</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #ddd; font-weight: 500;">適合對象</td>
      <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">入門者</td>
      <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">一般需求</td>
      <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">專業需求</td>
    </tr>
  </tbody>
</table>
`,

  // Google 評論區塊
  review: `
<div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 16px 0;">
  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
    <span style="font-size: 1.25rem;">Google 評論</span>
    <span style="color: #fbbc04;">★★★★★</span>
    <span style="color: #5f6368; font-size: 0.875rem;">4.9 (XX 則評論)</span>
  </div>
  <blockquote style="margin: 0; padding-left: 16px; border-left: 3px solid #D4A5A5; color: #5f6368; font-style: italic;">
    「這裡放客戶的真實評論內容，記得使用實際評論或業界標準情境描述。」
  </blockquote>
  <p style="margin: 8px 0 0; font-size: 0.875rem; color: #80868b;">— 顧客姓名, XXXX年X月</p>
</div>
`,

  // 品牌資訊區塊
  brand: `
<div style="background: linear-gradient(135deg, rgba(212,165,165,0.1), rgba(184,169,201,0.1)); border-radius: 16px; padding: 24px; margin: 16px 0;">
  <h3 style="margin: 0 0 16px; color: #333;">【店家名稱】</h3>
  <ul style="margin: 0; padding-left: 20px; color: #4a4a4a; line-height: 1.8;">
    <li><strong>地址：</strong>台北市XX區XX路XX號（近XX捷運站步行X分鐘）</li>
    <li><strong>營業時間：</strong>週一至週五 10:00-20:00｜週六日 10:00-18:00</li>
    <li><strong>預約電話：</strong>02-XXXX-XXXX</li>
    <li><strong>LINE 預約：</strong>@xxxx</li>
  </ul>
  <p style="margin: 16px 0 0; padding: 12px; background: rgba(255,255,255,0.7); border-radius: 8px; font-size: 0.9375rem;">
    <strong>服務特色：</strong>XX年專業經驗｜使用XX品牌設備｜提供XX服務
  </p>
</div>
`,

  // 法律聲明
  disclaimer: `
<div style="margin: 24px 0; padding: 16px; background: #f5f5f5; border-radius: 8px; font-size: 0.8125rem; color: #666; line-height: 1.6;">
  <p style="margin: 0;">
    <strong>免責聲明：</strong>本文資訊僅供參考，實際服務內容、價格及效果可能因個人情況而異。
    建議消費前親自諮詢店家確認詳細內容。本站不對任何因使用本文資訊而產生的損失負責。
  </p>
</div>
`
};

export const templates = {
  editor: null,

  /**
   * 初始化模板功能
   */
  init(templateButtons, editorModule) {
    this.editor = editorModule;

    templateButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const templateName = btn.dataset.template;
        this.insert(templateName);
      });
    });
  },

  /**
   * 插入模板
   */
  insert(templateName) {
    const template = TEMPLATES[templateName];
    if (!template) {
      console.warn(`Template "${templateName}" not found`);
      return;
    }

    // 在游標位置插入模板
    document.execCommand('insertHTML', false, template);

    // 觸發分析更新
    const event = new Event('input', { bubbles: true });
    document.getElementById('editor').dispatchEvent(event);
  },

  /**
   * 取得所有模板
   */
  getAll() {
    return TEMPLATES;
  },

  /**
   * 取得單一模板
   */
  get(name) {
    return TEMPLATES[name] || null;
  }
};
