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

// POST /api/v1/settings/backup (Admin only)
router.post('/backup', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const [employees, inventory, receipts, sales, suppliers, auditLogs, shopProfile] = await Promise.all([
      prisma.employee.findMany(),
      prisma.inventoryItem.findMany(),
      prisma.receipt.findMany({ include: { items: true } }),
      prisma.sale.findMany({ include: { items: true } }),
      prisma.supplier.findMany(),
      prisma.auditLog.findMany({ take: 200, orderBy: { timestamp: 'desc' } }),
      prisma.shopProfile.findUnique({ where: { id: 1 } })
    ]);

    const backupPayload = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      shopProfile,
      employees: employees.map(e => ({ ...e, passwordHash: 'REDACTED' })),
      inventory,
      receipts,
      sales,
      suppliers,
      auditLogs
    };

    const backupDir = path.join(process.cwd(), 'uploads', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const filename = `spareiq_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(backupDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(backupPayload, null, 2));

    await prisma.auditLog.create({
      data: {
        user: `${req.user.name} (${req.user.id})`,
        action: 'BACKUP_CREATED',
        detail: `Created system backup archive: ${filename}`,
        empId: req.user.id
      }
    });

    return res.json({
      success: true,
      filename,
      timestamp: backupPayload.timestamp,
      summary: {
        inventory: inventory.length,
        sales: sales.length,
        receipts: receipts.length,
        employees: employees.length
      }
    });
  } catch (err) {
    console.error('Backup API Error:', err);
    return res.status(500).json({ error: 'Failed to generate system backup.' });
  }
});

// POST /api/v1/settings/restore (Admin only)
router.post('/restore', authenticateToken, requireAdmin, async (req, res) => {
  const { inventory, receipts, sales, shopProfile } = req.body;

  try {
    if (shopProfile && shopProfile.name) {
      await prisma.shopProfile.upsert({
        where: { id: 1 },
        update: { name: shopProfile.name, address: shopProfile.address, phone: shopProfile.phone, logo: shopProfile.logo },
        create: { id: 1, name: shopProfile.name, address: shopProfile.address, phone: shopProfile.phone, logo: shopProfile.logo }
      });
    }

    if (Array.isArray(inventory)) {
      for (const item of inventory) {
        await prisma.inventoryItem.upsert({
          where: { code: item.code },
          update: {
            name: item.name,
            description: item.description || item.desc || '',
            category: item.category || 'General',
            models: item.models || '',
            unit: item.unit || 'pc',
            costPrice: Number(item.costPrice ?? item.cost ?? 0),
            sellingPrice: Number(item.sellingPrice ?? 0),
            stock: Number(item.stock ?? 0),
            minStock: Number(item.minStock ?? 5)
          },
          create: {
            id: item.id || `INV-${Date.now()}-${Math.random().toString(36).slice(-4)}`,
            code: item.code,
            name: item.name,
            description: item.description || item.desc || '',
            category: item.category || 'General',
            models: item.models || '',
            unit: item.unit || 'pc',
            costPrice: Number(item.costPrice ?? item.cost ?? 0),
            sellingPrice: Number(item.sellingPrice ?? 0),
            stock: Number(item.stock ?? 0),
            minStock: Number(item.minStock ?? 5)
          }
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        user: `${req.user.name} (${req.user.id})`,
        action: 'BACKUP_RESTORED',
        detail: `Restored system database from backup file`,
        empId: req.user.id
      }
    });

    return res.json({ success: true, message: 'Database successfully restored from backup file!' });
  } catch (err) {
    console.error('Restore API Error:', err);
    return res.status(500).json({ error: 'Failed to restore database from backup.' });
  }
});

export default router;
