# 工作記錄（Worklog）

## 專案

**eugene-leetcode-26** — 以 three.js 3D 視覺化「今日三題」解題過程的 LeetCode 學習網頁（台灣正體中文）

- GitHub: https://github.com/tboydar/eugene-leetcode-26
- GitHub Pages（線上 3D 動畫）: https://tboydar.github.io/eugene-leetcode-26/

---

## 2026-10-15（今日）

### 任務

建立一個 GitHub Pages 靜態學習網站，用 three.js 3D 動畫逐步展示今日（20261015）三題的解題思路與過程，全站台灣正體中文。工程採單線程循序執行，GitHub API 一次只發一個請求（避免 PRO 並行上限 403）。

### 今日三題

| # | 題目 | 難度 | 技巧 | 3D 視覺化 |
|---|------|------|------|-----------|
| 56 | Merge Intervals（合併區間） | ⭐⭐ 中等（今日難題） | 排序 + 遍歷合併 | 區間 3D 長板沿數線排序、重疊發光合體成更長區間、結果飛入結果區 |
| 88 | Merge Sorted Array（合併兩個有序陣列） | ⭐ 簡單 | 雙指針（從尾端填） | nums1 / nums2 立柱 + 三顆光球指針，較大值複製飛到尾部空格、由大到小填入 |
| 26 | Remove Duplicates from Sorted Array（移除有序陣列重複項） | ⭐ 簡單 | 雙指針（原地） | 慢/快光球，重複項閃紅淡出成幽靈、新值飛到 slow 位置，最後前 k 格亮起 |

### 執行步驟

1. **確認既有專案模式**
   - 參考同帳號既有 `tboydar/jevai-typesafe-info-zh-tw`：
     - 每個專案是獨立 git repo，推到 `github.com/tboydar/<名>`
     - GitHub Pages 用 `.github/workflows/pages.yml` 直接部署 `demo/public`（無 build step）
     - 附 README.md / WORKLOG.md / LICENSE 文件
   - 與使用者確認：簡單兩題選 `88 + 26`，形式選**純靜態 HTML + three.js（無 build）**。

2. **建立專案骨架（task-1）**
   - `demo/public/`、`git init -b main`、`LICENSE`(MIT)、`.gitignore`、`README.md`。

3. **確認三題內容（task-2）**
   - 依產品知識整理題目敘述、官方範例、限制、思路、複雜度、雙語言程式碼，寫入 `docs/problems/56|88|26-*.md`。

4. **實作 3D 網頁（task-3）**
   - 下載 three.js 0.166 到 `demo/public/vendor/`（本地含入、可離線）。
   - 自建輕量動畫引擎 `js/vfx.js`：
     - `Engine`：WebGLRenderer、OrbitControls、燈光、Tween 補間、全域暫停/速度
     - `Runner`：步驟播放器（播放/暫停/單步/重置、步驟進度、單線程循序）
   - `js/problem-56.js` / `88` / `26`：各題獨立場景 + 步驟動畫（區間合體、飛展示意雙指針、幽靈跳過重複項）。
   - `js/main.js`：分頁切換、側欄題目內容、控制鈕、速度、RWD resize。
   - 修復過程 bug：
     - `content.js` 模板字串內誤用反引號導致語法錯誤 → 全數改用 `<code>`。
     - 切 tab 時舊 Runner 的「殭屍 step」會把舊題進度寫進新題計數、並把引擎誤凍結 → 加 `_alive` 守衛。

5. **本地驗證（task-4）**
   - 無頭 Chrome（CDP）冒煙測試：三題 11/6/11 個步驟全數自動播放到「✅ 完成」，console 0 錯誤。
   - 結構化驗證：56 結果區 3 塊、88 為 6+3 柱 + 3 光球、26 為 10 槽前 5 亮後 5 幽靈，皆符合演算法預期。
   - 整合斷言 verify4：**32 PASS / 0 FAIL**（zh-TW 標題/關鍵字、切換/播放/重置/單步、無 console 錯誤）。
   - 截圖像素分析：三張皆 96%+ 非背景色、渲染非空白。

6. **文件與 Pages（task-5）**
   - 補齊 `WORKLOG.md`、`.github/workflows/pages.yml`（沿用 jevai 既有 pages.yml 模式部署 `demo/public`）。

### 待辦

- `task-6`：循序建立 public repo `tboydar/eugene-leetcode-26`、push main、啟用 GitHub Pages，並驗證 https://tboydar.github.io/eugene-leetcode-26/ 回 200。
