import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'voice_learning_super_secret_key_2026';

// Register User
router.post('/register', authLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username, email, password, role, consentToVoiceProcess } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All credentials are required' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Username or Email already registered' });
    }

    const newUser = new User({
      username,
      email,
      password,
      role: role || 'Student',
      consentToVoiceProcess: !!consentToVoiceProcess
    });

    await newUser.save();

    // Create Audit Log
    await AuditLog.create({
      user: newUser._id,
      action: 'USER_REGISTRATION',
      details: `Account registered with role: ${newUser.role}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully. You can now login.'
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Login User
router.post('/login', authLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ success: false, message: 'Username/Email and Password are required' });
    }

    const user = await User.findOne({
      $or: [{ email: emailOrUsername.toLowerCase() }, { username: emailOrUsername }]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await (user as any).comparePassword(password);
    if (!isMatch) {
      // Audit log failed attempt
      await AuditLog.create({
        action: 'AUTH_FAILURE',
        details: `Failed credentials attempt for user: ${emailOrUsername}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update streak and last active
    const today = new Date();
    const lastActive = new Date(user.lastActive);
    const diffTime = Math.abs(today.getTime() - lastActive.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      user.streakCount += 1;
    } else if (diffDays > 1) {
      user.streakCount = 1; // Reset streak
    }
    user.lastActive = today;
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Audit Log success
    await AuditLog.create({
      user: user._id,
      action: 'USER_LOGIN_SUCCESS',
      details: 'Login verified successfully',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        xp: user.xp,
        level: user.level,
        streakCount: user.streakCount,
        microphoneSettings: user.microphoneSettings,
        consentToVoiceProcess: user.consentToVoiceProcess
      }
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get user profile detail
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, user });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Update microphone and speech engine preferences
router.put('/settings', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { microphoneSettings, consentToVoiceProcess } = req.body;
    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (microphoneSettings) {
      user.microphoneSettings = { ...user.microphoneSettings, ...microphoneSettings };
    }
    if (typeof consentToVoiceProcess !== 'undefined') {
      user.consentToVoiceProcess = consentToVoiceProcess;
    }

    await user.save();
    return res.json({
      success: true,
      message: 'Preferences updated successfully',
      settings: {
        microphoneSettings: user.microphoneSettings,
        consentToVoiceProcess: user.consentToVoiceProcess
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
