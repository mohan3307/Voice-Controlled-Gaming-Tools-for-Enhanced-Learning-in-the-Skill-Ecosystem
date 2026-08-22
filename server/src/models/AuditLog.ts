import mongoose, { Schema } from 'mongoose';

const AuditLogSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  action: { type: String, required: true }, // e.g. "USER_LOGIN_SUCCESS", "ROLE_UPDATED", "AUTH_FAILURE"
  details: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: false });

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
