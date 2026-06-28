import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User, MapPin } from 'lucide-react';

const Navbar = () => {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  const roleLabel = user.role ? user.role.replace('_', ' ') : '';

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between z-10 sticky top-0">
      <div className="flex items-center gap-2 text-slate-400">
        {user.warehouseName && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-full text-xs font-medium text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-brand-400" />
            <span>{user.warehouseName}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm font-semibold text-white">{user.username}</div>
          <div className="text-[10px] text-brand-400 font-medium tracking-wider uppercase">{roleLabel}</div>
        </div>

        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400">
          <User className="w-5 h-5" />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
