import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const AppContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const SUPPLIERS = [
  { name: "FU WAN Motor Parts", phone: "+233 24 411 2290", address: "Abossey Okai, Accra" },
  { name: "Silver Star Cycle Traders", phone: "+233 20 552 8813", address: "Suame Magazine, Kumasi" },
  { name: "TVS Parts Ghana Ltd", phone: "+233 26 903 1147", address: "Spintex Road, Accra" },
  { name: "Honda Genuine Spares", phone: "+233 54 220 7765", address: "Tema Station Rd, Tema" },
  { name: "Wan Li Import & Export", phone: "+86 138 0013 8000", address: "Guangzhou, China" },
];

const INVENTORY_SEED = [
  { code: "0514000HS01L-01-001", name: "Brake Rod GN", desc: "Rear brake connecting rod", models: "GN125, GN150", unit: "pc", cost: 18.50 },
  { code: "BAT-12V-7AH", name: "Battery 12V 7Ah", desc: "Maintenance-free sealed battery", models: "Universal", unit: "pc", cost: 145.00 },
  { code: "SPK-A7TC", name: "Spark Plug A7TC", desc: "Standard spark plug", models: "Universal 100-150cc", unit: "pc", cost: 6.00 },
  { code: "CLU-CBL-STD", name: "Clutch Cable", desc: "Standard clutch cable", models: "Most 125-150cc", unit: "pc", cost: 22.00 },
  { code: "CHN-428-KIT", name: "Chain & Sprocket Kit 428", desc: "Drive chain + front/rear sprocket", models: "Universal", unit: "set", cost: 210.00 },
  { code: "TYR-90-90-18", name: "Tyre 90/90-18", desc: "Rear tyre, tube type", models: "Universal", unit: "pc", cost: 165.00 },
  { code: "OIL-4T-1L", name: "Engine Oil 4T 1L", desc: "Mineral 4-stroke engine oil", models: "Universal", unit: "bottle", cost: 32.00 },
  { code: "HDL-GRIP-STD", name: "Handle Grip Set", desc: "Rubber grip pair", models: "Universal", unit: "set", cost: 14.00 },
  { code: "BRK-PAD-FRT", name: "Front Brake Pad", desc: "Disc brake pad set", models: "Universal disc models", unit: "set", cost: 28.00 },
  { code: "CDI-UNIV", name: "CDI Unit Universal", desc: "5-pin universal CDI", models: "Universal", unit: "pc", cost: 38.00 },
];

const EXTRA_SEED = {
  "0514000HS01L-01-001": { sellingPrice: 26.00, stock: 34, minStock: 10, category: "Brakes", barcode: "6934567800011" },
  "BAT-12V-7AH": { sellingPrice: 195.00, stock: 9, minStock: 5, category: "Electrical", barcode: "6934567800028" },
  "SPK-A7TC": { sellingPrice: 9.50, stock: 120, minStock: 30, category: "Engine", barcode: "6934567800035" },
  "CLU-CBL-STD": { sellingPrice: 32.00, stock: 22, minStock: 10, category: "Transmission", barcode: "6934567800042" },
  "CHN-428-KIT": { sellingPrice: 280.00, stock: 6, minStock: 5, category: "Transmission", barcode: "6934567800059" },
  "TYR-90-90-18": { sellingPrice: 220.00, stock: 14, minStock: 6, category: "Tyres", barcode: "6934567800066" },
  "OIL-4T-1L": { sellingPrice: 42.00, stock: 48, minStock: 15, category: "Fluids", barcode: "6934567800073" },
  "HDL-GRIP-STD": { sellingPrice: 20.00, stock: 3, minStock: 10, category: "Body", barcode: "6934567800080" },
  "BRK-PAD-FRT": { sellingPrice: 40.00, stock: 26, minStock: 10, category: "Brakes", barcode: "6934567800097" },
  "CDI-UNIV": { sellingPrice: 55.00, stock: 11, minStock: 8, category: "Electrical", barcode: "6934567800103" },
};

