import mongoose, { Schema } from 'mongoose';

const QuestionSchema = new Schema({
  prompt: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true }, // e.g. "Option A" or value
  hint: { type: String }
});

const QuestStageSchema = new Schema({
  stageId: { type: String, required: true },
  dialogue: { type: String, required: true },
  narrativeImagePath: { type: String },
  options: [{
    commandText: { type: String, required: true }, // e.g. "override security network"
    targetStageId: { type: String, required: true },
    xpGained: { type: Number, default: 10 }
  }]
});

const CodingChallengeSchema = new Schema({
  title: { type: String, required: true },
  instructions: { type: String, required: true },
  buggyCode: { type: String, required: true },
  correctLineIndex: { type: Number, required: true }, // 0-indexed line with the bug
  buggyLine: { type: String, required: true }, // exact line containing the bug
  correctLine: { type: String, required: true }, // replacement line code
  language: { type: String, default: 'javascript' },
  hints: [{ type: String }]
});

const GameSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  skillAssociated: { type: Schema.Types.ObjectId, ref: 'Skill', required: true },
  creator: { type: Schema.Types.ObjectId, ref: 'User' }, // Optional (seed or instructor created)
  gameType: { 
    type: String, 
    enum: ['VoiceQuest', 'CodingBattle', 'Quiz', 'LogicPuzzle'], 
    required: true 
  },
  baseDifficulty: { 
    type: String, 
    enum: ['Easy', 'Medium', 'Hard', 'Expert'], 
    default: 'Easy' 
  },
  xpReward: { type: Number, default: 50 },
  questions: [QuestionSchema],
  questStages: [QuestStageSchema],
  codingChallenges: [CodingChallengeSchema]
}, { timestamps: true });

export const Game = mongoose.model('Game', GameSchema);
