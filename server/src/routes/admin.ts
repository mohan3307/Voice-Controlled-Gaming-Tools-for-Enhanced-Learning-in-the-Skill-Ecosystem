import { Router, Response } from 'express';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// GET all audit logs (Admin only)
router.get('/audit', authenticateToken, requireRole(['Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await AuditLog.find()
      .populate('user', 'username email role')
      .sort({ timestamp: -1 })
      .limit(100);
    return res.json({ success: true, logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET all users details (Admin or Organizations)
router.get('/users', authenticateToken, requireRole(['Admin', 'Organization']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.json({ success: true, users });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE user roles and settings
router.put('/users/:id/role', authenticateToken, requireRole(['Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.body;
    if (!['Student', 'Instructor', 'Admin', 'Organization'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid target role description' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const previousRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();

    // Create Audit Log
    await AuditLog.create({
      user: req.user?.id,
      action: 'ROLE_UPDATED',
      details: `Elevated or shifted user ${targetUser.username} role from ${previousRole} to ${role}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.json({ success: true, message: 'User role updated successfully', user: targetUser });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
