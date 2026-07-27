import argon2 from 'argon2';
import { prisma } from './db.js';

export async function seedDatabase() {
  const empCount = await prisma.employee.count();
  if (empCount === 0) {
    console.log('Seeding initial database data...');
    const adminPasswordHash = await argon2.hash('admin123');
    const cashierPasswordHash = await argon2.hash('cashier123');

    await prisma.employee.createMany({
      data: [
        { id: 'EMP0001', name: 'Kwadwo Admin', passwordHash: adminPasswordHash, role: 'admin', status: 'active', branch: 'Main Shop' },
        { id: 'EMP0002', name: 'Abena Cashier', passwordHash: cashierPasswordHash, role: 'cashier', status: 'active', branch: 'Main Shop' },
        { id: 'EMP0003', name: 'Kofi Disabled', passwordHash: cashierPasswordHash, role: 'cashier', status: 'disabled', branch: 'Main Shop' }
      ]
    });

    await prisma.shopProfile.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'SpareIQ Parts Shop',
        address: 'Abossey Okai, Accra',
        phone: '+233 24 000 0000',
        logo: ''
      }
    });

    const sup1 = await prisma.supplier.create({ data: { name: 'Kwadwo Spares Ltd', phone: '0241234567', address: 'Abossey Okai' } });
    const sup2 = await prisma.supplier.create({ data: { name: 'Japan Motors Direct', phone: '0302987654', address: 'Graphic Road' } });
    await prisma.supplier.create({ data: { name: 'Apex Auto Wholesalers', phone: '0200001122', address: 'Tema Industrial Area' } });

    await prisma.inventoryItem.createMany({
      data: [
        { code: '0514000HS01L-01-001', barcode: '89350011001', name: 'Oil Filter C-110 (Toyota)', category: 'Engine', models: 'Corolla, Yaris, Vitz', costPrice: 25.00, sellingPrice: 45.00, stock: 12, minStock: 5 },
        { code: '0514000HS01L-01-002', barcode: '89350011002', name: 'Brake Pad Set (Front)', category: 'Brakes', models: 'Camry, RAV4', costPrice: 110.00, sellingPrice: 180.00, stock: 8, minStock: 3 },
        { code: '0514000HS01L-01-003', barcode: '89350011003', name: 'Spark Plug Iridium (NGK)', category: 'Ignition', models: 'Universal Toyota/Honda', costPrice: 35.00, sellingPrice: 60.00, stock: 24, minStock: 10 },
        { code: '0514000HS01L-01-004', barcode: '89350011004', name: 'Air Filter Element', category: 'Filters', models: 'Civic, CR-V', costPrice: 40.00, sellingPrice: 75.00, stock: 4, minStock: 5 },
        { code: '0514000HS01L-01-005', barcode: '89350011005', name: 'Shock Absorber Rear', category: 'Suspension', models: 'Hyundai Elantra', costPrice: 280.00, sellingPrice: 420.00, stock: 6, minStock: 2 }
      ]
    });

    await prisma.auditLog.create({
      data: {
        user: 'SYSTEM',
        action: 'DB_INITIALIZED',
        detail: 'Initial database seed executed successfully.'
      }
    });

    console.log('Database seeded successfully!');
  }
}
