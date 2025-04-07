
// 引入 Prisma 客户端实例
// Import Prisma client instance
import prisma from '../prismaClient'

//向 programmingLanguage 表中批量插入编程语言数据
//Seed multiple programming languages into the "programmingLanguage" table
export async function seedLanguage() {
    await prisma.programmingLanguage.createMany({
    data: [
        {
        language_id: 1,
        name: 'Python',
        suffix: 'py',
        version: '3.9',
        compile_command: null,  
        run_command: 'python'   
        },
        {
        language_id: 2,
        name: 'Java',
        suffix: 'java',
        version: '11',
        compile_command: 'javac',  
        run_command: 'java'
        },
        {
        language_id: 3,
        name: 'C++',
        suffix: 'cpp',
        version: '17',
        compile_command: 'g++ -o main', 
        run_command: './main'
        }
    ],
    });
    console.log('Seeded programming languages');
}
export async function clearLanguage() {
    await prisma.programmingLanguage.deleteMany({})
    console.log('Cleared programming languages')
}