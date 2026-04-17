/*
-- create table if not exists payouts (
--   id uuid default gen_random_uuid() primary key,
--   user_id uuid references auth.users(id) on delete cascade,
--   amount numeric,
--   status text default 'pending',
--   reason text,
--   upi_id text,
--   payout_method text default 'UPI',
--   settlement_duration_minutes integer,
--   created_at timestamptz default now()
-- );
-- alter table payouts enable row level security;
-- create policy "Users can view own payouts" on payouts
--   for select using (auth.uid() = user_id);
*/

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { ArrowLeft, CheckCircle2, Clock, XCircle, Filter, FileText, Banknote, CreditCard, Timer } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';
import { cn } from '../../components/ui/utils';

interface PayoutRecord {
  id: string;
  amount: number;
  status: string;
  reason: string;
  upi_id: string;
  payout_method: string;
  settlement_duration_minutes?: number;
  created_at: string;
}

export default function ClaimsHistory() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      setPayoutsLoading(true);
      const { data, error } = await supabase
        .from('payouts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('[Payouts] Fetched:', data, 'Error:', error);

      if (!error && data) setPayouts(data);
      setPayoutsLoading(false);
    }
    load();
  }, [user?.id]);

  const [claims, setClaims] = useState<any[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      setClaimsLoading(true);
      const { data, error } = await supabase
        .from('claims')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('[Claims] Fetched:', data, 'Error:', error);

      if (!error && data) setClaims(data);
      setClaimsLoading(false);
    }
    load();
  }, [user?.id]);

  const totalAmount = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  } as any;
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  } as any;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-12 font-sans selection:bg-primary/20">
      <div className="absolute inset-0 bg-primary/5 pattern-dots pattern-primary/10 pattern-size-4 z-0 pointer-events-none opacity-50" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] pointer-events-none z-0 opacity-30" />

      {/* Header */}
      <div className="pt-8 px-6 pb-6 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full bg-card/60 border border-border hover:bg-muted transition-all text-foreground w-11 h-11 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground mb-0.5">Payout Ledger</h1>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Immutable History</p>
          </div>
        </div>

        {/* Summary Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="relative group perspective-1000 mt-2">
             <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/50 to-emerald-600/50 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
             <div className="relative bg-card rounded-[1.5rem] p-6 border border-border shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-accent/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1 relative z-10">Total Value Disbursed</p>
                <p className="text-4xl font-extrabold tracking-tight text-foreground mb-2 relative z-10" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                   ₹{totalAmount.toLocaleString('en-IN')}
                </p>
                
                <div className="flex items-center gap-2 mt-4 inline-flex px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-xs font-bold text-accent tracking-wide relative z-10">
                  {claims.length} Recorded Claims
                </div>
             </div>
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 relative z-10">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 rounded-full border-border bg-muted/50 hover:bg-muted hover:text-foreground transition-all text-xs font-bold h-9">
            <Filter className="w-3.5 h-3.5" />
            Filter by Epoch
          </Button>
        </motion.div>

        {payoutsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-slate-100 rounded-xl h-20" />
            ))}
          </div>
        ) : payouts.length === 0 ? (
          <Card className="p-10 border border-border bg-card/80 backdrop-blur shadow-sm text-center rounded-[1.5rem]">
            <div className="w-16 h-16 bg-muted border border-border rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-bold tracking-tight text-lg mb-1">No Payout History Yet</h3>
            <p className="text-sm text-muted-foreground font-medium max-w-[250px] mx-auto leading-relaxed">
              No payouts history yet. Payouts appear automatically when a disruption event fires in your zone.
            </p>
          </Card>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4 mb-8">
             {payouts.map((payout) => (
                <PayoutCard key={payout.id} payout={payout} />
             ))}
          </motion.div>
        )}

        {/* Claims Table Section */}
        <h3 className="font-bold tracking-tight text-lg mt-8 mb-4 px-2">Claim Processing Logs</h3>
        
        {claimsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-slate-100 rounded-xl h-20" />
            ))}
          </div>
        ) : claims.length === 0 ? (
          <Card className="p-10 border border-border bg-card/80 backdrop-blur shadow-sm text-center rounded-[1.5rem]">
            <div className="w-16 h-16 bg-muted border border-border rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-bold tracking-tight text-lg mb-1">No Claims History Yet</h3>
            <p className="text-sm text-muted-foreground font-medium max-w-[250px] mx-auto leading-relaxed">
              No claims history yet. Claims appear automatically when a disruption event fires in your zone.
            </p>
          </Card>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
            {claims.map((claim) => (
              <motion.div key={claim.id} variants={itemVariants}>
                <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                          {claim.trigger_type}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${claim.dcs_score >= 80 ? 'bg-red-100 text-red-700' : claim.dcs_score >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                          DCS: {claim.dcs_score}/100
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Zone: {claim.zone} · {new Date(claim.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      {claim.fraud_score > 20 && (
                        <p className="text-xs text-amber-500 mt-1 font-semibold">
                          Fraud Score: {claim.fraud_score} — {claim.fraud_decision === 'pass' ? 'Cleared' : 'Under Review'}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold font-[JetBrains_Mono] text-slate-800">
                        ₹{claim.amount?.toLocaleString('en-IN')}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold mt-1 inline-block ${claim.status === 'paid' ? 'bg-green-100 text-green-700' : claim.status === 'processing' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                        {claim.status === 'paid' ? 'Paid' : claim.status === 'processing' ? 'Processing' : 'Failed'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function PayoutCard({ payout }: { payout: PayoutRecord }) {
  const isCredited = payout.status.toLowerCase() === 'credited';
  const isPending = payout.status.toLowerCase() === 'pending';
  
  const getStatusColor = () => {
    if (isCredited) return 'bg-green-500/10 text-green-500 border border-green-500/20';
    if (isPending) return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
    return 'bg-red-500/10 text-red-500 border border-red-500/20';
  };

  const getStatusIcon = () => {
    if (isCredited) return <CheckCircle2 className="w-3.5 h-3.5" />;
    if (isPending) return <Clock className="w-3.5 h-3.5" />;
    return <XCircle className="w-3.5 h-3.5" />;
  };

  return (
    <Card className="p-5 bg-card backdrop-blur-xl border border-border rounded-[1.5rem] shadow-sm transform transition-all group hover:bg-card/80">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary border border-primary/20 rounded-[14px] flex items-center justify-center shadow-inner">
             <Banknote className="w-5 h-5" />
          </div>
          <div>
            <div className={cn("px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest inline-flex items-center gap-1.5 mb-1.5", getStatusColor())}>
              {getStatusIcon()}
              {payout.status}
            </div>
            <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 tracking-wide">
               <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
               Auto-Settled
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-foreground tracking-tight" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            +₹{payout.amount}
          </p>
        </div>
      </div>

      <div className="mb-4 bg-muted/40 rounded-2xl border border-border p-4">
        <p className="text-[13px] font-medium text-foreground leading-relaxed mb-3">
          <span className="font-bold text-muted-foreground uppercase tracking-wider text-[11px] block mb-1">Reason</span>
          {payout.reason}
        </p>
        
        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground tracking-wide">{payout.payout_method || 'UPI'} • <span className="text-foreground">{payout.upi_id}</span></span>
          </div>
          {payout.settlement_duration_minutes && (
            <div className="flex items-center gap-2">
              <Timer className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground tracking-wide">Settled in <span className="text-foreground font-bold" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{payout.settlement_duration_minutes}m</span></span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <span className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase">
          {new Date(payout.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </Card>
  );
}

