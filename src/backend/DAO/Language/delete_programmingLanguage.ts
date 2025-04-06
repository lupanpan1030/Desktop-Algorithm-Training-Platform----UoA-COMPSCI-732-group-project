import express from 'express'

// 从自动生成的 @prisma/client 中引入 PrismaClient
// Import PrismaClient from the automatically generated @prisma/client
import { PrismaClient } from '@prisma/client'

// 创建 PrismaClient 用于操作数据库
// Create a PrismaClient instance for database operations
const prisma = new PrismaClient()

// 创建 Express 应用
// Create an Express application
const app = express()

// 使用 express.json() 解析 JSON 格式请求体
// Use express.json() to parse JSON request bodies
app.use(express.json())

// DELETE /language/:id
// 根据给定的 :id 删除对应的编程语言记录
// Delete the corresponding programming language record by the given :id
app.delete('/language/:id', async (req, res) => {
    try {
        // 1. 从路由参数获取编程语言的 id
        // 1. Extract the programming language ID from the route parameter
        const { id } = req.params

        // 2. 调用 Prisma 的 delete 方法删除数据库中的记录
        // 2. Use Prisma's delete method to remove the record from the database
        // 如果对应的 id 不存在，Prisma 会抛出异常
        // If the specified id doesn't exist, Prisma will throw an error
        await prisma.programmingLanguage.delete({
        where: { language_id: Number(id) }
        })

        // 3. 删除成功后，返回 204 表示操作成功但无返回内容
        // 3. If deletion is successful, return 204 to indicate successful operation with no content
        res.sendStatus(204)
    } catch (error: any) {
        console.error(error)
        // 如果找不到相应记录，通常会抛出 P2025 错误
        // Typically, if the record is not found, a P2025 error is thrown
        if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Language not found' })
        }

        // 其他情况返回服务器错误 500
        // For other cases, return a 500 Server Error
        res.status(500).json({ error: error.message || 'Server Error' })
    }
})

// 启动服务器并监听指定端口
// Start the server and listen on the specified port
const PORT = 3000
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})