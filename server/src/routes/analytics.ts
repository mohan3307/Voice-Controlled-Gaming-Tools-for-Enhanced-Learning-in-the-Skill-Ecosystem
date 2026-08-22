import { Router, Response } from 'express';
import { Progress } from '../models/Progress';
import { User } from '../models/User';
import { AICoach } from '../services/aiCoach';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET AI Coach Advice & Recommended Tasks
router.get('/recommendations', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication mismatch' });
    }

    const advice = await AICoach.analyzePerformance(userId);
    return res.json({ success: true, ...advice });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET Dashboard Performance Summary details (for widgets/charts)
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const progressList = await Progress.find({ user: userId }).populate('skill game');
    
    // Group variables
    let totalXpEarned = 0;
    let completedGamesCount = 0;
    let failedGamesCount = 0;
    let totalAttempts = 0;
    let totalSpeechCommands = 0;
    let totalFailedSpeechCommands = 0;
    
    const activityTracker: Record<string, number> = {}; // YYYY-MM-DD -> count
    const skillsMastered: string[] = [];
    const badgesUnlocked: Array<{ title: string; icon: string; description: string }> = [];

    progressList.forEach(p => {
      totalXpEarned += p.xpEarned || 0;
      totalAttempts += p.attempts || 0;
      
      if (p.completionStatus === 'Completed') {
        completedGamesCount++;
        const skill = p.skill as any;
        if (skill) {
          skillsMastered.push(skill.name);
          if (p.score >= 90) {
            badgesUnlocked.push(skill.badgeAwarded);
          }
        }
      } else if (p.completionStatus === 'Failed') {
        failedGamesCount++;
      }

      if (p.voiceAnalytics) {
        totalSpeechCommands += p.voiceAnalytics.commandsExecuted || 0;
        totalFailedSpeechCommands += p.voiceAnalytics.commandsFailed || 0;
      }

      // Group activities by date
      if (p.updatedAt) {
        const dateStr = new Date(p.updatedAt).toISOString().split('T')[0];
        activityTracker[dateStr] = (activityTracker[dateStr] || 0) + 1;
      }
    });

    // Formatting Activity Timeline for Recharts
    const timelineData = Object.keys(activityTracker).map(date => ({
      date,
      activities: activityTracker[date]
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate generic stats averages
    const speechAccuracy = totalSpeechCommands > 0 
      ? 1 - (totalFailedSpeechCommands / totalSpeechCommands) 
      : 0.90;

    return res.json({
      success: true,
      stats: {
        totalXpEarned,
        completedGamesCount,
        failedGamesCount,
        totalAttempts,
        voiceEngineLogs: {
          totalSpeechCommands,
          speechAccuracy,
        },
        skillsMastered: Array.from(new Set(skillsMastered)),
        badgesUnlocked: Array.from(new Set(badgesUnlocked.map(b => JSON.stringify(b)))).map(s => JSON.parse(s)),
        timelineData
      }
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET Global Leaderboard
router.get('/leaderboard', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await User.find()
      .select('username xp level streakCount')
      .sort({ xp: -1 })
      .limit(10);
      
    return res.json({ success: true, leaderboard: list });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
