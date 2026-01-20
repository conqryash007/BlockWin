"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Wallet, Smartphone, Globe, ChevronRight, LogOut, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { useConnect, useDisconnect, useAccount, useChainId, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { parseUnits, formatUnits, maxUint256 } from 'viem';
import { CONTRACTS, SUPPORTED_TOKENS } from '@/lib/contracts';
import { useDeposit, useTokenBalance, useTokenAllowance, useTokenDecimals, useTokenSymbol } from '@/hooks/useDeposit';
import { triggerBalanceRefresh } from '@/hooks/usePlatformBalance';
import { toast } from 'sonner';

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isConnected: boolean;
  onConnect?: () => void;
  onDepositSuccess?: () => void;
}

const getWalletStyle = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("walletconnect")) return { 
    icon: Smartphone, 
    color: "text-[#3b99fc]", 
    bg: "bg-[#3b99fc]/10",
    border: "group-hover:border-[#3b99fc]/50" 
  };
  if (n.includes("metamask")) return { 
    icon: Globe,
    color: "text-[#f6851b]", 
    bg: "bg-[#f6851b]/10",
    border: "group-hover:border-[#f6851b]/50"
  };
   if (n.includes("injected")) return { 
    icon: Globe, 
    color: "text-casino-brand", 
    bg: "bg-casino-brand/10",
    border: "group-hover:border-casino-brand/50"
  };
  return { 
    icon: Wallet, 
    color: "text-white", 
    bg: "bg-white/10",
    border: "group-hover:border-white/50"
  };
};

// Default token - using SUPPORTED_TOKENS instead of CONTRACTS.MockUSDT
const TOKEN_ADDRESS = SUPPORTED_TOKENS.USDT.address;

