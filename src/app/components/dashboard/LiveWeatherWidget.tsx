import { useEffect, useState } from 'react';
import { Cloud, Droplets, Thermometer, Wind, CloudRain, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import { fetchLiveWeather, WeatherData } from '../../../services/weather/weatherService';
import { Card } from '../ui/card';
import { cn } from '../ui/utils';

export default function LiveWeatherWidget({ city }: { city: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getW() {
      setLoading(true);
      const data = await fetchLiveWeather(city);
      setWeather(data);
      setLoading(false);
    }
    getW();
  }, [city]);

  if (loading) {
    return (
      <div className="h-40 bg-slate-900/50 animate-pulse rounded-[2rem] border border-slate-800" />
    );
  }

  if (!weather) return null;

  return (
    <Card className="p-6 bg-slate-950/80 border-slate-800 rounded-[2rem] shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Cloud className="w-24 h-24 text-primary" />
      </div>
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">{weather.cityName}</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Live Environmental Feed</p>
          </div>
          <div className="bg-primary/20 p-2 rounded-xl border border-primary/30">
            {weather.condition.toLowerCase().includes('rain') ? (
              <CloudRain className="w-5 h-5 text-primary" />
            ) : weather.temp > 35 ? (
              <Sun className="w-5 h-5 text-orange-400" />
            ) : (
              <Sun className="w-5 h-5 text-yellow-400" />
            )}
          </div>
        </div>

        <div className="flex items-end gap-2 mb-6">
          <span className="text-4xl font-black text-white font-mono">{Math.round(weather.temp)}°C</span>
          <span className="text-xs text-slate-500 font-medium mb-1.5 capitalize">{weather.condition}</span>
        </div>

        <div className="grid grid-cols-3 gap-4 border-t border-slate-800/50 pt-4">
          <WeatherStat icon={<Droplets className="w-3 h-3 text-blue-400" />} label="Rain" value={`${weather.rainfall24h}mm`} />
          <WeatherStat icon={<Thermometer className="w-3 h-3 text-orange-400" />} label="Humid" value={`${weather.humidity}%`} />
          <WeatherStat icon={<Wind className="w-3 h-3 text-emerald-400" />} label="Wind" value={`${weather.windSpeed}kmh`} />
        </div>
      </div>
    </Card>
  );
}

function WeatherStat({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 opacity-60">
        {icon}
        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">{label}</span>
      </div>
      <p className="text-xs font-bold text-white font-mono">{value}</p>
    </div>
  );
}
