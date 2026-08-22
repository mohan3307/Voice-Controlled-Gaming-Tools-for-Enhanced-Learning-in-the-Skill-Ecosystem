import { Progress } from '../models/Progress';

export class DifficultyEngine {
  /**
   * Calculates the next recommended difficulty level based on the user's performance
   * in recent game sessions.
   * 
   * @param userId string The ID of the student
   * @param skillId string The associated skill category
   * @param currentDifficulty string Current difficulty level
   * @param latestScore number Score from the game just finished (out of 100)
   * @param voiceFailRatio number Ratio of failed voice inputs over total
   */
  static async calculateAdaptiveDifficulty(
    userId: string,
    skillId: string,
    currentDifficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert',
    latestScore: number,
    voiceFailRatio: number
  ): Promise<'Easy' | 'Medium' | 'Hard' | 'Expert'> {
    try {
      // Find the last 3 progress sessions for the user under this skill
      const pastSessions = await Progress.find({ user: userId, skill: skillId })
        .sort({ updatedAt: -1 })
        .limit(3);

      if (pastSessions.length === 0) {
        return currentDifficulty; // Keep current if no logs exist
      }

      // Calculate averages
      const scores = pastSessions.map(s => s.score);
      const avgScore = (scores.reduce((a, b) => a + b, 0) + latestScore) / (pastSessions.length + 1);

      // Adaptive adjustments
      if (avgScore >= 85 && voiceFailRatio < 0.15) {
        // Upgrade difficulty
        if (currentDifficulty === 'Easy') return 'Medium';
        if (currentDifficulty === 'Medium') return 'Hard';
        if (currentDifficulty === 'Hard') return 'Expert';
      } else if (avgScore < 55 || voiceFailRatio > 0.40) {
        // Downgrade difficulty
        if (currentDifficulty === 'Expert') return 'Hard';
        if (currentDifficulty === 'Hard') return 'Medium';
        if (currentDifficulty === 'Medium') return 'Easy';
      }

      return currentDifficulty; // Keep steady if within optimal bands (55 - 85)
    } catch (error) {
      console.error('Error calculating adaptive difficulty:', error);
      return currentDifficulty;
    }
  }
}
