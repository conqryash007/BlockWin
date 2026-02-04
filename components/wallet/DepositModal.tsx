import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Coins } from 'lucide-react';
import { DepositForm } from './DepositForm';
import { useAuth } from '@/hooks/useAuth';

export function DepositModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { isTronConnected, isConnected } = useAuth();
  const [selectedNetwork, setSelectedNetwork] = useState<'ethereum' | 'tron'>('ethereum');
  
  // Auto-detect network when modal opens or connection changes
  // Prioritize Tron if connected (assuming generic "isConnected" might be true for both)
  useEffect(() => {
    if (isOpen) {
      if (isTronConnected) {
        setSelectedNetwork('tron');
      } else if (isConnected) {
        setSelectedNetwork('ethereum');
      }
      // If neither is connected, keep default (ethereum) or previous selection
    }
  }, [isOpen, isTronConnected, isConnected]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
          selectedNetwork={selectedNetwork}
          onNetworkChange={setSelectedNetwork}
          onClose={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
