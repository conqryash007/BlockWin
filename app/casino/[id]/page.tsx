import { GameLayout } from "@/components/casino/GameLayout";
import { Button } from "@/components/ui/button";

export default async function CasinoGamePage({ params }: { params: { id: string } }) {
  // Simulate game asset loading time
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const gameName = params.id.charAt(0).toUpperCase() + params.id.slice(1);

  return (
    <GameLayout gameId={params.id}>
        <div className="flex-1 flex items-center justify-center p-8">
            <div className="relative w-full max-w-2xl aspect-video rounded-xl bg-secondary/80 flex flex-col items-center justify-center border border-white/5 shadow-2xl">
                 <div className="absolute inset-0 bg-[url('/images/grid.png')] opacity-20"></div>
                 
                 <h2 className="text-4xl font-black text-white/10 uppercase tracking-[0.2em]">{gameName}</h2>
                 
                 <div className="mt-8">
                     <div className="text-sm text-muted-foreground">Game Interface Loading...</div>
                 </div>

                 <Button variant="outline" className="mt-12 border-white/10 hover:bg-white/5 text-xs uppercase tracking-widest">
                    Game Manual
                 </Button>
            </div>
        </div>
    </GameLayout>
  );
}
