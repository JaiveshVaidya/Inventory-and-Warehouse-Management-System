import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Plus, Trash2, Mail, Phone, MapPin, UserCheck } from 'lucide-react';

const Suppliers = () => {
  const { user } = useContext(AuthContext);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [form, setForm] = useState({ name: '', contactPerson: '', email: '', phone: '', address: '' });

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/suppliers');
      setSuppliers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/suppliers', form);
      setShowModal(false);
      setForm({ name: '', contactPerson: '', email: '', phone: '', address: '' });
      loadSuppliers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register supplier.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) return;
    try {
      await axios.delete(`/api/suppliers/${id}`);
      loadSuppliers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete supplier.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Supplier Catalog</h2>
          <p className="text-slate-400 text-sm mt-1">Manage vendor contact logs and procurement records.</p>
        </div>
        <div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-brand-500/20 active:scale-[0.98] transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Grid of suppliers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.length > 0 ? (
          suppliers.map((sup) => (
            <div key={sup.id} className="glass-card rounded-3xl p-6 border border-slate-800/80 shadow-xl flex flex-col justify-between relative group">
              {user.role === 'ADMIN' && (
                <button 
                  onClick={() => handleDelete(sup.id)}
                  className="absolute top-5 right-5 p-2 bg-slate-900 border border-slate-800 text-rose-400 rounded-xl hover:bg-rose-500/10 hover:border-rose-500/20 transition-all opacity-0 group-hover:opacity-100"
                  title="Remove Supplier"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-white tracking-tight leading-snug">{sup.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-brand-400 mt-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Contact: {sup.contactPerson || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-800/60 pt-4 text-xs text-slate-400 font-medium">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span>{sup.email || 'No email recorded'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span>{sup.phone || 'No phone recorded'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span className="line-clamp-1">{sup.address || 'No address details'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-slate-500">
            {loading ? 'Retrieving suppliers...' : 'No supplier profiles created.'}
          </div>
        )}
      </div>

      {/* Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl w-full max-w-lg p-6 border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-6">Register Supplier Profile</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Supplier Name</label>
                <input 
                  type="text" 
                  required 
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  placeholder="e.g. Global Tech Inc"
                  className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Contact Representative</label>
                <input 
                  type="text" 
                  value={form.contactPerson}
                  onChange={(e) => setForm({...form, contactPerson: e.target.value})}
                  placeholder="e.g. Jane Doe"
                  className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Email Address</label>
                  <input 
                    type="email" 
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                    placeholder="e.g. sales@global.com"
                    className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Phone Connection</label>
                  <input 
                    type="text" 
                    value={form.phone}
                    onChange={(e) => setForm({...form, phone: e.target.value})}
                    placeholder="e.g. +1 (555) 0122"
                    className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Physical Address</label>
                <input 
                  type="text" 
                  value={form.address}
                  onChange={(e) => setForm({...form, address: e.target.value})}
                  placeholder="e.g. 500 Commerce Ave, New York, NY"
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
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
