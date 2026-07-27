import express from 'express';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  const { id, password } = req.body;

  if (!id || !password) {
    return res.status(400).json({ error: 'Employee ID and password are required.' });
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { id: id.trim() }
    });

    if (!employee) {
      return res.status(401).json({ error: 'Invalid Employee ID or password.' });
    }

    if (employee.status === 'disabled') {
      return res.status(403).json({ error: 'Account is disabled. Contact your administrator.' });
    }

    const isValidPassword = await argon2.verify(employee.passwordHash, password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid Employee ID or password.' });
    }

    const secret = process.env.JWT_SECRET || 'spareiq_super_secret_jwt_key_998877665544332211';
    const token = jwt.sign(
      { id: employee.id, name: employee.name, role: employee.role },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    await prisma.auditLog.create({
      data: {
        user: `${employee.name} (${employee.id})`,
        action: 'USER_LOGIN',
        detail: `Logged in as ${employee.role}`,
        empId: employee.id
      }
    });

    return res.json({
      token,
      user: {
        id: employee.id,
        name: employee.name,
        role: employee.role,
        status: employee.status,
        branch: employee.branch
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server login error.' });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    await prisma.auditLog.create({
      data: {
        user: `${req.user.name} (${req.user.id})`,
        action: 'USER_LOGOUT',
        detail: 'Session ended',
        empId: req.user.id
      }
    });
    return res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Logout audit log error.' });
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticateToken, (req, res) => {
  return res.json({ user: req.user });
});

export default router;
