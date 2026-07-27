import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

const TOUR_ADMIN = [
  { icon: "👋", title: "Welcome to SpareIQ", body: "A quick 30-second tour of where everything lives — you can restart this anytime from Settings." },
  { icon: "📊", title: "Your Dashboard", body: "Today's revenue, profit, low-stock alerts, and your top-performing employees, all at a glance." },
  { icon: "🧾", title: "Receipts & OCR", body: "Snap or upload a supplier receipt — it's read automatically and matching inventory is restocked for you." },
  { icon: "🛒", title: "New Sale (POS)", body: "Search or tap a product, adjust quantity, and check out. Stock and profit update instantly." },
  { icon: "🧰", title: "Inventory & Employees", body: "Add products manually or via CSV, manage prices, and control staff accounts — every change lands in the Audit Log." },
  { icon: "📈", title: "Reports & AI Insights", body: "Export monthly, supplier, profit and stock reports, or just ask the AI assistant a plain-language question." },
];

const TOUR_CASHIER = [
  { icon: "👋", title: "Welcome!", body: "Here's a quick look at your sales dashboard before you start your shift." },
  { icon: "📊", title: "Your Dashboard", body: "See today's sales, items sold, and your recent transactions here." },
  { icon: "🛒", title: "New Sale", body: "Search or tap a product, set the quantity, and checkout. Prices are locked by your administrator." },
  { icon: "🖨️", title: "Receipts", body: "After a sale you can print or reprint any of your own receipts — but not other cashiers' sales." },
];

export const OnboardingTourModal = () => {
  const { tourModalOpen, setTourModalOpen, currentUser } = useApp();
  const [stepIndex, setStepIndex] = useState(0);

  if (!tourModalOpen || !currentUser) return null;

  const steps = currentUser.role === 'admin' ? TOUR_ADMIN : TOUR_CASHIER;
  const currentStep = steps[stepIndex] || steps[0];

  const handleNext = () => {
    if (stepIndex >= steps.length - 1) {
      setTourModalOpen(false);
      setStepIndex(0);
    } else {
      setStepIndex(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    setTourModalOpen(false);
    setStepIndex(0);
  };

  return (
    <div className="modal-bg active" role="dialog" aria-modal="true" style={{ zIndex: 80 }}>
      <div className="modal" style={{ maxWidth: '440px' }}>
        <div className="modal-body" style={{ padding: '30px 26px' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>{currentStep.icon}</div>
          <h3 style={{ marginBottom: '8px', fontFamily: 'var(--font-display)' }}>{currentStep.title}</h3>
          <p style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: '1.6', marginBottom: '20px' }}>
            {currentStep.body}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {steps.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: i === stepIndex ? 'var(--accent)' : 'var(--line)'
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-sm" onClick={handleSkip}>Skip</button>
              <button className="btn btn-primary btn-sm" onClick={handleNext}>
                {stepIndex === steps.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