export function WalletModal({ open, onOpenChange, isConnected, onDepositSuccess }: WalletModalProps) {
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { address } = useAccount();
  const { isAuthenticated, login, loading, accountStatus } = useAuth();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  
  // Check if user is on wrong network
  const isWrongNetwork = isConnected && chainId !== sepolia.id;
  
  // Deposit state
  const [amount, setAmount] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Deposit hooks
  const { 
    signTerms,
    approveUnlimited, 
    deposit, 
    depositSuccess,
  } = useDeposit();
  
  const { balance, refetch: refetchBalance } = useTokenBalance(TOKEN_ADDRESS);
  const { allowance, refetch: refetchAllowance } = useTokenAllowance(TOKEN_ADDRESS);
  const { decimals: tokenDecimals } = useTokenDecimals(TOKEN_ADDRESS);
  const { symbol: tokenSymbol } = useTokenSymbol(TOKEN_ADDRESS);

  // Use fetched decimals or fallback to 18
  const TOKEN_DECIMALS = tokenDecimals ?? 18;
  const TOKEN_SYMBOL = tokenSymbol ?? 'USDT';

  // Parse amount
  const parsedAmount = amount ? parseUnits(amount, TOKEN_DECIMALS) : BigInt(0);
  
  // Check if already approved (unlimited)
  const hasUnlimitedApproval = allowance !== undefined && allowance >= maxUint256 / BigInt(2);
  const hasSufficientBalance = balance !== undefined && balance >= parsedAmount;

  // Handle deposit success
  useEffect(() => {
    if (depositSuccess && isProcessing) {
      setIsProcessing(false);
      setIsSuccess(true);
      refetchBalance();
      toast.success('Deposit successful!');
      
      // Trigger global balance refresh after a short delay to allow backend to process
      // This updates the navbar balance and any other components using usePlatformBalance
      setTimeout(() => {
        triggerBalanceRefresh();
        if (onDepositSuccess) {
          onDepositSuccess();
        }
      }, 2000);
    }
  }, [depositSuccess, isProcessing, refetchBalance, onDepositSuccess]);

  // Reset deposit form when modal closes
  useEffect(() => {
    if (!open) {
      setAmount('');
      setTermsAccepted(false);
      setIsProcessing(false);
      setIsSuccess(false);
    }
  }, [open]);

  // Main deposit handler - chains all wallet popups
  const handleDeposit = async () => {
    if (!amount || parsedAmount <= BigInt(0)) {
      toast.error('Please enter an amount');
      return;
    }
    if (!hasSufficientBalance) {
      toast.error('Insufficient balance');
      return;
    }
    if (!termsAccepted) {
      toast.error('Please accept the terms');
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Sign terms
      toast.info('Please sign the terms agreement...');
      const signature = await signTerms();
      if (!signature) {
        setIsProcessing(false);
        return;
      }

      // Step 2: Approve if needed
      if (!hasUnlimitedApproval) {
        toast.info('Please approve token spending...');
        const approved = await approveUnlimited(TOKEN_ADDRESS);
        if (!approved) {
          setIsProcessing(false);
          return;
        }
        // Wait for approval to be confirmed
        await new Promise(resolve => setTimeout(resolve, 2000));
        await refetchAllowance();
      }

      // Step 3: Deposit
      toast.info('Please confirm the deposit...');
      await deposit(TOKEN_ADDRESS, parsedAmount);
      
    } catch (error: any) {
      console.error('Deposit flow error:', error);
      toast.error(error.message || 'Transaction failed');
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-32px)] sm:max-w-[400px] rounded-xl p-0 overflow-hidden bg-[#0d0f11] border-white/10 text-white gap-0 shadow-2xl shadow-black/50">
        
        {/* Header Section */}
        <div className="p-6 pb-2 relative">
            <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center flex flex-col items-center gap-4">
                <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner",
                    isConnected ? "bg-casino-brand/10 text-casino-brand" : "bg-white/5 text-white/50"
                )}>
                    <Wallet className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-xl font-bold text-white">{isConnected ? "Wallet Actions" : "Connect Wallet"}</h2>
                    {!isConnected && (
                         <p className="text-sm font-normal text-muted-foreground">Select your preferred method</p>
                    )}
                </div>
            </DialogTitle>
            </DialogHeader>
        </div>

        {!isConnected ? (
             <div className="p-6 pt-2 space-y-6">
                <div className="flex flex-col gap-3">
                   {[...connectors]
                     .sort((a, b) => {
                       const aName = a.name.toLowerCase();
                       const bName = b.name.toLowerCase();
                       if (aName.includes('injected') || aName.includes('metamask')) return -1;
                       if (bName.includes('injected') || bName.includes('metamask')) return 1;
                       if (aName.includes('walletconnect')) return 1;
                       if (bName.includes('walletconnect')) return -1;
                       return 0;
                     })
                     .map((connector) => {
                       const { icon: Icon, color, bg, border } = getWalletStyle(connector.name);
                       return (
                           <button 
                               key={connector.uid}
                               onClick={() => {
                                   connect({ connector });
                                   onOpenChange(false);
                               }}
                               className={cn(
                                   "group relative flex items-center w-full p-3.5 rounded-xl border border-white/5 bg-[#111316] hover:bg-[#16181b] transition-all duration-300 outline-none focus:ring-2 focus:ring-casino-brand/50",
                                   border
                               )}
                             >
                             <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mr-4 transition-transform group-hover:scale-105", bg)}>
                                 <Icon className={cn("w-5 h-5", color)} />
                             </div>
                             
                             <div className="flex-1 text-left">
                                 <span className="block font-medium text-sm text-white group-hover:text-white transition-colors">{connector.name}</span>
                                 <span className="text-[11px] text-muted-foreground/70 tracking-tight">
                                      {connector.name.toLowerCase().includes('walletconnect') ? 'Scan with your mobile wallet' : 'Browser extension & more'}
                                 </span>
                             </div>

                             <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all" />
                         </button>
                       )})}
                   
                   {connectors.length === 0 && (
                       <div className="text-center p-4 rounded-lg bg-red-500/10 text-red-400 text-xs border border-red-500/20">
                           No wallets found. Check configuration.
                       </div>
                   )}
                </div>

                <div className="pt-2 text-center border-t border-white/5">
                    <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-medium">Secured by Wagmi</p>
                </div>
             </div>
        ) : isWrongNetwork ? (
            <div className="p-6 pt-2 flex flex-col items-center justify-center gap-6 min-h-[300px]">
                <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center animate-pulse">
                    <Globe className="w-8 h-8 text-orange-500" />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-bold text-white">Wrong Network</h3>
                    <p className="text-sm text-muted-foreground max-w-[260px]">
                        Please switch to the Sepolia test network to continue.
                    </p>
                </div>
                <Button 
                    onClick={() => switchChain({ chainId: sepolia.id })}
                    disabled={isSwitchingChain}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold max-w-[200px]"
                >
                    {isSwitchingChain ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Switching...
                        </>
                    ) : (
                        "Switch to Sepolia"
                    )}
                </Button>
                <p className="text-xs text-muted-foreground text-center max-w-[260px]">
                    If the switch fails, please manually change your network in your wallet app.
                </p>
            </div>
        ) : !isAuthenticated ? (
            <div className="p-6 pt-2 flex flex-col items-center justify-center gap-6 min-h-[300px]">
                {accountStatus === 'checking' ? (
                    <>
                        <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center animate-pulse">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-bold text-white">Checking Account...</h3>
                            <p className="text-sm text-muted-foreground max-w-[260px]">
                                Verifying if your wallet is registered.
                            </p>
                        </div>
                    </>
                ) : accountStatus === 'existing' ? (
                    <>
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center animate-pulse">
                            <Wallet className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-bold text-white">Welcome Back!</h3>
                            <p className="text-sm text-muted-foreground max-w-[260px]">
                                Sign the message in your wallet to access your account.
                            </p>
                        </div>
                        <Button 
                            onClick={() => login()} 
                            disabled={loading}
                            className="w-full bg-casino-brand text-black hover:bg-casino-brand-hover font-bold max-w-[200px]"
                        >
                            {loading ? "Waiting for Signature..." : "Sign to Login"}
                        </Button>
                    </>
                ) : accountStatus === 'new' ? (
                    // New user registration with deposit flow
                    isSuccess ? (
                      <div className="flex flex-col items-center justify-center py-6 w-full">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 animate-pulse">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-lg font-bold text-emerald-400">Account Created & Deposit Successful!</h3>
                        <p className="text-muted-foreground mt-2 text-center text-sm">
                          Your deposit of <span className="text-white font-bold">{amount} {TOKEN_SYMBOL}</span> has been submitted.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Balance will update after blockchain confirmation.
                        </p>
                        <Button 
                          onClick={() => {
                            setIsSuccess(false);
                            setAmount('');
                            setTermsAccepted(false);
                          }}
                          className="mt-4"
                          variant="outline"
                          size="sm"
                        >
                          Close
                        </Button>
                      </div>
                    ) : (
                      <div className="w-full space-y-4">
                        <div className="text-center space-y-2 mb-4">
                          <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
                            <Wallet className="w-8 h-8 text-yellow-500" />
                          </div>
                          <h3 className="text-lg font-bold text-white">Create Account & Deposit</h3>
                          <p className="text-sm text-muted-foreground">
                            Set up your account and make your first deposit
                          </p>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Amount</span>
                            <span className="text-muted-foreground">
                              Balance: {balance ? parseFloat(formatUnits(balance, TOKEN_DECIMALS)).toFixed(4) : '0.0000'} {TOKEN_SYMBOL}
                            </span>
                          </div>
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="bg-black/30 border-white/10 text-white text-xl h-12 pr-16"
                              disabled={isProcessing || loading}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                              {TOKEN_SYMBOL}
                            </span>
                          </div>
                          
                          {/* Quick amounts */}
                          <div className="flex gap-2">
                            {['50', '100', '500', 'MAX'].map((val) => (
                              <Button
                                key={val}
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs border-white/10 hover:bg-white/10 h-8"
                                onClick={() => {
                                  if (val === 'MAX' && balance) {
                                    setAmount(formatUnits(balance, TOKEN_DECIMALS));
                                  } else {
                                    setAmount(val);
                                  }
                                }}
                                disabled={isProcessing || loading}
                              >
                                {val === 'MAX' ? 'Max' : `$${val}`}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {amount && !hasSufficientBalance && (
                          <p className="text-red-500 text-sm">Insufficient balance</p>
                        )}

                        {/* Terms */}
                        <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 border border-white/10">
                          <Checkbox 
                            id="terms-signup" 
                            checked={termsAccepted}
                            onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                            disabled={isProcessing || loading}
                          />
                          <label htmlFor="terms-signup" className="text-sm cursor-pointer">
                            I am 18+ and agree to the terms of service
                          </label>
                        </div>

                        {/* Create Account & Deposit Button */}
                        <Button 
                          onClick={async () => {
                            if (!amount || parsedAmount <= BigInt(0)) {
                              toast.error('Please enter an amount');
                              return;
                            }
                            if (!hasSufficientBalance) {
                              toast.error('Insufficient balance');
                              return;
                            }
                            if (!termsAccepted) {
                              toast.error('Please accept the terms');
                              return;
                            }

                            setIsProcessing(true);

                            try {
                              // Step 1: Login/Register first
                              await login();
                              
                              // Step 2: Sign terms for deposit
                              toast.info('Please sign the terms agreement...');
                              const signature = await signTerms();
                              if (!signature) {
                                setIsProcessing(false);
                                return;
                              }

                              // Step 3: Approve if needed
                              if (!hasUnlimitedApproval) {
                                toast.info('Please approve token spending...');
                                const approved = await approveUnlimited(TOKEN_ADDRESS);
                                if (!approved) {
                                  setIsProcessing(false);
                                  return;
                                }
                                // Wait for approval to be confirmed
                                await new Promise(resolve => setTimeout(resolve, 2000));
                                await refetchAllowance();
                              }

                              // Step 4: Deposit
                              toast.info('Please confirm the deposit...');
                              await deposit(TOKEN_ADDRESS, parsedAmount);
                              
                            } catch (error: any) {
                              console.error('Registration & deposit flow error:', error);
                              toast.error(error.message || 'Transaction failed');
                              setIsProcessing(false);
                            }
                          }}
                          className="w-full h-11 bg-casino-brand hover:bg-casino-brand-hover text-black font-bold"
                          disabled={isProcessing || loading || !amount || !hasSufficientBalance || !termsAccepted}
                        >
                          {isProcessing || loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              Sign Up & Deposit {amount ? `${amount} ${TOKEN_SYMBOL}` : ''}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>

                        <p className="text-xs text-muted-foreground text-center">
                          You'll sign to register, then approve tokens (if needed), then confirm deposit.
                        </p>
                      </div>
                    )
                ) : (
                    <>
                        <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center animate-pulse">
                            <Wallet className="w-8 h-8 text-yellow-500" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-bold text-white">Action Required</h3>
                            <p className="text-sm text-muted-foreground max-w-[260px]">
                                Please sign the message in your wallet to verify ownership and access your account.
                            </p>
                        </div>
                        <Button 
                            onClick={() => login()} 
                            disabled={loading}
                            className="w-full bg-casino-brand text-black hover:bg-casino-brand-hover font-bold max-w-[200px]"
                        >
                            {loading ? "Waiting for Signature..." : "Sign Message"}
                        </Button>
                    </>
                )}
            </div>
        ) : (
            <div className="p-6 pt-0">
                <Tabs defaultValue="deposit" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-[#191b1d] p-1 h-12 mb-6 border border-white/5 rounded-lg">
                        <TabsTrigger 
                            value="deposit"
                            className="h-full data-[state=active]:bg-[#2a2d31] data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all text-muted-foreground"
                        >Deposit</TabsTrigger>
                        <TabsTrigger 
                            value="withdraw"
                            className="h-full data-[state=active]:bg-[#2a2d31] data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all text-muted-foreground"
                        >Withdraw</TabsTrigger>
                    </TabsList>

                    <TabsContent value="deposit" className="space-y-4 animate-in fade-in-50 zoom-in-95 duration-200">
                      {isSuccess ? (
                        <div className="flex flex-col items-center justify-center py-6">
                          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 animate-pulse">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                          </div>
                          <h3 className="text-lg font-bold text-emerald-400">Deposit Successful!</h3>
                          <p className="text-muted-foreground mt-2 text-center text-sm">
                            Your deposit of <span className="text-white font-bold">{amount} {TOKEN_SYMBOL}</span> has been submitted.
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Balance will update after blockchain confirmation.
                          </p>
                          <Button 
                            onClick={() => setIsSuccess(false)}
                            className="mt-4"
                            variant="outline"
                            size="sm"
                          >
                            Make Another Deposit
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Amount Input */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Amount</span>
                              <span className="text-muted-foreground">
                                Balance: {balance ? parseFloat(formatUnits(balance, TOKEN_DECIMALS)).toFixed(4) : '0.0000'} {TOKEN_SYMBOL}
                              </span>
                            </div>
                            <div className="relative">
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="bg-black/30 border-white/10 text-white text-xl h-12 pr-16"
                                disabled={isProcessing}
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                {TOKEN_SYMBOL}
                              </span>
                            </div>
                            
                            {/* Quick amounts */}
                            <div className="flex gap-2">
                              {['50', '100', '500', 'MAX'].map((val) => (
                                <Button
                                  key={val}
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-xs border-white/10 hover:bg-white/10 h-8"
                                  onClick={() => {
                                    if (val === 'MAX' && balance) {
                                      setAmount(formatUnits(balance, TOKEN_DECIMALS));
                                    } else {
                                      setAmount(val);
                                    }
                                  }}
                                  disabled={isProcessing}
                                >
                                  {val === 'MAX' ? 'Max' : `$${val}`}
                                </Button>
                              ))}
                            </div>
                          </div>

                          {amount && !hasSufficientBalance && (
                            <p className="text-red-500 text-sm">Insufficient balance</p>
                          )}

                          {/* Terms */}
                          <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 border border-white/10">
                            <Checkbox 
                              id="terms-modal" 
                              checked={termsAccepted}
                              onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                              disabled={isProcessing}
                            />
                            <label htmlFor="terms-modal" className="text-sm cursor-pointer">
                              I am 18+ and agree to the terms of service
                            </label>
                          </div>

                          {/* Deposit Button */}
                          <Button 
                            onClick={handleDeposit}
                            className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                            disabled={isProcessing || !amount || !hasSufficientBalance || !termsAccepted}
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                Deposit {amount ? `${amount} ${TOKEN_SYMBOL}` : ''}
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>

                          <p className="text-xs text-muted-foreground text-center">
                            You'll be asked to sign terms, approve tokens (if needed), then confirm deposit.
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="withdraw" className="space-y-4 animate-in fade-in-50 zoom-in-95 duration-200">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Destination Address</Label>
                        <Input placeholder="Enter BTC address" className="bg-black/20 border-white/10 h-11" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</Label>
                        <div className="relative">
                            <Input placeholder="0.00" type="number" className="bg-black/20 border-white/10 h-11 pr-14" />
                            <Button size="sm" variant="ghost" className="absolute right-1 top-1.5 text-casino-brand text-xs h-8 hover:bg-casino-brand/10 hover:text-casino-brand">MAX</Button>
                        </div>
                    </div>
                    <div className="pt-4">
                        <Button className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold" variant="destructive">
                            Withdraw Funds
                        </Button>
                    </div>
                    </TabsContent>
                </Tabs>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
