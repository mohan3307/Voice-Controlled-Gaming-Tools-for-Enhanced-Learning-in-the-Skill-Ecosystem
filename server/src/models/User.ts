import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Student', 'Instructor', 'Admin', 'Organization'], 
    default: 'Student' 
  },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streakCount: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  microphoneSettings: {
    gain: { type: Number, default: 1.0 },
    noiseCancelling: { type: Boolean, default: true },
    commandLanguage: { type: String, default: 'en-US' }
  },
  consentToVoiceProcess: { type: Boolean, default: false },
}, { timestamps: true });

// Hash passwords prior to saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Helper validation mechanism
UserSchema.methods.comparePassword = async function(cand: string): Promise<boolean> {
  return bcrypt.compare(cand, this.password);
};

export const User = mongoose.model('User', UserSchema);
