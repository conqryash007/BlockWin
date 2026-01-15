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
  LayoutDashboard,
  Wallet,
} from "lucide-react";
import { useState } from "react";

const ICON_MAP: Record<string, any> = {
  LayoutDashboard,
  Wallet,
  Gamepad2,
  Trophy,
  Ticket,
  Gift,
  Crown,
  Users,
  Newspaper,
  Headphones,
};

// Social links configuration
const SOCIAL_LINKS = [
  {
    id: "twitter",
    name: "Twitter",
    href: "https://twitter.com/blockwin",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    hoverColor: "hover:text-sky-400 hover:bg-sky-400/10",
  },
  {
    id: "discord",
    name: "Discord",
    href: "https://discord.gg/blockwin",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
    hoverColor: "hover:text-indigo-400 hover:bg-indigo-400/10",
  },
  {
    id: "telegram",
    name: "Telegram",
    href: "https://t.me/blockwin",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    hoverColor: "hover:text-cyan-400 hover:bg-cyan-400/10",
  },
  {
    id: "instagram",
    name: "Instagram",
    href: "https://instagram.com/blockwin",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
      </svg>
    ),
    hoverColor: "hover:text-pink-400 hover:bg-pink-400/10",
  },
];

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
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

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

      {/* Social Links */}
      <div className={cn("px-4 py-3 border-t border-white/5", isCollapsed && !isMobile && "px-2")}>
        {(!isCollapsed || isMobile) && (
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
            Follow Us
          </p>
        )}
        <div className={cn(
          "flex gap-1",
          isCollapsed && !isMobile ? "flex-col items-center" : "flex-row justify-start"
        )}>
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.id}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "p-2 rounded-lg text-muted-foreground transition-all duration-200",
                social.hoverColor
              )}
              title={social.name}
            >
              {social.icon}
            </a>
          ))}
        </div>
      </div>

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
