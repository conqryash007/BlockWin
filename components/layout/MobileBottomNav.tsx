"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Gamepad2, 
  Trophy, 
  Ticket, 
  Wallet,
  User
} from "lucide-react";
import { motion } from "framer-motion";

const MOBILE_NAV_ITEMS = [
  { name: "Home", href: "/", icon: LayoutDashboard },
  { name: "Casino", href: "/casino", icon: Gamepad2 },
  { name: "Sports", href: "/sports", icon: Trophy },
  { name: "Lottery", href: "/lottery", icon: Ticket },
  { name: "Wallet", href: "/wallet", icon: Wallet },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Gradient blur background */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-black/80 backdrop-blur-xl border-t border-white/10" />
      
      <div className="relative flex items-center justify-around px-2 py-2 safe-area-bottom">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center gap-1 flex-1 py-2 group"
            >
              {/* Active indicator background */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-1 bg-gradient-to-t from-casino-brand/20 to-transparent rounded-xl"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              
              {/* Active glow */}
              {isActive && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-casino-brand rounded-full blur-sm" />
              )}
              
              <div className={cn(
                "relative p-2 rounded-xl transition-all duration-200",
                isActive 
                  ? "text-casino-brand" 
                  : "text-gray-500 group-hover:text-white"
              )}>
                <Icon className={cn(
                  "w-5 h-5 transition-transform duration-200",
                  isActive && "scale-110 drop-shadow-[0_0_8px_rgba(0,255,163,0.6)]",
                  "group-hover:scale-110"
                )} />
              </div>
              
              <span className={cn(
                "text-[10px] font-medium transition-colors duration-200",
                isActive ? "text-casino-brand" : "text-gray-500 group-hover:text-white"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
