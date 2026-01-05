import { GameLayout } from "@/components/casino/GameLayout";
import { Button } from "@/components/ui/button";
import { DiceGamePage } from "@/components/casino/dice/DiceGamePage";
import { PlinkoGamePage } from "@/components/casino/plinko/PlinkoGamePage";
import { MinesGamePage } from "@/components/casino/mines/MinesGamePage";

export default async function GamePage({ params }: { params: { id: string } }) {
  // Simulate game asset loading time
  await new Promise((resolve) => setTimeout(resolve, 1500));

  if (params.id === 'dice') {
    return <DiceGamePage />;
  }

  if (params.id === 'plinko') {
    return <PlinkoGamePage />;
  }

  if (params.id === 'mines') {
    return <MinesGamePage />;
  }

  const gameName = params.id.charAt(0).toUpperCase() + params.id.slice(1);

  return (
    <GameLayout gameId={params.id}>
        {/* Game Canvas Placeholder - This updates based on ID typically */}
        <div className="flex-1 flex items-center justify-center p-8">
            <div className="relative w-full max-w-2xl aspect-video rounded-xl bg-secondary/80 flex flex-col items-center justify-center border border-white/5 shadow-2xl">
                 <div className="absolute inset-0 bg-[url('/images/grid.png')] opacity-20"></div>
                 
                 <h2 className="text-4xl font-black text-white/10 uppercase tracking-[0.2em]">{gameName}</h2>
                 
                 {/* Visual Stub for Dice/Crash/etc */}
                 <div className="mt-8">
                    {params.id === 'dice' && (
                        <div className="w-64 h-4 bg-secondary rounded-full overflow-hidden relative border border-white/10">
                            <div className="absolute left-[50%] top-0 bottom-0 w-1 bg-white z-10"></div>
                            <div className="h-full bg-casino-brand w-[40%]"></div>
                        </div>
                    )}
                    {params.id === 'crash' && (
                         <div className="text-5xl font-mono font-bold text-casino-brand animate-pulse">
                            1.42x
                         </div>
                    )}
                     {params.id === 'plinko' && (
                         <div className="text-sm text-muted-foreground">Plinko board Loading...</div>
                    )}
                 </div>

                 <Button variant="outline" className="mt-12 border-white/10 hover:bg-white/5 text-xs uppercase tracking-widest">
                    Game Manual
                 </Button>
            </div>
        </div>
    </GameLayout>
  );
}
