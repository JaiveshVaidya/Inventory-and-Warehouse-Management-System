import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { 
  TrendingUp, 
  Boxes, 
  Warehouse, 
  AlertTriangle, 
  FileText, 
  Clock, 
  ArrowRight,
  PlusCircle,
  ScanBarcode
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (user.role === 'ADMIN' || user.role === 'WAREHOUSE_MANAGER') {
          const response = await axios.get('/api/reports/dashboard');
          setStats(response.data);
        } else {
          // Staff and Sales don't have access to global statistics, create local summaries
          const invRes = await axios.get('/api/inventory');
          const productsRes = await axios.get('/api/inventory/products');
          
          let myWarehouseInventory = invRes.data;
          if (user.warehouseId) {
            myWarehouseInventory = invRes.data.filter(i => i.warehouse.id === user.warehouseId);
          }

          const totalQty = myWarehouseInventory.reduce((acc, curr) => acc + curr.quantity, 0);
          const lowStock = myWarehouseInventory.filter(i => i.quantity <= i.reorderLevel).length;

          setStats({
            totalProducts: productsRes.data.length,
            totalStockQuantity: totalQty,
            lowStockCount: lowStock,
            totalRevenue: 0,
            recentActivities: []
          });
        }
      } catch (err) {
        console.error("Dashboard stats fetch error:", err);
        setError("Could not load dashboard stats.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-900 rounded-xl w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-900 rounded-3xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-slate-900 rounded-3xl lg:col-span-2"></div>
          <div className="h-96 bg-slate-900 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: "Active Products",
      value: stats?.totalProducts || 0,
      icon: Boxes,
      color: "from-blue-600/20 to-sky-600/10 border-blue-500/20 text-blue-400",
      description: "Unique catalog SKUs"
    },
    {
      title: "Total Stock Items",
      value: stats?.totalStockQuantity || 0,
      icon: Warehouse,
      color: "from-brand-600/20 to-emerald-600/10 border-brand-500/20 text-brand-400",
      description: "Across monitored sites"
    },
    {
      title: "Low Stock Alerts",
      value: stats?.lowStockCount || 0,
      icon: AlertTriangle,
      color: stats?.lowStockCount > 0 ? "from-amber-600/30 to-rose-600/10 border-amber-500/30 text-amber-400 animate-pulse" : "from-slate-800/40 to-slate-900/20 border-slate-800 text-slate-400",
      description: "Items below reorder safety"
    },
    {
      title: "Total Sales Revenue",
      value: stats?.totalRevenue ? `$${stats.totalRevenue.toLocaleString()}` : "$0.00",
      icon: TrendingUp,
      color: "from-indigo-600/20 to-violet-600/10 border-indigo-500/20 text-indigo-400",
      description: "Fulfillments overview"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Dashboard Overview</h2>
        <p className="text-slate-400 text-sm mt-1">Hello, {user.username}. Here is a summary of activities today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`glass-card p-6 rounded-3xl bg-gradient-to-tr ${card.color} border flex flex-col justify-between shadow-xl`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-sm font-medium">{card.title}</span>
                <div className="p-2.5 bg-slate-900/60 rounded-2xl border border-slate-800/80">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <span className="text-3xl font-bold tracking-tight text-white block">{card.value}</span>
                <span className="text-xs text-slate-500 font-medium mt-1 block">{card.description}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid containing Quick Actions and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Quick Links/Actions (2-span for staff/sales or equal depending on layout) */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800/80 lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            Quick Actions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Conditional quick action panels depending on role */}
            {user.role === 'ADMIN' && (
              <>
                <Link to="/users" className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800 flex items-center justify-between group">
                  <div>
                    <span className="font-semibold text-white block">User Provisioning</span>
                    <span className="text-xs text-slate-400 mt-1 block">Register employees and assign security roles.</span>
                  </div>
                  <PlusCircle className="w-6 h-6 text-brand-500 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link to="/inventory" className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800 flex items-center justify-between group">
                  <div>
                    <span className="font-semibold text-white block">Product Registry</span>
                    <span className="text-xs text-slate-400 mt-1 block">Insert new SKUs into the core catalogue.</span>
                  </div>
                  <PlusCircle className="w-6 h-6 text-brand-500 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </>
            )}

            {(user.role === 'WAREHOUSE_MANAGER' || user.role === 'WAREHOUSE_STAFF') && (
              <>
                <Link to="/inventory" className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800 flex items-center justify-between group">
                  <div>
                    <span className="font-semibold text-white block">Adjust Stock Level</span>
                    <span className="text-xs text-slate-400 mt-1 block">Perform quick cycle counts and adjust inventory.</span>
                  </div>
                  <PlusCircle className="w-6 h-6 text-brand-500 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link to="/transfers" className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800 flex items-center justify-between group">
                  <div>
                    <span className="font-semibold text-white block">Stock Transfers</span>
                    <span className="text-xs text-slate-400 mt-1 block">Initiate or verify stock movement between sites.</span>
                  </div>
                  <ArrowRight className="w-6 h-6 text-brand-500 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </>
            )}

            {user.role === 'SALES_TEAM' && (
              <Link to="/orders" className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800 flex items-center justify-between group">
                <div>
                  <span className="font-semibold text-white block">Create Sales Order</span>
                  <span className="text-xs text-slate-400 mt-1 block">Lock in inventory orders for dispatch.</span>
                </div>
                <PlusCircle className="w-6 h-6 text-brand-500 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}

            <Link to="/orders" className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800 flex items-center justify-between group">
              <div>
                <span className="font-semibold text-white block">Order Center</span>
                <span className="text-xs text-slate-400 mt-1 block">Check inbound purchase and outbound sales files.</span>
              </div>
              <FileText className="w-6 h-6 text-brand-500 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          
          {/* Welcome Dashboard Image or Info Panel */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
            <div className="max-w-md">
              <h4 className="font-bold text-white">System Guide</h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                As a user with the role <span className="text-brand-400 font-semibold">{user.role}</span>, you are configured to inspect data at the <span className="text-brand-400 font-semibold">{user.warehouseName || "Global"}</span> scale. Always verify SKU counts during daily audits.
              </p>
            </div>
            <div className="p-4 bg-brand-500/10 rounded-full border border-brand-500/20 text-brand-400 hidden sm:block">
              <Boxes className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Right column: Audit Logs (Recent Activities) */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800/80 space-y-6">
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            System Activities
          </h3>

          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((act) => (
                <div key={act.id} className="p-3.5 bg-slate-900/40 border border-slate-800/60 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300">{act.username}</span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className="text-[10px] text-brand-400 font-bold uppercase block">{act.action}</span>
                  <p className="text-slate-400 leading-normal">{act.details}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500 text-sm">
                No recent system logs recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
