import { prisma } from '../db.js';
import { getPendingOutboxItems, markOutboxSynced, markOutboxFailed } from './outboxService.js';

let isSyncRunning = false;
let syncIntervalTimer = null;

export const triggerSyncCycle = async () => {
  if (isSyncRunning) {
    return { status: 'busy', message: 'Sync cycle already in progress.' };
  }

  isSyncRunning = true;
  const cloudUrl = process.env.CLOUD_SYNC_SERVER_URL || 'https://api.spareiq.com/api/v1/sync';
  const branchId = process.env.BRANCH_ID || 'BRANCH-ACCRA-01';

  try {
    // 1. Fetch pending outbox items from local SQLite DB
    const pendingItems = await getPendingOutboxItems(50);

    if (pendingItems.length === 0) {
      await prisma.syncMetadata.upsert({
        where: { id: 1 },
        update: { isOnline: true },
        create: { id: 1, isOnline: true }
      });
      isSyncRunning = false;
      return { status: 'idle', message: 'No pending items to sync.' };
    }

    // 2. Update status to SYNCING
    const pendingIds = pendingItems.map(i => i.id);
    await prisma.syncOutbox.updateMany({
      where: { id: { in: pendingIds } },
      data: { status: 'SYNCING' }
    });

    // 3. Attempt push to cloud server
    let response = null;
    try {
      const res = await fetch(`${cloudUrl}/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId, outboxItems: pendingItems })
      });
      if (res.ok) {
        response = await res.json();
      }
    } catch (netErr) {
      console.log(`[Sync Worker] Cloud server unreachable (${cloudUrl}). App running offline.`);
    }

    if (response && Array.isArray(response.syncedOutboxIds)) {
      // Mark successful items as SYNCED
      await markOutboxSynced(response.syncedOutboxIds);

      // Handle items that failed on server
      if (Array.isArray(response.errors)) {
        for (const errItem of response.errors) {
          await markOutboxFailed(errItem.id, errItem.error);
        }
      }

      await prisma.syncMetadata.upsert({
        where: { id: 1 },
        update: { lastSyncedAt: new Date(), isOnline: true },
        create: { id: 1, lastSyncedAt: new Date(), isOnline: true }
      });

      console.log(`[Sync Worker] Successfully synced ${response.syncedOutboxIds.length} items to cloud.`);
      isSyncRunning = false;
      return { status: 'success', syncedCount: response.syncedOutboxIds.length };
    } else {
      // Network offline or failed -> revert items to PENDING or FAILED with incremented retry count
      for (const item of pendingItems) {
        await markOutboxFailed(item.id, 'Network connection offline or cloud push failed.');
      }

      await prisma.syncMetadata.upsert({
        where: { id: 1 },
        update: { isOnline: false },
        create: { id: 1, isOnline: false }
      });

      isSyncRunning = false;
      return { status: 'offline', message: 'Cloud push failed. Queued for next online cycle.' };
    }
  } catch (err) {
    console.error('[Sync Worker Error]:', err);
    isSyncRunning = false;
    return { status: 'error', message: err.message };
  }
};

export const startSyncWorker = () => {
  const intervalSec = parseInt(process.env.SYNC_INTERVAL_SECONDS || '30');
  console.log(`🔄 Starting Offline Sync Worker (Interval: ${intervalSec}s)`);

  // Run initial check after 5 seconds
  setTimeout(() => triggerSyncCycle(), 5000);

  // Set recurring interval
  syncIntervalTimer = setInterval(() => {
    triggerSyncCycle();
  }, intervalSec * 1000);
};

export const stopSyncWorker = () => {
  if (syncIntervalTimer) {
    clearInterval(syncIntervalTimer);
    syncIntervalTimer = null;
    console.log('⏹️ Offline Sync Worker stopped.');
  }
};
