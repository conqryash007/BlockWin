import { RefreshCw } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-64px)] w-full flex-col items-center justify-center bg-background gap-4">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-white/5 border-t-casino-brand animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
             <RefreshCw className="h-6 w-6 text-casino-brand animate-pulse" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
          <h2 className="text-xl font-black uppercase text-white tracking-widest animate-pulse">Loading Game</h2>
          <p className="text-xs text-muted-foreground font-semibold">Preparing your table...</p>
      </div>
    </div>
  );
}
