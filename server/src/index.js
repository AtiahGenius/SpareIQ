import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { seedDatabase } from './seed.js';
import { startSyncWorker } from './services/syncWorker.js';

import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import inventoryRoutes from './routes/inventory.js';
import receiptRoutes from './routes/receipts.js';
import saleRoutes from './routes/sales.js';
import supplierRoutes from './routes/suppliers.js';
import reportRoutes from './routes/reports.js';
import aiRoutes from './routes/ai.js';
import auditLogRoutes from './routes/auditLog.js';
import settingsRoutes from './routes/settings.js';
import syncRoutes from './routes/sync.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static upload folder for receipt photos
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Health Check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', service: 'SpareIQ Backend API', time: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/receipts', receiptRoutes);
app.use('/api/v1/sales', saleRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/audit-log', auditLogRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/sync', syncRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal server error occurred.' });
});

// Start Server
app.listen(PORT, async () => {
  console.log(`🚀 SpareIQ Backend Server running on http://localhost:${PORT}`);
  try {
    await seedDatabase();
    startSyncWorker();
  } catch (err) {
    console.error('Startup initialization error:', err);
  }
});
