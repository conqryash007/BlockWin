---
description: how to settle sports bets
---

# Sports Bet Settlement Workflow

This workflow documents how to settle sports bets on the BlockWin platform.

## API Endpoints

### 1. Single Bet Settlement
**Endpoint:** `POST /api/sports/settle-bet`

**Headers:**
```
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "betId": "uuid-of-bet",
  "outcome": "won" | "lost" | "void"
}
```

**Outcomes:**
- `won`: Credits user's balance with `potential_payout`
- `lost`: No balance change (stake was already deducted on bet placement)
- `void`: Refunds the original `stake` to user

**Response:**
```json
{
  "success": true,
  "betId": "...",
  "outcome": "won",
  "payoutAmount": 150.00,
  "newBalance": 1150.00,
  "message": "Bet settled successfully as won"
}
```

---

### 2. Get Pending Bets
**Endpoint:** `GET /api/sports/settle-bet`

**Query Parameters:**
- `status`: Filter by status (default: "pending")
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "bets": [...],
  "total": 25,
  "limit": 50,
  "offset": 0
}
```

---

### 3. Batch Settlement
**Endpoint:** `POST /api/sports/settle-bets`

Settle multiple bets in one request.

**Request Body:**
```json
{
  "settlements": [
    { "betId": "uuid-1", "outcome": "won" },
    { "betId": "uuid-2", "outcome": "lost" },
    { "betId": "uuid-3", "outcome": "void" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settled 3 of 3 bets",
  "summary": {
    "total": 3,
    "success": 3,
    "failed": 0
  },
  "results": [...]
}
```

---

### 4. Auto-Settlement
**Endpoint:** `POST /api/sports/auto-settle`

Automatically settles H2H bets by fetching completed event scores from The Odds API.

**Request Body (optional):**
```json
{
  "sportKey": "soccer_epl",  // Optional: only settle specific sport
  "dryRun": true             // Preview without applying changes
}
```

**How it works:**
1. Fetches all pending H2H bets
2. Fetches completed event scores from The Odds API
3. Matches betted selections with actual winners
4. Settles bets accordingly

**For Cron Jobs:**
Add header `x-cron-secret: <CRON_SECRET>` to bypass admin auth.

---

## Settlement Flow

```
1. Event completes
       ↓
2. Admin views pending bets (GET /api/sports/settle-bet)
       ↓
3. Admin settles each bet:
   - Manual: POST /api/sports/settle-bet
   - Batch: POST /api/sports/settle-bets
   - Auto: POST /api/sports/auto-settle
       ↓
4. System processes:
   - Won: Credit potential_payout to user balance
   - Lost: No balance change
   - Void: Refund original stake
       ↓
5. Creates transaction record
       ↓
6. Logs to audit_logs table
       ↓
7. Updates bet status + settled_at timestamp
```

---

## Database Impact

**sports_bets table:**
- `status`: 'pending' → 'won' | 'lost' | 'void'
- `settled_at`: Set to current timestamp

**balances table:**
- Updated for 'won' and 'void' outcomes

**transactions table:**
- New record created with type 'sports_win' or 'sports_refund'

**audit_logs table:**
- Admin action logged for auditability

---

## Example cURL Commands

```bash
# Fetch pending bets
curl -X GET "http://localhost:3000/api/sports/settle-bet?status=pending" \
  -H "Authorization: Bearer <token>"

# Settle single bet as won
curl -X POST "http://localhost:3000/api/sports/settle-bet" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"betId": "abc123", "outcome": "won"}'

# Batch settle
curl -X POST "http://localhost:3000/api/sports/settle-bets" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"settlements": [{"betId": "abc", "outcome": "won"}, {"betId": "def", "outcome": "lost"}]}'

# Auto-settle with dry run
curl -X POST "http://localhost:3000/api/sports/auto-settle" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'
```
