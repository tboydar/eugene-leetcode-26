// content.js — 側欄題目內容（台灣正體中文）
// 與 docs/problems/*.md 對應。
//
// ⚠️ 注意：這些字串都是 JavaScript 模板字串（以反引號包住），
//    字串內部「不得」再出現反引號，因此所有程式碼強調一律改用 <code>。</code>
export const CONTENT = {
  "56": {
    title: "56. Merge Intervals（合併區間）",
    difficulty: "難題・中等",
    pills: ["排序 + 合併", "陣列", "O(n log n)"],
    body: `
      <p><code>intervals</code> 是一個<b>區間陣列</b>，<code>intervals[i] = [start_i, end_i]</code>（保證 <code>start &le; end</code>）。
      請合併所有<b>重疊的區間</b>，回傳一個不重疊、且能覆蓋所有輸入區間的區間陣列。
      「相接」＝重疊（例如 <code>[1,4]</code> 與 <code>[4,5]</code> 的 4 相接）。</p>

      <h3>官方範例</h3>
      <pre class="example">輸入：intervals = [[1,3],[2,6],[8,10],[15,18]]
輸出：[[1,6],[8,10],[15,18]]
說明：[1,3] 與 [2,6] 重疊 → 合併成 [1,6]。</pre>
      <pre class="example">輸入：intervals = [[1,4],[4,5]]
輸出：[[1,5]]（相接也算重疊）</pre>

      <h3>解題思路</h3>
      <ol class="steps">
        <li><b>先排序</b>：依 start 小到大排序，重疊區間必相鄰，問題變成「一趟掃完」。</li>
        <li>把第一個區間放入答案 ans。</li>
        <li>逐個遍歷：若 <code>s &le; 目前最後一個區間的 end</code> → 重疊，延伸尾巴；否則 → 當成新區間。</li>
        <li>回傳 ans。</li>
      </ol>

      <h3>複雜度</h3>
      <div class="complex"><span>時間</span><b>O(n log n)</b><span>空間</span><b>O(n)</b></div>

      <h3>參考程式碼</h3>
      <details><summary>Python</summary><pre class="code">class Solution:
    def merge(self, intervals):
        intervals.sort(key=lambda x: x[0])
        ans = [intervals[0]]
        for s, e in intervals[1:]:
            if s &lt;= ans[-1][1]:
                ans[-1][1] = max(ans[-1][1], e)
            else:
                ans.append([s, e])
        return ans</pre></details>
      <details><summary>JavaScript</summary><pre class="code">var merge = function (intervals) {
  intervals.sort((a, b) =&gt; a[0] - b[0]);
  const ans = [intervals[0]];
  for (let i = 1; i &lt; intervals.length; i++) {
    const [s, e] = intervals[i];
    if (s &lt;= ans[ans.length - 1][1]) {
      ans[ans.length - 1][1] = Math.max(ans[ans.length - 1][1], e);
    } else {
      ans.push([s, e]);
    }
  }
  return ans;
};</pre></details>

      <div class="note">🎬 3D 演示：輸入刻意打亂順序以展示「先排序」；接著觀察哪兩塊重疊、如何合體。</div>
    `,
  },

  "88": {
    title: "88. Merge Sorted Array（合併兩個有序陣列）",
    difficulty: "簡單",
    pills: ["雙指針", "陣列", "從尾端填"],
    body: `
      <p>給兩個<b>非遞減</b>陣列 <code>nums1</code>、<code>nums2</code> 與有效數量 <code>m</code>、<code>n</code>。
      把 <code>nums2</code> <b>就地</b>合併進 <code>nums1</code>，結果保持非遞減。
      <code>nums1</code> 長度為 <code>m+n</code>：前 <code>m</code> 個有效，後 <code>n</code> 個是 <code>0</code> 佔位。</p>

      <h3>官方範例</h3>
      <pre class="example">輸入：nums1 = [1,2,3,0,0,0], m = 3
     nums2 = [2,5,6], n = 3
輸出：[1,2,2,3,5,6]</pre>

      <h3>解題思路</h3>
      <ol class="steps">
        <li>三個指針：<code>p1 = m-1</code>、<code>p2 = n-1</code>、<code>p = m+n-1</code>。</li>
        <li>從<b>尾端</b>往前比，把較大的值寫進 <code>nums1[p]</code>。</li>
        <li>用哪一側就讓哪一側指針減一，<code>p</code> 也減一。</li>
        <li><code>nums2</code> 用完時，剩餘的 <code>nums1</code> 前段原本就在正確位置 → 完成。</li>
      </ol>
      <div class="note">💡 <b>為什麼從尾端填？</b> <code>nums1</code> 尾部是空的（0 佔位），從尾巴往頭寫永遠不會覆蓋還沒比到的元素，因此不需要額外陣列。</div>

      <h3>複雜度</h3>
      <div class="complex"><span>時間</span><b>O(m + n)</b><span>空間</span><b>O(1)</b></div>

      <h3>參考程式碼</h3>
      <details><summary>Python</summary><pre class="code">class Solution:
    def merge(self, nums1, m, nums2, n):
        p1, p2, p = m - 1, n - 1, m + n - 1
        while p2 &gt;= 0:
            if p1 &gt;= 0 and nums1[p1] &gt; nums2[p2]:
                nums1[p] = nums1[p1]; p1 -= 1
            else:
                nums1[p] = nums2[p2]; p2 -= 1
            p -= 1</pre></details>
      <details><summary>JavaScript</summary><pre class="code">var merge = function (nums1, m, nums2, n) {
  let p1 = m - 1, p2 = n - 1, p = m + n - 1;
  while (p2 &gt;= 0) {
    if (p1 &gt;= 0 &amp;&amp; nums1[p1] &gt; nums2[p2]) {
      nums1[p] = nums1[p1]; p1--;
    } else {
      nums1[p] = nums2[p2]; p2--;
    }
    p--;
  }
};</pre></details>
    `,
  },

  "26": {
    title: "26. Remove Duplicates from Sorted Array（移除有序陣列重複項）",
    difficulty: "簡單",
    pills: ["雙指針", "原地", "O(n)"],
    body: `
      <p>給一個<b>非遞減</b>整數陣列 <code>nums</code>，請<b>就地</b>移除重複項，讓每個唯一值只出現一次、且保持相對順序。
      回傳唯一值數量 <code>k</code>；前 <code>k</code> 個位置要放唯一值（後面的位置隨意）。</p>

      <h3>官方範例</h3>
      <pre class="example">輸入：nums = [0,0,1,1,1,2,2,3,3,4]
輸出：k = 5，nums[0..4] = [0,1,2,3,4]</pre>

      <h3>解題思路</h3>
      <ol class="steps">
        <li>慢指針 <code>slow = 0</code>：下一個唯一值要放的位置。</li>
        <li>快指針 <code>fast</code> 從 1 開始掃描整個陣列。</li>
        <li>若 <code>nums[fast] &ne; nums[slow]</code> → 遇到新值：<code>slow += 1</code> 後把值複製到 <code>nums[slow]</code>。</li>
        <li>相等 → 重複項，直接跳過。</li>
        <li>回傳 <code>slow + 1</code>（＝ k）。</li>
      </ol>
      <div class="note">💡 因為已排序，重複值一定相鄰：<code>slow</code> 是「寫入指針」、<code>fast</code> 是「讀取指針」，一趟 O(n) 搞定。</div>

      <h3>複雜度</h3>
      <div class="complex"><span>時間</span><b>O(n)</b><span>空間</span><b>O(1)</b></div>

      <h3>參考程式碼</h3>
      <details><summary>Python</summary><pre class="code">class Solution:
    def removeDuplicates(self, nums):
        slow = 0
        for fast in range(1, len(nums)):
            if nums[fast] != nums[slow]:
                slow += 1
                nums[slow] = nums[fast]
        return slow + 1</pre></details>
      <details><summary>JavaScript</summary><pre class="code">var removeDuplicates = function (nums) {
  let slow = 0;
  for (let fast = 1; fast &lt; nums.length; fast++) {
    if (nums[fast] !== nums[slow]) {
      slow++;
      nums[slow] = nums[fast];
    }
  }
  return slow + 1;
};</pre></details>
    `,
  },
};
