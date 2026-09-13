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

2026-09-12 查得 `slidefourteen.org` 的 nameserver 仍是 Porkbun。此 Worker 路由方案需要有效 Cloudflare zone 與被代理的域名記錄。目前未改 nameserver、DNS、網域註冊商或人類站後端。

實際設定前應先匯入並核對原有完整 DNS 記錄，再決定是否將 DNS 服務轉到 Cloudflare；網域仍可留在 Porkbun 註冊。人類端的 DNS/CDN 傳輸會受這個設定影響，雖然人類遊戲檔案與網址都不變。這不是單純新增資料夾就能完成的部署。

需要擁有者連接 Cloudflare 帳戶並完成域名設定。不要把 API token 貼進聊天或提交到 Git。

## 部署方式

1. 將本目錄放到 GitHub repository 的 `ai-edition/`。
2. 使用 Node 22.13 以上，在此目錄執行 `npm ci`、`npm run build`、`npm test`。
3. 在使用者的 Cloudflare 帳戶建立獨立 D1 `slide-fourteen-agent`，保留它實際返回的 database ID。
4. 設置 `AGENT_D1_DATABASE_ID` 為該 ID，執行 `node configure.mjs`。若沒有真實 ID，程式會停止，不會猜測。
5. 在已登入的部署環境或 GitHub secrets 中設定 Cloudflare 認證。執行 `npx wrangler d1 migrations apply slide-fourteen-agent --remote --config wrangler.deploy.json`。
6. 確認該域名的 Cloudflare route prerequisites 已完成，再執行 `npx wrangler deploy --config wrangler.deploy.json`。

`deploy-agent.workflow.yml` 是手動觸發的 GitHub Actions 範本，可放到 `.github/workflows/deploy-agent.yml`；它不修改人類版 Pages 工作流程。需要 repository secrets `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID` 以及 variable `AGENT_D1_DATABASE_ID`。

設定刻意關閉 `workers.dev` 與 preview URLs，公開地址只使用自己的域名。路由為 `slidefourteen.org/Agent*`，程式對 `/AgentExtra` 等非目標路徑直接交回 origin；不攔截人類版 `/`、`/en/`、`/zh-hant/`、`/zh-hans/` 或 `/_next/`。

## 舊續讀資料

快照格式與判定未改，但新 D1 不會自動擁有舊代管站的資料。舊 continuation 要在新站繼續，仍需另行匯出、匯入原快照。此包不包含玩家資料、續讀 token 或任何憑證。

## 本地驗證

`npm test` 包含既有三語與主線判定測試，以及新部署的 HTTP 測試。HTTP 測試覆蓋三語 OPEN/HELP/L1/RESUME、token 改寫拒絕、重試與競態、無 JavaScript 表單、同域名路徑、限定 cookie 範圍、單一 Human archive footer 與人類路徑原樣通過。此驗證不代表 Cloudflare/DNS 正式設定或獨立 AI 盲測已完成。
