import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabaseClient';
import { Users, Shield, Wallet, Zap, Activity, ShieldAlert, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { cn } from '../../components/ui/utils';

export default function Analytics() {
  const [loading, setLoading] = useState(true);

  const [payouts, setPayouts] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payoutsRes, policiesRes, eventsRes, profilesRes, claimsRes] = await Promise.all([
        supabase.from('payouts').select('*, profiles(full_name, city)').order('created_at', { ascending: false }),
        supabase.from('policies').select('*'),
        supabase.from('disruption_events').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('claims').select('*'),
      ]);

      setPayouts(payoutsRes.data || []);
      setPolicies(policiesRes.data || []);
      setEvents(eventsRes.data || []);
      setProfiles(profilesRes.data || []);
      setClaims(claimsRes.data || []);
    } catch (err) {
      console.error('Fatal fetch error: ', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (val: number) => '₹' + val.toLocaleString('en-IN');
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Metrics
  const totalWorkers = profiles.filter(p => p.role === 'user').length;
  const activePoliciesCount = policies.filter(p => p.status === 'ACTIVE' || p.status === 'active').length;
  const totalPayoutsSum = payouts.filter(p => p.status === 'credited').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalDisruptions = events.length;
  const pipelineCount = claims.length > 0 ? claims.length : events.filter(e => e.status === 'active').length;
  const fraudQueueCount = payouts.filter(p => p.fraud_status === 'flagged' || p.fraud_score > 70).length + claims.filter(c => c.fraud_status === 'flagged' || c.fraud_score > 70).length;

  // Chart Data Preparation...
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const payoutSeries = payouts
    .filter(p => p.status === 'credited' && new Date(p.created_at) >= thirtyDaysAgo)
    .reduce((acc: any, curr: any) => {
      const dateKey = curr.created_at.split('T')[0];
      if (!acc[dateKey]) acc[dateKey] = { date: dateKey, amount: 0 };
      acc[dateKey].amount += Number(curr.amount) || 0;
      return acc;
    }, {});
  const chartData = Object.values(payoutSeries).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const policyDist = policies
    .filter(p => p.status === 'ACTIVE' || p.status === 'active')
    .reduce((acc: any, curr: any) => {
      const name = curr.plan_name || 'Unknown';
      if (!acc[name]) acc[name] = { name, count: 0 };
      acc[name].count += 1;
      return acc;
    }, {});
  const pieData = Object.values(policyDist);
  const pieColors: Record<string, string> = { 'Shield Lite': '#3B82F6', 'Shield Plus': '#6366F1', 'Shield Max': '#8B5CF6' };

  const triggerDist = events.reduce((acc: any, curr: any) => {
    const type = curr.trigger_type || 'Unknown';
    if (!acc[type]) acc[type] = { type, count: 0 };
    acc[type].count += 1;
    return acc;
  }, {});
  const triggerData = Object.values(triggerDist);

  const tierDist = profiles.filter(p => p.role === 'user').reduce((acc: any, curr: any) => {
      const tier = curr.city_tier || 'Unknown';
      if (!acc[tier]) acc[tier] = { tier, count: 0 };
      acc[tier].count += 1;
      return acc;
  }, {});
  const tierData = Object.values(tierDist);

  const creditedPayouts = payouts.filter(p => p.status === 'credited');
  const avgSettlementTime = creditedPayouts.length > 0 ? Math.round(creditedPayouts.reduce((sum, p) => sum + (Number(p.settlement_duration_minutes) || 0), 0) / creditedPayouts.length) : null;
  const successRate = payouts.length > 0 ? Math.round((creditedPayouts.length / payouts.length) * 100) : null;
  const avgDcs = events.length > 0 ? (events.reduce((sum, e) => sum + (Number(e.dcs_score) || 0), 0) / events.length).toFixed(1) : null;

  let mostFreqTrigger = 'N/A';
  if (triggerData.length > 0) mostFreqTrigger = triggerData.reduce((prev: any, current: any) => (prev.count > current.count) ? prev : current).type;

  const cityDist = profiles.filter(p => p.role === 'user').reduce((acc: any, curr: any) => {
    const city = curr.city || 'Unknown';
    if (!acc[city]) acc[city] = { city, count: 0 };
    acc[city].count += 1;
    return acc;
  }, {});
  let topCity = 'N/A';
  if (Object.values(cityDist).length > 0) topCity = Object.values(cityDist).reduce((prev: any, current: any) => (prev.count > current.count) ? prev : current).city;

  const users = profiles.filter(p => p.role === 'user');
  const avgShield = users.length > 0 ? (users.reduce((sum, u) => sum + (Number(u.shield_score) || 0), 0) / users.length).toFixed(1) : null;

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 space-y-8 font-sans pb-28 md:pb-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-white tracking-tight">Analytics & Insights</h1>
            <p className="text-on-surface-variant text-sm mt-1">Real-time operational overview of GigKavacham</p>
          </div>
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="kinetic-button bg-surface-container hover:bg-surface-container-high text-white text-sm px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors border border-outline-variant/10 shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Section 1: KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard loading={loading} title="Workers Registered" value={totalWorkers} icon={<Users className="w-5 h-5 text-primary-fixed"/>} />
          <MetricCard loading={loading} title="Active Policies" value={activePoliciesCount} icon={<Shield className="w-5 h-5 text-emerald-400"/>} />
          <MetricCard loading={loading} title="Total Payouts" value={totalPayoutsSum > 0 ? formatCurrency(totalPayoutsSum) : 0} icon={<Wallet className="w-5 h-5 text-emerald-400"/>} />
          <MetricCard loading={loading} title="Disruption Events" value={totalDisruptions} icon={<Zap className="w-5 h-5 text-warning"/>} />
          <MetricCard loading={loading} title="Claims in Pipeline" value={pipelineCount} icon={<Activity className="w-5 h-5 text-primary-fixed"/>} />
          <MetricCard loading={loading} title="Fraud Queue" value={fraudQueueCount} icon={<ShieldAlert className="w-5 h-5 text-error"/>} note={fraudQueueCount === 0 ? 'Queue clear' : undefined} />
        </div>

        {/* Section 2: Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card rounded-[2rem] border border-outline-variant/10 p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest leading-none">Payout Trend <span className="opacity-50">/ 30 Days</span></h3>
            {loading ? <Skeleton height="h-64" /> : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: 'var(--color-on-surface-variant)'}} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={30} />
                  <YAxis tickFormatter={(val) => `₹${(val)}`} tick={{fontSize: 12, fill: 'var(--color-on-surface-variant)'}} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(val: number) => [formatCurrency(val), "Amount"]} contentStyle={{borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'var(--color-surface-container)', color: 'white'}} />
                  <Line type="monotone" dataKey="amount" stroke="var(--color-primary-fixed)" strokeWidth={3} dot={{ fill: 'var(--color-primary-fixed)', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyState message="No payout data yet." />}
          </div>

          <div className="glass-card rounded-[2rem] border border-outline-variant/10 p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest leading-none">Policy Mix</h3>
            {loading ? <Skeleton height="h-64" /> : pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                      {pieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={pieColors[entry.name] || 'var(--color-primary-container)'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'var(--color-surface-container)', color: 'white'}} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-4 justify-center mt-4">
                  {pieData.map((entry: any) => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
                      <span className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: pieColors[entry.name] || 'var(--color-primary-container)' }} />
                      {entry.name} ({entry.count})
                    </div>
                  ))}
                </div>
              </>
            ) : <EmptyState message="No active policies" />}
          </div>
        </div>

        {/* Section 4 & 5: Bar Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-[2rem] border border-outline-variant/10 p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest leading-none">Triggers by Type</h3>
            {loading ? <Skeleton height="h-64" /> : triggerData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={triggerData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="type" tick={{fontSize: 12, fill: 'var(--color-on-surface-variant)'}} tickLine={false} axisLine={false} />
                  <YAxis tick={{fontSize: 12, fill: 'var(--color-on-surface-variant)'}} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'var(--color-surface-container)', color: 'white'}} />
                  <Bar dataKey="count" fill="var(--color-warning)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState message="No trigger data." />}
          </div>

          <div className="glass-card rounded-[2rem] border border-outline-variant/10 p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest leading-none">User Tier Distribution</h3>
            {loading ? <Skeleton height="h-64" /> : tierData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={tierData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="tier" tick={{fontSize: 12, fill: 'var(--color-on-surface-variant)'}} tickLine={false} axisLine={false} />
                  <YAxis tick={{fontSize: 12, fill: 'var(--color-on-surface-variant)'}} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'var(--color-surface-container)', color: 'white'}} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {tierData.map((entry: any, index: number) => {
                      const colors: Record<string, string> = { 'Tier 1': 'var(--color-primary-fixed)', 'Tier 2': 'var(--color-primary-container)', 'Tier 3': '#10B981' };
                      return <Cell key={`cell-${index}`} fill={colors[entry.tier] || '#F59E0B'} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState message="No workers registered yet." />}
          </div>
        </div>

        {/* Tables and KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card rounded-[2rem] border border-outline-variant/10 shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-outline-variant/10 bg-surface-container-low/50">
               <h3 className="text-sm font-bold text-white uppercase tracking-widest leading-none">Recent Payout Logs</h3>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-surface-container-lowest text-on-surface-variant text-[10px] uppercase font-bold tracking-widest border-b border-outline-variant/10">
                  <tr>
                    <th className="px-6 py-4">Participant</th>
                    <th className="px-6 py-4">Vector</th>
                    <th className="px-6 py-4">Value</th>
                    <th className="px-6 py-4">State</th>
                    <th className="px-6 py-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {loading ? (
                    <tr><td colSpan={5} className="p-6"><Skeleton height="h-48" /></td></tr>
                  ) : payouts.length > 0 ? (
                    payouts.slice(0, 8).map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-surface-container-low transition-colors group">
                        <td className="px-6 py-4">
                           <p className="font-bold text-white tracking-tight">{row.profiles?.full_name || 'Anonymous'}</p>
                           <p className="text-[10px] text-on-surface-variant font-mono">{row.profiles?.city || 'Unknown'}</p>
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant font-medium">{row.trigger_reason || 'Autonomous Event'}</td>
                        <td className="px-6 py-4 text-primary-fixed font-mono font-bold tracking-tight">{formatCurrency(Number(row.amount))}</td>
                        <td className="px-6 py-4">
                          <span className={cn("px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border", row.status === 'credited' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-warning/10 text-warning border-warning/20')}>
                             {row.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant/80 font-mono text-xs">{formatDate(row.created_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant text-sm">No ledger entries yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-card rounded-[2rem] border border-outline-variant/10 shadow-xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest leading-none mb-6">Efficiency Indexes</h3>
            <div className="grid grid-cols-2 gap-4">
                <KpiCard loading={loading} label="Avg Settlement" value={avgSettlementTime !== null ? `${avgSettlementTime}m` : '-'} />
                <KpiCard loading={loading} label="Success Rate" value={successRate !== null ? `${successRate}%` : '-'} />
                <KpiCard loading={loading} label="DCS Threshold" value={avgDcs !== null ? avgDcs : '-'} />
                <KpiCard loading={loading} label="Dominant Vector" value={mostFreqTrigger === 'N/A' ? '-' : mostFreqTrigger} />
                <KpiCard loading={loading} label="Active Zone" value={topCity === 'N/A' ? '-' : topCity} />
                <KpiCard loading={loading} label="Global Shield" value={avgShield !== null ? avgShield : '-'} />
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}

function MetricCard({ title, value, icon, loading, note }: any) {
  return (
    <div className="glass-card rounded-3xl p-6 border border-outline-variant/10 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 transition-opacity translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 duration-500 blur-[2px] group-hover:blur-none">{icon}</div>
      <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-2 relative z-10">{title}</p>
      {loading ? <div className="animate-pulse bg-surface-container rounded h-8 w-20 mt-1 relative z-10" /> : (
        <div className="relative z-10">
          <p className="text-3xl font-headline font-bold text-white tracking-tighter">{value}</p>
          {note && <p className="text-[10px] text-error font-mono mt-1 opacity-80 uppercase">{note}</p>}
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, loading }: any) {
  return (
    <div className="bg-surface-container-low/50 rounded-2xl border border-outline-variant/5 p-4 flex flex-col justify-center">
      <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest leading-tight mb-2 line-clamp-1 truncate">{label}</p>
      {loading ? <div className="animate-pulse bg-surface-container rounded-sm h-6 w-12" /> : <p className="font-mono text-xl font-bold text-white">{value}</p>}
    </div>
  );
}

function Skeleton({ height }: { height: string }) {
  return <div className={cn("animate-pulse bg-surface-container rounded-xl w-full", height)} />;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px] border border-dashed border-outline-variant/20 rounded-2xl bg-surface-container-lowest/50">
      <p className="text-sm text-on-surface-variant font-medium text-center px-4">{message}</p>
    </div>
  );
}
