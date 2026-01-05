"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProvablyFairInfo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground hover:text-white border border-transparent hover:border-white/10">
           <ShieldCheck className="h-4 w-4 text-casino-brand" />
           <span className="text-xs font-bold uppercase tracking-wider">Provably Fair</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-casino-panel border-white/10 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-casino-brand" />
            Fairness Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
             <div className="p-3 bg-secondary/30 rounded-lg text-sm text-muted-foreground">
                This game uses a provably fair system. The result is determined by a combination of the server seed and your client seed.
             </div>

             <div className="space-y-2">
                 <Label className="text-xs uppercase text-muted-foreground">Server Seed (Hashed)</Label>
                 <Input readOnly value="a1b2c3d4e5f6..." className="bg-black/20 border-white/10 font-mono text-xs" />
             </div>

             <div className="space-y-2">
                 <Label className="text-xs uppercase text-muted-foreground">Client Seed</Label>
                 <div className="flex gap-2">
                    <Input defaultValue="my-lucky-seed-123" className="bg-black/20 border-white/10 font-mono text-xs" />
                    <Button variant="secondary" size="sm">Randomize</Button>
                 </div>
             </div>

             <div className="space-y-2">
                 <Label className="text-xs uppercase text-muted-foreground">Nonce</Label>
                 <Input readOnly value="42" className="bg-black/20 border-white/10 font-mono text-xs" />
             </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
