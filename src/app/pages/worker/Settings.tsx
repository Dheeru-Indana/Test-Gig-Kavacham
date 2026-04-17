import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, User, Briefcase, CreditCard, Activity, Star, Settings2, ShieldCheck, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../components/ui/utils';

type Tab = 'personal' | 'preferences' | 'about';

export default function Settings() {
  const navigate = useNavigate();
  const { profile, user, setProfile } = useApp();
  
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    platformType: '',
    city: '',
    pincode: '',
    zone: '',
    weeklyEarnings: '',
    upiId: '',
    dateOfBirth: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  const [prefs, setPrefs] = useState({
    biometric: true,
    highContrast: false,
    instantPayout: true,
    weatherAlerts: true,
    payoutNotifs: true,
    dataResolution: 'Premium (60FPS)'
  });

  useEffect(() => {
    if (!profile) return;
    setFormData({
      fullName: profile.full_name || '',
      email: profile.email || '',
      phone: profile.phone_number || profile.phone || '',
      platformType: profile.platform_type || '',
      city: profile.city || '',
      pincode: profile.pincode || '',
      zone: profile.area || profile.zone || '',
      weeklyEarnings: profile.weekly_earnings?.toString() || '',
      upiId: profile.upi_id || '',
      dateOfBirth: profile.date_of_birth || profile.dob || '',
      emergencyContactName: profile.emergency_contact_name || '',
      emergencyContactPhone: profile.emergency_contact_phone || profile.emergency_contact || '',
    });
  }, [profile]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    const updatePayload: Record<string, any> = {
      full_name: formData.fullName,
      phone_number: formData.phone,
      platform_type: formData.platformType,
      city: formData.city,
      pincode: formData.pincode,
      area: formData.zone,
      weekly_earnings: Number(formData.weeklyEarnings) || 0,
      upi_id: formData.upiId,
      emergency_contact_name: formData.emergencyContactName,
      emergency_contact_phone: formData.emergencyContactPhone,
    };

    if (formData.dateOfBirth) updatePayload.date_of_birth = formData.dateOfBirth;

    if (formData.pincode !== profile?.pincode) {
      const first = formData.pincode?.charAt(0) || '';
      updatePayload.city_tier =
        ['1','4','5','6'].includes(first) ? 'Tier 1' :
        ['2','3'].includes(first) ? 'Tier 2' :
        first === '7' ? 'Tier 3' : 'Tier 4 / Rural';
    }

    const { data, error } = await supabase.from('profiles').update(updatePayload).eq('id', user.id).select().maybeSingle();

    if (error) {
      setErrorMsg('Save failed: ' + error.message);
    } else if (data) {
      setProfile(data);
      setSuccessMsg('Profile updated securely.');
      setEditMode(false);
    }

    setSaving(false);
  };

  useEffect(() => {
    if (successMsg || errorMsg) {
       const t = setTimeout(() => {
           setSuccessMsg('');
           setErrorMsg('');
       }, 3000);
       return () => clearTimeout(t);
    }
  }, [successMsg, errorMsg]);

  return (
    <div className="w-full relative pb-28 md:pb-8 flex flex-col h-full bg-background min-h-screen">
      <header className="sticky top-0 h-24 bg-background/80 backdrop-blur-xl border-b border-outline-variant/5 z-30 flex items-center px-8 border-l border-outline-variant/10 shrink-0">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full glass-card border border-outline-variant/20 flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors lg:hidden">
             <ArrowLeft className="w-4 h-4 text-white" />
           </button>
           <div>
             <h1 className="text-2xl font-bold text-white tracking-tight">System Identity</h1>
             <p className="text-xs text-on-surface-variant font-medium tracking-wide uppercase">Profile & Preferences</p>
           </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
         <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
            
            {/* Tabs Sidebar */}
            <div className="w-full md:w-64 shrink-0 space-y-2">
               <TabButton active={activeTab === 'personal'} onClick={() => setActiveTab('personal')} icon={<User className="w-4 h-4" />} label="Identity Matrix" />
               <TabButton active={activeTab === 'preferences'} onClick={() => setActiveTab('preferences')} icon={<Settings2 className="w-4 h-4" />} label="Platform Preferences" />
               <TabButton active={activeTab === 'about'} onClick={() => setActiveTab('about')} icon={<ShieldCheck className="w-4 h-4" />} label="System About" />
            </div>

            {/* Content Area */}
            <div className="flex-1 relative">
               <AnimatePresence mode="wait">
                  <motion.div
                     key={activeTab}
                     initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
                     animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                     exit={{ opacity: 0, y: -10, filter: "blur(10px)" }}
                     transition={{ duration: 0.3 }}
                     className="glass-panel rounded-3xl border border-outline-variant/10 shadow-2xl p-6 md:p-8"
                  >
                     {activeTab === 'personal' && (
                        <div className="space-y-8">
                           <div className="flex justify-between items-center border-b border-outline-variant/10 pb-6">
                              <div>
                                 <h2 className="text-xl font-bold text-white tracking-tight">Identity Matrix</h2>
                                 <p className="text-sm text-on-surface-variant mt-1">Manage your verified credentials.</p>
                              </div>
                              <div className="flex justify-end relative h-10">
                                  <AnimatePresence mode="wait">
                                    {!editMode ? (
                                      <motion.button key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditMode(true)} className="kinetic-button bg-surface-container hover:bg-surface-container-high text-white text-sm font-bold px-6 h-full rounded-full transition-colors border border-outline-variant/20 absolute right-0">
                                        Unlock Editing
                                      </motion.button>
                                    ) : (
                                      <motion.div key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-3 absolute right-0">
                                        <button onClick={() => setEditMode(false)} className="bg-transparent hover:bg-surface-container text-white text-sm font-bold px-6 h-full rounded-full transition-colors">
                                          Lock
                                        </button>
                                        <button onClick={handleSave} disabled={saving} className="kinetic-button bg-primary-container hover:bg-primary text-white text-sm font-bold px-6 h-full rounded-full transition-colors shadow-lg flex items-center justify-center min-w-[120px]">
                                          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirm'}
                                        </button>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                              </div>
                           </div>

                           {/* Form Grid */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <InputField label="Full Name" value={formData.fullName} onChange={(e) => setFormData(prev => ({...prev, fullName: e.target.value}))} disabled={!editMode} />
                              <InputField label="Email Address" value={formData.email} disabled={true} />
                              <InputField label="Phone Number" value={formData.phone} onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))} disabled={!editMode} />
                              <InputField label="Date of Birth" value={formData.dateOfBirth} type="date" onChange={(e) => setFormData(prev => ({...prev, dateOfBirth: e.target.value}))} disabled={!editMode} />
                              <InputField label="Platform Affiliation" value={formData.platformType} onChange={(e) => setFormData(prev => ({...prev, platformType: e.target.value}))} disabled={!editMode} />
                              <InputField label="Weekly Earnings (₹)" value={formData.weeklyEarnings} type="number" onChange={(e) => setFormData(prev => ({...prev, weeklyEarnings: e.target.value}))} disabled={!editMode} />
                              <InputField label="City" value={formData.city} onChange={(e) => setFormData(prev => ({...prev, city: e.target.value}))} disabled={!editMode} />
                              <InputField label="Pincode" value={formData.pincode} onChange={(e) => setFormData(prev => ({...prev, pincode: e.target.value}))} disabled={!editMode} />
                              <InputField label="Zone/Area" value={formData.zone} onChange={(e) => setFormData(prev => ({...prev, zone: e.target.value}))} disabled={!editMode} />
                              <InputField label="Liquid UPI ID" value={formData.upiId} onChange={(e) => setFormData(prev => ({...prev, upiId: e.target.value}))} disabled={!editMode} className={!formData.upiId && !editMode ? "border-error/50" : ""} />
                           </div>

                           <div className="border-t border-outline-variant/10 pt-8 mt-8">
                               <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Emergency Protocal Contacts</h3>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <InputField label="Contact Proxy Name" value={formData.emergencyContactName} onChange={(e) => setFormData(prev => ({...prev, emergencyContactName: e.target.value}))} disabled={!editMode} />
                                  <InputField label="Secure Line (Phone)" value={formData.emergencyContactPhone} onChange={(e) => setFormData(prev => ({...prev, emergencyContactPhone: e.target.value}))} disabled={!editMode} />
                               </div>
                           </div>
                        </div>
                     )}

                     {activeTab === 'preferences' && (
                        <div className="space-y-8">
                           <div className="border-b border-outline-variant/10 pb-6">
                              <h2 className="text-xl font-bold text-white tracking-tight">Platform Preferences</h2>
                              <p className="text-sm text-on-surface-variant mt-1">Configure interface logic and network protocols.</p>
                           </div>

                           <div className="space-y-4">
                              <div className="glass-card p-6 rounded-2xl flex items-center justify-between border border-outline-variant/5">
                                 <div>
                                   <h4 className="text-white font-bold tracking-tight">Biometric Authentication</h4>
                                   <p className="text-xs text-on-surface-variant mt-1">Enforce FaceID/TouchID on platform entry.</p>
                                 </div>
                                 <ToggleButton enabled={prefs.biometric} onClick={() => setPrefs(p => ({...p, biometric: !p.biometric}))} />
                              </div>
                              <div className="glass-card p-6 rounded-2xl flex items-center justify-between border border-outline-variant/5">
                                 <div>
                                   <h4 className="text-white font-bold tracking-tight">High-Contrast Overlay</h4>
                                   <p className="text-xs text-on-surface-variant mt-1">Enhance readability in harsh sunlight.</p>
                                 </div>
                                 <ToggleButton enabled={prefs.highContrast} onClick={() => setPrefs(p => ({...p, highContrast: !p.highContrast}))} />
                              </div>
                              <div className="glass-card p-6 rounded-2xl flex items-center justify-between border border-outline-variant/5">
                                 <div>
                                   <h4 className="text-white font-bold tracking-tight">Data Stream Resolution</h4>
                                   <p className="text-xs text-on-surface-variant mt-1">Higher fidelity animations may consume more battery.</p>
                                 </div>
                                 <select 
                                    value={prefs.dataResolution}
                                    onChange={(e) => setPrefs(prev => ({...prev, dataResolution: e.target.value}))}
                                    className="bg-surface-container border border-outline-variant/20 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                                 >
                                    <option>Premium (60FPS)</option>
                                    <option>Battery Saver</option>
                                 </select>
                              </div>

                              <div className="glass-card p-6 rounded-2xl flex items-center justify-between border border-outline-variant/5">
                                 <div>
                                   <h4 className="text-white font-bold tracking-tight">Instant Payout Protocol</h4>
                                   <p className="text-xs text-on-surface-variant mt-1">Automated settlement without manual escrow staging.</p>
                                 </div>
                                 <ToggleButton enabled={prefs.instantPayout} onClick={() => setPrefs(p => ({...p, instantPayout: !p.instantPayout}))} />
                              </div>

                              <div className="pt-4 mt-4 border-t border-outline-variant/10">
                                 <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Notification Matrix</h3>
                                 <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                       <span className="text-sm text-on-surface-variant font-medium">Weather Anomaly Alerts</span>
                                       <ToggleButton enabled={prefs.weatherAlerts} onClick={() => setPrefs(p => ({...p, weatherAlerts: !p.weatherAlerts}))} />
                                    </div>
                                    <div className="flex items-center justify-between px-2">
                                       <span className="text-sm text-on-surface-variant font-medium">Payout Success Log</span>
                                       <ToggleButton enabled={prefs.payoutNotifs} onClick={() => setPrefs(p => ({...p, payoutNotifs: !p.payoutNotifs}))} />
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}

                     {activeTab === 'about' && (
                        <div className="space-y-8 text-center py-12">
                           <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center border border-white/10 shadow-[0_10px_40px_rgba(91,95,255,0.4)] relative">
                             <div className="absolute inset-0 bg-white/20 blur-xl rounded-full" />
                             <ShieldCheck className="w-10 h-10 text-white drop-shadow-md" />
                           </div>
                           <div>
                              <h2 className="text-2xl font-headline font-bold text-white tracking-tight">GigKavacham</h2>
                              <p className="text-sm font-mono text-primary-fixed mt-2">V2.4.1 Liquid Build</p>
                           </div>
                           <p className="text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                              Autonomous parametric risk engine for continuous financial shielding. Engineered with zero-trust cryptoeconomic protocols.
                           </p>

                           <div className="flex justify-center gap-4 pt-8">
                             <button className="text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-white transition-colors">Privacy</button>
                             <div className="w-px h-4 bg-outline-variant/20" />
                             <button className="text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-white transition-colors">Terms</button>
                             <div className="w-px h-4 bg-outline-variant/20" />
                             <button className="text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-white transition-colors">Licenses</button>
                           </div>
                        </div>
                     )}

                  </motion.div>
               </AnimatePresence>

               {/* Toast notifications anchored to content area */}
               <AnimatePresence>
                 {(successMsg || errorMsg) && (
                   <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:w-auto min-w-[300px]">
                     <div className={cn("px-6 py-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] text-white text-sm font-bold flex items-center gap-3 backdrop-blur-xl border", successMsg ? 'bg-emerald-900/40 border-emerald-500/30' : 'bg-error-container/40 border-error/30')}>
                        <span className="material-symbols-outlined">{successMsg ? 'verified' : 'error'}</span>
                        {successMsg || errorMsg}
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
         </div>
      </div>
    </div>
  );
}

function ToggleButton({ enabled, onClick }: { enabled: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "w-12 h-6 rounded-full relative shadow-inner cursor-pointer transition-all duration-300 border",
        enabled ? "bg-emerald-500 border-emerald-400/30" : "bg-surface-container border-outline-variant/20"
      )}
    >
      <motion.div 
        animate={{ x: enabled ? 24 : 4 }}
        initial={false}
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
      />
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick} 
      className={cn("w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-500 relative overflow-hidden group", active ? "text-white" : "text-on-surface-variant hover:bg-surface-container/50")}
    >
       {active && <div className="absolute inset-0 bg-primary-container/10 border border-primary-container/20 rounded-2xl pointer-events-none" />}
       {active && <motion.div layoutId="activeTabIndicator" className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary-fixed rounded-r-full" />}
       <div className="flex items-center gap-4 relative z-10">
          <div className={cn("transition-colors", active ? "text-primary-fixed" : "opacity-70 group-hover:opacity-100")}>{icon}</div>
          <span className={cn("text-sm font-medium tracking-wide", active && "font-bold")}>{label}</span>
       </div>
       {!active && <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity translate-x-2 group-hover:translate-x-0" />}
    </button>
  )
}

function InputField({ label, value, type = "text", onChange, disabled, className = "" }: any) {
  return (
    <div className="flex flex-col">
       <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-1.5">{label}</label>
       <input 
         type={type}
         value={value}
         onChange={onChange}
         disabled={disabled}
         className={cn("w-full bg-surface-container border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white font-medium outline-none transition-all disabled:opacity-50", !disabled && "focus:border-primary-fixed focus:bg-surface-container-high hover:border-outline-variant/30", className)}
       />
    </div>
  )
}
