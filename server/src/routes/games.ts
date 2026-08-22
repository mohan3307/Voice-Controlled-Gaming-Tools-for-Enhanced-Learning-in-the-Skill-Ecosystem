import { Router, Response } from 'express';
import { Game } from '../models/Game';
import { Progress } from '../models/Progress';
import { User } from '../models/User';
import { Skill } from '../models/Skill';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { DifficultyEngine } from '../services/difficultyEngine';

const router = Router();

// GET all games
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const games = await Game.find().populate('skillAssociated', 'name slug category');
    return res.json({ success: true, games });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET single game
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const game = await Game.findById(req.params.id).populate('skillAssociated', 'name slug category');
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game module not found' });
    }
    return res.json({ success: true, game });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// CREATE game (Instructors/Admins only)
router.post('/', authenticateToken, requireRole(['Admin', 'Instructor']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, skillAssociated, gameType, baseDifficulty, xpReward, questions, questStages, codingChallenges } = req.body;

    if (!title || !description || !skillAssociated || !gameType) {
      return res.status(400).json({ success: false, message: 'Title, description, skill and type are required' });
    }

    const newGame = new Game({
      title,
      description,
      skillAssociated,
      gameType,
      baseDifficulty: baseDifficulty || 'Easy',
      xpReward: xpReward || 50,
      questions: questions || [],
      questStages: questStages || [],
      codingChallenges: codingChallenges || [],
      creator: req.user?.id
    });

    await newGame.save();
    return res.status(201).json({ success: true, game: newGame });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// SUBMIT and evaluate game completion
router.post('/:id/submit', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const gameId = req.params.id;
    const userId = req.user?.id;
    const { 
      score, 
      timeSpentSeconds, 
      commandsExecuted, 
      commandsFailed, 
      hesitationIndex 
    } = req.body;

    if (typeof score === 'undefined' || !userId) {
      return res.status(400).json({ success: false, message: 'Score parameters are required' });
    }

    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game metadata not found' });
    }

    // Determine completion status
    const status = score >= 50 ? 'Completed' : 'Failed';
    const earnedXp = status === 'Completed' ? game.xpReward + Math.floor(score / 2) : 10;

    // Load user profile
    let user = await User.findById(userId);
    if (!user) {
      user = new User({
        _id: userId,
        username: req.user?.username || 'gamer',
        email: `${req.user?.username || 'gamer'}@skills.edu`,
        password: 'password123',
        role: req.user?.role || 'Student',
        xp: 0,
        level: 1,
        streakCount: 1,
        consentToVoiceProcess: true
      });
      await user.save();
    }

    // Update user stats
    user.xp += earnedXp;
    
    // Level boundary calculation: 1000 XP per level
    const nextLevel = Math.floor(user.xp / 1000) + 1;
    let didLevelUp = false;
    if (nextLevel > user.level) {
      user.level = nextLevel;
      didLevelUp = true;
    }
    user.lastActive = new Date();
    await user.save();

    // Calculate voice engine performance ratios
    const totalCommands = (commandsExecuted || 0) + (commandsFailed || 0);
    const voiceFailRatio = totalCommands > 0 ? (commandsFailed || 0) / totalCommands : 0;

    // Run Adaptive Difficulty Adjuster
    const currentDiff = (game.baseDifficulty as 'Easy' | 'Medium' | 'Hard' | 'Expert') || 'Easy';
    const nextRecommendedDifficulty = await DifficultyEngine.calculateAdaptiveDifficulty(
      userId,
      game.skillAssociated.toString(),
      currentDiff,
      score,
      voiceFailRatio
    );

    // Save Progress Document
    const progressUpdate = {
      completionStatus: status,
      score: Math.max(score, 0),
      xpEarned: earnedXp,
      timeSpentSeconds: timeSpentSeconds || 0,
      adaptiveDifficultyLevel: nextRecommendedDifficulty,
      voiceAnalytics: {
        speechConfidenceAvg: 1 - voiceFailRatio,
        commandsExecuted: commandsExecuted || 0,
        commandsFailed: commandsFailed || 0,
        hesitationIndex: hesitationIndex || 0
      }
    };

    const progress = await Progress.findOneAndUpdate(
      { user: userId, game: gameId },
      { 
        $set: {
          ...progressUpdate,
          skill: game.skillAssociated
        },
        $inc: { attempts: 1 } 
      },
      { upsert: true, new: true }
    );

    // Retrieve skill node details to check for badge rewards
    const skill = await Skill.findById(game.skillAssociated);
    let badgeUnlocked = null;
    if (status === 'Completed' && skill && score >= 90) {
      badgeUnlocked = skill.badgeAwarded;
    }

    return res.json({
      success: true,
      status,
      xpEarned: earnedXp,
      newXp: user.xp,
      currentLevel: user.level,
      didLevelUp,
      badgeUnlocked,
      nextRecommendedDifficulty,
      progress
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
