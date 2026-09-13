# Slide Fourteen — 同域名 Analyst 部署版本

目標網址：`https://slidefourteen.org/Agent/`。遊戲、HTTP 協定、操作端點與瀏覽器工具都留在此路徑下。程式可放進現有 GitHub repository 的 `ai-edition/`，與人類版並存。

這份是準備好供部署的原始碼，不代表新後端已上線。既有 `/Agent/` 轉址已移除，搬移期間顯示暫時不可用。沒有在此版本建立新的帳號子域名。

## 保留的內容

`game/` 與第二輪修正版 `70fd6d839cc99960c05e055783343dfda7baf34b` 逐檔相同，包括謎題判定、三語、HELP、結局、R-05、P2 與續讀快照規則。SQL schema 相同。改動僅為部署、HTTP 路徑、cookie 範圍與獨立 HTML 渲染。

人類端檔案、導覽、sitemap、存檔與謎題均不需要修改。新 cookie 為 `sf_agent_continuation`，限 `/Agent/`；AI 不讀人類 localStorage。

表單來源以部署設定 `ANALYST_PUBLIC_ORIGIN` 驗證，不使用代理內部網址，也不信任任意轉送標頭。正式設定為 `https://slidefourteen.org`。已加入公開 HTTPS Origin／內部 HTTP request 的三語開始遊戲測試；不合法來源仍被拒絕。

## 為什麼 GitHub Pages 不能單獨執行這份版本

GitHub Pages 提供靜態檔案；目前 AI 版的 `POST /Agent/io`、不可任意改寫的續讀快照與重試去重需要後端。因此原始碼放 GitHub，執行交給 Cloudflare Worker + D1；Worker 只處理 `/Agent` 與 `/Agent/` 子路徑。其他路徑傳回既有 GitHub Pages origin。

單純新增 GitHub repository 或 CNAME 不能依 URL 子路徑分流。

官方依據：

- [GitHub Pages 說明](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Cloudflare Worker Routes](https://developers.cloudflare.com/workers/configuration/routing/routes/)

## 尚需連接的設定

此 Worker 路由方案需要有效 Cloudflare zone 與被代理的域名記錄。部署前確認 Cloudflare domain status 為 Active、原有 GitHub Pages DNS 記錄正確匯入，且 SSL/TLS 為 Full (strict)。

DNS 服務轉到 Cloudflare 時，網域仍可留在 Porkbun 註冊。人類端的 DNS/CDN 傳輸會受這個設定影響，雖然人類遊戲檔案與網址都不變。這不是單純新增資料夾就能完成的部署。

需要擁有者連接 Cloudflare 帳戶並完成域名設定。不要把 API token 貼進聊天或提交到 Git。

## Cloudflare Dashboard 連接 GitHub

`wrangler.jsonc` 已記錄擁有者提供的 D1 ID：`5f44a6b7-cba0-4413-83cd-ad1dc701bd69`。這是資源識別碼，不是存取憑證；第一次正式部署仍須透過擁有者的 Cloudflare 認證確認它可用。標準設定檔也讓 Workers Builds 能辨認這個子目錄內的 Worker。

在 Workers & Pages 建立 application 並連接 GitHub，使用：

| 欄位 | 值 |
|---|---|
| Repository | `Ssssspowerful/slide-fourteen` |
| Production branch | `main` |
| Worker name | `slide-fourteen-agent` |
| Root directory | `ai-edition` |
| Build command | `npm run build` |
| Deploy command | `npm run deploy` |
| Node version | 22.13 以上 |

先確認建置使用的 API token 有 Account / D1 / Edit 權限。Cloudflare 自動建立的 Workers Builds token 預設列出 Workers Scripts、KV、R2、Workers Routes 等權限，沒有 D1；可在 My Profile → API Tokens 編輯該 token，或選擇已包含 D1 權限的部署 token。Token 留在 Cloudflare，不貼進聊天或 Git。

`npm run deploy` 依序準備設定、套用尚未執行的 D1 migrations，再發布 Worker；資料庫步驟失敗時不會繼續發布。它不會刪除已存在的存檔。GitHub authorization 可只開放本 repository；部署只使用 `ai-edition/`。非正式分支建置可保持關閉。

官方設定說明：[Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)。

## CLI 或 GitHub Actions 部署

1. 將本目錄放到 GitHub repository 的 `ai-edition/`。
2. 使用 Node 22.13 以上，在此目錄執行 `npm ci`、`npm run build`、`npm test`。
3. D1 預設使用 `wrangler.jsonc` 裡已提供的 ID。若部署到另一個帳戶，先建立獨立 D1 並取得實際 ID。
4. 執行 `node configure.mjs`；如需使用另一個 D1，透過 `AGENT_D1_DATABASE_ID` 覆寫。設定會驗證 ID 格式，不會猜測。
5. 在已登入的部署環境或 GitHub secrets 中設定 Cloudflare 認證。執行 `npx wrangler d1 migrations apply slide-fourteen-agent --remote --config wrangler.deploy.json`。
6. 確認該域名的 Cloudflare route prerequisites 已完成，再執行 `npx wrangler deploy --config wrangler.deploy.json`。

`deploy-agent.workflow.yml` 是手動觸發的 GitHub Actions 範本，可放到 `.github/workflows/deploy-agent.yml`；它不修改人類版 Pages 工作流程。需要 repository secrets `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`；variable `AGENT_D1_DATABASE_ID` 可省略，留空時使用標準設定的 ID。

設定刻意關閉 `workers.dev` 與 preview URLs，公開地址只使用自己的域名。路由為 `slidefourteen.org/Agent*`，程式對 `/AgentExtra` 等非目標路徑直接交回 origin；不攔截人類版 `/`、`/en/`、`/zh-hant/`、`/zh-hans/` 或 `/_next/`。

## 舊續讀資料

快照格式與判定未改，但新 D1 不會自動擁有舊代管站的資料。舊 continuation 要在新站繼續，仍需另行匯出、匯入原快照。此包不包含玩家資料、續讀 token 或任何憑證。

## 本地驗證

`npm test` 包含既有三語與主線判定測試，以及新部署的 HTTP 測試。HTTP 測試覆蓋三語 OPEN/HELP/L1/RESUME、token 改寫拒絕、重試與競態、無 JavaScript 表單、同域名路徑、限定 cookie 範圍、單一 Human archive footer 與人類路徑原樣通過。此驗證不代表 Cloudflare/DNS 正式設定或獨立 AI 盲測已完成。
