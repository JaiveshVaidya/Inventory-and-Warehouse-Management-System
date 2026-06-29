import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User, MapPin, Bell } from 'lucide-react';

const Navbar = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!user) return;

    const eventSource = new EventSource('/api/notifications/stream');

    eventSource.addEventListener('INIT', (event) => {
      console.log("SSE Connection Initialized: ", event.data);
    });

    eventSource.addEventListener('LOW_STOCK', (event) => {
      const alertMessage = event.data;
      setNotifications((prev) => [
        { id: Date.now(), message: alertMessage, timestamp: new Date() },
        ...prev
      ]);
    });

    eventSource.onerror = (err) => {
      console.warn("SSE connection error: ", err);
    };

    return () => {
      eventSource.close();
    };
  }, [user]);

  if (!user) return null;

  const roleLabel = user.role ? user.role.replace('_', ' ') : '';

  const clearNotifications = () => {
    setNotifications([]);
    setShowDropdown(false);
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between z-30 sticky top-0">
      <div className="flex items-center gap-2 text-slate-400">
        {user.warehouseName && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 border border-slate-700/60 rounded-full text-xs font-medium text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-brand-400" />
            <span>{user.warehouseName}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 bg-slate-800/60 border border-slate-700/60 text-slate-300 rounded-xl hover:bg-slate-700/60 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center animate-bounce shadow-md">
                {notifications.length}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-3 w-80 glass-card rounded-2xl shadow-2xl border border-slate-850 p-4 space-y-3 z-50">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <span className="font-bold text-sm text-white">Stock Warnings</span>
                {notifications.length > 0 && (
                  <button 
                    onClick={clearNotifications}
                    className="text-[10px] text-rose-400 font-semibold hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div key={n.id} className="p-2.5 bg-rose-500/5 border border-rose-500/10 rounded-xl text-xs space-y-1">
                      <p className="text-rose-300 leading-normal font-medium">{n.message}</p>
                      <span className="text-[9px] text-slate-500 font-medium block">
                        {n.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    No active stock threshold warnings.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-4 border-l border-slate-800 pl-6">
          <div className="text-right">
            <div className="text-sm font-semibold text-white">{user.username}</div>
            <div className="text-[10px] text-brand-400 font-medium tracking-wider uppercase">{roleLabel}</div>
          </div>

          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400 shadow-md">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
