# 今天我刷 LeetCode — eugene-leetcode-26

> 用 **three.js 3D 視覺化** 一步一步看懂 LeetCode 解題過程的學習筆記。
> 全部內容使用**台灣正體中文**撰寫。

| 標籤 | 內容 |
|------|------|
| 📅 日期 | 2026-10-15 |
| 🎯 主題 | 排序、合併、雙指針（Merge & Two Pointers） |
| 🧩 今日三題 | 1 題中等（難題）+ 2 題簡單 |
| 🕹️ 線上展示 | **https://tboydar.github.io/eugene-leetcode-26/** |

---

## 今日三題（2026-10-15）

| # | 題目 | 難度 | 技巧 | 3D 視覺化重點 |
|---|------|------|------|----------------|
| 56 | [Merge Intervals（合併區間）](https://leetcode.com/problems/merge-intervals/) | ⭐⭐ 中等（今日難題） | 排序 + 遍歷合併 | 區間方塊沿時間軸浮動、重疊區間 3D 合體 |
| 88 | [Merge Sorted Array（合併兩個有序陣列）](https://leetcode.com/problems/merge-sorted-array/) | ⭐ 簡單 | 雙指針（從尾端填） | 兩條陣列立柱 + 指針光球掃描合併 |
| 26 | [Remove Duplicates from Sorted Array（移除有序陣列重複項）](https://leetcode.com/problems/remove-duplicates-from-sorted-array/) | ⭐ 簡單 | 雙指針（原地） | 指針賽跑、重複元素淡出、陣列原地收縮 |

每題都包含：
- **題目敘述**與**官方範例**
- **解題思路**（一步步）
- **複雜度分析**（時間 / 空間）
- **可互動的 three.js 3D 動畫**：播放 / 暫停 / 單步 / 重置
- **參考程式碼**（Python / JavaScript）

---

## 目錄結構

```
eugene-leetcode-26/
├── demo/public/          # 靜態 3D 解題網頁（GitHub Pages 直接部署此資料夾，無 build step）
│   ├── index.html        # 主頁（三題入口，分頁切換）
│   ├── favicon.png       # 網站圖示
│   ├── css/style.css     # 樣式
│   ├── js/               # 引擎(vfx)、三題模組(problem-*)、內容(content)、入口(main)
│   └── vendor/           # 本地含入的 three.js 0.166 + OrbitControls（可離線）
├── docs/problems/        # 三題解題筆記（markdown，與網頁內容對應）
├── .github/workflows/pages.yml   # GitHub Pages 部署 workflow
├── README.md
├── WORKLOG.md
└── LICENSE
```

## 本地開啟

網頁使用 ES Module（importmap），**需要用 HTTP server 開啟**（直接雙擊檔案會因瀏覽器 CORS 而無法載入模組）：

```bash
cd demo/public
python3 -m http.server 8080
# 瀏覽器開啟 http://localhost:8080
```

three.js 已本地含入 `vendor/`，可完全離線使用，不需連外網。

---

## 授權

MIT License（題目與題目敘述之智慧財產權歸 LeetCode 所有，僅供個人學習）。
