import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Skill } from '../models/Skill';
import { Game } from '../models/Game';

const router = Router();

// One-time production seed endpoint protected by secret key
// Call: POST /api/seed-prod  with header x-seed-key: SEED_SECRET_2026
router.post('/', async (req: Request, res: Response) => {
  const key = req.headers['x-seed-key'];
  if (key !== 'SEED_SECRET_2026') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  try {
    const existingCount = await Skill.countDocuments();
    if (existingCount > 0) {
      return res.json({ success: true, message: `Already seeded: ${existingCount} skills found.` });
    }

    const subjects = [
      { name: 'Python Basics',        slug: 'python',     category: 'Python' },
      { name: 'Java OOP',             slug: 'java',       category: 'Java' },
      { name: 'HTML Web',             slug: 'html',       category: 'HTML' },
      { name: 'Data Structures',      slug: 'ds',         category: 'DataStructures' },
      { name: 'Machine Learning',     slug: 'ml',         category: 'MachineLearning' },
      { name: 'Spoken English',       slug: 'english',    category: 'English' }
    ];

    const difficultyMap: Record<number, string> = {
      1: 'Easy', 2: 'Easy', 3: 'Medium', 4: 'Hard', 5: 'Expert'
    };

    const skillsToInsert: any[] = [];
    const gamesToInsert: any[] = [];

    for (const sub of subjects) {
      let prevSkillId: mongoose.Types.ObjectId | null = null;

      for (let i = 1; i <= 100; i++) {
        const skillId = new mongoose.Types.ObjectId();
        const diff = difficultyMap[Math.min(5, Math.ceil(i / 20))] || 'Easy';

        skillsToInsert.push({
          _id: skillId,
          name: `${sub.name} - Level ${i}`,
          slug: `${sub.slug}-level-${i}`,
          description: `Master ${sub.name} concepts at level ${i}. Progressive skill building from fundamentals to advanced.`,
          category: sub.category,
          prerequisites: prevSkillId ? [prevSkillId] : [],
          levelNeeded: i,
          badgeAwarded: {
            title: `${sub.name} L${i} Badge`,
            icon: 'Award',
            description: `Awarded for completing ${sub.name} Level ${i}`
          }
        });

        // VoiceQuest Quiz Game
        gamesToInsert.push({
          _id: new mongoose.Types.ObjectId(),
          title: `${sub.name} L${i} - VoiceQuest`,
          description: `Voice-controlled quiz for ${sub.name} level ${i}`,
          skillAssociated: skillId,
          gameType: 'VoiceQuest',
          baseDifficulty: diff,
          xpReward: 100,
          questions: [
            {
              prompt: `${sub.name} Level ${i}: What is the primary concept in this level?`,
              options: ['Fundamental A', 'Fundamental B', 'Fundamental C', 'Fundamental D'],
              correctAnswer: 'Fundamental A',
              hint: `Think about the core principles of ${sub.name}`
            },
            {
              prompt: `${sub.name} Level ${i}: Which syntax is correct?`,
              options: ['Syntax Option A', 'Syntax Option B', 'Syntax Option C', 'Syntax Option D'],
              correctAnswer: 'Syntax Option B',
              hint: `Standard ${sub.name} syntax rules apply`
            },
            {
              prompt: `${sub.name} Level ${i}: What does this code output?`,
              options: ['Output X', 'Output Y', 'Output Z', 'No output'],
              correctAnswer: 'Output Y',
              hint: `Trace through the execution step by step`
            }
          ]
        });

        // CodingBattle Game
        gamesToInsert.push({
          _id: new mongoose.Types.ObjectId(),
          title: `${sub.name} L${i} - Coding Battle`,
          description: `Fix bugs in ${sub.name} code at level ${i}`,
          skillAssociated: skillId,
          gameType: 'CodingBattle',
          baseDifficulty: diff,
          xpReward: 150,
          codingChallenges: [
            {
              title: `${sub.name} L${i} Bug Fix #1`,
              instructions: `Find and fix the bug in this ${sub.name} code snippet`,
              buggyCode: `def solve_level_${i}():\n    result = compute()\n    return reslt  # Bug: typo\n\nprint(solve_level_${i}())`,
              correctLineIndex: 2,
              buggyLine: `    return reslt  # Bug: typo`,
              correctLine: `    return result`,
              language: sub.slug,
              hints: [`Check variable name spelling on line 3`, `Compare with the variable declared above`]
            },
            {
              title: `${sub.name} L${i} Bug Fix #2`,
              instructions: `Identify the logical error in this level ${i} challenge`,
              buggyCode: `def calculate_${i}(x, y):\n    return x + y  # Wrong operator\n\nprint(calculate_${i}(10, 5))`,
              correctLineIndex: 1,
              buggyLine: `    return x + y  # Wrong operator`,
              correctLine: `    return x * y`,
              language: sub.slug,
              hints: [`Check if addition or multiplication is needed`, `Verify the expected output`]
            },
            {
              title: `${sub.name} L${i} Bug Fix #3`,
              instructions: `Fix the condition logic in this ${sub.name} level ${i} code`,
              buggyCode: `def check_${i}(n):\n    if n > 0:\n        return "negative"  # Wrong label\n    return "positive"`,
              correctLineIndex: 2,
              buggyLine: `        return "negative"  # Wrong label`,
              correctLine: `        return "positive"`,
              language: sub.slug,
              hints: [`Positive numbers are greater than zero`, `Check which label matches which condition`]
            }
          ]
        });

        prevSkillId = skillId;
      }
    }

    await Skill.insertMany(skillsToInsert, { ordered: false });
    await Game.insertMany(gamesToInsert, { ordered: false });

    return res.json({
      success: true,
      message: 'Production database seeded successfully!',
      skills: skillsToInsert.length,
      games: gamesToInsert.length
    });

  } catch (err: any) {
    console.error('Seed error:', err);
    return res.status(500).json({ success: false, message: err.message, details: err.toString() });
  }
});

export default router;
