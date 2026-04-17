import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from './ui/button';
import { Shield, LayoutDashboard, Map, FileText, AlertTriangle, TrendingUp, ArrowLeft, LogOut, X } from 'lucide-react';
import { cn } from './ui/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';

export function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useApp();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Live Map', icon: Map, path: '/admin/heat-map' },
    { path: '/admin/claims-pipeline', label: 'Claims', icon: FileText },
    { path: '/admin/fraud-review', label: 'Fraud Review', icon: AlertTriangle },
    { path: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex font-sans selection:bg-primary/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 pattern-dots pattern-primary/10 pattern-size-4 z-0 pointer-events-none opacity-50" />
      {/* Sidebar */}
      <div className="w-64 bg-card/80 backdrop-blur-xl border-r border-border flex flex-col relative z-10 shadow-lg">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">GigKavacham</h2>
              <p className="text-xs text-muted-foreground">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Button
                key={item.label}
                variant={isActive ? 'secondary' : 'ghost'}
                onClick={() => navigate(item.path)}
                className={cn(
                  'w-full justify-start gap-3',
                  isActive && 'bg-primary/10 text-primary hover:bg-primary/15'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Button>
            );
          })}
          
          <div className="mt-8 border-t border-slate-800 pt-6">
            <button 
              onClick={() => navigate('/')} 
              className="flex items-center gap-2 text-slate-400 hover:text-red-400 text-sm transition-colors w-full px-4 py-3 rounded-xl hover:bg-slate-800/50 font-medium"
            >
              ← Exit Admin
            </button>
          </div>
        </nav>

        {/* Back to App & Logout */}
        <div className="p-4 border-t border-border space-y-2">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            title="Navigate to the worker dashboard"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground mb-1"
          >
            <ArrowLeft className="w-5 h-5" />
            Worker App
          </Button>
          <p className="text-[9px] text-muted-foreground/60 px-2 italic">
            Requires active worker session
          </p>
          <Button
            variant="ghost"
            onClick={() => setShowLogoutModal(true)}
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-transparent relative z-10 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
             {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              onClick={() => setShowLogoutModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-card border border-border shadow-2xl rounded-[2rem] p-6 z-[100] flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center border border-destructive/20">
                  <LogOut className="w-6 h-6 text-destructive" />
                </div>
                <button 
                  onClick={() => setShowLogoutModal(false)} 
                  className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 border border-border flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Secure Logout</h3>
              <p className="text-sm text-muted-foreground mb-6">Are you sure you want to end your secure session? You will be redirected to the landing page.</p>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl h-12 border-border text-foreground hover:bg-muted" 
                  onClick={() => setShowLogoutModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 rounded-xl h-12 bg-destructive hover:bg-destructive/90 text-white font-semibold" 
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
