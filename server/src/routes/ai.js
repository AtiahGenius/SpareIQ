import express from 'express';
import { prisma } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/v1/ai/query
router.post('/query', authenticateToken, async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query prompt is required.' });
  }

  const q = query.toLowerCase().trim();

  try {
    const receipts = await prisma.receipt.findMany({ include: { supplier: true, items: true } });
    const inventory = await prisma.inventoryItem.findMany();
    const sales = await prisma.sale.findMany({ include: { items: true } });

    let responseText = '';
    let tableData = null;

    if (q.includes('spend') || q.includes('total spent') || q.includes('wholesaler') || q.includes('supplier')) {
      const supplierSpend = {};
      receipts.forEach(r => {
        const sName = r.supplier?.name || 'Unknown';
        supplierSpend[sName] = (supplierSpend[sName] || 0) + r.grandTotal;
      });

      const rows = Object.entries(supplierSpend).map(([name, spend]) => ({ supplier: name, totalSpent: `GHS ${spend.toFixed(2)}` }));
      responseText = `Here is your total purchase spend breakdown across suppliers:`;
      tableData = { headers: ['Supplier', 'Total Spent'], rows };
    } else if (q.includes('low stock') || q.includes('reorder') || q.includes('minimum stock')) {
      const lowItems = inventory.filter(i => i.stock <= i.minStock);
      if (lowItems.length === 0) {
        responseText = `All inventory stock levels are healthy! No items are currently at or below minimum stock threshold.`;
      } else {
        const rows = lowItems.map(i => ({ code: i.code, name: i.name, currentStock: i.stock, minStock: i.minStock }));
        responseText = `Found ${lowItems.length} items that require reordering:`;
        tableData = { headers: ['Part Code', 'Part Name', 'Stock', 'Min Threshold'], rows };
      }
    } else if (q.includes('sale') || q.includes('revenue') || q.includes('profit')) {
      const totalRev = sales.reduce((acc, s) => acc + s.grandTotal, 0);
      const totalProfit = sales.reduce((acc, s) => acc + s.items.reduce((sum, i) => sum + i.profit, 0), 0);

      responseText = `Total sales revenue recorded to date is **GHS ${totalRev.toFixed(2)}** with an estimated gross profit of **GHS ${totalProfit.toFixed(2)}** across ${sales.length} completed transactions.`;
    } else {
      responseText = `Based on your request "${query}", I retrieved ${receipts.length} saved supplier receipts, ${inventory.length} catalog items, and ${sales.length} POS sales transactions. All database metrics are synced.`;
    }

    return res.json({ response: responseText, tableData });
  } catch (err) {
    return res.status(500).json({ error: 'AI query processing failed.' });
  }
});

export default router;
