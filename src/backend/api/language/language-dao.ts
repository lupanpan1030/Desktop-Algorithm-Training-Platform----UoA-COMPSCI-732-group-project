// problem-dao.ts — 数据访问层 / Data Access Layer
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// 获取所有编程语言 / Get all programming languages
export const getAllLanguages = () => prisma.programmingLanguage.findMany()

// 创建编程语言记录 / Create a programming language record
export const createLanguage = (data: any) =>
    prisma.programmingLanguage.create({ data })

// 更新指定 ID 的编程语言 / Update programming language by ID
export const updateLanguage = (id: number, data: any) =>
    prisma.programmingLanguage.update({ where: { language_id: id }, data })

// 删除指定 ID 的编程语言 / Delete programming language by ID
export const deleteLanguage = (id: number) =>
    prisma.programmingLanguage.delete({ where: { language_id: id } })

// 根据 ID 查找编程语言 / Find programming language by ID
export const findLanguageById = (id: number) =>
    prisma.programmingLanguage.findUnique({ where: { language_id: id } })