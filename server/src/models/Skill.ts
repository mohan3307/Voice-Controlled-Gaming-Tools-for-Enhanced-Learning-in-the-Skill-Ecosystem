import mongoose, { Schema } from 'mongoose';

const SkillSchema = new Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Frontend', 'Backend', 'DataScience', 'DevOps', 'Cybersecurity', 'Python', 'Java', 'HTML', 'DataStructures', 'MachineLearning', 'English'], 
    required: true 
  },
  prerequisites: [{ type: Schema.Types.ObjectId, ref: 'Skill' }],
  levelNeeded: { type: Number, default: 1 },
  badgeAwarded: {
    title: { type: String, required: true },
    icon: { type: String, default: 'Award' }, // Lucide icon identifier
    description: { type: String }
  }
}, { timestamps: true });

export const Skill = mongoose.model('Skill', SkillSchema);
