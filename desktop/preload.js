const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),
  dbQuery: (sql, params) => ipcRenderer.invoke('db:query', { sql, params }),
  saveReceiptPhoto: (arrayBuffer, filename) => ipcRenderer.invoke('file:save-receipt-photo', { arrayBuffer, filename }),
  printReceipt: (html) => ipcRenderer.invoke('printer:print-receipt', { html }),
  runBackup: () => ipcRenderer.invoke('app:run-backup')
});
