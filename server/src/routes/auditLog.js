import express from 'express';
import { prisma } from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/v1/audit-log (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100
    });
    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch audit log.' });
  }
});

export default router;
