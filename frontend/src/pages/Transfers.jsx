import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Plus, Check, X, ArrowRight, CornerDownRight } from 'lucide-react';

const Transfers = () => {
  const { user } = useContext(AuthContext);
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [form, setForm] = useState({ sourceWarehouseId: '', targetWarehouseId: '', productId: '', quantity: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const transRes = await axios.get('/api/transfers');
      setTransfers(transRes.data);

      const prodRes = await axios.get('/api/inventory/products');
      setProducts(prodRes.data);

      const whRes = await axios.get('/api/warehouses');
      setWarehouses(whRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.sourceWarehouseId === form.targetWarehouseId) {
      alert("Source and target warehouse cannot be the same!");
      return;
    }
    try {
      const payload = {
        sourceWarehouseId: parseInt(form.sourceWarehouseId),
        targetWarehouseId: parseInt(form.targetWarehouseId),
        productId: parseInt(form.productId),
        quantity: parseInt(form.quantity)
      };

      await axios.post('/api/transfers', payload);
      setShowModal(false);
      setForm({ sourceWarehouseId: '', targetWarehouseId: '', productId: '', quantity: '' });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Stock transfer request failed.');
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`/api/transfers/${id}/approve`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Transfer approval failed.');
    }
  };

  const handleCancel = async (id) => {
    try {
      await axios.put(`/api/transfers/${id}/cancel`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel transfer.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Stock Transfers</h2>
          <p className="text-slate-400 text-sm mt-1">Move products and balance stock allocations across hubs.</p>
        </div>
        <div>
          {(user.role === 'ADMIN' || user.role === 'WAREHOUSE_MANAGER') && (
            <button 
              onClick={() => {
                setForm({
                  sourceWarehouseId: user.warehouseId || (warehouses[0]?.id || ''),
                  targetWarehouseId: warehouses.find(w => w.id !== (user.warehouseId || warehouses[0]?.id))?.id || '',
                  productId: products[0]?.id || '',
                  quantity: ''
                });
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-brand-500/20 active:scale-[0.98] transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Request Transfer</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Table */}
      <div className="glass-card rounded-3xl overflow-hidden border border-slate-800/80 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-900/40">
                <th className="p-5">Transfer ID</th>
                <th className="p-5">Product SKU</th>
                <th className="p-5">Product Name</th>
                <th className="p-5">Source → Target</th>
                <th className="p-5 text-right">Transfer Qty</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 text-sm">
              {transfers.length > 0 ? (
                transfers.map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-900/10">
                    <td className="p-5 font-semibold text-white">#TR-{tr.id}</td>
                    <td className="p-5 font-mono text-slate-400">{tr.product.sku}</td>
                    <td className="p-5 font-semibold text-white">{tr.product.name}</td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 font-semibold">{tr.sourceWarehouse.name}</span>
                        <ArrowRight className="w-4 h-4 text-brand-400" />
                        <span className="text-brand-400 font-semibold">{tr.targetWarehouse.name}</span>
                      </div>
                    </td>
                    <td className="p-5 text-right font-bold text-slate-200">{tr.quantity.toLocaleString()}</td>
                    <td className="p-5">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                        tr.status === 'REQUESTED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        tr.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {tr.status}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      {tr.status === 'REQUESTED' && (user.role === 'WAREHOUSE_MANAGER' || user.role === 'ADMIN') && (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleApprove(tr.id)}
                            className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/20"
                            title="Approve & Complete"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleCancel(tr.id)}
                            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20"
                            title="Cancel Transfer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-slate-500">
                    No active stock transfer files found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl w-full max-w-lg p-6 border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-6">Create Stock Transfer Request</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Target Product</label>
                <select 
                  required 
                  value={form.productId}
                  onChange={(e) => setForm({...form, productId: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="" disabled>Choose Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Source Warehouse</label>
                  <select 
                    required 
                    disabled={!!user.warehouseId}
                    value={form.sourceWarehouseId}
                    onChange={(e) => setForm({...form, sourceWarehouseId: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="" disabled>Select Source</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Target Warehouse</label>
                  <select 
                    required 
                    value={form.targetWarehouseId}
                    onChange={(e) => setForm({...form, targetWarehouseId: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="" disabled>Select Target</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Transfer Quantity</label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm({...form, quantity: e.target.value})}
                  placeholder="e.g. 100"
                  className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-850 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-900 text-slate-400 rounded-xl hover:bg-slate-850"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-500"
                >
                  Request Release
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transfers;
