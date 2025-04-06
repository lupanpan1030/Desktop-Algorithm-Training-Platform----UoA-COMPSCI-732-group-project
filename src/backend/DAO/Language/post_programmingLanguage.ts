import express from 'express'

// 从自动生成的 @prisma/client 中引入 PrismaClient
// Import PrismaClient from the auto-generated @prisma/client
import { PrismaClient } from '@prisma/client'

// 1. 创建 PrismaClient 实例，用于与数据库交互
// 1. Create a PrismaClient instance for database interactions
const prisma = new PrismaClient()

// 2. 创建 Express 应用
// 2. Create an Express application
const app = express()

// 3. 使用 express.json() 中间件解析 JSON 格式的请求体
// 3. Use express.json() middleware to parse JSON request bodies
app.use(express.json())

// 4. 定义 POST /language 接口，用于向数据库添加新编程语言
// 4. Define a POST /language endpoint to add a new programming language to the database
app.post('/language', async (req, res) => {
    try {
    // 从请求体中解构出需要的字段
    // For example: { "name": "Python3", "suffix": "py", "version": "3.9", "compile_command": "python3 -m py_compile", "run_command": "python3" }
    const { name, suffix, version, compile_command, run_command } = req.body

    // 利用 Prisma 往数据库对应表插入一条记录
    // Use Prisma to insert a new record into the corresponding table
    // 注意: 这里 prisma.programmingLanguage 的写法，要与 model 名称对应 (小驼峰)
    // Note: The 'programmingLanguage' property must match your model name in camelCase
    const newLanguage = await prisma.programmingLanguage.create({
        data: {
        name,
        suffix,
        version,
        compile_command,
        run_command,
        }
    })

    // 将创建完成的记录返回，状态码为 201
    // Return the newly created record with a 201 status code
    res.status(201).json(newLanguage)
    } catch (error: any) {
    console.error(error)
    // 如果发生错误，打印日志并返回 500
    // If an error occurs, log it and return a 500 status
    res.status(500).json({ error: error.message || 'Server Error' })
    }
})

// 5. 启动服务器并监听指定端口
// 5. Start the server and listen on the specified port
const PORT = 3000
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})