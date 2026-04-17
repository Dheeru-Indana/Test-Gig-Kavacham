import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { ArrowLeft, Check, Shield, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { PLANS, getDynamicPremium } from '../../../constants/plans';
import { ZONES, TIER_FACTORS } from '../../lib/mock-data';
import { cn } from '../../components/ui/utils';
import { calculateRisk } from '../../services/riskEngine';
import { calculatePremium } from '../../services/pricingEngine';
import { getPremiumPrediction, checkMlStatus } from '../../../services/ml/mlApiService';
import { useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Sparkles } from 'lucide-react';

export default function PlanSelection() {
  const navigate = useNavigate();
  const { profile: userData, setProfile: setUserData, refreshPolicy } = useApp();
  const [selectedPlan, setSelectedPlan] = useState(userData?.selectedPlan || 'shield-plus');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [mlOnline, setMlOnline] = useState(false);
  const [mlPredictions, setMlPredictions] = useState<Record<string, any>>({});

  useEffect(() => {
    const checkStatus = async () => {
      const online = await checkMlStatus();
      setMlOnline(online);
    };
    checkStatus();
  }, []);

  const cityZones = useMemo(() => {
    return userData?.city ? ZONES[userData.city as keyof typeof ZONES] || [] : [];
  }, [userData?.city]);

  const zoneData: any = useMemo(() => {
    return cityZones.find((z: any) => z.id === userData?.zone);
  }, [cityZones, userData?.zone]);

  useEffect(() => {
    if (mlOnline && userData) {
      const fetchPredictions = async () => {
        const month = new Date().getMonth() + 1;
        const preds: Record<string, any> = {};
        
        for (const plan of PLANS) {
          const prediction = await getPremiumPrediction(userData, userData.city_tier || 'Tier 1', month, {
            flood: zoneData?.zoneFloodRiskScore || 0.3,
            aqi: zoneData?.zoneAqiRiskScore || 0.4,
          });
          if (prediction) {
            preds[plan.id] = prediction;
          }
        }
        setMlPredictions(preds);
      };
      fetchPredictions();
    }
  }, [mlOnline, userData, zoneData]);

  const handleContinue = () => {
    setShowConfirmModal(true);
  };

  const confirmActivation = async () => {
    if (!userData?.id || isActivating) return;
    setIsActivating(true);
    
    const plan = PLANS.find((p: any) => p.id === selectedPlan);
    if (!plan) {
      setIsActivating(false);
      return;
    }

    // V2 Pricing Logic
    const currentSeasonLabel = 'Standard'; 
    const finalPremium = getDynamicPremium(
      plan.id,
      userData.shield_score || 75,
      userData.city_tier || 'Tier 3',
      currentSeasonLabel
    );

    const tierData = TIER_FACTORS[parseInt(String(userData?.city_tier?.replace('Tier ', ''))) || 3] || TIER_FACTORS[3];
    const adjustedCoverage = Math.round(plan.coverageAmount * (tierData.factor || 1));
    const adjustedMaxPayout = plan.weeklyPayoutCap;

    try {
      // 1. Cancel existing active policies first
      await supabase
        .from('policies')
        .update({ status: 'CANCELLED' })
        .eq('user_id', userData.id)
        .eq('status', 'ACTIVE');

      // 2. Insert new active policy with robust fields
      const { error: insertErr } = await supabase.from('policies').insert({
        user_id: userData.id,
        plan_id: plan.id,
        plan_name: plan.name,
        weekly_premium: finalPremium,
        coverage_amount: adjustedCoverage,
        weekly_payout_cap: adjustedMaxPayout,
        status: 'ACTIVE',
        start_date: new Date().toISOString(),
        dynamic_premium: finalPremium,
        base_premium: plan.weeklyPremium,
        season_label: currentSeasonLabel,
        zone: userData.zone || 'General'
      });

      if (insertErr) {
        throw insertErr;
      }

      toast.success(`${plan.name} Activated Successfully!`);
      await refreshPolicy();
      setShowConfirmModal(false);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('[PlanSelection] Activation error:', err);
      toast.error(err.message || 'Failed to activate plan');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary w-3/4 transition-all duration-300"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto space-y-6"
        >
          {/* Title */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-semibold">Choose Your Plan</h2>
            <p className="text-muted-foreground">
              Select the coverage that works best for you
            </p>
          </div>

          {/* Plans */}
          <div className="space-y-4">
            {PLANS.map((plan: any) => {
              // Calculate Premium dynamically using AI Engines
              const cityZones = userData?.city ? ZONES[userData.city as keyof typeof ZONES] || [] : [];
              const zoneData: any = cityZones.find((z: any) => z.id === userData?.zone);
              
              const floodRisk = zoneData?.zoneFloodRiskScore || 0.5;
              const aqiRisk = zoneData?.zoneAqiRiskScore || 0.5;
              const actualAqi = aqiRisk * 500;

              const riskResult = calculateRisk({
                zoneId: userData?.zone || 'ZONE',
                rainfall: 10,
                aqi: actualAqi,
                heatIndex: 4,
                floodRiskScore: floodRisk,
                trafficDensity: 0.6,
                orderDropRate: 5
              });

              const pricingResult = calculatePremium({
                basePrice: plan.weeklyPremium,
                riskScore: riskResult.riskScore,
                floodRiskScore: floodRisk,
                aqiAvg: actualAqi,
                disruptionHistory: 'LOW'
              });

              const tierData = TIER_FACTORS[parseInt(String(userData?.city_tier)) || 3] || TIER_FACTORS[3];
              const tierFactor = tierData.factor;
              
              // Cap coverage/payout based on tier
              const adjustedCoverage = Math.round(plan.coverageAmount * tierFactor);
              const adjustedMaxPayout = Math.min(plan.weeklyPayoutCap, tierData.maxPayout);

              const mlPred = mlPredictions[plan.id];
              const finalPremium = (mlOnline && mlPred) ? mlPred.final_premium : pricingResult.premium;

              return (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  calculatedPremium={finalPremium}
                  adjustedCoverage={adjustedCoverage}
                  adjustedMaxPayout={adjustedMaxPayout}
                  breakdown={pricingResult.breakdown}
                  isSelected={selectedPlan === plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  mlExplanation={mlOnline && mlPred ? mlPred.explanation : undefined}
                />
              );
            })}
          </div>

          {/* AI Pricing Info */}
          <AIPanel title={mlOnline ? "AI Pricing Oracle — LIVE" : "AI Pricing Engine"}>
            {mlOnline && mlPredictions[selectedPlan] ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ML Inference Successful (v1.0.2)
                </div>
                <p className="text-sm leading-relaxed">
                  {mlPredictions[selectedPlan].explanation}
                </p>
                <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-primary mb-1">Stack Recommendation</p>
                  <p className="text-sm font-medium">Predicted Risk Band: <span className="text-primary capitalize">{mlPredictions[selectedPlan].risk_band}</span></p>
                </div>
              </div>
            ) : (
              PLANS.find((p: any) => p.id === selectedPlan) 
                ? `Dynamic premium applied. We actively monitor risk in your Tier ${userData?.city_tier || 3} zone. Based on hyper-local data (Flood Risk, AQI, Traffic), our engine has automatically optimized your final premium to guarantee fair coverage.`
                : `We actively monitor risk in Tier ${userData?.city_tier || 3} zones and dynamically adjust pricing.`
            )}
          </AIPanel>
        </motion.div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-card border-t border-border z-40">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleContinue}
            size="lg"
            className="w-full h-14"
          >
            Activate Protection
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              onClick={() => !isActivating && setShowConfirmModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-card border border-border shadow-2xl rounded-[2rem] p-6 z-[100] flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                {!isActivating && (
                  <button 
                    onClick={() => setShowConfirmModal(false)} 
                    className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors border border-border"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Confirm Activation</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to activate the <strong className="text-foreground">{PLANS.find((p: any) => p.id === selectedPlan)?.name}</strong> shield? The premium will be auto-deducted from your weekly payouts.
              </p>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl h-12 border-border" 
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isActivating}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 rounded-xl h-12 flex items-center justify-center gap-2" 
                  onClick={confirmActivation}
                  disabled={isActivating}
                >
                  {isActivating ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    'Confirm'
                  )}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlanCard({
  plan,
  calculatedPremium,
  adjustedCoverage,
  adjustedMaxPayout,
  breakdown,
  isSelected,
  onClick,
}: {
  plan: typeof PLANS[0];
  calculatedPremium: number;
  adjustedCoverage: number;
  adjustedMaxPayout: number;
  breakdown: { basePrice: number; factors: { rule: string; amount: number; type: 'increase' | 'discount' }[] };
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'p-6 cursor-pointer transition-all relative',
        isSelected
          ? 'border-primary border-2 bg-primary/5'
          : 'border-border hover:border-primary/50'
      )}
    >
      {plan.recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-semibold">
            Recommended
          </div>
        </div>
      )}

      {isSelected && (
        <div className="absolute top-4 right-4">
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Plan Header */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{plan.name}</h3>
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">₹{calculatedPremium}</span>
          <span className="text-muted-foreground">/week</span>
          {calculatedPremium !== plan.weeklyPremium && (
            <span className="text-xs line-through text-muted-foreground ml-2">₹{plan.weeklyPremium}</span>
          )}
        </div>

        {/* Factors Breakdown (Visible when selected) */}
        {isSelected && (
          <div className="bg-background rounded-lg p-3 text-xs space-y-1.5 mb-2 border border-border">
            <p className="font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Premium Transparency</p>
            <div className="flex justify-between pb-1">
              <span>Base Coverage</span><span>₹{breakdown.basePrice}</span>
            </div>
            {breakdown.factors.map((factor, i) => (
               <div key={i} className={cn("flex justify-between font-medium", factor.type === 'increase' ? "text-destructive" : "text-accent")}>
                 <span>due to {factor.rule.toLowerCase()}</span>
                 <span>{factor.type === 'increase' ? '+' : '-'}₹{factor.amount}</span>
               </div>
            ))}
            <div className="flex justify-between border-t border-border mt-2 pt-2 font-bold text-foreground">
              <span>Final Weekly Premium</span><span>₹{calculatedPremium}</span>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="space-y-2">
          <FeatureItem text={`Weekly coverage: ₹${adjustedCoverage.toLocaleString('en-IN')}`} />
          <FeatureItem text={`Max payout per event: ₹${adjustedMaxPayout.toLocaleString('en-IN')}`} />
          <FeatureItem text={`Triggers: ${plan.triggers.join(', ')}`} />
        </div>
      </div>
    </Card>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Check className="w-4 h-4 text-accent flex-shrink-0" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

function AIPanel({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-primary/80">{title}</h3>
      </div>
      <div className="text-slate-300">
        {children}
      </div>
    </div>
  );
}

