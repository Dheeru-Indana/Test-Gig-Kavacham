import { useState } from 'react';
import { Button } from '../ui/button';
import { PlayCircle, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';

interface SimulateTriggerButtonProps {
  onComplete?: () => void;
}

export default function SimulateTriggerButton({ onComplete }: SimulateTriggerButtonProps) {
  const { user, profile } = useApp();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showPanel, setShowPanel] = useState(false);

  const handleSimulate = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to trigger a simulation');
      return;
    }

    setLoading(true);
    setResult(null);
    setShowPanel(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/simulate-trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Simulation failed');

      setResult(data.data);
      toast.success('Simulation Successful!');
      if (onComplete) onComplete();
    } catch (err: any) {
      console.error('Simulation Error:', err);
      toast.error(err.message);
      setShowPanel(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        onClick={handleSimulate} 
        disabled={loading}
        size="lg"
        className="relative group overflow-hidden bg-primary-container hover:bg-primary text-white font-bold rounded-2xl shadow-xl transition-all duration-300 active:scale-95 border border-primary/20"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center gap-2 relative z-10">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
          Inject Live Disruption Anomaly
        </div>
      </Button>

      <AnimatePresence>
        {showPanel && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-card border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden relative"
            >
              <button onClick={() => setShowPanel(false)} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors z-20">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>

              <div className="p-8 pb-0">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                       <PlayCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                       <h3 className="text-xl font-bold text-white tracking-tight">System Simulation</h3>
                       <p className="text-xs text-on-surface-variant font-medium">End-to-End Parametric Pipeline</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <StepItem label={result?.anomalyLabel || "Zone Disruption Detection"} status={loading ? 'loading' : 'success'} />
                    <StepItem label="Active Policy Verification" status={loading ? 'pending' : 'success'} />
                    <StepItem label="Automated Fraud Scan" status={loading ? 'pending' : 'success'} />
                    <StepItem label="Payout Authorization" status={loading ? 'pending' : 'success'} />
                 </div>
              </div>

              <div className="p-8">
                 {loading ? (
                    <div className="py-12 text-center space-y-4 bg-muted/30 rounded-3xl border border-white/5 animate-pulse">
                       <div className="w-12 h-1 bg-primary/20 mx-auto rounded-full overflow-hidden">
                          <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 1, repeat: Infinity }} className="w-full h-full bg-primary" />
                       </div>
                       <p className="text-sm font-mono text-primary font-bold tracking-widest uppercase">Processing Payout...</p>
                    </div>
                 ) : result && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                       <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 text-center">
                          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                          <h4 className="text-2xl font-black text-white">₹{result.payoutAmount?.toLocaleString('en-IN')}</h4>
                          <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 mt-1">Impact Compensation</p>
                       </div>

                       <div className="grid grid-cols-2 gap-3">
                          <div className="bg-surface-container/50 p-4 rounded-2xl border border-outline-variant/5">
                             <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Trigger</p>
                             <p className="text-[10px] font-bold text-white truncate">{result.anomalyType}</p>
                          </div>
                          <div className="bg-surface-container/50 p-4 rounded-2xl border border-outline-variant/5">
                             <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Status</p>
                             <p className="text-sm font-bold text-emerald-400">PAID</p>
                          </div>
                       </div>

                       <div className="bg-muted/30 p-4 rounded-2xl border border-white/5">
                          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1 text-center">Reference / Transaction ID</p>
                          <p className="text-xs font-mono text-white text-center break-all">{result.transactionId || 'GIG-PAY-882190'}</p>
                       </div>

                       <Button onClick={() => setShowPanel(false)} className="w-full h-14 bg-white text-black hover:bg-white/90 font-bold rounded-2xl">
                          Close Simulation Panel
                       </Button>
                    </motion.div>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function StepItem({ label, status }: { label: string; status: 'pending' | 'loading' | 'success' }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
       <span className="text-sm font-medium text-on-surface-variant">{label}</span>
       {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
       {status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
       {status === 'pending' && <div className="w-4 h-4 rounded-full border border-white/10" />}
    </div>
  );
}
