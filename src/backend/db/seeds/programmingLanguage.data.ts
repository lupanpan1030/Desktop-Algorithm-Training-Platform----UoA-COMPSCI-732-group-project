import prisma from '../prismaClient'

// seedLanguage.ts
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