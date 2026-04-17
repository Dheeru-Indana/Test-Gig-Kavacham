import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { ArrowLeft, User, MapPin, Briefcase, Wallet, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { PLATFORMS, CITIES, ZONES } from '../../lib/mock-data';
import { cn } from '../../components/ui/utils';
import { LocationPicker } from '../../components/LocationPicker';

export default function BasicDetails() {
  const navigate = useNavigate();
  const { setProfile } = useApp();
  
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('');
  const [city, setCity] = useState('');
  const [zone, setZone] = useState('');
  const [pincode, setPincode] = useState('');
  const [dailyEarnings, setDailyEarnings] = useState('');
  const [weeklyEarnings, setWeeklyEarnings] = useState('');
  const [upiId, setUpiId] = useState('');
  const [consent, setConsent] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Auto calculate weekly from daily roughly
  useEffect(() => {
    if (dailyEarnings && !weeklyEarnings) {
      setWeeklyEarnings((parseInt(dailyEarnings) * 6).toString());
    }
  }, [dailyEarnings]);

  const handleNext = () => {
    if (step === 1) {
      if (!name || !platform) toast.error("Please fill Name and Platform");
      else setStep(2);
    } else if (step === 2) {
      if (!city || !zone || !pincode) toast.error("Please complete location details");
      else setStep(3);
    } else {
      handleContinue();
    }
  };

  const handleContinue = () => {
    if (!dailyEarnings || !weeklyEarnings || !upiId || !consent) {
      toast.error('Please complete earnings and accept terms');
      return;
    }

    const cityData = CITIES.find(c => c.id === city);
    const availableZonesForCity = city ? ZONES[city as keyof typeof ZONES] || [] : [];
    const zoneData = availableZonesForCity.find(z => z.id === zone);
    const shieldScore = Math.floor(Math.random() * (99 - 40 + 1)) + 40;

    setProfile({
      name,
      phone: '+91 98765 43210',
      platform,
      city,
      zone,
      weeklyEarnings: parseInt(weeklyEarnings),
      selectedPlan: 'standard',
      pincode,
      district: zoneData?.district || cityData?.name || city,
      state: cityData?.state || 'Unknown',
      zoneCode: zoneData?.zoneCode || 'UNKNOWN',
      cityTier: cityData?.tier || 3,
      shieldScore,
      consent,
    });

    navigate('/onboarding/sandbox');
  };

  const availableZones = city ? ZONES[city as keyof typeof ZONES] || [] : [];
  const progressPercent = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-background relative flex flex-col justify-start overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-[40vh] bg-gradient-to-b from-primary/10 to-background pointer-events-none" />
      <div className="absolute top-[-10%] right-[-20%] w-[60%] h-[50%] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="p-6 flex items-center gap-4 z-10 relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
          className="rounded-full hover:bg-white/5"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Button>
        <div className="flex-1 max-w-[200px]">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="h-full bg-primary"
            />
          </div>
        </div>
        <span className="text-xs font-medium text-muted-foreground mix-blend-difference">{step} of 3</span>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-24 overflow-x-hidden z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto h-full flex flex-col pt-4"
        >
          {/* Title */}
          <div className="space-y-2 mb-10">
            <h2 className="text-4xl font-bold tracking-tight">
              {step === 1 && "Who are you?"}
              {step === 2 && "Where do you work?"}
              {step === 3 && "Your Earnings"}
            </h2>
            <p className="text-muted-foreground text-lg">
              {step === 1 && "Let's personalize your GigKavacham."}
              {step === 2 && "We cover specific hyper-local zones."}
              {step === 3 && "This determines your Payout bounds."}
            </p>
          </div>

          {/* Form Container */}
          <div className="flex-1 relative">
            <AnimatePresence mode="wait">
              {/* STEP 1 */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <AnimatedInput 
                    icon={<User className="w-5 h-5" />}
                    label="Full Name"
                    placeholder="E.g., Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  
                  <div className="space-y-3">
                    <label className="text-sm font-medium ml-1">Primary Platform</label>
                    <div className="grid grid-cols-2 gap-3">
                      {PLATFORMS.slice(0, 4).map(p => (
                        <button
                          key={p.id}
                          onClick={() => setPlatform(p.id)}
                          className={cn(
                            "p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all",
                            platform === p.id 
                              ? "border-primary bg-primary/10 text-foreground" 
                              : "border-white/10 bg-card/40 text-muted-foreground hover:bg-card/80"
                          )}
                        >
                          <Briefcase className={cn("w-6 h-6", platform === p.id ? "text-primary": "")} />
                          <span className="text-sm font-medium">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-4 mb-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowLocationPicker(true)}
                      className="w-full h-14 rounded-xl border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary flex items-center justify-center gap-2"
                    >
                      <MapPin className="w-5 h-5" />
                      Map My Location Automatically
                    </Button>
                    <div className="relative flex items-center py-2">
                       <div className="flex-grow border-t border-border"></div>
                       <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs uppercase tracking-widest font-semibold">Or enter manually</span>
                       <div className="flex-grow border-t border-border"></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium ml-1">City</label>
                    <Select value={city} onValueChange={(val) => { setCity(val); setZone(''); }}>
                      <SelectTrigger className="h-14 bg-card/60 border-white/10 rounded-xl text-lg px-4">
                        <MapPin className="w-5 h-5 text-muted-foreground mr-2" />
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <AnimatePresence>
                    {city && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                        <label className="text-sm font-medium ml-1">Gig Zone</label>
                        <Select value={zone} onValueChange={setZone}>
                          <SelectTrigger className="h-14 bg-card/60 border-white/10 rounded-xl text-lg px-4">
                            <SelectValue placeholder="Select specific zone" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableZones.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatedInput 
                    icon={<MapPin className="w-5 h-5" />}
                    label="Pincode"
                    placeholder="6-digit PIN"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                  />
                </motion.div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <AnimatedInput 
                      icon={<span>₹</span>}
                      label="Daily (Avg)"
                      placeholder="800"
                      value={dailyEarnings}
                      onChange={(e) => setDailyEarnings(e.target.value.replace(/\D/g, ''))}
                    />
                    <AnimatedInput 
                      icon={<span>₹</span>}
                      label="Weekly (Avg)"
                      placeholder="5000"
                      value={weeklyEarnings}
                      onChange={(e) => setWeeklyEarnings(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>

                  <AnimatedInput 
                    icon={<Wallet className="w-5 h-5" />}
                    label="UPI ID for Auto-Payouts"
                    placeholder="name@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />

                  <div className="flex items-start space-x-3 pt-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <Checkbox 
                      id="consent" 
                      checked={consent} 
                      onCheckedChange={(checked) => setConsent(checked as boolean)} 
                      className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label
                      htmlFor="consent"
                      className="text-sm text-muted-foreground leading-snug cursor-pointer select-none"
                    >
                      I consent to <strong className="text-foreground">GigKavacham</strong> using my verified location 
                      and earnings data to dynamically price my coverage and automate payouts.
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {showLocationPicker && (
             <LocationPicker 
               onClose={() => setShowLocationPicker(false)}
               onLocationSelect={(loc) => {
                 setPincode(loc.pincode);
                 // Best effort city mapping
                 const matchedCity = CITIES.find(c => loc.city.toLowerCase().includes(c.name.toLowerCase()));
                 if (matchedCity) {
                   setCity(matchedCity.id);
                   setZone('');
                   toast.success(`Location identified: ${matchedCity.name}`);
                 } else {
                   toast.success('Pincode captured. Please select city manually.');
                 }
                 setShowLocationPicker(false);
               }}
             />
          )}

        </motion.div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/90 to-transparent z-20">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleNext}
            size="lg"
            className="w-full h-14 rounded-xl text-lg font-semibold shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] group"
          >
            {step === 3 ? "Generate Impact Report" : "Continue"}
            {step === 3 && <CheckCircle2 className="w-5 h-5 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helper component for styled inputs
function AnimatedInput({ icon, label, placeholder, value, onChange, maxLength }: any) {
  return (
    <div className="space-y-2 group">
      <label className="text-sm font-medium ml-1 transition-colors text-foreground/80 group-focus-within:text-primary">
        {label}
      </label>
      <div className="relative flex items-center">
        <div className="absolute left-4 text-muted-foreground group-focus-within:text-primary transition-colors">
          {icon}
        </div>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          className="w-full h-14 bg-card/60 border border-white/10 rounded-xl pl-12 pr-4 text-lg placeholder:text-muted-foreground/30 focus:bg-card/80 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none"
        />
      </div>
    </div>
  );
}

