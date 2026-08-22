import { Router, Response } from 'express';
import { Skill } from '../models/Skill';
import { Progress } from '../models/Progress';
import { Game } from '../models/Game';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// GET all skills containing prerequisite chains
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const skills = await Skill.find().populate('prerequisites', 'name slug');
    
    // Fetch progress details for this user
    const userProgress = await Progress.find({ user: req.user?.id }).select('skill game completionStatus score xpEarned');
    
    // Fetch all games to link games list to each skill
    const games = await Game.find().select('_id title gameType skillAssociated');

    // Map progress and associated games array to each skill
    const skillsWithProgress = skills.map(skill => {
      const associatedGames = games.filter(g => g.skillAssociated?.toString() === skill._id.toString());
      const associatedGameIds = associatedGames.map(g => g._id.toString());
      
      const completedGamesForSkill = userProgress.filter(p => 
        p.game && associatedGameIds.includes(p.game.toString()) && p.completionStatus === 'Completed'
      );
      
      const isSkillCompleted = completedGamesForSkill.length > 0;
      
      let completion: 'Completed' | 'Started' | 'Locked' = 'Locked';
      if (isSkillCompleted) {
        completion = 'Completed';
      } else {
        if (skill.prerequisites.length === 0) {
          completion = 'Started';
        } else {
          const prereqIds = skill.prerequisites.map((p: any) => typeof p === 'object' ? p._id.toString() : p.toString());
          
          let allPrereqsPassed = true;
          for (const prereqId of prereqIds) {
            const prereqGames = games.filter(g => g.skillAssociated?.toString() === prereqId);
            const prereqGameIds = prereqGames.map(g => g._id.toString());
            const completedPrereqGames = userProgress.filter(p => 
              p.game && prereqGameIds.includes(p.game.toString()) && p.completionStatus === 'Completed'
            );
            
            const isPrereqCompleted = completedPrereqGames.length > 0;
            if (!isPrereqCompleted) {
              allPrereqsPassed = false;
              break;
            }
          }

          if (allPrereqsPassed) {
            completion = 'Started';
          } else {
            completion = 'Locked';
          }
        }
      }

      // Compute total score/xp earned for this skill across its games
      const skillProgressDocs = userProgress.filter(p => p.skill?.toString() === skill._id.toString());
      const totalScore = skillProgressDocs.reduce((acc, p) => acc + (p.score || 0), 0);
      const avgScore = skillProgressDocs.length > 0 ? Math.round(totalScore / skillProgressDocs.length) : 0;
      const totalXp = skillProgressDocs.reduce((acc, p) => acc + (p.xpEarned || 0), 0);

      return {
        ...skill.toObject(),
        completion,
        score: avgScore,
        xpEarned: totalXp,
        games: associatedGames.map(g => ({ _id: g._id, title: g.title, gameType: g.gameType }))
      };
    });

    return res.json({ success: true, skills: skillsWithProgress });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST a new skill (Instructors/Admins only)
router.post('/', authenticateToken, requireRole(['Admin', 'Instructor']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, category, prerequisites, levelNeeded, badgeAwarded } = req.body;

    if (!name || !description || !category) {
      return res.status(400).json({ success: false, message: 'Name, description and category are required' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const existingSkill = await Skill.findOne({ slug });
    if (existingSkill) {
      return res.status(400).json({ success: false, message: 'A skill with a similar name already exists' });
    }

    const newSkill = new Skill({
      name,
      slug,
      description,
      category,
      prerequisites: prerequisites || [],
      levelNeeded: levelNeeded || 1,
      badgeAwarded: badgeAwarded || { title: `${name} StandardBadge`, icon: 'Award', description: `Mastered standard level of ${name}` }
    });

    await newSkill.save();
    return res.status(201).json({ success: true, skill: newSkill });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
