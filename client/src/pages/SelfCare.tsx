import { Navigation } from "@/components/Navigation";
import { UVWidget } from "@/components/UVWidget";
import { Sun, Droplets, Calendar, Eye, Clock } from "lucide-react";

export default function SelfCare() {
  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-10">
      <Navigation />
      
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Daily Self-Care</h1>
        <p className="text-slate-500 mb-8">Monitor UV levels and maintain healthy skin habits.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Main UV Widget */}
          <div className="lg:col-span-1">
            <UVWidget />
            <div className="mt-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <h4 className="font-semibold text-sm text-slate-900 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Peak Sun Hours
              </h4>
              <p className="text-xs text-slate-500">
                UV radiation is typically strongest between 10 AM and 4 PM. Seek shade during these times.
              </p>
            </div>
          </div>

          {/* Tips Grid */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TipCard 
              icon={Sun}
              color="text-orange-500 bg-orange-50"
              title="Sunscreen Daily"
              description="Apply broad-spectrum SPF 30+ every morning, even on cloudy days."
            />
            <TipCard 
              icon={Droplets}
              color="text-blue-500 bg-blue-50"
              title="Stay Hydrated"
              description="Hydrated skin is more resilient. Drink at least 8 glasses of water daily."
            />
            <TipCard 
              icon={Eye}
              color="text-purple-500 bg-purple-50"
              title="Know Your ABCDEs"
              description="Check for Asymmetry, Border irregularity, Color changes, Diameter >6mm, and Evolving shapes."
            />
            <TipCard 
              icon={Calendar}
              color="text-emerald-500 bg-emerald-50"
              title="Monthly Checks"
              description="Set a recurring reminder to perform a full-body skin check once a month."
            />
          </div>
        </div>

        {/* ABCDE Guide */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-6">The ABCDE Rule</h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-8">
            <ABCDEItem letter="A" title="Asymmetry" desc="One half does not match the other." />
            <ABCDEItem letter="B" title="Border" desc="Edges are irregular, ragged, or blurred." />
            <ABCDEItem letter="C" title="Color" desc="Color is not uniform (shades of tan, brown, black)." />
            <ABCDEItem letter="D" title="Diameter" desc="Larger than a pencil eraser (>6mm)." />
            <ABCDEItem letter="E" title="Evolving" desc="Changing in size, shape, or color." />
          </div>
        </div>
      </div>
    </div>
  );
}

function TipCard({ icon: Icon, color, title, description }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}

function ABCDEItem({ letter, title, desc }: any) {
  return (
    <div className="text-center sm:text-left">
      <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center text-xl font-bold mb-3 mx-auto sm:mx-0">
        {letter}
      </div>
      <h4 className="font-bold text-slate-900 mb-1">{title}</h4>
      <p className="text-sm text-slate-500">{desc}</p>
    </div>
  );
}
