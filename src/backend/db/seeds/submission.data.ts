import prisma from '../prismaClient'

export async function seedSubmission() {
    await prisma.submission.createMany({
        data: [
            {
            submission_id: 1,
            problem_id: 1,
            language_id: 1,
            code: 'print("Hello, World!")',
            status: 'PENDING',
        },
        {
        submission_id: 2,
        problem_id: 5,
        language_id: 2,
        code: `
        class Solution {
            public String longestPalindrome(String s) {
                if (s.isEmpty())
                return "";

                // (start, end) indices of the longest palindrome in s
                int[] indices = {0, 0};

                for (int i = 0; i < s.length(); ++i) {
                int[] indices1 = extend(s, i, i);
                if (indices1[1] - indices1[0] > indices[1] - indices[0])
                    indices = indices1;
                if (i + 1 < s.length() && s.charAt(i) == s.charAt(i + 1)) {
                    int[] indices2 = extend(s, i, i + 1);
                    if (indices2[1] - indices2[0] > indices[1] - indices[0])
                    indices = indices2;
                }
                }

                return s.substring(indices[0], indices[1] + 1);
            }

            // Returns the (start, end) indices of the longest palindrome extended from
            // the substring s[i..j].
            private int[] extend(final String s, int i, int j) {
                for (; i >= 0 && j < s.length(); --i, ++j)
                if (s.charAt(i) != s.charAt(j))
                    break;
                return new int[] {i + 1, j - 1};
            }
            }`,
            status: 'ACCEPTED',
        },
        ],
    })
    console.log('Seeded multiple submissions')
}

export async function clearSubmission() {
    await prisma.submission.deleteMany({})
    console.log('Cleared submission')
}

