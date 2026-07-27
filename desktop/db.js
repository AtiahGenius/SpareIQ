import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

let dbInstance = null;

export function initLocalDatabase(userDataPath) {
  const dbDir = userDataPath || path.join(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'spareiq_local.db');
  console.log(`📂 Initializing local SQLite database at: ${dbPath}`);

  sqlite3.verbose();
  dbInstance = new sqlite3.Database(dbPath);

  // Enable WAL & Foreign Keys
  dbInstance.serialize(() => {
    dbInstance.run('PRAGMA journal_mode = WAL;');
    dbInstance.run('PRAGMA foreign_keys = ON;');

    // Create Tables
    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS Employee (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        passwordHash TEXT NOT NULL,
        role TEXT DEFAULT 'cashier',
        status TEXT DEFAULT 'active',
        branch TEXT DEFAULT 'Main Shop',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS ShopProfile (
        id INTEGER PRIMARY KEY DEFAULT 1,
        name TEXT DEFAULT 'SpareIQ Parts Shop',
        address TEXT DEFAULT 'Abossey Okai, Accra',
        phone TEXT DEFAULT '+233 24 000 0000',
        logo TEXT,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS InventoryItem (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        barcode TEXT,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT DEFAULT 'General',
        models TEXT,
        unit TEXT DEFAULT 'pc',
        costPrice REAL NOT NULL,
        sellingPrice REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        minStock INTEGER DEFAULT 5,
        status TEXT DEFAULT 'active',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS Supplier (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        phone TEXT,
        address TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS Receipt (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receiptNo TEXT UNIQUE NOT NULL,
        invoiceNo TEXT NOT NULL,
        supplierId TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        currency TEXT DEFAULT 'GHS',
        subtotal REAL NOT NULL,
        discount REAL DEFAULT 0,
        tax REAL DEFAULT 0,
        grandTotal REAL NOT NULL,
        notes TEXT,
        imageDataUrl TEXT,
        status TEXT DEFAULT 'verified',
        uploadedById TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (supplierId) REFERENCES Supplier(id)
      );
    `);

    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS ReceiptItem (
        id TEXT PRIMARY KEY,
        receiptId INTEGER NOT NULL,
        inventoryItemId TEXT,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        qty INTEGER NOT NULL,
        unitPrice REAL NOT NULL,
        total REAL NOT NULL,
        FOREIGN KEY (receiptId) REFERENCES Receipt(id) ON DELETE CASCADE
      );
    `);

    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS Sale (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        txnId TEXT UNIQUE NOT NULL,
        receiptNo TEXT UNIQUE NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        empId TEXT NOT NULL,
        subtotal REAL NOT NULL,
        discount REAL DEFAULT 0,
        tax REAL DEFAULT 0,
        grandTotal REAL NOT NULL,
        amountPaid REAL NOT NULL,
        balance REAL NOT NULL,
        paymentMethod TEXT DEFAULT 'CASH',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empId) REFERENCES Employee(id)
      );
    `);

    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS SaleItem (
        id TEXT PRIMARY KEY,
        saleId INTEGER NOT NULL,
        inventoryItemId TEXT NOT NULL,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        qty INTEGER NOT NULL,
        sellingPrice REAL NOT NULL,
        costPrice REAL NOT NULL,
        total REAL NOT NULL,
        profit REAL NOT NULL,
        FOREIGN KEY (saleId) REFERENCES Sale(id) ON DELETE CASCADE
      );
    `);

    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS StockLog (
        id TEXT PRIMARY KEY,
        inventoryItemId TEXT NOT NULL,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        change INTEGER NOT NULL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        user TEXT NOT NULL
      );
    `);

    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS AuditLog (
        id TEXT PRIMARY KEY,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        user TEXT NOT NULL,
        action TEXT NOT NULL,
        detail TEXT,
        empId TEXT
      );
    `);

    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS SyncOutbox (
        id TEXT PRIMARY KEY,
        entityType TEXT NOT NULL,
        entityId TEXT NOT NULL,
        operation TEXT NOT NULL,
        payloadJson TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        retryCount INTEGER DEFAULT 0,
        errorMessage TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        syncedAt DATETIME
      );
    `);

    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS SyncMetadata (
        id INTEGER PRIMARY KEY DEFAULT 1,
        lastSyncedAt DATETIME,
        lastServerAnchor TEXT,
        isOnline INTEGER DEFAULT 0
      );
    `);
  });

  return dbInstance;
}

export function queryLocalDatabase(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) return reject(new Error('Database not initialized'));

    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      dbInstance.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    } else {
      dbInstance.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    }
  });
}

export function getLocalDatabase() {
  if (!dbInstance) {
    throw new Error('Local SQLite database not initialized.');
  }
  return dbInstance;
}
