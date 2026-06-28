import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { 
  Plus, 
  Settings2, 
  Search, 
  ScanLine, 
  TrendingDown, 
  Warehouse, 
  Tags,
  AlertCircle
} from 'lucide-react';

const Inventory = () => {
  const { user } = useContext(AuthContext);
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  
  // Form states
  const [productForm, setProductForm] = useState({ name: '', sku: '', description: '', price: '', category: 'Electronics', barcode: '' });
  const [adjustForm, setAdjustForm] = useState({ productId: '', warehouseId: '', quantity: '', type: 'ADD', reorderLevel: '' });
  
  // Scanner state
  const [scannedMessage, setScannedMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch catalog
      const prodRes = await axios.get('/api/inventory/products');
      setProducts(prodRes.data);

      // Fetch warehouses
      const whRes = await axios.get('/api/warehouses');
      setWarehouses(whRes.data);

      // Fetch inventory
      const invUrl = user.warehouseId ? `/api/inventory?warehouseId=${user.warehouseId}` : '/api/inventory';
      const invRes = await axios.get(invUrl);
      setInventory(invRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading inventory data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Product submission
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/inventory/products', productForm);
      setShowProductModal(false);
      setProductForm({ name: '', sku: '', description: '', price: '', category: 'Electronics', barcode: '' });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register product.');
    }
  };

  // Adjust submission
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        productId: parseInt(adjustForm.productId),
        warehouseId: parseInt(adjustForm.warehouseId),
        quantity: parseInt(adjustForm.quantity),
        type: adjustForm.type,
        reorderLevel: adjustForm.reorderLevel ? parseInt(adjustForm.reorderLevel) : null
      };

      await axios.put('/api/inventory/adjust', payload);
      setShowAdjustModal(false);
      setAdjustForm({ productId: '', warehouseId: '', quantity: '', type: 'ADD', reorderLevel: '' });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Adjustment failed.');
    }
  };

  // Scan simulation
  const handleBarcodeScanSimulate = async () => {
    setScannedMessage('');
    // Seeded list of barcodes
    const barcodes = ["123456789012", "234567890123", "345678901234", "456789012345"];
    const randomBarcode = barcodes[Math.floor(Math.random() * barcodes.length)];
    
    try {
      const response = await axios.get(`/api/inventory/products/barcode/${randomBarcode}`);
      const scannedProduct = response.data;
      
      setScannedMessage(`Successfully scanned: ${scannedProduct.name}`);
      
      // Auto fill adjustment form and open modal
      setAdjustForm({
        productId: scannedProduct.id,
        warehouseId: user.warehouseId || (warehouses[0]?.id || ''),
        quantity: '',
        type: 'ADD',
        reorderLevel: ''
      });
      setShowAdjustModal(true);
    } catch (err) {
      setScannedMessage('Scanning failed. Product barcode matching error.');
    }
  };

  const filteredInventory = inventory.filter((inv) => {
    const term = searchQuery.toLowerCase();
    return (
      inv.product.name.toLowerCase().includes(term) ||
      inv.product.sku.toLowerCase().includes(term) ||
      inv.warehouse.name.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Inventory Stock</h2>
          <p className="text-slate-400 text-sm mt-1">Review active stock allocations and manage catalog registry.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Scan QR Code Simulation */}
          {(user.role === 'WAREHOUSE_STAFF' || user.role === 'WAREHOUSE_MANAGER') && (
            <button 
              onClick={handleBarcodeScanSimulate}
              className="flex items-center gap-2 px-4 py-3 bg-slate-900 border border-slate-800 text-slate-300 font-semibold rounded-2xl shadow-md hover:bg-slate-800 transition-colors"
            >
              <ScanLine className="w-5 h-5 text-brand-400 animate-pulse" />
              <span>Simulate QR Scan</span>
            </button>
          )}

          {(user.role === 'ADMIN' || user.role === 'WAREHOUSE_MANAGER') && (
            <button 
              onClick={() => setShowProductModal(true)}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold rounded-2xl shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 active:scale-[0.98] transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Add Product</span>
            </button>
          )}

          {(user.role === 'WAREHOUSE_MANAGER' || user.role === 'WAREHOUSE_STAFF') && (
            <button 
              onClick={() => {
                setAdjustForm({
                  productId: products[0]?.id || '',
                  warehouseId: user.warehouseId || (warehouses[0]?.id || ''),
                  quantity: '',
                  type: 'ADD',
                  reorderLevel: ''
                });
                setShowAdjustModal(true);
              }}
              className="flex items-center gap-2 px-4 py-3 bg-slate-800 text-slate-200 border border-slate-700 font-semibold rounded-2xl hover:bg-slate-700 transition-colors"
            >
              <Settings2 className="w-5 h-5" />
              <span>Adjust Stock</span>
            </button>
          )}
        </div>
      </div>

      {scannedMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2">
          <ScanLine className="w-5 h-5 animate-pulse" />
          {scannedMessage}
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex items-center w-full max-w-md relative">
        <span className="absolute left-4 text-slate-500">
          <Search className="w-5 h-5" />
        </span>
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by product name, SKU or warehouse..."
          className="w-full pl-11 pr-4 py-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
        />
      </div>

      {/* Table grid */}
      <div className="glass-card rounded-3xl overflow-hidden border border-slate-800/80 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-900/40">
                <th className="p-5">Product SKU</th>
                <th className="p-5">Name</th>
                <th className="p-5">Warehouse</th>
                <th className="p-5">Category</th>
                <th className="p-5 text-right">Available Qty</th>
                <th className="p-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 text-sm">
              {filteredInventory.length > 0 ? (
                filteredInventory.map((inv) => {
                  const isLowStock = inv.quantity <= inv.reorderLevel;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="p-5 font-mono font-medium text-slate-400">{inv.product.sku}</td>
                      <td className="p-5 font-semibold text-white">{inv.product.name}</td>
                      <td className="p-5">
                        <div className="flex items-center gap-1.5">
                          <Warehouse className="w-4 h-4 text-slate-500" />
                          <span>{inv.warehouse.name}</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-1.5">
                          <Tags className="w-4 h-4 text-slate-500" />
                          <span>{inv.product.category}</span>
                        </div>
                      </td>
                      <td className={`p-5 text-right font-bold ${isLowStock ? 'text-rose-400' : 'text-slate-200'}`}>
                        {inv.quantity.toLocaleString()}
                      </td>
                      <td className="p-5">
                        {isLowStock ? (
                          <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 w-fit">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Low stock ({inv.reorderLevel})
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit block">
                            Healthy
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-slate-500">
                    {loading ? 'Fetching records...' : 'No inventory matches this search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl w-full max-w-lg p-6 border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-6">Register New Product</h3>
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">SKU Code</label>
                  <input 
                    type="text" 
                    required 
                    value={productForm.sku}
                    onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                    placeholder="e.g. LAP-1002"
                    className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Barcode/QR</label>
                  <input 
                    type="text" 
                    value={productForm.barcode}
                    onChange={(e) => setProductForm({...productForm, barcode: e.target.value})}
                    placeholder="e.g. 123456789"
                    className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Product Name</label>
                <input 
                  type="text" 
                  required 
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  placeholder="e.g. Dell XPS Laptop"
                  className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Description</label>
                <textarea 
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-850 px-4 py-2 rounded-xl text-white focus:outline-none focus:border-brand-500 h-20"
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    placeholder="299.99"
                    className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Category</label>
                  <select 
                    value={productForm.category}
                    onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Offices">Offices</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-850 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2.5 bg-slate-900 text-slate-400 rounded-xl hover:bg-slate-850"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-500"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Inventory Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl w-full max-w-lg p-6 border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-6">Deduct/Increase Stock Levels</h3>
            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Select SKU</label>
                <select 
                  required 
                  value={adjustForm.productId}
                  onChange={(e) => setAdjustForm({...adjustForm, productId: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="" disabled>Choose Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Warehouse Site</label>
                <select 
                  required 
                  disabled={!!user.warehouseId}
                  value={adjustForm.warehouseId}
                  onChange={(e) => setAdjustForm({...adjustForm, warehouseId: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="" disabled>Select Location</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Adjustment Action</label>
                  <select 
                    value={adjustForm.type}
                    onChange={(e) => setAdjustForm({...adjustForm, type: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="ADD">Add/Receive (+)</option>
                    <option value="SUBTRACT">Dispatch/Subtract (-)</option>
                    <option value="SET">Override/Set Total (=)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Qty Delta</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    value={adjustForm.quantity}
                    onChange={(e) => setAdjustForm({...adjustForm, quantity: e.target.value})}
                    placeholder="e.g. 50"
                    className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Reorder Safety Level (Optional)</label>
                <input 
                  type="number" 
                  value={adjustForm.reorderLevel}
                  onChange={(e) => setAdjustForm({...adjustForm, reorderLevel: e.target.value})}
                  placeholder="e.g. 15 (warn when stock drops below this)"
                  className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-850 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2.5 bg-slate-900 text-slate-400 rounded-xl hover:bg-slate-850"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-500"
                >
                  Execute Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
