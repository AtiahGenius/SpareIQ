import { prisma } from '../db.js';

export const addToOutbox = async (client, entityType, entityId, operation, payload) => {
  const db = client || prisma;
  return await db.syncOutbox.create({
    data: {
      entityType,
      entityId: String(entityId),
      operation,
      payloadJson: typeof payload === 'string' ? payload : JSON.stringify(payload),
      status: 'PENDING',
      retryCount: 0
    }
  });
};

export const getPendingOutboxItems = async (limit = 50) => {
  return await prisma.syncOutbox.findMany({
    where: {
      status: { in: ['PENDING', 'FAILED'] },
      retryCount: { lt: 5 }
    },
    orderBy: { createdAt: 'asc' },
    take: limit
  });
};

export const markOutboxSynced = async (ids) => {
  if (!ids || ids.length === 0) return;
  return await prisma.syncOutbox.updateMany({
    where: { id: { in: ids } },
    data: {
      status: 'SYNCED',
      syncedAt: new Date()
    }
  });
};

export const markOutboxFailed = async (id, errorMessage) => {
  return await prisma.syncOutbox.update({
    where: { id },
    data: {
      status: 'FAILED',
      retryCount: { increment: 1 },
      errorMessage
    }
  });
};
