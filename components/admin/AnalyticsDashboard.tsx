'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MousePointerClick, Link as LinkIcon, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [totalVisits, setTotalVisits] = useState(0);
  const [connectClicks, setConnectClicks] = useState(0);
  const [sectionJumps, setSectionJumps] = useState<Record<string, number>>({});

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const { data, error } = await supabase
          .from('analytics_events')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        let visits = 0;
        let clicks = 0;
        const jumps: Record<string, number> = {};

        data?.forEach((event) => {
          if (event.event_type === 'PAGE_VIEW') {
            visits++;
          } else if (event.event_type === 'CONNECT_CLICK') {
            clicks++;
          } else if (event.event_type === 'SECTION_JUMP') {
            const section = event.event_data?.section;
            if (section) {
              jumps[section] = (jumps[section] || 0) + 1;
            }
          }
        });

        setTotalVisits(visits);
        setConnectClicks(clicks);
        setSectionJumps(jumps);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-casino-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-black/40 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-400">Total Page Views</CardTitle>
            <Users className="w-4 h-4 text-casino-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalVisits}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        
        <Card className="bg-black/40 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-400">Connect Clicks</CardTitle>
            <MousePointerClick className="w-4 h-4 text-casino-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{connectClicks}</div>
            <p className="text-xs text-muted-foreground mt-1">Login/Signup buttons</p>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-400">Total Section Jumps</CardTitle>
            <LinkIcon className="w-4 h-4 text-casino-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {Object.values(sectionJumps).reduce((a, b) => a + b, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Navigation clicks</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black/40 border-white/5">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-white">Popular Sections</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {Object.entries(sectionJumps)
                .sort(([, a], [, b]) => b - a)
                .map(([section, count]) => (
                <div key={section} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
                  <span className="font-medium text-gray-200">{section}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-casino-brand">{count}</span>
                    <span className="text-xs text-muted-foreground">clicks</span>
                  </div>
                </div>
              ))}
              {Object.keys(sectionJumps).length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No section jump data yet.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
