import { Link, useLocation } from "wouter";
import { Home, Activity, MapPin, Heart, Clock, Video, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/history", icon: Clock, label: "History" },
    { href: "/dermatologist", icon: MapPin, label: "Doctor" },
    { href: "/self-care", icon: Heart, label: "Self Care" },
    { href: "/telederm", icon: Video, label: "TeleDerm" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-100 px-4 py-2.5 md:top-0 md:bottom-auto md:border-b md:border-t-0 md:px-8 z-50 shadow-lg shadow-slate-200/30 safe-area-padding">
      <div className="max-w-6xl mx-auto flex items-center justify-between md:justify-start md:gap-10">
        <Link href="/" className="hidden md:flex items-center gap-2.5 font-display font-bold text-xl text-slate-900 mr-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
            <Activity className="w-5 h-5" />
          </div>
          <span>SkinVision <sup className="text-[10px] font-semibold text-teal-500 tracking-wider">PRO</sup></span>
        </Link>

        <div className="flex items-center justify-between w-full md:w-auto md:gap-6">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 px-2 py-1 rounded-xl",
                  isActive ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-slate-600"
                )}>
                  <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                  <span className="text-[10px] font-semibold md:text-xs">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex ml-auto items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    </nav>
  );
}
