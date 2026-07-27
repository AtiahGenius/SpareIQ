import express from 'express';
import { prisma } from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/v1/settings/shop-profile
router.get('/shop-profile', authenticateToken, async (req, res) => {
  try {
    const profile = await prisma.shopProfile.findUnique({ where: { id: 1 } });
    return res.json(profile || { id: 1, name: 'SpareIQ Parts Shop', address: 'Abossey Okai, Accra', phone: '+233 24 000 0000', logo: '' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch shop profile.' });
  }
});

// PUT /api/v1/settings/shop-profile (Admin only)
router.put('/shop-profile', authenticateToken, requireAdmin, async (req, res) => {
  const { name, address, phone, logo } = req.body;

  try {
    const updated = await prisma.shopProfile.upsert({
      where: { id: 1 },
      update: { name, address, phone, logo },
      create: { id: 1, name, address, phone, logo }
    });

    await prisma.auditLog.create({
      data: {
        user: `${req.user.name} (${req.user.id})`,
        action: 'SHOP_PROFILE_UPDATED',
        detail: `Updated shop branding: ${updated.name}`,
        empId: req.user.id
      }
    });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update shop profile.' });
  }
});

export default router;
