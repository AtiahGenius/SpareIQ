import express from 'express';
import { prisma } from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { addToOutbox } from '../services/outboxService.js';

const router = express.Router();

// GET /api/v1/inventory
router.get('/', authenticateToken, async (req, res) => {
  const { search, category, status } = req.query;

  try {
    const where = {};
    if (status) {
      where.status = status;
    }
    if (category && category !== 'All Categories') {
      where.category = category;
    }
    if (search) {
      const q = search.trim();
      where.OR = [
        { code: { contains: q } },
        { name: { contains: q } },
        { category: { contains: q } },
        { models: { contains: q } },
        { barcode: { contains: q } }
      ];
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    return res.json(items);
  } catch (err) {
    console.error('Inventory fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch inventory.' });
  }
});

// POST /api/v1/inventory (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { code, barcode, name, description, category, models, unit, costPrice, sellingPrice, stock, minStock } = req.body;

  if (!code || !name || costPrice === undefined || sellingPrice === undefined) {
    return res.status(400).json({ error: 'Code, Name, Cost Price, and Selling Price are required.' });
  }

  try {
    const newItem = await prisma.$transaction(async (tx) => {
      const created = await tx.inventoryItem.create({
        data: {
          code: code.trim(),
          barcode: barcode ? barcode.trim() : null,
          name: name.trim(),
          description: description ? description.trim() : null,
          category: category ? category.trim() : 'General',
          models: models ? models.trim() : null,
          unit: unit || 'pc',
          costPrice: parseFloat(costPrice),
          sellingPrice: parseFloat(sellingPrice),
          stock: parseInt(stock || 0),
          minStock: parseInt(minStock || 5),
          status: 'active'
        }
      });

      if (created.stock > 0) {
        await tx.stockLog.create({
          data: {
            inventoryItemId: created.id,
            code: created.code,
            name: created.name,
            type: 'OPENING_STOCK',
            change: created.stock,
            user: req.user.name
          }
        });
      }

      await tx.auditLog.create({
        data: {
          user: `${req.user.name} (${req.user.id})`,
          action: 'INVENTORY_ITEM_CREATED',
          detail: `Created part ${created.code} - ${created.name} (Stock: ${created.stock})`,
          empId: req.user.id
        }
      });

      // Queue Outbox Item for Cloud Sync
      await addToOutbox(tx, 'InventoryItem', created.id, 'CREATE', created);

      return created;
    });

    return res.status(201).json(newItem);
  } catch (err) {
    console.error('Inventory creation error:', err);
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'An item with this Part Code already exists.' });
    }
    return res.status(500).json({ error: 'Failed to create inventory item.' });
  }
});

// PATCH /api/v1/inventory/:code/price (Admin only)
router.patch('/:code/price', authenticateToken, requireAdmin, async (req, res) => {
  const { code } = req.params;
  const { costPrice, sellingPrice } = req.body;

  try {
    const existing = await prisma.inventoryItem.findUnique({ where: { code } });
    if (!existing) {
      return res.status(404).json({ error: 'Inventory item not found.' });
    }

    const data = {};
    if (costPrice !== undefined) data.costPrice = parseFloat(costPrice);
    if (sellingPrice !== undefined) data.sellingPrice = parseFloat(sellingPrice);

    const updated = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.update({
        where: { code },
        data
      });

      await tx.auditLog.create({
        data: {
          user: `${req.user.name} (${req.user.id})`,
          action: 'PRICE_UPDATE',
          detail: `Updated ${code} price -> Cost: GHS ${item.costPrice.toFixed(2)}, Selling: GHS ${item.sellingPrice.toFixed(2)}`,
          empId: req.user.id
        }
      });

      await addToOutbox(tx, 'InventoryItem', item.id, 'UPDATE', item);

      return item;
    });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update item price.' });
  }
});

// DELETE /api/v1/inventory/:code (Admin only)
router.delete('/:code', authenticateToken, requireAdmin, async (req, res) => {
  const { code } = req.params;

  try {
    const deleted = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.update({
        where: { code },
        data: { status: 'disabled' }
      });

      await tx.auditLog.create({
        data: {
          user: `${req.user.name} (${req.user.id})`,
          action: 'INVENTORY_ITEM_DISABLED',
          detail: `Disabled item ${code} - ${item.name}`,
          empId: req.user.id
        }
      });

      await addToOutbox(tx, 'InventoryItem', item.id, 'DELETE', item);

      return item;
    });

    return res.json({ message: `Item ${code} disabled successfully.` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete inventory item.' });
  }
});

// POST /api/v1/inventory/import-csv (Admin only)
router.post('/import-csv', authenticateToken, requireAdmin, async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No items provided for CSV import.' });
  }

  let importedCount = 0;
  try {
    for (const item of items) {
      if (!item.code || !item.name) continue;

      const upserted = await prisma.inventoryItem.upsert({
        where: { code: item.code.trim() },
        update: {
          name: item.name.trim(),
          category: item.category || 'General',
          models: item.models || null,
          costPrice: parseFloat(item.costPrice || 0),
          sellingPrice: parseFloat(item.sellingPrice || 0),
          stock: parseInt(item.stock || 0),
          minStock: parseInt(item.minStock || 5)
        },
        create: {
          code: item.code.trim(),
          barcode: item.barcode || null,
          name: item.name.trim(),
          category: item.category || 'General',
          models: item.models || null,
          costPrice: parseFloat(item.costPrice || 0),
          sellingPrice: parseFloat(item.sellingPrice || 0),
          stock: parseInt(item.stock || 0),
          minStock: parseInt(item.minStock || 5)
        }
      });

      await addToOutbox(prisma, 'InventoryItem', upserted.id, 'UPDATE', upserted);
      importedCount++;
    }

    await prisma.auditLog.create({
      data: {
        user: `${req.user.name} (${req.user.id})`,
        action: 'CSV_IMPORT',
        detail: `Imported ${importedCount} items from CSV`,
        empId: req.user.id
      }
    });

    return res.json({ message: `Successfully imported ${importedCount} items.` });
  } catch (err) {
    console.error('CSV import error:', err);
    return res.status(500).json({ error: 'Failed to process CSV import.' });
  }
});

export default router;
