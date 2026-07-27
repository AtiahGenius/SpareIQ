import express from 'express';
import { prisma } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { triggerSyncCycle } from '../services/syncWorker.js';

const router = express.Router();

// GET /api/v1/sync/status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const pendingCount = await prisma.syncOutbox.count({ where: { status: 'PENDING' } });
    const syncingCount = await prisma.syncOutbox.count({ where: { status: 'SYNCING' } });
    const syncedCount = await prisma.syncOutbox.count({ where: { status: 'SYNCED' } });
    const failedCount = await prisma.syncOutbox.count({ where: { status: 'FAILED' } });

    const metadata = await prisma.syncMetadata.findUnique({ where: { id: 1 } });

    return res.json({
      appMode: process.env.APP_MODE || 'desktop_offline',
      branchId: process.env.BRANCH_ID || 'BRANCH-ACCRA-01',
      isOnline: metadata?.isOnline || false,
      lastSyncedAt: metadata?.lastSyncedAt || null,
      queue: {
        pending: pendingCount,
        syncing: syncingCount,
        synced: syncedCount,
        failed: failedCount,
        total: pendingCount + syncingCount + syncedCount + failedCount
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch sync status.' });
  }
});

// POST /api/v1/sync/push (Cloud Server Handler for Incoming Desktop Outbox Items)
router.post('/push', async (req, res) => {
  const { branchId, outboxItems } = req.body;

  if (!Array.isArray(outboxItems) || outboxItems.length === 0) {
    return res.json({ syncedOutboxIds: [], serverTimestamp: new Date().toISOString() });
  }

  const syncedOutboxIds = [];
  const errors = [];

  try {
    for (const item of outboxItems) {
      try {
        const payload = typeof item.payloadJson === 'string' ? JSON.parse(item.payloadJson) : item.payloadJson;

        if (item.entityType === 'Sale') {
          // Sync Sale
          const exists = await prisma.sale.findUnique({ where: { txnId: payload.txnId } });
          if (!exists) {
            await prisma.sale.create({
              data: {
                txnId: payload.txnId,
                receiptNo: payload.receiptNo,
                date: payload.date,
                time: payload.time,
                empId: payload.empId || 'EMP0001',
                subtotal: parseFloat(payload.subtotal),
                discount: parseFloat(payload.discount || 0),
                tax: parseFloat(payload.tax || 0),
                grandTotal: parseFloat(payload.grandTotal),
                amountPaid: parseFloat(payload.amountPaid),
                balance: parseFloat(payload.balance),
                paymentMethod: payload.paymentMethod || 'CASH'
              }
            });
          }
        } else if (item.entityType === 'InventoryItem') {
          // Sync Inventory Item (Last Write Wins)
          await prisma.inventoryItem.upsert({
            where: { code: payload.code },
            update: {
              name: payload.name,
              category: payload.category,
              costPrice: parseFloat(payload.costPrice),
              sellingPrice: parseFloat(payload.sellingPrice),
              stock: parseInt(payload.stock),
              minStock: parseInt(payload.minStock)
            },
            create: {
              code: payload.code,
              barcode: payload.barcode || null,
              name: payload.name,
              category: payload.category || 'General',
              costPrice: parseFloat(payload.costPrice),
              sellingPrice: parseFloat(payload.sellingPrice),
              stock: parseInt(payload.stock),
              minStock: parseInt(payload.minStock)
            }
          });
        } else if (item.entityType === 'AuditLog') {
          await prisma.auditLog.create({
            data: {
              user: payload.user || 'SYNC_WORKER',
              action: payload.action,
              detail: payload.detail
            }
          });
        }

        syncedOutboxIds.push(item.id);
      } catch (itemErr) {
        console.error(`Sync push error for item ${item.id}:`, itemErr.message);
        errors.push({ id: item.id, error: itemErr.message });
      }
    }

    // Update metadata
    await prisma.syncMetadata.upsert({
      where: { id: 1 },
      update: { lastSyncedAt: new Date(), isOnline: true },
      create: { id: 1, lastSyncedAt: new Date(), isOnline: true }
    });

    return res.json({
      syncedOutboxIds,
      errors,
      serverTimestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Fatal sync push error:', err);
    return res.status(500).json({ error: 'Sync push handler encountered error.' });
  }
});

// GET /api/v1/sync/pull (Desktop Engine Fetching Cloud Changes)
router.get('/pull', async (req, res) => {
  const { since } = req.query;

  try {
    const sinceDate = since ? new Date(since) : new Date(0);

    const sales = await prisma.sale.findMany({
      where: { createdAt: { gt: sinceDate } },
      include: { items: true }
    });

    const inventory = await prisma.inventoryItem.findMany({
      where: { updatedAt: { gt: sinceDate } }
    });

    const receipts = await prisma.receipt.findMany({
      where: { createdAt: { gt: sinceDate } },
      include: { items: true, supplier: true }
    });

    return res.json({
      serverTimestamp: new Date().toISOString(),
      changes: {
        sales,
        inventory,
        receipts
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to pull cloud changes.' });
  }
});

// POST /api/v1/sync/trigger (Manual Sync Cycle Trigger)
router.post('/trigger', authenticateToken, async (req, res) => {
  try {
    const result = await triggerSyncCycle();
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Manual sync execution failed.' });
  }
});

export default router;
