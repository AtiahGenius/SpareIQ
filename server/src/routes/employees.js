import express from 'express';
import argon2 from 'argon2';
import { prisma } from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/v1/employees
router.get('/', authenticateToken, async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        status: true,
        branch: true,
        createdAt: true
      },
      orderBy: { id: 'asc' }
    });
    return res.json(employees);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch employees.' });
  }
});

// GET /api/v1/employees/leaderboard
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        items: true,
        employee: { select: { id: true, name: true, role: true } }
      }
    });

    const stats = {};

    for (const sale of sales) {
      const empId = sale.empId;
      if (!stats[empId]) {
        stats[empId] = {
          id: empId,
          name: sale.employee?.name || empId,
          role: sale.employee?.role || 'cashier',
          salesCount: 0,
          totalRevenue: 0,
          totalProfit: 0
        };
      }
      stats[empId].salesCount += 1;
      stats[empId].totalRevenue += sale.grandTotal;

      const saleProfit = sale.items.reduce((acc, i) => acc + i.profit, 0);
      stats[empId].totalProfit += saleProfit;
    }

    const leaderboard = Object.values(stats).sort((a, b) => b.totalRevenue - a.totalRevenue);
    return res.json(leaderboard);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to calculate leaderboard.' });
  }
});

// POST /api/v1/employees (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { name, password, role } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: 'Name and initial password are required.' });
  }

  try {
    const empCount = await prisma.employee.count();
    const nextId = `EMP${String(empCount + 1).padStart(4, '0')}`;
    const passwordHash = await argon2.hash(password);

    const newEmp = await prisma.employee.create({
      data: {
        id: nextId,
        name: name.trim(),
        passwordHash,
        role: role === 'admin' ? 'admin' : 'cashier',
        status: 'active',
        branch: 'Main Shop'
      },
      select: { id: true, name: true, role: true, status: true, branch: true }
    });

    await prisma.auditLog.create({
      data: {
        user: `${req.user.name} (${req.user.id})`,
        action: 'EMPLOYEE_CREATED',
        detail: `Created account ${newEmp.name} (${newEmp.id}) as ${newEmp.role}`,
        empId: req.user.id
      }
    });

    return res.status(201).json(newEmp);
  } catch (err) {
    console.error('Error creating employee:', err);
    return res.status(500).json({ error: 'Failed to create employee.' });
  }
});

// PATCH /api/v1/employees/:id/password (Admin only)
router.patch('/:id/password', authenticateToken, requireAdmin, async (req, res) => {
  const { newPassword } = req.body;
  const { id } = req.params;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  try {
    const passwordHash = await argon2.hash(newPassword);
    const updated = await prisma.employee.update({
      where: { id },
      data: { passwordHash },
      select: { id: true, name: true }
    });

    await prisma.auditLog.create({
      data: {
        user: `${req.user.name} (${req.user.id})`,
        action: 'EMPLOYEE_PASSWORD_RESET',
        detail: `Reset password for ${updated.name} (${updated.id})`,
        empId: req.user.id
      }
    });

    return res.json({ message: `Password reset for ${updated.name} successfully.` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// PATCH /api/v1/employees/:id/status (Admin only)
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!['active', 'disabled'].includes(status)) {
    return res.status(400).json({ error: 'Status must be active or disabled.' });
  }

  try {
    const updated = await prisma.employee.update({
      where: { id },
      data: { status },
      select: { id: true, name: true, status: true }
    });

    await prisma.auditLog.create({
      data: {
        user: `${req.user.name} (${req.user.id})`,
        action: 'EMPLOYEE_STATUS_CHANGE',
        detail: `Set status of ${updated.name} (${updated.id}) to ${updated.status}`,
        empId: req.user.id
      }
    });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to change employee status.' });
  }
});

export default router;
