import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Boxes, 
  ClipboardList, 
  ArrowLeftRight, 
  Truck, 
  BarChart3, 
  Users, 
  LogOut 
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);

  if (!user) return null;

  const links = [
    {
      to: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF", "SALES_TEAM"]
    },
    {
      to: "/inventory",
      label: "Inventory",
      icon: Boxes,
      roles: ["ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF", "SALES_TEAM"]
    },
    {
      to: "/orders",
      label: "Orders",
      icon: ClipboardList,
      roles: ["ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF", "SALES_TEAM"]
    },
    {
      to: "/transfers",
      label: "Stock Transfers",
      icon: ArrowLeftRight,
      roles: ["ADMIN", "WAREHOUSE_MANAGER", "WAREHOUSE_STAFF"]
    },
    {
      to: "/suppliers",
      label: "Suppliers",
      icon: Truck,
      roles: ["ADMIN", "WAREHOUSE_MANAGER"]
    },
    {
      to: "/reports",
      label: "Analytics",
      icon: BarChart3,
      roles: ["ADMIN", "WAREHOUSE_MANAGER"]
    },
    {
      to: "/users",
      label: "Users & Setup",
      icon: Users,
      roles: ["ADMIN"]
    }
  ];

  const visibleLinks = links.filter(link => link.roles.includes(user.role));

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full z-20">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-brand-500/20">
          IW
        </div>
        <div>
          <h1 className="font-bold text-lg leading-none text-white tracking-tight">IWMS Portal</h1>
          <span className="text-[10px] text-brand-400 font-semibold tracking-wider uppercase">Enterprise</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {visibleLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? "bg-brand-600 text-white font-medium shadow-lg shadow-brand-600/10" 
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                }`
              }
            >
              <Icon className="w-5 h-5 transition-transform group-hover:scale-105" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <button 
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
