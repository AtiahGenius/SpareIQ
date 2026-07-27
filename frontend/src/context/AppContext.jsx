import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const AppContext = createContext();

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

  // Initialize seed data
  useEffect(() => {
    // Inventory
    const inv = INVENTORY_SEED.map(i => ({
      ...i,
      ...(EXTRA_SEED[i.code] || { sellingPrice: i.cost * 1.4, stock: 20, minStock: 10, category: "General", barcode: "" }),
      status: "active",
      dateAdded: new Date(Date.now() - 150 * 86400000).toISOString().slice(0, 10),
      lastUpdated: new Date().toISOString().slice(0, 10)
    }));
    setInventory(inv);

    // Suppliers meta
    const supMap = {};
    SUPPLIERS.forEach(s => { supMap[s.name] = { phone: s.phone, address: s.address }; });
    setSuppliersMeta(supMap);

    // Sample Receipts
    const sampleReceipts = [
      { supplier: "FU WAN Motor Parts", daysAgo: 2, items: [["Brake Rod GN", 6, 18.5], ["Spark Plug A7TC", 20, 6]], invoiceNo: "INV-5619", tax: 0, discount: 10 },
      { supplier: "Silver Star Cycle Traders", daysAgo: 6, items: [["Battery 12V 7Ah", 4, 145], ["Handle Grip Set", 8, 14]], invoiceNo: "SS-2214", tax: 0, discount: 0 },
      { supplier: "TVS Parts Ghana Ltd", daysAgo: 11, items: [["Chain & Sprocket Kit 428", 3, 210], ["Engine Oil 4T 1L", 12, 32]], invoiceNo: "TVS-9012", tax: 5, discount: 0 },
      { supplier: "Honda Genuine Spares", daysAgo: 18, items: [["Front Brake Pad", 10, 28], ["CDI Unit Universal", 5, 38]], invoiceNo: "HGS-4471", tax: 0, discount: 15 },
      { supplier: "FU WAN Motor Parts", daysAgo: 24, items: [["Tyre 90/90-18", 6, 165], ["Clutch Cable", 10, 22]], invoiceNo: "INV-5588", tax: 0, discount: 0 },
      { supplier: "Wan Li Import & Export", daysAgo: 33, items: [["Spark Plug A7TC", 50, 6], ["Brake Rod GN", 12, 18.5]], invoiceNo: "WL-77031", tax: 0, discount: 20 },
      { supplier: "Silver Star Cycle Traders", daysAgo: 40, items: [["Battery 12V 7Ah", 6, 145], ["Engine Oil 4T 1L", 20, 32]], invoiceNo: "SS-2190", tax: 0, discount: 0 },
      { supplier: "TVS Parts Ghana Ltd", daysAgo: 52, items: [["Chain & Sprocket Kit 428", 4, 210], ["Front Brake Pad", 6, 28]], invoiceNo: "TVS-8890", tax: 0, discount: 0 },
      { supplier: "FU WAN Motor Parts", daysAgo: 61, items: [["Handle Grip Set", 15, 14], ["CDI Unit Universal", 8, 38]], invoiceNo: "INV-5501", tax: 0, discount: 0 },
      { supplier: "Honda Genuine Spares", daysAgo: 70, items: [["Tyre 90/90-18", 4, 165], ["Clutch Cable", 6, 22]], invoiceNo: "HGS-4390", tax: 0, discount: 0 },
      { supplier: "Wan Li Import & Export", daysAgo: 80, items: [["Brake Rod GN", 30, 17.5], ["Spark Plug A7TC", 100, 5.5]], invoiceNo: "WL-76890", tax: 0, discount: 40 },
      { supplier: "Silver Star Cycle Traders", daysAgo: 95, items: [["Battery 12V 7Ah", 3, 150]], invoiceNo: "SS-2050", tax: 0, discount: 0 },
    ];

    let rSeq = 1;
    const rList = sampleReceipts.map(r => {
      const date = new Date(Date.now() - r.daysAgo * 86400000);
      const items = r.items.map(([name, qty, price]) => {
        const itemMatch = inv.find(i => i.name === name);
        return { code: itemMatch ? itemMatch.code : "—", name, qty, unitPrice: price, total: +(qty * price).toFixed(2) };
      });
      const subtotal = items.reduce((s, i) => s + i.total, 0);
      const grand = +(subtotal - r.discount + r.tax).toFixed(2);
      const rec = {
        id: rSeq,
        receiptNo: "R-" + String(rSeq).padStart(5, "0"),
        invoiceNo: r.invoiceNo,
        supplier: r.supplier,
        date: date.toISOString().slice(0, 10),
        time: "10:3" + (rSeq % 9) + " AM",
        currency: "GHS",
        items, subtotal, discount: r.discount, tax: r.tax, grandTotal: grand,
        notes: "", imageDataUrl: null, status: "verified"
      };
      rSeq++;
      return rec;
    });
    setReceipts(rList);
    setReceiptSeq(rSeq);

    // Initial stock log
    const sLog = inv.map(i => ({
      code: i.code, name: i.name, type: "Opening Stock", change: i.stock,
      date: new Date(Date.now() - 150 * 86400000).toISOString().slice(0, 10), user: "System"
    }));
    setStockLog(sLog);

    // Historical sales
    const sampleSales = [
      { daysAgo: 1, emp: "EMP0002", items: [["SPK-A7TC", 2], ["OIL-4T-1L", 1]] },
      { daysAgo: 1, emp: "EMP0002", items: [["BRK-PAD-FRT", 1]] },
      { daysAgo: 2, emp: "EMP0003", items: [["HDL-GRIP-STD", 1], ["CLU-CBL-STD", 1]] },
      { daysAgo: 3, emp: "EMP0002", items: [["TYR-90-90-18", 1]] },
      { daysAgo: 4, emp: "EMP0002", items: [["CDI-UNIV", 1], ["SPK-A7TC", 4]] },
      { daysAgo: 5, emp: "EMP0003", items: [["BAT-12V-7AH", 1]] },
      { daysAgo: 6, emp: "EMP0002", items: [["0514000HS01L-01-001", 2]] },
      { daysAgo: 8, emp: "EMP0002", items: [["OIL-4T-1L", 3], ["SPK-A7TC", 6]] },
    ];
    let sSeq = 1;
    const saleList = sampleSales.map(s => {
      const emp = INITIAL_EMPLOYEES.find(e => e.id === s.emp);
      const items = s.items.map(([code, qty]) => {
        const itemInv = inv.find(i => i.code === code);
        return {
          code, name: itemInv.name, qty, sellingPrice: itemInv.sellingPrice,
          costPrice: itemInv.cost, total: +(qty * itemInv.sellingPrice).toFixed(2),
          profit: +(qty * (itemInv.sellingPrice - itemInv.cost)).toFixed(2)
        };
      });
      const total = items.reduce((a, b) => a + b.total, 0);
      const date = new Date(Date.now() - s.daysAgo * 86400000);
      const obj = {
        id: sSeq,
        txnId: "TXN-" + String(sSeq).padStart(5, "0"),
        receiptNo: "S-" + String(sSeq).padStart(5, "0"),
        date: date.toISOString().slice(0, 10),
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        empId: emp.id, empName: emp.name, items, subtotal: total, discount: 0, tax: 0,
        grandTotal: total, amountPaid: total, balance: 0, paymentMethod: "Cash"
      };
      sSeq++;
      return obj;
    });
    setSales(saleList);
    setSaleSeq(sSeq);

    setAuditLog([{ time: new Date().toISOString(), user: "System", action: "Application initialized", detail: "Demo data seeded" }]);
  }, []);

  // Theme effect
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // Session activity timer
  useEffect(() => {
    if (!currentUser) return;

    let countdown = SESSION_TIMEOUT_SECONDS;
    setSessionCountdown(countdown);

    const interval = setInterval(() => {
      countdown--;
      setSessionCountdown(countdown);
      if (countdown <= 0) {
        logout(true);
      }
    }, 1000);

    const resetTimer = () => {
      countdown = SESSION_TIMEOUT_SECONDS;
      setSessionCountdown(countdown);
    };

    const events = ["click", "keydown", "mousemove", "touchstart"];
    events.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }));

    return () => {
      clearInterval(interval);
      events.forEach(ev => window.removeEventListener(ev, resetTimer));
    };
  }, [currentUser]);

  // Helper Functions
  const money = (n) => "GHS " + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const toast = (msg, type) => {
    const id = Date.now() + Math.random();
    const newToast = { id, msg, type };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const undoToast = (msg, undoFn) => {
    const id = Date.now() + Math.random();
    const newToast = { id, msg, type: 'warning', undoFn };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const logAction = (user, action, detail) => {
    setAuditLog(prev => [{ time: new Date().toISOString(), user, action, detail }, ...prev]);
  };

  const addNotification = (text) => {
    setNotifications(prev => [{ text, time: new Date().toISOString() }, ...prev]);
  };

  const checkLowStock = () => {
    inventory.filter(i => i.stock <= i.minStock).forEach(i => {
      const exists = notifications.some(n => n.text.includes(i.name) && n.text.includes("Low stock"));
      if (!exists) {
        addNotification(`⚠ Low stock: <b>${i.name}</b> — ${i.stock} left (min ${i.minStock})`);
      }
    });
  };

  const setTheme = (mode) => {
    setThemeState(mode);
    toast(mode === "dark" ? "Dark mode on" : "Light mode on", "info");
  };

  const showView = (name) => {
    if (currentUser && currentUser.role === "cashier" && ["receipts", "upload", "inventory", "suppliers", "employees", "reports", "ai", "audit"].includes(name)) {
      toast("Your account doesn't have access to that section.", "warning");
      name = "dashboard";
    }
    setActiveView(name);
    setIsMobileMenuOpen(false);
  };

  const attemptLogin = (id, pass) => {
    const emp = employees.find(e => e.id === id.trim().toUpperCase());
    if (!emp || emp.password !== pass) {
      return { success: false, msg: "Incorrect Employee ID or password." };
    }
    if (emp.status === "disabled") {
      return { success: false, msg: "This account has been disabled by an administrator." };
    }
    setCurrentUser(emp);
    logAction(emp.name, "Logged in", emp.role === "admin" ? "Administrator login" : "Cashier login");
    setActiveView("dashboard");
    toast("Welcome back, " + emp.name.split(' ')[0] + "!", "success");
    
    // Trigger onboarding tour if not seen
    if (!tourSeen[emp.role]) {
      setTourSeen(prev => ({ ...prev, [emp.role]: true }));
      setTourModalOpen(true);
    }

    return { success: true };
  };

  const logout = (auto = false) => {
    if (currentUser) {
      logAction(currentUser.name, auto ? "Auto logout (inactivity)" : "Logged out", "");
    }
    setCurrentUser(null);
    setCart([]);
    if (auto) {
      toast("Session timed out due to inactivity — logged out for security", "warning");
    }
  };

  // Confirmation modal trigger
  const showConfirm = (title, msg, onYes) => {
    setConfirmModal({ active: true, title, msg, onYes });
  };

  const closeConfirm = () => {
    setConfirmModal({ active: false, title: '', msg: '', onYes: null });
  };

  // Cart / POS actions
  const addToCart = (code) => {
    const inv = inventory.find(i => i.code === code);
    if (!inv || inv.stock <= 0) {
      toast("This product is out of stock.", "warning");
      return;
    }
    setCart(prev => {
      const existing = prev.find(c => c.code === code);
      if (existing) {
        if (existing.qty + 1 > inv.stock) {
          toast("Not enough stock available.", "warning");
          return prev;
        }
        return prev.map(c => c.code === code ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { code: inv.code, name: inv.name, sellingPrice: inv.sellingPrice, costPrice: inv.cost, qty: 1, maxStock: inv.stock }];
    });
  };

  const updateCartQty = (idx, val) => {
    setCart(prev => {
      const copy = [...prev];
      const item = copy[idx];
      if (!item) return prev;
      const qty = Math.max(1, Math.min(+val || 1, item.maxStock));
      copy[idx] = { ...item, qty };
      return copy;
    });
  };

  const removeFromCart = (idx) => {
    setCart(prev => prev.filter((_, i) => i !== idx));
  };

  const cancelCart = () => {
    if (cart.length === 0) return;
    logAction(currentUser.name, "Sale cancelled", cart.length + " item(s) cleared before checkout");
    setCart([]);
    toast("Cart cleared", "info");
  };

  const completeSale = ({ discount, tax, grandTotal, amountPaid, paymentMethod }) => {
    const subtotal = cart.reduce((s, c) => s + c.qty * c.sellingPrice, 0);
    const now = new Date();

    const items = cart.map(c => {
      // update inventory stock
      setInventory(prevInv => prevInv.map(inv => {
        if (inv.code === c.code) {
          return { ...inv, stock: inv.stock - c.qty, lastUpdated: now.toISOString().slice(0, 10) };
        }
        return inv;
      }));

      // stock log
      setStockLog(prev => [{
        code: c.code, name: c.name, type: "Sold", change: -c.qty,
        date: now.toISOString().slice(0, 10), user: currentUser.name
      }, ...prev]);

      return {
        code: c.code, name: c.name, qty: c.qty, sellingPrice: c.sellingPrice,
        costPrice: c.costPrice, total: +(c.qty * c.sellingPrice).toFixed(2),
        profit: +(c.qty * (c.sellingPrice - c.costPrice)).toFixed(2)
      };
    });

    const newSale = {
      id: saleSeq,
      txnId: "TXN-" + String(saleSeq).padStart(5, "0"),
      receiptNo: "S-" + String(saleSeq).padStart(5, "0"),
      date: now.toISOString().slice(0, 10),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      empId: currentUser.id,
      empName: currentUser.name,
      items, subtotal, discount, tax, grandTotal, amountPaid,
      balance: +(amountPaid - grandTotal).toFixed(2),
      paymentMethod
    };

    setSales(prev => [...prev, newSale]);
    setSaleSeq(prev => prev + 1);
    logAction(currentUser.name, "Sale completed", newSale.txnId + " — " + money(grandTotal));
    checkLowStock();
    setCart([]);
    toast("Sale completed — " + newSale.receiptNo, "success");
    return newSale;
  };

  // Receipt actions
  const saveReceipt = (receiptData) => {
    const newRec = {
      id: receiptSeq,
      receiptNo: "R-" + String(receiptSeq).padStart(5, "0"),
      ...receiptData
    };
    setReceipts(prev => [...prev, newRec]);
    setReceiptSeq(prev => prev + 1);

    if (receiptData.supplier && !suppliersMeta[receiptData.supplier]) {
      setSuppliersMeta(prev => ({ ...prev, [receiptData.supplier]: { phone: "—", address: "—" } }));
    }

    // Auto restock matched items
    receiptData.items.forEach(i => {
      if (i.code && i.code !== "NEW") {
        setInventory(prevInv => prevInv.map(inv => {
          if (inv.code === i.code) {
            const updatedCost = i.unitPrice > 0 ? i.unitPrice : inv.cost;
            return { ...inv, stock: inv.stock + i.qty, cost: updatedCost, lastUpdated: receiptData.date };
          }
          return inv;
        }));
        setStockLog(prev => [{
          code: i.code, name: i.name, type: "Purchased", change: i.qty,
          date: receiptData.date, user: currentUser ? currentUser.name : "System"
        }, ...prev]);
      }
    });

    logAction(currentUser ? currentUser.name : "System", "Receipt uploaded", newRec.receiptNo + " — " + newRec.supplier + " — " + money(newRec.grandTotal));
    checkLowStock();
    toast(newRec.status === 'duplicate' ? "Saved — flagged as possible duplicate" : "Receipt saved successfully — matched inventory stock updated", newRec.status === 'duplicate' ? "warning" : "success");
    showView("receipts");
  };

  const deleteReceipt = (id) => {
    const r = receipts.find(x => x.id === id);
    if (!r) return;
    showConfirm("Delete receipt?", `Delete receipt ${r.receiptNo} from ${r.supplier}? You can undo this for a few seconds after.`, () => {
      setReceipts(prev => prev.filter(x => x.id !== id));
      logAction(currentUser ? currentUser.name : "System", "Receipt deleted", r.receiptNo + " — " + r.supplier);

      undoToast(r.receiptNo + " deleted", () => {
        setReceipts(prev => [...prev, r]);
        logAction(currentUser ? currentUser.name : "System", "Delete undone", "Restored " + r.receiptNo);
      });
    });
  };

  // Inventory Actions
  const createInventoryItem = (itemData) => {
    const item = {
      ...itemData,
      dateAdded: new Date().toISOString().slice(0, 10),
      lastUpdated: new Date().toISOString().slice(0, 10)
    };
    setInventory(prev => [...prev, item]);
    setStockLog(prev => [{
      code: item.code, name: item.name, type: "Manual Add", change: item.stock,
      date: item.dateAdded, user: currentUser.name
    }, ...prev]);
    logAction(currentUser.name, "Product added", item.code + " — " + item.name + " (manual entry)");
    checkLowStock();
    toast(item.name + " added to inventory", "success");
  };

  const deleteInventoryItem = (code) => {
    const inv = inventory.find(i => i.code === code);
    if (!inv) return;
    showConfirm("Delete product?", `Delete "${inv.name}" (${inv.code}) from inventory? You can undo this for a few seconds after.`, () => {
      setInventory(prev => prev.filter(i => i.code !== code));
      logAction(currentUser ? currentUser.name : "System", "Product deleted", inv.code + " — " + inv.name);

      undoToast(inv.name + " deleted", () => {
        setInventory(prev => [...prev, inv]);
        logAction(currentUser ? currentUser.name : "System", "Delete undone", "Restored " + inv.name);
      });
    });
  };

  const updateInvPrice = (code, field, val) => {
    const newVal = +val || 0;
    setInventory(prev => prev.map(inv => {
      if (inv.code === code) {
        const oldVal = inv[field];
        if (oldVal === newVal) return inv;
        const label = field === "cost" ? "Cost price" : "Selling price";
        logAction(currentUser ? currentUser.name : "System", "Price changed", `${label} for ${inv.name}: ${oldVal.toFixed(2)} → ${newVal.toFixed(2)}`);
        addNotification(`💲 ${label} changed for <b>${inv.name}</b>: ${money(oldVal)} → ${money(newVal)}`);
        toast(label + " updated for " + inv.name, "info");
        return { ...inv, [field]: newVal, lastUpdated: new Date().toISOString().slice(0, 10) };
      }
      return inv;
    }));
  };

  const importInventoryCSV = (parsedData) => {
    let added = 0;
    const newItems = [];
    parsedData.forEach(row => {
      const code = row.code || row.Code || row["Product Code"];
      const name = row.name || row.Name || row["Product Name"];
      if (!code || !name) return;
      newItems.push({
        code, name,
        desc: row.desc || row.Description || "",
        models: row.models || row["Compatible Models"] || "",
        unit: row.unit || "pc",
        cost: +(row.cost || row["Current Cost"] || 0),
        sellingPrice: +(row.sellingPrice || row["Selling Price"] || (+(row.cost || row["Current Cost"] || 0)) * 1.4),
        stock: +(row.stock || row.Stock || 0),
        minStock: +(row.minStock || row["Minimum Stock"] || 5),
        category: row.category || row.Category || "General",
        barcode: row.barcode || row.Barcode || "",
        status: "active",
        dateAdded: new Date().toISOString().slice(0, 10),
        lastUpdated: new Date().toISOString().slice(0, 10)
      });
      added++;
    });
    setInventory(prev => [...prev, ...newItems]);
    toast(added + " inventory items imported", "success");
    logAction(currentUser ? currentUser.name : "System", "Inventory imported", added + " items via CSV");
  };

  // Employees Actions
  const createEmployee = ({ name, role, branch, password }) => {
    const nextSeq = empSeq + 1;
    setEmpSeq(nextSeq);
    const id = "EMP" + String(nextSeq).padStart(4, "0");
    const emp = { id, name, password: password || "changeme123", role, branch: branch || "Main Shop", status: "active", created: new Date().toISOString().slice(0, 10) };
    setEmployees(prev => [...prev, emp]);
    logAction(currentUser.name, "Employee created", id + " — " + name + " (" + emp.role + ")");
    addNotification(`👤 New employee created: <b>${name}</b> (${id})`);
    toast("Employee " + id + " created", "success");
  };

  const resetPassword = (id) => {
    const newPass = Math.random().toString(36).slice(-8);
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, password: newPass } : e));
    const emp = employees.find(e => e.id === id);
    logAction(currentUser.name, "Password reset", "Reset password for " + id + " (" + (emp ? emp.name : '') + ")");
    toast(`New password for ${id}: ${newPass}`, "success");
  };

  const toggleEmployeeStatus = (id) => {
    if (id === currentUser.id) {
      toast("You can't disable your own account.", "error");
      return;
    }
    setEmployees(prev => prev.map(e => {
      if (e.id === id) {
        const nextStatus = e.status === "active" ? "disabled" : "active";
        logAction(currentUser.name, nextStatus === "active" ? "Employee enabled" : "Employee disabled", id + " — " + e.name);
        toast(e.name + " is now " + nextStatus, "warning");
        return { ...e, status: nextStatus };
      }
      return e;
    }));
  };

  const saveShopProfile = (newProfile) => {
    setShopProfile(prev => ({ ...prev, ...newProfile }));
    logAction(currentUser.name, "Shop profile updated", newProfile.name || shopProfile.name);
    toast("Shop profile saved — it will now appear on printed receipts and reports", "success");
  };

  const value = {
    theme, setTheme,
    currentUser, attemptLogin, logout,
    activeView, showView,
    isMobileMenuOpen, setIsMobileMenuOpen,
    toasts, toast, undoToast, removeToast,
    notifications, isNotifOpen, setIsNotifOpen,
    inventory, createInventoryItem, deleteInventoryItem, updateInvPrice, importInventoryCSV,
    receipts, saveReceipt, deleteReceipt,
    suppliersMeta, SUPPLIERS,
    employees, createEmployee, resetPassword, toggleEmployeeStatus,
    sales, completeSale,
    stockLog, auditLog, logAction,
    cart, addToCart, updateCartQty, removeFromCart, cancelCart,
    shopProfile, saveShopProfile,
    lightboxImg, setLightboxImg,
    confirmModal, closeConfirm,
    tourModalOpen, setTourModalOpen,
    sessionCountdown, SESSION_TIMEOUT_SECONDS,
    money
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
