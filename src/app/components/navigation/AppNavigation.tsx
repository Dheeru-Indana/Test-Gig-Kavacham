import { useNavigate, useLocation } from 'react-router';
import { useApp } from '../../context/AppContext';
import { cn } from '../ui/utils';
import { motion } from 'motion/react';

export const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: "grid_view" },
  { label: "Risk Monitor", path: "/disruption-live", icon: "radar" },
  { label: "Policies", path: "/policy-management", icon: "verified_user" },
  { label: "Payouts", path: "/claims-history", icon: "receipt_long" },
  { label: "Settings", path: "/settings", icon: "settings" },
];

export function SideNav({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile: userData } = useApp();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface-container-lowest/80 backdrop-blur-3xl border-r border-outline-variant/10 z-40 hidden lg:flex flex-col shadow-[10px_0_40px_rgba(0,0,0,0.5)]">
      <div className="p-8">
        <div className="text-2xl font-bold tracking-tighter text-[#5B5FFF] font-headline cursor-pointer" onClick={() => navigate('/')}>
          GigKavacham
        </div>
      </div>
      <div className="flex-1 px-4 py-4 space-y-2 relative z-10">
        {navItems.map((item) => {
          const active = location.pathname.includes(item.path);
          const isAtRisk = item.label === "Risk Monitor"; // disruptionState removed from context
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center space-x-4 px-5 py-4 rounded-xl transition-all duration-300 relative overflow-hidden group",
                active ? "text-primary-fixed" : "text-on-surface-variant hover:bg-surface-container hover:text-white"
              )}
            >
              {active && <motion.div layoutId="sidebarActiveBg" className="absolute inset-0 bg-primary-container/10 border border-primary-container/20 rounded-xl" />}
              {active && <motion.div layoutId="sidebarActiveIndicator" className="absolute left-0 top-0 bottom-0 w-1 bg-primary-container rounded-r-full" />}
              <span className={cn("material-symbols-outlined relative z-10", !active && "opacity-70 group-hover:opacity-100", isAtRisk && "text-error animate-pulse")}>{item.icon}</span>
              <span className={cn("font-medium relative z-10", active && "font-bold")}>{item.label}</span>
            </button>
          )
        })}
      </div>
      <div className="p-6 border-t border-outline-variant/10 z-10">
        <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-outline-variant/10 group">
           <div className="flex items-center space-x-3 w-[80%]">
             <div className="w-10 h-10 rounded-full bg-primary-container/20 border border-primary-container/30 flex items-center justify-center text-primary-fixed">
               <span className="material-symbols-outlined text-xl">person</span>
             </div>
             <div className="text-left w-full truncate">
               <p className="text-sm font-bold text-white truncate">{userData?.full_name?.split(' ')[0] || 'Partner'}</p>
               <p className="text-[10px] text-primary-fixed font-mono truncate">{userData?.shield_score || 75} SHIELD</p>
             </div>
           </div>
           <button onClick={onLogout} className="text-on-surface-variant hover:text-error transition-colors shrink-0 outline-none">
             <span className="material-symbols-outlined">logout</span>
           </button>
        </div>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  // disruptionState removed from context

  return (
    <nav className="fixed lg:hidden bottom-0 w-full bg-surface-container-lowest/90 backdrop-blur-xl border-t border-outline-variant/10 z-50 flex justify-around items-center h-20 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
       {navItems.slice(0,4).map((item) => {
         const active = location.pathname.includes(item.path);
         const isAtRisk = item.label === "Risk Monitor"; // disruptionState removed from context
         return (
           <button key={item.path} onClick={() => navigate(item.path)} className="flex flex-col items-center justify-center w-16 h-full text-on-surface-variant group relative">
             {active && <motion.div layoutId="bottomNavIndicator" className="absolute top-0 w-8 h-1 bg-primary-container rounded-b-full shadow-[0_0_10px_rgba(91,95,255,0.8)]" />}
             <div className={cn("mb-1 transition-all z-10 relative", active ? "text-primary-fixed scale-110" : "group-hover:text-white")}>
               <span className={cn("material-symbols-outlined", active && "filled", isAtRisk && "text-error animate-pulse")}>{item.icon}</span>
             </div>
             <span className={cn("text-[10px] font-medium tracking-wide z-10 relative", active && "text-white font-bold")}>{item.label}</span>
           </button>
         )
       })}
    </nav>
  );
}
