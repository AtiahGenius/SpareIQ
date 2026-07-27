import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { addToOutbox } from '../services/outboxService.js';

const router = express.Router();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/v1/receipts
router.get('/', authenticateToken, async (req, res) => {
  const { supplier, search } = req.query;

  try {
    const where = {};
    if (supplier && supplier !== 'All Suppliers') {
      where.supplier = { name: supplier };
    }
    if (search) {
      const q = search.trim();
      where.OR = [
        { receiptNo: { contains: q } },
        { invoiceNo: { contains: q } },
        { notes: { contains: q } },
        { supplier: { name: { contains: q } } }
      ];
    }

    const receipts = await prisma.receipt.findMany({
      where,
      include: {
        supplier: true,
        items: true,
        uploadedBy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = receipts.map(r => ({
      id: r.id,
      receiptNo: r.receiptNo,
      invoiceNo: r.invoiceNo,
      supplier: r.supplier.name,
      date: r.date,
      time: r.time,
      currency: r.currency,
      subtotal: r.subtotal,
      discount: r.discount,
      tax: r.tax,
      grandTotal: r.grandTotal,
      notes: r.notes,
      imageDataUrl: r.imageDataUrl,
      status: r.status,
      items: r.items,
      uploadedByName: r.uploadedBy?.name || r.uploadedById
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('Error fetching receipts:', err);
    return res.status(500).json({ error: 'Failed to fetch receipts.' });
  }
});

// POST /api/v1/receipts (Save verified receipt + Restock Inventory)
router.post('/', authenticateToken, upload.single('photo'), async (req, res) => {
  const { supplier, invoiceNo, date, time, currency, subtotal, discount, tax, grandTotal, notes, items: itemsJson } = req.body;

  if (!supplier || !invoiceNo || !grandTotal) {
    return res.status(400).json({ error: 'Supplier, Invoice #, and Grand Total are required.' });
  }

  let parsedItems = [];
  if (typeof itemsJson === 'string') {
    try { parsedItems = JSON.parse(itemsJson); } catch (e) {}
  } else if (Array.isArray(req.body.items)) {
    parsedItems = req.body.items;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find or create supplier
      const supplierRecord = await tx.supplier.upsert({
        where: { name: supplier.trim() },
        update: {},
        create: { name: supplier.trim() }
      });

      // 2. Generate Receipt No
      const receiptsCount = await tx.receipt.count();
      const receiptNo = `R-${String(receiptsCount + 1).padStart(5, '0')}`;

      let imageDataUrl = null;
      if (req.file) {
        imageDataUrl = `/uploads/${req.file.filename}`;
      } else if (req.body.imageDataUrl) {
        imageDataUrl = req.body.imageDataUrl;
      }

      const duplicate = await tx.receipt.findFirst({
        where: {
          supplierId: supplierRecord.id,
          invoiceNo: invoiceNo.trim()
        }
      });
      const status = duplicate ? 'duplicate' : 'verified';

      // 3. Create Receipt record
      const receipt = await tx.receipt.create({
        data: {
          receiptNo,
          invoiceNo: invoiceNo.trim(),
          supplierId: supplierRecord.id,
          date: date || new Date().toISOString().split('T')[0],
          time: time || new Date().toTimeString().split(' ')[0].substring(0, 5),
          currency: currency || 'GHS',
          subtotal: parseFloat(subtotal || grandTotal),
          discount: parseFloat(discount || 0),
          tax: parseFloat(tax || 0),
          grandTotal: parseFloat(grandTotal),
          notes: notes ? notes.trim() : null,
          imageDataUrl,
          status,
          uploadedById: req.user.id
        }
      });

      // 4. Save Receipt Items & Auto-Restock Inventory
      const createdItems = [];
      for (const item of parsedItems) {
        let invItem = await tx.inventoryItem.findUnique({ where: { code: item.code } });

        if (invItem) {
          await tx.inventoryItem.update({
            where: { id: invItem.id },
            data: {
              stock: { increment: item.qty },
              costPrice: parseFloat(item.unitPrice)
            }
          });
        } else {
          invItem = await tx.inventoryItem.create({
            data: {
              code: item.code,
              name: item.name,
              category: 'General',
              costPrice: parseFloat(item.unitPrice),
              sellingPrice: parseFloat(item.unitPrice) * 1.5,
              stock: item.qty,
              minStock: 5
            }
          });
        }

        const rItem = await tx.receiptItem.create({
          data: {
            receiptId: receipt.id,
            inventoryItemId: invItem.id,
            code: item.code,
            name: item.name,
            qty: item.qty,
            unitPrice: parseFloat(item.unitPrice),
            total: parseFloat(item.total)
          }
        });

        await tx.stockLog.create({
          data: {
            inventoryItemId: invItem.id,
            code: invItem.code,
            name: invItem.name,
            type: 'PURCHASED',
            change: item.qty,
            user: req.user.name
          }
        });

        createdItems.push(rItem);
      }

      await tx.auditLog.create({
        data: {
          user: `${req.user.name} (${req.user.id})`,
          action: 'RECEIPT_SAVED',
          detail: `Saved receipt ${receiptNo} from ${supplierRecord.name} (Invoice: ${invoiceNo}, Total: GHS ${grandTotal})`,
          empId: req.user.id
        }
      });

      // Enqueue to Outbox Sync
      await addToOutbox(tx, 'Receipt', receipt.id, 'CREATE', { ...receipt, items: createdItems, supplierName: supplierRecord.name });

      return {
        ...receipt,
        supplier: supplierRecord.name,
        items: createdItems
      };
    });

    return res.status(201).json(result);
  } catch (err) {
    console.error('Error saving receipt:', err);
    return res.status(500).json({ error: 'Failed to save receipt.' });
  }
});

// DELETE /api/v1/receipts/:id (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await prisma.receipt.delete({
      where: { id: parseInt(id) }
    });

    await prisma.auditLog.create({
      data: {
        user: `${req.user.name} (${req.user.id})`,
        action: 'RECEIPT_DELETED',
        detail: `Deleted receipt ${deleted.receiptNo} (Invoice: ${deleted.invoiceNo})`,
        empId: req.user.id
      }
    });

    await addToOutbox(prisma, 'Receipt', deleted.id, 'DELETE', deleted);

    return res.json({ message: `Receipt ${deleted.receiptNo} deleted.` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete receipt.' });
  }
});

export default router;
