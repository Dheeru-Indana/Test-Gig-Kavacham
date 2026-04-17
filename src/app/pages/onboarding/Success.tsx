import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Shield, Zap, Clock, ShieldCheck, Download, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { PLANS } from '../../../constants/plans';

export default function Success() {
  const navigate = useNavigate();
  const { profile: userData } = useApp();
  const selectedPlan = PLANS.find((p) => p.id === userData?.selectedPlan);

  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#5b5fff', '#10B981', '#FFFFFF']
    });
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-radial from-accent/20 to-transparent blur-[120px] pointer-events-none" />

      <motion.div
        variants={containerVariants as any}
        initial="hidden"
        animate="show"
        className="max-w-md w-full space-y-8 z-10"
      >
        {/* Success Icon */}
        <motion.div variants={itemVariants as any} className="flex justify-center relative">
          <div className="absolute inset-0 bg-accent/30 rounded-full blur-2xl top-4 scale-75" />
          <div className="w-24 h-24 bg-gradient-to-br from-accent to-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-accent/20 z-10 border border-white/20">
            <ShieldCheck className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div variants={itemVariants as any} className="text-center space-y-2">
          <h2 className="text-4xl font-bold tracking-tight">You're Protected!</h2>
          <p className="text-muted-foreground text-lg">
            Your <span className="text-foreground tracking-wide font-medium">GigKavacham {selectedPlan?.name}</span> plan is fully active.
          </p>
        </motion.div>

        {/* Digital Wallet Card */}
        <motion.div variants={itemVariants as any} className="relative group perspective-1000">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-accent/40 rounded-3xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative p-7 rounded-3xl bg-card border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl">
            {/* Card Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1">Policy Holder</p>
                  <p className="font-bold text-xl truncate max-w-[200px]">{userData?.name}</p>
                </div>
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-md text-primary shadow-inner">
                  <Shield className="w-6 h-6" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-2xl border border-white/5">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Max Payout</p>
                  <p className="font-bold text-lg text-primary">
                    ₹{selectedPlan?.weeklyPayoutCap.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Cover</p>
                  <p className="font-bold text-lg">
                    ₹{selectedPlan?.coverageAmount.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Active Until</p>
                  <p className="text-sm font-medium">April 25, 2026</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-accent/20 text-accent text-xs font-bold rounded-full border border-accent/20">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                  ACTIVE
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Benefits List */}
        <motion.div variants={itemVariants as any} className="space-y-4 pt-4 px-2">
          <BenefitItem
            icon={<Zap className="w-5 h-5" />}
            title="Zero-Touch Payouts"
            description="Money credited within minutes of trigger."
          />
          <BenefitItem
            icon={<Clock className="w-5 h-5" />}
            title="Always Monitoring"
            description="Our AI tracks rain & AQI in your zone."
          />
        </motion.div>

        {/* CTA */}
        <motion.div variants={itemVariants as any} className="space-y-4 pt-4">
          <Button
            onClick={() => navigate('/dashboard')}
            size="lg"
            className="w-full h-14 rounded-xl text-lg font-semibold shadow-lg shadow-primary/20 group"
          >
            Enter Dashboard 
            <ExternalLink className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
          </Button>

          <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground">
            <Download className="w-4 h-4 mr-2" /> Download Policy Document
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

function BenefitItem({ icon, title, description }: { icon: React.ReactNode; title: string, description: string }) {
  return (
    <div className="flex items-start gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors">
      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0 text-primary border border-primary/10">
        {icon}
      </div>
      <div className="pt-1">
        <h4 className="font-semibold text-sm mb-0.5">{title}</h4>
        <p className="text-sm text-muted-foreground leading-snug">{description}</p>
      </div>
    </div>
  );
}

