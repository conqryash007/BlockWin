import { GAMES } from "@/lib/mockData";
import { GameCard } from "@/components/casino/GameCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";
import { LivePlayerActivityFeed } from "@/components/dashboard/LivePlayerActivityFeed";

export default function CasinoPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">All Games</h1>
        <div className="flex gap-2">
          <div className="relative w-full md:w-64">
             <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
             <Input placeholder="Search games..." className="pl-9" />
          </div>
          <Button variant="outline" size="icon">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {/* Repeating data to fill grid */}
        {GAMES.map((game) => (
            <GameCard key={game.id} {...game} />
        ))}
      </div>

      {/* Live Player Activity */}
      <LivePlayerActivityFeed filter="casino" title="Live Casino Players" maxItems={8} />
    </div>
  );
}
