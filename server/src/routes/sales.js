import express from 'express';
import { prisma } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/v1/sales
router.get('/', authenticateToken, async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        items: true,
        employee: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = sales.map(s => ({
      id: s.id,
      txnId: s.txnId,
      receiptNo: s.receiptNo,
      date: s.date,
      time: s.time,
      empId: s.empId,
      empName: s.employee?.name || s.empId,
      subtotal: s.subtotal,
      discount: s.discount,
      tax: s.tax,
      grandTotal: s.grandTotal,
      amountPaid: s.amountPaid,
      balance: s.balance,
      paymentMethod: s.paymentMethod,
      items: s.items
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('Error fetching sales:', err);
    return res.status(500).json({ error: 'Failed to fetch sales history.' });
  }
});

// POST /api/v1/sales (POS Checkout - Atomic DB Transaction)
router.post('/', authenticateToken, async (req, res) => {
  const { cartItems, subtotal, discount, tax, grandTotal, amountPaid, balance, paymentMethod } = req.body;

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ error: 'Cart is empty. Cannot process sale.' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify stock availability for all cart items
      for (const item of cartItems) {
        const product = await tx.inventoryItem.findUnique({ where: { code: item.code } });
        if (!product) {
          throw new Error(`Product ${item.code} not found in inventory.`);
        }
        if (product.stock < item.qty) {
          throw new Error(`Insufficient stock for ${product.name} (Available: ${product.stock}, Requested: ${item.qty}).`);
        }
      }

      // 2. Generate sequential ReceiptNo & TxnID
      const salesCount = await tx.sale.count();
      const nextNum = salesCount + 1;
      const receiptNo = `S-${String(nextNum).padStart(5, '0')}`;
      const txnId = `TXN-${String(nextNum).padStart(5, '0')}`;

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

      // 3. Create Sale record
      const sale = await tx.sale.create({
        data: {
          txnId,
          receiptNo,
          date: dateStr,
          time: timeStr,
          empId: req.user.id,
          subtotal: parseFloat(subtotal),
          discount: parseFloat(discount || 0),
          tax: parseFloat(tax || 0),
          grandTotal: parseFloat(grandTotal),
          amountPaid: parseFloat(amountPaid),
          balance: parseFloat(balance),
          paymentMethod: paymentMethod || 'CASH'
        }
      });

      // 4. Create SaleItems & Deduct Stock
      const createdItems = [];
      for (const item of cartItems) {
        const product = await tx.inventoryItem.findUnique({ where: { code: item.code } });
        const itemTotal = parseFloat(item.total);
        const itemProfit = itemTotal - (product.costPrice * item.qty);

        const saleItem = await tx.saleItem.create({
          data: {
            saleId: sale.id,
            inventoryItemId: product.id,
            code: product.code,
            name: product.name,
            qty: item.qty,
            sellingPrice: parseFloat(item.sellingPrice),
            costPrice: product.costPrice,
            total: itemTotal,
            profit: itemProfit
          }
        });

        // Deduct stock
        await tx.inventoryItem.update({
          where: { id: product.id },
          data: { stock: { decrement: item.qty } }
        });

        // Create Stock Log entry
        await tx.stockLog.create({
          data: {
            inventoryItemId: product.id,
            code: product.code,
            name: product.name,
            type: 'SOLD',
            change: -item.qty,
            user: req.user.name
          }
        });

        // Create Sync Outbox entry for offline-cloud sync
        await tx.syncOutbox.create({
          data: {
            entityType: 'SaleItem',
            entityId: saleItem.id,
            operation: 'CREATE',
            payloadJson: JSON.stringify(saleItem)
          }
        });

        createdItems.push(saleItem);
      }

      // 5. Create Sync Outbox entry for parent Sale
      await tx.syncOutbox.create({
        data: {
          entityType: 'Sale',
          entityId: String(sale.id),
          operation: 'CREATE',
          payloadJson: JSON.stringify(sale)
        }
      });

      // 6. Log Audit Trail
      await tx.auditLog.create({
        data: {
          user: `${req.user.name} (${req.user.id})`,
          action: 'POS_SALE_COMPLETED',
          detail: `Completed sale ${receiptNo} (${txnId}) total GHS ${grandTotal.toFixed(2)} [${paymentMethod}]`,
          empId: req.user.id
        }
      });

      return {
        ...sale,
        empName: req.user.name,
        items: createdItems
      };
    });

    return res.status(201).json(result);
  } catch (err) {
    console.error('POS Checkout Transaction Error:', err);
    return res.status(400).json({ error: err.message || 'Transaction failed.' });
  }
});

// GET /api/v1/sales/:id
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const sale = await prisma.sale.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: true,
        employee: { select: { id: true, name: true } }
      }
    });

    if (!sale) {
      return res.status(404).json({ error: 'Sale record not found.' });
    }

    return res.json({
      ...sale,
      empName: sale.employee?.name || sale.empId
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch sale.' });
  }
});

export default router;
