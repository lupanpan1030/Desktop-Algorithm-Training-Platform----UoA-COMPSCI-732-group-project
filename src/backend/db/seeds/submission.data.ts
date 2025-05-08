import prisma from "../prismaClient";

export async function seedSubmission() {
  console.log("Seeded multiple submissions");
  await prisma.submission.createMany({
    data: [
      {
        problem_id: 1,
        submission_id: 1,
        code: 'def fibonacci(n):\n  """\n  Calculates the nth Fibonacci number.\n\n  Args:\n    n: The index of the Fibonacci number to calculate (non-negative integer).\n\n  Returns:\n    The nth Fibonacci number.\n  """\n  if n <= 1:\n    return n\n  else:\n    a = 0\n    b = 1\n    for _ in range(2, n + 1):\n      a, b = b, a + b\n    return b\n\nif __name__ == "__main__":\n  # Read input from stdin\n  n = int(input())\n\n  # Calculate the nth Fibonacci number\n  result = fibonacci(n)\n\n  # Print the result to stdout\n  print(result)\n',
        language_id: 1,
        status: "ACCEPTED",
      },
      {
        problem_id: 2,
        submission_id: 2,
        code: "hello world",
        language_id: 1,
        status: "RUNTIME_ERROR",
      },
      {
        // Merge Two Sorted Lists
        submission_id: 3,
        problem_id: 10,
        language_id: 1,
        code: `function mergeTwoLists(l1, l2) {
  // … your implementation …
}`,
        status: "ACCEPTED",
        submitted_at: new Date("2025-05-09T10:00:00.000Z"),
      },
      {
        // Maximum Subarray
        submission_id: 4,
        problem_id: 11,
        language_id: 2,
        code: `class Solution:
    def maxSubArray(self, nums):
        # … your implementation …`,
        status: "ACCEPTED",
        submitted_at: new Date("2025-05-09T10:05:00.000Z"),
      },
      {
        // Longest Substring Without Repeating Characters
        submission_id: 5,
        problem_id: 12,
        language_id: 1,
        code: `function lengthOfLongestSubstring(s) {
  // … your implementation …
}`,
        status: "ACCEPTED",
        submitted_at: new Date("2025-05-09T10:10:00.000Z"),
      },
      {
        problem_id: 4,
        submission_id: 6,
        code: "hello world",
        language_id: 1,
        status: "RUNTIME_ERROR",
      },
    ],
  });
}
export async function clearSubmission() {
  await prisma.submission.deleteMany({});
  console.log("Cleared submission");
}
