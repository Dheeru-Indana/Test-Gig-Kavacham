import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Shield, ArrowRight, Lock, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRepair, setShowRepair] = useState(false);

  const repairAdminProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("No active session", { description: "Sign in again to refresh your session before repairing." });
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        role: 'admin',
        full_name: 'Admin User'
      });

      if (error) throw error;

      toast.success("Profile Repaired", { description: "Admin permissions granted. Redirecting..." });
      setTimeout(() => navigate('/admin/dashboard'), 1000);
    } catch (err: any) {
      toast.error("Repair failed", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast.error("Failed to authenticate", { description: error.message });
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile?.role === 'admin') {
        // Navigate directly; AdminProtectedRoute natively handles suspended clearance evaluations
        navigate('/admin/dashboard');
      } else {
        // Logged in but not an admin
        setShowRepair(true);
        toast.error("Access Denied", { 
          description: "Authenticated successfully, but your database profile is missing the 'admin' role." 
        });
        setLoading(false);
      }
    } catch (err: any) {
      toast.error("Error", { description: err.message });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-primary-container selection:text-white font-body relative overflow-hidden">
      
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-container/10 via-background to-background pointer-events-none -z-10" />

      {/* Back Button */}
      <div className="absolute top-0 left-0 pt-8 pl-8 z-10 hidden md:block">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>

      <div className="max-w-md w-full glass-panel border border-outline-variant/10 p-10 rounded-[2rem] shadow-2xl relative z-10">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-surface-container-high rounded-3xl flex items-center justify-center border border-outline-variant/20 shadow-inner liquid-glow text-primary-fixed">
            <Shield className="w-10 h-10" />
          </div>
        </div>
        <h1 className="text-3xl font-bold font-headline text-center text-white mb-2 tracking-tight">Admin Gateway</h1>
        <p className="text-sm text-center text-on-surface-variant mb-10 font-medium">Restricted access oracle node</p>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 block">Node Identity (Email)</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-surface-container border border-outline-variant/10 rounded-xl px-4 py-3.5 text-sm text-white focus:ring-1 focus:ring-primary-fixed focus:border-primary-fixed focus:bg-surface-container-high outline-none transition-all placeholder:text-on-surface-variant/50 font-medium" placeholder="admin@gigkavacham.com" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 block">Cryptographic Key</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-surface-container border border-outline-variant/10 rounded-xl px-4 py-3.5 text-sm text-white focus:ring-1 focus:ring-primary-fixed focus:border-primary-fixed focus:bg-surface-container-high outline-none transition-all placeholder:text-on-surface-variant/50 font-medium" placeholder="••••••••" />
          </div>
          
          <button type="submit" disabled={loading} className="w-full kinetic-button bg-primary-container hover:bg-primary text-white rounded-xl py-4 flex items-center justify-center gap-2 mt-8 shadow-lg transition-colors border border-primary-fixed">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span className="font-bold tracking-wide uppercase text-sm">Authenticate</span> <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>

        <div className="mt-8 bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-4 text-on-surface-variant text-xs">
          <p className="font-bold mb-2 text-white uppercase tracking-widest text-[10px]">Evaluation Credentials</p>
          <div className="flex justify-between border-b border-outline-variant/5 pb-2 mb-2 font-mono">
             <span>Identity</span>
             <span className="text-white">admin@gigkavacham.com</span>
          </div>
          <div className="flex justify-between font-mono">
             <span>Key</span>
             <span className="text-white">gigadmin@2025</span>
          </div>
        </div>

        {showRepair && (
          <div className="mt-6 p-4 bg-primary-container/10 border border-primary-container/20 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-500">
             <p className="text-[10px] text-on-surface-variant font-medium leading-relaxed mb-3">
               It looks like your email is authenticated but the <strong className="text-white">admin role</strong> is missing from your profile.
             </p>
             <button 
               onClick={repairAdminProfile}
               className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg py-2 text-[10px] font-bold uppercase tracking-widest transition-all"
             >
               Repair Admin Permissions
             </button>
          </div>
        )}
        
        <div className="mt-10 flex items-center justify-center gap-2 border-t border-outline-variant/10 pt-6 text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
          <Lock className="w-3 h-3" />
          <span>Secured by Supabase Ed25519</span>
        </div>
      </div>
      
      {/* Ambient background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-container/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-container/5 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
    </div>
  );
}
