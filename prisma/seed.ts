const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env.local' })

const prismaClient = new PrismaClient()

async function main() {
    // Create an Admin user
    const admin = await prismaClient.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            name: 'System Admin',
            role: 'ADMIN',
        },
    })

    // Create an Instructor
    const instructor = await prismaClient.user.upsert({
        where: { email: 'instructor@example.com' },
        update: {},
        create: {
            email: 'instructor@example.com',
            name: 'Test Instructor',
            role: 'INSTRUCTOR',
        },
    })

    // Create a Candidate
    const candidate = await prismaClient.user.upsert({
        where: { email: 'candidate@example.com' },
        update: {},
        create: {
            email: 'candidate@example.com',
            name: 'Test Candidate',
            role: 'CANDIDATE',
        },
    })

    // Create an Assessment
    const assessment = await prismaClient.assessment.create({
        data: {
            title: 'Basic React Knowledge',
            description: 'A test to evaluate fundamental knowledge of React.js',
            subject: 'Frontend Development',
            skillLevel: 'BEGINNER',
            duration: 30,
            passingScore: 70,
            mode: 'ONLINE',
            isAdaptive: false,
            accessibilityFeatures: ['SCREEN_READER', 'LARGE_TEXT'],
            users: {
                connect: [{ id: instructor.id }]
            },
            questions: {
                create: [
                    {
                        text: 'What is the hook used to manage state in React?',
                        type: 'MCQ',
                        options: ['useEffect', 'useState', 'useRef', 'useContext'],
                        correctAnswer: 'useState',
                        difficulty: 'EASY',
                        points: 10,
                    },
                    {
                        text: 'What is JSX?',
                        type: 'MCQ',
                        options: ['A styling language', 'A JavaScript syntax extension', 'A backend framework', 'A database query language'],
                        correctAnswer: 'A JavaScript syntax extension',
                        difficulty: 'EASY',
                        points: 10,
                    },
                ]
            }
        }
    })

    console.log('Seed data created:')
    console.log({ admin, instructor, candidate, assessment })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prismaClient.$disconnect()
    })
