import { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useApp } from '../context/AppContext';

export default function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useApp();
  
  // Wait until either loading is true OR user is present but profile hasn't loaded yet
  if (loading || (user && !profile)) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-container/20 border-t-primary-fixed mb-4" />
      <p className="text-on-surface-variant text-sm font-mono tracking-widest uppercase animate-pulse">Evaluating Clearances</p>
    </div>
  );
  
  if (!user) return <Navigate to="/admin/login" replace />;
  if (profile?.role !== 'admin') return <Navigate to="/" replace />;
  
  return <>{children}</>;
}
