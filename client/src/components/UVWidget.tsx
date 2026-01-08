import { useEffect, useState } from "react";
import { useUVIndex } from "@/hooks/use-weather";
import { Sun, CloudSun, Cloud, Umbrella } from "lucide-react";

export function UVWidget() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("Geo error", err)
      );
    }
  }, []);

  const { data: uvData, isLoading, error } = useUVIndex(coords);

  if (!coords) {
    return (
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <MapPinIcon className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-bold text-lg">Local UV Index</h3>
        </div>
        <p className="text-blue-100 text-sm">Allow location access to see UV risk in your area.</p>
      </div>
    );
  }

  if (isLoading) return <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />;
  
  if (error || !uvData) {
     return (
      <div className="bg-red-50 rounded-2xl p-6 text-red-600 border border-red-100">
        Could not load weather data.
      </div>
    );
  }

  // Determine styles based on UV index
  let bgGradient = "from-emerald-400 to-emerald-600";
  let icon = <Cloud className="w-8 h-8 text-white" />;
  
  if (uvData.uvIndex > 2) {
    bgGradient = "from-yellow-400 to-orange-500";
    icon = <CloudSun className="w-8 h-8 text-white" />;
  }
  if (uvData.uvIndex > 5) {
    bgGradient = "from-orange-500 to-red-500";
    icon = <Sun className="w-8 h-8 text-white" />;
  }
  if (uvData.uvIndex > 8) {
    bgGradient = "from-purple-500 to-purple-700";
    icon = <Umbrella className="w-8 h-8 text-white" />;
  }

  return (
    <div className={`rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br ${bgGradient} relative overflow-hidden`}>
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg opacity-90 mb-1">Current UV Index</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-display font-bold tracking-tight">{uvData.uvIndex.toFixed(1)}</span>
            <span className="text-white/80 font-medium">/ {uvData.uvMax} Max</span>
          </div>
          <div className="mt-4 inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold border border-white/10">
            {uvData.riskLevel} Risk
          </div>
        </div>
        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
          {icon}
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute top-10 -left-10 w-20 h-20 bg-black/5 rounded-full blur-xl" />
    </div>
  );
}

function MapPinIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  )
}
