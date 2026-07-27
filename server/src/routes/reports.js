import express from 'express';
import { prisma } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/v1/reports/summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const receipts = await prisma.receipt.findMany({ include: { items: true } });
    const sales = await prisma.sale.findMany({ include: { items: true } });
    const inventory = await prisma.inventoryItem.findMany();

    const totalReceipts = receipts.length;
    const totalPurchaseSpend = receipts.reduce((acc, r) => acc + r.grandTotal, 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.date === todayStr);
    const revenueToday = todaySales.reduce((acc, s) => acc + s.grandTotal, 0);
    const profitToday = todaySales.reduce((acc, s) => acc + s.items.reduce((sum, i) => sum + i.profit, 0), 0);

    const revenueMonth = sales.reduce((acc, s) => acc + s.grandTotal, 0);
    const profitMonth = sales.reduce((acc, s) => acc + s.items.reduce((sum, i) => sum + i.profit, 0), 0);

    const totalStockQty = inventory.reduce((acc, i) => acc + i.stock, 0);
    const totalStockValue = inventory.reduce((acc, i) => acc + (i.stock * i.costPrice), 0);
    const lowStockCount = inventory.filter(i => i.stock <= i.minStock).length;

    return res.json({
      totalReceipts,
      totalPurchaseSpend,
      revenueToday,
      profitToday,
      revenueMonth,
      profitMonth,
      totalStockQty,
      totalStockValue,
      lowStockCount
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate summary metrics.' });
  }
});

// GET /api/v1/reports/monthly-purchases
router.get('/monthly-purchases', authenticateToken, async (req, res) => {
  try {
    const receipts = await prisma.receipt.findMany();
    const months = {};

    receipts.forEach(r => {
      const monthKey = r.date ? r.date.substring(0, 7) : 'Unknown';
      if (!months[monthKey]) {
        months[monthKey] = { month: monthKey, receiptsCount: 0, totalAmount: 0 };
      }
      months[monthKey].receiptsCount += 1;
      months[monthKey].totalAmount += r.grandTotal;
    });

    const report = Object.values(months).sort((a, b) => b.month.localeCompare(a.month));
    return res.json(report);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate monthly purchase report.' });
  }
});

export default router;
