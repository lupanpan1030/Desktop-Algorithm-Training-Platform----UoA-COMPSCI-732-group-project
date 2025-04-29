// src/backend/db/seeds/problem.seed.ts

// 导入 Prisma 客户端实例
// Import Prisma client instance
import prisma from '../prismaClient'

//向 problem 表中批量插入题目数据
//Insert multiple problem records into the "problem" table
export async function seedProblems() {
    // createMany 一次插入多条
    // Use createMany to insert multiple entries at once
    await prisma.problem.createMany({
    data: [
        {
        problem_id: 1,
        title: 'Fibonacci Number',
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
        difficulty: 'EASY', 
        },
        {
        problem_id: 2,
        title: 'Two Sum',
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
        difficulty: 'EASY', 
        },
        {
            problem_id: 3,
            title: 'Permutations',
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
            difficulty: 'MEDIUM', 
            },
        {
            problem_id: 4,
            title: 'Longest Valid Parentheses',
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
            difficulty: 'HARD', 
            },
        ],    
    })
    console.log('Seeded problems')
}

export async function clearProblems() {
    await prisma.problem.deleteMany({})
    console.log('Cleared problems')
}