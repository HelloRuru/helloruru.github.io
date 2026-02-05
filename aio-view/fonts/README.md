# 字體子集化

獅尾四季春字體的子集化版本，只包含專案用到的字元。

## 字體檔案

| 檔案 | 字體 | 用途 |
|------|------|------|
| `SweiSpring-Regular.woff2` | 獅尾四季春 | H3、內文 |
| `SweiSugar-Bold.woff2` | 獅尾加糖 | H1、H2 標題 |

## 更新字體

當新增文字超出現有字元範圍時，需要重新子集化：

```bash
cd aio-view/fonts
npm install subset-font
node subset-fonts.js
```

腳本會：
1. 掃描 `index.html` 中的中文字元
2. 下載完整字體（首次執行）
3. 產生子集化的 woff2 檔案

## 字元清單

執行後會產生 `chars.txt`，列出所有包含的字元。

## 授權

獅尾字體採用 SIL Open Font License 1.1，可自由商用。

- [獅尾四季春](https://github.com/max32002/swei-spring)
- [獅尾加糖](https://github.com/max32002/swei-sugar)
