const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding mock assessment for testing...');

    const assessment = await prisma.assessment.create({
        data: {
            title: 'Full Stack Web & AI Integration (Demo)',
            subject: 'Computer Science',
            duration: 10,
            passingScore: 60,
            description: 'A mock assessment designed to test MCQ and AI Grading features.',
            isPublished: true,
            skillLevel: 'BEGINNER',
            mode: 'ONLINE',
            questions: {
                create: [
                    {
                        prompt: 'What does CSS stand for?',
                        type: 'MCQ',
                        difficulty: 'EASY',
                        options: ['Cascading Style Sheets', 'Computer Style Sheets', 'Creative Style Sheets', 'Colorful Style Sheets'],
                        correctAnswer: 'Cascading Style Sheets',
                        points: 10,
                    },
                    {
                        prompt: 'Explain the difference between SQL and NoSQL databases.',
                        type: 'DESCRIPTIVE',
                        difficulty: 'MEDIUM',
                        points: 30,
                    },
                    {
                        prompt: 'Which of the following is an atomic state management library for React?',
                        type: 'MCQ',
                        difficulty: 'MEDIUM',
                        options: ['Redux', 'Jotai', 'React Query', 'Vuex'],
                        correctAnswer: 'Jotai',
                        points: 10,
                    },
                    {
                        prompt: 'Describe how a JWT (JSON Web Token) works and its standard use case.',
                        type: 'DESCRIPTIVE',
                        difficulty: 'HARD',
                        points: 50,
                    }
                ]
            }
        }
    });

    console.log(`Created Assessment: ${assessment.title} (ID: ${assessment.id})`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
