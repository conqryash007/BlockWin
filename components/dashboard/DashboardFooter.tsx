"use client";

import { cn } from "@/lib/utils";
import { Shield, Clock, Phone, ExternalLink } from "lucide-react";
import Link from "next/link";

interface DashboardFooterProps {
  className?: string;
}

export function DashboardFooter({ className }: DashboardFooterProps) {
  return (
    <footer className={cn("pt-8 pb-4 border-t border-white/5", className)}>
      {/* Responsible Gambling Banner */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10 border border-amber-500/20">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-500/20">
              <Shield className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <span className="text-sm font-bold text-white">Gamble Responsibly</span>
              <p className="text-xs text-muted-foreground">
                Set limits, take breaks, and stay in control.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/responsible-gambling"
              className="text-xs text-amber-500 hover:text-amber-400 font-medium flex items-center gap-1"
            >
              Learn More <ExternalLink className="w-3 h-3" />
            </Link>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30">
              <span className="text-red-400 font-bold text-sm">18+</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        <div>
          <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Sports</h5>
          <ul className="space-y-2">
            <li><Link href="/sports/soccer" className="text-xs text-muted-foreground hover:text-white transition-colors">Soccer</Link></li>
            <li><Link href="/sports/cricket" className="text-xs text-muted-foreground hover:text-white transition-colors">Cricket</Link></li>
            <li><Link href="/sports/basketball" className="text-xs text-muted-foreground hover:text-white transition-colors">Basketball</Link></li>
            <li><Link href="/sports/tennis" className="text-xs text-muted-foreground hover:text-white transition-colors">Tennis</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Casino</h5>
          <ul className="space-y-2">
            <li><Link href="/casino/dice" className="text-xs text-muted-foreground hover:text-white transition-colors">Dice</Link></li>
            <li><Link href="/casino/crash" className="text-xs text-muted-foreground hover:text-white transition-colors">Crash</Link></li>
            <li><Link href="/casino/plinko" className="text-xs text-muted-foreground hover:text-white transition-colors">Plinko</Link></li>
            <li><Link href="/casino/mines" className="text-xs text-muted-foreground hover:text-white transition-colors">Mines</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Support</h5>
          <ul className="space-y-2">
            <li><Link href="/support" className="text-xs text-muted-foreground hover:text-white transition-colors">Help Center</Link></li>
            <li><Link href="/faq" className="text-xs text-muted-foreground hover:text-white transition-colors">FAQ</Link></li>
            <li><Link href="/contact" className="text-xs text-muted-foreground hover:text-white transition-colors">Contact Us</Link></li>
            <li><Link href="/responsible-gambling" className="text-xs text-muted-foreground hover:text-white transition-colors">Responsible Gaming</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Legal</h5>
          <ul className="space-y-2">
            <li><Link href="/terms" className="text-xs text-muted-foreground hover:text-white transition-colors">Terms of Service</Link></li>
            <li><Link href="/privacy" className="text-xs text-muted-foreground hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link href="/cookies" className="text-xs text-muted-foreground hover:text-white transition-colors">Cookie Policy</Link></li>
            <li><Link href="/license" className="text-xs text-muted-foreground hover:text-white transition-colors">Licensing</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-casino-brand to-emerald-500 flex items-center justify-center">
              <span className="font-black text-black text-sm">B</span>
            </div>
            <span className="text-sm font-bold text-white">BLOCKWIN</span>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            © 2026 BlockWin. All rights reserved.
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            24/7 Support
          </span>
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            Live Chat
          </span>
        </div>
      </div>
    </footer>
  );
}
