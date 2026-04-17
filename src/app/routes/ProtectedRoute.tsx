import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useApp } from '../context/AppContext';
import { SideNav, BottomNav } from '../components/navigation/AppNavigation';
import { motion, AnimatePresence } from 'motion/react';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading, signOut: logout } = useApp();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/onboarding/phone" replace />;
  }

  return (
    <div className="flex bg-background min-h-screen selection:bg-primary-container selection:text-white">
      <SideNav onLogout={logout} />
      
      <div className="flex-1 lg:ml-64 relative overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col w-full h-full pb-20 lg:pb-0"
          >
             {children}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  );
};
