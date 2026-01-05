# TheSportsDB Integration

Integration of TheSportsDB API to display team logos and league banners in the sports betting frontend.

## API Configuration

- **API Key**: `123`
- **Base URL**: `https://www.thesportsdb.com/api/v1/json/123/`

## Files Created

### Lib Utilities

| File | Purpose |
|------|---------|
| `lib/theSportsDbApi.ts` | API service with rate limiting (1 req/sec) |
| `lib/imageCache.ts` | localStorage cache with 30-day TTL |
| `lib/teamNameNormalizer.ts` | Team name normalization and fuzzy matching |

### Components

| Component | Usage |
|-----------|-------|
| `TeamLogo` | Display team badge/logo with fallback to initials |
| `LeagueBanner` | League banner background with gradient fallback |
| `LeagueBadge` | Inline league badge image |

## Component Usage

### TeamLogo

```tsx
import { TeamLogo } from '@/components/sports/TeamLogo';

// Sizes: "sm" (24px), "md" (32px), "lg" (48px)
<TeamLogo teamName="Arsenal" size="lg" />
```

### LeagueBanner

```tsx
import { LeagueBanner } from '@/components/sports/LeagueBanner';

<LeagueBanner 
  leagueName="Premier League" 
  sportKey="soccer_epl"
  height="md"  // sm | md | lg | full
  overlay={true}
>
  {/* Content here */}
</LeagueBanner>
```

### Prefetching

```tsx
import { usePrefetchTeamLogos } from '@/components/sports/TeamLogo';

// Prefetch logos for visible events
const teamNames = events.flatMap(e => [e.home_team, e.away_team]);
usePrefetchTeamLogos(teamNames);
```

## Caching Strategy

- **Storage**: localStorage
- **TTL**: 30 days
- **Key format**: `sportsdb_img_team_{normalized_name}`
- **Auto-cleanup**: Expired entries removed on access

## Rate Limiting

- Max 1 request per second
- Requests queued automatically
- On 429 response: console warning, uses cached data

## Fallback Behavior

1. **TeamLogo**: Cache → API → Team initials placeholder
2. **LeagueBanner**: Cache → API → Gradient background

## Updated Components

- `MainEventCard.tsx` - Uses TeamLogo + LeagueBanner
- `CompactEventCard.tsx` - Uses TeamLogo
- `EventRow.tsx` - Uses TeamLogo
- `MainEventsStrip.tsx` - Prefetches logos
- `app/sports/event/[eventId]/page.tsx` - Uses TeamLogo + LeagueBanner

## Team Name Aliases

Common abbreviations are auto-expanded:
- "Man U" → "Manchester United"
- "LA Lakers" → "Los Angeles Lakers"
- "CSK" → "Chennai Super Kings"
- See `lib/teamNameNormalizer.ts` for full list
