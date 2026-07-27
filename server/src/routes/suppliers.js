import express from 'express';
import { prisma } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/v1/suppliers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        receipts: {
          select: { id: true, grandTotal: true, date: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const formatted = suppliers.map(s => {
      const receiptCount = s.receipts.length;
      const totalSpent = s.receipts.reduce((sum, r) => sum + r.grandTotal, 0);
      const lastReceiptDate = s.receipts.length > 0 ? s.receipts[s.receipts.length - 1].date : 'Never';

      return {
        id: s.id,
        name: s.name,
        phone: s.phone || 'N/A',
        address: s.address || 'N/A',
        receiptCount,
        totalSpent,
        lastReceiptDate
      };
    });

    return res.json(formatted);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch suppliers.' });
  }
});

// POST /api/v1/suppliers
router.post('/', authenticateToken, async (req, res) => {
  const { name, phone, address } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Supplier name is required.' });
  }

  try {
    const supplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        address: address ? address.trim() : null
      }
    });

    await prisma.auditLog.create({
      data: {
        user: `${req.user.name} (${req.user.id})`,
        action: 'SUPPLIER_CREATED',
        detail: `Created supplier ${supplier.name}`,
        empId: req.user.id
      }
    });

    return res.status(201).json(supplier);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Supplier name already exists.' });
    }
    return res.status(500).json({ error: 'Failed to create supplier.' });
  }
});

export default router;
