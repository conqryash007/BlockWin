'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function AgeDisclaimer() {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Check if user has already accepted
    const hasAccepted = localStorage.getItem('age_verified');
    if (!hasAccepted) {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('age_verified', 'true');
    setIsOpen(false);
  };

  const handleReject = () => {
    window.location.href = 'https://google.com';
  };

  // Don't render on server to avoid hydration mismatch
  if (!isMounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md bg-[#0f1115] border-white/10 text-white" hideCloseButton>
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-casino-brand/10 flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-casino-brand" />
          </div>
          <DialogTitle className="text-center text-xl">Age Verification Required</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground pt-2">
            You must be 18 years or older to access this website.
            Gambling involves risk and may not be suitable for everyone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 my-2 flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200/80">
            By clicking "I am 18+", you confirm that you are of legal gambling age in your jurisdiction and agree to our Terms of Service.
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:gap-0 mt-4">
          <div className="flex gap-3 w-full">
            <Button 
                variant="outline" 
                onClick={handleReject}
                className="flex-1 border-white/10 hover:bg-white/5 hover:text-white"
            >
              Exit
            </Button>
            <Button 
                onClick={handleAccept}
                className="flex-1 bg-casino-brand text-black hover:bg-casino-brand/90 font-bold"
            >
              I am 18+
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
