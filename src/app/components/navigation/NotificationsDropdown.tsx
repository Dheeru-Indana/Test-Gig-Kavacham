import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabaseClient';
import { Bell, CheckCircle2, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { cn } from '../ui/utils';

export function NotificationsDropdown() {
  const { notifications, unreadCount, refetchNotifications } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    refetchNotifications?.();
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
    refetchNotifications?.();
  };

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full glass-card border border-outline-variant/20 flex items-center justify-center text-on-surface relative kinetic-button shadow-lg hover:border-primary-container/40 transition-colors"
      >
        <Bell className="w-5 h-5 text-white" />
        {unreadCount > 0 && <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full animate-ping"></div>}
        {unreadCount > 0 && <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full"></div>}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-80 md:w-96 bg-surface-container/90 backdrop-blur-2xl border border-outline-variant/10 shadow-2xl rounded-2xl overflow-hidden z-50 flex flex-col"
          >
            <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/50">
               <div>
                  <h3 className="font-bold text-white tracking-tight">Notifications</h3>
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-mono">{unreadCount} unread</p>
               </div>
               {unreadCount > 0 && (
                 <button onClick={markAllAsRead} className="text-xs text-primary-fixed hover:text-primary transition-colors font-bold">
                   Mark all read
                 </button>
               )}
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[400px] p-2 space-y-1">
              {notifications.length === 0 ? (
                 <div className="p-8 flex flex-col items-center justify-center text-center opacity-50">
                    <Bell className="w-8 h-8 text-on-surface-variant mb-4" />
                    <p className="text-sm text-on-surface-variant">No notifications yet.</p>
                 </div>
              ) : (
                notifications.map((notif: any) => (
                  <div 
                    key={notif.id} 
                    className={cn("p-3 rounded-xl flex gap-4 relative group transition-colors", notif.read ? "bg-transparent text-on-surface-variant" : "bg-primary-container/10 text-white")}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                  >
                     <div className="shrink-0 mt-1">
                        {notif.type === 'policy_active' ? <ShieldCheck className="w-5 h-5 text-emerald-500" /> :
                         notif.type === 'claim_credited' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> :
                         <AlertTriangle className="w-5 h-5 text-warning" />}
                     </div>
                     <div className="flex-1 cursor-pointer">
                        <p className={cn("text-sm font-bold tracking-tight mb-1", notif.read ? "text-on-surface-variant" : "text-white")}>{notif.title}</p>
                        <p className={cn("text-xs leading-relaxed", notif.read ? "text-on-surface-variant/80" : "text-slate-300")}>{notif.message}</p>
                        <p className="text-[10px] font-mono mt-2 opacity-50 uppercase tracking-widest">{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                     </div>
                     {!notif.read && <div className="w-2 h-2 rounded-full bg-primary-fixed absolute top-4 right-4" />}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
