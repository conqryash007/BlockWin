"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const { login, loading } = useAuth();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-background/95 backdrop-blur-xl border-white/10 p-0 overflow-hidden gap-0">
        <div className="flex flex-col items-center justify-center p-8 space-y-6">
          {/* Logo Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-casino-brand to-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,163,0.5)] animate-pulse-slow">
              <span className="font-bold text-black text-3xl">B</span>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                BLOCKWIN
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Next Gen Crypto Casino
              </p>
            </div>
          </div>

          {/* Connect CTA */}
          <div className="w-full space-y-4">
            <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center">
              <p className="text-sm font-medium text-white/90">
                Connect to this website
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Sign in securely to start playing
              </p>
            </div>

            <Button
              onClick={() => {
                login();
                onOpenChange(false);
              }}
              disabled={loading}
              className="w-full bg-casino-brand text-black hover:bg-casino-brand/90 font-bold h-12 text-base shadow-[0_0_20px_rgba(0,255,163,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,255,163,0.5)]"
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <FcGoogle className="mr-2 h-6 w-6" />
              )}
              Login/Signup
            </Button>
          </div>

          <div className="text-center">
            <p className="text-[10px] text-muted-foreground/60">
              By logging in, you agree to our Terms of Service & Privacy Policy.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
