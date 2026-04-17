import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { useDcs } from '../../../hooks/useDcs';
import { cn } from '../../components/ui/utils';
import { GoogleMap, useJsApiLoader, Circle } from '@react-google-maps/api';

export default function DisruptionLive() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile: userData, user } = useApp();
  const { dcsOutput, loading: dcsLoading } = useDcs(userData?.city_tier || 'Tier 1', user?.id as any, 30000, userData?.city);
  
  // @ts-ignore
  const rawKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const apiKey = (typeof rawKey === 'string' ? rawKey.trim() : '');
  const { isLoaded } = useJsApiLoader({ id: 'google-map-live', googleMapsApiKey: apiKey });

  const [userLoc, setUserLoc] = useState({ lat: 20.5937, lng: 78.9629 });
  useEffect(() => {
    if (isLoaded && window.google) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => geocodeFallback()
        );
      } else { geocodeFallback(); }
    }
  }, [isLoaded, userData?.area, userData?.city]);

  const geocodeFallback = () => {
    const geocoder = new window.google.maps.Geocoder();
    const address = `${userData?.area || ''} ${userData?.city || ''} India`.trim();
    if (address.length > 5) {
      geocoder.geocode({ address }, (results: any, status: any) => {
        if (status === 'OK' && results?.[0]) {
          setUserLoc({ lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng() });
        }
      });
    }
  };

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: "grid_view" },
    { label: "Risk Monitor", path: "/disruption-live", icon: "radar", activeState: (dcsOutput?.currentDcs ?? 0) > 50 },
    { label: "Policies", path: "/policy-management", icon: "verified_user" },
    { label: "Payouts", path: "/claims-history", icon: "receipt_long" },
    { label: "Settings", path: "/settings", icon: "settings" },
  ];

  const getDcsGaugeColor = () => {
    switch (dcsOutput?.riskColor) {
      case 'amber': return '#F59E0B';
      case 'red': return '#EF4444';
      case 'green':
      default: return '#10B981';
    }
  };

  return (
    <div className="font-body bg-background text-on-surface selection:bg-primary-container selection:text-white min-h-screen flex flex-col md:flex-row">
      <div className="fixed inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none">
        {isLoaded && apiKey ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={userLoc}
            zoom={12}
            options={{
              disableDefaultUI: true,
              styles: [
                { "elementType": "geometry", "stylers": [{"color": "#0F131E"}] },
                { "elementType": "labels.text.stroke", "stylers": [{"color": "#0F131E"}] },
                { "elementType": "labels.text.fill", "stylers": [{"color": "#353945"}] },
                { "featureType": "water", "stylers": [{"color": "#0A0E19"}] },
                { "featureType": "road", "elementType": "geometry", "stylers": [{"color": "#171B27"}] },
                { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{"color": "#1B1F2B"}] },
                { "featureType": "poi", "stylers": [{"visibility": "off"}] },
                { "featureType": "transit", "stylers": [{"visibility": "off"}] }
              ]
            }}
          >
             <Circle
               center={userLoc}
               radius={3000}
               options={{
                 fillColor: dcsOutput?.riskColor === 'green' ? '#10B981' : dcsOutput?.riskColor === 'amber' ? '#F59E0B' : '#EF4444',
                 fillOpacity: 0.1,
                 strokeColor: dcsOutput?.riskColor === 'green' ? '#10B981' : dcsOutput?.riskColor === 'amber' ? '#F59E0B' : '#EF4444',
                 strokeOpacity: 0.5,
                 strokeWeight: 1,
               }}
             />
          </GoogleMap>
        ) : (
          <div className="absolute inset-0 pattern-dots pattern-primary/10 pattern-size-4" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
      </div>
      {/* Main Content */}
      <main className="w-full relative pb-28 md:pb-8 z-10">
        <header className="sticky top-0 h-24 bg-background/40 backdrop-blur-2xl border-b border-outline-variant/5 z-30 flex justify-between items-center px-8 border-l border-outline-variant/10">
          <div className="flex items-center space-x-4">
             <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full glass-card border border-outline-variant/20 flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors">
               <span className="material-symbols-outlined">arrow_back</span>
             </button>
             <div>
               <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  Live Disruption Monitor
               </h1>
               <div className="flex items-center space-x-2 mt-1">
                 <div className={cn("w-2 h-2 rounded-full animate-pulse", dcsOutput?.riskColor === 'red' ? 'bg-error' : dcsOutput?.riskColor === 'amber' ? 'bg-warning' : 'bg-emerald-500')}></div>
                 <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-widest">{userData?.city || 'Zone'} • Latency 14ms</p>
               </div>
             </div>
          </div>
        </header>

        <div className="p-6 md:p-8 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Primary Gauges */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 rounded-[2rem] border border-outline-variant/10 shadow-2xl col-span-1 min-h-[300px] flex flex-col justify-center items-center relative overflow-hidden group">
                 <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-primary-container/10 to-transparent pointer-events-none" />
                 <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-8 absolute top-8 text-center">{dcsOutput?.riskLabel || 'Status Normal'}</p>
                 
                 <div className="relative w-48 h-48 flex flex-col items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                       <circle cx="50%" cy="50%" r="46%" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                       <circle cx="50%" cy="50%" r="36%" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="transparent" />
                       
                       <motion.circle 
                         cx="50%" cy="50%" r="46%" stroke={getDcsGaugeColor()} strokeWidth="8" fill="transparent" strokeLinecap="round"
                         strokeDasharray={2 * Math.PI * 46 + "%"}
                         initial={{ strokeDashoffset: 2 * Math.PI * 46 + "%" }}
                         animate={{ strokeDashoffset: (2 * Math.PI * 46) - (((dcsOutput?.signals as any)?.aqi ?? 30) / 100) * (2 * Math.PI * 46) + "%" }}
                         transition={{ duration: 1 }}
                         style={{ filter: "drop-shadow(0 0 10px currentColor)" }}
                       />
                       <motion.circle 
                         cx="50%" cy="50%" r="36%" stroke="#c0c1ff" strokeWidth="6" fill="transparent" strokeLinecap="round"
                         strokeDasharray={2 * Math.PI * 36 + "%"}
                         initial={{ strokeDashoffset: 2 * Math.PI * 36 + "%" }}
                         animate={{ strokeDashoffset: (2 * Math.PI * 36) - (((dcsOutput?.signals as any)?.rainfall ?? 10) / 100) * (2 * Math.PI * 36) + "%" }}
                         transition={{ duration: 1 }}
                       />
                    </svg>
                    <span className="text-4xl font-mono font-black text-white mix-blend-plus-lighter">{dcsOutput?.currentDcs ?? 35}</span>
                    <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest mt-1">DCS Core</span>
                 </div>

                 <div className="absolute bottom-6 flex space-x-6">
                    <div className="flex items-center space-x-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                       <span className="text-[10px] font-mono text-on-surface-variant uppercase">Air Quality</span>
                    </div>
                    <div className="flex items-center space-x-2">
                       <div className="w-2 h-2 rounded-full bg-[#c0c1ff]"></div>
                       <span className="text-[10px] font-mono text-on-surface-variant uppercase">Precipitation</span>
                    </div>
                 </div>
              </motion.div>

              {/* Data streams */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-8 rounded-[2rem] border border-outline-variant/10 shadow-xl col-span-2">
                  <h3 className="font-bold text-white tracking-tight mb-8 text-lg">Environmental Telemetry</h3>
                  
                  <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-6">
                        <div>
                           <div className="flex justify-between text-xs mb-2">
                              <span className="text-on-surface-variant font-bold uppercase tracking-widest">Ambient Temp</span>
                              <span className="text-white font-mono">{(dcsOutput?.signals as any)?.heat ?? 32} °C</span>
                           </div>
                           <div className="w-full bg-surface-container rounded-full h-1">
                              <div className="bg-orange-400 h-1 rounded-full" style={{ width: `${(dcsOutput?.signals as any)?.heat ?? 32}%` }}></div>
                           </div>
                        </div>
                        <div>
                           <div className="flex justify-between text-xs mb-2">
                              <span className="text-on-surface-variant font-bold uppercase tracking-widest">Wind Speed</span>
                              <span className="text-white font-mono">{(dcsOutput?.signals as any)?.wind ?? 12} km/h</span>
                           </div>
                           <div className="w-full bg-surface-container rounded-full h-1">
                              <div className="bg-blue-400 h-1 rounded-full" style={{ width: `${(dcsOutput?.signals as any)?.wind ?? 12}%` }}></div>
                           </div>
                        </div>
                     </div>
                     <div className="space-y-6">
                        <div>
                           <div className="flex justify-between text-xs mb-2">
                              <span className="text-on-surface-variant font-bold uppercase tracking-widest">Platform Status</span>
                              <span className="text-emerald-400 font-mono text-[10px]">OPERATIONAL</span>
                           </div>
                           <div className="w-full bg-surface-container rounded-full h-1 flex gap-1">
                              {/* Visual representation of uptime blocks */}
                              {Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className={`flex-1 h-1 bg-emerald-500 rounded-full ${i > 8 ? 'opacity-20' : ''}`} />
                              ))}
                           </div>
                        </div>
                        <div>
                           <div className="flex justify-between text-xs mb-2">
                              <span className="text-on-surface-variant font-bold uppercase tracking-widest">Traffic Density</span>
                              <span className="text-white font-mono">{(dcsOutput?.signals as any)?.traffic ?? 65}%</span>
                           </div>
                           <div className="w-full bg-surface-container rounded-full h-1">
                              <div className="bg-purple-400 h-1 rounded-full" style={{ width: '65%' }}></div>
                           </div>
                        </div>
                     </div>
                  </div>
              </motion.div>

              {/* Area Chart representation */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6 md:p-8 rounded-[2rem] border border-outline-variant/10 shadow-2xl col-span-1 md:col-span-3">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
                    <div>
                      <h3 className="font-bold text-white tracking-tight text-lg mb-1">Continuous Risk Assessment</h3>
                      <p className="text-xs text-on-surface-variant font-mono uppercase tracking-widest">Past 12 Hours vs Predictive</p>
                    </div>
                    <div className="flex items-center space-x-4 mt-4 md:mt-0">
                       <span className="text-[10px] font-bold text-on-surface-variant uppercase flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"/> Stable</span>
                       <span className="text-[10px] font-bold text-on-surface-variant uppercase flex items-center gap-1"><div className="w-2 h-2 bg-error rounded-full"/> Payout Threshold</span>
                    </div>
                 </div>

                 <div className="relative h-64 w-full flex items-end">
                    {/* Simplified SVG Area Graph for visual impact */}
                    <svg className="w-full h-full preserve-3d" viewBox="0 0 1000 200" preserveAspectRatio="none">
                       <defs>
                          <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                             <stop offset="0%" stopColor={getDcsGaugeColor()} stopOpacity="0.3"></stop>
                             <stop offset="100%" stopColor={getDcsGaugeColor()} stopOpacity="0.0"></stop>
                          </linearGradient>
                       </defs>
                       
                       {/* Grid lines */}
                       <path d="M0 50 H1000 M0 100 H1000 M0 150 H1000" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                       
                       {/* Line & Area */}
                       {dcsOutput?.riskColor === 'green' ? (
                          <>
                            <path d="M0 160 Q 150 140, 300 170 T 600 150 T 1000 180" fill="transparent" stroke={getDcsGaugeColor()} strokeWidth="3" />
                            <path d="M0 160 Q 150 140, 300 170 T 600 150 T 1000 180 V 200 H 0 Z" fill="url(#chartGrad)" />
                          </>
                       ) : dcsOutput?.riskColor === 'amber' ? (
                          <>
                            <path d="M0 150 Q 150 120, 300 110 T 600 80 T 1000 100" fill="transparent" stroke={getDcsGaugeColor()} strokeWidth="3" />
                            <path d="M0 150 Q 150 120, 300 110 T 600 80 T 1000 100 V 200 H 0 Z" fill="url(#chartGrad)" />
                          </>
                       ) : (
                          <>
                            <path d="M0 120 Q 200 80, 400 40 T 800 20 T 1000 10" fill="transparent" stroke={getDcsGaugeColor()} strokeWidth="3" />
                            <path d="M0 120 Q 200 80, 400 40 T 800 20 T 1000 10 V 200 H 0 Z" fill="url(#chartGrad)" />
                          </>
                       )}
                       
                       {/* Threshold Reference Line */}
                       <path d="M0 40 H1000" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="2" strokeDasharray="4 4" />
                       
                       {/* Target Point */}
                       <circle cx="950" cy={dcsOutput?.riskColor === 'red' ? 15 : dcsOutput?.riskColor === 'amber' ? 95 : 175} r="5" fill={getDcsGaugeColor()} className="animate-pulse" />
                    </svg>

                    {/* Timeline labels */}
                    <div className="absolute -bottom-8 w-full flex justify-between text-[10px] text-on-surface-variant font-mono">
                       <span>-12h</span>
                       <span>-6h</span>
                       <span>Now</span>
                       <span>+6h Forecast</span>
                    </div>
                 </div>
              </motion.div>
           </div>
        </div>

      </main>
    </div>
  )
}
