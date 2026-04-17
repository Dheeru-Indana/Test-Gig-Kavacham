import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { ArrowLeft, TrendingDown, TrendingUp, CloudLightning, Activity, Umbrella } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';

export default function IncomeSandbox() {
  const navigate = useNavigate();
  const { profile: userData, setProfile: setUserData, refreshPolicy } = useApp();

  // Mock calculations
  const weeklyEarnings = userData?.weeklyEarnings || 5000;
  // Make it highly realistic: 3 wet days / highly disrupted
  const estimatedLosses = Math.round(weeklyEarnings * 0.22); 
  const potentialProtection = Math.round(weeklyEarnings * 0.20); 

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col pt-4 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[100%] bg-gradient-radial from-primary/10 to-transparent blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between z-10 relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full hover:bg-white/5 bg-black/20 backdrop-blur-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="px-4 py-1.5 rounded-full bg-card/60 border border-white/10 backdrop-blur-md text-xs font-semibold tracking-widest uppercase text-muted-foreground mr-2">
          Impact Report
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-28 overflow-x-hidden z-10">
        <motion.div
          variants={containerVariants as any}
          initial="hidden"
          animate="show"
          className="max-w-md mx-auto space-y-6"
        >
          {/* Title */}
          <motion.div variants={itemVariants as any} className="pt-2 pb-4">
            <h2 className="text-3xl font-bold tracking-tight mb-2">The Hidden Cost <br/>of Bad Days</h2>
            <p className="text-muted-foreground text-lg">
              Here's how disruptions impact <span className="text-foreground font-medium">{userData?.zone?.replace('-', ' ') || "your zone"}</span>.
            </p>
          </motion.div>

          {/* Cards Flex */}
          <div className="space-y-4">
            {/* Estimated Losses */}
            <motion.div variants={itemVariants as any} className="relative group">
              <div className="absolute inset-0 bg-destructive/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-6 rounded-[2rem] bg-card border border-destructive/20 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
                <div className="flex items-start gap-5 relative z-10">
                  <div className="w-14 h-14 bg-destructive/10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner">
                    <TrendingDown className="w-7 h-7 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Estimated Losses</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Avg. lost income in the last 30 days due to triggers.
                    </p>
                    <div className="text-4xl font-bold text-destructive tracking-tight">
                      ₹{estimatedLosses.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Potential Benefits */}
            <motion.div variants={itemVariants as any} className="relative group mt-6">
              <div className="absolute inset-0 bg-primary/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-6 rounded-[2rem] bg-card border border-primary/20 overflow-hidden">
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl translate-y-1/2 translate-x-1/4" />
                <div className="flex items-start gap-5 relative z-10">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner shadow-primary/20 bg-gradient-to-br from-primary/20 to-transparent">
                    <TrendingUp className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">GigKavacham Payout</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      What you could have automatically recovered.
                    </p>
                    <div className="text-4xl font-bold text-primary tracking-tight drop-shadow-sm">
                      ₹{potentialProtection.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Common Triggers Grid */}
          <motion.div variants={itemVariants as any} className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Top Disruption Events</h3>
              <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">LAST 30 DAYS</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-card border border-white/5 flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CloudLightning className="w-8 h-8 text-blue-400 mb-1" />
                <div>
                  <div className="text-sm font-medium">Extreme Rain</div>
                  <div className="text-xs text-muted-foreground mt-0.5">3 Payout Days</div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-white/5 flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Activity className="w-8 h-8 text-orange-400 mb-1" />
                <div>
                  <div className="text-sm font-medium">Severe AQI</div>
                  <div className="text-xs text-muted-foreground mt-0.5">2 Payout Days</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants as any} className="pt-4">
             <div className="p-4 rounded-xl bg-card border border-white/10 flex gap-4 items-center">
                <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-full">
                  <Umbrella className="w-5 h-5" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  Don't lose a day's wage just because the city stops. GigKavacham pays you <strong>automatically</strong> when triggers are hit.
                </p>
             </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent z-20">
        <div className="max-w-md mx-auto">
          <Button
            onClick={() => navigate('/onboarding/plans')}
            size="lg"
            className="w-full h-14 rounded-xl text-lg font-semibold shadow-lg shadow-primary/20 group"
          >
            Review Protection Plans
          </Button>
        </div>
      </div>
    </div>
  );
}

