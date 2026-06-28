import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { 
  FileText, 
  Plus, 
  Check, 
  Truck, 
  X,
  PackageCheck,
  ShoppingBag,
  ArrowRightLeft
} from 'lucide-react';

const Orders = () => {
  const { user } = useContext(AuthContext);
  
  const [activeTab, setActiveTab] = useState('purchase'); // 'purchase' or 'sales'
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showPOModal, setShowPOModal] = useState(false);
  const [showSOModal, setShowSOModal] = useState(false);

  // Forms
  const [poForm, setPoForm] = useState({ supplierId: '', warehouseId: '', items: [{ productId: '', quantity: 1 }] });
  const [soForm, setSoForm] = useState({ customerName: '', warehouseId: '', items: [{ productId: '', quantity: 1 }] });

  const loadData = async () => {
    try {
      setLoading(true);
      const poRes = await axios.get('/api/orders/purchase');
      setPurchaseOrders(poRes.data);

      const soRes = await axios.get('/api/orders/sales');
      setSalesOrders(soRes.data);

      const prodRes = await axios.get('/api/inventory/products');
      setProducts(prodRes.data);

      const whRes = await axios.get('/api/warehouses');
      setWarehouses(whRes.data);

      const supRes = await axios.get('/api/suppliers');
      setSuppliers(supRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // PO handlers
  const handlePOSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        supplierId: parseInt(poForm.supplierId),
        warehouseId: parseInt(poForm.warehouseId),
        items: poForm.items.map(i => ({ productId: parseInt(i.productId), quantity: parseInt(i.quantity) }))
      };
      await axios.post('/api/orders/purchase', payload);
      setShowPOModal(false);
      setPoForm({ supplierId: '', warehouseId: '', items: [{ productId: '', quantity: 1 }] });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place purchase order.');
    }
  };

  const handleUpdatePOStatus = async (id, status) => {
    try {
      await axios.put(`/api/orders/purchase/${id}/status?status=${status}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status.');
    }
  };

  // SO handlers
  const handleSOSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        customerName: soForm.customerName,
        warehouseId: parseInt(soForm.warehouseId),
        items: soForm.items.map(i => ({ productId: parseInt(i.productId), quantity: parseInt(i.quantity) }))
      };
      await axios.post('/api/orders/sales', payload);
      setShowSOModal(false);
      setSoForm({ customerName: '', warehouseId: '', items: [{ productId: '', quantity: 1 }] });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place sales order.');
    }
  };

  const handleUpdateSOStatus = async (id, status) => {
    try {
      await axios.put(`/api/orders/sales/${id}/status?status=${status}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update sales order status.');
    }
  };

  const addPOItem = () => {
    setPoForm({ ...poForm, items: [...poForm.items, { productId: '', quantity: 1 }] });
  };

  const removePOItem = (idx) => {
    const list = [...poForm.items];
    list.splice(idx, 1);
    setPoForm({ ...poForm, items: list });
  };

  const addSOItem = () => {
    setSoForm({ ...soForm, items: [...soForm.items, { productId: '', quantity: 1 }] });
  };

  const removeSOItem = (idx) => {
    const list = [...soForm.items];
    list.splice(idx, 1);
    setSoForm({ ...soForm, items: list });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Order Center</h2>
          <p className="text-slate-400 text-sm mt-1">Review purchase contracts and dispatch client sales files.</p>
        </div>
        <div className="flex items-center gap-3">
          {(user.role === 'ADMIN' || user.role === 'WAREHOUSE_MANAGER') && (
            <button 
              onClick={() => {
                setPoForm({
                  supplierId: suppliers[0]?.id || '',
                  warehouseId: user.warehouseId || (warehouses[0]?.id || ''),
                  items: [{ productId: products[0]?.id || '', quantity: 1 }]
                });
                setShowPOModal(true);
              }}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-brand-500/20 active:scale-[0.98] transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Purchase Order</span>
            </button>
          )}

          {(user.role === 'ADMIN' || user.role === 'SALES_TEAM') && (
            <button 
              onClick={() => {
                setSoForm({
                  customerName: '',
                  warehouseId: warehouses[0]?.id || '',
                  items: [{ productId: products[0]?.id || '', quantity: 1 }]
                });
                setShowSOModal(true);
              }}
              className="flex items-center gap-2 px-4 py-3 bg-slate-900 border border-slate-800 text-slate-300 font-semibold rounded-2xl hover:bg-slate-800 transition-colors animate-pulse"
            >
              <Plus className="w-5 h-5" />
              <span>Sales Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6">
        <button 
          onClick={() => setActiveTab('purchase')}
          className={`pb-4 px-2 text-sm font-semibold tracking-wide border-b-2 transition-all ${activeTab === 'purchase' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Purchase Orders
        </button>
        <button 
          onClick={() => setActiveTab('sales')}
          className={`pb-4 px-2 text-sm font-semibold tracking-wide border-b-2 transition-all ${activeTab === 'sales' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Sales Orders
        </button>
      </div>

      {/* Order Lists */}
      <div className="glass-card rounded-3xl overflow-hidden border border-slate-800/80 shadow-xl">
        <div className="overflow-x-auto">
          {activeTab === 'purchase' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-900/40">
                  <th className="p-5">Order ID</th>
                  <th className="p-5">Supplier</th>
                  <th className="p-5">Target Warehouse</th>
                  <th className="p-5">Total Value</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 text-sm">
                {purchaseOrders.length > 0 ? (
                  purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-900/10">
                      <td className="p-5 font-semibold text-white">#PO-{po.id}</td>
                      <td className="p-5 font-semibold">{po.supplier.name}</td>
                      <td className="p-5">{po.warehouse.name}</td>
                      <td className="p-5 font-bold text-slate-200">${po.totalAmount.toLocaleString()}</td>
                      <td className="p-5">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                          po.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          po.status === 'APPROVED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          po.status === 'RECEIVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {po.status === 'PENDING' && (user.role === 'WAREHOUSE_MANAGER' || user.role === 'ADMIN') && (
                            <>
                              <button 
                                onClick={() => handleUpdatePOStatus(po.id, 'APPROVED')}
                                className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/20"
                                title="Approve PO"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleUpdatePOStatus(po.id, 'CANCELLED')}
                                className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20"
                                title="Cancel PO"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {po.status === 'APPROVED' && (user.role === 'WAREHOUSE_STAFF' || user.role === 'WAREHOUSE_MANAGER' || user.role === 'ADMIN') && (
                            <button 
                              onClick={() => handleUpdatePOStatus(po.id, 'RECEIVED')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs"
                            >
                              <PackageCheck className="w-4 h-4" />
                              <span>Receive Stock</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-slate-500">
                      No purchase orders recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-900/40">
                  <th className="p-5">Order ID</th>
                  <th className="p-5">Customer</th>
                  <th className="p-5">Dispatch Warehouse</th>
                  <th className="p-5">Total Value</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 text-sm">
                {salesOrders.length > 0 ? (
                  salesOrders.map((so) => (
                    <tr key={so.id} className="hover:bg-slate-900/10">
                      <td className="p-5 font-semibold text-white">#SO-{so.id}</td>
                      <td className="p-5 font-semibold">{so.customerName}</td>
                      <td className="p-5">{so.warehouse.name}</td>
                      <td className="p-5 font-bold text-slate-200">${so.totalAmount.toLocaleString()}</td>
                      <td className="p-5">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                          so.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          so.status === 'DISPATCHED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          so.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {so.status}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {so.status === 'PENDING' && (user.role === 'WAREHOUSE_STAFF' || user.role === 'WAREHOUSE_MANAGER' || user.role === 'ADMIN') && (
                            <button 
                              onClick={() => handleUpdateSOStatus(so.id, 'DISPATCHED')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs shadow-md"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Dispatch Stock</span>
                            </button>
                          )}

                          {so.status === 'DISPATCHED' && (user.role === 'SALES_TEAM' || user.role === 'ADMIN') && (
                            <button 
                              onClick={() => handleUpdateSOStatus(so.id, 'DELIVERED')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs"
                            >
                              <Check className="w-4 h-4" />
                              <span>Mark Delivered</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-slate-500">
                      No sales orders recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* PO Create Modal */}
      {showPOModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl w-full max-w-xl p-6 border border-slate-800 flex flex-col max-h-[90vh]">
            <h3 className="text-xl font-bold text-white mb-6">Create Purchase Order</h3>
            <form onSubmit={handlePOSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Supplier</label>
                  <select 
                    required
                    value={poForm.supplierId}
                    onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="" disabled>Choose Supplier</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Target Warehouse</label>
                  <select 
                    required
                    value={poForm.warehouseId}
                    onChange={(e) => setPoForm({ ...poForm, warehouseId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="" disabled>Select Delivery Site</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Items list */}
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Ordered Products</label>
                  <button 
                    type="button" 
                    onClick={addPOItem}
                    className="text-xs text-brand-400 font-semibold hover:text-brand-300 flex items-center gap-1"
                  >
                    + Add Product
                  </button>
                </div>

                {poForm.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center bg-slate-900/50 p-3 rounded-2xl border border-slate-850">
                    <div className="flex-1">
                      <select
                        required
                        value={item.productId}
                        onChange={(e) => {
                          const updated = [...poForm.items];
                          updated[idx].productId = e.target.value;
                          setPoForm({ ...poForm, items: updated });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-white text-xs focus:outline-none"
                      >
                        <option value="" disabled>Select Product</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <input 
                        type="number" 
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...poForm.items];
                          updated[idx].quantity = e.target.value;
                          setPoForm({ ...poForm, items: updated });
                        }}
                        placeholder="Qty"
                        className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-white text-xs focus:outline-none"
                      />
                    </div>
                    {poForm.items.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removePOItem(idx)}
                        className="text-rose-400 hover:text-rose-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-850 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowPOModal(false)}
                  className="px-4 py-2.5 bg-slate-900 text-slate-400 rounded-xl hover:bg-slate-850"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-500"
                >
                  Create PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SO Create Modal */}
      {showSOModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl w-full max-w-xl p-6 border border-slate-800 flex flex-col max-h-[90vh]">
            <h3 className="text-xl font-bold text-white mb-6">Create Sales Order</h3>
            <form onSubmit={handleSOSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Customer Name</label>
                  <input 
                    type="text" 
                    required 
                    value={soForm.customerName}
                    onChange={(e) => setSoForm({ ...soForm, customerName: e.target.value })}
                    placeholder="e.g. Acme Corp"
                    className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Dispatch Site</label>
                  <select 
                    required
                    value={soForm.warehouseId}
                    onChange={(e) => setSoForm({ ...soForm, warehouseId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="" disabled>Select Warehouse</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Items list */}
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Ordered Products</label>
                  <button 
                    type="button" 
                    onClick={addSOItem}
                    className="text-xs text-brand-400 font-semibold hover:text-brand-300 flex items-center gap-1"
                  >
                    + Add Product
                  </button>
                </div>

                {soForm.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center bg-slate-900/50 p-3 rounded-2xl border border-slate-850">
                    <div className="flex-1">
                      <select
                        required
                        value={item.productId}
                        onChange={(e) => {
                          const updated = [...soForm.items];
                          updated[idx].productId = e.target.value;
                          setSoForm({ ...soForm, items: updated });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-white text-xs focus:outline-none"
                      >
                        <option value="" disabled>Select Product</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <input 
                        type="number" 
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...soForm.items];
                          updated[idx].quantity = e.target.value;
                          setSoForm({ ...soForm, items: updated });
                        }}
                        placeholder="Qty"
                        className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-white text-xs focus:outline-none"
                      />
                    </div>
                    {soForm.items.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeSOItem(idx)}
                        className="text-rose-400 hover:text-rose-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-850 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowSOModal(false)}
                  className="px-4 py-2.5 bg-slate-900 text-slate-400 rounded-xl hover:bg-slate-850"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-500"
                >
                  Create SO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
