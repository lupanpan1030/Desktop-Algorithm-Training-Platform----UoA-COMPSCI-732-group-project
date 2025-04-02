    // src/backend/db/seeds/problem.seed.ts
import prisma from '../prismaClient'

export async function seedProblems() {
  // createMany 一次插入多条
    await prisma.problem.createMany({
    data: [
        {
        problem_id: 1,
        title: 'Two Sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.You can return the answer in any order.？',
        difficulty: 'EASY', 
        },
        {
        problem_id: 2,
        title: 'Add Two Numbers',
        description: 'You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list. You may assume the two numbers do not contain any leading zero, except the number 0 itself.',
        difficulty: 'MEDIUM',
        },
        {
        problem_id: 3,
        title: 'Median of Two Sorted Arrays',
        description: ' Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)).',
        difficulty: 'HARD',
        },
        {
        title: 'Longest Substring Without Repeating Characters',
        description: ' Given a string s, find the length of the longest substring without duplicate characters.',
        difficulty: 'MEDIUM',
        },
        {
        title: 'Longest Palindromic Substring',
        description: 'Given a string s, return the longest palindromic substring in s.',
        difficulty: 'MEDIUM',
        },
        ],    
    })
    console.log('Seeded problems')
}

export async function clearProblems() {
    await prisma.problem.deleteMany({})
    console.log('Cleared problems')
}