const INITIAL_EMPLOYEES = [
  { id: "EMP0001", name: "Kwame Asante (Owner)", password: "admin123", role: "admin", status: "active", branch: "Main Shop", created: new Date(Date.now() - 200 * 86400000).toISOString().slice(0, 10) },
  { id: "EMP0002", name: "Ama Boateng", password: "cashier123", role: "cashier", status: "active", branch: "Main Shop", created: new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10) },
  { id: "EMP0003", name: "Kojo Mensah", password: "cashier123", role: "cashier", status: "disabled", branch: "Main Shop", created: new Date(Date.now() - 40 * 86400000).toISOString().slice(0, 10) },
];

export const AppProvider = ({ children }) => {
  const [theme, setThemeState] = useState('light');
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('spareiq_token') || null);
  const [activeView, setActiveView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // Data entities
  const [inventory, setInventory] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [suppliersMeta, setSuppliersMeta] = useState({});
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [sales, setSales] = useState([]);
  const [stockLog, setStockLog] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [cart, setCart] = useState([]);
  const [shopProfile, setShopProfile] = useState({
    name: "SpareIQ Parts Shop",
    address: "Abossey Okai, Accra",
    phone: "+233 24 000 0000",
    logo: null
  });

  // Modal states
  const [lightboxImg, setLightboxImg] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ active: false, title: '', msg: '', onYes: null });
  const [tourModalOpen, setTourModalOpen] = useState(false);
  const [tourSeen, setTourSeen] = useState({ admin: false, cashier: false });

  // Counters
  const [receiptSeq, setReceiptSeq] = useState(13);
  const [empSeq, setEmpSeq] = useState(3);
  const [saleSeq, setSaleSeq] = useState(9);

  // Inactivity session timer (3 minutes = 180 seconds)
  const SESSION_TIMEOUT_SECONDS = 180;
  const [sessionCountdown, setSessionCountdown] = useState(SESSION_TIMEOUT_SECONDS);
  const inactivityTimerRef = useRef(null);

  // Helper: Money Formatter
  const money = (amount) => {
    const num = parseFloat(amount) || 0;
    return `GHS ${num.toFixed(2)}`;
  };

  // Helper: Toast Notifications
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const toast = (message, type = 'info') => showToast(message, type);

  // Helper: Audit Logger
  const logAudit = (action, detail) => {
    if (!currentUser) return;
    const entry = {
      id: 'AUD-' + Date.now(),
      timestamp: new Date().toISOString(),
      user: `${currentUser.name} (${currentUser.id})`,
      action,
      detail
    };
    setAuditLog(prev => [entry, ...prev]);
  };

  // Theme Toggler
  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Initialize seed data & server sync
  useEffect(() => {
    // Inventory Local Fallback Seed
    const inv = INVENTORY_SEED.map(i => ({
      ...i,
      ...(EXTRA_SEED[i.code] || { sellingPrice: i.cost * 1.4, stock: 20, minStock: 10, category: "General", barcode: "" }),
      status: "active",
      dateAdded: new Date(Date.now() - 150 * 86400000).toISOString().slice(0, 10),
      lastUpdated: new Date().toISOString().slice(0, 10)
    }));
    setInventory(inv);

    const supMap = {};
    SUPPLIERS.forEach(s => { supMap[s.name] = { phone: s.phone, address: s.address }; });
    setSuppliersMeta(supMap);

    // Initial check for logged in user token
    if (authToken) {
      fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (data.user) {
          setCurrentUser(data.user);
          refreshBackendData(authToken);
        }
      })
      .catch(() => {
        localStorage.removeItem('spareiq_token');
        setAuthToken(null);
      });
    }
  }, []);

  // Fetch all backend data from Node/Express API
  const refreshBackendData = async (token = authToken) => {
    if (!token) return;
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      // Inventory
      const invRes = await fetch(`${API_BASE_URL}/inventory`, { headers });
      if (invRes.ok) {
        const invData = await invRes.json();
        if (Array.isArray(invData) && invData.length > 0) {
          const normalized = invData.map(i => {
            const costVal = Number(i.cost ?? i.costPrice ?? 0);
            const sellingVal = Number(i.sellingPrice ?? i.price ?? 0);
            const descVal = i.desc ?? i.description ?? '';
            return {
              ...i,
              cost: costVal,
              costPrice: costVal,
              sellingPrice: sellingVal,
              desc: descVal,
              description: descVal
            };
          });
          setInventory(normalized);
        }
      }

      // Receipts
      const recRes = await fetch(`${API_BASE_URL}/receipts`, { headers });
      if (recRes.ok) {
        const recData = await recRes.json();
        if (Array.isArray(recData)) setReceipts(recData);
      }

      // Sales
      const salesRes = await fetch(`${API_BASE_URL}/sales`, { headers });
      if (salesRes.ok) {
        const salesData = await salesRes.json();
        if (Array.isArray(salesData)) setSales(salesData);
      }

      // Employees
      const empRes = await fetch(`${API_BASE_URL}/employees`, { headers });
      if (empRes.ok) {
        const empData = await empRes.json();
        if (Array.isArray(empData) && empData.length > 0) setEmployees(empData);
      }

      // Shop Profile
      const shopRes = await fetch(`${API_BASE_URL}/settings/shop-profile`, { headers });
      if (shopRes.ok) {
        const shopData = await shopRes.json();
        if (shopData && shopData.name) setShopProfile(shopData);
      }
    } catch (err) {
      console.warn('Backend server offline or unreachable. Running in local state mode.');
    }
  };

  // Inactivity timer logic
  const resetInactivityTimer = () => {
    setSessionCountdown(SESSION_TIMEOUT_SECONDS);
  };

  useEffect(() => {
    if (!currentUser) return;

    const handleUserActivity = () => resetInactivityTimer();
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);

    inactivityTimerRef.current = setInterval(() => {
      setSessionCountdown(prev => {
        if (prev <= 1) {
          clearInterval(inactivityTimerRef.current);
          logout(true); // Auto logout on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      if (inactivityTimerRef.current) clearInterval(inactivityTimerRef.current);
    };
  }, [currentUser]);

  // Login
  const login = async (id, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('spareiq_token', data.token);
        setAuthToken(data.token);
        setCurrentUser(data.user);
        showToast(`Welcome back, ${data.user.name}!`, 'success');
        refreshBackendData(data.token);
        return { success: true };
      } else {
        const data = await res.json().catch(() => ({}));
        const errMsg = data.error || data.message || 'Invalid Employee ID or password.';
        return { success: false, error: errMsg, msg: errMsg };
      }
    } catch (err) {
      console.warn('Backend login connection failed, falling back to local verification.');
    }

    // Fallback Local Auth
    const emp = employees.find(e => e.id.toUpperCase() === id.trim().toUpperCase());
    if (!emp) return { success: false, error: 'Employee ID not found.', msg: 'Employee ID not found.' };
    if (emp.status === 'disabled') return { success: false, error: 'Account is disabled. Contact your administrator.', msg: 'Account is disabled. Contact your administrator.' };
    if (emp.password !== password) return { success: false, error: 'Incorrect password.', msg: 'Incorrect password.' };

    setCurrentUser(emp);
    showToast(`Welcome back, ${emp.name}!`, 'success');
    return { success: true };
  };

  // Logout
  const logout = async (isAuto = false) => {
    if (authToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
      } catch (err) {}
    }
    localStorage.removeItem('spareiq_token');
    setAuthToken(null);
    setCurrentUser(null);
    setCart([]);
    if (isAuto) {
      showToast('Logged out due to 3 minutes of inactivity.', 'warning');
    } else {
      showToast('Logged out successfully.', 'info');
    }
  };

  // Employee actions
  const createEmployee = async (data) => {
    if (authToken) {
      try {
        const res = await fetch(`${API_BASE_URL}/employees`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          const newEmp = await res.json();
          showToast(`Employee ${newEmp.name} (${newEmp.id}) created!`, 'success');
          refreshBackendData();
          return newEmp;
        }
      } catch (e) {}
    }

    // Fallback
    const nextSeq = empSeq + 1;
    setEmpSeq(nextSeq);
    const newEmp = {
      id: `EMP${String(nextSeq).padStart(4, '0')}`,
      name: data.name,
      password: data.password || 'cashier123',
      role: data.role || 'cashier',
      status: 'active',
      branch: data.branch || 'Main Shop',
      created: new Date().toISOString().slice(0, 10)
    };
    setEmployees(prev => [...prev, newEmp]);
    showToast(`Employee ${newEmp.name} (${newEmp.id}) created!`, 'success');
    return newEmp;
  };

  const resetPassword = async (empId) => {
    const tempPass = Math.random().toString(36).slice(-8);
    if (authToken) {
      try {
        const res = await fetch(`${API_BASE_URL}/employees/${empId}/password`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ newPassword: tempPass })
        });
        if (res.ok) {
          showToast(`Password reset for ${empId}. Temporary password: ${tempPass}`, 'warning');
          return;
        }
      } catch (e) {}
    }
    showToast(`Password reset for ${empId}. Temporary password: ${tempPass}`, 'warning');
  };

  const toggleEmployeeStatus = async (empId) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;
    const nextStatus = emp.status === 'active' ? 'disabled' : 'active';

    if (authToken) {
      try {
        const res = await fetch(`${API_BASE_URL}/employees/${empId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ status: nextStatus })
        });
        if (res.ok) {
          showToast(`Status updated for ${empId}.`, 'info');
          refreshBackendData();
          return;
        }
      } catch (e) {}
    }

    setEmployees(prev => prev.map(e => e.id === empId ? { ...e, status: nextStatus } : e));
    showToast(`Status updated for ${empId}.`, 'info');
  };

  // Cart operations
  const addToCart = (productOrCode) => {
    const product = typeof productOrCode === 'string'
      ? inventory.find(i => i.code === productOrCode)
      : productOrCode;

    if (!product) {
      showToast('Product not found.', 'error');
      return;
    }

    const stock = Number(product.stock ?? 0);
    const sellingPrice = Number(product.sellingPrice ?? product.price ?? 0);
    const costPrice = Number(product.costPrice ?? product.cost ?? 0);

    if (stock <= 0) {
      showToast(`${product.name || 'Product'} is out of stock!`, 'error');
      return;
    }

    setCart(prev => {
      const existing = prev.find(i => i.code === product.code);
      if (existing) {
        if (existing.qty >= stock) {
          showToast(`Cannot add more. Max stock is ${stock}.`, 'warning');
          return prev;
        }
        return prev.map(i => i.code === product.code ? {
          ...i,
          qty: i.qty + 1,
          total: (i.qty + 1) * sellingPrice
        } : i);
      }
      return [...prev, {
        code: product.code,
        name: product.name,
        sellingPrice: sellingPrice,
        costPrice: costPrice,
        stock: stock,
        maxStock: stock,
        qty: 1,
        total: sellingPrice
      }];
    });

    showToast(`Added ${product.name} to cart.`, 'success');
  };

  const updateCartQty = (codeOrIdx, qty) => {
    const newQty = parseInt(qty, 10) || 0;
    setCart(prev => {
      let targetCode = codeOrIdx;
      if (typeof codeOrIdx === 'number') {
        const item = prev[codeOrIdx];
        if (!item) return prev;
        targetCode = item.code;
      }
      if (newQty <= 0) {
        return prev.filter(i => i.code !== targetCode);
      }
      const product = inventory.find(i => i.code === targetCode);
      const maxStock = product ? Number(product.stock ?? 9999) : 9999;
      if (newQty > maxStock) {
        showToast(`Only ${maxStock} available in stock.`, 'warning');
        return prev;
      }
      return prev.map(i => i.code === targetCode ? {
        ...i,
        qty: newQty,
        total: newQty * (i.sellingPrice || 0)
      } : i);
    });
  };

  const removeFromCart = (codeOrIdx) => {
    setCart(prev => {
      if (typeof codeOrIdx === 'number') {
        return prev.filter((_, idx) => idx !== codeOrIdx);
      }
      return prev.filter(i => i.code !== codeOrIdx);
    });
  };

  const clearCart = () => setCart([]);

  // Complete POS Sale
  const completeSale = async (saleData) => {
    const calculatedSubtotal = saleData.subtotal ?? cart.reduce((s, c) => s + (c.qty * (c.sellingPrice || 0)), 0);
    const calculatedGrandTotal = saleData.grandTotal ?? calculatedSubtotal;
    const calculatedAmountPaid = saleData.amountPaid ?? calculatedGrandTotal;
    const calculatedBalance = saleData.balance ?? (calculatedAmountPaid - calculatedGrandTotal);
    const currentCartItems = [...cart];

    // Instantly update local inventory stock for responsive UI
    setInventory(prevInv => prevInv.map(invItem => {
      const cartItem = currentCartItems.find(c => c.code === invItem.code);
      if (cartItem) {
        const newStock = Math.max(0, (invItem.stock || 0) - (cartItem.qty || 1));
        return { ...invItem, stock: newStock };
      }
      return invItem;
    }));

    if (authToken) {
      try {
        const res = await fetch(`${API_BASE_URL}/sales`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            cartItems: currentCartItems,
            subtotal: calculatedSubtotal,
            discount: saleData.discount || 0,
            tax: saleData.tax || 0,
            grandTotal: calculatedGrandTotal,
            amountPaid: calculatedAmountPaid,
            balance: calculatedBalance,
            paymentMethod: saleData.paymentMethod || 'Cash'
          })
        });

        if (res.ok) {
          const completedSale = await res.json();
          clearCart();
          showToast(`Sale completed! Receipt: ${completedSale.receiptNo}`, 'success');
          refreshBackendData(authToken);
          return {
            ...completedSale,
            items: completedSale.items || currentCartItems
          };
        }
      } catch (err) {
        console.warn('Backend POS checkout failed, using local transaction.');
      }
    }

    // Local Fallback
    const nextSeq = saleSeq + 1;
    setSaleSeq(nextSeq);
    const receiptNo = `S-${String(nextSeq).padStart(5, '0')}`;
    const txnId = `TXN-${String(nextSeq).padStart(5, '0')}`;

    const newSale = {
      id: 'SALE-' + Date.now(),
      txnId,
      receiptNo,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      empId: currentUser?.id || 'EMP0001',
      empName: currentUser?.name || 'Cashier',
      items: currentCartItems.map(i => {
        const qty = Number(i.qty || 1);
        const sellingPrice = Number(i.sellingPrice || 0);
        const costPrice = Number(i.costPrice || i.cost || 0);
        const total = Number(i.total ?? (qty * sellingPrice));
        const profit = total - (qty * costPrice);
        return {
          ...i,
          qty,
          sellingPrice,
          costPrice,
          total,
          profit
        };
      }),
      subtotal: calculatedSubtotal,
      discount: saleData.discount || 0,
      tax: saleData.tax || 0,
      grandTotal: calculatedGrandTotal,
      amountPaid: calculatedAmountPaid,
      balance: calculatedBalance,
      paymentMethod: saleData.paymentMethod || 'Cash'
    };

    setSales(prev => [newSale, ...prev]);
    clearCart();
    showToast(`Sale completed! Receipt: ${receiptNo}`, 'success');
    return newSale;
  };

  // Save Verified Receipt (Upload Module)
  const saveVerifiedReceipt = async (receiptData) => {
    // Instantly update inventory stock in local state for restocked items
    if (Array.isArray(receiptData.items)) {
      setInventory(prevInv => prevInv.map(invItem => {
        const rItem = receiptData.items.find(i => i.code === invItem.code);
        if (rItem) {
          return { ...invItem, stock: (invItem.stock || 0) + (Number(rItem.qty) || 0) };
        }
        return invItem;
      }));
    }

    if (authToken) {
      try {
        const res = await fetch(`${API_BASE_URL}/receipts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(receiptData)
        });

        if (res.ok) {
          const saved = await res.json();
          showToast(`Receipt ${saved.receiptNo} saved & inventory restocked!`, 'success');
          refreshBackendData(authToken);
          return saved;
        }
      } catch (err) {
        console.warn('Backend receipt save failed, using local fallback.');
      }
    }

    // Local Fallback
    const nextSeq = receiptSeq + 1;
    setReceiptSeq(nextSeq);
    const rNo = `R-${String(nextSeq).padStart(5, '0')}`;

    const newReceipt = {
      id: 'REC-' + Date.now(),
      receiptNo: rNo,
      supplier: receiptData.supplier,
      invoiceNo: receiptData.invoiceNo,
      date: receiptData.date,
      time: receiptData.time,
      currency: receiptData.currency || 'GHS',
      subtotal: receiptData.subtotal,
      discount: receiptData.discount,
      tax: receiptData.tax,
      grandTotal: receiptData.grandTotal,
      notes: receiptData.notes,
      imageDataUrl: receiptData.imageDataUrl,
      items: receiptData.items || []
    };

    setReceipts(prev => [newReceipt, ...prev]);
    showToast(`Receipt ${rNo} saved successfully!`, 'success');
    return newReceipt;
  };

  // Inventory actions
  const createInventoryItem = async (itemData) => {
    const costVal = Number(itemData.costPrice ?? itemData.cost ?? 0);
    const sellingVal = Number(itemData.sellingPrice ?? 0);
    const descVal = itemData.description ?? itemData.desc ?? '';
    const payload = {
      ...itemData,
      costPrice: costVal,
      cost: costVal,
      sellingPrice: sellingVal,
      description: descVal,
      desc: descVal
    };

    if (authToken) {
      try {
        const res = await fetch(`${API_BASE_URL}/inventory`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const newItem = await res.json();
          showToast(`Item ${newItem.code} created!`, 'success');
          refreshBackendData();
          return newItem;
        }
      } catch (e) {}
    }

    setInventory(prev => [...prev, { ...payload, status: 'active' }]);
    showToast(`Item ${itemData.code} created!`, 'success');
  };

  const updateItemPrice = async (code, fieldOrCost, valueOrSelling) => {
    let costVal, sellingVal;
    const existing = inventory.find(i => i.code === code);
    if (typeof fieldOrCost === 'string') {
      const val = parseFloat(valueOrSelling) || 0;
      if (fieldOrCost === 'cost' || fieldOrCost === 'costPrice') {
        costVal = val;
        sellingVal = existing ? Number(existing.sellingPrice ?? 0) : 0;
      } else {
        costVal = existing ? Number(existing.cost ?? existing.costPrice ?? 0) : 0;
        sellingVal = val;
      }
    } else {
      costVal = parseFloat(fieldOrCost) || 0;
      sellingVal = parseFloat(valueOrSelling) || 0;
    }

    if (authToken) {
      try {
        const res = await fetch(`${API_BASE_URL}/inventory/${code}/price`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ costPrice: costVal, sellingPrice: sellingVal })
        });
        if (res.ok) {
          showToast(`Price updated for ${code}.`, 'success');
          refreshBackendData();
          return;
        }
      } catch (e) {}
    }

    setInventory(prev => prev.map(i => i.code === code ? { ...i, cost: costVal, costPrice: costVal, sellingPrice: sellingVal } : i));
    showToast(`Price updated for ${code}.`, 'success');
  };

  const deleteInventoryItem = async (code) => {
    if (authToken) {
      try {
        const res = await fetch(`${API_BASE_URL}/inventory/${code}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) {
          showToast(`Item ${code} disabled.`, 'warning');
          refreshBackendData();
          return;
        }
      } catch (e) {}
    }

    setInventory(prev => prev.filter(i => i.code !== code));
    showToast(`Item ${code} removed.`, 'warning');
  };

  // Settings
  const updateShopProfile = async (data) => {
    if (authToken) {
      try {
        const res = await fetch(`${API_BASE_URL}/settings/shop-profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          const updated = await res.json();
          setShopProfile(updated);
          showToast('Shop profile updated!', 'success');
          return;
        }
      } catch (e) {}
    }

    setShopProfile(prev => ({ ...prev, ...data }));
    showToast('Shop profile updated!', 'success');
  };

  const showView = (viewName) => {
    setActiveView(viewName);
    setIsMobileMenuOpen(false);
  };

  const deleteReceipt = async (id) => {
    if (authToken) {
      try {
        await fetch(`${API_BASE_URL}/receipts/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
      } catch (err) {}
    }
    setReceipts(prev => prev.filter(r => r.id !== id));
    showToast('Receipt deleted.', 'warning');
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const closeConfirm = () => setConfirmModal({ active: false, title: '', msg: '', onYes: null });

  const importInventoryCSV = (rows) => {
    if (!Array.isArray(rows)) return;
    let importedCount = 0;
    setInventory(prev => {
      const next = [...prev];
      rows.forEach(r => {
        const itemCode = r.code || r.Code || r.CODE || `ITEM-${Date.now()}-${Math.floor(Math.random()*1000)}`;
        const existingIdx = next.findIndex(i => i.code === itemCode);
        const newItem = {
          code: itemCode,
          name: r.name || r.Name || 'Imported Item',
          desc: r.desc || r.Desc || r.description || '',
          models: r.models || r.Models || 'Universal',
          unit: r.unit || r.Unit || 'pc',
          cost: parseFloat(r.cost || r.Cost || 0) || 10,
          sellingPrice: parseFloat(r.sellingPrice || r.SellingPrice || r.price || 0) || 15,
          stock: parseInt(r.stock || r.Stock || 0, 10) || 10,
          minStock: parseInt(r.minStock || r.MinStock || 0, 10) || 5,
          category: r.category || r.Category || 'General',
          barcode: r.barcode || r.Barcode || '',
          status: 'active',
          dateAdded: new Date().toISOString().slice(0, 10),
          lastUpdated: new Date().toISOString().slice(0, 10)
        };
        if (existingIdx >= 0) {
          next[existingIdx] = { ...next[existingIdx], ...newItem };
        } else {
          next.push(newItem);
        }
        importedCount++;
      });
      return next;
    });
    showToast(`Successfully imported ${importedCount} item(s)!`, 'success');
  };

  // Backup Trigger
  const triggerBackup = async () => {
    const timeStr = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `spareiq_backup_${timeStr}.json`;

    const dataPayload = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      shopProfile,
      inventory,
      sales,
      receipts,
      suppliersMeta,
      employees: employees.map(e => ({ ...e, password: 'REDACTED' })),
      auditLog
    };

    // 1. Browser JSON file download
    const blob = new Blob([JSON.stringify(dataPayload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();

    // 2. Desktop Electron IPC backup
    if (window.electronAPI && typeof window.electronAPI.runBackup === 'function') {
      try {
        await window.electronAPI.runBackup();
      } catch (e) {
        console.warn('Desktop IPC backup error:', e);
      }
    }

    // 3. Backend API backup endpoint
    if (authToken) {
      try {
        await fetch(`${API_BASE_URL}/settings/backup`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
      } catch (e) {
        console.warn('Backend API backup error:', e);
      }
    }

    logAudit('SYSTEM_BACKUP', `Created system backup archive ${filename}`);
    showToast(`Backup downloaded & saved (${filename})`, 'success');
  };

  // Context value bundle
  const value = {
    theme,
    setTheme,
    currentUser,
    activeView,
    setActiveView,
    showView,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    toasts,
    showToast,
    toast,
    removeToast,
    notifications,
    isNotifOpen,
    setIsNotifOpen,
    inventory,
    setInventory,
    receipts,
    setReceipts,
    saveReceipt: saveVerifiedReceipt,
    deleteReceipt,
    suppliersMeta,
    SUPPLIERS,
    employees,
    setEmployees,
    createEmployee,
    resetPassword,
    toggleEmployeeStatus,
    createInventoryItem,
    updateItemPrice,
    updateInvPrice: updateItemPrice,
    deleteInventoryItem,
    importInventoryCSV,
    sales,
    stockLog,
    auditLog,
    logAudit,
    cart,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    cancelCart: clearCart,
    completeSale,
    saveVerifiedReceipt,
    shopProfile,
    setShopProfile,
    updateShopProfile,
    triggerBackup,
    lightboxImg,
    setLightboxImg,
    confirmModal,
    setConfirmModal,
    closeConfirm,
    tourModalOpen,
    setTourModalOpen,
    tourSeen,
    setTourSeen,
    sessionCountdown,
    money,
    login,
    attemptLogin: login,
    logout,
    refreshBackendData
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
