import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { ArrowLeft, Shield, CheckCircle2, CreditCard, Pause, Play, FileText, Activity, X, AlertTriangle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { ZONES } from '../../lib/mock-data';
import { PLANS, getDynamicPremium } from '../../../constants/plans';
import { toast } from 'sonner';
import { calculateRisk } from '../../services/riskEngine';
import { supabase } from '../../lib/supabaseClient';

export default function PolicyManagement() {
  const navigate = useNavigate();
  const { user, profile: userData, setProfile: setUserData, activePolicy, refreshPolicy, refreshProfile } = useApp();
  
  const selectedPlan = PLANS.find((p) => p.id === activePolicy?.plan_id || p.id === userData?.selectedPlan);
  const isPaused = activePolicy?.status === 'PAUSED';
  const isCancelled = activePolicy?.status === 'CANCELLED';

  // Modal States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [planToChange, setPlanToChange] = useState<typeof PLANS[0] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePauseToggle = async () => {
    if (!activePolicy || !user) return;
    if (isPaused) {
      await supabase.from('policies').update({ status: 'ACTIVE' }).eq('id', activePolicy.id).eq('user_id', user.id);
      await new Promise(r => setTimeout(r, 500));
      await refreshPolicy();
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'policy_resumed',
        title: '▶️ Policy Resumed',
        message: `Your ${activePolicy.plan_name} is active again. You are now protected against disruption events.`,
        read: false,
        created_at: new Date().toISOString(),
      });
      toast.success('Protection resumed');
    } else {
      await supabase.from('policies').update({ status: 'PAUSED' }).eq('id', activePolicy.id).eq('user_id', user.id);
      await new Promise(r => setTimeout(r, 500));
      await refreshPolicy();
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'policy_paused',
        title: '⏸️ Policy Paused',
        message: `Your ${activePolicy.plan_name} has been paused. Disruption events will NOT trigger payouts while paused. Resume your policy to restore protection.`,
        read: false,
        created_at: new Date().toISOString(),
      });
      toast.warning('Protection paused. No payouts will trigger.');
    }
  };

  const handleConfirmChangePlan = async () => {
    if (user && userData && planToChange) {
      setIsProcessing(true);
      try {
        console.log('[Policy] Switching plan to:', planToChange.id);
        
        // Use upsert to handle both new and existing policies
        const policyData = {
          user_id: user.id,
          plan_id: planToChange.id,
          plan_name: planToChange.name,
          weekly_premium: planToChange.weeklyPremium,
          coverage_amount: planToChange.coverageAmount,
          weekly_payout_cap: planToChange.weeklyPayoutCap,
          status: 'ACTIVE'
        };

        let query = supabase.from('policies');
        let error;

        if (activePolicy?.id) {
          console.log('[Policy] Updating existing policy:', activePolicy.id);
          const res = await query.update(policyData).eq('id', activePolicy.id);
          error = res.error;
        } else {
          console.log('[Policy] Creating new policy via upsert');
          const res = await query.upsert(policyData, { onConflict: 'user_id' });
          error = res.error;
        }

        if (error) {
          console.error('[Policy] Supabase error:', error);
          throw error;
        }

        const oldPlanName = activePolicy?.plan_name || 'No Plan';
        
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'policy_upgraded',
          title: '⬆️ Plan Updated',
          message: `Switched from ${oldPlanName} to ${planToChange.name}. New weekly premium: ₹${planToChange.weeklyPremium}. New coverage: ₹${planToChange.coverageAmount.toLocaleString()}.`,
          read: false,
          created_at: new Date().toISOString(),
        });
        
        if (typeof refetchNotifications === 'function') refetchNotifications();

        setUserData({ ...userData, selectedPlan: planToChange.id });
        await new Promise(r => setTimeout(r, 800));
        await refreshPolicy();
        toast.success(`Plan changed to ${planToChange.name}`);
        setPlanToChange(null);
      } catch (err: any) {
        toast.error(`Failed to change plan: ${err.message || 'Check connection'}`);
        console.error('[Policy] Change failed:', err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleConfirmCancel = async () => {
    if (activePolicy && user) {
      setIsProcessing(true);
      try {
        const { error } = await supabase
          .from('policies')
          .update({ status: 'CANCELLED' })
          .eq('id', activePolicy.id)
          .eq('user_id', user.id);

        if (!error) {
          await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'policy_cancelled',
            title: '🛡️ Policy Cancelled',
            message: `Your ${activePolicy.plan_name} has been cancelled. Weekly premium of ₹${activePolicy.weekly_premium} will no longer be charged. You are no longer protected against disruption events. Reactivate a plan anytime from Policy Management.`,
            read: false,
            created_at: new Date().toISOString(),
          });
          toast.warning(`${activePolicy.plan_name} cancelled. You are no longer protected.`);
          // await refreshProfile();
          await new Promise(r => setTimeout(r, 500));
          await refreshPolicy();
          setShowCancelModal(false);
        }
      } catch (err) {
        toast.error('Failed to cancel policy');
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden font-sans selection:bg-primary/20">
      <div className="absolute inset-0 bg-primary/5 pattern-dots pattern-primary/10 pattern-size-4 z-0 pointer-events-none opacity-50" />
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      </div>

      {/* Header Profile Section */}
      <div className="bg-card border-b border-border relative z-10">
        <div className="p-6 pb-8 pt-8 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-muted bg-secondary/30 backdrop-blur-sm shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Active Coverage</h1>
            <p className="text-sm text-muted-foreground">Manage your protection</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <motion.div 
        variants={containerVariants as any}
        initial="hidden"
        animate="show"
        className="p-6 space-y-6 relative z-10 -mt-6"
      >
        {/* Policy Header Card - FinTech Style */}
        <motion.div variants={itemVariants as any} className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-[2rem] blur-xl opacity-60 transition-opacity duration-500" />
          <div className="relative p-7 rounded-[2rem] bg-card/90 border border-border overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            
            <div className="flex items-start justify-between mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-inner">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1">Current Plan</p>
                  <p className="text-xl font-bold tracking-tight text-foreground">{selectedPlan?.name}</p>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-[11px] font-bold border uppercase tracking-wider ${
                isCancelled ? 'bg-destructive/10 text-destructive border-destructive/20' :
                isPaused ? 'bg-warning/10 text-warning border-warning/20' : 'bg-accent/10 border-accent/20 text-accent'
              }`}>
                {!isPaused && !isCancelled && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
                {isCancelled ? 'CANCELLED' : isPaused ? 'PAUSED' : 'ACTIVE'}
              </div>
            </div>

            <div className="space-y-4 relative z-10 bg-muted/40 p-4 rounded-2xl border border-border">
              <DetailRow
                icon={<CreditCard className="w-5 h-5" />}
                label="Weekly Premium"
                value={`₹${activePolicy?.weekly_premium || selectedPlan?.weeklyPremium || 0}`}
              />
              <div className="h-px bg-border w-full" />
              <DetailRow
                icon={<Shield className="w-5 h-5 text-accent" />}
                label="Total Cover"
                value={`₹${(activePolicy?.coverage_amount || selectedPlan?.coverageAmount || 0).toLocaleString('en-IN')}`}
                highlight
              />
            </div>
          </div>
        </motion.div>

        {isCancelled && (
           <motion.div variants={itemVariants as any} className="p-5 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-3 relative z-10">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-destructive text-sm mb-1">Policy Cancelled</h4>
                <p className="text-xs text-destructive/80 leading-relaxed">Your policy has been cancelled and is no longer providing coverage. You will not be charged further premiums. To get protected again, you must purchase a new policy.</p>
              </div>
           </motion.div>
        )}

        {/* Triggers */}
        <motion.div variants={itemVariants as any} className="p-6 rounded-[2rem] bg-card/80 border border-border backdrop-blur-sm shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Monitored Triggers</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedPlan?.features?.map((trigger: string) => (
              <div
                key={trigger}
                className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-foreground rounded-xl text-sm font-medium"
              >
                {trigger}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pause Coverage */}
        <motion.div variants={itemVariants as any} className={`p-6 rounded-[2rem] border backdrop-blur-sm shadow-sm transition-opacity ${isCancelled ? 'opacity-50 pointer-events-none bg-card/20 border-border' : 'bg-card/80 border-border'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${isPaused ? 'bg-primary/20 border-primary/30' : 'bg-muted border-border'}`}>
                {isPaused ? <Play className="w-6 h-6 text-primary" /> : <Pause className="w-6 h-6 text-muted-foreground" />}
              </div>
              <div>
                <h4 className="font-semibold text-foreground">{isPaused ? 'Resume Plan' : 'Pause Plan'}</h4>
                <p className="text-sm text-muted-foreground leading-snug">
                  {isPaused ? 'Restart your automated protection.' : 'Temporarily stop premium collection.'}
                </p>
              </div>
            </div>
            <Switch checked={!isPaused && !isCancelled} onCheckedChange={handlePauseToggle} disabled={isCancelled} className="mt-2" />
          </div>

          {isPaused && !isCancelled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-5 p-4 bg-warning/10 border border-warning/20 rounded-2xl"
            >
              <p className="text-sm font-medium text-warning flex items-center gap-2">
                ⚠️ Protection is currently paused.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* View Policy Document */}
        <motion.div variants={itemVariants as any} className="p-6 rounded-[2rem] bg-card/80 border border-border backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center border border-accent/20">
                <FileText className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Policy Terms</h4>
                <p className="text-sm text-muted-foreground">Read coverage conditions</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => navigate('/policy-document')} className="rounded-xl">
              Open
            </Button>
          </div>
        </motion.div>

        {/* Change Plan */}
        <motion.div variants={itemVariants as any} className={`space-y-4 pt-2 ${isCancelled ? 'opacity-50 pointer-events-none' : ''}`}>
          <h3 className="font-semibold text-lg px-2 text-foreground">Upgrade Protection</h3>
          <div className="space-y-3">
            {PLANS.map((plan) => {
              // V2 dynamic pricing integration
              const dynamicPremium = getDynamicPremium(
                plan.id,
                userData?.shield_score || 75,
                userData?.city_tier || 'Tier 3',
                'Standard' // Could be dynamic based on current season
              );

              return (
                <PlanOption
                  key={plan.id}
                  plan={plan}
                  calculatedPremium={dynamicPremium}
                  isSelected={activePolicy?.plan_id === plan.id}
                  onSelect={() => {
                    if (activePolicy?.plan_id !== plan.id) {
                      setPlanToChange({ ...plan, weeklyPremium: dynamicPremium });
                    }
                  }}
                />
              )
            })}
          </div>
        </motion.div>
        
        {/* Cancel Policy Button */}
        {!isCancelled && (
          <motion.div variants={itemVariants as any} className="pt-6 pb-4 flex justify-center">
            <button 
              onClick={() => setShowCancelModal(true)}
              className="text-sm font-medium text-muted-foreground hover:text-destructive transition-colors underline underline-offset-4"
            >
              Cancel Policy
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Change Plan Modal */}
      <AnimatePresence>
        {planToChange && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => !isProcessing && setPlanToChange(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-card border border-border shadow-2xl rounded-[2rem] p-6 z-[100] flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <button 
                  onClick={() => !isProcessing && setPlanToChange(null)} 
                  className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors border border-border"
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Confirm Plan Change</h3>
              <p className="text-sm text-muted-foreground mb-6">You are about to switch your active coverage to the <span className="text-foreground font-semibold">{planToChange.name}</span> plan. The new premium will be deducted from your next weekly payout cycle.</p>
              
              <div className="bg-muted/40 rounded-xl p-4 border border-border mb-6 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">New Premium</span>
                  <span className="font-bold text-foreground">₹{planToChange.weeklyPremium}/week</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">New Coverage</span>
                  <span className="font-bold text-accent">₹{planToChange.coverageAmount.toLocaleString()} max</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl h-12 border-border" 
                  onClick={() => setPlanToChange(null)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 rounded-xl h-12 bg-primary hover:bg-primary/90 text-primary-foreground" 
                  onClick={handleConfirmChangePlan}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Confirm Switch'}
                </Button>
              </div>
            </motion.div>
          </  >
        )}
      </AnimatePresence>

      {/* Cancel Policy Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => !isProcessing && setShowCancelModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-card border border-destructive/20 shadow-2xl rounded-[2rem] p-6 z-50 flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center border border-destructive/20">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <button 
                  onClick={() => !isProcessing && setShowCancelModal(false)} 
                  className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors border border-border"
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <h3 className="text-xl font-bold mb-2">Cancel Policy?</h3>
              <p className="text-sm text-muted-foreground mb-6">Cancelling your policy will instantly void any pending claims and stop all zero-touch payouts. This action cannot be undone.</p>
              
              <div className="bg-destructive/10 rounded-xl p-4 border border-destructive/20 mb-6">
                 <p className="text-sm font-semibold text-destructive/90 text-center">Are you sure you want to proceed?</p>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl h-12 border-border bg-transparent text-foreground hover:bg-muted" 
                  onClick={() => setShowCancelModal(false)}
                  disabled={isProcessing}
                >
                  Keep Policy
                </Button>
                <Button 
                  className="flex-1 rounded-xl h-12 bg-destructive hover:bg-destructive/90 text-white border-none" 
                  onClick={handleConfirmCancel}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Cancelling...' : 'Yes, Cancel'}
                </Button>
              </div>
            </motion.div>
          </  >
        )}
      </AnimatePresence>

    </div>
  );
}

function DetailRow({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string, highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <span className={`font-bold ${highlight ? 'text-accent text-lg drop-shadow-sm' : ''}`}>{value}</span>
    </div>
  );
}

function PlanOption({ plan, calculatedPremium, isSelected, onSelect }: { plan: typeof PLANS[0]; calculatedPremium: number, isSelected: boolean; onSelect: () => void; }) {
  return (
    <div
      onClick={onSelect}
      className={`p-5 rounded-[2rem] cursor-pointer transition-all border ${
        isSelected 
          ? 'border-primary bg-primary/5 shadow-[0_0_30px_-10px_rgba(79,70,229,0.3)]' 
          : 'border-border bg-card hover:bg-card/80 hover:border-primary/30 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between pointer-events-none">
        <div>
          <h4 className={`font-semibold text-lg ${isSelected ? 'text-primary' : ''}`}>{plan.name}</h4>
          <p className="text-sm text-muted-foreground font-medium">₹{calculatedPremium}/week</p>
        </div>
        {isSelected ? (
          <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
          </div>
        ) : (
           <div className="w-7 h-7 rounded-full border-2 border-muted" />
        )}
      </div>
    </div>
  );
}

