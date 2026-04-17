import { Card } from '../../components/ui/card';
import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { AlertTriangle, MapPin, X, Check, Navigation, ShieldAlert, Cpu, ChevronDown, ChevronUp } from 'lucide-react';
import { FRAUD_REVIEWS } from '../../lib/mock-data';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../components/ui/utils';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';
import { computeFraudScore, type FraudResult } from '../../../services/fraud/fraudEngine';
import { generateFraudSignals } from '../../../services/fraud/fraudSignalGenerator';

// Generate real fraud results for each mock review
function buildReviewWithFraud(review: typeof FRAUD_REVIEWS[0]) {
  // Map existing mock data to fraud signal profiles
  const isHighRisk = review.fraudProbability > 0.7;
  const isMedRisk = review.fraudProbability > 0.5;
  const claimType = isHighRisk ? 'fraudulent' as const : isMedRisk ? 'suspicious' as const : 'clean' as const;
  const signals = generateFraudSignals(claimType, review.zone, new Date().getMonth() + 1);
  const result = computeFraudScore(signals);
  return { ...review, fraudResult: result, signals };
}

export default function AdminFraudReview() {
  const [reviews, setReviews] = useState(() =>
    FRAUD_REVIEWS.map(r => buildReviewWithFraud(r))
  );

  const handleApprove = (id: string) => {
    toast.success('Investigation closed. Override — Marked Clean.');
    setReviews(reviews.filter(r => r.id !== id));
  };

  const handleReject = (id: string) => {
    toast.error('Investigation closed. Claim confirmed rejected.');
    setReviews(reviews.filter(r => r.id !== id));
  };

  // Fraud Analytics Summary
  const analytics = useMemo(() => {
    const total = reviews.length;
    const pass = reviews.filter(r => r.fraudResult.decision === 'pass').length;
    const review = reviews.filter(r => r.fraudResult.decision === 'review').length;
    const fail = reviews.filter(r => r.fraudResult.decision === 'fail').length;
    const avgScore = total > 0 ? Math.round(reviews.reduce((s, r) => s + r.fraudResult.fraudScore, 0) / total) : 0;
    const gpsFlags = reviews.filter(r => r.fraudResult.detailedBreakdown.gpsRiskScore > 10).length;
    const weatherFlags = reviews.filter(r => r.fraudResult.detailedBreakdown.weatherRiskScore > 10).length;
    const behavioralFlags = reviews.filter(r => r.fraudResult.detailedBreakdown.behavioralRiskScore > 10).length;
    return { total, pass, review, fail, avgScore, gpsFlags, weatherFlags, behavioralFlags };
  }, [reviews]);

  return (
    <AdminLayout>
      <div className="p-8 space-y-8 relative">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-warning/5 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-destructive/5 rounded-full blur-[120px] pointer-events-none -z-10" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-card rounded-2xl border border-border flex items-center justify-center shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)] backdrop-blur-sm">
              <ShieldAlert className="w-7 h-7 text-warning" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">Fraud Intelligence Team</h1>
              <div className="flex items-center gap-2 text-muted-foreground mt-1 text-sm font-medium">
                <Cpu className="w-4 h-4 text-primary" />
                <span>Kavach-AI flagged anomalies with explainable fraud breakdown</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fraud Analytics Summary */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 bg-card/80 backdrop-blur-xl border-border">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-foreground tracking-tight">Fraud Analytics Summary</h3>
              <span className="text-[9px] text-muted-foreground ml-auto font-mono">This Week</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <AnalyticsCell label="Total Claims" value={analytics.total.toString()} />
              <AnalyticsCell label="Auto-Approved" value={analytics.pass.toString()} color="text-accent" />
              <AnalyticsCell label="Under Review" value={analytics.review.toString()} color="text-warning" />
              <AnalyticsCell label="Rejected" value={analytics.fail.toString()} color="text-destructive" />
              <AnalyticsCell label="Avg Score" value={`${analytics.avgScore}/100`} />
              <AnalyticsCell label="GPS Flags" value={analytics.gpsFlags.toString()} color="text-destructive" />
              <AnalyticsCell label="Weather Flags" value={analytics.weatherFlags.toString()} color="text-warning" />
              <AnalyticsCell label="Behavioral" value={analytics.behavioralFlags.toString()} color="text-primary" />
            </div>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-card/80 backdrop-blur-xl border-border shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Queue Depth</p>
                <p className="text-4xl font-bold">{reviews.length}</p>
              </div>
              <div className="w-14 h-14 bg-warning/10 border border-warning/20 rounded-2xl flex items-center justify-center shadow-inner">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card/80 backdrop-blur-xl border-border shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Critical Risk (Score &gt;60)</p>
                <p className="text-4xl font-bold text-destructive">
                  {reviews.filter(r => r.fraudResult.fraudScore >= 60).length}
                </p>
              </div>
              <div className="w-14 h-14 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center justify-center shadow-inner">
                <ShieldAlert className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card/80 backdrop-blur-xl border-border shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Exposure Value</p>
                <p className="text-4xl font-bold text-foreground">
                  ₹{reviews.reduce((sum, r) => sum + r.claimAmount, 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center shadow-inner">
                <AlertTriangle className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Review Cards */}
        <div className="space-y-6">
          <AnimatePresence>
            {reviews.map(review => (
              <motion.div
                key={review.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3 }}
              >
                <FraudReviewCard review={review} onApprove={handleApprove} onReject={handleReject} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {reviews.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="p-16 bg-card/80 backdrop-blur-md border border-border shadow-md flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_-10px_rgba(34,197,94,0.4)]">
                <Check className="w-10 h-10 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2 tracking-tight">Zero Anomalies Detected</h3>
              <p className="text-muted-foreground font-medium">The AI risk engine has cleared all pending resolutions.</p>
            </Card>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
}

// ─── Analytics Cell ─────────────────────────────────────────

function AnalyticsCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-muted/40 rounded-xl p-3 border border-border text-center">
      <p className="font-mono text-lg font-black tracking-tight" style={{}}><span className={color || 'text-foreground'}>{value}</span></p>
      <p className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold mt-1">{label}</p>
    </div>
  );
}

// ─── Fraud Review Card ──────────────────────────────────────

function FraudReviewCard({
  review,
  onApprove,
  onReject,
}: {
  review: ReturnType<typeof buildReviewWithFraud>
  onApprove: (id: string) => void
  onReject: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false);
  const { fraudResult } = review;
  const riskLevel = fraudResult.riskBand;

  return (
    <Card className="overflow-hidden bg-card/80 backdrop-blur-xl border border-border rounded-[1.5rem] shadow-xl">
      {/* Header */}
      <div className={cn(
        'p-6 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden',
        riskLevel === 'high' ? 'bg-destructive/10 border-destructive/20' :
        riskLevel === 'medium' ? 'bg-warning/10 border-warning/20' : 'bg-card border-border'
      )}>
        {riskLevel === 'high' && <div className="absolute inset-0 bg-destructive/10 blink-slow pointer-events-none" />}
        <div className="flex items-center gap-4 relative z-10">
          <div className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner',
            riskLevel === 'high' ? 'bg-destructive/10 border-destructive/30 text-destructive' :
            riskLevel === 'medium' ? 'bg-warning/10 border-warning/30 text-warning' :
            'bg-muted/50 border-border text-muted-foreground'
          )}>
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h3 className="font-bold text-[19px] tracking-tight text-foreground">{review.workerName}</h3>
              {/* Decision Badge */}
              <Badge variant="outline" className={cn(
                "uppercase text-[10px] tracking-wider font-bold px-2 py-0.5",
                fraudResult.decision === 'fail' ? 'border-destructive/40 text-destructive bg-destructive/10' :
                fraudResult.decision === 'review' ? 'border-warning/40 text-warning bg-warning/10' :
                'border-accent/40 text-accent bg-accent/10'
              )}>
                {fraudResult.decision}
              </Badge>
              {/* Fraud Score Badge */}
              <span className={cn(
                "font-mono text-sm font-black px-2 py-0.5 rounded border",
                fraudResult.fraudScore >= 60 ? 'bg-destructive/10 border-destructive/30 text-destructive' :
                fraudResult.fraudScore >= 30 ? 'bg-warning/10 border-warning/30 text-warning' :
                'bg-accent/10 border-accent/30 text-accent'
              )}>
                {fraudResult.fraudScore}/100
              </span>
              {/* Confidence */}
              <span className="text-[10px] text-muted-foreground font-mono">
                Conf: {(fraudResult.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-sm font-medium text-muted-foreground font-mono">ID: {review.workerId} <span className="mx-2 text-muted-foreground/50">|</span> <span className="font-sans">{review.zone}</span></p>
          </div>
        </div>

        <div className="text-right bg-muted/40 px-5 py-3 rounded-2xl border border-border relative z-10">
          <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-1">Exposure</p>
          <p className="text-2xl font-bold tracking-tight text-foreground font-mono">₹{review.claimAmount.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Expandable Detail Panel */}
      <div className="p-6 relative">
        {/* Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors mb-4"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {expanded ? 'Hide' : 'Show'} Detailed AI Breakdown
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Score Breakdown */}
                <div className="p-5 rounded-2xl bg-muted/40 border border-border">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                    <Cpu className="w-4 h-4" /> Score Breakdown
                  </h4>
                  <div className="space-y-3">
                    <ScoreBar label="GPS Risk Score" score={fraudResult.detailedBreakdown.gpsRiskScore} max={40} />
                    <ScoreBar label="Weather Risk Score" score={fraudResult.detailedBreakdown.weatherRiskScore} max={35} />
                    <ScoreBar label="Behavioral Risk Score" score={fraudResult.detailedBreakdown.behavioralRiskScore} max={25} />
                    <div className="border-t border-border pt-3 mt-3 flex justify-between font-bold">
                      <span className="text-sm text-foreground">Total Fraud Score</span>
                      <span className={cn("font-mono text-lg",
                        fraudResult.fraudScore >= 60 ? 'text-destructive' :
                        fraudResult.fraudScore >= 30 ? 'text-warning' : 'text-accent'
                      )}>
                        {fraudResult.fraudScore}/100
                      </span>
                    </div>
                  </div>
                </div>

                {/* Top Signals + Explanation */}
                <div className="p-5 rounded-2xl bg-muted/40 border border-border">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Top Signals
                  </h4>
                  <div className="space-y-2 mb-4">
                    {fraudResult.topSignals.map((signal, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-destructive font-mono font-bold text-xs mt-0.5">[{i + 1}]</span>
                        <span className="text-foreground/90">{signal}</span>
                      </div>
                    ))}
                    {fraudResult.topSignals.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">No significant signals detected.</p>
                    )}
                  </div>
                  <div className="border-t border-border pt-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">AI Explanation</p>
                    <p className="text-sm text-foreground/90 leading-relaxed">{fraudResult.explanation}</p>
                  </div>
                </div>
              </div>

              {/* Telemetry */}
              <div className="p-5 rounded-2xl bg-muted/40 border border-border">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Telemetry Analysis
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative pl-6 border-l-2 border-primary/30 pb-4">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                    </div>
                    <span className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">Historical Baseline</span>
                    <p className="text-[15px] font-mono text-foreground/90 tracking-tight mt-1">
                      {review.lastKnownLocation.lat.toFixed(4)}, {review.lastKnownLocation.lng.toFixed(4)}
                    </p>
                  </div>
                  <div className="relative pl-6 border-l-2 border-destructive/30">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-destructive/20 border-2 border-destructive flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
                    </div>
                    <span className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">Claim Initiation</span>
                    <p className="text-[15px] font-mono text-foreground/90 tracking-tight mt-1">
                      {review.claimLocation.lat.toFixed(4)}, {review.claimLocation.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="p-5 border-t border-border bg-muted/40">
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
          <Button
            variant="outline"
            className="w-full sm:w-auto gap-2 h-11 px-6 rounded-xl border-border bg-transparent hover:bg-muted"
            onClick={() => onReject(review.id)}
          >
            <X className="w-4 h-4 text-destructive" />
            <span className="font-semibold text-destructive">Confirm Reject</span>
          </Button>
          <Button
            variant="secondary"
            className="w-full sm:w-auto gap-2 bg-accent/10 border border-accent/20 hover:bg-accent/20 text-accent h-11 px-6 rounded-xl"
            onClick={() => onApprove(review.id)}
          >
            <Check className="w-4 h-4" />
            <span className="font-semibold">Override — Mark Clean</span>
          </Button>
        </div>
      </div>

      <style>{`
        .blink-slow {
          animation: blink-slow 3s ease-in-out infinite;
        }
        @keyframes blink-slow {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
      `}</style>
    </Card>
  );
}

// ─── Score Bar ──────────────────────────────────────────────

function ScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
  const pct = (score / max) * 100;
  const color = pct > 70 ? 'bg-destructive' : pct > 40 ? 'bg-warning' : 'bg-accent';
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="font-mono text-xs font-bold text-foreground">{score}/{max}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden border border-border">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
    </div>
  );
}
