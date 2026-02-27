// prisma/seed-enterprise.js
// Seeds 3 multi-subject assessments per the Enterprise Assessment Intelligence Engine spec

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding Enterprise Multi-Subject Assessments...");

    // ────────────────────────────────────────────
    // SUBJECT 1: History & Political Science
    // ────────────────────────────────────────────
    const history = await prisma.assessment.create({
        data: {
            title: "History & Political Science — Comprehensive",
            description: "10 MCQs, 2 Short Theory, 1 Long Analytical. Tests analytical reasoning, argument structure, and balanced viewpoint.",
            subject: "History & Political Science",
            skillLevel: "INTERMEDIATE",
            duration: 60,
            passingScore: 40,
            mode: "ONLINE",
            isPublished: true,
            questions: {
                create: [
                    // 10 MCQs × 1 mark
                    { subject: "History", prompt: "Who was the first Prime Minister of India?", type: "MCQ", options: ["Jawaharlal Nehru", "Sardar Patel", "B.R. Ambedkar", "Mahatma Gandhi"], correctAnswer: "Jawaharlal Nehru", points: 1, difficulty: "EASY" },
                    { subject: "History", prompt: "The Indian Constitution was adopted on which date?", type: "MCQ", options: ["26 January 1950", "15 August 1947", "26 November 1949", "2 October 1950"], correctAnswer: "26 November 1949", points: 1, difficulty: "EASY" },
                    { subject: "History", prompt: "Which article of the Indian Constitution abolishes untouchability?", type: "MCQ", options: ["Article 14", "Article 17", "Article 21", "Article 32"], correctAnswer: "Article 17", points: 1, difficulty: "MEDIUM" },
                    { subject: "Political Science", prompt: "The concept of 'Judicial Review' in India was borrowed from which country?", type: "MCQ", options: ["UK", "USA", "France", "Canada"], correctAnswer: "USA", points: 1, difficulty: "MEDIUM" },
                    { subject: "History", prompt: "The Quit India Movement was launched in which year?", type: "MCQ", options: ["1940", "1942", "1944", "1946"], correctAnswer: "1942", points: 1, difficulty: "EASY" },
                    { subject: "Political Science", prompt: "How many fundamental rights are recognized by the Indian Constitution?", type: "MCQ", options: ["5", "6", "7", "8"], correctAnswer: "6", points: 1, difficulty: "MEDIUM" },
                    { subject: "History", prompt: "Who gave the slogan 'Do or Die'?", type: "MCQ", options: ["Subhas Chandra Bose", "Mahatma Gandhi", "Jawaharlal Nehru", "Bhagat Singh"], correctAnswer: "Mahatma Gandhi", points: 1, difficulty: "EASY" },
                    { subject: "Political Science", prompt: "Which schedule of the Constitution deals with the allocation of seats in the Rajya Sabha?", type: "MCQ", options: ["2nd Schedule", "3rd Schedule", "4th Schedule", "5th Schedule"], correctAnswer: "4th Schedule", points: 1, difficulty: "HARD" },
                    { subject: "History", prompt: "The Jallianwala Bagh massacre took place in which city?", type: "MCQ", options: ["Delhi", "Amritsar", "Lahore", "Lucknow"], correctAnswer: "Amritsar", points: 1, difficulty: "EASY" },
                    { subject: "Political Science", prompt: "The Preamble of the Indian Constitution was amended by which amendment?", type: "MCQ", options: ["42nd Amendment", "44th Amendment", "73rd Amendment", "86th Amendment"], correctAnswer: "42nd Amendment", points: 1, difficulty: "HARD" },

                    // 2 Short Theory × 5 marks
                    {
                        subject: "History",
                        prompt: "Explain the significance of the Salt March (Dandi March) in India's freedom struggle. Discuss its impact on the independence movement and British colonial policy.",
                        type: "SHORT_ANSWER",
                        points: 5,
                        difficulty: "MEDIUM",
                        mandatoryKeywords: ["Salt March", "civil disobedience", "British", "Gandhi", "independence"],
                        supportingKeywords: ["Dandi", "1930", "salt tax", "nonviolence", "mass movement"],
                        expectedStructure: "intro-body-conclusion",
                        minWords: 80,
                        optimalWords: 150,
                        maxWords: 250,
                        minPointsRequired: 3
                    },
                    {
                        subject: "Political Science",
                        prompt: "Discuss the role of the Election Commission of India in ensuring free and fair elections. What powers does it have?",
                        type: "SHORT_ANSWER",
                        points: 5,
                        difficulty: "MEDIUM",
                        mandatoryKeywords: ["Election Commission", "free and fair", "elections", "Article 324", "powers"],
                        supportingKeywords: ["autonomous", "model code of conduct", "voter registration", "delimitation", "independent"],
                        expectedStructure: "intro-body-conclusion",
                        minWords: 80,
                        optimalWords: 150,
                        maxWords: 250,
                        minPointsRequired: 3
                    },

                    // 1 Long Analytical × 10 marks
                    {
                        subject: "History",
                        prompt: "Critically analyze the impact of the Non-Aligned Movement (NAM) on India's foreign policy during the Cold War era. Discuss both its advantages and limitations, and evaluate its relevance in the current geopolitical landscape.",
                        type: "DESCRIPTIVE",
                        points: 10,
                        difficulty: "HARD",
                        mandatoryKeywords: ["Non-Aligned Movement", "Cold War", "foreign policy", "sovereignty", "third world"],
                        supportingKeywords: ["Nehru", "Bandung", "neutrality", "superpower", "multipolarity", "BRICS", "Global South", "diplomacy"],
                        expectedStructure: "thesis-arguments-counterarguments-conclusion",
                        minWords: 300,
                        optimalWords: 500,
                        maxWords: 800,
                        minPointsRequired: 5
                    }
                ]
            }
        }
    });
    console.log(`✅ Created: ${history.title} (${history.id})`);

    // ────────────────────────────────────────────
    // SUBJECT 2: Operating Systems
    // ────────────────────────────────────────────
    const os = await prisma.assessment.create({
        data: {
            title: "Operating Systems — Core Concepts",
            description: "3 Numerical, 2 Diagram-based, 1 Theory. Tests logical computation, system design clarity, and technical terminology.",
            subject: "Operating Systems",
            skillLevel: "ADVANCED",
            duration: 75,
            passingScore: 40,
            mode: "ONLINE",
            isPublished: true,
            questions: {
                create: [
                    // 3 Numerical × 5 marks
                    {
                        subject: "Operating Systems",
                        prompt: "A system has 3 processes P1, P2, P3 with burst times 24, 3, 3 respectively. Calculate the average waiting time using Shortest Job First (SJF) scheduling algorithm.",
                        type: "NUMERICAL",
                        correctAnswer: "3",
                        points: 5,
                        difficulty: "MEDIUM",
                        mandatoryKeywords: ["SJF", "waiting time", "burst time"],
                        supportingKeywords: ["scheduling", "non-preemptive", "Gantt chart"],
                        minPointsRequired: 3
                    },
                    {
                        subject: "Operating Systems",
                        prompt: "Consider a paging system with page size 4KB and a logical address of 32 bits. Calculate: (a) Number of pages, (b) Number of bits for page offset, (c) Number of bits for page number.",
                        type: "NUMERICAL",
                        correctAnswer: "Pages=1048576, Offset=12bits, PageNumber=20bits",
                        points: 5,
                        difficulty: "MEDIUM",
                        mandatoryKeywords: ["page size", "logical address", "page offset", "page number"],
                        supportingKeywords: ["paging", "virtual memory", "32-bit"],
                        minPointsRequired: 3
                    },
                    {
                        subject: "Operating Systems",
                        prompt: "In a system using the Banker's algorithm, there are 5 processes and 3 resource types. Available = [3,3,2]. Max matrix and Allocation matrix are given. Determine if the system is in a safe state. Max = [[7,5,3],[3,2,2],[9,0,2],[2,2,2],[4,3,3]], Alloc = [[0,1,0],[2,0,0],[3,0,2],[2,1,1],[0,0,2]]",
                        type: "NUMERICAL",
                        correctAnswer: "Safe sequence exists: P1, P3, P4, P0, P2",
                        points: 5,
                        difficulty: "HARD",
                        mandatoryKeywords: ["Banker's algorithm", "safe state", "safe sequence"],
                        supportingKeywords: ["deadlock avoidance", "need matrix", "available resources"],
                        minPointsRequired: 4
                    },

                    // 2 Diagram × 8 marks
                    {
                        subject: "Operating Systems",
                        prompt: "Draw and explain the Process State Transition Diagram showing all possible states (New, Ready, Running, Waiting, Terminated) and the transitions between them. Label each transition with its trigger event.",
                        type: "DIAGRAM",
                        points: 8,
                        difficulty: "MEDIUM",
                        mandatoryKeywords: ["New", "Ready", "Running", "Waiting", "Terminated", "dispatch", "interrupt", "I/O"],
                        supportingKeywords: ["scheduler", "context switch", "preemption", "completion", "process control block"],
                        expectedStructure: "diagram-with-labels-and-explanation",
                        minWords: 100,
                        optimalWords: 200,
                        maxWords: 400,
                        minPointsRequired: 4
                    },
                    {
                        subject: "Operating Systems",
                        prompt: "Draw the memory allocation diagram for a system using Segmentation with Paging. Show the Segment Table, Page Table, and how a logical address is translated to a physical address.",
                        type: "DIAGRAM",
                        points: 8,
                        difficulty: "HARD",
                        mandatoryKeywords: ["segment table", "page table", "logical address", "physical address", "segmentation"],
                        supportingKeywords: ["base address", "limit", "offset", "translation", "memory management unit"],
                        expectedStructure: "diagram-with-labels-and-explanation",
                        minWords: 100,
                        optimalWords: 200,
                        maxWords: 400,
                        minPointsRequired: 4
                    },

                    // 1 Theory × 9 marks
                    {
                        subject: "Operating Systems",
                        prompt: "Compare and contrast Monolithic Kernel, Microkernel, and Hybrid Kernel architectures. Discuss the advantages and disadvantages of each, and provide real-world examples of operating systems using each architecture.",
                        type: "DESCRIPTIVE",
                        points: 9,
                        difficulty: "HARD",
                        mandatoryKeywords: ["monolithic", "microkernel", "hybrid", "kernel", "architecture"],
                        supportingKeywords: ["Linux", "Mach", "Windows NT", "performance", "modularity", "security", "IPC", "user space", "kernel space"],
                        expectedStructure: "comparison-table-then-analysis",
                        minWords: 200,
                        optimalWords: 400,
                        maxWords: 600,
                        minPointsRequired: 5
                    }
                ]
            }
        }
    });
    console.log(`✅ Created: ${os.title} (${os.id})`);

    // ────────────────────────────────────────────
    // SUBJECT 3: AI Across Industries & Career Intelligence
    // ────────────────────────────────────────────
    const ai = await prisma.assessment.create({
        data: {
            title: "AI Across Industries & Career Intelligence",
            description: "3 Scenario Questions, 1 Decision Simulation, 1 Human-AI Analysis. Generates career mapping and AI aptitude score.",
            subject: "AI & Career Intelligence",
            skillLevel: "INTERMEDIATE",
            duration: 60,
            passingScore: 40,
            mode: "ONLINE",
            isPublished: true,
            questions: {
                create: [
                    // 3 Scenario × 5 marks
                    {
                        subject: "AI Industry Applications",
                        prompt: "A hospital wants to implement an AI system for early detection of diabetic retinopathy from retinal scans. As a tech consultant, outline: (a) the key technical components needed, (b) potential ethical concerns, and (c) how you would measure the system's success.",
                        type: "DESCRIPTIVE",
                        points: 5,
                        difficulty: "MEDIUM",
                        mandatoryKeywords: ["AI", "healthcare", "ethical", "accuracy", "detection"],
                        supportingKeywords: ["CNN", "deep learning", "false positive", "bias", "FDA approval", "sensitivity", "specificity", "patient consent"],
                        expectedStructure: "structured-response-abc",
                        minWords: 100,
                        optimalWords: 200,
                        maxWords: 350,
                        minPointsRequired: 3
                    },
                    {
                        subject: "AI Industry Applications",
                        prompt: "An e-commerce company is losing customers due to poor product recommendations. Propose an AI-driven recommendation system. Explain the algorithm approach, data requirements, and how you would handle the cold-start problem for new users.",
                        type: "DESCRIPTIVE",
                        points: 5,
                        difficulty: "MEDIUM",
                        mandatoryKeywords: ["recommendation", "algorithm", "cold-start", "data", "personalization"],
                        supportingKeywords: ["collaborative filtering", "content-based", "hybrid", "user behavior", "A/B testing", "matrix factorization"],
                        expectedStructure: "problem-solution-implementation",
                        minWords: 100,
                        optimalWords: 200,
                        maxWords: 350,
                        minPointsRequired: 3
                    },
                    {
                        subject: "AI Industry Applications",
                        prompt: "A bank is considering using AI for loan approval decisions. Discuss: (a) how an AI model could improve the process, (b) the risks of algorithmic bias in lending, and (c) regulatory frameworks that should be followed.",
                        type: "DESCRIPTIVE",
                        points: 5,
                        difficulty: "MEDIUM",
                        mandatoryKeywords: ["AI", "loan approval", "bias", "regulation", "fairness"],
                        supportingKeywords: ["credit scoring", "explainability", "GDPR", "disparate impact", "FCRA", "transparency", "feature importance"],
                        expectedStructure: "structured-response-abc",
                        minWords: 100,
                        optimalWords: 200,
                        maxWords: 350,
                        minPointsRequired: 3
                    },

                    // 1 Decision Simulation × 10 marks
                    {
                        subject: "AI Career Intelligence",
                        prompt: "You are the CTO of a mid-size logistics company. Your CEO wants to invest $2M in either: (A) A fleet of autonomous delivery drones, or (B) An AI-powered route optimization system for existing delivery trucks. Present your decision with: technical feasibility analysis, ROI estimation, risk assessment, implementation timeline, and your final recommendation with justification.",
                        type: "DESCRIPTIVE",
                        points: 10,
                        difficulty: "HARD",
                        mandatoryKeywords: ["decision", "ROI", "risk", "implementation", "recommendation"],
                        supportingKeywords: ["autonomous", "route optimization", "feasibility", "cost-benefit", "scalability", "regulation", "timeline", "integration"],
                        expectedStructure: "executive-decision-framework",
                        minWords: 300,
                        optimalWords: 500,
                        maxWords: 800,
                        minPointsRequired: 5
                    },

                    // 1 Human-AI Analysis × 10 marks
                    {
                        subject: "AI Career Intelligence",
                        prompt: "Critically analyze the statement: 'AI will not replace humans, but humans who use AI will replace humans who don't.' Discuss with reference to at least 3 specific industries, the evolving nature of human-AI collaboration, the skills that will become most valuable, and what this means for education systems globally.",
                        type: "DESCRIPTIVE",
                        points: 10,
                        difficulty: "HARD",
                        mandatoryKeywords: ["human-AI collaboration", "skills", "industries", "education", "replacement"],
                        supportingKeywords: ["augmentation", "automation", "upskilling", "critical thinking", "creativity", "adaptability", "workforce transformation", "reskilling"],
                        expectedStructure: "thesis-arguments-examples-conclusion",
                        minWords: 300,
                        optimalWords: 500,
                        maxWords: 800,
                        minPointsRequired: 5
                    }
                ]
            }
        }
    });
    console.log(`✅ Created: ${ai.title} (${ai.id})`);

    console.log("\n🎉 Enterprise seed complete! 3 multi-subject assessments created.");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
