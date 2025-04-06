import express from 'express'
import { PrismaClient } from '@prisma/client'

// 创建 PrismaClient 实例，用于数据库操作
// Create a PrismaClient instance for database operations
const prisma = new PrismaClient()

// 创建 Express 应用
// Create an Express application
const app = express()

// 使用 express.json() 中间件，解析请求体中的 JSON 数据
// Use express.json() middleware to parse JSON request bodies
app.use(express.json())

// PUT /language/:id
// 通过 id 更新一条编程语言记录 (可选更新 name, suffix, version, compile_command, run_command)
// Update a programming language record by id (optionally update name, suffix, version, compile_command, run_command)
app.put('/language/:id', async (req, res) => {
    try {
        // 1. 从路由参数中获取 id
        // 1. Extract the id from the route parameters
        const { id } = req.params

        // 2. 从请求体中解构要更新的可选字段
        // 2. Destructure optional fields to update from the request body
        const { name, suffix, version, compile_command, run_command } = req.body

        // 3. 在数据库中根据 language_id 查找对应记录
        // 3. Find the corresponding record in the database by language_id
        const language = await prisma.programmingLanguage.findUnique({
        where: { language_id: Number(id) }
        })

        // 如果对应记录不存在，则返回 404
        // If the record does not exist, return 404
        if (!language) {
        return res.status(404).json({ error: 'Language not found' })
        }

        // 4. 使用 Prisma 更新此记录
        //    只更新传入了新值（非 undefined）的字段
        // 4. Update the record using Prisma, only fields that are not undefined will be updated
        const updated = await prisma.programmingLanguage.update({
            where: { language_id: Number(id) },
            data: {
            ...(name !== undefined && { name }),
            ...(suffix !== undefined && { suffix }),
            ...(version !== undefined && { version }),
            ...(compile_command !== undefined && { compile_command }),
            ...(run_command !== undefined && { run_command })
        }
            })
        res.json(updated)

        // 5. 返回更新后的记录
        // 5. Return the updated record
        res.status(200).json(updated)
    } catch (error: any) {
        // 如果发生错误，打印到控制台并返回 500 错误
        // If an error occurs, log it and return a 500 error
        console.error(error)
        res.status(500).json({ error: error.message || 'Server Error' })
    }
})

// 启动服务器并监听指定的端口
// Start the server and listen on the specified port
const PORT = 3000
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})