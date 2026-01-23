import {
  HeroSection,
  QuickActionsColumn,
  FeaturedGamesCarousel,
  ShortcutsGrid,
  InsightsCards,
  DashboardFooter,
  GamingLotterySection,
  LivePlayerActivityFeed,
} from "@/components/dashboard";
import { Toaster } from "sonner";
import dashboardData from "@/mocks/dashboard.json";
import type { DashboardData } from "@/types/dashboard";

// Type assertion for mock data
const data = dashboardData as DashboardData;

export default function Home() {
  return (
    <>
      <div className="space-y-8 pb-20 lg:pb-8">
        {/* Row 1: Hero + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hero Section - 2/3 width on desktop */}
          <div className="lg:col-span-2">
            <HeroSection slides={data.heroSlides} featuredGames={data.featuredGames} />
          </div>
          
          {/* Quick Actions Column - 1/3 width on desktop */}
          <div className="hidden lg:block">
            <QuickActionsColumn />
          </div>
        </div>

        {/* Row 2: Featured Games Carousel */}
        <FeaturedGamesCarousel games={data.featuredGames} />

        {/* Row 3: Gaming & Lottery Section - New Quick Links */}
        <GamingLotterySection />

        {/* Row 4: Live Player Activity Feed */}
        <LivePlayerActivityFeed filter="all" title="Live Players" maxItems={6} />

        {/* Row 5: Shortcuts Grid */}
        <ShortcutsGrid ctas={data.quickCtas} />

        {/* Row 5: Insights Cards */}
        <InsightsCards 
          insights={data.insights} 
          trendingLeagues={data.trendingLeagues} 
        />

        {/* Mobile Quick Actions - visible only on mobile */}
        <div className="lg:hidden">
          <QuickActionsColumn />
        </div>

        {/* Footer */}
        <DashboardFooter />
      </div>

      {/* Toast notifications */}
      <Toaster 
        position="top-right" 
        richColors 
        theme="dark"
        toastOptions={{
          style: {
            background: '#0d0f14',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      />
    </>
  );
}

