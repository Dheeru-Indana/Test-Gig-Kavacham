import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, useInView, AnimatePresence } from 'motion/react';
import { Sparkles, CheckCircle2, CloudRain, Clock, ShieldOff, Bike, ShoppingBag, HardHat, Home, Building2, Car } from 'lucide-react';
import { cn } from '../../components/ui/utils';
import { useDcs } from '../../../hooks/useDcs';
import { useApp } from '../../context/AppContext';
import { PLANS } from '../../../constants/plans';

export default function Welcome() {
  const [stage, setStage] = useState<"typing" | "settling" | "revealed">(() => {
    return (window as any).__gig_intro_played ? "revealed" : "typing";
  });

  const handleTypingComplete = useCallback(() => {
    (window as any).__gig_intro_played = true;
    setStage("settling");
    setTimeout(() => setStage("revealed"), 500);
  }, []);

  const isRevealed = stage === "revealed";

  useEffect(() => {
    if (!isRevealed) {
      document.body.setAttribute("data-hero-typing", "true");
    } else {
      document.body.removeAttribute("data-hero-typing");
    }
    return () => { document.body.removeAttribute("data-hero-typing"); };
  }, [isRevealed]);

  return (
    <div className="font-body selection:bg-primary-container selection:text-white min-h-screen bg-background text-on-surface">
      
      <AnimatePresence>
        {isRevealed && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Navbar />
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative w-full z-10 overflow-hidden">
        <HeroSection stage={stage} onTypingComplete={handleTypingComplete} />
        
        <AnimatePresence>
          {isRevealed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut", staggerChildren: 0.2 }}
              style={{ pointerEvents: isRevealed ? "auto" : "none" }}
            >
              <TheProblem />
              <WhoWeProtect />
              <ZeroTouchPipeline />
              <HowItProtects />
              <DemoSimulator />
              <RealStatsBar />
              <ProtectionPlans />
              <Footer />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Navbar() {
  const navigate = useNavigate();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="fixed top-0 w-full flex justify-between items-center px-8 h-20 z-50 bg-background/80 backdrop-blur-3xl border-b border-outline-variant/10 shadow-[0_10_40px_rgba(91,95,255,0.05)]">
      <div className="text-2xl font-bold tracking-tighter text-primary-fixed font-headline cursor-pointer" onClick={() => navigate('/')}>
        GigKavacham
      </div>
      <div className="hidden md:flex space-x-10 items-center">
        <button onClick={() => scrollTo('architecture')} className="font-headline font-medium tracking-tight text-on-surface-variant hover:text-white transition-colors duration-300">Architecture</button>
        <button onClick={() => scrollTo('protection')} className="font-headline font-medium tracking-tight text-on-surface-variant hover:text-white transition-colors duration-300">Protection Layer</button>
        <button onClick={() => scrollTo('who-we-protect')} className="font-headline font-medium tracking-tight text-on-surface-variant hover:text-white transition-colors duration-300">Core Benefits</button>
        <button onClick={() => scrollTo('simulate')} className="font-headline font-medium tracking-tight text-on-surface-variant hover:text-white transition-colors duration-300">Network Telemetry</button>
      </div>
      <div className="flex items-center space-x-6">
        <button onClick={() => navigate('/login')} className="font-bold text-sm tracking-wide text-on-surface-variant hover:text-white transition-colors">
          Log in
        </button>
        <button onClick={() => navigate('/register')} className="kinetic-button px-6 py-2.5 rounded-full bg-gradient-to-r from-primary-container to-secondary-container text-white font-semibold text-sm shadow-[0_5px_20px_rgba(91,95,255,0.3)] hover:scale-105 transition-transform">
          Secure My Income
        </button>
      </div>
    </nav>
  );
}

function HeroSection({ stage, onTypingComplete }: { stage: string, onTypingComplete: () => void }) {
  const navigate = useNavigate();
  const [charIndex, setCharIndex] = useState(() => {
    return (window as any).__gig_intro_played ? 9999 : 0;
  });

  const targetText = "When disruption happens,\nincome shouldn't stop.";
  const isTypingComplete = charIndex >= targetText.length;
  const isRevealed = stage === "revealed" || isTypingComplete;

  useEffect(() => {
    if ((window as any).__gig_intro_played) {
      setCharIndex(targetText.length);
      // Ensure state update happens outside the render cycle
      setTimeout(() => onTypingComplete(), 0);
      return;
    }

    if (isTypingComplete) {
      setTimeout(() => onTypingComplete(), 0);
      return;
    }

    const typeChar = () => {
      setCharIndex((prev) => {
        const next = prev + 1;
        if (next >= targetText.length) {
          (window as any).__gig_intro_played = true;
          setTimeout(() => onTypingComplete(), 0);
        }
        return next;
      });
    };

    const delay = targetText.charAt(charIndex) === '\n' ? 300 : 50;
    const timer = setTimeout(typeChar, charIndex === 0 ? 300 : delay);
    return () => clearTimeout(timer);
  }, [charIndex, isTypingComplete, onTypingComplete]);

  const typed = targetText.slice(0, charIndex);
  const untyped = targetText.slice(charIndex);

  return (
    <section className="relative min-h-screen pt-32 pb-20 px-8 flex items-center justify-center text-center">
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center">
        
        <div className="h-12 mb-6 flex items-end justify-center w-full">
          <AnimatePresence>
            {isRevealed && (
              <motion.div
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.8, delay: 0.2 }}
                 className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/10 shadow-sm h-8"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Live Protection Shield Active</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1] whitespace-pre-wrap text-center flex flex-col items-center justify-center">
          <div className="relative">
            <span className="opacity-100">{typed}</span>
            {!isTypingComplete && (
               <span 
                 className="inline-block align-baseline font-mono ml-[2px] w-0 overflow-visible leading-[1em] -translate-y-[2px]" 
                 style={{ animation: "twBlink 1s step-start infinite" }}
               >
                 |
               </span>
            )}
            <span className="opacity-0">{untyped}</span>
            <style>{`@keyframes twBlink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }`}</style>
          </div>
        </h1>
        
        <div className="h-48 mt-10 w-full flex flex-col items-center">
          <AnimatePresence>
            {isRevealed && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="flex flex-col items-center w-full"
              >
                <p className="max-w-2xl mx-auto text-lg md:text-xl text-on-surface-variant leading-relaxed opacity-90 mb-8 w-full">
                  Autonomous financial security engineered for the modern gig economy. 
                  Instant liquidity triggers mapped to macroeconomic disruptions—before they impact your cash flow.
                </p>

                <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6 w-full">
                  <button onClick={() => navigate('/register')} className="kinetic-button px-10 py-4 rounded-full bg-gradient-to-r from-primary-container to-secondary-container text-white font-semibold text-lg shadow-[0_10px_40px_rgba(91,95,255,0.4)] hover:scale-105 transition-transform">
                    Secure My Flow
                  </button>
                  <button onClick={() => navigate('/admin/login')} className="kinetic-button px-10 py-4 rounded-full glass-card border border-outline-variant/20 text-white font-semibold text-lg hover:bg-surface-container transition-colors">
                    View Admin Portal
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
         {isRevealed && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ duration: 2 }}
             className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-container/15 rounded-full blur-[150px] pointer-events-none mix-blend-screen" 
           />
         )}
      </AnimatePresence>
    </section>
  );
}

function RevealWrapper({ children, className = "", id }: { children: React.ReactNode, className?: string, id?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.div
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function TheProblem() {
  return (
    <RevealWrapper className="py-32 px-8 max-w-7xl mx-auto relative z-10 border-t border-outline-variant/5">
      <div className="mb-16 text-center">
        <p className="text-xs font-label uppercase tracking-widest text-primary-fixed mb-4">The Problem We Solve</p>
        <h2 className="font-headline text-4xl md:text-5xl font-bold mb-4 text-white tracking-tight max-w-3xl mx-auto">
          12 million gig workers lose income every monsoon. None of them have insurance that pays fast enough.
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="glass-card p-8 rounded-3xl border border-outline-variant/10 shadow-xl flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-center mb-6 text-primary-fixed">
            <CloudRain className="w-6 h-6" />
          </div>
          <p className="font-mono text-4xl font-black text-white mix-blend-plus-lighter mb-2">₹3,200</p>
          <h3 className="font-bold text-white tracking-tight">Average monsoon income loss</h3>
          <p className="text-sm text-on-surface-variant mt-1">Per delivery partner per season</p>
        </div>
        
        <div className="glass-card p-8 rounded-3xl border border-outline-variant/10 shadow-xl flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-center mb-6 text-primary-fixed">
            <Clock className="w-6 h-6" />
          </div>
          <p className="font-mono text-4xl font-black text-white mix-blend-plus-lighter mb-2">14 days</p>
          <h3 className="font-bold text-white tracking-tight">Traditional claim wait time</h3>
          <p className="text-sm text-on-surface-variant mt-1">While bills pile up</p>
        </div>
        
        <div className="glass-card p-8 rounded-3xl border border-outline-variant/10 shadow-xl flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-center mb-6 text-primary-fixed">
            <ShieldOff className="w-6 h-6" />
          </div>
          <p className="font-mono text-4xl font-black text-white mix-blend-plus-lighter mb-2">0</p>
          <h3 className="font-bold text-white tracking-tight">Existing products that pay instantly</h3>
          <p className="text-sm text-on-surface-variant mt-1">Until GigKavacham</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-surface-container-low border-l-4 border-primary-fixed">
        <p className="text-lg italic text-slate-400 leading-relaxed mb-4">
          "I lose Rs 3,200 every monsoon season. I have no savings, no insurance, and no one to call. The rain does not care about my EMIs."
        </p>
        <p className="text-sm font-bold text-white">— Ravi, Swiggy delivery partner, Chennai</p>
      </div>
    </RevealWrapper>
  );
}

function WhoWeProtect() {
  const workers = [
    { title: "Delivery Partner", icon: Bike, desc: "Zomato, Swiggy, Blinkit riders facing monsoon and AQI disruptions" },
    { title: "Grocery Rider", icon: ShoppingBag, desc: "Quick commerce workers in Tier 2 and Tier 3 cities" },
    { title: "Factory Worker", icon: HardHat, desc: "Daily wage workers facing heat stress and social disruption events" },
    { title: "Domestic Worker", icon: Home, desc: "Household workers affected by waterlogging and curfews" },
    { title: "Construction Worker", icon: Building2, desc: "High-risk workers in zones with extreme heat and rainfall events" },
    { title: "Gig Driver", icon: Car, desc: "Cab and auto drivers facing demand collapse during disruptions" },
  ];

  return (
    <RevealWrapper id="who-we-protect" className="py-32 px-8 max-w-7xl mx-auto relative z-10 border-t border-outline-variant/5">
      <div className="mb-16 text-center">
        <p className="text-xs font-label uppercase tracking-widest text-primary-fixed mb-4">Who We Protect</p>
        <h2 className="font-headline text-4xl md:text-5xl font-bold mb-4 text-white tracking-tight">Built for every kind of gig worker</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workers.map((worker, i) => {
          const Icon = worker.icon;
          return (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="glass-card p-8 rounded-3xl border border-outline-variant/10 shadow-xl bg-surface-container-lowest"
            >
              <Icon className="w-8 h-8 text-primary-fixed mb-6" />
              <h3 className="font-bold text-white text-xl mb-3">{worker.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{worker.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </RevealWrapper>
  );
}

function ZeroTouchPipeline() {
  const steps = [
    { title: "Signal Monitoring", icon: "radar", desc: "GigKavacham tracks rainfall, AQI, heat stress, order volume, and social disruption in your zone every 30 minutes." },
    { title: "DCS Threshold Trigger", icon: "verified_user", desc: "When the Disruption Composite Score crosses 70 in your zone, your active policy is verified automatically. No action needed from you." },
    { title: "Fraud Verification", icon: "shield_person", desc: "Every claim is checked for GPS zone consistency, platform activity alignment, and claim pattern anomalies before payout is released." },
    { title: "UPI Payout", icon: "account_balance_wallet", desc: "Verified payouts are sent directly to your registered UPI ID within 5 minutes. No bank visit. No paperwork. No waiting." }
  ];

  return (
    <RevealWrapper id="architecture" className="py-32 px-8 max-w-7xl mx-auto relative z-10 border-t border-outline-variant/5">
      <div className="mb-16 text-center md:text-left">
        <h2 className="font-headline text-4xl md:text-5xl font-bold mb-4 text-white tracking-tight">The Zero-Touch Pipeline</h2>
        <p className="text-on-surface-variant max-w-2xl text-lg md:text-xl">No forms. No waiting. No manual review. When disruption hits your zone, GigKavacham pays you automatically — before you even know to ask.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {steps.map((step, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className="glass-card p-8 rounded-3xl border border-outline-variant/10 group hover:border-primary-container/40 transition-all duration-500 shadow-xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-center mb-8 text-primary-fixed group-hover:scale-110 transition-transform duration-500 shadow-inner">
              <span className="material-symbols-outlined text-[24px]">{step.icon}</span>
            </div>
            <h3 className="font-headline text-xl font-bold mb-3 text-white tracking-tight group-hover:text-primary-fixed transition-colors">{step.title}</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed font-medium">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </RevealWrapper>
  );
}

function HowItProtects() {
  const { profile: userData } = useApp();
  const { dcsOutput } = useDcs(userData?.city_tier || 'Tier 1');
  const dcs = dcsOutput?.currentDcs ?? 35;
  const dcsRatio = (dcs / 100).toFixed(2);
  const isRed = dcs >= 70;
  const isAmber = dcs >= 50 && dcs < 70;
  
  const statusColor = isRed ? "text-error" : isAmber ? "text-warning" : "text-emerald-400";
  const statusBg = isRed ? "border-error/50" : isAmber ? "border-warning/50" : "border-emerald-500/50";
  const glowBg = isRed ? "bg-error/10" : isAmber ? "bg-warning/10" : "bg-emerald-500/10";
  const nodeName = userData?.city ? userData.city.toUpperCase() : "ZONE MONITOR";

  return (
    <RevealWrapper className="py-32 px-8 bg-surface-container-lowest/50 relative z-10 border-y border-outline-variant/5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-primary-container/10 border border-primary-container/20 shadow-[0_0_20px_rgba(91,95,255,0.1)]">
            <Sparkles className="w-4 h-4 text-primary-fixed" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary-fixed">Intelligence Engine</span>
          </div>
          <h2 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter leading-[1.1] text-white">
            How GigKavacham <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-fixed to-secondary-fixed">Protects You</span>
          </h2>
          <p className="text-lg text-on-surface-variant leading-relaxed">
            GigKavacham monitors five real disruption signals in your registered delivery zone. When conditions become dangerous for gig workers, your payout triggers automatically — whether you are working or not.
          </p>
          <ul className="space-y-4 pt-4">
            <li className="flex items-start space-x-4">
               <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
               </div>
               <div>
                 <span className="text-white font-bold tracking-tight block">Zero-touch claims</span>
                 <span className="text-sm text-on-surface-variant mt-1 block">No form submission required. Your policy and zone do the work.</span>
               </div>
            </li>
            <li className="flex items-start space-x-4">
               <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
               </div>
               <div>
                 <span className="text-white font-bold tracking-tight block">Covers real disruptions</span>
                 <span className="text-sm text-on-surface-variant mt-1 block">Monsoon rainfall, AQI spikes, extreme heat, order demand drops, and social disruptions like curfews.</span>
               </div>
            </li>
          </ul>
        </div>
        
        <div className="relative">
          <div className="glass-panel p-10 rounded-[2rem] shadow-2xl relative overflow-hidden group hover:border-primary-container/30 transition-colors duration-700 h-[500px] flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-1">YOUR ZONE RISK</p>
                <h4 className={cn("font-headline text-2xl font-bold", statusColor)}>{dcsOutput?.riskLabel || "Green Status"}</h4>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono text-on-surface-variant uppercase bg-surface-container px-2 py-1 rounded inline-block">{nodeName}</p>
                <p className={cn("text-[10px] font-mono uppercase mt-2 font-bold tracking-widest", statusColor)}>DCS: {dcs}</p>
              </div>
            </div>
            
            <div className="relative h-64 flex items-center justify-center group-hover:scale-105 transition-transform duration-[2s]">
              <div className="absolute inset-0 border-[16px] border-surface-container rounded-full opacity-30"></div>
              <div className={cn("absolute inset-0 border-[16px] rounded-full blur-[10px]", statusBg)}></div>
              <div className={cn("absolute inset-0 border-[16px] rounded-full", isRed ? "border-error" : isAmber ? "border-warning" : "border-emerald-500")} style={{ clipPath: "polygon(0 0, 85% 0, 85% 100%, 0% 100%)" }}></div>
              <div className="text-center z-10 p-8 rounded-full bg-surface-container-lowest/50 backdrop-blur-md border border-outline-variant/10 shadow-2xl">
                <span className="font-mono text-6xl font-black text-white mix-blend-screen drop-shadow-lg">{dcsRatio}</span>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mt-2">DISRUPTION SCORE</p>
              </div>
            </div>
          </div>
          <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[100px] pointer-events-none mix-blend-plus-lighter", glowBg)}></div>
        </div>
      </div>
    </RevealWrapper>
  );
}

function DemoSimulator() {
  const [anomaly, setAnomaly] = useState(false);
  const [pipelineState, setPipelineState] = useState<"standby"|"trigger"|"payout">("standby");

  const handleSimulate = () => {
    if (anomaly) {
      setAnomaly(false);
      setPipelineState("standby");
      return;
    }
    
    setAnomaly(true);
    setPipelineState("trigger");
    
    setTimeout(() => {
      setPipelineState("payout");
    }, 2000);
    
    setTimeout(() => {
      setAnomaly(false);
      setPipelineState("standby");
    }, 7000);
  };

  return (
    <RevealWrapper id="simulate" className="py-24 px-8 max-w-7xl mx-auto relative z-10 flex flex-col items-center">
      <div className="text-center mb-12">
        <h2 className="font-headline text-3xl md:text-4xl font-bold mb-4 text-white">Simulate Protection</h2>
        <p className="text-on-surface-variant max-w-lg mx-auto">See the zero-touch pipeline in action. Click Inject Anomaly to simulate a rainfall disruption event and watch the automated claim process run.</p>
      </div>

      <div className="glass-panel w-full max-w-4xl p-8 rounded-[2rem] border border-outline-variant/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-8 items-center justify-between">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-container/5 to-transparent pointer-events-none" />
        
        <div className="flex-1 space-y-4 z-10 w-full">
           <div className="flex items-center justify-between p-4 bg-surface-container rounded-2xl border border-outline-variant/10">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-white">water_drop</span>
                 </div>
                 <div>
                   <p className="text-sm font-bold text-white">Rainfall Intensity</p>
                   <p className="text-[10px] text-on-surface-variant font-mono">{anomaly ? '48mm/h CRITICAL' : '2mm/h NORMAL'}</p>
                 </div>
              </div>
              <div className="w-24 h-2 bg-surface-container-high rounded-full overflow-hidden">
                <motion.div animate={{ width: anomaly ? '95%' : '15%', backgroundColor: anomaly ? '#EF4444' : '#10B981' }} transition={{ duration: 1 }} className="h-full rounded-full" />
              </div>
           </div>

           <div className="flex items-center justify-between p-4 bg-surface-container rounded-2xl border border-outline-variant/10">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-white">air</span>
                 </div>
                 <div>
                   <p className="text-sm font-bold text-white">Air Quality Index</p>
                   <p className="text-[10px] text-on-surface-variant font-mono">{anomaly ? '210 HAZARDOUS' : '85 MODERATE'}</p>
                 </div>
              </div>
              <div className="w-24 h-2 bg-surface-container-high rounded-full overflow-hidden">
                <motion.div animate={{ width: anomaly ? '85%' : '35%', backgroundColor: anomaly ? '#EF4444' : '#F59E0B' }} transition={{ duration: 1 }} className="h-full rounded-full" />
              </div>
           </div>

           <div className="flex items-center justify-between p-4 bg-surface-container rounded-2xl border border-outline-variant/10">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-white">trending_down</span>
                 </div>
                 <div>
                   <p className="text-sm font-bold text-white">Order Volume</p>
                   <p className="text-[10px] text-on-surface-variant font-mono">{anomaly ? '23 COLLAPSED' : '200 OK'}</p>
                 </div>
              </div>
              <div className="w-24 h-2 bg-surface-container-high rounded-full overflow-hidden flex justify-end">
                <motion.div animate={{ width: anomaly ? '15%' : '100%', backgroundColor: anomaly ? '#EF4444' : '#10B981' }} transition={{ duration: 1 }} className="h-full rounded-full" />
              </div>
           </div>
        </div>

        <div className="flex flex-col items-center justify-center z-10 py-6 md:px-8 border-y md:border-y-0 md:border-x border-outline-variant/10 w-full md:w-auto">
           <button 
             onClick={handleSimulate}
             className={cn("kinetic-button px-8 py-4 rounded-full font-bold shadow-lg transition-colors border whitespace-nowrap", anomaly ? "bg-background border-error text-error hover:bg-error/10" : "bg-primary-container text-white border-primary-fixed hover:bg-primary")}
           >
             {anomaly ? "Reset Simulator" : "Inject Anomaly"}
           </button>
        </div>

        <div className="flex-1 flex flex-col justify-center w-full z-10">
           <div className={cn("p-6 rounded-2xl border transition-colors duration-1000", pipelineState === 'payout' ? "bg-emerald-500/10 border-emerald-500/30" : pipelineState === 'trigger' ? "bg-error/10 border-error/30" : "bg-surface-container border-outline-variant/10")}>
             <h4 className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant mb-2">Resolution Core</h4>
             <div className="flex flex-col gap-1 mb-4 h-[60px] justify-center">
               <span className={cn("text-2xl font-black font-headline tracking-tighter transition-colors uppercase", 
                 pipelineState === 'payout' ? "text-emerald-400" : pipelineState === 'trigger' ? "text-error" : "text-emerald-400"
               )}>
                 {pipelineState === 'payout' ? "PAYOUT RELEASED" : pipelineState === 'trigger' ? "TRIGGER ACTIVE" : "STANDBY"}
               </span>
             </div>
             <p className="text-sm text-on-surface-variant min-h-[60px]">
               {pipelineState === 'payout' ? "₹1,200 credited to worker UPI. Settlement time: 4 minutes." : 
                pipelineState === 'trigger' ? "DCS crossed 70. Policy verified. Fraud check passed. UPI payout initiating now." : 
                "Awaiting anomaly trigger. Monitoring environment feeds asynchronously."}
             </p>
           </div>
        </div>
      </div>
    </RevealWrapper>
  );
}

function RealStatsBar() {
  return (
    <RevealWrapper className="py-20 px-8 border-t border-outline-variant/5 relative z-10 text-white bg-surface-container-lowest">
      <div className="mb-8 text-center text-slate-500 text-sm">Built for India's 12 million gig workers</div>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
        <div className="flex-1">
          <p className="font-mono text-3xl font-black text-white mix-blend-plus-lighter drop-shadow-sm">₹49</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1.5">Starting weekly premium</p>
          <p className="text-xs text-slate-500 mt-1">Less than a cup of tea per day</p>
        </div>
        <div className="flex-1">
          <p className="font-mono text-3xl font-black text-white mix-blend-plus-lighter drop-shadow-sm">&lt; 5 min</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1.5">Payout timeline</p>
          <p className="text-xs text-slate-500 mt-1">From trigger to UPI credit</p>
        </div>
        <div className="flex-1">
          <p className="font-mono text-3xl font-black text-white mix-blend-plus-lighter drop-shadow-sm">₹2,00,000</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1.5">Maximum coverage</p>
          <p className="text-xs text-slate-500 mt-1">Shield Max plan</p>
        </div>
        <div className="flex-1">
          <p className="font-mono text-3xl font-black text-white mix-blend-plus-lighter drop-shadow-sm">5 signals</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1.5">Disruption monitoring</p>
          <p className="text-xs text-slate-500 mt-1">Rainfall, AQI, Heat, Orders, Social</p>
        </div>
      </div>
    </RevealWrapper>
  );
}

function ProtectionPlans() {
  const navigate = useNavigate();

  return (
    <RevealWrapper id="protection" className="py-32 px-8 max-w-7xl mx-auto relative z-10 border-t border-outline-variant/5">
      <div className="mb-16 text-center">
        <p className="text-xs font-label uppercase tracking-widest text-primary-fixed mb-4">Protection Plans</p>
        <h2 className="font-headline text-4xl md:text-5xl font-bold mb-4 text-white tracking-tight">Weekly protection starting at ₹49</h2>
        <p className="text-on-surface-variant max-w-2xl mx-auto text-lg">Pay per week. Cancel anytime. Payout triggers automatically when your zone is disrupted.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Shield Lite */}
        <div className="glass-card p-8 rounded-[2rem] border border-outline-variant/10 flex flex-col relative">
          <h3 className="font-bold text-white text-2xl mb-1 mt-4">{PLANS[0].name}</h3>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-4xl font-black text-primary-fixed font-mono tracking-tighter">₹{PLANS[0].weeklyPremium}</span>
            <span className="text-on-surface-variant text-sm font-medium">/week</span>
          </div>
          <p className="text-xs text-slate-400 mb-6 font-mono">₹7/day</p>
          <div className="text-sm text-on-surface-variant mb-6 font-medium">
            Coverage up to <span className="font-bold text-white font-mono mix-blend-plus-lighter">₹{PLANS[0].coverageAmount.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-xs text-slate-400 mb-6 font-medium bg-surface-container-high py-2 px-3 rounded-lg inline-block self-start">Payout cap: ₹{PLANS[0].weeklyPayoutCap.toLocaleString('en-IN')}/week</p>
          <ul className="space-y-4 border-t border-outline-variant/10 pt-6 mb-8 flex-1">
            <li className="flex items-start gap-3 text-sm text-on-surface-variant font-medium"><CheckCircle2 className="w-5 h-5 text-primary-fixed shrink-0" />Rainfall disruption cover</li>
            <li className="flex items-start gap-3 text-sm text-on-surface-variant font-medium"><CheckCircle2 className="w-5 h-5 text-primary-fixed shrink-0" />AQI spike cover</li>
            <li className="flex items-start gap-3 text-sm text-on-surface-variant font-medium"><CheckCircle2 className="w-5 h-5 text-primary-fixed shrink-0" />Weekly income protection</li>
            <li className="flex items-start gap-3 text-sm text-on-surface-variant font-medium"><CheckCircle2 className="w-5 h-5 text-primary-fixed shrink-0" />UPI payout within 2 hours</li>
          </ul>
          <button onClick={() => navigate('/register')} className="w-full kinetic-button px-6 py-4 rounded-xl border border-outline-variant/20 text-white font-bold hover:bg-surface-container hover:text-primary-fixed transition-colors">
            Get Shield Lite
          </button>
        </div>

        {/* Shield Plus */}
        <div className="glass-card p-8 rounded-[2rem] border border-primary-fixed/50 flex flex-col relative scale-[1.02] shadow-[0_0_40px_rgba(91,95,255,0.15)] bg-surface-container-lowest/50">
          <div className="absolute top-0 inset-x-0 bg-primary-container text-white text-xs font-bold uppercase tracking-widest py-1.5 text-center rounded-t-[2rem]">Most Popular</div>
          <h3 className="font-bold text-white text-2xl mb-1 mt-6">{PLANS[1].name}</h3>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-4xl font-black text-primary-fixed font-mono tracking-tighter">₹{PLANS[1].weeklyPremium}</span>
            <span className="text-on-surface-variant text-sm font-medium">/week</span>
          </div>
          <p className="text-xs text-slate-400 mb-6 font-mono">₹14/day</p>
          <div className="text-sm text-on-surface-variant mb-6 font-medium">
            Coverage up to <span className="font-bold text-white font-mono mix-blend-plus-lighter">₹{PLANS[1].coverageAmount.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-xs text-slate-400 mb-6 font-medium bg-surface-container-high py-2 px-3 rounded-lg inline-block self-start">Payout cap: ₹{PLANS[1].weeklyPayoutCap.toLocaleString('en-IN')}/week</p>
          <ul className="space-y-4 border-t border-outline-variant/10 pt-6 mb-8 flex-1">
            <li className="flex items-start gap-3 text-sm text-on-surface-variant font-medium"><CheckCircle2 className="w-5 h-5 text-primary-fixed shrink-0" />All Shield Lite features</li>
            <li className="flex items-start gap-3 text-sm text-primary-fixed font-medium"><CheckCircle2 className="w-5 h-5 text-primary-fixed shrink-0" />Heat stress cover</li>
            <li className="flex items-start gap-3 text-sm text-primary-fixed font-medium"><CheckCircle2 className="w-5 h-5 text-primary-fixed shrink-0" />Order demand anomaly cover</li>
            <li className="flex items-start gap-3 text-sm text-primary-fixed font-medium"><CheckCircle2 className="w-5 h-5 text-primary-fixed shrink-0" />Priority fraud clearance</li>
            <li className="flex items-start gap-3 text-sm text-primary-fixed font-medium"><CheckCircle2 className="w-5 h-5 text-primary-fixed shrink-0" />UPI payout within 1 hour</li>
          </ul>
          <button onClick={() => navigate('/register')} className="w-full kinetic-button px-6 py-4 rounded-xl bg-primary-container text-white font-bold hover:bg-primary transition-colors shadow-lg">
            Get Shield Plus
          </button>
        </div>

        {/* Shield Max */}
        <div className="glass-card p-8 rounded-[2rem] border border-outline-variant/10 flex flex-col relative">
          <h3 className="font-bold text-white text-2xl mb-1 mt-4">{PLANS[2].name}</h3>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-4xl font-black text-primary-fixed font-mono tracking-tighter">₹{PLANS[2].weeklyPremium}</span>
            <span className="text-on-surface-variant text-sm font-medium">/week</span>
          </div>
          <p className="text-xs text-slate-400 mb-6 font-mono">₹26/day</p>
          <div className="text-sm text-on-surface-variant mb-6 font-medium">
            Coverage up to <span className="font-bold text-white font-mono mix-blend-plus-lighter">₹{PLANS[2].coverageAmount.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-xs text-slate-400 mb-6 font-medium bg-surface-container-high py-2 px-3 rounded-lg inline-block self-start">Payout cap: ₹{PLANS[2].weeklyPayoutCap.toLocaleString('en-IN')}/week</p>
          <ul className="space-y-4 border-t border-outline-variant/10 pt-6 mb-8 flex-1">
            <li className="flex items-start gap-3 text-sm text-on-surface-variant font-medium"><CheckCircle2 className="w-5 h-5 text-primary-fixed shrink-0" />All Shield Plus features</li>
            <li className="flex items-start gap-3 text-sm text-on-surface-variant font-medium"><CheckCircle2 className="w-5 h-5 text-primary-fixed shrink-0" />Social disruption cover</li>
            <li className="flex items-start gap-3 text-sm text-on-surface-variant font-medium"><CheckCircle2 className="w-5 h-5 text-primary-fixed shrink-0" />Extended zone coverage</li>
            <li className="flex items-start gap-3 text-sm text-on-surface-variant font-medium"><CheckCircle2 className="w-5 h-5 text-primary-fixed shrink-0" />Legal assistance</li>
            <li className="flex items-start gap-3 text-sm text-on-surface-variant font-medium"><CheckCircle2 className="w-5 h-5 text-primary-fixed shrink-0" />Instant UPI payout</li>
          </ul>
          <button onClick={() => navigate('/register')} className="w-full kinetic-button px-6 py-4 rounded-xl border border-outline-variant/20 text-white font-bold hover:bg-surface-container hover:text-primary-fixed transition-colors">
            Get Shield Max
          </button>
        </div>

      </div>

      <div className="mt-12 text-slate-400 text-sm text-center">
        No lock-in. No paperwork. Cancel anytime from your dashboard. Your first payout is automatic.
      </div>
    </RevealWrapper>
  );
}

function Footer() {
  return (
    <footer className="bg-background w-full py-12 px-8 relative z-10 border-t border-outline-variant/5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="mb-8 md:mb-0">
          <p className="font-body text-xs uppercase tracking-widest font-bold text-on-surface-variant opacity-80">
            © 2026 GigKavacham. Parametric Income Protection for India's Gig Workers.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          <button className="font-body font-bold text-xs uppercase tracking-widest text-on-surface-variant hover:text-white transition-opacity opacity-80 hover:opacity-100">Privacy Policy</button>
          <button className="font-body font-bold text-xs uppercase tracking-widest text-on-surface-variant hover:text-white transition-opacity opacity-80 hover:opacity-100">Terms of Service</button>
          <button className="font-body font-bold text-xs uppercase tracking-widest text-on-surface-variant hover:text-white transition-opacity opacity-80 hover:opacity-100">How It Works</button>
          <button className="font-body font-bold text-xs uppercase tracking-widest text-on-surface-variant hover:text-white transition-opacity opacity-80 hover:opacity-100">Contact</button>
        </div>
      </div>
    </footer>
  );
}
