"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GAMES } from "@/lib/mockData";
import { Settings, Trash2 } from "lucide-react";

export function AdminGameTable() {
  return (
    <div className="rounded-md border border-white/5 bg-casino-panel">
      <Table>
        <TableHeader>
          <TableRow className="border-white/5 hover:bg-transparent">
            <TableHead>Game</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>RTP</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {GAMES.map((game) => (
            <TableRow key={game.id} className="border-white/5">
              <TableCell className="font-medium">{game.name}</TableCell>
              <TableCell>{game.provider}</TableCell>
              <TableCell>
                 <Badge variant="secondary" className="bg-secondary/50 capitalize">{game.category}</Badge>
              </TableCell>
              <TableCell>{game.rtp}%</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                    <Switch defaultChecked />
                    <span className="text-xs text-muted-foreground">Active</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="hover:text-white">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
