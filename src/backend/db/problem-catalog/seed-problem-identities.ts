export type SeedProblemIdentity = {
  problemId: number;
  sourceSlug: string;
  externalProblemId: string;
};

export const seedProblemIdentities: SeedProblemIdentity[] = [
  { problemId: 1, sourceSlug: "fibonacci-number", externalProblemId: "509" },
  { problemId: 2, sourceSlug: "two-sum", externalProblemId: "1" },
  { problemId: 3, sourceSlug: "permutations", externalProblemId: "46" },
  { problemId: 4, sourceSlug: "longest-valid-parentheses", externalProblemId: "32" },
  { problemId: 5, sourceSlug: "reverse-linked-list", externalProblemId: "206" },
  { problemId: 6, sourceSlug: "binary-tree-level-order-traversal", externalProblemId: "102" },
  { problemId: 7, sourceSlug: "evaluate-reverse-polish-notation", externalProblemId: "150" },
  { problemId: 8, sourceSlug: "word-ladder", externalProblemId: "127" },
  { problemId: 9, sourceSlug: "median-of-two-sorted-arrays", externalProblemId: "4" },
  { problemId: 10, sourceSlug: "merge-two-sorted-lists", externalProblemId: "21" },
  { problemId: 11, sourceSlug: "maximum-subarray", externalProblemId: "53" },
  { problemId: 12, sourceSlug: "longest-substring-without-repeating-characters", externalProblemId: "3" },
  { problemId: 13, sourceSlug: "symmetric-tree", externalProblemId: "101" },
  { problemId: 14, sourceSlug: "climbing-stairs", externalProblemId: "70" },
  { problemId: 15, sourceSlug: "min-stack", externalProblemId: "155" },
  { problemId: 16, sourceSlug: "palindrome-number", externalProblemId: "9" },
  { problemId: 17, sourceSlug: "binary-search", externalProblemId: "704" },
];

export const seedProblemIdentityById = new Map(
  seedProblemIdentities.map((identity) => [identity.problemId, identity])
);
