'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function WithdrawalFAQ() {
  const faqs = [
    {
      question: "How long do withdrawals take?",
      answer: "Withdrawals are usually processed instantly if the amount is within the approved limit. If a manual approval is required by the admin, it typically takes 1-24 hours."
    },
    {
      question: "What are the withdrawal fees?",
      answer: "We charge a small 5% fee on withdrawals to cover network costs and platform maintenance. The fee is automatically deducted from your withdrawal amount."
    },
    {
      question: "Which networks are supported?",
      answer: "We currently support withdrawals via Ethereum (ERC20) and TRON (TRC20) networks. Please ensure your wallet address matches the selected network."
    },
    {
      question: "Why do I need approval for large amounts?",
      answer: "For security reasons, larger withdrawal amounts require manual approval from our team. This helps protect your funds and ensures platform stability."
    }
  ];

  return (
    <div className="mt-8 space-y-4">
      <h3 className="text-xl font-bold text-white mb-4">Frequently Asked Questions</h3>
      <Accordion type="single" collapsible className="w-full space-y-2">
        {faqs.map((faq, index) => (
          <AccordionItem 
            key={index} 
            value={`item-${index}`}
            className="border border-white/5 bg-black/20 rounded-lg px-4"
          >
            <AccordionTrigger className="text-white hover:text-casino-brand transition-colors text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
