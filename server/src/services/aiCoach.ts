import { Progress } from '../models/Progress';
import { Game } from '../models/Game';
import { Skill } from '../models/Skill';

export interface AIRecommendation {
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  recommendedGames: Array<{
    gameId: string;
    title: string;
    gameType: string;
    reason: string;
  }>;
  focusSkills: string[];
}

export class AICoach {
  /**
   * Evaluates student's records to construct custom learning paths.
   */
  static async analyzePerformance(userId: string): Promise<AIRecommendation> {
    try {
      const logs = await Progress.find({ user: userId }).populate('skill game');
      const allGames = await Game.find().populate('skillAssociated');

      if (logs.length === 0) {
        // Return default onboarding path recommendations
        const seedGames = allGames.slice(0, 2);
        return {
          feedback: "Welcome node! Initialize your voice control engine in the Voice Command Playground and select a beginner-friendly Coding Battle or VoiceQuest module below.",
          strengths: ["Willingness to learn"],
          weaknesses: ["No data recorded yet"],
          recommendedGames: seedGames.map(g => ({
            gameId: g._id.toString(),
            title: g.title,
            gameType: g.gameType,
            reason: "Onboarding path starter task."
          })),
          focusSkills: ["Terminal Navigation", "Variable Declaration"]
        };
      }

      // Analyze strengths/weaknesses
      const averagesBySkill: Record<string, { totalScore: number; count: number; name: string; failCount: number; commandCount: number }> = {};
      
      logs.forEach(log => {
        const skill = log.skill as any;
        if (!skill) return;
        const skillId = skill._id.toString();

        if (!averagesBySkill[skillId]) {
          averagesBySkill[skillId] = {
            totalScore: 0,
            count: 0,
            name: skill.name,
            failCount: 0,
            commandCount: 0
          };
        }

        averagesBySkill[skillId].totalScore += log.score;
        averagesBySkill[skillId].count += 1;
        if (log.voiceAnalytics) {
          averagesBySkill[skillId].failCount += log.voiceAnalytics.commandsFailed || 0;
          averagesBySkill[skillId].commandCount += log.voiceAnalytics.commandsExecuted || 0;
        }
      });

      const strengths: string[] = [];
      const weaknesses: string[] = [];
      const focusSkillsList: string[] = [];

      Object.values(averagesBySkill).forEach(item => {
        const avg = item.totalScore / item.count;
        const failRate = item.commandCount > 0 ? item.failCount / item.commandCount : 0;

        if (avg >= 80) {
          strengths.push(`${item.name} (avg: ${Math.round(avg)}%)`);
        } else {
          weaknesses.push(`${item.name} - Study targets (avg: ${Math.round(avg)}%)`);
          focusSkillsList.push(item.name);
        }

        if (failRate > 0.3) {
          weaknesses.push(`Speech recognition threshold on ${item.name} - Increase articulation or adjust mic sensitivity.`);
        }
      });

      // Simple AI feedback compiler
      let feedback = "Sensors active. Your vocal command execution speeds match the targets. Keep articulating clearly.";
      if (weaknesses.length > 0) {
        feedback = `Identified potential skill caps in ${focusSkillsList.join(', ')}. Try reading questions aloud slowly to lower hesitation time.`;
      }

      // Find games to recommend
      // Recommends games belonging to focusSkills that the user hasn't successfully completed/needs revision on
      const completedGameIds = logs
        .filter(l => l.completionStatus === 'Completed')
        .map(l => l.game?._id?.toString());

      const targetGames = allGames.filter(g => {
        const hasCompleted = completedGameIds.includes(g._id.toString());
        const isFocusSkill = focusSkillsList.includes((g.skillAssociated as any)?.name);
        return !hasCompleted || (isFocusSkill && Math.random() > 0.5); // recommend incomplete or focus skills
      }).slice(0, 3);

      const recommendedGames = targetGames.map(g => ({
        gameId: g._id.toString(),
        title: g.title,
        gameType: g.gameType,
        reason: completedGameIds.includes(g._id.toString()) 
          ? "Needs revision to cement knowledge node." 
          : "Unlocks prerequisites in target skill track."
      }));

      // Fallback if target games are empty
      if (recommendedGames.length === 0 && allGames.length > 0) {
        recommendedGames.push({
          gameId: allGames[0]._id.toString(),
          title: allGames[0].title,
          gameType: allGames[0].gameType,
          reason: "Practice voice command execution targets."
        });
      }

      return {
        feedback,
        strengths: strengths.length > 0 ? strengths : ["Responsive engagement"],
        weaknesses: weaknesses.length > 0 ? weaknesses : ["No crucial weak vectors detected"],
        recommendedGames,
        focusSkills: focusSkillsList.length > 0 ? focusSkillsList : ["Advanced Logic & Algorithms"]
      };

    } catch (e: any) {
      console.error('Error generating AI coaching:', e);
      return {
        feedback: "AI Coach temporarily updating database node.",
        strengths: ["Engaged"],
        weaknesses: [],
        recommendedGames: [],
        focusSkills: []
      };
    }
  }
}
