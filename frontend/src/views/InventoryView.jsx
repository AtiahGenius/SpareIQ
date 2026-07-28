import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Papa from 'papaparse';

export const InventoryView = () => {
  const {
    inventory, createInventoryItem, deleteInventoryItem,
    updateInvPrice, importInventoryCSV, SUPPLIERS,
    toast
  } = useApp();

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState(1); // 1 = asc, -1 = desc

  const [addModalOpen, setAddModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Add Item Form
  const [code, setCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('');
  const [models, setModels] = useState('');
  const [supplier, setSupplier] = useState('');
  const [cost, setCost] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [unit, setUnit] = useState('pc');
  const [stock, setStock] = useState(0);
  const [minStock, setMinStock] = useState(5);
  const [status, setStatus] = useState('active');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d * -1);
    } else {
      setSortKey(key);
      setSortDir(1);
    }
  };

  const getSortArrow = (key) => {
    if (sortKey !== key) return '';
    return sortDir === 1 ? ' ▲' : ' ▼';
  };

  let entries = [...inventory];
  if (sortKey) {
    entries.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
      return cmp * sortDir;
    });
  }

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = entries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleCsvFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        importInventoryCSV(res.data);
      }
    });
  };

  const handleCreate = () => {
    if (!code.trim() || !name.trim()) {
      toast("Product Code and Product Name are required.", "error");
      return;
    }
    if (inventory.some(i => i.code === code.trim())) {
      toast("A product with this code already exists.", "error");
      return;
    }
    createInventoryItem({
      code: code.trim(),
      barcode: barcode.trim(),
      name: name.trim(),
      desc: desc.trim(),
      category: category.trim() || "General",
      models: models.trim(),
      cost: +cost || 0,
      sellingPrice: +sellingPrice || 0,
      unit: unit.trim() || "pc",
      stock: +stock || 0,
      minStock: +minStock || 5,
      status
    });
    setAddModalOpen(false);
    // Reset form
    setCode(''); setBarcode(''); setName(''); setDesc(''); setCategory(''); setModels(''); setCost(0); setSellingPrice(0); setStock(0);
  };

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Inventory</h1>
          <p>Master parts list &middot; matched automatically against OCR results</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleCsvFile}
          />
          <button className="btn btn-sm" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
            ⬆ Import CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setAddModalOpen(true)}>
            + Add Item
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="tbl-wrap">
          <table className="data-tbl">
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('code')}>Code{getSortArrow('code')}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>Name{getSortArrow('name')}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('category')}>Category{getSortArrow('category')}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('stock')}>Stock{getSortArrow('stock')}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('minStock')}>Min{getSortArrow('minStock')}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('cost')}>Cost Price{getSortArrow('cost')}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('sellingPrice')}>Selling Price{getSortArrow('sellingPrice')}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>Status{getSortArrow('status')}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map(i => {
                const low = i.stock <= i.minStock;
                const costVal = Number(i.cost ?? i.costPrice ?? 0);
                const sellingVal = Number(i.sellingPrice ?? 0);
                const itemDesc = i.desc || i.description || '';
                return (
                  <tr key={i.code}>
                    <td className="mono">{i.code}</td>
                    <td>
                      <b>{i.name}</b>
                      {itemDesc && <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>{itemDesc}</div>}
                    </td>
                    <td><span className="tag">{i.category}</span></td>
                    <td className="mono" style={low ? { color: 'var(--danger)', fontWeight: 700 } : undefined}>
                      {i.stock}{low ? ' ⚠' : ''}
                    </td>
                    <td className="mono">{i.minStock}</td>
                    <td className="mono">
                      <input
                        key={`${i.code}-cost-${costVal}`}
                        defaultValue={costVal.toFixed(2)}
                        style={{ width: '70px', border: '1px solid var(--line)', borderRadius: '6px', padding: '4px 6px', background: 'var(--surface-2)' }}
                        onBlur={(e) => updateInvPrice(i.code, 'cost', e.target.value)}
                      />
                    </td>
                    <td className="mono">
                      <input
                        key={`${i.code}-selling-${sellingVal}`}
                        defaultValue={sellingVal.toFixed(2)}
                        style={{ width: '70px', border: '1px solid var(--line)', borderRadius: '6px', padding: '4px 6px', background: 'var(--surface-2)' }}
                        onBlur={(e) => updateInvPrice(i.code, 'sellingPrice', e.target.value)}
                      />
                    </td>
                    <td><span className={`badge-status ${i.status}`}>{i.status}</span></td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteInventoryItem(i.code)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
            <button className="btn btn-sm" disabled={currentPage <= 1} onClick={() => setPage(p => p - 1)}>
              ← Prev
            </button>
            <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
              Page {currentPage} of {totalPages} &middot; {entries.length} total
            </span>
            <button className="btn btn-sm" disabled={currentPage >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Add Inventory Item Modal */}
      {addModalOpen && (
        <div className="modal-bg active" role="dialog" aria-modal="true" onClick={(e) => { if (e.target.classList.contains('modal-bg')) setAddModalOpen(false); }}>
          <div className="modal" style={{ maxWidth: '540px' }}>
            <div className="modal-head">
              <h3 style={{ fontFamily: 'var(--font-display)' }}>Add Inventory Item</h3>
              <button className="modal-close" onClick={() => setAddModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="field-row">
                <div className="field">
                  <label>Product Code *</label>
                  <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. 0514000HS02L-01-004" />
                </div>
                <div className="field">
                  <label>Barcode</label>
                  <input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Optional" />
                </div>
              </div>

              <div className="field">
                <label>Product Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rear Shock Absorber" />
              </div>

              <div className="field">
                <label>Description</label>
                <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Short description" />
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Category</label>
                  <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Suspension" />
                </div>
                <div className="field">
                  <label>Compatible Models</label>
                  <input value={models} onChange={(e) => setModels(e.target.value)} placeholder="e.g. GN125, GN150" />
                </div>
              </div>

              <div className="field">
                <label>Supplier</label>
                <input list="modalSupList" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Type or select supplier" />
                <datalist id="modalSupList">
                  {SUPPLIERS.map(s => <option key={s.name} value={s.name} />)}
                </datalist>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Cost Price *</label>
                  <input type="number" value={cost} onChange={(e) => setCost(+e.target.value || 0)} />
                </div>
                <div className="field">
                  <label>Selling Price *</label>
                  <input type="number" value={sellingPrice} onChange={(e) => setSellingPrice(+e.target.value || 0)} />
                </div>
                <div className="field">
                  <label>Unit</label>
                  <input value={unit} onChange={(e) => setUnit(e.target.value)} />
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Current Stock</label>
                  <input type="number" value={stock} onChange={(e) => setStock(+e.target.value || 0)} />
                </div>
                <div className="field">
                  <label>Minimum Stock</label>
                  <input type="number" value={minStock} onChange={(e) => setMinStock(+e.target.value || 5)} />
                </div>
                <div className="field">
                  <label>Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginBottom: '10px' }}>
                Fields marked * are required. This item joins the same inventory list used for CSV imports, POS sales, and OCR matching.
              </div>

              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleCreate}>
                Add to Inventory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
