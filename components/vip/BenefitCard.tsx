import { LucideIcon } from "lucide-react";

interface BenefitCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function BenefitCard({ title, description, icon: Icon }: BenefitCardProps) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-xl bg-casino-card border border-casino-border hover:border-casino-brand/30 transition-colors group">
      <div className="w-16 h-16 rounded-full bg-casino-brand/10 flex items-center justify-center mb-4 text-casino-brand group-hover:bg-casino-brand group-hover:text-black transition-all duration-300 shadow-[0_0_15px_-5px_var(--primary)] group-hover:shadow-neon">
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed max-w-[250px] mx-auto">
        {description}
      </p>
    </div>
  );
}
