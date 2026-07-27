import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'spareiq_super_secret_jwt_key_998877665544332211');
    const employee = await prisma.employee.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, role: true, status: true, branch: true }
    });

    if (!employee || employee.status === 'disabled') {
      return res.status(403).json({ error: 'Account is disabled or does not exist.' });
    }

    req.user = employee;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
};
