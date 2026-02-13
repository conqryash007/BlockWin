'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface WithdrawalStepsProps {
  currentStep: number;
}

const steps = [
  { id: 1, label: 'Network' },
  { id: 2, label: 'Wallet' },
  { id: 3, label: 'Confirm' },
  { id: 4, label: 'Success' },
];

export function WithdrawalSteps({ currentStep }: WithdrawalStepsProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center relative">
        {/* Progress Bar Background */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -translate-y-1/2 rounded-full -z-10" />

        {/* Active Progress Bar */}
        <motion.div
          className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-casino-brand to-emerald-500 -translate-y-1/2 rounded-full -z-10"
          initial={{ width: '0%' }}
          animate={{
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
          }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />

        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2 group relative">
              <motion.div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-background',
                  isActive
                    ? 'border-casino-brand text-casino-brand shadow-[0_0_15px_rgba(34,197,94,0.3)] scale-110'
                    : isCompleted
                    ? 'border-casino-brand bg-casino-brand text-black'
                    : 'border-white/10 text-muted-foreground bg-black/40'
                )}
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-bold font-mono">{step.id}</span>
                )}
              </motion.div>
              <span
                className={cn(
                  'absolute top-12 text-xs font-medium whitespace-nowrap transition-colors duration-300',
                  isActive ? 'text-white' : isCompleted ? 'text-white/80' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
