import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Papa from 'papaparse';

export const ReportsView = () => {
  const { receipts, sales, inventory, shopProfile, toast } = useApp();
  const [previewKind, setPreviewKind] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);

  const reportTitles = {
    monthly: "Monthly Purchases Report",
    supplier: "Supplier Report",
    products: "Most Purchased Items",
    profit: "Profit Report",
    stock: "Stock Report"
  };

  const buildReportData = (kind) => {
    if (kind === "monthly") {
      const map = {};
      receipts.forEach(r => { const k = r.date.slice(0, 7); map[k] = (map[k] || 0) + r.grandTotal; });
      return Object.entries(map).sort().map(([month, total]) => ({ Month: month, Total: total.toFixed(2) }));
    }
    if (kind === "supplier") {
      const map = {};
      receipts.forEach(r => {
        if (!map[r.supplier]) map[r.supplier] = { count: 0, total: 0 };
        map[r.supplier].count++;
        map[r.supplier].total += r.grandTotal;
      });
      return Object.entries(map).map(([s, v]) => ({ Supplier: s, Receipts: v.count, "Total Spend": v.total.toFixed(2) }));
    }
    if (kind === "products") {
      const map = {};
      receipts.forEach(r => (r.items || []).forEach(i => { map[i.name] = (map[i.name] || 0) + (i.qty || 0); }));
      return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, qty]) => ({ Product: name, "Total Quantity": qty }));
    }
    if (kind === "profit") {
      const map = {};
      sales.forEach(s => (s.items || []).forEach(i => {
        const itemName = i.name || i.code || 'Item';
        if (!map[itemName]) map[itemName] = { qty: 0, revenue: 0, profit: 0 };
        map[itemName].qty += (i.qty || 0);
        map[itemName].revenue += (i.total || 0);
        map[itemName].profit += (i.profit || 0);
      }));
      return Object.entries(map).sort((a, b) => b[1].profit - a[1].profit).map(([name, v]) => ({
        Product: name, "Qty Sold": v.qty, Revenue: v.revenue.toFixed(2), Profit: v.profit.toFixed(2)
      }));
    }
    if (kind === "stock") {
      return inventory.map(i => ({
        Code: i.code, Product: i.name, Stock: i.stock, "Min Stock": i.minStock,
        Status: i.stock <= i.minStock ? "LOW STOCK" : "OK"
      }));
    }
    return [];
  };

  const handleExportCsv = (kind) => {
    const data = buildReportData(kind);
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${kind}-report.csv`;
    a.click();
    toast(`${kind} report exported as CSV`, "success");
  };

  const handlePrintReport = (kind) => {
    const data = buildReportData(kind);
    setPreviewKind(kind);
    setPreviewData(data);
    setIsPrinting(true);
    toast(`${kind} report ready below — use your browser's print dialog to save as PDF`, "info");
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 300);
  };

  const handlePreview = (kind) => {
    const data = buildReportData(kind);
    setPreviewKind(kind);
    setPreviewData(data);
  };

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Reports</h1>
          <p>Generate and export purchase reports</p>
        </div>
      </div>

      <div className="grid-3">
        <div className="panel">
          <h3>Monthly Purchases</h3>
          <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '10px' }}>Total spend grouped by month</p>
          <button className="btn btn-sm" onClick={() => handleExportCsv('monthly')}>Export CSV</button>{' '}
          <button className="btn btn-sm" onClick={() => handlePrintReport('monthly')}>Print / PDF</button>
        </div>

        <div className="panel">
          <h3>Supplier Report</h3>
          <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '10px' }}>Spend & receipt count per supplier</p>
          <button className="btn btn-sm" onClick={() => handleExportCsv('supplier')}>Export CSV</button>{' '}
          <button className="btn btn-sm" onClick={() => handlePrintReport('supplier')}>Print / PDF</button>
        </div>

        <div className="panel">
          <h3>Most Purchased Items</h3>
          <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '10px' }}>Ranked by total quantity bought</p>
          <button className="btn btn-sm" onClick={() => handleExportCsv('products')}>Export CSV</button>{' '}
          <button className="btn btn-sm" onClick={() => handlePrintReport('products')}>Print / PDF</button>
        </div>

        <div className="panel">
          <h3>Profit Report</h3>
          <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '10px' }}>Profit by product from completed sales</p>
          <button className="btn btn-sm" onClick={() => handleExportCsv('profit')}>Export CSV</button>{' '}
          <button className="btn btn-sm" onClick={() => handlePrintReport('profit')}>Print / PDF</button>
        </div>

        <div className="panel">
          <h3>Stock Report</h3>
          <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '10px' }}>Current stock levels vs minimum</p>
          <button className="btn btn-sm" onClick={() => handleExportCsv('stock')}>Export CSV</button>{' '}
          <button className="btn btn-sm" onClick={() => handlePrintReport('stock')}>Print / PDF</button>
        </div>
      </div>

      {previewKind && (
        <div className={`panel ${isPrinting ? 'printing' : ''}`} style={{ marginTop: '14px' }}>
          <h3>Preview</h3>
          <div style={{ textAlign: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid var(--line)' }}>
            {shopProfile.logo && (
              <img src={shopProfile.logo} alt="Shop logo" style={{ height: '40px', marginBottom: '6px' }} />
            )}
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px' }}>{shopProfile.name}</div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>{shopProfile.address} &middot; {shopProfile.phone}</div>
            <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '8px' }}>{reportTitles[previewKind] || "Report"}</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Generated {new Date().toLocaleString()}</div>
          </div>

          <div className="tbl-wrap">
            <table className="data-tbl">
              <thead>
                <tr>
                  {Object.keys(previewData[0] || {}).map(k => <th key={k}>{k}</th>)}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, idx) => (
                  <tr key={idx}>
                    {Object.values(row).map((v, i) => <td key={i}>{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
