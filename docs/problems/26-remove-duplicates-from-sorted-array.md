# 26. Remove Duplicates from Sorted Array（移除有序陣列重複項）— 簡單 ⭐

- **難度**：Easy（簡單）
- **連結**：https://leetcode.com/problems/remove-duplicates-from-sorted-array/
- **日期標記**：2026-10-15（今日三題之一）
- **技巧**：雙指針（慢指針 + 快指針，原地）

## 題目敘述

給你一個**非遞減排序**的整數陣列 `nums`，請**就地移除重複項**，讓每個唯一值**只出現一次**，並保持原本的相對順序。最後回傳唯一值的數量 `k`。

要通過測試，必須做到：

- 把 `nums` 的前 `k` 個位置改成唯一值（依原始出現順序）。
- 回傳 `k`。

後面的位置（`k` 之後）不用管，可以是任何值。

## 官方範例

**範例 1**

```
輸入：nums = [1,1,2]
輸出：k = 2，nums 前兩位變成 [1,2]
```

**範例 2**

```
輸入：nums = [0,0,1,1,1,2,2,3,3,4]
輸出：k = 5，nums 前五位變成 [0,1,2,3,4]
```

## 限制條件

- `1 <= nums.length <= 3 * 10^4`
- `-100 <= nums[i] <= 100`
- `nums` 已依**非遞減**排序

## 解題思路（一步步）

1. **慢指針 `slow = 0`**：記錄「下一個唯一值要放的位置」。一開始 `slow` 指著第一個元素（它一定是唯一值）。
2. **快指針 `fast`** 從 `1` 開始往前掃：
3. 若 `nums[fast] != nums[slow]`，代表遇到新的唯一值：
   - 先把 `slow += 1`（空出新位置），
   - 再把 `nums[fast]` 複製到 `nums[slow]`。
   （相等時 `fast` 繼續前進，代表這是重複項，直接跳過。）
4. 掃完整個陣列後，回傳 `slow + 1`（唯一值總數）。

> 直覺：`slow` 是「寫入指針」，`fast` 是「讀取指針」。因為陣列已排序，重複值一定相鄰，所以只要發現「隔壁」出現新值就收編一份即可——完全不需要刪除或搬移整段。

## 複雜度分析

- **時間**：`O(n)`（一趟掃完）
- **空間**：`O(1)`（純原地，兩個指針）

## 參考程式碼

```python
# Python
class Solution:
    def removeDuplicates(self, nums: List[int]) -> int:
        slow = 0                                # 1. 慢指針
        for fast in range(1, len(nums)):        # 2&3. 快指針掃描
            if nums[fast] != nums[slow]:        #    出現新值
                slow += 1
                nums[slow] = nums[fast]
        return slow + 1                         # 4. 回傳唯一值數量
```

```javascript
// JavaScript
var removeDuplicates = function (nums) {
  let slow = 0;                                 // 1. 慢指針
  for (let fast = 1; fast < nums.length; fast++) { // 2&3. 快指針掃描
    if (nums[fast] !== nums[slow]) {             //    出現新值
      slow++;
      nums[slow] = nums[fast];
    }
  }
  return slow + 1;                              // 4. 回傳唯一值數量
};
```

## 3D 視覺化重點（three.js）

- 陣列元素做成一排**可以隨時隱形 / 改變位置的立柱**；`slow` 用藍色光球、`fast` 用橘色光球。
- 播放時：`fast` 一路往前跑；遇到相同數值，柱子**重複閃爍後淡出**（被跳過）；遇到新數值，藍色光球跳到下一格，該柱子**複製飛到 slow 的空位**。
- 最後可以看到「有效區」越來越長、重複的柱子消失，直觀展示 `k` 的由來。
