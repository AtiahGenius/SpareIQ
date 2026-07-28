import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

export const AiAssistantView = () => {
  const { receipts, SUPPLIERS, money } = useApp();
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const msgsEndRef = useRef(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          who: 'ai',
          html: `Hi! I'm your purchase assistant. Ask me things like <i>"How much did I spend at FU WAN?"</i> or <i>"When did I last buy Brake Rod GN?"</i> — I answer using your saved receipts.`
        }
      ]);
    }
  }, []);

  useEffect(() => {
    if (msgsEndRef.current) {
      msgsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const smartSearch = (q) => {
    const ql = q.toLowerCase();
    return receipts.filter(r =>
      (r.supplier || '').toLowerCase().includes(ql) ||
      (r.invoiceNo || '').toLowerCase().includes(ql) ||
      (r.receiptNo || '').toLowerCase().includes(ql) ||
      (r.date || '').includes(ql) ||
      String(r.grandTotal || 0).includes(ql) ||
      (r.items || []).some(i => (i.name || '').toLowerCase().includes(ql) || (i.code || '').toLowerCase().includes(ql)) ||
      (r.date ? new Date(r.date).toLocaleString('default', { month: 'long' }).toLowerCase().includes(ql) : false)
    );
  };

  const tableHTML = (rows, headers) => {
    return `<table className="data-tbl" style="margin-top:8px; font-size:12px;"><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  };

  const answerQuery = (q) => {
    const ql = q.toLowerCase();

    // "how much did i spend at X"
    let m = ql.match(/spend(?:ing)? at ([a-z\s]+)\??/) || ql.match(/spend(?:ing)? with ([a-z\s]+)\??/);
    if (m) {
      const name = m[1].trim();
      const supplier = SUPPLIERS.find(s => s.name.toLowerCase().includes(name) || name.includes(s.name.split(' ')[0].toLowerCase()));
      if (supplier) {
        const list = receipts.filter(r => r.supplier === supplier.name);
        const total = list.reduce((s, r) => s + r.grandTotal, 0);
        return `You've spent <b>${money(total)}</b> at <b>${supplier.name}</b> across ${list.length} receipt${list.length !== 1 ? 's' : ''}.`;
      }
      return `I couldn't find a supplier matching "${name}". Try one of: ${SUPPLIERS.map(s => s.name).join(', ')}.`;
    }

    // "over GHS N" / "over N"
    m = ql.match(/over\s*(?:ghs)?\s*(\d+)/);
    if (m) {
      const n = +m[1];
      const list = receipts.filter(r => r.grandTotal > n).sort((a, b) => b.grandTotal - a.grandTotal);
      if (list.length === 0) return `No receipts found over ${money(n)}.`;
      return `Found <b>${list.length}</b> receipt${list.length !== 1 ? 's' : ''} over ${money(n)}:` + tableHTML(list.map(r => [r.receiptNo, r.supplier, r.date, money(r.grandTotal)]), ["Receipt", "Supplier", "Date", "Total"]);
    }

    // "last buy X" / "last bought X" / "when did i last buy"
    m = ql.match(/last (?:buy|bought|purchase[d]?)\s+([a-z0-9\s]+)\??/);
    if (m) {
      const name = m[1].trim();
      let best = null;
      receipts.forEach(r => r.items.forEach(i => {
        if (i.name.toLowerCase().includes(name) || name.includes(i.name.toLowerCase().split(' ')[0])) {
          if (!best || r.date > best.date) best = { date: r.date, item: i, r };
        }
      }));
      if (best) return `You last bought <b>${best.item.name}</b> on <b>${best.date}</b> from ${best.r.supplier} (qty ${best.item.qty} @ ${money(best.item.unitPrice)}).`;
      return `I couldn't find any purchases matching "${name}" in your receipts.`;
    }

    // "show all X purchases" / "show X purchases"
    m = ql.match(/(?:show|list)(?: all)?\s+([a-z0-9\s]+?)\s*purchases/);
    if (m) {
      const name = m[1].trim();
      const matches = [];
      receipts.forEach(r => r.items.forEach(i => { if (i.name.toLowerCase().includes(name)) matches.push([r.receiptNo, r.supplier, r.date, i.qty, money(i.total)]); }));
      if (matches.length === 0) return `No purchases found for "${name}".`;
      return `Here are all <b>${name}</b> purchases:` + tableHTML(matches, ["Receipt", "Supplier", "Date", "Qty", "Total"]);
    }

    // "show purchases from Month"
    m = ql.match(/from\s+(january|february|march|april|may|june|july|august|september|october|november|december)/);
    if (m) {
      const month = m[1];
      const list = receipts.filter(r => new Date(r.date).toLocaleString('default', { month: 'long' }).toLowerCase() === month);
      if (list.length === 0) return `No receipts found in ${month}.`;
      return `Purchases from <b>${month}</b>:` + tableHTML(list.map(r => [r.receiptNo, r.supplier, r.date, money(r.grandTotal)]), ["Receipt", "Supplier", "Date", "Total"]);
    }

    // "cheaper" price comparison
    m = ql.match(/which supplier sells (.+) cheaper/) || ql.match(/cheapest (.+)/);
    if (m) {
      const name = m[1].trim();
      const rows = [];
      receipts.forEach(r => r.items.forEach(i => { if (i.name.toLowerCase().includes(name)) rows.push([r.supplier, i.unitPrice]); }));
      if (rows.length === 0) return `I don't have purchase data for "${name}" yet.`;
      const bySupplier = {};
      rows.forEach(([s, p]) => { if (!bySupplier[s]) bySupplier[s] = []; bySupplier[s].push(p); });
      const avg = Object.entries(bySupplier).map(([s, ps]) => [s, (ps.reduce((a, b) => a + b, 0) / ps.length)]).sort((a, b) => a[1] - b[1]);
      return `Average unit price for <b>${name}</b> by supplier (cheapest first):` + tableHTML(avg.map(([s, p]) => [s, money(p)]), ["Supplier", "Avg. Unit Price"]);
    }

    // fallback search
    const results = smartSearch(q);
    if (results.length) {
      return `I found ${results.length} receipt${results.length !== 1 ? 's' : ''} matching "${q}":` + tableHTML(results.map(r => [r.receiptNo, r.supplier, r.date, money(r.grandTotal)]), ["Receipt", "Supplier", "Date", "Total"]);
    }
    return `I couldn't match that to a specific query yet — try asking about a supplier, product, amount, or month. e.g. "How much did I spend at Silver Star?"`;
  };

  const handleAsk = (q) => {
    if (!q || !q.trim()) return;
    const userMsg = { who: 'user', html: q.trim() };
    const ansHtml = answerQuery(q.trim());
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');

    setTimeout(() => {
      setMessages(prev => [...prev, { who: 'ai', html: ansHtml }]);
    }, 250);
  };

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>AI Insights</h1>
          <p>Ask questions about your purchases in plain language.</p>
        </div>
      </div>

      <div className="ai-shell">
        <div className="ai-msgs">
          {messages.map((m, idx) => (
            <div key={idx} className={`msg ${m.who}`} dangerouslySetInnerHTML={{ __html: m.html }} />
          ))}
          <div ref={msgsEndRef} />
        </div>

        <div className="ai-suggest">
          <button className="ai-chip" onClick={() => handleAsk('How much did I spend at FU WAN?')}>
            How much did I spend at FU WAN?
          </button>
          <button className="ai-chip" onClick={() => handleAsk('Show purchases over GHS 500')}>
            Show purchases over GHS 500
          </button>
          <button className="ai-chip" onClick={() => handleAsk('When did I last buy brake rod?')}>
            When did I last buy brake rod?
          </button>
          <button className="ai-chip" onClick={() => handleAsk('Show all tyre purchases')}>
            Show all tyre purchases
          </button>
        </div>

        <div className="ai-input">
          <input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAsk(inputVal); }}
            placeholder="e.g. Which supplier sells batteries cheaper?"
          />
          <button className="btn btn-primary" onClick={() => handleAsk(inputVal)}>
            Ask
          </button>
        </div>
      </div>
    </div>
  );
};
