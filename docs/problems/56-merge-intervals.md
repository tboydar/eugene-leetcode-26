# 56. Merge Intervals（合併區間）— 今日難題 ⭐⭐

- **難度**：Medium（中等）
- **連結**：https://leetcode.com/problems/merge-intervals/
- **日期標記**：2026-10-15（今日三題中的難題）
- **技巧**：排序 + 單次遍歷合併

## 題目敘述

給你一個**區間陣列** `intervals`，其中 `intervals[i] = [start_i, end_i]`（保證 `start_i <= end_i`）。
請**合併所有重疊的區間**，並回傳一個不重疊、且能覆蓋輸入中所有區間的區間陣列。

> 重疊定義：`a[0] <= b[1]` 且 `b[0] <= a[1]` 即視為重疊；相接（如 `[1,4]` 與 `[4,5]`）也算重疊。

## 官方範例

**範例 1**

```
輸入：intervals = [[1,3],[2,6],[8,10],[15,18]]
輸出：[[1,6],[8,10],[15,18]]
解釋：區間 [1,3] 與 [2,6] 重疊，合併成 [1,6]。
```

**範例 2**

```
輸入：intervals = [[1,4],[4,5]]
輸出：[[1,5]]
解釋：區間 [1,4] 與 [4,5] 相接（4 <= 4），視為重疊，合併成 [1,5]。
```

## 限制條件

- `1 <= intervals.length <= 10^4`
- `intervals[i].length == 2`
- `0 <= start_i <= end_i <= 10^4`

## 解題思路（一步步）

1. **排序**：先把所有區間依照 `start` 由小到大排序。排序後，只要兩個區間重疊，它們必然相鄰或可被中間的區間串連，讓問題簡化成「一趟掃過去」。
2. **建答案**：把排好的第一個區間放進答案陣列 `ans`。
3. **遍歷**：依序檢查每個區間 `[s, e]`，取答案中目前最後一個區間 `last`：
   - 如果 `s <= last[1]` → **重疊**：將 `last[1] = max(last[1], e)`（把尾巴延伸，合體）。
   - 否則 → **不重疊**：把 `[s, e]` 當成新區間加入答案。
4. **回傳** `ans`。

> 直覺：排序後重疊的區間一定「黏在一起」，所以只要維護一個「目前合併中的區間尾巴」，一路往後吞掉所有開頭小於等於尾巴的區間即可。

## 複雜度分析

- **時間**：`O(n log n)`（排序是主導項；掃描本身只有 `O(n)`）
- **空間**：`O(n)`（排序所需棧空間，加上答案陣列）

## 參考程式碼

```python
# Python
class Solution:
    def merge(self, intervals: List[List[int]]) -> List[List[int]]:
        intervals.sort(key=lambda x: x[0])   # 1. 依 start 排序
        ans = [intervals[0]]                 # 2. 放入第一個區間
        for s, e in intervals[1:]:           # 3. 依序遍歷
            if s <= ans[-1][1]:              #    重疊 → 延伸尾巴
                ans[-1][1] = max(ans[-1][1], e)
            else:                            #    不重疊 → 新區間
                ans.append([s, e])
        return ans                           # 4. 回傳
```

```javascript
// JavaScript
var merge = function (intervals) {
  intervals.sort((a, b) => a[0] - b[0]);        // 1. 排序
  const ans = [intervals[0]];                    // 2. 第一個區間
  for (let i = 1; i < intervals.length; i++) {   // 3. 遍歷
    const [s, e] = intervals[i];
    if (s <= ans[ans.length - 1][1]) {           //    重疊 → 延伸
      ans[ans.length - 1][1] = Math.max(ans[ans.length - 1][1], e);
    } else {                                     //    不重疊 → 新區間
      ans.push([s, e]);
    }
  }
  return ans;                                    // 4. 回傳
};
```

## 3D 視覺化重點（three.js）

- 每個區間畫成一條**沿數線的橫向長板（3D box）**，`start` 到 `end` 對應 X 軸長度，Z 軸前後分層避免混在一起。
- 播放時：先依序**浮起並滑動**排序（交換動畫），再逐區間檢查——重疊的兩塊會**發光、相向靠攏、合體成一塊更長的**；不重疊的留在原地變成綠色。
- 單步模式可逐一看「比較 → 是否重疊 → 延伸 / 新增」的每個決策點。
