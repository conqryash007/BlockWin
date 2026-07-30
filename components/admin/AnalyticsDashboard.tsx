'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw, Globe, ChevronDown } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Filter events by selected domain
  const filteredEvents = useMemo(() => {
    if (selectedDomain === 'all') return events;
    return events.filter(e => e.event_data?.domain === selectedDomain);
  }, [events, selectedDomain]);

  // Extract unique domains
  const domains = useMemo(() => {
    const set = new Set<string>();
    events.forEach(e => {
      if (e.event_data?.domain && e.event_data.domain !== 'unknown') {
        set.add(e.event_data.domain);
      }
    });
    return Array.from(set);
  }, [events]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Funnel stats
    let totalVisits = 0;
    let totalPageViews = 0;
    let clickedConnect = 0;
    let walletSelected = 0;
    let walletConnected = 0;
    let usdtApproved = 0;

    // Today stats
    let todayVisits = 0;
    let todayPageViews = 0;
    let todayClickedConnect = 0;
    let todayWalletConnected = 0;

    // Daily breakdown
    const daily: Record<string, any> = {};

    filteredEvents.forEach(e => {
      const date = new Date(e.created_at).toISOString().split('T')[0];
      const isToday = date === todayStr;

      if (!daily[date]) {
        daily[date] = { date, visitors: 0, pageViews: 0, walletClicks: 0, connected: 0 };
      }

      const type = e.event_type;
      
      if (type === 'PAGE_VIEW') {
        totalPageViews++;
        daily[date].pageViews++;
        if (isToday) todayPageViews++;
        
        // Simulating visitors by just mirroring pageviews,
        // Since we don't have distinct session tracking right now.
        totalVisits++;
        daily[date].visitors++;
        if (isToday) todayVisits++;

      } else if (type === 'CONNECT_CLICK') {
        clickedConnect++;
        daily[date].walletClicks++;
        if (isToday) todayClickedConnect++;
      } else if (type === 'WALLET_SELECTED') {
        walletSelected++;
      } else if (type === 'WALLET_CONNECTED') {
        walletConnected++;
        daily[date].connected++;
        if (isToday) todayWalletConnected++;
      } else if (type === 'USDT_APPROVED') {
        usdtApproved++;
      }
    });

    const last14Days = Object.values(daily)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 14);

    return {
      today: { visitors: todayVisits, pageViews: todayPageViews, clickedConnect: todayClickedConnect, connected: todayWalletConnected },
      allTime: { visitors: totalVisits, pageViews: totalPageViews, connected: walletConnected, clickedButNotConnected: clickedConnect - walletConnected },
      funnel: { visitors: totalVisits, clickedConnect, walletSelected, walletConnected, usdtApproved },
      last14Days,
      recentActivity: filteredEvents.slice(0, 15)
    };
  }, [filteredEvents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-casino-brand" />
      </div>
    );
  }

  const calcPercent = (val: number, prev: number) => {
    if (prev === 0) return 0;
    return Math.round((val / prev) * 100);
  };

  const funnelSteps = [
    { label: 'Visitors', value: metrics.funnel.visitors, prev: metrics.funnel.visitors },
    { label: 'Clicked Connect Wallet', value: metrics.funnel.clickedConnect, prev: metrics.funnel.visitors },
    { label: 'Selected a Wallet', value: metrics.funnel.walletSelected, prev: metrics.funnel.clickedConnect },
    { label: 'Connected', value: metrics.funnel.walletConnected, prev: metrics.funnel.walletSelected },
    { label: 'USDT Approved', value: metrics.funnel.usdtApproved, prev: metrics.funnel.walletConnected },
  ];

  return (
    <div className="space-y-8 bg-[#0a0c10] text-white p-6 rounded-xl border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center border border-indigo-400/30">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Visitors, page views, and the wallet-connect funnel</p>
          </div>
        </div>
        <button 
          onClick={fetchAnalytics}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#1c1f26] border border-white/10 hover:bg-[#252830] transition-colors rounded-lg text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Domain Filter */}
      <div className="w-64">
        <Select value={selectedDomain} onValueChange={setSelectedDomain}>
          <SelectTrigger className="bg-[#111318] border-white/10 h-10">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <SelectValue placeholder="All Domains" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-[#111318] border-white/10 text-white">
            <SelectItem value="all">All Domains</SelectItem>
            {domains.map(d => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* TODAY */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-semibold text-muted-foreground tracking-widest uppercase">TODAY</h2>
        <div className="grid grid-cols-4 gap-4">
          <MetricCard title="VISITORS" value={metrics.today.visitors} />
          <MetricCard title="PAGE VIEWS" value={metrics.today.pageViews} />
          <MetricCard title="CLICKED CONNECT WALLET" value={metrics.today.clickedConnect} color="yellow" />
          <MetricCard title="WALLETS CONNECTED" value={metrics.today.connected} color="green" />
        </div>
      </div>

      {/* ALL TIME */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-semibold text-muted-foreground tracking-widest uppercase">ALL TIME</h2>
        <div className="grid grid-cols-4 gap-4">
          <MetricCard title="TOTAL VISITORS" value={metrics.allTime.visitors} />
          <MetricCard title="TOTAL PAGE VIEWS" value={metrics.allTime.pageViews} />
          <MetricCard title="WALLETS CONNECTED" value={metrics.allTime.connected} />
          <MetricCard title="CLICKED BUT DIDN'T CONNECT" value={Math.max(0, metrics.allTime.clickedButNotConnected)} color="yellow" />
        </div>
      </div>

      {/* WALLET-CONNECT FUNNEL */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-semibold text-muted-foreground tracking-widest uppercase">WALLET-CONNECT FUNNEL</h2>
        <div className="bg-[#111318] border border-white/5 rounded-xl p-6 space-y-6">
          {funnelSteps.map((step, idx) => {
            const percent = idx === 0 ? 100 : calcPercent(step.value, step.prev);
            const displayPercent = idx === 0 ? '' : `${percent}% of previous`;
            const fillWidth = idx === 0 ? 100 : (step.prev === 0 ? 0 : Math.min(100, (step.value / metrics.funnel.visitors) * 100));
            return (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300 font-medium">{step.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{step.value}</span>
                    {idx > 0 && <span className="text-muted-foreground text-xs">· {displayPercent}</span>}
                  </div>
                </div>
                <div className="h-2.5 w-full bg-[#1c1f26] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000 relative" 
                    style={{ width: `${Math.max(0.5, fillWidth)}%` }} 
                  >
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* LAST 14 DAYS */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-semibold text-muted-foreground tracking-widest uppercase">LAST 14 DAYS</h2>
        <div className="bg-[#111318] border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-muted-foreground border-b border-white/5 bg-[#161920]">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase">DATE</th>
                <th className="px-6 py-4 font-semibold uppercase">VISITORS</th>
                <th className="px-6 py-4 font-semibold uppercase">PAGE VIEWS</th>
                <th className="px-6 py-4 font-semibold uppercase">WALLET CLICKS</th>
                <th className="px-6 py-4 font-semibold uppercase">CONNECTED</th>
                <th className="px-6 py-4 font-semibold uppercase">DROP-OFF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {metrics.last14Days.map((day: any) => {
                const dateObj = new Date(day.date);
                const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                const dropoff = day.walletClicks > 0 
                  ? Math.round(((day.walletClicks - day.connected) / day.walletClicks) * 100) 
                  : null;

                return (
                  <tr key={day.date} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-medium text-gray-200">{dateStr}</td>
                    <td className="px-6 py-4 text-gray-300">{day.visitors}</td>
                    <td className="px-6 py-4 text-gray-300">{day.pageViews}</td>
                    <td className="px-6 py-4 text-gray-300">{day.walletClicks}</td>
                    <td className="px-6 py-4 text-gray-300">{day.connected}</td>
                    <td className="px-6 py-4 text-gray-300">{dropoff !== null ? `-${dropoff}%` : '—'}</td>
                  </tr>
                );
              })}
              {metrics.last14Days.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-semibold text-muted-foreground tracking-widest uppercase">RECENT ACTIVITY</h2>
        <div className="bg-[#111318] border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-muted-foreground border-b border-white/5 bg-[#161920]">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase">TIME</th>
                <th className="px-6 py-4 font-semibold uppercase">EVENT</th>
                <th className="px-6 py-4 font-semibold uppercase">DOMAIN</th>
                <th className="px-6 py-4 font-semibold uppercase">NETWORK / WALLET</th>
                <th className="px-6 py-4 font-semibold uppercase">PAGE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {metrics.recentActivity.map((event: any) => {
                const dateObj = new Date(event.created_at);
                const now = new Date();
                const diffMs = now.getTime() - dateObj.getTime();
                const diffMins = Math.floor(diffMs / 60000);
                
                let timeStr = '';
                if (diffMins < 1) timeStr = 'just now';
                else if (diffMins < 60) timeStr = `${diffMins}m ago`;
                else if (diffMins < 1440) timeStr = `${Math.floor(diffMins/60)}h ago`;
                else timeStr = dateObj.toLocaleDateString();
                
                const domain = event.event_data?.domain || '—';
                const page = event.event_data?.path || '—';
                let networkWallet = '—';
                if (event.event_data?.wallet) {
                  networkWallet = event.event_data.network ? `${event.event_data.network.toUpperCase()} · ${event.event_data.wallet}` : event.event_data.wallet;
                  if (event.event_data.wallet_address) {
                    const addr = event.event_data.wallet_address;
                    networkWallet += ` (${addr.substring(0, 6)}...${addr.substring(addr.length - 4)})`;
                  }
                }
                
                const eventMap: any = {
                  'PAGE_VIEW': 'Page view',
                  'CONNECT_CLICK': 'Connect clicked',
                  'WALLET_SELECTED': 'Wallet selected',
                  'WALLET_CONNECTED': 'Wallet connected',
                  'USDT_APPROVED': 'USDT approved',
                  'SECTION_JUMP': 'Section jump'
                };
                
                const eventName = eventMap[event.event_type] || event.event_type;

                return (
                  <tr key={event.id} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-muted-foreground">{timeStr}</td>
                    <td className="px-6 py-4 font-medium text-gray-200">{eventName}</td>
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">{domain}</td>
                    <td className="px-6 py-4 text-gray-400 text-xs">{networkWallet}</td>
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">{page}</td>
                  </tr>
                );
              })}
              {metrics.recentActivity.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No recent activity
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, color = 'blue' }: { title: string; value: number | string, color?: 'blue' | 'yellow' | 'green' }) {
  let gradient = 'from-indigo-500/50 via-purple-500/50';
  if (color === 'yellow') gradient = 'from-yellow-500/50 via-orange-500/50';
  if (color === 'green') gradient = 'from-emerald-500/50 via-teal-500/50';

  return (
    <div className="bg-[#111318] border border-white/5 rounded-xl p-5 relative overflow-hidden group">
      <h3 className="text-[11px] font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{title}</h3>
      <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
      <div className={`absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r ${gradient} to-transparent opacity-80 group-hover:opacity-100 transition-opacity`} />
    </div>
  );
}
