"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NAVIGATION_ITEMS } from "@/lib/constants";
import {
  Gamepad2,
  Trophy,
  Ticket,
  Gift,
  Crown,
  Users,
  Newspaper,
  Headphones,
  Menu,
} from "lucide-react";
import { useState } from "react";

const ICON_MAP: Record<string, any> = {
  Gamepad2,
  Trophy,
  Ticket,
  Gift,
  Crown,
  Users,
  Newspaper,
  Headphones,
};

interface SidebarContentProps {
  isCollapsed: boolean;
  setIsCollapsed?: (value: boolean) => void;
  pathname: string;
  isMobile?: boolean; // New prop to handle mobile specific styling adjustments
}

function SidebarContent({ isCollapsed, setIsCollapsed, pathname, isMobile = false }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-black via-[#0d0d10] to-black">
      {/* Header / Logo */}
      <div className={cn("flex h-20 items-center px-4 mb-2", isMobile && "justify-between")}>
        {/* Toggle Button - Only show if setIsCollapsed is provided (Desktop) */}
        {setIsCollapsed && (
            <Button
            variant="ghost"
            size="icon"
            className="mr-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-full transition-all"
            onClick={() => setIsCollapsed(!isCollapsed)}
            >
            <Menu className="h-5 w-5" />
            </Button>
        )}
        
        <Link href="/" className={cn("flex items-center group transition-all duration-500", isCollapsed && !isMobile ? "opacity-0 w-0 hidden" : "opacity-100")}>
            <div className="relative flex items-center gap-3">
                <div className="relative h-10 w-10 rounded-xl bg-gradient-to-tr from-casino-brand to-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,163,0.3)] group-hover:shadow-[0_0_30px_rgba(0,255,163,0.6)] group-hover:scale-110 transition-all duration-300">
                    <span className="font-black text-black text-xl italic">B</span>
                    <div className="absolute inset-0 bg-white/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xl font-black italic tracking-tighter text-white group-hover:text-casino-brand transition-colors duration-300">
                        BLOCKWIN
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium group-hover:tracking-[0.3em] transition-all duration-500">
                        Casino
                    </span>
                </div>
            </div>
        </Link>
      </div>

      <ScrollArea className="flex-1 py-4 px-3">
        <div className="space-y-1.5">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.icon];
            const isActive = pathname.startsWith(item.href);

            return (
              <Link 
                key={item.href}
                href={item.href}
                className={cn(
                    "group relative flex items-center w-full p-3 rounded-xl transition-all duration-150 ease-out overflow-hidden hover:shadow-lg",
                    isCollapsed && !isMobile ? "justify-center px-0" : "px-4",
                    isActive 
                        ? "bg-gradient-to-r from-casino-brand/20 to-transparent shadow-[inset_2px_0_0_0_#00ffa3]" 
                        : "hover:bg-white/5"
                )}
              >
                 {/* Active background glow */}
                 {isActive && <div className="absolute inset-0 bg-casino-brand/5 blur-xl" />}
                 
                 {/* Hover sweep effect */}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-400 ease-in-out" />

                 <div className={cn("relative z-10 flex items-center", isCollapsed && !isMobile ? "justify-center" : "")}>
                    {Icon && (
                        <Icon
                        className={cn(
                            "h-5 w-5 transition-all duration-150 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]",
                            !isCollapsed && !isMobile && "mr-3",
                            isMobile && "mr-3",
                            isActive ? "text-casino-brand drop-shadow-[0_0_8px_rgba(0,255,163,0.6)]" : "text-gray-400 group-hover:text-white"
                        )}
                        />
                    )}
                    {(!isCollapsed || isMobile) && (
                        <span className={cn(
                            "font-medium text-sm transition-colors duration-150",
                            isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                        )}>
                            {item.name}
                        </span>
                    )}
                 </div>
              </Link>
            );

          })}
        </div>
      </ScrollArea>

      <div className="p-4 mx-2 mb-4">
        {!isCollapsed || isMobile ? (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1c24] to-[#0f1115] border border-white/5 group shadow-2xl hover:shadow-casino-brand/20 transition-all duration-500">
             {/* Animated gradient border/glow */}
             <div className="absolute inset-0 bg-gradient-to-tr from-casino-brand/20 via-purple-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
             
             {/* Particles/Shine */}
             <div className="absolute -inset-[100%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(0,255,163,0.2)_360deg)] animate-[spin_5s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

             <div className="p-5 relative z-10 flex flex-col items-center text-center">
                <div className="mb-3 p-3 rounded-full bg-black/50 border border-white/10 shadow-[0_0_15px_rgba(234,179,8,0.3)] group-hover:scale-110 transition-transform duration-300">
                    <Crown className="h-6 w-6 text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                </div>
                <h4 className="text-base font-bold text-white mb-1">VIP Access</h4>
                <p className="text-[10px] text-gray-400 mb-4 leading-tight max-w-[120px]">
                    Unlock exclusive rewards & weekly cashback
                </p>
                <Button className="w-full h-9 bg-gradient-to-r from-casino-brand to-emerald-500 text-black font-extrabold text-xs shadow-lg shadow-casino-brand/20 hover:shadow-casino-brand/40 hover:scale-105 transition-all duration-300 border-0">
                  JOIN CLUB
                </Button>
            </div>
          </div>
        ) : (
           <Button size="icon" variant="ghost" className="w-full h-12 rounded-xl justify-center text-yellow-500 bg-yellow-500/5 hover:bg-yellow-500/20 transition-all hover:scale-110">
             <Crown className="h-6 w-6" />
           </Button>
        )}
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "relative hidden lg:flex h-screen flex-col border-r border-white/5 transition-all duration-300 z-50",
        "bg-black/40 backdrop-blur-xl", // Glass effect
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <SidebarContent 
        pathname={pathname} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
      />
    </div>
  );
}

export function MobileSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden text-white">
                <Menu className="h-6 w-6" />
            </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-black border-r border-white/10 p-0">
            <SidebarContent 
                pathname={pathname} 
                isCollapsed={false} 
                isMobile={true}
            />
        </SheetContent>
    </Sheet>
  )
}
