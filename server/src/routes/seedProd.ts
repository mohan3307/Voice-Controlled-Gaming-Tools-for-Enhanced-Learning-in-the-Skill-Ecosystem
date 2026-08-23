import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Skill } from '../models/Skill';
import { Game } from '../models/Game';

const router = Router();

// One-time production seed endpoint - protected by secret key
// Call: POST /api/seed-prod  with header x-seed-key: SEED_SECRET_2026
router.post('/', async (req: Request, res: Response) => {
  const key = req.headers['x-seed-key'];
  if (key !== 'SEED_SECRET_2026') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  try {
    // Check if already seeded
    const existingCount = await Skill.countDocuments();
    if (existingCount > 0) {
      return res.json({ success: true, message: `Already seeded: ${existingCount} skills found.` });
    }

    const subjects = [
      { name: 'Python', shortName: 'python' },
      { name: 'Java OOP', shortName: 'java' },
      { name: 'HTML Web', shortName: 'html' },
      { name: 'Data Structures', shortName: 'data_structures' },
      { name: 'Machine Learning', shortName: 'ml' },
      { name: 'Spoken English', shortName: 'english' }
    ];

    const skillsToInsert: any[] = [];
    const gamesToInsert: any[] = [];

    for (const sub of subjects) {
      let prevSkillId: mongoose.Types.ObjectId | null = null;

      for (let i = 1; i <= 100; i++) {
        const skillId = new mongoose.Types.ObjectId();

        skillsToInsert.push({
          _id: skillId,
          name: `${sub.name} - Level ${i}`,
          description: `Master ${sub.name} concepts at level ${i}`,
          subject: sub.name,
          level: i,
          xpRequired: (i - 1) * 50,
          prerequisites: prevSkillId ? [prevSkillId] : [],
          isUnlocked: i === 1
        });

        // Quiz Game
        const quizId = new mongoose.Types.ObjectId();
        gamesToInsert.push({
          _id: quizId,
          skillId,
          title: `${sub.name} L${i} - VoiceQuest Quiz`,
          type: 'VoiceQuest',
          subject: sub.name,
          level: i,
          xpReward: 100,
          questions: [
            {
              question: `${sub.name} Level ${i}: What is the main concept here?`,
              options: [`Concept A`, `Concept B`, `Concept C`, `Concept D`],
              correctAnswer: 0,
              explanation: `The answer relates to ${sub.name} fundamentals.`
            },
            {
              question: `${sub.name} Level ${i}: Which is correct syntax?`,
              options: [`Syntax A`, `Syntax B`, `Syntax C`, `Syntax D`],
              correctAnswer: 1,
              explanation: `Standard ${sub.name} syntax applies here.`
            },
            {
              question: `${sub.name} Level ${i}: What does this output?`,
              options: [`Output A`, `Output B`, `Output C`, `Output D`],
              correctAnswer: 2,
              explanation: `Based on ${sub.name} execution rules.`
            }
          ]
        });

        // Coding Battle Game
        const codingId = new mongoose.Types.ObjectId();
        gamesToInsert.push({
          _id: codingId,
          skillId,
          title: `${sub.name} L${i} - Coding Battle`,
          type: 'CodingBattle',
          subject: sub.name,
          level: i,
          xpReward: 150,
          challenges: [
            {
              description: `Fix the bug in this ${sub.name} code snippet - Level ${i}`,
              codeLines: [
                `# ${sub.name} Level ${i} Challenge`,
                `def solve():`,
                `    result = computeValue()`,
                `    return reslt  # Bug here`,
                ``,
                `print(solve())`
              ],
              correctLineIndex: 3,
              buggyLine: `    return reslt  # Bug here`,
              correctLine: `    return result`,
              language: sub.shortName,
              hints: [`Check the variable name spelling`, `Look at line 3`]
            },
            {
              description: `Complete the missing logic - Level ${i} Part 2`,
              codeLines: [
                `# ${sub.name} Level ${i} Part 2`,
                `def calculate(x, y):`,
                `    return x + y  # Wrong operator`,
                ``,
                `print(calculate(10, 5))`
              ],
              correctLineIndex: 2,
              buggyLine: `    return x + y  # Wrong operator`,
              correctLine: `    return x * y`,
              language: sub.shortName,
              hints: [`Check the operator`, `Should multiply not add`]
            },
            {
              description: `Debug the condition - Level ${i} Part 3`,
              codeLines: [
                `# ${sub.name} Level ${i} Part 3`,
                `def check(n):`,
                `    if n > 0:`,
                `        return "negative"  # Wrong label`,
                `    return "positive"`
              ],
              correctLineIndex: 3,
              buggyLine: `        return "negative"  # Wrong label`,
              correctLine: `        return "positive"`,
              language: sub.shortName,
              hints: [`Check the return value logic`, `Positive numbers are > 0`]
            }
          ]
        });

        prevSkillId = skillId;
      }
    }

    await Skill.insertMany(skillsToInsert);
    await Game.insertMany(gamesToInsert);

    return res.json({
      success: true,
      message: `Seeded successfully!`,
      skills: skillsToInsert.length,
      games: gamesToInsert.length
    });

  } catch (err: any) {
    console.error('Seed error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
