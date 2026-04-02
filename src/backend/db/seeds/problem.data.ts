// src/backend/db/seeds/problem.seed.ts

// 导入 Prisma 客户端实例
// Import Prisma client instance
import prisma from "../prismaClient";
import { seedProblemIdentityById } from "../problem-catalog/seed-problem-identities";
import type { Difficulty, Prisma } from "@prisma/client";

//向 problem 表中批量插入题目数据
//Insert multiple problem records into the "problem" table
export async function seedProblems() {
  const baseProblems: Array<{
    problem_id: number;
    title: string;
    description: string;
    difficulty: Difficulty;
  }> = [
      {
        problem_id: 1,
        title: "Fibonacci Number",
        description: `The **Fibonacci numbers**, commonly denoted \`F(n)\` form a sequence, called the **Fibonacci sequence**, such that each number is the sum of the two preceding ones, starting from \`0\` and \`1\`. That is,

F(0) = 0, F(1) = 1
F(n) = F(n - 1) + F(n - 2), for n > 1.

Given \`n\`, calculate \`F(n)\`.

**Example 1:**

> **Input:** 2
> **Output:** 1
> **Explanation:** F(2) = F(1) + F(0) = 1 + 0 = 1.

**Example 2:**

> **Input:** 3
> **Output:** 2
> **Explanation:** F(3) = F(2) + F(1) = 1 + 1 = 2.

**Example 3:**

> **Input:** 4
> **Output:** 3
> **Explanation:** F(4) = F(3) + F(2) = 2 + 1 = 3.

**Constraints:**

-   \`0 <= n <= 30\``,
        difficulty: "EASY",
      },
      {
        problem_id: 2,
        title: "Two Sum",
        description: `Given an array of integers \`nums\` and an integer \`target\`, return _indices of the two numbers such that they add up to \`target\`_.

You may assume that each input would have **_exactly_ one solution**, and you may not use the _same_ element twice.

You can return the answer in any order.

**Example 1:**

> **Input:** \`2 7 11 15\n9\` (nums = \[2,7,11,15\], target = 9)
> **Output:** \`0 1\`
> **Explanation:** Because nums\[0\] + nums\[1\] == 9, we return \[0, 1\].

**Example 2:**

> **Input:** \`3 2 4\n6\`
> **Output:** \`1 2\`

**Example 3:**

> **Input:** \`3 3\n6\`
> **Output:** \`0 1\`

**Constraints:**

-   \`2 <= nums.length <= 104\`
-   \`-109 <= nums[i] <= 109\`
-   \`-109 <= target <= 109\`
-   **Only one valid answer exists.**

**Follow-up:** Can you come up with an algorithm that is less than \`O(n2)\` time complexity?`,
        difficulty: "EASY",
      },
      {
        problem_id: 3,
        title: "Permutations",
        description: `Given an array \`nums\` of distinct integers, return all the possible permutations. You can return the answer in **any order**.

**Example 1:**

> **Input:** \`1 2 3\` (nums = \[1,2,3\])
> **Output:** \`1 2 3\n1 3 2\n2 1 3\n2 3 1\n3 1 2\n3 2 1\`

**Example 2:**

> **Input:** \`0 1\` (nums = \[0,1\])
> **Output:** \`0 1\n1 0\`

**Example 3:**

> **Input:** \`1\`
> **Output:** \`1\`

**Constraints:**

-   \`1 <= nums.length <= 6\`
-   \`-10 <= nums[i] <= 10\`
-   All the integers of \`nums\` are **unique**.`,
        difficulty: "MEDIUM",
      },
      {
        problem_id: 4,
        title: "Longest Valid Parentheses",
        description: `Given a string containing just the characters \`'('\` and \`')'\`, return _the length of the longest valid (well-formed) parentheses substring_.

**Example 1:**

> **Input:** \`(()\`
> **Output:** 2
> **Explanation:** The longest valid parentheses substring is "()".

**Example 2:**

> **Input:** \`)()())\`
> **Output:** 4
> **Explanation:** The longest valid parentheses substring is "()()".

**Example 3:**

> **Input:** \`(\`
> **Output:** 0

**Constraints:**

-   \`0 <= s.length <= 3 * 104\`
-   \`s[i]\` is \`'('\`, or \`')'\`.`,
        difficulty: "HARD",
      },
      {
        problem_id: 5,
        title: "Reverse Linked List",
        description: `**Example 1:**

> **Input:** \`1->2->3->4->5\`
> **Output:** \`5->4->3->2->1\`
> **Explanation:** We reverse the pointers of the list.

**Example 2:**

> **Input:** \`1->2->3\`
> **Output:** \`3->2->1\`
> **Explanation:** A shorter list also reverses correctly.

**Constraints:**

-   \`0 <= n <= 5000\`
-   List node values fit in 32-bit integers.`,
        difficulty: "EASY",
      },
      {
        problem_id: 6,
        title: "Binary Tree Level Order Traversal",
        description: `**Example 1:**

> **Input:** \`3 9 20 null null 15 7\`
> **Output:** \`[[3],[9,20],[15,7]]\`
> **Explanation:** Traverse level by level.

**Example 2:**

> **Input:** \`1 null 2 3\`
> **Output:** \`[[1],[2],[3]]\`
> **Explanation:** A tree with only a right child at the root.

**Constraints:**

-   \`0 <= number of nodes <= 2000\`
-   \`-1000 <= Node.val <= 1000\``,
        difficulty: "MEDIUM",
      },
      {
        problem_id: 7,
        title: "Evaluate Reverse Polish Notation",
        description: `**Example 1:**

> **Input:** \`2 1 + 3 *\`
> **Output:** \`9\`
> **Explanation:** (2 + 1) * 3 = 9.

**Example 2:**

> **Input:** \`4 13 5 / +\`
> **Output:** \`6\`
> **Explanation:** 4 + (13 / 5) = 6.

**Constraints:**

-   \`1 <= tokens.length <= 10000\`
-   \`tokens[i]\` is '+' , '-' , '*' , '/' , or an integer.`,
        difficulty: "MEDIUM",
      },
      {
        problem_id: 8,
        title: "Word Ladder",
        description: `**Example 1:**

> **Input:** \`hit, cog, [hot,dot,dog,lot,log,cog]\`
> **Output:** \`5\`
> **Explanation:** hit → hot → dot → dog → cog.

**Example 2:**

> **Input:** \`hit, cog, [hot,dot,dog,lot,log]\`
> **Output:** \`0\`
> **Explanation:** No possible transformation.

**Constraints:**

-   \`1 <= |beginWord| = |endWord| <= 10\`
-   \`2 <= wordList.length <= 5000\``,
        difficulty: "HARD",
      },
      {
        problem_id: 9,
        title: "Median of Two Sorted Arrays",
        description: `**Example 1:**

> **Input:** \`nums1 = [1,3], nums2 = [2]\`
> **Output:** \`2.0\`
> **Explanation:** The merged array is [1,2,3].

**Example 2:**

> **Input:** \`nums1 = [1,2], nums2 = [3,4]\`
> **Output:** \`2.5\`
> **Explanation:** The merged array is [1,2,3,4].

**Constraints:**

-   \`0 <= m, n <= 1000\`
-   \`-10^6 <= nums[i] <= 10^6\``,
        difficulty: "HARD",
      },
      {
        problem_id: 10,
        title: "Merge Two Sorted Lists",
        description: `**Example 1:**
    
    > **Input:** \`1->2->4, 1->3->4\`
    > **Output:** \`1->1->2->3->4->4\`
    > **Explanation:** Merge the two lists into one sorted list.
    
    **Example 2:**
    
    > **Input:** \`[], []\`
    > **Output:** \`[]\`
    > **Explanation:** Two empty lists produce an empty list.
    
    **Constraints:**
    
    -   The number of nodes in both lists is in the range \[0, 50\].
    -   \`-100 <= Node.val <= 100\`.`,
        difficulty: "EASY",
      },
      {
        problem_id: 11,
        title: "Maximum Subarray",
        description: `**Example 1:**
    
    > **Input:** \`[-2,1,-3,4,-1,2,1,-5,4]\`
    > **Output:** \`6\`
    > **Explanation:** The contiguous subarray \`[4,-1,2,1]\` has the largest sum 6.
    
    **Example 2:**
    
    > **Input:** \`[1]\`
    > **Output:** \`1\`
    > **Explanation:** Only one element.
    
    **Constraints:**
    
    -   \`1 <= nums.length <= 10^5\`
    -   \`-10^4 <= nums[i] <= 10^4\`.`,
        difficulty: "MEDIUM",
      },
      {
        problem_id: 12,
        title: "Longest Substring Without Repeating Characters",
        description: `**Example 1:**
    
    > **Input:** \`"abcabcbb"\`
    > **Output:** \`3\`
    > **Explanation:** The answer is \`"abc"\`, with the length of 3.
    
    **Example 2:**
    
    > **Input:** \`"bbbbb"\`
    > **Output:** \`1\`
    > **Explanation:** The answer is \`"b"\`.
    
    **Constraints:**
    
    -   \`0 <= s.length <= 5 * 10^4\`
    -   \`s\` consists of English letters, digits, symbols and spaces.`,
        difficulty: "MEDIUM",
      },
      // ─────────────────────────────────────────────────────────────
      // Append these to seedProblems() data array:
      // ─────────────────────────────────────────────────────────────
      {
        problem_id: 13,
        title: "Symmetric Tree",
        description: `**Example 1:**

> **Input:** \`[1,2,2,3,4,4,3]\`
> **Output:** \`true\`
> **Explanation:** The tree is symmetric.

**Example 2:**

> **Input:** \`[1,2,2,null,3,null,3]\`
> **Output:** \`false\`
> **Explanation:** The left subtree and right subtree are not mirror images.

**Constraints:**

-   The number of nodes is in the range \`[1, 1000]\`.
-   \`-100 <= Node.val <= 100\`.`,
        difficulty: "EASY",
      },
      {
        problem_id: 14,
        title: "Climbing Stairs",
        description: `**Example 1:**

> **Input:** \`2\`
> **Output:** \`2\`
> **Explanation:** 1+1 or 2.

**Example 2:**

> **Input:** \`3\`
> **Output:** \`3\`
> **Explanation:** 1+1+1, 1+2, or 2+1.

**Constraints:**

-   \`1 <= n <= 45\`.`,
        difficulty: "EASY",
      },
      {
        problem_id: 15,
        title: "Min Stack",
        description: `**Example 1:**

> **Input:** 
> \`\`\`
> ["MinStack","push","push","push","getMin","pop","top","getMin"]
> [[],[-2],[0],[-3],[],[],[],[]]
> \`\`\`
> **Output:** 
> \`\`\`
> [null,null,null,null,-3,null,0,-2]
> \`\`\`
> **Explanation:**  
> After pushes, getMin() is -3; pop() removes -3; top() is 0; getMin() is -2.

**Example 2:**

> **Input:** 
> \`\`\`
> ["MinStack","push","push","getMin","pop","top","getMin"]
> [[],[1],[2],[],[],[],[]]
> \`\`\`
> **Output:** 
> \`\`\`
> [null,null,null,1,null,1,1]
> \`\`\`

**Constraints:**

-   Methods called at most \`3 * 10^4\` times.
-   \`-2^31 <= value <= 2^31-1\`.`,
        difficulty: "MEDIUM",
      },
      {
        problem_id: 16,
        title: "Palindrome Number",
        description: `**Example 1:**

> **Input:** \`121\`
> **Output:** \`true\`
> **Explanation:** Reads same forward and backward.

**Example 2:**

> **Input:** \`-121\`
> **Output:** \`false\`
> **Explanation:** A negative sign breaks symmetry.

**Constraints:**

-   \`-2^31 <= x <= 2^31-1\`.`,
        difficulty: "EASY",
      },
      {
        problem_id: 17,
        title: "Binary Search",
        description: `**Example 1:**

> **Input:** \`[-1,0,3,5,9,12], 9\`
> **Output:** \`4\`
> **Explanation:** 9 appears at index 4.

**Example 2:**

> **Input:** \`[-1,0,3,5,9,12], 2\`
> **Output:** \`-1\`
> **Explanation:** 2 is not in the array.

**Constraints:**

-   \`1 <= nums.length <= 10^4\`
-   All values are distinct and sorted in ascending order.
-   \`-10^4 <= nums[i], target <= 10^4\`.`,
        difficulty: "EASY",
      },
    ];

  // createMany 一次插入多条
  // Use createMany to insert multiple entries at once
  await prisma.problem.createMany({
    data: baseProblems.map((problem) => {
      const identity = seedProblemIdentityById.get(problem.problem_id);

      return {
        ...problem,
        source: "LEETCODE",
        locale: "en",
        source_slug: identity?.sourceSlug ?? null,
        external_problem_id: identity?.externalProblemId ?? null,
      } satisfies Prisma.ProblemCreateManyInput;
    }),
  });
  console.log("Seeded problems");
}

export async function clearProblems() {
  await prisma.problem.deleteMany({});
  console.log("Cleared problems");
}
