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
        normalized_name: 'python',
        normalized_suffix: 'py',
        suffix: 'py',
        version: '3.12',
        compile_command: null,  
        run_command: 'python3 {source}',
        is_default: true
        },
        {
        language_id: 2,
        name: 'JavaScript',
        normalized_name: 'javascript',
        normalized_suffix: 'js',
        suffix: 'js',
        version: '20',
        compile_command: null,  
        run_command: 'node {source}',
        is_default: false
        },
        {
        language_id: 3,
        name: 'C++',
        normalized_name: 'c++',
        normalized_suffix: 'cpp',
        suffix: 'cpp',
        version: '17',
        compile_command: 'g++ -std=c++17 -O2 -o {executable} {source}', 
        run_command: './{executable}',
        is_default: false
        },
        {
            language_id: 4,
            name: 'Go',
            normalized_name: 'go',
            normalized_suffix: 'go',
            suffix: 'go',
            version: '1.21',
            compile_command: null, 
            run_command: 'go run {source}',
            is_default: false
        },
        {
            language_id: 5,
            name: 'Rust',
            normalized_name: 'rust',
            normalized_suffix: 'rs',
            suffix: 'rs',
            version: '1.86',
            compile_command: 'rustc -O -o {executable} {source}',
            run_command: './{executable}',
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
