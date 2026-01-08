import { Link, useLocation } from "wouter";
import { Home, Activity, MapPin, User, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/analyze", icon: Stethoscope, label: "Analyze" },
    { href: "/dermatologist", icon: MapPin, label: "Find Doctor" },
    { href: "/self-care", icon: Activity, label: "Self Care" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 md:top-0 md:bottom-auto md:border-b md:border-t-0 md:px-8 z-50 shadow-lg shadow-slate-200/50">
      <div className="max-w-5xl mx-auto flex items-center justify-between md:justify-start md:gap-12">
        <Link href="/" className="hidden md:flex items-center gap-2 font-display font-bold text-xl text-slate-900 mr-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-teal-400 flex items-center justify-center text-white">
            <Activity className="w-5 h-5" />
          </div>
          SkinVision
        </Link>
        
        <div className="flex items-center justify-between w-full md:w-auto md:gap-8">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div 
                  className={cn(
                    "flex flex-col items-center gap-1 cursor-pointer transition-all duration-200",
                    isActive ? "text-primary scale-110" : "text-slate-400 hover:text-slate-600 hover:scale-105"
                  )}
                >
                  <item.icon className={cn("w-6 h-6", isActive && "stroke-[2.5px]")} />
                  <span className="text-[10px] font-medium md:text-xs">{item.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-2 w-1 h-1 rounded-full bg-primary md:hidden" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex ml-auto items-center gap-4">
           <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
             <User className="w-5 h-5" />
           </div>
        </div>
      </div>
    </nav>
  );
}
