# jumo-link-fixer
巨魔不喜歡沒有預覽的連結，所以幫忙修正

## roadmap (by Gemini)

🚀 Jumo Universal Link Fixer 開發路線圖
這份路線圖分為三個階段，旨在確保您以最優化和最低成本的方式啟動服務。

### Phase 1: 基礎架構與核心功能 (The MVP)

目標： 讓單一平台的 Prefix 連結 能夠成功運作，並具備緩存能力。
|步驟|任務|詳述|技術棧|成果|
|---|---|---|---|---|
|1.1| Worker |初始化建立您的 Cloudflare Worker 專案，設定程式碼託管。|Cloudflare Workers (Node.js)|Worker 成功上線，準備接收 HTTP 請求。(OK)|
|1.2| 設置 DNS 路由|在 Cloudflare DNS 中，設定 *.jumo.dev 的萬用字元（Wildcard）CNAME 記錄指向您的 Worker。|Cloudflare| DNS任何子網域（如 instagram.jumo.dev）都能正確導向您的程式碼。|
|1.3| 整合 Browserless |獲取 Browserless/Browserbase API Key，並將其作為 Worker Secrets 存儲。| Browserless/Browserbase | 您的 Worker 現在可以安全地呼叫無頭瀏覽器服務。|
|1.4 | 核心處理邏輯撰寫 | Worker 邏輯來執行以下任務：a) 從 hostname（如 instagram.jumo.dev）和路徑解析出原始 URL。b) 呼叫 Browserless 進行網頁渲染和 Open Graph 數據抓取。| Node.js |當您在瀏覽器中輸入 https://instagram.jumo.dev/p/123 時，能返回包含 OG 標籤的 HTML 頁面。|
|1.5 | 實現 KV 緩存 | 整合 Cloudflare KV 作為緩存層： a) 在成功抓取後，將 OG 數據以原始 URL 為 Key 存入 KV (設定 TTL，如 24 小時)。 b) 在收到請求時，優先檢查 KV。|Cloudflare KV |服務速度大幅提升，並減少 Browserless 的訂閱成本。|

### Phase 2: 提升通用性與用戶體驗 (The Versatile Tool)

目標： 擴展支援所有主流平台，並建立 Discord Slash Command。

|步驟|任務|詳述|技術棧|成果|
|---|---|---|---|---|
|2.1 | 多平台解析器擴展 | Worker 的路由和解析邏輯，支援所有目標平台（Instagram, X, Facebook, Threads）。|Node.js | Regex/Switch您的服務能夠解析和處理所有預期的子網域連結。|
|2.2 | 建立 Discord 應用程式 | 在 Discord Developer Portal 中建立一個新的 Application (App)，獲取 Client ID 和 Public Key。| Discord Dev Portal | 應用程式和機器人帳戶成功設定。|
|2.3 | 設置互動端點 | 將 Worker 的 URL 設定為 Discord 應用程式的 Interactions Endpoint URL，並處理 Discord 的安全驗證。|Cloudflare Workers |Worker 能成功接收並回應來自 Discord 的 Slash Command 請求。|
|2.4 | 實作 /fix 指令 | 註冊 /fix <url> Slash Command，並在 Worker 中編寫處理程式：a) 接收原始 URL。b) 將其轉換為通用 OG URL 格式：https://[platform].jumo.dev/[path]。|Node.js|使用者可以透過 /fix 獲得正確的 jumo.dev 連結。|
|2.5 | 自動刪除/回應(選配，需管理權限) | 調整 /fix 的回應方式，使其能以「私密回應」（Ephemeral Response）或 Follow-up Webhook 形式，自動替換或刪除原始的壞連結。|Discord API |改善 Discord 聊天室內的用戶體驗。 |

### Phase 3: 優化與擴展 (Scalability & Polish)

目標： 確保服務穩定、安全，並準備好應對高流量。
|步驟|任務|詳述|技術棧|成果|
|---|---|---|---|---|
|3.1| 錯誤處理|實作穩健的錯誤處理，包含：a) Browserless 失敗時（如 IP 封鎖）返回友善錯誤訊息。b) KV 讀寫失敗時，嘗試重新抓取。|Node.js | try...catch服務具備韌性，不會因為單一組件失敗而崩潰。|
|3.2 | 性能優化 | 審查 Worker 的執行時間（CPU Time），特別是緩存檢查後的處理速度。| Cloudflare Dashboard | 確保 Worker 響應速度極快，降低營運成本。|
|3.3 | 文件化 | 為服務撰寫簡短的指南，解釋「jumo」的 Prefix 規則，以及如何在 Discord 中使用 /fix 指令。| Markdown | 用戶能輕鬆理解並開始使用您的服務。|
|3.4 | 監控 | 設定 Cloudflare Worker 的日誌和分析，監控每日請求量和錯誤率。| Cloudflare Analytics | 能夠追蹤服務使用情況和潛在問題。|

## develop with cloudflare

```txt
npm install
npm run dev
```

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
