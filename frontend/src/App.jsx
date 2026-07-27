import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { ToastContainer } from './components/common/ToastContainer';
import { ConfirmModal } from './components/common/ConfirmModal';
import { LightboxModal } from './components/common/LightboxModal';
import { OnboardingTourModal } from './components/common/OnboardingTourModal';
import { ReceiptViewerModal } from './components/common/ReceiptViewerModal';
import { SaleReceiptModal } from './components/common/SaleReceiptModal';

import { LoginScreen } from './views/LoginScreen';
import { DashboardView } from './views/DashboardView';
import { PosView } from './views/PosView';
import { ReceiptsView } from './views/ReceiptsView';
import { UploadView } from './views/UploadView';
import { InventoryView } from './views/InventoryView';
import { SuppliersView } from './views/SuppliersView';
import { EmployeesView } from './views/EmployeesView';
import { ReportsView } from './views/ReportsView';
import { AiAssistantView } from './views/AiAssistantView';
import { AuditLogView } from './views/AuditLogView';
import { SettingsView } from './views/SettingsView';

export function AppContent() {
  const { currentUser, activeView } = useApp();
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className="app ready">
      <Sidebar />
      <main className="main">
        <Topbar />

        {activeView === 'dashboard' && (
          <DashboardView
            onOpenReceiptModal={(r) => setSelectedReceipt(r)}
            onOpenSaleModal={(s) => setSelectedSale(s)}
          />
        )}
        {activeView === 'pos' && (
          <PosView
            onOpenSaleModal={(s) => setSelectedSale(s)}
          />
        )}
        {activeView === 'receipts' && (
          <ReceiptsView
            onOpenReceiptModal={(r) => setSelectedReceipt(r)}
          />
        )}
        {activeView === 'upload' && <UploadView />}
        {activeView === 'inventory' && <InventoryView />}
        {activeView === 'suppliers' && <SuppliersView />}
        {activeView === 'employees' && <EmployeesView />}
        {activeView === 'reports' && <ReportsView />}
        {activeView === 'ai' && <AiAssistantView />}
        {activeView === 'audit' && <AuditLogView />}
        {activeView === 'settings' && <SettingsView />}
      </main>

      {/* Modals & Overlays */}
      <ReceiptViewerModal
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
      <SaleReceiptModal
        sale={selectedSale}
        onClose={() => setSelectedSale(null)}
      />
      <ToastContainer />
      <ConfirmModal />
      <LightboxModal />
      <OnboardingTourModal />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
