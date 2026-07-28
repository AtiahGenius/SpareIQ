import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const DashboardView = ({ onOpenReceiptModal, onOpenSaleModal }) => {
  const {
    currentUser, receipts, sales, inventory, money,
    showView, theme
  } = useApp();

  if (!currentUser) return null;

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#262B36' : '#E4E6EB';
  const textColor = isDark ? '#8B90A0' : '#666B78';

  if (currentUser.role === 'cashier') {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const mySales = sales.filter(s => s.empId === currentUser.id);
    const todaySales = mySales.filter(s => s.date === today);
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const weekSales = mySales.filter(s => new Date(s.date) >= weekAgo);
    const monthSales = mySales.filter(s => new Date(s.date).getMonth() === now.getMonth() && new Date(s.date).getFullYear() === now.getFullYear());
    const itemsToday = todaySales.reduce((s, t) => s + (t.items || []).reduce((a, i) => a + (i.qty || 0), 0), 0);

    return (
      <div className="view active">
        <div className="page-head">
          <div>
            <h1>Hi, {currentUser.name.split(' ')[0]} 👋</h1>
            <p>Here's your sales activity.</p>
          </div>
        </div>

        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card">
            <div className="label">Today's Sales</div>
            <div className="value">{money(todaySales.reduce((s, t) => s + t.grandTotal, 0))}</div>
            <div className="delta">{todaySales.length} transaction{todaySales.length !== 1 ? 's' : ''}</div>
          </div>
          <div className="stat-card">
            <div className="label">Items Sold Today</div>
            <div className="value">{itemsToday}</div>
            <div className="delta">Units</div>
          </div>
          <div className="stat-card">
            <div className="label">This Week</div>
            <div className="value">{money(weekSales.reduce((s, t) => s + t.grandTotal, 0))}</div>
            <div className="delta">{weekSales.length} sales</div>
          </div>
          <div className="stat-card">
            <div className="label">This Month</div>
            <div className="value">{money(monthSales.reduce((s, t) => s + t.grandTotal, 0))}</div>
            <div className="delta">Revenue generated</div>
          </div>
        </div>

        <div className="grid-2">
          <div className="panel">
            <h3>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="btn btn-primary" style={{ justifyContent: 'flex-start' }} onClick={() => showView('pos')}>
                🛒 New Sale
              </button>
              <button className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => showView('pos')}>
                🔎 Search Product
              </button>
            </div>
          </div>

          <div className="panel">
            <h3>My Recent Transactions</h3>
            <div className="tbl-wrap">
              <table className="data-tbl">
                <thead>
                  <tr><th>Txn</th><th>Time</th><th>Items</th><th>Total</th><th></th></tr>
                </thead>
                <tbody>
                  {mySales.length > 0 ? (
                    mySales.slice().reverse().slice(0, 8).map(s => (
                      <tr key={s.id}>
                        <td className="mono">{s.txnId}</td>
                        <td>{s.date} {s.time}</td>
                        <td>{(s.items || []).reduce((a, i) => a + (i.qty || 0), 0)}</td>
                        <td className="mono">{money(s.grandTotal)}</td>
                        <td>
                          <button className="btn btn-sm" onClick={() => onOpenSaleModal(s)}>Print</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--muted)' }}>No sales yet — start with New Sale.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Administrator Dashboard
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const totalReceipts = receipts.length;
  const totalSpend = receipts.reduce((s, r) => s + r.grandTotal, 0);

  const revenueToday = sales.filter(s => s.date === today).reduce((s, t) => s + (t.grandTotal || 0), 0);
  const revenueMonth = sales.filter(s => new Date(s.date).getMonth() === now.getMonth() && new Date(s.date).getFullYear() === now.getFullYear()).reduce((s, t) => s + (t.grandTotal || 0), 0);
  const profitToday = sales.filter(s => s.date === today).reduce((s, t) => s + (t.items || []).reduce((a, i) => a + (i.profit || 0), 0), 0);
  const profitMonth = sales.filter(s => new Date(s.date).getMonth() === now.getMonth() && new Date(s.date).getFullYear() === now.getFullYear()).reduce((s, t) => s + (t.items || []).reduce((a, i) => a + (i.profit || 0), 0), 0);
  
  const lowStock = inventory.filter(i => i.stock <= i.minStock);
  const inventoryValue = inventory.reduce((s, i) => s + (i.stock || 0) * (i.cost || i.costPrice || 0), 0);
  const productCount = new Set(receipts.flatMap(r => (r.items || []).map(i => i.name))).size;

  // Monthly chart data
  const months = [];
  for (let i = 5; i >= 0; i--) {
    months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
  }
  const monthlyLabels = months.map(d => d.toLocaleString('default', { month: 'short' }));
  const monthlyData = months.map(d => receipts.filter(r => {
    const rd = new Date(r.date);
    return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
  }).reduce((s, r) => s + r.grandTotal, 0));

  const monthlyChartConfig = {
    labels: monthlyLabels,
    datasets: [{
      label: 'Spend',
      data: monthlyData,
      borderColor: '#F2761F',
      backgroundColor: 'rgba(242,118,31,.12)',
      fill: true,
      tension: 0.35,
      pointRadius: 3
    }]
  };

  // Top Suppliers chart data
  const supplierTotals = {};
  receipts.forEach(r => { supplierTotals[r.supplier] = (supplierTotals[r.supplier] || 0) + r.grandTotal; });
  const sortedSuppliers = Object.entries(supplierTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const supplierChartConfig = {
    labels: sortedSuppliers.map(s => s[0].split(' ')[0] + ' ' + (s[0].split(' ')[1] || '')),
    datasets: [{
      data: sortedSuppliers.map(s => s[1]),
      backgroundColor: '#1E2A44',
      borderRadius: 6
    }]
  };

  // Most Purchased Products chart data
  const productQty = {};
  receipts.forEach(r => r.items.forEach(i => { productQty[i.name] = (productQty[i.name] || 0) + i.qty; }));
  const sortedProducts = Object.entries(productQty).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const productChartConfig = {
    labels: sortedProducts.map(s => s[0]),
    datasets: [{
      data: sortedProducts.map(s => s[1]),
      backgroundColor: '#F2761F',
      borderRadius: 6
    }]
  };

  const commonOptions = {
    plugins: { legend: { display: false } },
    maintainAspectRatio: false,
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: textColor } },
      y: { grid: { color: gridColor }, ticks: { color: textColor } }
    }
  };

  // Leaderboard data
  const perf = {};
  sales.forEach(s => {
    if (!perf[s.empId]) perf[s.empId] = { name: s.empName, count: 0, revenue: 0, profit: 0 };
    perf[s.empId].count++;
    perf[s.empId].revenue += s.grandTotal;
    perf[s.empId].profit += s.items.reduce((a, i) => a + i.profit, 0);
  });
  const leaderRows = Object.values(perf).sort((a, b) => b.revenue - a.revenue).slice(0, 3);

  const recentReceipts = receipts.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Good day, {currentUser.name.split(' ')[0]} 👋</h1>
          <p>Here's how the shop is doing.</p>
        </div>
      </div>

      <div className="grid-cards">
        <div className="stat-card">
          <div className="label">Revenue Today</div>
          <div className="value">{money(revenueToday)}</div>
          <div className="delta">Profit {money(profitToday)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Revenue This Month</div>
          <div className="value">{money(revenueMonth)}</div>
          <div className="delta">Profit {money(profitMonth)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Purchases</div>
          <div className="value">{money(totalSpend)}</div>
          <div className="delta">{totalReceipts} receipts</div>
        </div>
        <div className="stat-card">
          <div className="label">Inventory Value</div>
          <div className="value">{money(inventoryValue)}</div>
          <div className="delta">{productCount} distinct parts</div>
        </div>
        <div className="stat-card">
          <div className="label">Low Stock Items</div>
          <div className="value" style={{ color: lowStock.length ? 'var(--danger)' : undefined }}>
            {lowStock.length}
          </div>
          <div className={`delta ${lowStock.length ? 'down' : ''}`}>
            {lowStock.length ? 'Needs reordering' : 'All healthy'}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <h3>Monthly Spending<small>Purchases, last 6 months</small></h3>
          <div className="chart-wrap">
            <Line data={monthlyChartConfig} options={commonOptions} />
          </div>
        </div>

        <div className="panel">
          <h3>Top Suppliers<small>By total spend</small></h3>
          <div className="chart-wrap">
            <Bar data={supplierChartConfig} options={{ ...commonOptions, scales: { x: { grid: { display: false }, ticks: { color: textColor } }, y: { grid: { color: gridColor }, ticks: { color: textColor } } } }} />
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <h3>Most Purchased Products<small>By quantity</small></h3>
          <div className="chart-wrap">
            <Bar data={productChartConfig} options={{ ...commonOptions, indexAxis: 'y', scales: { x: { grid: { color: gridColor }, ticks: { color: textColor } }, y: { grid: { display: false }, ticks: { color: textColor } } } }} />
          </div>
        </div>

        <div className="panel">
          <h3>Low Stock Alerts<small>At or below minimum stock</small></h3>
          <div className="tbl-wrap">
            <table className="data-tbl">
              <thead>
                <tr><th>Product</th><th>Remaining</th><th>Minimum</th><th>Status</th></tr>
              </thead>
              <tbody>
                {lowStock.length > 0 ? (
                  lowStock.map(i => (
                    <tr key={i.code}>
                      <td>{i.name}</td>
                      <td className="mono">{i.stock}</td>
                      <td className="mono">{i.minStock}</td>
                      <td><span className="badge-status disabled">LOW STOCK</span></td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--muted)' }}>All products above minimum stock 🎉</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <h3>Top Employees<small>By revenue generated</small></h3>
          {leaderRows.length > 0 ? (
            leaderRows.map((r, idx) => (
              <div className="leader-row" key={idx}>
                <div className={`leader-rank ${idx === 0 ? 'gold' : ''}`}>{idx + 1}</div>
                <div>
                  <b>{r.name}</b>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{r.count} sales</div>
                </div>
                <div className="mono">{money(r.revenue)}</div>
                <div className="mono" style={{ color: 'var(--success)' }}>{money(r.profit)}</div>
              </div>
            ))
          ) : (
            <div className="empty" style={{ padding: '30px 10px' }}>No sales recorded yet.</div>
          )}
        </div>

        <div className="panel">
          <h3>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => showView('upload')}>
              📷 Take Photo / Upload Receipt
            </button>
            <button className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => showView('pos')}>
              🛒 Start a Sale
            </button>
            <button className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => showView('reports')}>
              📊 Generate a Report
            </button>
            <button className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => showView('inventory')}>
              🧰 Manage Inventory
            </button>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>Recent Receipts<small>Latest 6 captured</small></h3>
        <div className="receipt-grid">
          {recentReceipts.length > 0 ? (
            recentReceipts.map(r => (
              <div className="receipt-card" key={r.id} onClick={() => onOpenReceiptModal(r)}>
                {r.status === 'duplicate' ? (
                  <div className="stamp dup">Possible Dup</div>
                ) : (
                  <div className="stamp">Verified</div>
                )}
                <div
                  className="thumb"
                  style={r.imageDataUrl ? { backgroundImage: `url(${r.imageDataUrl})` } : undefined}
                >
                  {!r.imageDataUrl && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2h9l3 3v17l-2-1-2 1-2-1-2 1-2-1-2 1V2Z" /></svg>
                  )}
                </div>
                <div className="info">
                  <div className="supplier">{r.supplier}</div>
                  <div className="meta">{r.date} &middot; {r.receiptNo}</div>
                  <div className="amount">{money(r.grandTotal)}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty">No receipts yet — upload your first one.</div>
          )}
        </div>
      </div>
    </div>
  );
};
