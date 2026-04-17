import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ArrowLeft, Smartphone, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { PLANS } from '../../lib/mock-data';
import { cn } from '../../components/ui/utils';

export default function Payment() {
  const navigate = useNavigate();
  const { profile: userData } = useApp();
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'idle' | 'processing' | 'success'>('idle');

  const selectedPlan = PLANS.find((p) => p.id === userData?.selectedPlan);
  const weeklyPremium = selectedPlan?.weeklyPremium || 49;

  const handlePayment = () => {
    setIsProcessing(true);
    setPaymentStep('processing');
    
    // Simulate complex payment processing
    setTimeout(() => {
      setPaymentStep('success');
      setTimeout(() => {
        navigate('/onboarding/success');
      }, 1500);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col justify-center overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="absolute top-0 left-0 w-full p-6 flex items-center justify-between z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full hover:bg-white/5"
          disabled={isProcessing}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6 z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-card/60 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl space-y-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />

            {/* Title */}
            <div className="text-center space-y-2 relative">
              <h2 className="text-3xl font-bold tracking-tight">Complete Payment</h2>
              <p className="text-muted-foreground text-sm flex items-center justify-center gap-1">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Secured by 256-bit encryption
              </p>
            </div>

            {/* Premium Payment Card */}
            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-primary/80 to-primary text-primary-foreground shadow-xl overflow-hidden group">
              {/* Card visual effects */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl group-hover:bg-white/20 transition-all duration-700" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/20 rounded-full translate-y-1/3 -translate-x-1/3 blur-xl" />
              
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-start opacity-90">
                  <span className="text-sm font-medium tracking-wider uppercase">GigKavacham {selectedPlan?.name || 'Pro'}</span>
                  <Smartphone className="w-6 h-6" />
                </div>
                
                <div>
                  <div className="text-4xl font-bold tracking-tight mb-1">
                    ₹{weeklyPremium}
                  </div>
                  <div className="text-xs opacity-75 font-mono">
                    per week
                  </div>
                </div>

                <div className="flex justify-between items-end pt-4 border-t border-white/20">
                  <div className="text-xs opacity-90 font-mono tracking-widest">
                    Coverage: ₹{(selectedPlan?.coverageAmount || 10000).toLocaleString('en-IN')}
                  </div>
                  <div className="flex gap-1">
                    <div className="w-6 h-4 bg-white/20 rounded" />
                    <div className="w-6 h-4 bg-white/20 rounded" />
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {paymentStep === 'idle' ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 relative"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/90 ml-1">Enter UPI ID</label>
                    <div className="relative group">
                      <Input
                        type="text"
                        placeholder="yourname@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="h-14 bg-muted/30 border-white/10 pl-4 pr-12 text-lg focus:bg-muted/50 focus:ring-primary/30 transition-all rounded-xl shadow-inner"
                        disabled={isProcessing}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                        @upi
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <QuickUPIButton label="GPay" icon="G" onClick={() => setUpiId('user@okicici')} />
                    <QuickUPIButton label="PhonePe" icon="P" onClick={() => setUpiId('user@ybl')} />
                    <QuickUPIButton label="Paytm" icon="₹" onClick={() => setUpiId('user@paytm')} />
                  </div>

                  <Button
                    onClick={handlePayment}
                    size="lg"
                    className={cn(
                      "w-full h-14 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 transition-all",
                      upiId ? "opacity-100" : "opacity-50"
                    )}
                    disabled={!upiId || isProcessing}
                  >
                    Pay ₹{weeklyPremium} Securely
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-8 flex flex-col items-center justify-center space-y-4 relative"
                >
                  {paymentStep === 'processing' ? (
                    <>
                      <div className="relative w-20 h-20">
                        <div className="absolute inset-0 border-4 border-muted rounded-full" />
                        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Smartphone className="w-8 h-8 text-primary animate-pulse" />
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold">Processing Payment...</h3>
                      <p className="text-sm text-muted-foreground text-center">Open your UPI app to approve the mandate</p>
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                        className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center"
                      >
                        <CheckCircle2 className="w-10 h-10 text-accent" />
                      </motion.div>
                      <h3 className="text-xl font-semibold text-accent">Payment Successful</h3>
                      <p className="text-sm text-muted-foreground text-center">Redirecting to auto-mandate setup...</p>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function QuickUPIButton({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl border border-white/5 bg-muted/20 hover:bg-muted/40 hover:border-primary/30 transition-all group"
    >
      <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-sm font-bold border border-white/5 group-hover:text-primary transition-colors shadow-sm">
        {icon}
      </div>
      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
    </button>
  );
}

