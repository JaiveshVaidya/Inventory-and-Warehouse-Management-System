import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Plus, 
  UserPlus, 
  Shield, 
  User, 
  MapPin, 
  Download, 
  Clock 
} from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'WAREHOUSE_STAFF', warehouseId: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const userRes = await axios.get('/api/auth/users');
      setUsers(userRes.data);

      const whRes = await axios.get('/api/warehouses');
      setWarehouses(whRes.data);

      const auditRes = await axios.get('/api/audit');
      setAuditLogs(auditRes.data);
    } catch (err) {
      console.error("Error loading administration data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role,
        warehouseId: form.warehouseId ? parseInt(form.warehouseId) : null
      };

      await axios.post('/api/auth/register', payload);
      setShowModal(false);
      setForm({ username: '', email: '', password: '', role: 'WAREHOUSE_STAFF', warehouseId: '' });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register user.');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await axios.get('/api/audit/export', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'audit_ledger.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export audit ledger: " + (err.message || "Request error"));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">System Users & Setup</h2>
          <p className="text-slate-400 text-sm mt-1">Provision corporate personnel and assign operational sites.</p>
        </div>
        <div>
          <button 
            onClick={() => {
              setForm({ username: '', email: '', password: '', role: 'WAREHOUSE_STAFF', warehouseId: '' });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-brand-500/20 active:scale-[0.98] transition-all"
          >
            <UserPlus className="w-5 h-5" />
            <span>Create User</span>
          </button>
        </div>
      </div>

      {/* Grid Table: Users */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white tracking-tight">Active Employee Accounts</h3>
        <div className="glass-card rounded-3xl overflow-hidden border border-slate-800/80 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-900/40">
                  <th className="p-5">User</th>
                  <th className="p-5">Email</th>
                  <th className="p-5">Role Assigned</th>
                  <th className="p-5">Assigned Facility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 text-sm">
                {users.length > 0 ? (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/10 transition-colors">
                      <td className="p-5 font-semibold text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400">
                          <User className="w-4 h-4" />
                        </div>
                        <span>{u.username}</span>
                      </td>
                      <td className="p-5 text-slate-400">{u.email}</td>
                      <td className="p-5">
                        <span className="flex items-center gap-1.5 w-fit px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 border border-slate-700 text-slate-200">
                          <Shield className="w-3.5 h-3.5 text-brand-400" />
                          {u.role}
                        </span>
                      </td>
                      <td className="p-5">
                        {u.warehouse ? (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <MapPin className="w-4 h-4 text-slate-500" />
                            <span>{u.warehouse.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs italic">Global Allocation</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-10 text-center text-slate-500">
                      Retrieving credentials list...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Audit Logs Table Section */}
      <div className="space-y-4 pt-4 border-t border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            Corporate Audit Ledger
          </h3>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 text-brand-400 hover:text-brand-300 font-semibold rounded-xl text-xs hover:bg-slate-850 transition-colors shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="glass-card rounded-3xl overflow-hidden border border-slate-800/80 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-900/40">
                  <th className="p-5">Timestamp</th>
                  <th className="p-5">User</th>
                  <th className="p-5">Action</th>
                  <th className="p-5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 text-sm">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/10">
                      <td className="p-5 text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-5 font-semibold text-white">{log.username}</td>
                      <td className="p-5">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-brand-500/10 border border-brand-500/20 text-brand-400">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-5 text-slate-300 leading-normal max-w-md break-words">
                        {log.details}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-10 text-center text-slate-500">
                      No system logs recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Register User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl w-full max-w-lg p-6 border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-6">Register Corporate Account</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Username</label>
                <input 
                  type="text" 
                  required 
                  value={form.username}
                  onChange={(e) => setForm({...form, username: e.target.value})}
                  placeholder="e.g. jdoe"
                  className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  placeholder="e.g. jdoe@iwms.com"
                  className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Password</label>
                <input 
                  type="password" 
                  required 
                  value={form.password}
                  onChange={(e) => setForm({...form, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Operational Role</label>
                  <select 
                    value={form.role}
                    onChange={(e) => setForm({...form, role: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="WAREHOUSE_MANAGER">WAREHOUSE MANAGER</option>
                    <option value="WAREHOUSE_STAFF">WAREHOUSE STAFF</option>
                    <option value="SALES_TEAM">SALES TEAM</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Facility Allocation</label>
                  <select 
                    value={form.warehouseId}
                    onChange={(e) => setForm({...form, warehouseId: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">Global/None</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
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
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
