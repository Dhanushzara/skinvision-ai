import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, ExternalLink, Star } from "lucide-react";

export default function FindDermatologist() {
  const [location, setLocation] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim()) {
      window.open(`https://www.google.com/maps/search/dermatologists+near+${encodeURIComponent(location)}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-10">
      <Navigation />
      
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-12 text-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4">
            Find a Specialist Near You
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto mb-8">
            Connect with certified dermatologists for professional diagnosis and treatment options.
          </p>

          <form onSubmit={handleSearch} className="max-w-md mx-auto relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input 
              className="pl-12 pr-32 h-14 rounded-full text-base border-slate-200 shadow-sm focus-visible:ring-primary/20"
              placeholder="City, State or Zip Code"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <Button 
              type="submit" 
              className="absolute right-1.5 top-1.5 bottom-1.5 rounded-full px-6"
            >
              Search
            </Button>
          </form>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Why see a dermatologist?</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 mb-4">
              <Star className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Professional Diagnosis</h3>
            <p className="text-slate-500 text-sm">
              Dermatologists use dermoscopy and biopsy to accurately diagnose skin conditions that AI might miss.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Full Body Screening</h3>
            <p className="text-slate-500 text-sm">
              Doctors can check hard-to-see areas like your scalp and back to ensure total coverage.
            </p>
          </div>
        </div>

        <div className="mt-12 bg-blue-600 rounded-3xl p-8 md:p-12 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Don't wait if you're unsure</h3>
          <p className="text-blue-100 max-w-2xl mx-auto mb-8">
            Melanoma is highly treatable when detected early. If you see a changing mole, book an appointment today.
          </p>
          <Button 
            variant="secondary" 
            size="lg" 
            className="rounded-full font-semibold text-blue-700 hover:text-blue-800"
            onClick={() => window.open('https://www.aad.org/public/fad', '_blank')}
          >
            Find a Doctor via AAD <ExternalLink className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
