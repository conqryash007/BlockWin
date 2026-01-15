'use client';

import { useState } from 'react';
import { useGames, Game } from '@/hooks/useGames';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, X, Pencil, Gamepad2 } from 'lucide-react';
import { toast } from 'sonner';

export function GamesManagement() {
  const { games, isLoading, error, updateHouseEdge, toggleGameStatus, refetch } = useGames();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const handleEditStart = (game: Game) => {
    setEditingId(game.id);
    setEditValue((game.house_edge * 100).toFixed(2));
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleSave = async (gameId: string) => {
    const newEdge = parseFloat(editValue) / 100;
    
    if (isNaN(newEdge) || newEdge < 0 || newEdge > 100) {
      toast.error('Invalid house edge value');
      return;
    }

    setIsSaving(true);
    const success = await updateHouseEdge(gameId, newEdge);
    setIsSaving(false);

    if (success) {
      toast.success('House edge updated successfully');
      setEditingId(null);
      setEditValue('');
    } else {
      toast.error('Failed to update house edge');
    }
  };

  const handleToggleStatus = async (game: Game) => {
    const success = await toggleGameStatus(game.id, !game.is_active);
    if (success) {
      toast.success(`${game.name} ${!game.is_active ? 'activated' : 'deactivated'}`);
    } else {
      toast.error('Failed to update game status');
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-casino-panel border-white/5">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-casino-brand" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-casino-panel border-red-500/20">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-red-400">Error loading games: {error}</p>
          <Button variant="outline" onClick={refetch}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-casino-panel border-white/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-casino-brand" />
          <CardTitle>Games Management</CardTitle>
        </div>
        <CardDescription>
          Manage house edge percentages and game status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-white/5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead>Game</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>House Edge</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {games.map((game) => (
                <TableRow key={game.id} className="border-white/5">
                  <TableCell className="font-medium">{game.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-secondary/50 font-mono">
                      {game.slug}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {editingId === game.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-24 h-8 bg-background/50"
                          autoFocus
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    ) : (
                      <span className="font-mono text-casino-brand">
                        {(game.house_edge * 100).toFixed(2)}%
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={game.is_active}
                        onCheckedChange={() => handleToggleStatus(game)}
                      />
                      <span className={`text-xs ${game.is_active ? 'text-green-400' : 'text-muted-foreground'}`}>
                        {game.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === game.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-green-400"
                          onClick={() => handleSave(game.id)}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-red-400"
                          onClick={handleEditCancel}
                          disabled={isSaving}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-white"
                        onClick={() => handleEditStart(game)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
