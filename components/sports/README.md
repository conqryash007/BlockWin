# Sports Betting UI Features

Frontend-only sports betting UI components for the casino website, using The Odds API v4 for odds data.

## Quick Start

```bash
npm run dev
# Navigate to http://localhost:3000/sports
```

## Features

### 1. Main Events - Highlighted Cards

**Components:**
- `MainEventCard` - Featured large card (~260px) for desktop hero display
- `CompactEventCard` - Compact card (~96px) for horizontal strips
- `MainEventsStrip` - Horizontally scrollable row with featured events

**Usage:**
```tsx
import { MainEventsStrip } from "@/components/sports";

// In your page
<MainEventsStrip showFeaturedCard={true} />
```

**Props:**
- `showFeaturedCard`: boolean - Show large hero card on desktop (default: true)

---

### 2. Sports Event List Page

**Pages:**
- `/sports` - Main sports hub with all events
- `/sports/[sport]` - Sport-specific event list (e.g., `/sports/soccer_epl`)

**Components:**
- `EventFilters` - Live/Upcoming toggle, market type, odds format switch
- `EventRow` - Individual event with odds buttons
- `LeagueSection` - Collapsible section grouping events by league

**Filter Props:**
```tsx
interface EventFilters {
  status: 'all' | 'live' | 'upcoming';
  market: 'h2h' | 'totals' | 'spreads';
  oddsFormat: 'decimal' | 'american';
}
```

---

### 3. Event Detail + Betting Screen

**Page:** `/sports/event/[eventId]`

**Components:**
- `MatchInfo` - Team displays with logos, scores, match status
- `MarketsTabs` - Tabbed markets (H2H, Totals, Spreads)
- `MarketRow` - Individual outcome with odds and selection state
- `SportsBetSlip` - Enhanced bet slip with stake inputs and calculations

**Layout:**
- Desktop: 3-column (Match Info | Markets | Bet Slip)
- Mobile: Stacked with sticky bottom bet slip trigger

---

### 4. How to Play Section

**Component:** `SportsEducation`

Accordion-based educational content styled like PlinkoEducation:
- What is a Bet?
- Step-by-Step Guide with calculations
- Live Betting Notes
- Important Notes + 18+ disclaimer

---

## Data Layer

### Types (`types/sports.ts`)
- `Sport`, `SportEvent`, `Bookmaker`, `Market`, `Outcome`
- `SportsBetItem` - Extended bet item with event context
- `EventFilters` - Filter state

### Utilities (`lib/oddsUtils.ts`)
- `decimalToAmerican()` / `americanToDecimal()` - Odds conversion
- `calculateImpliedProbability()` - Returns probability %
- `calculateParlayOdds()` - Combined odds for parlay
- `formatOdds()` - Display formatting
- `formatEventTime()` - Human-readable time
- `isEventLive()` - Check if event is live

### API Service (`lib/sportsApi.ts`)
- `fetchSports()` - GET /v4/sports
- `fetchEvents(sport)` - GET /v4/sports/{sport}/events
- `fetchOdds(sport, options)` - GET /v4/sports/{sport}/odds
- `fetchScores(sport)` - GET /v4/sports/{sport}/scores
- Rate limiting with exponential backoff

### Hooks (`hooks/useSportsData.ts`)
- `useSports()` - List of sports
- `useEvents(sportKey)` - Events with 30s polling
- `useFeaturedEvents()` - Featured events for strips
- `useScores(sportKey)` - Live scores with polling
- `useOddsFormat()` - Decimal/American toggle (persisted)
- `useMockMode()` - Toggle mock/live API

---

## Mock Data

All components work with mock data by default. Located in `lib/mockSportsData.ts`:
- 8 sports (Soccer, Basketball, Cricket, Tennis, MMA, Baseball)
- 10+ events with realistic odds
- Featured events for hero displays
- Live events with scores

---

## Switching to Live API

1. The API key is in `lib/sportsApi.ts` (move to `.env.local` for production)
2. Update hook calls to pass `useMock: false`:

```tsx
const { events } = useEvents('soccer_epl', false); // Use live API
```

3. Ensure CORS is handled (API supports direct browser calls)

---

## localStorage Persistence

- Bet slip items and stakes
- Odds format preference (decimal/american)
- Education accordion open/closed state

---

## File Structure

```
components/sports/
├── index.ts              # Barrel exports
├── MainEventCard.tsx     # Featured large card
├── CompactEventCard.tsx  # Compact horizontal card
├── MainEventsStrip.tsx   # Horizontal scrollable strip
├── EventFilters.tsx      # Status/market/format filters
├── EventRow.tsx          # Event in list with odds
├── LeagueSection.tsx     # Collapsible league group
├── MatchInfo.tsx         # Event detail header
├── MarketRow.tsx         # Individual market outcome
├── MarketsTabs.tsx       # H2H/Totals/Spreads tabs
├── SportsBetSlip.tsx     # Enhanced bet slip
└── SportsEducation.tsx   # How to play section

app/sports/
├── page.tsx              # Main sports hub
├── [sport]/page.tsx      # Sport-specific events
└── event/[eventId]/page.tsx  # Event detail

lib/
├── mockSportsData.ts     # Mock data fixtures
├── oddsUtils.ts          # Odds calculations
└── sportsApi.ts          # The Odds API service

hooks/
├── useBetslip.tsx        # Bet slip state (enhanced)
└── useSportsData.ts      # Sports data hooks

types/
└── sports.ts             # TypeScript interfaces
```

---

## Important Notes

- All betting is UI-only (no backend settlement)
- Odds are from The Odds API or mock data
- Mobile-responsive with sticky bet slip
- Follows existing casino design tokens
