import { useState, useEffect, useMemo } from 'react';
import { Card } from '../../components/ui/card';
import { AdminLayout } from '../../components/AdminLayout';
import { TrendingUp, TrendingDown, Users, IndianRupee, AlertCircle, Activity, PlayCircle, Shield, Brain, Cpu, Zap, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine } from 'recharts';
import { ADMIN_WEEKLY_PAYOUTS } from '../../lib/mock-data';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';
import { cn } from '../../components/ui/utils';
import { generateWeeklyForecast } from '../../../services/analytics/weeklyForecast';
import { computeFraudScore } from '../../../services/fraud/fraudEngine';
import { generateFraudSignals } from '../../../services/fraud/fraudSignalGenerator';
import { simulatePayout, type PayoutResult } from '../../../services/payout/payoutSimulator';
import { PayoutPipeline } from '../../components/payout/PayoutPipeline';
import { createNotification } from '../../../services/notifications/notificationService';
import { DatabaseSetupHelp } from '../../components/admin/DatabaseSetupHelp';

export default function AdminDashboard() {
  const { setDisruptionState } = useApp();
  const navigate = useNavigate();

  const [isSimulating, setIsSimulating] = useState(false);
  const [policiesChecked, setPoliciesChecked] = useState(0);
  // Live data from Supabase
  const [activePolicyCount, setActivePolicyCount] = useState(0);
  const [totalWorkers, setTotalWorkers] = useState(0);
  const [weeklyPremiumIncome, setWeeklyPremiumIncome] = useState(0);
  const [weeklyPayoutExposure, setWeeklyPayoutExposure] = useState(0);
  const [totalClaimsPaid, setTotalClaimsPaid] = useState(0);
  const [totalClaimsCount, setTotalClaimsCount] = useState(0);
  const [avgDcs, setAvgDcs] = useState(42);
  // Simulation pipeline state
  const [simPayoutResult, setSimPayoutResult] = useState<PayoutResult | null>(null);
  const [simPipelineSteps, setSimPipelineSteps] = useState({ trigger: false, policy: false, fraud: false });
  const [simAffectedWorkers, setSimAffectedWorkers] = useState(0);
  const [simTotalAmount, setSimTotalAmount] = useState(0);

  // Worker selection for simulation
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [targetWorker, setTargetWorker] = useState<any>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchWorkers = async () => {
    setFetchError(null);
    try {
      // Direct query fallback for admin visibility (FIX 2B)
      const { data: joinedData, error: joinedError } = await supabase
        .from('policies')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            email,
            city,
            zone,
            role
          )
        `)
        .eq('status', 'ACTIVE');

      if (!joinedError && joinedData && joinedData.length > 0) {
        const workersList = joinedData.map(p => ({
          ...(p.profiles as any),
          policy: p
        })).filter(w => w.id); // Ensure we have a valid profile link
        
        setWorkers(workersList);
        if (workersList.length > 0 && !selectedWorkerId) {
          setSelectedWorkerId(workersList[0].id);
          setTargetWorker(workersList[0]);
        }
        return; // Success with joined query
      }

      // Secondary Fallback: Original decoupled query
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, city, zone, role')
        .eq('role', 'user');
      
      if (profileError) throw profileError;

      const { data: activePolicies, error: policyError } = await supabase
        .from('policies')
        .select('*')
        .eq('status', 'ACTIVE');

      if (profiles) {
        const workersList = profiles.map(p => {
          const policy = activePolicies?.find(po => po.user_id === p.id);
          return { ...p, policy };
        });
        
        setWorkers(workersList);
        if (workersList.length > 0 && !selectedWorkerId) {
          setSelectedWorkerId(workersList[0].id);
          setTargetWorker(workersList[0]);
        }
      }
    } catch (err: any) {
      console.error('[Admin] Worker fetch failed:', err);
      setFetchError(err.message || 'Failed to fetch workers');
    }
  };

  const seedDemoWorkers = async () => {
    setIsSimulating(true);
    toast.loading('Creating demo workers and policies...');
    
    try {
      // 1. Create 3 demo profile records (direct insert since they are already in Auth or we mock them)
      const demoUsers = [
        { id: crypto.randomUUID(), full_name: 'Rajesh Kumar', email: 'rajesh@demo.com', role: 'user', city: 'Chennai', zone: 'T. Nagar', city_tier: 'Tier 1' },
        { id: crypto.randomUUID(), full_name: 'Anjali Sharma', email: 'anjali@demo.com', role: 'user', city: 'Mumbai', zone: 'Andheri', city_tier: 'Tier 1' },
        { id: crypto.randomUUID(), full_name: 'Prakash G', email: 'prakash@demo.com', role: 'user', city: 'Bangalore', zone: 'Indiranagar', city_tier: 'Tier 1' }
      ];

      await supabase.from('profiles').insert(demoUsers);

      // 2. Assign policies
      const demoPolicies = demoUsers.map(u => ({
        user_id: u.id,
        plan_id: 'shield_lite',
        plan_name: 'Shield Lite',
        weekly_premium: 49,
        coverage_amount: 5000,
        weekly_payout_cap: 1200,
        status: 'ACTIVE',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 86400000).toISOString(),
        zone: u.zone
      }));

      await supabase.from('policies').insert(demoPolicies);
      
      toast.dismiss();
      toast.success('Demo workers created successfully!');
      fetchWorkers();
    } catch (err: any) {
      toast.dismiss();
      toast.error('Seeding failed: ' + err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  useEffect(() => {
    if (selectedWorkerId) {
      const w = workers.find(work => work.id === selectedWorkerId);
      setTargetWorker(w || null);
    }
  }, [selectedWorkerId, workers]);

  useEffect(() => {
    async function fetchLiveOps() {
      const [policyRes, userRes, payoutsRes] = await Promise.all([
        supabase.from('policies').select('weekly_premium, weekly_payout_cap, status'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('payouts').select('amount, status'),
      ]);

      const activePolicies = (policyRes.data || []).filter(p => p.status === 'ACTIVE');
      setActivePolicyCount(activePolicies.length || 1);
      setTotalWorkers(userRes.count || 1);
      setWeeklyPremiumIncome(activePolicies.reduce((s, p) => s + (p.weekly_premium || 0), 0));
      setWeeklyPayoutExposure(activePolicies.reduce((s, p) => s + (p.weekly_payout_cap || 0), 0));

      const creditedPayouts = (payoutsRes.data || []).filter(p => p.status === 'credited' || p.status === 'Credited');
      setTotalClaimsPaid(creditedPayouts.reduce((s, p) => s + (p.amount || 0), 0));
      setTotalClaimsCount(creditedPayouts.length);
    }
    fetchLiveOps();
  }, []);

  // Portfolio Health
  const coverageRatio = weeklyPayoutExposure > 0 ? (weeklyPremiumIncome / weeklyPayoutExposure) * 100 : 0;
  const healthRating = coverageRatio > 40 ? 'Healthy' : coverageRatio > 20 ? 'Adequate' : 'At Risk';
  const healthColor = coverageRatio > 40 ? 'text-emerald-400' : coverageRatio > 20 ? 'text-warning' : 'text-error';

  // Loss Ratio
  const lossRatio = weeklyPremiumIncome > 0 ? (totalClaimsPaid / weeklyPremiumIncome) * 100 : 0;
  const lossRatioColor = lossRatio < 60 ? 'text-emerald-400' : lossRatio < 80 ? 'text-warning' : 'text-error';
  const lossRatioLabel = lossRatio < 60 ? 'Healthy — portfolio is profitable' : lossRatio < 80 ? 'Watch — approaching break-even' : 'Alert — claims exceeding premium income';

  // Loss Ratio Trend (simulated 4 weeks)
  const lossRatioTrend = useMemo(() => [
    { week: 'W-4', ratio: Math.max(10, lossRatio - 15 + Math.random() * 10) },
    { week: 'W-3', ratio: Math.max(10, lossRatio - 8 + Math.random() * 10) },
    { week: 'W-2', ratio: Math.max(10, lossRatio - 3 + Math.random() * 8) },
    { week: 'W-1', ratio: Math.max(10, lossRatio) },
  ], [lossRatio]);

  // Weekly Forecast
  const forecast = useMemo(() => generateWeeklyForecast(
    Math.max(activePolicyCount, 1),
    weeklyPayoutExposure > 0 ? weeklyPayoutExposure / Math.max(activePolicyCount, 1) : 2000,
    new Date().getMonth() + 1,
    avgDcs
  ), [activePolicyCount, weeklyPayoutExposure, avgDcs]);

  // Fraud Analytics (demo batch)
  const fraudAnalytics = useMemo(() => {
    const month = new Date().getMonth() + 1;
    const total = Math.max(totalClaimsCount, 20);
    const passCount = Math.round(total * 0.72);
    const reviewCount = Math.round(total * 0.20);
    const failCount = total - passCount - reviewCount;
    const avgScore = Math.round(18 + Math.random() * 12);
    const gpsFlags = Math.round(total * 0.08);
    const weatherFlags = Math.round(total * 0.05);
    const behavioralFlags = Math.round(total * 0.12);
    return { total, passCount, reviewCount, failCount, avgScore, gpsFlags, weatherFlags, behavioralFlags };
  }, [totalClaimsCount]);

  const handleSimulate = async (type: 'success' | 'fraud_fail' | 'payout_fail') => {
    setIsSimulating(true);
    setPoliciesChecked(0);
    setSimPayoutResult(null);
    setSimPipelineSteps({ trigger: false, policy: false, fraud: false });
    setSimAffectedWorkers(0);
    setSimTotalAmount(0);

    // Step 1: Counting animation
    let count = 0;
    await new Promise<void>(resolve => {
      const interval = setInterval(() => {
        count += Math.floor(Math.random() * 50) + 12;
        setPoliciesChecked(Math.min(count, 142));
        if (count >= 142) { clearInterval(interval); resolve(); }
      }, 50);
    });

    // Step 2: Set disruption state
    setDisruptionState({
      dcs: 85,
      status: 'triggered',
      pipelineStatus: 'IDLE',
      rainfall: type === 'success' ? 5 : 65,
      aqi: type === 'success' ? 420 : 85,
      orderDrop: 45,
      simulationType: type,
      insight: 'Supervised Disruption Simulation'
    });

    // Step 3: Pipeline steps
    setSimPipelineSteps(p => ({ ...p, trigger: true }));
    await new Promise(r => setTimeout(r, 600));

    // Find affected workers
    const { data: usersWithPolicies } = await supabase.from('policies').select('user_id, weekly_payout_cap, plan_name, zone').eq('status', 'ACTIVE');
    const affected = usersWithPolicies || [];
    setSimAffectedWorkers(affected.length);
    setSimPipelineSteps(p => ({ ...p, policy: true }));
    await new Promise(r => setTimeout(r, 600));

    // Fraud check
    const workerToSimulate = targetWorker || (affected.length > 0 ? { id: affected[0].user_id, policy: affected[0] } : null);
    if (!workerToSimulate) {
      setIsSimulating(false);
      toast.error('No active workers found to simulate.');
      return;
    }

    const claimType = type === 'fraud_fail' ? 'fraudulent' as const : 'clean' as const;
    const signals = generateFraudSignals(claimType, workerToSimulate.policy?.zone || 'live-zone', new Date().getMonth() + 1);
    const fraudResult = computeFraudScore(signals);
    const fraudDecision = type === 'fraud_fail' ? 'fail' as const : 'pass' as const;
    setSimPipelineSteps(p => ({ ...p, fraud: true }));
    await new Promise(r => setTimeout(r, 400));

    // Payout for selected local worker
    const workerId = workerToSimulate.id;
    const policy = workerToSimulate.policy || {
        plan_name: 'Shield Lite (Auto)',
        weekly_payout_cap: 1200,
        zone: workerToSimulate.zone || 'General'
    };
    
    const amount = Math.min(policy.weekly_payout_cap || 1500, 350 + Math.round(Math.random() * 500));
    setSimTotalAmount(amount);

    const finalResult = await simulatePayout({
      userId: workerId,
      claimId: `SIM-${Date.now()}`,
      amount,
      upiId: 'worker@upi',
      planName: policy?.plan_name || 'Shield',
      triggerType: type === 'success' ? 'AQI Hazard' : 'Fraud Test',
      dcsScore: 85,
      fraudDecision: type === 'payout_fail' ? 'pass' : fraudDecision,
    }, (update) => setSimPayoutResult(update));

    // If credited, insert into Supabase
    if (finalResult.status === 'credited') {
      // Create disruption event for the zone
      await supabase.from('disruption_events').insert({
        event_type: type === 'success' ? 'AQI_HAZARD' : 'SIMULATION',
        dcs_score: 85,
        affected_zones: [policy?.zone || 'General'],
        is_active: true
      });

      await supabase.from('payouts').insert({
        user_id: workerId,
        amount: finalResult.amount,
        status: 'credited',
        reason: type === 'success' ? 'AQI Hazard — Simulated' : 'Simulation Event',
        transaction_id: finalResult.transactionId,
        created_at: finalResult.timestamp,
      });
      
      await createNotification(
        workerId,
        'payout_credited',
        '💰 Payout Credited',
        `₹${finalResult.amount.toLocaleString('en-IN')} credited to your UPI. Transaction: ${finalResult.transactionId}`
      );
    }

    setIsSimulating(false);
    toast.success('Simulation complete! Check Worker App for live updates.');
  };

  return (
    <AdminLayout>
      <div className="p-8 space-y-8 font-sans pb-28 min-h-screen bg-background text-on-surface relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-container/10 via-background to-background pointer-events-none -z-10" />

        {/* Header */}
        <div>
          <h1 className="text-3xl font-headline font-bold mb-2 tracking-tight text-white">Dashboard Overview</h1>
          <p className="text-on-surface-variant font-medium">Real-time insights into your parametric insurance operations</p>
        </div>

        {/* ═══ PORTFOLIO HEALTH ═══ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 bg-surface-container-low border-primary-container/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle_at_top_right,rgba(91,95,255,0.1),transparent_70%)] pointer-events-none" />
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <Shield className="w-6 h-6 text-primary-fixed" />
              <h3 className="font-bold text-lg tracking-tight text-white">Portfolio Health</h3>
              <span className={cn("ml-auto px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border", healthColor,
                coverageRatio > 40 ? 'bg-emerald-500/10 border-emerald-500/30' : coverageRatio > 20 ? 'bg-warning/10 border-warning/30' : 'bg-error/10 border-error/30'
              )}>{healthRating}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
              <MetricBox label="Active Policies" value={activePolicyCount.toLocaleString('en-IN')} mono />
              <MetricBox label="Workers Protected" value={totalWorkers.toLocaleString('en-IN')} mono />
              <MetricBox label="Weekly Premium" value={`₹${weeklyPremiumIncome.toLocaleString('en-IN')}`} mono />
              <MetricBox label="Payout Exposure" value={`₹${weeklyPayoutExposure.toLocaleString('en-IN')}`} mono />
              <MetricBox label="Coverage Ratio" value={`${coverageRatio.toFixed(1)}%`} mono color={healthColor} />
            </div>
          </Card>
        </motion.div>

        {/* ═══ LOSS RATIO + FORECAST ROW ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Loss Ratio Analysis */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-6 h-full">
              <div className="flex items-center gap-2 mb-4">
                <IndianRupee className="w-5 h-5 text-primary-fixed" />
                <h3 className="font-bold text-white tracking-tight">Loss Ratio Analysis</h3>
              </div>
              <div className="flex items-end gap-4 mb-4">
                <span className={cn("text-5xl font-mono font-black tracking-tighter", lossRatioColor)}>{lossRatio.toFixed(0)}%</span>
                <span className="text-xs text-on-surface-variant font-medium mb-2">{lossRatioLabel}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-surface-container/50 rounded-xl p-3 border border-outline-variant/10">
                  <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Premiums Collected</p>
                  <p className="font-mono text-sm font-bold text-white">₹{weeklyPremiumIncome.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-surface-container/50 rounded-xl p-3 border border-outline-variant/10">
                  <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Claims Paid</p>
                  <p className="font-mono text-sm font-bold text-white">₹{totalClaimsPaid.toLocaleString('en-IN')}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={lossRatioTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="week" stroke="var(--color-on-surface-variant)" tickLine={false} axisLine={false} fontSize={10} />
                  <YAxis stroke="var(--color-on-surface-variant)" tickLine={false} axisLine={false} fontSize={10} domain={[0, 120]} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface-container)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
                  <ReferenceLine y={70} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: 'Break-even', fill: '#F59E0B', fontSize: 9 }} />
                  <Line type="monotone" dataKey="ratio" stroke={lossRatio > 70 ? '#EF4444' : '#10B981'} strokeWidth={3} dot={{ r: 4, fill: lossRatio > 70 ? '#EF4444' : '#10B981' }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Weekly Forecast */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="p-6 h-full">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-primary-fixed" />
                <h3 className="font-bold text-white tracking-tight">Next Week Forecast</h3>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary-container/20 border border-primary-container/30 text-primary-fixed font-bold uppercase tracking-widest ml-auto">AI-Assisted</span>
              </div>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xs text-on-surface-variant">Confidence:</span>
                <span className="font-mono text-sm font-bold text-white">{(forecast.confidenceScore * 100).toFixed(0)}%</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <MetricBox label="Disruption Days" value={`${forecast.expectedDisruptionDays} of 7`} mono />
                <MetricBox label="Est. Claims" value={forecast.expectedClaimCount.toLocaleString('en-IN')} mono />
                <MetricBox label="Payout Liability" value={`₹${forecast.expectedPayoutLiability.toLocaleString('en-IN')}`} mono />
                <div className="bg-surface-container/50 rounded-xl p-3 border border-outline-variant/10">
                  <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Risk Level</p>
                  <span className={cn("px-2 py-0.5 rounded text-xs font-bold uppercase",
                    forecast.riskLevel === 'high' ? 'bg-error/20 text-error' :
                    forecast.riskLevel === 'medium' ? 'bg-warning/20 text-warning' :
                    'bg-emerald-500/20 text-emerald-400'
                  )}>{forecast.riskLevel}</span>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Key Risk Factors</p>
                {forecast.keyRiskFactors.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-on-surface-variant">
                    <span className="text-primary-fixed mt-0.5">•</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <div className="bg-surface-container/50 rounded-xl p-3 border border-outline-variant/10 mb-3">
                <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Recommendation</p>
                <p className="text-xs text-white font-medium">{forecast.recommendation}</p>
              </div>
              <p className="text-[9px] text-on-surface-variant/50 italic">Forecast based on seasonal patterns and current DCS. Actual outcomes may vary.</p>
            </Card>
          </motion.div>
        </div>

        {/* ═══ FRAUD ANALYTICS + CHARTS ROW ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fraud Analytics Widget */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="p-6 h-full">
              <div className="flex items-center gap-2 mb-6">
                <Cpu className="w-5 h-5 text-primary-fixed" />
                <h3 className="font-bold text-white tracking-tight">Fraud Analytics</h3>
                <span className="text-[9px] text-on-surface-variant ml-auto font-mono">This Week</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                  <p className="font-mono text-2xl font-black text-emerald-400">{fraudAnalytics.passCount}</p>
                  <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mt-1">Pass</p>
                  <p className="text-[9px] font-mono text-emerald-400">{((fraudAnalytics.passCount / fraudAnalytics.total) * 100).toFixed(0)}%</p>
                </div>
                <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 text-center">
                  <p className="font-mono text-2xl font-black text-warning">{fraudAnalytics.reviewCount}</p>
                  <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mt-1">Review</p>
                  <p className="text-[9px] font-mono text-warning">{((fraudAnalytics.reviewCount / fraudAnalytics.total) * 100).toFixed(0)}%</p>
                </div>
                <div className="bg-error/10 border border-error/20 rounded-xl p-3 text-center">
                  <p className="font-mono text-2xl font-black text-error">{fraudAnalytics.failCount}</p>
                  <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mt-1">Reject</p>
                  <p className="text-[9px] font-mono text-error">{((fraudAnalytics.failCount / fraudAnalytics.total) * 100).toFixed(0)}%</p>
                </div>
              </div>
              <div className="space-y-3">
                <FlagRow label="Avg Fraud Score" value={`${fraudAnalytics.avgScore}/100`} />
                <FlagRow label="GPS Spoofing Flags" value={`${fraudAnalytics.gpsFlags}`} color="text-error" />
                <FlagRow label="Fake Weather Flags" value={`${fraudAnalytics.weatherFlags}`} color="text-warning" />
                <FlagRow label="Behavioral Flags" value={`${fraudAnalytics.behavioralFlags}`} color="text-primary-fixed" />
                <FlagRow label="Detection Rate" value={`${(((fraudAnalytics.reviewCount + fraudAnalytics.failCount) / fraudAnalytics.total) * 100).toFixed(0)}%`} />
              </div>
            </Card>
          </motion.div>

          {/* Weekly Payouts Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="p-6 h-full">
              <h3 className="font-bold mb-6 text-white uppercase tracking-widest text-sm">Weekly Payouts</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ADMIN_WEEKLY_PAYOUTS}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" stroke="var(--color-on-surface-variant)" tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-on-surface-variant)" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface-container)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                  <Bar dataKey="amount" fill="var(--color-primary-fixed)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </div>

        {/* ═══ CLAIMS PIPELINE LIVE STATUS ═══ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-primary-fixed" />
              <h3 className="font-bold text-white tracking-tight">Claims Pipeline Status</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Trigger Fired', count: totalClaimsCount, color: 'text-primary-fixed', bg: 'bg-primary-container/10' },
                { label: 'Policy Checked', count: totalClaimsCount, color: 'text-primary-fixed', bg: 'bg-primary-container/10' },
                { label: 'Fraud Verified', count: Math.round(totalClaimsCount * 0.92), color: 'text-warning', bg: 'bg-warning/10' },
                { label: 'Payout Released', count: Math.round(totalClaimsCount * 0.85), color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              ].map((step, i) => (
                <div key={step.label} className="bg-surface-container/50 rounded-xl p-4 border border-outline-variant/10">
                  <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">{step.label}</p>
                  <p className={cn("font-mono text-2xl font-black", step.color)}>{step.count}</p>
                  <div className="mt-2 h-1.5 bg-outline-variant/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: totalClaimsCount > 0 ? `${(step.count / totalClaimsCount) * 100}%` : '0%' }}
                      transition={{ duration: 1, delay: i * 0.2 }}
                      className={cn("h-full rounded-full", step.bg, step.color === 'text-emerald-400' ? 'bg-emerald-500/50' : step.color === 'text-warning' ? 'bg-warning/50' : 'bg-primary-container/50')}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* ═══ SIMULATION CONTROL PANEL ═══ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="p-6 bg-surface-container-low border-primary-container/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle_at_top_right,rgba(91,95,255,0.1),transparent_70%)] pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <PlayCircle className="w-8 h-8 text-primary-fixed" />
                <div>
                  <h3 className="font-bold text-xl tracking-tight text-white">Simulation Control Panel</h3>
                  <p className="text-xs text-on-surface-variant font-medium">Trigger specific scenarios with live fraud + payout pipeline</p>
                </div>
              </div>
              {isSimulating && (
                <div className="md:ml-auto bg-primary-container text-white px-4 py-2 rounded-xl flex items-center gap-2 animate-pulse font-mono shadow-lg border border-primary-container/50">
                  <Activity className="w-5 h-5" />
                  <span className="font-bold text-lg">{policiesChecked}</span>
                  <span className="text-xs font-sans font-medium uppercase tracking-widest opacity-80 mt-0.5">Live Ping</span>
                </div>
              )}
            </div>

            {/* Worker Selection Dropdown */}
            <div className="mb-8 relative z-10 max-w-sm bg-surface-container/30 border border-outline-variant/10 rounded-2xl p-4">
               <div className="flex items-center justify-between mb-3">
                 <label className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant block">Target Worker for Simulation</label>
                 <button onClick={fetchWorkers} className="p-1 hover:bg-white/5 rounded-full transition-colors">
                    <RefreshCw className="w-3 h-3 text-on-surface-variant" />
                 </button>
               </div>
               
               <select 
                 value={selectedWorkerId}
                 onChange={(e) => setSelectedWorkerId(e.target.value)}
                 className="w-full bg-background border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-fixed/50 transition-all cursor-pointer"
               >
                 {workers.map(w => {
                   const displayName = w.full_name || w.email || `Worker_${w.id.substring(0, 4)}`;
                   const zoneInfo = w.policy?.zone || w.zone || 'No Zone';
                   return (
                     <option key={w.id} value={w.id}>
                       {displayName} {w.policy ? `(${zoneInfo})` : `(No Active Policy)`}
                     </option>
                   );
                 })}
               </select>

               {targetWorker && (
                 <div className="mt-3 flex items-center gap-2 text-[10px] text-on-surface-variant/70 font-medium">
                   {targetWorker.policy ? (
                     <>
                      <Shield className="w-3 h-3 text-emerald-400" />
                      Linked Policy: <span className="text-white">{targetWorker.policy?.plan_name}</span>
                     </>
                   ) : (
                     <div className="flex items-center gap-2 text-warning">
                       <AlertCircle className="w-3 h-3" />
                       Warning: No active policy. Simulation will use defaults.
                     </div>
                   )}
                 </div>
               )}

               {fetchError && (
                 <p className="mt-2 text-[9px] text-error font-mono bg-error/5 p-2 rounded border border-error/10 uppercase tracking-tighter">
                   Error: {fetchError}
                 </p>
               )}

               <DatabaseSetupHelp />

               {workers.length === 0 && !fetchError && (
                 <button 
                  onClick={seedDemoWorkers}
                  className="w-full mt-4 bg-primary-fixed/10 hover:bg-primary-fixed/20 text-primary-fixed border border-primary-fixed/20 rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest transition-all"
                 >
                   🚀 Populate Native Database with Demo Workers
                 </button>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 mb-6">
              <div className="glass-panel p-6 flex flex-col items-start gap-4 border border-outline-variant/10 rounded-2xl group hover:border-emerald-500/30 transition-colors">
                <div>
                  <h4 className="font-bold text-emerald-400">Tier 3 + AQI Trigger</h4>
                  <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">Full pipeline: fraud check → payout via UPI. Live PayoutPipeline animation.</p>
                </div>
                <button disabled={isSimulating} onClick={() => handleSimulate('success')} className="w-full mt-auto kinetic-button bg-surface-container py-3 rounded-xl font-bold text-sm text-white hover:bg-emerald-500/20 border border-transparent hover:border-emerald-500/30 transition-colors disabled:opacity-50">Trigger Success Flow</button>
              </div>

              <div className="glass-panel p-6 flex flex-col items-start gap-4 border border-outline-variant/10 rounded-2xl group hover:border-error/30 transition-colors">
                <div>
                  <h4 className="font-bold text-error">Fraud Verification Failure</h4>
                  <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">Triggers pipeline but fails fraud check (GPS mismatch) → Payout Blocked.</p>
                </div>
                <button disabled={isSimulating} onClick={() => handleSimulate('fraud_fail')} className="w-full mt-auto kinetic-button bg-surface-container py-3 rounded-xl font-bold text-sm text-white hover:bg-error/20 border border-transparent hover:border-error/30 transition-colors disabled:opacity-50">Trigger Fraud Flow</button>
              </div>

              <div className="glass-panel p-6 flex flex-col items-start gap-4 border border-outline-variant/10 rounded-2xl group hover:border-warning/30 transition-colors">
                <div>
                  <h4 className="font-bold text-warning">Payout Retry Flow</h4>
                  <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">Passes fraud but initial UPI transfer fails. Shows retry pipeline.</p>
                </div>
                <button disabled={isSimulating} onClick={() => handleSimulate('payout_fail')} className="w-full mt-auto kinetic-button bg-surface-container py-3 rounded-xl font-bold text-sm text-white hover:bg-warning/20 border border-transparent hover:border-warning/30 transition-colors disabled:opacity-50">Trigger Retry Flow</button>
              </div>
            </div>

            {/* Live Pipeline Visualization */}
            <AnimatePresence>
              {(simPayoutResult || simPipelineSteps.trigger) && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative z-10">
                  {simAffectedWorkers > 0 && (
                    <div className="flex items-center gap-6 mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary-fixed" />
                        <span className="text-sm text-on-surface-variant">Workers Affected:</span>
                        <span className="font-mono font-bold text-white">{simAffectedWorkers}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <IndianRupee className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-on-surface-variant">Total Amount:</span>
                        <span className="font-mono font-bold text-emerald-400">₹{simTotalAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  )}
                  <PayoutPipeline
                    payoutResult={simPayoutResult}
                    triggerVerified={simPipelineSteps.trigger}
                    policyConfirmed={simPipelineSteps.policy}
                    fraudCleared={simPipelineSteps.fraud}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <Card className="p-6">
            <h3 className="font-bold mb-6 text-white uppercase tracking-widest text-sm">Recent Activity Stream</h3>
            <div className="space-y-4">
              <ActivityItem title="High risk detected in T. Nagar" description="DCS reached 85, triggering payout pipeline" time="10 minutes ago" type="alert" />
              <ActivityItem title="Weekly settlement completed" description={`₹${totalClaimsPaid.toLocaleString('en-IN')} processed across ${totalClaimsCount} claims`} time="2 hours ago" type="success" />
              <ActivityItem title="Fraud pattern detected" description={`${fraudAnalytics.gpsFlags} claims flagged for GPS mismatch this week`} time="4 hours ago" type="warning" />
            </div>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
}

// ─── Helper Components ─────────────────────────────────────

function MetricBox({ label, value, mono, color }: { label: string; value: string; mono?: boolean; color?: string }) {
  return (
    <div className="bg-surface-container/50 rounded-xl p-3 border border-outline-variant/10">
      <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">{label}</p>
      <p className={cn("text-sm font-bold", mono && "font-mono", color || "text-white")}>{value}</p>
    </div>
  );
}

function FlagRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-outline-variant/5 last:border-0">
      <span className="text-xs text-on-surface-variant font-medium">{label}</span>
      <span className={cn("font-mono text-sm font-bold", color || "text-white")}>{value}</span>
    </div>
  );
}

function ActivityItem({ title, description, time, type }: any) {
  return (
    <div className="flex items-start gap-4 pb-4 border-b border-outline-variant/10 last:border-0 last:pb-0">
      <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0 shadow-lg", type === 'alert' ? "bg-error" : type === 'success' ? "bg-emerald-400" : "bg-warning")} />
      <div className="flex-1">
        <p className="font-bold text-white mb-1 tracking-tight">{title}</p>
        <p className="text-xs text-on-surface-variant leading-relaxed">{description}</p>
      </div>
      <p className="text-[10px] uppercase font-mono text-on-surface-variant opacity-50 whitespace-nowrap">{time}</p>
    </div>
  );
}
