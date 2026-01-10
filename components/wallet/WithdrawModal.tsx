import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase';

export function WithdrawModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { address } = useAccount();
  const supabase = createClient();

  const handleWithdraw = async () => {
    if (!amount || !address) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please sign in first');
        setLoading(false);
        return;
      }

      const response = await fetch('https://hvnyxvapeorjcxljtszc.supabase.co/functions/v1/withdraw-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ amount: Number(amount) }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Withdrawal request failed');
      }

      toast.success('Withdrawal requested! Admin approval pending.');
      setIsOpen(false);
      setAmount('');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const withdrawalFee = Number(amount) * 0.05;
  const receiveAmount = Number(amount) - withdrawalFee;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-slate-700 hover:bg-slate-800 text-white">
          Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 text-white border-slate-800">
        <DialogHeader>
          <DialogTitle>Withdraw USDT</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Input
              id="amount"
              type="number"
              placeholder="Amount to Withdraw"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3 bg-slate-800 border-slate-700 text-white"
            />
          </div>
          
          {amount && (
            <div className="text-sm text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Withdrawal Fee (5%):</span>
                <span>{withdrawalFee.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between font-bold text-white">
                <span>You Receive:</span>
                <span>{receiveAmount.toFixed(2)} USDT</span>
              </div>
            </div>
          )}

          <Button onClick={handleWithdraw} disabled={loading || !amount} className="w-full bg-red-500 hover:bg-red-600">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Request Withdrawal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
