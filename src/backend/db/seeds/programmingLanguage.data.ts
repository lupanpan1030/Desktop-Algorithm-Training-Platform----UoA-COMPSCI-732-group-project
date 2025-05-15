// Import Prisma client instance
import prisma from '../prismaClient'

//Seed multiple programming languages into the "programmingLanguage" table
export async function seedLanguage() {
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_default_language
      ON ProgrammingLanguage(is_default)
      WHERE is_default = 1;
    `);
    await prisma.programmingLanguage.createMany({
    data: [
        {
        language_id: 1,
        name: 'Python',
        suffix: 'py',
        version: '3.9',
        compile_command: null,  
        run_command: 'python',
        is_default: true
        },
        {
        language_id: 2,
        name: 'Java',
        suffix: 'java',
        version: '11',
        compile_command: null,  
        run_command: 'java',
        is_default: false
        },
        {
        language_id: 3,
        name: 'C++',
        suffix: 'cpp',
        version: '17',
        compile_command: 'g++ -o main', 
        run_command: './main',
        is_default: false
        },
        {
            language_id: 4,
            name: 'Go',
            suffix: 'go',
            version: '1.21',
            compile_command: null, 
            run_command: 'go run',
            is_default: false
        },
        {
            language_id: 5,
            name: 'Rust',
            suffix: 'rs',
            version: '1.86',
            compile_command: 'rustc -o main',
            run_command: './main',
            is_default: false
        },
    ],
    });
    console.log('Seeded programming languages');
}
export async function clearLanguage() {
    await prisma.programmingLanguage.deleteMany({})
    console.log('Cleared programming languages')
}