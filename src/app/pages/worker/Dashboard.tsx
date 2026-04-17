import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, animate, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { useDcs } from '../../../hooks/useDcs';
import { PLANS, getDynamicPremium } from '../../../constants/plans';
import { supabase } from '../../lib/supabaseClient';
import { getRecommendedPlan } from '../../../services/pricing/planRecommender';
import { cn } from '../../components/ui/utils';
import { NotificationsDropdown } from '../../components/navigation/NotificationsDropdown';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { checkMlStatus, getPremiumPrediction } from '../../../services/ml/mlApiService';
import SimulateTriggerButton from '../../components/dev/SimulateTriggerButton';
import LiveWeatherWidget from '../../components/dashboard/LiveWeatherWidget';
import DynamicPremiumCard from '../../components/dashboard/DynamicPremiumCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile: userData, activePolicy, refreshProfile, refreshPolicy } = useApp();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [dashboardPayouts, setDashboardPayouts] = useState<any[]>([]);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const { dcsOutput, refresh: refreshDcs } = useDcs(userData?.city_tier || 'Tier 1', user?.id, 30000, userData?.city);
  const [policyChecked, setPolicyChecked] = useState(false);
  const [modalSelectedPlan, setModalSelectedPlan] = useState<any>(null);
  const [activating, setActivating] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // DCS History for sparkline
  const [dcsHistory, setDcsHistory] = useState<{ value: number }[]>([]);

  const [mlOnline, setMlOnline] = useState(false);
  const [mlPremium, setMlPremium] = useState<any>(null);

  useEffect(() => {
    checkMlStatus().then(online => {
      setMlOnline(online);
      console.log('[ML] Status:', online ? 'ONLINE' : 'OFFLINE');
    });
  }, []);

  useEffect(() => {
    if (mlOnline && userData) {
      const fetchPremium = async () => {
        try {
          const month = new Date().getMonth() + 1;
          const premium = await getPremiumPrediction(
            userData,
            userData?.city_tier || 'Tier 1',
            month,
            {
              flood: dcsOutput?.floodRisk || 0.3,
              aqi: dcsOutput?.aqiRisk || 0.4
            }
          );
          if (premium) {
            setMlPremium(premium);
            console.log('[ML] Premium:', premium);
          }
        } catch (e) {
          console.error('[ML] Premium fetch failed:', e);
        }
      };
      fetchPremium();
    }
  }, [mlOnline, userData, dcsOutput]);

  useEffect(() => {
    if (dcsOutput) {
      setDcsHistory(prev => {
        const next = [...prev, { value: dcsOutput.currentDcs }];
        return next.length > 5 ? next.slice(-5) : next;
      });
    }
  }, [dcsOutput?.currentDcs]);

  // Live payout pipeline (real-time channel)
  const [livePayout, setLivePayout] = useState<PayoutResult | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    // Listen for new payouts via real-time
    const channel = supabase.channel('worker_live_payout')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'payouts',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const newPayout = payload.new as any;
        setLivePayout({
          payoutId: newPayout.transaction_id || 'GK-LIVE',
          status: newPayout.status === 'credited' ? 'credited' : 'processing',
          amount: newPayout.amount,
          upiId: userData?.upi_id || 'worker@upi',
          gateway: 'UPI / NPCI',
          transactionId: newPayout.transaction_id || '',
          settlementTimeSeconds: 4,
          timestamp: newPayout.created_at,
          message: newPayout.reason || 'Payout processed',
        });
        // Clear after 15 seconds
        setTimeout(() => setLivePayout(null), 15000);
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [user?.id]);

  useEffect(() => {
    if (!user || policyChecked) return;
    const checkPolicy = async () => {
      const { data } = await supabase
        .from('policies')
        .select('id, status, plan_name')
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setPolicyChecked(true);
      if (!data) setShowPlanModal(true);
    };
    checkPolicy();
  }, [user, policyChecked]);

  const handleActivatePlan = async () => {
    if (!modalSelectedPlan || !user) return;
    const upi = userData?.upi_id || (userData as any)?.upiId;
    if (!upi || upi.trim() === '') {
      // Try one last refresh in case they just registered
      setActivating(true);
      await refreshProfile();
      const freshUpi = userData?.upi_id || (userData as any)?.upiId;
      
      if (!freshUpi || freshUpi.trim() === '') {
        setActivating(false);
        setToast({ show: true, message: 'UPI ID is required to activate your shield. Please ensure it is set in Settings.', type: 'error' });
        return;
      }
    }
    setActivating(true);
    try {
      const dynamicPremium = getDynamicPremium(
        modalSelectedPlan.id,
        userData?.shield_score || 75,
        userData?.city_tier || 'Tier 3',
        'Standard'
      );

      const { data: existing } = await supabase.from('policies').select('id').eq('user_id', user.id).eq('status', 'ACTIVE').limit(1).maybeSingle();
      if (existing) { setPolicyChecked(true); setShowPlanModal(false); return; }

      const { error } = await supabase.from('policies').insert({
        user_id: user.id,
        plan_id: modalSelectedPlan.id,
        plan_name: modalSelectedPlan.name,
        weekly_premium: dynamicPremium,
        coverage_amount: modalSelectedPlan.coverageAmount,
        weekly_payout_cap: modalSelectedPlan.weeklyPayoutCap,
        status: 'ACTIVE'
      });
      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: user.id, type: 'policy_active', title: '🛡️ Shield Activated',
        message: `Your ${modalSelectedPlan.name} is now active. Weekly premium: ₹${modalSelectedPlan.weeklyPremium}. Coverage up to: ₹${modalSelectedPlan.coverageAmount.toLocaleString('en-IN')}.`,
        read: false, created_at: new Date().toISOString(),
      });
      if (typeof refetchNotifications === 'function') refetchNotifications();
      await new Promise(r => setTimeout(r, 800));
      await refreshPolicy();
      setShowPlanModal(false);
      setPolicyChecked(true);
      setToast({ show: true, message: `${modalSelectedPlan.name} activated successfully.`, type: 'success' });
    } catch (err: any) {
      setToast({ show: true, message: err?.message || 'Plan activation failed.', type: 'error' });
    } finally {
      setActivating(false);
    }
  };

  useEffect(() => {
    if (toast.show) {
      const t = setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
      return () => clearTimeout(t);
    }
  }, [toast.show]);

  const [payoutsLoading, setPayoutsLoading] = useState(true);
  useEffect(() => {
    if (!user?.id) return;
    const fetchPayouts = async () => {
      setPayoutsLoading(true);
      const { data, error } = await supabase.from('payouts').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (!error && data) setDashboardPayouts(data);
      setPayoutsLoading(false);
    };
    fetchPayouts();
  }, [user?.id]);

  const [metrics, setMetrics] = useState({
    totalPayoutAmount: 0, totalPayoutCount: 0, monthlyPayoutAmount: 0, activePolicy: null as any,
  });

  useEffect(() => {
    if (!user?.id) return;
    const fetchMetrics = async () => {
      const [payoutsRes, policyRes] = await Promise.all([
        supabase.from('payouts').select('amount, status, created_at').eq('user_id', user.id),
        supabase.from('policies').select('*').eq('user_id', user.id).eq('status', 'ACTIVE').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      const allPayouts = payoutsRes.data || [];
      const creditedPayouts = allPayouts.filter(p => p.status === 'credited' || p.status === 'Credited');
      const totalPayoutAmount = creditedPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyPayoutAmount = creditedPayouts
        .filter(p => new Date(p.created_at) >= monthStart)
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      setMetrics({
        totalPayoutAmount,
        totalPayoutCount: creditedPayouts.length,
        monthlyPayoutAmount,
        activePolicy: policyRes.data || null,
      });
    };
    fetchMetrics();
  }, [user?.id, activePolicy, refreshPolicy]);

  // Disruption event count for zone intelligence
  const [zoneEventCount, setZoneEventCount] = useState(0);
  useEffect(() => {
    if (!userData?.city) return;
    const fetch = async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase.from('payouts').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo);
      setZoneEventCount(count || 0);
    };
    fetch();
  }, [userData?.city]);

  const recommendedPlanId = getRecommendedPlan(
    dcsOutput || { currentDcs: 30, disruptionProbability: 0, timeToPeakDisruption: 0, riskColor: 'green' } as any,
    userData?.city_tier || 'Tier 1', userData?.shield_score || 75
  ).recommendedPlan.id;

  const getDcsGaugeColor = () => {
    switch (dcsOutput?.riskColor) {
      case 'amber': return '#F59E0B';
      case 'red': return '#EF4444';
      case 'green': default: return '#10B981';
    }
  };

  // Coverage countdown
  const coverageDaysLeft = useMemo(() => {
    if (!metrics.activePolicy?.created_at) return 0;
    const end = new Date(metrics.activePolicy.created_at);
    end.setDate(end.getDate() + 7);
    const diff = Math.max(0, Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    return diff;
  }, [metrics.activePolicy]);

  // Protection metrics
  const weeklyEarnings = userData?.weekly_earnings || 5000;
  const weeklyPayoutCap = metrics.activePolicy?.weekly_payout_cap || 0;
  const coverageRatio = weeklyEarnings > 0 ? Math.min((weeklyPayoutCap / weeklyEarnings) * 100, 100) : 0;
  const weeklyPremium = metrics.activePolicy?.weekly_premium || 0;
  const totalPremiumsPaid = weeklyPremium * Math.max(1, Math.ceil((Date.now() - new Date(metrics.activePolicy?.created_at || Date.now()).getTime()) / (7 * 24 * 60 * 60 * 1000)));
  const protectionROI = totalPremiumsPaid > 0 ? ((metrics.totalPayoutAmount / totalPremiumsPaid) * 100) : 0;

  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-container/5 via-background to-background pointer-events-none -z-10" />

      <main className="w-full relative pb-28 md:pb-8">
        {/* Top Header */}
        <header className="sticky top-0 h-24 bg-background/80 backdrop-blur-xl border-b border-outline-variant/5 z-30 flex justify-between items-center px-8 border-l border-outline-variant/10">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-white tracking-tight">Overview</h1>
            <p className="text-xs text-on-surface-variant font-medium tracking-wide uppercase">Financial Ground Control</p>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationsDropdown />
            <button className="w-12 h-12 rounded-full glass-card border border-outline-variant/20 flex items-center justify-center text-on-surface kinetic-button lg:hidden shadow-lg" onClick={() => navigate('/settings')}>
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </header>

        <div className="p-6 md:p-8 space-y-6">
          {/* ═══ LIVE PAYOUT PIPELINE (when active) ═══ */}
          <AnimatePresence>
            {livePayout && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <PayoutPipeline
                  payoutResult={livePayout}
                  triggerVerified={true}
                  policyConfirmed={true}
                  fraudCleared={livePayout.status !== 'failed'}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ DEV CONTROLS (Manual Simulation) ═══ */}
          <div className="flex justify-end p-2">
            <SimulateTriggerButton onComplete={() => {
              refreshProfile();
              refreshPolicy();
            }} />
          </div>

          {/* Top Banner (Active Coverage) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 rounded-[2rem] border border-outline-variant/10 shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_top_right,rgba(91,95,255,0.15),transparent_60%)] pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-center text-emerald-400 liquid-glow shrink-0">
                  <span className="material-symbols-outlined text-3xl">verified_user</span>
                </div>
                <div>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded border border-outline-variant/10 bg-surface-container mb-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] uppercase tracking-widest font-mono text-emerald-400 font-bold">{metrics.activePolicy?.status || 'No Active Policy'}</span>
                  </div>
                  <h2 className="text-3xl font-headline font-bold text-white tracking-tight">{metrics.activePolicy ? metrics.activePolicy.plan_name : 'Unprotected'}</h2>
                  <p className="text-sm text-on-surface-variant mt-2 font-medium max-w-sm">Deep protection logic is continuously verifying conditions.</p>
                </div>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <div className="bg-surface-container/50 border border-outline-variant/10 rounded-2xl p-4 flex-1 md:flex-initial">
                  <p className="text-[10px] uppercase text-on-surface-variant tracking-wider font-bold mb-1">Max Cover</p>
                  <p className="font-mono text-xl font-bold text-white">₹{metrics.activePolicy ? metrics.activePolicy.coverage_amount.toLocaleString('en-IN') : '0'}</p>
                </div>
                <div className="bg-surface-container/50 border border-outline-variant/10 rounded-2xl p-4 flex-1 md:flex-initial">
                  <p className="text-[10px] uppercase text-on-surface-variant tracking-wider font-bold mb-1">Premium</p>
                  <p className="font-mono text-xl font-bold text-primary-fixed">₹{metrics.activePolicy ? metrics.activePolicy.weekly_premium : '0'} <span className="text-xs text-on-surface-variant font-sans normal-case">/wk</span></p>
                </div>
                {/* Coverage Countdown */}
                {metrics.activePolicy && (
                  <div className="bg-surface-container/50 border border-outline-variant/10 rounded-2xl p-4 flex-1 md:flex-initial relative">
                    <p className="text-[10px] uppercase text-on-surface-variant tracking-wider font-bold mb-1">Days Left</p>
                    <div className="flex items-center gap-2">
                      <svg width="32" height="32" viewBox="0 0 36 36" className="shrink-0">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(69,69,85,0.3)" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round"
                          strokeDasharray={`${(coverageDaysLeft / 7) * 94} 94`}
                          transform="rotate(-90 18 18)"
                        />
                      </svg>
                      <span className="font-mono text-xl font-bold text-emerald-400">{coverageDaysLeft}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {!metrics.activePolicy && (
              <div className="mt-6 flex justify-end relative z-10">
                <button onClick={() => setShowPlanModal(true)} className="kinetic-button px-6 py-3 rounded-full bg-gradient-to-r from-primary-container to-secondary-container text-white font-semibold text-sm shadow-[0_5px_20px_rgba(91,95,255,0.3)]">Activate Cover Now</button>
              </div>
            )}
          </motion.div>

          {/* ML Prediction superseded by DynamicPremiumCard for UI consistency */}

          {/* ═══ LIVE ENVIRONMENTAL INTELLIGENCE ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <LiveWeatherWidget city={userData?.city || 'Hyderabad'} />
             <DynamicPremiumCard 
               basePremium={metrics.activePolicy?.weekly_premium || 99} 
               city={userData?.city || 'Hyderabad'} 
               riskScore={dcsOutput?.currentDcs || 30} 
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ═══ DCS RING (Upgraded) ═══ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel col-span-1 border border-outline-variant/10 rounded-[2rem] p-8 relative shadow-xl overflow-hidden group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white tracking-tight text-lg">Live Risk Index</h3>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[8px] uppercase tracking-widest text-emerald-400 font-bold">Live</span>
                    </div>
                    {mlOnline ? (
                      <span className="flex items-center gap-1 text-xs text-green-500">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        AI Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-slate-300" />
                        AI Offline
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] uppercase text-on-surface-variant font-mono tracking-widest mt-1">{userData?.city} • {userData?.city_tier}</p>
                  <p className="text-[9px] text-on-surface-variant/50 mt-0.5">Updates every 30s</p>
                </div>
                <button onClick={() => navigate('/disruption-live')} className="text-on-surface-variant group-hover:text-primary-fixed transition-colors">
                  <span className="material-symbols-outlined">open_in_new</span>
                </button>
              </div>

              {/* Animated SVG Ring */}
              <div className="relative h-48 flex items-center justify-center">
                <svg viewBox="0 0 120 120" className="w-40 h-40 drop-shadow-2xl">
                  {/* Background ring */}
                  <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(69,69,85,0.2)" strokeWidth="10" />
                  {/* Animated arc */}
                  <motion.circle
                    cx="60" cy="60" r="48" fill="none"
                    stroke={getDcsGaugeColor()}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 48}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                    animate={{ strokeDashoffset: (2 * Math.PI * 48) - ((dcsOutput?.currentDcs ?? 0) / 100) * (2 * Math.PI * 48) }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    transform="rotate(-90 60 60)"
                    style={{ filter: 'drop-shadow(0 0 12px currentColor)' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-5xl font-mono tracking-tighter font-black text-white mix-blend-plus-lighter">
                    <CountUp to={dcsOutput?.currentDcs ?? 0} />
                  </span>
                  <span className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">DCS</span>
                </div>
              </div>

              {/* Sparkline */}
              {dcsHistory.length > 1 && (
                <div className="flex items-center justify-center mt-2">
                  <ResponsiveContainer width={120} height={40}>
                    <LineChart data={dcsHistory}>
                      <Line type="monotone" dataKey="value" stroke={getDcsGaugeColor()} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className={cn("mt-4 rounded-xl p-4 text-xs font-medium border text-center transition-colors shadow-sm",
                dcsOutput?.riskColor === 'red' ? 'bg-error-container/20 border-error/30 text-error' :
                dcsOutput?.riskColor === 'amber' ? 'bg-warning/10 border-warning/30 text-warning' :
                'bg-surface-container border-outline-variant/20 text-emerald-400'
              )}>
                {dcsOutput?.riskLabel || 'Status Stable'}
              </div>
            </motion.div>

            {/* ═══ EARNINGS PROTECTION WIDGET ═══ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel col-span-1 border border-outline-variant/10 rounded-[2rem] p-8 shadow-xl flex flex-col relative overflow-hidden">
              <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary-container/10 blur-[60px] rounded-full pointer-events-none" />
              <div className="relative z-10 flex flex-col h-full">
                <h3 className="font-bold text-white tracking-tight text-lg mb-1">Your Protection</h3>
                <p className="text-xs text-on-surface-variant mb-4">Earnings coverage summary</p>

                {/* Coverage ratio bar */}
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Coverage Ratio</span>
                    <span className={cn("font-mono text-sm font-black",
                      coverageRatio >= 80 ? 'text-emerald-400' : coverageRatio >= 50 ? 'text-primary-fixed' : 'text-warning'
                    )}>{coverageRatio.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-outline-variant/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${coverageRatio}%` }}
                      transition={{ duration: 1 }}
                      className={cn("h-full rounded-full",
                        coverageRatio >= 80 ? 'bg-emerald-500' : coverageRatio >= 50 ? 'bg-primary-container' : 'bg-warning'
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <MiniMetric label="Weekly Earnings" value={`₹${weeklyEarnings.toLocaleString('en-IN')}`} />
                  <MiniMetric label="Payout Cap" value={`₹${weeklyPayoutCap.toLocaleString('en-IN')}`} />
                  <MiniMetric label="This Month" value={`₹${metrics.monthlyPayoutAmount.toLocaleString('en-IN')}`} />
                  <MiniMetric label="All Time" value={`₹${metrics.totalPayoutAmount.toLocaleString('en-IN')}`} />
                </div>

                <div className="flex items-center justify-between py-2 border-t border-outline-variant/10">
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Return on Protection</span>
                  <span className="font-mono text-sm font-black text-primary-fixed">{protectionROI.toFixed(0)}%</span>
                </div>

                <div className="mt-auto pt-4">
                  <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/10 flex items-center justify-between group cursor-pointer hover:border-primary-container/30 transition-colors" onClick={() => navigate('/claims-history')}>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface group-hover:text-primary-fixed transition-colors">
                        <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                      </div>
                      <span className="text-sm font-bold text-white tracking-wide">View History</span>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform group-hover:text-primary-fixed">chevron_right</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ═══ ZONE RISK INTELLIGENCE ═══ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel col-span-1 border border-outline-variant/10 rounded-[2rem] p-8 shadow-xl flex flex-col">
              <h3 className="font-bold text-white tracking-tight text-lg mb-1">Zone Intelligence</h3>
              <p className="text-[10px] uppercase text-on-surface-variant font-mono tracking-widest mb-4">{userData?.city} • {userData?.city_tier}</p>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs text-on-surface-variant">This Week's Risk:</span>
                <span className={cn("px-2 py-0.5 rounded text-xs font-bold uppercase",
                  dcsOutput?.riskColor === 'red' ? 'bg-error/20 text-error' :
                  dcsOutput?.riskColor === 'amber' ? 'bg-warning/20 text-warning' :
                  'bg-emerald-500/20 text-emerald-400'
                )}>{dcsOutput?.riskLabel || 'Safe'}</span>
                <span className="material-symbols-outlined text-sm text-on-surface-variant">
                  {(dcsOutput?.forecastDcs ?? 0) > (dcsOutput?.currentDcs ?? 0) ? 'trending_up' : 'trending_down'}
                </span>
              </div>

              <div className="bg-surface-container/50 rounded-xl p-3 border border-outline-variant/10 mb-4 text-xs text-on-surface-variant">
                Your zone has triggered <span className="font-mono font-bold text-white">{zoneEventCount}</span> payout events in the past 30 days.
              </div>

              <div className="bg-surface-container/50 rounded-xl p-3 border border-outline-variant/10 mb-4">
                <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">12h Forecast</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-white">{dcsOutput?.forecastDcs ?? 0}/100</span>
                  <span className="text-[10px] text-on-surface-variant">—</span>
                  <span className="text-[10px] text-on-surface-variant">{((dcsOutput?.disruptionProbability ?? 0) * 100).toFixed(0)}% disruption chance</span>
                </div>
              </div>

              {/* DCS Alert Banners */}
              {(dcsOutput?.currentDcs ?? 0) >= 70 && (
                <div className="bg-error/10 border border-error/30 rounded-xl p-3 text-xs text-error font-medium mb-3">
                  🚨 PAYOUT TRIGGER ZONE — Your claim is being processed automatically. Check your UPI for incoming payment.
                </div>
              )}
              {(dcsOutput?.currentDcs ?? 0) >= 50 && (dcsOutput?.currentDcs ?? 0) < 70 && (
                <div className="bg-warning/10 border border-warning/30 rounded-xl p-3 text-xs text-warning font-medium mb-3">
                  ⚡ Elevated risk detected. Ensure your policy is ACTIVE to receive automatic payout if DCS crosses 70.
                </div>
              )}

              {/* System Feed (compact) */}
              <div className="flex-1 mt-2">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-3">Recent Activity</p>
                <div className="space-y-3">
                  {dashboardPayouts.slice(0, 2).map((payout, i) => (
                    <div key={payout.id || i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[12px] text-emerald-400">add</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{payout.reason}</p>
                        <p className="text-[10px] font-mono text-emerald-400 font-bold">+₹{payout.amount}</p>
                      </div>
                    </div>
                  ))}
                  {dashboardPayouts.length === 0 && (
                    <p className="text-xs text-on-surface-variant/50 text-center">No activity yet</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Plan selection Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-[2rem] shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-10 glass-card custom-scrollbar">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white font-headline tracking-tight">Deploy Coverage</h2>
              <p className="text-on-surface-variant text-sm mt-3 max-w-lg mx-auto">
                No active policy detected. Provision a smart contract to protect your liquidity flow immediately.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {PLANS.map((plan) => {
                const isRecommended = plan.id === recommendedPlanId;
                const dynamicPremium = getDynamicPremium(
                  plan.id,
                  userData?.shield_score || 75,
                  userData?.city_tier || 'Tier 3',
                  'Standard'
                );

                return (
                <div key={plan.id} onClick={() => setModalSelectedPlan(plan)}
                  className={cn(
                    "relative border rounded-2xl p-6 cursor-pointer transition-all duration-300 group overflow-hidden bg-surface-container/50 backdrop-blur",
                    modalSelectedPlan?.id === plan.id
                      ? "border-primary-container bg-primary-container/10 scale-[1.02] shadow-[0_0_30px_rgba(91,95,255,0.15)]"
                      : "border-outline-variant/20 hover:border-outline-variant/50 hover:bg-surface-container"
                  )}
                >
                  {isRecommended && (
                    <div className="absolute top-0 inset-x-0 bg-primary-container text-white text-[10px] font-bold uppercase tracking-widest py-1.5 text-center shadow-md">AI Recommended</div>
                  )}
                  <h3 className="font-bold text-white text-xl mb-1 pt-4 font-headline">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-black text-primary-fixed font-mono tracking-tighter">₹{dynamicPremium}</span>
                    <span className="text-on-surface-variant text-xs font-medium">/wk</span>
                  </div>
                  <div className="text-sm text-on-surface-variant mb-4 font-medium">
                    Limits up to <span className="font-bold text-white font-mono mix-blend-plus-lighter">₹{plan.coverageAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <ul className="space-y-3 border-t border-outline-variant/10 pt-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-xs text-on-surface-variant font-medium">
                        <span className="material-symbols-outlined text-primary-fixed text-[16px] shrink-0">check_circle</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                );
              })}
            </div>

            <div className="flex flex-col items-center gap-4">
              <button onClick={handleActivatePlan} disabled={!modalSelectedPlan || activating}
                className="w-full md:w-auto min-w-[300px] kinetic-button bg-primary-container hover:bg-primary text-white font-bold tracking-wide py-4 md:py-5 px-8 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(91,95,255,0.3)] disabled:shadow-none font-headline text-lg"
              >
                {activating ? "Provisioning Policy..." : `Confirm ${modalSelectedPlan?.name || ''} Setup`}
              </button>
              <button onClick={() => { setShowPlanModal(false); setPolicyChecked(true); }}
                className="text-xs text-on-surface-variant hover:text-white uppercase tracking-widest font-bold mt-2 hover:underline underline-offset-4"
              >
                Bypass Registration
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className={cn("fixed bottom-24 lg:bottom-8 right-8 z-[100] px-6 py-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] text-white text-sm font-bold flex items-center gap-3 backdrop-blur-xl border", toast.type === 'success' ? 'bg-emerald-900/40 border-emerald-500/30' : 'bg-error-container/40 border-error/30')}>
          <span className="material-symbols-outlined">{toast.type === 'success' ? 'verified' : 'error'}</span>
          {toast.message}
        </div>
      )}
    </>
  );
}

// ─── Helper Components ─────────────────────────────────────

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-container/50 rounded-lg p-2 border border-outline-variant/10">
      <p className="text-[8px] uppercase tracking-widest text-on-surface-variant font-bold mb-0.5">{label}</p>
      <p className="font-mono text-xs font-bold text-white truncate">{value}</p>
    </div>
  );
}

function CountUp({ to, duration = 0.5 }: { to: number; duration?: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const controls = animate(0, to, {
      duration: duration,
      onUpdate(value) { setValue(Math.floor(value)); }
    });
    return () => controls.stop();
  }, [to, duration]);
  return <>{value.toLocaleString('en-IN')}</>;
}
