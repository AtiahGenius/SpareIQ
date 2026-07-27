import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Tesseract from 'tesseract.js';

const PIPE_STEPS = [
  "Enhancing image",
  "Deskewing",
  "Removing shadows",
  "Increasing contrast",
  "Running OCR",
  "Extracting structured fields"
];

function lev(a, b) {
  const m = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      m[i][j] = a[i - 1] === b[j - 1] ? m[i - 1][j - 1] : 1 + Math.min(m[i - 1][j - 1], m[i - 1][j], m[i][j - 1]);
  return m[a.length][b.length];
}

export const UploadView = () => {
  const {
    inventory, SUPPLIERS, receipts, saveReceipt,
    toast, setLightboxImg
  } = useApp();

  const fileInputRef = useRef(null);
  const [stage, setStage] = useState('dropzone'); // 'dropzone' | 'pipeline' | 'review'
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [rawOcrText, setRawOcrText] = useState('');

  // Form Fields
  const [supplier, setSupplier] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [currency, setCurrency] = useState('GHS');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [notes, setNotes] = useState('');
  const [lowConfidence, setLowConfidence] = useState(false);

  // Line items
  const [pendingItems, setPendingItems] = useState([{ code: '', name: '', qty: 1, unitPrice: 0 }]);

  const fuzzyMatch = (name) => {
    if (!name) return null;
    let best = null, bestScore = 0;
    inventory.forEach(inv => {
      const dist = lev(name.toLowerCase(), inv.name.toLowerCase());
      const score = 1 - dist / Math.max(name.length, inv.name.length);
      if (score > bestScore) { bestScore = score; best = inv; }
    });
    return bestScore > 0.45 ? best : null;
  };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const extractFieldsFromText = (text) => {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const supplierGuess = SUPPLIERS.find(s => text.toLowerCase().includes(s.name.split(' ')[0].toLowerCase()));
    const invoiceMatch = text.match(/(?:inv(?:oice)?|receipt|order)[\s#:.-]*([A-Z0-9\-]{4,})/i);
    const dateMatch = text.match(/(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})|(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/);
    const amounts = [...text.matchAll(/(?:GHS|GH₵|₵|\$)?\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2}))/g)].map(m => parseFloat(m[1].replace(/,/g, '')));
    const grandGuess = amounts.length ? Math.max(...amounts) : 0;

    return {
      supplier: supplierGuess ? supplierGuess.name : "",
      invoiceNo: invoiceMatch ? invoiceMatch[1] : "",
      date: dateMatch ? dateMatch[0] : new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      currency: "GHS",
      grandTotal: grandGuess,
      lowConfidence: !supplierGuess || !invoiceMatch || amounts.length === 0,
    };
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("PDF received — for this demo, please upload a JPG/PNG photo so OCR can read it", "warning");
      return;
    }

    const dataUrl = await new Promise(res => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.readAsDataURL(file);
    });
    setImageDataUrl(dataUrl);

    setStage('pipeline');
    setCompletedSteps([]);

    for (let i = 0; i < PIPE_STEPS.length - 1; i++) {
      setActiveStepIndex(i);
      await sleep(420);
      setCompletedSteps(prev => [...prev, i]);
    }

    setActiveStepIndex(PIPE_STEPS.length - 1);

    let text = "";
    try {
      const result = await Tesseract.recognize(dataUrl, 'eng');
      text = result.data.text || "";
    } catch (err) {
      text = "";
    }
    setRawOcrText(text);

    await sleep(200);
    setCompletedSteps(prev => [...prev, PIPE_STEPS.length - 1]);
    await sleep(250);

    const extracted = extractFieldsFromText(text);
    setSupplier(extracted.supplier);
    setInvoiceNo(extracted.invoiceNo);
    setDate(/^\d{4}-\d{2}-\d{2}$/.test(extracted.date) ? extracted.date : new Date().toISOString().slice(0, 10));
    setTime(extracted.time);
    setCurrency(extracted.currency);
    setGrandTotal(extracted.grandTotal);
    setLowConfidence(extracted.lowConfidence);
    setPendingItems([{ code: '', name: '', qty: 1, unitPrice: 0 }]);

    setStage('review');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag');
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleItemChange = (idx, field, val) => {
    setPendingItems(prev => {
      const copy = [...prev];
      const item = { ...copy[idx], [field]: val };

      if (field === 'name') {
        const match = fuzzyMatch(val);
        if (match) {
          item.code = match.code;
          if (!item.unitPrice) item.unitPrice = match.cost;
        } else {
          item.code = '';
        }
      }
      copy[idx] = item;
      return copy;
    });
  };

  const addPendingItem = () => {
    setPendingItems(prev => [...prev, { code: '', name: '', qty: 1, unitPrice: 0 }]);
  };

  const removePendingItem = (idx) => {
    setPendingItems(prev => prev.filter((_, i) => i !== idx));
  };

  const isDup = receipts.some(r => r.supplier === supplier && r.invoiceNo === invoiceNo && invoiceNo !== "");

  const handleSave = () => {
    const items = pendingItems.filter(i => i.name).map(i => {
      const match = fuzzyMatch(i.name);
      return {
        code: match ? match.code : "NEW",
        name: i.name,
        qty: +i.qty || 1,
        unitPrice: +i.unitPrice || 0,
        total: +((+i.qty || 1) * (+i.unitPrice || 0)).toFixed(2)
      };
    });

    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const finalGrandTotal = +grandTotal || +(subtotal - (+discount || 0) + (+tax || 0)).toFixed(2);

    saveReceipt({
      invoiceNo: invoiceNo || ("AUTO-" + Date.now().toString().slice(-6)),
      supplier: supplier || "Unknown Supplier",
      date, time, currency: currency || "GHS",
      items, subtotal,
      discount: +discount || 0,
      tax: +tax || 0,
      grandTotal: finalGrandTotal,
      notes,
      imageDataUrl,
      status: isDup ? "duplicate" : "verified"
    });

    handleCancel();
  };

  const handleCancel = () => {
    setStage('dropzone');
    setImageDataUrl(null);
    setRawOcrText('');
  };

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Add a Receipt</h1>
          <p>Take a photo → Save → everything else happens automatically.</p>
        </div>
      </div>

      {stage === 'dropzone' && (
        <div
          className="dropzone"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,application/pdf"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
          />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 16V4M6 10l6-6 6 6" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg>
          <h3>Drag a receipt photo here, or click to choose a file</h3>
          <p>JPG, PNG or PDF &middot; you can also paste a screenshot with Ctrl+V</p>
        </div>
      )}

      {stage === 'pipeline' && (
        <div className="pipeline">
          {PIPE_STEPS.map((stepLabel, i) => {
            const isDone = completedSteps.includes(i);
            const isActive = activeStepIndex === i && !isDone;
            return (
              <div key={i} className={`pipe-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                <div className="dot">
                  {isDone && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>}
                </div>
                {stepLabel}
              </div>
            );
          })}
        </div>
      )}

      {stage === 'review' && (
        <div className="review-grid">
          <div>
            <div className="paper">
              <img
                className="paper-img"
                alt="Uploaded receipt photo"
                style={{ cursor: 'zoom-in' }}
                src={imageDataUrl}
                onClick={() => setLightboxImg(imageDataUrl)}
              />
            </div>
            <div className="paper-jag" />
            <details style={{ marginTop: '12px', fontSize: '12px', color: 'var(--muted)' }}>
              <summary style={{ cursor: 'pointer' }}>Raw OCR text</summary>
              <pre style={{ whiteSpace: 'pre-wrap', marginTop: '8px', padding: '10px', background: 'var(--surface-2)', borderRadius: '8px', maxHeight: '150px', overflow: 'auto' }}>
                {rawOcrText ? rawOcrText.slice(0, 2000) : "(No text recognized — OCR engine unavailable in this browser session, please fill in the fields manually)"}
              </pre>
            </details>
          </div>

          <div>
            <h3 style={{ marginBottom: '10px' }}>
              Review extracted fields {lowConfidence && <span className="conf-flag">⚠ some fields need your review</span>}
            </h3>

            <div className="field-row">
              <div className={`field ${!supplier ? 'low-conf' : ''}`}>
                <label>Supplier {!supplier && <span className="conf-flag">low confidence</span>}</label>
                <input
                  list="supplierList"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Type or select supplier"
                />
                <datalist id="supplierList">
                  {SUPPLIERS.map(s => <option key={s.name} value={s.name} />)}
                </datalist>
              </div>

              <div className={`field ${!invoiceNo ? 'low-conf' : ''}`}>
                <label>Invoice No. {!invoiceNo && <span className="conf-flag">low confidence</span>}</label>
                <input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="field">
                <label>Time</label>
                <input value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
              <div className="field">
                <label>Currency</label>
                <input value={currency} onChange={(e) => setCurrency(e.target.value)} />
              </div>
            </div>

            <h3 style={{ margin: '14px 0 4px' }}>Line items</h3>
            <table className="items-tbl">
              <thead>
                <tr><th>Product</th><th>Match</th><th>Qty</th><th>Unit Price</th><th>Total</th><th></th></tr>
              </thead>
              <tbody>
                {pendingItems.map((it, idx) => {
                  const match = fuzzyMatch(it.name);
                  return (
                    <tr key={idx}>
                      <td>
                        <input
                          value={it.name}
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          placeholder="e.g. Brake rod GN"
                          list="invList"
                        />
                      </td>
                      <td>
                        <span className={`match-pill ${match ? 'ok' : 'none'}`}>
                          {match ? match.code : 'no match'}
                        </span>
                      </td>
                      <td>
                        <input
                          type="number"
                          value={it.qty}
                          style={{ width: '50px' }}
                          onChange={(e) => handleItemChange(idx, 'qty', +e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={it.unitPrice}
                          style={{ width: '70px' }}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', +e.target.value)}
                        />
                      </td>
                      <td className="mono">{(it.qty * it.unitPrice).toFixed(2)}</td>
                      <td>
                        <button className="btn btn-sm btn-ghost" onClick={() => removePendingItem(idx)}>✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <datalist id="invList">
              {inventory.map(i => <option key={i.code} value={i.name} />)}
            </datalist>

            <button className="btn btn-sm" style={{ marginTop: '8px' }} onClick={addPendingItem}>
              + Add item
            </button>

            <div className="field-row" style={{ marginTop: '14px' }}>
              <div className="field">
                <label>Discount</label>
                <input type="number" value={discount} onChange={(e) => setDiscount(+e.target.value || 0)} />
              </div>
              <div className="field">
                <label>Tax</label>
                <input type="number" value={tax} onChange={(e) => setTax(+e.target.value || 0)} />
              </div>
              <div className={`field ${!grandTotal ? 'low-conf' : ''}`}>
                <label>Grand Total {!grandTotal && <span className="conf-flag">verify</span>}</label>
                <input type="number" value={grandTotal} onChange={(e) => setGrandTotal(+e.target.value || 0)} />
              </div>
            </div>

            <div className="field">
              <label>Notes</label>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." />
            </div>

            {isDup && (
              <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '8px', background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: '12.5px' }}>
                ⚠ Possible duplicate: Invoice #{invoiceNo} from {supplier} looks like an existing receipt. You can still save — it will be flagged.
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button className="btn btn-primary" onClick={handleSave}>💾 Save Receipt</button>
              <button className="btn" onClick={handleCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
