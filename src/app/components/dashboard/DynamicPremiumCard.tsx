import { useEffect, useState } from 'react';
import { TrendingUp, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { PLANS, getDynamicPremium } from '../../../constants/plans';
import { Card } from '../ui/card';
import { cn } from '../ui/utils';

export default function DynamicPremiumCard({ 
  basePremium, 
  city, 
  riskScore 
}: { 
  basePremium: number; 
  city: string; 
  riskScore: number 
}) {
  const [loading, setLoading] = useState(true);
  const [finalPremium, setFinalPremium] = useState<number>(0);
  const [planName, setPlanName] = useState('');

  useEffect(() => {
    // Find the current plan to get its ID
    const plan = PLANS.find(p => p.weeklyPremium === basePremium) || PLANS[1]; 
    setPlanName(plan.name);
    // V2 dynamic pricing
    const premium = getDynamicPremium(plan.id, riskScore, 'Tier 2', 'Standard');
    setFinalPremium(premium);
    setLoading(false);
  }, [basePremium, riskScore]);

  if (loading) {
    return (
      <div className="h-40 bg-slate-900/50 animate-pulse rounded-[2rem] border border-slate-800" />
    );
  }

  const isHighRisk = riskScore > 65;

  return (
    <Card className="p-8 bg-slate-900 border-slate-800 rounded-[2rem] shadow-xl relative overflow-hidden group">
      <div className={cn(
        "absolute inset-0 opacity-[0.03] pointer-events-none transition-all duration-500",
        isHighRisk ? "bg-orange-500" : "bg-emerald-500"
      )} />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Dynamic Premium</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Real-time Risk Adjustment • {city}</p>
          </div>
          <motion.div 
            animate={isHighRisk ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={cn(
              "p-2.5 rounded-2xl border",
              isHighRisk ? "bg-orange-500/10 border-orange-500/30 text-orange-400" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            )}
          >
            <TrendingUp className="w-5 h-5" />
          </motion.div>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
           <span className="text-4xl font-black text-white font-mono tracking-tighter">₹{finalPremium}</span>
           <span className="text-sm text-slate-500 font-medium">/ week</span>
        </div>

        <p className={cn(
          "text-xs font-medium leading-relaxed mb-6",
          isHighRisk ? "text-orange-400/80" : "text-emerald-400/80"
        )}>
          {isHighRisk 
            ? `Risk score of ${riskScore} detected. Behavioral and environmental factors have increased your premium to ensure stable liquidity.`
            : `Conditions in ${city} are favorable. Your premium is optimized based on a risk score of ${riskScore}.`}
        </p>

        <div className="space-y-3 border-t border-slate-800/50 pt-6">
           <DetailRow label="Plan" value={planName} />
           <DetailRow label="Base Premium" value={`₹${basePremium}`} />
           <DetailRow 
             label="Current Risk Ratio" 
             value={`${(finalPremium / basePremium).toFixed(2)}x`} 
             highlight={finalPremium > basePremium} 
           />
        </div>

        <div className="mt-8 flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/5">
           <Zap className="w-3 h-3 text-primary animate-pulse" />
           <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">V2 PRICING ENGINE ACTIVE • NON-FIXED PREMIUMS</p>
        </div>
      </div>
    </Card>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
      <span className="text-slate-500">{label}</span>
      <span className={cn(
        "font-mono",
        highlight ? "text-orange-400" : "text-slate-300"
      )}>{value}</span>
    </div>
  );
}
