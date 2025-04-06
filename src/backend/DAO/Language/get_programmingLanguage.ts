import express from 'express'

// 从自动生成的 @prisma/client 里引入 PrismaClient
// Import PrismaClient from the automatically generated @prisma/client
import { PrismaClient } from '@prisma/client'

// 1. 创建 PrismaClient 实例，用它来操作数据库
// 1. Create a PrismaClient instance for database operations
const prisma = new PrismaClient()

// 2. 创建 Express 应用
// 2. Create an Express application
const app = express()

// 3. 使用 express.json() 中间件来解析 JSON 格式的请求体
// 3. Use express.json() middleware to parse JSON request bodies
app.use(express.json())

// 4. 定义一个获取所有编程语言的路由
// 4. Define a route to get all programming languages
app.get('/language', async (req, res) => {
    try {
        // 通过 PrismaClient 查询数据库中的所有编程语言
        // Query all programming languages from the database via PrismaClient
        const languages = await prisma.programmingLanguage.findMany()
    
        // 以 JSON 格式返回查询结果
        // Return the query results in JSON format
        res.json(languages)
    } catch (error: any) {

        // 若发生错误则打印日志并返回 500 状态码
        // If an error occurs, log it and respond with 500 status code
        console.error(error)
        res.status(500).json({ error: error.message || 'Server Error' })
    }
})

// 5. 启动服务器并监听指定端口
// 5. Start the server and listen on the specified port
const PORT = 3000
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
})