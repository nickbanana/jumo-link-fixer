# Jumo Link Fixer — 開發指南

## 專案簡介

此服務透過 Cloudflare Workers 修復社群媒體連結的 Open Graph 預覽資訊。當使用者分享 Instagram、X/Twitter、Facebook 或 Threads 的連結時，這些平台通常無法在 Discord 等通訊軟體中正確顯示預覽縮圖，本服務負責擷取並回傳完整的 OG metadata 來解決此問題。

**運作原理：** 使用者將原始連結的網域替換為 `*.jumo.dev` 子網域，Worker 接收請求後呼叫 Browserbase Function 以無頭瀏覽器擷取頁面內容，再回傳結構化資料。

## 技術架構

### 主專案（此 repo）
- **執行環境**：Cloudflare Workers
- **框架**：Hono v4
- **語言**：TypeScript
- **部署工具**：Wrangler

### Function 專案（`jumo-link-fixer-function`，獨立部署）
- **執行環境**：Browserbase Functions
- **瀏覽器自動化**：Stagehand
- **資料驗證**：Zod

兩個專案**獨立部署**，主專案透過 `BROWSERBASE_FUNCTION_ID` 環境變數呼叫 Function。

## 支援平台

| 子網域 | 對應平台 |
|--------|---------|
| `instagram.jumo.dev` | Instagram |
| `x.jumo.dev` | X (Twitter) |
| `twitter.jumo.dev` | Twitter（別名） |
| `threads.jumo.dev` | Threads |
| `facebook.jumo.dev` | Facebook |

## 常用指令

```bash
# 本地開發（啟動 Cloudflare Worker 本地伺服器）
npm run dev

# 部署到 Cloudflare Workers
npm run deploy

# 產生 Worker 型別定義（修改 wrangler.jsonc 後執行）
npm run cf-typegen
```

## 環境設定

敏感設定儲存於 `.dev.vars`（本地開發用），**不可 commit 到 git**：

```
BROWSERBASE_API_KEY=...
BROWSERBASE_PROJECT_ID=...
GOOGLE_API_KEY=...
ANTHROPIC_API_KEY=...
```

生產環境的 secrets 透過 `wrangler secret put <KEY>` 設定。

## 部署步驟

1. **先部署 Browserbase Function**（`../jumo-link-fixer-function`），取得 Function ID
2. 確認 `wrangler.jsonc` 中的 `BROWSERBASE_FUNCTION_ID` 已正確設定
3. 登入 Wrangler：`wrangler login`
4. 部署主專案：`npm run deploy`

## 注意事項

### 禁止行為
- **不要修改 `wrangler.jsonc`**：Cloudflare 路由、zone ID 等設定由手動管理，避免意外覆蓋
- **不要 commit `.dev.vars` 或 `.env`**：含有 API keys 等敏感資訊
- **不要未經確認安裝新套件**：請先詢問再執行 `npm install <package>`
- **不要自動執行 `git push`**：push 前需使用者確認

### 測試
目前無自動化測試，功能驗證請在本地用 `npm run dev` 手動測試。

### 開發模式路由
本地開發時（`ENVIRONMENT=dev`），URL 路由同樣採子網域解析，格式為 `{platform}.localhost/...`，例如：
- `instagram.localhost/p/ABC123`
- `x.localhost/user/status/123`
