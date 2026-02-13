'use client';

import { ReactNode } from 'react';
import { WithdrawalStats } from './WithdrawalStats';
import { WithdrawalFAQ } from './WithdrawalFAQ';
import { motion } from 'framer-motion';

interface WithdrawalLayoutProps {
  children: ReactNode;
}

export function WithdrawalLayout({ children }: WithdrawalLayoutProps) {
  return (
    <div className="min-h-screen bg-[url('/grid-pattern.svg')] bg-fixed">
      {/* Background Gradients */}
      <div className="fixed inset-0 bg-gradient-to-b from-background via-background/95 to-background pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-casino-brand/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 container max-w-5xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <header className="mb-8 text-center md:text-left">
             <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-2">
              Withdraw Funds
            </h1>
            <p className="text-muted-foreground">
              Securely withdraw your earnings to your preferred wallet.
            </p>
          </header>

          <WithdrawalStats />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <motion.div
            className="lg:col-span-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {children}
          </motion.div>

          <motion.div
            className="lg:col-span-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="sticky top-8">
               <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 backdrop-blur-md mb-6">
                <h3 className="text-lg font-bold text-white mb-2">Need Help?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Check our FAQs or contact support if you encounter any issues with your withdrawal.
                </p>
               </div>
              <WithdrawalFAQ />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
