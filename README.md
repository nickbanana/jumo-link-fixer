# Jumo Link Fixer

巨魔不喜歡沒有預覽的連結，所以幫忙修正

修復社群媒體連結的 Open Graph 預覽資訊。當 Instagram、X、Facebook、Threads 等連結在 Discord 無法正確顯示預覽縮圖時，透過本服務即可解決...八成。

## 支援平台

| 子網域 | 對應平台 |
|--------|---------|
| `instagram.jumo.dev` | Instagram |
| `x.jumo.dev` | X (Twitter) |
| `twitter.jumo.dev` | Twitter（別名） |
| `threads.jumo.dev` | Threads |
| `facebook.jumo.dev` | Facebook |

## 使用方式

將原始連結的網域替換為對應的 `*.jumo.dev` 子網域即可：

```
https://www.instagram.com/p/ABC123
→ https://instagram.jumo.dev/p/ABC123
```

## 運作原理

1. 使用者將連結網域替換為 `{platform}.jumo.dev`
2. Cloudflare Worker 接收請求，從子網域辨識平台
3. 呼叫 Browserbase Function（無頭瀏覽器）擷取頁面內容與圖片
4. 回傳包含 Open Graph meta tags 的 HTML，讓通訊軟體正確顯示預覽

## 技術架構

| 元件 | 技術 |
|------|------|
| API / 路由 | Cloudflare Workers + [Hono](https://hono.dev/) |
| 瀏覽器自動化 | [Browserbase](https://www.browserbase.com/) Functions + [Stagehand](https://github.com/browserbase/stagehand) |
| 資料驗證 | Zod |
| 語言 | TypeScript |

## 專案結構

本服務由兩個獨立部署的專案組成：

- **`jumo-link-fixer`**（本 repo）— Cloudflare Worker，負責接收請求、路由分派、回傳 OG HTML
- **`jumo-link-fixer-function`**（獨立 repo）— Browserbase Function，負責以無頭瀏覽器擷取頁面 metadata 與圖片

兩者透過 `BROWSERBASE_FUNCTION_ID` 環境變數串接。

## 開發

### 環境設定

在專案根目錄建立 `.dev.vars` 檔案（不可 commit）：

```
BROWSERBASE_API_KEY=...
BROWSERBASE_PROJECT_ID=...
```

### 常用指令

```bash
# 本地開發
npm run dev

# 部署到 Cloudflare Workers
npm run deploy

# 產生 Worker 型別定義（修改 wrangler.jsonc 後執行）
npm run cf-typegen
```

## 部署

1. 先部署 Browserbase Function（`jumo-link-fixer-function`），取得 Function ID
2. 確認 `wrangler.jsonc` 中的 `BROWSERBASE_FUNCTION_ID` 已正確設定
3. 部署主專案：`npm run deploy`

## 授權

MIT License
