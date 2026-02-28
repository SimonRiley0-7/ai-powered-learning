// @ts-nocheck
/**
 * Seed script for AI Adaptive Course Platform
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-courses.ts
 */

import { PrismaClient, SkillLevel, CourseType, QuestionType } from "@prisma/client";

const prisma = new PrismaClient();

const INSTRUCTOR_ID = "default_instructor";

async function main() {
    console.log("🌱 Seeding course platform...");

    // ── 1. Social Confidence Course ───────────────────────────────────────
    const socialCourse = await prisma.course.upsert({
        where: { id: "seed-social-confidence-course" },
        update: {},
        create: {
            id: "seed-social-confidence-course",
            title: "Building Social Confidence",
            description:
                "A safe, structured program to help you understand and overcome social anxiety through gradual tasks, reflection, and AI-guided support. Designed with accessibility-first principles.",
            objectives: [
                "Understand the roots of social fear and anxiety",
                "Practice safe, graduated social tasks",
                "Develop coping strategies for real-world situations",
                "Build lasting social confidence through self-reflection",
            ],
            outcomes: [
                "Reduced social anxiety in everyday situations",
                "A personal toolkit of coping strategies",
                "Completed 5+ safe social challenges",
                "A documented growth journey",
            ],
            subject: "Social & Emotional Wellbeing",
            skillLevel: SkillLevel.BEGINNER,
            durationHours: 6,
            isPublished: true,
            courseType: CourseType.SOCIAL_CONFIDENCE,
            instructorId: INSTRUCTOR_ID,
        },
    });

    const socialModules = [
        {
            id: "seed-sc-module-1",
            order: 1,
            title: "Understanding Social Fear",
            conceptText: `Social fear — also called social anxiety — is one of the most common emotional experiences in the world. It is not a character flaw or weakness. It is a natural protective response that has become over-triggered in social contexts.

When we fear social situations, our brain activates the amygdala — the threat-detection centre — and floods the body with adrenaline. This was useful when humans lived in small tribes and social rejection meant survival risk. In modern life, this same response activates when we speak in class, introduce ourselves to a stranger, or make a phone call.

Understanding that social fear is a biological response — not a personality trait — is the first step. You are not broken. Your nervous system learned that social situations carry risk, and it's trying to protect you.

In this module, we begin by naming what we experience, understanding its origins, and taking the very first small steps toward change.`,
            simplifiedText: `Social fear is very common. Almost everyone feels it sometimes.

🧠 Why does it happen?
• Your brain thinks social situations might be dangerous
• It sends alarm signals (racing heart, sweating, anxiety)
• This is NOT your fault — it's biology

💡 Important truth:
• Social fear is learned — it can be unlearned
• You are NOT broken or weird
• Every small step forward matters

📝 What we'll do:
• Name what you feel
• Learn why it happens
• Take one tiny safe step`,
            videoUrl1: "https://www.youtube.com/watch?v=1vx8iUvfyCY",
            videoUrl2: null,
            practicePrompt:
                "Write about ONE social situation that makes you anxious. Describe what happens in your body and mind when you imagine it. There are no wrong answers.",
            reflectionPrompt:
                "What surprised you most about learning the science behind social fear? How does understanding the biology change the way you see your own anxiety?",
            questions: [
                {
                    prompt: "Which part of the brain is primarily responsible for triggering social fear?",
                    options: ["Frontal lobe", "Amygdala", "Cerebellum", "Hippocampus"],
                    correctAnswer: "Amygdala",
                    explanation: "The amygdala is the brain's threat-detection centre. It triggers the fight-or-flight response, including in social situations.",
                },
                {
                    prompt: "Social anxiety is best described as:",
                    options: [
                        "A personality weakness",
                        "A biological response that has become over-triggered",
                        "A sign of introversion",
                        "A permanent condition",
                    ],
                    correctAnswer: "A biological response that has become over-triggered",
                    explanation: "Social anxiety is a learned biological response — not a flaw — which means it can be changed with practice.",
                },
            ],
        },
        {
            id: "seed-sc-module-2",
            order: 2,
            title: "Micro Safe Tasks",
            conceptText: `The most effective way to reduce social anxiety is gradual exposure — starting with the smallest possible safe action and building up slowly.

This approach, known as systematic desensitization, works because each small success teaches the brain that the feared situation is survivable. Over time, the amygdala learns to lower its threat rating for social situations.

Key principles of micro tasks:
1. Start with zero-pressure scenarios (a smile, a nod, a brief acknowledgement)
2. Never force yourself into overwhelming situations
3. Opt-out is always available — retreating is not failure
4. Repeat the same task until it feels comfortable before moving up

In this module, you will choose and attempt 2–3 micro tasks from the safe task menu. Remember: the goal is not performance. The goal is showing your brain that you survived.`,
            simplifiedText: `Small steps work best!

✅ What are micro tasks?
• Tiny, safe social actions
• Very low pressure
• You choose what to try

📋 Examples:
• Smile at someone
• Say "hello" when passing someone
• Ask someone what time it is
• Make eye contact briefly

⚠️ Rules:
• Never force yourself
• It's okay to stop
• Try the same task until it feels normal
• Then try the next one`,
            videoUrl1: "https://www.youtube.com/watch?v=1vx8iUvfyCY",
            videoUrl2: null,
            practicePrompt:
                "Describe ONE micro task you are going to attempt this week. Make it very small. Rate how anxious it makes you (1-10) and explain why you chose it.",
            reflectionPrompt:
                "After attempting (or imagining) your micro task, what happened? What did you notice in your body? What would you do differently next time?",
            questions: [
                {
                    prompt: "Systematic desensitization works because:",
                    options: [
                        "It forces you to face your fears all at once",
                        "Each small success teaches the brain the situation is survivable",
                        "It removes anxiety completely",
                        "It changes your personality",
                    ],
                    correctAnswer: "Each small success teaches the brain the situation is survivable",
                    explanation: "The brain learns through repeated safe exposures that social situations carry less danger than originally perceived.",
                },
                {
                    prompt: "When is it okay to opt out of a social task?",
                    options: ["Never — pushing through is the only way", "Always — opt-out is always available", "Only after 3 attempts", "Only when supervised"],
                    correctAnswer: "Always — opt-out is always available",
                    explanation: "Safety and consent are always paramount. Retreating is not failure — it's listening to your needs.",
                },
            ],
        },
        {
            id: "seed-sc-module-3",
            order: 3,
            title: "Intermediate Confidence Tasks",
            conceptText: `Now that you've built a foundation with micro tasks, we step into slightly larger territory — intermediate tasks. These involve brief but direct social interactions with real outcomes.

Intermediate tasks might include:
• Asking a store employee where to find something
• Calling a business to ask a question
• Joining an online community and posting once
• Saying "excuse me" to pass someone in a corridor

These are still safe, low-stakes, and reversible. But they require a moment of social initiation — you start the interaction.

The key shift here is moving from reactive (responding to social situations) to active (initiating them). This builds a different kind of confidence: the sense that you can generate social connection when you choose to, not just respond when forced.

Remember: you do not need to feel confident to act confidently. Act first. Confidence follows.`,
            simplifiedText: null,
            videoUrl1: "https://www.youtube.com/watch?v=1vx8iUvfyCY",
            videoUrl2: null,
            practicePrompt:
                "Choose one intermediate task from the list above (or describe your own). Write out exactly what you plan to say or do. Include a backup plan if you feel overwhelmed.",
            reflectionPrompt:
                "How did your intermediate task feel compared to your micro tasks? What have you learned about the gap between anticipating a social situation and actually experiencing it?",
            questions: [
                {
                    prompt: "Intermediate tasks primarily develop:",
                    options: [
                        "The ability to avoid social situations",
                        "The ability to initiate social interactions",
                        "The ability to speak in public",
                        "The ability to make friends instantly",
                    ],
                    correctAnswer: "The ability to initiate social interactions",
                    explanation: "Intermediate tasks shift you from being reactive (responding when forced) to active (initiating when you choose).",
                },
            ],
        },
        {
            id: "seed-sc-module-4",
            order: 4,
            title: "Advanced Confidence & Custom Challenges",
            conceptText: `You have reached a significant milestone. The fact that you are here means you have already practiced social exposure — and you have survived. That is the foundation.

Advanced work involves:
1. Sustaining interactions (conversations beyond the opening line)
2. Tolerating discomfort without escaping
3. Reframing perceived judgment (not everyone is watching, and those who are mostly wish you well)
4. Creating your own personalised challenges

In this module, you design your own challenge. You decide what it is, why it matters, and how you will approach it. Our AI will generate a safe, step-by-step breakdown — including a backup plan and reflection template — tailored specifically to your submission.

One important reframe: the goal is not to eliminate anxiety. Anxiety in social situations is normal, even for highly confident people. The goal is to act despite it.

Discomfort is the price of growth. And you have already shown you are willing to pay it.`,
            simplifiedText: null,
            videoUrl1: "https://www.youtube.com/watch?v=1vx8iUvfyCY",
            videoUrl2: null,
            practicePrompt:
                "Submit your custom challenge using the Personal Challenge Task form below. Be honest about your fear rating. There is no judgment here.",
            reflectionPrompt:
                "Looking back at all four modules: What has changed in how you see social fear? What is one specific thing you will do differently in the next two weeks?",
            questions: [
                {
                    prompt: "The goal of advanced social confidence work is to:",
                    options: [
                        "Eliminate all anxiety permanently",
                        "Act despite anxiety, not eliminate it",
                        "Avoid all difficult social situations",
                        "Become an extrovert",
                    ],
                    correctAnswer: "Act despite anxiety, not eliminate it",
                    explanation: "Even highly confident people experience anxiety. The goal is to act in spite of it, not to eliminate it.",
                },
            ],
        },
        {
            id: "seed-sc-module-5",
            order: 5,
            title: "Growth Reflection & Course Completion",
            conceptText: `This is your final module. Before we generate your certificate, we invite you to write your Growth Reflection — a personal account of your journey through this course.

A powerful reflection covers:
• What you believed about social fear before this course
• What changed (even slightly) in your understanding
• Which task was hardest — and what that taught you
• One commitment you are making to yourself going forward

This reflection is not graded for grammar or eloquence. It is graded for honesty and depth of self-observation.

Your certificate will then include a personalised Growth Summary — generated by the AI from your reflections across all modules — summarising the journey you have taken.

Completing this course does not mean you are cured of social anxiety. It means you have taken a meaningful, intentional step toward a more connected life. That deserves to be recognised.

Well done.`,
            simplifiedText: null,
            videoUrl1: null,
            videoUrl2: null,
            practicePrompt: null,
            reflectionPrompt:
                "Write your final Growth Reflection. Cover: what you believed before, what changed, which task was hardest, and one commitment you are making to yourself.",
            questions: [],
        },
    ];

    for (const mod of socialModules) {
        const { questions, ...modData } = mod;
        await prisma.module.upsert({
            where: { id: mod.id },
            update: {},
            create: {
                courseId: socialCourse.id,
                reflectionRequired: true,
                minReflectionWords: 60,
                ...modData,
            },
        });

        for (const q of questions) {
            await prisma.moduleQuestion.upsert({
                where: { id: `${mod.id}-q-${questions.indexOf(q)}` },
                update: {},
                create: {
                    id: `${mod.id}-q-${questions.indexOf(q)}`,
                    moduleId: mod.id,
                    prompt: q.prompt,
                    type: QuestionType.MCQ,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation,
                },
            });
        }
    }

    // ── 2. Standard Sample Course ──────────────────────────────────────────
    const stdCourse = await prisma.course.upsert({
        where: { id: "seed-computer-foundations-course" },
        update: {},
        create: {
            id: "seed-computer-foundations-course",
            title: "Foundations of Computer Science",
            description:
                "An accessible introduction to the core concepts of computing — algorithms, data structures, networking, and software design — using real-world examples and adaptive AI explanations.",
            objectives: [
                "Understand what algorithms are and how they work",
                "Explain core data structures and when to use them",
                "Describe how the internet and networking function",
                "Identify key software design principles",
            ],
            outcomes: [
                "Ability to read and understand basic pseudocode",
                "Conceptual foundation for further CS study",
                "Understanding of how everyday software is built",
            ],
            subject: "Computer Science",
            skillLevel: SkillLevel.BEGINNER,
            durationHours: 6,
            isPublished: true,
            courseType: CourseType.STANDARD,
            instructorId: INSTRUCTOR_ID,
        },
    });

    const csModules = [
        {
            id: "seed-cs-module-1",
            order: 1,
            title: "What is an Algorithm?",
            conceptText: `An algorithm is a set of step-by-step instructions designed to solve a problem or accomplish a task. Every piece of software you have ever used was built on algorithms.

Consider making a cup of tea:
1. Boil water
2. Place teabag in cup
3. Pour boiling water
4. Wait 3 minutes
5. Remove teabag
6. Add milk (optional)

That is an algorithm. It has a defined input (water, tea, cup), a set of ordered steps, and a defined output (tea).

In computing, algorithms operate on data. The efficiency of an algorithm determines how fast and resource-efficiently a program runs. A poorly designed algorithm can make a powerful computer slow; a well-designed one can make a simple device incredibly fast.

Key algorithm properties: correctness, efficiency (time & space), clarity, and finiteness.`,
            simplifiedText: null,
            videoUrl1: "https://www.youtube.com/watch?v=rL8X2mlNHPM",
            videoUrl2: null,
            practicePrompt:
                "Write a simple algorithm (in plain English steps) for a task you do every morning. Include at least 5 steps. Think about inputs and outputs.",
            reflectionPrompt:
                "How has thinking in algorithms changed how you see everyday tasks? Give one example from your day where you noticed algorithm-like thinking.",
            questions: [
                {
                    prompt: "Which of the following is NOT a key property of a good algorithm?",
                    options: ["Correctness", "Popularity", "Efficiency", "Finiteness"],
                    correctAnswer: "Popularity",
                    explanation: "A good algorithm must be correct, efficient, clear, and finite. Popularity has no bearing on algorithmic quality.",
                },
                {
                    prompt: "An algorithm always requires:",
                    options: [
                        "A computer to run on",
                        "Defined steps, input, and output",
                        "At least 10 instructions",
                        "Programming language knowledge",
                    ],
                    correctAnswer: "Defined steps, input, and output",
                    explanation: "Algorithms are not limited to computers — they are simply ordered steps that take an input and produce an output.",
                },
            ],
        },
        {
            id: "seed-cs-module-2",
            order: 2,
            title: "Data Structures Explained",
            conceptText: `A data structure is a way of organising data so it can be accessed and modified efficiently. Choosing the right data structure is often the difference between a fast program and a slow one.

Common data structures:

**Array** — An ordered list of items. Fast to access by position, slow to insert in the middle.
Example: A row of numbered seats in a cinema.

**Stack** — Last In, First Out (LIFO). Like a pile of plates — you take from the top.
Example: Undo/redo in a text editor.

**Queue** — First In, First Out (FIFO). Like a queue at a bus stop.
Example: Print jobs sent to a printer.

**Linked List** — Items connected by pointers to the next item. Fast to insert/delete, slow to access by position.

**Hash Table** — Maps keys to values for instant lookup.
Example: A dictionary (word → definition).

**Tree** — Hierarchical structure. File systems, organisation charts, HTML DOM.

Every data structure is a trade-off. The right choice depends on what operations you need most.`,
            simplifiedText: null,
            videoUrl1: "https://www.youtube.com/watch?v=zg9ih6SVACc",
            videoUrl2: null,
            practicePrompt:
                "Choose one data structure from this module and explain it in your own words using a real-life example that was NOT mentioned in the lesson.",
            reflectionPrompt:
                "Which data structure surprised you most, and why? Can you think of an app you use daily that probably uses a hash table or a tree internally?",
            questions: [
                {
                    prompt: "Which data structure uses Last In, First Out (LIFO) ordering?",
                    options: ["Queue", "Array", "Stack", "Linked List"],
                    correctAnswer: "Stack",
                    explanation: "A stack is LIFO — the last item added is the first removed. Think of a pile of plates.",
                },
                {
                    prompt: "A hash table is best used when you need:",
                    options: ["Ordered sequential data", "Fast lookup by key", "LIFO behaviour", "Hierarchical structure"],
                    correctAnswer: "Fast lookup by key",
                    explanation: "Hash tables offer O(1) average-time lookup by key — making them ideal for dictionaries and caches.",
                },
            ],
        },
        {
            id: "seed-cs-module-3",
            order: 3,
            title: "How the Internet Works",
            conceptText: `The internet is a global network of computers communicating using agreed-upon protocols — sets of rules for how data should travel.

**IP Addresses** — Every device on the internet has a unique address, like a postal address. IPv4 (e.g. 192.168.1.1) is being replaced by IPv6 due to address exhaustion.

**DNS (Domain Name System)** — Translates human-readable names (google.com) into IP addresses. Like a phone book for the internet.

**TCP/IP** — The foundational protocol suite. TCP (Transmission Control Protocol) ensures data arrives complete and in order. IP routes it to the right destination.

**HTTP/HTTPS** — The protocol for web pages. HTTPS adds encryption (TLS) so data cannot be intercepted.

**How a web request works:**
1. You type a URL
2. DNS resolves it to an IP address
3. Your browser opens a TCP connection to that IP
4. It sends an HTTP request
5. The server sends back HTML, CSS, JavaScript
6. Your browser renders the page`,
            simplifiedText: null,
            videoUrl1: "https://www.youtube.com/watch?v=x3c1ih2NJEg",
            videoUrl2: null,
            practicePrompt:
                "In your own words, describe what happens between you pressing Enter on a URL and the webpage appearing. Use at least 4 steps.",
            reflectionPrompt:
                "Before this module, what did you think the internet was? How has your understanding changed? What would you explain differently to a friend?",
            questions: [
                {
                    prompt: "What does DNS do?",
                    options: [
                        "Encrypts web traffic",
                        "Translates domain names to IP addresses",
                        "Routes packets across the internet",
                        "Stores website data",
                    ],
                    correctAnswer: "Translates domain names to IP addresses",
                    explanation: "DNS is like the internet's phone book — it converts human-readable domain names into machine-readable IP addresses.",
                },
            ],
        },
        {
            id: "seed-cs-module-4",
            order: 4,
            title: "Software Design Principles",
            conceptText: `Good software is not just about making code that works. It is about making code that is maintainable, readable, and extensible over time.

**SOLID Principles** (for object-oriented design):
- **S**ingle Responsibility: Every module does one thing
- **O**pen/Closed: Open for extension, closed for modification
- **L**iskov Substitution: Subtypes must be substitutable for base types
- **I**nterface Segregation: Don't force clients to depend on unused interfaces
- **D**ependency Inversion: Depend on abstractions, not concretions

**DRY (Don't Repeat Yourself)** — Avoid duplication. If you write the same logic twice, extract it.

**KISS (Keep it Simple, Stupid)** — Simpler is almost always better. Complexity is the enemy of reliability.

**Separation of Concerns** — Keep different responsibilities in different parts of the code (e.g. data, logic, UI).

These principles were developed from decades of software engineering experience. Every major software product — from Android to the systems running your bank — follows versions of these principles.`,
            simplifiedText: null,
            videoUrl1: "https://www.youtube.com/watch?v=_jDNAkmsduo",
            videoUrl2: null,
            practicePrompt:
                "Pick one principle from this module (DRY, KISS, or any SOLID principle) and explain it with an analogy from daily life. Why does violating it cause problems?",
            reflectionPrompt:
                "Which design principle resonated most with you and why? Can you think of a real software product that clearly violates one of these principles?",
            questions: [
                {
                    prompt: "The DRY principle stands for:",
                    options: [
                        "Dynamic Routing Yield",
                        "Don't Repeat Yourself",
                        "Design Redundancy Yield",
                        "Direct Result Yield",
                    ],
                    correctAnswer: "Don't Repeat Yourself",
                    explanation: "DRY (Don't Repeat Yourself) means avoiding duplicated logic — if you repeat code, extract it into a shared function.",
                },
                {
                    prompt: "The KISS principle recommends:",
                    options: [
                        "Using the most advanced patterns available",
                        "Keeping designs as simple as possible",
                        "Always using object-oriented programming",
                        "Writing the shortest code possible",
                    ],
                    correctAnswer: "Keeping designs as simple as possible",
                    explanation: "KISS (Keep it Simple, Stupid) reminds us that complexity is the enemy of reliability. Simpler code is easier to maintain.",
                },
            ],
        },
        {
            id: "seed-cs-module-5",
            order: 5,
            title: "Final Evaluation & Synthesis",
            conceptText: `You have covered the four foundational pillars of computer science: algorithms, data structures, networking, and software design.

Each of these areas connects to the others. An algorithm operates on data structures. Data travels over networks. Software design determines how all of this is organised.

In this final module, you are asked to synthesise your learning across all four areas. There is no new content — this is a reflection and integration exercise.

Consider: if you were building a simple app that helps people find local events, which data structures would you use? What algorithms would you need? How would it communicate over the internet? What design principles would guide its structure?

You don't need to build it. You only need to think through it.

This kind of integrated thinking — connecting concepts across domains — is what professional software engineers do every day.`,
            simplifiedText: null,
            videoUrl1: null,
            videoUrl2: null,
            practicePrompt:
                "Describe the architecture of a simple app of your choice (events finder, a quiz app, a book tracker — anything). Which data structures, algorithms, networking protocols, and design principles would you use, and why?",
            reflectionPrompt:
                "What is the single most important thing you learned from this course? How will you apply it? What would you study next?",
            questions: [
                {
                    prompt: "Which of the following best describes the relationship between algorithms and data structures?",
                    options: [
                        "They are completely independent",
                        "Algorithms operate on data structures",
                        "Data structures replace algorithms",
                        "Only one is needed in real software",
                    ],
                    correctAnswer: "Algorithms operate on data structures",
                    explanation: "Algorithms and data structures are complementary — an algorithm sorts, searches, or transforms data that must be stored in an appropriate structure.",
                },
            ],
        },
    ];

    for (const mod of csModules) {
        const { questions, ...modData } = mod;
        await prisma.module.upsert({
            where: { id: mod.id },
            update: {},
            create: {
                courseId: stdCourse.id,
                reflectionRequired: true,
                minReflectionWords: 50,
                ...modData,
            },
        });

        for (const [idx, q] of questions.entries()) {
            await prisma.moduleQuestion.upsert({
                where: { id: `${mod.id}-q-${idx}` },
                update: {},
                create: {
                    id: `${mod.id}-q-${idx}`,
                    moduleId: mod.id,
                    prompt: q.prompt,
                    type: QuestionType.MCQ,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation,
                },
            });
        }
    }

    console.log(`✅ Seeded 2 courses (${socialModules.length + csModules.length} modules total)`);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
