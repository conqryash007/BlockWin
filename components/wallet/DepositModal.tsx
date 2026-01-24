import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Coins } from 'lucide-react';
import { DepositForm } from './DepositForm';

export function DepositModal() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Use key to force reset state when modal opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full h-12 bg-casino-brand text-black font-bold hover:bg-casino-brand/90 hover:shadow-neon transition-all">
          <Coins className="w-4 h-4 mr-2" />
          Deposit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px] bg-[#0f1115] text-white border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl">Deposit Tokens</DialogTitle>
        </DialogHeader>

        <DepositForm 
            onClose={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
