import { Button } from "@/components/ui/button";
import { Carousel } from "@/components/layout/Carousel";
import { Badge } from "@/components/ui/badge";
import { GameCard } from "@/components/casino/GameCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { GAMES } from "@/lib/mockData";
import { ArrowRight, Flame } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GAME_CATEGORIES } from "@/lib/constants";

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <Carousel />

      {/* Game Categories */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-white">Casino Lobby</h2>
            <div className="hidden md:flex gap-2">
                 <Button variant="ghost" size="sm">New</Button>
                 <Button variant="ghost" size="sm">Top Rated</Button>
            </div>
        </div>

        <Tabs defaultValue="lobby" className="w-full">
            <TabsList className="bg-transparent p-0 justify-start space-x-2 border-b border-white/5 w-full rounded-none h-auto pb-2 overflow-x-auto">
              {GAME_CATEGORIES.map((cat) => (
                <TabsTrigger 
                    key={cat.id} 
                    value={cat.id}
                    className="data-[state=active]:bg-transparent data-[state=active]:text-casino-brand data-[state=active]:border-b-2 data-[state=active]:border-casino-brand data-[state=active]:shadow-none rounded-none px-4 py-2"
                >
                    {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="lobby" className="mt-6 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                
                {/* Originals */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <div className="flex items-center gap-2">
                             <div className="h-6 w-1 rounded bg-casino-brand"></div>
                             <h3 className="font-bold text-white uppercase tracking-wider text-sm">Casino Originals</h3>
                        </div>
                        <Button variant="link" className="text-xs">View All <ArrowRight className="ml-1 h-3 w-3" /></Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {GAMES.filter(g => g.category === 'originals').map((game) => (
                            <GameCard key={game.id} {...game} />
                        ))}
                    </div>
                </div>

                {/* Popular Slots (Mock) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <div className="flex items-center gap-2">
                             <div className="h-6 w-1 rounded bg-casino-gold"></div>
                             <h3 className="font-bold text-white uppercase tracking-wider text-sm">Pragmatic Play</h3>
                        </div>
                        <Button variant="link" className="text-xs">View All <ArrowRight className="ml-1 h-3 w-3" /></Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                         {/* Reusing mock data for visual fill */}
                        {[...GAMES, ...GAMES].slice(0, 5).map((game, i) => (
                            <GameCard key={i} {...game} id={`${game.id}-${i}`} />
                        ))}
                    </div>
                </div>

            </TabsContent>
            
            {/* Other tabs placeholders */}
            <TabsContent value="originals">
                 <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {GAMES.filter(g => g.category === 'originals').map((game) => (
                        <GameCard key={game.id} {...game} />
                    ))}
                 </div>
            </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
