/*
-- alter table profiles add column if not exists phone text;
-- alter table profiles add column if not exists platform_type text;
-- alter table profiles add column if not exists city text;
-- alter table profiles add column if not exists pincode text;
-- alter table profiles add column if not exists zone text;
-- alter table profiles add column if not exists weekly_earnings numeric;
-- alter table profiles add column if not exists upi_id text;
-- alter table profiles add column if not exists city_tier text;
-- alter table profiles add column if not exists shield_score integer default 75;
*/

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Mail, ShieldCheck, Lock, LogIn, UserPlus, User, Phone, MapPin, Wallet, CreditCard, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';
import { seedDemoAccount } from '../../../services/demo/seedDemoData';

const PLATFORM_OPTIONS = [
  'Delivery Partner', 
  'Grocery Rider', 
  'Last-Mile Logistics', 
  'Gig Driver', 
  'Domestic Worker', 
  'Construction Worker', 
  'Other'
];

export default function PhoneInput() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, refreshProfile, setProfile } = useApp();
  
  const searchParams = new URLSearchParams(location.search);
  const modeParam = searchParams.get('mode');
  const isRegisterPath = location.pathname.includes('/register') || modeParam === 'register';
  const [isLoginMode, setIsLoginMode] = useState(!isRegisterPath);
  const [isWorking, setIsWorking] = useState(false);

  // Common Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Extended Registration Fields
  const [nameInput, setNameInput] = useState('');
  const [phone, setPhone] = useState('');
  const [platformType, setPlatformType] = useState('Delivery Partner');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [zone, setZone] = useState('');
  const [weeklyEarnings, setWeeklyEarnings] = useState('');
  const [upiId, setUpiId] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [computedCityTier, setComputedCityTier] = useState('');
  const [detectedLocationLabel, setDetectedLocationLabel] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const determineCityTier = (pin: string) => {
    if (!pin) return '';
    const firstDigit = pin.charAt(0);
    if (['1', '4', '5', '6'].includes(firstDigit)) return 'Tier 1';
    if (['2', '3'].includes(firstDigit)) return 'Tier 2';
    if (firstDigit === '7') return 'Tier 3';
    return 'Tier 4 / Rural';
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setLocationLoading(true);
    setLocationError('');
    setLocationSuccess(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en',
                'User-Agent': 'GigKavacham/1.0'
              }
            }
          );

          if (!response.ok) {
            throw new Error('Nominatim request failed');
          }

          const data = await response.json();
          const address = data.address;

          const detectedCity =
            address.city ||
            address.town ||
            address.municipality ||
            address.district ||
            address.county ||
            address.state_district ||
            '';

          const detectedPincode = address.postcode || '';

          const detectedZone =
            address.suburb ||
            address.neighbourhood ||
            address.quarter ||
            address.residential ||
            address.village ||
            address.hamlet ||
            address.road ||
            '';

          const detectedState = address.state || '';

          setCity((prev) => detectedCity || prev);
          setPincode((prev) => detectedPincode || prev);
          setZone((prev) => detectedZone || prev);

          if (detectedPincode) {
            const tier = determineCityTier(detectedPincode);
            setComputedCityTier(tier);
          }

          const detectedLabel = [detectedZone, detectedCity, detectedState, detectedPincode]
            .filter(Boolean)
            .join(', ');

          setDetectedLocationLabel(detectedLabel);
          setLocationSuccess(true);
          setLocationError('');
        } catch (err) {
          setLocationError('Could not fetch location details. Please fill in manually.');
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationLoading(false);
        if (error.code === 1) {
          setLocationError('Location access denied. Please allow location permission or enter your city manually.');
        } else if (error.code === 2) {
          setLocationError('Location unavailable. Please enter your city manually.');
        } else {
          setLocationError('Location request timed out. Please enter manually.');
        }
      },
      {
        timeout: 10000,
        maximumAge: 60000,
        enableHighAccuracy: false
      }
    );
  };

  const validateInput = () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    if (isLoginMode) {
      if (!password) {
        toast.error('Password is required');
        return false;
      }
      return true;
    }

    // Registration Validations
    if (!nameInput || nameInput.trim().length < 2) {
      toast.error('Please enter your full name');
      return false;
    }
    if (!phone || !/^\d{10}$/.test(phone)) {
      toast.error('Phone number must be exactly 10 digits');
      return false;
    }
    if (!platformType) {
      toast.error('Please select a platform type');
      return false;
    }
    if (!city || city.trim().length < 2) {
      toast.error('Please enter your city');
      return false;
    }
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      toast.error('Pincode must be exactly 6 digits');
      return false;
    }
    if (!weeklyEarnings || isNaN(Number(weeklyEarnings)) || Number(weeklyEarnings) <= 0) {
      toast.error('Please enter valid numerical weekly earnings');
      return false;
    }
    if (!upiId || !/.+@.+/.test(upiId)) {
      toast.error('Please enter a valid UPI ID (e.g., name@bank)');
      return false;
    }
    if (!password || password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return false;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    if (!termsAccepted) {
      toast.error('You must accept the Terms and Conditions');
      return false;
    }
    
    return true;
  };
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submit
    if (isWorking) return;
    if (!validateInput()) return;

    setIsWorking(true);
    
    try {
      if (isLoginMode) {
        // ── Step 1: Sign in ─────────────────────────
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
           toast.error(error.message || "Invalid email or password");
           setIsWorking(false);
           return;
        }

        if (data.user) {
          await seedDemoAccount(data.user.id, data.user.email || '');
        }
        
        toast.success("Successfully authenticated");
        navigate('/dashboard');
      } else {
        // Step 1: Auth signup
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password: password,
          options: {
            data: {
              full_name: nameInput.trim(),
              phone: phone || '',
              platform_type: platformType || '',
              city: city.trim() || '',
              pincode: pincode || '',
              zone: zone.trim() || '',
              city_tier: computedCityTier || 'Tier 3',
              weekly_earnings: Number(weeklyEarnings) || 3000,
              upi_id: upiId.trim() || '',
            },
          },
        });

        if (authError) {
          if (
            authError.message.includes('already registered') ||
            authError.message.includes('already been registered')
          ) {
            toast.error('An account with this email already exists. Please log in instead.');
          } else {
            toast.error(authError.message);
          }
          setIsWorking(false);
          return;
        }

        if (!authData?.user) {
          toast.error('Registration failed. Please try again.');
          setIsWorking(false);
          return;
        }

        const userId = authData.user.id;

        // Step 2: ALWAYS upsert profile directly
        const profilePayload = {
          id: userId,
          email: email.trim().toLowerCase(),
          full_name: nameInput.trim(),
          phone: phone || '',
          platform_type: platformType || '',
          city: city.trim() || '',
          pincode: pincode || '',
          zone: zone.trim() || '',
          city_tier: computedCityTier || 'Tier 3',
          weekly_earnings: Number(weeklyEarnings) || 3000,
          upi_id: upiId.trim() || '',
          shield_score: 75,
          role: 'user',
        };

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(profilePayload, { onConflict: 'id' });

        if (profileError) {
          console.error('[Register] Profile upsert failed:', profileError.message);
        }

        // Step 3: Update AppContext profile immediately
        if (typeof setProfile === 'function') {
          setProfile(profilePayload as any);
        }

        // Step 4: Navigate based on session state
        if (authData.session) {
          toast.success("Registration complete! Welcome.");
          navigate('/dashboard');
        } else {
          setRegistrationSuccess(true);
        }
      }
    } catch (err: any) {
      console.error('[Register] Error:', err);
      toast.error(err?.message || 'Something went wrong.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleDemoMode = async () => {
    try {
      setIsWorking(true);
      const demoEmail = 'test@gig.com';
      const demoPass = '123456';
      setEmail(demoEmail);
      setPassword(demoPass);
      
      const { data, error } = await supabase.auth.signInWithPassword({ email: demoEmail, password: demoPass });
      
      if (error) {
         toast.error("Demo account is currently unavailable");
         return;
      }

      if (data.user) {
        await seedDemoAccount(data.user.id, data.user.email || '');
      }
      
      toast.success("Authenticating Demo Context.");
      navigate('/dashboard');
    } catch (err: any) {
      toast.error("Demo account is currently unavailable");
    } finally {
      setIsWorking(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-green-700/30 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl backdrop-blur-xl">
          <div className="w-20 h-20 bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
            <ShieldCheck className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-white text-2xl font-bold mb-3 tracking-tight">Account Created</h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Your account has been set up. Check your email to confirm your account, then log in to activate your protection.
          </p>
          <Button 
            onClick={() => navigate('/login?mode=login')} 
            className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            Go to Login
          </Button>
          <p className="text-slate-500 text-[10px] mt-6 font-medium uppercase tracking-widest bg-slate-950/50 py-2 rounded-lg">
            Tip: Check your spam folder
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative flex flex-col justify-center overflow-hidden py-12">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none fixed" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[120px] pointer-events-none fixed" />

      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10 fixed">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="rounded-full hover:bg-white/5"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Button>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary tracking-wide">SECURE ACCESS</span>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-4 w-full z-10 mt-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`w-full ${isLoginMode ? 'max-w-md' : 'max-w-2xl'} bg-card/60 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden transition-all duration-300`}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />

          <div className="relative text-center space-y-4 mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Mail className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">
                {isLoginMode ? "Welcome back" : "Create Account"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {isLoginMode ? "Enter your Email to access GigKavacham securely" : "Complete your profile below to secure your income"}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={isLoginMode ? 'login' : 'register'}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6 relative"
              onSubmit={handleAuth}
            >
              {isLoginMode ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-2 bg-muted/30 border border-white/5 rounded-2xl focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                    <div className="pl-4 pr-3 py-2 border-r border-white/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 bg-transparent border-0 text-base font-medium placeholder:text-muted-foreground/40 focus:outline-none px-2"
                      disabled={isWorking}
                    />
                  </div>

                  <div className="flex items-center gap-3 p-2 bg-muted/30 border border-white/5 rounded-2xl focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                    <div className="pl-4 pr-3 py-2 border-r border-white/10 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex-1 bg-transparent border-0 text-lg font-medium tracking-widest placeholder:tracking-normal placeholder:text-muted-foreground/40 focus:outline-none px-2"
                      disabled={isWorking}
                    />
                  </div>
                  
                  <div className="pt-2 space-y-3">
                    <Button type="submit" size="lg" className="w-full h-14 rounded-xl text-base font-semibold group" disabled={isWorking}>
                      {isWorking ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin flex items-center justify-center mx-auto" /> : <>Secure Login <LogIn className="w-4 h-4 ml-2 group-hover:translate-x-1" /></>}
                    </Button>
                    <Button type="button" onClick={handleDemoMode} variant="outline" className="w-full h-12 rounded-xl text-sm font-semibold bg-accent/5 border-accent/20 text-accent" disabled={isWorking}>
                      Use Demo Account
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-xs font-semibold text-muted-foreground tracking-wide px-1">Full Name *</label>
                       <div className="flex items-center gap-3 p-2 bg-muted/30 border border-white/5 rounded-xl focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                         <div className="pl-3 pr-2 py-1.5 border-r border-white/10"><User className="w-4 h-4 text-muted-foreground" /></div>
                         <input type="text" placeholder="Ravi Kumar" value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="flex-1 bg-transparent border-0 text-sm font-medium focus:outline-none px-2" disabled={isWorking}/>
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-semibold text-muted-foreground tracking-wide px-1">Phone Number *</label>
                       <div className="flex items-center gap-3 p-2 bg-muted/30 border border-white/5 rounded-xl focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                         <div className="pl-3 pr-2 py-1.5 border-r border-white/10"><Phone className="w-4 h-4 text-muted-foreground" /></div>
                         <input type="tel" maxLength={10} placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} className="flex-1 bg-transparent border-0 text-sm font-medium focus:outline-none px-2" disabled={isWorking}/>
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-xs font-semibold text-muted-foreground tracking-wide px-1">Email Address *</label>
                       <div className="flex items-center gap-3 p-2 bg-muted/30 border border-white/5 rounded-xl focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                         <div className="pl-3 pr-2 py-1.5 border-r border-white/10"><Mail className="w-4 h-4 text-muted-foreground" /></div>
                         <input type="email" placeholder="worker@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 bg-transparent border-0 text-sm font-medium focus:outline-none px-2" disabled={isWorking}/>
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-semibold text-muted-foreground tracking-wide px-1">Platform Type *</label>
                       <div className="flex items-center gap-3 p-2 bg-muted/30 border border-white/5 rounded-xl focus-within:ring-2 focus-within:ring-primary/50 transition-all relative">
                         <select value={platformType} onChange={(e) => setPlatformType(e.target.value)} className="flex-1 bg-transparent border-0 text-sm font-medium focus:outline-none px-2 appearance-none z-10 cursor-pointer" disabled={isWorking}>
                           {PLATFORM_OPTIONS.map(opt => <option key={opt} value={opt} className="bg-card">{opt}</option>)}
                         </select>
                         <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-4 z-0 pointer-events-none" />
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5 flex flex-col">
                       <label className="text-xs font-semibold text-muted-foreground tracking-wide px-1">City *</label>
                       <div className="flex items-center gap-2 p-2 bg-muted/30 border border-white/5 rounded-xl focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                         <div className="pl-2 pr-2 py-1.5 border-r border-white/10"><MapPin className="w-4 h-4 text-muted-foreground" /></div>
                         <input type="text" placeholder="Mumbai" value={city} onChange={(e) => {
                           setCity(e.target.value);
                           setLocationError('');
                           setLocationSuccess(false);
                           setDetectedLocationLabel('');
                         }} className="w-full bg-transparent border-0 text-sm font-medium focus:outline-none px-1" disabled={isWorking}/>
                       </div>
                       <button type="button" onClick={handleDetectLocation} disabled={locationLoading || isWorking} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors mt-1 px-1 mt-2">
                         <MapPin className="w-4 h-4" /> Detect My Location
                       </button>
                       {locationLoading && (
                         <p className="text-xs text-indigo-500 mt-1 flex items-center gap-1 px-1">
                           <span className="animate-spin inline-block w-3 h-3 border border-indigo-400 border-t-transparent rounded-full" />
                           Detecting your location...
                         </p>
                       )}
                       {locationError && !locationLoading && (
                         <p className="text-xs text-red-500 mt-1 px-1">{locationError}</p>
                       )}
                       {locationSuccess && detectedLocationLabel && !locationLoading && (
                         <p className="text-xs text-slate-500 mt-1 px-1">
                           📍 {detectedLocationLabel}
                         </p>
                       )}
                    </div>
                    <div className="space-y-1.5">
                       <div className="flex justify-between items-center px-1">
                          <label className="text-xs font-semibold text-muted-foreground tracking-wide">Pincode *</label>
                          {computedCityTier && (
                             <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{computedCityTier}</span>
                          )}
                       </div>
                       <input type="text" maxLength={6} placeholder="400001" value={pincode} onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, ''); 
                          setPincode(val); 
                          setLocationError('');
                          setLocationSuccess(false);
                          setDetectedLocationLabel('');
                          if(val.length === 6) setComputedCityTier(determineCityTier(val)); 
                          else setComputedCityTier('');
                       }} className="w-full h-[38px] mt-[1px] bg-muted/30 border border-white/5 text-sm font-medium focus:outline-none px-4 rounded-xl focus:ring-2 focus:ring-primary/50 transition-all" disabled={isWorking}/>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-semibold text-muted-foreground tracking-wide px-1">Area / Locality</label>
                       <input type="text" placeholder="Andheri East" value={zone} onChange={(e) => {
                         setZone(e.target.value);
                         setLocationError('');
                         setLocationSuccess(false);
                         setDetectedLocationLabel('');
                       }} className="w-full h-[38px] mt-[1px] bg-muted/30 border border-white/5 text-sm font-medium focus:outline-none px-4 rounded-xl focus:ring-2 focus:ring-primary/50 transition-all" disabled={isWorking}/>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-xs font-semibold text-muted-foreground tracking-wide px-1">Approximate Weekly Earnings (₹) *</label>
                       <div className="flex items-center gap-3 p-2 bg-muted/30 border border-white/5 rounded-xl focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                         <div className="pl-3 pr-2 py-1.5 border-r border-white/10"><Wallet className="w-4 h-4 text-muted-foreground" /></div>
                         <input type="text" placeholder="5000" value={weeklyEarnings} onChange={(e) => setWeeklyEarnings(e.target.value.replace(/\D/g, ''))} className="flex-1 bg-transparent border-0 text-sm font-medium focus:outline-none px-2" disabled={isWorking}/>
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-semibold text-muted-foreground tracking-wide px-1">UPI ID for Payouts *</label>
                       <div className="flex items-center gap-3 p-2 bg-muted/30 border border-white/5 rounded-xl focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                         <div className="pl-3 pr-2 py-1.5 border-r border-white/10"><CreditCard className="w-4 h-4 text-muted-foreground" /></div>
                         <input type="text" placeholder="name@bank" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="flex-1 bg-transparent border-0 text-sm font-medium focus:outline-none px-2" disabled={isWorking}/>
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
                    <div className="space-y-1.5">
                       <label className="text-xs font-semibold text-muted-foreground tracking-wide px-1">Password *</label>
                       <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-[42px] bg-muted/30 border border-white/5 tracking-widest placeholder:tracking-normal text-sm font-medium focus:outline-none px-4 rounded-xl focus:ring-2 focus:ring-primary/50 transition-all" disabled={isWorking}/>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-semibold text-muted-foreground tracking-wide px-1">Confirm Password *</label>
                       <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full h-[42px] bg-muted/30 border border-white/5 tracking-widest placeholder:tracking-normal text-sm font-medium focus:outline-none px-4 rounded-xl focus:ring-2 focus:ring-primary/50 transition-all" disabled={isWorking}/>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 pt-2">
                     <input type="checkbox" id="terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="w-4 h-4 rounded-md border-muted/50 bg-background/50 accent-primary focus:ring-primary/30" disabled={isWorking}/>
                     <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer">I agree to the Terms and Conditions and Consent to Data Verification.</label>
                  </div>

                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full h-14 rounded-xl text-base font-semibold group flex items-center justify-center gap-2" 
                      disabled={isWorking}
                    >
                      {isWorking ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {isLoginMode ? 'Signing in...' : 'Creating account...'}
                        </>
                      ) : (
                        <>
                          {isLoginMode ? 'Secure Login' : 'Create Account'}
                          {!isLoginMode && <UserPlus className="w-4 h-4 ml-2 group-hover:scale-110" />}
                          {isLoginMode && <LogIn className="w-4 h-4 ml-2 group-hover:translate-x-1" />}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsLoginMode(!isLoginMode)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
                  disabled={isWorking}
                >
                  {isLoginMode ? "Need an account? Register" : "Already have an account? Login"}
                </button>
              </div>
            </motion.form>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

