// 引入 Prisma 客户端实例
// Import Prisma client instance

import prisma from "../prismaClient";

//为每道题批量插入测试用例
//Seed test cases for each problem
export async function seedTestCases() {
  await prisma.testCase.createMany({
    data: [
      {
        problem_id: 1,
        input_data: "2",
        expected_output: "1",
        time_limit_ms: 5 * 1000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 1,
        input_data: "3",
        expected_output: "2",
        time_limit_ms: 5 * 1000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 1,
        input_data: "4",
        expected_output: "3",
        time_limit_ms: 5 * 1000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 1,
        input_data: "20",
        expected_output: "6765",
        time_limit_ms: 5 * 1000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 2,
        input_data: "2 7 11 15\n9",
        expected_output: "0 1",
        time_limit_ms: 5 * 1000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 2,
        input_data: "3 2 4\n6",
        expected_output: "1 2",
        time_limit_ms: 5 * 1000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 2,
        input_data: "3 3\n6",
        expected_output: "0 1",
        time_limit_ms: 5 * 1000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 2,
        input_data: "1 4 7 10 12\n17",
        expected_output: "2 3",
        time_limit_ms: 5 * 1000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 3,
        input_data: "1 2 3",
        expected_output: "1 2 3\n1 3 2\n2 1 3\n2 3 1\n3 1 2\n3 2 1",
        time_limit_ms: 5 * 1000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 3,
        input_data: "0 1",
        expected_output: "0 1\n1 0",
        time_limit_ms: 5 * 1000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 3,
        input_data: "1",
        expected_output: "1",
        time_limit_ms: 5 * 1000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 3,
        input_data: "-1",
        expected_output: "-1",
        time_limit_ms: 5 * 1000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 4,
        input_data: "(()",
        expected_output: "2",
        time_limit_ms: 5 * 1000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 4,
        input_data: ")()())",
        expected_output: "4",
        time_limit_ms: 5 * 1000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 4,
        input_data: "(",
        expected_output: "0",
        time_limit_ms: 5 * 1000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 4,
        input_data: "(((((((((((((((()",
        expected_output: "2",
        time_limit_ms: 5 * 1000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 5,
        input_data: "1 2 3 4 5",
        expected_output: "5 4 3 2 1",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 5,
        input_data: "1 2",
        expected_output: "2 1",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 5,
        input_data: "1",
        expected_output: "1",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 5,
        input_data: "0 1 2 3 4",
        expected_output: "4 3 2 1 0",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 6,
        input_data: "3 9 20 null null 15 7",
        expected_output: "[[3],[9,20],[15,7]]",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 6,
        input_data: "1",
        expected_output: "[[1]]",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 6,
        input_data: "1 2 3 4 5",
        expected_output: "[[1],[2,3],[4,5]]",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 6,
        input_data: "null",
        expected_output: "[]",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 7,
        input_data: "2 1 + 3 *",
        expected_output: "9",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 7,
        input_data: "4 13 5 / +",
        expected_output: "6",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 7,
        input_data: "10 6 9 3 + -11 * / * 17 + 5 +",
        expected_output: "22",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 7,
        input_data: "3 4 +",
        expected_output: "7",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 8,
        input_data: "hit\ncog\nhot dot dog lot log cog",
        expected_output: "5",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 8,
        input_data: "hit\ncog\nhot dot dog lot log",
        expected_output: "0",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 8,
        input_data: "hit\nhit\nhot dot dog",
        expected_output: "1",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 8,
        input_data: "a\nc\na b c",
        expected_output: "2",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 9,
        input_data: "1 3\n2",
        expected_output: "2.0",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 9,
        input_data: "1 2\n3 4",
        expected_output: "2.5",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 9,
        input_data: "0 0\n0 0",
        expected_output: "0.0",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 9,
        input_data: "2\n",
        expected_output: "2.0",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 10,
        input_data: "1->2->4\n1->3->4",
        expected_output: "1->1->2->3->4->4",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 10,
        input_data: "[]\n[]",
        expected_output: "[]",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 10,
        input_data: "[]\n0",
        expected_output: "Error", // invalid list format
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },

      {
        problem_id: 11,
        input_data: "-2,1,-3,4,-1,2,1,-5,4",
        expected_output: "6",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 11,
        input_data: "1",
        expected_output: "1",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 11,
        input_data: "5,-1,5",
        expected_output: "9",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },

      {
        problem_id: 12,
        input_data: "abcabcbb",
        expected_output: "3",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 12,
        input_data: "bbbbb",
        expected_output: "1",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      {
        problem_id: 12,
        input_data: '"pwwkew"',
        expected_output: "3",
        time_limit_ms: 5000,
        memory_limit_mb: 512,
      },
      // ─────────────────────────────────────────────────────────────
// Append these to seedTestCases() data array:
// ─────────────────────────────────────────────────────────────

// Symmetric Tree (id:13)
{
    problem_id: 13,
    input_data: '[1,2,2,3,4,4,3]',
    expected_output: 'true',
    time_limit_ms: 5000,
    memory_limit_mb: 512,
},
{
    problem_id: 13,
    input_data: '[1,2,2,null,3,null,3]',
    expected_output: 'false',
    time_limit_ms: 5000,
    memory_limit_mb: 512,
},

// Climbing Stairs (id:14)
{
    problem_id: 14,
    input_data: '2',
    expected_output: '2',
    time_limit_ms: 5000,
    memory_limit_mb: 512,
},
{
    problem_id: 14,
    input_data: '3',
    expected_output: '3',
    time_limit_ms: 5000,
    memory_limit_mb: 512,
},

// Min Stack (id:15)
{
    problem_id: 15,
    input_data: '["MinStack","push","push","push","getMin","pop","top","getMin"]\n[[],[-2],[0],[-3],[],[],[],[]]',
    expected_output: '[null,null,null,null,-3,null,0,-2]',
    time_limit_ms: 5000,
    memory_limit_mb: 512,
},
{
    problem_id: 15,
    input_data: '["MinStack","push","push","getMin","pop","top","getMin"]\n[[],[1],[2],[],[],[],[]]',
    expected_output: '[null,null,null,1,null,1,1]',
    time_limit_ms: 5000,
    memory_limit_mb: 512,
},

// Palindrome Number (id:16)
{
    problem_id: 16,
    input_data: '121',
    expected_output: 'true',
    time_limit_ms: 5000,
    memory_limit_mb: 512,
},
{
    problem_id: 16,
    input_data: '-121',
    expected_output: 'false',
    time_limit_ms: 5000,
    memory_limit_mb: 512,
},

// Binary Search (id:17)
{
    problem_id: 17,
    input_data: '[-1,0,3,5,9,12], 9',
    expected_output: '4',
    time_limit_ms: 5000,
    memory_limit_mb: 512,
},
{
    problem_id: 17,
    input_data: '[-1,0,3,5,9,12], 2',
    expected_output: '-1',
    time_limit_ms: 5000,
    memory_limit_mb: 512,
},
    ],
  });
  console.log("Seeded test cases");
}

export async function clearTestCases() {
  await prisma.testCase.deleteMany({});
  console.log("Cleared test cases");
}
