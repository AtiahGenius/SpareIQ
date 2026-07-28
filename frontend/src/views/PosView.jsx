import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const PosView = ({ onOpenSaleModal }) => {
  const {
    inventory, cart, addToCart, updateCartQty, removeFromCart,
    cancelCart, completeSale, money
  } = useApp();

  const [posSearch, setPosSearch] = useState('');
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState(0);

  const filteredProducts = inventory.filter(i =>
    i.status === "active" && (!posSearch ||
      i.name.toLowerCase().includes(posSearch.toLowerCase()) ||
      i.code.toLowerCase().includes(posSearch.toLowerCase()) ||
      (i.barcode || "").includes(posSearch) ||
      (i.models || "").toLowerCase().includes(posSearch.toLowerCase()) ||
      (i.category || "").toLowerCase().includes(posSearch.toLowerCase()))
  );

  const cartSubtotal = cart.reduce((s, c) => s + c.qty * c.sellingPrice, 0);
  const checkoutGrandTotal = +(cartSubtotal - discount + tax).toFixed(2);
  const balance = +(amountPaid - checkoutGrandTotal).toFixed(2);

  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setDiscount(0);
    setTax(0);
    setAmountPaid(cartSubtotal);
    setPaymentMethod('Cash');
    setCheckoutModalOpen(true);
  };

  const handleCompleteSale = async () => {
    const sale = await completeSale({
      subtotal: cartSubtotal,
      discount: +discount || 0,
      tax: +tax || 0,
      grandTotal: checkoutGrandTotal,
      amountPaid: +amountPaid || 0,
      balance: balance,
      paymentMethod
    });
    setCheckoutModalOpen(false);
    if (sale) {
      onOpenSaleModal(sale);
    }
  };

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>New Sale</h1>
          <p>Search or browse products, add to cart, then checkout.</p>
        </div>
        <div style={{ maxWidth: '320px', flex: 1 }}>
          <div className="search-shell" style={{ maxWidth: 'none' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            <input
              value={posSearch}
              onChange={(e) => setPosSearch(e.target.value)}
              placeholder="Search by name, code, barcode, model..."
            />
          </div>
        </div>
      </div>

      <div className="pos-grid">
        <div className="pos-products">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(i => {
              const isLow = i.stock <= i.minStock;
              const isOos = i.stock <= 0;
              return (
                <div
                  key={i.code}
                  className={`pos-product ${isLow ? 'low' : ''} ${isOos ? 'oos' : ''}`}
                  onClick={() => !isOos && addToCart(i.code)}
                >
                  <div className="pname">{i.name}</div>
                  <div className="pcode">{i.code}</div>
                  <div className="pprice">{money(i.sellingPrice)}</div>
                  <div className="pstock">{isOos ? 'Out of stock' : i.stock + ' in stock'}</div>
                </div>
              );
            })
          ) : (
            <div className="empty">No products match your search.</div>
          )}
        </div>

        <div className="cart-panel">
          <h3 style={{ marginBottom: '10px' }}>Cart</h3>

          <div className="cart-items">
            {cart.length > 0 ? (
              cart.map((c, idx) => (
                <div className="cart-row" key={c.code || idx}>
                  <div className="cname">
                    {c.name || 'Product'}
                    <small>{money(c.sellingPrice || 0)} each &middot; locked price</small>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={c.maxStock || c.stock || 999}
                    value={c.qty}
                    onChange={(e) => updateCartQty(c.code || idx, e.target.value)}
                  />
                  <button className="btn btn-sm btn-ghost" onClick={() => removeFromCart(c.code || idx)}>✕</button>
                </div>
              ))
            ) : (
              <div className="empty" style={{ padding: '30px 6px' }}>Cart is empty — click a product to add it.</div>
            )}
          </div>

          <div style={{ marginTop: '10px' }}>
            <div className="cart-total-row"><span>Subtotal</span><b className="mono">{money(cartSubtotal)}</b></div>
            <div className="cart-total-row grand"><span>Total</span><b className="mono">{money(cartSubtotal)}</b></div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}
            disabled={cart.length === 0}
            onClick={handleOpenCheckout}
          >
            Checkout
          </button>

          <button
            className="btn btn-sm btn-ghost"
            style={{ width: '100%', justifyContent: 'center', marginTop: '6px' }}
            onClick={cancelCart}
          >
            Clear Cart
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {checkoutModalOpen && (
        <div className="modal-bg active" role="dialog" aria-modal="true" onClick={(e) => { if (e.target.classList.contains('modal-bg')) setCheckoutModalOpen(false); }}>
          <div className="modal" style={{ maxWidth: '460px' }}>
            <div className="modal-head">
              <h3 style={{ fontFamily: 'var(--font-display)' }}>Checkout</h3>
              <button className="modal-close" onClick={() => setCheckoutModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <table className="items-tbl" style={{ marginBottom: '14px' }}>
                <thead><tr><th>Product</th><th>Qty</th><th>Total</th></tr></thead>
                <tbody>
                  {cart.map(c => (
                    <tr key={c.code}>
                      <td>{c.name}</td>
                      <td>{c.qty}</td>
                      <td className="mono">{money(c.qty * c.sellingPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="field-row">
                <div className="field">
                  <label>Discount</label>
                  <input type="number" value={discount} onChange={(e) => setDiscount(+e.target.value || 0)} />
                </div>
                <div className="field">
                  <label>Tax</label>
                  <input type="number" value={tax} onChange={(e) => setTax(+e.target.value || 0)} />
                </div>
              </div>

              <div className="cart-total-row"><span>Subtotal</span><b className="mono">{money(cartSubtotal)}</b></div>
              <div className="cart-total-row grand"><span>Grand Total</span><b className="mono">{money(checkoutGrandTotal)}</b></div>

              <div className="field" style={{ marginTop: '12px' }}>
                <label>Payment Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option>Cash</option>
                  <option>Mobile Money</option>
                  <option>Bank</option>
                  <option>Mixed Payment</option>
                </select>
              </div>

              <div className="field">
                <label>Amount Paid</label>
                <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(+e.target.value || 0)} />
              </div>

              <div className="field">
                <label>Balance</label>
                <input type="number" value={balance} readOnly />
              </div>

              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }} onClick={handleCompleteSale}>
                ✔ Complete Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
