import mongoose, { Schema } from 'mongoose';

const ProgressSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  skill: { type: Schema.Types.ObjectId, ref: 'Skill', index: true },
  game: { type: Schema.Types.ObjectId, ref: 'Game', index: true },
  completionStatus: { 
    type: String, 
    enum: ['Started', 'Failed', 'Completed'], 
    default: 'Started' 
  },
  score: { type: Number, default: 0 },
  xpEarned: { type: Number, default: 0 },
  timeSpentSeconds: { type: Number, default: 0 },
  attempts: { type: Number, default: 1 },
  adaptiveDifficultyLevel: { type: String, enum: ['Easy', 'Medium', 'Hard', 'Expert'], default: 'Easy' },
  
  // Voice interaction logs for learning metrics
  voiceAnalytics: {
    speechConfidenceAvg: { type: Number, default: 0.90 }, // scale 0-1
    commandsExecuted: { type: Number, default: 0 },
    commandsFailed: { type: Number, default: 0 },
    hesitationIndex: { type: Number, default: 0 } // voice pauses during challenges
  }
}, { timestamps: true });

// Ensure unique index so progress is tracked cleanly per user/game
ProgressSchema.index({ user: 1, game: 1 }, { unique: true, sparse: true });
// Progress index for skill mastery checks
ProgressSchema.index({ user: 1, skill: 1 });

export const Progress = mongoose.model('Progress', ProgressSchema);
